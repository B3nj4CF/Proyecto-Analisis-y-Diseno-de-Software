import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getStatusColorClass } from '../lib/status';
import { listarEvaluacionesPropuesta } from '../lib/api';

const CORREFERENTE_ACTUAL = 'Cristobal Cordova';

function AssignedProposals({propuestas, propuestasError, entregables, setFormData, onNavigate, currentView, onSelectDeliverable}) {
  const [evaluaciones, setEvaluaciones] = useState({});
  const [evaluacionesError, setEvaluacionesError] = useState('');
  const propuestasAsignadas = propuestas.filter(
    (propuesta) => propuesta.profesor === CORREFERENTE_ACTUAL,
  );
  const entregablesPendientes = entregables.filter(
    (entregable) => entregable.estado === 'Pendiente de Revisión',
  );

  useEffect(() => {
    let active = true;
    const propuestasConId = propuestasAsignadas.filter((propuesta) => propuesta.id || propuesta._id);
    if (!propuestasConId.length) {
      setEvaluaciones({});
      return () => { active = false; };
    }

    Promise.all(propuestasConId.map(async (propuesta) => [
      String(propuesta.id || propuesta._id),
      await listarEvaluacionesPropuesta(propuesta.id || propuesta._id),
    ])).then((entries) => {
      if (active) {
        setEvaluaciones(Object.fromEntries(entries));
        setEvaluacionesError('');
      }
    }).catch((error) => active && setEvaluacionesError(error.message));

    return () => { active = false; };
  }, [propuestas]);

  function openEvaluation(propuesta, documento) {
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

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
        <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
        <div className="mx-auto mt-8 w-full max-w-4xl px-4">
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Memorias asignadas</p><h2 className="mt-1 text-2xl font-black text-[#0c1d36]">Bandeja de evaluación</h2></div>
            {propuestasError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{propuestasError}</p>}
            {evaluacionesError && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-800">{evaluacionesError}</p>}
            {entregablesPendientes.length > 0 && (
                <div role="alert" className="bg-[#fef3c7] text-[#92400e] rounded-2xl p-4 mb-6 border border-[#f59e0b]">
                    <p className="font-bold">Nuevo documento pendiente de revisión</p>
                    <p className="text-sm">
                        El memorista envió {entregablesPendientes.length === 1 ? 'un avance' : `${entregablesPendientes.length} avances`}.
                        Revisa la propuesta asignada para ver los documentos.
                    </p>
                </div>
            )}
            {propuestasAsignadas.length === 0 && !propuestasError && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                    No hay propuestas asignadas a {CORREFERENTE_ACTUAL}.
                </div>
            )}
            <div className="flex flex-col gap-6">
                {propuestasAsignadas.map((propuesta) => (
                    <div key={propuesta.id} className="relative rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                        {(() => {
                            const propuestaId = String(propuesta.id || propuesta._id);
                            const ultimaEvaluacion = evaluaciones[propuestaId]?.at(-1);
                            const estadoEvaluacion = ultimaEvaluacion
                                ? Number(ultimaEvaluacion.nota) >= 70 ? 'Aprobada por Guía' : 'Rechazada por Guía'
                                : propuesta.estado || 'Pendiente de evaluación';
                            const entregable = entregables.filter((item) => String(item.propuesta_id) === String(propuesta.id)).at(-1);
                            const documento = entregable || (propuesta.ruta_archivo ? {
                                id: propuesta.id,
                                propuesta_id: propuesta.id,
                                nombre_archivo: propuesta.nombre_archivo,
                                ruta_archivo: propuesta.ruta_archivo,
                                tipo: 'propuesta',
                            } : null);
                            return (
                                <>
                        <div className={`absolute -top-3 left-6 md:left-8 ${getStatusColorClass(estadoEvaluacion)} text-white font-bold text-[10px] px-3 py-1 rounded-full`}>
                            {estadoEvaluacion}
                        </div>
                        <h3 className="text-[#0c1d36] text-lg md:text-xl font-black mt-4 mb-4">{propuesta.titulo}</h3>
                        <div className="text-slate-600 text-sm space-y-1 mb-6">
                            <p><span className="font-bold text-slate-800">Memorista:</span> {propuesta.memorista} / <span className="font-bold text-slate-800">RUT:</span> {propuesta.rut}</p>
                            <p><span className="font-bold text-slate-800">Profesor Guía:</span> {propuesta.profesor}</p>
                            <p><span className="font-bold text-slate-800">Campus:</span> {propuesta.campus} / <span className="font-bold text-slate-800">Modalidad:</span> {propuesta.modalidad}</p>
                            <p className="text-xs text-slate-400 mt-4">Ficha de evaluación de trabajo de título</p>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-slate-100 pt-4 gap-4 md:gap-0">
                            <button onClick={() => documento && openEvaluation(propuesta, documento)} disabled={!documento} className="bg-[#07558d] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#064675] transition text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                                Subir Obserciones / Calificacion
                            </button>
                            {!documento && <span className="text-slate-400 text-xs">Sin documento disponible</span>}
                            <span className="text-slate-400 text-xs">
                                Enviada el {new Date(propuesta.fecha_creacion).toLocaleString('es-CL')}
                            </span>
                        </div>
                                </>
                            );
                        })()}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default AssignedProposals;
