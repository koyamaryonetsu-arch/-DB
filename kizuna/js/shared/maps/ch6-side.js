// 第6章 Step 3・4（A: 世界と物語）の より道（サブクエスト）の 人と 場所（maps/ch6.js の attachCh6 で まぜる。plan-ch6.md の 12-2）
// ・時のタイムカプセル（3か所）: 千年前の ホシフルの里・泉の里・星読みの社で いっしょに うめる → 今の その 場所を ほる
// ・千年前のレシピ: 今の ルミナの酒場の コック → 千年前の 泉の里の おくさん → 今の コック（人は 今まで いる 人）
// ・ちびアステルのたからもの: 千年前の フィールドの きらきらの石 5つ → ちびアステル → 今の ほしみの丘に おりてくる アステル
// だいほんは data/sidequests-ch6.js。どれも c6_flow の あとから
import { npc } from './npc.js?v=a8edacfcfd44';
import { PLACES } from './overworld.js?v=a8edacfcfd44';
import { PAST_ID } from './past.js?v=a8edacfcfd44';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const TC = {
  start: (i) => `c6_tc${i}_start`, // たのまれた
  bury: (i) => `c6_tc${i}_bury`, // 千年前で うめた
  dug: (i) => `c6_tc${i}_dug`, // 今で ほった
  done: 'c6_tc_done', // 3つ そろって、今の ばあちゃんから ごほうび
};
export const RC = { start: 'c6_rc_start', learn: 'c6_rc_learn', done: 'c6_rc_done' };
export const CT = { start: 'c6_ct_start', stone: (i) => `c6_ct_s${i}`, given: 'c6_ct_given', done: 'c6_ct_done' };

// ───────────── 場所 ─────────────
// タイムカプセルを うめる 所（千年前）と ほる 所（今）は おなじ 座標
//   1 … ホシフルの里の たき火の 南（今の ホシフル村の 広場の 南）/ 2 … 泉の里の 泉の 南東（今の ルミナの町の 広場）/ 3 … 星読みの社の 南西（今の 森のひろば）
export const TC_SPOTS = { 1: { x: 27, y: 107 }, 2: { x: 62, y: 44 }, 3: { x: 110, y: 18 } };
// たのむ 人（千年前）: 里の子ども・泉の里の子ども・社の見習いコトハ
export const TC_ASKERS = { 1: 'p_vil2', 2: 's_k1', 3: 'kotoha' };
export const TC_NAMES = { 1: 'ホシフルの里', 2: '泉の里', 3: '星読みの社' };
// きらきらの石（千年前の フィールド。里から 歩いて 行ける 所）
export const KIRA_SPOTS = [{ x: 80, y: 60 }, { x: 40, y: 70 }, { x: 70, y: 100 }, { x: 100, y: 30 }, { x: 75, y: 82 }];
// 今の アステル（ほしみの丘に おりてくる。大きな 竜の え）
export const ASTEL_SPOT = { x: PLACES.shrine.x + 9, y: PLACES.shrine.y + 6 };

export function attachCh6Side(maps) {
  const past = maps[PAST_ID], now = maps.overworld;
  for (const [k, p] of Object.entries(TC_SPOTS)) {
    past.npcs.push(npc(`tc_bury_${k}`, 'うめる場所', [p.x, p.y], 'capsule_hole', `c6_tc_bury_${k}`, { solid: false, show: { all: [TC.start(k)], not: [TC.bury(k)] } }));
    now.npcs.push(npc(`tc_dig_${k}`, 'タイムカプセル', [p.x, p.y], 'capsule_spot', `c6_tc_dig_${k}`, { solid: false, show: { all: [TC.bury(k)], not: [TC.dug(k)] } }));
  }
  KIRA_SPOTS.forEach((p, i) => {
    past.npcs.push(npc(`kira_${i + 1}`, 'きらきらの石', [p.x, p.y], 'kira_stone', `c6_kira_${i + 1}`, { solid: false, show: { all: [CT.start], not: [CT.stone(i + 1)] } }));
  });
  now.npcs.push(npc('astel_c6', '星の竜アステル', [ASTEL_SPOT.x, ASTEL_SPOT.y], 'mon:star_dragon', 'c6_astel_scale', { big: true, dir: 'left', show: { all: [CT.given], not: [CT.done] } }));
}
