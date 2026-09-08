require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const { attacherUtilisateur } = require('./middleware/authPage');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attacherUtilisateur);

app.use('/auth', require('./routes/authRoutes'));
app.use('/demandes', require('./routes/demandeRoutes'));

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

app.use('/', require('./routes/pageRoutes'));

app.listen(PORT, () => {
  console.log(`Serveur SIGDA demarre sur le port ${PORT}`);
});
