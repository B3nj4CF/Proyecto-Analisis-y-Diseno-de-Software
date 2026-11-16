import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { API_TRAMITACION_URL, editarPropuesta, listarEvaluacionesPropuesta } from '../lib/api';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // mismo límite que el backend (10 MB)

function EditProposal({ selectedProposal, onNavigate, currentView, onProposalCreated }) {
  const [form, setForm] = useState({
    titulo: selectedProposal?.titulo || '',
    resumen: selectedProposal?.resumen || '',
    problema_ingenieria: selectedProposal?.problema_ingenieria || '',
    objetivos: selectedProposal?.objetivos || '',
    bibliografia: selectedProposal?.bibliografia || '',
  });
  const [archivo, setArchivo] = useState(null);
  const [observaciones, setObservaciones] = useState([]);
  const [observacionesError, setObservacionesError] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const proposalId = selectedProposal?.id || selectedProposal?._id;

  // HU-14: observaciones anteriores (evaluaciones de la propuesta)
  useEffect(() => {
    let active = true;
    setObservaciones([]);
    setObservacionesError('');
    if (!proposalId) return () => { active = false; };
    listarEvaluacionesPropuesta(proposalId)
      .then((items) => { if (active) setObservaciones(items); })
      .catch((loadError) => { if (active) setObservacionesError(loadError.message); });
    return () => { active = false; };
  }, [proposalId]);

  if (!selectedProposal) return <Empty onNavigate={onNavigate} />;

  const observacionesOrdenadas = [...observaciones]
    .sort((first, second) => new Date(second.fecha_evaluacion || 0) - new Date(first.fecha_evaluacion || 0));

  function handleFile(event) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setArchivo(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('El documento de reemplazo debe ser un archivo PDF.');
      setArchivo(null);
      event.target.value = '';
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError('El PDF no puede superar los 10 MB.');
      setArchivo(null);
      event.target.value = '';
      return;
    }
    setError('');
    setArchivo(file);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const actualizada = await editarPropuesta(selectedProposal.id, { ...form, archivo });
      onProposalCreated(actualizada);
      onNavigate('inicio-memorista');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black text-red-700">Observaciones anteriores</h2>
          <p className="mt-1 text-[10px] text-slate-500">Revisa lo que se indicó en la evaluación antes de corregir tu propuesta.</p>
          {observacionesError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{observacionesError}</p>}
          {!observacionesOrdenadas.length && !observacionesError && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No hay observaciones registradas para esta propuesta.</p>
          )}
          <div className="mt-3 space-y-3">
            {observacionesOrdenadas.map((observacion, index) => (
              <ObservationCard key={`${observacion.fecha_evaluacion}-${index}`} observacion={observacion} latest={index === 0} />
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-orange-500">HU-14 · Reenvío</p>
          <h1 className="mt-1 text-2xl font-black text-[#0c1d36]">Editar propuesta rechazada</h1>
          <p className="mt-2 text-sm text-slate-500">Corrige los antecedentes y vuelve a enviarlos a revisión. La versión actual quedará guardada en el historial.</p>
          <div className="mt-6 space-y-4">
            <Field label="Título" value={form.titulo} onChange={(value) => setForm({ ...form, titulo: value })} />
            <Field label="Resumen ejecutivo" value={form.resumen} onChange={(value) => setForm({ ...form, resumen: value })} area />
            <Field label="Problema de ingeniería" value={form.problema_ingenieria} onChange={(value) => setForm({ ...form, problema_ingenieria: value })} area />
            <Field label="Objetivos" value={form.objetivos} onChange={(value) => setForm({ ...form, objetivos: value })} area />
            <Field label="Bibliografía" value={form.bibliografia} onChange={(value) => setForm({ ...form, bibliografia: value })} area />

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-600">Documento PDF de la propuesta</p>
              <p className="mt-1 text-xs text-slate-500">
                PDF actual:{' '}
                {selectedProposal.nombre_archivo
                  ? <a href={`${API_TRAMITACION_URL}/api/propuestas/${proposalId}/archivo`} target="_blank" rel="noreferrer" className="font-bold text-[#07558d] hover:underline">{selectedProposal.nombre_archivo}</a>
                  : <span>sin archivo asociado</span>}
              </p>
              <label className="mt-3 block text-[10px] font-bold uppercase text-slate-600">
                Reemplazar PDF (opcional, máx. 10 MB)
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFile}
                  className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#07558d] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#064675]"
                />
              </label>
              {archivo && <p className="mt-2 text-xs text-emerald-700">Se enviará: <b>{archivo.name}</b> ({(archivo.size / 1024 / 1024).toFixed(2)} MB). El PDF anterior quedará en el historial de versiones.</p>}
              {!archivo && <p className="mt-2 text-[10px] text-slate-400">Si no adjuntas un archivo, se mantiene el PDF actual.</p>}
            </div>
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => onNavigate('inicio-memorista')} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancelar</button>
            <button type="submit" disabled={guardando} className="rounded-lg bg-[#07558d] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{guardando ? 'Enviando...' : 'Guardar y reenviar'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}

function ObservationCard({ observacion, latest }) {
  const rejected = Number(observacion.nota) < 70;
  return (
    <article className={`rounded-lg border p-4 ${rejected ? 'border-red-200 bg-red-50' : 'border-sky-200 bg-sky-50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${rejected ? 'bg-red-600 text-white' : 'bg-sky-100 text-sky-700'}`}>
          {latest ? 'Última observación' : 'Observación anterior'}
        </span>
        <span className="text-[9px] text-slate-400">{observacion.fecha_evaluacion ? new Date(observacion.fecha_evaluacion).toLocaleString('es-CL') : ''}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-700">{observacion.evaluador_nombre || 'Evaluador'}</p>
      <p className="mt-1 whitespace-pre-line text-xs text-slate-600">{observacion.comentarios}</p>
      <p className={`mt-2 text-xs font-black ${rejected ? 'text-red-700' : 'text-sky-700'}`}>Nota: {observacion.nota}/100</p>
    </article>
  );
}

function Field({ label, value, onChange, area = false }) {
  const className = 'mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-500';
  return <label className="block text-[10px] font-bold uppercase text-slate-600">{label}{area ? <textarea required rows="3" value={value} onChange={(event) => onChange(event.target.value)} className={className} /> : <input required value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function Empty({ onNavigate }) {
  return <div className="p-8 text-center text-sm">No hay una propuesta seleccionada. <button className="font-bold text-sky-700" onClick={() => onNavigate('inicio-memorista')}>Volver</button></div>;
}

export default EditProposal;
