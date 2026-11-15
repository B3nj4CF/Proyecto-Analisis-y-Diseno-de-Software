import logoUsm from '../assets/logo-usm.png';

function Navbar({ role, currentView, onNavigate }) {
  const homeView =
    role === 'memorista'
      ? 'inicio-memorista'
      : role === 'secretaria'
        ? 'secretaria-reportes'
        : role === 'jefe-carrera'
          ? 'jefe-carrera'
        : 'inicio-correferente';

  return (
    <header className="w-full text-white shadow-sm">
      <nav className="w-full bg-[#07558d] px-4 md:px-8 py-2 flex justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer min-w-fit"
          onClick={() => onNavigate(homeView)}
        >
          <img
            src={logoUsm}
            alt="Logo UTFSM"
            className="w-9 h-auto object-contain"
          />
          <div className="hidden lg:block leading-none">
            <div className="font-black text-sm tracking-wide">SGM</div>
            <div className="text-[9px] font-semibold">Informática</div>
          </div>
          <span className="hidden xl:inline rounded-full bg-[#f7b719] px-2 py-1 text-[8px] font-black text-[#12305a]">V2.0<br />MICROSERVICIOS</span>
        </div>

        <div className="flex items-center gap-1 md:gap-4 lg:gap-7 font-bold text-[10px] md:text-xs">
        <button
          onClick={() => onNavigate(homeView)}
          className={`rounded-lg px-3 py-2 hover:bg-white/10 ${
            currentView === homeView ? 'border-b-2 border-white' : ''
          }`}
        >
          <span className="block text-base">⌂</span>Mi progreso
        </button>

        {role === 'memorista' ? (
          <>
            <button onClick={() => onNavigate('crear-propuesta')} className="hidden sm:block rounded-lg px-2 py-2 hover:bg-white/10"><span className="block text-base">⊙</span>Inscribir propuesta</button>
            <button onClick={() => onNavigate('subir-entregable')} className="hidden sm:block rounded-lg px-2 py-2 hover:bg-white/10"><span className="block text-base">↥</span>Subir avance PDF</button>
            <button onClick={() => onNavigate('propuestas-inscritas')} className="hidden md:block rounded-lg px-2 py-2 hover:bg-white/10"><span className="block text-base">▣</span>Entregables y notas</button>
          </>
        ) : role === 'secretaria' ? (
          <button
            onClick={() => onNavigate('secretaria-reportes')}
            className={`rounded-lg px-3 py-2 hover:bg-white/10 ${
              currentView === 'secretaria-reportes'
                ? 'border-b-2 border-white'
                : ''
            }`}
          >
            Reportes
          </button>
        ) : role === 'jefe-carrera' ? (
          <button onClick={() => onNavigate('jefe-carrera')} className={`rounded-lg px-3 py-2 hover:bg-white/10 ${currentView === 'jefe-carrera' ? 'border-b-2 border-white' : ''}`}>
            Jefatura
          </button>
        ) : (
          <button
            onClick={() => onNavigate('propuestas-asignadas')}
            className={`rounded-lg px-3 py-2 hover:bg-white/10 ${
              currentView === 'propuestas-asignadas'
                ? 'border-b-2 border-white'
                : ''
            }`}
          >
            Asignaciones
          </button>
        )}

        <button className="hidden lg:block rounded-lg px-2 py-2 hover:bg-white/10"><span className="block text-base">▱</span>Temas disponibles</button>
      </div>

      <div className="flex items-center gap-2 md:gap-4 text-xs min-w-fit">
        <div className="hidden lg:block text-right leading-tight">
          <strong>Benjamín Castro</strong>
          <span className="block text-[9px] text-sky-200">Memorista · Ing. Civil Informática</span>
        </div>
        <button
          onClick={() => onNavigate('selector-cargo')}
          className="bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md hover:bg-white/20 transition"
          title="Cambiar de Rol"
        >
          ↪
        </button>
      </div>
      </nav>
    </header>
  );
}

export default Navbar;