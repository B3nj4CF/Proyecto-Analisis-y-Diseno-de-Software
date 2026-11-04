const API_TRAMITACION = process.env.TRAMITACION_API_URL || 'http://api_tramitacion:3002';
const API_ENTREGABLES = process.env.ENTREGABLES_API_URL || 'http://api_entregables:3001';

async function consultar(url, recurso) {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  } catch (error) {
    const problema = new Error(`No se pudo consultar ${recurso}.`);
    problema.status = 502;
    throw problema;
  }
  if (response.status === 404) {
    const problema = new Error(`${recurso} no encontrado.`);
    problema.status = 404;
    throw problema;
  }
  if (!response.ok) {
    const problema = new Error(`Error al consultar ${recurso}.`);
    problema.status = 502;
    throw problema;
  }
  try { return await response.json(); } catch {
    const problema = new Error(`Respuesta inválida al consultar ${recurso}.`);
    problema.status = 502;
    throw problema;
  }
}

function propuesta(id) {
  return consultar(`${API_TRAMITACION}/api/propuestas/${id}`, 'Propuesta');
}

async function historial(id) {
  const [evaluaciones, entregables] = await Promise.all([
    consultar(`${API_TRAMITACION}/api/propuestas/${id}/evaluaciones`, 'Evaluaciones de propuesta'),
    consultar(`${API_ENTREGABLES}/api/entregables/propuesta/${id}/historial`, 'Historial de entregables')
  ]);
  if (!Array.isArray(evaluaciones) || !Array.isArray(entregables)) {
    const problema = new Error('Los servicios académicos devolvieron un formato inesperado.');
    problema.status = 502;
    throw problema;
  }
  return { evaluaciones, entregables };
}

module.exports = { propuesta, historial };
