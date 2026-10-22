// 第40回: 宝の洞窟の ふつうの 魔物の 強さを 見る（前の 強さ と 新しい 強さ〈その レベルの ふつうの 魔物と おなじ〉）
// つかいかた: node tools/sim-tm.mjs [回数] [地図Lv,…]
//   パーティー: せんし・そうりょ・まほう・ぶとう（職業Lv10）。レベルは 洞窟の 魔物の レベル＋3、装備は その レベルの ころの 店
//   くらべる もの: 同じ レベルの ふつうの 場所の 魔物（tools/sim.js の 第3〜6章の 出現表）と だいたい 同じ（勝率 9わり 以上・HP残 6〜8わり）
import { runBattle, makeChar } from './sim.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { THEME_KEYS, ensureEncounterTable, enemyLvOf, TM_LV_MAX, TM_CAVE_POW } from '../public/js/shared/data/treasure.js';

const N = Number(process.argv[2] || 20);
const LVS = process.argv[3] ? process.argv[3].split(',').map(Number) : [2, 4, 8, 12, 16, 20, TM_LV_MAX];
const TIERS = [1, 4, 7, 10, 14, 20, 23, 33, 38, 42, 45, 48, 50, 52, 56, 58];
export const tierFor = (lv) => TIERS.filter((t) => t <= lv).pop();
const party = (lv) => ['warrior', 'priest', 'mage', 'monk'].map((j, i) => makeChar(j, lv, 10, `p${i}`, tierFor(lv)));
function roll(table, rng) {
  const e = rng.weighted(ENCOUNTER_TABLES[table]);
  return e.group.flatMap(([sp, a, b]) => Array(rng.int(a, b)).fill(sp));
}
const pct = (x) => `${String(Math.round(x * 100)).padStart(3)}%`;
if (process.argv[1].endsWith('sim-tm.mjs')) {
  for (const L of LVS) {
    const floor = 3;
    const eLv = enemyLvOf(L, floor);
    const plv = Math.min(99, Math.round(eLv) + Number(process.env.GAP ?? 3));
    for (const curve of [false, true]) {
      const res = [];
      for (const th of THEME_KEYS) {
        const z = ensureEncounterTable(L, th);
        const rng = makeRng(L * 100 + th.length);
        for (let i = 0; i < N; i++) res.push(runBattle(party(plv), roll(z, rng), { seed: i, enemyLv: eLv, enemyCurve: curve, enemyPow: curve ? TM_CAVE_POW : 1 }));
      }
      const w = res.filter((r) => r.outcome === 'win').length / res.length;
      const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
      console.log(`地図Lv${String(L).padStart(2)} 魔物Lv${eLv.toFixed(0).padStart(2)} 主人公Lv${String(plv).padStart(2)}（店${tierFor(plv)}） ${curve ? '新' : '前'}: 勝率${pct(w)} HP残${pct(avg('hpLeft'))} ${avg('seconds').toFixed(0).padStart(3)}秒 死者${avg('deaths').toFixed(2)}`);
    }
  }
}
