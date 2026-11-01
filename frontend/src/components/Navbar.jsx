import logoUsm from '../assets/logo-usm.png';

function Navbar({ role, currentView, onNavigate }) {
  const homeView = role === 'memorista' ? 'inicio-memorista' : 'inicio-correferente';

  return (
    <nav className="w-full bg-[#0284c7] px-8 py-3 flex justify-between items-center text-white shadow-md">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate(homeView)}>
        <img src={logoUsm} alt="Logo UTFSM" className="w-12 h-auto object-contain" />
        <span className="font-black text-2xl tracking-widest">SGM</span>
      </div>
      <div className="flex gap-10 font-bold text-sm hidden md:flex">
        <button
          onClick={() => onNavigate(homeView)}
          className={`hover:text-gray-300 pb-1 ${currentView.includes('inicio') ? 'border-b-2 border-white' : ''}`}
        >
          Inicio
        </button>
        {role === 'memorista' ? (
          <button
            onClick={() => onNavigate('propuestas-inscritas')}
            className={`hover:text-gray-300 pb-1 ${currentView === 'propuestas-inscritas' ? 'border-b-2 border-white' : ''}`}
          >
            Mis memorias
          </button>
        ) : (
          <button
            onClick={() => onNavigate('propuestas-asignadas')}
            className={`hover:text-gray-300 pb-1 ${currentView === 'propuestas-asignadas' ? 'border-b-2 border-white' : ''}`}
          >
            Asignaciones
          </button>
        )}
        <button className="hover:text-gray-300">Documentos</button>
      </div>
      <div className="flex gap-6 text-xl items-center">
        <button onClick={() => onNavigate('selector-cargo')} className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md hover:scale-105 transition" title="Cambiar de Rol">
          👤
        </button>
        <button className="hover:opacity-80" title="Notificaciones">🔔</button>
      </div>
    </nav>
  );
}

export default Navbar;
