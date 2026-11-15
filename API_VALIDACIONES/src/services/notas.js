const PONDERACION = Object.freeze({ escrita: 60, oral: 40 });

function notasValidas(escrita, oral) {
  return Number.isInteger(escrita) && Number.isInteger(oral) &&
    escrita >= 0 && escrita <= 100 && oral >= 0 && oral <= 100;
}

function notaFinal(escrita, oral) {
  if (!notasValidas(escrita, oral)) throw new RangeError('Las notas deben ser enteros entre 0 y 100.');
  return Math.round(escrita * 0.60 + oral * 0.40);
}

module.exports = { PONDERACION, notasValidas, notaFinal };
