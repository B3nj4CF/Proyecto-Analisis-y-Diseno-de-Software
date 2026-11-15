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
  return {
    propuesta_id: Number(id), nota_escrita: row?.nota_escrita ?? null,
    nota_oral: row?.nota_oral ?? null, nota_final: row?.nota_final ?? null,
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
    return res.status(200).json(respuesta(result.rows[0], id));
  } catch (error) { return errorHttp(res, error); }
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

module.exports = { soloSecretaria, consultarReporte, guardarNotas, generarReporte, descargarReporte };
