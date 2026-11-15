const test = require('node:test');
const assert = require('node:assert/strict');
const { solicitudCambioEstado } = require('../src/middleware/guardCierreHu09');

function intentar(rol, estado = 'Cerrado', id = '1') {
  const req = {
    params: { propuesta_id: id },
    body: { estado },
    get: (cabecera) => cabecera === 'X-Demo-Role' ? rol : undefined
  };
  const resultado = { statusCode: 200, body: null };
  const res = {
    status(codigo) { resultado.statusCode = codigo; return this; },
    json(cuerpo) { resultado.body = cuerpo; return this; }
  };
  solicitudCambioEstado(req, res);
  return resultado;
}

test('HU09: Secretaria no puede cambiar una memoria a Cerrado', () => {
  const respuesta = intentar('secretaria');
  assert.equal(respuesta.statusCode, 403);
  assert.equal(respuesta.body.codigo, 'CIERRE_SOLO_JEFE_CARRERA');
  assert.match(respuesta.body.error, /Jefe de Carrera/);
});

test('HU09: un rol diferente a Jefe de Carrera tampoco puede cerrar', () => {
  assert.equal(intentar('memorista').statusCode, 403);
  assert.equal(intentar(undefined).statusCode, 403);
});

test('HU09 no implementa el cierre real, reservado para HU10', () => {
  const respuesta = intentar('jefe-carrera');
  assert.equal(respuesta.statusCode, 501);
  assert.equal(respuesta.body.codigo, 'CIERRE_PENDIENTE_HU10');
});

test('HU09 no altera otros estados ni acepta ID invalido', () => {
  assert.equal(intentar('secretaria', 'En revisión').statusCode, 501);
  assert.equal(intentar('secretaria', 'Cerrado', 'abc').statusCode, 400);
});
