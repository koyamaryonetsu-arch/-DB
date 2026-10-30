// 第2部 第6章 Step 6 B（戦い・品）「時計塔の心臓」
// 名前の 約束（docs/plan-ch6.md の 17）・ゼンマイ（1だんめ: 家来の しかけを じゅんばんに／2だんめ: 文字ばんの 針・歯車 3つ・時の大ほうかい）・
// 知っている 人と ふつうの オート・出現表 t6_tower_high・新しい 魔物 7しゅ（配合で 足りない ランク）・宝箱・ゼンマイの 品・第6章クリアの 武器（幻の職業も）・
// ぜんまい馬（千年前でも 乗れる）・リオンの けいこ（1人で 戦う）・時のまぼろし（1日1回・けいじ板）・絵・エフェクト・がめん・文字
// A の マップ・台本は まだ ないので、きまった 戦いは startFixedBattle（台本の ['battle', id] と おなじ）で 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool, rankOf } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { starsOf, rarityOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { canEquip } from '../public/js/shared/stats.js';
import { VEHICLES, rideShown, chooseVehicle, pastRide } from '../public/js/shared/data/vehicles.js';
import { vehicleSteps } from '../public/js/shared/data/fq-common.js';
import { MONSTERS_TOKEI6, ZENMAI, ZEN_GEARS, RION_SPARS, TOKI_PHANTOM_BASES, tokiPhantomId, TOKEI6_MAT_DROPS } from '../public/js/shared/data/monsters-tokei6.js';
import { TOKEI6_ABILITIES, ZEN_BY } from '../public/js/shared/data/abilities-tokei6.js';
import { FRIENDS_TOKEI6 } from '../public/js/shared/data/companions-tokei6.js';
import { ENCOUNTERS_TOKEI6, FIXED_TOKEI6, ZONE_BG_TOKEI6, tokiPhantomBase, dayKeyOf } from '../public/js/shared/data/encounters-tokei6.js';
import { TOKEI_TREASURE_HIGH, C6_CLEAR_WEAPONS, c6ClearPick, TOKEI6_DROPS, TOKEI_K } from '../public/js/shared/data/items-tokei.js';
import { ITEMS_TOKEI6, TOKEI6_K, TOKEI6_ITEM_KANA, TOKI_PHANTOM_REWARD, TOKEI6_RECIPES } from '../public/js/shared/data/items-tokei6.js';
import { RECIPE_BY_ID } from '../public/js/shared/data/alchemy.js';
import { COLLAPSE, collapseBefore, tokei6Know } from '../public/js/shared/battle-tokei6.js';
import { ch6Plan, AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { tokiPhantomAfter, tokiPhantomDone, tokiPhantomToday } from '../public/js/shared/world/tokei-phantom.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { ch6Run, ch6Party, CH6_LV, CH6_KIT } from '../tools/sim-ch6.mjs';
import { rankPoints } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { playTokei6Fx, TOKEI6_FINE } from '../public/js/client/render/battlefx-tokei6.js';
import { playTokeiFx } from '../public/js/client/render/battlefx-tokei.js';
import { TOKEI6_SCREEN_ANIMS, TOKEI6_ALLY_FX, TOKEI6_SFX, TOKEI6_OWN_TELE, kindOf, tokei6Draw, tokei6Present, tokei6Sprite } from '../public/js/client/battle-tokei6.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_TOKEI6).filter((id) => id !== ZENMAI);
function zenBattle(seed = 3, lv = 68) {
  const party = ch6Party('zenmai', lv);
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies: party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' })), enemies: [ZENMAI] });
  return { b, z: b.enemies[0] };
}
// ゼンマイの 番を 1回 はじめる（battle.js の executeNext の はじめと おなじ よびかた）
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
const turn = (b, c) => {
  const ev = { lines: [], upd: [] };
  towerTurnStart(b, c, ev, { type: 'ai' });
  return ev;
};
// HP を へらして 2だんめへ（ダメージの あと battle.js が checkPhase を よぶ）
function toPhase2(b, z) {
  z.hp = Math.floor(z.maxHp * 0.45);
  const ev = { lines: [], upd: [], results: [] };
  b.checkPhase(z, ev);
  return ev;
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 17）: zenmai・rion_spar1〜3・toki_phantom・t6_tower_high・宝・乗り物', () => {
  const f = FIXED_ENCOUNTERS.zenmai;
  assert.equal(f, FIXED_TOKEI6.zenmai);
  assert.deepEqual(f.group, [['zenmai', 1, 1]]);
  assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm === 'boss6' && f.bg === 'tokei');
  for (const id of ['rion_spar1', 'rion_spar2', 'rion_spar3']) {
    const s = FIXED_ENCOUNTERS[id];
    assert.ok(s && s.loseOk === true && s.solo === true && s.canFlee === false, id);
  }
  const t = FIXED_ENCOUNTERS.toki_phantom;
  assert.ok(t && t.boss && t.loseOk && typeof t.pick === 'function');
  assert.deepEqual(Object.keys(ENCOUNTERS_TOKEI6), ['t6_tower_high']);
  assert.equal(ENCOUNTER_TABLES.t6_tower_high, ENCOUNTERS_TOKEI6.t6_tower_high);
  assert.equal(ZONE_BG.t6_tower_high, 'tokei');
  assert.deepEqual(ZONE_BG_TOKEI6, { t6_tower_high: 'tokei' });
  assert.deepEqual(Object.keys(TOKEI_TREASURE_HIGH).map(Number), [6, 7, 8, 9, 10]);
  for (const list of Object.values(TOKEI_TREASURE_HIGH)) assert.equal(list.length, 2);
  assert.equal(C6_CLEAR_WEAPONS.length, 5);
  assert.ok(VEHICLES.zenmai_horse && VEHICLES.zenmai_horse.name === 'ぜんまい馬');
  assert.equal(MONSTERS.zenmai.name, 'ゼンマイ');
});

// ───────────── ゼンマイ 1だんめ ─────────────
test('ゼンマイ 1だんめ: 砂 → まきもどし → ふりこ → かね の じゅんに 家来の しかけ（名前と セリフは ゼンマイ）', () => {
  const { b, z } = zenBattle();
  assert.equal(z.zen.phase, 1);
  assert.equal(z.zen.st, 'sand');
  assert.ok(z.sand && !z.gear && !z.pend && !z.bell);
  assert.equal(pub(z).kindAs, 'sand_clock');
  // 知っている 人で 戦って、しかけの じゅんばんを 見る
  b.knowsCh6 = true;
  const seen = [];
  let real = 0;
  while (!b.over && real < 30 * 60 * 1000 && z.zen.phase === 1) {
    for (const e of b.tick(50)) if (e.t === 'act' && e.zenStage) seen.push(e.zenStage.st);
    real += 50;
  }
  assert.ok(seen.length >= 1, '次の しかけへ');
  const order = ['gear', 'pend', 'bell', 'sand'];
  seen.forEach((st, i) => assert.equal(st, order[i % 4]));
  // 家来の 技を ゼンマイが 使う ときは 名前・セリフが かわる（強さは おなじ）
  for (const id of Object.keys(ZEN_BY)) {
    const a = abilityFor(id, z);
    assert.ok(a !== ABILITIES[id] && a.effect === ABILITIES[id].effect && a.cast.includes('{a}') || a.cast.includes('ゼンマイ'), id);
    assert.equal(abilityFor(id, { species: 'sand_clock' }), ABILITIES[id]);
  }
  assert.equal(abilityFor('m6_sc_fall', { species: 'toki_ph_zenmai', base: 'zenmai' }).cast, ABILITIES.m6_sc_fall.by.zenmai.cast);
});

test('ゼンマイ 1だんめ: 砂は 氷で もどらない（前ぶれの 間に 氷で 止めると 次の しかけへ）', () => {
  const { b, z } = zenBattle(5);
  z.sand.lv = 1;
  turn(b, z);
  assert.equal(z.telegraph, 'm6_sc_fall_charge');
  assert.ok(z.zen.armed);
  z.telegraph = 'm6_sc_fall';
  const hero = b.allies[0];
  const ev = { lines: [], upd: [], results: [] };
  // 氷を 当てる
  b.damage(hero, z, 100, ev, { element: 'ice' });
  assert.equal(z.telegraph, null, '大砂流は 止まった');
  const ev2 = turn(b, z);
  assert.equal(z.zen.st, 'gear');
  assert.ok(ev2.zenStage);
  // 氷で 砂は もどらない
  const { b: b2, z: z2 } = zenBattle(6);
  z2.sand.lv = 2;
  b2.damage(b2.allies[0], z2, 100, { lines: [], upd: [], results: [] }, { element: 'ice' });
  assert.equal(z2.sand.lv, 2);
});

test('ゼンマイ: ふりこの しかけが おわると、止まっていた 人も 動き出し、ゲージの 速さも もとに もどる', () => {
  const { b, z } = zenBattle(7);
  // ふりこの しかけへ
  z.zen.idx = 1;
  z.zen.st = 'gear';
  delete z.sand;
  z.gear = { count: 0, rec: null, left: 0, hits: 0, fast: false };
  z.zen.recSeen = true;
  turn(b, z);
  assert.equal(z.zen.st, 'pend');
  b.allies[0].tstop = 2;
  b.allies[0].tmul = 0;
  z.zen.fire = true;
  turn(b, z);
  assert.equal(z.zen.st, 'bell');
  assert.ok(!z.pend && b.allies.every((a) => !(a.tstop > 0) && a.tmul === 1) && z.tmul === 1);
  assert.ok(z.bell && z.bell.max === 4);
});

// ───────────── ゼンマイ 2だんめ ─────────────
test('ゼンマイ 2だんめ: HP 半分で 歯車 3つ（弱点 氷・雷・光）。針は 動く たびに 1時間・12時で 時の大ほうかい', () => {
  const { b, z } = zenBattle(8);
  const ev = toPhase2(b, z);
  assert.equal(z.zen.phase, 2);
  assert.ok(ev.zenP2 && ev.joined?.length === 3);
  const gears = b.enemies.filter((e) => MONSTERS[e.species].zenGear);
  assert.deepEqual(gears.map((g) => MONSTERS[g.species].zenGear).sort(), ['bolt', 'ice', 'light']);
  for (const g of gears) {
    const weak = MONSTERS[g.species].zenGear;
    assert.ok(g.resist[weak] >= 2 && Object.entries(g.resist).filter(([k]) => k !== weak && ['fire', 'ice', 'bolt', 'light', 'dark', 'wind'].includes(k)).every(([, v]) => v <= 0.25), g.species);
    assert.equal(pub(g).zenGear, weak);
  }
  assert.ok(!z.sand && !z.gear && !z.pend && !z.bell);
  const hc = MONSTERS.zenmai.ch6.zen.hand;
  assert.equal(z.zen.hand, hc.start);
  for (let h = hc.start + 1; h < hc.max; h++) {
    const e = turn(b, z);
    assert.equal(z.zen.hand, h);
    assert.equal(e.zenHand.hand, h);
    assert.ok(!z.telegraph);
  }
  turn(b, z);
  assert.equal(z.zen.hand, hc.max);
  assert.equal(z.telegraph, COLLAPSE);
  const p = pub(z);
  assert.ok(p.zen === 2 && p.hand === hc.max && p.handMax === 12 && p.handWarn === 10);
});

test('時の大ほうかい: みんなに 大きな 一撃（身を 守ると 半分）・針は はじめの 時に もどる', () => {
  const run = (guard) => {
    const { b, z } = zenBattle(9);
    toPhase2(b, z);
    z.zen.hand = 11;
    z.telegraph = COLLAPSE;
    if (guard) for (const a of b.allies) a.defending = true;
    const ev = { lines: [], upd: [], results: [] };
    b.applyAbility(z, ABILITIES[COLLAPSE], { type: 'ability', id: COLLAPSE }, ev, 1);
    assert.ok(ev.zenCollapse);
    assert.equal(z.zen.hand, MONSTERS.zenmai.ch6.zen.hand.start);
    return ev.results.reduce((s, r) => s + (r.dmg || 0), 0);
  };
  const open = run(false), guard = run(true);
  assert.ok(open > 1500, String(open));
  assert.ok(guard < open * 0.7, `${guard} / ${open}`);
});

test('歯車: こわすと 針が 3時間 もどる（はじめの 時より 前には もどらない）・ゼンマイが 6回 動くと また 回り出す・ゼンマイが たおれると 消える', () => {
  const { b, z } = zenBattle(10);
  toPhase2(b, z);
  z.zen.hand = 10;
  const g = b.enemies.find((e) => e.species === ZEN_GEARS.ice);
  const ev = { lines: [], upd: [], results: [] };
  b.damage(b.allies[0], g, 99999, ev, { element: 'ice' });
  assert.ok(!g.alive && ev.zenBack);
  assert.equal(z.zen.hand, 7);
  z.zen.hand = MONSTERS.zenmai.ch6.zen.hand.start + 1;
  const g2 = b.enemies.find((e) => e.species === ZEN_GEARS.bolt);
  b.damage(b.allies[0], g2, 99999, { lines: [], upd: [], results: [] }, { element: 'bolt' });
  assert.equal(z.zen.hand, MONSTERS.zenmai.ch6.zen.hand.start);
  const rev = MONSTERS.zenmai.ch6.zen.hand.revive;
  for (let i = 0; i < rev - 1; i++) turn(b, z);
  assert.ok(!g.alive);
  const e = turn(b, z);
  assert.ok(g.alive && g.hp === g.maxHp && e.zenRevive?.includes(g.id));
  assert.ok(!b.killed.includes(g.species) || b.killed.filter((x) => x === g.species).length === 0, '生き返った 歯車は 数えなおす');
  // ゼンマイが たおれると 歯車も
  b.damage(b.allies[0], z, z.hp + 10, { lines: [], upd: [], results: [] }, {});
  assert.ok(b.enemies.every((x) => !x.alive));
  assert.ok(MONSTERS[ZEN_GEARS.light].exp === 0 && MONSTERS[ZEN_GEARS.light].gold === 0);
  assert.ok(!Object.keys(MONSTERS).includes(ZEN_GEARS.ice), '数えない 形');
});

test('オート: 知っている 人は 針が 10時を こえたら 歯車を 弱点で ねらう・ふつうの オートは 大ほうかいの 前に よく 身を 守る', () => {
  const { b, z } = zenBattle(11);
  toPhase2(b, z);
  b.knowsCh6 = true;
  z.zen.hand = 10;
  const picks = [];
  for (const a of b.allies) {
    const cmd = ch6Plan(b, a, decideAlly);
    if (cmd?.type === 'ability') {
      const t = b.get(cmd.target);
      if (t && MONSTERS[t.species].zenGear) {
        assert.equal(ABILITIES[cmd.id].effect.element ?? ABILITIES[cmd.id].effect.parts?.[0]?.element, MONSTERS[t.species].zenGear, cmd.id);
        picks.push(cmd.id);
      }
    }
  }
  assert.ok(picks.length >= 2, String(picks));
  // 針が 10時より 前は ふだんの 戦い
  z.zen.hand = 5;
  assert.equal(tokei6Know(b, b.allies[0], z, 'base'), 'base');
  // 知らない 人（c6NoGear）は 歯車を ねらわない
  z.zen.hand = 10;
  b.c6NoGear = true;
  assert.equal(tokei6Know(b, b.allies[0], z, 'base'), 'base');
  // ふつうの オート: 大ほうかいが 自分の 番より 先なら HPが へっていれば よく 守る
  b.knowsCh6 = false;
  b.c6NoGear = false;
  z.zen.hand = 11;
  z.atb = 99;
  const a = b.allies[0];
  assert.ok(collapseBefore(b, a, z));
  a.hp = Math.floor(a.maxHp * (AUTO_GUARD.hp - 0.1));
  let guards = 0;
  for (let i = 0; i < 40; i++) if (ch6Plan(b, a, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, String(guards));
});

test('シミュレーション（plan-ch6.md の 8）: 知っている 人は 勝ちやすく、知らない 人は 半分くらい（sim-ch6.mjs の zenmai）', { timeout: 240000 }, () => {
  assert.equal(CH6_LV.zenmai, 68);
  assert.ok(CH6_KIT.zenmai.hero.includes('p6z_heart_sword'));
  const N = 12;
  const rate = (skip) => [...Array(N).keys()].filter((i) => ch6Run('zenmai', 68, true, 6060 + i * 7919, { skip }).outcome === 'win').length / N;
  const know = rate(null), naive = rate('trick');
  assert.ok(know >= 0.65, `知っている ${know}`);
  assert.ok(naive <= 0.75 && naive < know, `知らない ${naive} / 知っている ${know}`);
  const auto = ch6Run('zenmai', 68, false, 6060);
  assert.ok(auto.p2 || auto.stages >= 1, JSON.stringify(auto));
});

// ───────────── 魔物 ─────────────
test('新しい 魔物 7しゅ: どれも 仲間に なる・配合で 足りない 系統と ランク（ゾンビ A・せいれい A と B・物質 S・植物 B・悪魔 B・ゾンビ B）', () => {
  const want = { tokei_ghost: ['undead', 'A'], bell_sprite: ['spirit', 'A'], second_sprite: ['spirit', 'B'], clock_golem: ['material', 'S'], zenmai_fern: ['plant', 'B'], wind_devil: ['demon', 'B'], clock_bones: ['undead', 'B'] };
  assert.deepEqual(NEW.slice().sort(), Object.keys(want).sort());
  const sps = new Set(ENCOUNTERS_TOKEI6.t6_tower_high.flatMap((e) => e.group.map(([sp]) => sp)));
  let newArt = 0;
  for (const [id, [race, rank]] of Object.entries(want)) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_TOKEI6[id]);
    assert.equal(m.race, race, id);
    assert.ok(m.lv >= 66 && m.lv <= 68 && m.region === 6 && m.desc && !m.noBefriend, id);
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_TOKEI6[id]);
    assert.ok(f.rate > 0 && !f.noFamily && f.names.length >= 3 && f.note, id);
    for (const [, ab] of f.learn) assert.ok(ABILITIES[ab], `${id}: ${ab}`);
    assert.equal(MONSTER_RANKS[id], rank, id);
    assert.equal(rankPoints(id).rank, rank, id);
    assert.equal(rankOf(id, MONSTERS), rank, id);
    assert.ok(familyPool(race, MONSTERS).includes(id), `${id}: 配合の 子にも なる`);
    assert.ok(sps.has(id), id);
    assert.ok(MAT_DROPS[id] && TOKEI6_MAT_DROPS[id], id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    if (MONSTER_ART[id]) newArt++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${id}: 今の 絵の 色がえ`);
  }
  assert.equal(newArt, 4, '新しい 絵は 4しゅ まで');
  for (const a of Object.values(TOKEI6_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
});

// ───────────── 品 ─────────────
test('宝箱: 時計塔 6〜10階に 2つずつ。ランク10の ★5（オレンジ）・5階の 宝より 少し 上・上の 階ほど 強い', () => {
  const all = Object.values(TOKEI_TREASURE_HIGH).flat();
  assert.equal(new Set(all).size, 10);
  for (const id of all) {
    const it = ITEMS[id];
    assert.equal(it, ITEMS_TOKEI6[id], id);
    assert.ok(it.rank === 10 && rarityOf(id) === 4 && starsOf(id) === 5 && it.src === 'tokei', id);
    assert.ok(!(it.price > 0) && it.sell > 0 && it.desc && ITEM_KANA[id] === TOKEI6_ITEM_KANA[id], id);
  }
  const ks = [6, 7, 8, 9, 10].map((f) => TOKEI6_K[f]);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(TOKEI6_K[6] > TOKEI_K[5]);
  assert.ok(ITEMS.p6z_heart_sword.atk > ITEMS.p6t_tower_sword.atk && ITEMS.p6z_heart_sword.atk < ITEMS.p6t_tower_sword.atk * 1.1);
  // 名前が かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    if (ITEMS_TOKEI6[id]) assert.ok(!names.has(it.name), `名前が かぶる: ${it.name}`);
    names.set(it.name, id);
  }
});

test('ゼンマイの 品: かならず 1人 1つの ★5（レア度3）と、いちばん めずらしい 色の つえ。カリヨンの 品より 強い', () => {
  const [acc, weapon] = TOKEI6_DROPS.zenmai;
  assert.deepEqual(MONSTERS.zenmai.drops.boss, [acc]);
  const got = rollDrops('zenmai', makeRng(2));
  assert.ok(got.includes(acc) && got.includes(weapon));
  assert.ok(ITEMS[acc].unique && rarityOf(acc) === 3 && rarityOf(weapon) === 5 && starsOf(weapon) === 5);
  assert.equal(rareWhereText(acc), '時の魔物からしか手に入らない');
  const bsum = (it) => Object.values(it.bonus || {}).reduce((s, v) => s + Math.max(0, v), 0);
  assert.ok(bsum(ITEMS[acc]) > bsum(ITEMS.p6t_bell_charm));
  assert.ok(ITEMS[weapon].atk > ITEMS.p6r_witch_staff.atk);
});

test('第6章クリアの 武器: 職業の なかまごとの 4しゅ ＋ 幻の職業むけ 1しゅ（幻の職業なら だれでも 装備できる）', () => {
  for (const id of C6_CLEAR_WEAPONS) {
    const it = ITEMS[id];
    assert.ok(it.type === 'weapon' && it.rank === 10 && rarityOf(id) === 5 && starsOf(id) === 5 && it.src === 'clear6', id);
    assert.equal(rareWhereText(id), '時計塔のてっぺんでしか手に入らない');
    assert.ok(ITEM_KANA[id], id);
  }
  // 宝箱の 品より 強い
  assert.ok(ITEMS.c6w_sword.atk > ITEMS.p6z_heart_sword.atk && ITEMS.c6w_staff.atk > ITEMS.p6z_heart_staff.atk && ITEMS.c6w_claw.atk > ITEMS.p6z_cog_claw.atk);
  const ph = 'c6w_phantom';
  assert.equal(C6_CLEAR_WEAPONS[4], ph);
  const tier4 = Object.entries(JOBS).filter(([, j]) => j.tier === 4);
  assert.ok(tier4.length >= 8);
  for (const [jid] of tier4) {
    assert.ok(canEquip(jid, ph), jid);
    assert.equal(c6ClearPick(JOBS[jid]), ph);
  }
  assert.ok(!canEquip('daikenja', ph) && !canEquip('mage', ph), '幻の職業で ない 人は 剣の 職業でなければ だめ');
  assert.equal(c6ClearPick(JOBS.hero), 'c6w_sword');
  assert.equal(c6ClearPick(JOBS.daikenja), 'c6w_staff');
  assert.equal(c6ClearPick(JOBS.god_hand), 'c6w_claw');
  // 超級職 ぜんぶ、どれか 1つは 装備できる
  for (const [jid, j] of Object.entries(JOBS)) {
    if (j.tier !== 2 && j.tier !== 3) continue;
    const ok = C6_CLEAR_WEAPONS.some((id) => canEquip(jid, id));
    if (!ok) assert.ok(['nitoryu', 'hall_of_fame', 'mario'].includes(jid), `${jid}: 装備できる 物が ない`);
  }
});

test('時のまぼろしの 素材と れん金: まぼろしの時の砂 → ★5の 指輪・お守り', () => {
  const { id, n } = TOKI_PHANTOM_REWARD;
  assert.ok(ITEMS[id] && ITEMS[id].type === 'mat' && n >= 1);
  for (const r of TOKEI6_RECIPES) {
    assert.equal(RECIPE_BY_ID[r.id], r);
    assert.ok(ITEMS[r.out] && r.ins.every((x) => ITEMS[x]), r.id);
    assert.equal(starsOf(r.out), 5);
  }
});

// ───────────── ぜんまい馬 ─────────────
test('ぜんまい馬: 千年前でも 乗れる はじめての 乗り物（ほかの 乗り物は 千年前では 乗れない）・vehicleSteps で わたせる', async () => {
  const v = VEHICLES.zenmai_horse;
  assert.ok(v.past && v.gift && Array.isArray(v.jobs) && !v.jobs.length && v.price > 0 && v.desc);
  assert.ok(pastRide('zenmai_horse') && !pastRide('horse'));
  assert.equal(rideShown('zenmai_horse', { running: true, past: true }), 'zenmai_horse');
  assert.equal(rideShown('horse', { running: true, past: true }), 'horse'); // 第53回: 千年前でも 前から 乗れていた 乗り物は そのまま
  assert.equal(rideShown('horse', { running: true }), 'horse');
  assert.equal(rideShown('zenmai_horse', { running: true, past: true, ship: true }), null);
  for (const [id, x] of Object.entries(VEHICLES)) if (id !== 'zenmai_horse') assert.ok(!x.past, id);
  // 台本で わたす（パーティーの みんな）
  const steps = vehicleSteps('zenmai_horse');
  const c = { vehicles: [] };
  let said = '';
  await steps[0][1]({ everyone: [{ char: c }], world: { markDirty() {} }, say: (t) => { said = t; }, who: () => 'みんな' });
  assert.deepEqual(c.vehicles, ['zenmai_horse']);
  assert.ok(said.includes('ぜんまい馬'));
  assert.ok(chooseVehicle(c, 'zenmai_horse').ok);
});

// ───────────── リオンの けいこ ─────────────
test('リオンの けいこ: 3回 だんだん 強く・リオンの すがた（人の 絵）・1人で 戦う（仲間・ゲストは 入らない）・負けても よい', { timeout: 180000 }, async () => {
  const [a, b, c] = RION_SPARS.map((id) => MONSTERS[id]);
  assert.ok(a.lv < b.lv && b.lv < c.lv && a.hp < b.hp && b.hp < c.hp && a.str < b.str && b.str < c.str);
  for (const m of [a, b, c]) assert.ok(m.person === 'rion' && m.noBefriend && m.name === 'リオン');
  assert.ok(!Object.keys(MONSTERS).includes('rion_spar1'), '数えない 形');
  const world = new GameWorld({ offline: true, rng: makeRng(53), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], 'rion_spar1');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  const allies = start.snap.combatants.filter((x) => x.side === 'ally');
  assert.equal(allies.length, 1);
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.equal(en.length, 1);
  assert.ok(en[0].person === 'rion' && en[0].look && en[0].job === 'sword_master');
  assert.equal(typeof tokei6Sprite, 'function');
  assert.equal(tokei6Sprite({ species: 'killer' }), null);
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx.opts.solo && ctx.opts.loseOk);
  // 負けても 物語は つづく（お金は へらない）
  const gold = ken.s.char.gold;
  for (const x of ctx.battle.allies) { x.hp = 0; x.alive = false; }
  ctx.battle.checkEnd();
  await ken.settle(20000);
  assert.equal(await done, 'lose');
  assert.equal(ken.s.char.gold, gold);
});

// ───────────── 時のまぼろし ─────────────
test('時のまぼろし: 1日ごとに 第6章の ボスの どれか（もとの しかけ・強い）。勝つと 1日1回 素材・はじめての 勝ちは けいじ板', { timeout: 180000 }, async () => {
  const days = new Set();
  for (let d = 0; d < 6; d++) days.add(tokiPhantomBase(d * 86400000 + 1000));
  assert.equal(days.size, TOKI_PHANTOM_BASES.length);
  for (const base of TOKI_PHANTOM_BASES) {
    const m = MONSTERS[tokiPhantomId(base)];
    assert.ok(m && m.base === base && m.boss && m.lv > MONSTERS[base].lv && m.hp > MONSTERS[base].hp && m.ch6 === MONSTERS[base].ch6, base);
    assert.ok(!Object.keys(MONSTERS).includes(tokiPhantomId(base)) && m.noBefriend && !m.drops?.boss, base);
  }
  assert.equal(TOKEI6_OWN_TELE.includes(tokiPhantomId('zenmai')), true);
  const world = new GameWorld({ offline: true, rng: makeRng(54), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const today = tokiPhantomToday(world.now());
  const done = startFixedBattle(world, ken.s, [ken.s], 'toki_phantom');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.equal(en[0].species, today.id);
  assert.equal(en[0].base, today.base);
  const ctx = [...world.battles.values()][0];
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; }
  ctx.battle.killed.push(today.id);
  ctx.battle.checkEnd();
  await ken.settle(20000);
  assert.equal(await done, 'win');
  const c = ken.s.char;
  const { id, n } = TOKI_PHANTOM_REWARD;
  const count = () => (c.items || []).filter((x) => x.id === id).reduce((t, x) => t + x.n, 0);
  assert.ok(count() >= n, JSON.stringify(c.items));
  assert.ok(tokiPhantomDone(c, world.now()));
  assert.equal(c.tokiPhantom.day, dayKeyOf(world.now()));
  const board = world.data.familyBoard.filter((e) => e.kind === 'toki_phantom');
  assert.equal(board.length, 1);
  assert.ok(board[0].title.includes('時のまぼろし') && board[0].detail && board[0].charId === c.id);
  // おなじ 日の 2回目: 素材は なし・けいじ板も ふえない
  const before = count();
  const per = {};
  tokiPhantomAfter(world, { opts: { fixed: 'toki_phantom' }, battle: ctx.battle }, [ken.s], per, 'win');
  assert.equal(count(), before);
  assert.ok(per[ken.s.id].lines.some((l) => l.includes('もうもらった')));
  assert.equal(world.data.familyBoard.filter((e) => e.kind === 'toki_phantom').length, 1);
  // 次の 日は また もらえる
  c.tokiPhantom.day = '2000-01-01';
  tokiPhantomAfter(world, { opts: { fixed: 'toki_phantom' }, battle: ctx.battle }, [ken.s], {}, 'win');
  assert.ok(count() > before);
  // 負けた ときは 何も なし
  const b2 = count();
  c.tokiPhantom.day = '2000-01-01';
  tokiPhantomAfter(world, { opts: { fixed: 'toki_phantom' }, battle: ctx.battle }, [ken.s], {}, 'lose');
  assert.equal(count(), b2);
});

// ───────────── 絵・エフェクト・がめん ─────────────
test('絵: 新しい 魔物 4しゅ・ゼンマイ・歯車（パレット・大きさ・2コマ）', () => {
  for (const id of ['tokei_ghost', 'bell_sprite', 'clock_golem', 'zenmai_fern', 'zenmai', 'zen_gear']) {
    const d = MONSTER_ART[id];
    assert.ok(d && typeof d.draw === 'function', id);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= (id === 'zenmai' ? 130 : 72)), `${id}: size`);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    for (const f of [0, 1]) {
      const used = new Set();
      const g = { w: d.size[0], h: d.size[1], ell: (x, y, rx, ry, c) => used.add(c), poly: (p, c) => used.add(c), rect: (x, y, w, h, c) => used.add(c), line: (p, c) => used.add(c), dot: (x, y, c) => used.add(c) };
      d.draw(g, f);
      for (const c of used) assert.ok(pal.has(c.toLowerCase()), `${id}: ${c}`);
    }
  }
  assert.equal(MONSTER_ART.zenmai.npc, 0.6);
  for (const id of Object.values(ZEN_GEARS)) assert.equal(MONSTERS[id].art, 'zen_gear');
});

test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(TOKEI6_ABILITIES).map((a) => a.anim).filter((a) => a !== 'none' && !a.startsWith('a6t_'))), 'a6z_bell'];
  for (const a of own) {
    assert.equal(playTokei6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTokeiFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  assert.equal(playTokei6Fx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of TOKEI6_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(TOKEI6_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(TOKEI6_SFX)) assert.ok(own.includes(a), a);
  assert.ok(TOKEI6_SCREEN_ANIMS.includes('a6z_collapse'));
  assert.deepEqual(Object.keys(TOKEI6_FINE).sort(), ['zclock', 'zcog', 'zshard']);
  // 大時計の つぶを にせの キャンバスで かく
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.5, 0.8, 0.99]) TOKEI6_FINE.zclock(x, { x: 100, y: 50, r: 40, spin: 0.4, crack: 0.6, age: t * 1000 }, t);
  TOKEI6_FINE.zcog(x, { x: 1, y: 1, size: 4, age: 10, color: '#ffffff' }, 0.5);
  TOKEI6_FINE.zshard(x, { x: 1, y: 1, size: 4, age: 10, color: '#ffffff' }, 0.5);
});

test('がめん: 1だんめの しかけの しるし・2だんめの 文字ばん・歯車の 弱点・バナー・家来の 目もりを そのまま（kindOf）', () => {
  assert.equal(kindOf({ species: 'zenmai', kindAs: 'sand_clock' }), 'sand_clock');
  assert.equal(kindOf({ species: 'toki_ph_carillon', base: 'carillon' }), 'carillon');
  assert.equal(kindOf({ species: 'killer' }), 'killer');
  for (const id of TOKEI6_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 1000 };
  tokei6Draw(scene, x, null, { alive: true, zen: 1, zenSt: 'gear' }, 100, 20, 100, 110, 1);
  const n1 = drawn.length;
  assert.ok(n1 > 10);
  tokei6Draw(scene, x, null, { alive: true, zen: 2, hand: 11, handMax: 12, handWarn: 10 }, 100, 20, 100, 110, 1);
  assert.ok(drawn.length > n1 + 20);
  const n2 = drawn.length;
  tokei6Draw(scene, x, null, { alive: true, zenGear: 'bolt' }, 40, 60, 30, 30, 1);
  assert.ok(drawn.length > n2);
  const banners = [];
  const sc = { game: { audio: { sfx() {} } }, banner: (t, cls) => banners.push([t, cls]), shake() {} };
  tokei6Present(sc, { zenP2: 'e1' }, {}, null, null);
  tokei6Present(sc, { zenHand: { hand: 11, max: 12 } }, {}, null, null);
  tokei6Present(sc, { zenBack: { hand: 7 } }, {}, null, null);
  tokei6Present(sc, { zenCollapse: 'e1' }, {}, null, null);
  tokei6Present(sc, { zenStage: { st: 'bell' } }, {}, null, null);
  tokei6Present(sc, {}, { type: 'telegraph' }, null, { person: 'rion' });
  assert.equal(banners.length, 6);
  assert.ok(banners[2][1] === 'combo' && banners[1][1] === 'danger');
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし', () => {
  const files = ['monsters-tokei6.js', 'abilities-tokei6.js', 'items-tokei6.js', 'encounters-tokei6.js', 'companions-tokei6.js', 'vehicles-tokei.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-tokei6.js', 'public/js/shared/world/tokei-phantom.js', 'public/js/client/battle-tokei6.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
