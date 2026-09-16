const pool = require('../db');

function genererCodeSuivi() {
  const annee = new Date().getFullYear();
  const alea = Math.floor(100000 + Math.random() * 900000);
  return `SIGDA-${annee}-${alea}`;
}

function genererBonPaiement() {
  const alea = Math.floor(100000 + Math.random() * 900000);
  return `BON-${alea}`;
}

const DELAI_PAIEMENT_HEURES = 48;
const DELAI_COOLDOWN_MOIS = 6;

async function expirerBonsDepasses() {
  await pool.query(
    `UPDATE demandes SET statut = 'expire'
     WHERE statut = 'en_attente_paiement' AND date_expiration_bon < NOW()`
  );
}

async function verifierDelaiCooldown({ citoyenId, typeDocument }) {
  const result = await pool.query(
    `SELECT date_signature FROM demandes
     WHERE citoyen_id = $1 AND type_document = $2 AND statut = 'signe'
     ORDER BY date_signature DESC LIMIT 1`,
    [citoyenId, typeDocument]
  );

  if (result.rows.length === 0) return { autorise: true };

  const derniereSignature = new Date(result.rows[0].date_signature);
  const prochaineDateAutorisee = new Date(derniereSignature);
  prochaineDateAutorisee.setMonth(prochaineDateAutorisee.getMonth() + DELAI_COOLDOWN_MOIS);

  if (prochaineDateAutorisee > new Date()) {
    return { autorise: false, prochaineDateAutorisee };
  }
  return { autorise: true };
}

async function creerDemande({ citoyenId, typeDocument, pieceIdentitaire, donneesIdentite, prix, gratuit, dateEvenement, jugementSuppletifNumero }) {
  const codeSuivi = genererCodeSuivi();
  const bonPaiement = genererBonPaiement();
  const dateExpirationBon = new Date(Date.now() + DELAI_PAIEMENT_HEURES * 60 * 60 * 1000);

  const result = await pool.query(
    `INSERT INTO demandes
       (code_suivi, citoyen_id, type_document, piece_identitaire, donnees_identite, prix_usd, gratuit,
        bon_paiement, date_expiration_bon, date_evenement, jugement_suppletif_numero)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [codeSuivi, citoyenId, typeDocument, pieceIdentitaire, JSON.stringify(donneesIdentite || {}), prix, gratuit,
      bonPaiement, dateExpirationBon, dateEvenement || null, jugementSuppletifNumero || null]
  );
  return result.rows[0];
}

async function trouverParCode(codeSuivi) {
  const result = await pool.query('SELECT * FROM demandes WHERE code_suivi = $1', [codeSuivi]);
  return result.rows[0];
}

async function trouverParBon(bonPaiement) {
  const result = await pool.query(
    `SELECT d.*, u.nom AS citoyen_nom, u.postnom AS citoyen_postnom, u.email AS citoyen_email
     FROM demandes d JOIN utilisateurs u ON u.id = d.citoyen_id
     WHERE d.bon_paiement = $1`,
    [bonPaiement]
  );
  return result.rows[0];
}

async function trouverParId(id) {
  const result = await pool.query(
    `SELECT d.*, u.nom AS citoyen_nom, u.postnom AS citoyen_postnom, u.email AS citoyen_email
     FROM demandes d JOIN utilisateurs u ON u.id = d.citoyen_id
     WHERE d.id = $1`,
    [id]
  );
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
    `SELECT d.*, u.nom AS citoyen_nom, u.postnom AS citoyen_postnom FROM demandes d
     JOIN utilisateurs u ON u.id = d.citoyen_id
     WHERE d.statut = $1 ORDER BY d.date_creation ASC`,
    [statut]
  );
  return result.rows;
}

// Agent : enregistre/corrige les informations d'identite apres controle de la piece physique
async function mettreAJourDonneesVerifiees({ id, donneesIdentiteVerifiees }) {
  const result = await pool.query(
    `UPDATE demandes SET donnees_identite_verifiees = $2 WHERE id = $1 RETURNING *`,
    [id, JSON.stringify(donneesIdentiteVerifiees)]
  );
  return result.rows[0];
}

// Agent : confirme le paiement (recu en personne) ET valide le dossier
async function verifierDemande({ id, agentId, donneesIdentiteVerifiees }) {
  const result = await pool.query(
    `UPDATE demandes
     SET statut = 'verifie', agent_verificateur_id = $2, date_verification = NOW(), date_paiement = NOW(),
         donnees_identite_verifiees = COALESCE($3, donnees_identite_verifiees, donnees_identite)
     WHERE id = $1 AND statut = 'en_attente_paiement'
     RETURNING *`,
    [id, agentId, donneesIdentiteVerifiees ? JSON.stringify(donneesIdentiteVerifiees) : null]
  );
  return result.rows[0];
}

async function rejeterDemande({ id, agentId }) {
  const result = await pool.query(
    `UPDATE demandes SET statut = 'rejete', agent_verificateur_id = $2, date_verification = NOW()
     WHERE id = $1 AND statut = 'en_attente_paiement'
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

async function obtenirStatistiques() {
  const parType = await pool.query(
    `SELECT type_document, COUNT(*) AS total,
            COUNT(*) FILTER (WHERE statut = 'signe') AS signes
     FROM demandes GROUP BY type_document ORDER BY total DESC`
  );
  const parStatut = await pool.query(
    `SELECT statut, COUNT(*) AS total FROM demandes GROUP BY statut`
  );
  const totalCitoyens = await pool.query(
    `SELECT COUNT(*) AS total FROM utilisateurs WHERE role = 'citoyen'`
  );
  const revenus = await pool.query(
    `SELECT COALESCE(SUM(prix_usd), 0) AS total FROM demandes WHERE statut = 'signe'`
  );

  return {
    parType: parType.rows,
    parStatut: parStatut.rows,
    totalCitoyens: parseInt(totalCitoyens.rows[0].total, 10),
    revenusUsd: parseFloat(revenus.rows[0].total),
  };
}

// Bourgmestre : liste de tous les utilisateurs (agents + citoyens)
async function listerTousUtilisateurs() {
  const result = await pool.query(
    `SELECT u.id, u.nom, u.postnom, u.email, u.role, u.date_creation,
            COUNT(d.id) AS nombre_demandes
     FROM utilisateurs u
     LEFT JOIN demandes d ON d.citoyen_id = u.id
     GROUP BY u.id
     ORDER BY u.role, u.date_creation DESC`
  );
  return result.rows;
}

// Agent : liste des citoyens ayant soumis au moins une demande
async function listerCitoyensAvecDemandes() {
  const result = await pool.query(
    `SELECT u.id, u.nom, u.postnom, u.email, u.date_creation,
            COUNT(d.id) AS nombre_demandes,
            COUNT(d.id) FILTER (WHERE d.statut = 'signe') AS demandes_signees
     FROM utilisateurs u
     JOIN demandes d ON d.citoyen_id = u.id
     WHERE u.role = 'citoyen'
     GROUP BY u.id
     ORDER BY MAX(d.date_creation) DESC`
  );
  return result.rows;
}

module.exports = {
  creerDemande,
  trouverParCode,
  trouverParBon,
  trouverParId,
  trouverParCitoyen,
  listerParStatut,
  verifierDemande,
  rejeterDemande,
  signerDemande,
  verifierDelaiCooldown,
  expirerBonsDepasses,
  obtenirStatistiques,
  mettreAJourDonneesVerifiees,
  listerTousUtilisateurs,
  listerCitoyensAvecDemandes,
  DELAI_PAIEMENT_HEURES,
};
