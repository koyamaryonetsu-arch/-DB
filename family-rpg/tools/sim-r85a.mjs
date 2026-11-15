// 第85回 A班: スレイヤーズの 系統（ためて うつ 大砲）の 強さの しらべ（docs/plan-r85-jobs-a.md。tools/sim-r84b.mjs と おなじ やり方）
// 第2部の ボス（tools/sim-ch7.mjs・sim-ch8.mjs）で、家族の 1人（勇者の ところ）を ドラまた・天才美少女魔道士リナと、
// ほかの 魔法の 伝説（千年の大魔法使い・さいきくすお・第5のせいれい・魔王・ネオ・クイーン・セレニティ）・魔法の 超級職（大魔道士・ハリーポッター・大賢者）に 入れかえて くらべる。
// （ハリーポッターの 系統・大魔道士の 上の 伝説は ない。2つを きわめた 先は 幻の 大魔導王 だけ）
// 勝率と 長さが ほかの 伝説と ±10% くらいに おさまるか・完全オートで 勝てる ように なって いないか・大砲を 何回 うったかを 見る。
// ★装備は 勇者の 物を そのまま（その 職業が 装備 できない 所は 店の いちばん よい 品）
// つかいかた: node tools/sim-r85a.mjs [回数] [ボス,…] [職業,…]
//   ボス: ch7 … gate temple reef light witch shadow / ch8 … pet jafar imps hades kamek bowser
//   KNOW=0 … 完全オート（しかけを 知らない ふつうの オート）だけ / KNOW=1 … 知っている 人だけ（ない ときは 両方）
//   R85A_AI=chant:0.6,meal:0.5 など … オートが 技を えらぶ わりあい（battle-r85a.js の R85A_AI）を かえて ためす
//   R85A=boost:1.5,giga:2.4,cap:1600 … となえた あとの ふつうの 呪文の 倍・ギガ・スレイブの MP 1 あたり・上限を かえて ためす（データは かえない）
//   USES=1 … 入れかえた 人が 使った 技の 回数も 出す（1戦の 平均）・ギガ・スレイブで 使った MP の 平均・いちばん 大きい 1発
import { CH6_JOBS } from './sim-ch6.mjs';
import { ch7Run, CH7_LV, CH7_KIT } from './sim-ch7.mjs';
import { ch8Run, CH8_LV, CH8_KIT } from './sim-ch8.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { Battle } from '../public/js/shared/battle.js';
import * as R85A from '../public/js/shared/battle-r85a.js';

for (const kv of (process.env.R85A_AI || '').split(',').filter(Boolean)) {
  const [k, v] = kv.split(':');
  R85A.R85A_AI[k] = Number(v);
}
// R85A_DUAL=1 … 合体技の 強さに 大砲を そのまま 数える（割り引き なしと くらべる）
if (process.env.R85A_DUAL) R85A.R85A_DUAL.mult = Number(process.env.R85A_DUAL);
if (process.env.R85A) console.log('（R85A は データを かえずに 見る ための もの。今は 表示だけ）', process.env.R85A);

const N = Number(process.argv[2] || 10);
const BOSSES = (process.argv[3] || 'temple,witch,shadow,jafar,hades,bowser').split(',');
const LIST = (process.argv[4] || 'doramata,sennen_mage,saiki,fifth_spirit,maou,neo_queen,lina,archmage,harry,daikenja').split(',');
const MODES = process.env.KNOW === '0' ? [false] : process.env.KNOW === '1' ? [true] : [true, false];
const C7 = new Set(Object.keys(CH7_LV));

const uses = {};
let gigaN = 0, gigaMp = 0, top = 0;
if (process.env.USES) {
  const emit = Battle.prototype.emit;
  Battle.prototype.emit = function (ev) {
    const me = this.allies[0];
    if (ev.t === 'act' && me && ev.id === me.id) {
      uses[ev.name || '?'] = (uses[ev.name || '?'] || 0) + 1;
      if (ev.r85aGiga) { gigaN++; gigaMp += ev.r85aGiga.used; }
      for (const r of ev.results || []) if (r.dmg > top && this.get(r.id)?.side === 'enemy') top = r.dmg;
      if (ev.r85aHaya) uses['（早口）'] = (uses['（早口）'] || 0) + 1;
    }
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
      gigaN = 0; gigaMp = 0; top = 0;
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
      if (process.env.USES) {
        console.log('    ' + Object.entries(uses).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k, v]) => `${k}×${(v / N).toFixed(1)}`).join('  '));
        console.log(`    いちばん 大きい 1発 ${top}${gigaN ? `・ギガ・スレイブ ${(gigaN / N).toFixed(1)}回（MP ${Math.round(gigaMp / gigaN)}）` : ''}`);
      }
    }
    CH6_JOBS[0] = ['hero', '勇者'];
  }
}
console.log('■ まとめ（ボス 全部の 平均）');
for (const [k, t] of Object.entries(total)) {
  const [know, job] = k.split('|');
  console.log(`  ${know === 'true' ? '知っている' : '完全オート'} ${(JOBS[job].name).padEnd(12, '　')} 勝率 ${String(Math.round((t.w / t.n) * 100)).padStart(3)}%  平均 ${(t.sec / BOSSES.length).toFixed(0).padStart(4)}びょう`);
}
