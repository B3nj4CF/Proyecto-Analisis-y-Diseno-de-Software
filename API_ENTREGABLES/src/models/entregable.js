const { pool } = require('../db');

const subirEntregable = async (entregable) => {
  const { propuesta_id, etapa, nombre_archivo, ruta_archivo } = entregable;
  const query = `
    INSERT INTO entregables (propuesta_id, etapa, nombre_archivo, ruta_archivo) 
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;
  const result = await pool.query(query, [propuesta_id, etapa, nombre_archivo, ruta_archivo]);
  return result.rows[0];
};

const obtenerEntregablesPorPropuesta = async (propuesta_id) => {
  const query = 'SELECT * FROM entregables WHERE propuesta_id = $1 ORDER BY fecha_subida DESC;';
  const result = await pool.query(query, [propuesta_id]);
  return result.rows;
};

const agregarComentario = async (comentario) => {
  const { entregable_id, autor_nombre, rol, contenido } = comentario;
  const query = `
    INSERT INTO comentarios_entregables (entregable_id, autor_nombre, rol, contenido) 
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;
  const result = await pool.query(query, [entregable_id, autor_nombre, rol, contenido]);
  return result.rows[0];
};

const obtenerComentarios = async (entregable_id) => {
  const query = 'SELECT * FROM comentarios_entregables WHERE entregable_id = $1 ORDER BY fecha_creacion ASC;';
  const result = await pool.query(query, [entregable_id]);
  return result.rows;
};

const evaluarEntregable = async (evaluacion) => {
  const { entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion } = evaluacion;
  
  const queryEval = `
    INSERT INTO evaluaciones_entregables (entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion) 
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const resultEval = await pool.query(queryEval, [entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion]);
  
  const nuevoEstado = nota >= 60 ? 'Aprobado' : 'Rechazado';
  await pool.query('UPDATE entregables SET estado = $1 WHERE id = $2', [nuevoEstado, entregable_id]);
  
  return resultEval.rows[0];
};

module.exports = {
  subirEntregable,
  obtenerEntregablesPorPropuesta,
  agregarComentario,
  obtenerComentarios,
  evaluarEntregable
};