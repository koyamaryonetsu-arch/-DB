// 第53回 B: 第6章クリアの あとの「止まった時の間」の 時のまぼろし（docs/plan-ch6.md の 13-3・16・17）
// ・きまった 戦い toki_phantom（data/encounters-tokei6.js）。敵は 1日ごとに 第6章の ボスの どれか（tokiPhantomBase。日本の 0時に かわる）
// ・勝つと、その 日 はじめての 勝ちなら ★5の 素材（data/items-tokei6.js の TOKI_PHANTOM_REWARD）。1日1回・キャラごと
//   キャラの きろく: c.tokiPhantom = { day: 'YYYY-MM-DD'（さいごに ごほうびを もらった 日）, wins: 勝った 数 }
// ・その キャラが はじめて 勝った 時は 家族の けいじ板へ（world.boardPost。kind 'toki_phantom'。勝ち方は「見る」で）
// ・A の 台本は ['battle', 'toki_phantom'] でも、['call', tokiPhantomRun]（今日の 相手と ごほうびの ようすを 言ってから えらぶ）でも よい
import { ITEMS } from '../data/items.js';
import { MONSTERS } from '../data/monsters.js';
import { addItem } from '../stats.js';
import { dayKeyOf, tokiPhantomBase } from '../data/encounters-tokei6.js';
import { tokiPhantomId } from '../data/monsters-tokei6.js';
import { TOKI_PHANTOM_REWARD } from '../data/items-tokei6.js';
import { familyChar, BOARD_KINDS } from './family-board.js';

export const TOKI_PHANTOM_ENC = 'toki_phantom';
// けいじ板の 小さな 札（family-board.js の boardRows が BOARD_KINDS を 見る。A の 行と かさならない ように ここで 足す）
BOARD_KINDS.toki_phantom = BOARD_KINDS.toki_phantom || '時のまぼろし';

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
// キャラの きろく（こわれて いれば 空から）
export function tokiState(c) {
  const s = isObj(c?.tokiPhantom) ? c.tokiPhantom : {};
  return { day: typeof s.day === 'string' ? s.day.slice(0, 10) : '', wins: Number.isFinite(s.wins) && s.wins > 0 ? Math.floor(s.wins) : 0 };
}
// 今日の ごほうびを もう もらったか
export const tokiPhantomDone = (c, now) => tokiState(c).day === dayKeyOf(now);
// 今日の 相手（{ base … もとの ボス, id … まぼろしの 魔物, name }）
export function tokiPhantomToday(now) {
  const base = tokiPhantomBase(now);
  const id = tokiPhantomId(base);
  return { base, id, name: MONSTERS[id]?.name || '' };
}

// 戦いの おわり（world/battles.js の finishBattle）。perSession … けっかの まどの 行
export function tokiPhantomAfter(world, ctx, sessions, perSession, outcome) {
  if (ctx?.opts?.fixed !== TOKI_PHANTOM_ENC || outcome !== 'win') return;
  const now = world.now();
  const day = dayKeyOf(now);
  const foe = ctx.battle.enemies.find((e) => e.boss) || ctx.battle.enemies[0];
  const { id, n } = TOKI_PHANTOM_REWARD;
  const names = sessions.map((m) => m.char?.name).filter(Boolean);
  for (const m of sessions) {
    const c = m.char;
    if (!c || c.species) continue;
    const L = (perSession[m.id] = perSession[m.id] || { lines: [] }).lines;
    const st = tokiState(c);
    const first = st.wins === 0;
    if (st.day !== day) {
      addItem(c, id, n);
      st.day = day;
      L.push(`★ ${c.name}は${ITEMS[id].name}を${n}つ手に入れた！（時のまぼろしのごほうびは、1日1回）`);
    } else L.push('（今日の時のまぼろしのごほうびは、もうもらった。また明日！）');
    st.wins++;
    c.tokiPhantom = st;
    if (first && familyChar(world, c)) {
      const with_ = names.length > 1 ? `${names.join('と')}で` : `${c.name}ひとりで`;
      try {
        world.boardPost?.({
          kind: 'toki_phantom', by: c.name, charId: c.id,
          title: `${c.name}が時のまぼろしに勝った！`,
          detail: `${with_}、${foe?.name || '時のまぼろし'}に勝った。（Lv${c.level}）\n時のまぼろしは、日ごとに、すがたがかわる。勝つと、1日1回、${ITEMS[id].name}がもらえる。`,
        });
      } catch { /* けいじ板が なくても 戦いの おわりは とめない */ }
    }
  }
  world.markDirty?.();
}

// A の 台本から よべる（['call', tokiPhantomRun]）: 今日の 相手と ごほうびの ようすを 言ってから、戦うか えらぶ
const note = (text) => ['say', null, text];
export async function tokiPhantomRun(run) {
  const c = run.init.char;
  const now = run.world.now();
  const t = tokiPhantomToday(now);
  const steps = [note(`止まった時の間に、${t.name}が、ゆらゆらとうかんでいる…！`)];
  if (tokiPhantomDone(c, now)) steps.push(note('（今日のごほうびは、もうもらった。戦うことはできるが、ごほうびは、また明日）'));
  else steps.push(note('（勝つと、1日に1回、ごほうびがもらえるようだ…）'));
  steps.push(['choice', `${t.name}と戦う？`, ['戦う', 'やめる'], [
    [['sfx', 'encounter'], ['battle', TOKI_PHANTOM_ENC]],
    [note('…まぼろしは、しずかにゆれている。')],
  ]]);
  return run.runSteps(steps);
}
