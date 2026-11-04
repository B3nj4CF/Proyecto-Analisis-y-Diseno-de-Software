const pool = require('../db');
const axios = require('axios');

const ETAPAS_VALIDAS = ['definición', 'estado del arte', 'solución', 'validación'];

const subirEntregable = async (req, res) => {
  try {
    const { propuesta_id, etapa } = req.body;
    const archivo = req.file;

    // Validación de archivo presente
    if (!archivo) {
      return res.status(400).json({ mensaje: 'No se ha adjuntado ningún archivo.' });
    }

    if (!propuesta_id || !etapa) {
      return res.status(400).json({ mensaje: 'Faltan parámetros requeridos: propuesta_id o etapa.' });
    }

    // CA1: Validar que la etapa corresponda al desarrollo
    const etapaNormalizada = etapa.trim().toLowerCase();
    if (!ETAPAS_VALIDAS.includes(etapaNormalizada)) {
      return res.status(400).json({ 
        mensaje: `Etapa inválida. Debe ser una de: ${ETAPAS_VALIDAS.join(', ')}.` 
      });
    }

    // CA1: Validar que la propuesta esté en estado "Autorizada" en TT2
    const tramitacionUrl = process.env.TRAMITACION_API_URL || 'http://api_tramitacion:3002';
    let propuesta;
    try {
      const responsePropuesta = await axios.get(`${tramitacionUrl}/propuestas/${propuesta_id}`);
      propuesta = responsePropuesta.data;
    } catch (err) {
      return res.status(404).json({ mensaje: 'No se pudo verificar la propuesta en el sistema de tramitación.' });
    }

    if (!propuesta || propuesta.estado?.toLowerCase() !== 'autorizada') {
      return res.status(403).json({ 
        mensaje: 'Solo se pueden subir entregables si la propuesta está en estado Autorizada.' 
      });
    }

    // CA2 y CA3: Guardar con estado "Pendiente de Revisión" y persistir timestamp exacto
    const queryEntregable = `
      INSERT INTO entregables (propuesta_id, etapa, nombre_archivo, ruta_archivo, estado, fecha_subida)
      VALUES ($1, $2, $3, $4, 'Pendiente de Revisión', CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const valuesEntregable = [
      propuesta_id,
      etapaNormalizada,
      archivo.originalname,
      archivo.path
    ];

    const { rows } = await pool.query(queryEntregable, valuesEntregable);
    const entregableCreado = rows[0];

    // CA3: Generar alerta al Profesor Guía y al Co-guía/Mentor
    const mensajeAlerta = `Nuevo entregable subido para la etapa "${etapaNormalizada}" en la propuesta ${propuesta_id}.`;
    await pool.query(`
      INSERT INTO alertas_entregables (entregable_id, destinatario_rol, mensaje)
      VALUES 
        ($1, 'Profesor Guía', $2),
        ($1, 'Co-guía/Mentor', $2);
    `, [entregableCreado.id, mensajeAlerta]);

    return res.status(201).json({
      mensaje: 'Entregable subido exitosamente.',
      entregable: entregableCreado
    });

<<<<<<< HEAD
=======
    res.status(201).json({
      ...nuevoEntregable,
      notificacion: {
        tipo: 'nuevo_entregable',
        destinatarios: ['Profesor Guía', 'Co-guía/Mentor'],
        mensaje: `El memorista entregó ${etapa} para revisión.`
      }
    });
>>>>>>> origin/develop
  } catch (error) {
    console.error('Error al subir entregable:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al procesar el entregable.' });
  }
};

<<<<<<< HEAD
const obtenerHistorialEntregables = async (req, res) => {
=======
const obtenerTodosLosEntregables = async (req, res) => {
  try {
    const entregables = await modelo.obtenerTodosLosEntregables();
    res.status(200).json(entregables);
  } catch (error) {
    console.error("Error al obtener todos los entregables:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerEntregables = async (req, res) => {
>>>>>>> origin/develop
  try {
    const { propuesta_id } = req.params;
    const query = `
      SELECT id, propuesta_id, etapa, nombre_archivo, estado, fecha_subida 
      FROM entregables 
      WHERE propuesta_id = $1 
      ORDER BY fecha_subida DESC;
    `;
    const { rows } = await pool.query(query, [propuesta_id]);
    return res.status(200).json(rows);
  } catch (error) {
<<<<<<< HEAD
    console.error('Error al obtener historial:', error);
    return res.status(500).json({ mensaje: 'Error al consultar historial de entregables.' });
=======
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

    let propuestaResponse;
    try {
      propuestaResponse = await fetch(
        `${tramitacionApiUrl}/api/propuestas/${encodeURIComponent(evaluacion.propuesta_id)}/estado`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'Autorizada' }),
        }
      );
    } catch (error) {
      console.error('No se pudo conectar con API_TRAMITACION al autorizar la propuesta:', error);
      return res.status(502).json({ error: "No se pudo actualizar el estado de la propuesta" });
    }
    if (!propuestaResponse.ok) {
      console.error(`API_TRAMITACION respondió ${propuestaResponse.status} al autorizar la propuesta`);
      return res.status(502).json({ error: "No se pudo actualizar el estado de la propuesta" });
    }

    res.status(201).json(evaluacion);
  } catch (error) {
    console.error("Error al evaluar entregable:", error);
    res.status(500).json({ error: "Error interno del servidor" });
>>>>>>> origin/develop
  }
};

module.exports = {
  subirEntregable,
<<<<<<< HEAD
  obtenerHistorialEntregables
=======
  obtenerTodosLosEntregables,
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
>>>>>>> origin/develop
};