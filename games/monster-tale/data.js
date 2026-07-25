'use strict';
/* ================================================================
   まものがたり 〜よみがえりし魔王〜  データ定義
   (ドット絵・マップ・種族・とくぎ・アイテム・BGM)
   ================================================================ */

const OUTLINE = '#1a1626';

/* ---------- ドット絵スプライト ----------
   px: 行文字列の配列。'.'は透明。mirror:true なら左半分だけ定義し左右対称に展開 */
const SPR = {
  puni: { mirror: true, pal: { k: OUTLINE, a: '#3b76e8', b: '#8ab6ff', w: '#ffffff', m: '#123064' }, px: [
    '........', '........', '........', '.....kkk',
    '...kkabb', '..kabbba', '.kabbbaa', '.kaawkaa',
    'kaaaaaaa', 'kaaaaamm', 'kaaaaaaa', 'kaaaaaaa',
    '.kaaaaaa', '..kkaaaa', '....kkkk', '........'] },
  metal: { mirror: true, pal: { k: OUTLINE, a: '#b9c2d4', b: '#eef4ff', w: '#ffffff', m: '#4a5a76' }, px: [
    '........', '........', '........', '.....kkk',
    '...kkabb', '..kabbba', '.kabbbaa', '.kaawkaa',
    'kaaaaaaa', 'kaaaaamm', 'kaaaaaaa', 'kaaaaaaa',
    '.kaaaaaa', '..kkaaaa', '....kkkk', '........'] },
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
  guard: { mirror: true, pal: { k: OUTLINE, R: '#7a8494', c: '#59616e', o: '#40d8f0' }, px: [
    '........', '....kkkk', '...kRRRR', '...kRoRR',
    '...kRRRR', '.kkkRRRR', 'kRRkRRRR', 'kRRkRRRR',
    'kRRkRcRR', 'kRRkRRRR', 'kRRkRRRR', 'kkkkRcRR',
    '...kRRRR', '..kRRRRR', '..kkkkkk', '........'] },
  drak: { mirror: true, pal: { k: OUTLINE, g: '#4fae5e', c: '#f0e0b0', e: '#f04830', h: '#f0e8d0', d: '#2e7a3e' }, px: [
    '........', '..h.....', '..kkkkkk', '.kgggggg',
    '.kggeggg', 'kggggggg', 'kggggggk', 'kggggggg',
    '.kgggggg', 'dkgccccc', 'ddkgcccc', '.dkgcccc',
    '..kgcccc', '..kgcccc', '...kkkkk', '........'] },
  dlord: { mirror: true, pal: { k: OUTLINE, g: '#c04838', c: '#f0d0a0', e: '#f0e030', h: '#f0e8d0', d: '#7a2820' }, px: [
    '........', '..h.....', '..kkkkkk', '.kgggggg',
    '.kggeggg', 'kggggggg', 'kggggggk', 'kggggggg',
    '.kgggggg', 'dkgccccc', 'ddkgcccc', '.dkgcccc',
    '..kgcccc', '..kgcccc', '...kkkkk', '........'] },
  maou: { mirror: true, pal: { k: OUTLINE, h: '#e8d9a0', P: '#cfa9e8', e: '#ff4b4b', w: '#ffffff', B: '#3a2350', G: '#40e0d0' }, px: [
    '.hh.........', '.khh........', '..khh.......', '..khhh......',
    '...khh.kkkkk', '...khhkPPPPP', '....kkPPPPPP', '....kPPPPPPP',
    '....kPeePPPP', '....kPPPPPPP', '....kPkkkkkk', '....kPPkwkwk',
    '...kkBBkkkkk', '..kBBBBBBBBB', '.kBBkBBBBBBB', '.kBBkBBBBBBB',
    'kBBkBBBBBBGG', 'kBBkBBBBBBBB', 'kBkkBBBBBBBB', 'khkBBBBBBBBB',
    '.kkkBBBBBBBB', '....kBBBBBBB', '.....kkkkkkk', '............'] },
  /* --- 主人公 (フルサイズ16px。歩行は左右反転+上下バウンドで表現) --- */
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
};

/* ---------- ワールドマップ生成 (48x40) ----------
   g草 f森 m山 w水 s砂 p沼 r道 b橋 B番人橋 T村 P港町 C野営地 D洞窟 X魔王城 */
const MW = 48, MH = 40;
const WORLD = (() => {
  const M = Array.from({ length: MH }, () => Array(MW).fill('g'));
  const fill = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) M[y][x] = c; };
  // 外周の海
  fill(0, 0, MW - 1, 2, 'w'); fill(0, MH - 2, MW - 1, MH - 1, 'w');
  fill(0, 0, 1, MH - 1, 'w'); fill(MW - 2, 0, MW - 1, MH - 1, 'w');
  // 中央の大河
  fill(22, 3, 23, MH - 3, 'w');
  // 北西: 沼地(魔王領) / 山脈の壁 / 森 / 南西: 草原
  fill(2, 3, 21, 8, 'p');
  fill(2, 9, 21, 11, 'm');
  fill(2, 12, 21, 17, 'f');
  // 北東: 回廊の沼と山脈・洞窟
  fill(24, 3, 31, 7, 'p');
  fill(32, 3, 45, 9, 'm');
  M[6][40] = 'D'; M[7][40] = 's'; M[8][40] = 's'; M[9][40] = 's'; M[10][40] = 's';
  // 南東: 砂漠
  fill(30, 26, 45, 36, 's');
  // 東の飾りの森・山
  fill(27, 13, 29, 15, 'f'); fill(36, 18, 38, 20, 'f'); M[24][42] = 'm'; M[14][34] = 'm';
  fill(5, 22, 6, 23, 'f'); M[15][5] = 'm'; M[28][17] = 'm'; M[33][14] = 'f'; M[34][14] = 'f';
  // 街道と橋
  fill(18, 19, 21, 19, 'r'); fill(24, 19, 27, 19, 'r');
  M[19][22] = 'B'; M[19][23] = 'b';
  M[4][22] = 'b'; M[4][23] = 'b';
  fill(8, 26, 8, 29, 'r'); fill(8, 31, 8, 33, 'r'); fill(9, 26, 20, 26, 'r'); M[26][20] = 'r';
  fill(20, 20, 20, 25, 'r'); fill(28, 19, 30, 19, 'r'); fill(30, 20, 30, 21, 'r');
  // 拠点
  M[30][8] = 'T'; M[22][30] = 'P'; M[4][17] = 'C'; M[4][6] = 'X';
  return M.map(r => r.join(''));
})();

/* エンカウントゾーン (先頭一致) */
const ZONES = [
  { r: [2, 3, 21, 8], t: 't4' },
  { r: [24, 3, 31, 7], t: 't4' },
  { r: [32, 3, 45, 10], t: 't3b' },
  { r: [2, 12, 21, 18], t: 't2' },
  { r: [2, 19, 21, 37], t: 't1' },
  { r: [24, 26, 45, 37], t: 't3b' },
  { r: [24, 8, 45, 25], t: 't3a' },
];
/* エンカウントテーブル: [種族, 最低Lv, 最高Lv, 重み] */
const ENC = {
  t1: [['puni', 1, 2, 38], ['bat', 1, 2, 30], ['rat', 2, 3, 22], ['kino', 2, 2, 10]],
  t2: [['kino', 3, 4, 28], ['bee', 3, 4, 28], ['wolf', 4, 5, 24], ['bat', 3, 4, 20]],
  t3a: [['gobl', 6, 7, 28], ['liza', 6, 7, 24], ['bee', 6, 6, 14], ['wolf', 6, 7, 14], ['cact', 6, 6, 14], ['metal', 5, 5, 6]],
  t3b: [['cact', 7, 8, 32], ['liza', 7, 8, 26], ['gobl', 7, 8, 20], ['wisp', 7, 7, 14], ['metal', 6, 6, 8]],
  t4: [['skel', 9, 10, 28], ['wisp', 9, 10, 24], ['golem', 10, 11, 20], ['drak', 10, 11, 18], ['metal', 8, 8, 10]],
};
const ZONE_BG = { t1: 'plain', t2: 'forest', t3a: 'plain', t3b: 'desert', t4: 'swamp' };

/* ---------- とくぎ・じゅもん ---------- */
const SKILLS = {
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
  darkball: { n: 'ダークボール', mp: 0, kind: 'mag', pow: [42, 58], tgt: 'one' },
  darkstorm: { n: 'ダークストーム', mp: 0, kind: 'breath', pow: [30, 42], tgt: 'all' },
  spark: { n: 'スパーク', mp: 4, kind: 'mag', pow: [9, 15], tgt: 'all' },
  gigaspark: { n: 'ギガスパーク', mp: 9, kind: 'mag', pow: [30, 42], tgt: 'all' },
  heal: { n: 'ヒール', mp: 3, kind: 'heal', pow: [28, 36], tgt: 'ally' },
  hiheal: { n: 'ハイヒール', mp: 6, kind: 'heal', pow: [75, 95], tgt: 'ally' },
  rezarek: { n: 'リザレク', mp: 10, kind: 'revive', pow: 0.5, tgt: 'ally' },
  flee: { n: 'にげあし', mp: 0, kind: 'flee' },
};
const HERO_SPELLS = [[2, 'heal'], [4, 'spark'], [6, 'blaze'], [8, 'hiheal'], [10, 'gigaspark'], [12, 'rezarek']];

/* ---------- 種族 ----------
   base/grow: [HP,MP,こうげき,ぼうぎょ,すばやさ] */
const SPECIES = {
  hero: { n: 'ゆうしゃ', spr: 'heroD', base: [26, 8, 9, 6, 7], grow: [7, 4, 2.4, 2, 1.6], skills: [], rec: 0, exp: 0, gold: 0 },
  puni: { n: 'ぷにまる', spr: 'puni', base: [11, 6, 6, 5, 5], grow: [5, 1.5, 1.8, 1.7, 1.4], skills: [[1, 'taiatari'], [6, 'heal']], rec: 0.45, exp: 4, gold: 5, ai: [['atk', 75], ['taiatari', 25]] },
  bat: { n: 'バサバサ', spr: 'bat', base: [9, 6, 6, 4, 9], grow: [4.5, 1.5, 1.7, 1.3, 2], skills: [[1, 'kyuketsu']], rec: 0.38, exp: 4, gold: 4, ai: [['atk', 70], ['kyuketsu', 30]] },
  rat: { n: 'とげネズミ', spr: 'rat', base: [12, 4, 8, 5, 7], grow: [5, 1, 2, 1.5, 1.6], skills: [[1, 'togetoge']], rec: 0.35, exp: 6, gold: 7, ai: [['atk', 70], ['togetoge', 30]] },
  kino: { n: 'キノッコ', spr: 'kino', base: [14, 8, 7, 6, 5], grow: [5.5, 1.6, 1.8, 1.7, 1.2], skills: [[1, 'nemuri']], rec: 0.32, exp: 9, gold: 8, ai: [['atk', 65], ['nemuri', 35]] },
  bee: { n: 'ハチどん', spr: 'bee', base: [13, 6, 9, 5, 10], grow: [5, 1.2, 2.1, 1.4, 2], skills: [[1, 'dokubari']], rec: 0.30, exp: 10, gold: 9, ai: [['atk', 60], ['dokubari', 40]] },
  wolf: { n: 'もりオオカミ', spr: 'wolf', base: [18, 4, 11, 7, 9], grow: [6, 1, 2.4, 1.6, 1.8], skills: [[1, 'kamitsuku']], rec: 0.26, exp: 13, gold: 11, ai: [['atk', 60], ['kamitsuku', 40]] },
  cact: { n: 'サボチン', spr: 'cact', base: [16, 8, 10, 9, 6], grow: [5.5, 1.2, 2.2, 2, 1.2], skills: [[1, 'misairu']], rec: 0.25, exp: 16, gold: 14, ai: [['atk', 60], ['misairu', 40]] },
  liza: { n: 'スナトカゲ', spr: 'liza', base: [17, 8, 11, 8, 8], grow: [6, 1.4, 2.3, 1.7, 1.6], skills: [[1, 'hinoiki']], rec: 0.22, exp: 18, gold: 15, ai: [['atk', 60], ['hinoiki', 40]] },
  gobl: { n: 'ゴブリン', spr: 'gobl', base: [20, 4, 13, 8, 8], grow: [6.5, 1, 2.5, 1.8, 1.6], skills: [[1, 'bunmawashi']], rec: 0.22, exp: 20, gold: 18, ai: [['atk', 70], ['bunmawashi', 30]] },
  wisp: { n: 'ゆらび', spr: 'wisp', base: [14, 14, 8, 7, 9], grow: [5, 2.6, 1.9, 1.6, 1.8], skills: [[1, 'blaze'], [10, 'nemuri']], rec: 0.20, exp: 24, gold: 20, ai: [['atk', 40], ['blaze', 45], ['nemuri', 15]] },
  skel: { n: 'ガイコッツ', spr: 'skel', base: [24, 6, 15, 10, 9], grow: [7, 1, 2.7, 1.9, 1.7], skills: [[1, 'nidogiri']], rec: 0.18, exp: 30, gold: 24, ai: [['atk', 60], ['nidogiri', 40]] },
  golem: { n: 'マッドゴーレム', spr: 'golem', base: [30, 6, 16, 14, 4], grow: [8, 1, 2.8, 2.4, 1], skills: [[1, 'iwanage']], rec: 0.15, exp: 36, gold: 28, ai: [['atk', 60], ['iwanage', 40]] },
  drak: { n: 'ドラゴキッズ', spr: 'drak', base: [26, 10, 15, 11, 10], grow: [7, 1.8, 2.6, 1.9, 1.9], skills: [[1, 'hinoiki'], [13, 'goukaen']], rec: 0.12, exp: 45, gold: 40, ai: [['atk', 50], ['hinoiki', 50]] },
  metal: { n: 'メタルぷに', spr: 'metal', base: [6, 0, 7, 40, 20], grow: [2, 0, 1, 3, 2], skills: [[1, 'taiatari']], rec: 0.06, exp: 180, gold: 30, metal: true, ai: [['atk', 50], ['flee', 50]] },
  guard: { n: 'ガーディアン', spr: 'guard', boss: true, base: [175, 0, 18, 13, 7], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 120, gold: 150, ai: [['atk', 65], ['iwanage', 35]] },
  dlord: { n: 'ドラゴロード', spr: 'dlord', boss: true, base: [290, 0, 24, 15, 11], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 350, gold: 400, ai: [['atk', 45], ['kamitsuku', 20], ['goukaen', 35]] },
  maou: { n: 'まおうゾルデ', spr: 'maou', boss: true, big: true, base: [560, 0, 30, 18, 14], grow: [0, 0, 0, 0, 0], skills: [], rec: 0, exp: 0, gold: 0, ai: [['atk', 40], ['darkball', 30], ['goukaen', 30]], ai2: [['atk', 30], ['darkball', 25], ['darkstorm', 45]] },
};

/* 必要経験値: EXPT[l] = レベルlに なるための累計 */
const EXPT = (() => { const a = [0, 0]; for (let l = 2; l <= 30; l++) a[l] = a[l - 1] + 6 * (l - 1) * (l - 1); return a; })();
const MAXLV = 30;

/* ---------- アイテム・そうび ---------- */
const ITEMS = {
  yakusou: { n: 'やくそう', price: 8, heal: [30, 40], info: 'HPを 30ほど かいふく' },
  iiyakusou: { n: 'いいやくそう', price: 36, heal: [85, 105], info: 'HPを 90ほど かいふく' },
  mahonomizu: { n: 'まほうのみず', price: 60, mp: 25, info: 'MPを 25 かいふく' },
  oyatsu: { n: 'まもののおやつ', price: 40, treat: true, info: 'せんとうちゅうに つかうと なかまに なりやすくなる' },
  hane: { n: 'ふっかつのハネ', price: 280, revive: 0.5, info: 'たおれた なかまを ふっかつさせる' },
};
const GEAR = {
  w0: { n: 'ひのきのぼう', atk: 2, price: 30 },
  w1: { n: 'どうのつるぎ', atk: 7, price: 120 },
  w2: { n: 'はがねのつるぎ', atk: 15, price: 560 },
  w3: { n: 'ほのおのつるぎ', atk: 26, price: 1500 },
  w4: { n: 'りゅうのつるぎ', atk: 34, price: 2600 },
  a0: { n: 'ぬののふく', def: 2, price: 20 },
  a1: { n: 'かわのよろい', def: 6, price: 100 },
  a2: { n: 'くさりかたびら', def: 12, price: 470 },
  a3: { n: 'はがねのよろい', def: 20, price: 1400 },
};

/* ---------- 拠点 ---------- */
const TOWNS = {
  T: { n: 'ハジマリのむら', inn: 10, shop: ['yakusou', 'oyatsu', 'w1', 'a1'], pos: [8, 30], talks: [
    'むらびと『みなみや にしの そうげんには よわい まものが でるよ。まずは そこで しゅぎょうだ！』',
    'むらびと『まものは たたかいのあと なかまに なりたがる ことが あるんだ。まもののおやつを つかうと なかまに なりやすいぞ！』',
    'むらびと『きたの もりを ぬけ ひがしの はしを わたると みなとまちが ある。だが はしには ばんにんが いるらしい…』',
    'むらびと『HPや MPは やどやで かいふくできる。こまめに やすむんじゃぞ。』'] },
  P: { n: 'ミナトのまち', inn: 25, shop: ['yakusou', 'iiyakusou', 'mahonomizu', 'oyatsu', 'hane', 'w2', 'a2'], pos: [30, 22], talks: [
    'せんいん『ほくとうの やまには ほのおのどうくつが ある。りゅうが おたからを まもっているそうだ。』',
    'ふなのり『どうくつの りゅうを たおすと じゃのカギが てにはいるとか。まおうじょうの とびらを あけるカギだ。』',
    'しょうにん『メタルぷにを しってるか？ めちゃくちゃ かたいが たおせば ものすごい けいけんちに なるぞ！』',
    'むすめ『きたの ぬまちは つよい まものだらけ。じゅんびを してから いくのよ。』'] },
  C: { n: 'たびのキャンプ', inn: 60, shop: ['iiyakusou', 'mahonomizu', 'oyatsu', 'hane', 'w4', 'a3'], pos: [17, 4], talks: [
    'せんし『ここから にしへ いくと まおうじょうだ。じゃのカギは もったか？』',
    'まほうつかい『まおうゾルデは HPが へると ほんきを だす。かいふくやくは たっぷり もっていけ。』',
    'せんし『レベル12くらいは ないと ゾルデには かなわないだろうな…』'] },
};

/* ---------- BGM/SE (オリジナル曲・簡易チップチューン) ----------
   seq: [MIDIノート(0=休符), 長さ] */
const BGM = {
  field: { step: 0.21, tracks: [
    { wave: 'square', vol: 0.030, seq: [[72, 2], [76, 2], [79, 2], [84, 2], [83, 2], [79, 2], [77, 2], [79, 2], [76, 2], [72, 2], [74, 2], [77, 2], [76, 2], [74, 2], [72, 4]] },
    { wave: 'triangle', vol: 0.055, seq: [[48, 4], [52, 4], [53, 4], [55, 4], [48, 4], [52, 4], [53, 2], [55, 2], [48, 4]] }] },
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
  inn: [[72, 2], [74, 2], [76, 2], [79, 4]],
  gameover: [[57, 3], [55, 3], [53, 3], [52, 6]],
};
