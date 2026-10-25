// 宝の洞窟の 魔物の 強さの めやす（第40回。家族の 声:「宝の地図の 敵の レベルが 低い」）
// その レベルの ふつうの 魔物（フィールドや ダンジョンに 出る 魔物）の まん中の 強さを、MONSTERS から 作る。
// 宝の洞窟では、もとの 魔物の 強さを この めやすの 「わりあい」で 地図の レベルまで 上げる（data/treasure.js の scaleEnemy の curve）。
//   前は (L+6)/(L0+6) の 1本の 倍率だったので、高い レベルほど ふつうの 魔物より 弱く なっていた（Lv33 で HP は 半分 くらい）。
// ・新しい 魔物が ふえても 自動で 合う（はじめて 使う 時に 作る）
// ・いちばん 強い ふつうの 魔物より 上の レベルは、その 前の 10レベルの のびかたで のばす
import { MONSTERS } from './monsters.js?v=c553fc066ee8';

export const CURVE_KEYS = ['hp', 'str', 'def', 'mag', 'agi', 'exp', 'gold'];
const MAX_LV = 150;
let table = null;

// めやすに 使う 魔物（ボス・宝の洞窟の 主・メタルの ような とくべつな 魔物は 入れない）
function usable(id, m) {
  return m && m.lv > 0 && m.hp > 0 && !m.boss && !m.tmBoss && !m.rare && !/metal/.test(id) && !id.startsWith('tm_');
}
const median = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  return s.length ? s[s.length >> 1] : NaN;
};

function build() {
  const list = Object.entries(MONSTERS).filter(([id, m]) => usable(id, m)).map(([, m]) => m);
  const top = Math.max(...list.map((m) => m.lv));
  const out = {};
  for (const key of CURVE_KEYS) {
    const v = new Array(MAX_LV + 1).fill(0);
    for (let L = 1; L <= Math.min(top, MAX_LV); L++) {
      // まわりの レベルの 魔物が 5体 そろうまで まどを 広げる
      let s = [];
      for (let w = 2; w <= 8 && s.length < 5; w++) s = list.filter((m) => Math.abs(m.lv - L) <= w);
      const vals = s.map((m) => (key === 'mag' ? m.mag || m.str : m[key]) || 0).filter((x) => x > 0);
      v[L] = vals.length ? median(vals) : v[L - 1] || 1;
    }
    // 上がり下がりを ならす（レベルが 上がって 弱く ならない）
    for (let L = 2; L <= top; L++) v[L] = Math.max(v[L], v[L - 1]);
    // いちばん 強い 魔物より 上: 前の 10レベルの のびかたで
    const from = Math.max(1, top - 10);
    const g = Math.pow(v[top] / Math.max(1, v[from]), 1 / Math.max(1, top - from));
    for (let L = top + 1; L <= MAX_LV; L++) v[L] = v[L - 1] * g;
    out[key] = v;
  }
  return out;
}

// key の めやす（L は 小数でも よい。1〜99）
export function refStat(key, L) {
  if (!table) table = build();
  const v = table[key];
  const x = Math.max(1, Math.min(MAX_LV, Number(L) || 1));
  const a = Math.floor(x), b = Math.min(MAX_LV, a + 1);
  return v[a] + (v[b] - v[a]) * (x - a);
}
// レベル L0 の 魔物を L に した 時の 倍率
export function curveK(key, L0, L) {
  return refStat(key, L) / Math.max(1e-6, refStat(key, L0));
}
