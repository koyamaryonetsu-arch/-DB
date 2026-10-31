// 第6章 Step 5（A）: 星読みの しおりを メニューから 使う（world/services.js の menuAction の 'bookmark'）
// ・止まった時計塔の 中で「使う」と、その 階の ことを ミナモの 星読み（ミナモの 声）が 教えてくれる。1つの 階に 1回（フラグ BM(n)）
// ・もう 読んだ 階は、しおりに のこった 短い ことばだけ（なんどでも）
// ・時計塔の 外では 使えない
// だいほんを はじめるので、だいほんの しくみ scripts.js を 読む（story-ch6c.js は ここを 読まない）
import { MAPS } from '../maps/index.js?v=7040d8c7ec18';
import { BM } from '../maps/tokei.js?v=7040d8c7ec18';
import { hasKeyItem } from '../stats.js?v=7040d8c7ec18';
import { ScriptRun } from './scripts.js?v=7040d8c7ec18';
import { partyOf } from './party.js?v=7040d8c7ec18';
import { TK_HINTS, BOOKMARK } from '../data/story-ch6c.js?v=7040d8c7ec18';
// 第6章 Step 6: 6〜10階の ページ（story-ch6d.js）
import { TK6_HINTS } from '../data/story-ch6d.js?v=7040d8c7ec18';

const HINTS = { ...TK_HINTS, ...TK6_HINTS };

export const BOOK_TEXT = {
  none: '星読みのしおりを持っていない。',
  busy: '今は使えない',
  outside: '星読みのしおりを開いた…。\nしかし、星の文字は光らない。\n（止まった時計塔の中で使おう）',
};

export function useBookmark(world, s, reply) {
  if (!hasKeyItem(s.char, BOOKMARK)) return reply(false, BOOK_TEXT.none);
  if (s.busy) return reply(false, BOOK_TEXT.busy);
  const n = MAPS[s.map]?.tkFloor;
  const hint = HINTS[n];
  if (!hint) return reply(false, BOOK_TEXT.outside);
  const owner = world.hostOf?.(s) || s;
  const read = !!owner.char.flags[BM(n)];
  const steps = read
    ? [['say', null, `星読みのしおりを開いた。\nしおりに、ミナモの星読みの言葉が、うすくのこっている…。\n「${hint.short}」`]]
    : [
      ['sfx', 'sparkle'], ['flash'],
      ['say', null, '星読みのしおりを開いた。\n星の形のもようが、ぽうっと光った…！'],
      ...hint.full.map((l) => ['say', 'ミナモの声', l]),
      ['flag', BM(n)], ['sync'],
    ];
  const p = partyOf(world, s);
  const others = (p?.members || []).map((id) => world.sessions.get(id)).filter((m) => m && m !== s && m.inWorld && !m.away && !m.busy && m.map === s.map);
  const run = new ScriptRun(world, s, [s, ...others], steps, { scriptId: 'bookmark', owner });
  run.start();
  return reply(true, '');
}
