const LIBELLES_STATUT = {
  en_attente_paiement: 'En attente de paiement',
  verifie: 'Vérifiée',
  signe: 'Signée',
  rejete: 'Rejetée',
  expire: 'Expirée (délai dépassé)',
};

const CLASSES_STATUT = {
  en_attente_paiement: 'attente',
  verifie: 'verifie',
  signe: 'signe',
  rejete: 'rejete',
  expire: 'rejete',
};

function formaterDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formaterPrix(d) {
  return d.gratuit || parseFloat(d.prix_usd) === 0 ? 'Gratuit' : parseFloat(d.prix_usd).toFixed(0) + ' $';
}

function nomAffichageDemande(d) {
  const don = d.donnees_identite_verifiees || d.donnees_identite || {};
  if (don.nom_enfant) return (don.nom_enfant + ' ' + (don.postnom_enfant || '')).trim();
  if (don.nom_defunt) return (don.nom_defunt + ' ' + (don.postnom_defunt || '')).trim();
  if (don.nom_epoux || don.nom_epouse) {
    const epoux = (don.nom_epoux + ' ' + (don.postnom_epoux || '')).trim();
    const epouse = (don.nom_epouse + ' ' + (don.postnom_epouse || '')).trim();
    return [epoux, epouse].filter(Boolean).join(' & ');
  }
  if (don.nom) return (don.nom + ' ' + (don.postnom || '')).trim();
  return d.citoyen_nom ? (d.citoyen_nom + ' ' + (d.citoyen_postnom || '')).trim() : '—';
}

// Rendu "base de donnees" : tableau avec numero, nom, document, bon/prix, statut, actions
function rendreTableauDemandes(demandes, colonneActionsLabel, rendreActions) {
  if (!demandes || demandes.length === 0) {
    return '<div class="etat-vide">Aucune donnée.</div>';
  }
  const lignes = demandes.map((d) => {
    const classe = CLASSES_STATUT[d.statut] || 'attente';
    return `
      <tr>
        <td>${d.id}</td>
        <td>${nomAffichageDemande(d)}</td>
        <td>${d.type_document_label || d.type_document}</td>
        <td>${d.bon_paiement || '—'}</td>
        <td>${formaterPrix(d)}</td>
        <td><span class="pastille pastille-${classe}">${LIBELLES_STATUT[d.statut] || d.statut}</span></td>
        <td>${rendreActions ? rendreActions(d) : ''}</td>
      </tr>`;
  }).join('');

  return `
    <div style="overflow-x:auto;">
      <table class="table-donnees">
        <thead>
          <tr>
            <th>N°</th><th>Nom</th><th>Document</th><th>Bon</th><th>Prix</th><th>Statut</th><th>${colonneActionsLabel || ''}</th>
          </tr>
        </thead>
        <tbody>${lignes}</tbody>
      </table>
    </div>
  `;
}

function rendreLigneDemande(d, actionsHtml) {
  const nomCitoyen = d.citoyen_nom ? (d.citoyen_nom + ' ' + (d.citoyen_postnom || '')).trim() : null;
  const classe = CLASSES_STATUT[d.statut] || 'attente';
  return `
    <div class="ligne-demande">
      <div class="ligne-demande-barre barre-${classe}"></div>
      <div class="ligne-demande-corps">
        <div class="ligne-demande-type">${d.type_document_label || d.type_document}</div>
        <div class="ligne-demande-meta">
          ${nomCitoyen ? nomCitoyen + ' · ' : ''}${formaterDate(d.date_creation)} · ${formaterPrix(d)}
          <span class="ligne-demande-code"> · ${d.bon_paiement || d.code_suivi}</span>
        </div>
      </div>
      <span class="pastille pastille-${classe}">${LIBELLES_STATUT[d.statut] || d.statut}</span>
      ${actionsHtml || ''}
    </div>
  `;
}
