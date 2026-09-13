/**
 * Marcolino Champions League — backend simples em Google Apps Script.
 * Guarda os placares numa aba chamada "Placares" da planilha à qual
 * este script estiver vinculado (Extensões > Apps Script).
 *
 * Rotas (tudo via GET, para não esbarrar em CORS):
 *   ?               -> devolve todos os placares em JSON
 *   ?action=set&matchId=...&golsCasa=...&golsVisitante=... -> grava/atualiza um placar
 */

const SHEET_NAME = 'Placares';

function doGet(e) {
  const sheet = getSheet_();
  if (e.parameter && e.parameter.action === 'set') {
    return setScore_(sheet, e.parameter);
  }
  return getAll_(sheet);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['MatchID', 'GolsCasa', 'GolsVisitante', 'AtualizadoEm']);
  }
  return sheet;
}

function getAll_(sheet) {
  const data = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const matchId = data[i][0];
    if (!matchId) continue;
    const golsCasa = data[i][1];
    const golsVisitante = data[i][2];
    rows.push({
      matchId: String(matchId),
      golsCasa: golsCasa === '' || golsCasa === null || golsCasa === undefined ? null : Number(golsCasa),
      golsVisitante: golsVisitante === '' || golsVisitante === null || golsVisitante === undefined ? null : Number(golsVisitante),
    });
  }
  return jsonOutput_({ ok: true, matches: rows });
}

function setScore_(sheet, params) {
  const matchId = params.matchId;
  const golsCasa = params.golsCasa;
  const golsVisitante = params.golsVisitante;

  if (!matchId || golsCasa === undefined || golsVisitante === undefined) {
    return jsonOutput_({ ok: false, error: 'Parâmetros incompletos.' });
  }
  if (isNaN(Number(golsCasa)) || isNaN(Number(golsVisitante))) {
    return jsonOutput_({ ok: false, error: 'Placar inválido.' });
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === matchId) { rowIndex = i + 1; break; }
  }

  const now = new Date();
  if (rowIndex === -1) {
    sheet.appendRow([matchId, Number(golsCasa), Number(golsVisitante), now]);
  } else {
    sheet.getRange(rowIndex, 2, 1, 3).setValues([[Number(golsCasa), Number(golsVisitante), now]]);
  }
  return jsonOutput_({ ok: true });
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
