const database = require('../db');
const academica = require('../services/integracionAcademica');
const { notasValidas, PONDERACION } = require('../services/notas');
const { crearDocumento } = require('../services/reportePdf');

function validarId(req, res) {
  const valor = req.params.propuesta_id;
  if (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor))) {
    res.status(400).json({ error: 'El identificador de la memoria debe ser un entero positivo.' });
    return false;
  }
  return true;
}

function errorHttp(res, error) {
  if (error.status && error.status < 500) return res.status(error.status).json({ error: error.message });
  console.error('HU-09:', error);
  return res.status(error.status === 502 ? 502 : 500).json({ error: error.status === 502 ? error.message : 'No se pudo procesar el reporte.' });
}

function soloSecretaria(req, res, next) {
  if (req.get('X-Demo-Role') !== 'secretaria') {
    return res.status(403).json({ error: 'Solo Secretaría puede registrar notas y emitir reportes.' });
  }
  return next();
}

function respuesta(row, id) {
  const notaFinal = row?.nota_final ?? null;
  return {
    propuesta_id: Number(id), nota_escrita: row?.nota_escrita ?? null,
    nota_oral: row?.nota_oral ?? null, nota_final: notaFinal,
    nota_aprobada: notaFinal !== null && Number(notaFinal) >= 70,
    reporte_generado: row?.reporte_generado ?? false,
    pdf_conservado: Boolean(row?.pdf_snapshot), fecha_reporte: row?.fecha_reporte ?? null,
    ponderacion: PONDERACION
  };
}

async function consultarReporte(req, res) {
  if (!validarId(req, res)) return;
  try {
    const id = req.params.propuesta_id;
    await academica.propuesta(id);
    const result = await database.query('SELECT * FROM reportes_memoria WHERE propuesta_id = $1', [id]);
    return res.status(200).json(respuesta(result.rows[0], id));
  } catch (error) { return errorHttp(res, error); }
}

async function guardarNotas(req, res) {
  if (!validarId(req, res)) return;
  const { nota_escrita, nota_oral } = req.body || {};
  if (!notasValidas(nota_escrita, nota_oral)) {
    return res.status(400).json({ error: 'Las notas deben ser enteros entre 0 y 100.' });
  }
  try {
    const id = req.params.propuesta_id;
    const propuesta = await academica.propuesta(id);
    if (propuesta.estado !== 'Habilitado para Defensa') {
      return res.status(409).json({ error: 'La memoria no está habilitada para defensa.' });
    }
    const result = await database.query(`
      INSERT INTO reportes_memoria (propuesta_id, nota_escrita, nota_oral)
      VALUES ($1, $2, $3)
      ON CONFLICT (propuesta_id) DO UPDATE
        SET nota_escrita = EXCLUDED.nota_escrita, nota_oral = EXCLUDED.nota_oral,
            reporte_generado = FALSE, fecha_reporte = NULL, pdf_snapshot = NULL,
            actualizado_en = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, nota_escrita, nota_oral]);
    const salida = respuesta(result.rows[0], id);
    return res.status(200).json({
      ...salida,
      advertencia: salida.nota_aprobada
        ? null
        : 'La nota final es menor a 70. Jefatura no podrá cerrar el proceso.',
    });
  } catch (error) { return errorHttp(res, error); }
}

async function validarCierre(req, res) {
  if (req.get('X-Demo-Role') !== 'jefe-carrera') {
    return res.status(403).json({ error: 'Solo Jefatura puede validar el cierre.' });
  }
  if (!validarId(req, res)) return;
  try {
    const id = req.params.propuesta_id;
    const propuesta = await academica.propuesta(id);
    if (propuesta.estado !== 'Habilitado para Defensa') {
      return res.status(409).json({ error: 'La memoria debe estar habilitada para defensa.' });
    }
    await database.query(`
      ALTER TABLE validaciones
      ADD COLUMN IF NOT EXISTS rol VARCHAR(50)
    `);

    const vistosBuenos = await database.query(`
      SELECT
        COALESCE(BOOL_OR(rol IN ('co-guia', 'profesor-guia')), FALSE) AS co_guia,
        COALESCE(BOOL_OR(rol = 'jefe-carrera'), FALSE) AS jefe_carrera
      FROM validaciones
      WHERE propuesta_id = $1
        AND resultado = 'VISTO_BUENO_EXAMEN'
    `, [id]);

    const vistos = vistosBuenos.rows[0] || {};
    if (!vistos.co_guia || !vistos.jefe_carrera) {
      const faltantes = [];
      if (!vistos.co_guia) faltantes.push('co-guía');
      if (!vistos.jefe_carrera) faltantes.push('Jefatura de Carrera');

      return res.status(409).json({
        error: `No se puede cerrar la memoria. Falta visto bueno de: ${faltantes.join(' y ')}.`,
      });
    }

    const result = await database.query(
      'SELECT * FROM reportes_memoria WHERE propuesta_id = $1',
      [id],
    );
    const reporte = result.rows[0];
    if (!reporte?.reporte_generado) {
      return res.status(409).json({ error: 'Secretaría debe generar el reporte antes del cierre.' });
    }
    if (reporte.nota_final === null || Number(reporte.nota_final) < 70) {
      return res.status(409).json({ error: 'La nota final de defensa es menor a 70. No se puede cerrar el proceso.' });
    }
    const actualizada = await academica.actualizarEstado(id, 'Cerrado');
    return res.status(200).json({
      propuesta: actualizada,
      estado: 'Cerrado',
      nota_final: reporte.nota_final,
      mensaje: 'Cierre validado correctamente.',
    });
  } catch (error) {
    return errorHttp(res, error);
  }
}

async function generarReporte(req, res) {
  if (!validarId(req, res)) return;
  try {
    const id = req.params.propuesta_id;
    const propuesta = await academica.propuesta(id);
    if (propuesta.estado !== 'Habilitado para Defensa') {
      return res.status(409).json({ error: 'La memoria no está habilitada para defensa.' });
    }
    const result = await database.query('SELECT * FROM reportes_memoria WHERE propuesta_id = $1', [id]);
    const row = result.rows[0];
    if (!row || row.nota_escrita === null || row.nota_oral === null) {
      return res.status(409).json({ error: 'Primero debes guardar las dos calificaciones.' });
    }
    const historial = await academica.historial(id);
    const pdf = await crearDocumento(propuesta, row, historial);
    const guardado = await database.query(`
      UPDATE reportes_memoria
      SET pdf_snapshot = $2, reporte_generado = TRUE, fecha_reporte = CURRENT_TIMESTAMP,
          actualizado_en = CURRENT_TIMESTAMP
      WHERE propuesta_id = $1 AND nota_escrita = $3 AND nota_oral = $4
      RETURNING *
    `, [id, pdf, row.nota_escrita, row.nota_oral]);
    if (guardado.rowCount === 0) {
      return res.status(409).json({ error: 'Las notas cambiaron mientras se generaba el reporte. Intenta nuevamente.' });
    }
    return res.status(200).json(respuesta(guardado.rows[0], id));
  } catch (error) { return errorHttp(res, error); }
}

async function descargarReporte(req, res) {
  if (!validarId(req, res)) return;
  try {
    const id = req.params.propuesta_id;
    await academica.propuesta(id);
    const result = await database.query('SELECT pdf_snapshot FROM reportes_memoria WHERE propuesta_id = $1', [id]);
    const pdf = result.rows[0]?.pdf_snapshot;
    if (!pdf) return res.status(404).json({ error: 'Aún no se ha generado un reporte para esta memoria.' });
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="reporte-memoria-${id}.pdf"`);
    return res.status(200).send(pdf);
  } catch (error) { return errorHttp(res, error); }
}

async function otorgarVistoBueno(req, res) {
  const rol = req.get('X-Demo-Role');
  if (!['co-guia', 'jefe-carrera'].includes(rol)) {
    return res.status(403).json({ error: 'Solo el co-guia o Jefe de Carrera pueden otorgar el visto bueno.' });
  }
  if (!validarId(req, res)) return;
  try {
    const id = req.params.propuesta_id;
    const { evaluaciones, entregables } = await academica.historial(id);
    const propuesta = await academica.propuesta(id);
    const evaluacionPropuesta = evaluaciones.at(-1);

    const ultimaEvaluacionEtapa = (etapa) => {
      const evaluacionesEtapa = entregables
        .filter((item) => item.etapa?.trim().toLowerCase() === etapa.trim().toLowerCase())
        .flatMap((item) => (item.evaluaciones || []).map((evaluacion) => ({
          ...evaluacion,
          fecha_entrega: item.fecha_subida,
        })))
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_evaluacion || a.fecha_entrega || 0).getTime();
          const fechaB = new Date(b.fecha_evaluacion || b.fecha_entrega || 0).getTime();
          return fechaB - fechaA;
        });

      return evaluacionesEtapa[0] || null;
    };

    const avance1 = ultimaEvaluacionEtapa('Avance 1');
    const avance2 = ultimaEvaluacionEtapa('Avance 2');
    const trabajoFinal = ultimaEvaluacionEtapa('Trabajo escrito final');

    const avance1Aprobado = Boolean(avance1 && Number(avance1.nota) >= 70);
    const avance2Aprobado = Boolean(avance2 && Number(avance2.nota) >= 70);
    const trabajoFinalAprobado = Boolean(trabajoFinal && Number(trabajoFinal.nota) >= 70);
    if (!['Aprobada por Guía', 'Autorizada'].includes(propuesta.estado)) {
      return res.status(409).json({ error: 'La propuesta debe estar aprobada y autorizada antes de habilitar el examen.' });
    }
    if (!evaluacionPropuesta || Number(evaluacionPropuesta.nota) < 70) {
      return res.status(409).json({ error: 'La evaluación de la propuesta aún no está aprobada.' });
    }
    if (!avance1Aprobado) {
      return res.status(409).json({ error: 'El Avance 1 debe estar aprobado antes de continuar.' });
    }
    if (!avance2Aprobado) {
      return res.status(409).json({ error: 'El Avance 2 debe estar aprobado antes de solicitar el visto bueno.' });
    }
    if (!trabajoFinalAprobado) {
      return res.status(409).json({ error: 'El trabajo escrito final debe estar evaluado y aprobado antes del visto bueno.' });
    }

    await database.query(`
      ALTER TABLE validaciones
      ADD COLUMN IF NOT EXISTS rol VARCHAR(50)
    `);

    if (rol === 'jefe-carrera') {
      const vistoBuenoCoGuia = await database.query(`
        SELECT id FROM validaciones
        WHERE propuesta_id = $1 AND resultado = 'VISTO_BUENO_EXAMEN' AND rol = 'co-guia'
        ORDER BY fecha_validacion DESC, id DESC
        LIMIT 1
      `, [id]);
      if (!vistoBuenoCoGuia.rowCount) {
        return res.status(409).json({ error: 'Primero debe registrar su visto bueno el co-guía después de aprobar el Avance 2.' });
      }
    }

    await database.query(`
      INSERT INTO validaciones (propuesta_id, resultado, observaciones, rol)
      VALUES ($1, 'VISTO_BUENO_EXAMEN', $2, $3)
    `, [id, `Visto bueno para examen registrado por ${rol}.`, rol]);

    if (rol !== 'jefe-carrera') {
      return res.status(200).json({
        propuesta,
        estado: propuesta.estado,
        visto_bueno_co_guia: true,
        mensaje: 'Visto bueno del co-guía registrado. Ahora Jefatura puede habilitar el examen final.',
      });
    }

    const actualizada = await academica.actualizarEstado(id, 'Habilitado para Defensa');
    return res.status(200).json({
      propuesta: actualizada,
      estado: 'Habilitado para Defensa',
      mensaje: 'Visto bueno del co-guía y Jefatura registrados. La memoria quedó habilitada para solicitar el examen final.',
    });
  } catch (error) {
    return errorHttp(res, error);
  }
}

async function consultarVistosBuenos(req, res) {
  if (!validarId(req, res)) return;
  try {
    await database.query('ALTER TABLE validaciones ADD COLUMN IF NOT EXISTS rol VARCHAR(50)');
    const result = await database.query(`
      SELECT rol, fecha_validacion
      FROM validaciones
      WHERE propuesta_id = $1 AND resultado = 'VISTO_BUENO_EXAMEN'
      ORDER BY fecha_validacion ASC, id ASC
    `, [req.params.propuesta_id]);
    return res.status(200).json({
      co_guia: result.rows.some((row) => row.rol === 'co-guia'),
      jefe_carrera: result.rows.some((row) => row.rol === 'jefe-carrera'),
    });
  } catch (error) {
    return errorHttp(res, error);
  }
}

module.exports = {
  soloSecretaria,
  consultarReporte,
  guardarNotas,
  generarReporte,
  descargarReporte,
  otorgarVistoBueno,
  consultarVistosBuenos,
  validarCierre,
};
