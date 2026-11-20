// 第88回 G12班: 3つの タリスマンと 聖はい（docs/plan-r88-anime-gear.md の 5-1。設計書の「実装メモ（G12班）」）
//   鏡の湖の 東の ほとりの「水しょうの台」（data/items-r88-sailormoon.js の GRAIL_ALTAR）に、
//   3つの タリスマン（スペース・ソード・ディープ・アクア・ミラー・ガーネット・オーブ）を 持って 行くと、聖はいが あらわれる。
//   タリスマンは なくならない（引きかえ では ない）。聖はいを 持って いない 時だけ もらえる（売ったら また もらえる）
//   「持って いる」は そろいの 数え方と 同じ（ふくろ・預かり所・装備。shared/gear-r88.js の ownedIds）
//   セーブの 形は かえない（持ち物から いつでも 数える）
import { ITEMS } from '../data/items.js?v=02b3721e7c0a';
import { addItem } from '../stats.js?v=02b3721e7c0a';
import { ownedIds } from '../gear-r88.js?v=02b3721e7c0a';
import { TALISMANS, HOLY_GRAIL } from '../data/items-r88-sailormoon.js?v=02b3721e7c0a';

export const talismansOf = (c) => {
  const own = ownedIds(c);
  return TALISMANS.filter((id) => own.has(id));
};
// 聖はいを わたせるか（'ok' | 'lack' | 'have'）
export function grailState(c) {
  if (ownedIds(c).has(HOLY_GRAIL)) return 'have';
  return talismansOf(c).length >= TALISMANS.length ? 'ok' : 'lack';
}
// わたす（わたしたら true。c を かえる）
export function grantGrail(c) {
  if (grailState(c) !== 'ok') return false;
  addItem(c, HOLY_GRAIL, 1);
  return true;
}

async function altarTalk(run) {
  const s = run.init;
  const c = s.char;
  const note = (t) => ['say', null, t];
  const st = grailState(c);
  if (st === 'have') {
    return run.runSteps([note('すきとおった水しょうの台だ。\n湖の水が、月の光のように、きらきらとうつっている。'), note(`${c.name}の${ITEMS[HOLY_GRAIL].name}が、やさしく光った。`)]);
  }
  if (st === 'lack') {
    const n = talismansOf(c).length;
    return run.runSteps([
      note('すきとおった水しょうの台だ。\n3つのくぼみがあって、剣・鏡・玉の形がきざまれている。'),
      note(n ? `${c.name}の持っているタリスマンが、${n}つ、かすかに光った。\n（タリスマン ${n}/3）` : '「3つのタリスマンが、ここでめぐりあう」と書いてある。'),
    ]);
  }
  grantGrail(c);
  run.world.sendSelf(s);
  run.world.markDirty();
  return run.runSteps([
    note('すきとおった水しょうの台だ。\n持っている3つのタリスマンが、いっせいに光り始めた！'),
    ['sfx', 'sparkle'], ['flash'],
    note('剣と鏡と玉の光が、台の上で1つになっていく…！\n光の中から、金色のさかずきがあらわれた！'),
    ['sfx', 'key'],
    note(`${c.name}は、${ITEMS[HOLY_GRAIL].name}を手に入れた！\n（タリスマンは、そのまま手もとにのこった）`),
  ]);
}

export const GRAIL_SCRIPTS = {
  r88_grail: () => [['call', altarTalk]],
};
