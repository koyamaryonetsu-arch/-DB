// 第4章「砂の海にしずむ星」Step 5: 月の鏡と 大臣の 正体
// 夜の 中庭の とびら（月の鏡）→ 大臣ザイード（まぼろしの 分身・戦いの「道具」の 月の鏡）→ 月の光 → 砂の魔神ザイード →
// 女王が 目を 覚ます → 女王の手紙 → 砂嵐が 弱まる（竜・南の 砂嵐の 切れ目）→ 南の砂ばく → 砂の港ドゥナへの 谷（門は 開かない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import {
  SAFARA_POS, SOUTH_ARRIVE, SOUTH_STORM_Y, SOUTH_STORM_GAP_X, SOUTH_STORM_FLAG, DUNA_GATE, DUNA_VALLEY, SOUTH_SKY_ZAID, SOUTH_LANDING,
} from '../public/js/shared/maps/south.js';
import { DUNA_LOOKOUTS, ZAID_FLAG } from '../public/js/shared/maps/ch4.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { C4_OBJ, OLD_C4_OBJ, CH4_STEPS } from '../public/js/shared/data/story-ch4.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES_CH4 } from '../public/js/shared/data/encounters-ch4.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { fieldChestLootTable } from '../public/js/shared/data/fieldchests.js';
import { skyBox, inSkyBox } from '../public/js/shared/data/sky.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly, decideMonster } from '../public/js/shared/ai.js';
import { DAY_MS, isNightFor } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel, computeStats, itemCount, ownsItem } from '../public/js/shared/stats.js';
import { makeChar } from '../tools/sim.js';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h, m = 0) => (h + m / 60 - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const P = SAFARA_POS;
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const stepsOf = (list) => JSON.stringify(list);

// ───────────── たたかいの しかけ（まぼろしの 分身・月の鏡）─────────────
const PARTY = (lv = 35) => [makeChar('warrior', lv, 10, 'せんし', 33), makeChar('priest', lv, 10, 'そうりょ', 33), makeChar('mage', lv, 10, 'まほう', 33), makeChar('monk', lv, 10, 'ぶとう', 33)];
function zaidBattle(seed = 5, opts = {}) {
  const party = opts.party || PARTY();
  const b = new Battle({ rng: makeRng(seed), allies: party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced' })), enemies: ['zaid_minister', 'zaid_minister', 'zaid_minister'], boss: true, canFlee: false });
  const real = b.enemies.find((e) => e.shade);
  return { b, real, clones: b.enemies.filter((e) => e.clone), party };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
// 本物の 番（ai.js の decideMonster → act と おなじ じゅんで ことばを まとめる）
function realTurn(b, real) {
  const ev = evOf(real);
  b.cur = ev;
  const cmd = decideMonster(b, real);
  b.perform(real, cmd, ev);
  b.cur = null;
  if (ev.postLines) ev.lines.push(...ev.postLines);
  return { cmd, ev };
}

test('大臣ザイード: 3体の うち 本物は 1体だけ（足もとに 影）。分身は おなじ 名前・おなじ HPに 見えるが、こうげきは 弱い', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const { b, real, clones } = zaidBattle(seed);
    assert.equal(b.enemies.filter((e) => e.shade).length, 1, '影は 本物だけ');
    assert.equal(clones.length, 2);
    assert.ok(!real.clone && clones.every((x) => !x.shade));
    assert.deepEqual(b.enemies.map((e) => e.name).sort(), ['大臣ザイードA', '大臣ザイードB', '大臣ザイードC']);
    for (const x of clones) {
      assert.equal(x.hp, real.hp, 'HPは おなじに 見える');
      assert.ok(x.atk < real.atk, '分身の こうげきは 弱い');
      assert.deepEqual(x.actions.map((a) => a.id), ['attack']);
    }
    // がめんへ: 本物にだけ 影（shade）・月の鏡の 光
    const snap = b.snapshot();
    assert.deepEqual(snap.combatants.filter((c) => c.shade).map((c) => c.id), [real.id]);
    assert.deepEqual(snap.mirror, { cd: 0, max: 3 });
  }
  // ほかの 戦いには まぼろしも 月の鏡も ない
  const other = new Battle({ rng: makeRng(1), allies: PARTY().map((c) => ({ char: c, kind: 'support', auto: true })), enemies: ['sand_worm', 'sand_worm'], canFlee: true });
  assert.equal(other.mirage, undefined);
  assert.equal(other.snapshot().mirror, null);
  assert.ok(other.enemies.every((e) => !e.shade && !e.clone));
});

test('分身に 当てると「まぼろしだった！」と 消える（たおした ことに ならない）。当てた 人の MPが まぼろしの わらいで へる', () => {
  const { b, real, clones } = zaidBattle(7);
  const [w, , mage] = b.allies;
  // こうげき
  const ev = evOf(w);
  const mp0 = w.mp;
  b.perform(w, { type: 'attack', target: clones[0].id }, ev);
  assert.ok(!clones[0].alive, '分身は 消えた');
  assert.ok(ev.lines.some((l) => l.startsWith('まぼろしだった！')));
  assert.ok((ev.results || []).some((r) => r.id === clones[0].id && r.vanish));
  const lost = mp0 - w.mp;
  const [mn, mx] = MONSTERS.zaid_minister.mirage.laugh;
  assert.ok(lost >= Math.min(mn, mp0) && lost <= mx, `MPが へる ${lost}`);
  assert.ok(ev.postLines.some((l) => l.includes('フハハハ')));
  assert.ok(ev.postLines.some((l) => l.includes('まぼろしのわらい') && l.includes(w.name)));
  assert.equal(real.hp, real.maxHp, '本物は むきず');
  // 呪文でも おなじ（全体の 呪文は 本物には ダメージ・分身は 消える。わらいの ことばは 1回）
  const ev2 = evOf(mage);
  const spell = ['ice2', 'mera3', 'gira'].find((id) => ABILITIES[id] && mage.abilities.includes(id)) || mage.abilities.find((id) => ['enemies', 'group'].includes(ABILITIES[id]?.target) && ABILITIES[id]?.effect?.type === 'magic');
  assert.ok(spell, '全体・グループの 呪文');
  const tgt = ABILITIES[spell].target === 'group' ? clones[1].id : undefined;
  const mpm = mage.mp;
  b.applyAbility(mage, ABILITIES[spell], { target: tgt }, ev2, 1);
  assert.ok(!clones[1].alive, '呪文でも 消える');
  assert.equal(ev2.postLines.filter((l) => l.includes('フハハハ')).length, 1, 'わらいの ことばは 1回');
  assert.ok(mage.mp < mpm);
  // 本物が たおれると、のこった 分身も 消えて 勝ち。たおした のは 本物 1体だけ（経験値は 1体ぶん）
  const { b: b2, real: r2, clones: c2 } = zaidBattle(8);
  const ev3 = evOf(b2.allies[0]);
  b2.damage(b2.allies[0], r2, r2.hp, ev3, { element: 'phys' });
  assert.ok(!r2.alive && c2.every((x) => !x.alive), '分身も 消える');
  assert.ok(ev3.lines.some((l) => l.includes('分身も、砂になって消えていった')));
  b2.checkEnd();
  assert.equal(b2.pendingEnd?.outcome, 'win');
  assert.deepEqual(b2.killed, ['zaid_minister']);
});

test('本物が ダメージを うけると、分身の HPも おなじに 見える（HPでは 見わけられない）', () => {
  const { b, real, clones } = zaidBattle(9);
  const ev = evOf(b.allies[0]);
  b.damage(b.allies[0], real, 700, ev, { element: 'phys' });
  for (const x of clones) assert.equal(x.hp, real.hp);
  const snap = b.snapshot().combatants.filter((c) => c.side === 'enemy');
  assert.equal(new Set(snap.map((c) => c.hp)).size, 1);
});

test('月の鏡（道具）: 分身が ぜんぶ 消え、本物は つぎの 番 まぶしくて 動けない。本物が 3回 動くまで 光は もどらない', () => {
  const { b, real, clones } = zaidBattle(11);
  const pr = b.allies[1];
  assert.deepEqual(b.validate(pr, { type: 'item', id: 'moon_mirror' }), { ok: true });
  const ev = evOf(pr);
  b.perform(pr, { type: 'item', id: 'moon_mirror' }, ev);
  assert.ok(clones.every((x) => !x.alive), '分身が 消えた');
  assert.ok(real.alive && real.dazzled);
  assert.equal(ev.mirror, 3);
  assert.equal(ev.fx.type, 'mirror');
  assert.ok(ev.lines.includes('まぼろしの分身が、すべて消えた！'));
  assert.equal(b.snapshot().mirror.cd, 3);
  // わらいで MPは へらない（月の鏡は 分身に「当てた」ことに ならない）
  assert.equal(pr.mp, pr.maxMp);
  // 光が もどるまで 使えない（サーバーが ことわる）
  const v = b.validate(pr, { type: 'item', id: 'moon_mirror' });
  assert.ok(!v.ok && v.reason.includes('月の鏡の光'), v.reason);
  // 本物の つぎの 番: まぶしくて 動けない
  const t1 = realTurn(b, real);
  assert.equal(t1.cmd.id, 'm_mirage_dazzled');
  assert.ok(t1.ev.lines.some((l) => l.includes('まぶしくて、動けない')));
  assert.ok(!real.dazzled);
  assert.equal(t1.ev.mirror, 2, '本物の 番ごとに 光が もどる');
  realTurn(b, real);
  const t3 = realTurn(b, real);
  assert.equal(t3.ev.mirror, 0);
  assert.deepEqual(b.validate(pr, { type: 'item', id: 'moon_mirror' }), { ok: true }, '3回 動いたら また 使える');
});

test('まぼろしは 本物が 3回 動くと もどる（1つ前の 番に 前ぶれ）。もどると 3人の ならびが 入れかわる', () => {
  const { b, real, clones } = zaidBattle(13);
  // 分身を 2体とも 消す（こうげきで）
  for (const x of clones) b.perform(b.allies[0], { type: 'attack', target: x.id }, evOf(b.allies[0]));
  assert.ok(clones.every((x) => !x.alive));
  const slots0 = new Map(b.enemies.map((e) => [e.id, e.slot]));
  const t1 = realTurn(b, real);
  assert.notEqual(t1.cmd.id, 'm_zaid_mirage');
  const t2 = realTurn(b, real);
  assert.ok(t2.ev.lines.some((l) => l.includes('ゆらゆらとゆれ始めた')), '前ぶれ');
  const t3 = realTurn(b, real);
  assert.equal(t3.cmd.id, 'm_zaid_mirage');
  assert.ok(clones.every((x) => x.alive && x.hp === real.hp), '分身が もどった');
  assert.ok(t3.ev.lines.some((l) => l.includes('まぼろしを作り出した')));
  assert.equal(t3.ev.fx.anim, 'mirage');
  assert.ok(t3.ev.fx.mirage);
  // ならびと 名前（A・B・C は 左から）
  const group = [...b.enemies].sort((p, q) => p.slot - q.slot);
  assert.deepEqual(group.map((e) => e.letter), ['A', 'B', 'C']);
  assert.deepEqual([...new Set(group.map((e) => e.slot))].length, 3);
  assert.deepEqual([...slots0.values()].sort(), group.map((e) => e.slot), 'おなじ 3つの 場所');
  // 入れかわりは ばらばら（いろいろな シードで、本物の 場所が かわる ことが ある）
  let moved = 0;
  for (let s = 20; s < 40; s++) {
    const z = zaidBattle(s);
    const before = z.real.slot;
    for (const x of z.clones) z.b.perform(z.b.allies[0], { type: 'attack', target: x.id }, evOf(z.b.allies[0]));
    for (let i = 0; i < 3; i++) realTurn(z.b, z.real);
    if (z.real.slot !== before) moved++;
  }
  assert.ok(moved >= 5, `本物の 場所が かわる ${moved}/20`);
});

test('月の鏡で まぶしい 番は、まぼろしを 作りなおすのも おあずけ（つぎの 番）', () => {
  const { b, real, clones } = zaidBattle(17);
  for (const x of clones) b.perform(b.allies[0], { type: 'attack', target: x.id }, evOf(b.allies[0]));
  realTurn(b, real);
  realTurn(b, real);
  // 3回目の 番の 前に 月の鏡
  b.perform(b.allies[1], { type: 'item', id: 'moon_mirror' }, evOf(b.allies[1]));
  const t3 = realTurn(b, real);
  assert.equal(t3.cmd.id, 'm_mirage_dazzled');
  assert.ok(clones.every((x) => !x.alive));
  const t4 = realTurn(b, real);
  assert.equal(t4.cmd.id, 'm_zaid_mirage', 'つぎの 番に まぼろし');
});

test('オートの なかま: 知らない 人は 分身も ねらう。知っている 人（b.knowsMirage）は 本物だけを ねらい、月の鏡を 使う', () => {
  let hitClone = 0;
  for (let s = 0; s < 30; s++) {
    const { b, clones } = zaidBattle(100 + s);
    const cmd = decideAlly(b, b.allies[0]);
    if (clones.some((x) => x.id === cmd.target)) hitClone++;
  }
  assert.ok(hitClone > 0, `知らない 人は 分身を ねらう ${hitClone}/30`);
  for (let s = 0; s < 30; s++) {
    const { b, real, clones } = zaidBattle(200 + s);
    b.knowsMirage = true;
    const first = decideAlly(b, b.allies[s % 4]);
    assert.deepEqual(first, { type: 'item', id: 'moon_mirror' }, '光が ある ときは 月の鏡');
    b.perform(b.allies[s % 4], first, evOf(b.allies[s % 4]));
    // 光が もどるまでは、本物だけ
    clones.forEach((x) => Object.assign(x, { alive: true, hp: real.hp }));
    for (const a of b.allies) {
      const cmd = decideAlly(b, a);
      assert.ok(!clones.some((x) => x.id === cmd.target), `${a.name}: ${JSON.stringify(cmd)}`);
      assert.notEqual(cmd.id, 'moon_mirror');
    }
  }
});

test('砂の魔神ザイード: 2回行動。氷・風が 弱点、炎・爆発が 効きにくい。砂の大うずは 前ぶれ つき。HP半分で いかる。魔神のランプを 落とす', () => {
  const m = MONSTERS.zaid_demon;
  assert.equal(m.lv, 36);
  assert.ok(m.boss && m.turns === 2 && m.size === 'xl');
  assert.ok(m.resist.ice > 1 && m.resist.wind > 1, '氷・風');
  assert.ok(m.resist.fire < 1 && m.resist.blast < 1, '炎・爆発');
  const ids = m.actions.map((a) => a.id);
  for (const id of ['m_demon_swing', 'm_demon_storm', 'm_demon_hand', 'm_demon_vortex_charge']) assert.ok(ids.includes(id), id);
  assert.deepEqual(ABILITIES.m_demon_vortex_charge.effect, { type: 'telegraph', next: 'm_demon_vortex' });
  assert.ok(ABILITIES.m_demon_vortex_charge.cast.includes('砂がうずをまき始めた'));
  assert.equal(ABILITIES.m_demon_vortex.target, 'enemies');
  assert.equal(ABILITIES.m_demon_storm.effect.status.status, 'blind', '砂嵐（マヌーサ）');
  assert.equal(ABILITIES.m_demon_hand.effect.status, 'paralyze', '砂の手（動けない）');
  assert.equal(m.phases[0].hpBelow, 0.5);
  assert.deepEqual(m.drops.boss, ['majin_lamp']);
  assert.ok(ITEMS.majin_lamp.unique && ITEMS.majin_lamp.type === 'acc' && ITEMS.majin_lamp.equipUse);
  assert.deepEqual(MONSTERS.zaid_minister.drops.boss, ['mirage_ring']);
  assert.ok(ITEMS.mirage_ring.unique && ITEMS.mirage_ring.type === 'acc');
  // 戦い: 夜の 王の間・ザイードの きょく・にげられない
  for (const id of ['zaid', 'zaid_demon']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f.boss && !f.canFlee, id);
    assert.equal(f.bg, 'palace_night');
    assert.equal(f.bgm, 'sand_demon');
  }
  assert.deepEqual(FIXED_ENCOUNTERS.zaid.group, [['zaid_minister', 3, 3]]);
  assert.deepEqual(FIXED_ENCOUNTERS.zaid_demon.group, [['zaid_demon', 1, 1]]);
  // 図鑑の せつめいで しかけを 教える
  assert.ok(MONSTERS.zaid_minister.desc.includes('影') && MONSTERS.zaid_minister.desc.includes('月の鏡'));
  assert.ok(m.desc.includes('身を守ろう'));
});

test('魔神のランプ: そうびしていると、戦いの「道具」から 1回の 戦いで 1回だけ みんなの MPを 回復', () => {
  const party = PARTY();
  party[2].equip.acc = 'majin_lamp';
  const { b } = zaidBattle(19, { party });
  const mage = b.allies[2];
  assert.equal(mage.acc, 'majin_lamp');
  for (const a of b.allies) a.mp = 0;
  assert.ok(!b.validate(b.allies[0], { type: 'item', id: 'majin_lamp' }).ok, 'そうびして いない 人は 使えない');
  assert.deepEqual(b.validate(mage, { type: 'item', id: 'majin_lamp' }), { ok: true });
  const ev = evOf(mage);
  b.perform(mage, { type: 'item', id: 'majin_lamp' }, ev);
  const [lo, hi] = ITEMS.majin_lamp.equipUse.base;
  for (const a of b.allies) assert.ok(a.mp >= Math.min(lo, a.maxMp) && a.mp <= hi, `${a.name} ${a.mp}`);
  const v = b.validate(mage, { type: 'item', id: 'majin_lamp' });
  assert.ok(!v.ok && v.reason.includes('もう使った'));
  assert.ok(b.snapshot().combatants.find((c) => c.id === mage.id).accUsed);
});

// ───────────── 物語 ─────────────
test('中庭の とびら: 月の鏡が ないと カギが かかったまま。昼は 鏡が くもる。夜（リーダーの 時計）は 大臣ザイードの イベント', () => {
  const ctx = (flags, night) => ({ c: { name: 'ソラ' }, name: 'ソラ', night, flag: (f) => !!flags[f], has: () => false, count: () => 0 });
  const upto = Object.fromEntries(UPTO('c4_anku').map((f) => [f, true]));
  const locked = SCRIPTS.c4_court_door(ctx(upto, true));
  assert.ok(stepsOf(locked).includes('カギがかかっていて'));
  assert.ok(!locked.some((s) => s[0] === 'battle'));
  const withMirror = { ...upto, c4_mirror: true };
  const day = SCRIPTS.c4_court_door(ctx(withMirror, false));
  assert.ok(stepsOf(day).includes('くもったように') && stepsOf(day).includes('夜になったら'));
  assert.ok(!day.some((s) => s[0] === 'battle'));
  const night = SCRIPTS.c4_court_door(ctx(withMirror, true));
  const kinds = night.map((s) => s[0]);
  const b1 = night.findIndex((s) => s[0] === 'battle' && s[1] === 'zaid');
  const heal = night.findIndex((s) => s[0] === 'heal');
  const b2 = night.findIndex((s) => s[0] === 'battle' && s[1] === 'zaid_demon');
  assert.ok(b1 > 0 && heal > b1 && b2 > heal, 'ザイード → 月の光 → 砂の魔神');
  assert.deepEqual(night[heal][1], { mp: 0.3 }, 'HPは ぜんぶ、MPは 3わり');
  const flag = (f) => night.findIndex((s) => s[0] === 'flag' && s[1] === f);
  assert.ok(flag('c4_zaid') > b2 && flag('c4_letter') > flag('c4_zaid'));
  assert.ok(night.some((s) => s[0] === 'item' && s[1] === 'queen_letter'));
  assert.ok(night.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.letter));
  assert.ok(kinds.includes('showMon') && night.some((s) => s[0] === 'actor' && s[2]?.sprite === 'zaid_demon_true'), '鏡に うつる 魔神・真の すがた');
  assert.ok(stepsOf(night).includes('水鏡の魔人モルガナ'), 'モルガナの しもべ');
  // 物語の だいほん（リーダーの 世界で すすむ）
  assert.ok(STORY_SCRIPTS.has('c4_court_door') && STORY_SCRIPTS.has('c4_d_lookout') && STORY_SCRIPTS.has('c4_nefi'));
});

test('すすみぐあい: c4_mirror → c4_zaid → c4_letter（→ c4_duna_gate）。目標・仲間会話・地図の しるし。Step 4 の さいごの 文も なおる', () => {
  // Step 6 で うしろに たした（c4_duna 〜。test/ch4-duna.test.js）
  const mi = CH4_STEPS.indexOf('c4_mirror');
  assert.deepEqual(CH4_STEPS.slice(mi, mi + 3), ['c4_mirror', 'c4_zaid', 'c4_letter']);
  for (const f of ['c4_zaid', 'c4_letter']) assert.ok(STORY_STEPS.includes(f), f);
  const f = (...l) => ({ flags: Object.fromEntries([...UPTO('c4_mirror'), ...l].map((k) => [k, true])) });
  assert.equal(objectiveFromFlags(f()), C4_OBJ.mirror);
  assert.equal(objectiveFromFlags(f('c4_zaid')), C4_OBJ.zaid);
  assert.equal(objectiveFromFlags(f('c4_zaid', 'c4_letter')), C4_OBJ.letter);
  assert.equal(objectiveFromFlags(f('c4_zaid', 'c4_letter', 'c4_duna_gate')), C4_OBJ.dunagate);
  // Step 5 の さいごの「続きはアップデートで！」は、Step 6 で「見張りに もう一度 話しかけよう」に なおる
  assert.ok(OLD_C4_OBJ.dunagate.startsWith('第4章の続きはアップデートで！（') && !KNOWN_OBJECTIVES.has(OLD_C4_OBJ.dunagate));
  const old5 = { flags: f('c4_zaid', 'c4_letter', 'c4_duna_gate').flags, objective: OLD_C4_OBJ.dunagate };
  assert.ok(repairObjective(old5));
  assert.equal(old5.objective, C4_OBJ.dunagate);
  for (const k of ['mirror', 'zaid', 'letter', 'dunagate']) {
    const t = C4_OBJ[k];
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // 「はなす」で 月の鏡と 影の ヒント
  assert.ok(talkFor(C4_OBJ.mirror, 'self').includes('影') && talkFor(C4_OBJ.mirror, 'self').includes('月の鏡'));
  // Step 4 の さいごの 文（続きはアップデートで！）は 夜の 宮殿の 目標に なおる
  const old = { flags: f().flags, objective: OLD_C4_OBJ.mirror };
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C4_OBJ.mirror));
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C4_OBJ.mirror);
  // 地図の しるし: 地下水路の 入り口・中庭の とびら → 女王 → 南の 門・見張り
  const mark = (obj, map) => questMarks({ flags: f().flags, objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(C4_OBJ.mirror, 'south').some((m) => m.x === P.courtDoor.x && m.y === P.courtDoor.y), '中庭の とびら');
  assert.ok(mark(C4_OBJ.letter, 'south').some((m) => m.x === P.southGate.x && m.y === P.southGate.y), '南の 門');
  assert.ok(mark(C4_OBJ.dunagate, 'south').length, '見張り');
  // 女王の手紙は だいじなもの
  assert.equal(ITEMS.queen_letter.type, 'key');
});

// 王の間の イベントを 夜に 通しで（2つの 戦いは ボスを たおして すすめる）
function boost(world, c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'shamshir', armor: 'sand_mail', shield: 'crescent_shield', head: 'sand_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function waitBattle(bot, world, species, n = 3000) {
  for (let i = 0; i < n; i++) {
    const ctx = [...world.battles.values()][0];
    if (ctx && ctx.battle.enemies.some((e) => e.species === species)) return ctx;
    bot.flushQueue();
    await tickN(world, 1);
  }
  return null;
}
async function nightSetup(seed) {
  const clock = { now: at(hour(23, 30)) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO('c4_mirror')) c.flags[f] = true;
  c.keyItems.push('moon_mirror');
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(world, c, 35);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  world.placeSession(bot.s, 'south', P.courtDoor.x + 0.5, P.courtDoor.y + 1.5, 'up', true);
  await bot.settle();
  return { world, bot, c, clock };
}

test('夜の 王の間: 月の鏡で とびらを てらす → 大臣ザイード → 月の光 → 砂の魔神ザイード → 女王の手紙。中庭の とびらが 開き、南の 砂嵐の 切れ目も 開く', { timeout: 120000 }, async () => {
  const { world, bot, c } = await nightSetup(5101);
  assert.ok(isNightFor(world, bot.s), '夜');
  assert.equal(c.objective, C4_OBJ.mirror);
  bot.keepResult = false;
  bot.send({ t: 'interact', kind: 'tile', x: P.courtDoor.x, y: P.courtDoor.y });
  const ctx1 = await waitBattle(bot, world, 'zaid_minister');
  assert.ok(ctx1, '大臣ザイードとの 戦い');
  const b1 = ctx1.battle;
  assert.equal(b1.snapshot().bg, 'palace_night');
  assert.deepEqual(b1.snapshot().mirror, { cd: 0, max: 3 });
  assert.equal(b1.enemies.filter((e) => e.shade).length, 1);
  assert.ok(said(bot, 'まやかしのカギがとけた'));
  // MPを 0に して（月の光で 3わり もどる）、本物を たおす
  const me = b1.allies[0];
  me.mp = 0;
  const real = b1.enemies.find((e) => e.shade);
  b1.damage(me, real, real.hp, evOf(me), { element: 'phys' });
  b1.checkEnd();
  const ctx2 = await waitBattle(bot, world, 'zaid_demon');
  assert.ok(ctx2, '砂の魔神ザイードとの 戦い');
  assert.ok(said(bot, 'MPも、少しだけ回復した'));
  const st = computeStats(c);
  const a2 = ctx2.battle.allies[0];
  assert.equal(a2.hp, st.maxHp, 'HPは ぜんぶ');
  assert.equal(a2.mp, Math.round(st.maxMp * 0.3), 'MPは 3わり');
  assert.ok(ownsItem(c, 'mirage_ring'), '大臣の 指輪');
  const demon = ctx2.battle.enemies[0];
  ctx2.battle.damage(ctx2.battle.allies[0], demon, demon.hp, evOf(ctx2.battle.allies[0]), { element: 'ice' });
  ctx2.battle.checkEnd();
  for (let i = 0; i < 8; i++) await bot.settle();
  assert.ok(c.flags.c4_zaid && c.flags.c4_letter);
  assert.ok(c.keyItems.includes('queen_letter'), '女王の手紙');
  assert.ok(ownsItem(c, 'majin_lamp'), '魔神のランプ');
  assert.equal(c.objective, C4_OBJ.letter);
  for (const f of CH4_STEPS.slice(0, CH4_STEPS.indexOf('c4_letter') + 1)) assert.ok(c.flags[f], f);
  assert.ok(!c.flags.c4_duna, 'ドゥナは まだ（Step 6）');
  assert.ok(said(bot, 'みこのミラ') && said(bot, '砂の港ドゥナ'), '女王の 本当の 話');
  // 中庭の とびらの カギが あく・夜の 王の間に 女王
  const has = (f) => !!c.flags[f];
  const m = MAPS.south;
  assert.equal(effectiveTile(m, P.courtDoor.x, P.courtDoor.y, has), T.DOOR);
  assert.ok(!isBlocked(m, P.courtDoor.x, P.courtDoor.y, has));
  assert.ok(m.npcById.nefi_night.show.all.includes(ZAID_FLAG));
  // 女王に 話すと（手紙の あと）南の 港への 道
  world.placeSession(bot.s, 'south', P.throne.x + 0.5, P.throne.y + 1.5, 'up', true);
  await bot.settle();
  const from = bot.msgs.length;
  await bot.talk('nefi_night');
  assert.ok(said(bot, '南の砂嵐の切れ目', from));
});

test('南の 砂嵐: 大臣ザイードを たおすまで 通れない（道の ところ）。たおすと 切れ目が 開いて、南の 門から ドゥナへの 谷まで 歩ける', () => {
  const m = MAPS.south;
  const flagsUpTo = (f) => new Set(UPTO(f));
  const reach = (flags, start) => {
    const has = (f) => flags.has(f);
    const seen = new Set([start.join()]);
    const q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(`${nx},${ny}`) || isBlocked(m, nx, ny, has)) continue;
        seen.add(`${nx},${ny}`);
        q.push([nx, ny]);
      }
    }
    return (x, y) => seen.has(`${x},${y}`);
  };
  const start = [P.southGate.x, P.southGate.y];
  const before = reach(flagsUpTo('c4_mirror'), start);
  const after = reach(flagsUpTo('c4_letter'), start);
  // 南の 砂嵐（2だん。道の ところは c4_zaid、ほかは モルガナまで）
  for (let x = SOUTH_STORM_GAP_X[0]; x <= SOUTH_STORM_GAP_X[1]; x++) {
    const g = m.gates.find((q) => q.x === x && q.y === SOUTH_STORM_Y[0]);
    assert.ok(g && g.flag === SOUTH_STORM_FLAG && g.closed === T.SANDSTORM, `切れ目 ${x}`);
  }
  assert.ok(m.gates.some((q) => q.y === SOUTH_STORM_Y[0] && q.flag === 'c4_morgana'), 'ほかは モルガナまで');
  assert.ok(!before(DUNA_GATE.x, DUNA_GATE.y - 1), 'ザイードの 前は 南の 谷へ 行けない');
  assert.ok(after(DUNA_GATE.x, DUNA_GATE.y - 1), 'ザイードの あと: ドゥナの 門の 前');
  assert.ok(!after(DUNA_GATE.x, DUNA_GATE.y + 1), '門の 先（ドゥナ）は Step 6');
  assert.equal(m.tiles[DUNA_GATE.y * m.w + DUNA_GATE.x], T.LOCKED_DOOR);
  // 見張り・ゾーン・地名
  for (const l of DUNA_LOOKOUTS) assert.ok(m.npcById[l.id] && after(l.x, l.y), l.id);
  assert.equal(m.zoneAt(DUNA_VALLEY.x + 2, DUNA_VALLEY.y + 1), 'safe:duna');
  assert.equal(m.zoneAt(P.southGate.x, SOUTH_STORM_Y[1] + 4), 's_sdesert');
  assert.equal(m.areaName(P.southGate.x, SOUTH_STORM_Y[1] + 4), '南の砂ばく');
  assert.equal(m.areaName(DUNA_GATE.x, DUNA_GATE.y - 1), DUNA_VALLEY.name);
  // 南の 門の 門番
  assert.ok(m.npcById.c4_s_sgate);
  // ふつうの 場所から 南の 門へ（地上を 歩いて）
  const arrive = reach(flagsUpTo('c4_letter'), [Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)]);
  assert.ok(arrive(P.southGate.x, P.southGate.y), '北の 海辺から 南の 門まで');
});

test('竜で とべる 所: 大臣ザイードの 前は 北の海辺だけ。あとは 王都・ドゥナの 近くまで（東の はしは モルガナまで 砂嵐）', () => {
  const has = (...fs) => (f) => fs.includes(f);
  const pre = skyBox('south', has('c4_start', 'c4_mirror'));
  assert.equal(pre.x, SOUTH_LANDING.x);
  assert.ok(!inSkyBox(pre, P.southGate.x, P.southGate.y + 3), '王都の 南は まだ だめ');
  const post = skyBox('south', has('c4_start', 'c4_zaid'));
  assert.deepEqual([post.x, post.y, post.w, post.h], [SOUTH_SKY_ZAID.x, SOUTH_SKY_ZAID.y, SOUTH_SKY_ZAID.w, SOUTH_SKY_ZAID.h]);
  assert.ok(inSkyBox(post, P.southGate.x, P.southGate.y + 3), '王都の 南');
  assert.ok(inSkyBox(post, DUNA_GATE.x, DUNA_GATE.y - 2), 'ドゥナの 谷の 近く');
  assert.ok(inSkyBox(post, SOUTH_ARRIVE.x, SOUTH_ARRIVE.y), '北の海辺も');
  assert.ok(!inSkyBox(post, DUNA_GATE.x, DUNA_GATE.y + 2), 'ドゥナ（門の 先）には おりられない');
  assert.equal(skyBox('south', has('c4_start', 'c4_zaid', 'c4_morgana')), null, 'モルガナの あとは どこでも');
});

// Step 6 で かわった: 手紙を 見せると、見張りが かしらに 知らせて 門が 開く（c4_duna_gate → c4_duna。くわしくは test/ch4-duna.test.js）
test('砂の港ドゥナへの 谷の 見張り: 手紙を 見せると かしらに 知らせて、門を 開ける（c4_duna_gate・c4_duna）', () => {
  const ctx = (flags) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0 });
  const base = Object.fromEntries(UPTO('c4_mirror').map((f) => [f, true]));
  const no = SCRIPTS.c4_d_lookout(ctx(base));
  assert.ok(stepsOf(no).includes('一歩も通さねえ') && !no.some((s) => s[0] === 'flag'));
  const letter = SCRIPTS.c4_d_lookout(ctx({ ...base, c4_zaid: true, c4_letter: true }));
  assert.ok(letter.some((s) => s[0] === 'flag' && s[1] === 'c4_duna_gate'));
  assert.ok(letter.some((s) => s[0] === 'flag' && s[1] === 'c4_duna'), '門が 開く');
  assert.ok(letter.some((s) => s[0] === 'objective' && s[1] === C4_OBJ.duna));
  assert.ok(!stepsOf(letter).includes('第4章の続きは、アップデートで！'));
  // Step 5 の 版で 門を ことわられた 人は、もう一度 話しかけると 開く
  const again = SCRIPTS.c4_d_lookout(ctx({ ...base, c4_zaid: true, c4_letter: true, c4_duna_gate: true }));
  assert.ok(again.some((s) => s[0] === 'flag' && s[1] === 'c4_duna'));
  const after = SCRIPTS.c4_d_lookout(ctx({ ...base, c4_zaid: true, c4_letter: true, c4_duna_gate: true, c4_duna: true }));
  assert.ok(!after.some((s) => s[0] === 'flag'));
  // さくと 門を しらべる
  assert.ok(stepsOf(SCRIPTS.c4_duna_fence({})).includes('カギがかかっている'));
  // 町の 人の ことばが かわる（ザイードの あと）
  for (const id of ['c4_s_gate', 'c4_p_guard', 'c4_p_maid', 'c4_s_rug', 'c4_s_apprentice', 'c4_s_oldman', 'c4_s_sgate']) {
    const a = stepsOf(SCRIPTS[id](ctx(base))), b = stepsOf(SCRIPTS[id](ctx({ ...base, c4_zaid: true, c4_letter: true })));
    assert.notEqual(a, b, id);
  }
});

test('家族で: 夜は リーダーの 時計。手伝いの 人が とびらを しらべても、リーダーの 物語で ザイードの イベントが すすむ', { timeout: 120000 }, async () => {
  const clock = { now: at(hour(9)) };
  const world = new GameWorld({ offline: false, rng: makeRng(5110), checkPassword: (pw) => pw === 'ほし', rateLimit: false, now: () => clock.now });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of UPTO('c4_mirror')) Pa.char.flags[f] = true;
  Pa.char.keyItems.push('moon_mirror');
  Pa.char.objective = C4_OBJ.mirror;
  boost(world, Pa.char, 35);
  boost(world, Y.char, 35);
  // パパは 宿屋で 夜まで 休んだ（23時半）。ユイの 時計は 朝の 9時の まま
  Pa.char.timeShift = Math.round((hour(23, 30) - hour(9)) * DAY_MS);
  Y.char.timeShift = 0;
  const yuiBefore = JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective, keyItems: Y.char.keyItems });
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  assert.ok(isNightFor(world, Y), 'ユイも リーダーの 時計（夜）');
  world.placeSession(Pa, 'south', P.courtDoor.x - 0.5, P.courtDoor.y + 1.5, 'up', true);
  world.placeSession(Y, 'south', P.courtDoor.x + 0.5, P.courtDoor.y + 1.5, 'up', true);
  await papa.settle();
  await yui.settle();
  yui.send({ t: 'interact', kind: 'tile', x: P.courtDoor.x, y: P.courtDoor.y });
  const pump = async (species) => {
    for (let i = 0; i < 3000; i++) {
      const ctx = [...world.battles.values()][0];
      if (ctx && ctx.battle.enemies.some((e) => e.species === species)) return ctx;
      papa.flushQueue();
      yui.flushQueue();
      await tickN(world, 1);
    }
    return null;
  };
  const ctx1 = await pump('zaid_minister');
  assert.ok(ctx1, 'ふたりで ザイードと 戦う');
  assert.ok(ctx1.battle.allies.length >= 2);
  const real = ctx1.battle.enemies.find((e) => e.shade);
  ctx1.battle.damage(ctx1.battle.allies[0], real, real.hp, evOf(ctx1.battle.allies[0]), { element: 'phys' });
  ctx1.battle.checkEnd();
  const ctx2 = await pump('zaid_demon');
  assert.ok(ctx2, '砂の魔神ザイード');
  const demon = ctx2.battle.enemies[0];
  ctx2.battle.damage(ctx2.battle.allies[0], demon, demon.hp, evOf(ctx2.battle.allies[0]), { element: 'ice' });
  ctx2.battle.checkEnd();
  for (let i = 0; i < 8; i++) {
    await papa.settle();
    await yui.settle();
  }
  assert.ok(Pa.char.flags.c4_zaid && Pa.char.flags.c4_letter, 'パパの 物語が すすむ');
  assert.ok(Pa.char.keyItems.includes('queen_letter'), '手紙は リーダー（物語の もちぬし）');
  assert.equal(Pa.char.objective, C4_OBJ.letter);
  assert.equal(JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective, keyItems: Y.char.keyItems }), yuiBefore, 'ユイの 物語は そのまま');
  assert.ok(said(yui, 'まやかしのカギがとけた'), 'ユイも 見ている');
});

// ───────────── 南の砂ばくの 魔物 ─────────────
test('南の砂ばくの 魔物: サンドワーム・砂嵐の精（昼）・やみサソリ（夜）。Lv34〜36。出現表・背景・落とす物・図鑑・宝箱', () => {
  const NEW = ['sand_worm', 'sandstorm_spirit', 'dark_scorpion'];
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.ok(m && m.lv >= 34 && m.lv <= 36, id);
    assert.ok(m.desc && m.desc.length > 20, `${id}: 図鑑`);
    const drops = monsterDrops(id);
    assert.ok(drops.some((d) => d.kind === 'common') && drops.some((d) => d.kind === 'rare'), `${id}: 落とす物`);
  }
  assert.ok(MONSTERS.dark_scorpion.night, 'やみサソリは 夜');
  assert.ok(MONSTERS.sandstorm_spirit.flying);
  // サンドワームの 砂に もぐる: かんたんな 形（前ぶれ → つぎの 番に 飛び出し）。ねらえなく なるのは Step 6
  assert.deepEqual(ABILITIES.m_worm_dive.effect, { type: 'telegraph', next: 'm_worm_burst' });
  assert.ok(ABILITIES.m_worm_dive.cast.includes('もり上がって'));
  assert.ok(MONSTERS.sand_worm.resist.bolt > 1, 'サンドワームは 雷');
  for (const t of ['s_sdesert', 's_sdesert_night']) {
    const tab = ENCOUNTER_TABLES[t];
    assert.ok(tab?.length >= 4, t);
    for (const e of tab) for (const [sp, mn, mx] of e.group) assert.ok(MONSTERS[sp] && mn <= mx, `${t}: ${sp}`);
    assert.ok(ZONE_BG[t], `${t}: 背景`);
    const lvs = tab.flatMap((e) => e.group.map(([sp]) => MONSTERS[sp].lv));
    assert.ok(Math.max(...lvs) <= 36 && Math.min(...lvs) >= 30, t);
  }
  assert.equal(NIGHT_ZONES_CH4.s_sdesert, 's_sdesert_night');
  assert.ok(ENCOUNTER_TABLES.s_sdesert.some((e) => e.group.some(([sp]) => sp === 'sand_worm')));
  assert.ok(ENCOUNTER_TABLES.s_sdesert_night.some((e) => e.group.some(([sp]) => sp === 'dark_scorpion')));
  assert.ok(!ENCOUNTER_TABLES.s_sdesert.some((e) => e.group.some(([sp]) => MONSTERS[sp].night)), '昼の 表に 夜の 魔物は いない');
  assert.ok(MAPS.south.spawnCounts.s_sdesert > 0, 'フィールドに 出る');
  assert.ok(fieldChestLootTable('s_sdesert'), '宝箱の 中み');
});

// ───────────── 絵・音・がめん（ブラウザ なしで しらべられる ところ）─────────────
function withFakeDocument(fn) {
  const calls = { arc: 0, fillRect: 0 };
  const canvas = () => ({
    width: 0, height: 0,
    getContext: () => ({
      imageSmoothingEnabled: true, fillStyle: '',
      fillRect() { calls.fillRect++; }, beginPath() {}, fill() {}, ellipse() {}, arc() { calls.arc++; },
      createRadialGradient: () => ({ addColorStop() {} }),
    }),
  });
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => canvas() };
  try { return fn(calls); } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
}

test('絵: 大臣ザイードは 3人 ならんでも ちぢまない。砂の魔神ザイードは 大きく、がめんに はいる。王の間の 夜の 背景・ザイードの きょく', async () => {
  const { MONSTER_ART } = await import('../public/js/client/render/monsters.js');
  const { battleBgSpec, battleBackground } = await import('../public/js/client/render/battlefx.js');
  const { _TRACKS } = await import('../public/js/client/audio.js');
  const { paintSpecial, npcOpts } = await import('../public/js/client/render/chars.js');
  const [mw, mh] = MONSTER_ART.zaid_minister.size;
  assert.ok(3 * (mw + 2 + 6) <= 256 - 12, `3人 ならぶ ${mw}`);
  assert.ok(mh >= 80 && mh + 2 <= 124, `大臣の たかさ ${mh}`);
  const [dw, dh] = MONSTER_ART.zaid_demon.size;
  assert.ok(dw <= 140 && dh + 2 <= 124 && dw * dh > mw * mh * 2, `魔神 ${dw}×${dh}`);
  for (const id of ['sand_worm', 'sandstorm_spirit', 'dark_scorpion']) assert.ok(MONSTER_ART[id], id);
  // 背景: 夜の 王の間（高い まどの 月・ランプ）
  assert.equal(battleBgSpec('palace_night').deco, 'palace');
  withFakeDocument((calls) => {
    const c = battleBackground('palace_night');
    assert.ok(c && calls.fillRect > 300 && calls.arc >= 4, 'かいた');
  });
  // きょく: ザイードの ボス戦（ふつうの ボスの きょくとは ちがう）
  assert.ok(_TRACKS.sand_demon);
  assert.notEqual(_TRACKS.sand_demon.ch[0].n, _TRACKS.boss.ch[0].n);
  // フィールド: 大臣の 影（シルエット）と 真の すがた（いろ つき）は おなじ 大きさで ちがう え。砂の海賊の 見張り
  const sh = paintSpecial('zaid_demon', 'down', 0), tr = paintSpecial('zaid_demon_true', 'down', 0);
  assert.ok(sh && tr && tr.w === sh.w && tr.h === sh.h);
  assert.notEqual(tr.px.join(), sh.px.join());
  for (const id of ['sand_pirate', 'sand_pirate2']) assert.equal(npcOpts(id)?.hat, 'bandana', id);
});

test('がめん: 「道具」に 月の鏡（光が もどるまで えらべない）と、そうびしている 魔神のランプ（1回）', async () => {
  const { ch4ItemEntries, ch4ItemPick, ch4ItemInfo, CH4_ALLY_FX } = await import('../public/js/client/battle-ch4.js');
  const sent = [];
  const scene = { mirror: { cd: 2, max: 3 }, send: (m) => sent.push(m) };
  const items = ch4ItemEntries(scene, { acc: 'majin_lamp', accUsed: false });
  assert.deepEqual(items.map((i) => [i.value, !!i.disabled]), [['moon_mirror', true], ['majin_lamp', false]]);
  assert.equal(items[0].right, 'あと2');
  scene.mirror.cd = 0;
  assert.ok(!ch4ItemEntries(scene, null)[0].disabled);
  assert.deepEqual(ch4ItemEntries({ mirror: null }, { acc: 'majin_lamp', accUsed: true }).map((i) => [i.value, i.disabled]), [['majin_lamp', true]]);
  assert.deepEqual(ch4ItemEntries({ mirror: null }, { acc: 'mirage_ring' }), [], 'ふつうの アクセサリーは 出ない');
  assert.ok(ch4ItemPick(scene, 'moon_mirror'));
  assert.ok(!ch4ItemPick(scene, 'herb'), 'ふつうの 道具は いつもの えらびかた');
  assert.deepEqual(sent, [{ type: 'item', id: 'moon_mirror' }]);
  assert.ok(ch4ItemInfo('moon_mirror').includes('まぼろしの分身'));
  assert.equal(CH4_ALLY_FX.sand_vortex, 'quake');
});
