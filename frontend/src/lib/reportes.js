import { listarPropuestas } from './api';

const RUTA = '/api/procesos';

async function comprobar(response, predeterminado) {
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error || predeterminado);
  }
  return response;
}

export async function obtenerMemorias() {
  return listarPropuestas();
}

export async function obtenerReporte(propuestaId) {
  const response = await fetch(`${RUTA}/${propuestaId}/reporte`);
  await comprobar(response, 'No fue posible consultar el reporte.');
  return response.json();
}

export async function guardarNotas(propuestaId, notaEscrita, notaOral) {
  const response = await fetch(`${RUTA}/${propuestaId}/notas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Role': 'secretaria' },
    body: JSON.stringify({ nota_escrita: notaEscrita, nota_oral: notaOral })
  });
  await comprobar(response, 'No se pudieron guardar las calificaciones.');
  return response.json();
}

export async function generarReporte(propuestaId) {
  const response = await fetch(`${RUTA}/${propuestaId}/reporte`, {
    method: 'POST', headers: { 'X-Demo-Role': 'secretaria' }
  });
  await comprobar(response, 'No se pudo generar el reporte.');
  return response.json();
}

export async function descargarReporte(propuestaId) {
  const response = await fetch(`${RUTA}/${propuestaId}/reporte.pdf`);
  await comprobar(response, 'No fue posible descargar el documento.');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = objectUrl;
  enlace.download = `reporte-memoria-${propuestaId}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}
