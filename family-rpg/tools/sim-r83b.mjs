// 第83回 B班: ぬ〜べ〜の 系統の 強さの しらべ（docs/plan-r83-jobs-b.md。tools/sim-r82a.mjs と おなじ やり方）
// 第2部の ボス（tools/sim-ch7.mjs・sim-ch8.mjs）で、家族の 1人（勇者の ところ）を ほかの 伝説の 職業に 入れかえて くらべる。
// ★装備は 勇者の 物を そのまま（その 職業が 装備 できない 所は 店の いちばん よい 品）
// つかいかた: node tools/sim-r83b.mjs [回数] [ボス,…] [職業,…]
//   ボス: ch7 … gate temple reef light witch shadow / ch8 … pet jafar imps hades kamek bowser
//   KNOW=0 … 完全オート（しかけを 知らない ふつうの オート）だけ / KNOW=1 … 知っている 人だけ（ない ときは 両方）
//   USES=1 … 入れかえた 人が 使った 技・おにの手の 番・自動で かばった 回数も 出す
import { CH6_JOBS } from './sim-ch6.mjs';
import { ch7Run, CH7_LV, CH7_KIT } from './sim-ch7.mjs';
import { ch8Run, CH8_LV, CH8_KIT } from './sim-ch8.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { Battle } from '../public/js/shared/battle.js';

const N = Number(process.argv[2] || 10);
const BOSSES = (process.argv[3] || 'temple,witch,shadow,jafar,hades,bowser').split(',');
const LIST = (process.argv[4] || 'hero,jigoku_sensei,nube,guard_god,hikeshi_god,hiten,kenshin,ryumajin').split(',');
const MODES = process.env.KNOW === '0' ? [false] : process.env.KNOW === '1' ? [true] : [true, false];
const C7 = new Set(Object.keys(CH7_LV));

// 使った 技・自動で かばった 回数（Battle.prototype.emit を のぞく）
const uses = {};
let covers = 0, oniTurns = 0;
if (process.env.USES) {
  const emit = Battle.prototype.emit;
  Battle.prototype.emit = function (ev) {
    if (ev.t === 'act') {
      const a = this.allies[0];
      if (ev.id === a.id) uses[ev.name] = (uses[ev.name] || 0) + 1;
      if (ev.r83bCover?.by === a.id) covers++;
      if (ev.oniUp === a.id) oniTurns++;
    }
    return emit.call(this, ev);
  };
}

for (const boss of BOSSES) {
  const ch7 = C7.has(boss);
  const KIT = ch7 ? CH7_KIT : CH8_KIT;
  const lv = (ch7 ? CH7_LV : CH8_LV)[boss];
  for (const know of MODES) {
    console.log(`■ ${boss}（Lv${lv}・${know ? '知っている 人' : '完全オート'}・${N}回）`);
    for (const job of LIST) {
      KIT[boss][job] = KIT[boss][job] || KIT[boss].hero.map((id) => (id && canEquip(job, id) ? id : null));
      CH6_JOBS[0] = [job, '勇者'];
      for (const k of Object.keys(uses)) delete uses[k];
      covers = 0; oniTurns = 0;
      const res = [];
      for (let s = 1; s <= N; s++) res.push((ch7 ? ch7Run : ch8Run)(boss, lv, know, 1000 + s));
      const w = res.filter((r) => r.outcome === 'win').length;
      const sec = res.reduce((a, r) => a + r.seconds, 0) / N;
      const left = res.reduce((a, r) => a + r.bossLeft, 0) / N;
      console.log(`  ${(JOBS[job].name).padEnd(12, '　')} 勝率 ${String(Math.round((w / N) * 100)).padStart(3)}%  平均 ${sec.toFixed(0).padStart(4)}びょう  ボスの のこり ${(left * 100).toFixed(0).padStart(3)}%`);
      if (process.env.USES) {
        console.log(`    かばった ${(covers / N).toFixed(1)}回  おにの手の 番 ${(oniTurns / N).toFixed(1)}回  ` + Object.entries(uses).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${(v / N).toFixed(1)}`).join(' '));
      }
    }
    CH6_JOBS[0] = ['hero', '勇者'];
  }
}
