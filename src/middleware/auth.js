const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Non authentifie. Veuillez vous connecter.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateur = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expiree.' });
  }
}

function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.utilisateur || !rolesAutorises.includes(req.utilisateur.role)) {
      return res.status(403).json({ error: 'Acces refuse pour ce role.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
