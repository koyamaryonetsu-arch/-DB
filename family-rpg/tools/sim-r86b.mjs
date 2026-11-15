// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の 強さの しらべ（docs/plan-r86-phantom-b.md。tools/sim-r85a.mjs と おなじ やり方）
// 第2部の ボス（tools/sim-ch7.mjs・sim-ch8.mjs）で、家族の 1人（勇者の ところ）を この 2つの 幻と、
// 今の 幻の職業（攻めの 幻: 天下むそうの剣聖・はかいと創造の神・伝説の超勇者／魔法や 補助の 幻: 大魔導王・銀河の女王・天候の神）・
// もとの 4つの 伝説（魔界の王の子・飛竜しょう天はの達人・ドラまた・ほう神の大軍師）に 入れかえて くらべる。
// 勝率と 長さが 今の 幻と ±10% くらいに おさまるか・もとの 伝説より 強いか・完全オートで 勝てる ように なって いないかを 見る。
// ★装備は 勇者の 物を そのまま（その 職業が 装備 できない 所は 店の いちばん よい 品）
// つかいかた: node tools/sim-r86b.mjs [回数] [ボス,…] [職業,…]
//   ボス: ch7 … gate temple reef light witch shadow / ch8 … pet jafar imps hades kamek bowser
//   KNOW=0 … 完全オート（しかけを 知らない ふつうの オート）だけ / KNOW=1 … 知っている 人だけ（ない ときは 両方）
//   R86B_AI=tele:0.4,mahou:0 など … オートが 技を えらぶ わりあい（battle-r86b.js の R86B_AI）を かえて ためす
//   USES=1 … 入れかえた 人が 使った 技の 回数も 出す（1戦の 平均）・れい丸が もどった 回数・太極・ギガ・スレイブの MP
import { CH6_JOBS } from './sim-ch6.mjs';
import { ch7Run, CH7_LV, CH7_KIT } from './sim-ch7.mjs';
import { ch8Run, CH8_LV, CH8_KIT } from './sim-ch8.mjs';
import { canEquip } from '../public/js/shared/stats.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { Battle } from '../public/js/shared/battle.js';
import * as R86B from '../public/js/shared/battle-r86b.js';

for (const kv of (process.env.R86B_AI || '').split(',').filter(Boolean)) {
  const [k, v] = kv.split(':');
  R86B.R86B_AI[k] = Number(v);
}

const N = Number(process.argv[2] || 10);
const BOSSES = (process.argv[3] || 'temple,witch,shadow,jafar,hades,bowser').split(',');
const LIST = (process.argv[4] || 'tenkaichi_king,chaos_gunshi,sword_saint,chaos_creator,super_hero,grand_magus,galaxy_queen,weather_god,makai_prince,hiryu_master,doramata,hoshin_gunshi').split(',');
const MODES = process.env.KNOW === '0' ? [false] : process.env.KNOW === '1' ? [true] : [true, false];
const C7 = new Set(Object.keys(CH7_LV));

const uses = {};
let back = 0, giga = 0, gigaMp = 0, top = 0;
if (process.env.USES) {
  const emit = Battle.prototype.emit;
  Battle.prototype.emit = function (ev) {
    const me = this.allies[0];
    if (ev.t === 'act' && me) {
      if (ev.id === me.id) {
        uses[ev.name || '?'] = (uses[ev.name || '?'] || 0) + 1;
        if (ev.r86bGiga) { giga++; gigaMp += ev.r86bGiga.used; }
        if (ev.r85aHaya) uses['（早口）'] = (uses['（早口）'] || 0) + 1;
        for (const r of ev.results || []) if (r.dmg > top && this.get(r.id)?.side === 'enemy') top = r.dmg;
      }
      if ((ev.r86bReiBack || []).includes(me.id)) back++;
      if (ev.r86bReiHiryu?.by === me.id) uses['（れい丸・しょう天は 決まった）'] = (uses['（れい丸・しょう天は 決まった）'] || 0) + 1;
      if ((ev.r84bHiryuRet || []).some((x) => x.by === me.id) && ev.r86bReiHiryu?.by !== me.id) uses['（飛竜しょう天は 決まった）'] = (uses['（飛竜しょう天は 決まった）'] || 0) + 1;
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
      back = 0; giga = 0; gigaMp = 0; top = 0;
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
        console.log('    ' + Object.entries(uses).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}×${(v / N).toFixed(1)}`).join('  '));
        console.log(`    いちばん 大きい 1発 ${top}・れい丸が もどった ${(back / N).toFixed(1)}回${giga ? `・太極・ギガ・スレイブ ${(giga / N).toFixed(1)}回（MP ${Math.round(gigaMp / giga)}）` : ''}`);
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
