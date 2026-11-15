import Navbar from '../components/Navbar';

function AvailableProposals({propuestasLista, formData, setFormData, onNavigate, currentView}) {
  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f] pb-10">
        <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
        <div className="mt-8 md:mt-10 w-full max-w-5xl px-4">
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Temas disponibles</p><h2 className="mt-1 text-2xl font-black text-[#0c1d36]">Propuestas disponibles para ti</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {propuestasLista.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-[#0c1d36] text-lg md:text-xl font-black leading-tight">{item.titulo}</h3>
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap ml-4">Disponible</span>
                            </div>
                            <p className="text-slate-600 text-sm mb-2"><span className="font-bold text-slate-800">Memorista:</span> {item.memorista}</p>
                            <p className="text-slate-600 text-sm mb-6 md:mb-8"><span className="font-bold text-slate-800">Descripción:</span> {item.descripcion}</p>
                        </div>
                        <div className="flex justify-end border-t border-slate-100 pt-4 mt-auto">
                            <button onClick={() => {
                                setFormData({ ...formData, tema: item.titulo, memorista: item.memorista });
                                onNavigate('propuestas-asignadas');
                            }} className="bg-[#07558d] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#064675] transition text-sm">
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
