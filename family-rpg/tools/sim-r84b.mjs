// 第84回 B班: らんま1/2 の 系統（手数と カウンター）の 強さの しらべ（docs/plan-r84-jobs-b.md。tools/sim-r83a.mjs と おなじ やり方）
// 第2部の ボス（tools/sim-ch7.mjs・sim-ch8.mjs）で、家族の 1人（勇者の ところ）を 飛竜しょう天はの達人・早おとめ乱馬と、
// ほかの 攻めの 伝説（スーパーサイヤ人3・日の呼吸の使い手・ばくりゅうはの大よう・飛天御剣流けい承者・竜神けんのサムライ など）に 入れかえて くらべる。
// 勝率と 長さが ほかの 伝説と ±10% くらいに おさまるか・完全オートで 勝てる ように なって いないか・よけるだけで 大技を 受けない、に なって いないかを 見る。
// ★装備は 勇者の 物を そのまま（その 職業が 装備 できない 所は 店の いちばん よい 品）
// つかいかた: node tools/sim-r84b.mjs [回数] [ボス,…] [職業,…]
//   ボス: ch7 … gate temple reef light witch shadow / ch8 … pet jafar imps hades kamek bowser
//   KNOW=0 … 完全オート（しかけを 知らない ふつうの オート）だけ / KNOW=1 … 知っている 人だけ（ない ときは 両方）
//   R84B_AI=kake:0,mad:0.5 など … オートが 技を えらぶ わりあい（battle-r84b.js の R84B_AI）を かえて ためす
//   USES=1 … 入れかえた 人が 使った 技の 回数も 出す（1戦の 平均）・やり返した 回数・よけた 回数・大技を 受けた 回数
import { CH6_JOBS } from './sim-ch6.mjs';
import { ch7Run, CH7_LV, CH7_KIT } from './sim-ch7.mjs';
import { ch8Run, CH8_LV, CH8_KIT } from './sim-ch8.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { Battle } from '../public/js/shared/battle.js';
import { R84B_AI } from '../public/js/shared/battle-r84b.js';

// R84B_AI=kake:0,mad:0.5 など … オートが 技を えらぶ わりあいを かえて ためす
for (const kv of (process.env.R84B_AI || '').split(',').filter(Boolean)) {
  const [k, v] = kv.split(':');
  R84B_AI[k] = Number(v);
}

const N = Number(process.argv[2] || 10);
const BOSSES = (process.argv[3] || 'temple,witch,shadow,jafar,hades,bowser').split(',');
const LIST = (process.argv[4] || 'hiryu_master,ranma,ss3,hinokami,bakuryuha,hiten,ryujin_samurai').split(',');
const MODES = process.env.KNOW === '0' ? [false] : process.env.KNOW === '1' ? [true] : [true, false];
const C7 = new Set(Object.keys(CH7_LV));

// 使った 技・やり返し・よけ・大技（USES=1）
const uses = {};
if (process.env.USES) {
  const emit = Battle.prototype.emit;
  Battle.prototype.emit = function (ev) {
    const me = this.allies[0];
    if (ev.t === 'act' && me && ev.id === me.id) uses[ev.name || '?'] = (uses[ev.name || '?'] || 0) + 1;
    if (ev.t === 'act' && me && ev.r84bHiryuRet?.some((r) => r.by === me.id)) uses['（やり返した）'] = (uses['（やり返した）'] || 0) + 1;
    if (ev.t === 'act' && me && ev.big && (ev.results || []).some((r) => r.id === me.id)) {
      const k = (ev.results || []).some((r) => r.id === me.id && r.miss) ? '（大技を よけた）' : '（大技を 受けた）';
      uses[k] = (uses[k] || 0) + 1;
    }
    if (ev.t === 'act' && me && !ev.big && (ev.results || []).some((r) => r.id === me.id && r.miss)) uses['（よけた）'] = (uses['（よけた）'] || 0) + 1;
    return emit.call(this, ev);
  };
}

const total = {};
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
      const res = [];
      for (let s = 1; s <= N; s++) res.push((ch7 ? ch7Run : ch8Run)(boss, lv, know, 1000 + s));
      const w = res.filter((r) => r.outcome === 'win').length;
      const sec = res.reduce((a, r) => a + r.seconds, 0) / N;
      const left = res.reduce((a, r) => a + r.bossLeft, 0) / N;
      const t = (total[`${know}|${job}`] = total[`${know}|${job}`] || { w: 0, n: 0, sec: 0 });
      t.w += w;
      t.n += N;
      t.sec += sec;
      console.log(`  ${(JOBS[job].name).padEnd(12, '　')} 勝率 ${String(Math.round((w / N) * 100)).padStart(3)}%  平均 ${sec.toFixed(0).padStart(4)}びょう  ボスの のこり ${(left * 100).toFixed(0).padStart(3)}%`);
      if (process.env.USES) console.log('    ' + Object.entries(uses).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${(v / N).toFixed(1)}`).join('  '));
    }
    CH6_JOBS[0] = ['hero', '勇者'];
  }
}
console.log('■ まとめ（ボス 全部の 平均）');
for (const [k, t] of Object.entries(total)) {
  const [know, job] = k.split('|');
  console.log(`  ${know === 'true' ? '知っている' : '完全オート'} ${(JOBS[job].name).padEnd(12, '　')} 勝率 ${String(Math.round((t.w / t.n) * 100)).padStart(3)}%  平均 ${(t.sec / BOSSES.length).toFixed(0).padStart(4)}びょう`);
}
