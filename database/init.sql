-- Schéma SIGDA - avec paiement, règles métier et données d'identité

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
    type_document VARCHAR(60) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'en_attente_paiement'
        CHECK (statut IN ('en_attente_paiement', 'verifie', 'signe', 'rejete', 'expire')),

    -- Piece d'identite televersee par le citoyen (carte d'identite, passeport, etc.)
    piece_identitaire VARCHAR(255),

    -- Donnees d'identite saisies par le citoyen, adaptees au type de document (JSON flexible)
    donnees_identite JSONB NOT NULL DEFAULT '{}',
    -- Donnees corrigees/validees par l'agent apres controle de la piece physique (NULL tant que non verifie)
    donnees_identite_verifiees JSONB,

    -- Paiement
    prix_usd NUMERIC(6,2) NOT NULL DEFAULT 0,
    gratuit BOOLEAN NOT NULL DEFAULT FALSE,
    bon_paiement VARCHAR(30) UNIQUE NOT NULL,
    date_expiration_bon TIMESTAMP NOT NULL,
    date_paiement TIMESTAMP,

    -- Cas particulier naissance
    date_evenement DATE,
    jugement_suppletif_numero VARCHAR(100),

    -- Verification (agent)
    agent_verificateur_id INTEGER REFERENCES utilisateurs(id),
    date_verification TIMESTAMP,

    -- Signature (bourgmestre)
    bourgmestre_id INTEGER REFERENCES utilisateurs(id),
    date_signature TIMESTAMP,
    code_qr VARCHAR(255),

    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_demandes_citoyen ON demandes(citoyen_id);
CREATE INDEX idx_demandes_statut ON demandes(statut);
CREATE INDEX idx_demandes_bon ON demandes(bon_paiement);
