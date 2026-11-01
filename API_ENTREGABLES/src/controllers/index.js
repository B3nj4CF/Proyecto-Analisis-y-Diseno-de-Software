const multer = require('multer');
const fs = require('fs');
const path = require('path');
const modelo = require('../models/entregable');

const uploadDirectory = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(uploadDirectory, { recursive: true }, (error) => {
      cb(error, uploadDirectory);
    });
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'archivo'));
    }
    cb(null, true);
  }
});

// --- ENTREGABLES (HU-04) ---
const subirEntregable = async (req, res) => {
  try {
    const { propuesta_id, etapa } = req.body;
    const archivo = req.file;

    if (!propuesta_id || !etapa || !archivo) {
      return res.status(400).json({ error: "Faltan datos obligatorios o el archivo PDF" });
    }

    const nuevoEntregable = await modelo.subirEntregable({
      propuesta_id,
      etapa,
      nombre_archivo: archivo.originalname,
      ruta_archivo: archivo.path
    });

    res.status(201).json(nuevoEntregable);
  } catch (error) {
    console.error("Error al subir entregable:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerEntregables = async (req, res) => {
  try {
    const { propuesta_id } = req.params;
    const entregables = await modelo.obtenerEntregablesPorPropuesta(propuesta_id);
    res.status(200).json(entregables);
  } catch (error) {
    console.error("Error al obtener entregables:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// --- COMENTARIOS (HU-05 / HU-06) ---
const agregarComentario = async (req, res) => {
  try {
    const { autor_nombre, contenido, rol } = req.body;
    const { entregable_id } = req.params;

    if (!autor_nombre || autor_nombre.length < 2 || !contenido || contenido.length < 5) {
      return res.status(400).json({ error: "Datos de comentario inválidos" });
    }

    const nuevoComentario = await modelo.agregarComentario({ entregable_id, autor_nombre, rol, contenido });
    res.status(201).json(nuevoComentario);
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerComentarios = async (req, res) => {
  try {
    const { entregable_id } = req.params;
    const comentarios = await modelo.obtenerComentarios(entregable_id);
    res.status(200).json(comentarios);
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// --- EVALUACIONES ---
const evaluarEntregable = async (req, res) => {
  try {
    const { evaluador_nombre, nota, comentarios, confirmacion_reprobacion } = req.body;
    const { entregable_id } = req.params;

    if (!evaluador_nombre || evaluador_nombre.length < 2 || nota < 0 || nota > 100 || !comentarios || comentarios.length < 5) {
      return res.status(400).json({ error: "Datos de evaluación inválidos" });
    }

    const evaluacion = await modelo.evaluarEntregable({ entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion });
    res.status(201).json(evaluacion);
  } catch (error) {
    console.error("Error al evaluar entregable:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  subirEntregable,
  obtenerEntregables,
  agregarComentario,
  obtenerComentarios,
  evaluarEntregable,
  uploadMiddleware: upload.single('archivo'),
  handleUploadError: (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo no puede superar los 10 MB'
        : 'El archivo debe ser un PDF enviado en el campo archivo';
      return res.status(400).json({ error: message });
    }
    if (error) {
      console.error('Error al guardar el archivo:', error);
      return res.status(500).json({ error: 'No se pudo guardar el archivo' });
    }
    next();
  }
};