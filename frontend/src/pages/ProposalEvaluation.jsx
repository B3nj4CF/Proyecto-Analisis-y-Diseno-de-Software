import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { API_TRAMITACION_URL, crearComentarioEntregable, crearEvaluacion, crearEvaluacionPropuesta, listarComentariosEntregable } from '../lib/api';

function ProposalEvaluation({
  formData,
  selectedDeliverable,
  onNavigate,
  currentView,
  onDeliverableEvaluated,
  onProposalEvaluated,
}) {
  const [nota, setNota] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [confirmacionReprobacion, setConfirmacionReprobacion] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [reviewRole, setReviewRole] = useState(
    selectedDeliverable?.rol_evaluacion || (selectedDeliverable?.tipo === 'propuesta' ? 'Profesor Guía' : 'Correferente'),
  );

  const fileName = selectedDeliverable?.nombre_archivo || 'Documento sin nombre.pdf';
  const isProposal = selectedDeliverable?.tipo === 'propuesta';
  const proposalFileUrl = isProposal
    ? `${API_TRAMITACION_URL}/api/propuestas/${selectedDeliverable.id}/archivo`
    : null;

  async function addComment(event) {
    event.preventDefault();
    if (!newComment.trim()) return;
    if (isProposal) {
      const observation = newComment.trim();
      setComentarios((current) => current ? `${current}\n${observation}` : observation);
      setComments((current) => [...current, {
        author: 'Cristobal Cordova',
        role: reviewRole,
        text: observation,
      }]);
      setNewComment('');
      return;
    }
    if (!selectedDeliverable?.id) return;
    setIsCommentSubmitting(true);
    setError('');
    try {
      const comment = await crearComentarioEntregable(selectedDeliverable.id, {
        autor_nombre: 'Cristobal Cordova',
        rol: reviewRole,
        contenido: newComment.trim(),
      });
      setComments((current) => [...current, {
        author: comment.autor_nombre,
        role: comment.rol,
        text: comment.contenido,
      }]);
      setNewComment('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsCommentSubmitting(false);
    }
  }

  useEffect(() => {
    let active = true;
    setReviewRole(selectedDeliverable?.rol_evaluacion || (selectedDeliverable?.tipo === 'propuesta' ? 'Profesor Guía' : 'Correferente'));
    if (!selectedDeliverable?.id || selectedDeliverable.tipo === 'propuesta') return () => { active = false; };
    listarComentariosEntregable(selectedDeliverable.id).then((items) => {
      if (active) setComments(items.map((item) => ({ author: item.autor_nombre, role: item.rol, text: item.contenido })));
    }).catch((loadError) => {
      if (active) setError(loadError.message);
    });
    return () => { active = false; };
  }, [selectedDeliverable]);

  async function handleSubmit(event) {
    event.preventDefault();
    const numericNota = Number(nota);
    if (!selectedDeliverable) return setError('No hay un documento asociado para evaluar.');
    if (!nota || numericNota < 0 || numericNota > 100) return setError('Ingresa una nota entre 0 y 100.');
    if (!comentarios.trim()) return setError('Ingresa la retroalimentación.');
    if (numericNota < 70 && !confirmacionReprobacion) return setError('Debes confirmar explícitamente la reprobación para una nota menor a 70.');

    setIsSubmitting(true);
    setError('');
    try {
      const datosEvaluacion = {
        evaluador_nombre: `${reviewRole}: Cristobal Cordova`,
        nota: numericNota,
        comentarios,
        confirmacion_reprobacion: confirmacionReprobacion,
      };
      if (isProposal) {
        const evaluacion = await crearEvaluacionPropuesta(selectedDeliverable.id, datosEvaluacion);
        onProposalEvaluated(selectedDeliverable.id, evaluacion.estado_propuesta);
      } else {
        await crearEvaluacion(selectedDeliverable.id, datosEvaluacion);
        onDeliverableEvaluated(selectedDeliverable.id, selectedDeliverable.propuesta_id);
      }
      onNavigate('propuestas-asignadas');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <button type="button" onClick={() => onNavigate('propuestas-asignadas')} className="mb-4 text-xs font-bold text-slate-500 hover:text-[#07558d]">← Volver a Memorias Asignadas</button>
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.85fr]">
          <PdfViewer fileName={fileName} stage={selectedDeliverable?.etapa || 'Avance 1'} fileUrl={proposalFileUrl} />
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black">▢ Comentarios de Revisión <span className="text-slate-500">(HU-05 / HU-06)</span></h2>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {comments.length
                  ? comments.map((comment, index) => <Comment key={`${comment.author}-${index}`} {...comment} />)
                  : <p className="rounded-lg bg-slate-50 p-4 text-center text-[10px] text-slate-400">Aún no hay comentarios de revisión para este documento.</p>}
              </div>
              <form onSubmit={addComment} className="mt-3 flex gap-2">
                <select value={reviewRole} onChange={(event) => setReviewRole(event.target.value)} className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[9px] font-bold text-slate-600" aria-label="Rol del comentario">
                  <option>Profesor Guía</option>
                  <option>Co-guía / Mentor</option>
                  <option>Correferente</option>
                </select>
                <input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Escribe una observación sobre el PDF..." className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] outline-none focus:border-sky-500" />
                <button type="submit" disabled={isCommentSubmitting} className="rounded-lg bg-[#07558d] px-3 text-white hover:bg-[#064675] disabled:opacity-50" aria-label="Publicar comentario">{isCommentSubmitting ? '...' : '➤'}</button>
              </form>
            </section>

            <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black">{isProposal ? 'Revisar propuesta inicial' : 'Evaluar trabajo escrito o avance'} <span className="text-slate-500">(Escala 0 - 100)</span></h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[9px] font-black uppercase text-slate-500">Evaluador<input value="Dr. Mauricio Solar" readOnly className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700" /></label>
                <label className="text-[9px] font-black uppercase text-slate-500">Nota (0 a 100)<input type="number" min="0" max="100" value={nota} onChange={(event) => setNota(event.target.value)} placeholder="88" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-sky-500" /></label>
              </div>
              <label className="mt-3 block text-[9px] font-black uppercase text-slate-500">Dictamen y retroalimentación de evaluación<textarea rows="3" value={comentarios} onChange={(event) => setComentarios(event.target.value)} placeholder="Justificación de la nota asignada a este avance..." className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[10px] outline-none focus:border-sky-500" /></label>
              {Number(nota) < 70 && nota && <label className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-[9px] font-bold text-red-700"><input type="checkbox" checked={confirmacionReprobacion} onChange={(event) => setConfirmacionReprobacion(event.target.checked)} /> Confirmo la calificación de reprobación</label>}
              {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] font-bold text-red-600">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-[10px] font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">{isSubmitting ? 'Guardando evaluación...' : 'Guardar evaluación'}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function PdfViewer({ fileName, stage, fileUrl }) {
  return (
    <section className="rounded-2xl bg-[#0f172a] p-4 text-white shadow-lg">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
        <span className="rounded-lg bg-rose-900/60 p-2 text-xl text-rose-400">▤</span>
        <div className="min-w-0"><p className="text-[9px] font-bold text-amber-400">{stage}</p><h1 className="truncate text-sm font-black">{fileName}</h1></div>
        <span className="ml-auto rounded bg-slate-800 px-2 py-1 text-[9px] text-slate-300">PDF</span>
      </div>
      <div className="mt-4 min-h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        {fileUrl ? <iframe title={`Vista previa de ${fileName}`} src={fileUrl} className="h-[520px] w-full" /> : <PdfPlaceholder fileName={fileName} />}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3 text-[9px] text-slate-400">
        <span>Documento asociado a {stage}</span>
        {fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" className="font-bold text-amber-400 hover:underline">⇩ Descargar PDF original</a> : <span>Vista previa no disponible para este archivo</span>}
      </div>
    </section>
  );
}

function PdfPlaceholder({ fileName }) {
  return <div className="flex h-[360px] flex-col items-center justify-center bg-slate-50 p-8 text-center text-slate-500"><span className="text-5xl text-rose-300">▤</span><h2 className="mt-3 text-sm font-black text-slate-700">{fileName}</h2><p className="mt-2 max-w-xs text-[10px]">El archivo de avance está registrado.</p></div>;
}

function Comment({ author, role, text }) {
  return <article className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-[10px] text-slate-600"><div className="flex justify-between gap-2 font-black text-slate-700"><span>{author}</span><span className="rounded bg-sky-100 px-2 py-0.5 text-[8px] text-sky-700">{role}</span></div><p className="mt-1 leading-relaxed">{text}</p></article>;
}

export default ProposalEvaluation;
