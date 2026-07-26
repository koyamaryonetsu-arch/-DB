'use strict';
/* ================================================================
   まものがたり 〜よみがえりし魔王〜 v2 (DQ6ベース大型改修)
   データ定義: ドット絵・マップ・街・種族・職業・とくいわざ・装備
   ================================================================ */

const OUTLINE = '#1a1626';

/* ---------- ドット絵スプライト ----------
   px: 行文字列の配列。'.'は透明。mirror:true なら左半分だけ定義し左右対称に展開
   base: 他スプライトの形を流用しパレットだけ変える */
const SPR = {
  puni: { mirror: true, pal: { k: OUTLINE, a: '#3b76e8', b: '#8ab6ff', w: '#ffffff', m: '#123064' }, px: [
    '........', '........', '........', '.....kkk',
    '...kkabb', '..kabbba', '.kabbbaa', '.kaawkaa',
    'kaaaaaaa', 'kaaaaamm', 'kaaaaaaa', 'kaaaaaaa',
    '.kaaaaaa', '..kkaaaa', '....kkkk', '........'] },
  metal: { base: 'puni', pal: { k: OUTLINE, a: '#b9c2d4', b: '#eef4ff', w: '#ffffff', m: '#4a5a76' } },
  bat: { mirror: true, pal: { k: OUTLINE, a: '#8a5fd8', b: '#5a3aa8', e: '#ff5a5a', w: '#ffffff' }, px: [
    '........', '........', '........', '.....k..',
    '....kkkk', '...kbbbb', 'k..kbbbb', 'kk.kbebb',
    'kakkbbbb', 'kaakbwbb', 'kaaakbbb', '.kaakbbb',
    '..kkkbbb', '....kkkk', '........', '........'] },
  rat: { mirror: true, pal: { k: OUTLINE, a: '#a8703d', s: '#e8dcc0', w: '#ffffff', p: '#e87a9a' }, px: [
    '........', '........', '..s...s.', '.sss.sss',
    '.sssssss', '.kaaaaaa', 'kaaaaaaa', 'kaawkaaa',
    'kaaaaaaa', 'kaaaaapp', 'kaaaaaaw', '.kaaaaaa',
    '.kaaaaaa', '..kkaaaa', '....kkkk', '........'] },
  kino: { mirror: true, pal: { k: OUTLINE, c: '#e04848', w: '#ffffff', t: '#f2e2c4', m: '#a05a3a' }, px: [
    '........', '.....kkk', '...kkccc', '..kccccc',
    '.kccwwcc', '.kcccccc', 'kccccccc', 'kkkkkkkk',
    '..kttttt', '..kttktt', '..kttttt', '..ktttmm',
    '..kttttt', '...kkkkk', '........', '........'] },
  bee: { mirror: true, pal: { k: OUTLINE, y: '#f2c832', d: '#2a2418', w: '#e8f0ff' }, px: [
    '.....k..', '.....k..', '........', '....kkkk',
    '...kyyyy', '..kykkyy', '.wkyyyyy', 'wwkddddd',
    'wwkyyyyy', '.wkddddd', '..kyyyyy', '..kddddd',
    '...kyyyy', '....kkkk', '.......k', '........'] },
  wolf: { mirror: true, pal: { k: OUTLINE, a: '#7a7f8c', b: '#c8ccd4', e: '#f0c030', w: '#ffffff' }, px: [
    '........', '.kk.....', '.kak....', '.kaakkkk',
    '.kaaaaaa', 'kaaaaaaa', 'kaeeaaaa', 'kaaaaaaa',
    'kaaaabbb', '.kaaabbk', '.kaabwbb', '..kaabbb',
    '...kkbbb', '.....kkk', '........', '........'] },
  cact: { mirror: true, pal: { k: OUTLINE, g: '#3f9e4f', w: '#e8f0d8', p: '#f088b0' }, px: [
    '......pp', '......pp', '....kkkk', '...kgggg',
    '...kgwgg', 'kk.kgggg', 'kgkkgwgg', 'kgkkgkgg',
    'kgkkgggg', 'kkkkgggg', '...kggkk', '...kgggg',
    '...kgwgg', '...kgggg', '....kkkk', '........'] },
  liza: { mirror: true, pal: { k: OUTLINE, a: '#8fae4a', b: '#e0d8a0', e: '#e05030' }, px: [
    '........', '........', '...kkkkk', '..kaaaaa',
    '.kaeeaaa', 'kaaaaaaa', 'kaaaaaak', '.kaaaaaa',
    '..kkaaaa', '.kaaaaaa', 'kaaabbbb', 'kaaabbbb',
    '.kaabbbb', '..kkbbbb', '....kkkk', '........'] },
  gobl: { mirror: true, pal: { k: OUTLINE, r: '#c03838', g: '#5da84c', n: '#3d7a34', e: '#f0d040', w: '#ffffff', b: '#7a5230' }, px: [
    '........', '...kkkkk', '..krrrrr', '.krrrrrr',
    '.kkggggg', '.kgeeggg', 'kkggggnn', '.kgggggg',
    '.kgwwwww', '.kkkkkkk', '..kggggg', '..kkkkkk',
    '..kbbbbb', '.kbbbbbb', '..kkkkkk', '........'] },
  wisp: { mirror: true, pal: { k: OUTLINE, f: '#7a5df0', i: '#cfeaff' }, px: [
    '.....k..', '..k..kf.', '..kf.kf.', '.kffkfff',
    '.kffffff', 'kfffffff', 'kffiiiii', 'kfiiiiii',
    'kfiikiii', 'kfiiiiii', 'kffiiiii', '.kffffff',
    '.kffffff', '..kkffff', '....kkkk', '........'] },
  skel: { mirror: true, pal: { k: OUTLINE, W: '#e8e8ea' }, px: [
    '........', '...kkkkk', '..kWWWWW', '.kWWWWWW',
    '.kWWWWWW', '.kWkkWWW', '.kWkkWWW', '.kWWWWWk',
    '..kWWWWW', '..kWkWkW', '...kkkkk', '......kW',
    '..kWWWWW', '...kWWWW', '....kkkk', '........'] },
  golem: { mirror: true, pal: { k: OUTLINE, R: '#8a6f52', c: '#5a4534', o: '#ffb028' }, px: [
    '........', '....kkkk', '...kRRRR', '...kRoRR',
    '...kRRRR', '.kkkRRRR', 'kRRkRRRR', 'kRRkRRRR',
    'kRRkRcRR', 'kRRkRRRR', 'kRRkRRRR', 'kkkkRcRR',
    '...kRRRR', '..kRRRRR', '..kkkkkk', '........'] },
  guard: { base: 'golem', pal: { k: OUTLINE, R: '#7a8494', c: '#59616e', o: '#40d8f0' } },
  drak: { mirror: true, pal: { k: OUTLINE, g: '#4fae5e', c: '#f0e0b0', e: '#f04830', h: '#f0e8d0', d: '#2e7a3e' }, px: [
    '........', '..h.....', '..kkkkkk', '.kgggggg',
    '.kggeggg', 'kggggggg', 'kggggggk', 'kggggggg',
    '.kgggggg', 'dkgccccc', 'ddkgcccc', '.dkgcccc',
    '..kgcccc', '..kgcccc', '...kkkkk', '........'] },
  dlord: { base: 'drak', pal: { k: OUTLINE, g: '#c04838', c: '#f0d0a0', e: '#f0e030', h: '#f0e8d0', d: '#7a2820' } },
  maou: { mirror: true, pal: { k: OUTLINE, h: '#e8d9a0', P: '#cfa9e8', e: '#ff4b4b', w: '#ffffff', B: '#3a2350', G: '#40e0d0' }, px: [
    '.hh.........', '.khh........', '..khh.......', '..khhh......',
    '...khh.kkkkk', '...khhkPPPPP', '....kkPPPPPP', '....kPPPPPPP',
    '....kPeePPPP', '....kPPPPPPP', '....kPkkkkkk', '....kPPkwkwk',
    '...kkBBkkkkk', '..kBBBBBBBBB', '.kBBkBBBBBBB', '.kBBkBBBBBBB',
    'kBBkBBBBBBGG', 'kBBkBBBBBBBB', 'kBkkBBBBBBBB', 'khkBBBBBBBBB',
    '.kkkBBBBBBBB', '....kBBBBBBB', '.....kkkkkkk', '............'] },
  /* --- 主人公 --- */
  heroD: { mirror: false, pal: { k: OUTLINE, h: '#8a5a2e', f: '#f4cba0', g: '#3fae62', b: '#4a3830' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '....khhhhhhk....', '....kffffffk....', '....kfkffkfk....', '.....kffffk.....',
    '.....kggggk.....', '....kggggggk....', '...kgggggggg....', '..kfkggggggkf...',
    '...kkggggggkk...', '....kggggggk....', '....kbbkkbbk....', '....kkk..kkk....'] },
  heroU: { mirror: false, pal: { k: OUTLINE, h: '#8a5a2e', g: '#3fae62', b: '#4a3830', f: '#f4cba0' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '....khhhhhhk....', '....khhhhhhk....', '....khhhhhhk....', '.....khhhhk.....',
    '.....kggggk.....', '....kggggggk....', '...kgggggggg....', '..kfkggggggkf...',
    '...kkggggggkk...', '....kggggggk....', '....kbbkkbbk....', '....kkk..kkk....'] },
  heroS1: { mirror: false, pal: { k: OUTLINE, h: '#8a5a2e', f: '#f4cba0', g: '#3fae62', b: '#4a3830' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '....khhhhhhk....', '.....kffffk.....', '.....kfkffk.....', '.....kffffk.....',
    '.....kggggk.....', '....kggggggk....', '....kggggggk....', '....kgggggkf....',
    '.....kggggk.....', '.....kggggk.....', '....kbbkbbk.....', '....kkk.kkk.....'] },
  heroS2: { mirror: false, pal: { k: OUTLINE, h: '#8a5a2e', f: '#f4cba0', g: '#3fae62', b: '#4a3830' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '....khhhhhhk....', '.....kffffk.....', '.....kfkffk.....', '.....kffffk.....',
    '.....kggggk.....', '....kggggggk....', '....kggggggk....', '....kgggggkf....',
    '.....kggggk.....', '.....kggggk.....', '.....kbbbk......', '.....kkkkk......'] },
  /* --- 妹 (ミア) --- */
  sisterD: { mirror: false, pal: { k: OUTLINE, h: '#b0622a', f: '#f6d2ac', d: '#d05a7a', b: '#8a3852' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '...khhhhhhhhk...', '...khffffffhk...', '...khfkffkfhk...', '....khffffhk....',
    '.....kddddk.....', '....kddddddk....', '...kdddddddd....', '..kfkddddddkf...',
    '...kkddddddkk...', '...kddddddddk...', '...kddddddddk...', '....kkkkkkkk....'] },
  sisterU: { mirror: false, pal: { k: OUTLINE, h: '#b0622a', f: '#f6d2ac', d: '#d05a7a', b: '#8a3852' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '...khhhhhhhhk...', '...khhhhhhhhk...', '...khhhhhhhhk...', '....khhhhhhk....',
    '.....kddddk.....', '....kddddddk....', '...kdddddddd....', '..kfkddddddkf...',
    '...kkddddddkk...', '...kddddddddk...', '...kddddddddk...', '....kkkkkkkk....'] },
  sisterS1: { mirror: false, pal: { k: OUTLINE, h: '#b0622a', f: '#f6d2ac', d: '#d05a7a', b: '#8a3852' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '....khhhhhhhk...', '.....kffffkhk...', '.....kfkffkhk...', '.....kffffkhk...',
    '.....kddddkk....', '....kddddddk....', '....kddddddk....', '....kdddddkf....',
    '....kddddddk....', '...kddddddddk...', '...kddddddddk...', '....kkkkkkkk....'] },
  sisterS2: { mirror: false, pal: { k: OUTLINE, h: '#b0622a', f: '#f6d2ac', d: '#d05a7a', b: '#8a3852' }, px: [
    '................', '................', '......kkkk......', '.....khhhhk.....',
    '....khhhhhhk....', '....khhhhhhhk...', '.....kffffkhk...', '.....kfkffkhk...',
    '.....kffffkhk...', '.....kddddkk....', '....kddddddk....', '....kddddddk....',
    '....kdddddkf....', '...kddddddddk...', '...kddddddddk...', '....kkkkkkkk....'] },
  /* --- 裏ボス りゅうじんカイザー (黄金竜) --- */
  kaiser: { base: 'drak', pal: { k: OUTLINE, g: '#e0b83a', c: '#f8f0d0', e: '#f04830', h: '#ffffff', d: '#a87f1e' } },
  /* --- 真のラスボス だいまおう (漆黒) --- */
  darklord: { base: 'maou', pal: { k: OUTLINE, h: '#8a1a2a', P: '#3a3f5c', e: '#ffe040', w: '#ff6a6a', B: '#14101e', G: '#ff3050' } },
  /* --- 町のひとびと (heroDの色ちがい / ローブ姿) --- */
  vilA: { base: 'heroD', pal: { k: OUTLINE, h: '#4a3320', f: '#f4cba0', g: '#b0623a', b: '#4a3830' } },
  vilB: { base: 'heroD', pal: { k: OUTLINE, h: '#c8a24a', f: '#f4cba0', g: '#4a78c0', b: '#3a3548' } },
  vilC: { base: 'heroD', pal: { k: OUTLINE, h: '#7a3a28', f: '#f6d2ac', g: '#c05a88', b: '#5a3040' } },
  child: { base: 'heroD', pal: { k: OUTLINE, h: '#3a3a3a', f: '#f6d2ac', g: '#e0a040', b: '#7a5230' } },
  soldier: { base: 'heroD', pal: { k: OUTLINE, h: '#888e9c', f: '#f4cba0', g: '#8a2f3a', b: '#3a3f4c' } },
  merchant: { base: 'heroD', pal: { k: OUTLINE, h: '#5a4028', f: '#f4cba0', g: '#3f8e62', b: '#4a3830' } },
  robe: { mirror: false, pal: { k: OUTLINE, h: '#d8d0c0', f: '#f4cba0', R: '#f0ead8', t: '#c8a24a' }, px: [
    '................', '......kkkk......', '.....khhhhk.....', '....khhhhhhk....',
    '....khhhhhhk....', '....kffffffk....', '....kfkffkfk....', '.....kffffk.....',
    '.....kRRRRk.....', '....kRRttRRk....', '...kRRRttRRRk...', '..kfkRRttRRkf...',
    '...kkRRttRRkk...', '....kRRRRRRk....', '....kRRRRRRk....', '....kkkkkkkk....'] },
  elder: { base: 'robe', pal: { k: OUTLINE, h: '#c8c8c8', f: '#e8c098', R: '#8a7a5a', t: '#6a5c40' } },
  mage: { base: 'robe', pal: { k: OUTLINE, h: '#3a2a5a', f: '#f4cba0', R: '#6a4ab0', t: '#c8a24a' } },
  /* --- 馬車 (うま+荷台) --- */
  wagon: { mirror: false, pal: { k: OUTLINE, h: '#a8703d', m: '#6a4526', c: '#c8a05a', d: '#8a6a3a', o: '#3a3025', w: '#f0e8d8' }, px: [
    '................', '................', '.........kk.....', '........khhk....',
    '.kkkkkkk.khhkk..', '.kccccck.khhk...', '.kcddddkkkhhk...', '.kcddddkhhhhhk..',
    '.kcddddkhhhhhk..', '.kccccckhhhhk...', '.kkkkkkkkhkhk...', '..koo.k.khkhk...',
    '..kookk.kk.kk...', '...kk...........', '................', '................'] },
};

/* ---------- ワールドマップ生成 (48x40) ----------
   g草 f森 m山 w水 s砂 p沼 r道 b橋 B番人橋 T村 P港町 C野営地 D洞窟 X魔王城 J神殿 */
const MW = 48, MH = 40;
const WORLD = (() => {
  const M = Array.from({ length: MH }, () => Array(MW).fill('g'));
  const fill = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) M[y][x] = c; };
  fill(0, 0, MW - 1, 2, 'w'); fill(0, MH - 2, MW - 1, MH - 1, 'w');
  fill(0, 0, 1, MH - 1, 'w'); fill(MW - 2, 0, MW - 1, MH - 1, 'w');
  fill(22, 3, 23, MH - 3, 'w');
  fill(2, 3, 21, 8, 'p');
  fill(2, 9, 21, 11, 'm');
  fill(2, 12, 21, 17, 'f');
  fill(24, 3, 31, 7, 'p');
  fill(32, 3, 45, 9, 'm');
  M[6][40] = 'D'; M[7][40] = 's'; M[8][40] = 's'; M[9][40] = 's'; M[10][40] = 's';
  fill(30, 26, 45, 36, 's');
  fill(27, 13, 29, 15, 'f'); fill(36, 18, 38, 20, 'f'); M[24][42] = 'm'; M[14][34] = 'm';
  fill(5, 22, 6, 23, 'f'); M[15][5] = 'm'; M[28][17] = 'm'; M[33][14] = 'f'; M[34][14] = 'f';
  fill(18, 19, 21, 19, 'r'); fill(24, 19, 27, 19, 'r');
  M[19][22] = 'B'; M[19][23] = 'b';
  M[4][22] = 'b'; M[4][23] = 'b';
  fill(8, 26, 8, 29, 'r'); fill(8, 31, 8, 33, 'r'); fill(9, 26, 20, 26, 'r'); M[26][20] = 'r';
  fill(20, 20, 20, 25, 'r'); fill(28, 19, 30, 19, 'r'); fill(30, 20, 30, 21, 'r');
  M[30][8] = 'T'; M[22][30] = 'P'; M[4][17] = 'C'; M[4][6] = 'X';
  M[13][37] = 'J';
  return M.map(r => r.join(''));
})();

/* エンカウントゾーン */
const ZONES = [
  { r: [2, 3, 21, 8], t: 't4' },
  { r: [24, 3, 31, 7], t: 't4' },
  { r: [32, 3, 45, 10], t: 't3b' },
  { r: [2, 12, 21, 18], t: 't2' },
  { r: [2, 19, 21, 37], t: 't1' },
  { r: [24, 26, 45, 37], t: 't3b' },
  { r: [24, 8, 45, 25], t: 't3a' },
];
const ENC = {
  t1: [['puni', 1, 2, 38], ['bat', 1, 2, 30], ['rat', 2, 3, 22], ['kino', 2, 2, 10]],
  t2: [['kino', 3, 4, 28], ['bee', 3, 4, 28], ['wolf', 4, 5, 24], ['bat', 3, 4, 20]],
  t3a: [['gobl', 6, 7, 28], ['liza', 6, 7, 24], ['bee', 6, 6, 14], ['wolf', 6, 7, 14], ['cact', 6, 6, 14], ['metal', 5, 5, 6]],
  t3b: [['cact', 7, 8, 32], ['liza', 7, 8, 26], ['gobl', 7, 8, 20], ['wisp', 7, 7, 14], ['metal', 6, 6, 8]],
  t4: [['skel', 9, 10, 28], ['wisp', 9, 10, 24], ['golem', 10, 11, 20], ['drak', 10, 11, 18], ['metal', 8, 8, 10]],
};
const ZONE_BG = { t1: 'plain', t2: 'forest', t3a: 'plain', t3b: 'desert', t4: 'swamp' };

/* ---------- とくいわざ ---------- */
const SKILLS = {
  /* まものの わざ */
  taiatari: { n: 'たいあたり', mp: 0, kind: 'phys', mult: 1.3, tgt: 'one' },
  kyuketsu: { n: 'きゅうけつ', mp: 2, kind: 'drain', mult: 1.0, tgt: 'one' },
  togetoge: { n: 'とげとげこうげき', mp: 2, kind: 'phys', mult: 1.25, tgt: 'one' },
  nemuri: { n: 'ねむりこな', mp: 3, kind: 'sleep', tgt: 'all' },
  dokubari: { n: 'どくばり', mp: 2, kind: 'phys', mult: 1.0, poison: 0.4, tgt: 'one' },
  kamitsuku: { n: 'かみつく', mp: 2, kind: 'phys', mult: 1.4, tgt: 'one' },
  misairu: { n: 'とげミサイル', mp: 4, kind: 'phys', mult: 0.7, tgt: 'all' },
  hinoiki: { n: 'ひのいき', mp: 4, kind: 'breath', pow: [10, 16], tgt: 'all' },
  bunmawashi: { n: 'ぶんまわし', mp: 4, kind: 'phys', mult: 0.8, tgt: 'all' },
  blaze: { n: 'ブレイズ', mp: 5, kind: 'mag', pow: [26, 38], tgt: 'one' },
  nidogiri: { n: 'にどぎり', mp: 4, kind: 'phys', mult: 0.75, hits: 2, tgt: 'one' },
  iwanage: { n: 'いわなげ', mp: 5, kind: 'phys', mult: 1.5, tgt: 'one' },
  goukaen: { n: 'ごうかえん', mp: 8, kind: 'breath', pow: [26, 36], tgt: 'all' },
  darkball: { n: 'ダークボール', mp: 0, kind: 'mag', pow: [45, 62], tgt: 'one' },
  darkstorm: { n: 'ダークストーム', mp: 0, kind: 'breath', pow: [32, 44], tgt: 'all' },
  flee: { n: 'にげあし', mp: 0, kind: 'flee' },
  /* ゆうしゃの じゅもん */
  spark: { n: 'スパーク', mp: 4, kind: 'mag', pow: [9, 15], tgt: 'all' },
  gigaspark: { n: 'ギガスパーク', mp: 9, kind: 'mag', pow: [30, 42], tgt: 'all' },
  heal: { n: 'ヒール', mp: 3, kind: 'heal', pow: [28, 36], tgt: 'ally' },
  hiheal: { n: 'ハイヒール', mp: 6, kind: 'heal', pow: [75, 95], tgt: 'ally' },
  rezarek: { n: 'リザレク', mp: 10, kind: 'revive', pow: 0.5, tgt: 'ally' },
  /* せんし */
  kabutowari: { n: 'かぶとわり', mp: 2, kind: 'phys', mult: 1.1, defdn: 0.4, tgt: 'one' },
  hayabusa: { n: 'はやぶさぎり', mp: 4, kind: 'phys', mult: 0.8, hits: 2, tgt: 'one' },
  zenryoku: { n: 'ぜんりょくぎり', mp: 6, kind: 'phys', mult: 1.8, tgt: 'one' },
  majin: { n: 'まじんぎり', mp: 6, kind: 'majin', tgt: 'one' },
  /* ぶとうか */
  seiken: { n: 'せいけんづき', mp: 2, kind: 'phys', mult: 1.7, miss: 0.25, tgt: 'one' },
  mawashigeri: { n: 'まわしげり', mp: 4, kind: 'phys', mult: 0.75, tgt: 'all' },
  kiaitame: { n: 'きあいため', mp: 0, kind: 'charge', tgt: 'self' },
  bakuretsuken: { n: 'ばくれつけん', mp: 8, kind: 'physR', mult: 0.5, hits: 4, tgt: 'all' },
  /* まほうつかい */
  aisun: { n: 'アイスン', mp: 5, kind: 'mag', pow: [30, 44], tgt: 'one' },
  winda: { n: 'ウィンダ', mp: 6, kind: 'mag', pow: [14, 22], tgt: 'all' },
  blaza: { n: 'ブレイザ', mp: 10, kind: 'mag', pow: [62, 84], tgt: 'one' },
  aisura: { n: 'アイスラ', mp: 12, kind: 'mag', pow: [36, 50], tgt: 'all' },
  /* そうりょ */
  rifure: { n: 'リフレ', mp: 3, kind: 'cure', pow: [20, 28], tgt: 'ally' },
  /* とうぞく */
  nusumu: { n: 'ぬすむ', mp: 2, kind: 'steal', mult: 0.5, tgt: 'one' },
  kamaitachi: { n: 'かまいたち', mp: 3, kind: 'phys', mult: 1.45, tgt: 'one' },
  smoke: { n: 'スモークボム', mp: 3, kind: 'escape', tgt: 'self' },
  shinobiashi: { n: 'しのびあし', mp: 0, kind: 'passive', info: 'もっていると まものに あいにくくなる', tgt: 'self' },
  /* まものつかい */
  nadameru: { n: 'なだめる', mp: 2, kind: 'tame', tgt: 'self' },
  muchiuchi: { n: 'ムチうち', mp: 3, kind: 'phys', mult: 0.8, tgt: 'all' },
  iyashiuta: { n: 'いやしのうた', mp: 5, kind: 'healall', pow: [24, 34], tgt: 'self' },
  wildkick: { n: 'ワイルドキック', mp: 4, kind: 'phys', mult: 1.55, tgt: 'one' },
  /* バトルマスター */
  tsubame: { n: 'つばめがえし', mp: 6, kind: 'phys', mult: 1.05, hits: 2, tgt: 'one' },
  grand: { n: 'グランドスラム', mp: 8, kind: 'phys', mult: 1.05, tgt: 'all' },
  tension: { n: 'テンションブレイク', mp: 8, kind: 'phys', mult: 2.3, tgt: 'one' },
  ougi: { n: 'おうぎ・りゅうせい', mp: 12, kind: 'physR', mult: 1.0, hits: 3, tgt: 'all' },
  /* けんじゃ */
  holyray: { n: 'ホーリーレイ', mp: 9, kind: 'mag', pow: [38, 54], tgt: 'all' },
  fullheal: { n: 'フルヒール', mp: 8, kind: 'heal', pow: [999, 999], tgt: 'ally' },
  gigafrea: { n: 'ギガフレア', mp: 16, kind: 'mag', pow: [60, 80], tgt: 'all' },
  fullrez: { n: 'フルリザレク', mp: 15, kind: 'revive', pow: 1.0, tgt: 'ally' },
  /* おどりこ */
  shibire: { n: 'しびれダンス', mp: 3, kind: 'sleep', tgt: 'all' },
  kennomai: { n: 'けんのまい', mp: 4, kind: 'physR', mult: 0.9, hits: 2, tgt: 'all' },
  iyashistep: { n: 'いやしのステップ', mp: 5, kind: 'healall', pow: [30, 40], tgt: 'self' },
  tsuruginomai: { n: 'つるぎのまい', mp: 10, kind: 'physR', mult: 1.0, hits: 4, tgt: 'all' },
  /* しょうにん */
  bottakuri: { n: 'ぼったくり', mp: 2, kind: 'goldhit', mult: 1.2, tgt: 'one' },
  anahori: { n: 'あなほり', mp: 0, kind: 'gold', tgt: 'self' },
  mekiki: { n: 'めきき', mp: 0, kind: 'reveal', tgt: 'self' },
  oomouke: { n: 'おおもうけ', mp: 6, kind: 'goldhit', mult: 1.6, tgt: 'one' },
  /* パラディン */
  oinori: { n: 'おいのり', mp: 4, kind: 'heal', pow: [40, 60], tgt: 'ally' },
  holylance: { n: 'ホーリーランス', mp: 6, kind: 'mag', pow: [55, 75], tgt: 'one' },
  shinkotate: { n: 'しんこうのたて', mp: 6, kind: 'shield', tgt: 'self' },
  grandcross: { n: 'グランドクロス', mp: 12, kind: 'mag', pow: [45, 60], tgt: 'all' },
  /* レンジャー */
  moonsault: { n: 'ムーンサルト', mp: 3, kind: 'phys', mult: 1.35, tgt: 'one' },
  tsukamaeru: { n: 'つかまえる', mp: 3, kind: 'tamephys', mult: 0.8, tgt: 'one' },
  featherarrow: { n: 'フェザーアロー', mp: 5, kind: 'phys', mult: 0.9, hits: 2, tgt: 'one' },
  kemonoyobi: { n: 'けものよび', mp: 10, kind: 'breath', pow: [40, 55], tgt: 'all' },
  /* ゆうしゃ */
  raitoning: { n: 'ライトニング', mp: 8, kind: 'mag', pow: [45, 60], tgt: 'all' },
  iyashihikari: { n: 'いやしのひかり', mp: 10, kind: 'healall', pow: [60, 80], tgt: 'self' },
  gigacrash: { n: 'ギガクラッシュ', mp: 10, kind: 'phys', mult: 2.6, tgt: 'one' },
  ultimavolt: { n: 'アルテマボルト', mp: 18, kind: 'mag', pow: [70, 90], tgt: 'all' },
  /* 兄妹の固有わざ */
  shinebolt: { n: 'シャインボルト', mp: 12, kind: 'mag', pow: [90, 120], tgt: 'one' },
  /* まほうせんし */
  flameblade: { n: 'ほのおぎり', mp: 3, kind: 'phys', mult: 1.4, tgt: 'one' },
  raiblade: { n: 'いなずまぎり', mp: 5, kind: 'phys', mult: 1.6, tgt: 'one' },
  magibarrier: { n: 'マジックバリア', mp: 6, kind: 'shield', tgt: 'self' },
  gigasword: { n: 'ギガソード', mp: 10, kind: 'phys', mult: 2.2, tgt: 'one' },
  /* スーパースター */
  smile: { n: 'まばゆいスマイル', mp: 4, kind: 'sleep', tgt: 'all' },
  stardust: { n: 'スターダスト', mp: 6, kind: 'mag', pow: [20, 30], tgt: 'all' },
  concert: { n: 'スターコンサート', mp: 8, kind: 'healall', pow: [40, 55], tgt: 'self' },
  million: { n: 'ミリオンスマッシュ', mp: 12, kind: 'physR', mult: 0.75, hits: 5, tgt: 'all' },
};
/* キャラクター固有のとくいわざ (レベルで習得・職業とは別枠) */
const INNATE = {
  hero: [[2, 'spark'], [5, 'blaze'], [9, 'gigaspark'], [14, 'shinebolt']],
  sister: [[2, 'heal'], [5, 'rifure'], [9, 'hiheal'], [13, 'rezarek']],
};

/* ---------- 職業 (ダーマしんでんで転職・DQ6方式) ----------
   基本8職 → 2職マスターで上級職 → 上級マスターで「ゆうしゃ」(兄妹のみ)
   m: 在職中のステータス倍率 / skills: [職Lv, わざ] (おぼえたら永続) */
const JOBS = {
  senshi: { n: 'せんし', desc: 'こうげき・まもりが 上がる', m: { atk: 1.25, def: 1.10, agi: 0.90, hp: 1.10, mp: 0.90 }, skills: [[2, 'kabutowari'], [4, 'hayabusa'], [6, 'zenryoku'], [8, 'majin']] },
  butoka: { n: 'ぶとうか', desc: 'すばやさと 会心に すぐれる', m: { atk: 1.10, def: 0.95, agi: 1.25, hp: 1.00, mp: 0.90 }, crit: 2, skills: [[2, 'seiken'], [4, 'mawashigeri'], [6, 'kiaitame'], [8, 'bakuretsuken']] },
  maho: { n: 'まほうつかい', desc: 'こうげき呪文の 使い手', m: { atk: 0.80, def: 0.90, agi: 1.05, hp: 0.90, mp: 1.35 }, skills: [[2, 'aisun'], [4, 'winda'], [6, 'blaza'], [8, 'aisura']] },
  soryo: { n: 'そうりょ', desc: 'かいふく呪文の 使い手', m: { atk: 0.90, def: 1.00, agi: 1.00, hp: 0.95, mp: 1.25 }, skills: [[2, 'heal'], [4, 'rifure'], [6, 'hiheal'], [8, 'rezarek']] },
  tozoku: { n: 'とうぞく', desc: 'すばやく 盗みも できる', m: { atk: 0.95, def: 0.95, agi: 1.30, hp: 1.00, mp: 1.00 }, skills: [[2, 'nusumu'], [4, 'kamaitachi'], [6, 'smoke'], [8, 'shinobiashi']] },
  mamotsukai: { n: 'まものつかい', desc: 'まものが なかまに なりやすい', m: { atk: 1.00, def: 1.00, agi: 1.05, hp: 1.00, mp: 1.10 }, rec: 1.5, skills: [[2, 'nadameru'], [4, 'muchiuchi'], [6, 'iyashiuta'], [8, 'wildkick']] },
  odoriko: { n: 'おどりこ', desc: 'まいおどり ほんろうする', m: { atk: 0.95, def: 0.95, agi: 1.35, hp: 0.95, mp: 1.05 }, skills: [[2, 'shibire'], [4, 'kennomai'], [6, 'iyashistep'], [8, 'tsuruginomai']] },
  shonin: { n: 'しょうにん', desc: 'おかねもうけの たつじん', m: { atk: 1.05, def: 1.05, agi: 1.00, hp: 1.05, mp: 1.00 }, goldx: 1.25, skills: [[2, 'bottakuri'], [4, 'anahori'], [6, 'mekiki'], [8, 'oomouke']] },
  batoma: { n: 'バトルマスター', desc: 'せんし+ぶとうかを 極めし者', req: ['senshi', 'butoka'], m: { atk: 1.40, def: 1.10, agi: 1.15, hp: 1.15, mp: 0.95 }, crit: 2, skills: [[2, 'tsubame'], [4, 'grand'], [6, 'tension'], [8, 'ougi']] },
  paladin: { n: 'パラディン', desc: 'ぶとうか+そうりょを 極めし者', req: ['butoka', 'soryo'], m: { atk: 1.10, def: 1.30, agi: 0.90, hp: 1.15, mp: 1.10 }, skills: [[2, 'oinori'], [4, 'holylance'], [6, 'shinkotate'], [8, 'grandcross']] },
  kenja: { n: 'けんじゃ', desc: 'まほう+そうりょを 極めし者', req: ['maho', 'soryo'], m: { atk: 0.90, def: 1.00, agi: 1.05, hp: 1.00, mp: 1.45 }, skills: [[2, 'holyray'], [4, 'fullheal'], [6, 'gigafrea'], [8, 'fullrez']] },
  ranger: { n: 'レンジャー', desc: 'とうぞく+まものつかいを 極めし者', req: ['tozoku', 'mamotsukai'], m: { atk: 1.10, def: 1.00, agi: 1.25, hp: 1.05, mp: 1.05 }, rec: 1.3, skills: [[2, 'moonsault'], [4, 'tsukamaeru'], [6, 'featherarrow'], [8, 'kemonoyobi']] },
  mahosenshi: { n: 'まほうせんし', desc: 'せんし+まほうつかいを 極めし者', req: ['senshi', 'maho'], m: { atk: 1.20, def: 1.05, agi: 1.05, hp: 1.05, mp: 1.20 }, skills: [[2, 'flameblade'], [4, 'raiblade'], [6, 'magibarrier'], [8, 'gigasword']] },
  superstar: { n: 'スーパースター', desc: 'おどりこ+しょうにんを 極めし者', req: ['odoriko', 'shonin'], m: { atk: 1.00, def: 1.00, agi: 1.30, hp: 1.05, mp: 1.20 }, goldx: 1.25, skills: [[2, 'smile'], [4, 'stardust'], [6, 'concert'], [8, 'million']] },
  yusha: { n: 'ゆうしゃ', desc: 'えらばれし 兄妹だけの しょくぎょう', human: true, reqAdv: true, m: { atk: 1.30, def: 1.20, agi: 1.15, hp: 1.20, mp: 1.20 }, skills: [[2, 'raitoning'], [4, 'iyashihikari'], [6, 'gigacrash'], [8, 'ultimavolt']] },
};
/* 職Lv l に なるのに必要な 勝利数 (index = l-1) と 段位のなまえ */
const JCUM = [0, 2, 5, 10, 16, 24, 34, 46];
const JOB_MAX = 8;
const JOB_TITLES = ['みならい', 'かけだし', 'いちにんまえ', 'じゅくれん', 'くろうと', 'たつじん', 'めいじん', 'マスター'];
const ADV_JOBS = ['batoma', 'paladin', 'kenja', 'ranger', 'mahosenshi', 'superstar'];

/* ---------- せいかく (なかまごとの個性・DQ3ふう) ---------- */
const PERSONALITIES = [
  { id: 'normal', n: 'ふつう', w: 25, m: {} },
  { id: 'chikara', n: 'ちからじまん', w: 15, m: { atk: 1.1 } },
  { id: 'tough', n: 'タフネス', w: 15, m: { hp: 1.1 } },
  { id: 'quick', n: 'すばしっこい', w: 15, m: { agi: 1.12 } },
  { id: 'smart', n: 'ものしり', w: 12, m: { mp: 1.12 } },
  { id: 'guard', n: 'しんちょう', w: 12, m: { def: 1.08 } },
  { id: 'genki', n: 'おてんば', w: 6, m: { atk: 1.06, agi: 1.06 } },
];

/* ---------- 種族 ----------
   eqok: 装備できる部位 (w=けん s=たて h=あたま b=からだ a=アクセ) */
const SPECIES = {
  hero: { n: 'ゆうしゃ', spr: 'heroD', human: true, eqok: 'wshba', base: [26, 8, 9, 6, 7], grow: [7, 4, 2.4, 2, 1.6], skills: [], rec: 0, exp: 0, gold: 0 },
  sister: { n: 'いもうと', spr: 'sisterD', human: true, eqok: 'wshba', base: [23, 12, 8, 5, 8], grow: [6, 4.6, 2.1, 1.8, 1.8], skills: [], rec: 0, exp: 0, gold: 0 },
  puni: { n: 'ぷにまる', spr: 'puni', eqok: 'ba', base: [11, 6, 6, 5, 5], grow: [5, 1.5, 1.8, 1.7, 1.4], skills: [[1, 'taiatari'], [6, 'heal']], rec: 0.25, exp: 4, gold: 5, ai: [['atk', 75], ['taiatari', 25]] },
  bat: { n: 'バサバサ', spr: 'bat', eqok: 'a', base: [9, 6, 6, 4, 9], grow: [4.5, 1.5, 1.7, 1.3, 2], skills: [[1, 'kyuketsu']], rec: 0.20, exp: 4, gold: 4, ai: [['atk', 70], ['kyuketsu', 30]] },
  rat: { n: 'とげネズミ', spr: 'rat', eqok: 'ba', base: [12, 4, 8, 5, 7], grow: [5, 1, 2, 1.5, 1.6], skills: [[1, 'togetoge']], rec: 0.18, exp: 6, gold: 7, ai: [['atk', 70], ['togetoge', 30]] },
  kino: { n: 'キノッコ', spr: 'kino', eqok: 'ha', base: [14, 8, 7, 6, 5], grow: [5.5, 1.6, 1.8, 1.7, 1.2], skills: [[1, 'nemuri']], rec: 0.16, exp: 9, gold: 8, ai: [['atk', 65], ['nemuri', 35]] },
  bee: { n: 'ハチどん', spr: 'bee', eqok: 'a', base: [13, 6, 9, 5, 10], grow: [5, 1.2, 2.1, 1.4, 2], skills: [[1, 'dokubari']], rec: 0.15, exp: 10, gold: 9, ai: [['atk', 60], ['dokubari', 40]] },
  wolf: { n: 'もりオオカミ', spr: 'wolf', eqok: 'ba', base: [18, 4, 11, 7, 9], grow: [6, 1, 2.4, 1.6, 1.8], skills: [[1, 'kamitsuku']], rec: 0.13, exp: 13, gold: 11, ai: [['atk', 60], ['kamitsuku', 40]] },
  cact: { n: 'サボチン', spr: 'cact', eqok: 'ha', base: [16, 8, 10, 9, 6], grow: [5.5, 1.2, 2.2, 2, 1.2], skills: [[1, 'misairu']], rec: 0.12, exp: 16, gold: 14, ai: [['atk', 60], ['misairu', 40]] },
  liza: { n: 'スナトカゲ', spr: 'liza', eqok: 'ba', base: [17, 8, 11, 8, 8], grow: [6, 1.4, 2.3, 1.7, 1.6], skills: [[1, 'hinoiki']], rec: 0.11, exp: 18, gold: 15, ai: [['atk', 60], ['hinoiki', 40]] },
  gobl: { n: 'ゴブリン', spr: 'gobl', eqok: 'wshba', base: [20, 4, 13, 8, 8], grow: [6.5, 1, 2.5, 1.8, 1.6], skills: [[1, 'bunmawashi']], rec: 0.11, exp: 20, gold: 18, ai: [['atk', 70], ['bunmawashi', 30]] },
  wisp: { n: 'ゆらび', spr: 'wisp', eqok: 'a', base: [14, 14, 8, 7, 9], grow: [5, 2.6, 1.9, 1.6, 1.8], skills: [[1, 'blaze'], [10, 'nemuri']], rec: 0.10, exp: 24, gold: 20, ai: [['atk', 40], ['blaze', 45], ['nemuri', 15]] },
  skel: { n: 'ガイコッツ', spr: 'skel', eqok: 'wshba', base: [24, 6, 15, 10, 9], grow: [7, 1, 2.7, 1.9, 1.7], skills: [[1, 'nidogiri']], rec: 0.09, exp: 30, gold: 24, ai: [['atk', 60], ['nidogiri', 40]] },
  golem: { n: 'マッドゴーレム', spr: 'golem', eqok: 'hba', base: [30, 6, 16, 14, 4], grow: [8, 1, 2.8, 2.4, 1], skills: [[1, 'iwanage']], rec: 0.08, exp: 36, gold: 28, ai: [['atk', 60], ['iwanage', 40]] },
  drak: { n: 'ドラゴキッズ', spr: 'drak', eqok: 'hba', base: [26, 10, 15, 11, 10], grow: [7, 1.8, 2.6, 1.9, 1.9], skills: [[1, 'hinoiki'], [13, 'goukaen']], rec: 0.06, exp: 45, gold: 40, ai: [['atk', 50], ['hinoiki', 50]] },
  metal: { n: 'メタルぷに', spr: 'metal', eqok: 'ba', base: [6, 0, 7, 40, 20], grow: [2, 0, 1, 3, 2], skills: [[1, 'taiatari']], rec: 0.03, exp: 180, gold: 30, metal: true, ai: [['atk', 50], ['flee', 50]] },
  guard: { n: 'ガーディアン', spr: 'guard', boss: true, base: [210, 0, 19, 14, 7], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 130, gold: 160, ai: [['atk', 65], ['iwanage', 35]] },
  dlord: { n: 'ドラゴロード', spr: 'dlord', boss: true, base: [360, 0, 25, 16, 11], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 400, gold: 450, ai: [['atk', 45], ['kamitsuku', 20], ['goukaen', 35]] },
  maou: { n: 'まおうゾルデ', spr: 'maou', boss: true, big: true, base: [680, 0, 33, 19, 14], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 0, gold: 0, ai: [['atk', 40], ['darkball', 30], ['goukaen', 30]], ai2: [['atk', 30], ['darkball', 25], ['darkstorm', 45]] },
  kaiser: { n: 'りゅうじんカイザー', spr: 'kaiser', boss: true, scale: 5, twice: true, base: [1200, 0, 42, 26, 18], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 2000, gold: 2000, ai: [['atk', 30], ['goukaen', 25], ['darkstorm', 25], ['raitoning', 20]] },
  darklord: { n: 'だいまおうグラゾス', spr: 'darklord', boss: true, big: true, base: [950, 0, 38, 22, 15], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 0, gold: 0, ai: [['atk', 35], ['darkball', 30], ['darkstorm', 20], ['goukaen', 15]], ai2: [['atk', 25], ['darkball', 25], ['darkstorm', 35], ['raitoning', 15]] },
};

/* よるに あらわれやすい まものたち */
const NIGHT_ENC = {
  t1: [['bat', 1, 2, 25]],
  t2: [['wisp', 4, 4, 12], ['bat', 3, 4, 12]],
  t3a: [['skel', 7, 7, 12]],
  t3b: [['skel', 7, 8, 12]],
  t4: [['wisp', 9, 10, 12]],
};

const EXPT = (() => { const a = [0, 0]; for (let l = 2; l <= 30; l++) a[l] = a[l - 1] + 6 * (l - 1) * (l - 1); return a; })();
const MAXLV = 30;
const PARTY_MAX = 4;      // せんとうメンバー
const CARAVAN_MAX = 8;    // ゆうしゃ+なかま7 (たいれつ+ばしゃ)
const RESERVE_MAX = 12;   // ほこら

/* ---------- どうぐ ---------- */
const ITEMS = {
  yakusou: { n: 'やくそう', price: 8, heal: [30, 40], info: 'HPを 30ほど かいふく' },
  iiyakusou: { n: 'いいやくそう', price: 36, heal: [85, 105], info: 'HPを 90ほど かいふく' },
  mahonomizu: { n: 'まほうのみず', price: 60, mp: 25, info: 'MPを 25 かいふく' },
  oyatsu: { n: 'まもののおやつ', price: 40, treat: true, info: 'せんとうちゅうに つかうと なかまに なりやすくなる' },
  hane: { n: 'ふっかつのハネ', price: 280, revive: 0.5, info: 'たおれた なかまを ふっかつさせる' },
};

/* ---------- そうび (type: w=けん s=たて h=あたま b=からだ a=アクセ) ---------- */
const GEAR = {
  w0: { n: 'ひのきのぼう', type: 'w', atk: 2, price: 30 },
  w1: { n: 'どうのつるぎ', type: 'w', atk: 7, price: 120 },
  w2: { n: 'はがねのつるぎ', type: 'w', atk: 15, price: 560 },
  w3: { n: 'ほのおのつるぎ', type: 'w', atk: 26, price: 1500 },
  w4: { n: 'りゅうのつるぎ', type: 'w', atk: 34, price: 2600 },
  w5: { n: 'まおうがりのけん', type: 'w', atk: 42, price: 6200 },
  s0: { n: 'かわのたて', type: 's', def: 3, price: 60 },
  s1: { n: 'うろこのたて', type: 's', def: 7, price: 320 },
  s2: { n: 'はがねのたて', type: 's', def: 12, price: 900 },
  s3: { n: 'りゅうのたて', type: 's', def: 18, price: 2200 },
  h0: { n: 'かわのぼうし', type: 'h', def: 2, price: 50 },
  h1: { n: 'てつかぶと', type: 'h', def: 6, price: 380 },
  h2: { n: 'はがねかぶと', type: 'h', def: 10, price: 1000 },
  h3: { n: 'りゅうのかぶと', type: 'h', def: 15, price: 2400 },
  b0: { n: 'ぬののふく', type: 'b', def: 2, price: 20 },
  b1: { n: 'かわのよろい', type: 'b', def: 6, price: 100 },
  b2: { n: 'くさりかたびら', type: 'b', def: 12, price: 470 },
  b3: { n: 'はがねのよろい', type: 'b', def: 20, price: 1400 },
  b4: { n: 'りゅうのよろい', type: 'b', def: 28, price: 3200 },
  a_chikara: { n: 'ちからのうでわ', type: 'a', atk: 8, price: 900 },
  a_mamori: { n: 'まもりのゆびわ', type: 'a', def: 8, price: 800 },
  a_hayate: { n: 'はやてのはね', type: 'a', agi: 12, price: 700 },
  a_inochi: { n: 'いのちのたま', type: 'a', hp: 30, price: 1100 },
  a_maho: { n: 'まほうのしずく', type: 'a', mp: 25, price: 1000 },
  a_natsuki: { n: 'なつきのすず', type: 'a', rec: 1.5, price: 600, info: 'まものが なかまに なりやすくなる' },
  a_ryujin: { n: 'りゅうじんのたま', type: 'a', atk: 10, def: 10, price: 5000, info: 'りゅうじんの ちからが やどる たま' },
};
const SLOTS = [['w', 'けん'], ['s', 'たて'], ['h', 'あたま'], ['b', 'からだ'], ['a1', 'アクセ1'], ['a2', 'アクセ2']];
const BAG_MAX = 24;

/* ---------- おみせ ---------- */
const SHOPS = {
  v_item: { n: 'どうぐや', stock: ['yakusou', 'oyatsu'] },
  v_gear: { n: 'ぶきぼうぐや', stock: ['w1', 's0', 'h0', 'b1'] },
  p_item: { n: 'どうぐや', stock: ['yakusou', 'iiyakusou', 'mahonomizu', 'oyatsu', 'hane'] },
  p_gear: { n: 'ぶきぼうぐや', stock: ['w2', 's1', 'h1', 'b2'] },
  p_acc: { n: 'アクセサリーや', stock: ['a_natsuki', 'a_hayate', 'a_mamori'] },
  c_item: { n: 'どうぐや', stock: ['iiyakusou', 'mahonomizu', 'oyatsu', 'hane'] },
  c_weapon: { n: 'ぶきや', stock: ['w4', 'w5', 's2', 's3'] },
  c_armor: { n: 'ぼうぐや', stock: ['h2', 'h3', 'b3', 'b4', 'a_chikara', 'a_inochi', 'a_maho'] },
};

/* ---------- 町マップ (16x12) ----------
   t木 g草 .みち W壁 Dとびら w水 f柵 m岩 F火 A祭壇 E出口 */
const TOWN_MAPS = {
  T: {
    n: 'ハジマリのむら', inn: 10, entry: [7, 10], map: [
      'tttttttttttttttt',
      'tggggggggggggggt',
      'tgWWWWggWWWWgggt',
      'tgWDWWggWDWWgggt',
      'tgg.ggggg..ggggt',
      'tgg........ggggt',
      'tgg..g.....WWWWt',
      'tgg..w.....WDWWt',
      'tgg.........gggt',
      'tggg.......ggggt',
      'tgggggg..ggggggt',
      'tttttttEEttttttt'],
    doors: { '3,3': { t: 'inn' }, '9,3': { t: 'shop', s: 'v_item' }, '12,7': { t: 'shop', s: 'v_gear' } },
    npcs: [
      { x: 6, y: 5, spr: 'vilA', txt: ['ようこそ ハジマリのむらへ。みなみや にしの そうげんには よわい まものが でるよ。', 'たたかいに かった まものは なかまに なりたがる ことが あるんだ。'] },
      { x: 10, y: 8, spr: 'vilB', txt: ['「まもののおやつ」を せんとうちゅうに つかうと なかまに なりやすいぞ。どうぐやで うってる。'] },
      { x: 4, y: 9, spr: 'elder', txt: ['ひがしの はしには ばんにんの ゴーレムが おる…。ちからを つけてから いどむのじゃ。', 'ばしゃが あれば なかまを 7ひきまで つれていける。たいれつは メニューの「なかま」で かえられるぞい。'] },
      { x: 11, y: 5, spr: 'child', txt: ['ぼく まものと ともだちなんだ！ まえの 4にんが たたかって うしろの みんなは ばしゃで まってるんだよ。'] },
      { x: 8, y: 6, spr: 'vilC', txt: ['やどやに とまると HPも MPも ぜんかいふく。ばしゃや ほこらの こも みんな げんきに なるわよ。'] },
      { x: 13, y: 9, spr: 'merchant', txt: ['かわの ひがし、とうほくの そうげんに ダーマしんでんが あるらしい。しょくぎょうに つけるって うわさだ。'] },
    ] },
  P: {
    n: 'ミナトのまち', inn: 25, entry: [6, 10], map: [
      'ffffffffffffwwww',
      'fgggggggggggwwww',
      'fgWWWWggWWWWwwww',
      'fgWDWWggWDWWwwww',
      'fgg.ggggg.ggwwww',
      'fg..........wwww',
      'fgWWWWggWWWWwwww',
      'fgWDWWggWDWWwwww',
      'fgg.ggggg.ggwwww',
      'fg..........wwww',
      'fgg.......ggwwww',
      'ffffffEEffffwwww'],
    doors: { '3,3': { t: 'inn' }, '9,3': { t: 'shop', s: 'p_item' }, '3,7': { t: 'shop', s: 'p_gear' }, '9,7': { t: 'shop', s: 'p_acc' } },
    npcs: [
      { x: 10, y: 9, spr: 'vilA', txt: ['ほくとうの やまの どうくつには りゅうが すみついている。おたからを まもってるって はなしだ。'] },
      { x: 6, y: 5, spr: 'merchant', txt: ['アクセサリーは ひとり 2つまで つけられる。「なつきのすず」は まものずきに にんきさ。'] },
      { x: 4, y: 9, spr: 'vilC', txt: ['どうくつの りゅうを たおすと「じゃのカギ」が てにはいるらしいわ。まおうじょうの とびらの カギよ。'] },
      { x: 8, y: 5, spr: 'child', txt: ['メタルぷにって しってる？ めっちゃ かたいけど たおすと けいけんち もりもりなんだって！'] },
      { x: 2, y: 9, spr: 'elder', txt: ['きたの ぬまちは つよい まものだらけじゃ。そうびを ととのえて いくのじゃぞ。'] },
      { x: 10, y: 4, spr: 'soldier', txt: ['たいれつの まえのほうが てきに ねらわれやすい。かたい なかまを まえに おくといい。'] },
      { x: 11, y: 9, spr: 'vilB', txt: ['とうほくの ダーマしんでんで しょくぎょうに つけるぞ。たたかいに かつほど 熟練(じゅくれん)が あがるんだ。'] },
    ] },
  C: {
    n: 'たびのキャンプ', inn: 60, entry: [6, 10], map: [
      'mmmmmmmmmmmmmmmm',
      'mggggggggggggggm',
      'mgWWWWggWWWWgggm',
      'mgWDWWggWDWWgggm',
      'mgg.ggggg.gggggm',
      'mgg........Fgggm',
      'mgWWWWggWWWWgggm',
      'mgWDWWggWDWWgggm',
      'mgg.ggggg.gggggm',
      'mgg........ggggm',
      'mggggg..gggggggm',
      'mmmmmmEEmmmmmmmm'],
    doors: { '3,3': { t: 'inn' }, '9,3': { t: 'shop', s: 'c_item' }, '3,7': { t: 'shop', s: 'c_weapon' }, '9,7': { t: 'shop', s: 'c_armor' } },
    npcs: [
      { x: 6, y: 5, spr: 'soldier', txt: ['ここから にしへ いくと まおうじょうだ。「じゃのカギ」は もったか？'] },
      { x: 10, y: 8, spr: 'mage', txt: ['まおうゾルデは HPが へると ほんきを だす。かいふくやくを たっぷり もっていけ。'] },
      { x: 12, y: 9, spr: 'merchant', txt: ['うちの ぶきやには「まおうがりのけん」が ある。たかいが それだけの かちは あるぞ。'] },
      { x: 4, y: 9, spr: 'vilA', txt: ['レベル12…いや そうびと しょくぎょう しだいでは もっと はやく ゾルデに いどめるかもな。'] },
    ] },
  J: {
    n: 'ダーマしんでん', inn: 0, entry: [7, 10], map: [
      'WWWWWWWWWWWWWWWW',
      'WggggggAAggggggW',
      'Wgggggg..ggggggW',
      'Wgg..........ggW',
      'Wgg..........ggW',
      'Wgg...gggg...ggW',
      'Wgg...gggg...ggW',
      'Wgg..........ggW',
      'Wgg..........ggW',
      'Wggg........gggW',
      'WggggggggggggggW',
      'WWWWWWWEEWWWWWWW'],
    doors: {},
    npcs: [
      { x: 6, y: 2, spr: 'robe', txt: ['ようこそ ダーマしんでんへ。おくの さいだんに たてば しょくぎょうに つくことが できます。'] },
      { x: 11, y: 6, spr: 'mage', txt: ['たたかいに かつたび 職の熟練が あがり、あたらしい とくいわざを おぼえていく。おぼえた わざは 転職しても わすれないぞ。'] },
      { x: 4, y: 7, spr: 'robe', txt: ['「せんし」と「ぶとうか」を きわめれば バトルマスターに、「まほうつかい」と「そうりょ」を きわめれば けんじゃに なれる。'] },
      { x: 12, y: 8, spr: 'vilB', txt: ['まものたちも 転職できるんだ。ぷにまるの せんし…つよそうだろ？', 'じょうきゅうしょくを マスターした にんげんは…「ゆうしゃ」に なれるという でんせつが ある。'] },
    ] },
};
/* 追加のうわさばなし */
TOWN_MAPS.P.npcs.push({ x: 7, y: 9, spr: 'vilA', txt: ['せんとうちゅうも 「いれかえ」で ばしゃの なかまと こうたいできるぞ。', 'まおうには…その うえが いるという うわさが ある。おそろしいことだ。'] });
TOWN_MAPS.C.npcs.push({ x: 8, y: 9, spr: 'elder', txt: ['そうびは まものによって つけられる ものが ちがう。ゴブリンや ガイコッツは ひとと おなじ そうびが できるぞい。'] });
TOWN_MAPS.P.npcs.push({ x: 11, y: 5, spr: 'vilC', casino: true, txt: ['カジノねえさん『いらっしゃい♪ スロット あそんでいく？』'] });
TOWN_MAPS.T.npcs.push({ x: 5, y: 8, spr: 'vilB', txt: ['よるは まものが きょうぼうに なって であいやすくなる。だが メタルぷにも よるのほうが みつかるらしいぞ。', 'やどに とまれば あさに なる。むりせず やすむんだぞ。'] });

/* ---------- BGM/SE (オリジナル曲) ---------- */
const BGM = {
  field: { step: 0.21, tracks: [
    { wave: 'square', vol: 0.030, seq: [[72, 2], [76, 2], [79, 2], [84, 2], [83, 2], [79, 2], [77, 2], [79, 2], [76, 2], [72, 2], [74, 2], [77, 2], [76, 2], [74, 2], [72, 4]] },
    { wave: 'triangle', vol: 0.055, seq: [[48, 4], [52, 4], [53, 4], [55, 4], [48, 4], [52, 4], [53, 2], [55, 2], [48, 4]] }] },
  town: { step: 0.24, tracks: [
    { wave: 'square', vol: 0.028, seq: [[76, 2], [74, 2], [72, 2], [74, 2], [76, 2], [76, 2], [76, 4], [74, 2], [74, 2], [74, 4], [76, 2], [79, 2], [79, 4], [76, 2], [74, 2], [72, 2], [74, 2], [76, 2], [76, 2], [76, 2], [74, 2], [74, 2], [76, 2], [74, 2], [72, 4]] },
    { wave: 'triangle', vol: 0.050, seq: [[48, 4], [55, 4], [52, 4], [55, 4], [48, 4], [55, 4], [53, 4], [55, 4], [48, 4], [55, 4], [52, 4], [55, 4], [53, 4], [55, 4], [48, 8]] }] },
  battle: { step: 0.15, tracks: [
    { wave: 'square', vol: 0.030, seq: [[69, 1], [0, 1], [69, 1], [72, 1], [74, 1], [72, 1], [69, 2], [67, 1], [0, 1], [67, 1], [71, 1], [72, 1], [71, 1], [67, 2], [69, 1], [72, 1], [76, 1], [72, 1], [77, 2], [76, 2], [74, 1], [71, 1], [67, 1], [71, 1], [69, 4]] },
    { wave: 'sawtooth', vol: 0.028, seq: [[45, 1], [45, 1], [57, 1], [45, 1], [45, 1], [57, 1], [45, 1], [57, 1], [43, 1], [43, 1], [55, 1], [43, 1], [43, 1], [55, 1], [43, 1], [55, 1], [45, 1], [45, 1], [57, 1], [45, 1], [41, 1], [41, 1], [53, 1], [41, 1], [43, 1], [43, 1], [55, 1], [43, 1], [45, 2], [0, 2]] }] },
  boss: { step: 0.19, tracks: [
    { wave: 'square', vol: 0.032, seq: [[57, 3], [58, 1], [57, 3], [55, 1], [57, 3], [60, 1], [58, 2], [55, 2], [57, 2], [60, 2], [63, 2], [62, 2], [58, 2], [55, 2], [57, 4]] },
    { wave: 'sawtooth', vol: 0.030, seq: [[33, 2], [33, 2], [34, 2], [33, 2], [33, 2], [34, 2], [31, 2], [33, 2], [33, 2], [33, 2], [39, 2], [38, 2], [34, 2], [31, 2], [33, 4]] }] },
};
const JINGLE = {
  victory: [[76, 1], [76, 1], [76, 1], [79, 2], [83, 2], [84, 4]],
  levelup: [[67, 1], [72, 1], [76, 1], [79, 1], [84, 3]],
  recruit: [[72, 1], [76, 1], [79, 1], [84, 3]],
  job: [[72, 1], [74, 1], [76, 1], [79, 1], [83, 1], [84, 4]],
  inn: [[72, 2], [74, 2], [76, 2], [79, 4]],
  gameover: [[57, 3], [55, 3], [53, 3], [52, 6]],
};
