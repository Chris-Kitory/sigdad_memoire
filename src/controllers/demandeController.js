const {
  creerDemande,
  trouverParCode,
  trouverParBon,
  trouverParId,
  trouverParCitoyen,
  listerParStatut,
  verifierDemande,
  rejeterDemande,
  signerDemande,
  verifierDelaiCooldown,
  expirerBonsDepasses,
  obtenirStatistiques,
  DELAI_PAIEMENT_HEURES,
} = require('../models/demandeModel');
const { obtenirDocument, calculerPrix, CATALOGUE_DOCUMENTS } = require('../config/documents');

function avecLibelle(demande) {
  if (!demande) return demande;
  return { ...demande, type_document_label: obtenirDocument(demande.type_document)?.label || demande.type_document };
}
function listeAvecLibelle(demandes) {
  return demandes.map(avecLibelle);
}

// Public : liste du catalogue de documents avec prix
function catalogue(req, res) {
  const liste = Object.entries(CATALOGUE_DOCUMENTS).map(([id, doc]) => ({
    id,
    label: doc.label,
    prix: doc.estNaissance ? null : doc.prix,
    estNaissance: doc.estNaissance,
    delaiGratuitJours: doc.delaiGratuitJours || null,
  }));
  res.json({ documents: liste });
}

// Citoyen : soumettre une nouvelle demande
async function soumettre(req, res) {
  try {
    const { typeDocument, dateEvenement, jugementSuppletifNumero } = req.body;

    const doc = obtenirDocument(typeDocument);
    if (!doc) {
      return res.status(400).json({ error: 'Type de document inconnu.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'La piece justificative est requise.' });
    }

    const calcul = calculerPrix(typeDocument, dateEvenement);
    if (!calcul) {
      return res.status(400).json({ error: 'La date de naissance est requise pour ce type de document.' });
    }
    if (calcul.jugementSuppletifRequis && !jugementSuppletifNumero) {
      return res.status(400).json({
        error: `Délai de ${doc.delaiGratuitJours} jours dépassé (${calcul.joursEcoules} jours écoulés). Un jugement supplétif du tribunal est requis : indiquez son numéro.`,
      });
    }

    const cooldown = await verifierDelaiCooldown({ citoyenId: req.utilisateur.id, typeDocument });
    if (!cooldown.autorise) {
      return res.status(409).json({
        error: `Vous avez déjà obtenu ce document récemment. Prochaine demande possible à partir du ${cooldown.prochaineDateAutorisee.toLocaleDateString('fr-FR')}.`,
      });
    }

    const demande = await creerDemande({
      citoyenId: req.utilisateur.id,
      typeDocument,
      pieceJustificative: req.file.filename,
      prix: calcul.prix,
      gratuit: calcul.gratuit,
      dateEvenement: dateEvenement || null,
      jugementSuppletifNumero: jugementSuppletifNumero || null,
    });

    res.status(201).json({
      message: 'Demande soumise avec succès.',
      demande,
      instructions: calcul.gratuit
        ? `Présentez-vous à la Maison Communale de Makala avec votre bon ${demande.bon_paiement} pour finaliser gratuitement votre demande, sous ${DELAI_PAIEMENT_HEURES}h.`
        : `Présentez-vous à la Maison Communale de Makala sous ${DELAI_PAIEMENT_HEURES}h avec votre bon ${demande.bon_paiement} pour payer ${calcul.prix} $ (en Francs Congolais au taux du jour).`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la soumission.' });
  }
}

// Citoyen : voir ses propres demandes (historique / profil)
async function mesDemandes(req, res) {
  try {
    await expirerBonsDepasses();
    const demandes = await trouverParCitoyen(req.utilisateur.id);
    res.json({ demandes: listeAvecLibelle(demandes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Public : suivre une demande par son code
async function suivre(req, res) {
  try {
    await expirerBonsDepasses();
    const demande = await trouverParCode(req.params.code);
    if (!demande) {
      return res.status(404).json({ error: 'Aucune demande trouvee avec ce code.' });
    }
    res.json({
      code_suivi: demande.code_suivi,
      type_document: obtenirDocument(demande.type_document)?.label || demande.type_document,
      statut: demande.statut,
      prix_usd: demande.prix_usd,
      gratuit: demande.gratuit,
      date_creation: demande.date_creation,
      date_signature: demande.date_signature,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : recherche rapide par bon de paiement (guichet)
async function rechercherParBon(req, res) {
  try {
    const demande = await trouverParBon(req.params.code);
    if (!demande) {
      return res.status(404).json({ error: 'Aucune demande trouvee avec ce bon.' });
    }
    res.json({ demande: avecLibelle(demande) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : liste des demandes en attente de paiement/verification
async function aVerifier(req, res) {
  try {
    await expirerBonsDepasses();
    const demandes = await listerParStatut('en_attente_paiement');
    res.json({ demandes: listeAvecLibelle(demandes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : confirmer paiement + verifier (une seule action, guichet)
async function verifier(req, res) {
  try {
    const demande = await verifierDemande({ id: req.params.id, agentId: req.utilisateur.id });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable, expiree ou deja traitee.' });
    }
    res.json({ message: 'Paiement confirmé et demande vérifiée.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

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
    res.json({ demandes: listeAvecLibelle(demandes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Bourgmestre : signer une demande
async function signer(req, res) {
  try {
    const codeQr = `SCEAU-HDV-MAKALA-${req.params.id}-${Date.now()}`;
    const demande = await signerDemande({ id: req.params.id, bourgmestreId: req.utilisateur.id, codeQr });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable ou pas encore verifiee.' });
    }
    res.json({ message: 'Demande signée électroniquement.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Bourgmestre : statistiques du tableau de bord
async function statistiques(req, res) {
  try {
    const stats = await obtenirStatistiques();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = {
  catalogue,
  soumettre,
  mesDemandes,
  suivre,
  rechercherParBon,
  aVerifier,
  verifier,
  rejeter,
  aSigner,
  signer,
  statistiques,
};
