import { useState } from 'react';
import Navbar from '../components/Navbar';
import { editarPropuesta } from '../lib/api';

function EditProposal({ selectedProposal, onNavigate, currentView, onProposalCreated }) {
  const [form, setForm] = useState({
    titulo: selectedProposal?.titulo || '',
    resumen: selectedProposal?.resumen || '',
    problema_ingenieria: selectedProposal?.problema_ingenieria || '',
    objetivos: selectedProposal?.objetivos || '',
    bibliografia: selectedProposal?.bibliografia || '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!selectedProposal) return <Empty onNavigate={onNavigate} />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const actualizada = await editarPropuesta(selectedProposal.id, form);
      onProposalCreated(actualizada);
      onNavigate('inicio-memorista');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="memorista" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-orange-500">HU-14 · Reenvío</p>
          <h1 className="mt-1 text-2xl font-black text-[#0c1d36]">Editar propuesta rechazada</h1>
          <p className="mt-2 text-sm text-slate-500">Corrige los antecedentes y vuelve a enviarlos a revisión.</p>
          <div className="mt-6 space-y-4">
            <Field label="Título" value={form.titulo} onChange={(value) => setForm({ ...form, titulo: value })} />
            <Field label="Resumen ejecutivo" value={form.resumen} onChange={(value) => setForm({ ...form, resumen: value })} area />
            <Field label="Problema de ingeniería" value={form.problema_ingenieria} onChange={(value) => setForm({ ...form, problema_ingenieria: value })} area />
            <Field label="Objetivos" value={form.objetivos} onChange={(value) => setForm({ ...form, objetivos: value })} area />
            <Field label="Bibliografía" value={form.bibliografia} onChange={(value) => setForm({ ...form, bibliografia: value })} area />
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => onNavigate('inicio-memorista')} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancelar</button>
            <button type="submit" disabled={guardando} className="rounded-lg bg-[#07558d] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{guardando ? 'Enviando...' : 'Guardar y reenviar'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, area = false }) {
  const className = 'mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-500';
  return <label className="block text-[10px] font-bold uppercase text-slate-600">{label}{area ? <textarea required rows="3" value={value} onChange={(event) => onChange(event.target.value)} className={className} /> : <input required value={value} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function Empty({ onNavigate }) {
  return <div className="p-8 text-center text-sm">No hay una propuesta seleccionada. <button className="font-bold text-sky-700" onClick={() => onNavigate('inicio-memorista')}>Volver</button></div>;
}

export default EditProposal;
