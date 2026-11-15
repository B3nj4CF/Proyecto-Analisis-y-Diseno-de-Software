import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { actualizarEstadoPropuesta, eliminarPropuesta } from '../lib/api';
import { otorgarVistoBueno } from '../lib/reportes';
import { consultarVistosBuenos } from '../lib/reportes';

function JefeCarreraHome({ propuestas, propuestasError, onNavigate, currentView, onProposalEvaluated, onSelectProposal }) {
  const [procesando, setProcesando] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const [habilitando, setHabilitando] = useState('');
  const [vistosBuenos, setVistosBuenos] = useState({});

  useEffect(() => {
    let active = true;
    Promise.all(propuestas.map(async (propuesta) => {
      const id = propuesta.id || propuesta._id;
      return [String(id), await consultarVistosBuenos(id)];
    })).then((entries) => {
      if (active) setVistosBuenos(Object.fromEntries(entries));
    }).catch(() => {});
    return () => { active = false; };
  }, [propuestas]);

  const visibles = useMemo(() => propuestas.filter((propuesta) => (
    filtro === 'Todas' || propuesta.estado === filtro
  )), [propuestas, filtro]);

  async function cambiarEstado(propuesta, estado) {
    setProcesando(propuesta.id);
    setError('');
    setMensaje('');
    try {
      await actualizarEstadoPropuesta(propuesta.id, estado);
      onProposalEvaluated(propuesta.id, estado);
      setMensaje(`La propuesta #${propuesta.id} quedó en estado "${estado}".`);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setProcesando('');
    }
  }

  async function eliminar(propuesta) {
    if (!window.confirm(`¿Eliminar la propuesta "${propuesta.titulo}"?`)) return;
    setProcesando(propuesta.id);
    setError('');
    try {
      await eliminarPropuesta(propuesta.id);
      onProposalEvaluated(propuesta.id, '__ELIMINADA__');
      setMensaje('Propuesta eliminada correctamente.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setProcesando('');
    }
  }

  async function habilitarExamen(propuesta) {
    const propuestaId = propuesta.id || propuesta._id;
    setHabilitando(propuestaId);
    setError('');
    setMensaje('');
    try {
      await otorgarVistoBueno(propuestaId, 'jefe-carrera');
      onProposalEvaluated(propuestaId, 'Habilitado para Defensa');
      setMensaje(`El examen final de la propuesta #${propuestaId} quedó habilitado.`);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setHabilitando('');
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="jefe-carrera" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">HU-03 · HU-10 · HU-11</p>
          <h1 className="mt-1 text-2xl font-black text-[#0c1d36]">Gestión de Jefatura de Carrera</h1>
          <p className="mt-2 text-sm text-slate-500">Autoriza propuestas aprobadas, revisa cierres y administra procesos pendientes.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Todas', 'Aprobada por Guía', 'Autorizada', 'Habilitado para Defensa', 'Cerrado', 'Rechazada por Guía'].map((estado) => (
              <button key={estado} type="button" onClick={() => setFiltro(estado)} className={`rounded-full px-3 py-2 text-[10px] font-bold ${filtro === estado ? 'bg-[#07558d] text-white' : 'bg-slate-100 text-slate-600'}`}>{estado}</button>
            ))}
          </div>
        </section>
        {propuestasError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{propuestasError}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
        {mensaje && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{mensaje}</p>}
        <section className="mt-5 grid gap-4">
          {!visibles.length && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No hay propuestas en este estado.</div>}
          {visibles.map((propuesta) => (
            <article key={propuesta.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Propuesta #{propuesta.id}</p>
                  <h2 className="mt-1 text-lg font-black text-[#0c1d36]">{propuesta.titulo}</h2>
                  <p className="mt-2 text-xs text-slate-600"><b>Memorista:</b> {propuesta.memorista} · <b>Guía:</b> {propuesta.profesor}</p>
                </div>
                <span className="h-fit rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold text-sky-700">{propuesta.estado || 'En revisión'}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {propuesta.estado === 'Aprobada por Guía' && <Action onClick={() => cambiarEstado(propuesta, 'Autorizada')} label="Autorizar inicio" />}
                {propuesta.estado === 'Autorizada' && vistosBuenos[String(propuesta.id || propuesta._id)]?.co_guia && <Action onClick={() => habilitarExamen(propuesta)} label="Confirmar visto bueno y habilitar examen" tone="emerald" />}
                {propuesta.estado === 'Autorizada' && !vistosBuenos[String(propuesta.id || propuesta._id)]?.co_guia && <span className="self-center text-[10px] text-amber-700">Pendiente visto bueno del co-guía</span>}
                {propuesta.estado === 'Habilitado para Defensa' && <Action onClick={() => cambiarEstado(propuesta, 'Cerrado')} label="Cerrar memoria" tone="emerald" />}
                {(propuesta.estado === 'En revisión' || propuesta.estado === 'Rechazada por Guía') && <Action onClick={() => eliminar(propuesta)} label="Eliminar" tone="red" />}
                <button type="button" onClick={() => { onSelectProposal(propuesta); onNavigate('detalle-propuesta'); }} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50">Ver antecedentes</button>
                {procesando === propuesta.id && <span className="self-center text-[10px] text-slate-400">Procesando...</span>}
                {habilitando === propuesta.id && <span className="self-center text-[10px] text-slate-400">Validando Avance 1 y Avance 2...</span>}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function Action({ onClick, label, tone = 'blue' }) {
  const colors = { blue: 'bg-[#07558d] hover:bg-[#064675]', emerald: 'bg-emerald-600 hover:bg-emerald-700', red: 'bg-red-600 hover:bg-red-700' };
  return <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-[10px] font-bold text-white ${colors[tone]}`}>{label}</button>;
}

export default JefeCarreraHome;
