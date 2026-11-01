const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');

// Rutas de Entregables
router.post(
  '/entregables/upload',
  controller.uploadMiddleware,
  controller.handleUploadError,
  controller.subirEntregable
);
router.get('/entregables/propuesta/:propuesta_id', controller.obtenerEntregables);

// Rutas de Comentarios
router.post('/entregables/:entregable_id/comentarios', controller.agregarComentario);
router.get('/entregables/:entregable_id/comentarios', controller.obtenerComentarios);

// Rutas de Evaluaciones
router.post('/entregables/:entregable_id/evaluaciones', controller.evaluarEntregable);

module.exports = router;