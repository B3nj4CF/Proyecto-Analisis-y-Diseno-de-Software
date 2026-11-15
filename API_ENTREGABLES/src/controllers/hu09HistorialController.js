const { pool } = require('../db');

async function obtenerHistorial(req, res) {
  const propuestaId = req.params.propuesta_id;
  if (!/^\d+$/.test(propuestaId)) return res.status(400).json({ error: 'ID de propuesta inválido.' });
  try {
    const result = await pool.query(`
      SELECT e.id, e.propuesta_id, e.etapa, e.nombre_archivo, e.estado, e.fecha_subida,
             COALESCE(json_agg(json_build_object(
               'evaluador_nombre', v.evaluador_nombre, 'nota', v.nota,
               'comentarios', v.comentarios, 'fecha_evaluacion', v.fecha_evaluacion
             ) ORDER BY v.fecha_evaluacion) FILTER (WHERE v.id IS NOT NULL), '[]'::json) AS evaluaciones
      FROM entregables e
      LEFT JOIN evaluaciones_entregables v ON v.entregable_id = e.id
      WHERE e.propuesta_id = $1
      GROUP BY e.id
      ORDER BY e.fecha_subida DESC, e.id DESC
    `, [propuestaId]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al consultar historial de entregables:', error);
    return res.status(500).json({ error: 'No se pudo consultar el historial.' });
  }
}

module.exports = { obtenerHistorial };
