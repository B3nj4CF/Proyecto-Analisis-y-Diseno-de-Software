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

  } catch (error) {
    console.error('Error al subir entregable:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al procesar el entregable.' });
  }
};

const obtenerHistorialEntregables = async (req, res) => {
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
    console.error('Error al obtener historial:', error);
    return res.status(500).json({ mensaje: 'Error al consultar historial de entregables.' });
  }
};

module.exports = {
  subirEntregable,
  obtenerHistorialEntregables
};