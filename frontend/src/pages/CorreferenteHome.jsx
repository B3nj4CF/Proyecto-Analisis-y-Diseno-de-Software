import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { listarEvaluacionesPropuesta, listarHistorialEntregables } from '../lib/api';
import { consultarVistosBuenos, otorgarVistoBueno } from '../lib/reportes';

const CORREFERENTE_ACTUAL = 'Cristobal Cordova';

function CorreferenteHome({
  propuestas = [],
  propuestasError,
  entregables = [],
  onNavigate,
  currentView,
  setFormData,
  onSelectDeliverable,
  onProposalEvaluated,
}) {
  const [filter, setFilter] = useState('Todos');
  const [histories, setHistories] = useState({});
  const [proposalEvaluations, setProposalEvaluations] = useState({});
  const [approvedForDefense, setApprovedForDefense] = useState({});
  const [approvals, setApprovals] = useState({});
  const [approvalError, setApprovalError] = useState('');
  const [historyError, setHistoryError] = useState('');

  const assignedProposals = useMemo(
    () => propuestas.filter((propuesta) => propuesta.profesor === CORREFERENTE_ACTUAL),
    [propuestas],
  );

  useEffect(() => {
    let active = true;
    setHistoryError('');
    if (!assignedProposals.length) {
      setHistories({});
      setProposalEvaluations({});
      return () => { active = false; };
    }

    Promise.all(assignedProposals.map(async (propuesta) => {
      const id = propuesta.id || propuesta._id;
      try {
        const [history, evaluations] = await Promise.all([
          listarHistorialEntregables(id),
          listarEvaluacionesPropuesta(id),
        ]);
        const vistosBuenos = await consultarVistosBuenos(id);
        return { id: String(id), history, evaluations, vistosBuenos };
      } catch (error) {
        throw new Error(`No se pudo cargar el historial de ${propuesta.titulo}: ${error.message}`);
      }
    })).then((entries) => {
      if (active) {
        setHistories(Object.fromEntries(entries.map(({ id, history }) => [id, history])));
        setProposalEvaluations(Object.fromEntries(entries.map(({ id, evaluations }) => [id, evaluations])));
        setApprovals(Object.fromEntries(entries.map(({ id, vistosBuenos }) => [id, vistosBuenos])));
      }
    }).catch((error) => {
      if (active) setHistoryError(error.message);
    });

    return () => { active = false; };
  }, [assignedProposals, currentView]);

  const rows = assignedProposals.flatMap((propuesta) => {
    const proposalId = propuesta.id || propuesta._id;
    const history = histories[String(proposalId)] || [];
    const proposalDeliverables = entregables.filter(
      (item) => String(item.propuesta_id || item.propuestaId) === String(proposalId),
    );
    const documents = history.length
      ? history
      : proposalDeliverables;
    const proposalDocument = [{
      id: proposalId,
      propuesta_id: proposalId,
      nombre_archivo: propuesta.nombre_archivo || 'Documento de propuesta.pdf',
      tipo: 'propuesta',
      etapa: 'Propuesta',
      estado: propuesta.estado,
    }];

    return [proposalDocument[0], ...documents].map((document) => {
      const historyItem = history.find((item) => String(item.id) === String(document.id));
      const evaluations = document.tipo === 'propuesta'
        ? proposalEvaluations[String(proposalId)] || []
        : historyItem?.evaluaciones || document.evaluaciones || [];
      const evaluation = evaluations.at(-1);
      return {
        propuesta,
        document: {
          ...document,
          nota: evaluation?.nota,
          comentarios: evaluation?.comentarios,
          evaluacion: evaluation,
          rol_evaluacion: document.tipo === 'propuesta' ? 'Profesor Guía' : 'Correferente',
          estado: evaluation
            ? Number(evaluation.nota) >= 70 ? 'Aprobada por Guía' : 'Rechazada por Guía'
            : document.estado,
        },
      };
    });
  });

  const filteredRows = rows.filter(({ document }) => {
    const evaluated = document?.nota !== undefined && document?.nota !== null
      || document?.estado === 'Revisado'
      || document?.estado === 'Evaluado';
    if (filter === 'En Revisión') return !evaluated;
    if (filter === 'Evaluado') return evaluated;
    return true;
  });

  function openEvaluation(propuesta, documento) {
    if (!documento) return;
    setFormData({
      memorista: propuesta.memorista,
      rut: propuesta.rut,
      rolUsm: propuesta.rol_usm,
      celular: propuesta.celular,
      campus: propuesta.campus,
      modalidad: propuesta.modalidad,
      profesor: propuesta.profesor,
      tema: propuesta.titulo,
      resumen: propuesta.resumen,
      objetivos: propuesta.objetivos,
      problema: propuesta.problema_ingenieria,
      referencias: propuesta.bibliografia,
    });
    onSelectDeliverable(documento);
    onNavigate('evaluacion-propuesta');
  }

  async function approveForDefense(propuesta) {
    setApprovalError('');
    try {
      await otorgarVistoBueno(propuesta.id || propuesta._id, 'co-guia');
      setApprovedForDefense((current) => ({ ...current, [String(propuesta.id || propuesta._id)]: true }));
      setApprovals((current) => ({
        ...current,
        [String(propuesta.id || propuesta._id)]: { ...(current[String(propuesta.id || propuesta._id)] || {}), co_guia: true },
      }));
    } catch (error) {
      setApprovalError(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 md:px-8 md:py-7">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Panel docente · guía y correferencia</p>
              <h1 className="mt-1 text-xl font-black text-[#0c1d36] md:text-2xl">Bandeja de Revisión Académica</h1>
            </div>
            <div className="flex gap-2 rounded-lg bg-slate-50 p-1" role="tablist" aria-label="Filtrar entregables">
              {['Todos', 'En Revisión', 'Evaluado'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${filter === option ? 'bg-[#07558d] text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                  role="tab"
                  aria-selected={filter === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>

        {propuestasError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">{propuestasError}</p>}
        {historyError && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">{historyError}</p>}
        {approvalError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">{approvalError}</p>}
        {rows.some(({ document }) => document?.estado === 'Pendiente de Revisión') && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <b>Hay documentos pendientes de revisión.</b> Selecciona una fila para registrar calificación y retroalimentación.
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          {filteredRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2">
              {rows.length === 0 ? `No hay propuestas asignadas a ${CORREFERENTE_ACTUAL}.` : 'No hay registros para este filtro.'}
            </div>
          ) : filteredRows.map(({ propuesta, document }) => (
            <ReviewCard
              key={`${propuesta.id}-${document.id}-${document.etapa}`}
              propuesta={propuesta}
              document={document}
              approvedForDefense={approvedForDefense[String(propuesta.id || propuesta._id)]}
              approvals={approvals[String(propuesta.id || propuesta._id)]}
              onReview={() => openEvaluation(propuesta, document)}
              onApprove={() => approveForDefense(propuesta)}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

function ReviewCard({ propuesta, document, approvedForDefense, approvals, onReview, onApprove }) {
  const isEvaluated = document?.nota !== undefined && document?.nota !== null
    || document?.estado === 'Revisado'
    || document?.estado === 'Evaluado';
  const score = document?.nota ?? document?.calificacion;
  const documentName = document?.nombre_archivo || 'Sin documento disponible';
  const stage = document?.etapa || (document?.tipo === 'propuesta' ? 'Propuesta' : 'Avance 1');
  const isProposal = document?.tipo === 'propuesta';
  const isFinal = document?.etapa?.trim().toLowerCase() === 'trabajo escrito final';
  const isDefenseReady = approvedForDefense || propuesta.estado === 'Habilitado para Defensa';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div><p className="text-xs font-black text-[#10233f]">{propuesta.memorista || 'Sin nombre'}</p><p className="text-[9px] text-slate-400">{propuesta.rut || 'RUT no informado'}</p></div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${isEvaluated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{isEvaluated ? 'Evaluado' : 'En Revisión'}</span>
      </div>
      <h3 className="mt-3 truncate text-sm font-black text-[#0c1d36]" title={propuesta.titulo}>{propuesta.titulo}</h3>
      <p className="mt-1 text-[9px] text-slate-500">{propuesta.campus || 'Campus no informado'}</p>
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold text-sky-700">{stage}</span><span className="text-[9px] font-bold text-slate-400">Actualización individual</span></div>
        <p className="mt-2 truncate text-[10px] font-semibold text-slate-700" title={documentName}>▧ {documentName}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div><p className="text-[9px] uppercase text-slate-400">Calificación</p><p className="text-lg font-black text-[#10233f]">{score !== undefined && score !== null ? `${score} / 100` : '-- / 100'}</p></div>
        <button type="button" onClick={onReview} disabled={!document} className="rounded-lg bg-[#07558d] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#064675] disabled:cursor-not-allowed disabled:opacity-40">◉ Revisar y evaluar</button>
      </div>
      {isFinal && (
        <button
          type="button"
          onClick={onApprove}
          disabled={!isEvaluated || Number(score) < 70 || approvals?.co_guia || approvals?.jefe_carrera}
          className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approvals?.jefe_carrera ? 'Examen final habilitado' : approvals?.co_guia ? 'Visto bueno del co-guía registrado' : 'Registrar visto bueno del co-guía'}
        </button>
      )}
    </article>
  );
}

export default CorreferenteHome;
