// 第2部 第8章 第3幕（Step 5・6）B（戦い・品）「くろがねの 空中ようさい」
// 名前の 約束（docs/plan-ch8.md の 8-2）・手下の 魔物 5しゅ（どれも 仲間に なる・ランク・まぜ配合・素材の 入手先）・出現表・
// マジカメック（子分に 魔法じん → でっかくなあれ。先に たおすと から回り → ちびカメック。ほうきで はやく なる）・
// 初代大魔王クッパード（ドッスンヒップドロップ → かけらが 光る → ギガクッパード〈かたい・ギガほのお〉。橋のオノを ぶきで たたくと 橋が おちて もとに もどる）・
// 知っている 人と ふつうの オート・ゲストの リオン（rion8）・空中ようさいの 宝箱（★5 装備 1つ ＋ 素材か 道具 1つ）・ボスの 品・手紙の ごほうび・
// 細かく 描いた ボスの え（2倍の こまかさ・artScale 0.5。ほうき・ギガは コマ 2・3）・エフェクト・がめん・背景・曲・技の せつめい（1文め）・文字
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
import { starsOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { WATER_RULE } from '../public/js/shared/data/water.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { canEquip } from '../public/js/shared/stats.js';
import {
  MONSTERS_C8C, C8_KAMEK, C8_BOWSER, C8_AXE, C8C_MINIONS, C8C_MAT_DROPS, KAMEK_KIDS, GIGA_ACTIONS, BOWSER_ACTIONS, GIGA_NAME,
} from '../public/js/shared/data/monsters-c8c.js';
import { C8C_ABILITIES } from '../public/js/shared/data/abilities-c8c.js';
import { FRIENDS_C8C } from '../public/js/shared/data/companions-c8c.js';
import { ENCOUNTERS_C8C, FIXED_C8C, ZONE_BG_C8C } from '../public/js/shared/data/encounters-c8c.js';
import { ITEMS_C8C, C8C_TREASURE, C8C_TREASURE_N, c8cChest, C8C_LETTER_REWARDS, C8C_DROPS, C8C_K, C8C_ITEM_KANA } from '../public/js/shared/data/items-c8c.js';
import { ITEMS_C8R } from '../public/js/shared/data/items-c8r.js';
import { ITEMS_C8B, C8B_K } from '../public/js/shared/data/items-c8b.js';
import {
  GROW, SUMMON, BROOM, FIZZLE, POUND, GIGA, GIGAFIRE, FALLEN,
  kamekConf, bowserConf, kidsAlive, aimedKid, axeOf, growEvery, bowserBigBefore, c8cPlan, c8cEffect,
} from '../public/js/shared/battle-c8c.js';
import { c8bPlan } from '../public/js/shared/battle-c8b.js';
import { c8aPlan } from '../public/js/shared/battle-c8a.js';
import { AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch8Run, ch8Party, CH8_KIT, CH8_LV } from '../tools/sim-ch8.mjs';
import { rankPoints } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC8cFx, C8C_FINE } from '../public/js/client/render/battlefx-c8c.js';
import { playC8bFx, C8B_FINE } from '../public/js/client/render/battlefx-c8b.js';
import { playC7iFx } from '../public/js/client/render/battlefx-c7i.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C8C_SCREEN_ANIMS, C8C_ALLY_FX, C8C_SFX, C8C_OWN_TELE, c8cDraw, c8cPresent, c8cSprite } from '../public/js/client/battle-c8c.js';
import { C8B_OWN_TELE, c8bSprite } from '../public/js/client/battle-c8b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { _TRACKS } from '../public/js/client/audio.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

// ねらった 系統と ランク（docs/plan-r53-breed-more.md の 1。第8章 第2幕の あとで 少ない 所）
const WANT = { mera_bubble: ['spirit', 'F'], tonkachi_bro: ['dragon', 'E'], buriki_koopa: ['dragon', 'D'], dosshiin: ['material', 'C'], dodeka_killer: ['material', 'A'] };
const BOSS = { kamek: C8_KAMEK, bowser: C8_BOWSER };
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
// ゲストの リオンは A の 物語の ゲスト（ここでは 4人。シミュレーターは リオンも）
function bossBattle(boss, seed = 3) {
  const party = ch8Party(boss, CH8_LV[boss]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  const enemies = FIXED_ENCOUNTERS[BOSS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies });
}
const dmgOf = (ev) => (ev.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
const effect = (b, c, id) => {
  const ev = ev0();
  assert.ok(c8cEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id);
  return ev;
};
const hit = (b, c, t, n, element = 'phys', extra = {}) => {
  const ev = { ...ev0(), id: c.id, ...extra };
  b.damage(c, t, n, ev, { element, phys: element === 'phys' });
  return ev;
};
const kamekOfB = (b) => b.enemies.find((e) => e.species === C8_KAMEK);
const bowserOfB = (b) => b.enemies.find((e) => e.species === C8_BOWSER);
const heal = (b) => {
  for (const x of b.allies) Object.assign(x, { alive: true, hp: x.maxHp, defending: false, status: {} });
};
// マジカメックを 魔法じんの ところまで すすめる（ねらわれた 子分を かえす）
const toAim = (b, k) => {
  let ev = null;
  for (let i = 0; i < 6 && !aimedKid(b); i++) ev = turn(b, k);
  return { t: aimedKid(b), ev };
};

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 8-2）: c8_kamek・c8_bowser・t8c_fort・t8c_deep・C8C_TREASURE・C8C_LETTER_REWARDS・GUESTS.rion8', () => {
  for (const id of [C8_KAMEK, C8_BOWSER]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C8C[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm && f.bg, id);
    assert.equal(f.group[0][0], id, 'showMon と おなじ 魔物');
    const m = MONSTERS[id];
    assert.ok(m?.boss && MONSTER_ART[id], id);
    assert.ok(m.drops.bonus.includes('limit_stone'), id);
    assert.ok(_TRACKS[f.bgm], `${id}: 曲 ${f.bgm}`);
    assert.ok(battleBgSpec(f.bg), `${id}: 背景 ${f.bg}`);
  }
  assert.equal(MONSTERS[C8_KAMEK].lv, 88);
  assert.equal(MONSTERS[C8_BOWSER].lv, 90);
  assert.equal(MONSTERS[C8_KAMEK].name, 'マジカメック');
  assert.equal(MONSTERS[C8_BOWSER].name, '初代大魔王クッパード');
  // マジカメックは 子分 2ひきと いっしょ
  assert.deepEqual(FIXED_C8C[C8_KAMEK].group, [[C8_KAMEK, 1, 1], ...KAMEK_KIDS.map((sp) => [sp, 1, 1])]);
  assert.deepEqual(FIXED_C8C[C8_BOWSER].group, [[C8_BOWSER, 1, 1]]);
  // 橋のオノは 図鑑・配合に 出ない（かくれた 魔物）
  assert.ok(MONSTERS[C8_AXE] && !Object.keys(MONSTERS).includes(C8_AXE) && MONSTERS[C8_AXE].noBefriend && MONSTER_ART[C8_AXE]);
  assert.deepEqual(Object.keys(ENCOUNTERS_C8C), ['t8c_fort', 't8c_deep']);
  for (const z of ['t8c_fort', 't8c_deep']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C8C[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C8C[z]);
    assert.ok(battleBgSpec(ZONE_BG[z]), z);
    assert.equal(rankPoints(ENCOUNTERS_C8C[z][0].group[0][0]).band, '第8章');
  }
  // 出現表の 魔物の レベル（1〜4階 Lv86〜88・5〜8階 Lv88〜90 の あたり）
  const lvs = (z) => ENCOUNTERS_C8C[z].flatMap((e) => e.group.map((g) => MONSTERS[g[0]].lv));
  assert.ok(lvs('t8c_fort').every((lv) => lv >= 83 && lv <= 88));
  assert.ok(lvs('t8c_deep').every((lv) => lv >= 85 && lv <= 90) && Math.max(...lvs('t8c_deep')) >= 88);
  assert.deepEqual(Object.keys(C8C_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(C8C_TREASURE)) assert.equal(list.length, 2);
  assert.deepEqual(Object.keys(C8C_LETTER_REWARDS).map(Number), [1, 2, 3]);
  for (const list of Object.values(C8C_LETTER_REWARDS)) for (const [id, n] of list) assert.ok(ITEMS[id] && n >= 1, id);
  // ゲストの リオン（第8章用。kai8 の あと）
  const g = GUESTS.rion8;
  assert.ok(g && g.id === 'guest_rion8' && g.name === 'リオン' && g.minLevel >= 86 && g.minLevel <= 90);
  assert.equal(g.job, GUESTS.rion.job);
  for (const id of Object.values(g.gear)) assert.ok(ITEMS[id] && canEquip(g.job, id), id);
  // 家族の 装備より 強く ない（ボスの 品・第3幕の 宝箱は 持たない）
  for (const id of Object.values(g.gear)) assert.ok(!ITEMS_C8C[id] && !ITEMS_C8R[id] && ITEMS[id].src !== 'pastboss', id);
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 5しゅ: どれも 仲間に なる・ねらった 系統と ランク・出現表に 出る・Lv86〜89・素材の 入手先・名前が かぶらない', () => {
  assert.deepEqual(C8C_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const zoneOf = (sp) => Object.entries(ENCOUNTERS_C8C).filter(([, t]) => t.some((e) => e.group.some((g) => g[0] === sp))).map(([z]) => z);
  const names = new Map();
  for (const m of Object.values(MONSTERS)) names.set(m.name, (names.get(m.name) || 0) + 1);
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C8C[sp]);
    assert.equal(f, FRIENDS_C8C[sp]);
    assert.equal(m.race, race, sp);
    assert.equal(names.get(m.name), 1, `${sp}: 名前 ${m.name}`);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp), `${sp}: 仲間に なる`);
    assert.equal(MONSTER_RANKS[sp], rank, `${sp}: ランクの 表`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).rank, rank, `${sp}: gen-monster-ranks と おなじ`);
    assert.equal(rankPoints(sp).band, '第8章');
    assert.ok(m.lv >= 86 && m.lv <= 89 && m.region === 6, sp);
    assert.ok(zoneOf(sp).length >= 1, `${sp}: 出現表`);
    assert.ok(!m.boss && m.desc && f.note && f.names.length === 4, sp);
    assert.ok(MAT_DROPS[sp] && C8C_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', sp);
    assert.ok(monsterDrops(sp).some((d) => d.item === MAT_DROPS[sp][0]), `${sp}: 落とす 物`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !/^c8c/.test(ABILITIES[id].effect.type) && ABILITIES[id].effect.type !== 'callHelp', `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const id of [m.drops.common?.[0], m.drops.rare?.[0]]) assert.ok(ITEMS[id], `${sp}: ${id}`);
    assert.ok(ITEMS[m.drops.rare[0]].price > 0 && !ITEMS_C8C[m.drops.rare[0]], sp);
  }
  // 水: 石の かたまり（ドッシーン）・からくり（ブリキクッパ・ドデカキラー）・炎の 体（メラバブル）。クッパードは ふつう
  assert.equal(WATER_RULE.dosshiin, 'rock');
  assert.equal(WATER_RULE.buriki_koopa, 'machine');
  assert.equal(WATER_RULE.dodeka_killer, 'machine');
  assert.equal(WATER_RULE.mera_bubble, 'fire');
  assert.equal(MONSTERS[C8_BOWSER].resist.water, 1);
  // 第8章の B〜S は 2わりまで（test/monsters-r43a）。F〜C が そろう
  const ch8 = Object.keys(MONSTER_RANKS).filter((sp) => rankPoints(sp).band === '第8章');
  assert.ok(ch8.length >= 15, `${ch8.length}`);
  assert.ok(ch8.filter((sp) => ['B', 'A', 'S'].includes(MONSTER_RANKS[sp])).length <= Math.max(2, ch8.length * 0.2));
});

test('配合: 5しゅ みんな 系統まぜ配合（mix）の 子・系統配合の 子は A の ドデカキラーだけ', () => {
  for (const sp of C8C_MINIONS) {
    const f = FRIENDS_C8C[sp], race = MONSTERS[sp].race;
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
    const out = pts.filter((v) => !(v >= -0.05 && v <= 1.05));
    assert.ok(!out.length, `${id} f${f}: はみださない ${out.slice(0, 4)}`);
    shots.push(JSON.stringify(pts));
  }
  return shots;
};
test('絵: 新しい 絵 3しゅ・のこり 2しゅは 今の 絵の 色がえ。ボスは 2倍の こまかさ（artScale 0.5）・ほうきと ギガは コマ 2・3', () => {
  let fresh = 0;
  for (const sp of C8C_MINIONS) {
    const m = MONSTERS[sp];
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
    assert.equal(monsterFine(sp), 1, `${sp}: 手下は 今までの こまかさ`);
  }
  assert.equal(fresh, 3, '新しい 絵は 3しゅ まで');
  for (const id of ['tonkachi_bro', 'buriki_koopa', 'dosshiin', C8_AXE]) {
    const [a, b] = palCheck(id, [0, 1]);
    assert.notEqual(a, b, `${id}: コマで うごく`);
  }
  for (const id of [C8_KAMEK, C8_BOWSER]) {
    const [f0, f1, f2, f3] = palCheck(id, [0, 1, 2, 3]);
    assert.ok(f0 !== f1 && f2 !== f3 && f0 !== f2 && f1 !== f3, `${id}: 4コマ ちがう え`);
    assert.equal(MONSTERS[id].artScale, 0.5, id);
    assert.equal(monsterFine(id), 2, id);
    assert.equal(MONSTER_ART[id].npc, 0.6, id);
    const [w, h] = monsterSize(id);
    assert.ok(w >= 96 && w <= 130 && h >= 96 && h <= 130, `${id}: 見た目 ${w}×${h}`);
    assert.deepEqual(MONSTER_ART[id].size, [w * 2, h * 2]);
  }
  // 変身の え（pub の kmForm 2・bwForm 2 の ときだけ。battle-c8b.js の c8bSprite から よばれる）
  assert.equal(c8cSprite({ species: C8_KAMEK, kmForm: 1 }, 0), null);
  assert.equal(c8cSprite({ species: C8_BOWSER, bwForm: 1 }, 0), null);
  assert.equal(c8bSprite({ species: C8_BOWSER, bwForm: 1 }, 0), null);
  // デカ〜の 子分は ブラウザで 大きく した え（ここでは document が ないので null）
  assert.equal(c8cSprite({ species: 'tonkachi_bro', giga: 1 }, 0), null);
});

// ───────────── マジカメック ─────────────
test('マジカメック: 動く たびに しるしが へる → 子分に 魔法じん（前ぶれ）→ でっかくなあれ（デカ〜。HP・攻撃力が 上がり みんなを ふみつける）', () => {
  const b = bossBattle('kamek');
  const k = kamekOfB(b);
  const kc = kamekConf(k);
  assert.ok(k.c8km && kidsAlive(b).length === 2 && kidsAlive(b).every((e) => KAMEK_KIDS.includes(e.species)));
  assert.equal(pub(k).growEvery, kc.grow.every);
  assert.equal(pub(k).kmForm, 1);
  for (const e of kidsAlive(b)) assert.ok(pub(e).aimed === 0 && pub(e).giga === 0, '0 で おくる');
  // 魔法じんまで
  let n = 0;
  let aimEv = null;
  while (!aimedKid(b) && n < 10) {
    aimEv = turn(b, k);
    n++;
  }
  assert.equal(n, kc.grow.every - kc.grow.aimAt);
  assert.ok(aimEv.c8cAim && aimEv.c8cGrowLeft);
  const t = aimedKid(b);
  assert.equal(pub(t).aimed, 1);
  // 動けない 番は 次へ（しるしは へる）
  turn(b, k, { type: 'incapacitated' });
  assert.equal(k.telegraph, null);
  // 魔法じんの 子分は ダメージ ×soft
  const hp = t.hp;
  hit(b, b.allies[0], t, 100);
  assert.equal(hp - t.hp, Math.round(100 * kc.grow.soft));
  turn(b, k);
  assert.equal(k.telegraph, GROW);
  k.telegraph = null;
  const atk = t.atk;
  const ev = effect(b, k, GROW);
  assert.ok(ev.c8cGrow && t.c8giga && t.name.startsWith('デカ') && t.maxHp >= kc.grow.hp && t.hp === t.maxHp && t.atk > atk);
  assert.ok(t.actions.some((a) => a.id === 'm8k_kstomp'), 'ふみつけ');
  assert.equal(pub(t).giga, 1);
  assert.equal(pub(t).aimed, 0);
  assert.equal(k.c8km.left, growEvery(k));
});

test('マジカメック: 魔法じんの 子分を 先に たおすと から回り → ちびカメック（ダメージ ×tiny.k）→ 子分を よぶ', () => {
  const b = bossBattle('kamek');
  const k = kamekOfB(b);
  const kc = kamekConf(k);
  const hero = b.allies[0];
  const { t } = toAim(b, k);
  const ev = hit(b, hero, t, t.hp + 10);
  assert.ok(!t.alive && ev.c8cAimGone);
  turn(b, k);
  assert.equal(k.telegraph, FIZZLE, 'から回り');
  k.telegraph = null;
  const fe = effect(b, k, FIZZLE);
  assert.ok(fe.c8cFizzle && k.c8km.tiny > 0 && !k.c8km.aim);
  assert.equal(pub(k).tiny, 1);
  const hp = k.hp;
  hit(b, hero, k, 1000);
  assert.equal(hp - k.hp, Math.round(1000 * kc.tiny.k), 'ちびカメック');
  // 子分が へったので 次は よぶ
  turn(b, k);
  assert.equal(k.telegraph, SUMMON);
  k.telegraph = null;
  const se = effect(b, k, SUMMON);
  assert.ok(se.c8cSummon && se.joined?.length === 1 && kidsAlive(b).length === 2);
  assert.ok(kidsAlive(b).every((e) => e.c8kid));
  // ちびカメックは tiny.turns 回 動くと もどる
  for (let i = 0; i < kc.tiny.turns; i++) turn(b, k);
  assert.equal(pub(k).tiny, 0);
  // マジカメックが たおれると 子分は にげて いく（勝ち）
  hit(b, hero, k, k.hp + 10);
  assert.ok(!kidsAlive(b).length);
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(monsterDrops(C8_KAMEK).filter((x) => x.kind === 'boss').length, 1);
});

test('マジカメック: HP が へると ほうきに のる（コマ 2・3・魔法が はやく なる）。知っている 人は 魔法じんの 子分を ねらう', () => {
  const b = bossBattle('kamek');
  const k = kamekOfB(b);
  const kc = kamekConf(k);
  k.hp = Math.floor(k.maxHp * (kc.broomAt - 0.05));
  turn(b, k);
  assert.equal(k.telegraph, BROOM);
  k.telegraph = null;
  const ev = effect(b, k, BROOM);
  assert.ok(ev.c8cBroom && k.c8km.broom && growEvery(k) === kc.grow.broomEvery && growEvery(k) < kc.grow.every);
  assert.equal(pub(k).kmForm, 2);
  assert.ok(k.actions.some((a) => a.id === 'm8k_broomhit'));
  // 知っている 人
  const b2 = bossBattle('kamek', 5);
  const k2 = kamekOfB(b2);
  b2.knowsCh6 = true;
  const { t } = toAim(b2, k2);
  let on = 0;
  for (const x of b2.allies) {
    const cmd = c8cPlan(b2, x, decideAlly);
    const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
    if (cmd?.target === t.id || (a && a.target !== 'enemy' && ['enemies', 'group'].includes(a.target))) on++;
  }
  assert.ok(on >= 2, `${on}`);
  assert.ok(c8bPlan(b2, b2.allies[0], decideAlly) && c8aPlan(b2, b2.allies[0], decideAlly), 'battle-c8b.js・battle-c8a.js から よばれる');
  b2.c8cNoAim = true;
  let on2 = 0;
  for (const x of b2.allies) if (c8cPlan(b2, x, decideAlly)?.target === t.id) on2++;
  assert.ok(on2 < on, `${on2} < ${on}`);
});

// ───────────── クッパード ─────────────
test('クッパード: pound.every 回で ドッスンヒップドロップ（みんなに 大技・守ると へる）', () => {
  const bc = bowserConf({ species: C8_BOWSER });
  const b = bossBattle('bowser');
  const h = bowserOfB(b);
  assert.ok(h.c8bw && h.c8bw.form === 1);
  assert.equal(pub(h).bwForm, 1);
  assert.equal(pub(h).poundEvery, bc.pound.every);
  for (let i = 0; i < bc.pound.every - 1; i++) assert.ok(turn(b, h).c8cPoundLeft);
  turn(b, h, { type: 'incapacitated' });
  assert.equal(h.telegraph, null, '動けない 番は 次へ');
  turn(b, h);
  assert.equal(h.telegraph, POUND);
  assert.ok(bowserBigBefore(b, b.allies[0], h));
  h.telegraph = null;
  const poundDmg = (guard) => {
    const b2 = bossBattle('bowser', 11);
    const h2 = bowserOfB(b2);
    for (const x of b2.allies) x.defending = guard;
    const ev = effect(b2, h2, POUND);
    assert.ok(ev.c8cPound);
    assert.equal(h2.c8bw.left, bc.pound.every);
    return dmgOf(ev);
  };
  const open = poundDmg(false), guarded = poundDmg(true);
  assert.ok(open > 0 && guarded < open * 0.75, `${guarded} / ${open}`);
  // ふつうの オート: HPが へっていれば よく 守る
  const b3 = bossBattle('bowser', 8);
  const h3 = bowserOfB(b3);
  h3.telegraph = POUND;
  const x = b3.allies[0];
  x.hp = Math.round(x.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c8cPlan(b3, x, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  x.hp = x.maxHp;
  assert.equal(c8cPlan(b3, x, decideAlly), null, `HPが ${AUTO_GUARD.hp} いじょうは 守らない`);
});

test('クッパード: HP が へると かけらが 光る → gigaAt で 止まる → ギガクッパード（かたい・橋のオノが あらわれる）', () => {
  const bc = bowserConf({ species: C8_BOWSER });
  const b = bossBattle('bowser');
  const h = bowserOfB(b);
  const hero = b.allies[0];
  h.hp = Math.floor(h.maxHp * (bc.gigaAt + 0.1));
  const fl = hit(b, hero, h, Math.floor(h.maxHp * 0.05));
  assert.ok(fl.c8cFlicker && h.c8bw.flicker && pub(h).flicker === 1, 'かけらが 光る');
  const floor = Math.ceil(h.maxHp * bc.gigaAt - 1e-6) - 1;
  hit(b, hero, h, 40000);
  assert.equal(h.hp, floor, 'いっきに たおせない');
  turn(b, h);
  assert.equal(h.telegraph, GIGA);
  h.telegraph = null;
  const atk = h.atk;
  const ev = effect(b, h, GIGA);
  assert.ok(ev.c8cGiga && h.c8bw.form === 2 && h.name === GIGA_NAME && h.atk > atk);
  assert.deepEqual(h.actions.map((a) => a.id), GIGA_ACTIONS.map((a) => a.id));
  assert.equal(pub(h).bwForm, 2);
  assert.equal(pub(h).flicker, 0);
  assert.equal(pub(h).poundEvery, 0, 'ヒップドロップの しるしは 0 で 消す');
  const axe = axeOf(b);
  assert.ok(axe && axe.species === C8_AXE && ev.joined?.length === 1 && axe.hp === bc.giga.axeHits);
  assert.equal(pub(axe).axeLeft, bc.giga.axeHits);
  // ギガは かたい（ダメージ cut ばい）。HP の 下かぎりは ない
  const hp = h.hp;
  hit(b, hero, h, 1000);
  assert.equal(hp - h.hp, Math.round(1000 * bc.giga.cut));
  // ギガほのお（守ると へる）
  for (let i = 0; i < bc.giga.every - 1; i++) assert.ok(turn(b, h).c8cFireLeft);
  turn(b, h);
  assert.equal(h.telegraph, GIGAFIRE);
  assert.ok(bowserBigBefore(b, hero, h));
  h.telegraph = null;
  heal(b);
  const open = dmgOf(effect(b, h, GIGAFIRE));
  heal(b);
  for (const x of b.allies) x.defending = true;
  const guarded = dmgOf(effect(b, h, GIGAFIRE));
  assert.ok(open > 0 && guarded < open * 0.75, `${guarded} / ${open}`);
});

test('橋のオノ: ぶきで axeHits 回 たたくと 橋が おちて ふつうの 大きさに もどる（ダメージ・1回 動けない）。呪文では 動かない。regrow 回で また ギガ', () => {
  const bc = bowserConf({ species: C8_BOWSER });
  const b = bossBattle('bowser');
  const h = bowserOfB(b);
  const hero = b.allies[0];
  h.hp = Math.floor(h.maxHp * 0.45);
  effect(b, h, GIGA);
  const axe = axeOf(b);
  // 呪文では 動かない
  const me = hit(b, hero, axe, 500, 'fire');
  assert.equal(axe.hp, bc.giga.axeHits);
  assert.ok(me.c8cAxeMagic);
  // ぶきで たたく
  for (let i = 0; i < bc.giga.axeHits - 1; i++) {
    const e = hit(b, hero, axe, 800);
    assert.ok(e.c8cAxeHit && axe.alive);
  }
  assert.equal(axe.hp, 1);
  const hp = h.hp;
  const ev = hit(b, hero, axe, 800);
  assert.ok(!axe.alive && ev.c8cFall && h.c8bw.form === 1 && h.c8bw.fallen, '橋が おちた');
  assert.equal(h.name, MONSTERS[C8_BOWSER].name);
  assert.deepEqual(h.actions.map((a) => a.id), BOWSER_ACTIONS.map((a) => a.id));
  assert.equal(hp - h.hp, Math.round(h.maxHp * bc.giga.fall));
  assert.equal(pub(h).bwForm, 1);
  assert.equal(pub(h).fallen, 1);
  assert.equal(pub(h).fireEvery, 0, 'ギガほのおの しるしは 0 で 消す');
  turn(b, h);
  assert.equal(h.telegraph, FALLEN, 'あいたたた');
  h.telegraph = null;
  // ちぢんだ あとは 下かぎりが ない（はじめての ギガは すんだ）
  const hp2 = h.hp;
  hit(b, hero, h, 1000);
  assert.equal(hp2 - h.hp, 1000);
  // regrow 回 動くと また ギガ（オノも また あらわれる）
  let giga = false;
  for (let i = 0; i < bc.giga.regrow + 1 && !giga; i++) {
    turn(b, h);
    if (h.telegraph === GIGA) giga = true;
    h.telegraph = null;
  }
  assert.ok(giga);
  const ge = effect(b, h, GIGA);
  assert.ok(ge.c8cGiga && axeOf(b) === axe && axe.hp === bc.giga.axeHits && !ge.joined, 'おなじ オノが また あらわれる');
  // 知っている 人は オノを たたく・しない 人は たたかない
  b.knowsCh6 = true;
  assert.deepEqual(c8cPlan(b, hero, decideAlly), { type: 'attack', target: axe.id });
  b.c8cNoAxe = true;
  assert.notDeepEqual(c8cPlan(b, hero, decideAlly), { type: 'attack', target: axe.id });
  b.c8cNoAxe = false;
  // クッパードを たおすと オノも くずれて 勝ち
  hit(b, hero, h, h.hp * 2);
  assert.ok(!h.alive);
  assert.ok(!axe.alive);
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(monsterDrops(C8_BOWSER).filter((x) => x.kind === 'boss').length, 1);
  assert.equal(monsterDrops(C8_AXE).length, 0);
});

test('シミュレーター: 知っている 人・知らない 人・完全オートで 戦いが おわる（しかけが 動く）。ゲストの リオン（rion8）と いっしょ', () => {
  const r = ch8Run('kamek', 88, true, 8080);
  assert.ok(['win', 'lose'].includes(r.outcome) && r.aims >= 1 && r.fizzles >= 1, JSON.stringify(r));
  const h = ch8Run('bowser', 90, true, 8080);
  assert.ok(['win', 'lose'].includes(h.outcome) && h.pounds >= 1 && h.gigas >= 1 && h.falls >= 1 && h.axeHits >= 3, JSON.stringify(h));
  const a = ch8Run('kamek', 88, false, 8081);
  assert.ok(['win', 'lose', 'timeout'].includes(a.outcome) && a.grows >= 1, JSON.stringify(a));
  for (const boss of ['kamek', 'bowser']) for (const [job, list] of Object.entries(CH8_KIT[boss])) for (const id of list) if (id) assert.ok(ITEMS[id] && canEquip(job, id), `${job}: ${id}`);
});

// ───────────── 品 ─────────────
test('宝箱: くろがねの 空中ようさい 1〜8階に ★5の 装備 1つ（レア度4・src c8c）と 素材か 道具 1つ。第8章 第2幕の 海底神殿より 強い', () => {
  const ks = Object.values(C8C_K);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(C8C_K[1] > C8B_K[8]);
  const gear = Object.values(C8C_TREASURE).map((x) => x[0]);
  assert.equal(new Set(gear).size, 8);
  for (const id of gear) {
    const it = ITEMS[id];
    assert.ok(it === ITEMS_C8C[id] && it.rank === 10 && it.rarity === 4 && it.src === 'c8c', id);
    assert.ok(['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), 'くろがねの空中ようさいの宝箱でしか手に入らない');
    assert.ok(it.desc && C8C_ITEM_KANA[id] && ITEM_KANA[id], id);
    assert.ok(!(it.resist?.water < 1), `${id}: 水に 強い 装備は 作らない`);
  }
  for (const [n, [, mat]] of Object.entries(C8C_TREASURE)) {
    assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type) && !ITEMS_C8C[mat], `${n}階: ${mat}（今の 素材・道具）`);
    assert.equal(C8C_TREASURE_N[n].length, 2);
    assert.equal(C8C_TREASURE_N[n][0], 1);
    assert.deepEqual(c8cChest(Number(n), 1), { item: mat, n: C8C_TREASURE_N[n][1] });
    assert.deepEqual(c8cChest(Number(n), 0), { item: C8C_TREASURE[n][0], n: 1 });
  }
  assert.equal(c8cChest(1, 2), null);
  assert.ok(ITEMS.c8ct_iron_mail.def > ITEMS.c8bt_temple_mail.def);
  assert.ok(ITEMS.c8ct_iron_shield.def > ITEMS.c8bt_flame_shield.def);
  assert.ok(ITEMS.c8ct_sky_robe.def > ITEMS.c8bt_soul_robe.def);
  // 宝箱の おうぎ・つえは ボスの 武器（いちばん 強い おうぎ・つえ）を こえない
  assert.ok(ITEMS.c8ct_propeller_fan.atk < ITEMS.c8p_parrot_fan.atk && ITEMS.c8ct_star_staff.atk < ITEMS.c8k_magic_staff.atk);
});

test('ボスの 品・時をこえる手紙の ごほうび: いちばん 強い つえ・ツメ・オノ。名前は かぶらない', () => {
  for (const [boss, [acc, weapon]] of Object.entries(C8C_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss' && ITEMS[acc].boss === boss);
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c8w_king_charm') > sum('c8k_magic_charm') && sum('c8k_magic_charm') > sum('c8h_flame_charm'));
  const top = (cat) => Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+')).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top('staff'), 'c8k_magic_staff');
  assert.equal(top('claw'), 'c8w_king_claw');
  assert.equal(top('axe'), 'c8ct_iron_axe');
  for (const list of Object.values(C8C_LETTER_REWARDS)) {
    const [id] = list[0];
    assert.ok(ITEMS[id] && ITEMS[id].src === 'letter7' && starsOf(id) === 5, id);
    assert.equal(rareWhereText(id), '時をこえる手紙でしか手に入らない');
    for (const [mat] of list.slice(1)) assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type), mat);
  }
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!id.includes('+')) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C8C)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
  assert.ok(!Object.keys(ITEMS_C8C).some((id) => ITEMS_C8B[id]));
});

// ───────────── 技の せつめい・エフェクト・がめん・背景・曲 ─────────────
test('技の せつめい: 1文めだけで 何を するか わかる（スマホの たて持ちは 1文めだけ。30字くらいまで）', () => {
  for (const [id, a] of Object.entries(C8C_ABILITIES)) {
    assert.equal(ABILITIES[id], a, id);
    const s = firstSentence(a.desc);
    assert.ok(s.endsWith('。') && s.length <= 32, `${id}: ${s}（${s.length}字）`);
  }
});

test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(C8C_ABILITIES).map((a) => a.anim).filter((a) => /^c8[nkw]_/.test(a)))];
  assert.ok(own.length >= 34, `${own.length}`);
  for (const a of own) {
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8bFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playC7iFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  assert.equal(playC8cFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C8C_SCREEN_ANIMS, ...Object.keys(C8C_ALLY_FX), ...Object.keys(C8C_SFX)]) assert.ok(own.includes(a), a);
  for (const a of ['c8k_grow', 'c8w_pound', 'c8w_giga', 'c8w_gigafire']) assert.ok(C8C_SCREEN_ANIMS.includes(a), a);
  for (const [k, v] of Object.entries(C8C_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.6, 0.99]) {
    C8C_FINE.c8cshape(x, { x: 100, y: 30, size: 6, n: 1, age: t * 700 }, t);
    C8C_FINE.c8cring(x, { x: 100, y: 60, size: 30, age: t * 1400 }, t);
  }
  assert.equal(C8B_FINE.c8cring, C8C_FINE.c8cring);
});

test('がめん: でっかくなあれ・ヒップドロップ・ギガほのお・オノの しるし・魔法じん・ちびカメック・かけら・ぐるぐる・バナー', () => {
  for (const id of C8C_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id) && C8B_OWN_TELE.includes(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 1000, c: new Map() };
  const n = () => drawn.length;
  for (const c of [
    { species: C8_KAMEK, kmForm: 1, growLeft: 1, growEvery: 4 },
    { species: C8_KAMEK, kmForm: 2, growLeft: 3, growEvery: 3, tiny: 1, tinyK: 2 },
    { species: 'tonkachi_bro', aimed: 1, giga: 0 },
    { species: C8_BOWSER, bwForm: 1, poundLeft: 1, poundEvery: 3, flicker: 1 },
    { species: C8_BOWSER, bwForm: 1, poundLeft: 2, poundEvery: 3, regrowLeft: 2, fallen: 1 },
    { species: C8_BOWSER, bwForm: 2, fireLeft: 1, fireEvery: 3 },
    { species: C8_AXE, axeLeft: 2, axeMax: 3 },
  ]) {
    const m = n();
    c8cDraw(scene, x, null, { alive: true, ...c }, 100, 20, 112, 112, 1);
    assert.ok(n() > m + 4, JSON.stringify(c));
  }
  assert.ok(drawn.includes('fillText'));
  const sc = {
    game: { audio: { sfx() {} } }, banners: [], banner(t, cls) { this.banners.push([t, cls]); }, shake() {},
    c: new Map([['k1', { name: 'トンカチブロス' }]]),
  };
  for (const ev of [
    { c8cAim: { who: 'k1' } }, { c8cGrow: { who: 'k1' } }, { c8cAimGone: { id: 'k1' } }, { c8cFizzle: { id: 'k' } }, { c8cBroom: { id: 'k' } },
    { c8cPoundLeft: { left: 1 } }, { c8cPound: {} }, { c8cFlicker: {} }, { c8cGiga: {} }, { c8cFireLeft: { left: 1 } }, { c8cGigaFire: {} },
    { c8cAxeHit: { left: 2 } }, { c8cFall: {} }, { c8cRegrow: { left: 1 } },
  ]) c8cPresent(sc, ev, {}, null, null);
  assert.equal(sc.banners.length, 14);
  assert.ok(sc.banners[0][0].includes('トンカチブロス'));
  assert.deepEqual(sc.banners.map((b) => b[1]), ['danger', 'danger', 'combo', 'combo', 'danger', 'danger', 'danger', 'danger', 'danger', 'danger', 'danger', 'combo', 'combo', 'danger']);
});

test('背景・曲: 空中ようさいの 甲板・歯車の 部屋・大橋。曲は パートの ながさが そろう', () => {
  for (const id of ['fort_deck', 'fort_engine', 'fort_bridge']) {
    const d = battleBgSpec(id);
    assert.ok(d && d.deco === id && d.sky.length >= 3 && d.ground.length === 2, id);
  }
  const len = (s) => s.trim().split(/\s+/).reduce((t, tok) => t + Number(tok.split(':')[1]), 0);
  for (const id of ['kamek_magic', 'bowser_king']) {
    const tr = _TRACKS[id];
    assert.ok(tr && tr.bpm > 0 && tr.ch.length >= 4, id);
    for (const ch of tr.ch) assert.equal(len(ch.n), 256, id);
  }
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし', () => {
  const files = ['monsters-c8c.js', 'abilities-c8c.js', 'items-c8c.js', 'encounters-c8c.js', 'companions-c8c.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-c8c.js', 'public/js/client/battle-c8c.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full), [], f);
  }
});
