

function RoleSelector({onNavigate}) {
  return (
    <div className="min-h-screen bg-[#161c1f] flex flex-col items-center justify-center p-6 font-sans">
        <h2 className="text-white text-2xl md:text-3xl font-bold mb-10 border-b border-gray-600 pb-4 text-center">Simulador de Roles</h2>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl justify-center px-4">
            <button onClick={() => onNavigate('inicio-memorista')} className="w-full md:w-auto bg-[#0284c7] text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 shadow-lg text-lg">
                👨‍🎓 Ingresar como Memorista
            </button>
            <button onClick={() => onNavigate('inicio-correferente')} className="w-full md:w-auto bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg text-lg">
                👨‍🏫 Ingresar como Correferente
            </button>
        </div>
        <button onClick={() => onNavigate('login')} className="mt-12 text-gray-400 hover:text-white underline font-mono">
            Volver al Login
        </button>
    </div>
  );
}

export default RoleSelector;
