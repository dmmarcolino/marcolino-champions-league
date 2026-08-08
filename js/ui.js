/* ==========================================================================
   Componentes de interface reaproveitados em todas as páginas.
   ========================================================================== */

function renderNav(active) {
  const groupLinks = GROUP_ORDER.map(
    (g) => `<a href="grupo.html?g=${g}" class="${active === 'grupo-' + g ? 'is-active' : ''}">Grupo ${g}</a>`
  ).join('');

  return `
    <header class="site-header">
      <a class="brand" href="index.html">
        <span class="brand-mark">MCL</span>
        <span class="brand-name">Marcolino Champions League</span>
      </a>
      <nav class="site-nav">
        <a href="index.html" class="${active === 'index' ? 'is-active' : ''}">Início</a>
        <div class="nav-groups">
          <span class="nav-groups-label">Grupos ▾</span>
          <div class="nav-groups-menu">${groupLinks}</div>
        </div>
        <a href="classificacao.html" class="${active === 'classificacao' ? 'is-active' : ''}">Classificação geral</a>
        <a href="mata-mata.html" class="${active === 'mata-mata' ? 'is-active' : ''}">Mata-mata</a>
      </nav>
    </header>`;
}

function teamLink(id, extraClass) {
  return `<a class="team-link ${extraClass || ''}" href="time.html?id=${id}">${teamName(id)}</a>`;
}

// Painel de placar de um jogo simples (fase de grupos ou jogo único do mata-mata).
// homeLabel/awayLabel podem ser nomes de time reais ou um rótulo provisório ("Seed 5", "Vencedor QF-1"...).
function matchRow({ matchId, homeId, awayId, homeLabel, awayLabel, score, editable, extraNote }) {
  const gc = score && score.golsCasa != null ? score.golsCasa : '';
  const gv = score && score.golsVisitante != null ? score.golsVisitante : '';
  const homeHtml = homeId ? teamLink(homeId) : `<span class="tbd">${homeLabel || '?'}</span>`;
  const awayHtml = awayId ? teamLink(awayId) : `<span class="tbd">${awayLabel || '?'}</span>`;

  const inputs = editable
    ? `
      <input type="number" min="0" class="score-input" data-role="casa" value="${gc}" aria-label="Gols ${homeLabel || ''}">
      <span class="score-sep">x</span>
      <input type="number" min="0" class="score-input" data-role="visitante" value="${gv}" aria-label="Gols ${awayLabel || ''}">
      <button class="btn-save save-score" data-match-id="${matchId}">Salvar</button>
      <span class="save-status" data-status-for="${matchId}"></span>`
    : `<span class="score-fixed">${gc === '' ? '–' : gc} x ${gv === '' ? '–' : gv}</span>`;

  return `
    <div class="match-row" data-match-id="${matchId}">
      <div class="match-team match-home">${homeHtml}</div>
      <div class="match-score">${inputs}</div>
      <div class="match-team match-away">${awayHtml}</div>
      ${extraNote ? `<div class="match-note">${extraNote}</div>` : ''}
    </div>`;
}

// Painel específico para pênaltis (dois campos rotulados com nome do time).
function pensRow(tieId, teamAName, teamBName, score) {
  const pa = score && score.golsCasa != null ? score.golsCasa : '';
  const pb = score && score.golsVisitante != null ? score.golsVisitante : '';
  return `
    <div class="match-row match-row--pens" data-match-id="${tieId}-PENS">
      <div class="match-team">Pênaltis: ${teamAName}</div>
      <div class="match-score">
        <input type="number" min="0" class="score-input" data-role="casa" value="${pa}" aria-label="Pênaltis ${teamAName}">
        <span class="score-sep">x</span>
        <input type="number" min="0" class="score-input" data-role="visitante" value="${pb}" aria-label="Pênaltis ${teamBName}">
        <button class="btn-save save-score" data-match-id="${tieId}-PENS">Salvar</button>
        <span class="save-status" data-status-for="${tieId}-PENS"></span>
      </div>
      <div class="match-team">${teamBName}</div>
    </div>`;
}

// Liga o clique nos botões "Salvar" a todo o documento (delegação de evento).
function wireScoreSaving(onSaved) {
  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.save-score');
    if (!btn) return;
    const matchId = btn.dataset.matchId;
    const row = btn.closest('.match-row');
    const gc = row.querySelector('[data-role="casa"]').value;
    const gv = row.querySelector('[data-role="visitante"]').value;
    const status = row.querySelector(`[data-status-for="${matchId}"]`);
    if (gc === '' || gv === '') {
      if (status) { status.textContent = 'Preencha os dois placares.'; status.className = 'save-status save-status--error'; }
      return;
    }
    btn.disabled = true;
    if (status) { status.textContent = 'Salvando…'; status.className = 'save-status'; }
    try {
      await saveScore(matchId, gc, gv);
      if (status) { status.textContent = 'Salvo ✓'; status.className = 'save-status save-status--ok'; }
      if (onSaved) await onSaved();
    } catch (err) {
      if (status) { status.textContent = 'Erro ao salvar.'; status.className = 'save-status save-status--error'; }
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}

function standingsTableHtml(standings, opts) {
  opts = opts || {};
  const rows = standings.map((t, idx) => {
    const pos = idx + 1;
    const qualified = opts.highlightTop2 && pos <= 2;
    return `
      <tr class="${qualified ? 'is-qualified' : ''}">
        <td class="col-pos">${pos}</td>
        <td class="col-team">${teamLink(t.id)}</td>
        <td>${t.j}</td>
        <td class="col-pts">${t.pts}</td>
        <td>${t.gm}</td>
        <td>${t.gs}</td>
        <td>${t.sg > 0 ? '+' + t.sg : t.sg}</td>
      </tr>`;
  }).join('');

  return `
    <table class="standings-table">
      <thead>
        <tr>
          <th class="col-pos">#</th>
          <th class="col-team">Time</th>
          <th title="Jogos">J</th>
          <th class="col-pts" title="Pontos">Pts</th>
          <th title="Gols marcados">GM</th>
          <th title="Gols sofridos">GS</th>
          <th title="Saldo de gols">SG</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
