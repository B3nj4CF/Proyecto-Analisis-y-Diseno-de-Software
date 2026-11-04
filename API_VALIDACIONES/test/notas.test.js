const test = require('node:test');
const assert = require('node:assert/strict');
const { notasValidas, notaFinal } = require('../src/services/notas');

test('pondera con redondeo entero 60/40', () => {
  assert.equal(notaFinal(85, 90), 87);
  assert.equal(notaFinal(78, 82), 80);
  assert.equal(notaFinal(75, 27), 56);
  assert.equal(notaFinal(0, 0), 0);
  assert.equal(notaFinal(100, 100), 100);
});

test('rechaza valores fuera de rango y decimales', () => {
  for (const x of [-1, 101, 85.5, '85', NaN, null, undefined]) {
    assert.equal(notasValidas(x, 50), false);
    assert.throws(() => notaFinal(x, 50), RangeError);
  }
});
