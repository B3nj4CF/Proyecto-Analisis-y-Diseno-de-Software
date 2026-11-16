import { useEffect, useState } from 'react';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import RoleSelector from './pages/RoleSelector';
import MemoristaHome from './pages/MemoristaHome';
import CreateProposal from './pages/CreateProposal';
import InscribedProposals from './pages/InscribedProposals';
import CorreferenteHome from './pages/CorreferenteHome';
import AvailableProposals from './pages/AvailableProposals';
import AssignedProposals from './pages/AssignedProposals';
import ProposalEvaluation from './pages/ProposalEvaluation';
import UploadDeliverable from './pages/UploadDeliverable';
import { listarEntregables, listarPropuestas } from './lib/api';
import SecretariaReportes from './pages/SecretariaReportes';
import ProposalDetails from './pages/ProposalDetails';
import JefeCarreraHome from './pages/JefeCarreraHome';
import EditProposal from './pages/EditProposal';

const propuestasLista = [
    {
      id: 1,
      titulo: 'Desarrollo de un Sistema de Gestión de Memorias',
      memorista: 'Benjamín Campos',
      descripcion: 'Plataforma web para agilizar el proceso de inscripción y evaluación de trabajos de título en el departamento.'
    },
    {
      id: 2,
      titulo: 'Optimización de Rutas Logísticas con IA',
      memorista: 'Joaquín Hormaechea',
      descripcion: 'Implementación de algoritmos de Machine Learning para mejorar los tiempos de entrega en empresas de última milla.'
    },
    {
      id: 3,
      titulo: 'Aplicación Móvil para Monitoreo IoT',
      memorista: 'Renato Lazilotta',
      descripcion: 'Desarrollo de una app multiplataforma para visualizar datos en tiempo real de sensores agrícolas y temperatura.'
    },
    {
      id: 4,
      titulo: 'Análisis de Ciberseguridad en Redes SD-WAN',
      memorista: 'Jesús Bustamante',
      descripcion: 'Estudio de vulnerabilidades y propuesta de mejoras de seguridad en arquitecturas de red definidas por software.'
    }
  ];

const initialFormData = {
    memorista: 'Benjamín Campos',
    rut: '',
    rolUsm: '202473094-0',
    celular: '',
    campus: 'Casa Central',
    modalidad: 'Tradicional',
    profesor: 'Cristobal Cordova',
    tema: 'Desarrollo de Gestion de memorias para el departamento de informatica',
    resumen: '',
    objetivos: '',
    problema: '',
    referencias: ''
  };

export default function AppContent() {
  const [currentView, setCurrentView] = useState('login');
  const [formData, setFormData] = useState(initialFormData);
  const [propuestas, setPropuestas] = useState([]);
  const [propuestasError, setPropuestasError] = useState('');
  const [entregables, setEntregables] = useState([]);
  const [entregablesError, setEntregablesError] = useState('');
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);

  useEffect(() => {
    async function loadPropuestas() {
      try {
        setPropuestas(await listarPropuestas());
      } catch (error) {
        setPropuestasError(error.message);
      }
    }

    async function loadEntregables() {
      try {
        const propuestasCargadas = await listarPropuestas();
        setPropuestas(propuestasCargadas);
        const entregablesPorPropuesta = await Promise.all(
          propuestasCargadas
            .filter((propuesta) => propuesta.id || propuesta._id)
            .map((propuesta) => listarEntregables(propuesta.id || propuesta._id)),
        );
        setEntregables(entregablesPorPropuesta.flat());
      } catch (error) {
        setEntregablesError(error.message);
      }
    }

    loadEntregables();
  }, []);

  function handleProposalCreated(propuesta) {
    setPropuestas((currentPropuestas) => {
      const id = propuesta.id || propuesta._id;
      const exists = currentPropuestas.some((item) => String(item.id || item._id) === String(id));
      return exists
        ? currentPropuestas.map((item) => String(item.id || item._id) === String(id) ? propuesta : item)
        : [...currentPropuestas, propuesta];
    });
  }

  function handleDeliverableCreated(entregable) {
    setEntregables((currentEntregables) => [...currentEntregables, entregable]);
  }

  function handleDeliverableEvaluated(entregableId, propuestaId) {
    setEntregables((currentEntregables) => currentEntregables.map((entregable) => (
      String(entregable.id) === String(entregableId)
        ? { ...entregable, estado: 'Revisado' }
        : entregable
    )));
  }

  function handleProposalEvaluated(propuestaId, estado) {
    if (estado === '__ELIMINADA__') {
      setPropuestas((currentPropuestas) => currentPropuestas.filter((propuesta) => String(propuesta.id || propuesta._id) !== String(propuestaId)));
      return;
    }
    setPropuestas((currentPropuestas) => currentPropuestas.map((propuesta) => (
      String(propuesta.id || propuesta._id) === String(propuestaId)
        ? { ...propuesta, estado }
        : propuesta
    )));
  }

  const pageProps = {
    currentView,
    onNavigate: setCurrentView,
    formData,
    setFormData,
    propuestasLista,
    propuestas,
    propuestasError,
    onProposalCreated: handleProposalCreated,
    entregables,
    entregablesError,
    onDeliverableCreated: handleDeliverableCreated,
    onDeliverableEvaluated: handleDeliverableEvaluated,
    onProposalEvaluated: handleProposalEvaluated,
    selectedDeliverable,
    onSelectDeliverable: setSelectedDeliverable,
    selectedProposal,
    onSelectProposal: setSelectedProposal,
  };

  const pages = {
    login: <Login {...pageProps} />, signup: <SignUp {...pageProps} />, 'selector-cargo': <RoleSelector {...pageProps} />,
    'inicio-memorista': <MemoristaHome {...pageProps} />, 'crear-propuesta': <CreateProposal {...pageProps} />,
    'propuestas-inscritas': <InscribedProposals {...pageProps} />, 'inicio-correferente': <CorreferenteHome {...pageProps} />,
    'subir-entregable': <UploadDeliverable {...pageProps} />,
    'propuestas-disponibles': <AvailableProposals {...pageProps} />, 'propuestas-asignadas': <AssignedProposals {...pageProps} />,
    'evaluacion-propuesta': <ProposalEvaluation {...pageProps} />,
    'detalle-propuesta': <ProposalDetails {...pageProps} />,
    'secretaria-reportes': <SecretariaReportes {...pageProps} />,
    'jefe-carrera': <JefeCarreraHome {...pageProps} />,
    'editar-propuesta': <EditProposal {...pageProps} />,
  };

  return pages[currentView] || pages.login;
}
