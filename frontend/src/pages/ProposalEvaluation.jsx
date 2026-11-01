import { useState } from 'react';
import Navbar from '../components/Navbar';
import { API_TRAMITACION_URL, crearEvaluacion, crearEvaluacionPropuesta } from '../lib/api';

function ProposalEvaluation({formData, selectedDeliverable, onNavigate, currentView}) {
  const [nota, setNota] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [confirmacionReprobacion, setConfirmacionReprobacion] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const numericNota = Number(nota);
    if (!selectedDeliverable) {
      setError('No hay un documento asociado para evaluar.');
      return;
    }
    if (!nota || numericNota < 0 || numericNota > 100) {
      setError('Ingresa una nota entre 0 y 100.');
      return;
    }
    if (!comentarios.trim()) {
      setError('Ingresa la retroalimentación.');
      return;
    }
    if (numericNota < 70 && !confirmacionReprobacion) {
      setError('Debes confirmar explícitamente la reprobación para una nota menor a 70.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const datosEvaluacion = {
        evaluador_nombre: 'Cristobal Cordova',
        nota: numericNota,
        comentarios,
        confirmacion_reprobacion: confirmacionReprobacion,
      };
      if (selectedDeliverable.tipo === 'propuesta') {
        await crearEvaluacionPropuesta(selectedDeliverable.id, datosEvaluacion);
      } else {
        await crearEvaluacion(selectedDeliverable.id, datosEvaluacion);
      }
      onNavigate('propuestas-asignadas');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center pb-10">
        <Navbar role="correferente" currentView={currentView} onNavigate={onNavigate} />
        <div className="w-full max-w-5xl mt-6 md:mt-8 mb-4 px-4">
             <button onClick={() => onNavigate('propuestas-asignadas')} className="text-gray-400 hover:text-white font-bold text-sm flex items-center gap-1 transition">
                 ← Volver a Asignaciones
             </button>
        </div>
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 px-4">
            <div className="w-full md:w-1/3 bg-[#27272a] rounded-2xl p-6 border border-gray-600 flex flex-col relative mt-2 md:mt-0">
                <div className="absolute -top-4 left-6 bg-[#eab308] text-white font-bold text-[10px] px-3 py-1 rounded-full">
                    Pendiente de calificar
                </div>
                <p className="text-gray-400 text-xs mb-4 mt-2">Enviada el 18-10-2026 01:40</p>
                <h3 className="text-white text-lg font-bold mb-6 leading-tight">{formData.tema}</h3>
                <div className="text-gray-300 text-xs space-y-2 mb-8">
                    <p><span className="font-bold text-white">Memorista:</span> {formData.memorista} / <span className="font-bold text-white">RUT:</span> {formData.rut}</p>
                    <p><span className="font-bold text-white">Profesor Guía:</span> {formData.profesor}</p>
                    <p><span className="font-bold text-white">Campus:</span> {formData.campus} / <span className="font-bold text-white">Modalidad:</span> {formData.modalidad}</p>
                </div>
                <div className="bg-[#3f3f46] p-4 rounded-xl mt-auto">
                    <p className="text-white font-bold text-sm mb-1">{selectedDeliverable?.nombre_archivo}</p>
                    <p className="text-gray-400 text-[10px] mb-4">
                        {selectedDeliverable?.tipo === 'propuesta' ? 'Propuesta • PDF' : 'Documento de avance • PDF'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedDeliverable?.tipo === 'propuesta' && (
                            <>
                                <a
                                    href={`${API_TRAMITACION_URL}/api/propuestas/${selectedDeliverable.id}/archivo`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-[#0284c7] text-white text-xs px-3 py-1.5 rounded hover:bg-blue-600 font-bold"
                                >
                                    Descargar
                                </a>
                                <a
                                    href={`${API_TRAMITACION_URL}/api/propuestas/${selectedDeliverable.id}/archivo`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-[#52525b] text-white text-xs px-3 py-1.5 rounded hover:bg-gray-500 font-bold"
                                >
                                    Ver en línea
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="w-full md:w-2/3 bg-[#27272a] rounded-2xl p-6 md:p-8 border border-gray-600 mt-2 md:mt-0">
                <h2 className="text-white text-xl font-bold mb-6 border-b border-gray-600 pb-3">Criterios de evaluacion</h2>
                <div className="mb-6 flex gap-4 items-center">
                    <label className="text-white font-bold text-sm">Nota Informe Escrito</label>
                    <input type="number" min="0" max="100" value={nota} onChange={(event) => setNota(event.target.value)} className="w-24 bg-[#1f2937] border border-gray-600 text-white rounded-lg px-3 py-2 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="-" />
                </div>
                <div className="mb-6">
                    <label className="text-white font-bold text-sm block mb-3">Retroalimentación y Cometarios</label>
                    <textarea rows="4" value={comentarios} onChange={(event) => setComentarios(event.target.value)} className="w-full bg-[#1f2937] border border-gray-600 text-white rounded-xl px-4 py-3 outline-none resize-none text-sm"></textarea>
                </div>
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-8">
                    <p className="text-red-400 text-xs font-bold mb-3">
                        Calificación menor a 70 (Reprobación). Requiere confirmacion explicita para continuar
                    </p>
                    <label className="flex items-center gap-2 text-white cursor-pointer text-xs font-bold">
                        <input type="checkbox" checked={confirmacionReprobacion} onChange={(event) => setConfirmacionReprobacion(event.target.checked)} className="w-3.5 h-3.5 accent-red-500" />
                        Confirma Calificacion de Reprobación
                    </label>
                </div>
                {error && <p className="text-red-300 text-sm font-bold mb-4">{error}</p>}
                <div className="flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="bg-[#10b981] text-white font-bold py-2.5 px-8 rounded-xl hover:bg-emerald-600 transition shadow-md text-sm disabled:opacity-60">
                        {isSubmitting ? 'Guardando...' : 'Confirmar'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}

export default ProposalEvaluation;
