import Navbar from '../components/Navbar';

function AvailableProposals({propuestasLista, formData, setFormData, onNavigate, currentView}) {
  return (
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center pb-10">
        <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
        <div className="mt-8 md:mt-10 w-full max-w-5xl px-4">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-6 md:mb-8">Propuestas Disponibles Para Ti</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {propuestasLista.map((item) => (
                    <div key={item.id} className="bg-[#27272a] rounded-2xl p-6 shadow-lg border border-gray-600 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-white text-lg md:text-xl font-bold leading-tight">{item.titulo}</h3>
                                <span className="bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap ml-4">Disponible</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-2"><span className="font-bold text-white">Memorista:</span> {item.memorista}</p>
                            <p className="text-gray-300 text-sm mb-6 md:mb-8"><span className="font-bold text-white">Descripción:</span> {item.descripcion}</p>
                        </div>
                        <div className="flex justify-end border-t border-gray-600 pt-4 mt-auto">
                            <button onClick={() => {
                                setFormData({ ...formData, tema: item.titulo, memorista: item.memorista });
                                onNavigate('propuestas-asignadas');
                            }} className="bg-[#3f3f46] text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition text-sm">
                                Inscribir
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default AvailableProposals;
