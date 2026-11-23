// 第104回 B班: 第4幕の 鏡と月の使い（duo）・かがやきの女王ポラリス（queen）の 強さを 短く ならべる（tools/sim-ch11.mjs の 道具を 使う）
//   node tools/sim-c11d.mjs [回数] [duo|queen] … PARTY=p4,p2,… MODES=know,easy REACT=2000
//   1行に: 組・やり方・勝率・勝った 時の 分・手をつないだ 回数（前半）・八つの音・八つめの 音の 場面まで とどいた わりあい・ながされた 回数
import { c10Batch, ORDERS_OF } from './sim-ch10.mjs';
import { PARTIES9, EXTRA_PARTIES9, MODES9 } from './sim-ch9.mjs';
import './sim-ch11.mjs';

const N = Number(process.argv[2] || 20);
const boss = process.argv[3] || 'queen';
const parties = (process.env.PARTY || 'p4').split(',');
const modes = (process.env.MODES || 'know,easy').split(',');
const react = Number(process.env.REACT || 2000);
const avg = (res, k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
for (const party of parties) {
  for (const mode of modes) {
    const r = c10Batch(boss, mode, N, { party, react, order: ORDERS_OF[boss][0], ...(process.env.TAC ? { tactics: process.env.TAC } : {}) });
    const label = (PARTIES9[party] || EXTRA_PARTIES9[party]).label.trim();
    const res = r.res;
    const tail = boss === 'queen'
      ? `つなぐ${avg(res, 'qHold').toFixed(1)}(前半${avg(res, 'qHold1').toFixed(1)}) 八つの音${avg(res, 'qEight').toFixed(1)} 八つめ${(avg(res, 'qScene') * 100).toFixed(0)}% ながされ${avg(res, 'qSweep').toFixed(1)} ひとりでかがやき${avg(res, 'qLoose').toFixed(1)} のこり${(avg(res, 'qHp') * 100).toFixed(0)}%`
      : `入れかわる${avg(res, 'dSwap').toFixed(1)} われた${avg(res, 'dHit').toFixed(1)} よぶ${avg(res, 'dCall').toFixed(1)} 最大わすれ${avg(res, 'dPeak').toFixed(1)} つれていかれ${(avg(res, 'dLost') * 100).toFixed(0)}% のこり${(avg(res, 'dHp') * 100).toFixed(0)}%`;
    console.log(`${label.padEnd(10, '　')} ${MODES9[mode].label.trim().padEnd(6, '　')} ${react / 1000}秒 勝率${String(Math.round(r.rate * 100)).padStart(4)}% ${(r.sec / 60).toFixed(1)}分 ${tail}`);
  }
}
