/* ==========================================================================
   Marcolino Champions League — dados fixos do torneio
   (times, grupos, ordem de prioridade de cada participante)
   ========================================================================== */

// Cada time tem um "id" curto (usado nas chaves de partidas e na URL)
// e um "name" (nome exibido no site).
const TEAMS = {
  dortmund:  { name: 'Borussia Dortmund' },
  lille:     { name: 'Lille' },
  atleti:    { name: 'Atlético de Madrid' },
  feyenoord: { name: 'Feyenoord' },

  liverpool: { name: 'Liverpool' },
  benfica:   { name: 'Benfica' },
  napoli:    { name: 'Napoli' },
  atalanta:  { name: 'Atalanta' },

  realmadrid: { name: 'Real Madrid' },
  monaco:     { name: 'Monaco' },
  juventus:   { name: 'Juventus' },
  sociedad:   { name: 'Real Sociedad' },

  barcelona: { name: 'Barcelona' },
  bilbao:    { name: 'Atlético de Bilbao' },
  chelsea:   { name: 'Chelsea' },
  bologna:   { name: 'Bologna' },

  arsenal:   { name: 'Arsenal' },
  porto:     { name: 'Porto' },
  leverkusen:{ name: 'Bayer Leverkusen' },
  ajax:      { name: 'Ajax' },

  psg:       { name: 'PSG' },
  marseille: { name: 'Olympique de Marseille' },
  mancity:   { name: 'Manchester City' },
  bodo:      { name: 'Bodø/Glimt' },

  inter:     { name: 'Inter de Milão' },
  psv:       { name: 'PSV' },
  milan:     { name: 'Milan' },
  celtic:    { name: 'Celtic' },

  bayern:    { name: 'Bayern de Munique' },
  roma:      { name: 'Roma' },
  manutd:    { name: 'Manchester United' },
  como:      { name: 'Como' },

  // Outros times da Europa League (não vieram da fase de grupos da Champions)
  brugge:      { name: 'Club Brugge' },
  lask:        { name: 'LASK' },
  tottenham:   { name: 'Tottenham' },
  copenhagen:  { name: 'Copenhagen' },
  betis:       { name: 'Real Betis' },
  stuttgart:   { name: 'Stuttgart' },
  galatasaray: { name: 'Galatasaray' },
  lyon:        { name: 'Lyon' },

  // Outros times da Conference League
  youngboys:    { name: 'Young Boys' },
  nec:          { name: 'NEC' },
  lens:         { name: 'Lens' },
  frankfurt:    { name: 'Eintracht Frankfurt' },
  rayovallecano:{ name: 'Rayo Vallecano' },
  fenerbahce:   { name: 'Fenerbahçe' },
  astonvilla:   { name: 'Aston Villa' },
  sporting:     { name: 'Sporting' },
};

// Ordem dos times dentro de cada grupo = numeração 1..4 usada na tabela de jogos.
const GROUPS = {
  A: ['dortmund', 'lille', 'atleti', 'feyenoord'],
  B: ['liverpool', 'benfica', 'napoli', 'atalanta'],
  C: ['realmadrid', 'monaco', 'juventus', 'sociedad'],
  D: ['barcelona', 'bilbao', 'chelsea', 'bologna'],
  E: ['arsenal', 'porto', 'leverkusen', 'ajax'],
  F: ['psg', 'marseille', 'mancity', 'bodo'],
  G: ['inter', 'psv', 'milan', 'celtic'],
  H: ['bayern', 'roma', 'manutd', 'como'],
};

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// id -> letra do grupo (montado a partir de GROUPS)
const TEAM_GROUP = {};
GROUP_ORDER.forEach((g) => GROUPS[g].forEach((id) => (TEAM_GROUP[id] = g)));

// Ordem de prioridade escolhida por cada participante (1º = mais prioritário).
const HEITOR_TEAMS = [
  'arsenal', 'dortmund', 'juventus', 'marseille', 'atalanta', 'lille',
  'bologna', 'bilbao', 'sociedad', 'feyenoord', 'roma', 'liverpool',
  'milan', 'atleti', 'inter', 'manutd',
];

const DANIEL_TEAMS = [
  'barcelona', 'bayern', 'mancity', 'psg', 'napoli', 'leverkusen',
  'ajax', 'celtic', 'bodo', 'como', 'monaco', 'psv', 'chelsea',
  'porto', 'benfica', 'realmadrid',
];

// "Outros times" que entram direto nas oitavas da Europa League e da
// Conference League, junto com os 3os/4os colocados dos grupos da Champions.
const EUROPA_OUTROS_HEITOR = ['brugge', 'lask', 'tottenham', 'copenhagen'];
const EUROPA_OUTROS_DANIEL = ['betis', 'stuttgart', 'galatasaray', 'lyon'];
const CONFERENCE_OUTROS_HEITOR = ['youngboys', 'nec', 'lens', 'frankfurt'];
const CONFERENCE_OUTROS_DANIEL = ['rayovallecano', 'fenerbahce', 'astonvilla', 'sporting'];

function isHeitorTeam(id) {
  return HEITOR_TEAMS.includes(id) || EUROPA_OUTROS_HEITOR.includes(id) || CONFERENCE_OUTROS_HEITOR.includes(id);
}
function isDanielTeam(id) {
  return DANIEL_TEAMS.includes(id) || EUROPA_OUTROS_DANIEL.includes(id) || CONFERENCE_OUTROS_DANIEL.includes(id);
}

function teamName(id) {
  return (TEAMS[id] && TEAMS[id].name) || id;
}
