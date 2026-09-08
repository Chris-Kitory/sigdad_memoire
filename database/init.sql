-- Schéma minimal SIGDA - MVP
-- Rôles : citoyen, agent, bourgmestre

CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    postnom VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('citoyen', 'agent', 'bourgmestre')),
    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE TABLE demandes (
    id SERIAL PRIMARY KEY,
    code_suivi VARCHAR(20) UNIQUE NOT NULL,
    citoyen_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    type_document VARCHAR(100) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'soumis'
        CHECK (statut IN ('soumis', 'verifie', 'signe', 'rejete')),
    piece_justificative VARCHAR(255),
    agent_verificateur_id INTEGER REFERENCES utilisateurs(id),
    date_verification TIMESTAMP,
    bourgmestre_id INTEGER REFERENCES utilisateurs(id),
    date_signature TIMESTAMP,
    code_qr VARCHAR(255),
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Compte bourgmestre et agent de test (mot de passe: "password123" haché en bcrypt à générer via le script seed)
