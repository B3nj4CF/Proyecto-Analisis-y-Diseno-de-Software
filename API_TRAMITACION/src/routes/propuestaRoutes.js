const express = require('express');
const router = express.Router();
const controller = require('../controllers/propuestaController');
const hu09Consulta = require('../controllers/hu09ConsultaController');
router.post(
  '/propuestas',
  controller.uploadMiddleware,
  controller.handleUploadError,
  controller.crearPropuesta
);
router.get('/propuestas', controller.listarPropuestas);
router.get('/propuestas/:propuesta_id', controller.obtenerPropuesta);
router.patch('/propuestas/:propuesta_id/estado', controller.actualizarEstadoPropuesta);
router.put('/propuestas/:propuesta_id', controller.editarPropuesta);
router.delete('/propuestas/:propuesta_id', controller.eliminarPropuesta);
router.get('/propuestas/:propuesta_id/archivo', controller.getProposalFile);
router.post('/propuestas/:propuesta_id/evaluaciones', controller.evaluarPropuesta);
router.get('/propuestas/:propuesta_id/evaluaciones', hu09Consulta.obtenerEvaluaciones);
module.exports = router;