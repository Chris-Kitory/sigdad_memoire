const {
  creerDemande,
  trouverParCode,
  trouverParCitoyen,
  listerParStatut,
  verifierDemande,
  rejeterDemande,
  signerDemande,
} = require('../models/demandeModel');

// Citoyen : soumettre une nouvelle demande
async function soumettre(req, res) {
  try {
    const { typeDocument } = req.body;
    if (!typeDocument) {
      return res.status(400).json({ error: 'Le type de document est requis.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'La piece justificative est requise.' });
    }

    const demande = await creerDemande({
      citoyenId: req.utilisateur.id,
      typeDocument,
      pieceJustificative: req.file.filename,
    });

    res.status(201).json({ message: 'Demande soumise avec succes.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la soumission.' });
  }
}

// Citoyen : voir ses propres demandes
async function mesDemandes(req, res) {
  try {
    const demandes = await trouverParCitoyen(req.utilisateur.id);
    res.json({ demandes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Public : suivre une demande par son code
async function suivre(req, res) {
  try {
    const demande = await trouverParCode(req.params.code);
    if (!demande) {
      return res.status(404).json({ error: 'Aucune demande trouvee avec ce code.' });
    }
    res.json({
      code_suivi: demande.code_suivi,
      type_document: demande.type_document,
      statut: demande.statut,
      date_creation: demande.date_creation,
      date_signature: demande.date_signature,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : liste des demandes a verifier
async function aVerifier(req, res) {
  try {
    const demandes = await listerParStatut('soumis');
    res.json({ demandes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : verifier une demande
async function verifier(req, res) {
  try {
    const demande = await verifierDemande({ id: req.params.id, agentId: req.utilisateur.id });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable ou deja traitee.' });
    }
    res.json({ message: 'Demande verifiee.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : rejeter une demande
async function rejeter(req, res) {
  try {
    const demande = await rejeterDemande({ id: req.params.id, agentId: req.utilisateur.id });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable ou deja traitee.' });
    }
    res.json({ message: 'Demande rejetee.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Bourgmestre : liste des demandes verifiees, pretes a signer
async function aSigner(req, res) {
  try {
    const demandes = await listerParStatut('verifie');
    res.json({ demandes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Bourgmestre : signer une demande
async function signer(req, res) {
  try {
    const codeQr = `QR-${req.params.id}-${Date.now()}`;
    const demande = await signerDemande({ id: req.params.id, bourgmestreId: req.utilisateur.id, codeQr });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable ou pas encore verifiee.' });
    }
    res.json({ message: 'Demande signee.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { soumettre, mesDemandes, suivre, aVerifier, verifier, rejeter, aSigner, signer };
