// 第78回: ゲストの 強さの きまり（shared/guest-rule.js）の 前と 後の 勝率（docs/plan-r78-guest.md）
// つかいかた: node tools/sim-guest-r78.mjs [回数] [gate,temple,reef,light,pet,jafar,imps,hades,kamek,bowser] [-5,0,8]
//   GRULE=0 … きまりの 前（minLevel と パーティーの レベル）/ ない とき … きまりの 後
//   家族の レベルは その ボスの めやすの レベル（sim-ch7.mjs の CH7_LV・sim-ch8.mjs の CH8_LV）＋ 3つめの 引数（弱め −5・ふつう 0・強め ＋8）
//   ★装備は その ボスの ころの もの（レベルだけ かえる）。それぞれ 完全オート／知らない（合体技は する）／知っている
//   ゲストの 力の 割合（ゲスト ÷ 家族の 平均。物さしは guest-rule.js の growPower〈育ちの 力〉）も 出す
import { ch7Run, ch7Party, CH7_LV, ruledGuest } from './sim-ch7.mjs';
import { ch8Run, ch8Party, CH8_LV } from './sim-ch8.mjs';
import { growPower } from '../public/js/shared/guest-rule.js';

const CH7 = { gate: 'karim', temple: 'karim', reef: 'kai', light: 'kai' };
const CH8 = { pet: 'karim', jafar: 'karim', imps: 'kai8', hades: 'kai8', kamek: 'rion8', bowser: 'rion8' };
const N = Number(process.argv[2] || 20);
const bosses = (process.argv[3] || [...Object.keys(CH7), ...Object.keys(CH8)].join(',')).split(',');
const deltas = (process.argv[4] || '-5,0,8').split(',').map(Number);
const seedOf = (i) => 8080 + i * 7919;
const pct = (w) => `${String(Math.round((w / N) * 100)).padStart(3)}%`;
console.log(`ゲスト ${process.env.GRULE === '0' ? 'きまりの 前' : 'きまりの 後'}・${N}回`);
for (const boss of bosses) {
  const ch7 = boss in CH7;
  const base = (ch7 ? CH7_LV : CH8_LV)[boss];
  for (const d of deltas) {
    const lv = base + d;
    const party = ch7 ? ch7Party(boss, lv) : ch8Party(boss, lv);
    const avg = party.reduce((s, c) => s + growPower(c), 0) / party.length;
    const g = ruledGuest(ch7 ? CH7[boss] : CH8[boss], party, lv);
    const ratio = (growPower(g.char) * g.k) / avg;
    const run = ch7 ? ch7Run : ch8Run;
    const out = [[false, null], [true, 'trick'], [true, null]].map(([know, skip]) => {
      const res = [...Array(N).keys()].map((i) => run(boss, lv, know, seedOf(i), { skip }));
      return pct(res.filter((r) => r.outcome === 'win').length);
    });
    console.log(`${boss.padEnd(7)} Lv${lv}（${d >= 0 ? '+' : ''}${d}） ゲストLv${g.char.level} 倍率${g.k.toFixed(3)} 割合${ratio.toFixed(2)}  完全オート${out[0]} 知らない${out[1]} 知っている${out[2]}`);
  }
}
