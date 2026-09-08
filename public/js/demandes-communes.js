const LIBELLES_STATUT = {
  soumis: 'Soumise',
  verifie: 'Vérifiée',
  signe: 'Signée',
  rejete: 'Rejetée',
};

function formaterDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function rendreLigneDemande(d, actionsHtml) {
  const nomCitoyen = d.citoyen_nom ? (d.citoyen_nom + ' ' + (d.citoyen_postnom || '')).trim() : null;
  return `
    <div class="ligne-demande">
      <div class="ligne-demande-barre barre-${d.statut}"></div>
      <div class="ligne-demande-corps">
        <div class="ligne-demande-type">${d.type_document}</div>
        <div class="ligne-demande-meta">
          ${nomCitoyen ? nomCitoyen + ' · ' : ''}${formaterDate(d.date_creation)}
          <span class="ligne-demande-code"> · ${d.code_suivi}</span>
        </div>
      </div>
      <span class="pastille pastille-${d.statut}">${LIBELLES_STATUT[d.statut] || d.statut}</span>
      ${actionsHtml || ''}
    </div>
  `;
}
