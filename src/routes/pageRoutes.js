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

router.get('/bourgmestre', requireRolePage('bourgmestre'), (req, res) => {
  res.render('bourgmestre/dashboard', { utilisateur: req.utilisateurPage, page: 'espace-bourgmestre' });
});

module.exports = router;
