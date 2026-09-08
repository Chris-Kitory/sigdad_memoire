const pool = require('../db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query('SELECT id, nom, postnom, email, role FROM utilisateurs WHERE id = $1', [id]);
  return result.rows[0];
}

async function createUser({ nom, postnom, email, motDePasseHache, role }) {
  const result = await pool.query(
    `INSERT INTO utilisateurs (nom, postnom, email, mot_de_passe, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nom, postnom, email, role`,
    [nom, postnom, email, motDePasseHache, role]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, createUser };
