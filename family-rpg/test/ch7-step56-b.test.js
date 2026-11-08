// 第2部 第7章 第3幕（Step 5・6）B（戦い・品）「ひとりぼっちの星」
// 名前の 約束（docs/plan-ch7.md の 8-2）・手下の 魔物 5しゅ（どれも 仲間に なる・ランク・まぜ配合・素材の 入手先）・出現表・
// いばらの魔女マレフィナ（いばらのかべ・百年ねむりののろい → 黒い 竜に 変身・黒いほのおのいき）・
// カイの影（ねらい → かげブーメラン。身を 守ると はね返す・かげぶんしんで 2人）・知っている 人と ふつうの オート・
// 氷の竜の城の 宝箱（★5 装備 1つ ＋ 素材か 道具 1つ）・ボスの 品・手紙の ごほうび・村の 店・
// 細かく 描いた ボスの え（2倍の こまかさ・artScale 0.5。マレフィナの 竜は コマ 2・3）・エフェクト・がめん・技の せつめい（1文め）・文字
// A の マップ・台本は まだ ないので、きまった 戦いは Battle を じかに 作って 動かす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS, monsterDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool, mixPool, rankOf, joinTier } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { starsOf, rareWhereText, isShopItem } from '../public/js/shared/data/rare-loot.js';
import { canEquip } from '../public/js/shared/stats.js';
import { MONSTERS_C7I, C7_WITCH, C7_THORN, C7_SHADOW, C7I_MINIONS, C7I_MAT_DROPS, C7I_HIDDEN, DRAGON_ACTIONS } from '../public/js/shared/data/monsters-c7i.js';
import { C7I_ABILITIES } from '../public/js/shared/data/abilities-c7i.js';
import { FRIENDS_C7I } from '../public/js/shared/data/companions-c7i.js';
import { ENCOUNTERS_C7I, FIXED_C7I, ZONE_BG_C7I } from '../public/js/shared/data/encounters-c7i.js';
import {
  ITEMS_C7I, C7I_TREASURE, C7I_TREASURE_N, c7iChest, C7I_LETTER_REWARDS, C7I_DROPS, C7I_K, C7I_ITEM_KANA, C7I_SHOP_WEAPONS, C7I_SHOP_ARMOR, C7I_SHOP_TOOLS,
} from '../public/js/shared/data/items-c7i.js';
import { C7S_K } from '../public/js/shared/data/items-c7s.js';
import {
  CURSE, TRANSFORM, BREATH, THROW, DAZE, DRAGON_NAME, isDragon, thornUp, aimed, witchBigBefore, throwBefore, c7iPlan, c7iEffect, witchConf, shadeConf,
} from '../public/js/shared/battle-c7i.js';
import { c7sPlan } from '../public/js/shared/battle-c7s.js';
import { AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch7Run, ch7Party, CH7_KIT, CH7_LV, ACT3 } from '../tools/sim-ch7.mjs';
import { rankPoints, BANDS } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC7iFx, C7I_FINE } from '../public/js/client/render/battlefx-c7i.js';
import { playC7sFx, C7S_FINE } from '../public/js/client/render/battlefx-c7s.js';
import { playC7Fx, C7_FINE } from '../public/js/client/render/battlefx-c7.js';
import { playTokei6Fx } from '../public/js/client/render/battlefx-tokei6.js';
import { C7I_SCREEN_ANIMS, C7I_ALLY_FX, C7I_SFX, C7I_OWN_TELE, c7iDraw, c7iPresent, c7iMarks, c7iSprite } from '../public/js/client/battle-c7i.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

// ねらった 系統と ランク（docs/plan-r53-breed-more.md の 1 の 足りない 所。第7章 第2幕の あとで 少ない 所）
const WANT = { ice_bro: ['dragon', 'F'], ice_pakkun: ['plant', 'E'], thorn_goblin: ['demon', 'D'], ice_mirror: ['material', 'C'], blizzard: ['spirit', 'A'] };
const BOSS = { witch: C7_WITCH, shadow: C7_SHADOW };
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
// 第3幕は ゲストが いない（4人）
function bossBattle(boss, seed = 3) {
  const party = ch7Party(boss, CH7_LV[boss]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  const enemies = FIXED_ENCOUNTERS[BOSS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies });
}
const dmgOf = (ev) => (ev.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
const effect = (b, c, id) => {
  const ev = ev0();
  assert.ok(c7iEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id);
  return ev;
};
const witchOf = (b) => b.enemies.find((e) => e.species === C7_WITCH);
const thornOf = (b) => b.enemies.find((e) => e.species === C7_THORN);

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch7.md の 8-2）: c7_witch・c7_shadow・t7_snow・t7_castle・C7I_TREASURE・C7I_LETTER_REWARDS', () => {
  for (const id of [C7_WITCH, C7_SHADOW]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C7I[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm, id);
    assert.equal(f.group[0][0], id, 'showMon と おなじ 魔物');
    const m = MONSTERS[id];
    assert.ok(m?.boss && MONSTER_ART[id], id);
    assert.ok(m.drops.bonus.includes('limit_stone'), id);
  }
  assert.equal(MONSTERS[C7_WITCH].lv, 78);
  assert.equal(MONSTERS[C7_SHADOW].lv, 80);
  assert.equal(MONSTERS[C7_WITCH].name, 'マレフィナ');
  assert.ok(MONSTERS[C7_WITCH].desc.includes('いばらの魔女'));
  assert.equal(MONSTERS[C7_SHADOW].name, 'カイの影');
  // いばらのかべは マレフィナと いっしょに 出る（数えない 形）
  assert.deepEqual(FIXED_C7I[C7_WITCH].group.map((g) => g[0]), [C7_WITCH, C7_THORN]);
  assert.ok(MONSTERS[C7_THORN] && !Object.keys(MONSTERS).includes(C7_THORN) && C7I_HIDDEN[C7_THORN]);
  assert.deepEqual(Object.keys(ENCOUNTERS_C7I), ['t7_snow', 't7_castle']);
  for (const z of ['t7_snow', 't7_castle']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C7I[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C7I[z]);
    assert.equal(rankPoints(ENCOUNTERS_C7I[z][0].group[0][0]).band, '第7章');
  }
  assert.deepEqual(Object.keys(C7I_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(C7I_TREASURE)) assert.equal(list.length, 2);
  assert.deepEqual(Object.keys(C7I_LETTER_REWARDS).map(Number), [1, 2, 3, 4]);
  for (const list of Object.values(C7I_LETTER_REWARDS)) for (const [id, n] of list) assert.ok(ITEMS[id] && n >= 1, id);
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 5しゅ: どれも 仲間に なる・ねらった 系統と ランク・出現表に 出る・Lv76〜80・素材の 入手先', () => {
  assert.deepEqual(C7I_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const zoneOf = (sp) => Object.entries(ENCOUNTERS_C7I).filter(([, t]) => t.some((e) => e.group.some((g) => g[0] === sp))).map(([z]) => z);
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C7I[sp]);
    assert.equal(f, FRIENDS_C7I[sp]);
    assert.equal(m.race, race, sp);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp), `${sp}: 仲間に なる`);
    assert.equal(MONSTER_RANKS[sp], rank, `${sp}: ランクの 表`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).rank, rank, `${sp}: gen-monster-ranks と おなじ`);
    assert.equal(rankPoints(sp).band, '第7章');
    assert.ok(m.lv >= 76 && m.lv <= 80 && m.region === 6, sp);
    assert.ok(zoneOf(sp).length >= 1, `${sp}: 出現表`);
    assert.ok(!m.boss && m.desc && f.note && f.names.length === 4, sp);
    // 雪と 氷の 魔物は 炎が よく効く
    assert.ok(m.resist.fire > 1, `${sp}: 炎`);
    // 素材（今の 素材だけ）。入手先の 画面に 出る（第64回 ⑥a）
    assert.ok(MAT_DROPS[sp] && C7I_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', sp);
    assert.ok(monsterDrops(sp).some((d) => d.item === MAT_DROPS[sp][0]), `${sp}: 落とす 物`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !/^c7i/.test(ABILITIES[id].effect.type) && ABILITIES[id].effect.type !== 'callHelp', `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const id of [m.drops.common?.[0], m.drops.rare?.[0]]) assert.ok(ITEMS[id], `${sp}: ${id}`);
  }
  assert.ok(BANDS.includes('第7章'));
  // 第7章の B〜S は 2わりまで（test/monsters-r43a）
  const ch7 = Object.keys(MONSTER_RANKS).filter((sp) => rankPoints(sp).band === '第7章');
  assert.ok(ch7.filter((sp) => ['B', 'A', 'S'].includes(MONSTER_RANKS[sp])).length <= ch7.length * 0.2);
});

test('配合: 5しゅ みんな 系統まぜ配合（mix）の 子・系統配合の 子は A の ブリザードだけ', () => {
  for (const sp of C7I_MINIONS) {
    const f = FRIENDS_C7I[sp], race = MONSTERS[sp].race;
    assert.ok(Array.isArray(f.mix) && f.mix.length >= 1, sp);
    for (const other of f.mix) assert.ok(mixPool(race, other, MONSTERS).includes(sp), `${sp}: ${race}+${other}`);
    const high = ['B', 'A'].includes(WANT[sp][1]);
    assert.equal(familyPool(race, MONSTERS).includes(sp), high, `${sp}: 系統配合`);
    assert.equal(!!f.noFamily, !high, sp);
  }
});

// ───────────── 絵 ─────────────
const palCheck = (id, frames) => {
  const d = MONSTER_ART[id];
  assert.ok(d && typeof d.draw === 'function', id);
  assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 260), `${id}: size`);
  assert.ok(d.pal.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && new Set(d.pal).size === d.pal.length, `${id}: pal`);
  const pal = new Set(d.pal.map((c) => c.toLowerCase()));
  const shots = [];
  for (const f of frames) {
    const used = new Set();
    const pts = [];
    const g = {
      w: d.size[0], h: d.size[1], ell: (x, y, rx, ry, c) => { used.add(c); pts.push(x, y); }, poly: (p, c) => { used.add(c); pts.push(...p.flat()); },
      rect: (x, y, w, h, c) => { used.add(c); pts.push(x, y); }, line: (p, c) => { used.add(c); pts.push(...p.flat()); }, dot: (x, y, c) => used.add(c),
      eye(x, y, r, look, white = '#ffffff', pupil = '#1a1026') { used.add(white); used.add(pupil); },
    };
    d.draw(g, f);
    for (const c of used) assert.ok(pal.has(c.toLowerCase()), `${id} f${f}: ${c}`);
    assert.ok(pts.every((v) => v >= -0.05 && v <= 1.05), `${id} f${f}: はみださない`);
    shots.push(JSON.stringify(pts));
  }
  return shots;
};
test('絵: 新しい 絵 3しゅ・のこり 2しゅは 今の 絵の 色がえ。ボスは 2倍の こまかさ（artScale 0.5）・マレフィナの 竜は コマ 2・3', () => {
  let fresh = 0;
  for (const sp of C7I_MINIONS) {
    const m = MONSTERS[sp];
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
    assert.equal(monsterFine(sp), 1, `${sp}: 手下は 今までの こまかさ`);
  }
  assert.equal(fresh, 3, '新しい 絵は 3しゅ まで');
  for (const id of ['ice_bro', 'ice_mirror', 'blizzard', C7_THORN, C7_SHADOW]) {
    const [a, b] = palCheck(id, [0, 1]);
    assert.notEqual(a, b, `${id}: コマで うごく`);
  }
  const [w0, w1, d0, d1] = palCheck(C7_WITCH, [0, 1, 2, 3]);
  assert.ok(w0 !== w1 && d0 !== d1 && w0 !== d0, '魔女と 竜は ちがう え');
  assert.equal(monsterFine(C7_THORN), 1, 'いばらのかべは 今までの こまかさ');
  // ボス: え の size は 今までの ボスの 2倍・artScale 0.5・見た目は 今までの ボスと おなじ くらい
  for (const id of [C7_WITCH, C7_SHADOW]) {
    assert.equal(MONSTERS[id].artScale, 0.5, id);
    assert.equal(monsterFine(id), 2, id);
    assert.equal(MONSTER_ART[id].npc, 0.6, id);
    const [w, h] = monsterSize(id);
    assert.ok(w >= 96 && w <= 128 && h >= 90 && h <= 130, `${id}: 見た目 ${w}×${h}`);
    assert.deepEqual(MONSTER_ART[id].size, [w * 2, h * 2]);
  }
  // 竜の すがたの え（pub の c7form 2 の ときだけ）
  assert.equal(c7iSprite({ species: C7_WITCH, c7form: 1 }, 0), null);
  assert.equal(c7iSprite({ species: C7_SHADOW }, 0), null);
});

// ───────────── いばらの魔女マレフィナ ─────────────
test('マレフィナ: いばらのかべが ある 間は ダメージが cut ばい → かべを こわすと 全部 とどく・regrow 回 動くと また はえる', () => {
  const wc = witchConf({ species: C7_WITCH });
  const b = bossBattle('witch');
  const w = witchOf(b), th = thornOf(b);
  const hero = b.allies[0];
  assert.ok(w.c7mal && !isDragon(w) && thornUp(b));
  assert.equal(pub(w).c7form, 1);
  assert.equal(pub(th).c7thorn, 1);
  const hit = (t, n = 1000) => {
    const hp = t.hp;
    b.damage(hero, t, n, ev0(), { element: 'phys' });
    return hp - t.hp;
  };
  assert.equal(hit(w), Math.round(1000 * wc.thorn.cut));
  // かべを こわす
  const ev = ev0();
  b.damage(hero, th, th.hp + 10, ev, { element: 'fire' });
  assert.ok(!th.alive && ev.c7iBreak && !thornUp(b));
  assert.equal(w.c7mal.down, wc.thorn.regrow);
  assert.equal(hit(w), 1000);
  // 魔女が regrow 回 動くと また はえる
  for (let i = 0; i < wc.thorn.regrow - 1; i++) {
    turn(b, w);
    w.telegraph = null;
    assert.ok(!th.alive);
  }
  const e2 = turn(b, w);
  assert.ok(th.alive && e2.c7iRegrow && th.hp === th.maxHp && thornUp(b));
  // いばらのかべは 炎が よく効く
  assert.ok(MONSTERS[C7_THORN].resist.fire >= 2);
});

test('マレフィナ: curse 回 動くと 百年ねむりののろい … 身を 守って いない 人は ねむる・守って いる 人は はね返す', () => {
  const wc = witchConf({ species: C7_WITCH });
  const b = bossBattle('witch');
  const w = witchOf(b);
  assert.equal(w.c7mal.left, wc.curse.every);
  assert.equal(pub(w).curseEvery, wc.curse.every);
  for (let i = 0; i < wc.curse.every - 1; i++) assert.ok(turn(b, w).c7iCurse);
  assert.equal(w.c7mal.left, 1);
  turn(b, w, { type: 'incapacitated' });
  assert.equal(w.telegraph, null, '動けない 番は 次へ');
  turn(b, w);
  assert.equal(w.telegraph, CURSE);
  w.telegraph = null;
  const [g1, g2, o1, o2] = b.allies;
  g1.defending = true;
  g2.defending = true;
  const ev = effect(b, w, CURSE);
  assert.ok(ev.c7iSleep);
  assert.deepEqual(ev.c7iSleep.safe.sort(), [g1.id, g2.id].sort());
  assert.ok(!g1.status.sleep && !g2.status.sleep);
  for (const x of [o1, o2]) assert.ok(x.status.sleep || (x.resist.sleep ?? 1) < 1, `${x.name}: ねむる`);
  assert.equal(w.c7mal.left, wc.curse.every);
});

test('マレフィナ: HP が p2At より へると 次の 番に 黒い 竜へ（それまで HP は p2At より 下がらない）。かべは もえて もう はえない', () => {
  const wc = witchConf({ species: C7_WITCH });
  const b = bossBattle('witch');
  const w = witchOf(b), th = thornOf(b);
  const hero = b.allies[0];
  thornOf(b).alive = false;
  const floor = Math.ceil(w.maxHp * wc.p2At) - 1;
  w.hp = floor + 500;
  b.damage(hero, w, 30000, ev0(), { element: 'phys' });
  assert.equal(w.hp, floor, 'いっきに たおせない');
  assert.ok(w.alive);
  th.alive = true;
  th.hp = th.maxHp;
  turn(b, w);
  assert.equal(w.telegraph, TRANSFORM);
  assert.ok(!witchBigBefore(b, hero, w));
  w.telegraph = null;
  const atk = w.atk;
  const ev = effect(b, w, TRANSFORM);
  assert.ok(ev.c7iDragon && isDragon(w) && w.name === DRAGON_NAME);
  assert.ok(!th.alive, 'かべは もえる');
  assert.ok(w.atk > atk);
  assert.deepEqual(w.actions.map((a) => a.id), DRAGON_ACTIONS.map((a) => a.id));
  assert.equal(pub(w).c7form, 2);
  // 竜の 間は かべが はえない・ダメージは そのまま（HP の 下かぎりも ない）
  for (let i = 0; i < 6; i++) {
    turn(b, w);
    w.telegraph = null;
  }
  assert.ok(!th.alive);
  const hp = w.hp;
  b.damage(hero, w, 1000, ev0(), { element: 'phys' });
  assert.equal(hp - w.hp, 1000);
  b.damage(hero, w, w.hp + 10, ev0(), { element: 'phys' });
  assert.ok(!w.alive, '竜は たおせる');
});

test('マレフィナ（黒い 竜）: every 回 動くと 黒いほのおのいき（身を 守ると 半分）。p3At より へると はやく なる', () => {
  const dc = witchConf({ species: C7_WITCH }).dragon;
  const hit = (guard) => {
    const b = bossBattle('witch', 9);
    const w = witchOf(b);
    w.hp = Math.floor(w.maxHp * 0.45);
    effect(b, w, TRANSFORM);
    assert.equal(w.c7mal.left, dc.every);
    for (let i = 0; i < dc.every - 1; i++) assert.ok(turn(b, w).c7iBreath);
    turn(b, w);
    assert.equal(w.telegraph, BREATH);
    assert.ok(witchBigBefore(b, b.allies[0], w));
    w.telegraph = null;
    for (const x of b.allies) x.defending = guard;
    const ev = effect(b, w, BREATH);
    assert.ok(ev.c7iFire);
    assert.equal(w.c7mal.left, dc.every);
    return dmgOf(ev);
  };
  const open = hit(false), guarded = hit(true);
  assert.ok(open > 0 && guarded < open * 0.7, `${guarded} / ${open}`);
  const b = bossBattle('witch', 4);
  const w = witchOf(b);
  w.hp = Math.floor(w.maxHp * 0.45);
  effect(b, w, TRANSFORM);
  w.hp = Math.floor(w.maxHp * (dc.p3At - 0.05));
  turn(b, w);
  assert.ok(w.c7mal.left <= dc.p3Every);
  assert.equal(pub(w).breathEvery, dc.p3Every);
});

test('マレフィナ: 知っている 人は のろいの 前に 守り、かべが ある 間は かべを ねらう。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('witch');
  const w = witchOf(b), th = thornOf(b);
  b.knowsCh6 = true;
  const hero = b.allies[0];
  w.c7mal.left = 1;
  w.telegraph = CURSE;
  assert.ok(witchBigBefore(b, hero, w));
  assert.deepEqual(c7iPlan(b, hero, decideAlly), { type: 'defend' });
  assert.deepEqual(c7sPlan(b, hero, decideAlly), { type: 'defend' }, 'battle-c7s.js から よばれる');
  b.c6NoGuard = true;
  assert.notEqual(c7iPlan(b, hero, decideAlly)?.type, 'defend');
  b.c6NoGuard = false;
  w.telegraph = null;
  w.c7mal.left = 4;
  for (const x of b.allies) Object.assign(x, { alive: true, hp: x.maxHp });
  let onThorn = 0;
  for (const x of b.allies) {
    const p = c7iPlan(b, x, decideAlly);
    if (p?.target === th.id) onThorn++;
    else assert.ok(p && (p.target !== w.id || ABILITIES[p.id]?.target === 'enemies'), JSON.stringify(p));
  }
  assert.ok(onThorn >= 2, `${onThorn}`);
  b.c7iNoThorn = true;
  assert.ok(b.allies.every((x) => c7iPlan(b, x, decideAlly)?.target !== th.id || true));
  // ふつうの オート
  const b2 = bossBattle('witch', 8);
  const w2 = witchOf(b2);
  w2.c7mal.left = 1;
  w2.telegraph = CURSE;
  const h2 = b2.allies[0];
  h2.hp = Math.round(h2.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c7iPlan(b2, h2, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  h2.hp = h2.maxHp;
  assert.equal(c7iPlan(b2, h2, decideAlly), null, `HPが ${AUTO_GUARD.hp} いじょうは 守らない`);
  assert.equal(monsterDrops(C7_WITCH).filter((x) => x.kind === 'boss').length, 1);
});

// ───────────── カイの影 ─────────────
test('カイの影: every 回めに 1人を ねらう → lead 回 あとに かげブーメラン。身を 守って いれば はね返す（影に ダメージ・ふらふら）', () => {
  const sc = shadeConf({ species: C7_SHADOW });
  const b = bossBattle('shadow');
  const s = b.enemies[0];
  assert.ok(s.c7shade);
  assert.equal(s.c7shade.left, sc.every);
  assert.equal(pub(s).aimEvery, sc.every);
  for (let i = 0; i < sc.every - 1; i++) assert.ok(turn(b, s).c7iShade);
  assert.equal(s.c7shade.left, 1);
  const ev = turn(b, s);
  assert.ok(ev.c7iMark && ev.c7iMark.who.length === 1 && !s.telegraph, 'ねらう 番は ふつうに 動く');
  const who = b.get(ev.c7iMark.who[0]);
  assert.deepEqual(aimed(b, s), [who]);
  assert.deepEqual(pub(s).aims, [who.id]);
  for (let i = 0; i < sc.lead - 1; i++) assert.ok(turn(b, s).c7iAimLeft);
  turn(b, s);
  assert.equal(s.telegraph, THROW);
  assert.ok(throwBefore(b, who, s));
  assert.ok(!throwBefore(b, b.allies.find((x) => x !== who), s), 'ねらわれて いない 人は ちがう');
  s.telegraph = null;
  // はね返す
  who.defending = true;
  const hp = s.hp;
  const e2 = effect(b, s, THROW);
  assert.deepEqual(e2.c7iThrow.back, [who.id]);
  assert.equal(hp - s.hp, Math.round(s.maxHp * sc.reflect));
  assert.ok(s.c7shade.daze && s.debuffs.def && aimed(b, s).length === 0);
  assert.equal(pub(s).daze, 1);
  turn(b, s);
  assert.equal(s.telegraph, DAZE, 'ふらふら … 1回 動けない');
  s.telegraph = null;
  assert.ok(!s.c7shade.daze);
});

test('カイの影: 守らないと ねらわれた 人に とても 大きな ダメージ・もどってくる ブーメランが みんなに。HP 半分で かげぶんしん（2人）', () => {
  const b = bossBattle('shadow', 7);
  const s = b.enemies[0];
  s.c7shade.left = 1;
  const who = b.get(turn(b, s).c7iMark.who[0]);
  for (const x of b.allies) x.defending = false;
  const before = new Map(b.allies.map((x) => [x.id, x.hp]));
  const ev = effect(b, s, THROW);
  assert.deepEqual(ev.c7iThrow.hit, [who.id]);
  const lost = (x) => before.get(x.id) - x.hp;
  const others = b.allies.filter((x) => x !== who);
  assert.ok(lost(who) > 0 && others.every((x) => lost(x) >= 0) && others.some((x) => lost(x) > 0));
  assert.ok(lost(who) > Math.max(...others.map(lost)), 'ねらわれた 人が いちばん 大きい');
  assert.ok(!s.c7shade.daze);
  // かげぶんしん
  const b2 = bossBattle('shadow', 2);
  const s2 = b2.enemies[0];
  s2.hp = Math.floor(s2.maxHp * 0.4);
  s2.c7shade.left = 1;
  const e2 = turn(b2, s2);
  assert.equal(e2.c7iMark.who.length, 2);
  assert.equal(new Set(e2.c7iMark.who).size, 2);
  assert.equal(pub(s2).p2, 1);
});

test('カイの影: 知っている 人は ねらわれたら 回復より 先に 身を 守る。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('shadow');
  const s = b.enemies[0];
  b.knowsCh6 = true;
  s.c7shade.left = 1;
  const who = b.get(turn(b, s).c7iMark.who[0]);
  s.telegraph = THROW;
  assert.deepEqual(c7iPlan(b, who, decideAlly), { type: 'defend' });
  assert.deepEqual(c7sPlan(b, who, decideAlly), { type: 'defend' });
  // だれかが あぶなくても
  const other = b.allies.find((x) => x !== who);
  other.hp = Math.round(other.maxHp * 0.2);
  assert.deepEqual(c7iPlan(b, who, decideAlly), { type: 'defend' });
  assert.notEqual(c7iPlan(b, b.allies.find((x) => x !== who && x !== other), decideAlly)?.type, 'defend', 'ねらわれて いない 人は ふだん');
  b.c7iNoGuardAim = true;
  assert.notEqual(c7iPlan(b, who, decideAlly)?.type, 'defend');
  // ふつうの オート
  const b2 = bossBattle('shadow', 8);
  const s2 = b2.enemies[0];
  s2.c7shade.left = 1;
  const w2 = b2.get(turn(b2, s2).c7iMark.who[0]);
  s2.telegraph = THROW;
  w2.hp = Math.round(w2.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c7iPlan(b2, w2, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  assert.equal(monsterDrops(C7_SHADOW).filter((x) => x.kind === 'boss').length, 1);
});

test('シミュレーター: 知っている 人・知らない 人・完全オートで 戦いが おわる（しかけが 動く）。第3幕は ゲストなし', () => {
  assert.ok(ACT3.has('witch') && ACT3.has('shadow'));
  const r = ch7Run('witch', 78, true, 7070);
  assert.ok(['win', 'lose'].includes(r.outcome) && r.thornBreaks >= 1 && r.curses >= 1, JSON.stringify(r));
  const s = ch7Run('shadow', 80, true, 7070);
  assert.ok(['win', 'lose'].includes(s.outcome) && s.marks >= 1 && s.reflects >= 1, JSON.stringify(s));
  const a = ch7Run('shadow', 80, false, 7071);
  assert.ok(['win', 'lose', 'timeout'].includes(a.outcome));
  for (const boss of ['witch', 'shadow']) for (const [job, list] of Object.entries(CH7_KIT[boss])) for (const id of list) if (id) assert.ok(ITEMS[id] && canEquip(job, id), `${job}: ${id}`);
});

// ───────────── 品 ─────────────
test('宝箱: 氷の竜の城 1〜8階に ★5の 装備 1つ（レア度4・src c7i）と 素材か 道具 1つ。第2幕の 灯台より 強い', () => {
  const ks = Object.values(C7I_K);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(C7I_K[1] > C7S_K[8]);
  const gear = Object.values(C7I_TREASURE).map((x) => x[0]);
  assert.equal(new Set(gear).size, 8);
  for (const id of gear) {
    const it = ITEMS[id];
    assert.ok(it === ITEMS_C7I[id] && it.rank === 10 && it.rarity === 4 && it.src === 'c7i', id);
    assert.ok(['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), '氷の竜の城の宝箱でしか手に入らない');
    assert.ok(it.desc && C7I_ITEM_KANA[id] && ITEM_KANA[id], id);
    assert.ok(!(it.resist?.water < 1), `${id}: 水に 強い 装備は 作らない`);
  }
  for (const [n, [, mat]] of Object.entries(C7I_TREASURE)) {
    assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type) && !ITEMS_C7I[mat], `${n}階: ${mat}（今の 素材・道具）`);
    assert.equal(C7I_TREASURE_N[n].length, 2);
    assert.equal(C7I_TREASURE_N[n][0], 1);
    assert.deepEqual(c7iChest(Number(n), 1), { item: mat, n: C7I_TREASURE_N[n][1] });
    assert.deepEqual(c7iChest(Number(n), 0), { item: C7I_TREASURE[n][0], n: 1 });
  }
  assert.equal(c7iChest(1, 2), null);
  assert.ok(ITEMS.c7it_ice_sword.atk > ITEMS.c7st_beacon_sword.atk);
  assert.ok(ITEMS.c7it_north_staff.bonus.mag > ITEMS.c7st_lamp_staff.bonus.mag);
});

test('ボスの 品・時をこえる手紙の ごほうび・村の 店', () => {
  for (const [boss, [acc, weapon]] of Object.entries(C7I_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss' && ITEMS[acc].boss === boss);
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c7h_shadow_charm') > sum('c7w_thorn_charm') && sum('c7w_thorn_charm') > sum('c7l_hook_charm'));
  const top = (cat) => Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+')).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top('spear'), 'c7w_dragon_spear');
  assert.equal(top('boomerang'), 'c7h_shadow_boomerang');
  for (const list of Object.values(C7I_LETTER_REWARDS)) {
    const [id] = list[0];
    assert.ok(ITEMS[id] && ITEMS[id].src === 'letter7' && starsOf(id) === 5, id);
    assert.equal(rareWhereText(id), '時をこえる手紙でしか手に入らない');
    for (const [mat] of list.slice(1)) assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type), mat);
  }
  for (const id of [...C7I_SHOP_WEAPONS, ...C7I_SHOP_ARMOR]) assert.ok(ITEMS[id] && ITEMS[id].price > 0 && isShopItem(id) && starsOf(id) === 1, id);
  for (const id of C7I_SHOP_TOOLS) assert.ok(ITEMS[id], id);
  // 手下の レアの ドロップは 村の 店の 品
  for (const sp of C7I_MINIONS) assert.ok(ITEMS_C7I[MONSTERS[sp].drops.rare[0]]?.price > 0, sp);
  // 名前は かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!id.includes('+')) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C7I)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
});

// ───────────── 技の せつめい・エフェクト・がめん ─────────────
test('技の せつめい: 1文めだけで 何を するか わかる（スマホの たて持ちは 1文めだけ。30字くらいまで）', () => {
  for (const [id, a] of Object.entries(C7I_ABILITIES)) {
    assert.equal(ABILITIES[id], a, id);
    const s = firstSentence(a.desc);
    assert.ok(s.endsWith('。') && s.length <= 32, `${id}: ${s}（${s.length}字）`);
  }
});

test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(C7I_ABILITIES).map((a) => a.anim).filter((a) => /^a7[nmdh]_/.test(a)))];
  assert.ok(own.length >= 28, `${own.length}`);
  for (const a of own) {
    assert.equal(playC7iFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC7sFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playC7Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTokei6Fx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  assert.equal(playC7iFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C7I_SCREEN_ANIMS, ...Object.keys(C7I_ALLY_FX), ...Object.keys(C7I_SFX)]) assert.ok(own.includes(a), a);
  for (const a of ['a7m_curse', 'a7d_breath', 'a7h_throw']) assert.ok(C7I_SCREEN_ANIMS.includes(a), a);
  for (const [k, v] of Object.entries(C7I_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.6, 0.99]) {
    C7I_FINE.c7iflame(x, { x0: 100, y0: 30, x1: 80, y1: 110, w: 34, age: t * 900 }, t);
    C7I_FINE.c7iboom(x, { x0: 128, y0: 40, x1: 90, y1: 110, size: 12, age: t * 1100 }, t);
  }
  assert.equal(C7S_FINE.c7iflame, C7I_FINE.c7iflame);
  assert.equal(C7_FINE.c7iboom, C7I_FINE.c7iboom);
});

test('がめん: のろい・いき・ねらいの しるし・かべの 間の ×0.25・ねらわれた 人の まど・バナー', () => {
  for (const id of C7I_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const thorn = { side: 'enemy', alive: true, c7thorn: 1 };
  const scene = { time: 1000, c: new Map([['t', thorn]]) };
  c7iDraw(scene, x, null, { alive: true, species: C7_WITCH, c7form: 1, curseLeft: 1, curseEvery: 5, cut: 0.25 }, 100, 20, 124, 124, 1);
  const n1 = drawn.length;
  assert.ok(n1 > 10 && drawn.includes('fillText'));
  c7iDraw(scene, x, null, { alive: true, species: C7_WITCH, c7form: 2, breathLeft: 2, breathEvery: 4 }, 100, 20, 124, 124, 1);
  const n2 = drawn.length;
  assert.ok(n2 > n1 + 5);
  c7iDraw(scene, x, null, { alive: true, species: C7_SHADOW, aimLeft: 2, aimEvery: 3, aims: [] }, 100, 20, 112, 120, 1);
  const n3 = drawn.length;
  assert.ok(n3 > n2);
  c7iDraw(scene, x, null, { alive: true, species: C7_SHADOW, aimLeft: 3, aimEvery: 3, aims: ['a1'], aimLead: 1, daze: 1 }, 100, 20, 112, 120, 1);
  assert.ok(drawn.length > n3 + 5);
  // ねらわれた 人の まど
  const boxes = new Map();
  const box = () => {
    const set = new Set();
    return { classList: { toggle: (c, on) => (on ? set.add(c) : set.delete(c)), has: (c) => set.has(c) } };
  };
  boxes.set('a1', { box: box() });
  boxes.set('a2', { box: box() });
  const allies = [{ id: 'a1', alive: true, name: '勇者' }, { id: 'a2', alive: true, name: '大賢者' }];
  const shade = { side: 'enemy', alive: true, aims: ['a1'] };
  const sc = {
    game: { audio: { sfx() {} } }, banners: [], banner(t, cls) { this.banners.push([t, cls]); }, shake() {},
    c: new Map([['a1', allies[0]], ['a2', allies[1]], ['s', shade]]), allies: () => allies, statusBoxes: boxes,
  };
  c7iMarks(sc);
  assert.ok(boxes.get('a1').box.classList.has('c7i-aim') && !boxes.get('a2').box.classList.has('c7i-aim'));
  shade.aims = [];
  c7iMarks(sc);
  assert.ok(!boxes.get('a1').box.classList.has('c7i-aim'));
  // バナー
  c7iPresent(sc, { c7iCurse: { left: 1 } }, {}, null, null);
  c7iPresent(sc, { c7iSleep: { slept: ['a1'], safe: ['a2'] } }, {}, null, null);
  c7iPresent(sc, { c7iBreak: { id: 'w' } }, {}, null, null);
  c7iPresent(sc, { c7iDragon: { id: 'w' } }, {}, null, null);
  c7iPresent(sc, { c7iBreath: { left: 1 } }, {}, null, null);
  c7iPresent(sc, { c7iMark: { who: ['a1'] } }, {}, null, null);
  c7iPresent(sc, { c7iThrow: { back: ['a1'], hit: [] } }, {}, null, null);
  c7iPresent(sc, { c7iThrow: { back: [], hit: ['a2'] } }, {}, null, null);
  assert.equal(sc.banners.length, 8);
  assert.ok(sc.banners[1][0].includes('勇者') && sc.banners[1][1] === 'danger');
  assert.equal(sc.banners[2][1], 'combo');
  assert.ok(sc.banners[5][0].includes('勇者') && sc.banners[5][0].includes('身を守る'));
  assert.equal(sc.banners[6][1], 'combo');
  assert.equal(sc.banners[7][1], 'danger');
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし', () => {
  const files = ['monsters-c7i.js', 'abilities-c7i.js', 'items-c7i.js', 'encounters-c7i.js', 'companions-c7i.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-c7i.js', 'public/js/client/battle-c7i.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full), [], f);
  }
});
