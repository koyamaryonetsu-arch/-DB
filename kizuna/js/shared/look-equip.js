// 見た目装備（ドラクエ10の おしゃれ装備ふう）
//   ほんとうの 装備（char.equip）は そのまま で、見た目だけ べつの 物に できる。強さは かわらない
//   （computeStats は char.equip だけを 見る）
//
// char.lookEquip = { weapon?, armor?, shield?, head? }（ない 部位・ない ときは「今の装備と同じ」）
//   'none' … 装備なし に 見える（武器を もたない・かぶとを かぶらない・よろいは ふだんの 服）
//   品物の ID … その 品物に 見える。きたえた 物（鉄の剣+2 など）は もとの 品物の ID で おぼえる
//
// えらべる 物: 持っている 物だけ。ふくろの 中の 物と、自分・自分の 仲間（パーティー・馬車・酒場）が
//   装備している 物（メニューの 装備の まどと おなじ 考え。ふくろは みんなで 1つ）。
//   職業の きまりは 関係ない（戦士が つえを もっている ように 見せられる）
// えらんだ 物を あとで 売った・捨てた ときも、見た目は そのまま おぼえておく（ドラクエ10と おなじ）。
//   知らない 品物に なった ときや 部位が ちがう ときは「今の装備と同じ」に もどして 見せる
// モンスターの 仲間は 絵に 装備が 出ないので、見た目装備は ない
import { ITEMS, baseItemId } from './data/items.js?v=b2a0d9b4a2ff';

export const LOOK_SLOTS = ['weapon', 'armor', 'shield', 'head'];
export const LOOK_NONE = 'none';

// その 部位の 見た目として 使える 品物か
function lookItemOk(slot, id) {
  return typeof id === 'string' && id !== LOOK_NONE && Object.prototype.hasOwnProperty.call(ITEMS, id) && ITEMS[id]?.type === slot;
}

// 見せる 装備（{ weapon, armor, shield, head, acc }）。見た目装備が ない ときは equip を そのまま かえす
// （equip が ない 人は 今までどおり 職業の はじめの 装備の 絵に なる。client/render/chars.js の parseEquip）
export function shownEquip(c) {
  const lk = c?.lookEquip;
  if (!lk || typeof lk !== 'object' || c?.species) return c?.equip;
  const out = { ...(c.equip || {}) };
  for (const sl of LOOK_SLOTS) {
    const v = lk[sl];
    if (v === LOOK_NONE) out[sl] = null;
    else if (lookItemOk(sl, v)) out[sl] = v;
  }
  return out;
}

// 見せる 装備を 1つの もじれつに（'ぶき,よろい,たて,あたま'。いちの じょうほう・戦いの 顔で つかう）
export function shownEquipKey(c) {
  const e = shownEquip(c);
  if (!e) return '';
  return [e.weapon || '', e.armor || '', e.shield || '', e.head || ''].join(',');
}

// 持っている その 部位の 物（もとの 品物の ID。かさならない。ふくろの じゅん → 装備している 人の じゅん）
//   bag … ふくろ（{ items: [{ id, n }] }）、team … 装備を 見る 人たち（キャラの ならび）
export function lookChoices(slot, bag, team = []) {
  const out = [];
  const put = (id) => {
    const b = baseItemId(id);
    if (lookItemOk(slot, b) && !out.includes(b)) out.push(b);
  };
  for (const e of bag?.items || []) if (e?.n > 0) put(e.id);
  for (const ch of team) put(ch?.equip?.[slot]);
  return out;
}

// サーバーで 使う: 自分の 持ち物を 見る 人たち（自分と 自分の 仲間 みんな）
export function ownerTeam(owner) {
  return [owner, ...(owner?.companions || []).map((e) => e?.char).filter(Boolean)];
}

// 見た目を かえる（サーバー。who … かえる 人、owner … ふくろの 持ち主）
//   id: null か 'same' … 今の装備と同じ／'none' … 装備なし／品物の ID … その 品物の 見た目
//   slot: 'all' と id: null で ぜんぶ もとに もどす
// かえす もの: { ok, text }（ok が false の ときは 何も かえない）
export function setLookEquip(who, owner, slot, id) {
  if (!who || who.species) return { ok: false, text: 'モンスターは見た目装備を変えられない' };
  if (slot === 'all') {
    if (id !== null && id !== undefined && id !== 'same') return { ok: false, text: '' };
    delete who.lookEquip;
    return { ok: true, text: `${who.name}の見た目を、今の装備と同じにもどした。` };
  }
  if (!LOOK_SLOTS.includes(slot)) return { ok: false, text: '' };
  const lk = who.lookEquip && typeof who.lookEquip === 'object' ? { ...who.lookEquip } : {};
  if (id === null || id === undefined || id === 'same') delete lk[slot];
  else if (id === LOOK_NONE) lk[slot] = LOOK_NONE;
  else {
    if (typeof id !== 'string' || !ITEMS[id]) return { ok: false, text: '' };
    const b = baseItemId(id);
    if (!lookItemOk(slot, b)) return { ok: false, text: 'その部位の装備ではない' };
    if (!lookChoices(slot, owner, ownerTeam(owner)).includes(b)) return { ok: false, text: '持っていない物は選べない' };
    lk[slot] = b;
  }
  if (Object.keys(lk).length) who.lookEquip = lk;
  else delete who.lookEquip;
  return { ok: true, text: `${who.name}の見た目を変えた！` };
}

// セーブを 読む ときの 手直し（save.js の repairChar）。形が ちがう ものは すてる。
// 知らない 品物の ID（新しい 版で えらんだ 物）は けさずに のこす（その 版では「今の装備と同じ」に 見える）
export function cleanLookEquip(c) {
  if (!c || typeof c !== 'object') return;
  if (c.lookEquip === undefined) return;
  const lk = c.lookEquip;
  const out = {};
  if (lk && typeof lk === 'object' && !Array.isArray(lk) && !c.species) {
    for (const sl of LOOK_SLOTS) {
      const v = lk[sl];
      if (typeof v === 'string' && v && v.length <= 60) out[sl] = v;
    }
  }
  if (Object.keys(out).length) c.lookEquip = out;
  else delete c.lookEquip;
}
