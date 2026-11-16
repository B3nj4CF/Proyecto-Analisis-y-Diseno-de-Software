const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const pool = db.pool || db;
const TRAMITACION_API_URL = process.env.TRAMITACION_API_URL || 'http://api_tramitacion:3002';

const router = express.Router();
const hu09Historial = require('../controllers/hu09HistorialController');

// Asegurar que exista la carpeta uploads dentro del contenedor
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento con Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10 MB según ficha S-03
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos en formato PDF'));
    }
  }
});

// ============================================================================
// SERVICIO S-03: Subir documento de avance PDF (HU-04)
// ============================================================================
router.post('/entregables/upload', (req, res, next) => {
  upload.single('archivo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'Error al procesar el archivo.'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { propuesta_id, etapa } = req.body;
    const file = req.file;

    // Validación de entrada (Ficha S-03)
    if (!propuesta_id || !etapa || !file) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios o el archivo no es un PDF válido.'
      });
    }

    const etapaNormalizada = etapa.trim().toLowerCase();
    const etapas = {
      'avance 1': 'Avance 1',
      'avance 2': 'Avance 2',
      'trabajo escrito final': 'Trabajo escrito final',
    };
    if (!etapas[etapaNormalizada]) {
      return res.status(400).json({ error: 'La etapa indicada no es válida.' });
    }
    const propuestaResponse = await fetch(`${TRAMITACION_API_URL}/api/propuestas/${propuesta_id}`);
    if (!propuestaResponse.ok) {
      return res.status(404).json({ error: 'No se pudo verificar la propuesta.' });
    }
    const propuesta = await propuestaResponse.json();
    if (etapaNormalizada !== 'avance 2' && propuesta.estado !== 'Autorizada') {
      return res.status(409).json({ error: `La propuesta está "${propuesta.estado}". Debe quedar "Autorizada" por Jefatura antes de subir esta etapa.` });
    }
    if (etapaNormalizada !== 'avance 1') {
      const etapaPrevia = etapaNormalizada === 'avance 2' ? 'Avance 1' : 'Avance 2';
      const previous = await pool.query(`
        SELECT v.nota
        FROM entregables e
        INNER JOIN evaluaciones_entregables v ON v.entregable_id = e.id
        WHERE e.propuesta_id = $1
          AND LOWER(TRIM(e.etapa)) = LOWER(TRIM($2))
        ORDER BY v.fecha_evaluacion DESC, v.id DESC
        LIMIT 1
      `, [propuesta_id, etapaPrevia]);

      if (!previous.rowCount || Number(previous.rows[0].nota) < 70) {
        return res.status(409).json({ error: `Debes aprobar ${etapaPrevia} antes de continuar.` });
      }
    }

    // Persistencia en base de datos con fecha exacta y estado 'Pendiente de Revisión' (HU-04)
    const query = `
      INSERT INTO entregables (
        propuesta_id,
        etapa,
        ruta_archivo,
        nombre_archivo,
        estado,
        fecha_subida
      )
      VALUES ($1, $2, $3, $4, 'Pendiente de Revisión', NOW())
      RETURNING id, propuesta_id, etapa, nombre_archivo, fecha_subida, estado;
    `;

    const values = [
      propuesta_id,
      etapa,
      file.path,
      file.originalname
    ];

    const { rows } = await pool.query(query, values);

    // Salida según formato exacto de la Ficha S-03
    return res.status(201).json({
      id: rows[0].id,
      propuesta_id: String(rows[0].propuesta_id),
      etapa: rows[0].etapa,
      nombre_archivo: rows[0].nombre_archivo,
      fecha_subida: rows[0].fecha_subida,
      estado: rows[0].estado
    });
  } catch (error) {
    console.error('Error en S-03 al subir entregable:', error);
    return res.status(500).json({
      error: 'Error al guardar el archivo en el volumen Docker.'
    });
  }
});

// ============================================================================
// SERVICIO S-04: Consultar entregables por propuesta (HU-04, HU-07, HU-14)
// ============================================================================
router.get('/entregables/propuesta/:propuesta_id', async (req, res) => {
  try {
    const { propuesta_id } = req.params;

    const query = `
      SELECT id, propuesta_id, etapa, nombre_archivo, fecha_subida, estado
      FROM entregables
      WHERE propuesta_id = $1
      ORDER BY fecha_subida DESC, id DESC;
    `;

    const { rows } = await pool.query(query, [propuesta_id]);

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error en S-04 al consultar entregables:', error);

    return res.status(500).json({
      error: 'Error interno al consultar la base de datos de entregables.'
    });
  }
});

router.post('/entregables/:entregable_id/evaluaciones', async (req, res) => {
  try {
    const { entregable_id } = req.params;
    const { evaluador_nombre, nota, comentarios, confirmacion_reprobacion = false } = req.body;
    const rolEvaluador = req.get('X-Demo-Role');
    const rolesPermitidos = ['profesor-guia', 'co-guia', 'correferente'];

    if (!rolesPermitidos.includes(rolEvaluador)) {
      return res.status(403).json({
        error: 'Solo Profesor Guia, Co-guia/Mentor o Correferente pueden evaluar avances.'
      });
    }

    const numericNota = Number(nota);
    if (!evaluador_nombre || !Number.isInteger(numericNota) || numericNota < 0 || numericNota > 100 || !comentarios || comentarios.trim().length < 5) {
      return res.status(400).json({ error: 'Datos de evaluación inválidos.' });
    }
    if (numericNota < 70 && confirmacion_reprobacion !== true) {
      return res.status(409).json({
        error: 'Debes confirmar explicitamente la reprobacion para registrar una nota menor a 70.'
      });
    }

    const result = await pool.query('SELECT propuesta_id FROM entregables WHERE id = $1', [entregable_id]);
    if (!result.rowCount) return res.status(404).json({ error: 'El entregable no existe.' });
    const evaluation = await pool.query(`
      INSERT INTO evaluaciones_entregables
        (entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [entregable_id, evaluador_nombre, numericNota, comentarios.trim(), Boolean(confirmacion_reprobacion)]);
    await pool.query("UPDATE entregables SET estado = 'Revisado' WHERE id = $1", [entregable_id]);
    return res.status(201).json({ ...evaluation.rows[0], propuesta_id: result.rows[0].propuesta_id });
  } catch (error) {
    console.error('Error al guardar la evaluación del entregable:', error);
    return res.status(500).json({ error: 'No se pudo guardar la evaluación.' });
  }
});

router.get('/entregables/:entregable_id/comentarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, entregable_id, autor_nombre, rol, contenido, fecha_creacion FROM comentarios_entregables WHERE entregable_id = $1 ORDER BY fecha_creacion ASC',
      [req.params.entregable_id],
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al consultar observaciones:', error);
    return res.status(500).json({ error: 'No se pudieron cargar las observaciones.' });
  }
});

router.post('/entregables/:entregable_id/comentarios', async (req, res) => {
  try {
    const { autor_nombre, rol, contenido } = req.body;
    if (!autor_nombre || autor_nombre.trim().length < 2 || !contenido || contenido.trim().length < 5) {
      return res.status(400).json({ error: 'Datos de observación inválidos.' });
    }
    const result = await pool.query(
      `INSERT INTO comentarios_entregables (entregable_id, autor_nombre, rol, contenido)
       VALUES ($1, $2, $3, $4) RETURNING id, entregable_id, autor_nombre, rol, contenido, fecha_creacion`,
      [req.params.entregable_id, autor_nombre.trim(), rol || 'Profesor Guía', contenido.trim()],
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al guardar observación:', error);
    return res.status(500).json({ error: 'No se pudo guardar la observación.' });
  }
});

// HU-09: consultar historial de entregables y evaluaciones de una memoria
router.get(
  '/entregables/propuesta/:propuesta_id/historial',
  hu09Historial.obtenerHistorial
);

module.exports = router;