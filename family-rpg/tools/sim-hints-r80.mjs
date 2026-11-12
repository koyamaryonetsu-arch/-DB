// 第80回 E班: ボスに 負けた 時の ヒント（shared/data/boss-hints.js）が 本当に 効くかを 見る
//   「知らない 人」（しかけを 知らない。合体技は いつでも する。各 sim の skip: 'trick'）に、
//   ヒントで 教える 動きを 1つずつ 足して、勝率が 上がるかを くらべる
//   しくみ: 各 sim は 'trick' の とき b.c6NoGuard などの「しない」しるしを ぜんぶ つける。
//     ここでは Battle の prototype に「つけても 消える」しるしを おいて、ヒントの 動きだけ もどす（各 sim の ファイルは かえない）
//   つかいかた: node tools/sim-hints-r80.mjs [回数] [ボス,…|all]
//     ボス … sand gear eater pend bell zenmai（第6章）/ gate temple reef light witch shadow（第7章）/ pet jafar imps hades kamek bowser（第8章）
//   めやす: 「知らない」→「ヒント1つ」→「ヒント3まで（ぜんぶ）」で 勝率が 上がって いけば よい（docs/plan-r80-hints.md）
import { Battle } from '../public/js/shared/battle.js';
import { ch6Run, CH6_LV } from './sim-ch6.mjs';
import { ch7Run, CH7_LV } from './sim-ch7.mjs';
import { ch8Run, CH8_LV } from './sim-ch8.mjs';

// ボス → [どの sim, ヒントで 教える 動き（[しるし, ことば]）]
export const HINT_MOVES = {
  sand: ['ch6', [['c6NoIce', '氷で砂をもどす・止める'], ['c6NoGuard', '前ぶれで守る']]],
  gear: ['ch6', [['c6NoBolt', '覚えている間に雷'], ['c6NoGuard', 'プレスの前に守る']]],
  eater: ['ch6', [['c6NoLight', 'ねらったら光']]],
  pend: ['ch6', [['c6NoGuard', '見られた人・大ふりこで守る'], ['dual', '右の間は合体技をしない']]],
  bell: ['ch6', [['c6NoGuard', 'かねの前に守る'], ['c6NoBuff', '鳴ったあとに強くする'], ['dual', 'かねの近くは合体技をしない']]],
  zenmai: ['ch6', [['c6NoGear', '歯車を弱点でこわす'], ['c6NoGuard', '大ほうかいの前に守る']]],
  gate: ['ch7', [['c7NoSplit', '2ひきのHPをそろえる'], ['c6NoGuard', 'うずの前に守る'], ['dual', 'うずの近くは合体技をしない']]],
  temple: ['ch7', [['c7NoShell', '貝をこわす'], ['c6NoGuard', '大合唱の前に守る']]],
  reef: ['ch7', [['c6NoGuard', 'ほうげきの前に守る'], ['c7sNoFocus', 'のり上げに大技']]],
  light: ['ch7', [['c7sNoReach', '回復より先に手をのばす'], ['dual', '号令の前・板の間は合体技をしない']]],
  witch: ['ch7', [['c7iNoThorn', 'かべを先にこわす'], ['c6NoGuard', 'のろい・いきの前に守る']]],
  shadow: ['ch7', [['c7iNoGuardAim', 'ねらわれたら守る']]],
  pet: ['ch8', [['c8aNoQuiet', '聞き耳の間は呪文をやめる'], ['c6NoGuard', '大技の前に守る']]],
  jafar: ['ch8', [['c8aNoStaff', 'つえをこわす'], ['c8aNoCoil', 'とぐろの間は守る'], ['c8aNoLamp', 'ランプをこわす'], ['dual', 'チャンスの間だけ合体技']]],
  imps: ['ch8', [['c8bNoPlot', '相談をじゃま'], ['c8bNoOrder', 'HPをそろえる'], ['c6NoGuard', 'がったいの前に守る'], ['dual', '前ぶれの間は合体技をしない']]],
  hades: ['ch8', [['c8bNoBurn', 'けいやくに炎'], ['c8bNoChill', 'ふん火の前に氷']]],
  kamek: ['ch8', [['c8cNoAim', '魔法じんの子分をたおす'], ['dual', '合体技は魔法じんがない間']]],
  bowser: ['ch8', [['c8cNoAxe', 'オノをたたく'], ['c6NoGuard', '大技の前に守る']]],
};

const RUN = { ch6: ch6Run, ch7: ch7Run, ch8: ch8Run };
const LV = { ch6: CH6_LV, ch7: CH7_LV, ch8: CH8_LV };

// しかけの「しない」しるし（各 sim の skip: 'trick' で つく 物）
const ALL_FLAGS = ['c6NoGuard', 'c6NoIce', 'c6NoBolt', 'c6NoLight', 'c6NoBuff', 'c6NoGear', 'c7NoSplit', 'c7NoShell', 'c7sNoFocus', 'c7sNoReach',
  'c7iNoThorn', 'c7iNoGuardAim', 'c8aNoQuiet', 'c8aNoStaff', 'c8aNoCoil', 'c8aNoLamp', 'c8bNoPlot', 'c8bNoOrder', 'c8bNoBurn', 'c8bNoChill', 'c8cNoAim', 'c8cNoAxe'];

// keep … ヒントで 教えた 動き（しるしの 名前。'dual' … 合体技を「今が チャンス」の 間だけ する）
//   'dual' なし … skip: 'trick'（合体技は いつでも）で、keep の しるしだけ つかない
//   'dual' あり … skip: null（合体技の 間は 知っている 人と 同じ）で、keep に ない しるしは ぜんぶ つく
function withKept(keep, fn) {
  const dual = keep.includes('dual');
  const set = dual ? ALL_FLAGS.filter((k) => !keep.includes(k)) : keep.filter((k) => k !== 'dual');
  for (const k of set) Object.defineProperty(Battle.prototype, k, { configurable: true, get: () => dual, set: () => {} });
  try {
    return fn(dual ? null : 'trick');
  } finally {
    for (const k of set) delete Battle.prototype[k];
  }
}

export function hintRate(boss, keep, n, seed0 = 8080) {
  const [sim] = HINT_MOVES[boss];
  const lv = LV[sim][boss];
  let win = 0;
  for (let i = 0; i < n; i++) {
    const r = withKept(keep, (skip) => RUN[sim](boss, lv, true, seed0 + i * 7919, { skip }));
    if (r.outcome === 'win') win++;
  }
  return win / n;
}

if (process.argv[1].endsWith('sim-hints-r80.mjs')) {
  const N = Number(process.argv[2] || 20);
  const arg = process.argv[3] || 'sand,bell,temple,witch,hades,bowser';
  const bosses = arg === 'all' ? Object.keys(HINT_MOVES) : arg.split(',');
  const pct = (x) => `${String(Math.round(x * 100)).padStart(3)}%`;
  for (const boss of bosses) {
    const [, moves] = HINT_MOVES[boss];
    const base = hintRate(boss, [], N);
    const rows = moves.map(([k, label]) => `${label} ${pct(hintRate(boss, [k], N))}`);
    const all = moves.length > 1 ? `  ぜんぶ ${pct(hintRate(boss, moves.map(([k]) => k), N))}` : '';
    console.log(`${boss.padEnd(7)} 知らない ${pct(base)}  ＋${rows.join('  ＋')}${all}`);
  }
}
