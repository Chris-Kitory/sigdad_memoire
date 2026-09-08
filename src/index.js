require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/auth', require('./routes/authRoutes'));

// Route de test : verifie que le serveur ET la base de donnees repondent
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      server: 'up',
      database: 'connected',
      db_time: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Base de donnees inaccessible', detail: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('SIGDA Makala - serveur en ligne. Va sur /health pour verifier la connexion DB.');
});

app.listen(PORT, () => {
  console.log(`Serveur SIGDA demarre sur le port ${PORT}`);
});
