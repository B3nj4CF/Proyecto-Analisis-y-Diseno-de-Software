import { useState } from 'react';
import Navbar from '../components/Navbar';
import { subirEntregable } from '../lib/api';

function UploadDeliverable({ propuestas = [], onNavigate, currentView, onDeliverableCreated }) {
  // Manejamos de forma segura por si id viene como id o _id, o si el array está vacío
  const [propuestaId, setPropuestaId] = useState(propuestas[0]?.id || propuestas[0]?._id || '');
  const [etapa, setEtapa] = useState('Avance 1');
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    
    // Validación estricta para evitar que viaje como undefined o vacío
    if (!propuestaId || propuestaId === 'undefined' || !archivo) {
      setError('Por favor selecciona una propuesta válida y un documento PDF.');
      return;
    }
    if (archivo.type !== 'application/pdf') {
      setError('El documento debe estar en formato PDF.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const entregable = await subirEntregable({ propuestaId, etapa, archivo });
      onDeliverableCreated(entregable);
      onNavigate('inicio-memorista');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center">
      <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
      <form onSubmit={handleSubmit} className="mt-8 mb-10 bg-[#4b5563] rounded-3xl p-8 max-w-3xl w-full shadow-2xl mx-4">
        <h2 className="text-white text-2xl md:text-3xl font-bold text-center mb-6">Subir Documento de Avance</h2>
        
        <label className="text-white font-bold text-xs block mb-1">Propuesta</label>
        <select 
          value={propuestaId} 
          onChange={(event) => setPropuestaId(event.target.value)} 
          className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 mb-4 outline-none"
        >
          <option value="">Selecciona una propuesta</option>
          {propuestas && propuestas.map((propuesta) => {
            const idVal = propuesta.id || propuesta._id;
            return (
              <option key={idVal} value={idVal}>
                {propuesta.titulo || propuesta.tema}
              </option>
            );
          })}
        </select>
        
        <label className="text-white font-bold text-xs block mb-1">Etapa</label>
        <select value={etapa} onChange={(event) => setEtapa(event.target.value)} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 mb-4 outline-none">
          <option>Avance 1</option>
          <option>Avance 2</option>
          <option>Validación</option>
        </select>
        
        <label className="text-white font-bold text-xs block mb-1">Documento PDF</label>
        <input type="file" accept="application/pdf" onChange={(event) => setArchivo(event.target.files[0] || null)} className="w-full text-white mb-6" />
        
        {error && <p className="text-red-200 font-bold text-sm mb-4">{error}</p>}
        
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => onNavigate('inicio-memorista')} className="bg-[#fb7185] text-white font-bold py-2 px-5 rounded-lg">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="bg-[#10b981] text-white font-bold py-2 px-5 rounded-lg disabled:opacity-60">
            {isSubmitting ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadDeliverable;