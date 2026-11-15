import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  API_TRAMITACION_URL,
  listarComentariosEntregable,
  listarEvaluacionesPropuesta,
  listarHistorialEntregables,
} from '../lib/api';

function ProposalDetails({ selectedProposal, onNavigate, currentView }) {
  const [history, setHistory] = useState([]);
  const [proposalEvaluations, setProposalEvaluations] = useState([]);
  const [comments, setComments] = useState({});
  const [error, setError] = useState('');
  const proposalId = selectedProposal?.id || selectedProposal?._id;

  useEffect(() => {
    let active = true;
    if (!proposalId) return () => { active = false; };
    Promise.all([
      listarHistorialEntregables(proposalId),
      listarEvaluacionesPropuesta(proposalId),
    ]).then(async ([items, evaluations]) => {
      const entries = await Promise.all(items.map(async (item) => [item.id, await listarComentariosEntregable(item.id)]));
      if (active) {
        setHistory(items);
        setProposalEvaluations(evaluations);
        setComments(Object.fromEntries(entries));
      }
    }).catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, [proposalId]);

  if (!selectedProposal) return <div className="min-h-screen bg-[#f4f7fa] p-8 text-center">No hay una propuesta seleccionada.</div>;

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <button type="button" onClick={() => onNavigate('propuestas-inscritas')} className="text-xs font-bold text-slate-500 hover:text-[#07558d]">← Volver a entregables y notas</button>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-orange-500">Detalle de inscripción</p>
          <h1 className="mt-1 text-2xl font-black text-[#0c1d36]">{selectedProposal.titulo}</h1>
          <div className="mt-4 grid gap-3 text-xs text-slate-600 md:grid-cols-2">
            <Detail label="Memorista" value={selectedProposal.memorista} />
            <Detail label="RUT" value={selectedProposal.rut} />
            <Detail label="Profesor guía" value={selectedProposal.profesor} />
            <Detail label="Campus / Modalidad" value={`${selectedProposal.campus || 'Sin campus'} / ${selectedProposal.modalidad || 'Sin modalidad'}`} />
            <Detail label="Resumen ejecutivo" value={selectedProposal.resumen} wide />
            <Detail label="Problema de ingeniería" value={selectedProposal.problema_ingenieria} wide />
            <Detail label="Objetivos" value={selectedProposal.objetivos} wide />
            <Detail label="Bibliografía" value={selectedProposal.bibliografia} wide />
          </div>
          {proposalId && <a href={`${API_TRAMITACION_URL}/api/propuestas/${proposalId}/archivo`} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-[#07558d] px-4 py-2 text-[10px] font-bold text-white">Ver PDF de inscripción</a>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0c1d36]">Observaciones y actualizaciones</h2>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{error}</p>}
          {!history.length && !proposalEvaluations.length && !error && <p className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">Aún no hay entregables ni observaciones.</p>}
          {proposalEvaluations.map((evaluation, index) => (
            <EvaluationCard key={`${evaluation.fecha_evaluacion}-${index}`} evaluation={evaluation} />
          ))}
          <div className="mt-4 space-y-4">
            {[...history]
              .sort((first, second) => new Date(second.fecha_subida || 0) - new Date(first.fecha_subida || 0))
              .map((item) => <UpdateCard key={item.id} item={item} comments={comments[item.id] || []} />)}
          </div>
        </section>
      </main>
    </div>
  );
}

function EvaluationCard({ evaluation }) {
  const rejected = Number(evaluation.nota) < 70;
  return (
    <article className={`mb-4 rounded-lg border p-4 ${rejected ? 'border-red-200 bg-red-50' : 'border-sky-200 bg-sky-50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${rejected ? 'bg-red-600 text-white' : 'bg-sky-100 text-sky-700'}`}>
          {rejected ? 'Propuesta rechazada' : 'Evaluación de propuesta'}
        </span>
        <span className="text-[9px] text-slate-400">{evaluation.fecha_evaluacion ? new Date(evaluation.fecha_evaluacion).toLocaleString('es-CL') : ''}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-700">{evaluation.evaluador_nombre || 'Evaluador'}</p>
      <p className="mt-1 text-xs text-slate-600">{evaluation.comentarios}</p>
      <p className={`mt-2 text-xs font-black ${rejected ? 'text-red-700' : 'text-sky-700'}`}>Nota: {evaluation.nota}/100</p>
    </article>
  );
}

function UpdateCard({ item, comments }) {
  const evaluation = item.evaluaciones?.at(-1);
  return <article className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-sky-100 px-2 py-1 text-[9px] font-bold text-sky-700">{item.etapa}</span><span className="text-[9px] text-slate-400">{item.fecha_subida ? new Date(item.fecha_subida).toLocaleString('es-CL') : ''}</span></div><h3 className="mt-2 text-sm font-black">{item.nombre_archivo}</h3>{evaluation ? <div className="mt-3 rounded-lg bg-white p-3 text-xs"><b>Calificación: {evaluation.nota}/100</b><p className="mt-1">{evaluation.comentarios}</p></div> : <p className="mt-2 text-xs text-amber-700">Pendiente de evaluación.</p>}<div className="mt-3 space-y-2">{comments.map((comment) => <div key={comment.id} className="rounded-lg bg-white p-3 text-xs"><b>{comment.autor_nombre}</b><p className="mt-1 text-slate-600">{comment.contenido}</p></div>)}</div></article>;
}

function Detail({ label, value, wide = false }) { return <div className={wide ? 'md:col-span-2' : ''}><b className="mb-1 block text-[9px] uppercase text-slate-400">{label}</b><p>{value || 'Sin información registrada.'}</p></div>; }

export default ProposalDetails;
