const PDFDocument = require('pdfkit');

const formato = (valor) => valor === null || valor === undefined || valor === '' ? 'Sin registrar' : String(valor);
const fecha = (valor) => valor ? new Date(valor).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : 'Sin registrar';

function crearDocumento(propuesta, notas, historial) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: {
      Title: `Reporte de estado - Memoria ${propuesta.id}`,
      Author: 'Sistema de Gestión de Memorias (SGM)'
    } });
    const partes = [];
    doc.on('data', (parte) => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const seccion = (nombre) => {
      doc.moveDown(1).font('Helvetica-Bold').fontSize(12).fillColor('#0369a1').text(nombre);
      doc.moveDown(0.35).font('Helvetica').fontSize(9).fillColor('#111827');
    };
    const dato = (nombre, valor) => {
      doc.font('Helvetica-Bold').text(`${nombre}: `, { continued: true });
      doc.font('Helvetica').text(formato(valor));
    };

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0369a1').text('UNIVERSIDAD TÉCNICA FEDERICO SANTA MARÍA', { align: 'center' });
    doc.font('Helvetica').fontSize(12).fillColor('#111827').text('Sistema de Gestión de Memorias', { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(14).moveDown(1).text('Reporte de estado de memoria', { align: 'center' });

    seccion('1. Antecedentes de la memoria');
    dato('Identificador', propuesta.id);
    dato('Título', propuesta.titulo);
    dato('Memorista', propuesta.memorista);
    dato('Profesor guía', propuesta.profesor);
    dato('Campus', propuesta.campus);
    dato('Modalidad', propuesta.modalidad);
    dato('Estado al emitir', propuesta.estado);

    seccion('2. Calificaciones');
    dato('Nota escrita (60 %)', notas.nota_escrita);
    dato('Nota oral (40 %)', notas.nota_oral);
    doc.font('Helvetica-Bold').text(`Nota final ponderada: ${notas.nota_final}`);

    seccion('3. Evaluaciones de la propuesta');
    if (historial.evaluaciones.length === 0) doc.text('Sin evaluaciones de propuesta registradas.');
    for (const ev of historial.evaluaciones) {
      dato('Evaluador', ev.evaluador_nombre);
      dato('Nota', ev.nota);
      dato('Observaciones', ev.comentarios);
      doc.moveDown(0.3);
    }

    seccion('4. Historial de entregables');
    if (historial.entregables.length === 0) doc.text('Sin entregables registrados.');
    for (const e of historial.entregables) {
      doc.font('Helvetica-Bold').text(`Entregable #${e.id} — ${formato(e.etapa)}`);
      doc.font('Helvetica');
      dato('Archivo', e.nombre_archivo);
      dato('Estado', e.estado);
      dato('Fecha de entrega', fecha(e.fecha_subida));
      for (const ev of (e.evaluaciones || [])) {
        dato('Evaluación por', ev.evaluador_nombre);
        dato('Nota de evaluación', ev.nota);
        dato('Observaciones', ev.comentarios);
      }
      doc.moveDown(0.4);
    }

    seccion('5. Registro del reporte');
    dato('Fecha de generación', fecha(new Date().toISOString()));
    doc.moveDown(1).fontSize(8).fillColor('#6b7280')
      .text('Documento emitido por el Sistema de Gestión de Memorias. Calificaciones ponderadas conforme a la configuración académica vigente en el sistema.', { align: 'center' });
    doc.end();
  });
}

module.exports = { crearDocumento };
