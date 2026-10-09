// 第4章「砂の海にしずむ星」Step 6: 砂の海賊と砂クジラ
// ドゥナへの 谷の 見張りに 手紙を 見せる → 谷の 門が 開く（c4_duna）→ 砂の港ドゥナ → かしらバルガ（「口だけなら、何とでも言える」）
// → サラが 仲間に（ゲスト。c4_sara）→ 砂の古城（2つの 石の 板を 同時に ふむ。ひとりなら サラや 仲間が 手伝う）→ 船のかじ（c4_castle）
// → すなかぜ号（c4_ship）→ 砂の海 → 砂クジラ（砂に もぐる。もぐっている 間は ねらえない）→ 砂の底の神殿の 入口が 分かる（c4_whale）
// → サラは パーティーから はなれて さんばしで 待つ（第4章の続きはアップデートで！）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, SEA_PLACES } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { DUNA_GATE } from '../public/js/shared/maps/south.js';
import { DUNA_LOOKOUTS, CH4_MAPS, DUNA_MAPS } from '../public/js/shared/maps/ch4.js';
import {
  DUNA_POS, DUNA_TOWN, DUNA_VALLEY_EXIT, DUNA_EAST_GATE, CASTLE_PLATES, CASTLE_POS, CASTLE_GATE_FLAG, SANDSEA_POS, NEST_R, WHALE_RING,
  SANDSEA_STORM_X, SANDSEA_ISLES,
} from '../public/js/shared/maps/duna.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { C4_OBJ, OLD_C4_OBJ, CH4_STEPS } from '../public/js/shared/data/story-ch4.js';
import { DUNA_OBJ, DUNA_STEPS } from '../public/js/shared/data/story-ch4-duna.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { GUESTS, SHOPS } from '../public/js/shared/data/shops.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly, decideMonster } from '../public/js/shared/ai.js';
import { hiddenFrom, BURROW_WARN } from '../public/js/shared/battle-ch4.js';
import { gainExp, expForLevel, ownsItem } from '../public/js/shared/stats.js';
import { guestChar, recruitNpc, syncParty, partyOf } from '../public/js/shared/world/party.js';
import { warpDest } from '../public/js/shared/world/services.js';
import { makeChar, whaleFight, withSara } from '../tools/sim.js';
import { Bot, tickN } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const stepsOf = (list) => JSON.stringify(list);
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D = (x, y) => [DUNA_TOWN.x + x, DUNA_TOWN.y + y];

// ───────────── たたかいの しかけ（砂に もぐる）─────────────
const PARTY = (lv = 36) => [makeChar('warrior', lv, 10, 'せんし', 33), makeChar('priest', lv, 10, 'そうりょ', 33), makeChar('mage', lv, 10, 'まほう', 33), makeChar('monk', lv, 10, 'ぶとう', 33)];
function whaleBattle(seed = 3, enemies = ['sand_whale']) {
  const party = PARTY();
  const b = new Battle({ rng: makeRng(seed), allies: party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced' })), enemies, boss: true, canFlee: false });
  return { b, whale: b.enemies.find((e) => e.species === 'sand_whale'), party };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  return ev;
}
const dive = (b, whale) => act(b, whale, { type: 'ability', id: 'm_whale_dive' });

test('砂クジラ: 砂に もぐると ねらえない（攻撃・全体の 呪文・こんらんの 相手）。もぐった 番の のこりの 行動は やめる', () => {
  const { b, whale } = whaleBattle(3);
  const [w, , mage] = b.allies;
  // 2回行動の 1つめで もぐる → 2つめは とりやめ
  b.enqueue(whale, { type: 'ai' }, false);
  b.enqueue(whale, { type: 'ai' }, true);
  b.queue.shift();
  const ev = dive(b, whale);
  assert.ok(whale.burrow && !whale.burrow.warned, 'もぐった');
  assert.equal(whale.telegraph, 'm_whale_jump', 'つぎの 番は 大ジャンプ');
  assert.ok(ev.lines.some((l) => l.includes('砂の中にもぐった')) && ev.lines.some((l) => l.includes('攻撃がとどかない')));
  assert.ok(ev.fx.burrow && ev.forceLast && ev.warn);
  assert.ok(!b.queue.some((q) => q.id === whale.id), '2つめの 行動は とりやめ');
  assert.equal(pub(whale).burrow, 1, 'がめんへ: もぐっている');
  // ねらえない
  assert.ok(hiddenFrom(w, whale) && !hiddenFrom(whale, whale));
  assert.ok(!b.sideOf(w, false).includes(whale));
  assert.ok(b.sideOf(whale, true).includes(whale), '魔物の がわからは 見える');
  // こうげき: 「砂の中に もぐっている！」で 何も しない（ダメージなし）
  const hp0 = whale.hp;
  const e1 = act(b, w, { type: 'attack', target: whale.id });
  assert.equal(whale.hp, hp0);
  assert.ok(e1.lines.some((l) => l.includes('砂の中にもぐっている')));
  assert.equal(e1.fx.type, 'burrowMiss');
  // 呪文: MPは へらない
  const spell = mage.abilities.find((id) => ABILITIES[id]?.target === 'enemy' && ABILITIES[id]?.effect?.type === 'magic');
  assert.ok(spell, '1体を ねらう 呪文');
  const mp0 = mage.mp;
  const e2 = act(b, mage, { type: 'ability', id: spell, target: whale.id });
  assert.equal(mage.mp, mp0, 'MPは へらない');
  assert.equal(whale.hp, hp0);
  assert.ok(e2.lines.some((l) => l.includes('ねらいをつけられない')));
  // 回復や 防御は できる
  const e3 = act(b, w, { type: 'defend' });
  assert.ok(w.defending && !e3.lines.some((l) => l.includes('砂の中')));
  // こんらんした 仲間は もぐった 敵を なぐれない（みかたを なぐる）
  w.defending = false;
  w.status.confuse = { turns: 5 };
  b.queue = [{ id: w.id, cmd: { type: 'attack', target: whale.id }, last: true }];
  b.executeNext();
  assert.equal(whale.hp, hp0, 'こんらんでも とどかない');
  // きずな技も とどかない
  b.bond = 100;
  const e4 = act(b, mage, { type: 'bond', target: whale.id });
  assert.ok(e4.lines.some((l) => l.includes('砂の中にもぐっている')) && b.bond === 100 && !b.bondCharge);
});

test('砂クジラ: もぐっている 間も ほかの 敵（砂ザメ）は ねらえる。全体の 呪文は 砂ザメにだけ 当たる', () => {
  const { b, whale } = whaleBattle(5, ['sand_whale', 'sand_shark', 'sand_shark']);
  const sharks = b.enemies.filter((e) => e.species === 'sand_shark');
  const [w, , mage] = b.allies;
  dive(b, whale);
  const hp0 = whale.hp;
  // ねらった 砂クジラが いない → ほかの 敵へ
  const e1 = act(b, w, { type: 'attack', target: whale.id });
  assert.equal(whale.hp, hp0);
  assert.ok(sharks.some((s) => s.hp < s.maxHp) || e1.lines.some((l) => l.includes('ミス')), '砂ザメに 当たる');
  // 全体の 呪文
  const allSpell = mage.abilities.find((id) => ABILITIES[id]?.target === 'enemies' && ABILITIES[id]?.effect?.type === 'magic');
  assert.ok(allSpell, '全体の 呪文');
  const targets = b.targetsFor(mage, ABILITIES[allSpell], {});
  assert.deepEqual(targets.map((t) => t.species).sort(), ['sand_shark', 'sand_shark']);
  // ふつうの オート: ねらうのは 砂ザメ
  for (let i = 0; i < 6; i++) {
    const cmd = decideAlly(b, w);
    if (cmd.target) assert.notEqual(cmd.target, whale.id);
  }
});

test('砂クジラ: ゲージが たまると「砂がもり上がった…！」（前ぶれ）→ つぎの 番に 出てきて 大ジャンプ（みんなに 大きい。防御で 半分）', () => {
  const { b, whale } = whaleBattle(7);
  dive(b, whale);
  // まだ 前ぶれは ない
  whale.atb = BURROW_WARN - 5;
  b.advance(1);
  assert.ok(!whale.burrow.warned);
  b.flush();
  // ゲージが 前ぶれの ところまで
  whale.atb = BURROW_WARN + 1;
  b.advance(1);
  const evs = b.flush();
  const warn = evs.find((e) => e.t === 'msg' && e.lines?.some((l) => l.includes('砂がもり上がった')));
  assert.ok(warn, '前ぶれの ことば');
  assert.equal(warn.fx.type, 'burrowRise');
  assert.ok(warn.warn && warn.dur > 0 && b.lock > 0);
  assert.equal(warn.upd[0].burrow, 2, 'がめんへ: 砂が もり上がった');
  assert.ok(whale.burrow.warned);
  // 前ぶれは 1回だけ
  b.lock = 0;
  b.advance(1);
  assert.ok(!b.flush().some((e) => e.t === 'msg' && e.lines?.some((l) => l.includes('砂がもり上がった'))));
  // つぎの 番: 出てきて 大ジャンプ
  const ev = evOf(whale);
  b.cur = ev;
  const cmd = decideMonster(b, whale);
  assert.deepEqual(cmd.id, 'm_whale_jump');
  assert.equal(whale.burrow, null, '出てきた（ねらえる）');
  assert.ok(ev.upd.includes(whale));
  assert.ok(!hiddenFrom(b.allies[0], whale));
  b.perform(whale, cmd, ev);
  b.cur = null;
  const hit = (ev.results || []).filter((r) => r.dmg > 0 || r.miss).map((r) => r.id);
  assert.equal(new Set(hit).size, b.allies.length, 'みんなに 当たる');
  // とても 大きい（ふつうの 攻撃の 1.4ばい いじょう）・防御で 半分
  const jump = ABILITIES.m_whale_jump.effect;
  const mage = b.allies[2];
  mage.defending = false;
  const big = b.calcPhys(whale, mage, jump, 1, 'phys', true).dmg;
  const normal = b.calcPhys(whale, mage, { mult: 1 }, 1, 'phys', true).dmg;
  assert.ok(big > normal * 1.4, `大ジャンプ ${big} / ふつう ${normal}`);
  assert.ok(big > mage.maxHp * 0.4, 'まほうつかいの HPの 4わり いじょう');
  mage.defending = true;
  const guarded = b.calcPhys(whale, mage, jump, 1, 'phys', true).dmg;
  assert.ok(Math.abs(guarded - big / 2) <= 1, `防御で 半分 ${guarded}`);
});

test('砂クジラの データ: Lv37・2回行動・おそい。雷・氷が 弱点、炎・風が 効きにくい。HP50%で 砂ザメ 2ひき、25%で 少し 速く。お守りを 落とす', () => {
  const m = MONSTERS.sand_whale;
  assert.ok(m.boss && m.lv === 37 && m.turns === 2 && m.speed < 0.7, 'Lv37・2回行動・おそい');
  assert.ok(m.hp >= 6000 && m.hp <= 8000, `HP ${m.hp}`);
  assert.ok(m.resist.bolt > 1.2 && m.resist.ice > 1.2 && m.resist.fire < 0.8 && m.resist.wind < 0.8);
  const ids = m.actions.map((a) => a.id);
  for (const id of ['m_whale_tackle', 'm_whale_gulp', 'm_whale_spray', 'm_whale_dive']) assert.ok(ids.includes(id) && ABILITIES[id]?.desc, id);
  assert.equal(ABILITIES.m_whale_spray.target, 'enemies', '砂しぶきは 全体');
  assert.equal(ABILITIES.m_whale_gulp.target, 'enemy', '大口は 1人');
  assert.deepEqual(ABILITIES.m_whale_dive.effect, { type: 'burrow', next: 'm_whale_jump' });
  assert.equal(ABILITIES.m_whale_jump.target, 'enemies');
  // 段階
  const { b, whale } = whaleBattle(9);
  const w = b.allies[0];
  const ev = evOf(w);
  b.damage(w, whale, Math.ceil(whale.maxHp * 0.51), ev, { element: 'bolt' });
  const sharks = b.enemies.filter((e) => e.species === 'sand_shark');
  assert.equal(sharks.length, 2, 'HP50%で 砂ザメ 2ひき');
  assert.ok((ev.postLines || []).some((l) => l.includes('砂ザメ')));
  const sp0 = whale.speed;
  b.damage(w, whale, Math.ceil(whale.maxHp * 0.25), evOf(w), { element: 'bolt' });
  assert.ok(whale.speed > sp0 && whale.speed / sp0 <= 1.3, `少し 速く ${sp0} → ${whale.speed}`);
  // 落とす 物（ボスの アクセサリー・1人 1つ）
  assert.deepEqual(monsterDrops('sand_whale').filter((d) => d.kind === 'boss').map((d) => d.item), ['whale_charm']);
  const charm = ITEMS.whale_charm;
  assert.ok(charm.type === 'acc' && charm.unique && charm.rank === 7 && !(charm.price > 0));
  // きまった 戦い（すなかぜ号の かんぱん・にげられない）
  const enc = FIXED_ENCOUNTERS.sand_whale;
  assert.deepEqual([enc.bg, enc.bgm, enc.boss, enc.canFlee], ['whale_deck', 'whale', true, false]);
  assert.deepEqual(enc.group, [['sand_whale', 1, 1]]);
});

test('オートの 仲間: ねらえる 敵が いなければ 身を 守る。知っている 人（b.knowsBurrow）は とび出す 前に 身を 守り、知らない 人（b.ignoreBurrow）は 空ぶり', () => {
  const { b, whale } = whaleBattle(11);
  const [w] = b.allies;
  dive(b, whale);
  assert.equal(decideAlly(b, w).type, 'defend', 'ふつうの オート: ねらう 敵が いない');
  b.ignoreBurrow = true;
  assert.equal(decideAlly(b, w).type, 'attack', '知らない 人は 攻撃しようと する');
  b.ignoreBurrow = false;
  // 砂ザメが いる とき、知っている 人は 前ぶれを 見たら 身を 守る
  const b2 = whaleBattle(13, ['sand_whale', 'sand_shark']);
  dive(b2.b, b2.whale);
  b2.b.knowsBurrow = true;
  b2.whale.atb = 0;
  b2.whale.burrow.warned = false;
  // まだ とび出さない（自分の つぎの 番の ほうが 先）: ふつうに 砂ザメを ねらう
  const w2 = b2.b.allies[0];
  const early = decideAlly(b2.b, w2);
  assert.notEqual(early.type, 'defend');
  b2.whale.burrow.warned = true;
  assert.equal(decideAlly(b2.b, w2).type, 'defend', '前ぶれの あとは 身を 守る');
  b2.whale.burrow.warned = false;
  b2.whale.atb = 99;
  assert.equal(decideAlly(b2.b, w2).type, 'defend', 'つぎの 自分の 番より 先に とび出す');
});

test('シミュレーション（tools/sim.js ch4whale）: サラを 入れた 5人。知っている 人の ほうが 勝ちやすい', () => {
  const party = withSara(PARTY(), 36);
  assert.equal(party.length, 5);
  const sara = party[4];
  assert.ok(sara.name === 'サラ' && sara.job === 'pirate' && sara.equip.weapon === 'snake_whip' && sara.level === 36);
  let know = 0, ignore = 0;
  for (let i = 0; i < 6; i++) {
    const a = whaleFight(36, 777 + i * 7919, true);
    const c = whaleFight(36, 777 + i * 7919, false);
    assert.ok(['win', 'lose'].includes(a.outcome) && ['win', 'lose'].includes(c.outcome));
    if (a.outcome === 'win') know++;
    if (c.outcome === 'win') ignore++;
  }
  assert.ok(know >= ignore, `知っている ${know} / 知らない ${ignore}`);
});

// ───────────── すすみぐあい ─────────────
test('すすみぐあい: c4_letter → c4_duna → c4_sara →（c4_castle_gate）→ c4_castle → c4_ship → c4_whale。目標・仲間会話・地図の しるし・むかしの 文の なおし', () => {
  const li = CH4_STEPS.indexOf('c4_letter');
  assert.deepEqual(CH4_STEPS.slice(li + 1, li + 6), ['c4_duna', 'c4_sara', 'c4_castle', 'c4_ship', 'c4_whale']);
  assert.deepEqual(DUNA_STEPS, ['c4_duna', 'c4_sara', 'c4_castle', 'c4_ship', 'c4_whale']);
  for (const f of DUNA_STEPS) assert.ok(STORY_STEPS.includes(f), f);
  assert.ok(CH4_STEPS.indexOf('c4_temple') > CH4_STEPS.indexOf('c4_whale') && !CH4_STEPS.includes(CASTLE_GATE_FLAG), 'c4_temple は Step 7・こうしは しかけの フラグ');
  const f = (...l) => ({ flags: flagsOf(...UPTO('c4_letter'), ...l) });
  assert.equal(objectiveFromFlags(f('c4_duna_gate')), C4_OBJ.dunagate);
  assert.equal(objectiveFromFlags(f('c4_duna_gate', 'c4_duna')), C4_OBJ.duna);
  assert.equal(objectiveFromFlags(f('c4_duna_gate', 'c4_duna', 'c4_sara')), C4_OBJ.sara);
  assert.equal(objectiveFromFlags(f('c4_duna', 'c4_sara', CASTLE_GATE_FLAG)), C4_OBJ.castlegate);
  assert.equal(objectiveFromFlags(f('c4_duna', 'c4_sara', CASTLE_GATE_FLAG, 'c4_castle')), C4_OBJ.castle);
  assert.equal(objectiveFromFlags(f('c4_duna', 'c4_sara', 'c4_castle', 'c4_ship')), C4_OBJ.ship);
  assert.equal(objectiveFromFlags(f('c4_duna', 'c4_sara', 'c4_castle', 'c4_ship', 'c4_whale')), C4_OBJ.whale);
  // Step 6 の さいごの「続きはアップデートで！」は Step 7 で「さんばしの サラに 話す」に かわった（むかしの 文は OLD_C4_OBJ.whale。test/ch4-temple.test.js）
  assert.ok(OLD_C4_OBJ.whale.startsWith('第4章の続きはアップデートで！（') && C4_OBJ.whale.includes('サラ'), 'Step 6 の さいご');
  for (const k of Object.keys(DUNA_OBJ)) {
    assert.equal(C4_OBJ[k], DUNA_OBJ[k], k);
    const t = C4_OBJ[k];
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // 「はなす」の ヒント: 2つの 石の 板・砂に もぐったら 身を 守る・雷と 氷
  assert.ok(talkFor(C4_OBJ.sara, 'self').includes('石の板') && talkFor(C4_OBJ.sara, 'self').includes('サラ'));
  for (const kind of ['self', 'kind']) {
    const t = talkFor(C4_OBJ.ship, kind);
    assert.ok(t.includes('もぐ') && t.includes('守') && t.includes('雷'), `${kind}: ${t}`);
  }
  // Step 5 の 版の「続きはアップデートで！」は 見張りの 目標に なおる
  const old = { flags: f('c4_duna_gate').flags, objective: OLD_C4_OBJ.dunagate };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C4_OBJ.dunagate);
  // 地図の しるし: 南の砂ばくでは 谷の 出口 → ドゥナでは バルガ・古城の 入り口・すなかぜ号 → 砂の海では ねどこ
  const fl = f('c4_duna', 'c4_sara').flags;
  const mark = (obj, map) => questMarks({ flags: fl, objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(C4_OBJ.duna, 'south').some((m) => m.y === DUNA_VALLEY_EXIT.y), '谷の 先');
  assert.ok(mark(C4_OBJ.duna, 'duna').some((m) => m.x === DUNA_POS.barga.x && m.y === DUNA_POS.barga.y), 'バルガ');
  assert.ok(mark(C4_OBJ.sara, 'duna').some((m) => m.x === DUNA_POS.castleDoor.x && m.y === DUNA_POS.castleDoor.y), '古城の 入り口');
  assert.ok(mark(C4_OBJ.castlegate, 'sand_castle1').length, '2階への かいだん');
  assert.ok(mark(C4_OBJ.ship, 'duna').some((m) => m.x === Math.floor(DUNA_POS.ship.x)), 'すなかぜ号');
  assert.ok(mark(C4_OBJ.ship, 'sand_sea').some((m) => m.x === SANDSEA_POS.nest.x && m.y === SANDSEA_POS.nest.y), 'クジラのねどこ');
  assert.ok(mark(C4_OBJ.ship, 'south').length, '南の砂ばくからも 道しるべ');
  // だいじなもの・パーティー全員で 見る だいほん
  assert.equal(ITEMS.ship_rudder.type, 'key');
  for (const id of ['c4_duna_arrive', 'c4_barga', 'c4_castle_plate', 'c4_rudder_event', 'c4_sand_ship', 'c4_whale_event', 'c4_d_lookout']) assert.ok(STORY_SCRIPTS.has(id), id);
});

test('かしらバルガ: 手紙を 読んでも「口だけなら、何とでも言える」→ サラ「母さんは、水の神殿にいたの」→ 試練。かじを とどけると すなかぜ号', () => {
  const base = flagsOf(...UPTO('c4_letter'), 'c4_duna_gate', 'c4_duna');
  const first = SCRIPTS.c4_barga(ctx(base));
  const text = stepsOf(first);
  assert.ok(text.includes('口だけなら、何とでも言える'));
  assert.ok(text.includes('母さんは、水の神殿にいたの。きっと、まだ生きてる。'));
  assert.ok(text.includes('砂の古城') && text.includes('船のかじ'));
  assert.ok(first.some((s) => s[0] === 'takeItem' && s[1] === 'queen_letter'), '手紙を わたす');
  const gi = first.findIndex((s) => s[0] === 'guest' && s[1] === 'sara');
  assert.ok(gi > 0, 'サラが 仲間に');
  assert.ok(first.some((s) => s[0] === 'flag' && s[1] === 'c4_sara'));
  assert.ok(first.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.sara));
  // 試練の とちゅう
  const waiting = SCRIPTS.c4_barga(ctx({ ...base, c4_sara: true }));
  assert.ok(!waiting.some((s) => s[0] === 'flag') && stepsOf(waiting).includes('東の門'));
  // かじを とどける
  const accept = SCRIPTS.c4_barga(ctx({ ...base, c4_sara: true, c4_castle: true }));
  assert.ok(stepsOf(accept).includes('…むすめが、あんたたちを信じると言うなら。'));
  assert.ok(accept.some((s) => s[0] === 'takeItem' && s[1] === 'ship_rudder'));
  assert.ok(accept.some((s) => s[0] === 'flag' && s[1] === 'c4_ship'));
  assert.ok(stepsOf(accept).includes('クジラのねどこ'));
  // すなかぜ号: かじが つくまでは 出航できない
  const noShip = SCRIPTS.c4_sand_ship(ctx({ ...base, c4_sara: true }));
  assert.ok(!noShip.some((s) => s[0] === 'choice') && stepsOf(noShip).includes('かじがついていない'));
  const ship = SCRIPTS.c4_sand_ship(ctx({ ...base, c4_sara: true, c4_castle: true, c4_ship: true }));
  assert.equal(ship[0][0], 'choice');
  assert.ok(stepsOf(ship[0][3][0]).includes('"teleport","sand_sea"'));
  // 町の 人の ことばが すすみぐあいで かわる
  for (const id of ['c4_d_gate', 'c4_d_hall1', 'c4_d_oldman', 'c4_d_kid', 'c4_d_wright', 'c4_d_mate', 'c4_d_fisher', 'c4_d_east', 'c4_s_sgate', 'c4_d_lookout']) {
    const a = stepsOf(SCRIPTS[id](ctx(base))), b = stepsOf(SCRIPTS[id](ctx({ ...base, c4_sara: true, c4_castle: true, c4_ship: true, c4_whale: true })));
    assert.notEqual(a, b, id);
  }
  // 副長のガロは 砂クジラの ヒント（すなかぜ号に のる 前）
  assert.ok(stepsOf(SCRIPTS.c4_d_mate(ctx({ ...base, c4_sara: true, c4_castle: true, c4_ship: true }))).includes('砂がもり上がったら'));
  // 女王ネフィの ことばも かわる
  const q = (fl) => stepsOf(SCRIPTS.nefi_night ? SCRIPTS.nefi_night(ctx(fl)) : SCRIPTS.c4_nefi(ctx(fl)));
  assert.notEqual(q(base), q({ ...base, c4_sara: true }));
  // お店・宿屋
  assert.ok(SHOPS.duna_item?.items.every((id) => ITEMS[id]));
  assert.ok(stepsOf(SCRIPTS.c4_inn_duna(ctx(base))).includes('60ゴールド'));
});

// ───────────── マップ ─────────────
function reach(map, start, flags) {
  const has = (f) => flags.includes(f);
  const key = (x, y) => `${x},${y}`;
  const warps = new Set(map.warps.map((w) => key(w.x, w.y)));
  const seen = new Set([key(...start)]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      const k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen.has(k) || isBlocked(map, nx, ny, has)) continue;
      seen.add(k);
      if (!warps.has(k)) q.push([nx, ny]);
    }
  }
  return (x, y) => seen.has(key(x, y));
}

test('マップ: 谷の 門（c4_duna）→ ドゥナの 谷 → 町。東の 門は サラが 仲間に なると 開く（砂の古城へ）。さんばしの 先に すなかぜ号', () => {
  const S = MAPS.south, M = MAPS.duna;
  for (const id of DUNA_MAPS) assert.ok(CH4_MAPS.includes(id) && MAPS[id], id);
  assert.equal(M.kind, 'field');
  // 南の砂ばく: 門は c4_duna で 開いて、谷の 出口（いちばん 下の だん）から ドゥナへ
  const pre = UPTO('c4_letter'), post = [...pre, 'c4_duna_gate', 'c4_duna'];
  assert.equal(effectiveTile(S, DUNA_GATE.x, DUNA_GATE.y, (fl) => pre.includes(fl)), T.LOCKED_DOOR);
  assert.ok(!isBlocked(S, DUNA_GATE.x, DUNA_GATE.y, (fl) => post.includes(fl)));
  const r0 = reach(S, [DUNA_GATE.x, DUNA_GATE.y - 1], pre), r1 = reach(S, [DUNA_GATE.x, DUNA_GATE.y - 1], post);
  const exits = S.warps.filter((w) => w.to.map === 'duna');
  assert.ok(exits.length && exits.every((w) => w.y === DUNA_VALLEY_EXIT.y));
  assert.ok(!exits.some((w) => r0(w.x, w.y)) && exits.some((w) => r1(w.x, w.y)), '門が 開くと 谷の 先へ');
  // ドゥナ: 谷の 北の はし → 町の 北の 門 → かしらの 館（机の 前）・さんばしの 先
  const start = [Math.floor(DUNA_POS.arrive.x), Math.floor(DUNA_POS.arrive.y)];
  const d0 = reach(M, start, post), d1 = reach(M, start, [...post, 'c4_sara']);
  assert.ok(d0(DUNA_POS.gate.x, DUNA_POS.gate.y), '町の 北の 門');
  assert.ok(d0(DUNA_POS.barga.x, DUNA_POS.barga.y + 2), 'バルガの 机の 前');
  assert.ok(d0(Math.floor(DUNA_POS.ship.x), Math.floor(DUNA_POS.ship.y) - 1), 'さんばしの 先');
  assert.ok(M.warps.some((w) => w.to.map === 'south' && w.y === 0), '谷を 上ると 南の砂ばくへ');
  // 東の 門（サラが 仲間に なるまで カギ）・砂の古城の 入り口
  for (const g of DUNA_EAST_GATE) {
    assert.equal(effectiveTile(M, g.x, g.y, (fl) => post.includes(fl)), T.LOCKED_DOOR);
    assert.ok(!isBlocked(M, g.x, g.y, (fl) => fl === 'c4_sara'));
    assert.ok(M.actions.some((a) => a.x === g.x && a.y === g.y && a.script === 'c4_d_eastgate'));
  }
  const door = M.warps.find((w) => w.to.map === 'sand_castle1');
  assert.ok(!d0(door.x, door.y) && d1(door.x, door.y), '古城へは サラが 仲間に なってから');
  // 町の 中は 魔物が 出ない・谷は 出る（昼と 夜）
  assert.equal(M.zoneAt(...D(10, 10)), 'safe:duna');
  assert.equal(M.zoneAt(DUNA_POS.arrive.x | 0, 8), 's_duna');
  assert.equal(NIGHT_ZONES.s_duna, 's_duna_night');
  assert.equal(M.areaName(...D(10, 10)), '砂の港ドゥナ');
  assert.equal(M.bgmAt(...D(10, 10), false), 'duna');
  // ルーラ・帰り道の羽（町の 北の 門の 外）
  assert.ok(SEA_PLACES.duna);
  const wd = warpDest('duna');
  assert.equal(wd.map, 'duna');
  assert.ok(!isBlocked(M, Math.floor(wd.x), Math.floor(wd.y), () => false) && d0(Math.floor(wd.x), Math.floor(wd.y)));
});

test('マップ: 砂の古城（1階の 2つの 石の 板で 鉄の こうしが 開く → 2階の たからべや）と 砂の海（すなかぜ号。まん中に ねどこの 砂の うず）', () => {
  const C1 = MAPS.sand_castle1, C2 = MAPS.sand_castle2, SEA = MAPS.sand_sea;
  assert.equal(C1.kind, 'dungeon');
  assert.equal(C1.theme, 'castle');
  // 1階: 入り口から 2つの 石の 板へ。こうしは しかけで 開く
  const st = [CASTLE_POS.exit1.x, CASTLE_POS.exit1.y - 1];
  const r0 = reach(C1, st, []), r1 = reach(C1, st, [CASTLE_GATE_FLAG]);
  for (const [x, y] of CASTLE_PLATES) {
    assert.equal(C1.tiles[y * C1.w + x], T.PLATE);
    assert.ok(r0(x, y), `石の板 ${x},${y}`);
    assert.ok(C1.triggers.some((tr) => tr.x === x && tr.y === y && tr.script === 'c4_castle_plate'));
  }
  const dist = Math.abs(CASTLE_PLATES[0][0] - CASTLE_PLATES[1][0]);
  assert.ok(dist >= 20, `2つの 板は はなれている（1人では 同時に ふめない） ${dist}`);
  assert.ok(!r0(CASTLE_POS.up1.x, CASTLE_POS.up1.y) && r1(CASTLE_POS.up1.x, CASTLE_POS.up1.y), 'こうしの 先の かいだん');
  assert.ok(C1.signs.some((s) => s.text.includes('同時にふむ')), 'かべの 文字');
  // 2階: かいだんから たからべやの 船のかじ
  const r2 = reach(C2, [CASTLE_POS.down2.x, CASTLE_POS.down2.y - 1], []);
  assert.ok(r2(CASTLE_POS.rudder.x, CASTLE_POS.rudder.y + 1), '船のかじの 前');
  assert.ok(C2.npcById.ship_rudder && C2.npcById.ship_rudder.show.not.includes('c4_castle'));
  assert.ok(C2.triggers.some((tr) => tr.script === 'c4_rudder_event' && tr.show.not.includes('c4_castle')));
  assert.equal(FIXED_ENCOUNTERS.rudder_guard.canFlee, false);
  for (const z of ['s_castle', 's_castle2']) assert.ok(ENCOUNTER_TABLES[z]?.length && ZONE_BG[z] === 'sand_castle', z);
  // 砂の海: すなかぜ号で すすむ（砂の 上は 船で）。ねどこの うずは 砂クジラが 正気に もどるまで 入れない。東の はしは 砂嵐
  assert.ok(SEA.sailable && SEA.ship === 'sand_ship');
  assert.ok(TILE_INFO[T.SAND_SEA].sail && TILE_INFO[T.SAND_SEA].solid, '船で だけ すすめる 砂');
  assert.ok(isBlocked(MAPS.duna, 5, 45, () => false), 'ドゥナの マップでは 砂の海は 歩けない');
  const arrive = [Math.floor(SANDSEA_POS.arrive.x), Math.floor(SANDSEA_POS.arrive.y)];
  const s0 = reach(SEA, arrive, ['c4_ship']), s1 = reach(SEA, arrive, ['c4_ship', 'c4_whale']);
  const N = SANDSEA_POS.nest;
  assert.ok(s0(N.x, N.y - Math.ceil(NEST_R) - 1), 'ねどこの そば');
  assert.ok(!s0(N.x, N.y) && s1(N.x, N.y), 'うずは 砂クジラの あと しずまる');
  assert.ok(!s1(SANDSEA_STORM_X + 1, 20) && reach(SEA, arrive, ['c4_whale', 'c4_morgana'])(SANDSEA_STORM_X + 1, 20), '東の 砂嵐');
  for (const [x, y] of SANDSEA_ISLES) assert.ok(s0(x - 1, y), `小島の 宝箱 ${x},${y}`);
  assert.ok(SEA.triggers.some((tr) => tr.script === 'c4_whale_event' && tr.show.all.includes('c4_ship') && tr.show.not.includes('c4_whale')));
  assert.ok(Math.round(WHALE_RING) >= 8, 'ねどこに 近づくと 目を さます');
  assert.ok(SEA.npcById.sand_whale_npc.big && SEA.npcById.sand_whale_npc.show.all.includes('c4_whale'));
  assert.ok(ENCOUNTER_TABLES.s_sandsea.some((e) => e.group.some(([sp]) => sp === 'sand_shark')), '砂ザメ');
  assert.equal(NIGHT_ZONES.s_sandsea, 's_sandsea_night');
  assert.ok(SEA.triggers.some((tr) => tr.script === 'c4_sea_to_duna'), 'さんばしで ドゥナへ もどる');
  // 地図の つながり（すなかぜ号）
  assert.ok(MAPS.duna.links.some((l) => l.to === 'sand_sea') && SEA.links.some((l) => l.to === 'duna'));
});

// ───────────── 2つの 石の 板（ひとり・家族）─────────────
function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'shamshir', armor: 'sand_mail', shield: 'crescent_shield', head: 'sand_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
function step(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
}
async function soloAt(seed, flagsUpTo, opts = {}) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(flagsUpTo)) c.flags[f] = true;
  if (opts.guest !== false && STORY_STEPS.indexOf(flagsUpTo) >= STORY_STEPS.indexOf('c4_sara')) c.guests = ['sara'];
  c.objective = objectiveFromFlags(c);
  boost(c, 36);
  syncParty(world, partyOf(world, bot.s));
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { world, bot, c };
}

test('2つの 石の 板（ひとり）: サラが もう1つを ふんでくれる。サラが いなければ 酒場の 仲間。だれも いなければ 開かない', { timeout: 60000 }, async () => {
  const [px, py] = CASTLE_PLATES[0];
  // サラ（ゲスト）
  {
    const { world, bot, c } = await soloAt(6101, 'c4_sara');
    assert.deepEqual(c.guests, ['sara']);
    world.placeSession(bot.s, 'sand_castle1', px + 1.5, py + 0.5, 'left', true);
    await bot.settle();
    const from = bot.msgs.length;
    step(bot, px, py);
    await bot.settle();
    assert.ok(c.flags[CASTLE_GATE_FLAG], 'こうしが 開いた');
    assert.ok(said(bot, 'もう1つの板は、あたしにまかせて', from), 'サラが 手伝う');
    assert.equal(c.objective, C4_OBJ.castlegate);
    assert.ok(!isBlocked(MAPS.sand_castle1, CASTLE_POS.gate.x, CASTLE_POS.gate.y, world.hasFlagFn(bot.s)));
  }
  // サラが いない（酒場の 仲間 ガルド）
  {
    const { world, bot, c } = await soloAt(6102, 'c4_sara', { guest: false });
    assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok);
    await bot.settle();
    world.placeSession(bot.s, 'sand_castle1', px + 1.5, py + 0.5, 'left', true);
    await bot.settle();
    const from = bot.msgs.length;
    step(bot, px, py);
    await bot.settle();
    assert.ok(c.flags[CASTLE_GATE_FLAG]);
    assert.ok(said(bot, 'ガルドが、反対がわの石の板に乗った', from));
  }
  // だれも いない
  {
    const { world, bot, c } = await soloAt(6103, 'c4_sara', { guest: false });
    world.placeSession(bot.s, 'sand_castle1', px + 1.5, py + 0.5, 'left', true);
    await bot.settle();
    const from = bot.msgs.length;
    step(bot, px, py);
    await bot.settle();
    assert.ok(!c.flags[CASTLE_GATE_FLAG], '開かない');
    assert.ok(said(bot, '仲間を連れてこよう', from));
  }
});

async function familyAt(seed, flagsUpTo) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of UPTO(flagsUpTo)) Pa.char.flags[f] = true;
  if (flagsUpTo === 'c4_letter') Pa.char.keyItems.push('queen_letter');
  Pa.char.objective = objectiveFromFlags(Pa.char);
  boost(Pa.char, 36);
  boost(Y.char, 36);
  world.sendSelf(Pa);
  world.sendSelf(Y);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y };
}
async function settleBoth(a, b) {
  for (let i = 0; i < 4; i++) {
    await a.settle();
    await b.settle();
  }
}

test('家族で: 手伝いの ユイが バルガに 話しても、リーダー（パパ）の 物語で サラが 仲間に なる。2つの 石の 板は 2人で 同時に ふむ', { timeout: 120000 }, async () => {
  const { world, papa, yui, Pa, Y } = await familyAt(6201, 'c4_letter');
  Pa.char.flags.c4_duna_gate = true;
  Pa.char.flags.c4_duna = true;
  Pa.char.flags.c4_duna_seen = true;
  const yuiBefore = JSON.stringify({ flags: Y.char.flags, guests: Y.char.guests || [] });
  const [bx, by] = [DUNA_POS.barga.x, DUNA_POS.barga.y];
  world.placeSession(Pa, 'duna', bx - 0.5, by + 2.5, 'up', true);
  world.placeSession(Y, 'duna', bx + 0.5, by + 2.5, 'up', true);
  await settleBoth(papa, yui);
  yui.send({ t: 'interact', kind: 'npc', id: 'barga' });
  await settleBoth(papa, yui);
  assert.ok(Pa.char.flags.c4_sara, 'パパの 物語が すすむ');
  assert.deepEqual(Pa.char.guests, ['sara'], 'サラは リーダーの ゲスト');
  assert.ok(!Pa.char.keyItems.includes('queen_letter'), '手紙は バルガへ');
  assert.equal(Pa.char.objective, C4_OBJ.sara);
  assert.equal(JSON.stringify({ flags: Y.char.flags, guests: Y.char.guests || [] }), yuiBefore, 'ユイの 物語は そのまま');
  assert.ok(said(yui, '口だけなら、何とでも言える'), 'ユイも 見ている');
  const p = world.parties.get(Pa.partyId);
  assert.ok(p.guests.some((g) => g.id === 'sara' && g.char.name === 'サラ'), 'パーティーに サラ');
  // 2つの 石の 板: パパだけ 乗っても 開かない（家族は 2人で ふむ。サラは かわりに ならない）
  const [[ax, ay], [cx, cy]] = CASTLE_PLATES;
  world.placeSession(Pa, 'sand_castle1', ax + 1.5, ay + 0.5, 'left', true);
  world.placeSession(Y, 'sand_castle1', cx - 0.5, cy + 0.5, 'right', true);
  await settleBoth(papa, yui);
  step(papa, ax, ay);
  await settleBoth(papa, yui);
  assert.ok(!Pa.char.flags[CASTLE_GATE_FLAG], '1人では 開かない');
  assert.ok(said(papa, '家族のもう1人に'), 'もう1人を まつ');
  step(yui, cx, cy);
  await settleBoth(papa, yui);
  assert.ok(Pa.char.flags[CASTLE_GATE_FLAG], '2人 そろうと 開く');
  assert.ok(!Y.char.flags[CASTLE_GATE_FLAG], 'ユイの 世界は かわらない');
});

// ───────────── 通しで（谷の 門 → ドゥナ → 古城 → すなかぜ号 → 砂クジラ）─────────────
async function pumpBattle(bot, world, species, n = 3000) {
  for (let i = 0; i < n; i++) {
    const ctx2 = [...world.battles.values()][0];
    if (ctx2 && ctx2.battle.enemies.some((e) => e.species === species)) return ctx2;
    bot.flushQueue();
    await tickN(world, 1);
  }
  return null;
}
function winBattle(ctx2) {
  const b = ctx2.battle;
  const a = b.allies[0];
  for (const e of b.enemies) if (e.alive) b.damage(a, e, e.hp, evOf(a), { element: 'bolt' });
  b.checkEnd();
}

test('通しで あそべる: 谷の 見張り → ドゥナ → バルガ・サラ → 砂の古城（サラと 2つの 石の 板）→ 船のかじ → すなかぜ号 → 砂クジラ → サラは さんばしで 待つ', { timeout: 240000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(6301), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO('c4_letter')) c.flags[f] = true;
  c.keyItems.push('queen_letter');
  c.objective = C4_OBJ.letter;
  boost(c, 36);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  bot.keepResult = false;
  // 谷の 見張り（手紙を 見せる → かしらの 返事で 門が 開く）
  const L = DUNA_LOOKOUTS[0];
  world.placeSession(bot.s, 'south', L.x + 1.5, L.y - 0.5, 'down', true);
  await bot.settle();
  await bot.talk(L.id);
  assert.ok(c.flags.c4_duna_gate && c.flags.c4_duna, '門が 開いた');
  assert.equal(c.objective, C4_OBJ.duna);
  // 谷を 下りて ドゥナへ（町に 入ると 場面）
  await bot.walkTo(DUNA_GATE.x, DUNA_VALLEY_EXIT.y);
  assert.equal(bot.map, 'duna');
  await bot.walkTo(DUNA_POS.gate.x, DUNA_POS.gate.y + 1);
  await bot.settle();
  assert.ok(c.flags.c4_duna_seen, 'ドゥナに 着いた');
  assert.ok(c.visited?.duna, 'ルーラで 来られる');
  // かしらバルガ → サラが 仲間に
  await bot.walkTo(DUNA_POS.barga.x, DUNA_POS.barga.y + 2);
  await bot.talk('barga');
  assert.ok(c.flags.c4_sara);
  assert.deepEqual(c.guests, ['sara'], 'サラ（ゲスト）');
  assert.ok(!c.keyItems.includes('queen_letter'));
  assert.equal(c.objective, C4_OBJ.sara);
  const g = guestChar(world, 'sara', 36);
  assert.ok(g && g.job === 'pirate' && g.equip.weapon === 'snake_whip' && g.level === 36, 'サラは 海賊（ムチ）');
  assert.ok(GUESTS.sara && GUESTS.sara.minLevel === 30);
  // 東の 門を 出て 砂の古城へ
  await bot.walkTo(DUNA_POS.castleDoor.x, DUNA_POS.castleDoor.y);
  assert.equal(bot.map, 'sand_castle1');
  await bot.settle();
  assert.ok(c.flags.c4_castle_seen, '古城に 入った');
  // 2つの 石の 板（サラが もう1つを ふむ）
  const [px, py] = CASTLE_PLATES[0];
  await bot.walkTo(px, py);
  await bot.settle();
  assert.ok(c.flags[CASTLE_GATE_FLAG], 'こうしが 開いた');
  // 2階 → たからべや（古城の よろい 2体）→ 船のかじ
  await bot.walkTo(CASTLE_POS.up1.x, CASTLE_POS.up1.y);
  assert.equal(bot.map, 'sand_castle2');
  await bot.walkTo(CASTLE_POS.rudder.x, CASTLE_POS.rudder.y + 5);
  await bot.settle();
  step(bot, CASTLE_POS.rudder.x, CASTLE_POS.rudder.y + 4);
  const guard = await pumpBattle(bot, world, 'castle_armor');
  assert.ok(guard, '古城の よろいと 戦う');
  assert.equal(guard.battle.enemies.filter((e) => e.species === 'castle_armor').length, 2);
  assert.equal(guard.battle.snapshot().bg, 'sand_castle');
  assert.ok(guard.battle.allies.some((a) => a.name === 'サラ'), 'サラも 戦う');
  winBattle(guard);
  for (let i = 0; i < 6; i++) await bot.settle();
  assert.ok(c.flags.c4_castle && c.keyItems.includes('ship_rudder'), '船のかじ');
  assert.equal(c.objective, C4_OBJ.castle);
  // ドゥナへ もどって バルガに かじを とどける → すなかぜ号
  await bot.walkTo(CASTLE_POS.down2.x, CASTLE_POS.down2.y);
  assert.equal(bot.map, 'sand_castle1');
  await bot.walkTo(CASTLE_POS.exit1.x, CASTLE_POS.exit1.y);
  assert.equal(bot.map, 'duna');
  await bot.walkTo(DUNA_POS.barga.x, DUNA_POS.barga.y + 2);
  await bot.talk('barga');
  assert.ok(c.flags.c4_ship && !c.keyItems.includes('ship_rudder'));
  assert.equal(c.objective, C4_OBJ.ship);
  // すなかぜ号で 砂の海へ
  await bot.walkTo(Math.floor(DUNA_POS.ship.x), Math.floor(DUNA_POS.ship.y) - 1);
  bot.choice = 0;
  await bot.talk('sand_ship');
  assert.equal(bot.map, 'sand_sea');
  assert.ok(c.flags.c4_sailed);
  // クジラの ねどこへ（近づくと 砂クジラ）
  const N = SANDSEA_POS.nest;
  await bot.walkTo(N.x, N.y - Math.round(WHALE_RING) - 2);
  step(bot, N.x, N.y - Math.round(WHALE_RING));
  const boss = await pumpBattle(bot, world, 'sand_whale');
  assert.ok(boss, '砂クジラと 戦う');
  assert.equal(boss.battle.snapshot().bg, 'whale_deck');
  assert.ok(said(bot, '砂クジラ…！砂の海の主だよ！'));
  winBattle(boss);
  for (let i = 0; i < 8; i++) await bot.settle();
  assert.ok(c.flags.c4_whale, '砂クジラが 正気に');
  for (const f of CH4_STEPS.slice(0, CH4_STEPS.indexOf('c4_whale') + 1)) assert.ok(c.flags[f], f);
  assert.ok(ownsItem(c, 'whale_charm'), '砂クジラのお守り');
  assert.ok(said(bot, '砂の底の神殿の入口は、わたしがねむっていた所の下だ。'));
  assert.equal(bot.map, 'duna', 'ドゥナの さんばしへ もどる');
  assert.deepEqual(c.guests, [], 'サラは パーティーから はなれる');
  assert.equal(c.objective, C4_OBJ.whale);
  // さんばしの サラ・ねどこの 砂クジラ（うずが しずまる）
  const has = world.hasFlagFn(bot.s);
  assert.ok(MAPS.duna.npcById.sara_pier.show.all.every(has));
  assert.ok(!MAPS.duna.npcById.sara_duna.show.not.every((f) => !has(f)), '館の サラは いない');
  assert.equal(effectiveTile(MAPS.sand_sea, N.x, N.y, has), T.SAND_SEA);
  // さんばしの サラに 話すと、また 仲間に なる（Step 7。test/ch4-temple.test.js）
  const from = bot.msgs.length;
  await bot.walkTo(DUNA_POS.pierTop.x + 1, DUNA_POS.pierTop.y + 3);
  await bot.talk('sara_pier');
  assert.ok(said(bot, '砂の下から、歌が聞こえるの', from));
  assert.deepEqual(c.guests, ['sara']);
});

// ───────────── 絵と 音（ブラウザ なしで しらべられる ところ）─────────────
test('絵と 音: 砂ザメ・古城のよろい・砂クジラの え（砂ザメ 2ひきと ならんでも ちぢまない）・NPC の みため・タイル・戦いの 背景・エフェクト・4きょく', async () => {
  const { MONSTER_ART, bigNpcScale } = await import('../public/js/client/render/monsters.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { paintTile, hasTileArt, isAnimated, prepareMap } = await import('../public/js/client/render/tiles.js');
  const { battleBgSpec, battleBackground } = await import('../public/js/client/render/battlefx.js');
  const { playCh4Fx } = await import('../public/js/client/render/battlefx-ch4.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  // 魔物の え
  for (const id of ['sand_shark', 'castle_armor', 'sand_whale']) assert.ok(MONSTER_ART[id]?.draw, id);
  const [ww, wh] = MONSTER_ART.sand_whale.size;
  assert.ok(ww >= 110 && ww <= 140 && wh + 2 <= 124, `砂クジラ ${ww}×${wh}`);
  const row = [ww, MONSTER_ART.sand_shark.size[0], MONSTER_ART.sand_shark.size[0]].reduce((s, v) => s + v + 6, 0);
  assert.ok(row <= 256 - 12, `ならんだ はば ${row}`);
  assert.equal(bigNpcScale('mon:sand_whale'), null, 'フィールドの 大きな NPC（ねどこの 砂クジラ）');
  // ドゥナの 人・すなかぜ号・船のかじ
  for (const id of ['barga', 'pirate_f', 'pirate_old', 'pirate_kid', 'shipwright', 'pirate_mate']) assert.ok(npcOpts(id), id);
  assert.ok(npcOpts('barga').hat === 'turban' && npcOpts('barga').beard, 'バルガ');
  for (const dir of ['down', 'up', 'left', 'right']) {
    const a = paintSpecial('sand_ship', dir, 0), b = paintSpecial('sand_ship', dir, 1);
    assert.ok(a && b && a.px.filter(Boolean).length > 400, dir);
  }
  assert.ok(paintSpecial('rudder', 'down', 0)?.px.some(Boolean));
  // タイル: 砂の海（うごく・岸）・砂の うず（ねどこの まん中で 1つの うず）
  for (const t of [T.SAND_SEA, T.SAND_WHIRL]) {
    assert.ok(hasTileArt(t) && isAnimated(t), TILE_INFO[t].name);
    const p0 = paintTile(t, 0x88, 0, 0), p1 = paintTile(t, 0x88, 1, 0);
    assert.ok(p0.px.every(Boolean), 'ぜんぶ ぬる');
    assert.notEqual(p0.px.join(), p1.px.join(), 'コマで うごく');
  }
  assert.notEqual(paintTile(T.SAND_SEA, 1, 0, 1).px.join(), paintTile(T.SAND_SEA, 1, 0, 0).px.join(), '岸');
  const r = prepareMap(MAPS.sand_sea);
  const N = SANDSEA_POS.nest;
  assert.equal(r.variant[N.y * MAPS.sand_sea.w + N.x], 0x88, 'うずの まん中');
  for (const id of DUNA_MAPS) {
    const m = MAPS[id];
    const ids = new Set(m.tiles);
    for (const gt of m.gates) { ids.add(gt.open); ids.add(gt.closed); }
    for (const t of ids) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 戦いの 背景
  for (const id of ['sand_castle', 'sand_sea', 'sand_sea_night', 'whale_deck']) assert.ok(battleBgSpec(id), id);
  for (const z of ['s_duna', 's_duna_night', 's_castle', 's_castle2', 's_sandsea', 's_sandsea_night']) assert.ok(battleBgSpec(ZONE_BG[z]), z);
  assert.ok(battleBgSpec('sand_sea').deck && battleBgSpec('whale_deck').deck, 'すなかぜ号の かんぱん');
  const calls = { fillRect: 0 };
  const fake = () => ({
    width: 0, height: 0,
    getContext: () => ({
      fillStyle: '', strokeStyle: '', lineWidth: 1, imageSmoothingEnabled: true,
      fillRect() { calls.fillRect++; }, beginPath() {}, fill() {}, ellipse() {}, arc() {}, stroke() {}, moveTo() {}, lineTo() {},
      createRadialGradient: () => ({ addColorStop() {} }),
    }),
  });
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: fake };
  try {
    for (const id of ['sand_castle', 'sand_sea', 'sand_sea_night', 'whale_deck']) {
      const before = calls.fillRect;
      assert.ok(battleBackground(id) && calls.fillRect - before > 300, `${id} を かいた`);
    }
  } finally {
    if (had) globalThis.document = prev; else delete globalThis.document;
  }
  // エフェクト（砂に もぐる・もり上がる・砂しぶき・大ジャンプ）
  const fx = { tintAt() {}, add() {}, burst() {}, debris() {}, shock() {}, hitStop() {}, flashAt() {} };
  for (const anim of ['burrow', 'burrow_rise', 'sand_spray', 'whale_jump']) assert.ok(playCh4Fx(fx, anim, [{ x: 100, y: 60 }], null), anim);
  for (const id of ['m_whale_dive', 'm_whale_jump', 'm_whale_spray']) assert.ok(playCh4Fx(fx, ABILITIES[id].anim, [{ x: 1, y: 1 }], null), id);
  // 曲（ドゥナ・砂の海・砂クジラ・砂の古城）
  const NEW = ['duna', 'sand_sea', 'whale', 'sand_castle'];
  for (const id of NEW) {
    const tr = _TRACKS[id];
    assert.ok(tr && !tr.once && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum), `${id}: たいこに r`);
  }
  const mel = Object.entries(_TRACKS).map(([, tr]) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
  assert.equal(MAPS.duna.bgm, 'duna');
  assert.equal(MAPS.sand_sea.bgm, 'sand_sea');
  assert.equal(MAPS.sand_castle1.bgm, 'sand_castle');
  assert.equal(FIXED_ENCOUNTERS.sand_whale.bgm, 'whale');
});
