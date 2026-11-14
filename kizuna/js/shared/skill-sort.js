// 第69回: 技の ならび（家族の ことば「技の並びを、ダメージ、回復倍率が低いの昇順にして。職業補正は無しで、標準の技の強さベースで」）
//   ・職業の ほせい（転職の ペナルティ・職業レベル・上の 職業の 強さ）も、その 人の 強さも 入れない。
//     みんな おなじ「ふつうの キャラ」（STD）が 使った ときの、だいたいの ダメージ・回復の 量で くらべる。
//     （物理の 倍率の 技と、数で きまる 呪文・回復が くらべられる。ふりはばは まんなか、何回も あたる 技は 回数を かける、
//      いくつも 効果の ある 技は たす。ダメージも 回復も おなじ ものさし）
//   ・弱い 技から じゅんに（ダメージ・回復の ある 技 → その あとに 強くする・弱くする・そのほかの 技を MPの 少ない じゅん）
//   ・おなじ ときは MPの 少ない ほう → 覚えた じゅん
// しきは shared/battle.js の calcPhys・calcMagic・healAmountOf と おなじ（会心・耐性・守りの バフは 入れない）
// テスト: test/skill-menu-r69.test.js
import { ABILITIES } from './data/abilities.js?v=37bf0e270855';
import { REGEN_BASE } from './buff-acts.js?v=37bf0e270855';
// 第72回: 元気玉（みんなの HPを 10%ずつ 集める。battle-genki.js）
import { genkiTotal } from './battle-genki.js?v=37bf0e270855';

// ふつうの キャラ（どの 技も この 強さで くらべる）
//   atk: 攻撃力・foeDfn: 相手の 守備力・mag: 魔力・heal: 回復魔力・maxHp: 生き返る 人の 最大HP・mp: のこりの MP（マダンテ）・lv: レベル（銭投げ）
//   party・partyHp: 元気玉の みんなの 人数と 1人の HP（ほかの 技の ふつうに 合わせた 数。HP満タンの 4人で、
//     伝説の 職業の 強い 全体攻撃〈ギガデイン・極 290〉の 約1.3倍。tools/sim-genki.mjs の Lv60〜80 の くらべと だいたい おなじ）
export const STD = { atk: 120, foeDfn: 60, mag: 80, heal: 80, maxHp: 200, mp: 100, lv: 30, party: 4, partyHp: 400 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const avg = (b) => (Array.isArray(b) ? ((b[0] || 0) + (b[1] ?? b[0] ?? 0)) / 2 : Number(b) || 0);
const scale = (pow, e) => 1 + clamp(((pow || 0) - (e.thr ?? 20)) / 150, 0, e.scaleCap ?? 1);

// ふつうの 攻撃 1回の ダメージ（守りを むしする 技・かならず 会心の 技も）
function physUnit(e) {
  if (e.forceCrit) return STD.atk;
  return Math.max(1, STD.atk / 2 - (STD.foeDfn * (1 - (e.ignoreDef || 0))) / 4);
}

// 1つの 効果の 強さ（ダメージ・回復の 量。ない ときは 0）
export function partStdPower(e) {
  if (!e) return 0;
  switch (e.type) {
    case 'multi': return (e.parts || []).reduce((s, p) => s + partStdPower(p), 0);
    case 'phys': return physUnit(e) * (e.mult ?? 1) * (e.hits > 1 ? e.hits : 1);
    case 'drainHp':
    case 'arCombo':
    case 'piInferno':
    case 'scFall':
      return physUnit(e) * (e.mult ?? 1);
    case 'magic':
    case 'deduce':
    case 'gather':
    case 'arSpell':
    case 'weatherStrike':
      if (!e.base) return 0;
      return avg(e.base) * scale(e.stat === 'heal' ? STD.heal : STD.mag, e);
    case 'heal':
      if (!e.base) return 0;
      return avg(e.base) * (e.fixed ? 1 : scale(STD.heal, e));
    // じわじわ 回復: 1回の 量 × ふつうの 回数
    case 'regen':
      if (!e.base) return 0;
      return Math.max(1, avg(e.base) * (e.fixed ? 1 : scale(STD.heal, e))) * REGEN_BASE;
    case 'mpHeal': return avg(e.base);
    case 'revive':
    case 'reviveAll':
      return STD.maxHp * (e.hpRatio || 0.25);
    // 元気玉: ふつうの 4人（HP満タン）から 集めた HP × 倍率
    case 'genki': return genkiTotal(Array(STD.party).fill(STD.partyHp), e.rate) * (e.mult || 1);
    case 'allMp': return (STD.mp + (e.paid || 0)) * (e.mult || 1);
    case 'goldThrow': return ((Number(e.base) || 50) + STD.lv * (e.perLv || 10)) * (e.mult || 1);
    default: return 0;
  }
}

// 技の ふつうの 強さ（ダメージ・回復の ない 技は 0）
export function skillStdPower(id) {
  const a = ABILITIES[id];
  if (!a?.effect) return 0;
  return Math.round(partStdPower(a.effect) * 10) / 10;
}

// 技の もとの MP（職業の ほせい なし）
export const skillStdMp = (id) => Number(ABILITIES[id]?.mp) || 0;

// 弱い じゅんに ならべた あたらしい 配列（ids は かえない）。知らない 技は さいごに（もとの じゅん）
export function sortByStdPower(ids) {
  const rows = (ids || []).map((id, i) => ({ id, i, known: !!ABILITIES[id], pow: skillStdPower(id), mp: skillStdMp(id) }));
  rows.sort((x, y) => {
    if (x.known !== y.known) return x.known ? -1 : 1;
    // ダメージ・回復の ある 技が さき
    const px = x.pow > 0, py = y.pow > 0;
    if (px !== py) return px ? -1 : 1;
    if (px && x.pow !== y.pow) return x.pow - y.pow;
    if (x.mp !== y.mp) return x.mp - y.mp;
    return x.i - y.i;
  });
  return rows.map((r) => r.id);
}

// ───────────── 第69回: お気に入りの ならびかえ（メニューの お気に入りで つかんで 十字キーで うごかす） ─────────────
// 戦いの ★の タブと おなじ わけかた（呪文 と 特技。client/battle.js の openCommand）。どちらでも ない 技は null
export function favSection(a) {
  if (!a) return null;
  if (a.kind === 'spell' || a.spellLike) return 'spell';
  if (a.kind === 'skill' || a.kind === 'monster' || a.kind === 'combo') return 'skill';
  return null;
}

// つかんだ 技を うごかす（左右: 1つ・上下: 1行〈cols こ〉。はしで とまる。となりと 入れかえる）
//   もどりち: { ids, pos }（うごかない ときは null）
export function moveInGrid(ids, pos, dir, cols = 2) {
  const d = { left: -1, right: 1, up: -cols, down: cols }[dir];
  if (!d || pos < 0 || pos >= ids.length) return null;
  const to = Math.max(0, Math.min(ids.length - 1, pos + d));
  if (to === pos) return null;
  const out = ids.slice();
  [out[pos], out[to]] = [out[to], out[pos]];
  return { ids: out, pos: to };
}

// お気に入りの ぜんぶの ならび（full）の うち、oldSec の 技の 場所に newSec の じゅんで 入れなおす
//   （呪文と 特技は おなじ 1つの 配列。かえるのは その 見出しの 中の じゅん だけ）
export function mergeSectionOrder(full, oldSec, newSec) {
  const set = new Set(oldSec);
  let k = 0;
  return (full || []).map((id) => (set.has(id) && k < newSec.length ? newSec[k++] : id));
}
