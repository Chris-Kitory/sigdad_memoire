const path = require('path');
const fs = require('fs');
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
  mettreAJourDonneesVerifiees,
  listerTousUtilisateurs,
  listerCitoyensAvecDemandes,
  DELAI_PAIEMENT_HEURES,
} = require('../models/demandeModel');
const { obtenirDocument, calculerPrix, extraireDonneesIdentite, CATALOGUE_DOCUMENTS } = require('../config/documents');
const { genererPdfDocument } = require('../utils/documentPdf');

function avecLibelle(demande) {
  if (!demande) return demande;
  return { ...demande, type_document_label: obtenirDocument(demande.type_document)?.label || demande.type_document };
}
function listeAvecLibelle(demandes) {
  return demandes.map(avecLibelle);
}

const dossierUploads = path.join(__dirname, '..', '..', 'uploads');

// Public : liste du catalogue de documents avec prix et champs d'identite requis
function catalogue(req, res) {
  const liste = Object.entries(CATALOGUE_DOCUMENTS).map(([id, doc]) => ({
    id,
    label: doc.label,
    prix: doc.estNaissance ? null : doc.prix,
    estNaissance: doc.estNaissance,
    delaiGratuitJours: doc.delaiGratuitJours || null,
    champsIdentite: doc.champsIdentite,
  }));
  res.json({ documents: liste });
}

// Citoyen : soumettre une nouvelle demande (formulaire adapte au type + piece identitaire)
async function soumettre(req, res) {
  try {
    const { typeDocument, dateEvenement, jugementSuppletifNumero } = req.body;

    const doc = obtenirDocument(typeDocument);
    if (!doc) {
      return res.status(400).json({ error: 'Type de document inconnu.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'La pièce identitaire est requise.' });
    }

    const { valide, donnees, manquants } = extraireDonneesIdentite(typeDocument, req.body);
    if (!valide) {
      return res.status(400).json({ error: `Champs manquants : ${manquants.join(', ')}.` });
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
      pieceIdentitaire: req.file.filename,
      donneesIdentite: donnees,
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

// Agent : confirmer paiement + verifier, avec correction eventuelle des donnees d'identite
async function verifier(req, res) {
  try {
    const donneesIdentiteVerifiees = req.body && req.body.donnees ? req.body.donnees : null;
    const demande = await verifierDemande({ id: req.params.id, agentId: req.utilisateur.id, donneesIdentiteVerifiees });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable, expiree ou deja traitee.' });
    }
    res.json({ message: 'Paiement confirmé et demande vérifiée.', demande });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : enregistrer une correction des donnees d'identite sans changer le statut
async function enregistrerDonnees(req, res) {
  try {
    const { donnees } = req.body;
    const demande = await mettreAJourDonneesVerifiees({ id: req.params.id, donneesIdentiteVerifiees: donnees || {} });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable.' });
    }
    res.json({ message: 'Informations enregistrées.', demande });
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

async function aSigner(req, res) {
  try {
    const demandes = await listerParStatut('verifie');
    res.json({ demandes: listeAvecLibelle(demandes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

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

async function statistiques(req, res) {
  try {
    const stats = await obtenirStatistiques();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Bourgmestre : tous les utilisateurs (agents + citoyens)
async function utilisateurs(req, res) {
  try {
    const liste = await listerTousUtilisateurs();
    res.json({ utilisateurs: liste });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Agent : citoyens ayant soumis au moins une demande
async function citoyensInscrits(req, res) {
  try {
    const liste = await listerCitoyensAvecDemandes();
    res.json({ citoyens: liste });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// Fichier de la piece identitaire : citoyen (proprietaire), agent ou bourgmestre uniquement
async function voirPieceIdentitaire(req, res) {
  try {
    const demande = await trouverParId(req.params.id);
    if (!demande) return res.status(404).send('Introuvable.');

    const estProprietaire = req.utilisateur.role === 'citoyen' && demande.citoyen_id === req.utilisateur.id;
    const estPersonnelCommunal = req.utilisateur.role === 'agent' || req.utilisateur.role === 'bourgmestre';
    if (!estProprietaire && !estPersonnelCommunal) {
      return res.status(403).send('Accès refusé.');
    }
    if (!demande.piece_identitaire) return res.status(404).send('Aucune pièce jointe.');

    const chemin = path.join(dossierUploads, demande.piece_identitaire);
    if (!fs.existsSync(chemin)) return res.status(404).send('Fichier introuvable.');
    res.sendFile(chemin);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur.');
  }
}

// Telechargement du PDF officiel (citoyen proprietaire, demande signee uniquement)
async function telechargerPdf(req, res) {
  try {
    const demande = await trouverParId(req.params.id);
    if (!demande) return res.status(404).send('Introuvable.');
    if (demande.citoyen_id !== req.utilisateur.id) return res.status(403).send('Accès refusé.');
    if (demande.statut !== 'signe') return res.status(400).send('Ce document n\'est pas encore signé.');

    genererPdfDocument(res, demande);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur.');
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
  enregistrerDonnees,
  rejeter,
  aSigner,
  signer,
  statistiques,
  utilisateurs,
  citoyensInscrits,
  voirPieceIdentitaire,
  telechargerPdf,
};
