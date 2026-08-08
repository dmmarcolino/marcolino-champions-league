/* ==========================================================================
   Comunicação com o Google Apps Script (nossa "planilha-banco de dados").
   Tudo é feito via GET simples para não esbarrar em CORS.
   ========================================================================== */

async function fetchAllScores() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('COLE_AQUI') === 0) {
    console.warn('APPS_SCRIPT_URL não configurada em js/config.js');
    return {};
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, { cache: 'no-store' });
    const data = await res.json();
    const map = {};
    (data.matches || []).forEach((m) => (map[m.matchId] = m));
    return map;
  } catch (err) {
    console.error('Falha ao carregar placares', err);
    return {};
  }
}

async function saveScore(matchId, golsCasa, golsVisitante) {
  const url = `${APPS_SCRIPT_URL}?action=set&matchId=${encodeURIComponent(matchId)}` +
    `&golsCasa=${encodeURIComponent(golsCasa)}&golsVisitante=${encodeURIComponent(golsVisitante)}`;
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}
