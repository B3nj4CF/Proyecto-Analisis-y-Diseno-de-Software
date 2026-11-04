const { pool } = require('../db');

const subirEntregable = async (entregable) => {
  const { propuesta_id, etapa, nombre_archivo, ruta_archivo } = entregable;
  const query = `
    INSERT INTO entregables (propuesta_id, etapa, nombre_archivo, ruta_archivo, estado)
    VALUES ($1, $2, $3, $4, 'Pendiente de Revisión') RETURNING *;
  `;
  const result = await pool.query(query, [propuesta_id, etapa, nombre_archivo, ruta_archivo]);
  return result.rows[0];
};

const obtenerTodosLosEntregables = async () => {
  const result = await pool.query('SELECT * FROM entregables ORDER BY fecha_subida DESC;');
  return result.rows;
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
  const entregableResult = await pool.query(
    'SELECT propuesta_id FROM entregables WHERE id = $1',
    [entregable_id],
  );
  if (entregableResult.rowCount === 0) {
    const error = new Error('El entregable no existe');
    error.code = 'ENTREGABLE_NOT_FOUND';
    throw error;
  }
  
  const queryEval = `
    INSERT INTO evaluaciones_entregables (entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion) 
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const resultEval = await pool.query(queryEval, [entregable_id, evaluador_nombre, nota, comentarios, confirmacion_reprobacion]);
  
  await pool.query(
    'UPDATE entregables SET estado = $1 WHERE id = $2',
    ['Revisado', entregable_id],
  );
  
  return {
    ...resultEval.rows[0],
    propuesta_id: entregableResult.rows[0].propuesta_id,
  };
};

module.exports = {
  subirEntregable,
  obtenerTodosLosEntregables,
  obtenerEntregablesPorPropuesta,
  agregarComentario,
  obtenerComentarios,
  evaluarEntregable
};