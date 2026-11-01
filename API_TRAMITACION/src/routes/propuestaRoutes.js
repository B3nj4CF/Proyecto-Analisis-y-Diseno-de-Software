const express = require('express');
const router = express.Router();
const controller = require('../controllers/propuestaController');

router.post(
  '/propuestas',
  controller.uploadMiddleware,
  controller.handleUploadError,
  controller.crearPropuesta
);
router.get('/propuestas', controller.listarPropuestas);
router.get('/propuestas/:propuesta_id/archivo', controller.getProposalFile);
router.post('/propuestas/:propuesta_id/evaluaciones', controller.evaluarPropuesta);

module.exports = router;