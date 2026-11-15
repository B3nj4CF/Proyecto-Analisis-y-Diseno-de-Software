// HU-09: guard de autorización para intentar pasar un proceso a Cerrado.
// HU-10 implementará el cierre real; este módulo nunca cambia la BD.
function solicitudCambioEstado(req, res) {
  const id = req.params.propuesta_id;
  if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ error: 'El ID de la memoria debe ser un entero positivo.' });
  }

  if (req.body?.estado !== 'Cerrado') {
    return res.status(501).json({
      error: 'HU-09 no implementa cambios de estado. Esta transición corresponde al servicio académico responsable.',
      codigo: 'CAMBIO_ESTADO_FUERA_HU09'
    });
  }

  if (req.get('X-Demo-Role') !== 'jefe-carrera') {
    return res.status(403).json({
      error: 'No autorizado: solo el Jefe de Carrera puede cambiar la memoria al estado Cerrado.',
      codigo: 'CIERRE_SOLO_JEFE_CARRERA'
    });
  }

  return res.status(501).json({
    error: 'El cierre por Jefe de Carrera se implementará en HU-10. HU-09 no modifica estados.',
    codigo: 'CIERRE_PENDIENTE_HU10'
  });
}

module.exports = { solicitudCambioEstado };
