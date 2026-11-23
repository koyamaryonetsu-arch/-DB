// 第88回 G4班: 作品の ガチャガチャ・竜神の ほこら・試練の ごほうび（きまりと 数は data/gacha-r88.js）
//
// ・ガチャガチャ … 店の 人か 台に 話しかける → 画面（client/ui/gacha-r88.js。['ui', 'gacha', 中み]）→ 回す（svc kind:'gacha'）
//   1人ずつ（自分の お金・自分の 品）。家族で 遊んで いても、話しかけた 人だけの 画面
//   第88回 G6班（設計書 7-2）: まだ 持って いない 品だけが 出る（同じ 品は 出ない）。ぜんぶ 持って いる 作品は 回せない。
//   そろえる お金は 品の 数 × 1回の ねだん。売った・分解した 品は また 出る
// ・竜神の ほこら … 七つの玉を ぜんぶ 持って くると「引きかえますか？」→ 7つが きえて 竜神の玉
// ・試練の ごほうび … works.js の trialGift。一の試練を こえた 時（world/job-trials.js）と、もう こえて いる 人が 番人に 話した 時
import { ITEMS, SLOTS, baseItemId } from '../data/items.js?v=31ca07498b9b';
import { WORKS, workName } from '../data/works.js?v=31ca07498b9b';
import { addItem, removeItem, itemCount } from '../stats.js?v=31ca07498b9b';
import { trialsCleared } from '../data/job-trials.js?v=31ca07498b9b';
import {
  GACHA_PRICE, GACHA_PITY, GACHA_MEI_RATE, gachaWorks, gachaPool, gachaLeft, gachaPity, gachaOwned, rollGacha,
  ORB_PLACES, orbChestId, SEVEN_ORBS, RYUJIN_ORB, trialGiftOf, trialGiftFlag,
} from '../data/gacha-r88.js?v=31ca07498b9b';
// 第88回 G9班: ドラゴンボールの 宝箱と 神龍の さいだん（world/shenron-r88.js。この ファイルの だいほんと いっしょに まぜる）
import { SHENRON_SCRIPTS } from './shenron-r88.js?v=31ca07498b9b';
// 第88回 G12班: 3つの タリスマンと 聖はいの 水しょうの台（world/grail-r88.js）
import { GRAIL_SCRIPTS } from './grail-r88.js?v=31ca07498b9b';
// 第88回 G14班: 第5のせいれいのドレスの 氷の石の台（world/frozen-r88.js）
import { FROZEN_SCRIPTS } from './frozen-r88.js?v=31ca07498b9b';

const GOLD_MAX = 9999999;

// ───────────── ガチャガチャ ─────────────
// 画面に わたす 中み（作品ごとの 持って いる 数・のこりの 数・名品 かくていまでの 回数）
//   left … 名品 かくていまで あと 何回（のこりが 名品だけ・ふつうだけの 時は null）/ rest … のこりの 品の 数
export function gachaView(c) {
  const own = gachaOwned(c);
  return {
    price: GACHA_PRICE,
    rate: Math.round(GACHA_MEI_RATE * 100),
    pity: GACHA_PITY,
    gold: c?.gold || 0,
    works: gachaWorks().map((w) => {
      const p = gachaPool(w);
      const l = gachaLeft(w, own);
      return {
        id: w, name: workName(w), total: p.all.length, got: p.all.length - l.all.length, rest: l.all.length, done: !l.all.length,
        mei: p.mei.length, fu: p.fu.length, left: l.mei.length && l.fu.length ? Math.max(0, GACHA_PITY - gachaPity(c, w)) : null,
        items: p.all.map((id) => ({ id, own: own.has(id), mei: p.mei.includes(id) })),
      };
    }),
  };
}

// 回す（reply(ok, text, extra)。services.js の serviceAction から）
export function gachaAction(world, s, msg, reply) {
  const c = s.char;
  if (!c || c.species || !s.openGacha) return reply(false, '');
  if (msg.action === 'view') return reply(true, '', { gacha: gachaView(c) });
  if (msg.action !== 'spin') return reply(false, '');
  const r = gachaSpin(c, msg.work, world.rng);
  if (!r.ok) return reply(false, r.text, { gacha: gachaView(c) });
  return reply(true, r.text, { gacha: gachaView(c), got: r.got });
}

// 1回 回す（純粋な しょり。テストからも よぶ）→ { ok, text, got: { id, name, tier, rest } }（rest … のこりの 品の 数）
//   出るのは まだ 持って いない 品だけ。名品が 出ない まま 10回で 次は かならず 名品（数えるのは、名品が のこって いる 時だけ）
export function gachaSpin(c, work, rng) {
  if (typeof work !== 'string' || !WORKS[work] || !gachaPool(work).all.length) return { ok: false, text: 'その作品のガチャガチャは、まだないよ。' };
  const own = gachaOwned(c);
  const left = gachaLeft(work, own);
  if (!left.all.length) return { ok: false, text: `${workName(work)}の品は、全部そろった！\nもう回さなくてもだいじょうぶ。`, done: true };
  const gold = Number.isFinite(c.gold) ? c.gold : 0;
  if (gold < GACHA_PRICE) return { ok: false, text: `お金が足りないみたいだね。\n1回${GACHA_PRICE}ゴールドだよ。` };
  const pity = gachaPity(c, work);
  const roll = rollGacha(rng, work, pity, own);
  if (!roll || own.has(roll.id)) return { ok: false, text: 'その作品のガチャガチャは、まだないよ。' };
  c.gold = gold - GACHA_PRICE;
  c.gacha = c.gacha && typeof c.gacha === 'object' && !Array.isArray(c.gacha) ? c.gacha : {};
  // 名品が もう のこって いない 時は 数えない（あとで 名品を 売って、また 出る ように なった 時に こわれない）
  c.gacha[work] = roll.tier === 'mei' ? 0 : left.mei.length ? Math.min(GACHA_PITY, pity + 1) : pity;
  addItem(c, roll.id, 1);
  const rest = left.all.length - 1;
  const name = ITEMS[roll.id]?.name || roll.id;
  const text = rest ? `${name}を手に入れた！\n（のこり${rest}こ）` : `${name}を手に入れた！`;
  return { ok: true, text, got: { id: roll.id, name, tier: roll.tier, rest } };
}

// 画面を 開く（だいほんの 'call'。ほかの 画面と 同じく 一度 送ってから）
function openGacha(keeper) {
  return async (run) => {
    const r = await run.flush();
    if (r.aborted) return run.abort();
    const s = run.init;
    s.openGacha = true;
    run.batch.push(['ui', 'gacha', { keeper, ...gachaView(s.char) }]);
    const r2 = await run.flush();
    if (r2.aborted) run.abort();
  };
}

// 七つの玉の うわさ（まだ 見つけて いない 玉を 1つずつ じゅんに。こたえの 地名は 言わない）
function orbHint(s) {
  const c = s.char;
  const left = ORB_PLACES.filter((p) => !c.chests?.[orbChestId(p)]);
  if (!left.length) return null;
  s.orbHintIx = ((s.orbHintIx ?? -1) + 1) % left.length;
  return left[s.orbHintIx];
}

const keeperName = (run) => {
  const s = run.init;
  const map = s.map === 'south' ? 'ガチャガチャ屋のピン' : 'ガチャガチャ屋のポン';
  return map;
};

async function keeperTalk(run, machine = false) {
  const s = run.init;
  const c = s.char;
  const who = keeperName(run);
  const say = (t) => ['say', who, t];
  const steps = [];
  if (!c.flags?.r88_gacha_seen) {
    c.flags = c.flags || {};
    c.flags.r88_gacha_seen = true;
    steps.push(
      say('いらっしゃい！ここは作品のガチャガチャ。\n物語にでてくる品が、カプセルに入っているよ。'),
      say(`1回${GACHA_PRICE}ゴールド。作品を選んで回してね。\n${GACHA_PITY}回つづけて名品が出なかったら、次はかならず名品だよ！`),
      say('出てくるのは、まだ持っていない品だけ。\n全部そろうまで、同じ品は出ないからね。'),
    );
  }
  if (machine) steps.push(['say', null, 'カプセルがたくさん入った、ガチャガチャの台だ。']);
  const opts = ['回す', 'うわさを聞く', 'やめる'];
  steps.push(['choice', machine ? 'ガチャガチャを回す？' : 'どうする？', opts, [
    [['call', openGacha(who)]],
    [['call', (r) => rumor(r, who)]],
    [say('またおいでね！')],
  ]]);
  return run.runSteps(steps);
}

async function rumor(run, who) {
  const s = run.init;
  const c = s.char;
  const p = orbHint(s);
  c.flags = c.flags || {};
  c.flags.r88_orb_heard = true;
  if (!p) {
    return run.runSteps([['say', who, 'うわさの七つの玉、全部見つけたんだって？\nすごいなあ！山の上のほこらに、持っていってごらん。']]);
  }
  return run.runSteps([
    ['say', who, '七つの玉って知ってる？\n世界のあちこちに、ふしぎな玉が1つずつねむっているんだって。'],
    ['say', who, p.hint],
    ['say', who, '全部そろえると、いいことがあるらしいよ。\n…ほかのうわさは、また今度ね。'],
  ]);
}

// ───────────── 竜神の ほこら ─────────────
// 玉を 持って いる 数（ふくろと 自分の 装備）
function orbHave(c, id) {
  return itemCount(c, id) > 0 || Object.values(c.equip || {}).some((x) => x && baseItemId(x) === id);
}
// 1つ 取る（ふくろから。なければ 自分の 装備を はずして）
function takeOrb(c, id) {
  if (removeItem(c, id, 1)) return true;
  for (const sl of SLOTS) {
    if (c.equip?.[sl] && baseItemId(c.equip[sl]) === id) {
      c.equip[sl] = null;
      return true;
    }
  }
  return false;
}
export function hokoraExchange(c) {
  if (!SEVEN_ORBS.every((id) => orbHave(c, id))) return false;
  for (const id of SEVEN_ORBS) takeOrb(c, id);
  addItem(c, RYUJIN_ORB, 1);
  return true;
}
async function hokoraTalk(run) {
  const s = run.init;
  const c = s.char;
  const n = SEVEN_ORBS.filter((id) => orbHave(c, id)).length;
  const note = (t) => ['say', null, t];
  if (n < SEVEN_ORBS.length) {
    return run.runSteps([
      note('小さな石のほこらだ。\n7つのくぼみがあって、まん中に竜の絵がきざまれている。'),
      note(n ? `${c.name}の持っている玉が、${n}つ、かすかに光った。\n（七つの玉 ${n}/7）` : '「七つの玉をささげよ」と書いてある。'),
    ]);
  }
  return run.runSteps([
    note('小さな石のほこらだ。\n7つのくぼみに、持っている七つの玉が、\nいっせいに光り始めた！'),
    ['choice', '七つの玉を、竜神の玉と引きかえますか？\n（七つの玉は、なくなります）', ['引きかえる', 'やめる'], [
      [['call', (r) => hokoraDo(r)]],
      [note('玉の光が、しずかに消えた。')],
    ]],
  ]);
}
async function hokoraDo(run) {
  const s = run.init;
  const c = s.char;
  if (!hokoraExchange(c)) return run.runSteps([['say', null, '…何も起こらなかった。']]);
  run.world.sendSelf(s);
  run.world.markDirty();
  return run.runSteps([
    ['sfx', 'key'], ['flash'],
    ['say', null, '七つの玉が、くぼみにすいこまれていく…！'],
    ['say', null, `${c.name}は、${ITEMS[RYUJIN_ORB].name}を手に入れた！`],
  ]);
}

// ───────────── 試練の ごほうび（world/job-trials.js が よぶ）─────────────
// もらって いない ごほうびを わたして、知らせの 文を かえす（c を かえる）
export function trialGiftSteps(c, who) {
  const out = [];
  for (const [job, info] of Object.entries(c?.jobs || {})) {
    if (trialsCleared(job, info) < 1) continue;
    const id = trialGiftOf(job);
    const f = trialGiftFlag(job);
    if (!id || c.flags?.[f]) continue;
    c.flags = c.flags || {};
    c.flags[f] = true;
    addItem(c, id, 1);
    out.push(['sfx', 'key'], ['say', who, '一の試練をこえた者に、これをさずけよう。\n物語の主人公が持っていた品じゃ。'], ['say', null, `${c.name}は、${ITEMS[id].name}を手に入れた！`]);
  }
  return out;
}

export const GACHA_R88_SCRIPTS = {
  r88_gacha_keeper: () => [['call', (r) => keeperTalk(r, false)]],
  r88_gacha: () => [['call', (r) => keeperTalk(r, true)]],
  r88_hokora: () => [['call', hokoraTalk]],
};
// G9班: ドラゴンボールの 宝箱・神龍の さいだん
Object.assign(GACHA_R88_SCRIPTS, SHENRON_SCRIPTS);
// G12班: 聖はいの 水しょうの台
Object.assign(GACHA_R88_SCRIPTS, GRAIL_SCRIPTS);
// G14班: 第5のせいれいのドレスの 氷の石の台
Object.assign(GACHA_R88_SCRIPTS, FROZEN_SCRIPTS);
