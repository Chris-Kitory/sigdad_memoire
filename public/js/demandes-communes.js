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
