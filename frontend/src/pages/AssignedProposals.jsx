import Navbar from '../components/Navbar';

const CORREFERENTE_ACTUAL = 'Cristobal Cordova';

function AssignedProposals({propuestas, propuestasError, entregables, setFormData, onNavigate, currentView, onSelectDeliverable}) {
  const propuestasAsignadas = propuestas.filter(
    (propuesta) => propuesta.profesor === CORREFERENTE_ACTUAL,
  );

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
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center">
        <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
        <div className="mt-10 md:mt-16 w-full max-w-4xl px-4">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-6">Propuestas Asignadas</h2>
            {propuestasError && <p className="text-red-300 font-bold mb-4">{propuestasError}</p>}
            {propuestasAsignadas.length === 0 && !propuestasError && (
                <div className="bg-[#27272a] rounded-2xl p-6 border border-gray-600 text-gray-300">
                    No hay propuestas asignadas a {CORREFERENTE_ACTUAL}.
                </div>
            )}
            <div className="flex flex-col gap-6">
                {propuestasAsignadas.map((propuesta) => (
                    <div key={propuesta.id} className="bg-[#27272a] rounded-2xl p-6 md:p-8 shadow-lg border border-gray-600 relative">
                        {(() => {
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
                        <div className="absolute -top-3 left-6 md:left-8 bg-[#eab308] text-white font-bold text-[10px] px-3 py-1 rounded-full">
                            {propuesta.estado}
                        </div>
                        <h3 className="text-white text-lg md:text-xl font-bold mt-4 mb-4">{propuesta.titulo}</h3>
                        <div className="text-gray-300 text-sm space-y-1 mb-6">
                            <p><span className="font-bold text-white">Memorista:</span> {propuesta.memorista} / <span className="font-bold text-white">RUT:</span> {propuesta.rut}</p>
                            <p><span className="font-bold text-white">Profesor Guia:</span> {propuesta.profesor}</p>
                            <p><span className="font-bold text-white">Campus:</span> {propuesta.campus} / <span className="font-bold text-white">Modalidad:</span> {propuesta.modalidad}</p>
                            <p className="text-xs text-gray-500 mt-4">Ficha de evaluación de trabajo de titulo</p>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-600 pt-4 gap-4 md:gap-0">
                            <button onClick={() => documento && openEvaluation(propuesta, documento)} disabled={!documento} className="bg-[#3f3f46] text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                                Subir Obserciones / Calificacion
                            </button>
                            {!documento && <span className="text-gray-500 text-xs">Sin documento disponible</span>}
                            <span className="text-gray-400 text-xs">
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
