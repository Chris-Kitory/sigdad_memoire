const pool = require('../db');

function genererCodeSuivi() {
  const annee = new Date().getFullYear();
  const alea = Math.floor(100000 + Math.random() * 900000);
  return `SIGDA-${annee}-${alea}`;
}

async function creerDemande({ citoyenId, typeDocument, pieceJustificative }) {
  const codeSuivi = genererCodeSuivi();
  const result = await pool.query(
    `INSERT INTO demandes (code_suivi, citoyen_id, type_document, piece_justificative)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [codeSuivi, citoyenId, typeDocument, pieceJustificative]
  );
  return result.rows[0];
}

async function trouverParCode(codeSuivi) {
  const result = await pool.query('SELECT * FROM demandes WHERE code_suivi = $1', [codeSuivi]);
  return result.rows[0];
}

async function trouverParCitoyen(citoyenId) {
  const result = await pool.query(
    'SELECT * FROM demandes WHERE citoyen_id = $1 ORDER BY date_creation DESC',
    [citoyenId]
  );
  return result.rows;
}

async function listerParStatut(statut) {
  const result = await pool.query(
    'SELECT d.*, u.nom AS citoyen_nom, u.postnom AS citoyen_postnom FROM demandes d JOIN utilisateurs u ON u.id = d.citoyen_id WHERE d.statut = $1 ORDER BY d.date_creation ASC',
    [statut]
  );
  return result.rows;
}

async function verifierDemande({ id, agentId }) {
  const result = await pool.query(
    `UPDATE demandes SET statut = 'verifie', agent_verificateur_id = $2, date_verification = NOW()
     WHERE id = $1 AND statut = 'soumis'
     RETURNING *`,
    [id, agentId]
  );
  return result.rows[0];
}

async function rejeterDemande({ id, agentId }) {
  const result = await pool.query(
    `UPDATE demandes SET statut = 'rejete', agent_verificateur_id = $2, date_verification = NOW()
     WHERE id = $1 AND statut = 'soumis'
     RETURNING *`,
    [id, agentId]
  );
  return result.rows[0];
}

async function signerDemande({ id, bourgmestreId, codeQr }) {
  const result = await pool.query(
    `UPDATE demandes SET statut = 'signe', bourgmestre_id = $2, date_signature = NOW(), code_qr = $3
     WHERE id = $1 AND statut = 'verifie'
     RETURNING *`,
    [id, bourgmestreId, codeQr]
  );
  return result.rows[0];
}

module.exports = {
  creerDemande,
  trouverParCode,
  trouverParCitoyen,
  listerParStatut,
  verifierDemande,
  rejeterDemande,
  signerDemande,
};
