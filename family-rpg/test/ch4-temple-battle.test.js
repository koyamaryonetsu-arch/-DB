// 第4章 Step 7「砂の底の神殿とモルガナ」B（戦い）
// 神殿の 魔物・出現表（t_b1_wet・t_b1_dry・t_b2・t_b3）・鏡の騎士（呪文を はね返す）・鏡のうつし身（パーティーそっくり）・
// 水のろうの番人・モルガナ（水の衣・まぼろしの分身・鏡写し）→ 真の姿（大波・水のろう・鏡のうろこ・段階）・水の守りの歌・
// オートの 仲間・シミュレーション・絵・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly, decideMonster } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { monsterDrops, MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTERS_TEMPLE, TEMPLE_MAT_DROPS } from '../public/js/shared/data/monsters-temple.js';
import { TEMPLE_ABILITIES } from '../public/js/shared/data/abilities-temple.js';
import { ITEMS_TEMPLE } from '../public/js/shared/data/items-temple.js';
import { ENCOUNTERS_TEMPLE, FIXED_TEMPLE, ZONE_BG_TEMPLE } from '../public/js/shared/data/encounters-temple.js';
import {
  templeCond, templeTurnStart, heardSongs, mirrorSkillOk, MIRROR_RATE, REFLECT_CAP, SONG, UTSUSHIMI, PRISON, templeAdjust,
} from '../public/js/shared/battle-temple.js';
import { SONG_FLAGS } from '../public/js/shared/maps/ch4.js';
import { newMonsterCompanion, gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import { makeNpcSupportChar, companionJoin } from '../public/js/shared/world/party.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { CH4_GUESTS } from '../public/js/shared/data/items-ch4.js';
import { shownEquipKey } from '../public/js/shared/look-equip.js';
import { makeChar, withSara, runBattle, morganaFight } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { TEMPLE_BG, TEMPLE_DECOS, drawTempleBg, drawTempleFloorBg } from '../public/js/client/render/ch4-temple-bg.js';
import { playTempleFx } from '../public/js/client/render/battlefx-temple.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const TEMPLE = Object.keys(MONSTERS_TEMPLE);
const BOSSES = ['morgana', 'morgana_true'];
const PARTY = (lv = 38) => withSara([makeChar('warrior', lv, 10, 'せんし', 38), makeChar('priest', lv, 10, 'そうりょ', 38), makeChar('mage', lv, 10, 'まほう', 38), makeChar('monk', lv, 10, 'ぶとう', 38)], lv);
function battle(enemies, opts = {}) {
  const party = opts.party || PARTY();
  const allies = opts.allies || party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: c.tactics || 'balanced' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies, boss: !!opts.boss, canFlee: false, song: opts.song });
  // ひらめきは この テストでは おこさない（呪文の かわりに ひらめいた 技が 出ると たしかめられない）
  for (const a of b.allies) a.use = null;
  return b;
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  return ev;
}
function hit(b, c, t, dmg, info = {}) {
  const ev = evOf(c);
  b.cur = ev;
  b.damage(c, t, dmg, ev, info);
  b.cur = null;
  return ev;
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
const morganaBattle = (seed = 3, opts = {}) => {
  const b = battle(['morgana', 'morgana', 'morgana'], { boss: true, seed, ...opts });
  return { b, real: b.get(b.mirage.real), clones: b.mirage.clones.map((id) => b.get(id)) };
};

// ───────────── データ ─────────────
test('神殿の 魔物: Lv36〜38 の 新しい 魔物（水の魔物・砂の魔物・鏡の魔物）と 番人・うつし身・水のろう・モルガナ 2つの すがた。技も ぜんぶ ある', () => {
  assert.deepEqual(TEMPLE.sort(), ['mirror_knight', 'morgana', 'morgana_true', 'prison_guard', 'sand_crab', 'trick_mirror', 'utsushimi', 'water_dragon', 'water_prison', 'water_spirit']);
  for (const id of TEMPLE) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_TEMPLE[id], `${id}: monsters.js に まざる`);
    if (!BOSSES.includes(id) && id !== PRISON) assert.ok(m.lv >= 36 && m.lv <= 38, `${id}: Lv36〜38`);
    assert.ok(m.desc && m.name, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    for (const p of m.phases || []) for (const a of p.addActions || []) assert.ok(ABILITIES[a.id], a.id);
  }
  for (const [id, a] of Object.entries(TEMPLE_ABILITIES)) assert.equal(ABILITIES[id], a, `abilities.js に まざる: ${id}`);
  // ボスは 2つ。第1段階は Lv39、真の姿は Lv40。2回行動
  assert.deepEqual(TEMPLE.filter((id) => MONSTERS[id].boss).sort(), BOSSES);
  assert.equal(MONSTERS.morgana.lv, 39);
  assert.equal(MONSTERS.morgana_true.lv, 40);
  for (const id of BOSSES) assert.equal(MONSTERS[id].turns, 2);
  // 弱点: 真の姿は 雷。炎・氷・闇が 効きにくい
  const r = MONSTERS.morgana_true.resist;
  assert.ok(r.bolt > 1.2 && r.fire < 1 && r.ice < 1 && r.dark < 1);
  // 水の魔物は 雷に 弱い・鏡の騎士は 守りが かたい（物理より 呪文。光ったら 物理）
  for (const id of ['water_spirit', 'water_dragon', 'prison_guard']) assert.ok(MONSTERS[id].resist.bolt >= 1.3, id);
  assert.ok(MONSTERS.mirror_knight.def > MONSTERS.castle_armor.def, '鏡の騎士は かたい');
});

test('落とす物: ボスは 1人 1つの アクセサリー（第1段階 しずくのイヤリング・真の姿 水鏡のかんむり）。ふつうの 魔物は よく・レア・素材', () => {
  const boss = (sp) => monsterDrops(sp).filter((d) => d.kind === 'boss').map((d) => d.item);
  assert.deepEqual(boss('morgana'), ['tide_earring']);
  assert.deepEqual(boss('morgana_true'), ['mizukagami_crown']);
  assert.equal(ITEMS.mizukagami_crown.name, '水鏡のかんむり');
  for (const id of Object.keys(ITEMS_TEMPLE)) {
    const it = ITEMS[id];
    assert.equal(it.type, 'acc', id);
    assert.ok(it.unique && !(it.price > 0) && it.rank === 7, id);
  }
  for (const id of TEMPLE.filter((x) => !BOSSES.includes(x) && x !== PRISON)) {
    const d = monsterDrops(id);
    assert.ok(d.some((x) => x.kind === 'common') && d.some((x) => x.kind === 'rare'), id);
    assert.equal(MAT_DROPS[id], TEMPLE_MAT_DROPS[id], `${id}: 素材`);
  }
  // 水のろうは 経験値も お金も 落とす物も ない
  assert.equal(MONSTERS[PRISON].exp, 0);
  assert.deepEqual(monsterDrops(PRISON), []);
});

test('出現表と きまった 戦い: 名前の 約束（t_b1_wet・t_b1_dry・t_b2・t_b3／mirror_knights・utsushimi・prison_guards・morgana・morgana_true）', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_TEMPLE).sort(), ['t_b1_dry', 't_b1_wet', 't_b2', 't_b3']);
  const species = (t) => new Set(ENCOUNTER_TABLES[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const t of Object.keys(ENCOUNTERS_TEMPLE)) {
    assert.equal(ENCOUNTER_TABLES[t], ENCOUNTERS_TEMPLE[t], `${t}: encounters.js に まざる`);
    assert.equal(NIGHT_ZONES[t], undefined, `${t}: 昼と 夜の 区別は ない`);
    assert.equal(ZONE_BG[t], ZONE_BG_TEMPLE[t]);
    for (const e of ENCOUNTER_TABLES[t]) {
      assert.ok(e.w > 0);
      for (const [sp, mn, mx] of e.group) {
        assert.ok(MONSTERS[sp] && !MONSTERS[sp].boss && sp !== UTSUSHIMI && sp !== PRISON && sp !== 'prison_guard', `${t}: ${sp}`);
        assert.ok(mn >= 0 && mx >= mn && mx <= 3);
      }
    }
    // 新しい 魔物と、今 ある 第4章の 魔物を まぜる
    const s = species(t);
    assert.ok([...s].some((sp) => MONSTERS_TEMPLE[sp]), `${t}: 新しい 魔物`);
  }
  assert.ok(species('t_b1_wet').has('water_spirit') && species('t_b1_wet').has('water_dragon'), '水が 高い: 水の 魔物');
  assert.ok(species('t_b1_dry').has('sand_crab') && species('t_b1_dry').has('sand_worm'), '水が 低い: 砂の 魔物');
  assert.ok(species('t_b2').has('mirror_knight') && species('t_b2').has('trick_mirror'), '鏡の間: 鏡の 魔物');
  assert.ok(ENCOUNTER_TABLES.t_b2.some((e) => e.group.some(([sp]) => sp === 'mirror_knight') && e.group.some(([sp]) => sp === 'water_spirit')), '水の精＋鏡の騎士');
  assert.ok([...species('t_b1_wet'), ...species('t_b1_dry'), ...species('t_b2')].some((sp) => MONSTERS[sp] && !MONSTERS_TEMPLE[sp]), '今 ある 魔物も まぜる');
  assert.deepEqual(ZONE_BG_TEMPLE, { t_b1_wet: 'sand_temple', t_b1_dry: 'sand_temple', t_b2: 'mirror_hall', t_b3: 'sand_temple' });
  // きまった 戦い
  assert.deepEqual(Object.keys(FIXED_TEMPLE).sort(), ['mirror_knights', 'morgana', 'morgana_true', 'prison_guards', 'utsushimi']);
  for (const [id, f] of Object.entries(FIXED_TEMPLE)) {
    assert.equal(FIXED_ENCOUNTERS[id], f);
    assert.equal(f.canFlee, false, `${id}: にげられない`);
    assert.equal(f.loseOk, undefined, `${id}: 負けたら 今の ボスと おなじ`);
    assert.ok(['sand_temple', 'mirror_hall', 'morgana_hall'].includes(f.bg), id);
    assert.ok(battleBgSpec(f.bg), `${id}: 背景 ${f.bg}`);
  }
  assert.deepEqual(FIXED_TEMPLE.mirror_knights.group, [['mirror_knight', 2, 2]]);
  assert.deepEqual(FIXED_TEMPLE.prison_guards.group, [['prison_guard', 2, 2]]);
  assert.deepEqual(FIXED_TEMPLE.morgana.group, [['morgana', 3, 3]], 'まぼろしの 分身 2体と');
  assert.deepEqual(FIXED_TEMPLE.morgana_true.group, [['morgana_true', 1, 1]]);
  for (const id of ['mirror_knights', 'utsushimi', 'prison_guards']) assert.equal(FIXED_TEMPLE[id].bgm, 'sand_temple');
  for (const id of BOSSES) {
    assert.equal(FIXED_TEMPLE[id].bgm, 'morgana');
    assert.equal(FIXED_TEMPLE[id].boss, true);
    assert.equal(FIXED_TEMPLE[id].bg, 'morgana_hall');
  }
});

// ───────────── 水の衣 ─────────────
test('水の衣: はじめから まとう（分身も おなじ すがた）。ダメージ半分・炎は 効かない（かき消す）・オートの みつもりも おなじ', () => {
  const { b, real, clones } = morganaBattle();
  const [w, , mage] = b.allies;
  assert.ok(real.veil && clones.every((x) => x.veil));
  assert.equal(pub(real).veil, 1);
  assert.equal(pub(clones[0]).veil, 1, '分身も 水の衣に 見える');
  const hp0 = real.hp;
  hit(b, w, real, 100);
  assert.equal(real.hp, hp0 - 50, '半分');
  assert.ok(clones.every((x) => x.hp === real.hp), '分身も おなじ HPに 見える');
  const ev = hit(b, w, real, 100, { element: 'fire' });
  assert.equal(real.hp, hp0 - 50, '炎は 効かない');
  assert.ok(has(ev, '水の衣が、炎をかき消した！'));
  // オートの みつもり: 炎は 0・ほかは 半分
  const fire = ABILITIES.merami.effect, ice = ABILITIES.hyado.effect;
  assert.equal(b.calcMagic(mage, real, fire, 1, true).dmg, 0);
  const iceVeil = b.calcMagic(mage, real, ice, 1, true).dmg;
  real.veil = false;
  const iceBare = b.calcMagic(mage, real, ice, 1, true).dmg;
  assert.ok(Math.abs(iceVeil - iceBare / 2) <= 1, `${iceVeil} ≒ ${iceBare}/2`);
});

test('水の衣: 雷の ダメージで はじけとぶ（そのまま 当たる。分身も）→ 何回か 動くと 前ぶれ「水をまとい始めた…」→ つぎの 番に また まとう', () => {
  const { b, real, clones } = morganaBattle(5);
  const w = b.allies[0];
  const hp0 = real.hp;
  const ev = hit(b, w, real, 120, { element: 'bolt' });
  assert.equal(real.hp, hp0 - 120, '雷は そのまま');
  assert.ok(!real.veil && clones.every((x) => !x.veil), 'はじけた（分身も）');
  assert.equal(ev.veilBreak, real.id);
  assert.ok(has(ev, '水の衣が、はじけとんだ！'));
  assert.ok(ev.upd.includes(clones[0]), 'がめんの 分身も かわる');
  assert.equal(pub(real).veil, 0);
  hit(b, w, real, 100);
  assert.equal(real.hp, hp0 - 220, '衣が ない 間は そのまま');
  // すぐには まとわない（本物が wait 回 動いてから）
  assert.equal(templeCond(b, real, 'noVeil'), false);
  for (let i = 0; i < MONSTERS.morgana.veil.wait; i++) templeTurnStart(b, real, evOf(real));
  assert.equal(templeCond(b, real, 'noVeil'), true);
  // 前ぶれ（この 番の のこりは とりやめ）
  b.enqueue(real, { type: 'ai' }, true);
  const e1 = act(b, real, { type: 'ability', id: 'm_morgana_veil_charge' });
  assert.equal(real.veilCharge, 'm_morgana_veil');
  assert.ok(e1.forceLast && e1.warn && e1.fx.type === 'veilCharge');
  assert.ok(!b.queue.some((q) => q.id === real.id));
  assert.ok(has(e1, '水をまとい始めた'));
  assert.equal(pub(clones[1]).veilCharge, true, '分身も 前ぶれの すがた');
  assert.equal(templeCond(b, real, 'noVeil'), false, '前ぶれの 間は もう 前ぶれしない');
  // つぎの 番: また まとう
  const cmd = decideMonster(b, real);
  assert.deepEqual(cmd, { type: 'ability', id: 'm_morgana_veil' });
  const e2 = act(b, real, cmd);
  assert.ok(real.veil && clones.every((x) => x.veil));
  assert.equal(e2.fx.type, 'veil');
  // 分身は 前ぶれを まねても 衣を まとわない（本物だけ）
  clones[0].veilCharge = 'm_morgana_veil';
  assert.notDeepEqual(decideMonster(b, clones[0]), { type: 'ability', id: 'm_morgana_veil' });
});

// ───────────── まぼろしの分身（モルガナ）─────────────
test('モルガナの 分身: 当たると 消えて、わらいの かわりに モルガナの HPが 少し 回復する（名前は 言わない）。月の鏡は Step 5 と おなじ', () => {
  const { b, real, clones } = morganaBattle(7);
  const w = b.allies[0];
  real.hp = 3000;
  const mp0 = w.mp;
  const ev = act(b, w, { type: 'attack', target: clones[0].id });
  assert.ok(!clones[0].alive, '消えた');
  const heal = Math.round(MONSTERS.morgana.maxHp ?? MONSTERS.morgana.hp * MONSTERS.morgana.mirage.heal);
  assert.equal(real.hp, 3000 + Math.round(MONSTERS.morgana.hp * MONSTERS.morgana.mirage.heal), `回復 ${heal}`);
  assert.equal(w.mp, mp0, 'MPは へらない');
  assert.ok(has(ev, 'モルガナのキズが'));
  assert.ok(!(ev.postLines || []).some((l) => l.includes(real.name)), `${real.name} とは 言わない`);
  assert.ok(!b.killed.length, 'たおした ことに ならない');
  // 月の鏡: 分身が ぜんぶ 消え、本物は つぎの 番 動けない（2回行動の のこりも）
  const e2 = act(b, b.allies[1], { type: 'item', id: 'moon_mirror' });
  assert.ok(clones.every((x) => !x.alive) && real.dazzled);
  assert.ok(e2.lines.some((l) => l.includes('月の光')));
  b.enqueue(real, { type: 'ai' }, false);
  b.enqueue(real, { type: 'ai' }, true);
  b.queue.shift();
  const cmd = decideMonster(b, real);
  assert.equal(cmd.id, 'm_morgana_dazzled');
  const e3 = act(b, real, cmd);
  assert.ok(e3.forceLast && !b.queue.some((q) => q.id === real.id), 'まぶしい 番は 2回行動の のこりも とりやめ');
  // 本物が たおれると 分身は 水に なって 消える
  const { b: b2, real: r2 } = morganaBattle(9);
  const ev4 = hit(b2, b2.allies[0], r2, r2.hp * 3);
  assert.ok(ev4.lines.some((l) => l.includes('水になって消えていった')));
  assert.ok(b2.enemies.every((x) => !x.alive));
});

// ───────────── 鏡写し ─────────────
test('鏡写し: おなじ 呪文を 2回 つづけて モルガナに 使うと、2回目は はね返される（となえた 人に 当たる。1回で たおれない 強さ）。ちがう 呪文なら 当たる', () => {
  const { b, real } = morganaBattle(11);
  const mage = b.allies[2];
  b.mirage.clones.forEach((id) => { b.get(id).alive = false; });
  const hp0 = real.hp;
  const e1 = act(b, mage, { type: 'ability', id: 'hyado', target: real.id });
  assert.ok(real.hp < hp0, '1回目は 当たる');
  assert.ok(!has(e1, '鏡写し'));
  assert.equal(real.lastSpell, 'hyado');
  const hp1 = real.hp, mhp = mage.hp, mmp = mage.mp;
  const e2 = act(b, mage, { type: 'ability', id: 'hyado', target: real.id });
  assert.ok(has(e2, '鏡写し！呪文ははね返された！'));
  assert.equal(real.hp, hp1, 'モルガナには 当たらない');
  assert.ok(mage.hp < mhp, 'となえた 人に 当たる');
  assert.ok(mhp - mage.hp <= Math.round(mage.maxHp * REFLECT_CAP), 'さいだいHPの REFLECT_CAP まで');
  assert.ok(mage.mp < mmp, 'MPは つかう');
  assert.equal(e2.fx.reflect, real.id);
  assert.equal(e2.fx.copy, true);
  // 3回目も おなじ 呪文なら はね返す。ちがう 呪文なら 当たる
  const e3 = act(b, mage, { type: 'ability', id: 'hyado', target: real.id });
  assert.ok(has(e3, '鏡写し'));
  const e4 = act(b, mage, { type: 'ability', id: 'io', target: real.id });
  assert.ok(!has(e4, '鏡写し') && real.hp < hp1, 'ちがう 呪文');
  // 物理の 攻撃は 関係ない（つづいた 呪文の かぞえかたも かわらない）
  act(b, b.allies[0], { type: 'attack', target: real.id });
  assert.equal(real.lastSpell, 'io');
  // 知っている 人の オート: つづけて おなじ 呪文を えらばない
  b.knowsTemple = true;
  const opts = [{ cmd: { type: 'ability', id: 'io', target: real.id }, final: 100 }, { cmd: { type: 'ability', id: 'hyado', target: real.id }, final: 50 }];
  templeAdjust(b, mage, opts);
  assert.ok(opts[0].final < opts[1].final);
});

// ───────────── 鏡の騎士・鏡のうろこ（呪文を はね返す）─────────────
test('鏡の騎士: 体が 光ると、つぎの 自分の 番まで 呪文を はね返す（物理は 当たる）。グループの 呪文は 光っていない 騎士には 当たる。光は つぎの 番で 消える', () => {
  const b = battle(['mirror_knight', 'mirror_knight'], { seed: 13 });
  const [k1, k2] = b.enemies;
  const [w, , mage] = b.allies;
  assert.equal(templeCond(b, k1, 'noReflect'), true);
  b.enqueue(k1, { type: 'ai' }, true);
  const e1 = act(b, k1, { type: 'ability', id: 'm_knight_glow' });
  assert.equal(k1.reflect.kind, 'glow');
  assert.ok(e1.forceLast && e1.warn && e1.fx.type === 'reflect');
  assert.ok(has(e1, 'はね返されそうだ'));
  assert.equal(pub(k1).reflect, 'glow');
  assert.equal(templeCond(b, k1, 'noReflect'), false);
  // 1体を ねらう 呪文
  const hp1 = k1.hp, mhp = mage.hp;
  const e2 = act(b, mage, { type: 'ability', id: 'hyado', target: k1.id });
  assert.equal(k1.hp, hp1);
  assert.ok(mage.hp < mhp && has(e2, '鏡の騎士Aの体が光り、呪文をはね返した！'));
  // グループの 呪文: 光っていない 騎士には 当たる。はね返るのは 1回
  const hp2 = k2.hp, mhp2 = mage.hp;
  const e3 = act(b, mage, { type: 'ability', id: 'hyadaruko', target: k2.id });
  assert.ok(k2.hp < hp2 && k1.hp === hp1 && mage.hp < mhp2);
  assert.equal(e3.lines.filter((l) => l.includes('はね返した')).length, 1);
  // 物理は 当たる
  let tries = 0;
  while (k1.hp === hp1 && tries++ < 8) act(b, w, { type: 'attack', target: k1.id });
  assert.ok(k1.hp < hp1, '物理は 当たる');
  // つぎの 番で 光が 消える
  const ev = evOf(k1);
  templeTurnStart(b, k1, ev);
  assert.ok(!k1.reflect && has(ev, '光が、おさまった'));
});

test('鏡の騎士: ふつうの オートの 仲間は 光っている 敵に 呪文を 使わない（物理か 身を 守る）。知らない 人（シミュレーター）は 使ってしまう', () => {
  const b = battle(['mirror_knight', 'mirror_knight'], { seed: 15 });
  const mage = b.allies[2];
  for (const k of b.enemies) k.reflect = { kind: 'glow' };
  const spellAt = (cmd) => cmd.type === 'ability' && (ABILITIES[cmd.id].kind === 'spell') && ['enemy', 'group', 'enemies'].includes(ABILITIES[cmd.id].target);
  for (let i = 0; i < 12; i++) assert.ok(!spellAt(decideAlly(b, mage)), 'ふつうの オートは 呪文を 使わない');
  b.templeNaive = true;
  let used = 0;
  for (let i = 0; i < 12; i++) if (spellAt(decideAlly(b, mage))) used++;
  assert.ok(used > 0, '知らない 人は 呪文を 使う');
});

test('鏡のうろこ（真の姿）: うろこが 光った つぎの 番だけ 呪文を はね返す。光った 番の のこりの 行動は とりやめ', () => {
  const b = battle(['morgana_true'], { boss: true, seed: 17 });
  const m = b.enemies[0];
  const mage = b.allies[2];
  b.enqueue(m, { type: 'ai' }, false);
  b.enqueue(m, { type: 'ai' }, true);
  b.queue.shift();
  const e1 = act(b, m, { type: 'ability', id: 'm_scale_glow' });
  assert.equal(m.reflect.kind, 'scale');
  assert.ok(e1.forceLast && !b.queue.some((q) => q.id === m.id));
  const hp0 = m.hp;
  const e2 = act(b, mage, { type: 'ability', id: 'hyado', target: m.id });
  assert.equal(m.hp, hp0);
  assert.ok(has(e2, 'うろこが光り、呪文をはね返した'));
  templeTurnStart(b, m, evOf(m));
  assert.ok(!m.reflect);
  act(b, mage, { type: 'ability', id: 'merami', target: m.id });
  assert.ok(m.hp < hp0, '光が 消えたら 当たる');
});

// ───────────── 大波 ─────────────
test('大波: 「水がうずをまいている…」→「うずが大きくなっていく…」→ つぎの 番に 大波（みんなに とても 大きい。防御で 半分）', () => {
  const b = battle(['morgana_true'], { boss: true, seed: 19, song: false });
  const m = b.enemies[0];
  assert.equal(templeCond(b, m, 'noWave'), true);
  const e1 = act(b, m, { type: 'ability', id: 'm_wave_charge' });
  assert.ok(has(e1, '水がうずをまいている'));
  assert.equal(m.telegraph, 'm_wave_build');
  assert.equal(m.waveStage, 1);
  assert.ok(e1.forceLast && e1.fx.type === 'wave' && e1.fx.stage === 1);
  assert.equal(pub(m).wave, 1);
  assert.equal(templeCond(b, m, 'noWave'), false);
  const c1 = decideMonster(b, m);
  assert.equal(c1.id, 'm_wave_build');
  assert.ok(c1.big);
  const e2 = act(b, m, c1);
  assert.equal(m.telegraph, 'm_big_wave');
  assert.equal(m.waveStage, 2);
  assert.ok(has(e2, '次の番に、大波が来る'));
  const c2 = decideMonster(b, m);
  assert.equal(c2.id, 'm_big_wave');
  assert.equal(m.waveStage, 0);
  // とても 大きい（ふつうの 攻撃の 2倍いじょう）・防御で 半分
  const a = b.allies[2];
  const eff = ABILITIES.m_big_wave.effect;
  const wave = b.calcPhys(m, a, eff, 1, 'phys', true).dmg;
  const normal = b.calcPhys(m, a, { mult: 1 }, 1, 'phys', true).dmg;
  assert.ok(wave >= normal * 2, `${wave} / ${normal}`);
  a.defending = true;
  assert.ok(Math.abs(b.calcPhys(m, a, eff, 1, 'phys', true).dmg - wave / 2) <= 1, '防御で 半分');
  a.defending = false;
  const before = b.allies.map((x) => x.hp);
  const e3 = act(b, m, c2);
  assert.ok(has(e3, '大波！'));
  assert.ok(b.allies.filter((x, i) => x.hp < before[i]).length >= 3, 'みんなに 当たる');
});

test('大波: 知っている 人の オートは 大波の 前に 身を 守る。知らない 人は 守らない（ふつうの「大技に そなえる」も しない）', () => {
  const b = battle(['morgana_true'], { boss: true, seed: 21 });
  const m = b.enemies[0];
  const c = b.allies[0];
  m.telegraph = 'm_big_wave';
  m.waveStage = 2;
  m.atb = 95;
  b.knowsTemple = true;
  assert.deepEqual(decideAlly(b, c), { type: 'defend' });
  b.knowsTemple = false;
  b.templeNaive = true;
  c.hp = Math.round(c.maxHp * 0.3);
  for (let i = 0; i < 10; i++) assert.notEqual(decideAlly(b, c).type, 'defend');
});

// ───────────── 水の守りの歌 ─────────────
test('水の守りの歌: 真の姿の 戦いを 始める 時、家族の だれかが わらべ歌を 4つとも 聞いていれば 歌が かかる（ない 時は かからない）', () => {
  const all = Object.fromEntries(SONG_FLAGS.map((f) => [f, true]));
  assert.equal(heardSongs([{ kind: 'player', char: { flags: all } }]), true);
  assert.equal(heardSongs([{ kind: 'player', char: { flags: { ...all, [SONG_FLAGS[2]]: false } } }]), false, '3つでは だめ');
  assert.equal(heardSongs([{ kind: 'guest', char: { flags: all } }]), false, 'ゲストは 家族では ない');
  assert.equal(heardSongs([{ kind: 'monster', char: { species: 'pururin', flags: all } }]), false);
  assert.equal(heardSongs([{ kind: 'player', char: { flags: {} } }, { kind: 'player', char: { flags: all } }]), true, '家族の だれか ひとりで よい');
  const mk = (flags, enemies = ['morgana_true']) => {
    const party = PARTY();
    party[1].flags = flags;
    return new Battle({ rng: makeRng(1), allies: party.map((c, i) => ({ char: c, kind: i === 1 ? 'player' : 'support', auto: true })), enemies, boss: true, canFlee: false });
  };
  const b1 = mk(all);
  assert.deepEqual([b1.song.left, b1.song.cut], [SONG.waves, SONG.cut]);
  const evs = b1.flush();
  assert.ok(evs.some((e) => e.t === 'msg' && e.lines[0] === '水の守りの歌が、みんなをつつんでいる…' && e.fx?.type === 'song'));
  assert.deepEqual(b1.snapshot().temple, { song: SONG.waves });
  const b2 = mk({});
  assert.equal(b2.song, undefined);
  assert.equal(b2.snapshot().temple, null);
  assert.ok(!b2.flush().some((e) => e.t === 'msg' && e.lines[0].includes('水の守りの歌')));
  // 第1段階の 戦いには かからない
  assert.equal(mk(all, ['morgana', 'morgana', 'morgana']).song, undefined);
});

test('水の守りの歌: はじめの 大波が 軽く なる（つぎの 大波からは ふつう）', () => {
  const waveDmg = (song, times = 1) => {
    const b = battle(['morgana_true'], { boss: true, seed: 23, song });
    const m = b.enemies[0];
    const out = [];
    for (let k = 0; k < times; k++) {
      m.telegraph = 'm_big_wave';
      m.waveStage = 2;
      for (const a of b.allies) { a.hp = a.maxHp; a.alive = true; }
      templeTurnStart(b, m, evOf(m));
      const cmd = decideMonster(b, m);
      const before = b.allies.reduce((s, a) => s + a.hp, 0);
      const ev = act(b, m, cmd);
      out.push({ dmg: before - b.allies.reduce((s, a) => s + a.hp, 0), ev, b });
    }
    return out;
  };
  const [plain] = waveDmg(false);
  const sung = waveDmg(true, 2);
  assert.ok(has(sung[0].ev, '水の守りの歌が、大波のいきおいをやわらげた！'));
  assert.ok(sung[0].ev.song);
  assert.ok(sung[0].dmg < plain.dmg * (SONG.cut + 0.1), `${sung[0].dmg} < ${plain.dmg}`);
  assert.equal(sung[0].b.song.left, SONG.waves - 1);
  if (SONG.waves === 1) {
    assert.ok(has(sung[0].ev, '水の守りの歌は、しずかに消えていった'));
    assert.ok(!has(sung[1].ev, 'やわらげた'), '2回目は ふつう');
  }
});

// ───────────── 水のろう ─────────────
test('水のろう: 1人を とじこめる（敵の がわに ろうが 出る）。その 人の 番が 2回 くるまで 動けない → はじけて 出られる（経験値は ない）', () => {
  const b = battle(['morgana_true'], { boss: true, seed: 25 });
  const m = b.enemies[0];
  const t = b.allies[1];
  assert.equal(templeCond(b, m, 'noPrison'), true);
  const e1 = act(b, m, { type: 'ability', id: 'm_water_prison', target: t.id });
  const p = b.enemies.find((e) => e.species === PRISON);
  assert.ok(p?.alive, 'ろうが 出た');
  assert.equal(p.holds, t.id);
  assert.equal(p.inside.name, t.name);
  assert.deepEqual(t.status.prison.turns, 2);
  assert.ok(e1.joined?.some((j) => j.id === p.id) && e1.fx.type === 'prison');
  assert.ok(has(e1, `${t.name}は、水のろうにとじこめられた！`));
  assert.ok(pub(t).status.includes('prison'));
  assert.equal(templeCond(b, m, 'noPrison'), false, 'ろうは 1つまで');
  // 番が 来ても 動けない
  t.atb = 100;
  b.onReady(t);
  assert.equal(b.queue.find((q) => q.id === t.id)?.cmd.type, 'incapacitated');
  b.lock = 0;
  b.executeNext();
  let evs = b.flush().filter((e) => e.t === 'act');
  assert.ok(evs.at(-1).lines.some((l) => l.includes('水のろうの中で、もがいている')));
  assert.equal(t.status.prison.turns, 1);
  b.onReady(t);
  b.lock = 0;
  b.executeNext();
  evs = b.flush().filter((e) => e.t === 'act');
  assert.ok(evs.at(-1).lines.some((l) => l.includes(`水のろうがはじけて、${t.name}は外に出られた！`)));
  assert.ok(!t.status.prison && !p.alive);
  assert.ok(!b.killed.includes(PRISON), '経験値は ない');
});

test('水のろう: ろうを 攻撃して こわすと 早く 出られる。モルガナが たおれると ろうも 消える。動ける 味方が 1人なら つかわない', () => {
  const b = battle(['morgana_true'], { boss: true, seed: 27 });
  const m = b.enemies[0];
  const [w, t] = b.allies;
  act(b, m, { type: 'ability', id: 'm_water_prison', target: t.id });
  let p = b.enemies.find((e) => e.species === PRISON && e.alive);
  p.hp = 1;
  let ev;
  for (let i = 0; i < 8 && p.alive; i++) ev = act(b, w, { type: 'attack', target: p.id });
  assert.ok(!p.alive);
  assert.ok(has(ev, '水のろうが、こわれた！') && has(ev, `${t.name}は、水のろうから助け出された！`));
  assert.ok(!t.status.prison);
  assert.ok(!b.killed.includes(PRISON));
  assert.ok(m.alive && !b.pendingEnd, 'まだ 戦いは つづく');
  // モルガナが たおれる → ろうも 消えて 中の 人が 出る（戦いが おわる）
  act(b, m, { type: 'ability', id: 'm_water_prison', target: t.id });
  p = b.enemies.find((e) => e.species === PRISON && e.alive);
  assert.ok(p && t.status.prison);
  const e2 = hit(b, w, m, m.hp + 10);
  assert.ok(!m.alive && !p.alive && !t.status.prison);
  assert.ok(e2.lines.some((l) => l.includes('水のろうも、はじけて消えた')));
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
  // 動ける 味方が 1人なら つかわない（とじこめると だれも 動けない）
  const b2 = battle(['morgana_true'], { boss: true, seed: 29 });
  for (const a of b2.allies.slice(1)) a.alive = false;
  assert.equal(templeCond(b2, b2.enemies[0], 'noPrison'), false);
  const e3 = act(b2, b2.enemies[0], { type: 'ability', id: 'm_water_prison', target: b2.allies[0].id });
  assert.ok(has(e3, 'はじけて消えた') && !b2.allies[0].status.prison);
  // とじこめられた まま たおれると、ろうも 消える
  const b3 = battle(['morgana_true'], { boss: true, seed: 31 });
  act(b3, b3.enemies[0], { type: 'ability', id: 'm_water_prison', target: b3.allies[2].id });
  const p3 = b3.enemies.find((e) => e.species === PRISON);
  hit(b3, b3.enemies[0], b3.allies[2], 9999);
  assert.ok(!p3.alive && !b3.killed.includes(PRISON));
});

// ───────────── 段階 ─────────────
test('真の姿の 段階: HP50%で 攻撃力アップ・HP20%で 守りが 下がる', () => {
  const b = battle(['morgana_true'], { boss: true, seed: 33 });
  const m = b.enemies[0];
  const w = b.allies[0];
  m.hp = Math.round(m.maxHp * 0.5) + 5;
  const e1 = hit(b, w, m, 20);
  assert.equal(m.buffs.atk?.mult, 1.25);
  assert.ok((e1.postLines || []).some((l) => l.includes('攻撃力が上がった')));
  m.hp = Math.round(m.maxHp * 0.2) + 5;
  const e2 = hit(b, w, m, 20);
  assert.equal(m.debuffs.def?.mult, 0.7);
  assert.ok((e2.postLines || []).some((l) => l.includes('守備力が下がった')));
});

// ───────────── 鏡のうつし身 ─────────────
function mirrorParty() {
  const hero = makeChar('warrior', 38, 10, 'ソラ', 38);
  hero.lookEquip = { head: 'turban', armor: 'desert_garb' };
  const mama = makeChar('priest', 38, 10, 'ママ', 38);
  const mon = newMonsterCompanion({ id: 'm1', name: 'ぷるる', species: 'pururin', level: 30 });
  const sara = makeNpcSupportChar({ ...CH4_GUESTS.sara }, 38);
  const allies = [
    { char: hero, kind: 'player', controller: 's1', auto: false },
    { char: mama, kind: 'player', controller: 's2', auto: true },
    { char: mon, kind: 'monster', auto: true },
    { char: sara, kind: 'guest', auto: true, tactics: sara.tactics },
  ];
  return { hero, mama, mon, sara, allies };
}

test('鏡のうつし身: パーティーの 人数ぶん（家族・仲間の 魔物・ゲスト）。おなじ 職業・レベル・見た目（見た目装備も）・技。名前は「〇〇のうつし身」。少し 弱い', () => {
  const { hero, allies } = mirrorParty();
  const b = new Battle({ rng: makeRng(41), allies, enemies: [UTSUSHIMI], canFlee: false });
  const copies = b.enemies;
  assert.equal(copies.length, 4, '4人ぶん');
  assert.equal(new Set(copies.map((e) => e.id)).size, 4);
  copies.forEach((e, i) => {
    const a = b.allies[i];
    assert.equal(e.species, UTSUSHIMI);
    assert.equal(e.mirrorOf, a.id);
    assert.equal(e.name, `${a.name}のうつし身`);
    assert.equal(e.letter, '', 'A・B・C は つけない');
    assert.equal(e.job, a.job);
    assert.equal(e.lv, a.lv);
    assert.deepEqual(e.look, a.look);
    assert.equal(e.eq, a.eq);
    assert.equal(e.mon, a.mon);
    assert.equal(e.slot, i);
    assert.equal(e.maxHp, Math.max(1, Math.round(a.maxHp * MIRROR_RATE.hp)));
    assert.equal(e.atk, Math.max(1, Math.round(a.atk * MIRROR_RATE.atk)));
    assert.ok(e.atk < a.atk && e.mag <= a.mag, '少し 弱い');
    assert.ok(e.abilities.every((id) => a.abilities.includes(id) && mirrorSkillOk(id)), '覚えている 技から');
    const p = pub(e);
    assert.equal(p.mirror, true);
    assert.ok(p.look !== undefined && p.job === a.job && p.eq === a.eq);
  });
  // 見た目装備も うつる（shownEquip）
  assert.equal(copies[0].eq, shownEquipKey(hero));
  assert.ok(copies[0].eq.includes('turban') && copies[0].eq.includes('desert_garb'));
  // 魔物の 仲間は その 魔物の すがた
  assert.equal(copies[2].mon, 'pururin');
  // 生き返らせる・にげる・けしさる 技は 使わない
  assert.ok(b.allies[1].abilities.includes('zao') && !copies[1].abilities.includes('zao'));
  const escape = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'escape');
  for (const id of ['zao', 'hp_zaoriku', 'hk_hakai', escape]) {
    assert.ok(ABILITIES[id], id);
    assert.equal(mirrorSkillOk(id), false, id);
  }
  assert.ok(mirrorSkillOk('hyado') && mirrorSkillOk('behoimi'));
  // 経験値・お金は きまった 値（うつした 人の 強さに よらない）
  assert.equal(MONSTERS[UTSUSHIMI].exp, 1500);
});

test('鏡のうつし身: 技は 仲間の オートの AI で えらぶ（味方を ねらう・うつし身どうしで 回復）。さいごまで 戦える（にげない・こわれない）', () => {
  const { allies } = mirrorParty();
  const b = new Battle({ rng: makeRng(43), allies, enemies: [UTSUSHIMI], canFlee: false });
  const allyIds = new Set(b.allies.map((x) => x.id));
  const copyIds = new Set(b.enemies.map((x) => x.id));
  for (let i = 0; i < 40; i++) {
    for (const e of b.enemies) {
      const cmd = decideMonster(b, e);
      assert.ok(['attack', 'ability', 'defend'].includes(cmd.type), JSON.stringify(cmd));
      if (cmd.type === 'ability') {
        const a = ABILITIES[cmd.id];
        assert.ok(e.abilities.includes(cmd.id), cmd.id);
        if (cmd.target && ['enemy', 'group'].includes(a.target)) assert.ok(allyIds.has(cmd.target), `${cmd.id}: 味方を ねらう`);
        if (cmd.target && ['ally'].includes(a.target)) assert.ok(copyIds.has(cmd.target), `${cmd.id}: うつし身どうし`);
      }
      if (cmd.type === 'attack' && cmd.target) assert.ok(allyIds.has(cmd.target));
    }
    b.enemies[1].hp = Math.round(b.enemies[1].maxHp * 0.3);
  }
  // さいごまで（みんな オート）
  for (const a of b.allies) b.setAuto(a.id, true);
  let t = 0;
  while (!b.over && t < 20 * 60 * 1000) {
    b.tick(50);
    t += 50;
  }
  assert.ok(['win', 'lose'].includes(b.result?.outcome), `おわる: ${b.result?.outcome}`);
  if (b.result.outcome === 'win') assert.deepEqual(b.result.killed, Array(4).fill(UTSUSHIMI));
});

test('鏡のうつし身: 家族の キャラ（家族を 仲間に つれている）で 遊んでいても、きまった 戦いが はじまって おわる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(45), rateLimit: false });
  const mama = new Bot(world, 'ママ');
  await mama.login();
  await mama.createAndPlay('priest');
  await mama.settle();
  const mamaId = mama.char.id;
  mama.send({ t: 'quit' });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  const c = world.data.characters[ken.char.id];
  gainExp(c, expForLevel(38) - c.exp);
  c.hp = computeStats(c).maxHp;
  c.lookEquip = { head: 'turban' };
  for (const f of SONG_FLAGS) c.flags[f] = true;
  assert.ok(companionJoin(world, ken.s, 'fam:' + mamaId).ok, '家族を 仲間に');
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], UTSUSHIMI);
  const start = ken.msgs.filter((m) => m.t === 'battleStart').pop();
  const foes = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.equal(foes.length, 2, 'ケンと ママの うつし身');
  assert.deepEqual(foes.map((x) => x.name).sort(), ['ケンのうつし身', 'ママのうつし身']);
  assert.ok(foes.every((x) => x.mirror));
  assert.ok(foes.find((x) => x.name === 'ケンのうつし身').eq.includes('turban'));
  await ken.settle(30000);
  const outcome = await done;
  assert.ok(['win', 'lose'].includes(outcome), outcome);
  const end = ken.battles.at(-1);
  if (outcome === 'win') assert.ok(end.lines.some((l) => l.includes('経験値')));
});

// ───────────── オートの 仲間・シミュレーション ─────────────
test('オートの 仲間: どの きまった 戦いも しかけで 止まらず さいごまで 戦える（知っている・知らない）', () => {
  for (const enc of ['mirror_knights', 'utsushimi', 'prison_guards', 'morgana', 'morgana_true']) {
    for (const know of [true, false]) {
      const group = FIXED_ENCOUNTERS[enc].group.flatMap(([sp, n]) => Array(n).fill(sp));
      const r = runBattle(PARTY(38), group, { seed: 5, boss: !!FIXED_ENCOUNTERS[enc].boss, knowsMirage: know, knowsTemple: know, templeNaive: !know });
      assert.ok(['win', 'lose'].includes(r.outcome), `${enc} ${know}: ${r.outcome}`);
    }
  }
  // 敵が みんな 光っていても、オートの 仲間は 何かする（物理か 身を 守る）
  const b = battle(['mirror_knight'], { seed: 47 });
  b.enemies[0].reflect = { kind: 'glow' };
  for (const a of b.allies) assert.ok(['attack', 'defend', 'ability'].includes(decideAlly(b, a).type));
});

test('シミュレーション: tools/sim.js の ch4temple（モルガナ → いのりで 全回復 → 真の姿）', () => {
  const r = morganaFight(38, 777, true);
  assert.ok(['win', 'lose', 'timeout'].includes(r.outcome));
  assert.ok(r.phase === 1 || r.phase === 2);
  if (r.phase === 2) assert.ok(r.hp1 > 0);
});

// ───────────── 絵 ─────────────
function stubG(w, h) {
  const colors = new Set();
  const pts = [];
  const g = {
    w, h,
    ell(cx, cy, rx, ry, c) { colors.add(c); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]); },
    poly(p, c) { colors.add(c); for (const q of p) pts.push(q); },
    rect(x, y, rw, rh, c) { colors.add(c); pts.push([x, y], [x + rw, y + rh]); },
    line(p, c, lw = 1) { colors.add(c); for (const [x, y] of p) pts.push([x - lw / 2 / w, y - lw / 2 / h], [x + lw / 2 / w, y + lw / 2 / h]); },
    eye(cx, cy, r, look = 0, white = '#ffffff', pupil = '#1a1026') { colors.add(white); colors.add(pupil); colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 神殿の 魔物・番人・うつし身・水のろう・モルガナ 2つの すがた（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  for (const id of TEMPLE) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const max = BOSSES.includes(id) ? 140 : 70;
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= max), `${id}: size`);
    assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    const [W, H] = d.size;
    const k = Math.min(1, 20 / Math.max(W, H));
    for (const [w, h] of [[W, H], [Math.max(10, Math.round(W * k)), Math.max(10, Math.round(H * k))]]) {
      for (const f of [0, 1]) {
        const s = stubG(w, h);
        d.draw(s.g, f);
        assert.deepEqual([...s.colors].filter((c) => !pal.has(String(c).toLowerCase())), [], `${id} f${f}: パレットに ない いろ`);
        assert.deepEqual(outside(s.pts, w, h), [], `${id} f${f} ${w}×${h}: はみだし`);
      }
    }
    const a = stubG(W, H), b = stubG(W, H);
    d.draw(a.g, 0);
    d.draw(b.g, 1);
    assert.notDeepEqual(a.pts, b.pts, `${id}: コマで うごく`);
    const used = new Set([...a.colors, ...b.colors].map((c) => c.toLowerCase()));
    assert.deepEqual(d.pal.filter((c) => !used.has(c.toLowerCase())), [], `${id}: つかわない いろ`);
    if (MONSTERS[id].flying) assert.ok(W > H, `${id}: とぶ 魔物は よこに ひろい`);
  }
  const area = (id) => MONSTER_ART[id].size[0] * MONSTER_ART[id].size[1];
  assert.ok(area('trick_mirror') < area('mirror_knight'), 's は m より 小さい');
  // モルガナ 3人が ちぢまずに ならぶ・台本の showMon で 見せる 大きさ（大臣ザイードと おなじ くらい）
  const [mw, mh] = MONSTER_ART.morgana.size;
  assert.ok(3 * (mw + 2 + 6) <= BW - 12 && mh + 2 <= BASE_Y);
  assert.ok(mw * mh >= MONSTER_ART.zaid_minister.size[0] * MONSTER_ART.zaid_minister.size[1], 'フィールドでも 見せられる 大きさ');
  // 真の姿は 大きい（砂の魔神と おなじ くらい）。水のろうと ならんでも 入る
  const [tw, th] = MONSTER_ART.morgana_true.size;
  assert.ok(tw * th >= 120 * 100 && th + 2 <= BASE_Y);
  assert.ok(tw + 8 + MONSTER_ART.water_prison.size[0] + 8 <= BW - 12);
  // 鏡の騎士 2体・番人 2体
  assert.ok(2 * (MONSTER_ART.prison_guard.size[0] + 8) <= BW - 12);
});

test('絵: 戦いの 背景 3つ（砂の底の神殿・鏡の間・水鏡の広間）と エフェクト（水の衣・はね返す・大波・水のろう・歌）', () => {
  assert.deepEqual(Object.keys(TEMPLE_BG).sort(), ['mirror_hall', 'morgana_hall', 'sand_temple']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(TEMPLE_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(TEMPLE_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawTempleBg(ctx, d, 78);
    drawTempleFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 200, `${id}: こまかく かく`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = new Set(Object.values(TEMPLE_ABILITIES).map((a) => a.anim));
  for (const a of ['veil_break', 'reflect', 'prison_pop', 'song']) anims.add(a);
  const own = ['water_shot', 'water_rain', 'whirlpool', 'water_breath', 'wave_charge', 'big_wave', 'water_prison', 'prison_pop', 'veil_charge', 'veil_on', 'veil_break', 'mirror_glow', 'mirror_beam', 'reflect', 'siren_song', 'song'];
  for (const a of own) {
    assert.ok(anims.has(a), a);
    assert.equal(playTempleFx(fx, a, [{ x: 100, y: 60 }], null), true, a);
  }
  assert.equal(playTempleFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false, 'ほかの 技は ふつうの エフェクト');
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/battle-temple.js', 'public/js/client/battle-temple.js', 'public/js/shared/data/monsters-temple.js',
    'public/js/shared/data/abilities-temple.js', 'public/js/shared/data/items-temple.js', 'public/js/shared/data/encounters-temple.js'];
  const list = gameFiles();
  for (const f of files) {
    const full = list.find((x) => x.endsWith(f));
    assert.ok(full, `gameFiles: ${f}`);
    const bad = checkFile(full).filter((p) => p.kind === 'kanji' || p.kind === 'space');
    assert.deepEqual(bad, [], f);
  }
});
