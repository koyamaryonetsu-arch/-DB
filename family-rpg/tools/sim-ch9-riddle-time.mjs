// 第92回 B班: なぞの番人 ナゾカケの「時間切れ」までの 本当の 時間を はかる（docs/plan-part3.md の 11-4。小さい 子が 読んで 答える 間）
// ブラウザの はじめの 設定（戦いの 速さ 0.85・文字の 速さ 0.8）で、なぞが 出てから 時間切れまでの ミリびょう・
// その 間に 人が 動かす キャラ（先頭の 1人）の 番が 何回 来るか を 出す。だれも 答えない（完全オート）
// つかいかた: node tools/sim-ch9-riddle-time.mjs [回数] [PARTY…]
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ch9Allies } from './sim-ch9.mjs';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { C9C_BATTLE } from '../public/js/shared/data/c9c-names-b.js';
import { addSpica } from '../public/js/shared/battle-c9a.js';

export function riddleTimes(seed, party = 'p4', { speed = 0.85, textSpeed = 0.8 } = {}) {
  const list = ch9Allies('riddle', 101, party);
  const allies = list.map((x) => (x.know
    ? { char: x.char, kind: 'player', controller: 'sim', auto: true, tactics: 'balanced' }
    : { char: x.char, kind: x.monster ? 'monster' : 'support', auto: true, tactics: x.char.tactics || 'balanced' }));
  const group = FIXED_ENCOUNTERS[C9C_BATTLE.riddle].group.flatMap(([sp, n]) => Array(n).fill(sp));
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group, speed, textSpeed });
  addSpica(b);
  const out = [];
  let t0 = null, turns = 0, real = 0;
  const me = b.allies[0].id;
  while (!b.over && real < 20 * 60 * 1000 && out.length < 6) {
    for (const e of b.tick(50)) {
      if (e.t === 'act' && e.c9zRiddle && !e.c9zTimeout) { t0 = real; turns = 0; }
      if (e.t === 'act' && e.id === me && t0 != null) turns++;
      if (e.t === 'act' && e.c9zTimeout && t0 != null) { out.push({ ms: real - t0, turns }); t0 = real; turns = 0; }
    }
    real += 50;
  }
  return out;
}

if (process.argv[1]?.endsWith('sim-ch9-riddle-time.mjs')) {
  const N = Number(process.argv[2] || 10);
  for (const party of process.argv.slice(3).length ? process.argv.slice(3) : ['p4', 'k1npc']) {
    const all = [];
    for (let i = 0; i < N; i++) all.push(...riddleTimes(7000 + i * 31, party));
    all.sort((a, b) => a.ms - b.ms);
    const ms = all.map((x) => x.ms);
    const avg = ms.reduce((s, v) => s + v, 0) / Math.max(1, ms.length);
    console.log(`${party}: なぞ ${ms.length}こ  時間切れまで 最短 ${(ms[0] / 1000).toFixed(1)}秒・平均 ${(avg / 1000).toFixed(1)}秒・下から1わり ${(ms[Math.floor(ms.length * 0.1)] / 1000).toFixed(1)}秒  その間の 自分の 番 最少 ${Math.min(...all.map((x) => x.turns))}回`);
  }
}
