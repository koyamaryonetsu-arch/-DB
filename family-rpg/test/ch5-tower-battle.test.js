// 第5章 Step 2「星の塔」B（戦い）
// 塔の 魔物（6しゅ）・出現表（t5_tower_low・t5_tower_high）・仲間・星の番人アルゴス（argos）と 新しい しくみ「見通しの目」
// （読む・同じ 種類で しかえし・変えれば 外れる・前ぶれ・オート）・段階・シミュレーション・絵・背景・エフェクト・文字
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
import { MONSTER_FRIENDS, familyPool } from '../public/js/shared/data/companions.js';
import { MONSTERS_CH5, CH5_MAT_DROPS } from '../public/js/shared/data/monsters-ch5.js';
import { TOWER_ABILITIES } from '../public/js/shared/data/abilities-tower.js';
import { ITEMS_TOWER } from '../public/js/shared/data/items-tower.js';
import { FRIENDS_CH5 } from '../public/js/shared/data/companions-ch5.js';
import { ENCOUNTERS_CH5, FIXED_CH5, ZONE_BG_CH5 } from '../public/js/shared/data/encounters-ch5.js';
import { actKind, predictKind, towerCond, dodgeCmd, KINDS, KIND_NAMES, JUDGE } from '../public/js/shared/battle-ch5.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar, runBattle, argosFight, CH5_TOWER, CH5_ARGOS } from '../tools/sim.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { TOWER_BG, TOWER_DECOS, drawTowerBg, drawTowerFloorBg } from '../public/js/client/render/ch5-tower-bg.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { ARGOS_EYES } from '../public/js/client/render/ch5-tower-art.js';
import { TOWER_SCREEN_ANIMS, TOWER_ALLY_FX, TOWER_SFX, towerMarks, towerDraw } from '../public/js/client/battle-ch5.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_CH5).filter((id) => id !== 'argos');
const PARTY = (lv = 42) => [makeChar('warrior', lv, 10, 'せんし', 42), makeChar('priest', lv, 10, 'そうりょ', 42), makeChar('mage', lv, 10, 'まほう', 42), makeChar('monk', lv, 10, 'ぶとう', 42)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || ['argos'], boss: true, canFlee: false, hooks: opts.hooks });
  // ひらめきは この テストでは おこさない
  for (const a of b.allies) a.use = null;
  return { b, argos: b.enemies[0], w: b.allies[0], p: b.allies[1], m: b.allies[2], k: b.allies[3] };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  return ev;
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
// アルゴスに 見通しの目を 使わせる（target … 読む 人。ほかの 人は 行動を きめて いる ことに して えらばれない ように）
function gaze(b, argos, target) {
  for (const a of b.allies) a.queued = a !== target;
  const ev = act(b, argos, { type: 'ability', id: 'm_argos_gaze', target: target?.id });
  for (const a of b.allies) a.queued = false;
  return ev;
}

// ───────────── データ ─────────────
test('塔の 魔物: Lv40〜43 の 新しい 魔物 6しゅ（石の塔 3・星空 3）と 星の番人アルゴス。技も ぜんぶ ある', () => {
  assert.deepEqual(NEW.sort(), ['clockwork_guard', 'comet_bird', 'gazer_eye', 'star_jelly', 'stone_gargoyle', 'tower_wind']);
  for (const id of Object.keys(MONSTERS_CH5)) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_CH5[id], `${id}: monsters.js に まざる`);
    assert.ok(m.name && m.desc, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    if (id !== 'argos') {
      assert.ok(m.lv >= 40 && m.lv <= 43, `${id}: Lv40〜43`);
      assert.ok(!m.boss);
    }
  }
  for (const [id, a] of Object.entries(TOWER_ABILITIES)) assert.equal(ABILITIES[id], a, `abilities.js に まざる: ${id}`);
  // 機械じかけの 守り手（からくり）は 雷に 弱い・つむじ風は 風が 効かない・ほうき星の鳥は 炎が 効きにくい
  assert.ok(MONSTERS.clockwork_guard.resist.bolt >= 1.3);
  assert.ok(MONSTERS.tower_wind.resist.wind <= 0.3);
  assert.ok(MONSTERS.comet_bird.resist.fire < 1);
  // からくりは 反撃の構え（今の しくみ）
  assert.equal(ABILITIES.m_clock_stance.effect.type, 'stance');
});

test('アルゴスの データ: Lv44・2回行動・ボス。見通しの目・星の光（みんな）・重力（素早さダウン）・前ぶれの ある 星のさばき・段階 2つ', () => {
  const a = MONSTERS.argos;
  assert.equal(a.name, '星の番人アルゴス');
  assert.ok(a.boss && a.turns === 2 && a.size === 'xl');
  assert.ok(a.lv >= 42 && a.lv <= 46);
  const ids = a.actions.map((x) => x.id);
  for (const id of ['m_argos_gaze', 'm_argos_starlight', 'm_argos_gravity', 'm_argos_charge', 'm_argos_beam']) assert.ok(ids.includes(id), id);
  assert.equal(ABILITIES.m_argos_gaze.effect.type, 'foresee');
  assert.equal(ABILITIES.m_argos_starlight.target, 'enemies');
  assert.equal(ABILITIES.m_argos_gravity.effect.debuff.stat, 'agi');
  assert.deepEqual(ABILITIES.m_argos_charge.effect, { type: 'telegraph', next: JUDGE });
  assert.equal(ABILITIES[JUDGE].target, 'enemies');
  // 見通しの目の きまり
  const f = a.foresee;
  for (const k of ['two', 'counter', 'bounce', 'cap', 'daze']) assert.ok(f[k] > 0, k);
  assert.ok(f.cap < 0.5, '1回で たおれない');
  // 段階: HPが へると 2人を 読む・さいごは 攻撃力アップ
  assert.equal(a.phases.length, 2);
  assert.equal(a.phases[0].hpBelow, f.two, '2人を 読む 段階の ことばと おなじ ところ');
  assert.ok(a.phases[0].msg.some((l) => l.includes('2人')));
  assert.equal(a.phases[1].buff.atk, 1.2);
  // 雷が 効く・光は 効きにくい
  assert.ok(a.resist.bolt > 1.2 && a.resist.light < 0.5);
});

test('落とす物: アルゴスは 1人 1つの アクセサリー（星見のペンダント）。ふつうの 魔物は よく・レア・素材', () => {
  const boss = monsterDrops('argos').filter((d) => d.kind === 'boss').map((d) => d.item);
  assert.deepEqual(boss, ['argos_pendant']);
  for (const id of Object.keys(ITEMS_TOWER)) {
    const it = ITEMS[id];
    assert.equal(it, ITEMS_TOWER[id]);
    assert.equal(it.type, 'acc');
    assert.ok(it.unique && !(it.price > 0) && it.rank === 8, id);
  }
  assert.equal(ITEMS.argos_pendant.name, '星見のペンダント');
  for (const id of NEW) {
    const d = monsterDrops(id);
    assert.ok(d.some((x) => x.kind === 'common') && d.some((x) => x.kind === 'rare'), id);
    assert.ok(d.find((x) => x.kind === 'rare').item.startsWith('seed_'), `${id}: レアは 種`);
    assert.equal(MAT_DROPS[id], CH5_MAT_DROPS[id], `${id}: 素材`);
  }
});

test('仲間: 新しい 魔物 6しゅは 仲間に なる（第26回の きまり: 1/12〜1/24・系統配合の 子には ならない・覚える 技は 味方で うごく もの）', () => {
  assert.deepEqual(Object.keys(FRIENDS_CH5).sort(), NEW.slice().sort());
  const bad = new Set(['callHelp', 'stance', 'telegraph', 'reflect', 'foresee', 'burrow', 'mirage', 'flee']);
  for (const [id, f] of Object.entries(FRIENDS_CH5)) {
    assert.equal(MONSTER_FRIENDS[id], f, `${id}: companions.js に まざる`);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 12, `${id}: ${f.rate}`);
    assert.equal(f.noFamily, true);
    assert.ok(!familyPool(MONSTERS[id].race, MONSTERS).includes(id), `${id}: 系統配合の 子には ならない`);
    assert.equal(f.names.length, 4);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.3, `${id}: growth ${sum}`);
    for (const [lv, ab] of f.learn) {
      assert.ok(ABILITIES[ab], `${id}: ${ab}`);
      assert.ok(!bad.has(ABILITIES[ab].effect.type), `${id}: ${ab} は 味方で うごかない`);
      assert.ok(lv >= 1);
    }
    assert.ok(f.note);
  }
  assert.equal(MONSTER_FRIENDS.argos, undefined, 'ボスは 仲間に ならない');
});

test('出現表と きまった 戦い: 名前の 約束（t5_tower_low・t5_tower_high／argos・背景 star_tower・star_tower_top・曲 argos）', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_CH5).sort(), ['t5_tower_high', 't5_tower_low']);
  const species = (t) => new Set(ENCOUNTER_TABLES[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const t of Object.keys(ENCOUNTERS_CH5)) {
    assert.equal(ENCOUNTER_TABLES[t], ENCOUNTERS_CH5[t], `${t}: encounters.js に まざる`);
    assert.equal(NIGHT_ZONES[t], undefined, `${t}: 昼と 夜の 区別は ない`);
    assert.equal(ZONE_BG[t], ZONE_BG_CH5[t]);
    for (const e of ENCOUNTER_TABLES[t]) {
      assert.ok(e.w > 0);
      for (const [sp, mn, mx] of e.group) {
        assert.ok(MONSTERS[sp] && !MONSTERS[sp].boss, `${t}: ${sp}`);
        assert.ok(mn >= 0 && mx >= mn && mx <= 3);
      }
    }
    const s = species(t);
    assert.ok([...s].some((sp) => MONSTERS_CH5[sp]), `${t}: 新しい 魔物`);
    assert.ok([...s].some((sp) => !MONSTERS_CH5[sp]), `${t}: 今 ある 魔物も まぜる`);
  }
  for (const sp of ['stone_gargoyle', 'clockwork_guard', 'tower_wind']) assert.ok(species('t5_tower_low').has(sp), `石の塔: ${sp}`);
  for (const sp of ['star_jelly', 'comet_bird', 'gazer_eye']) assert.ok(species('t5_tower_high').has(sp), `星空: ${sp}`);
  assert.deepEqual(ZONE_BG_CH5, { t5_tower_low: 'star_tower', t5_tower_high: 'star_tower_top' });
  assert.deepEqual(Object.keys(FIXED_CH5), ['argos']);
  const f = FIXED_ENCOUNTERS.argos;
  assert.equal(f, FIXED_CH5.argos);
  assert.deepEqual(f.group, [['argos', 1, 1]]);
  assert.equal(f.bg, 'star_tower_top');
  assert.equal(f.bgm, 'argos');
  assert.equal(f.canFlee, false);
  assert.equal(f.boss, true);
  assert.equal(f.loseOk, undefined, '負けたら 今の ボスと おなじ');
  for (const bg of ['star_tower', 'star_tower_top']) assert.ok(battleBgSpec(bg), bg);
});

// ───────────── 見通しの目 ─────────────
test('行動の 種類: 攻撃（ふつうの 攻撃・特技・魔法剣）・呪文・回復（回復の 技と 道具）・防御。合体技・きずな技・にげるは 読まれない', () => {
  assert.deepEqual(KINDS, ['phys', 'spell', 'heal', 'guard']);
  assert.deepEqual(KIND_NAMES, { phys: '攻撃', spell: '呪文', heal: '回復', guard: '防御' });
  const ab = (id) => actKind({ type: 'ability', id });
  assert.equal(actKind({ type: 'attack' }), 'phys');
  assert.equal(actKind({ type: 'mahouken', spell: 'mera', skill: 'daichi' }), 'phys');
  assert.equal(ab('daichi'), 'phys');
  assert.equal(ab('kiaitame'), 'phys', '呪文で ない 技は 攻撃の なかま');
  assert.equal(ab('merazoma'), 'spell');
  assert.equal(ab('sukuruto'), 'spell', '補助の 呪文は 呪文');
  assert.equal(ab('hoimi'), 'heal');
  assert.equal(ab('behomara'), 'heal');
  assert.equal(ab('zao'), 'heal', '生き返らせる 呪文は 回復');
  assert.equal(actKind({ type: 'item', id: 'herb' }), 'heal');
  assert.equal(actKind({ type: 'defend' }), 'guard');
  for (const t of ['dual', 'bond', 'flee', 'ai']) assert.equal(actKind({ type: t }), null, t);
});

test('読む 種類: さいごに 使った 行動の 種類。まだ 何も して いなければ 職業と 技から（まほう→呪文・そうりょ→回復・せんし→攻撃）', () => {
  const { b, w, p, m, k } = battle();
  assert.equal(predictKind(w), 'phys');
  assert.equal(predictKind(p), 'heal');
  assert.equal(predictKind(m), 'spell');
  assert.equal(predictKind(k), 'phys');
  // 行動すると おぼえる
  act(b, m, { type: 'attack', target: b.enemies[0].id });
  assert.equal(m.lastKind, 'phys');
  assert.equal(predictKind(m), 'phys');
  act(b, p, { type: 'defend' });
  assert.equal(predictKind(p), 'guard');
});

test('見通しの目: 「アルゴスの3つの目が、〇〇をじっと見ている…」で 1人の 次の 種類を 読む（がめんに 読まれた 種類）。読んで いる 間は もう 読まない', () => {
  const { b, argos, m } = battle();
  assert.equal(towerCond(b, argos, 'gaze'), true);
  const ev = gaze(b, argos, m);
  assert.deepEqual(m.foresee, { by: argos.id, kind: 'spell' });
  assert.ok(has(ev, 'アルゴスの3つの目が、まほうをじっと見ている…'));
  assert.ok(has(ev, '「呪文」が、読まれている'));
  assert.equal(ev.fx.type, 'foresee');
  assert.deepEqual(ev.fx.targets, [m.id]);
  assert.deepEqual(ev.fx.kinds, ['spell']);
  assert.equal(ev.warn, true);
  assert.equal(pub(m).foresee, 'spell', 'がめんへ');
  assert.equal(pub(b.allies[0]).foresee, null);
  assert.equal(pub(argos).foresee, undefined);
  // 1人 読んで いる 間は 見通しの目を 使わない（HPが 多い 間）
  assert.equal(towerCond(b, argos, 'gaze'), false);
  // 行動を きめて ならんで いる 人は 読まない
  m.foresee = null;
  for (const a of b.allies) a.queued = true;
  assert.equal(towerCond(b, argos, 'gaze'), false);
});

test('見通しの目: HPが へると（段階）2人を 同時に 読む', () => {
  const { b, argos } = battle();
  argos.hp = Math.round(argos.maxHp * (MONSTERS.argos.foresee.two - 0.05));
  const ev = act(b, argos, { type: 'ability', id: 'm_argos_gaze' });
  assert.equal(ev.fx.targets.length, 2);
  assert.equal(b.allies.filter((a) => a.foresee).length, 2);
  assert.equal(towerCond(b, argos, 'gaze'), false);
  // 1人の 読みが 終われば、また 読める
  b.allies.find((a) => a.foresee).foresee = null;
  assert.equal(towerCond(b, argos, 'gaze'), true);
});

test('読まれた 種類の まま（攻撃）: アルゴスが かわして 反撃。アルゴスに ダメージは ない', () => {
  const { b, argos, w } = battle({ seed: 11 });
  gaze(b, argos, w);
  assert.equal(w.foresee.kind, 'phys');
  const hp0 = argos.hp, whp = w.hp;
  const ev = act(b, w, { type: 'attack', target: argos.id });
  assert.equal(argos.hp, hp0);
  assert.ok(has(ev, '3つの目で動きを見切っていた'));
  assert.ok(has(ev, 'かわして反撃'));
  assert.ok(w.hp < whp, '反撃された');
  assert.deepEqual(ev.foreseeHit, { by: argos.id, who: w.id, kind: 'phys' });
  assert.equal(ev.fx.type, 'foreseeHit');
  assert.ok(ev.results.some((r) => r.id === argos.id && r.miss));
  assert.equal(w.foresee, undefined, '読みは 1回で 消える');
  // 特技も 攻撃の なかま
  gaze(b, argos, w);
  const ev2 = act(b, w, { type: 'ability', id: 'kaiha', target: argos.id });
  assert.ok(ev2.foreseeHit);
  assert.equal(argos.hp, hp0);
});

test('読まれた 種類の まま（呪文）: MPを はらって はね返される（さいだいHPの きまった わりあいまで）。回復は かき消される。道具は へらない', () => {
  const used = [];
  const { b, argos, m, p } = battle({ seed: 12, hooks: { consumeItem: (c, id) => { used.push(id); return true; }, hasItem: () => true } });
  gaze(b, argos, m);
  const hp0 = argos.hp, mp0 = m.mp, mhp = m.hp;
  const ev = act(b, m, { type: 'ability', id: 'merazoma', target: argos.id });
  assert.equal(argos.hp, hp0, 'アルゴスには 当たらない');
  assert.ok(m.mp < mp0, 'MPは へる');
  assert.ok(has(ev, '呪文をはね返した'));
  assert.ok(m.hp < mhp);
  assert.ok(mhp - m.hp <= Math.round(m.maxHp * MONSTERS.argos.foresee.cap), 'さいだいHPの cap まで');
  // 回復: かき消される
  p.hp = Math.round(p.maxHp / 2);
  const php = p.hp;
  gaze(b, argos, p);
  assert.equal(p.foresee.kind, 'heal');
  const ev2 = act(b, p, { type: 'ability', id: 'behoimi', target: p.id });
  assert.equal(p.hp, php);
  assert.ok(has(ev2, '回復の光をすいこんで'));
  // 道具も 回復の なかま（へらない）
  gaze(b, argos, p);
  const ev3 = act(b, p, { type: 'item', id: 'herb', target: p.id });
  assert.ok(ev3.foreseeHit);
  assert.equal(p.hp, php);
  assert.deepEqual(used, [], '道具は へらない');
});

test('読まれた 種類の まま（防御）: 守りを 見ぬかれて 身を 守れず、守備力が 下がる', () => {
  const { b, argos, w } = battle({ seed: 13 });
  act(b, w, { type: 'defend' });
  gaze(b, argos, w);
  assert.equal(w.foresee.kind, 'guard');
  w.defending = false;
  const ev = act(b, w, { type: 'defend' });
  assert.equal(w.defending, false);
  assert.ok(w.debuffs.def, '守備力が 下がる');
  assert.ok(has(ev, '守りのすきを見ぬいていた'));
});

test('行動を 変えれば 外れる: ふつうに 当たり、アルゴスの 目が くらむ（こうどうゲージが へる）', () => {
  const { b, argos, m } = battle({ seed: 14 });
  gaze(b, argos, m);
  assert.equal(m.foresee.kind, 'spell');
  argos.atb = 50;
  const hp0 = argos.hp;
  const ev = act(b, m, { type: 'attack', target: argos.id });
  assert.ok(argos.hp < hp0 || ev.results.some((r) => r.miss), '読みが 外れて ふつうの 攻撃');
  assert.ok(has(ev, '読みが外れた'));
  assert.ok(!ev.foreseeHit);
  assert.deepEqual(ev.foreseeMiss, { by: argos.id, who: m.id });
  assert.equal(argos.atb, 50 - MONSTERS.argos.foresee.daze);
  assert.equal(m.foresee, undefined);
  // 呪文を 読まれて 回復の 呪文に 変えても 外れる
  const { b: b2, argos: a2, m: m2 } = battle({ seed: 15 });
  gaze(b2, a2, m2);
  m2.hp = Math.round(m2.maxHp / 2);
  const ev2 = act(b2, m2, { type: 'item', id: 'herb', target: m2.id });
  assert.ok(ev2.foreseeMiss);
});

test('読みが 消える: 動けない 番（ねむり）・アルゴスが たおれる・混乱した 行動・合体技など 読まれない 行動', () => {
  const { b, argos, m, w } = battle({ seed: 16 });
  gaze(b, argos, m);
  m.status.sleep = { turns: 2 };
  b.queue = [{ id: m.id, cmd: { type: 'incapacitated' }, last: true }];
  m.queued = true;
  b.executeNext();
  assert.equal(m.foresee, undefined, '動けない 番で 消える');
  delete m.status.sleep;
  // 混乱した 行動は しかえし されない
  gaze(b, argos, w);
  const ev = act(b, w, { type: 'attack', target: argos.id, confused: true });
  assert.ok(!ev.foreseeHit && !ev.foreseeMiss);
  assert.equal(w.foresee, undefined);
  // アルゴスが たおれると 読みは みんな 消える
  gaze(b, argos, m);
  argos.hp = 1;
  const ev2 = evOf(w);
  b.cur = ev2;
  b.damage(w, argos, 50, ev2);
  b.cur = null;
  assert.equal(argos.alive, false);
  assert.equal(m.foresee, undefined);
  assert.ok(ev2.upd.includes(m));
});

test('人が えらぶ 防御: 読まれて いれば じゅんばんに ならべて たしかめる（読まれて いなければ 今までどおり すぐ 守る）', () => {
  const { b, argos, w } = battle({ seed: 17 });
  w.controller = 'u1';
  w.auto = false;
  w.ready = true;
  assert.ok(b.command(w.id, { type: 'defend' }, 'u1').ok);
  assert.equal(w.defending, true, 'すぐ 守る');
  assert.ok(!b.queue.some((q) => q.id === w.id));
  w.defending = false;
  gaze(b, argos, w);
  w.foresee.kind = 'guard';
  w.ready = true;
  assert.ok(b.command(w.id, { type: 'defend' }, 'u1').ok);
  assert.ok(b.queue.some((q) => q.id === w.id && q.cmd.type === 'defend'), 'ならべる');
  b.queue = b.queue.filter((q) => q.id === w.id);
  b.executeNext();
  assert.equal(w.defending, false, '見ぬかれた');
});

test('前ぶれ: 目に 星の光が 集まる → 次の 番に 星のさばき（みんなに 大きい。身を 守ると 半分）', () => {
  const { b, argos, w } = battle({ seed: 18 });
  const ev = act(b, argos, { type: 'ability', id: 'm_argos_charge' });
  assert.equal(argos.telegraph, JUDGE);
  assert.ok(has(ev, '星の光が集まり始めた'));
  assert.equal(ev.fx.type, 'telegraph');
  const cmd = decideMonster(b, argos);
  assert.equal(cmd.id, JUDGE);
  assert.equal(cmd.big, true);
  const e = ABILITIES[JUDGE].effect;
  const plain = b.calcPhys(argos, w, e, 1, 'light', true).dmg;
  w.defending = true;
  const guarded = b.calcPhys(argos, w, e, 1, 'light', true).dmg;
  assert.ok(Math.abs(guarded - plain / 2) <= 1, `${guarded} ≒ ${plain}/2`);
});

// ───────────── オート ─────────────
test('オートの 仲間（ふつう）: 読まれた 種類を さけて 行動を 変える。シミュレーターの 知らない 人（argosNaive）は そのまま', () => {
  const { b, argos, m, w } = battle({ seed: 19 });
  const free = decideAlly(b, m);
  assert.equal(actKind(free), 'spell', 'ふだんの まほうは 呪文');
  gaze(b, argos, m);
  for (let i = 0; i < 10; i++) assert.notEqual(actKind(decideAlly(b, m)), 'spell', '呪文を さける');
  b.argosNaive = true;
  assert.equal(actKind(decideAlly(b, m)), 'spell', '知らない 人は そのまま');
  b.argosNaive = false;
  m.foresee = null;
  // せんしは 攻撃を 読まれると、呪文が ないので 身を 守る（防御を 読まれたら 攻撃）
  gaze(b, argos, w);
  assert.equal(w.foresee.kind, 'phys');
  assert.notEqual(actKind(decideAlly(b, w)), 'phys');
  assert.deepEqual(dodgeCmd(b, w, 'guard'), { type: 'attack', target: argos.id });
  // 回復を 読まれた そうりょは、ほかの 行動（呪文か 攻撃）
  const p = b.allies[1];
  p.foresee = { by: argos.id, kind: 'heal' };
  b.allies[0].hp = 10;
  assert.notEqual(actKind(decideAlly(b, p)), 'heal');
});

test('オートの 仲間（知っている 人 knowsArgos）: 星のさばきが 自分の 番より 先に 来る ときは 身を 守る', () => {
  const { b, argos, w } = battle({ seed: 20 });
  b.knowsArgos = true;
  argos.telegraph = JUDGE;
  argos.atb = 95;
  w.atb = 0;
  assert.deepEqual(decideAlly(b, w), { type: 'defend' });
  // 防御を 読まれて いれば 守らない（見ぬかれる）
  w.foresee = { by: argos.id, kind: 'guard' };
  assert.notEqual(decideAlly(b, w).type, 'defend');
});

test('シミュレーション: tools/sim.js の ch5tower（出現表・アルゴス 知っている／知らない）。さいごまで 戦える', () => {
  assert.deepEqual(CH5_TOWER.map((x) => x[0]), ['t5_tower_low', 't5_tower_low', 't5_tower_high', 't5_tower_high']);
  assert.ok(CH5_ARGOS.includes(41) && CH5_ARGOS.includes(42));
  for (const know of [true, false]) {
    const r = argosFight(42, 777, know);
    assert.ok(['win', 'lose'].includes(r.outcome), `${know}: ${r.outcome}`);
    assert.ok(r.reads > 0, '読まれる');
    if (know) assert.equal(r.hits, 0, '知っている 人は 当たらない');
    else assert.ok(r.hits > 0, '知らない 人は 当たる');
  }
  for (const t of ['t5_tower_low', 't5_tower_high']) {
    const group = ENCOUNTER_TABLES[t][0].group.flatMap(([sp, , mx]) => Array(mx).fill(sp));
    const r = runBattle(PARTY(41), group, { seed: 3 });
    assert.equal(r.outcome, 'win', t);
  }
});

test('きまった 戦い argos: 台本の ["battle", "argos"] と おなじ（背景・曲・ボス）。さいごまで 動く', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(51), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], 'argos');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.equal(start.snap.bg, 'star_tower_top');
  assert.equal(start.snap.bgm, 'argos');
  assert.equal(start.snap.boss, true);
  assert.equal(start.snap.canFlee, false);
  assert.deepEqual(start.snap.combatants.filter((x) => x.side === 'enemy').map((x) => x.species), ['argos']);
  const me = start.snap.combatants.find((x) => x.side === 'ally');
  assert.equal(me.foresee, null);
  await ken.settle(30000);
  const outcome = await done;
  assert.ok(['win', 'lose'].includes(outcome), outcome);
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
    eye(cx, cy, r) { colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 塔の 魔物 6しゅと アルゴス（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  for (const id of Object.keys(MONSTERS_CH5)) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const max = id === 'argos' ? 140 : 70;
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
  assert.ok(area('gazer_eye') < area('clockwork_guard') && area('tower_wind') < area('comet_bird'), 's は m より 小さい');
  // アルゴス: 戦いの え に 入る・台本の showMon('argos') でも 見せられる 大きさ（モルガナ 真の姿 くらい）
  const [aw, ah] = MONSTER_ART.argos.size;
  assert.ok(aw <= BW - 12 && ah + 2 <= BASE_Y);
  assert.ok(aw * ah >= MONSTER_ART.morgana.size[0] * MONSTER_ART.morgana.size[1] * 1.5);
  // 3つの 目の 場所（読んで いる 間 光らせる）
  assert.equal(ARGOS_EYES.length, 3);
  for (const [x, y] of ARGOS_EYES) assert.ok(x > 0.3 && x < 0.7 && y > 0.05 && y < 0.4);
  // 出現表の 3体が ならんでも ちぢみすぎない
  for (const t of Object.keys(ENCOUNTERS_CH5)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
});

test('絵: 戦いの 背景 2つ（石の 塔の 中・星空の てっぺん）と エフェクト（見通しの目・星の光・星のさばき・塔の 魔物の 技）', () => {
  assert.deepEqual(Object.keys(TOWER_BG).sort(), ['star_tower', 'star_tower_top']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(TOWER_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(TOWER_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawTowerBg(ctx, d, 78);
    drawTowerFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 200, `${id}: こまかく かく`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = ['foresee', 'foresee_eyes', 'foresee_hit', 'foresee_miss', 'star_light', 'judge_charge', 'star_judge', 'gravity', 'eye_beam', 'eye_gaze',
    'garg_dive', 'gear_cut', 'tower_gust', 'comet_dive', 'comet_tail'];
  for (const a of own) assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { from: { x: 120, y: 50 }, to: [{ x: 128, y: 120 }] }), true, a);
  assert.equal(playTowerFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false, 'ほかの 技は ふつうの エフェクト');
  // 新しい 技の anim は どれも エフェクトか 今 ある anim
  const reuse = new Set(['guard', 'buff', 'heal1', 'bite', 'wind2']);
  for (const [id, a] of Object.entries(TOWER_ABILITIES)) assert.ok(own.includes(a.anim) || reuse.has(a.anim), `${id}: ${a.anim}`);
  for (const a of TOWER_SCREEN_ANIMS) assert.ok(own.includes(a));
  for (const a of Object.keys(TOWER_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(TOWER_SFX)) assert.ok(own.includes(a), a);
});

test('がめん: 読まれた 人の まどに 目の しるしと 種類（名前の 上）。読んで いる 間は アルゴスの 目が 光る', () => {
  const box = () => {
    const cls = new Set();
    return { classList: { toggle: (k, on) => (on ? cls.add(k) : cls.delete(k)), has: (k) => cls.has(k) }, dataset: {} };
  };
  const a1 = { id: 'a0', alive: true, foresee: 'spell' }, a2 = { id: 'a1', alive: true, foresee: null };
  const boxes = new Map([['a0', { box: box() }], ['a1', { box: box() }]]);
  const scene = { allies: () => [a1, a2], statusBoxes: boxes, time: 100 };
  towerMarks(scene);
  assert.ok(boxes.get('a0').box.classList.has('foresee'));
  assert.equal(boxes.get('a0').box.dataset.fs, '「呪文」を読まれている');
  assert.ok(!boxes.get('a1').box.classList.has('foresee'));
  a1.foresee = null;
  towerMarks(scene);
  assert.ok(!boxes.get('a0').box.classList.has('foresee'));
  assert.equal(boxes.get('a0').box.dataset.fs, undefined);
  // 目が 光る（読んで いる 人が いる 時だけ かく）
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  towerDraw(scene, x, {}, { species: 'argos', alive: true }, 10, 10, 116, 118, 1);
  assert.equal(drawn.length, 0, 'だれも 読まれて いない');
  a1.foresee = 'phys';
  towerDraw(scene, x, {}, { species: 'argos', alive: true }, 10, 10, 116, 118, 1);
  assert.ok(drawn.length >= 9);
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/battle-ch5.js', 'public/js/client/battle-ch5.js', 'public/js/shared/data/monsters-ch5.js', 'public/js/shared/data/abilities-tower.js',
    'public/js/shared/data/items-tower.js', 'public/js/shared/data/encounters-ch5.js', 'public/js/shared/data/companions-ch5.js'];
  const list = gameFiles();
  for (const f of files) {
    const full = list.find((x) => x.endsWith(f));
    assert.ok(full, `gameFiles: ${f}`);
    const bad = checkFile(full).filter((p) => p.kind === 'kanji' || p.kind === 'space');
    assert.deepEqual(bad, [], f);
  }
});
