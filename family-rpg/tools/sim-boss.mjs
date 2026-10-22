// 第32回: 第5章から先と やりこみの ボスの 強さを 見る（店の 装備だけ と、レア装備で 仲間を 育てた ばあい）
// つかいかた: node tools/sim-boss.mjs [回数] [argos|dragon|tm|sd]（さいごを 書かないと ぜんぶ）
//   めやす … 店の 装備だけ（その ころの 店の いちばん よい 装備）で 勝率 3〜5割、レア装備（その ころ 手に入る ★）で レベル＋3〜5 なら 8〜9割
//   パーティーは tools/sim.js と おなじ 4人（せんし・そうりょ・まほう・ぶとう・職業Lv10）。レア装備は tools/sim-rare.mjs の KITS
//   店 … GEAR 33（王都サファラの ランク6）・38（ランク6＋α）・42（ドゥナの ランク7＋ボスの アクセサリー。第5章の 店は まだ ない）
//   ★45 … 大迷宮の 宝箱の ★の 装備（GEAR 45）/ rare38・rare42・deep … sim-rare.mjs の KITS
import { runBattle } from './sim.js';
import { kitParty } from './sim-rare.mjs';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS_TM } from '../public/js/shared/data/monsters-tm.js';
import { caveInfo, bossLvOf, tmBossPow } from '../public/js/shared/data/treasure.js';
import { SD_GUARDS, sdGuardian } from '../public/js/shared/data/secret.js';
import { sdGuardStrength } from '../public/js/shared/data/secret-guard.js';

const N = Number(process.argv[2] || 30);
const MODE = process.argv[3] || 'all';
const fixedOf = (enc) => FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
const seedOf = (i) => 777 + i * 7919;
// kit: 'shop33' など（店）/ 'lab45'（大迷宮の ★）/ 'rare38'・'rare42'・'deep'
export function bossParty(lv, kit) {
  const m = /^(?:shop|lab)(\d+)$/.exec(kit);
  if (m) return kitParty(lv, Number(m[1]), null);
  return kitParty(lv, kit === 'rare38' ? 38 : 42, kit);
}
const KIT_NAME = { shop33: '店（ランク6）', shop38: '店（ランク6＋α）', shop42: '店（ランク7）', lab45: '大迷宮の★', rare38: 'レア（第4章のおわり）', rare42: 'レア（第5章）', deep: 'レア★5（60階より下）' };
const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
function line(label, res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  console.log(`  ${label.padEnd(34)} 勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}`);
  return w / res.length;
}

// 星の番人アルゴス（おすすめ Lv41〜42）
export function argosRun(lv, kit, know, seed) {
  return runBattle(bossParty(lv, kit), fixedOf('argos'), { seed, boss: true, ...(know ? { knowsArgos: true } : { argosNaive: true }) });
}
// 古竜オルドラ（おすすめ Lv45）
export function dragonRun(lv, kit, know, seed) {
  return runBattle(bossParty(lv, kit), fixedOf('lab_dragon'), { seed, boss: true, ...(know ? { knowsLab: true } : { labNaive: true, ignoreStance: true }) });
}
// 宝の洞窟の 主: 地図 Lv L の 主（6しゅ の どれか）。主の レベルは いちばん 深い 洞窟（6階）の とき
export function tmRun(L, sp, lv, kit, seed) {
  const s = [...Array(4000).keys()].find((x) => caveInfo(x, L).floors === Math.min(6, 2 + Math.floor((L - 1) / 2) + 1)) ?? 1;
  return runBattle(bossParty(lv, kit), [sp], { seed, boss: true, enemyLv: bossLvOf(s, L), enemyPow: tmBossPow(L, sp), enemyCurve: true });
}
// ひみつのダンジョンの 番人（f 階・番人 sp）
export function sdRun(f, sp, lv, kit, seed) {
  const g = sdGuardStrength(f, sp);
  return runBattle(bossParty(lv, kit), [sp], { seed, boss: true, enemyLv: g.lv, enemyPow: g.pow, knowsBurrow: sp === 'sand_whale' });
}
// 地図 Lv L の ころの 主人公（2L＋18）と 装備
export const TM_PLAN = { 8: [34, 'shop33', 'rare38'], 9: [36, 'shop38', 'rare38'], 10: [38, 'shop38', 'rare42'], 11: [40, 'shop42', 'rare42'], 12: [42, 'shop42', 'rare42'] };
// ひみつのダンジョンの 階の ころの 主人公（階＋2）と 装備
export const SD_PLAN = { 40: [42, 'shop42', 'rare42'], 50: [52, 'shop42', 'rare42'], 60: [62, 'shop42', 'deep'], 80: [82, 'shop42', 'deep'], 100: [97, 'shop42', 'deep'] };

if (process.argv[1].endsWith('sim-boss.mjs')) {
  const all = MODE === 'all';
  if (all || MODE === 'argos') {
    console.log('■ 星の番人アルゴス（おすすめ Lv41〜42。知っている＝見通しの目を さける・星のさばきの 前に 身を 守る）');
    for (const know of [true, false]) {
      for (const [lv, kit] of [[41, 'shop42'], [42, 'shop42'], [44, 'shop42'], [45, 'rare42'], [46, 'rare42'], [47, 'rare42']]) {
        const res = [...Array(N).keys()].map((i) => argosRun(lv, kit, know, seedOf(i)));
        line(`Lv${lv} ${KIT_NAME[kit]}${know ? '' : '（知らない）'}`, res);
      }
    }
  }
  if (all || MODE === 'dragon') {
    console.log('■ 古竜オルドラ（おすすめ Lv45。知っている＝いにしえの炎の 前に 身を 守る・構えの 間は なぐらない）');
    for (const know of [true, false]) {
      for (const [lv, kit] of [[45, 'shop42'], [47, 'shop42'], [48, 'lab45'], [48, 'rare42'], [50, 'rare42']]) {
        const res = [...Array(N).keys()].map((i) => dragonRun(lv, kit, know, seedOf(i)));
        line(`Lv${lv} ${KIT_NAME[kit]}${know ? '' : '（知らない）'}`, res);
      }
    }
  }
  if (all || MODE === 'tm') {
    console.log('■ 宝の洞窟の 主（地図 Lv L の 主に、主人公 Lv 2L＋18 の 店の 装備 と、レア装備で レベル＋4（Lv10からは ＋6 も）。6しゅ の 平均と 1しゅ ずつ）');
    const n = Math.max(4, Math.round(N / 2));
    for (const L of [8, 9, 10, 11, 12]) {
      const [lv, shop, rare] = TM_PLAN[L];
      for (const [plv, kit] of [[lv, shop], [lv + 4, rare], ...(L >= 10 ? [[lv + 6, rare]] : [])]) {
        let w = 0, t = 0;
        const per = [];
        for (const sp of Object.keys(MONSTERS_TM)) {
          const res = [...Array(n).keys()].map((i) => tmRun(L, sp, plv, kit, seedOf(i)));
          const k = res.filter((r) => r.outcome === 'win').length;
          per.push(`${MONSTERS_TM[sp].name.replace(/^.*の/, '')}${pct(k, n).trim()}`);
          w += k; t += n;
        }
        console.log(`  地図Lv${L} 主人公Lv${plv} ${KIT_NAME[kit].padEnd(12)} 勝率 ${pct(w, t)}  （${per.join(' ')}）`);
      }
    }
  }
  if (all || MODE === 'sd') {
    console.log('■ ひみつのダンジョンの 番人（f 階の 番人に、主人公 Lv f＋2 の 店の 装備 と、レア装備で レベル＋4。14しゅ の 平均と、その 階の 番人）');
    const n = Math.max(3, Math.round(N / 4));
    for (const f of Object.keys(SD_PLAN).map(Number)) {
      const [lv, shop, rare] = SD_PLAN[f];
      for (const [plv, kit] of [[lv, shop], [Math.min(99, lv + 4), rare]]) {
        let w = 0, t = 0;
        const per = [];
        for (const sp of SD_GUARDS) {
          const res = [...Array(n).keys()].map((i) => sdRun(f, sp, plv, kit, seedOf(i)));
          const k = res.filter((r) => r.outcome === 'win').length;
          per.push([sp, k / n]);
          w += k; t += n;
        }
        const own = per.find(([sp]) => sp === sdGuardian(f));
        const lo = per.slice().sort((a, b) => a[1] - b[1]).slice(0, 2).map(([sp, r]) => `${sp}${Math.round(r * 100)}%`).join(' ');
        console.log(`  ${String(f).padStart(3)}階 主人公Lv${plv} ${KIT_NAME[kit].padEnd(14)} 勝率 ${pct(w, t)}  この階の 番人 ${own[0]} ${Math.round(own[1] * 100)}%（にがて: ${lo}）`);
      }
    }
  }
}
