import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { listarHistorialEntregables, subirEntregable } from '../lib/api';

function UploadDeliverable({ propuestas = [], onNavigate, currentView, onDeliverableCreated }) {
  // Manejamos de forma segura por si id viene como id o _id, o si el array está vacío
  const [propuestaId, setPropuestaId] = useState(propuestas[0]?.id || propuestas[0]?._id || '');
  const [etapa, setEtapa] = useState('Avance 1');
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    let active = true;
    setHistorial([]);
    if (!propuestaId) return () => { active = false; };
    listarHistorialEntregables(propuestaId)
      .then((items) => active && setHistorial(items))
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, [propuestaId]);

  function tieneAprobacion(etapaBuscada) {
    return historial
      .filter((item) => item.etapa?.trim().toLowerCase() === etapaBuscada.trim().toLowerCase())
      .some((item) => (item.evaluaciones || []).some((evaluacion) => Number(evaluacion.nota) >= 70));
  }

  const siguienteEtapa = tieneAprobacion('Avance 2')
    ? 'Trabajo escrito final'
    : tieneAprobacion('Avance 1') ? 'Avance 2' : 'Avance 1';

  useEffect(() => {
    setEtapa(siguienteEtapa);
  }, [siguienteEtapa]);

  const propuestaSeleccionada = propuestas.find(
    (propuesta) => String(propuesta.id || propuesta._id) === String(propuestaId),
  );
  const esAvance2 = etapa === 'Avance 2';
  // Avance 2 no depende del estado de autorización de la propuesta.
  // El backend verifica que exista una evaluación aprobatoria del Avance 1.
  const puedeSubir = esAvance2 || propuestaSeleccionada?.estado === 'Autorizada';

  async function handleSubmit(event) {
    event.preventDefault();
    
    // Validación estricta para evitar que viaje como undefined o vacío
    if (!propuestaId || propuestaId === 'undefined' || !archivo) {
      setError('Por favor selecciona una propuesta válida y un documento PDF.');
      return;
    }
    if (!puedeSubir) {
      setError(`La propuesta está "${propuestaSeleccionada?.estado || 'sin estado'}". Debe ser autorizada por Jefatura antes de subir avances.`);
      return;
    }
    if (archivo.type !== 'application/pdf') {
      setError('El documento debe estar en formato PDF.');
      return;
    }

    if (etapa !== siguienteEtapa) {
      setError(`Debes completar y aprobar ${siguienteEtapa === 'Avance 1' ? 'el Avance 1' : siguienteEtapa === 'Avance 2' ? 'el Avance 1' : 'el Avance 2'} antes de subir esta etapa.`);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const entregable = await subirEntregable({ propuestaId, etapa, archivo });
      onDeliverableCreated(entregable);
      onNavigate('inicio-memorista');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
      <form onSubmit={handleSubmit} className="mx-auto mt-8 mb-10 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Entregables y notas</p>
        <h2 className="mb-6 mt-1 text-2xl font-black text-[#0c1d36]">Subir documento de avance</h2>
        
        <label className="text-slate-700 font-bold text-xs block mb-1">Propuesta</label>
        <select 
          value={propuestaId} 
          onChange={(event) => setPropuestaId(event.target.value)} 
          className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none"
        >
          <option value="">Selecciona una propuesta</option>
          {propuestas && propuestas.map((propuesta) => {
            const idVal = propuesta.id || propuesta._id;
            return (
              <option key={idVal} value={idVal}>
                {propuesta.titulo || propuesta.tema}
              </option>
            );
          })}
        </select>
        
        <label className="text-slate-700 font-bold text-xs block mb-1">Etapa</label>
        <select value={etapa} onChange={(event) => setEtapa(event.target.value)} className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none">
          <option>{siguienteEtapa}</option>
        </select>
        
        <label className="text-slate-700 font-bold text-xs block mb-1">Documento PDF</label>
        <input type="file" accept="application/pdf" onChange={(event) => setArchivo(event.target.files[0] || null)} className="mb-6 w-full rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600" />
        {!puedeSubir && propuestaSeleccionada && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-800">{esAvance2 ? 'El Avance 2 se habilita al aprobar el Avance 1.' : 'La propuesta está aprobada por el guía, pero aún necesita la autorización de Jefatura para habilitar el Avance 1.'}</p>}
        
        {error && <p className="text-red-200 font-bold text-sm mb-4">{error}</p>}
        
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => onNavigate('inicio-memorista')} className="rounded-lg bg-slate-100 px-5 py-2 font-bold text-slate-700">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#07558d] px-5 py-2 font-bold text-white disabled:opacity-60">
            {isSubmitting ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadDeliverable;
