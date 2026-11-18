// 第88回 G16班: ポケモン
//   品の 数・名前が かぶらない・全部の 品に 手に入れ方が ある・ボールの 生まれ変わり（仲間に なりやすさ）・ジムバッジの しょう号・
//   経験値と お金（がくしゅうそうち・おまもりこばん）・オボンのみ・いのちのたま・しんかのきせき・使う 品・
//   曜日の ジムリーダー 7人・チャンピオンの じょうけん・ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS_R88_POKEMON, GYM_BADGES, PK_BALLS, PK_MASTERBALL } from '../public/js/shared/data/items-r88-pokemon.js';
import { setTitles } from '../public/js/shared/gear-r88.js';
import { pkExpMult, pkGoldMult, ballBefriendMult, pkWearAdd } from '../public/js/shared/gear-r88-pokemon.js';
import { rebirthOf, upgradeCost } from '../public/js/shared/data/forge.js';
import { upgradeId } from '../public/js/shared/data/items-forge.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN, GACHA_PRICE } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc, rivalOpen, doorOf, weekdayOf, rivalToday, dailyRivalOf, WEEKDAY_NAMES } from '../public/js/shared/data/rivals-r88.js';
import { doorOpen, rivalPaper, rivalButtons, rivalNeedLack, rivalReady, rivalRec } from '../public/js/shared/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot, tickN } from './helpers.js';

const W = 'pokemon';
const ids = () => Object.keys(ITEMS).filter((id) => ITEMS[id].work === W && !ITEMS[id].base);
const mine = () => ids().filter((id) => ITEMS[id].src === 'r88');
const STONES = ['fire_stone', 'water_stone', 'thunder_stone', 'moon_stone'];
// 日本の 日付（2026-11-16 は 月曜。正午）
const DAY = (d) => Date.UTC(2026, 10, 15 + d, 3);
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars, enemies = ['rockman', 'rockman']) {
  const b = new Battle({ rng: makeRng(16), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const useGear = (b, me, slot) => {
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${slot}` }, ev);
  return ev;
};

// ───────────── 品 ─────────────
test('G16: 品の 数（39）・今 ある 進化の 石 4つも 作品の 品（強さ・手に入れ方は そのまま）', () => {
  assert.equal(WORKS.pokemon.name, 'ポケモン');
  assert.equal(Object.keys(ITEMS_R88_POKEMON).length, 39);
  assert.equal(mine().length, 39);
  assert.deepEqual(ids().filter((id) => ITEMS[id].src !== 'r88').sort(), [...STONES].sort());
  for (const id of STONES) {
    assert.ok(ITEMS[id].r88Tag, id);
    assert.equal(ITEMS[id].type, 'use', '使う 品の まま');
    assert.equal(gachaBlock(id), 'grade', 'ガチャには 出ない');
  }
  for (const id of mine()) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 伝説は 3つ（マスターボール・メガリング・せいなる灰）
  assert.deepEqual(mine().filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_pk_hai', 'r88_pk_masterball', 'r88_pk_megaring']);
  assert.equal(GYM_BADGES.length, 8);
  for (const id of GYM_BADGES) assert.equal(ITEMS[id].type, 'acc', id);
});

test('G16: 名前が かぶらない（今 ある 品・技とも）。ボールは ポケモンマスターの 技と べつ。せいなる灰は 聖はいと まぎれない', () => {
  const my = new Set(mine());
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !my.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_pk_/.test(id)).map(([, a]) => a.name));
  const names = [...my].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_pk_/.test(id)).map((id) => ABILITIES[id].name);
  assert.equal(myAb.length, 4);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n) && !abNames.has(n), `技 ${n}`);
  assert.equal(ABILITIES.pk_ball.name, 'モンスターボール');
  assert.equal(ABILITIES.pk_masterball.name, 'マスターボール');
  assert.equal(ITEMS.r88_pk_ball.name, 'からのモンスターボール');
  assert.equal(ITEMS[PK_MASTERBALL].name, 'むらさきのマスターボール');
  assert.equal(ITEMS.r88_pk_hai.name, 'せいなる灰');
  assert.ok(Object.values(ITEMS).some((it) => it.name === '聖はい'), 'セーラームーンの 聖はいは べつに ある');
});

test('G16: 手に 入らない 品は ない（店・ガチャ・ライバル・試練・生まれ変わり・宝の洞窟の いちばん おく）', () => {
  const shop = new Set(Object.values(SHOPS).flatMap((s) => shopItems(s, () => true)));
  const trial = new Set(Object.values(WORKS).flatMap((w) => Object.values(w.trialGift || {})));
  const rival = new Set(rivalsOf(W).flatMap((rv) => rv.reward));
  const pool = new Set(gachaPool(W).all);
  for (const id of mine()) {
    const how = [shop.has(id) && '店', pool.has(id) && 'ガチャ', rival.has(id) && 'ライバル', trial.has(id) && '試練',
      TM_R88_DEN.includes(id) && '宝', Object.values(REBIRTH).some((r) => r.to === id) && '生まれ変わり'].filter(Boolean);
    assert.ok(how.length, `${id}: 手に入れ方が ない`);
    if (ITEMS[id].grade === 'den') assert.ok(how.some((h) => ['ライバル', '宝', '生まれ変わり'].includes(h)), `${id}: ${how}`);
  }
  // ライバルが くれない 伝説（メガリング・せいなる灰）は 宝の洞窟の いちばん おく
  for (const id of ['r88_pk_megaring', 'r88_pk_hai']) assert.ok(TM_R88_DEN.includes(id), id);
  assert.ok(!TM_R88_DEN.includes(PK_MASTERBALL), 'マスターボールは チャンピオンが くれる');
});

// ───────────── ボール ─────────────
test('G16: ボール … からのモンスターボール → スーパーボール → ハイパーボール。仲間に なりやすさが 上がる。マスターボールが いちばん', () => {
  const [b1, b2, b3] = PK_BALLS;
  assert.equal(rebirthOf(b1).to, b2);
  assert.equal(rebirthOf(b2).to, b3);
  assert.equal(rebirthOf(b3), null, 'ハイパーボールで おわり');
  for (const id of [b1, b2]) {
    const rb = rebirthOf(id);
    const cost = upgradeCost(upgradeId(id, rb.at), null);
    assert.ok(cost.reborn, `${id}: +${rb.at} の 次で 生まれ変わる`);
  }
  const k = [b1, b2, b3, PK_MASTERBALL].map((id) => ITEMS[id].befriend);
  for (let i = 1; i < k.length; i++) assert.ok(k[i] > k[i - 1], `だんだん 強い ${k}`);
  for (const id of [...PK_BALLS, PK_MASTERBALL]) assert.equal(ITEMS[id].cat, 'boomerang', id);
  // 戦いの 味方の 武器（きたえた 物も）。いちばん 大きい 1つ分
  assert.equal(ballBefriendMult([{ weaponId: null }]), 1);
  assert.equal(ballBefriendMult([{ weaponId: b1 }]), ITEMS[b1].befriend);
  assert.equal(ballBefriendMult([{ weaponId: upgradeId(b2, 2) }, { weaponId: b1 }]), ITEMS[b2].befriend);
  assert.equal(ballBefriendMult([{ weaponId: PK_MASTERBALL }, { weaponId: b3 }]), ITEMS[PK_MASTERBALL].befriend);
  // ポケモンマスターは ボールを 持てる（ブーメラン）・伝説の ボールは ブーメランの いちばんと ならぶ
  const pm = hero('poke_master', 90);
  pm.equip.weapon = PK_MASTERBALL;
  assert.ok(computeStats(pm).atk > 0);
});

// ───────────── ジムバッジ ─────────────
test('G16: ジムバッジ 8つ … 1つずつ 小さな 力・持って いる 数で しょう号', () => {
  assert.deepEqual(GEAR_SETS.gym_badge.items, GYM_BADGES);
  for (const id of GYM_BADGES) assert.equal(ITEMS[id].set, 'gym_badge', id);
  const c = hero();
  for (const id of GYM_BADGES) {
    const it = ITEMS[id];
    assert.ok(Object.keys(it.bonus || {}).length + (it.fx || []).length === 1, `${id}: 小さな 力 1つ`);
  }
  const titles = () => setTitles(c).filter((t) => t.set === 'gym_badge').map((t) => t.title);
  for (const id of GYM_BADGES.slice(0, 2)) addItem(c, id, 1);
  assert.deepEqual(titles(), []);
  addItem(c, GYM_BADGES[2], 1);
  assert.deepEqual(titles(), ['ジムめぐりのトレーナー']);
  c.bank = { gold: 0, items: GYM_BADGES.slice(3, 7).map((id) => ({ id, n: 1 })) }; // 預かり所でも よい
  c.equip.acc = GYM_BADGES[7];
  assert.ok(titles().includes('ポケモンリーグのちょうせん者'));
});

// ───────────── 経験値と お金 ─────────────
test('G16: がくしゅうそうち（経験値 2わり）・おまもりこばん（お金 5わり）… つけた 人だけ・重ねても ふえない', () => {
  const c = hero();
  assert.equal(pkExpMult(c), 1);
  assert.equal(pkGoldMult(c), 1);
  c.equip.acc = 'r88_pk_gakushu';
  assert.equal(pkExpMult(c), 1.2);
  assert.equal(pkGoldMult(c), 1);
  c.equip.acc = 'r88_pk_koban';
  assert.equal(pkGoldMult(c), 1.5);
  assert.equal(pkExpMult(c), 1);
  assert.equal(pkGoldMult({ species: 'slime', equip: { acc: 'r88_pk_koban' } }), 1, '魔物の 仲間は べつ');
});

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const sym = (group) => ({ id: 'g16' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false });
async function winOnce(world, bot, group) {
  const ctx = startFieldBattle(world, bot.s, sym(group));
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
  ctx.battle.checkEnd();
  for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
  bot.flushQueue?.();
  return bot.msgs.filter((m) => m.t === 'battleEnd').pop();
}
test('G16: 戦いの ごほうび … つけた 人の 経験値・お金が ふえる（けっかの 行にも 出る）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(16), rateLimit: false });
  const bot = new Bot(world, 'ナナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(15) - c.exp);
  c.hp = computeStats(c).maxHp;
  Object.assign(bot.s, { map: 'overworld', x: FIELD.x, y: FIELD.y });
  const run = async () => {
    const e0 = c.exp, g0 = c.gold;
    const end = await winOnce(world, bot, ['wolf', 'wolf']);
    return { exp: c.exp - e0, gold: c.gold - g0, lines: end.lines };
  };
  const base = await run();
  assert.ok(base.exp > 0 && base.gold > 0);
  c.equip.acc = 'r88_pk_gakushu';
  const e = await run();
  assert.equal(e.exp, Math.round(base.exp * 1.2));
  assert.equal(e.gold, base.gold);
  assert.ok(e.lines.some((l) => l.includes('がくしゅうそうちでふえた')), e.lines.join('/'));
  c.equip.acc = 'r88_pk_koban';
  const g = await run();
  assert.equal(g.gold, Math.round(base.gold * 1.5));
  assert.equal(g.exp, base.exp);
  assert.ok(g.lines.some((l) => l.includes('おまもりこばんでふえた')), g.lines.join('/'));
});

// ───────────── オボンのみ・いのちのたま・しんかのきせき ─────────────
// 本当の 行動の じゅん番（executeNext）で 動かす。pred が true に なるか、ms を すぎるまで
function runUntil(b, pred, ms = 20000) {
  for (let t = 0; t < ms && !b.over; t += 50) {
    b.tick(50);
    if (pred()) return true;
  }
  return false;
}
test('G16: オボンのみ … HPが 半分を 切ると、行動の おわりに 自分で 食べて 回復（1つの 戦いで 1回）', () => {
  const c = hero();
  c.equip.acc = 'r88_pk_oboni';
  const b = fight([c, hero()]);
  const [me, other] = b.allies;
  // 半分より 上なら 食べない（敵が 何回か 動いても）
  me.hp = Math.ceil(me.maxHp * 0.6);
  const lines = [];
  const seen = () => { for (const e of b.flush?.() || []) lines.push(...(e.lines || [])); return false; };
  void seen;
  runUntil(b, () => false, 3000);
  assert.equal(me.hp, Math.ceil(me.maxHp * 0.6));
  assert.ok(!me.pkBerryUsed);
  // 半分を 切ると、だれかの 行動の おわりに 食べる
  me.hp = Math.floor(me.maxHp * 0.3);
  const hp0 = me.hp;
  assert.ok(runUntil(b, () => me.pkBerryUsed), '食べた');
  assert.equal(me.hp, hp0 + Math.round(me.maxHp * 0.25));
  // 2回めは ない
  me.hp = 10;
  runUntil(b, () => false, 3000);
  assert.equal(me.hp, 10);
  // つけて いない 人は 食べない
  other.hp = 10;
  runUntil(b, () => false, 2000);
  assert.ok(!other.pkBerryUsed && other.hp === 10);
});

test('G16: いのちのたま … 力と 魔力が 上がり、敵に 攻撃する たびに HPが 少し へる（1より 下がらない）', () => {
  const c = hero();
  const st0 = computeStats(c);
  c.equip.acc = 'r88_pk_inochi';
  const st = computeStats(c);
  assert.ok(st.str > st0.str && st.mag > st0.mag);
  const b = fight([c]);
  const me = b.allies[0];
  const act = (cmd) => {
    assert.ok(runUntil(b, () => me.ready), 'じゅん番');
    const n = (b.log || []).length;
    b.enqueue(me, cmd);
    runUntil(b, () => !me.queued && b.lock <= 0, 8000);
    return n;
  };
  const hp0 = me.hp;
  act({ type: 'attack', target: b.enemies[0].id });
  assert.equal(me.hp, hp0 - Math.round(me.maxHp * 0.1));
  me.hp = 1;
  act({ type: 'attack', target: b.enemies[0].id });
  assert.equal(me.hp, 1, 'HPは 1より 下がらない');
  // 身を 守るだけでは へらない
  me.hp = 100;
  act({ type: 'defend' });
  assert.equal(me.hp, 100);
});

test('G16: きあいのタスキ … HPが 満タンの 時だけ、たおれる ダメージを 受けても HP1 で のこる（1つの 戦いで 1回。ふんばると 同じ 数え方）', () => {
  const c = hero();
  c.equip.acc = 'r88_pk_tasuki';
  const b = fight([c]);
  const me = b.allies[0];
  const foe = b.enemies[0];
  const hit = () => { const ev = { lines: [], upd: [], results: [] }; b.damage(foe, me, me.maxHp * 3, ev, { element: 'phys' }); return ev; };
  // 満タンでなければ たおれる
  me.hp = me.maxHp - 1;
  hit();
  assert.equal(me.hp, 0);
  assert.ok(!me.r88Endured);
  // 満タンなら HP1
  me.hp = me.maxHp; me.alive = true;
  const ev = hit();
  assert.equal(me.hp, 1);
  assert.ok(ev.lines.join('').includes('きあいのタスキでもちこたえた'), ev.lines.join('/'));
  // 2回めは ない（また 満タンでも）
  me.hp = me.maxHp;
  hit();
  assert.equal(me.hp, 0);
  // ふんばる（G13班の endure）と 同じ しるし
  assert.ok(me.r88Endured);
});

test('G16: しんかのきせき … 基本職・上級職の 人だけ 守りが 大きく 上がる（超級職・伝説では 効かない）', () => {
  for (const [job, ok] of [['warrior', true], ['paladin', true], ['hero', false], ['poke_master', false]]) {
    const c = hero(job, 50);
    const d0 = computeStats(c).dfn;
    c.equip.acc = 'r88_pk_kiseki';
    const d1 = computeStats(c).dfn;
    if (ok) {
      assert.ok(d1 >= d0 + 40, `${job}: ${d0} → ${d1}`);
      assert.deepEqual(pkWearAdd(c), ITEMS.r88_pk_kiseki.pkEvo);
    } else {
      assert.equal(d1, d0, job);
      assert.deepEqual(pkWearAdd(c), {});
    }
  }
});

test('G16: こだわり 3つ・いのちのたま … 上がる 所と 下がる 所', () => {
  for (const [id, up, down] of [['r88_pk_hachimaki', 'str', 'mag'], ['r88_pk_megane', 'mag', 'str'], ['r88_pk_scarf', 'agi', 'str']]) {
    assert.ok(ITEMS[id].bonus[up] > 0 && ITEMS[id].bonus[down] < 0, id);
  }
});

// ───────────── 使う ─────────────
test('G16: 使う 品は 戦いで 動く（1回・MPなし）。Zリング・メガリング・せいなる灰・ピッピにんぎょう', () => {
  const list = mine().filter((id) => ITEMS[id].use).sort();
  assert.deepEqual(list, ['r88_pk_hai', 'r88_pk_megaring', 'r88_pk_pippi', 'r88_pk_zring']);
  for (const id of list) {
    const c = hero();
    c.equip.acc = id;
    const b = fight([c, hero()]);
    const me = b.allies[0];
    if (id === 'r88_pk_hai') { b.allies[1].hp = 0; b.allies[1].alive = false; }
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    me.mp = Math.max(0, me.mp - 50);
    const mp = me.mp;
    useGear(b, me, u.slot);
    assert.ok(me.mp >= mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    if (id !== 'r88_pk_pippi') assert.ok(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), `${id}: 2回めは だめ`);
  }
  // Zリング: 次の 攻撃が とても 強い
  const z = hero();
  z.equip.acc = 'r88_pk_zring';
  const bz = fight([z]);
  useGear(bz, bz.allies[0], 'use_acc');
  assert.ok(bz.allies[0].charge >= 2);
  // メガリング: 力・守り・素早さ
  const m = hero();
  m.equip.acc = 'r88_pk_megaring';
  const bm = fight([m]);
  useGear(bm, bm.allies[0], 'use_acc');
  for (const s of ['atk', 'def', 'agi']) assert.ok(bm.allies[0].buffs[s]?.mult > 1, s);
  // せいなる灰: たおれた 仲間 全員を 生き返らせて まんたん
  const h = hero();
  h.equip.acc = 'r88_pk_hai';
  const bh = fight([h, hero(), hero()]);
  for (const x of bh.allies.slice(1)) { x.hp = 0; x.alive = false; }
  useGear(bh, bh.allies[0], 'use_acc');
  for (const x of bh.allies.slice(1)) assert.ok(x.alive && x.hp === x.maxHp, 'まんたん');
  // ピッピにんぎょう: かならず にげられる・にげられない 戦い（ボス）は だめ
  const p = hero();
  p.equip.acc = 'r88_pk_pippi';
  const bp = fight([p]);
  useGear(bp, bp.allies[0], 'use_acc');
  assert.equal(bp.pendingEnd?.outcome, 'flee');
  const bb = new Battle({ rng: makeRng(3), allies: [{ char: p, controller: 's0' }], enemies: ['rockman'], canFlee: false, boss: true });
  const ev = useGear(bb, bb.allies[0], 'use_acc');
  assert.ok(!bb.pendingEnd, 'ボスからは にげられない');
  assert.ok(ev.lines.join('').includes('逃げられない'));
  // 顔の えんしゅつ 2つ
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_zpower', 'r88_mega']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES.r88u_pk_z.anim, 'r88_zpower');
  assert.equal(ABILITIES.r88u_pk_mega.anim, 'r88_mega');
});

// ───────────── とびらと ライバル ─────────────
test('G16: とびら（モンスターボールの しるし）と ライバル（弱い 順・さいごは Lv100）', () => {
  const d = doorOf(W);
  assert.ok(d);
  assert.equal(new Set(RIVAL_DOORS.map((x) => x.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  assert.ok(R88_BOARD_ICONS[d.mark] && ROOM_STYLES[d.room] && MAPS[`rival_room_${W}`]);
  const list = rivalsOf(W);
  assert.deepEqual(list.map((r) => r.id), ['pk_rocket', 'pk_takeshi', 'pk_kasumi', 'pk_matis', 'pk_erika', 'pk_kyou', 'pk_natsume', 'pk_katsura', 'pk_sakaki', 'pk_shigeru', 'pk_wataru']);
  assert.deepEqual(list.map((r) => r.reward), [['r88_pk_uniform', 'r88_pk_koban'], ...GYM_BADGES.slice(0, 7).map((id) => [id]), ['r88_pk_b_green', 'r88_pk_inochi'], ['r88_pk_zukan', 'r88_pk_tsume'], [PK_MASTERBALL]]);
  assert.deepEqual(list.map((r) => r.lv), [60, 62, 64, 66, 68, 70, 72, 74, 80, 90, 100]);
  assert.equal(rivalTier(list[list.length - 1].lv), 100);
  for (const rv of list) {
    assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
    assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
    assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
    assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
    for (const id of rv.reward) assert.equal(ITEMS[id].work, W, id);
  }
  // ジムリーダーは タイプに 合う 職業（岩・水・雷・草・毒・エスパー・炎）
  assert.deepEqual(list.slice(1, 8).map((r) => r.job), ['guardian', 'snow_queen', 'summoner', 'hanakappa', 'ninja', 'psychicer', 'enjutsushi']);
});

test('G16: ジムリーダー 7人は 曜日で かわる（日本の 日付）。その 日の 1人と 戦える。7人は べつべつに 勝った 記録', () => {
  // 曜日（月 タケシ・火 カスミ・水 マチス・木 エリカ・金 キョウ・土 ナツメ・日 カツラ）
  const want = { 1: 'タケシ', 2: 'カスミ', 3: 'マチス', 4: 'エリカ', 5: 'キョウ', 6: 'ナツメ', 0: 'カツラ' };
  for (let d = 1; d <= 7; d++) {
    const now = DAY(d);
    const wd = weekdayOf(now);
    assert.equal(wd, d % 7);
    assert.equal(dailyRivalOf(W, 'gym', now).name, want[wd]);
  }
  // 日本の 0時で かわる（UTC の 前の 日の 15時）
  assert.equal(weekdayOf(Date.UTC(2026, 10, 15, 14, 59)), 0, '日曜 23:59');
  assert.equal(weekdayOf(Date.UTC(2026, 10, 15, 15, 0)), 1, '月曜 0:00');
  const c = hero('warrior', 70);
  for (const id of ['r88_pk_glove', 'r88_pk_mokutan', 'r88_pk_rumu']) addItem(c, id, 1);
  assert.ok(doorOpen(c, W));
  // ムサシと コジロウに 勝つ 前は ジムリーダーは まだ
  const mon = DAY(1);
  let p = rivalPaper(c, W, mon);
  assert.deepEqual(p.rivals.map((r) => r.id), ['pk_rocket', 'pk_takeshi', 'pk_sakaki', 'pk_shigeru', 'pk_wataru'], 'その 日の ジムリーダーだけ');
  assert.equal(p.rivals[1].state, 'lock');
  assert.equal(p.notes[0], '今日のジムリーダー：タケシ（月曜日）');
  assert.equal(p.notes[1], '持っているジムバッジ：まだない（0/8）');
  c.rivals = { pk_rocket: 1 };
  p = rivalPaper(c, W, mon);
  assert.equal(p.rivals[1].state, 'next');
  assert.ok(rivalButtons(p).some((b) => b.id === 'pk_takeshi'));
  assert.ok(!rivalButtons(p).some((b) => b.id === 'pk_kasumi'), 'ほかの 日の 人は 出ない');
  assert.ok(rivalReady(c, RIVAL_BY_ID.pk_takeshi, mon));
  assert.ok(!rivalReady(c, RIVAL_BY_ID.pk_kasumi, mon), '月曜に カスミは いない');
  assert.ok(rivalReady(c, RIVAL_BY_ID.pk_kasumi, DAY(2)));
  // ジムリーダーどうしは 前後に しない（火曜の カスミは タケシに 勝って いなくても よい）
  assert.ok(rivalOpen(c, 'pk_kasumi'));
  assert.ok(!rivalOpen(c, 'pk_sakaki'), 'サカキは ジムリーダーの だれかに 勝つと');
  assert.equal(rivalRec(c, mon).text.includes('タケシ'), true);
  assert.equal(rivalRec(c, DAY(2)).text.includes('カスミ'), true);
  // 水曜に マチスに 勝つ → サカキへ 進める・バッジが まどに 出る
  c.rivals.pk_matis = 1;
  addItem(c, 'r88_pk_b_orange', 1);
  assert.ok(rivalOpen(c, 'pk_sakaki'));
  p = rivalPaper(c, W, DAY(3));
  assert.equal(p.notes[0], '今日のジムリーダー：マチス（水曜日）');
  assert.equal(p.notes[1], '持っているジムバッジ：オレンジバッジ（1/8）');
  assert.equal(p.rivals.find((r) => r.id === 'pk_matis').state, 'won');
  assert.equal(p.rivals.find((r) => r.id === 'pk_sakaki').state, 'next');
  assert.ok(rivalRec(c, DAY(3)).text.includes('サカキ'));
  // 木曜は エリカ（勝って いない）が おすすめ。勝った 記録は べつべつ
  assert.ok(rivalRec(c, DAY(4)).text.includes('エリカ'));
  assert.ok(!c.rivals.pk_erika);
  assert.equal(WEEKDAY_NAMES[RIVAL_BY_ID.pk_katsura.day], '日');
  assert.ok(rivalToday(RIVAL_BY_ID.pk_rocket, DAY(5)), '曜日の ない 人は いつでも');
});

test('G16: チャンピオン・ワタル … ジムバッジを 8つ 持って いる 人だけ（まどに じょうけん。バッジは なくならない）', () => {
  const w = RIVAL_BY_ID.pk_wataru;
  assert.deepEqual({ set: w.needSet.set, n: w.needSet.n }, { set: 'gym_badge', n: 8 });
  const c = hero('poke_master', 90);
  for (const id of ['r88_pk_glove', 'r88_pk_mokutan', 'r88_pk_rumu']) addItem(c, id, 1);
  c.rivals = { pk_rocket: 1, pk_kasumi: 1, pk_sakaki: 1, pk_shigeru: 1 };
  for (const id of GYM_BADGES.slice(0, 5)) addItem(c, id, 1);
  assert.equal(rivalNeedLack(c, w), 3);
  const now = DAY(3);
  let p = rivalPaper(c, W, now);
  const row = p.rivals.find((r) => r.id === 'pk_wataru');
  assert.equal(row.state, 'need');
  assert.ok(row.need.includes('ジムバッジを8つそろえると、ちょうせんできる') && row.need.includes('5/8'), row.need);
  assert.ok(!rivalButtons(p).some((b) => b.id === 'pk_wataru'));
  for (const id of GYM_BADGES.slice(5)) addItem(c, id, 1);
  assert.ok(rivalReady(c, w, now));
  p = rivalPaper(c, W, now);
  assert.equal(p.rivals.find((r) => r.id === 'pk_wataru').state, 'next');
  assert.ok(rivalButtons(p).some((b) => b.id === 'pk_wataru'));
  assert.equal(itemCount(c, GYM_BADGES[0]), 1, 'バッジは なくならない');
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G16: ガチャガチャ … ライバルの 品（バッジ 8つも）・伝説・生まれ変わりの 先・店の 品・試練の ごほうびは 出ない', () => {
  assert.ok(gachaWorks().includes(W));
  const pool = gachaPool(W);
  assert.equal(pool.all.length, 20);
  assert.equal(pool.all.length * GACHA_PRICE, 400000);
  const rivals = rivalsOf(W).flatMap((r) => r.reward);
  for (const id of mine()) {
    const it = ITEMS[id];
    const out = it.grade === 'den' || it.grade === 'shop' || rivals.includes(id) || id === trialGiftOf('poke_master') || Object.values(REBIRTH).some((x) => x.to === id);
    assert.equal(pool.all.includes(id), !out, `${id}: ${gachaBlock(id)}`);
  }
  for (const id of GYM_BADGES) assert.equal(gachaBlock(id), 'rival', id);
  assert.ok(pool.all.includes('r88_pk_ball'), 'はじめの ボールは ガチャ');
  assert.ok(pool.mei.length >= 5 && pool.fu.length >= 5);
});

test('G16: 試練の ごほうび … ポケモンマスター → サトシのぼうし', () => {
  assert.equal(trialGiftOf('poke_master'), 'r88_pk_cap');
  assert.equal(gachaBlock('r88_pk_cap'), 'trial');
  assert.equal(ITEMS.r88_pk_cap.type, 'head');
});

// ───────────── セーブと 引っこし ─────────────
test('G16: セーブと 引っこしコード（ライバル・バッジ・ボール）', () => {
  const c = hero('poke_master', 90);
  c.rivals = { pk_rocket: 1, pk_takeshi: 1, pk_matis: 1, pk_wataru: 1 };
  for (const id of [...GYM_BADGES, 'r88_pk_koban']) addItem(c, id, 1);
  c.equip.weapon = PK_MASTERBALL;
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { pk_rocket: 1, pk_takeshi: 1, pk_matis: 1, pk_wataru: 1 });
  assert.equal(back.equip.weapon, PK_MASTERBALL);
  assert.equal(itemCount(back, 'r88_pk_b_green'), 1);
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
