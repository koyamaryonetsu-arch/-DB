// 第88回 G14班: 4つの せいれいの しるしと 第5のせいれいのドレス（docs/plan-r88-anime-gear.md の 4-2・5-1。設計書の「実装メモ（G14班）」）
//   シロガネ地方・白銀の湖の 北の ほとりの「氷の石の台」（data/items-r88-frozen.js の FIFTH_ALTAR）に、
//   4つの せいれいの しるし（風・火・水・大地）を 持って 行くと、第5のせいれいのドレスが もらえる。
//   しるしは なくならない（引きかえ では ない）。1人 1回（もらった 記録は キャラの flags の FIFTH_FLAG。売っても もう もらえない）
//   「持って いる」は そろいの 数え方と 同じ（ふくろ・預かり所・装備。shared/gear-r88.js の ownedIds）
//   聖はいの 水しょうの台（world/grail-r88.js）と 同じ 形
import { ITEMS } from '../data/items.js?v=6a6b763889f6';
import { addItem } from '../stats.js?v=6a6b763889f6';
import { ownedIds } from '../gear-r88.js?v=6a6b763889f6';
import { SPIRIT_MARKS, FIFTH_DRESS, FIFTH_FLAG } from '../data/items-r88-frozen.js?v=6a6b763889f6';

export const marksOf = (c) => {
  const own = ownedIds(c);
  return SPIRIT_MARKS.filter((id) => own.has(id));
};
// ドレスを わたせるか（'ok' | 'lack' | 'done'）
export function dressState(c) {
  if (c?.flags?.[FIFTH_FLAG]) return 'done';
  return marksOf(c).length >= SPIRIT_MARKS.length ? 'ok' : 'lack';
}
// わたす（わたしたら true。c を かえる）
export function grantDress(c) {
  if (dressState(c) !== 'ok') return false;
  addItem(c, FIFTH_DRESS, 1);
  c.flags = c.flags || {};
  c.flags[FIFTH_FLAG] = true;
  return true;
}

const MARK_NAME = ['風', '火', '水', '大地'];

async function altarTalk(run) {
  const s = run.init;
  const c = s.char;
  const note = (t) => ['say', null, t];
  const st = dressState(c);
  if (st === 'done') {
    return run.runSteps([note('こおった湖のほとりの、氷の石の台だ。\nつめたい風が、やさしく歌っているように聞こえる。'), note(`ここで、${c.name}は${ITEMS[FIFTH_DRESS].name}をもらった。`)]);
  }
  if (st === 'lack') {
    const have = marksOf(c);
    const got = SPIRIT_MARKS.map((id, i) => (have.includes(id) ? MARK_NAME[i] : null)).filter(Boolean);
    return run.runSteps([
      note('こおった湖のほとりの、氷の石の台だ。\n風・火・水・大地の、4つのしるしがきざまれている。'),
      note(got.length ? `${c.name}の持っている${got.join('と')}のしるしが、かすかに光った。\n（せいれいのしるし ${got.length}/4）` : '「4つのせいれいがそろう時、5つめの声が聞こえる」と書いてある。'),
    ]);
  }
  grantDress(c);
  run.world.sendSelf(s);
  run.world.markDirty();
  return run.runSteps([
    note('こおった湖のほとりの、氷の石の台だ。\n持っている4つのしるしが、いっせいに光り始めた！'),
    ['sfx', 'sparkle'], ['flash'],
    note('風・火・水・大地の光が、台の上で1つになっていく…！\nどこからか、やさしい歌声が聞こえる…'),
    note('まん中に、5つめのしるしがうかび上がった！\n光の中から、白くかがやくドレスがあらわれた！'),
    ['sfx', 'key'],
    note(`${c.name}は、${ITEMS[FIFTH_DRESS].name}を手に入れた！\n（4つのしるしは、そのまま手もとにのこった）`),
  ]);
}

export const FROZEN_SCRIPTS = {
  r88_fifth: () => [['call', altarTalk]],
};
