const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/demandeController');

// Public
router.get('/catalogue', ctrl.catalogue);
router.get('/suivi/:code', ctrl.suivre);

// Citoyen
router.post('/', requireAuth, requireRole('citoyen'), upload.single('pieceIdentitaire'), ctrl.soumettre);
router.get('/mes-demandes', requireAuth, requireRole('citoyen'), ctrl.mesDemandes);
router.get('/:id/pdf', requireAuth, requireRole('citoyen'), ctrl.telechargerPdf);

// Piece identitaire : citoyen proprietaire, agent, bourgmestre (verifie dans le controleur)
router.get('/:id/piece', requireAuth, ctrl.voirPieceIdentitaire);

// Agent
router.get('/a-verifier', requireAuth, requireRole('agent'), ctrl.aVerifier);
router.get('/citoyens', requireAuth, requireRole('agent'), ctrl.citoyensInscrits);
router.get('/bon/:code', requireAuth, requireRole('agent'), ctrl.rechercherParBon);
router.post('/:id/verifier', requireAuth, requireRole('agent'), ctrl.verifier);
router.post('/:id/donnees', requireAuth, requireRole('agent'), ctrl.enregistrerDonnees);
router.post('/:id/rejeter', requireAuth, requireRole('agent'), ctrl.rejeter);

// Bourgmestre
router.get('/a-signer', requireAuth, requireRole('bourgmestre'), ctrl.aSigner);
router.get('/statistiques', requireAuth, requireRole('bourgmestre'), ctrl.statistiques);
router.get('/utilisateurs', requireAuth, requireRole('bourgmestre'), ctrl.utilisateurs);
router.post('/:id/signer', requireAuth, requireRole('bourgmestre'), ctrl.signer);

module.exports = router;
