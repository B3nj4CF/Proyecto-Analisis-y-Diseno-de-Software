const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const pool = db.pool || db;

const router = express.Router();

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
      return res.status(400).json({ error: err.message || 'Error al procesar el archivo.' });
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

    // Persistencia en base de datos con fecha exacta y estado 'Pendiente de Revisión' (HU-04)
    const query = `
      INSERT INTO entregables (propuesta_id, etapa, ruta_archivo, nombre_archivo, estado, fecha_subida)
      VALUES ($1, $2, $3, $4, 'Pendiente de Revisión', NOW())
      RETURNING id, propuesta_id, etapa, nombre_archivo, fecha_subida, estado;
    `;
    const values = [propuesta_id, etapa, file.path, file.originalname];
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
    return res.status(500).json({ error: 'Error al guardar el archivo en el volumen Docker.' });
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
      ORDER BY fecha_subida DESC;
    `;
    const { rows } = await pool.query(query, [propuesta_id]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error en S-04 al consultar entregables:', error);
    return res.status(500).json({ error: 'Error interno al consultar la base de datos de entregables.' });
  }
});

module.exports = router;