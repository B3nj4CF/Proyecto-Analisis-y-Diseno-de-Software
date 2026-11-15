

function RoleSelector({onNavigate}) {
  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="mt-2 text-2xl md:text-3xl font-black text-[#0c1d36]">Selecciona tu vista</h2>
        <div className="flex flex-col md:flex-row flex-wrap gap-6 w-full max-w-4xl justify-center px-4">
            <button onClick={() => onNavigate('inicio-memorista')} className="w-full md:w-auto bg-[#07558d] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#064675] shadow-sm text-lg">
                👨‍🎓 Ingresar como Memorista
            </button>
            <button onClick={() => onNavigate('inicio-correferente')} className="w-full md:w-auto bg-[#07558d] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#064675] shadow-sm text-lg">
                👨‍🏫 Ingresar como Correferente
            </button>
            <button onClick={() => onNavigate('secretaria-reportes')} className="w-full md:w-auto border border-[#07558d] text-[#07558d] px-8 py-4 rounded-xl font-bold hover:bg-sky-50 shadow-sm text-lg">
                Ingresar como Secretaría
            </button>
            <button onClick={() => onNavigate('jefe-carrera')} className="w-full md:w-auto border border-emerald-600 text-emerald-700 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 shadow-sm text-lg">
                Ingresar como Jefe de Carrera
            </button>
        </div>
        <button onClick={() => onNavigate('login')} className="mt-6 text-slate-500 hover:text-[#07558d] underline">
            Volver al Login
        </button>
        </div>
    </div>
  );
}

export default RoleSelector;
