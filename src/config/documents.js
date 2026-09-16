// Catalogue des documents delivres par la Maison Communale de Makala
// Prix par defaut (grille indicative 5-20 USD) - a ajuster selon le tarif reel de la commune

// Champs d'identite communs a la plupart des attestations (concernent le demandeur lui-meme)
const CHAMPS_IDENTITE_STANDARD = [
  { id: 'nom', label: 'Nom', type: 'text' },
  { id: 'postnom', label: 'Postnom', type: 'text' },
  { id: 'prenom', label: 'Prénom', type: 'text' },
  { id: 'date_naissance', label: 'Date de naissance', type: 'date' },
  { id: 'lieu_naissance', label: 'Lieu de naissance', type: 'text' },
  { id: 'nom_pere', label: 'Nom du père', type: 'text' },
  { id: 'nom_mere', label: 'Nom de la mère', type: 'text' },
  { id: 'adresse', label: 'Adresse actuelle', type: 'text' },
];

const CATALOGUE_DOCUMENTS = {
  attestation_residence: {
    label: 'Attestation de résidence',
    prix: 5,
    estNaissance: false,
    champsIdentite: CHAMPS_IDENTITE_STANDARD,
  },
  attestation_composition_famille: {
    label: 'Attestation de composition de famille',
    prix: 6,
    estNaissance: false,
    champsIdentite: [
      ...CHAMPS_IDENTITE_STANDARD,
      { id: 'nom_conjoint', label: 'Nom du conjoint (si marié)', type: 'text' },
      { id: 'nombre_enfants', label: "Nombre d'enfants à charge", type: 'text' },
    ],
  },
  attestation_celibat: {
    label: 'Attestation de célibat',
    prix: 7,
    estNaissance: false,
    champsIdentite: CHAMPS_IDENTITE_STANDARD,
  },
  attestation_bonne_vie_moeurs: {
    label: 'Attestation de bonne vie et mœurs',
    prix: 10,
    estNaissance: false,
    champsIdentite: CHAMPS_IDENTITE_STANDARD,
  },
  declaration_naissance: {
    label: 'Déclaration / Attestation de naissance',
    prix: null, // calcule dynamiquement : gratuit si <= 90 jours, sinon prixNaissanceTardive
    prixNaissanceTardive: 12,
    estNaissance: true,
    delaiGratuitJours: 90,
    champsIdentite: [
      { id: 'nom_enfant', label: "Nom de l'enfant", type: 'text' },
      { id: 'postnom_enfant', label: "Postnom de l'enfant", type: 'text' },
      { id: 'lieu_naissance_enfant', label: 'Lieu de naissance', type: 'text' },
      { id: 'nom_pere', label: 'Nom du père', type: 'text' },
      { id: 'nom_mere', label: 'Nom de la mère', type: 'text' },
      { id: 'nom_declarant', label: 'Nom du déclarant', type: 'text' },
    ],
  },
  acte_deces: {
    label: 'Acte de décès',
    prix: 15,
    estNaissance: false,
    champsIdentite: [
      { id: 'nom_defunt', label: 'Nom du défunt', type: 'text' },
      { id: 'postnom_defunt', label: 'Postnom du défunt', type: 'text' },
      { id: 'date_deces', label: 'Date du décès', type: 'date' },
      { id: 'lieu_deces', label: 'Lieu du décès', type: 'text' },
      { id: 'nom_declarant', label: 'Nom du déclarant', type: 'text' },
    ],
  },
  acte_mariage: {
    label: 'Acte de mariage',
    prix: 20,
    estNaissance: false,
    champsIdentite: [
      { id: 'nom_epoux', label: "Nom de l'époux", type: 'text' },
      { id: 'postnom_epoux', label: "Postnom de l'époux", type: 'text' },
      { id: 'nom_epouse', label: "Nom de l'épouse", type: 'text' },
      { id: 'postnom_epouse', label: "Postnom de l'épouse", type: 'text' },
      { id: 'date_mariage', label: 'Date du mariage', type: 'date' },
      { id: 'lieu_mariage', label: 'Lieu du mariage', type: 'text' },
    ],
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

// Valide que les champs d'identite requis sont presents, renvoie les valeurs nettoyees
function extraireDonneesIdentite(id, corpsRequete) {
  const doc = obtenirDocument(id);
  if (!doc) return { valide: false, donnees: {}, manquants: [] };

  const donnees = {};
  const manquants = [];
  for (const champ of doc.champsIdentite) {
    const valeur = (corpsRequete[champ.id] || '').toString().trim();
    if (!valeur) manquants.push(champ.label);
    donnees[champ.id] = valeur;
  }
  return { valide: manquants.length === 0, donnees, manquants };
}

module.exports = { CATALOGUE_DOCUMENTS, obtenirDocument, calculerPrix, extraireDonneesIdentite };
