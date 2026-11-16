// Definimos los puertos de tus microservicios en Node.js (según tu docker-compose)
const API_ENTREGABLES_URL = import.meta.env.VITE_API_ENTREGABLES_URL || 'http://127.0.0.1:3001';
const API_TRAMITACION_URL = import.meta.env.VITE_API_TRAMITACION_URL || 'http://127.0.0.1:3002';
export const API_VALIDACIONES_URL = import.meta.env.VITE_API_VALIDACIONES_URL || 'http://127.0.0.1:3003';
export { API_ENTREGABLES_URL, API_TRAMITACION_URL };

async function parseResponse(response, defaultMessage) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.detail || defaultMessage);
  }
  return response.json();
}

// --- MÓDULO DE PROPUESTAS (API TRAMITACIÓN / O LA QUE CORRESPONDA) ---
export async function crearPropuesta(formData) {
  if (!(formData.archivo instanceof File)) {
    throw new Error('El documento PDF de la propuesta es obligatorio.');
  }

  const body = new FormData();
  body.append('titulo', formData.tema);
  body.append('memorista', formData.memorista);
  body.append('rut', formData.rut);
  body.append('rol_usm', formData.rolUsm);
  body.append('celular', formData.celular);
  body.append('campus', formData.campus);
  body.append('modalidad', formData.modalidad);
  body.append('profesor', formData.profesor);
  body.append('resumen', formData.resumen);
  body.append('problema_ingenieria', formData.problema);
  body.append('objetivos', formData.objetivos);
  body.append('bibliografia', formData.referencias);
  body.append('archivo', formData.archivo);

  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas`, {
    method: 'POST',
    body,
  });

  return parseResponse(response, 'No se pudo crear la propuesta.');
}

export async function listarPropuestas() {
  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas`);
  return parseResponse(response, 'No se pudieron cargar las propuestas.');
}

// --- MÓDULO DE ENTREGABLES (API ENTREGABLES - Puerto 3001) ---
export async function listarEntregables(propuestaId) {
  if (!propuestaId || propuestaId === 'undefined') {
    return [];
  }
  const endpoint = `/api/entregables/propuesta/${propuestaId}`;
  const response = await fetch(`${API_ENTREGABLES_URL}${endpoint}`);
  return parseResponse(response, 'No se pudieron cargar los entregables.');
}

export async function listarHistorialEntregables(propuestaId) {
  const response = await fetch(`${API_ENTREGABLES_URL}/api/entregables/propuesta/${propuestaId}/historial`);
  return parseResponse(response, 'No se pudo cargar el historial de entregables.');
}

export async function listarEvaluacionesPropuesta(propuestaId) {
  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas/${propuestaId}/evaluaciones`);
  return parseResponse(response, 'No se pudieron cargar las evaluaciones de la propuesta.');
}

export async function subirEntregable(data) {
  const propuestaId = data.propuestaId || data.propuesta_id || data.id;
  const etapa = data.etapa;
  const archivo = data.archivo;

  if (!propuestaId || !etapa || !(archivo instanceof File)) {
    throw new Error('La propuesta, la etapa y un archivo PDF son obligatorios.');
  }

  const body = new FormData();
  body.append('propuesta_id', String(propuestaId));
  body.append('etapa', etapa);
  body.append('archivo', archivo);

  const response = await fetch(`${API_ENTREGABLES_URL}/api/entregables/upload`, {
    method: 'POST',
    body,
  });
  
  return parseResponse(response, 'No se pudo subir el documento.');
}

export async function crearEvaluacion(entregableId, datos) {
  const response = await fetch(`${API_ENTREGABLES_URL}/api/entregables/${entregableId}/evaluaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  return parseResponse(response, 'No se pudo guardar la evaluación.');
}

export async function listarComentariosEntregable(entregableId) {
  const response = await fetch(`${API_ENTREGABLES_URL}/api/entregables/${entregableId}/comentarios`);
  return parseResponse(response, 'No se pudieron cargar las observaciones.');
}

export async function crearComentarioEntregable(entregableId, datos) {
  const response = await fetch(`${API_ENTREGABLES_URL}/api/entregables/${entregableId}/comentarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return parseResponse(response, 'No se pudo guardar la observación.');
}

export async function crearEvaluacionPropuesta(propuestaId, datos) {
  const response = await fetch(
    `${API_TRAMITACION_URL}/api/propuestas/${propuestaId}/evaluaciones`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    }
  );
  return parseResponse(response, 'No se pudo guardar la evaluación de la propuesta.');
}

export async function actualizarEstadoPropuesta(propuestaId, estado) {
  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas/${propuestaId}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Role': 'jefe-carrera' },
    body: JSON.stringify({ estado }),
  });
  return parseResponse(response, 'No se pudo actualizar el estado de la propuesta.');
}

// HU-14: reenvío de una propuesta rechazada. `datos.archivo` (File PDF) es opcional.
export async function editarPropuesta(propuestaId, datos) {
  const { archivo, ...campos } = datos;
  const body = new FormData();
  Object.entries(campos).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null) body.append(clave, valor);
  });
  if (archivo instanceof File) body.append('archivo', archivo);

  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas/${propuestaId}`, {
    method: 'PUT',
    body,
  });
  return parseResponse(response, 'No se pudo reenviar la propuesta.');
}

export async function listarVersionesPropuesta(propuestaId) {
  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas/${propuestaId}/versiones`);
  return parseResponse(response, 'No se pudo cargar el historial de versiones.');
}

export function urlArchivoVersionPropuesta(propuestaId, versionId) {
  return `${API_TRAMITACION_URL}/api/propuestas/${propuestaId}/versiones/${versionId}/archivo`;
}

export async function eliminarPropuesta(propuestaId) {
  const response = await fetch(`${API_TRAMITACION_URL}/api/propuestas/${propuestaId}`, { method: 'DELETE' });
  return parseResponse(response, 'No se pudo eliminar la propuesta.');
}

// HU-11: eliminar un documento subido por error (solo si sigue pendiente de revisión)
export async function eliminarEntregable(entregableId) {
  const response = await fetch(`${API_ENTREGABLES_URL}/api/entregables/${entregableId}`, { method: 'DELETE' });
  return parseResponse(response, 'No se pudo eliminar el documento.');
}
