document.getElementById('nav-slot').innerHTML = renderNav('index');

function rosterListHtml(ids) {
  return `<ol class="roster-list">${ids.map((id) => `<li>${teamLink(id)}</li>`).join('')}</ol>`;
}

document.getElementById('roster-slot').innerHTML = `
  <div class="roster-grid">
    <div class="roster-card">
      <h2>Times do Heitor — Champions League</h2>
      <p class="roster-sub">Em ordem de prioridade</p>
      ${rosterListHtml(HEITOR_TEAMS)}
    </div>
    <div class="roster-card">
      <h2>Times do Daniel — Champions League</h2>
      <p class="roster-sub">Em ordem de prioridade</p>
      ${rosterListHtml(DANIEL_TEAMS)}
    </div>
    <div class="roster-card">
      <h2>Times do Heitor — Europa League</h2>
      <p class="roster-sub">Entram direto nas oitavas</p>
      ${rosterListHtml(EUROPA_OUTROS_HEITOR)}
    </div>
    <div class="roster-card">
      <h2>Times do Daniel — Europa League</h2>
      <p class="roster-sub">Entram direto nas oitavas</p>
      ${rosterListHtml(EUROPA_OUTROS_DANIEL)}
    </div>
    <div class="roster-card">
      <h2>Times do Heitor — Conference League</h2>
      <p class="roster-sub">Entram direto nas oitavas</p>
      ${rosterListHtml(CONFERENCE_OUTROS_HEITOR)}
    </div>
    <div class="roster-card">
      <h2>Times do Daniel — Conference League</h2>
      <p class="roster-sub">Entram direto nas oitavas</p>
      ${rosterListHtml(CONFERENCE_OUTROS_DANIEL)}
    </div>
  </div>`;

document.getElementById('groups-slot').innerHTML = GROUP_ORDER.map(
  (g) => `<a class="group-chip" href="grupo.html?g=${g}">Grupo ${g}</a>`
).join('');
