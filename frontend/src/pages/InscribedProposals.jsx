import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getStatusColorClass } from '../lib/status';
import { listarHistorialEntregables, eliminarEntregable } from '../lib/api';

// onDeliverableDeleted (opcional): el componente padre puede usarlo para refrescar su lista `entregables`.
function InscribedProposals({ propuestas, propuestasError, entregables = [], entregablesError, onNavigate, currentView, onSelectProposal, onDeliverableDeleted }) {
  const [histories, setHistories] = useState({});
  const [historyError, setHistoryError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { propuesta, entregable }
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const proposalsWithId = (propuestas || []).filter((propuesta) => propuesta.id || propuesta._id);
    if (!proposalsWithId.length) return () => { active = false; };

    Promise.all(proposalsWithId.map(async (propuesta) => [
      String(propuesta.id || propuesta._id),
      await listarHistorialEntregables(propuesta.id || propuesta._id),
    ])).then((entries) => {
      if (active) setHistories(Object.fromEntries(entries));
    }).catch((error) => {
      if (active) setHistoryError(error.message);
    });

    return () => { active = false; };
  }, [propuestas]);

  const requestDelete = (propuesta, entregable) => {
    setDeleteError('');
    setNotice('');
    setDeleteTarget({ propuesta, entregable });
  };

  const cancelDelete = () => {
    if (!deleting) setDeleteTarget(null);
  };

  // HU-11: eliminar documento subido por error y actualizar el historial
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    const { propuesta, entregable } = deleteTarget;
    const key = String(propuesta.id || propuesta._id);

    setDeleting(true);
    setDeleteError('');
    try {
      await eliminarEntregable(entregable.id);
    } catch (error) {
      setDeleteError(error.message);
      setDeleting(false);
      return;
    }

    // Quita el documento de inmediato de la lista
    setHistories((previous) => ({
      ...previous,
      [key]: (previous[key] || entregables.filter((item) => String(item.propuesta_id) === key))
        .filter((item) => item.id !== entregable.id),
    }));
    setDeleteTarget(null);
    setDeleting(false);
    setNotice(`Se eliminó "${entregable.nombre_archivo || 'el documento'}" (${entregable.etapa || 'Avance'}).`);
    if (onDeliverableDeleted) onDeliverableDeleted(entregable.id, key);

    // Re-sincroniza el historial con el servidor
    try {
      const fresh = await listarHistorialEntregables(key);
      setHistories((previous) => ({ ...previous, [key]: fresh }));
    } catch {
      // Se mantiene la lista ya filtrada
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
        <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
        <div className="mx-auto mt-8 w-full max-w-4xl px-4">
            {propuestasError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{propuestasError}</p>}
            {(entregablesError || historyError) && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-800">{entregablesError || historyError}</p>}
            {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{notice}</p>}
            <section className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div><h2 className="text-xl font-black text-[#0c1d36]">Mis Entregables y Calificaciones</h2><p className="text-[10px] text-slate-500">Historial de documentos de la propuesta activa</p></div>
                <button onClick={() => onNavigate('subir-entregable')} className="rounded-lg bg-[#07558d] px-4 py-2 text-[10px] font-bold text-white hover:bg-[#064675]">↥ Subir nuevo avance</button>
            </section>
            <div className="flex flex-col gap-4">
                {propuestas.map((propuesta) => (
                    <div key={propuesta.id} className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className={`absolute -top-3 left-6 ${getStatusColorClass(propuesta.estado)} text-white font-bold text-[10px] px-3 py-1 rounded-full`}>
                            {propuesta.estado}
                        </div>
                        <h3 className="mt-4 mb-4 text-lg font-black text-[#0c1d36]">{propuesta.titulo}</h3>
                        <div className="mb-6 space-y-1 text-sm text-slate-600">
                            <p><span className="font-bold text-slate-800">Memorista:</span> {propuesta.memorista} / <span className="font-bold text-slate-800">RUT:</span> {propuesta.rut}</p>
                            <p><span className="font-bold text-slate-800">Profesor Guía:</span> {propuesta.profesor}</p>
                            <p><span className="font-bold text-slate-800">Campus:</span> {propuesta.campus} / <span className="font-bold text-slate-800">Modalidad:</span> {propuesta.modalidad}</p>
                            <p className="mt-4 text-xs text-slate-400">Ficha de inscripción para iniciar formalmente el proceso de trabajo de título</p>
                        </div>
                        <DeliverableHistory
                            propuesta={propuesta}
                            history={histories[String(propuesta.id || propuesta._id)] || entregables.filter((item) => String(item.propuesta_id) === String(propuesta.id))}
                            onDelete={(entregable) => requestDelete(propuesta, entregable)}
                        />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-slate-100 pt-4 gap-4 md:gap-0">
                            <button
                                type="button"
                                onClick={() => {
                                    onSelectProposal(propuesta);
                                    onNavigate('detalle-propuesta');
                                }}
                                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                                Ver información de la inscripción
                            </button>
                            <span className="text-slate-400 text-xs">
                                Enviada el {new Date(propuesta.fecha_creacion).toLocaleString('es-CL')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={() => onNavigate('crear-propuesta')} className="rounded-lg bg-[#07558d] px-6 py-2 font-bold text-white hover:bg-[#064675] transition flex items-center gap-2 text-sm">
                    <span>+</span> Crear Nueva Propuesta
                </button>
            </div>
        </div>
        {deleteTarget && (
            <DeleteDeliverableModal
                entregable={deleteTarget.entregable}
                deleting={deleting}
                error={deleteError}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        )}
    </div>
  );
}

function DeliverableHistory({ propuesta, history, onDelete }) {
    if (!history.length) {
        return <div className="mb-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">Aún no hay avances cargados para esta propuesta.</div>;
    }

    return (
        <div className="mb-4 space-y-3">
            {[...history]
                .sort((first, second) => new Date(second.fecha_subida || 0) - new Date(first.fecha_subida || 0))
                .map((entregable) => {
                const evaluation = entregable.evaluaciones?.at(-1);
                const evaluated = Boolean(evaluation) || ['Revisado', 'Evaluado'].includes(entregable.estado);
                // HU-11: solo se puede eliminar mientras no haya sido revisado (misma regla que el backend)
                const canDelete = !evaluated && entregable.estado === 'Pendiente de Revisión';
                return (
                    <article key={entregable.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold text-sky-700">{entregable.etapa || 'Avance'}</span>
                                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${evaluated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{evaluated ? 'Evaluado' : 'En Revisión'}</span>
                                    <span className="text-[9px] text-slate-400">{formatDate(entregable.fecha_subida)}</span>
                                </div>
                                <h3 className="mt-2 truncate text-sm font-black text-[#0c1d36]" title={entregable.nombre_archivo}>▧ {entregable.nombre_archivo || 'Documento PDF'}</h3>
                                <p className="mt-1 text-[9px] text-slate-500">Propuesta asociada: {propuesta.titulo}</p>
                                {canDelete && onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(entregable)}
                                        className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700 transition hover:bg-red-100"
                                    >
                                        Eliminar documento
                                    </button>
                                )}
                            </div>
                            <div className="min-w-[155px] rounded-lg bg-slate-50 p-3 text-center">
                                {evaluation ? <><p className="text-[9px] font-bold uppercase text-slate-400">Calificación oficial</p><p className="text-2xl font-black text-[#07558d]">{evaluation.nota} <span className="text-xs font-normal text-slate-400">/ 100</span></p><p className="text-[9px] text-emerald-600">Evaluado por {evaluation.evaluador_nombre}</p></> : <><p className="text-xs font-black text-slate-700">◷ Pendiente de nota</p><p className="mt-1 text-[9px] text-slate-400">El profesor guía o correferente aún está evaluando este PDF.</p></>}
                            </div>
                        </div>
                        {evaluation?.comentarios && <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-[9px] font-black uppercase text-slate-400">Comentarios de revisión</p><div className="mt-2 rounded-lg bg-slate-50 p-3 text-[10px] text-slate-600"><b>{evaluation.evaluador_nombre}</b><p className="mt-1">{evaluation.comentarios}</p><small className="text-[8px] text-slate-400">{formatDate(evaluation.fecha_evaluacion)}</small></div></div>}
                    </article>
                );
                })}
        </div>
    );
}

function DeleteDeliverableModal({ entregable, deleting, error, onConfirm, onCancel }) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onCancel]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-deliverable-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            onClick={onCancel}
        >
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 id="delete-deliverable-title" className="text-lg font-black text-[#0c1d36]">¿Eliminar este documento?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Se eliminará <b className="break-all">{entregable.nombre_archivo || 'el documento PDF'}</b> ({entregable.etapa || 'Avance'}) junto con el archivo almacenado.
                    Esta acción no se puede deshacer; tendrás que volver a subirlo si lo necesitas.
                </p>
                {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={deleting}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function formatDate(value) {
    return value ? new Date(value).toLocaleString('es-CL') : 'Fecha no disponible';
}

export default InscribedProposals;
