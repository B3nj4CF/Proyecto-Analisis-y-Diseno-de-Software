const { pool } = require('../db');

async function obtenerEvaluaciones(req, res) {
  const propuestaId = req.params.propuesta_id;
  if (!/^\d+$/.test(propuestaId)) return res.status(400).json({ error: 'ID de propuesta inválido.' });
  try {
    const existe = await pool.query('SELECT id FROM propuestas WHERE id = $1', [propuestaId]);
    if (existe.rowCount === 0) return res.status(404).json({ error: 'Propuesta no encontrada.' });
    const result = await pool.query(`
      SELECT evaluador_nombre, nota, comentarios, fecha_evaluacion
      FROM evaluaciones_propuestas WHERE propuesta_id = $1 ORDER BY fecha_evaluacion
    `, [propuestaId]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al consultar evaluaciones de la propuesta:', error);
    return res.status(500).json({ error: 'No se pudieron consultar las evaluaciones.' });
  }
}

module.exports = { obtenerEvaluaciones };
