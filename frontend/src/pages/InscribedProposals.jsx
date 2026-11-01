import Navbar from '../components/Navbar';

function InscribedProposals({propuestas, propuestasError, onNavigate, currentView}) {
  return (
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center">
        <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
        <div className="mt-10 md:mt-16 w-full max-w-4xl px-4">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-6">Propuestas Inscritas</h2>
            {propuestasError && <p className="text-red-300 font-bold mb-4">{propuestasError}</p>}
            <div className="flex flex-col gap-6">
                {propuestas.map((propuesta) => (
                    <div key={propuesta.id} className="bg-[#27272a] rounded-2xl p-6 md:p-8 shadow-lg border border-gray-600 relative">
                        <div className="absolute -top-3 left-6 md:left-8 bg-[#eab308] text-white font-bold text-[10px] px-3 py-1 rounded-full">
                            {propuesta.estado}
                        </div>
                        <h3 className="text-white text-lg md:text-xl font-bold mt-4 mb-4">{propuesta.titulo}</h3>
                        <div className="text-gray-300 text-sm space-y-1 mb-6">
                            <p><span className="font-bold text-white">Memorista:</span> {propuesta.memorista} / <span className="font-bold text-white">RUT:</span> {propuesta.rut}</p>
                            <p><span className="font-bold text-white">Profesor Guia:</span> {propuesta.profesor}</p>
                            <p><span className="font-bold text-white">Campus:</span> {propuesta.campus} / <span className="font-bold text-white">Modalidad:</span> {propuesta.modalidad}</p>
                            <p className="text-xs text-gray-500 mt-4">Ficha de inscripcion para iniciar formalmente el proceso de trabajo de titulo</p>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-600 pt-4 gap-4 md:gap-0">
                            <button className="bg-[#52525b] text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition text-xs">
                                Ver informacion de la inscripción
                            </button>
                            <span className="text-gray-400 text-xs">
                                Enviada el {new Date(propuesta.fecha_creacion).toLocaleString('es-CL')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={() => onNavigate('crear-propuesta')} className="bg-[#0ea5e9] text-white font-bold py-2 px-6 rounded-full hover:bg-blue-500 transition flex items-center gap-2 text-sm">
                    <span>+</span> Crear Nueva Propuesta
                </button>
            </div>
        </div>
    </div>
  );
}

export default InscribedProposals;
