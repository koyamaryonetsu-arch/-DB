// 時の砂時計を メニューから 使う（第6章。world/services.js の menuAction の 'timeGlass'）
// きまりは world/time-glass.js（ここは だいほんを はじめる だけ。data/story-ch6.js が time-glass.js を 読むので、
// scripts.js → story.js → story-ch6.js → time-glass.js の わに ならない ように ファイルを 分けた）
import { ScriptRun } from './scripts.js?v=39775812c9e2';
import { glassCheck, glassCompanions, shiftSteps, GLASS_TEXT } from './time-glass.js?v=39775812c9e2';

// メニューの「道具」→ 時の砂時計 →「使う」（world/services.js の menuAction から）。reply(ok, text)
export function useTimeGlass(world, s, reply) {
  const r = glassCheck(world, s);
  if (!r.ok) return reply(false, GLASS_TEXT[r.key] || GLASS_TEXT.none);
  const others = glassCompanions(world, s);
  const go = (movers) => shiftSteps(r.to, movers);
  const steps = others.length
    ? [['choice', '家族もいっしょに、時をこえる？', ['みんなで', 'ひとりで', 'やめる'], [go([s, ...others]), go([s]), []]]]
    : go([s]);
  const run = new ScriptRun(world, s, [s, ...others], steps, { scriptId: 'time_glass', owner: s });
  run.start();
  return reply(true, '');
}
