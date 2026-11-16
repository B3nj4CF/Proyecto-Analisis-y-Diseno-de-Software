import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { actualizarEstadoPropuesta, eliminarPropuesta } from '../lib/api';
import {
  consultarVistosBuenos,
  obtenerReporte,
  otorgarVistoBueno,
  validarCierre,
} from '../lib/reportes';

function JefeCarreraHome({
  propuestas,
  propuestasError,
  onNavigate,
  currentView,
  onProposalEvaluated,
  onSelectProposal,
}) {
  const [procesando, setProcesando] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const [habilitando, setHabilitando] = useState('');
  const [vistosBuenos, setVistosBuenos] = useState({});
  const [reportes, setReportes] = useState({});

  useEffect(() => {
    let active = true;

    Promise.all(
      propuestas.map(async (propuesta) => {
        const id = propuesta.id || propuesta._id;
        const key = String(id);

        const [vistos, reporte] = await Promise.all([
          consultarVistosBuenos(id).catch(() => ({
            co_guia: false,
            jefe_carrera: false,
          })),
          ['Habilitado para Defensa', 'Cerrado'].includes(propuesta.estado)
            ? obtenerReporte(id).catch(() => null)
            : Promise.resolve(null),
        ]);

        return [key, vistos, reporte];
      }),
    ).then((entries) => {
      if (!active) return;

      setVistosBuenos(
        Object.fromEntries(entries.map(([id, vistos]) => [id, vistos])),
      );
      setReportes(
        Object.fromEntries(entries.map(([id, , reporte]) => [id, reporte])),
      );
    });

    return () => {
      active = false;
    };
  }, [propuestas]);

  const visibles = useMemo(
    () =>
      propuestas.filter(
        (propuesta) => filtro === 'Todas' || propuesta.estado === filtro,
      ),
    [propuestas, filtro],
  );

  function requisitosCierre(propuesta) {
    const id = String(propuesta.id || propuesta._id);
    const vistos = vistosBuenos[id] || {};
    const reporte = reportes[id];

    const vistoCoGuia = Boolean(vistos.co_guia);
    const vistoJefatura = Boolean(vistos.jefe_carrera);
    const reporteGenerado = Boolean(reporte?.reporte_generado);
    const notaFinal = reporte?.nota_final ?? null;
    const notaAprobada =
      reporte?.nota_aprobada === true ||
      (notaFinal !== null && Number(notaFinal) >= 70);

    return {
      vistoCoGuia,
      vistoJefatura,
      reporteGenerado,
      notaFinal,
      notaAprobada,
      listo:
        vistoCoGuia &&
        vistoJefatura &&
        reporteGenerado &&
        notaAprobada,
    };
  }

  async function cambiarEstado(propuesta, estado) {
    const propuestaId = propuesta.id || propuesta._id;
    const key = String(propuestaId);

    if (estado === 'Cerrado') {
      const requisitos = requisitosCierre(propuesta);

      if (!requisitos.listo) {
        setError(
          'No se puede cerrar la memoria mientras existan requisitos pendientes.',
        );
        return;
      }

      if (
        !window.confirm(
          '¿Confirmas el cierre de esta memoria? Después del cierre el proceso quedará en modo solo lectura.',
        )
      ) {
        return;
      }
    }

    setProcesando(key);
    setError('');
    setMensaje('');

    try {
      if (estado === 'Cerrado') {
        await validarCierre(propuestaId);
      } else {
        await actualizarEstadoPropuesta(propuestaId, estado);
      }

      onProposalEvaluated(propuestaId, estado);
      setMensaje(
        estado === 'Cerrado'
          ? `La memoria #${propuestaId} fue cerrada correctamente y quedó en modo solo lectura.`
          : `La propuesta #${propuestaId} quedó en estado "${estado}".`,
      );
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setProcesando('');
    }
  }

  async function eliminar(propuesta) {
    const propuestaId = propuesta.id || propuesta._id;

    if (!window.confirm(`¿Eliminar la propuesta "${propuesta.titulo}"?`)) {
      return;
    }

    setProcesando(String(propuestaId));
    setError('');

    try {
      await eliminarPropuesta(propuestaId);
      onProposalEvaluated(propuestaId, '__ELIMINADA__');
      setMensaje('Propuesta eliminada correctamente.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setProcesando('');
    }
  }

  async function habilitarExamen(propuesta) {
    const propuestaId = propuesta.id || propuesta._id;
    const key = String(propuestaId);

    setHabilitando(key);
    setError('');
    setMensaje('');

    try {
      await otorgarVistoBueno(propuestaId, 'jefe-carrera');

      setVistosBuenos((actuales) => ({
        ...actuales,
        [key]: {
          ...(actuales[key] || {}),
          jefe_carrera: true,
        },
      }));

      onProposalEvaluated(propuestaId, 'Habilitado para Defensa');
      setMensaje(
        `El examen final de la propuesta #${propuestaId} quedó habilitado.`,
      );
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setHabilitando('');
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar
        role="jefe-carrera"
        currentView={currentView}
        onNavigate={onNavigate}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">
            HU-03 · HU-10 · HU-11
          </p>
          <h1 className="mt-1 text-2xl font-black text-[#0c1d36]">
            Gestión de Jefatura de Carrera
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Autoriza propuestas aprobadas, revisa cierres y administra procesos
            pendientes.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              'Todas',
              'Aprobada por Guía',
              'Autorizada',
              'Habilitado para Defensa',
              'Cerrado',
              'Rechazada por Guía',
            ].map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setFiltro(estado)}
                className={`rounded-full px-3 py-2 text-[10px] font-bold ${
                  filtro === estado
                    ? 'bg-[#07558d] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </section>

        {propuestasError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">
            {propuestasError}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700"
          >
            {error}
          </p>
        )}

        {mensaje && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700"
          >
            {mensaje}
          </p>
        )}

        <section className="mt-5 grid gap-4">
          {!visibles.length && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No hay propuestas en este estado.
            </div>
          )}

          {visibles.map((propuesta) => {
            const propuestaId = propuesta.id || propuesta._id;
            const key = String(propuestaId);
            const requisitos = requisitosCierre(propuesta);
            const mostrarRequisitos = [
              'Habilitado para Defensa',
              'Cerrado',
            ].includes(propuesta.estado);

            return (
              <article
                key={propuestaId}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Propuesta #{propuestaId}
                    </p>
                    <h2 className="mt-1 text-lg font-black text-[#0c1d36]">
                      {propuesta.titulo}
                    </h2>
                    <p className="mt-2 text-xs text-slate-600">
                      <b>Memorista:</b> {propuesta.memorista} · <b>Guía:</b>{' '}
                      {propuesta.profesor}
                    </p>
                  </div>

                  <span className="h-fit rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold text-sky-700">
                    {propuesta.estado || 'En revisión'}
                  </span>
                </div>

                {mostrarRequisitos && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Requisitos de cierre
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Requisito ok={requisitos.vistoCoGuia}>
                        Visto bueno co-guía
                      </Requisito>
                      <Requisito ok={requisitos.vistoJefatura}>
                        Visto bueno Jefatura
                      </Requisito>
                      <Requisito ok={requisitos.reporteGenerado}>
                        Reporte generado
                      </Requisito>
                      <Requisito ok={requisitos.notaAprobada}>
                        {requisitos.notaFinal === null
                          ? 'Nota final pendiente'
                          : `Nota final: ${requisitos.notaFinal}`}
                      </Requisito>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {propuesta.estado === 'Aprobada por Guía' && (
                    <Action
                      onClick={() =>
                        cambiarEstado(propuesta, 'Autorizada')
                      }
                      label="Autorizar inicio"
                    />
                  )}

                  {propuesta.estado === 'Autorizada' &&
                    vistosBuenos[key]?.co_guia && (
                      <Action
                        onClick={() => habilitarExamen(propuesta)}
                        label="Confirmar visto bueno y habilitar examen"
                        tone="emerald"
                      />
                    )}

                  {propuesta.estado === 'Autorizada' &&
                    !vistosBuenos[key]?.co_guia && (
                      <span className="self-center text-[10px] text-amber-700">
                        Pendiente visto bueno del co-guía
                      </span>
                    )}

                  {propuesta.estado === 'Habilitado para Defensa' && (
                    <Action
                      onClick={() => cambiarEstado(propuesta, 'Cerrado')}
                      label={
                        requisitos.listo
                          ? 'Cerrar memoria'
                          : 'Cierre bloqueado'
                      }
                      tone="emerald"
                      disabled={!requisitos.listo}
                    />
                  )}

                  {(propuesta.estado === 'En revisión' ||
                    propuesta.estado === 'Rechazada por Guía') && (
                    <Action
                      onClick={() => eliminar(propuesta)}
                      label="Eliminar"
                      tone="red"
                    />
                  )}

                  {propuesta.estado === 'Cerrado' && (
                    <span className="self-center rounded-lg bg-slate-100 px-4 py-2 text-[10px] font-bold text-slate-500">
                      Proceso cerrado · solo lectura
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onSelectProposal(propuesta);
                      onNavigate('detalle-propuesta');
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Ver antecedentes
                  </button>

                  {procesando === key && (
                    <span className="self-center text-[10px] text-slate-400">
                      Procesando...
                    </span>
                  )}

                  {habilitando === key && (
                    <span className="self-center text-[10px] text-slate-400">
                      Validando Avance 1 y Avance 2...
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function Requisito({ ok, children }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
        ok
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {ok ? '✓' : '•'} {children}
    </span>
  );
}

function Action({
  onClick,
  label,
  tone = 'blue',
  disabled = false,
}) {
  const colors = {
    blue: 'bg-[#07558d] hover:bg-[#064675]',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-[10px] font-bold text-white ${colors[tone]} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

export default JefeCarreraHome;
