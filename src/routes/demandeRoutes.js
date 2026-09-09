const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/demandeController');

// Public
router.get('/catalogue', ctrl.catalogue);
router.get('/suivi/:code', ctrl.suivre);

// Citoyen
router.post('/', requireAuth, requireRole('citoyen'), upload.single('pieceJustificative'), ctrl.soumettre);
router.get('/mes-demandes', requireAuth, requireRole('citoyen'), ctrl.mesDemandes);

// Agent
router.get('/a-verifier', requireAuth, requireRole('agent'), ctrl.aVerifier);
router.get('/bon/:code', requireAuth, requireRole('agent'), ctrl.rechercherParBon);
router.post('/:id/verifier', requireAuth, requireRole('agent'), ctrl.verifier);
router.post('/:id/rejeter', requireAuth, requireRole('agent'), ctrl.rejeter);

// Bourgmestre
router.get('/a-signer', requireAuth, requireRole('bourgmestre'), ctrl.aSigner);
router.get('/statistiques', requireAuth, requireRole('bourgmestre'), ctrl.statistiques);
router.post('/:id/signer', requireAuth, requireRole('bourgmestre'), ctrl.signer);

module.exports = router;
