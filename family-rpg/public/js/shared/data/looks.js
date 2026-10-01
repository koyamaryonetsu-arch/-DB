// みため（かみがた・かみの色・はだの色・目もと）の データ
//
// むかしの セーブの look: { body, hair, hairColor, skin, color }（hair 0〜3・hairColor 0〜7・skin 0〜2）
// あたらしい 項目（なくても よい）: style（かみがた）・hcol（かみの色）・tone（はだの色）・face（目もと）
//   … どれも ID の もじれつ。ない ときは むかしの 番号から きめる（同じ みための まま）
// むかしの 項目も いつも のこして、いちばん 近い みために しておく（古い 版の ゲームでも こわれないように）

// かみがた（ならびは えらぶ ときの じゅん。legacy: むかしの 番号で いちばん 近い もの）
export const HAIR_STYLES = [
  { id: 'short', name: 'ショート', legacy: 0 },
  { id: 'spiky', name: 'ツンツン', legacy: 2 },
  { id: 'long', name: 'ロング', legacy: 1 },
  { id: 'pony', name: 'ポニーテール', legacy: 3 },
  { id: 'twin', name: 'ツインテール', legacy: 1 },
  { id: 'bob', name: 'ボブ', legacy: 0 },
  { id: 'bun', name: 'おだんご', legacy: 3 },
  { id: 'braid', name: '三つ編み', legacy: 3 },
  { id: 'wavy', name: 'ふんわりウェーブ', legacy: 1 },
  { id: 'hime', name: '姫カット', legacy: 1 },
  { id: 'side', name: '長い前がみ', legacy: 0 },
  { id: 'wild', name: 'ライオンヘア', legacy: 2 },
  { id: 'mohawk', name: 'モヒカン', legacy: 2 },
  { id: 'slick', name: 'オールバック', legacy: 0 },
  { id: 'topknot', name: 'ちょんまげ', legacy: 0 },
  { id: 'afro', name: 'アフロ', legacy: 0 },
  { id: 'buzz', name: 'ぼうず', legacy: 0 },
  { id: 'bald', name: 'つるつる', legacy: 0 },
];
export const LEGACY_STYLES = ['short', 'long', 'spiky', 'pony'];

// かみの色（さいしょの 8つは むかしの 番号の じゅん）
export const HAIR_COLORS = [
  { id: 'black', name: '黒', hex: '#2d2330', legacy: 0 },
  { id: 'brown', name: '茶色', hex: '#6b4226', legacy: 1 },
  { id: 'blonde', name: '金色', hex: '#e9c25e', legacy: 2 },
  { id: 'red', name: '赤', hex: '#c8452f', legacy: 3 },
  { id: 'blue', name: '青', hex: '#3c64c8', legacy: 4 },
  { id: 'silver', name: '銀色', hex: '#dcdcec', legacy: 5 },
  { id: 'pink', name: 'ピンク', hex: '#f08cc0', legacy: 6 },
  { id: 'green', name: '緑', hex: '#3fa066', legacy: 7 },
  { id: 'darkbrown', name: 'こげ茶色', hex: '#45291d', legacy: 1 },
  { id: 'tea', name: 'うす茶色', hex: '#b07a46', legacy: 1 },
  { id: 'honey', name: 'はちみつ色', hex: '#d6962c', legacy: 2 },
  { id: 'orange', name: 'オレンジ', hex: '#ea7c32', legacy: 3 },
  { id: 'auburn', name: '赤茶色', hex: '#8e3a26', legacy: 1 },
  { id: 'wine', name: 'えんじ色', hex: '#9c2442', legacy: 3 },
  { id: 'lavender', name: 'ラベンダー', hex: '#b39ae4', legacy: 6 },
  { id: 'purple', name: 'むらさき', hex: '#7646b4', legacy: 4 },
  { id: 'navy', name: 'こん色', hex: '#2d3a7c', legacy: 4 },
  { id: 'aqua', name: '水色', hex: '#45b6c8', legacy: 4 },
  { id: 'mint', name: 'ミント', hex: '#7fd2ae', legacy: 7 },
  { id: 'gray', name: '灰色', hex: '#86849a', legacy: 5 },
  { id: 'white', name: '白', hex: '#f4f2f8', legacy: 5 },
];
export const LEGACY_HAIR_COLORS = HAIR_COLORS.slice(0, 8).map((c) => c.id);

// はだの色（むかしの 3つは light・tan・brown）
export const SKIN_TONES = [
  { id: 'fair', name: '色白', hex: '#fbdcc6', legacy: 0 },
  { id: 'light', name: 'ふつう', hex: '#f7d4ae', legacy: 0 },
  { id: 'tan', name: '日焼け', hex: '#e0ae80', legacy: 1 },
  { id: 'brown', name: '小麦色', hex: '#b27a50', legacy: 2 },
  { id: 'deep', name: 'ココア色', hex: '#7e4a32', legacy: 2 },
];
export const LEGACY_TONES = ['light', 'tan', 'brown'];

// 目もと（かおの ひょうじょう）
export const FACES = [
  { id: 'std', name: 'ふつう' },
  { id: 'round', name: 'まんまる' },
  { id: 'sharp', name: 'きりっと' },
  { id: 'smile', name: 'にこにこ' },
  { id: 'calm', name: 'おっとり' },
  { id: 'brave', name: 'げんき' },
];

// 服の色（むかしと おなじ 8つ）
export const CLOTH_COLORS = ['#d9534f', '#3f7fd0', '#3fa35a', '#8a5ac8', '#e68a2e', '#2aa0a0', '#e46fa8', '#ececf2'];

// 美容室の 代金（1回。何も 変えない ときは いらない）
export const SALON_FEE = 30;

const byId = (list) => new Map(list.map((x, i) => [x.id, { ...x, index: i }]));
export const STYLE_BY_ID = byId(HAIR_STYLES);
export const HCOL_BY_ID = byId(HAIR_COLORS);
export const TONE_BY_ID = byId(SKIN_TONES);
export const FACE_BY_ID = byId(FACES);

const clampInt = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const known = (map, id) => typeof id === 'string' && map.has(id);

// look → いま つかう ID（むかしの セーブも 同じ みために なる）
export function lookIds(look) {
  const l = look && typeof look === 'object' ? look : {};
  return {
    body: l.body === 1 ? 1 : 0,
    style: known(STYLE_BY_ID, l.style) ? l.style : LEGACY_STYLES[clampInt(l.hair, 3)],
    hcol: known(HCOL_BY_ID, l.hcol) ? l.hcol : LEGACY_HAIR_COLORS[clampInt(l.hairColor, 7)],
    tone: known(TONE_BY_ID, l.tone) ? l.tone : LEGACY_TONES[clampInt(l.skin, 2)],
    face: known(FACE_BY_ID, l.face) ? l.face : 'std',
    color: clampInt(l.color, CLOTH_COLORS.length - 1),
  };
}

// セーブ・通信の look を ととのえる（知らない 値は つかわない。むかしの 項目は いつも のこす）
export function cleanLook(look = {}) {
  const l = look && typeof look === 'object' ? look : {};
  const out = {
    body: clampInt(l.body, 1),
    hair: clampInt(l.hair, 3),
    hairColor: clampInt(l.hairColor, 7),
    skin: clampInt(l.skin, 2),
    color: clampInt(l.color, CLOTH_COLORS.length - 1),
  };
  if (known(STYLE_BY_ID, l.style)) { out.style = l.style; out.hair = STYLE_BY_ID.get(l.style).legacy; }
  if (known(HCOL_BY_ID, l.hcol)) { out.hcol = l.hcol; out.hairColor = HCOL_BY_ID.get(l.hcol).legacy; }
  if (known(TONE_BY_ID, l.tone)) { out.tone = l.tone; out.skin = TONE_BY_ID.get(l.tone).legacy; }
  if (known(FACE_BY_ID, l.face)) out.face = l.face;
  return out;
}

// 美容室: いまの look に かえたい ところ（style・hcol・tone・face）を かさねる
// もどりち: { ok, look, changed, reason }
export function salonLook(cur, req = {}) {
  const base = cleanLook(cur);
  const now = lookIds(base);
  const want = { ...now };
  for (const [k, map] of [['style', STYLE_BY_ID], ['hcol', HCOL_BY_ID], ['tone', TONE_BY_ID], ['face', FACE_BY_ID]]) {
    if (req[k] === undefined || req[k] === null) continue;
    if (!known(map, req[k])) return { ok: false, reason: 'その見た目は選べません' };
    want[k] = req[k];
  }
  const changed = ['style', 'hcol', 'tone', 'face'].some((k) => want[k] !== now[k]);
  const look = cleanLook({ ...base, style: want.style, hcol: want.hcol, tone: want.tone, face: want.face });
  return { ok: true, look, changed };
}
