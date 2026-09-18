const PDFDocument = require('pdfkit');
const { obtenirDocument } = require('../config/documents');
const { genererParagraphe } = require('./documentTexte');

function genererPdfDocument(res, demande) {
  const doc = obtenirDocument(demande.type_document);
  const libelleDocument = doc ? doc.label : demande.type_document;
  const donnees = demande.donnees_identite_verifiees || demande.donnees_identite || {};
  const { paragraphe, blocSupplementaire } = genererParagraphe(demande.type_document, donnees);
  const numeroDossier = `N° ${String(demande.id).padStart(5, '0')}/${new Date(demande.date_creation).getFullYear()}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${demande.code_suivi}.pdf"`);

  const pdf = new PDFDocument({ size: 'A4', margin: 56 });
  pdf.pipe(res);

  // En-tete : sceau + commune (gauche), numero de dossier (droite)
  const yEntete = pdf.y;
  pdf.circle(70, yEntete + 16, 16).lineWidth(1.2).strokeColor('#1B3358').stroke();
  pdf.circle(70, yEntete + 16, 11).lineWidth(0.8).strokeColor('#B8863A').stroke();

  pdf.fontSize(9).fillColor('#4B5763').font('Helvetica').text('VILLE DE KINSHASA', 96, yEntete);
  pdf.fontSize(12.5).fillColor('#1B3358').font('Helvetica-Bold').text('COMMUNE DE MAKALA', 96, yEntete + 12);
  pdf.fontSize(9.5).fillColor('#4B5763').font('Helvetica').text('Service de la Population', 96, yEntete + 28);

  pdf.fontSize(8.5).fillColor('#4B5763').text(numeroDossier, 400, yEntete, { width: 139, align: 'right' });

  pdf.moveTo(56, yEntete + 46).lineTo(539, yEntete + 46).strokeColor('#1B3358').lineWidth(1.5).stroke();
  pdf.x = 56;
  pdf.y = yEntete + 62;

  // Titre
  pdf.fontSize(15).fillColor('#1B3358').font('Helvetica-Bold')
    .text(libelleDocument.toUpperCase(), { align: 'center', underline: true });
  pdf.moveDown(1.2);

  // Paragraphe juridique
  pdf.fontSize(11).fillColor('#1E2430').font('Helvetica')
    .text(paragraphe, { align: 'justify', lineGap: 4 });

  if (blocSupplementaire) {
    pdf.moveDown(1);
    pdf.fontSize(9.5).fillColor('#4B5763').font('Helvetica');
    blocSupplementaire.forEach((ligne) => {
      pdf.text(ligne, { lineGap: 3 });
    });
  }

  pdf.moveDown(2.5);

  // Bloc signature
  const ySignature = pdf.y;
  pdf.fontSize(10).fillColor('#1E2430').font('Helvetica')
    .text(`Fait à Makala, le ${demande.date_signature ? new Date(demande.date_signature).toLocaleDateString('fr-FR') : ''}`, 56, ySignature);

  pdf.fontSize(10).font('Helvetica').text('Le Bourgmestre', 380, ySignature, { width: 160, align: 'center' });

  // Paraphe (signature stylisee, courbe simple)
  pdf.save();
  pdf.strokeColor('#2F6E51').lineWidth(1.3);
  pdf.moveTo(390, ySignature + 34)
    .bezierCurveTo(410, ySignature + 15, 420, ySignature + 45, 435, ySignature + 25)
    .bezierCurveTo(445, ySignature + 12, 455, ySignature + 40, 470, ySignature + 22)
    .bezierCurveTo(480, ySignature + 10, 490, ySignature + 35, 505, ySignature + 20)
    .stroke();
  pdf.restore();

  // Tampon rond
  const cx = 470, cy = ySignature + 90, r = 42;
  pdf.save();
  pdf.strokeColor('#2255A4').lineWidth(1.4);
  pdf.circle(cx, cy, r).stroke();
  pdf.lineWidth(0.8);
  pdf.circle(cx, cy, r - 8).stroke();
  pdf.fontSize(5.6).fillColor('#2255A4').font('Helvetica-Bold')
    .text('RÉPUBLIQUE DÉM. CONGO', cx - r + 6, cy - 22, { width: (r - 6) * 2, align: 'center' });
  pdf.fontSize(6.2)
    .text('COMMUNE DE MAKALA', cx - r + 6, cy - 4, { width: (r - 6) * 2, align: 'center' });
  pdf.fontSize(5).font('Helvetica')
    .text('Bureau du Bourgmestre', cx - r + 6, cy + 6, { width: (r - 6) * 2, align: 'center' });
  pdf.restore();

  pdf.y = ySignature + 140;

  // Pied de page : numero de serie + mention de validite
  pdf.rect(56, pdf.y, 483, 44).strokeColor('#B8863A').dash(3, { space: 3 }).lineWidth(1).stroke();
  pdf.undash();
  pdf.fontSize(9).fillColor('#8A6423').text(
    `Sceau numérique unique : ${demande.code_qr || '—'}`,
    64, pdf.y + 16
  );

  pdf.fontSize(8).fillColor('#9AA1A9').text(
    `Document généré électroniquement par le système SIGDA — code de suivi ${demande.code_suivi}.`,
    56, 770, { width: 483, align: 'center' }
  );

  pdf.end();
}

module.exports = { genererPdfDocument };
