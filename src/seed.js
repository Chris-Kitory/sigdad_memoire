require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seed() {
  const motDePasseHache = await bcrypt.hash('password123', 10);

  const comptes = [
    { nom: 'Agent', postnom: 'Test', email: 'agent@makala.cd', role: 'agent' },
    { nom: 'Bourgmestre', postnom: 'Test', email: 'bourgmestre@makala.cd', role: 'bourgmestre' },
  ];

  for (const compte of comptes) {
    const existant = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [compte.email]);
    if (existant.rows.length > 0) {
      console.log(`Deja present: ${compte.email}`);
      continue;
    }
    await pool.query(
      `INSERT INTO utilisateurs (nom, postnom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4, $5)`,
      [compte.nom, compte.postnom, compte.email, motDePasseHache, compte.role]
    );
    console.log(`Cree: ${compte.email} / mot de passe: password123`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
