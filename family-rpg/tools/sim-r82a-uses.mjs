// 第82回 A: ボス戦で 入れかえた 職業が 何を 使ったか（tools/sim-r82a.mjs の なかま）
// つかいかた: node tools/sim-r82a-uses.mjs [回数] [ボス] [職業]
import { CH6_JOBS } from './sim-ch6.mjs';
import { CH7_LV, CH7_KIT } from './sim-ch7.mjs';
import { CH8_LV, CH8_KIT } from './sim-ch8.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';

const N = Number(process.argv[2] || 5);
const boss = process.argv[3] || 'temple';
const job = process.argv[4] || 'bakuryuha';
const ch7 = boss in CH7_LV;
const KIT = ch7 ? CH7_KIT : CH8_KIT;
KIT[boss][job] = KIT[boss][job] || KIT[boss].hero.map((id) => (id && canEquip(job, id) ? id : null));
CH6_JOBS[0] = [job, '勇者'];
const { ch7Run } = await import('./sim-ch7.mjs');
const { ch8Run } = await import('./sim-ch8.mjs');
// 行動を 数える（Battle.prototype.emit を のぞく）
const uses = {};
let rets = 0, retDmg = 0, youkai = 0, dmg = 0;
const emit = Battle.prototype.emit;
Battle.prototype.emit = function (ev) {
  if (ev.t === 'act') {
    const a = this.allies[0];
    if (ev.id === a.id) {
      uses[ev.name] = (uses[ev.name] || 0) + 1;
      for (const r of ev.results || []) if (r.dmg > 0 && this.enemies.some((e) => e.id === r.id)) dmg += r.dmg;
      if (ev.youkaiOn) youkai++;
    }
    for (const r of ev.bakuryuRet || []) {
      rets++;
      for (const x of ev.results || []) if (r.targets.includes(x.id)) retDmg += x.dmg || 0;
    }
  }
  return emit.call(this, ev);
};
let w = 0;
for (let s = 1; s <= N; s++) if ((ch7 ? ch7Run : ch8Run)(boss, (ch7 ? CH7_LV : CH8_LV)[boss], process.env.KNOW !== '0', 1000 + s).outcome === 'win') w++;
console.log(`${boss} ${job} 勝ち ${w}/${N}  ダメージ/回 ${Math.round(dmg / N)}  返した ${(rets / N).toFixed(1)}回（${Math.round(retDmg / Math.max(1, rets))}/回）  ようかい化 ${(youkai / N).toFixed(1)}`);
console.log(Object.entries(uses).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${(v / N).toFixed(1)}`).join('  '));
