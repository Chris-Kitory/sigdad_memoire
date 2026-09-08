const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findByEmail, createUser } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET;

// Inscription : reservee aux citoyens (agent/bourgmestre crees via seed, pas d'auto-inscription)
async function register(req, res) {
  try {
    const { nom, postnom, email, motDePasse } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ error: 'Nom, email et mot de passe sont requis.' });
    }

    const existant = await findByEmail(email);
    if (existant) {
      return res.status(409).json({ error: 'Un compte existe deja avec cet email.' });
    }

    const motDePasseHache = await bcrypt.hash(motDePasse, 10);
    const utilisateur = await createUser({ nom, postnom, email, motDePasseHache, role: 'citoyen' });

    res.status(201).json({ message: 'Compte cree avec succes.', utilisateur });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
}

async function login(req, res) {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const utilisateur = await findByEmail(email);
    if (!utilisateur) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role, email: utilisateur.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });
    res.json({
      message: 'Connexion reussie.',
      utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Deconnexion reussie.' });
}

module.exports = { register, login, logout };
