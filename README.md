# SIGDA — Maison Communale de Makala

Système Intégré de Gestion des Documents Administratifs. Plateforme web permettant à un citoyen
de demander en ligne une attestation ou un acte communal, de payer au guichet avec un bon généré
par l'application, puis de faire vérifier et signer électroniquement son dossier par la commune.

Projet développé dans le cadre d'un mémoire de fin d'études en Génie Logiciel.

---

## Sommaire

- [Aperçu des fonctionnalités](#aperçu-des-fonctionnalités)
- [Stack technique](#stack-technique)
- [Lancement rapide (Docker)](#lancement-rapide-docker)
- [Comptes de test](#comptes-de-test)
- [Lancement sans Docker (développement local)](#lancement-sans-docker-développement-local)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Rôles et parcours](#rôles-et-parcours)
- [Catalogue des documents et règles métier](#catalogue-des-documents-et-règles-métier)
- [Routes principales](#routes-principales)
- [Portabilité (changer de machine)](#portabilité-changer-de-machine)
- [Problèmes connus / limites actuelles](#problèmes-connus--limites-actuelles)
- [Pistes d'évolution](#pistes-dévolution)
- [Dépannage](#dépannage)

---

## Aperçu des fonctionnalités

- Inscription et connexion (citoyen, agent, Bourgmestre) avec sessions JWT en cookie HttpOnly
- Catalogue de 7 documents avec tarification, dont une règle spéciale pour la naissance
  (gratuite ≤ 90 jours, sinon payante + jugement supplétif requis)
- Génération d'un **bon de paiement** unique (code, prix, validité 48h), imprimable
- Règle de carence : un même type de document ne peut être redemandé que 6 mois après signature
- Circuit complet : soumission → paiement/vérification (agent) → signature électronique (Bourgmestre)
- Expiration automatique des bons non honorés sous 48h
- Suivi public d'une demande par code (sans compte)
- Recherche au guichet par code de bon (agent)
- Tableau de bord Bourgmestre avec statistiques (citoyens inscrits, demandes par statut,
  revenus perçus, répartition par type de document)
- Pages d'information : Renseignements, Structure de la commune, Documents, La Police,
  Demande de document (catalogue détaillé), À propos
- Interface en français, identité visuelle institutionnelle (drapeau RDC, sceau, palette dédiée)

## Stack technique

| Composant       | Choix                                   |
|-----------------|------------------------------------------|
| Runtime         | Node.js 20                               |
| Framework web   | Express.js                               |
| Base de données | PostgreSQL 16                            |
| Driver DB       | `pg` (requêtes paramétrées)              |
| Vues            | EJS (rendu côté serveur)                 |
| Authentification| JWT (cookie HttpOnly) + bcrypt           |
| Upload fichiers | Multer (PDF/JPG/PNG, 5 Mo max)           |
| Conteneurisation| Docker + Docker Compose                  |

Architecture MVC : `routes/` → `controllers/` → `models/`, config métier isolée dans `config/`.

## Lancement rapide (Docker)

Prérequis : [Docker](https://www.docker.com/) installé (Docker Desktop sur Windows/Mac,
`docker` + `docker compose` sur Linux).

```bash
cp .env.example .env
docker compose up --build
```

Ouvrir **http://localhost:3000**.

Vérifier que tout fonctionne : http://localhost:3000/health doit répondre
`{"status":"ok","database":"connected",...}`.

Créer les comptes agent et Bourgmestre (une seule fois, dans un second terminal pendant que
`docker compose up` tourne) :

```bash
docker compose exec app node src/seed.js
```

Pour tout arrêter : `Ctrl+C` puis `docker compose down`.
Pour repartir sur une base de données vierge (perd les données) : `docker compose down -v`.

## Comptes de test

| Rôle        | Email                  | Mot de passe   | Création                          |
|-------------|-------------------------|----------------|------------------------------------|
| Citoyen     | (au choix)              | (au choix)     | Auto-inscription sur `/register`   |
| Agent       | agent@makala.cd         | password123    | `node src/seed.js`                 |
| Bourgmestre | bourgmestre@makala.cd   | password123    | `node src/seed.js`                 |

## Lancement sans Docker (développement local)

Nécessite Node.js 20+ et un PostgreSQL local (ou distant) déjà démarré.

```bash
npm install
createdb sigda_makala            # ou via un client graphique (pgAdmin, TablePlus, etc.)
psql -d sigda_makala -f database/init.sql
cp .env.example .env             # adapter DB_HOST=localhost et les identifiants
node src/seed.js
npm run dev                      # avec nodemon, redémarre automatiquement au changement de code
```

## Variables d'environnement

Définies dans `.env` (jamais commité — voir `.env.example` pour le modèle) :

| Variable      | Rôle                                              |
|---------------|-----------------------------------------------------|
| `NODE_ENV`    | `development` ou `production`                      |
| `PORT`        | Port du serveur Express (3000 par défaut)           |
| `DB_HOST`     | Hôte PostgreSQL (`db` sous Docker, `localhost` sinon)|
| `DB_PORT`     | Port PostgreSQL (5432)                              |
| `DB_USER`     | Utilisateur PostgreSQL                              |
| `DB_PASSWORD` | Mot de passe PostgreSQL                             |
| `DB_NAME`     | Nom de la base (`sigda_makala`)                     |
| `JWT_SECRET`  | Clé de signature des sessions — à changer en prod   |

## Structure du projet

```
sigda-app/
├── database/
│   └── init.sql              # schéma PostgreSQL (utilisateurs, demandes)
├── public/
│   ├── css/style.css         # feuille de style unique (design system)
│   └── js/demandes-communes.js  # rendu partagé des lignes "demande" (JS client)
├── src/
│   ├── config/
│   │   └── documents.js      # catalogue des 7 documents, prix, règle naissance
│   ├── controllers/
│   │   ├── authController.js
│   │   └── demandeController.js
│   ├── middleware/
│   │   ├── auth.js           # protection des routes API (JSON 401/403)
│   │   ├── authPage.js       # protection des routes pages (redirections)
│   │   └── upload.js         # Multer (type/taille des pièces jointes)
│   ├── models/
│   │   ├── userModel.js
│   │   └── demandeModel.js   # logique métier : bon, prix, cooldown, expiration, stats
│   ├── routes/
│   │   ├── authRoutes.js     # /auth/*
│   │   ├── demandeRoutes.js  # /demandes/*
│   │   └── pageRoutes.js     # pages rendues (/, /citoyen, /agent, ...)
│   ├── views/
│   │   ├── partials/         # header (nav + drapeau) et footer communs
│   │   ├── citoyen/          # dashboard + bon de paiement imprimable
│   │   ├── agent/            # dashboard guichet
│   │   ├── bourgmestre/      # dashboard + statistiques
│   │   └── *.ejs             # pages publiques (accueil, à propos, structure, ...)
│   ├── db.js                 # pool de connexion PostgreSQL
│   ├── seed.js                # crée les comptes agent + Bourgmestre
│   └── index.js               # point d'entrée Express
├── docker-compose.yml         # app + PostgreSQL
├── Dockerfile
├── .env.example
└── package.json
```

## Rôles et parcours

**Citoyen** (`/citoyen`) — s'inscrit librement, choisit un document dans le catalogue, joint sa
pièce justificative, reçoit un bon de paiement imprimable, consulte l'historique de ses demandes.

**Agent** (`/agent`) — recherche une demande par code de bon (guichet) ou la retrouve dans la
liste des demandes en attente ; confirme le paiement et vérifie le dossier (ou le rejette) en une
seule action.

**Bourgmestre** (`/bourgmestre`) — consulte les statistiques globales de la commune, signe
électroniquement les demandes vérifiées par l'agent.

Chaque rôle connecté voit un lien **« Mon espace »** (ou « Mon profil » pour le citoyen) en haut
de chaque page du site, permettant d'y revenir depuis n'importe quel onglet public.

## Catalogue des documents et règles métier

| Document                              | Prix indicatif       |
|----------------------------------------|------------------------|
| Attestation de résidence               | 5 $                     |
| Attestation de composition de famille  | 6 $                     |
| Attestation de célibat                 | 7 $                     |
| Attestation de bonne vie et mœurs      | 10 $                    |
| Déclaration de naissance (≤ 90 jours)  | Gratuit                 |
| Déclaration de naissance (> 90 jours)  | 12 $ + jugement supplétif requis |
| Acte de décès                          | 15 $                    |
| Acte de mariage                        | 20 $                    |

Prix modifiables dans `src/config/documents.js`. Paiement en personne, en Francs Congolais au
taux du jour ; pas d'intégration de paiement électronique à ce stade (voir Pistes d'évolution).

Règle de carence : 6 mois entre deux demandes signées du même type de document, par citoyen.

## Routes principales

**Pages** : `/`, `/login`, `/register`, `/citoyen`, `/agent`, `/bourgmestre`,
`/citoyen/bon/:id`, `/renseignements`, `/structure`, `/documents`, `/police`,
`/demande-document`, `/a-propos`

**API** :
- `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me`
- `GET /demandes/catalogue`, `GET /demandes/suivi/:code`
- `POST /demandes` (citoyen), `GET /demandes/mes-demandes` (citoyen)
- `GET /demandes/a-verifier`, `GET /demandes/bon/:code`, `POST /demandes/:id/verifier`,
  `POST /demandes/:id/rejeter` (agent)
- `GET /demandes/a-signer`, `POST /demandes/:id/signer`, `GET /demandes/statistiques`
  (Bourgmestre)
- `GET /health` (vérifie que le serveur et la base répondent)

## Portabilité (changer de machine)

Le projet est conçu pour être cloné et relancé à l'identique n'importe où :

```bash
git clone <url-du-depot>
cd sigda-app
cp .env.example .env
docker compose up --build
docker compose exec app node src/seed.js
```

`.env`, `node_modules/` et `uploads/` ne sont jamais versionnés (voir `.gitignore`) — Docker les
reconstruit à chaque `--build`. Si le schéma de base de données a changé entre deux versions du
projet, repartir d'une base propre avec `docker compose down -v` avant de relancer.

## Problèmes connus / limites actuelles

- Pas de génération de PDF téléchargeable pour le document signé (seul le statut « signé » +
  un identifiant de scellement sont enregistrés)
- Pas de notification automatique (e-mail/SMS) lors d'un changement de statut
- Paiement uniquement manuel/en personne (pas de mobile money)
- Rôles de Secrétaire Communal et d'Administrateur système non implémentés (prototype limité à
  Citoyen / Agent / Bourgmestre)
- Pas de tests automatisés (unitaires/intégration) — validation faite manuellement
- Pas de réinitialisation de mot de passe

## Pistes d'évolution

- Export PDF scellé du document signé
- Notifications e-mail/SMS
- Passerelle de paiement mobile
- Rôles Secrétaire Communal (visa) et Administrateur (gestion des comptes)
- Suite de tests automatisés
- Déploiement multi-communes (catalogue et tarifs déjà paramétrables)

## Dépannage

**`ECONNREFUSED` vers la base de données** → PostgreSQL n'est pas encore prêt ou les identifiants
`.env` ne correspondent pas à ceux du `docker-compose.yml`. Attendre quelques secondes après
`docker compose up`, ou vérifier `docker compose logs db`.

**Erreur de permissions SQL après une modification manuelle de la base** → repartir d'une base
propre : `docker compose down -v && docker compose up --build`.

**Les comptes agent/bourgmestre n'existent pas** → lancer `docker compose exec app node src/seed.js`.

**Page blanche ou 404 sur une nouvelle page** → vérifier que la route est bien déclarée dans
`src/routes/pageRoutes.js` et que la vue EJS correspondante existe dans `src/views/`.
