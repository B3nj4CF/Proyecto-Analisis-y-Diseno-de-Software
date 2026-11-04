const express = require('express');
const controller = require('../controllers/reportesController');
const { solicitudCambioEstado } = require('../middleware/guardCierreHu09');
const router = express.Router();

router.get('/:propuesta_id/reporte', controller.consultarReporte);
router.put('/:propuesta_id/notas', controller.soloSecretaria, controller.guardarNotas);
router.post('/:propuesta_id/reporte', controller.soloSecretaria, controller.generarReporte);
router.get('/:propuesta_id/reporte.pdf', controller.descargarReporte);

// HU-09: contrato de rechazo del intento de cierre por Secretaría.
// No se modifica el estado; HU-10 implementará el cierre autorizado.
router.patch('/:propuesta_id/estado', solicitudCambioEstado);

module.exports = router;
