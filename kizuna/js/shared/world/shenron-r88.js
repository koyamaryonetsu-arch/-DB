// 第88回 G9班: ドラゴンボールの 宝箱と シェンロンの ねがい（きまりと 数は data/shenron-r88.js）
//
// ・玉の 宝箱 … ふつうの 宝箱と 同じ（キャラごとに 1回）。ねがいの あと WISH_WAIT_DAYS 日は「石に なって ねむって いる」で 空っぽ
// ・さいだん … 7つ ない 時は 光る 数と、ドラゴンレーダーを 持って いれば まだの 地方。7つ ある 時は「シェンロンを よぶ？」
//   → 空が くらく なり シェンロンが 出る → 作品を えらぶ → 品を えらぶ（もどれる）→ ねがいが かなう → 玉は 空へ とびちる
//   作品・品の まどで「やめる」を えらぶと、何も かわらない（玉は なくならない）
import { ITEMS } from '../data/items.js?v=b3f22aad5877';
import { workName } from '../data/works.js?v=b3f22aad5877';
import { addItem, removeItem } from '../stats.js?v=b3f22aad5877';
import {
  DB_PLACES, dbChestId, dbChestScript, SHENRON, DRAGON_BALLS, ballsHeld, ballsAll, hasRadar, radarAreas,
  wishWaitLeft, wishWaitDays, wishWorks, wishItems, grantWish, WISH_WAIT_DAYS,
} from '../data/shenron-r88.js?v=b3f22aad5877';
import { gachaOwned } from '../data/gacha-r88.js?v=b3f22aad5877';

const SHENRON_NAME = 'シェンロン';
const note = (t) => ['say', null, t];

// ───────────── 玉の 宝箱 ─────────────
function ballChest(p) {
  return async (run) => {
    const s = run.init;
    const c = s.char;
    const w = run.world;
    const id = dbChestId(p);
    c.chests = c.chests || {};
    if (c.chests[id]) return run.runSteps([note('宝箱は空っぽだ。')]);
    const left = wishWaitLeft(c, w.now());
    if (left > 0) {
      return run.runSteps([note(`宝箱は空っぽだ。\nドラゴンボールは石になって、まだどこかでねむっているらしい。\n（あと${wishWaitDays(left)}日くらい）`)]);
    }
    c.chests[id] = true;
    addItem(c, p.item, 1);
    w.sendSelf(s);
    w.markDirty();
    return run.runSteps([
      ['sfx', 'chest'], ['chestOpen', id],
      note(`${c.name}は宝箱を開けた！\n${ITEMS[p.item].name}を手に入れた！`),
      ...(ballsAll(c) ? [note('ドラゴンボールが7つそろった！\n玉が、いっせいにぴかぴか光っている…！')] : []),
    ]);
  };
}

// ───────────── シェンロンの さいだん ─────────────
async function altarTalk(run) {
  const c = run.init.char;
  const n = ballsHeld(c);
  if (n < DRAGON_BALLS.length) {
    const steps = [note('石のさいだんだ。\n7つのくぼみのまわりに、長い竜がまきついた絵がきざまれている。')];
    steps.push(note(n ? `${c.name}の持っているドラゴンボールが、${n}つ、かすかに光った。\n（ドラゴンボール ${n}/7）` : '「7つの玉をそろえし者の、ねがいを1つかなえる」と書いてある。'));
    const left = wishWaitLeft(c, run.world.now());
    if (left > 0) steps.push(note(`ドラゴンボールは、石になってねむっている。\nまた集められるのは、${wishWaitDays(left)}日くらいあとだ。`));
    else if (hasRadar(c)) {
      const areas = radarAreas(c);
      if (areas.length) steps.push(['sfx', 'cursor'], note(`ドラゴンレーダーが、ピコピコと鳴った！\nまだ見つけていない玉は…\n${areas.join('・')}のあたりだ。`));
    }
    return run.runSteps(steps);
  }
  return run.runSteps([
    note('石のさいだんだ。\n7つのくぼみに、ドラゴンボールが、いっせいに光り始めた！'),
    ['choice', 'シェンロンをよびますか？', ['よぶ', 'やめる'], [
      [['call', summon]],
      [note('ドラゴンボールの光が、しずかに消えた。')],
    ]],
  ]);
}

// シェンロンが 出る（空が くらく なる → 地ひびき → 光の 柱から 竜）
async function summon(run) {
  const actor = { sprite: 'r88_shenron', x: SHENRON.x + 0.5, y: SHENRON.y - 1.6, dir: 'down' };
  await run.runSteps([
    ['bgm', null], ['night', true], ['sfx', 'rumble'], ['shake'],
    note('「いでよ、シェンロン！そして、ねがいをかなえたまえ！」\n空が、みるみる暗くなっていく…！'),
    ['look', SHENRON.x + 0.5, SHENRON.y - 1.5], ['flash'], ['sfx', 'thunder'],
    ['actor', 'r88_shenron', actor],
    ['bgm', 'boss'],
    ['say', SHENRON_NAME, 'さあ、ねがいを言え。\nどんなねがいも1つだけかなえてやろう…。'],
  ]);
  return pickWork(run);
}

// おわり（シェンロンが 消えて、空が 明るく なる）
function farewell(text) {
  return [
    ['say', SHENRON_NAME, text],
    ['flash'], ['remove', 'r88_shenron'], ['night', false], ['look'], ['bgm', 'resume'],
  ];
}

// 作品を えらぶ
async function pickWork(run) {
  const works = wishWorks();
  const c = run.init.char;
  const own = gachaOwned(c);
  const opts = works.map((w) => workName(w));
  const info = works.map((w) => {
    const list = wishItems(w);
    const got = list.filter((id) => own.has(id)).length;
    return `${workName(w)}の名品 ${list.length}こ（持っている ${got}こ）`;
  });
  return run.runSteps([
    ['choice', 'どの物語の品をねがう？', [...opts, 'やめる'], [
      ...works.map((w) => [['call', (r) => pickItem(r, w)]]),
      [...farewell('ねがいはないのか…。では、さらばだ。'), note('ドラゴンボールは、さいだんの上にのこっている。')],
    ], [...info, 'ねがいをやめる（ドラゴンボールはなくならない）']],
  ]);
}

// 品を えらぶ（「もどる」で 作品に もどる）
async function pickItem(run, work) {
  const c = run.init.char;
  const own = gachaOwned(c);
  const list = wishItems(work);
  const opts = list.map((id) => `${ITEMS[id].name}${own.has(id) ? '（持っている）' : ''}`);
  const info = list.map((id) => ITEMS[id].desc || '');
  return run.runSteps([
    ['choice', `${workName(work)}の、どの品をねがう？`, [...opts, 'もどる'], [
      ...list.map((id) => [['call', (r) => wish(r, id)]]),
      [['call', pickWork]],
    ], [...info, '物語をえらびなおす']],
  ]);
}

async function wish(run, id) {
  const s = run.init;
  const c = s.char;
  const w = run.world;
  if (!grantWish(c, id, w.now(), { addItem, removeItem })) {
    return run.runSteps(farewell('…ドラゴンボールが足りぬようだ。さらばだ。'));
  }
  w.sendSelf(s);
  w.markDirty();
  return run.runSteps([
    ['say', SHENRON_NAME, 'たやすいことだ…。'],
    ['sfx', 'key'], ['flash'],
    note(`${c.name}は、${ITEMS[id].name}を手に入れた！`),
    ...farewell('ねがいはかなえてやった。\nでは、さらばだ…。'),
    note(`7つのドラゴンボールは、空高くまい上がり、\n世界のあちこちへとびちっていった…。\n（${WISH_WAIT_DAYS}日たつと、また宝箱から見つかる）`),
  ]);
}

export const SHENRON_SCRIPTS = {
  r88_shenron: () => [['call', altarTalk]],
  ...Object.fromEntries(DB_PLACES.map((p) => [dbChestScript(p), () => [['call', ballChest(p)]]])),
};
