import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { listarEvaluacionesPropuesta, listarHistorialEntregables } from '../lib/api';

function MemoristaHome({ onNavigate, currentView, propuestas, entregables, propuestasError, onSelectProposal }) {
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('avance-1');
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [proposalEvaluations, setProposalEvaluations] = useState([]);
  const [deliverableHistory, setDeliverableHistory] = useState([]);
  const [feedbackError, setFeedbackError] = useState('');

  const proposal = useMemo(
    () => propuestas?.find((item) => String(item.id || item._id) === String(selectedProposalId)) || propuestas?.[0],
    [propuestas, selectedProposalId],
  );
  const proposalId = proposal?.id || proposal?._id;

  useEffect(() => {
    let active = true;
    setProposalEvaluations([]);
    setDeliverableHistory([]);
    setFeedbackError('');
    if (!proposalId) return () => { active = false; };

    Promise.all([
      listarEvaluacionesPropuesta(proposalId),
      listarHistorialEntregables(proposalId),
    ]).then(([evaluations, history]) => {
      if (!active) return;
      setProposalEvaluations(evaluations);
      setDeliverableHistory(history);
    }).catch((error) => {
      if (active) setFeedbackError(error.message);
    });

    return () => { active = false; };
  }, [proposalId]);

  if (!propuestas?.length) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
        <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
        <main className="mx-auto flex min-h-[calc(100vh-90px)] max-w-2xl items-center justify-center px-4 py-8">
          <section className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-2xl text-[#07558d]">▣</div>
            <h1 className="mt-4 text-xl font-black text-[#0c1d36]">No tienes propuestas inscritas</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Inscribe una propuesta para comenzar el seguimiento de tu proceso de titulación.
            </p>
            {propuestasError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{propuestasError}</p>}
            <button type="button" onClick={() => onNavigate('crear-propuesta')} className="mt-6 rounded-lg bg-[#07558d] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#064675]">
              + Inscribir propuesta
            </button>
          </section>
        </main>
      </div>
    );
  }

  const proposalDeliverables = entregables?.filter((item) => {
    const itemProposalId = item.propuesta_id || item.propuestaId;
    return !proposalId || !itemProposalId || String(itemProposalId) === String(proposalId);
  }) || [];
  const feedback = [
    ...proposalEvaluations.map((evaluation) => ({
      author: evaluation.evaluador_nombre,
      role: 'Evaluador de propuesta',
      text: evaluation.comentarios,
      score: evaluation.nota,
      date: evaluation.fecha_evaluacion,
    })),
    ...deliverableHistory.flatMap((item) => (item.evaluaciones || []).map((evaluation) => ({
      author: evaluation.evaluador_nombre,
      role: item.etapa || 'Evaluador de entregable',
      text: evaluation.comentarios,
      score: evaluation.nota,
      date: evaluation.fecha_evaluacion,
    }))),
  ].filter((item) => item.text).reverse();

  const latestEvaluationFor = (stage) => deliverableHistory
    .filter((item) => item.etapa?.trim().toLowerCase() === stage.trim().toLowerCase())
    .flatMap((item) => item.evaluaciones || [])
    .sort((first, second) => new Date(second.fecha_evaluacion || 0) - new Date(first.fecha_evaluacion || 0))
    .find((evaluation) => Number(evaluation.nota) >= 70)
    || deliverableHistory
      .filter((item) => item.etapa?.trim().toLowerCase() === stage.trim().toLowerCase())
      .flatMap((item) => item.evaluaciones || [])
      .sort((first, second) => new Date(second.fecha_evaluacion || 0) - new Date(first.fecha_evaluacion || 0))[0];
  const avance1Evaluation = latestEvaluationFor('Avance 1');
  const avance2Evaluation = latestEvaluationFor('Avance 2');
  const finalEvaluation = latestEvaluationFor('Trabajo escrito final');
  const avance1Approved = Number(avance1Evaluation?.nota) >= 70;
  const avance2Approved = Number(avance2Evaluation?.nota) >= 70;
  const finalApproved = Number(finalEvaluation?.nota) >= 70;
  const defenseEnabled = proposal.estado === 'Habilitado para Defensa';
  const etapaActual = defenseEnabled || finalApproved
    ? 'Defensa'
    : avance2Approved
      ? 'Trabajo escrito final'
      : avance1Approved
        ? 'Avance 2'
        : 'Avance 1';
  const isRejected = String(proposal.estado || '').toLowerCase().includes('rechaz')
    || [avance1Evaluation, avance2Evaluation, finalEvaluation].some((evaluation) => evaluation && Number(evaluation.nota) < 70);

  const milestones = [
    { id: 'proposal', tone: isRejected && String(proposal.estado || '').toLowerCase().includes('rechaz') ? 'rejected' : 'complete', label: isRejected && String(proposal.estado || '').toLowerCase().includes('rechaz') ? 'Hito 01 · Rechazado' : 'Hito 01 · Completado', title: isRejected && String(proposal.estado || '').toLowerCase().includes('rechaz') ? 'Propuesta Rechazada' : 'Propuesta Inscrita', text: isRejected && String(proposal.estado || '').toLowerCase().includes('rechaz') ? 'La evaluación de la propuesta fue rechazada.' : 'Propuesta registrada y validada por coordinación.', action: 'propuestas-inscritas' },
    { id: 'avance-1', tone: !avance1Approved && isRejected ? 'rejected' : avance1Approved ? 'complete' : 'active', label: !avance1Approved && isRejected ? 'Hito 02 · Rechazado' : avance1Approved ? 'Hito 02 · Completado' : 'Hito 02 · En curso', title: !avance1Approved && isRejected ? 'Avance 1 rechazado' : 'Entrega Avance 1', text: avance1Approved ? 'Avance 1 aprobado. Se habilitó el Avance 2.' : `${proposalDeliverables.filter((item) => item.etapa === 'Avance 1').length} versión(es) subida(s). Debe aprobarse para continuar.`, action: 'subir-entregable' },
    { id: 'avance-2', tone: avance2Approved ? 'complete' : avance1Approved ? 'active' : 'default', label: avance2Approved ? 'Hito 03 · Completado' : avance1Approved ? 'Hito 03 · En curso' : 'Hito 03 · Bloqueado', title: 'Avance 2', text: avance2Approved ? 'Avance 2 aprobado. Se habilitó el trabajo escrito final.' : 'Disponible después de aprobar el Avance 1.' },
    { id: 'defensa', tone: defenseEnabled || finalApproved ? 'complete' : avance2Approved ? 'active' : 'default', label: defenseEnabled ? 'Hito 04 · Habilitado' : finalApproved ? 'Hito 04 · Completado' : avance2Approved ? 'Hito 04 · En curso' : 'Hito 04 · Bloqueado', title: 'Examen final', text: defenseEnabled ? 'Visto bueno del co-guía y Jefatura completado. Examen final habilitado.' : finalApproved ? 'Trabajo escrito aprobado. Pendiente del visto bueno para defensa.' : 'Se habilita después de aprobar el Avance 2.' },
  ];

  const activeMilestone = milestones.find((item) => item.id === selectedMilestone) || milestones[1];

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
        <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
        <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8 md:py-7">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">▣ Seguimiento de titulación activa</div>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="max-w-xl text-xl font-black leading-tight text-[#0c1d36] md:text-2xl">{proposal.titulo}</h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                  <span>Memorista: <b>{proposal.memorista || 'Benjamín Castro'}</b></span>
                  <span>Profesor Guía: <b>{proposal.profesor || 'Dr. Mauricio Solar'}</b></span>
                  <span>Campus: <b>{proposal.campus || 'Casa Central Valparaíso'}</b></span>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={proposalId || ''}
                  onChange={(event) => {
                    setSelectedProposalId(event.target.value);
                    setSelectedMilestone('avance-1');
                  }}
                  className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-600 outline-none"
                  aria-label="Seleccionar propuesta"
                >
                  {propuestas?.length ? propuestas.map((item, index) => (
                    <option key={item.id || item._id} value={item.id || item._id}>Propuesta #{index + 1}: {item.titulo || item.tema}</option>
                  )) : <option value="">Sin propuestas registradas</option>}
                </select>
                {String(proposal.estado || '').toLowerCase().includes('rechaz') && <button onClick={() => { onSelectProposal(proposal); onNavigate('editar-propuesta'); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">Editar y reenviar</button>}
                <button onClick={() => onNavigate('subir-entregable')} className="rounded-lg bg-[#07558d] px-3 py-2 text-[10px] font-bold text-white shadow-sm hover:bg-[#064675]">↥ Subir avance PDF</button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-sm font-black">Línea de Tiempo del Proceso de Memoria</h2><p className="text-[9px] text-slate-400">Estado sincronizado en tiempo real con los tres microservicios</p></div>
              <span className={`rounded-full border px-3 py-1 text-[9px] font-bold ${isRejected ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                Etapa actual: {isRejected ? 'Rechazado' : etapaActual}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {milestones.map((milestone) => (
                <TimelineCard
                  key={milestone.id}
                  {...milestone}
                  selected={selectedMilestone === milestone.id}
                  onClick={() => setSelectedMilestone(milestone.id)}
                  onAction={milestone.action ? () => onNavigate(milestone.action) : undefined}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-3 rounded-lg bg-slate-50 p-3 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span><b className="text-[#10233f]">{activeMilestone.title}:</b> {activeMilestone.text}</span>
              {activeMilestone.action && <button onClick={() => onNavigate(activeMilestone.action)} className="font-bold text-[#07558d] hover:underline">Abrir módulo ›</button>}
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-[1.45fr_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="text-sm font-black">▣ Ficha Técnica de la Propuesta</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">Validada</span></div>
              {propuestasError && <p className="mt-3 text-xs font-semibold text-red-500">{propuestasError}</p>}
              <div className="space-y-3 pt-4 text-[10px] text-slate-600">
                <ProposalField title="Resumen ejecutivo" value={proposal.resumen} />
                <ProposalField title="Problema de ingeniería abordado" value={proposal.problema_ingenieria} />
                <ProposalField title="Objetivos" value={proposal.objetivos} />
                <div className="grid gap-2 sm:grid-cols-2"><InfoBox title="Modalidad" text={proposal.modalidad || 'Sin información'} /><InfoBox title="Bibliografía base" text={proposal.bibliografia || 'Sin información'} /></div>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="text-sm font-black">▢ Feedback Reciente de Comisión</h2></div>
              {feedbackError && <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] font-bold text-red-600">{feedbackError}</p>}
              {!feedback.length && !feedbackError && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500">Aún no hay feedback registrado para esta propuesta.</p>}
              {feedback.slice(0, showAllFeedback ? feedback.length : 2).map((item, index) => <Feedback key={`${item.author}-${index}`} {...item} />)}
              {!!feedback.length && <button onClick={() => setShowAllFeedback((visible) => !visible)} className="mt-3 w-full rounded-lg bg-slate-100 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-200">{showAllFeedback ? 'Ocultar feedback anterior' : 'Mostrar feedback anterior'} </button>}
              <button onClick={() => onNavigate('propuestas-inscritas')} className="mt-2 w-full rounded-lg bg-[#07558d] py-2 text-[10px] font-bold text-white hover:bg-[#064675]">Ver historial completo de entregables y notas ›</button>
            </section>
          </div>
        </main>
    </div>
  );
}

function TimelineCard({ tone = 'default', label, title, text, selected, onClick, onAction }) {
  const styles = { complete: 'border-emerald-300 bg-emerald-50', active: 'border-[#07558d] bg-[#07558d] text-white shadow-md', rejected: 'border-red-300 bg-red-50 text-red-900 shadow-sm' };
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onAction}
      className={`min-h-[90px] rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${styles[tone] || 'border-slate-200 bg-slate-50'} ${selected ? 'ring-2 ring-sky-300 ring-offset-1' : ''}`}
      title={onAction ? 'Haz doble clic para abrir este módulo' : 'Seleccionar hito'}
    >
      <div className={`mb-2 text-[9px] font-black uppercase tracking-wide ${tone === 'complete' ? 'text-emerald-600' : tone === 'active' ? 'text-amber-300' : tone === 'rejected' ? 'text-red-600' : 'text-slate-400'}`}>{label}</div>
      <h3 className="text-xs font-black">{title}</h3>
      <p className={`mt-1 text-[9px] leading-tight ${tone === 'active' ? 'text-sky-100' : tone === 'rejected' ? 'text-red-700' : 'text-slate-500'}`}>{text}</p>
    </button>
  );
}

function InfoBox({ title, text }) { return <div className="rounded-lg bg-slate-50 p-3"><b className="block text-[9px] uppercase text-slate-400">{title}</b><span>{text}</span></div>; }

function ProposalField({ title, value }) {
  return <div><b className="mb-1 block text-[9px] uppercase text-slate-400">{title}</b><p>{value || 'Sin información registrada.'}</p></div>;
}

function Feedback({ author, role, text, score, date }) {
  return <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-[10px] text-slate-600"><div className="flex justify-between font-black text-slate-700"><span>{author || 'Evaluador'}</span><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[8px] text-sky-700">{role}</span></div><p className="mt-1 leading-relaxed">{text}</p><small className="text-[8px] text-slate-400">{date ? new Date(date).toLocaleString('es-CL') : 'Fecha no disponible'}{score !== undefined && score !== null ? ` · Nota: ${score}/100` : ''}</small></div>;
}

export default MemoristaHome;
