const jwt = require('jsonwebtoken');

function getUtilisateurDepuisCookie(req) {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Attache l'utilisateur (ou null) a chaque requete de page, sans bloquer
function attacherUtilisateur(req, res, next) {
  req.utilisateurPage = getUtilisateurDepuisCookie(req);
  next();
}

function requireAuthPage(req, res, next) {
  const utilisateur = getUtilisateurDepuisCookie(req);
  if (!utilisateur) {
    return res.redirect('/login');
  }
  req.utilisateurPage = utilisateur;
  next();
}

function requireRolePage(...rolesAutorises) {
  return (req, res, next) => {
    const utilisateur = getUtilisateurDepuisCookie(req);
    if (!utilisateur) {
      return res.redirect('/login');
    }
    if (!rolesAutorises.includes(utilisateur.role)) {
      return res.redirect('/');
    }
    req.utilisateurPage = utilisateur;
    next();
  };
}

module.exports = { attacherUtilisateur, requireAuthPage, requireRolePage };
