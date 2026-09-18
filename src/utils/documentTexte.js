// Genere le texte juridique officiel d'un document a partir des donnees d'identite,
// sur le modele des attestations communales congolaises (formule "Je soussigne...")

function nomComplet(donnees, prefixeNom = 'nom', prefixePostnom = 'postnom', prefixePrenom = 'prenom') {
  return [donnees[prefixeNom], donnees[prefixePostnom], donnees[prefixePrenom]].filter(Boolean).join(' ');
}

function formaterDate(valeur) {
  if (!valeur) return '……………';
  const d = new Date(valeur);
  if (isNaN(d)) return valeur;
  return d.toLocaleDateString('fr-FR');
}

// Nom affiche dans les listes (agent/bourgmestre), adapte au type de document
function nomAffichage(typeDocument, donnees) {
  donnees = donnees || {};
  if (typeDocument === 'declaration_naissance') {
    return [donnees.nom_enfant, donnees.postnom_enfant].filter(Boolean).join(' ') || '—';
  }
  if (typeDocument === 'acte_deces') {
    return [donnees.nom_defunt, donnees.postnom_defunt].filter(Boolean).join(' ') || '—';
  }
  if (typeDocument === 'acte_mariage') {
    const epoux = [donnees.nom_epoux, donnees.postnom_epoux].filter(Boolean).join(' ');
    const epouse = [donnees.nom_epouse, donnees.postnom_epouse].filter(Boolean).join(' ');
    return [epoux, epouse].filter(Boolean).join(' & ') || '—';
  }
  return nomComplet(donnees) || '—';
}

const BLOC_CASIER_JUDICIAIRE = [
  "Condamnation à plus de 5 ans de servitude pénale encourue en RDC pendant les 20 années précédentes : NÉANT",
  "Condamnation à plus de 3 ans de servitude pénale encourue en RDC pendant les 10 années précédentes : NÉANT",
  "Condamnation de plus de 15 jours de servitude pénale ou une amende supérieure à un franc congolais encourue pendant les 5 années précédentes : NÉANT",
  "Condamnation à plus de 15 jours de servitude pénale ou une amende ne dépassant pas un franc congolais encouru en RDC depuis l'année précédente : NÉANT",
  "Mention éventuelle d'une mesure d'expulsion : NÉANT",
];

function genererParagraphe(typeDocument, donnees) {
  donnees = donnees || {};
  const nomBase = nomComplet(donnees);
  const naissance = donnees.lieu_naissance && donnees.date_naissance
    ? `né(e) à ${donnees.lieu_naissance}, le ${formaterDate(donnees.date_naissance)}, `
    : '';
  const filiation = donnees.nom_pere || donnees.nom_mere
    ? `fils/fille de ${donnees.nom_pere || '……'} et de ${donnees.nom_mere || '……'}, `
    : '';
  const residence = donnees.adresse ? `résidant à ${donnees.adresse}, ` : '';

  switch (typeDocument) {
    case 'attestation_bonne_vie_moeurs':
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie que ${nomBase}, ${naissance}${filiation}${residence}dans la Commune de Makala, est de bonne conduite, vie et mœurs, et que son attitude civique n'a donné lieu à aucun reproche.`,
        blocSupplementaire: BLOC_CASIER_JUDICIAIRE,
      };
    case 'attestation_residence':
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie que ${nomBase}, ${naissance}${filiation}réside effectivement à ${donnees.adresse || '……'}, sur le territoire de la Commune de Makala.`,
      };
    case 'attestation_celibat':
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie que ${nomBase}, ${naissance}${filiation}${residence}est de statut célibataire, aucun acte de mariage n'étant enregistré à son nom dans les registres de la Commune de Makala.`,
      };
    case 'attestation_composition_famille':
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie que ${nomBase}, ${residence}est le chef du ménage composé de ${donnees.nombre_enfants || '……'} enfant(s) à charge` +
          (donnees.nom_conjoint ? `, et de son conjoint ${donnees.nom_conjoint}.` : '.'),
      };
    case 'declaration_naissance': {
      const enfant = [donnees.nom_enfant, donnees.postnom_enfant].filter(Boolean).join(' ');
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie que l'enfant ${enfant || '……'}, né(e) à ${donnees.lieu_naissance_enfant || '……'}, fils/fille de ${donnees.nom_pere || '……'} et de ${donnees.nom_mere || '……'}, a été déclaré(e) par ${donnees.nom_declarant || '……'} dans les registres de la Commune de Makala.`,
      };
    }
    case 'acte_deces': {
      const defunt = [donnees.nom_defunt, donnees.postnom_defunt].filter(Boolean).join(' ');
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie le décès de ${defunt || '……'}, survenu le ${formaterDate(donnees.date_deces)} à ${donnees.lieu_deces || '……'}, déclaré par ${donnees.nom_declarant || '……'}.`,
      };
    }
    case 'acte_mariage': {
      const epoux = [donnees.nom_epoux, donnees.postnom_epoux].filter(Boolean).join(' ');
      const epouse = [donnees.nom_epouse, donnees.postnom_epouse].filter(Boolean).join(' ');
      return {
        paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie le mariage entre ${epoux || '……'} et ${epouse || '……'}, célébré le ${formaterDate(donnees.date_mariage)} à ${donnees.lieu_mariage || '……'}, dans la Commune de Makala.`,
      };
    }
    default:
      return { paragraphe: `Je soussigné, Bourgmestre de la Commune de Makala, certifie les informations ci-dessus concernant ${nomBase}.` };
  }
}

module.exports = { genererParagraphe, nomAffichage, formaterDate };
