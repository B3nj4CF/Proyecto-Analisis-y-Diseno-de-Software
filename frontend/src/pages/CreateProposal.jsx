import { useState } from 'react';
import Navbar from '../components/Navbar';
import { crearPropuesta } from '../lib/api';

function CreateProposal({ formData, setFormData, onNavigate, currentView, onProposalCreated }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState(null);

  function update(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function nextStep() {
    setError('');
    const requiredByStep = {
      1: [
        ['memorista', 'Ingresa tu nombre completo.'],
        ['rut', 'Ingresa tu RUT.'],
        ['rolUsm', 'Ingresa tu rol USM.'],
        ['celular', 'Ingresa tu teléfono o celular.'],
        ['campus', 'Selecciona un campus.'],
        ['profesor', 'Selecciona un profesor guía.'],
      ],
      2: [
        ['tema', 'Ingresa el título o tema de la memoria.'],
        ['resumen', 'Ingresa el resumen ejecutivo.'],
        ['problema', 'Ingresa el problema de ingeniería.'],
      ],
      3: [
        ['objetivos', 'Ingresa los objetivos de la memoria.'],
        ['referencias', 'Ingresa la bibliografía preliminar.'],
      ],
    };
    const missing = requiredByStep[step].find(([field]) => !String(formData[field] || '').trim());
    if (missing) {
      setError(missing[1]);
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  function previousStep() {
    setError('');
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!archivo) {
      setError('Selecciona el documento PDF de la propuesta.');
      return;
    }
    if (archivo.type !== 'application/pdf') {
      setError('El documento debe estar en formato PDF.');
      return;
    }

    setIsSubmitting(true);
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
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-[#0f172a] px-6 py-6 text-white md:px-8">
            <div>
              <p className="font-mono text-[9px] text-amber-400">Registro de propuesta</p>
              <h1 className="mt-1 text-xl font-black md:text-2xl">Inscripción de Propuesta de Memoria</h1>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((item) => <button key={item} type="button" onClick={() => item < step && setStep(item)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black ${step === item ? 'bg-amber-400 text-[#0f172a]' : 'bg-slate-800 text-slate-400'} ${item < step ? 'cursor-pointer hover:bg-amber-300' : ''}`}>{String(item).padStart(2, '0')}</button>)}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {step === 1 && <StepOne formData={formData} update={update} />}
            {step === 2 && <StepTwo formData={formData} update={update} />}
            {step === 3 && <StepThree formData={formData} update={update} archivo={archivo} setArchivo={setArchivo} />}
            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{error}</p>}
            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={step === 1 ? () => onNavigate('inicio-memorista') : previousStep} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50">{step === 1 ? 'Cancelar' : 'Volver'}</button>
              {step < 3 ? <button type="button" onClick={nextStep} className="rounded-lg bg-[#07558d] px-5 py-2.5 text-[10px] font-black text-white hover:bg-[#064675]">Siguiente: {step === 1 ? 'Definición del tema' : 'Objetivos y referencias'} →</button> : <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[10px] font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">{isSubmitting ? 'Enviando propuesta...' : 'Confirmar e inscribir propuesta'}</button>}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block text-[9px] font-bold uppercase text-slate-600">{label}{children}</label>;
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return <input required type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-[#10233f] outline-none focus:border-sky-500 focus:bg-white" />;
}

function Textarea({ value, onChange, placeholder }) {
  return <textarea required rows="3" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-[#10233f] outline-none focus:border-sky-500 focus:bg-white" />;
}

function StepOne({ formData, update }) {
  return <section><h2 className="border-b border-slate-200 pb-3 text-sm font-black">Paso 1: Identificación del Memorista y Modalidad</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Nombre completo"><Input value={formData.memorista} onChange={(value) => update('memorista', value)} placeholder="Benjamín Castro" /></Field><Field label="RUT"><Input value={formData.rut} onChange={(value) => update('rut', value)} placeholder="20.456.789-K" /></Field><Field label="Rol USM"><Input value={formData.rolUsm} onChange={(value) => update('rolUsm', value)} placeholder="202173542-1" /></Field><Field label="Teléfono / celular"><Input value={formData.celular} onChange={(value) => update('celular', value)} placeholder="+56 9 8765 4321" /></Field><Field label="Campus / sede"><select value={formData.campus} onChange={(event) => update('campus', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-sky-500"><option>Casa Central Valparaíso</option><option>San Joaquín</option></select></Field><Field label="Profesor guía propuesto"><select value={formData.profesor} onChange={(event) => update('profesor', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-sky-500"><option>Dr. Mauricio Solar</option><option>Cristobal Cordova</option><option>Otro Profesor</option></select></Field></div></section>;
}

function StepTwo({ formData, update }) {
  return <section><h2 className="border-b border-slate-200 pb-3 text-sm font-black">Paso 2: Definición del Problema de Ingeniería</h2><div className="mt-5 space-y-4"><Field label="Título / tema de la memoria *"><Input value={formData.tema} onChange={(value) => update('tema', value)} placeholder="Ej: Arquitectura de Microservicios Resiliente para Sistemas Académicos" /></Field><Field label="Resumen ejecutivo *"><Textarea value={formData.resumen} onChange={(value) => update('resumen', value)} placeholder="Describe brevemente el alcance y la solución propuesta..." /></Field><Field label="Problema de ingeniería a resolver *"><Textarea value={formData.problema} onChange={(value) => update('problema', value)} placeholder="¿Qué dolor técnico o brecha resuelve este proyecto?" /></Field></div></section>;
}

function StepThree({ formData, update, archivo, setArchivo }) {
  return <section><h2 className="border-b border-slate-200 pb-3 text-sm font-black">Paso 3: Objetivos y Bibliografía</h2><div className="mt-5 space-y-4"><Field label="Objetivos generales y específicos"><Textarea value={formData.objetivos} onChange={(value) => update('objetivos', value)} placeholder={'1. Diseñar...\n2. Implementar...\n3. Validar...'} /></Field><Field label="Bibliografía preliminar"><Textarea value={formData.referencias} onChange={(value) => update('referencias', value)} placeholder="Referencias formato IEEE o APA..." /></Field><label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-[10px] font-bold text-slate-600">Documento PDF de la propuesta (obligatorio)<input type="file" accept="application/pdf,.pdf" onChange={(event) => setArchivo(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs font-normal" />{archivo && <span className="mt-2 block text-emerald-600">{archivo.name}</span>}</label></div></section>;
}

export default CreateProposal;
