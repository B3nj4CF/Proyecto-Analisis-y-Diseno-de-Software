const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');

const getProposalFile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT ruta_archivo, nombre_archivo FROM propuestas WHERE id = $1',
      [req.params.propuesta_id]
    );
    const propuesta = result.rows[0];

    if (!propuesta?.ruta_archivo) {
      return res.status(404).json({ error: 'La propuesta no tiene un archivo asociado' });
    }

    return res.download(propuesta.ruta_archivo, propuesta.nombre_archivo);
  } catch (error) {
    console.error('Error al descargar el PDF de la propuesta:', error);
    return res.status(500).json({ error: 'No se pudo descargar el archivo' });
  }
};

const evaluarPropuesta = async (req, res) => {
  try {
    const { evaluador_nombre, nota, comentarios, confirmacion_reprobacion } = req.body;
    const propuestaId = req.params.propuesta_id;

    if (!evaluador_nombre || !Number.isInteger(Number(nota)) ||
        Number(nota) < 0 || Number(nota) > 100 ||
        !comentarios || comentarios.trim().length < 5) {
      return res.status(400).json({ error: 'Datos de evaluación inválidos' });
    }

    const propuesta = await pool.query(
      'SELECT id, estado FROM propuestas WHERE id = $1',
      [propuestaId]
    );
    if (propuesta.rowCount === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }
    if (propuesta.rows[0].estado === 'Cerrado') {
      return res.status(409).json({
        error: 'La memoria está cerrada y no admite modificaciones.'
      });
    }

    const result = await pool.query(
      `INSERT INTO evaluaciones_propuestas
        (propuesta_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [propuestaId, evaluador_nombre, Number(nota), comentarios, Boolean(confirmacion_reprobacion)]
    );

    const nuevoEstado = Number(nota) >= 70
      ? 'Aprobada por Guía'
      : 'Rechazada por Guía';
    const propuestaActualizada = await pool.query(
      'UPDATE propuestas SET estado = $1 WHERE id = $2 RETURNING estado',
      [nuevoEstado, propuestaId]
    );

    return res.status(201).json({
      ...result.rows[0],
      estado_propuesta: propuestaActualizada.rows[0].estado,
    });
  } catch (error) {
    console.error('Error al evaluar propuesta:', error);
    return res.status(500).json({ error: 'No se pudo guardar la evaluación' });
  }
};

const obtenerPropuesta = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM propuestas WHERE id = $1',
      [req.params.propuesta_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener la propuesta:', error);
    return res.status(500).json({ error: 'No se pudo obtener la propuesta' });
  }
};

const actualizarEstadoPropuesta = async (req, res) => {
  try {
    const { estado } = req.body;
    const propuestaId = req.params.propuesta_id;

    if (!['Autorizada', 'Habilitado para Defensa', 'Cerrado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado de propuesta inválido' });
    }
    if (estado === 'Autorizada' && req.get('X-Demo-Role') !== 'jefe-carrera') {
      return res.status(403).json({ error: 'Solo Jefatura puede autorizar el inicio de la memoria.' });
    }
    if (estado === 'Cerrado' && req.get('X-Demo-Role') !== 'jefe-carrera') {
      return res.status(403).json({ error: 'Solo Jefatura puede cerrar la memoria.' });
    }

    const actual = await pool.query('SELECT estado FROM propuestas WHERE id = $1', [propuestaId]);
    if (actual.rowCount === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }
    if (actual.rows[0].estado === 'Cerrado') {
      return res.status(409).json({
        error: 'La memoria está cerrada y no admite modificaciones.'
      });
    }

    const transicionValida = estado === 'Autorizada'
      ? actual.rows[0].estado === 'Aprobada por Guía'
      : estado === 'Cerrado'
        ? actual.rows[0].estado === 'Habilitado para Defensa'
        : true;
    if (!transicionValida) {
      return res.status(409).json({ error: `No se puede cambiar desde "${actual.rows[0].estado}" a "${estado}".` });
    }

    const result = await pool.query(
      'UPDATE propuestas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, propuestaId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el estado de la propuesta:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el estado de la propuesta' });
  }
};

const editarPropuesta = async (req, res) => {
  try {
    const propuestaId = req.params.propuesta_id;
    const {
      titulo, resumen, problema_ingenieria, objetivos, bibliografia,
      memorista, rut, rol_usm, celular, campus, modalidad, profesor,
    } = req.body || {};
    if (![titulo, resumen, problema_ingenieria, objetivos, bibliografia].every((value) => String(value || '').trim())) {
      return res.status(400).json({ error: 'Título, resumen, problema, objetivos y bibliografía son obligatorios.' });
    }
    const result = await pool.query(`
      UPDATE propuestas
      SET titulo = $1, resumen = $2, problema_ingenieria = $3, objetivos = $4,
          bibliografia = $5, memorista = COALESCE($6, memorista), rut = COALESCE($7, rut),
          rol_usm = COALESCE($8, rol_usm), celular = COALESCE($9, celular),
          campus = COALESCE($10, campus), modalidad = COALESCE($11, modalidad),
          profesor = COALESCE($12, profesor), estado = 'En revisión'
      WHERE id = $13 AND estado = 'Rechazada por Guía'
      RETURNING *
    `, [titulo.trim(), resumen.trim(), problema_ingenieria.trim(), objetivos.trim(),
      bibliografia.trim(), memorista, rut, rol_usm, celular, campus, modalidad, profesor, propuestaId]);
    if (!result.rowCount) {
      return res.status(409).json({ error: 'Solo se pueden editar propuestas rechazadas.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al editar propuesta:', error);
    return res.status(500).json({ error: 'No se pudo reenviar la propuesta.' });
  }
};

const eliminarPropuesta = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM propuestas
       WHERE id = $1 AND estado IN ('En revisión', 'Rechazada por Guía')
       RETURNING id`,
      [req.params.propuesta_id],
    );
    if (!result.rowCount) {
      return res.status(409).json({ error: 'Solo se pueden eliminar propuestas en revisión o rechazadas.' });
    }
    return res.status(200).json({ id: result.rows[0].id, mensaje: 'Propuesta eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar propuesta:', error);
    return res.status(500).json({ error: 'No se pudo eliminar la propuesta.' });
  }
};

const uploadDirectory = path.resolve(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdir(uploadDirectory, { recursive: true }, (error) => {
      callback(error, uploadDirectory);
    });
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

const uploadPropuesta = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'archivo'));
    }
    callback(null, true);
  }
});

const crearPropuesta = async (req, res) => {
  try {
    const {
      titulo, memorista, rut, rol_usm, celular, campus,
      modalidad, profesor, resumen, problema_ingenieria,
      objetivos, bibliografia
    } = req.body;
    const archivo = req.file;

    if (!titulo || !memorista || !rut || !rol_usm || !celular || !campus ||
        !modalidad || !profesor || !resumen || !problema_ingenieria ||
        !objetivos || !bibliografia || !archivo) {
      return res.status(400).json({
        error: 'Todos los campos y el PDF de la propuesta son obligatorios'
      });
    }

    const query = `
      INSERT INTO propuestas (
        titulo, memorista, rut, rol_usm, celular, campus,
        modalidad, profesor, resumen, problema_ingenieria,
        objetivos, bibliografia, nombre_archivo, ruta_archivo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      titulo, memorista, rut, rol_usm, celular, campus,
      modalidad, profesor, resumen, problema_ingenieria,
      objetivos, bibliografia, archivo.originalname, archivo.path
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear propuesta:", error);
    res.status(500).json({ error: "Error interno al guardar la propuesta" });
  }
};

const listarPropuestas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM propuestas ORDER BY fecha_creacion DESC;');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al listar propuestas:", error);
    res.status(500).json({ error: "Error interno al obtener propuestas" });
  }
};

module.exports = {
  crearPropuesta,
  listarPropuestas,
  obtenerPropuesta,
  actualizarEstadoPropuesta,
  editarPropuesta,
  eliminarPropuesta,
  getProposalFile,
  evaluarPropuesta,
  uploadMiddleware: uploadPropuesta.single('archivo'),
  handleUploadError: (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo no puede superar los 10 MB'
        : 'El archivo debe ser un PDF enviado en el campo archivo';
      return res.status(400).json({ error: message });
    }
    if (error) {
      console.error('Error al guardar el PDF de la propuesta:', error);
      return res.status(500).json({ error: 'No se pudo guardar el archivo' });
    }
    next();
  }
};
