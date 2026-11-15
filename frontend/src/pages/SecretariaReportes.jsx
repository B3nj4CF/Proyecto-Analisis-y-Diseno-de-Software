import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { obtenerMemorias, obtenerReporte, guardarNotas, generarReporte, descargarReporte } from '../lib/reportes';

const habilitada = 'Habilitado para Defensa';

function SecretariaReportes({ onNavigate, currentView }) {
  const [memorias, setMemorias] = useState([]);
  const [propuestaId, setPropuestaId] = useState('');
  const [registro, setRegistro] = useState(null);
  const [escrita, setEscrita] = useState('');
  const [oral, setOral] = useState('');
  const [modificado, setModificado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let vigente = true;
    obtenerMemorias().then((lista) => {
      if (!vigente) return;
      setMemorias(lista);
      const inicial = lista.find(p => p.estado === habilitada) || lista[0];
      setPropuestaId(inicial ? String(inicial.id) : '');
    }).catch(e => vigente && setError(e.message));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    setError(''); setMensaje(''); setRegistro(null);
    setEscrita(''); setOral(''); setModificado(false);
    if (!propuestaId) return () => { vigente = false; };
    obtenerReporte(propuestaId).then((dato) => {
      if (!vigente) return;
      setRegistro(dato);
      setEscrita(dato.nota_escrita === null ? '' : String(dato.nota_escrita));
      setOral(dato.nota_oral === null ? '' : String(dato.nota_oral));
    }).catch(e => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [propuestaId]);

  const seleccionada = useMemo(() => memorias.find(p => String(p.id) === propuestaId), [memorias, propuestaId]);
  const soloLectura = !seleccionada || seleccionada.estado !== habilitada;
  const validar = (s) => s !== '' && /^\d+$/.test(s) && Number(s) <= 100;
  const notasValidas = validar(escrita) && validar(oral);
  const promedio = notasValidas ? Math.round(Number(escrita) * 0.60 + Number(oral) * 0.40) : null;
  const estiloCampo = 'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500';
  const estiloBoton = 'rounded-lg px-5 py-3 font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed';

  async function realizar(operacion, texto) {
    setError(''); setMensaje(''); setProcesando(true);
    try {
      const resultado = await operacion();
      if (resultado?.ponderacion) {
        setRegistro(resultado);
        setModificado(false);
      }
      setMensaje(texto);
    } catch (e) { setError(e.message); }
    finally { setProcesando(false); }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-[#10233f]">
      <Navbar role="secretaria" currentView={currentView} onNavigate={onNavigate} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:py-10">
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-500">Validaciones y reportes</p><h1 className="mt-1 text-2xl font-black text-[#0c1d36]">Generar reporte de estado</h1><p className="mt-2 text-sm text-slate-500">Consulta los procesos, registra calificaciones y descarga el reporte académico.</p></div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">1. Seleccionar memoria</h2>
          <label htmlFor="memoria-hu09" className="mt-5 mb-2 block text-sm font-bold">Memoria</label>
          <select id="memoria-hu09" className={estiloCampo} value={propuestaId}
            onChange={e => setPropuestaId(e.target.value)}>
            {!memorias.length && <option value="">No hay memorias disponibles</option>}
            {memorias.map(p => <option value={p.id} key={p.id}>#{p.id} - {p.titulo} ({p.estado})</option>)}
          </select>
          {seleccionada && <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-gray-900 space-y-1">
            <p><b>Título:</b> {seleccionada.titulo}</p>
            <p><b>Memorista:</b> {seleccionada.memorista}</p>
            <p><b>Profesor guía:</b> {seleccionada.profesor}</p>
            <p><b>Estado:</b> {seleccionada.estado}</p>
            <p className="pt-2 text-xs text-slate-600">El cierre administrativo de la memoria corresponde exclusivamente a Jefatura de Carrera.</p>
            {soloLectura && <p className="pt-2 font-semibold text-amber-800">
              {seleccionada.estado === 'Cerrado'
                ? 'Proceso cerrado: solo lectura. El PDF emitido sigue disponible.'
                : 'La memoria debe estar habilitada para defensa antes de registrar calificaciones.'}
            </p>}
          </div>}
        </section>

        {seleccionada && <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">2. Calificaciones</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="escrita-hu09" className="mb-2 block text-sm font-bold">Nota escrita (60 %)</label>
              <input id="escrita-hu09" type="number" min="0" max="100" step="1" className={estiloCampo} value={escrita}
                disabled={soloLectura || procesando} onChange={e => { setEscrita(e.target.value); setModificado(true); }} /></div>
            <div><label htmlFor="oral-hu09" className="mb-2 block text-sm font-bold">Nota oral (40 %)</label>
              <input id="oral-hu09" type="number" min="0" max="100" step="1" className={estiloCampo} value={oral}
                disabled={soloLectura || procesando} onChange={e => { setOral(e.target.value); setModificado(true); }} /></div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-100 p-4"><p className="text-xs text-slate-600">Nota final ponderada</p>
            <p className="text-3xl font-extrabold text-blue-700">{promedio ?? '--'}</p></div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          {mensaje && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{mensaje}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button className={`${estiloBoton} bg-blue-700`} disabled={soloLectura || !notasValidas || procesando}
              onClick={() => realizar(() => guardarNotas(propuestaId, Number(escrita), Number(oral)), 'Calificaciones guardadas correctamente.')}>Guardar notas</button>
            <button className={`${estiloBoton} bg-emerald-700`}
              disabled={soloLectura || !registro || modificado || !notasValidas || procesando}
              onClick={() => realizar(() => generarReporte(propuestaId), 'Reporte generado y conservado correctamente.')}>Generar reporte</button>
            {registro?.pdf_conservado && <button className={`${estiloBoton} bg-slate-800`} disabled={procesando}
              onClick={() => realizar(() => descargarReporte(propuestaId), 'PDF descargado.')}>Descargar PDF</button>}
          </div>
          <p className="mt-4 text-xs text-gray-500">Ponderación aplicada: 60 % nota escrita y 40 % nota oral, sujeta a validación según la normativa académica vigente.</p>
        </section>}
        {!seleccionada && error && <p className="mt-4 text-red-300">{error}</p>}
      </main>
    </div>
  );
}

export default SecretariaReportes;
