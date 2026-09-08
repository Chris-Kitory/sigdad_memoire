# SIGDA - Maison Communale de Makala

Système Intégré de Gestion des Documents Administratifs (MVP).

## Démarrage (n'importe quelle machine avec Docker installé)

```bash
cp .env.example .env
docker compose up --build
```

Puis ouvrir : http://localhost:3000/health
→ doit répondre `{"status":"ok", "database":"connected", ...}`

## Structure

```
src/
  index.js       -> point d'entrée du serveur
  db.js          -> connexion PostgreSQL
  routes/        -> routes Express (à venir)
  controllers/   -> logique métier (à venir)
  models/        -> requêtes SQL (à venir)
  middleware/    -> auth, upload, etc. (à venir)
database/
  init.sql       -> schéma de base (utilisateurs, demandes)
```

## Étape actuelle

✅ Squelette + Docker + connexion DB testée
⬜ Authentification (citoyen / agent / bourgmestre)
⬜ Soumission de demande (citoyen)
⬜ Vérification (agent)
⬜ Signature (bourgmestre)
