const PDFDocument = require('pdfkit');
const { obtenirDocument } = require('../config/documents');

// Genere le PDF officiel d'un document signe et l'ecrit directement dans la reponse HTTP
function genererPdfDocument(res, demande) {
  const doc = obtenirDocument(demande.type_document);
  const libelleDocument = doc ? doc.label : demande.type_document;
  const donnees = demande.donnees_identite_verifiees || demande.donnees_identite || {};

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${demande.code_suivi}.pdf"`);

  const pdf = new PDFDocument({ size: 'A4', margin: 56 });
  pdf.pipe(res);

  // Bandeau d'en-tete
  pdf.fontSize(10).fillColor('#4B5763').text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', { align: 'center' });
  pdf.fontSize(13).fillColor('#1B3358').font('Helvetica-Bold')
    .text('MAISON COMMUNALE DE MAKALA', { align: 'center' });
  pdf.moveDown(0.3);
  pdf.moveTo(56, pdf.y).lineTo(539, pdf.y).strokeColor('#1B3358').lineWidth(1.5).stroke();
  pdf.moveDown(1);

  // Titre du document
  pdf.fontSize(17).fillColor('#1B3358').font('Helvetica-Bold')
    .text(libelleDocument.toUpperCase(), { align: 'center' });
  pdf.moveDown(1.2);

  // Corps : informations d'identite
  pdf.fontSize(11).fillColor('#1E2430').font('Helvetica');
  const champs = doc ? doc.champsIdentite : [];
  champs.forEach((champ) => {
    const valeur = donnees[champ.id] || '—';
    pdf.font('Helvetica-Bold').text(`${champ.label} : `, { continued: true });
    pdf.font('Helvetica').text(valeur);
    pdf.moveDown(0.35);
  });

  pdf.moveDown(0.8);
  pdf.font('Helvetica').fontSize(10.5).fillColor('#4B5763').text(
    `Délivré par la Maison Communale de Makala à la suite d'une demande enregistrée sous le code ${demande.code_suivi}, ` +
    `vérifiée par les services communaux et approuvée par le Bourgmestre.`,
    { align: 'justify' }
  );

  pdf.moveDown(2);

  // Bloc signature / sceau
  const ySignature = pdf.y;
  pdf.fontSize(10).fillColor('#1E2430')
    .text(`Fait à Makala, le ${new Date(demande.date_signature).toLocaleDateString('fr-FR')}`, 56, ySignature);

  pdf.fontSize(10).fillColor('#1E2430')
    .text('Le Bourgmestre', 380, ySignature, { width: 160, align: 'center' });
  pdf.fontSize(9).fillColor('#B8863A')
    .text('(signature électronique)', 380, ySignature + 14, { width: 160, align: 'center' });

  pdf.moveDown(3);
  pdf.rect(56, pdf.y, 483, 50).strokeColor('#B8863A').dash(3, { space: 3 }).lineWidth(1).stroke();
  pdf.undash();
  pdf.fontSize(9).fillColor('#8A6423').text(
    `Sceau numérique unique : ${demande.code_qr || '—'}`,
    64, pdf.y + 18
  );

  pdf.fontSize(8).fillColor('#9AA1A9').text(
    'Document généré électroniquement par le système SIGDA — sa validité peut être vérifiée en ligne avec le code de suivi ' + demande.code_suivi + '.',
    56, 760, { width: 483, align: 'center' }
  );

  pdf.end();
}

module.exports = { genererPdfDocument };
