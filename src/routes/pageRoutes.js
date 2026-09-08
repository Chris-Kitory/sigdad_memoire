const express = require('express');
const router = express.Router();
const { requireRolePage } = require('../middleware/authPage');

router.get('/', (req, res) => {
  res.render('index', { utilisateur: req.utilisateurPage, page: 'accueil' });
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

router.get('/agent', requireRolePage('agent'), (req, res) => {
  res.render('agent/dashboard', { utilisateur: req.utilisateurPage, page: 'espace-agent' });
});

router.get('/bourgmestre', requireRolePage('bourgmestre'), (req, res) => {
  res.render('bourgmestre/dashboard', { utilisateur: req.utilisateurPage, page: 'espace-bourgmestre' });
});

module.exports = router;
