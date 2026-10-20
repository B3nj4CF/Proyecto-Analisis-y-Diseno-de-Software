const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function parseResponse(response, defaultMessage) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || defaultMessage);
  }

  return response.json();
}

export async function crearPropuesta(formData) {
  const response = await fetch(`${API_URL}/api/propuestas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      titulo: formData.tema,
      memorista: formData.memorista,
      rut: formData.rut,
      rol_usm: formData.rolUsm,
      celular: formData.celular,
      campus: formData.campus,
      modalidad: formData.modalidad,
      profesor: formData.profesor,
      resumen: formData.resumen,
      problema_ingenieria: formData.problema,
      objetivos: formData.objetivos,
      bibliografia: formData.referencias,
    }),
  });

  return parseResponse(response, 'No se pudo crear la propuesta.');
}

export async function listarPropuestas() {
  const response = await fetch(`${API_URL}/api/propuestas`);
  return parseResponse(response, 'No se pudieron cargar las propuestas.');
}

export async function listarEntregables() {
  const response = await fetch(`${API_URL}/api/entregables`);
  return parseResponse(response, 'No se pudieron cargar los entregables.');
}

export async function subirEntregable({ propuestaId, etapa, archivo }) {
  const body = new FormData();
  body.append('propuesta_id', propuestaId);
  body.append('etapa', etapa);
  body.append('archivo', archivo);

  const response = await fetch(`${API_URL}/api/entregables/upload`, {
    method: 'POST',
    body,
  });
  return parseResponse(response, 'No se pudo subir el documento.');
}

export async function crearEvaluacion(entregableId, datos) {
  const response = await fetch(`${API_URL}/api/entregables/${entregableId}/evaluacion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  return parseResponse(response, 'No se pudo guardar la evaluación.');
}
