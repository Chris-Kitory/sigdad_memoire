const express = require('express');
const router = express.Router();
const { requireRolePage } = require('../middleware/authPage');
const { trouverParId } = require('../models/demandeModel');
const { obtenirDocument } = require('../config/documents');

router.get('/', (req, res) => {
  res.render('index', { utilisateur: req.utilisateurPage, page: 'accueil' });
});

router.get('/renseignements', (req, res) => {
  res.render('renseignements', { utilisateur: req.utilisateurPage, page: 'renseignements' });
});

router.get('/structure', (req, res) => {
  res.render('structure', { utilisateur: req.utilisateurPage, page: 'structure' });
});

router.get('/documents', (req, res) => {
  res.render('documents', { utilisateur: req.utilisateurPage, page: 'documents' });
});

router.get('/police', (req, res) => {
  res.render('police', { utilisateur: req.utilisateurPage, page: 'police' });
});

router.get('/demande-document', (req, res) => {
  res.render('demande-document', { utilisateur: req.utilisateurPage, page: 'demande-document' });
});

router.get('/a-propos', (req, res) => {
  res.render('a-propos', { utilisateur: req.utilisateurPage, page: 'a-propos' });
});

router.get('/login', (req, res) => {
  if (req.utilisateurPage) return res.redirect('/');
  res.render('login', { utilisateur: null, page: 'connexion' });
});

router.get('/register', (req, res) => {
  if (req.utilisateurPage) return res.redirect('/');
  res.render('register', { utilisateur: null, page: 'inscription' });
});

router.get('/citoyen', requireRolePage('citoyen'), (req, res) => {
  res.render('citoyen/dashboard', { utilisateur: req.utilisateurPage, page: 'espace-citoyen' });
});

router.get('/citoyen/bon/:id', requireRolePage('citoyen'), async (req, res) => {
  const demande = await trouverParId(req.params.id);
  if (!demande || demande.citoyen_id !== req.utilisateurPage.id) {
    return res.redirect('/citoyen');
  }
  const doc = obtenirDocument(demande.type_document);
  res.render('citoyen/bon-imprimable', {
    utilisateur: req.utilisateurPage,
    page: 'bon-paiement',
    demande,
    libelleDocument: doc ? doc.label : demande.type_document,
  });
});

router.get('/agent', requireRolePage('agent'), (req, res) => {
  res.render('agent/dashboard', { utilisateur: req.utilisateurPage, page: 'espace-agent' });
});

router.get('/agent/citoyens', requireRolePage('agent'), (req, res) => {
  res.render('agent/citoyens', { utilisateur: req.utilisateurPage, page: 'espace-agent' });
});

router.get('/agent/verifier/:id', requireRolePage('agent'), async (req, res) => {
  const demande = await trouverParId(req.params.id);
  if (!demande) return res.redirect('/agent');
  const doc = obtenirDocument(demande.type_document);
  res.render('agent/verifier', {
    utilisateur: req.utilisateurPage,
    page: 'espace-agent',
    demande,
    doc,
  });
});

router.get('/bourgmestre', requireRolePage('bourgmestre'), (req, res) => {
  res.render('bourgmestre/dashboard', { utilisateur: req.utilisateurPage, page: 'espace-bourgmestre' });
});

router.get('/bourgmestre/utilisateurs', requireRolePage('bourgmestre'), (req, res) => {
  res.render('bourgmestre/utilisateurs', { utilisateur: req.utilisateurPage, page: 'espace-bourgmestre' });
});

router.get('/bourgmestre/signer/:id', requireRolePage('bourgmestre'), async (req, res) => {
  const demande = await trouverParId(req.params.id);
  if (!demande) return res.redirect('/bourgmestre');
  const doc = obtenirDocument(demande.type_document);
  res.render('bourgmestre/signer', {
    utilisateur: req.utilisateurPage,
    page: 'espace-bourgmestre',
    demande,
    doc,
  });
});

// Apercu du document : accessible au citoyen proprietaire, a l'agent, au Bourgmestre
router.get('/document/apercu/:id', async (req, res) => {
  if (!req.utilisateurPage) return res.redirect('/login');
  const demande = await trouverParId(req.params.id);
  if (!demande) return res.redirect('/');

  const estProprietaire = req.utilisateurPage.role === 'citoyen' && demande.citoyen_id === req.utilisateurPage.id;
  const estPersonnelCommunal = req.utilisateurPage.role === 'agent' || req.utilisateurPage.role === 'bourgmestre';
  if (!estProprietaire && !estPersonnelCommunal) return res.redirect('/');

  const doc = obtenirDocument(demande.type_document);
  res.render('document-apercu', {
    utilisateur: req.utilisateurPage,
    page: 'apercu',
    demande,
    doc,
  });
});

module.exports = router;
