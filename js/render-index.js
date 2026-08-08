document.getElementById('nav-slot').innerHTML = renderNav('index');

function rosterListHtml(ids) {
  return `<ol class="roster-list">${ids.map((id) => `<li>${teamLink(id)}</li>`).join('')}</ol>`;
}

document.getElementById('roster-slot').innerHTML = `
  <div class="roster-grid">
    <div class="roster-card">
      <h2>Times do Heitor</h2>
      <p class="roster-sub">Em ordem de prioridade</p>
      ${rosterListHtml(HEITOR_TEAMS)}
    </div>
    <div class="roster-card">
      <h2>Times do Daniel</h2>
      <p class="roster-sub">Em ordem de prioridade</p>
      ${rosterListHtml(DANIEL_TEAMS)}
    </div>
  </div>`;

document.getElementById('groups-slot').innerHTML = GROUP_ORDER.map(
  (g) => `<a class="group-chip" href="grupo.html?g=${g}">Grupo ${g}</a>`
).join('');
