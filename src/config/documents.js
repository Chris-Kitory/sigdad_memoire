// Catalogue des documents delivres par la Maison Communale de Makala
// Prix par defaut (grille indicative 5-20 USD) - a ajuster selon le tarif reel de la commune

const CATALOGUE_DOCUMENTS = {
  attestation_residence: {
    label: 'Attestation de résidence',
    prix: 5,
    estNaissance: false,
  },
  attestation_composition_famille: {
    label: 'Attestation de composition de famille',
    prix: 6,
    estNaissance: false,
  },
  attestation_celibat: {
    label: 'Attestation de célibat',
    prix: 7,
    estNaissance: false,
  },
  attestation_bonne_vie_moeurs: {
    label: 'Attestation de bonne vie et mœurs',
    prix: 10,
    estNaissance: false,
  },
  declaration_naissance: {
    label: 'Déclaration / Attestation de naissance',
    prix: null, // calcule dynamiquement : gratuit si <= 90 jours, sinon prixNaissanceTardive
    prixNaissanceTardive: 12,
    estNaissance: true,
    delaiGratuitJours: 90,
  },
  acte_deces: {
    label: 'Acte de décès',
    prix: 15,
    estNaissance: false,
  },
  acte_mariage: {
    label: 'Acte de mariage',
    prix: 20,
    estNaissance: false,
  },
};

function obtenirDocument(id) {
  return CATALOGUE_DOCUMENTS[id] || null;
}

// Calcule le prix reel d'une demande, gere le cas particulier de la naissance
function calculerPrix(id, dateEvenement) {
  const doc = obtenirDocument(id);
  if (!doc) return null;

  if (!doc.estNaissance) {
    return { prix: doc.prix, gratuit: doc.prix === 0, jugementSuppletifRequis: false };
  }

  if (!dateEvenement) {
    return null; // date de naissance obligatoire pour ce type
  }

  const joursEcoules = Math.floor((Date.now() - new Date(dateEvenement).getTime()) / (1000 * 60 * 60 * 24));
  const dansLeDelai = joursEcoules <= doc.delaiGratuitJours;

  return {
    prix: dansLeDelai ? 0 : doc.prixNaissanceTardive,
    gratuit: dansLeDelai,
    jugementSuppletifRequis: !dansLeDelai,
    joursEcoules,
  };
}

module.exports = { CATALOGUE_DOCUMENTS, obtenirDocument, calculerPrix };
