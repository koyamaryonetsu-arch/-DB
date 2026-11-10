// 第2部 第8章 第2幕（Step 3・4）B（戦い・品）「よみの 青い火」
// 名前の 約束（docs/plan-ch8.md の 6-2）・手下の 魔物 5しゅ（どれも 仲間に なる・ランク・まぜ配合・素材の 入手先）・出現表・
// ペイニックと パニクル（ひそひそ相談 → ばけばけ大がったい。相談の 間の 大きな 一撃で けんか。かたほうが たおれると パニック → カンカン）・
// よみの王ハデロス（青い 炎: たましいのけいやく〈炎で もえる〉→ かみが 赤く ちらちら → おこった 赤い 炎: 弱点が ひっくりかえる・よみの大ふん火〈氷で ひえる〉）・
// 知っている 人と ふつうの オート・よみの 海底神殿の 宝箱（★5 装備 1つ ＋ 素材か 道具 1つ）・ボスの 品・手紙の ごほうび・
// 細かく 描いた ボスの え（2倍の こまかさ・artScale 0.5。ハデロスの おこった すがたは コマ 2・3）・エフェクト・がめん・背景・曲・技の せつめい（1文め）・文字
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
import { canEquip } from '../public/js/shared/stats.js';
import { MONSTERS_C8B, C8_PAIN, C8_PANIC, C8_HADES, C8B_MINIONS, C8B_MAT_DROPS, HADES_BLUE, HADES_RED, RED_ACTIONS } from '../public/js/shared/data/monsters-c8b.js';
import { C8B_ABILITIES } from '../public/js/shared/data/abilities-c8b.js';
import { FRIENDS_C8B } from '../public/js/shared/data/companions-c8b.js';
import { ENCOUNTERS_C8B, FIXED_C8B, ZONE_BG_C8B } from '../public/js/shared/data/encounters-c8b.js';
import { ITEMS_C8B, C8B_TREASURE, C8B_TREASURE_N, c8bChest, C8B_LETTER_REWARDS, C8B_DROPS, C8B_K, C8B_ITEM_KANA } from '../public/js/shared/data/items-c8b.js';
import { ITEMS_C8A, C8A_K } from '../public/js/shared/data/items-c8a.js';
import {
  FUSE, QUARREL, PANIC, RAGE, SOLO, CONTRACT, SOUL, HOT, ANGER, ERUPT, COOL, RED_NAME,
  impsConf, hadesConf, plotting, bothUp, bound, eruptSoon, impBigBefore, hadesBigBefore, c8bPlan, c8bEffect,
} from '../public/js/shared/battle-c8b.js';
import { c8aPlan } from '../public/js/shared/battle-c8a.js';
import { c7iPlan } from '../public/js/shared/battle-c7i.js';
import { AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch8Run, ch8Party, CH8_KIT, CH8_LV } from '../tools/sim-ch8.mjs';
import { rankPoints, BANDS } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC8bFx, C8B_FINE } from '../public/js/client/render/battlefx-c8b.js';
import { playC8aFx, C8A_FINE } from '../public/js/client/render/battlefx-c8a.js';
import { playC7iFx } from '../public/js/client/render/battlefx-c7i.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C8B_SCREEN_ANIMS, C8B_ALLY_FX, C8B_SFX, C8B_OWN_TELE, c8bDraw, c8bPresent, c8bMarks, c8bSprite } from '../public/js/client/battle-c8b.js';
import { c8aSprite, C8A_OWN_TELE } from '../public/js/client/battle-c8a.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { _TRACKS } from '../public/js/client/audio.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

// ねらった 系統と ランク（docs/plan-r53-breed-more.md の 1 の 足りない 所。第8章 第1幕の あとで 少ない 所）
const WANT = { kerberos: ['demon', 'F'], bone_fish: ['undead', 'E'], biri_jelly: ['slime', 'D'], blue_soul: ['spirit', 'C'], hydran: ['dragon', 'A'] };
const BOSS = { imps: C8_PAIN, hades: C8_HADES };
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
// ゲストの カイは A の 物語の ゲスト（ここでは 4人。シミュレーターは カイも）
function bossBattle(boss, seed = 3) {
  const party = ch8Party(boss, CH8_LV[boss]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  const enemies = FIXED_ENCOUNTERS[BOSS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies });
}
const dmgOf = (ev) => (ev.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
const effect = (b, c, id) => {
  const ev = ev0();
  assert.ok(c8bEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id);
  return ev;
};
const hit = (b, c, t, n, element = 'phys', extra = {}) => {
  const ev = { ...ev0(), id: c.id, ...extra };
  b.damage(c, t, n, ev, { element, phys: element === 'phys' });
  return ev;
};
const impsOfB = (b) => [b.enemies.find((e) => e.species === C8_PAIN), b.enemies.find((e) => e.species === C8_PANIC)];
const hadesOf = (b) => b.enemies.find((e) => e.species === C8_HADES);
const heal = (b) => {
  for (const x of b.allies) Object.assign(x, { alive: true, hp: x.maxHp, defending: false, status: {} });
};

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 6-2）: c8_painpanic・c8_hades・t8b_temple・t8b_deep・C8B_TREASURE・C8B_LETTER_REWARDS', () => {
  for (const id of [C8_PAIN, C8_HADES]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C8B[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm && f.bg, id);
    assert.equal(f.group[0][0], id, 'showMon と おなじ 魔物');
    const m = MONSTERS[id];
    assert.ok(m?.boss && MONSTER_ART[id], id);
    assert.ok(m.drops.bonus.includes('limit_stone'), id);
    // 曲と 背景が ある
    assert.ok(_TRACKS[f.bgm], `${id}: 曲 ${f.bgm}`);
    assert.ok(battleBgSpec(f.bg), `${id}: 背景 ${f.bg}`);
  }
  assert.equal(MONSTERS[C8_PAIN].lv, 84);
  assert.equal(MONSTERS[C8_HADES].lv, 86);
  assert.equal(MONSTERS[C8_PAIN].name, 'ペイニック');
  assert.equal(MONSTERS[C8_PANIC].name, 'パニクル');
  assert.equal(MONSTERS[C8_HADES].name, 'よみの王ハデロス');
  // 2ひきで 1組（パニクルの 経験値・お金・落とす物は ペイニックに まとめる）
  assert.deepEqual(FIXED_C8B[C8_PAIN].group, [[C8_PAIN, 1, 1], [C8_PANIC, 1, 1]]);
  assert.ok(MONSTERS[C8_PANIC].boss && MONSTERS[C8_PANIC].exp === 0 && !Object.keys(MONSTERS[C8_PANIC].drops).length && MONSTER_ART[C8_PANIC]);
  assert.deepEqual(Object.keys(ENCOUNTERS_C8B), ['t8b_temple', 't8b_deep']);
  for (const z of ['t8b_temple', 't8b_deep']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C8B[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C8B[z]);
    assert.ok(battleBgSpec(ZONE_BG[z]), z);
    assert.equal(rankPoints(ENCOUNTERS_C8B[z][0].group[0][0]).band, '第8章');
  }
  // 出現表の 魔物の レベル（1〜4階 Lv83〜85・5〜8階 Lv85〜87 の あたり）
  const lvs = (z) => ENCOUNTERS_C8B[z].flatMap((e) => e.group.map((g) => MONSTERS[g[0]].lv));
  assert.ok(lvs('t8b_temple').every((lv) => lv >= 80 && lv <= 85));
  assert.ok(lvs('t8b_deep').every((lv) => lv >= 82 && lv <= 87) && Math.max(...lvs('t8b_deep')) >= 86);
  assert.deepEqual(Object.keys(C8B_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(C8B_TREASURE)) assert.equal(list.length, 2);
  assert.deepEqual(Object.keys(C8B_LETTER_REWARDS).map(Number), [1, 2, 3]);
  for (const list of Object.values(C8B_LETTER_REWARDS)) for (const [id, n] of list) assert.ok(ITEMS[id] && n >= 1, id);
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 5しゅ: どれも 仲間に なる・ねらった 系統と ランク・出現表に 出る・Lv83〜86・素材の 入手先', () => {
  assert.deepEqual(C8B_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const zoneOf = (sp) => Object.entries(ENCOUNTERS_C8B).filter(([, t]) => t.some((e) => e.group.some((g) => g[0] === sp))).map(([z]) => z);
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C8B[sp]);
    assert.equal(f, FRIENDS_C8B[sp]);
    assert.equal(m.race, race, sp);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp), `${sp}: 仲間に なる`);
    assert.equal(MONSTER_RANKS[sp], rank, `${sp}: ランクの 表`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).rank, rank, `${sp}: gen-monster-ranks と おなじ`);
    assert.equal(rankPoints(sp).band, '第8章');
    assert.ok(m.lv >= 83 && m.lv <= 86 && m.region === 6, sp);
    assert.ok(zoneOf(sp).length >= 1, `${sp}: 出現表`);
    assert.ok(!m.boss && m.desc && f.note && f.names.length === 4, sp);
    // 素材（今の 素材だけ）。入手先の 画面に 出る（第64回 ⑥a）
    assert.ok(MAT_DROPS[sp] && C8B_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', sp);
    assert.ok(monsterDrops(sp).some((d) => d.item === MAT_DROPS[sp][0]), `${sp}: 落とす 物`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !/^c8b/.test(ABILITIES[id].effect.type) && ABILITIES[id].effect.type !== 'callHelp', `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const id of [m.drops.common?.[0], m.drops.rare?.[0]]) assert.ok(ITEMS[id], `${sp}: ${id}`);
    // レアの ドロップは 店の 品（宝箱の 品は 宝箱だけ）
    assert.ok(ITEMS[m.drops.rare[0]].price > 0 && !ITEMS_C8B[m.drops.rare[0]], sp);
  }
  assert.ok(BANDS.includes('第8章'));
  // 第8章の B〜S は 2わりまで（test/monsters-r43a）。F〜C が そろう
  const ch8 = Object.keys(MONSTER_RANKS).filter((sp) => rankPoints(sp).band === '第8章');
  assert.equal(ch8.length, 10);
  assert.ok(ch8.filter((sp) => ['B', 'A', 'S'].includes(MONSTER_RANKS[sp])).length <= Math.max(2, ch8.length * 0.2));
  for (const r of ['F', 'E', 'D', 'C']) assert.ok(ch8.some((sp) => MONSTER_RANKS[sp] === r), r);
});

test('配合: 5しゅ みんな 系統まぜ配合（mix）の 子・系統配合の 子は A の ヒドランだけ', () => {
  for (const sp of C8B_MINIONS) {
    const f = FRIENDS_C8B[sp], race = MONSTERS[sp].race;
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
test('絵: 新しい 絵 3しゅ・のこり 2しゅは 今の 絵の 色がえ。ボスは 2倍の こまかさ（artScale 0.5）・ハデロスの おこった すがたと 小鬼の パニックは コマ 2・3', () => {
  let fresh = 0;
  for (const sp of C8B_MINIONS) {
    const m = MONSTERS[sp];
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
    assert.equal(monsterFine(sp), 1, `${sp}: 手下は 今までの こまかさ`);
  }
  assert.equal(fresh, 3, '新しい 絵は 3しゅ まで');
  for (const id of ['kerberos', 'bone_fish', 'blue_soul']) {
    const [a, b] = palCheck(id, [0, 1]);
    assert.notEqual(a, b, `${id}: コマで うごく`);
  }
  for (const id of [C8_PAIN, C8_PANIC, C8_HADES]) {
    const [f0, f1, f2, f3] = palCheck(id, [0, 1, 2, 3]);
    assert.ok(f0 !== f1 && f2 !== f3 && f0 !== f2 && f1 !== f3, `${id}: 4コマ ちがう え`);
  }
  // ボス: え の size は 今までの ボスの 2倍・artScale 0.5。小鬼は 2ひき ならぶので 少し 小さい
  for (const [id, lo, hi] of [[C8_HADES, 96, 130], [C8_PAIN, 72, 110], [C8_PANIC, 72, 110]]) {
    assert.equal(MONSTERS[id].artScale, 0.5, id);
    assert.equal(monsterFine(id), 2, id);
    assert.equal(MONSTER_ART[id].npc, 0.6, id);
    const [w, h] = monsterSize(id);
    assert.ok(w >= lo && w <= hi && h >= lo && h <= hi + 10, `${id}: 見た目 ${w}×${h}`);
    assert.deepEqual(MONSTER_ART[id].size, [w * 2, h * 2]);
  }
  // 変身の え（pub の c8hform 2・impForm 2 の ときだけ。battle-c8a.js の c8aSprite から よばれる）
  assert.equal(c8bSprite({ species: C8_HADES, c8hform: 1 }, 0), null);
  assert.equal(c8bSprite({ species: C8_PAIN }, 0), null);
  assert.equal(c8aSprite({ species: C8_HADES, c8hform: 1 }, 0), null);
});

// ───────────── ペイニックと パニクル ─────────────
test('小鬼: 2ひきが 動く たびに しるしが へる → ひそひそ相談 → ばけばけ大がったい（みんなに 大技・身を 守ると へる）', () => {
  const b = bossBattle('imps');
  const [pa, pn] = impsOfB(b);
  const ic = impsConf(pa);
  assert.ok(pa.c8imp && pn.c8imp && b.c8imps && bothUp(b));
  assert.equal(b.c8imps.left, ic.every);
  assert.equal(pub(pa).impEvery, ic.every);
  assert.equal(pub(pn).impLeft, ic.every, '2ひきとも おなじ しるし');
  // どちらが 動いても へる
  let plotEv = null;
  for (let i = 0; i < ic.every - 1; i++) {
    const ev = turn(b, i % 2 ? pn : pa);
    assert.ok(ev.c8bImpLeft, `${i}`);
    if (ev.c8bImpLeft.plot && !plotEv) plotEv = ev;
  }
  assert.ok(plotEv && plotEv.c8bImpLeft.left === ic.plot, 'ひそひそ相談の はじまり');
  assert.equal(b.c8imps.left, 1);
  assert.ok(plotting(b) && pub(pa).plot === 1 && pub(pn).plot === 1);
  turn(b, pn, { type: 'incapacitated' });
  assert.equal(pn.telegraph, null, '動けない 番は 次へ');
  turn(b, pa);
  assert.equal(pa.telegraph, FUSE);
  pa.telegraph = null;
  const fuseDmg = (guard) => {
    const b2 = bossBattle('imps', 11);
    const [p2] = impsOfB(b2);
    for (const x of b2.allies) x.defending = guard;
    const ev = effect(b2, p2, FUSE);
    assert.ok(ev.c8bFuse);
    assert.equal(b2.c8imps.left, ic.every, 'しるしは もどる');
    return dmgOf(ev);
  };
  const open = fuseDmg(false), guarded = fuseDmg(true);
  assert.ok(open > 0 && guarded < open * 0.75, `${guarded} / ${open}`);
});

test('小鬼: 相談の 間に 1回で 大きな ダメージを 当てると けんか（2ひきとも 1回 動けない）。相談で ない 時・小さい ダメージでは ならない', () => {
  const b = bossBattle('imps');
  const [pa, pn] = impsOfB(b);
  const ic = impsConf(pa);
  const hero = b.allies[0];
  const need = Math.ceil(pn.maxHp * ic.breakAt);
  // 相談で ない 時
  assert.ok(!plotting(b));
  assert.ok(!hit(b, hero, pn, need + 100).c8bQuarrel);
  // 相談の 間・小さい ダメージ（1回の 行動で あわせて 数える）
  b.c8imps.left = ic.plot;
  assert.ok(plotting(b));
  const small = { ...ev0(), id: hero.id };
  b.damage(hero, pn, Math.floor(need / 3), small, { element: 'phys', phys: true });
  assert.ok(!small.c8bQuarrel);
  b.damage(hero, pn, Math.floor(need / 3), small, { element: 'phys', phys: true });
  assert.ok(!small.c8bQuarrel);
  b.damage(hero, pn, Math.ceil(need / 3) + 10, small, { element: 'phys', phys: true });
  assert.ok(small.c8bQuarrel, '1回の 行動の あわせた ダメージ');
  assert.ok(pa.c8imp.quarrel && pn.c8imp.quarrel && b.c8imps.left === ic.every && !plotting(b));
  assert.equal(pub(pa).quarrel, 1);
  turn(b, pa);
  assert.equal(pa.telegraph, QUARREL);
  pa.telegraph = null;
  turn(b, pn);
  assert.equal(pn.telegraph, QUARREL);
  pn.telegraph = null;
  // けんかの あとは また 数えはじめる
  assert.ok(turn(b, pa).c8bImpLeft);
  assert.equal(b.c8imps.left, ic.every - 1);
  // けんかの 間は 大技が 来ない
  b.c8imps.left = 1;
  pa.c8imp.quarrel = pn.c8imp.quarrel = true;
  b.c8imps.quarrel = true;
  assert.ok(!impBigBefore(b, hero));
});

test('小鬼: かたほうが たおれると のこった ほうは パニック（あたふた・ダメージ ×1.5）→ たおせないと カンカン（強く はやく）→ ひとりばけばけ', () => {
  const b = bossBattle('imps');
  const [pa, pn] = impsOfB(b);
  const ic = impsConf(pa);
  const hero = b.allies[0];
  const ev = hit(b, hero, pn, pn.hp + 10);
  assert.ok(!pn.alive && ev.c8bPanic && ev.c8bPanic.id === pa.id);
  assert.equal(pa.c8imp.panic, ic.panic.turns);
  assert.ok(!bothUp(b) && !plotting(b));
  assert.equal(pub(pa).panicLeft, ic.panic.turns);
  assert.equal(pub(pa).impForm, 2, 'え は コマ 2・3');
  assert.ok(pub(pa).impLeft === 0 && pub(pa).impEvery === 0 && pub(pa).plot === 0, '大がったいの しるしは 消える（0 で 上書き）');
  const hp = pa.hp;
  hit(b, hero, pa, 1000);
  assert.equal(hp - pa.hp, Math.round(1000 * ic.panic.k));
  for (let i = 0; i < ic.panic.turns; i++) {
    const e = turn(b, pa);
    assert.equal(pa.telegraph, PANIC, `${i}: あたふた`);
    assert.ok(e.c8bPanicLeft);
    pa.telegraph = null;
  }
  turn(b, pa);
  assert.equal(pa.telegraph, RAGE);
  pa.telegraph = null;
  const atk = pa.atk, spd = pa.speed || 1;
  const re = effect(b, pa, RAGE);
  assert.ok(re.c8bRage && pa.c8imp.rage && pa.atk > atk && pa.speed > spd);
  assert.equal(pub(pa).rage, 1);
  // パニックが おわると ダメージは ふつう
  const hp2 = pa.hp;
  hit(b, hero, pa, 1000);
  assert.equal(hp2 - pa.hp, 1000);
  // rage.every 回 動く たびに ひとりばけばけ
  let solo = false;
  for (let i = 0; i < ic.rage.every + 1 && !solo; i++) {
    turn(b, pa);
    if (pa.telegraph === SOLO) solo = true;
    pa.telegraph = null;
  }
  assert.ok(solo);
  heal(b);
  const se = effect(b, pa, SOLO);
  assert.ok(se.c8bSolo && dmgOf(se) > 0);
  // 2ひきとも たおすと 勝ち・落とす 物は ペイニックに まとまる
  hit(b, hero, pa, pa.hp + 10);
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(monsterDrops(C8_PAIN).filter((x) => x.kind === 'boss').length, 1);
  assert.equal(monsterDrops(C8_PANIC).length, 0);
});

test('小鬼: 知っている 人は 相談に 大きな 一撃・パニックを ねらう・前ぶれで 守る。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('imps');
  const [pa, pn] = impsOfB(b);
  b.knowsCh6 = true;
  const hero = b.allies[0], god = b.allies[2];
  // 相談の 間: 1体へ 大きな 一撃（とどく 人だけ）
  b.c8imps.left = impsConf(pa).plot;
  let big = 0;
  for (const x of [hero, god]) {
    const cmd = c8bPlan(b, x, decideAlly);
    if (['attack', 'ability'].includes(cmd?.type) && [pa.id, pn.id].includes(cmd.target)) big++;
  }
  assert.ok(big >= 1, `${big}`);
  assert.ok(c8aPlan(b, hero, decideAlly), 'battle-c8a.js から よばれる');
  // 前ぶれ（次に 大がったい）: とどかない 時は 守る
  b.c8imps.left = 1;
  pa.telegraph = FUSE;
  assert.ok(impBigBefore(b, hero));
  b.c8bNoPlot = true;
  assert.deepEqual(c8bPlan(b, hero, decideAlly), { type: 'defend' });
  assert.deepEqual(c7iPlan(b, hero, decideAlly), { type: 'defend' }, 'battle-c7i.js から よばれる');
  b.c6NoGuard = true;
  assert.notEqual(c8bPlan(b, hero, decideAlly)?.type, 'defend');
  b.c6NoGuard = false;
  b.c8bNoPlot = false;
  pa.telegraph = null;
  // パニックの 小鬼を ねらう
  b.c8imps.left = impsConf(pa).every;
  hit(b, hero, pn, pn.hp + 10);
  let onPanic = 0;
  for (const x of b.allies) if (c8bPlan(b, x, decideAlly)?.target === pa.id) onPanic++;
  assert.ok(onPanic >= 2, `${onPanic}`);
  // ふつうの オート
  const b2 = bossBattle('imps', 8);
  const [q] = impsOfB(b2);
  q.telegraph = FUSE;
  b2.c8imps.left = 1;
  const h2 = b2.allies[0];
  h2.hp = Math.round(h2.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c8bPlan(b2, h2, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  h2.hp = h2.maxHp;
  assert.equal(c8bPlan(b2, h2, decideAlly), null, `HPが ${AUTO_GUARD.hp} いじょうは 守らない`);
});

// ───────────── よみの王ハデロス ─────────────
test('ハデロス（青い 炎）: 氷に 弱く 炎に 強い。every 回で たましいのけいやく → 動く たびに すいとる → たましいを いただく（たおれる）', () => {
  const hc = hadesConf({ species: C8_HADES });
  const b = bossBattle('hades');
  const h = hadesOf(b);
  assert.ok(h.c8hd && h.c8hd.form === 1);
  assert.equal(h.resist.fire, HADES_BLUE.fire);
  assert.equal(h.resist.ice, HADES_BLUE.ice);
  assert.ok(HADES_BLUE.ice > 1 && HADES_BLUE.fire < 1 && HADES_RED.fire > 1 && HADES_RED.ice < 1, '弱点が ひっくりかえる');
  assert.equal(pub(h).c8hform, 1);
  assert.equal(pub(h).contractEvery, hc.contract.every);
  for (let i = 0; i < hc.contract.every - 1; i++) assert.ok(turn(b, h).c8bContractLeft);
  turn(b, h, { type: 'incapacitated' });
  assert.equal(h.telegraph, null, '動けない 番は 次へ');
  turn(b, h);
  assert.equal(h.telegraph, CONTRACT);
  h.telegraph = null;
  const ev = effect(b, h, CONTRACT);
  const x = b.get(ev.c8bContract.who);
  assert.ok(x && bound(b, h) === x && pub(h).bound === x.id);
  // すいとる（ハデロスの HP が 少し もどる）
  h.hp -= 5000;
  for (let i = 0; i < hc.contract.turns; i++) {
    const hp0 = x.hp, hh = h.hp;
    const e = turn(b, h);
    assert.ok(e.c8bDrain && x.hp < hp0 && h.hp > hh, `${i}: すいとる`);
    assert.equal(h.telegraph, null);
  }
  assert.ok(hadesBigBefore(b, x, h) || h.c8hd.contract.left === 0);
  turn(b, h);
  assert.equal(h.telegraph, SOUL);
  h.telegraph = null;
  const se = effect(b, h, SOUL);
  assert.ok(se.c8bSoul && !x.alive && !bound(b, h));
  assert.equal(h.c8hd.left, hc.contract.every);
});

test('ハデロス: けいやくの 間に 炎を 当てると けいやくしょが もえる（助かる・あちちっで 1回 動けない）。炎で ない ときは もえない', () => {
  const b = bossBattle('hades');
  const h = hadesOf(b);
  const hero = b.allies[0];
  effect(b, h, CONTRACT);
  const x = bound(b, h);
  assert.ok(!hit(b, hero, h, 500, 'ice').c8bBurnt);
  assert.ok(bound(b, h));
  const ev = hit(b, hero, h, 500, 'fire');
  assert.ok(ev.c8bBurnt && ev.c8bBurnt.who === x.id && !bound(b, h) && h.c8hd.hot);
  assert.equal(pub(h).hot, 1);
  turn(b, h);
  assert.equal(h.telegraph, HOT, 'あちちっ');
  h.telegraph = null;
  // 知っている 人は けいやくの 間は 炎を 当てる
  b.knowsCh6 = true;
  effect(b, h, CONTRACT);
  const fires = () => {
    let n = 0;
    for (const c of b.allies) {
      const cmd = c8bPlan(b, c, decideAlly);
      const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
      const e = a?.effect?.type === 'multi' ? a.effect.parts[0] : a?.effect;
      if (e?.element === 'fire' && (cmd.target === h.id || a.target !== 'enemy')) n++;
    }
    return n;
  };
  const fire = fires();
  assert.ok(fire >= 2, `${fire}`);
  // しない 人（オートは 弱点の 氷を つかう ので、炎は あまり 使わない）
  b.c8bNoBurn = true;
  assert.ok(fires() < fire);
});

test('ハデロス: HP が へると かみが 赤く ちらちら（前ぶれ）→ p2At で 止まる → おこった 赤い 炎（弱点が ひっくりかえる・けいやくしょは もえる）', () => {
  const hc = hadesConf({ species: C8_HADES });
  const b = bossBattle('hades');
  const h = hadesOf(b);
  const hero = b.allies[0];
  effect(b, h, CONTRACT);
  const x = bound(b, h);
  h.hp = Math.floor(h.maxHp * (hc.p2At + 0.1));
  const fl = hit(b, hero, h, Math.floor(h.maxHp * 0.05));
  assert.ok(fl.c8bFlicker && h.c8hd.flicker && pub(h).flicker === 1, 'ちらちら');
  const floor = Math.ceil(h.maxHp * hc.p2At - 1e-6) - 1;
  hit(b, hero, h, 40000);
  assert.equal(h.hp, floor, 'いっきに たおせない');
  turn(b, h);
  assert.equal(h.telegraph, ANGER);
  h.telegraph = null;
  const atk = h.atk;
  const ev = effect(b, h, ANGER);
  assert.ok(ev.c8bAnger && h.c8hd.form === 2 && h.name === RED_NAME && ev.c8bAnger.freed === x.id && !bound(b, h));
  assert.ok(h.atk > atk);
  assert.equal(h.resist.fire, HADES_RED.fire);
  assert.equal(h.resist.ice, HADES_RED.ice);
  assert.deepEqual(h.actions.map((a) => a.id), RED_ACTIONS.map((a) => a.id));
  assert.equal(pub(h).c8hform, 2);
  // おこった あとは HP の 下かぎりが ない
  const hp = h.hp;
  hit(b, hero, h, 1000);
  assert.equal(hp - h.hp, 1000);
});

test('ハデロス（赤い 炎）: every 回で よみの大ふん火（守ると へる）。前ぶれの 間に 氷を 当てると 頭が ひえて しぼむ', () => {
  const hc = hadesConf({ species: C8_HADES });
  const toRed = (seed) => {
    const b = bossBattle('hades', seed);
    const h = hadesOf(b);
    h.hp = Math.floor(h.maxHp * 0.45);
    effect(b, h, ANGER);
    return { b, h };
  };
  const eruptDmg = (guard) => {
    const { b, h } = toRed(9);
    assert.equal(h.c8hd.left, hc.erupt.every);
    for (let i = 0; i < hc.erupt.every - 1; i++) assert.ok(turn(b, h).c8bEruptLeft);
    assert.ok(eruptSoon(h));
    turn(b, h);
    assert.equal(h.telegraph, ERUPT);
    assert.ok(hadesBigBefore(b, b.allies[0], h));
    h.telegraph = null;
    for (const x of b.allies) x.defending = guard;
    const ev = effect(b, h, ERUPT);
    assert.ok(ev.c8bErupt);
    return dmgOf(ev);
  };
  const open = eruptDmg(false), guarded = eruptDmg(true);
  assert.ok(open > 0 && guarded < open * 0.75, `${guarded} / ${open}`);
  // 氷で ひえる（前ぶれの 間だけ）
  const { b, h } = toRed(4);
  const hero = b.allies[0];
  assert.ok(!hit(b, hero, h, 300, 'ice').c8bCool, '前ぶれで ない ときは ひえない');
  h.c8hd.left = 1;
  assert.ok(!hit(b, hero, h, 300, 'fire').c8bCool);
  const ev = hit(b, hero, h, 300, 'ice');
  assert.ok(ev.c8bCool && h.c8hd.cool && h.c8hd.left === hc.erupt.every && !eruptSoon(h));
  assert.equal(pub(h).cool, 1);
  turn(b, h);
  assert.equal(h.telegraph, COOL, '頭が ひえて 動けない');
  h.telegraph = null;
  // かみの 毛が 高く もえて いる 間（しるし のこり chillAt いか）は ひやせる
  assert.ok(hc.erupt.chillAt >= 1);
  h.c8hd.left = hc.erupt.chillAt;
  assert.ok(eruptSoon(h));
  h.c8hd.left = hc.erupt.chillAt + 1;
  assert.ok(!eruptSoon(h));
  // 知っている 人は 前ぶれに 氷を 当てる
  b.knowsCh6 = true;
  h.c8hd.left = 1;
  let ice = 0;
  for (const c of b.allies) {
    const cmd = c8bPlan(b, c, decideAlly);
    const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
    if (a?.effect?.element === 'ice' && cmd.target === h.id) ice++;
  }
  assert.ok(ice >= 2, `${ice}`);
  // 魔人を たおすと 勝ち
  hit(b, hero, h, h.hp + 10);
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(monsterDrops(C8_HADES).filter((x) => x.kind === 'boss').length, 1);
});

test('シミュレーター: 知っている 人・知らない 人・完全オートで 戦いが おわる（しかけが 動く）。ゲストの カイと いっしょ', () => {
  const r = ch8Run('imps', 84, true, 8080);
  assert.ok(['win', 'lose'].includes(r.outcome) && r.quarrels >= 1, JSON.stringify(r));
  if (r.outcome === 'win') assert.ok(r.panics === 1, JSON.stringify(r));
  const h = ch8Run('hades', 86, true, 8080);
  assert.ok(['win', 'lose'].includes(h.outcome) && h.contracts >= 1 && h.burns >= 1 && h.anger === 1 && h.cools >= 1, JSON.stringify(h));
  const a = ch8Run('hades', 86, false, 8081);
  assert.ok(['win', 'lose', 'timeout'].includes(a.outcome) && a.souls >= 1, JSON.stringify(a));
  for (const boss of ['imps', 'hades']) for (const [job, list] of Object.entries(CH8_KIT[boss])) for (const id of list) if (id) assert.ok(ITEMS[id] && canEquip(job, id), `${job}: ${id}`);
});

// ───────────── 品 ─────────────
test('宝箱: よみの 海底神殿 1〜8階に ★5の 装備 1つ（レア度4・src c8b）と 素材か 道具 1つ。第8章 第1幕の 月の王宮より 強い', () => {
  const ks = Object.values(C8B_K);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(C8B_K[1] > C8A_K[8]);
  const gear = Object.values(C8B_TREASURE).map((x) => x[0]);
  assert.equal(new Set(gear).size, 8);
  for (const id of gear) {
    const it = ITEMS[id];
    assert.ok(it === ITEMS_C8B[id] && it.rank === 10 && it.rarity === 4 && it.src === 'c8b', id);
    assert.ok(['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), 'よみの海底神殿の宝箱でしか手に入らない');
    assert.ok(it.desc && C8B_ITEM_KANA[id] && ITEM_KANA[id], id);
    assert.ok(!(it.resist?.water < 1), `${id}: 水に 強い 装備は 作らない`);
  }
  for (const [n, [, mat]] of Object.entries(C8B_TREASURE)) {
    assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type) && !ITEMS_C8B[mat], `${n}階: ${mat}（今の 素材・道具）`);
    assert.equal(C8B_TREASURE_N[n].length, 2);
    assert.equal(C8B_TREASURE_N[n][0], 1);
    assert.deepEqual(c8bChest(Number(n), 1), { item: mat, n: C8B_TREASURE_N[n][1] });
    assert.deepEqual(c8bChest(Number(n), 0), { item: C8B_TREASURE[n][0], n: 1 });
  }
  assert.equal(c8bChest(1, 2), null);
  assert.ok(ITEMS.c8bt_temple_mail.def > ITEMS.c8at_gold_mail.def);
  assert.ok(ITEMS.c8bt_flame_shield.def > ITEMS.c8at_crescent_shield.def);
  assert.ok(ITEMS.c8bt_lantern_staff.bonus.mag > ITEMS.c8at_moon_staff.bonus.mag);
  // 宝箱の 武器は ボスの 武器（いちばん 強い おうぎ・つえ）を こえない
  assert.ok(ITEMS.c8bt_pearl_fan.atk < ITEMS.c8p_parrot_fan.atk && ITEMS.c8bt_lantern_staff.atk < ITEMS.c8j_snake_staff.atk);
});

test('ボスの 品・時をこえる手紙の ごほうび: いちばん 強い こんぼう・やり・短剣。名前は かぶらない', () => {
  for (const [boss, [acc, weapon]] of Object.entries(C8B_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss' && ITEMS[acc].boss === boss);
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c8h_flame_charm') > sum('c8i_imp_charm') && sum('c8i_imp_charm') > sum('c8j_ruby_charm'));
  const top = (cat) => Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+')).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top('bat'), 'c8i_imp_club');
  assert.equal(top('spear'), 'c8h_bident');
  assert.equal(top('dagger'), 'c8bt_yomi_dagger');
  for (const list of Object.values(C8B_LETTER_REWARDS)) {
    const [id] = list[0];
    assert.ok(ITEMS[id] && ITEMS[id].src === 'letter7' && starsOf(id) === 5, id);
    assert.equal(rareWhereText(id), '時をこえる手紙でしか手に入らない');
    for (const [mat] of list.slice(1)) assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type), mat);
  }
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!id.includes('+')) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C8B)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
  assert.ok(!Object.keys(ITEMS_C8B).some((id) => ITEMS_C8A[id]));
});

// ───────────── 技の せつめい・エフェクト・がめん・背景・曲 ─────────────
test('技の せつめい: 1文めだけで 何を するか わかる（スマホの たて持ちは 1文めだけ。30字くらいまで）', () => {
  for (const [id, a] of Object.entries(C8B_ABILITIES)) {
    assert.equal(ABILITIES[id], a, id);
    const s = firstSentence(a.desc);
    assert.ok(s.endsWith('。') && s.length <= 32, `${id}: ${s}（${s.length}字）`);
  }
});

test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(C8B_ABILITIES).map((a) => a.anim).filter((a) => /^b8[nih]_/.test(a)))];
  assert.ok(own.length >= 36, `${own.length}`);
  for (const a of own) {
    assert.equal(playC8bFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8aFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playC7iFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
  }
  assert.equal(playC8bFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C8B_SCREEN_ANIMS, ...Object.keys(C8B_ALLY_FX), ...Object.keys(C8B_SFX)]) assert.ok(own.includes(a), a);
  for (const a of ['b8i_fuse', 'b8h_contract', 'b8h_anger', 'b8h_erupt']) assert.ok(C8B_SCREEN_ANIMS.includes(a), a);
  for (const [k, v] of Object.entries(C8B_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.6, 0.99]) {
    C8B_FINE.c8bghost(x, { x: 100, y: 30, size: 60, col: '#e8f0ff', age: t * 1300 }, t);
    C8B_FINE.c8bscroll(x, { x: 100, y: 60, size: 16, age: t * 1300 }, t);
  }
  assert.equal(C8A_FINE.c8bghost, C8B_FINE.c8bghost);
});

test('がめん: ばけばけ・けいやく・ふん火の しるし・ひそひそ・けんか・あたふた・カンカン・ちらちら・けいやくされた 人の まど・バナー', () => {
  for (const id of C8B_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id) && C8A_OWN_TELE.includes(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 1000, c: new Map() };
  const n = () => drawn.length;
  for (const c of [
    { species: C8_PAIN, impLeft: 2, impEvery: 6, plot: 1 },
    { species: C8_PANIC, impLeft: 4, impEvery: 6, quarrel: 1 },
    { species: C8_PAIN, panicLeft: 2, panicK: 1.5, impForm: 2 },
    { species: C8_PANIC, rage: 1, soloLeft: 1, soloEvery: 2, impForm: 2 },
    { species: C8_HADES, c8hform: 1, contractLeft: 1, contractEvery: 4, flicker: 1 },
    { species: C8_HADES, c8hform: 1, bound: 'a1', soulLeft: 0, hot: 1 },
    { species: C8_HADES, c8hform: 2, eruptLeft: 1, eruptEvery: 3, cool: 1 },
  ]) {
    const m = n();
    c8bDraw(scene, x, null, { alive: true, ...c }, 100, 20, 112, 112, 1);
    assert.ok(n() > m + 4, JSON.stringify(c));
  }
  assert.ok(drawn.includes('fillText'));
  // けいやくされた 人の まど
  const boxes = new Map();
  const box = () => {
    const set = new Set();
    return { classList: { toggle: (c, on) => (on ? set.add(c) : set.delete(c)), has: (c) => set.has(c) } };
  };
  boxes.set('a1', { box: box() });
  boxes.set('a2', { box: box() });
  const allies = [{ id: 'a1', alive: true, name: '勇者', status: [] }, { id: 'a2', alive: true, name: '大賢者', status: [] }];
  const sc = {
    game: { audio: { sfx() {} } }, banners: [], banner(t, cls) { this.banners.push([t, cls]); }, shake() {},
    c: new Map([['a1', allies[0]], ['a2', allies[1]], ['p', { name: 'ペイニック' }]]), allies: () => allies, statusBoxes: boxes,
  };
  c8bPresent(sc, { c8bContract: { who: 'a1' } }, {}, null, null);
  assert.ok(boxes.get('a1').box.classList.has('c8b-bound') && !boxes.get('a2').box.classList.has('c8b-bound'));
  assert.ok(sc.banners[0][0].includes('勇者') && sc.banners[0][1] === 'danger');
  c8bPresent(sc, { c8bBurnt: { who: 'a1' } }, {}, null, null);
  assert.ok(!boxes.get('a1').box.classList.has('c8b-bound'));
  c8bMarks(sc);
  // バナー
  sc.banners = [];
  c8bPresent(sc, { c8bImpLeft: { left: 2, plot: true } }, {}, null, null);
  c8bPresent(sc, { c8bImpLeft: { left: 1, plot: true } }, {}, null, null);
  c8bPresent(sc, { c8bQuarrel: { id: 'p' } }, {}, null, null);
  c8bPresent(sc, { c8bPanic: { id: 'p', k: 1.5 } }, {}, null, null);
  c8bPresent(sc, { c8bFlicker: { id: 'h' } }, {}, null, null);
  c8bPresent(sc, { c8bAnger: { id: 'h' } }, {}, null, null);
  c8bPresent(sc, { c8bEruptLeft: { left: 1 } }, {}, null, null);
  c8bPresent(sc, { c8bCool: { id: 'h' } }, {}, null, null);
  assert.equal(sc.banners.length, 8);
  assert.deepEqual(sc.banners.map((b) => b[1]), ['danger', 'danger', 'combo', 'combo', 'danger', 'danger', 'danger', 'combo']);
});

test('背景・曲: よみの 海底神殿（2つ）・よみの王の 間。曲は パートの ながさが そろう', () => {
  for (const id of ['yomi_temple', 'yomi_deep', 'yomi_throne']) {
    const d = battleBgSpec(id);
    assert.ok(d && d.deco === id && d.sky.length >= 3 && d.ground.length === 2, id);
  }
  for (const id of ['yomi_imps', 'yomi_king']) {
    const tr = _TRACKS[id];
    assert.ok(tr && tr.bpm > 0 && tr.ch.length >= 4, id);
  }
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし', () => {
  const files = ['monsters-c8b.js', 'abilities-c8b.js', 'items-c8b.js', 'encounters-c8b.js', 'companions-c8b.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-c8b.js', 'public/js/client/battle-c8b.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full), [], f);
  }
});
