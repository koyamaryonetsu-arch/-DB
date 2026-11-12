// 第78回: ゲストの 強さの きまり（docs/plan-r78-guest.md・設計メモ docs/plan-design-r77.md の 3-8）
// 「ゲストは 家族の 平均より 少し 下」
//
// ■ 物さし
//   fightPower(st) … そのままの 戦う 力 ＝ 最大HP÷3 ＋ max(こうげき, 魔力, 回復) ＋ 守り÷2 ＋ すばやさ÷2
//     ダメージは「こうげき÷2 − 守り÷4」なので 守り 1 は こうげき 1/2 ぶん。HP は ほかの 数の 2〜3倍 ある ので ÷3。
//     すばやさは 手番の 多さ（守りと おなじ 重さ）。足す だけ なので、ぜんぶの 数を k 倍 すると 力も ちょうど k 倍
//   growPower(char) … 育ちの 力（きまりで くらべる 数）＝ fightPower(装備こみ) × fightPower(レベルの ふつうの 能力) ÷ fightPower(素の 能力)
//     素の 能力 … 装備と たねを はずした その 人（職業・職業レベル・レベルは そのまま）
//     レベルの ふつうの 能力 … 職業の 得意・不得意の ない、その レベルの 能力（stats.js の baseStats）
//     → 職業の 得意・不得意（忍者は HP が 少ない・ガーディアンは こうげきが 弱い）を ならして「レベルと 装備・たねの 育ち」で くらべる。
//       そのままの 力で くらべると、忍者の ゲストは 倍率 1.7 でも とどかず、職業の 個性が こわれる
//
// ■ きまり（guestPlan）: ゲストの 育ちの 力 ＝ その 戦いに 出る 家族の キャラ（人間）の 育ちの 力の 平均 × GUEST_RATIO（0.94。はば 0.90〜0.97）
//   1. レベルを 家族の 平均レベルに 合わせる（minLevel 〜 レベルの 上限 の 中）
//   2. ずれる ぶんは 能力に 倍率 k（0.85〜1.15）を かける（HP・こうげき・守り・魔力・回復・すばやさ。MP は かけない）
//   3. 倍率の はばで とどかない ときは、レベルを ずらして とどく レベルを さがす（平均レベルに いちばん 近い もの）
//   4. てんじょう: レベルは 上限（def.maxLevel。ない ときは minLevel ＋ GUEST_LV_SPAN）と 家族の いちばん 高い レベルの 小さい ほうまで。
//      力は 家族の いちばん 強い 人を こえない（育ちの 力でも、そのままの 力でも）
//   5. 床: その ゲストの minLevel・きまった 装備・倍率 1 の 力は 下回らない（床は てんじょうより 先。ゲストは いつも 助けに なる）
//   ・装備は いつも minLevel で 作った ときの もの（def.gear と、ない 所は その レベルの ふつうの 装備）。職業・技・見た目は かえない
//   ・同じ 入力なら 同じ 結果（乱数を 使わない）。サーバーと ひとりモードは どちらも world/battles.js の makeBattle を 通る
import { computeStats, baseStats } from './stats.js';
import { makeNpcSupportChar } from './world/party.js';

export const GUEST_RATIO = 0.94;
export const GUEST_BAND = [0.90, 0.97];
export const GUEST_K = [0.85, 1.15];
// レベルの 上限（def.maxLevel が ない ゲスト）: minLevel ＋ これ
export const GUEST_LV_SPAN = 8;
export const GUEST_MAX_LEVEL = 99;

// そのままの 戦う 力（computeStats の 形か、戦いの 中の 人〈atk・dfn・mag・healPow・agi・maxHp〉）
export function fightPower(st) {
  if (!st) return 0;
  const heal = st.heal ?? st.healPow ?? 0;
  return (st.maxHp || 0) / 3 + Math.max(st.atk || 0, st.mag || 0, heal) + (st.dfn || 0) / 2 + (st.agi || 0) / 2;
}
export const charPower = (char) => fightPower(computeStats(char));

// レベルの ふつうの 能力の 力（職業の 得意・不得意 なし・装備 なし）
export function levelPower(level) {
  const b = baseStats(Math.max(1, level || 1));
  return fightPower({ maxHp: b.hp, atk: b.str, mag: b.mag, heal: b.heal, dfn: b.def, agi: b.agi });
}
// 素の 能力の 力（装備と たねを はずす）
export function barePower(char) {
  return charPower({ ...char, equip: { weapon: null, armor: null, shield: null, head: null, acc: null }, seeds: {} });
}
// 育ちの 力（きまりで くらべる 数）
export function growPower(char) {
  const bare = barePower(char);
  return bare > 0 ? (charPower(char) * levelPower(char.level)) / bare : 0;
}

export function guestLevelCap(def) {
  const min = def.minLevel || 1;
  return Math.max(min, Math.min(GUEST_MAX_LEVEL, def.maxLevel || min + GUEST_LV_SPAN));
}

// 戦いに 出る ゲストの キャラ（レベル L・装備は minLevel の もの）。HP・MP は まんたん
export function guestBaseChar(def, level) {
  const min = def.minLevel || 1;
  const c = makeNpcSupportChar({ ...def }, level);
  if (level !== min) {
    c.equip = { ...makeNpcSupportChar({ ...def }, min).equip };
    const st = computeStats(c);
    c.hp = st.maxHp;
    c.mp = st.maxMp;
  }
  return c;
}

// 数える 家族: 人間の キャラ（species が ない）。ゲストは 入れない（呼ぶ がわで 入れない）
export const humanChars = (chars) => (chars || []).filter((c) => c && !c.species);

// きまりの 計算。family … その 戦いに 出る 家族の キャラ（人間）。魔物が まざって いても 人間だけ 数える
// かえす もの: { level, k, power, avg, max, ratio, raw, rawMax, floor, cap }
//   power … ゲストの 育ちの 力（倍率 こみ）/ avg・max … 家族の 育ちの 力の 平均と いちばん 強い 人 / ratio … power ÷ avg
//   raw・rawMax … そのままの 力（ゲスト〈倍率 こみ〉と 家族の いちばん 強い 人）
//   floor … 床で きまった / cap … てんじょう（いちばん 強い 人・レベルの 上限・倍率の 上限）で 止まった
export function guestPlan(def, family) {
  const min = def.minLevel || 1;
  const fam = humanChars(family);
  // レベルの 上限: その ゲストの 上限と 家族の いちばん 高い レベル の 小さい ほう（minLevel より 下には しない）
  const famTop = Math.max(0, ...fam.map((c) => c.level || 1));
  const maxLv = Math.max(min, Math.min(guestLevelCap(def), famTop));
  const memo = new Map();
  const at = (L) => {
    if (!memo.has(L)) {
      const c = guestBaseChar(def, L);
      memo.set(L, { grow: growPower(c), raw: charPower(c) });
    }
    return memo.get(L);
  };
  const pw = (L) => at(L).grow;
  const floor0 = at(min);
  if (!fam.length) return { level: min, k: 1, power: floor0.grow, avg: 0, max: 0, ratio: 0, raw: floor0.raw, rawMax: 0, floor: true, cap: false };
  const gs = fam.map(growPower);
  const avg = gs.reduce((s, v) => s + v, 0) / gs.length;
  const max = Math.max(...gs);
  const rawMax = Math.max(...fam.map(charPower));
  const avgLv = Math.round(fam.reduce((s, c) => s + (c.level || 1), 0) / fam.length);
  const target = Math.min(avg * GUEST_RATIO, max);
  // 1・2. 平均の レベル（minLevel 〜 上限）で 倍率
  let level = Math.max(min, Math.min(maxLv, avgLv));
  let k = target / pw(level);
  // 3. 倍率の はばに 入らない ときは、とどく レベルを さがす（平均レベルに いちばん 近い もの。同じ ときは 低い ほう）
  if (k < GUEST_K[0] || k > GUEST_K[1]) {
    let best = null;
    for (let L = min; L <= maxLv; L++) {
      const kk = target / pw(L);
      if (kk < GUEST_K[0] || kk > GUEST_K[1]) continue;
      if (best == null || Math.abs(L - avgLv) < Math.abs(best - avgLv)) best = L;
    }
    if (best != null) level = best;
    else level = target > pw(maxLv) * GUEST_K[1] ? maxLv : min;
    k = target / pw(level);
  }
  let cap = k > GUEST_K[1];
  k = Math.max(GUEST_K[0], Math.min(GUEST_K[1], k));
  // 4. てんじょう: 家族の いちばん 強い 人を こえない（育ちの 力でも、そのままの 力でも）
  const room = (L) => Math.min(max / at(L).grow, rawMax / at(L).raw);
  if (k > room(level)) {
    cap = true;
    // 倍率を 下げきっても こえる → レベルを 下げる
    while (level > min && room(level) < GUEST_K[0]) level--;
    k = Math.max(GUEST_K[0], Math.min(GUEST_K[1], k, room(level)));
  }
  // 5. 床: minLevel・倍率 1 の 力は 下回らない
  let floor = false;
  if (pw(level) * k < floor0.grow - 1e-9 || at(level).raw * k < floor0.raw - 1e-9) {
    k = Math.max(floor0.grow / pw(level), floor0.raw / at(level).raw);
    floor = true;
  }
  k = Math.round(k * 1000) / 1000;
  const power = pw(level) * k;
  return { level, k, power, avg, max, ratio: power / avg, raw: at(level).raw * k, rawMax, floor, cap };
}

// 戦いに 出る ゲストの キャラと 倍率。base … パーティーの ゲスト（HP・MP・どく を うつす。ない ときは まんたん）
export function guestForBattle(def, family, base = null) {
  const plan = guestPlan(def, family);
  const c = guestBaseChar(def, plan.level);
  if (base) {
    const bs = computeStats(base);
    const st = computeStats(c);
    const hr = bs.maxHp > 0 ? Math.max(0, Math.min(1, (base.hp ?? bs.maxHp) / bs.maxHp)) : 1;
    const mr = bs.maxMp > 0 ? Math.max(0, Math.min(1, (base.mp ?? bs.maxMp) / bs.maxMp)) : 1;
    c.hp = (base.hp ?? 1) > 0 ? Math.max(1, Math.round(st.maxHp * hr)) : 0;
    c.mp = Math.round(st.maxMp * mr);
    if (base.status?.poison) c.status = { poison: true };
    if (base.tactics) c.tactics = base.tactics;
  }
  return { char: c, plan };
}

// 戦いの 中の ゲストに 倍率を かける（Battle を 作った すぐ あと 1回だけ）
const SCALE_KEYS = ['maxHp', 'atk', 'dfn', 'mag', 'healPow', 'agi'];
export function scaleGuestActor(a, k) {
  if (!a || !(k > 0) || k === 1) return a;
  const hr = a.maxHp > 0 ? a.hp / a.maxHp : 0;
  for (const key of SCALE_KEYS) if (typeof a[key] === 'number') a[key] = Math.max(key === 'maxHp' || key === 'agi' ? 1 : 0, Math.round(a[key] * k));
  a.hp = a.alive ? Math.max(1, Math.min(a.maxHp, Math.round(a.maxHp * hr))) : 0;
  a.guestK = k;
  return a;
}

// 戦いの あと: 戦いの 中の HP・MP の 割合を パーティーの ゲストへ もどす
export function guestAfterBattle(base, a) {
  const st = computeStats(base);
  base.hp = a.alive && a.hp > 0 ? Math.max(1, Math.min(st.maxHp, Math.round(st.maxHp * (a.hp / Math.max(1, a.maxHp))))) : 0;
  base.mp = Math.max(0, Math.min(st.maxMp, Math.round(st.maxMp * (a.mp / Math.max(1, a.maxMp)))));
}
