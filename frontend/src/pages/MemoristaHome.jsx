import imgNinaLibro from '../assets/nina-libro.png';
import Navbar from '../components/Navbar';

function MemoristaHome({onNavigate, currentView}) {
  return (
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center">
        <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
        <div className="mt-10 md:mt-16 bg-white rounded-3xl p-8 md:p-12 max-w-2xl w-full flex flex-col items-center text-center shadow-2xl mx-4">
            <img src={imgNinaLibro} alt="Niña leyendo" className="h-32 md:h-40 w-auto mb-6 object-contain" />
            <h2 className="text-xl md:text-2xl font-extrabold text-black mb-4">Aún no tienes una propuesta registrada</h2>
            <p className="text-gray-600 font-bold mb-8 px-4 text-sm leading-relaxed">
                Para empezar tu proceso de Trabajo de Título, primero debes crear y enviar tu propuesta de tema para que sea revisada por tu profesor guía.
            </p>
            <button onClick={() => onNavigate('crear-propuesta')} className="bg-[#0284c7] text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-600 transition shadow-lg flex items-center gap-2">
                <span className="text-xl">+</span> Crear Nueva Propuesta
            </button>
            <button onClick={() => onNavigate('subir-entregable')} className="mt-4 bg-[#10b981] text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-600 transition shadow-lg">
                Subir Documento de Avance
            </button>
        </div>
    </div>
  );
}

export default MemoristaHome;
