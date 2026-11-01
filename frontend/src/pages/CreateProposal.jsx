import { useState } from 'react';
import Navbar from '../components/Navbar';
import { crearPropuesta } from '../lib/api';

function CreateProposal({formData, setFormData, onNavigate, currentView, onProposalCreated}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!archivo) {
      setError('Selecciona el documento PDF de la propuesta.');
      return;
    }
    if (archivo.type !== 'application/pdf') {
      setError('El documento debe estar en formato PDF.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const propuesta = await crearPropuesta({ ...formData, archivo });
      onProposalCreated(propuesta);
      onNavigate('propuestas-inscritas');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#161c1f] font-sans flex flex-col items-center">
        <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
        <form onSubmit={handleSubmit} className="mt-8 mb-10 bg-[#4b5563] rounded-3xl p-8 max-w-5xl w-full shadow-2xl mx-4">
            <h2 className="text-white text-2xl md:text-3xl font-bold text-center mb-6">Propuesta de Tema</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-4">
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Nombre Memorista</label>
                    <input required type="text" value={formData.memorista} onChange={(e) => setFormData({...formData, memorista: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none border-b-2 border-transparent focus:border-white text-sm" />
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">RUT</label>
                    <input required type="text" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none border-b-2 border-transparent focus:border-white text-sm" />
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Rol USM</label>
                    <input required type="text" value={formData.rolUsm} onChange={(e) => setFormData({...formData, rolUsm: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none border-b-2 border-transparent focus:border-white text-sm" />
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Celular</label>
                    <input required type="text" value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none border-b-2 border-transparent focus:border-white text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4">
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Campus</label>
                    <select value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none appearance-none cursor-pointer text-sm">
                        <option>Casa Central</option>
                        <option>San Joaquín</option>
                    </select>
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Modalidad</label>
                    <select value={formData.modalidad} onChange={(e) => setFormData({...formData, modalidad: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none appearance-none cursor-pointer text-sm">
                        <option>Tradicional</option>
                    </select>
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Profesor Guía</label>
                    <select value={formData.profesor} onChange={(e) => setFormData({...formData, profesor: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none appearance-none cursor-pointer text-sm">
                        <option>Cristobal Cordova</option>
                        <option>Otro Profesor</option>
                    </select>
                </div>
            </div>
            <div className="mb-4">
                <label className="text-white font-bold text-xs block mb-1">Nombre del Tema</label>
                <input required type="text" value={formData.tema} onChange={(e) => setFormData({...formData, tema: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-full px-4 py-2 outline-none text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Resumen del Tema</label>
                    <textarea required rows="3" value={formData.resumen} onChange={(e) => setFormData({...formData, resumen: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-xl px-4 py-2 outline-none resize-none text-sm"></textarea>
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Objetivos</label>
                    <textarea required rows="3" value={formData.objetivos} onChange={(e) => setFormData({...formData, objetivos: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-xl px-4 py-2 outline-none resize-none text-sm"></textarea>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Problema</label>
                    <textarea required rows="3" value={formData.problema} onChange={(e) => setFormData({...formData, problema: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-xl px-4 py-2 outline-none resize-none text-sm"></textarea>
                </div>
                <div>
                    <label className="text-white font-bold text-xs block mb-1">Referencias</label>
                    <textarea required rows="3" value={formData.referencias} onChange={(e) => setFormData({...formData, referencias: e.target.value})} className="w-full bg-[#1f2937] text-white rounded-xl px-4 py-2 outline-none resize-none text-sm"></textarea>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#57606f] p-4 rounded-2xl gap-4">
                <div className="border border-dashed border-white rounded-lg p-3 text-white text-xs w-full md:w-1/2 text-center">
                    <label htmlFor="archivo-propuesta" className="cursor-pointer">
                        <span className="block mb-2">Selecciona el documento de tu propuesta (.pdf)</span>
                        <input
                            id="archivo-propuesta"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                            className="w-full text-white text-xs"
                        />
                    </label>
                    {archivo && <p className="mt-2 text-emerald-200">{archivo.name}</p>}
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    <button type="button" onClick={() => onNavigate('inicio-memorista')} className="bg-[#fb7185] text-white font-bold py-2 px-5 rounded-lg hover:bg-rose-500 transition shadow-md text-sm">
                        Cancelar
                    </button>
                    <button type="button" onClick={() => onNavigate('inicio-memorista')} className="bg-[#f97316] text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition shadow-md text-sm">
                        Volver
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-[#10b981] text-white font-bold py-2 px-5 rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 shadow-md text-sm disabled:cursor-not-allowed disabled:opacity-60">
                        <span>✉️</span> Enviar Propuesta
                    </button>
                </div>
                {error && <p className="w-full text-center text-red-200 text-sm font-bold">{error}</p>}
            </div>
        </form>
    </div>
  );
}

export default CreateProposal;
