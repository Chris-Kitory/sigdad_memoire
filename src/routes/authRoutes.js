const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Route pratique pour verifier qui est connecte
router.get('/me', requireAuth, (req, res) => {
  res.json({ utilisateur: req.utilisateur });
});

module.exports = router;
