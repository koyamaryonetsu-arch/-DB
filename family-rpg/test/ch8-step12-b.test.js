// 第2部 第8章 第1幕（Step 1・2）B（戦い・品）「月の王宮の うらぎり」
// 名前の 約束（docs/plan-ch8.md の 5-2）・手下の 魔物 5しゅ（どれも 仲間に なる・ランク・まぜ配合・素材の 入手先）・出現表・
// オウムのイアゴン（聞き耳 → オウムがえし。何も おぼえて いないと 目を まわす）・
// 大臣ジャハール（へびのつえの さいみんじゅつ → 大きな コブラの とぐろ → ランプの 魔人と 黒いランプ）・知っている 人と ふつうの オート・
// 月の王宮の 地下迷宮の 宝箱（★5 装備 1つ ＋ 素材か 道具 1つ）・ボスの 品・手紙の ごほうび・
// 細かく 描いた ボスの え（2倍の こまかさ・artScale 0.5。ジャハールの コブラは コマ 2・3・魔人は 4・5）・エフェクト・がめん・技の せつめい（1文め）・文字
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
import { MONSTERS_C8A, C8_PET, C8_JAFAR, C8_STAFF, C8_LAMP, C8A_MINIONS, C8A_MAT_DROPS, C8A_HIDDEN, COBRA_ACTIONS, GENIE_ACTIONS } from '../public/js/shared/data/monsters-c8a.js';
import { C8A_ABILITIES } from '../public/js/shared/data/abilities-c8a.js';
import { FRIENDS_C8A } from '../public/js/shared/data/companions-c8a.js';
import { ENCOUNTERS_C8A, FIXED_C8A, ZONE_BG_C8A } from '../public/js/shared/data/encounters-c8a.js';
import { ITEMS_C8A, C8A_TREASURE, C8A_TREASURE_N, c8aChest, C8A_LETTER_REWARDS, C8A_DROPS, C8A_K, C8A_ITEM_KANA } from '../public/js/shared/data/items-c8a.js';
import { ITEMS_C8C } from '../public/js/shared/data/items-c8c.js';
import { C7I_K } from '../public/js/shared/data/items-c7i.js';
import {
  ECHO, DIZZY, HYPNO, DAZE, COBRA, COIL, STRIKE, GENIE, BLAST, SEALED, COBRA_NAME, GENIE_NAME,
  parrotConf, vizierConf, listening, staffUp, lampUp, staffOf, lampOf, formOf, echoBefore, vizierBigBefore, c8aPlan, c8aEffect,
} from '../public/js/shared/battle-c8a.js';
import { c7iPlan } from '../public/js/shared/battle-c7i.js';
import { AUTO_GUARD } from '../public/js/shared/battle-ch6.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch8Run, ch8Party, CH8_KIT, CH8_LV } from '../tools/sim-ch8.mjs';
import { rankPoints, BANDS } from '../tools/gen-monster-ranks.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC8aFx, C8A_FINE } from '../public/js/client/render/battlefx-c8a.js';
import { playC7iFx, C7I_FINE } from '../public/js/client/render/battlefx-c7i.js';
import { playC7sFx } from '../public/js/client/render/battlefx-c7s.js';
import { playTokei6Fx } from '../public/js/client/render/battlefx-tokei6.js';
import { C8A_SCREEN_ANIMS, C8A_ALLY_FX, C8A_SFX, C8A_OWN_TELE, c8aDraw, c8aPresent, c8aMarks, c8aSprite } from '../public/js/client/battle-c8a.js';
import { c7iSprite } from '../public/js/client/battle-c7i.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

// ねらった 系統と ランク（docs/plan-r53-breed-more.md の 1 の 足りない 所。第7章の あとで 少ない 所）
const WANT = { palace_guard: ['demon', 'F'], sanbo: ['plant', 'E'], cobrar: ['dragon', 'D'], lamp_smoke: ['spirit', 'C'], moon_scarab: ['beast', 'A'] };
const BOSS = { pet: C8_PET, jafar: C8_JAFAR };
const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
// ゲストの カリムは A の 物語の ゲスト（ここでは 4人。シミュレーターは カリムも）
function bossBattle(boss, seed = 3) {
  const party = ch8Party(boss, CH8_LV[boss]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  const enemies = FIXED_ENCOUNTERS[BOSS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));
  return new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies });
}
const dmgOf = (ev) => (ev.results || []).reduce((s, r) => s + (r.dmg || 0), 0);
const effect = (b, c, id) => {
  const ev = ev0();
  assert.ok(c8aEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id);
  return ev;
};
const jafarOf = (b) => b.enemies.find((e) => e.species === C8_JAFAR);
// 味方の 呪文の 行動（ev.ability つき）で 敵に ダメージ
const spellHit = (b, c, t, n = 500, id = 'merazoma', element = 'fire') => {
  const ev = { ...ev0(), id: c.id, ability: id };
  b.damage(c, t, n, ev, { element });
  return ev;
};
const physHitEv = (b, c, t, n = 500) => {
  const ev = { ...ev0(), id: c.id };
  b.damage(c, t, n, ev, { element: 'phys', phys: true });
  return ev;
};
// ジャハールを その だんへ（2 … コブラ・3 … 魔人）
function toForm(b, w, form) {
  const vc = vizierConf(w);
  if (form >= 2) {
    w.hp = Math.floor(w.maxHp * (vc.p2At - 0.02));
    effect(b, w, COBRA);
  }
  if (form >= 3) {
    w.hp = Math.floor(w.maxHp * (vc.p3At - 0.02));
    effect(b, w, GENIE);
  }
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 5-2）: c8_vizier_pet・c8_jafar・t8a_palace・t8a_deep・C8A_TREASURE・C8A_LETTER_REWARDS', () => {
  for (const id of [C8_PET, C8_JAFAR]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_C8A[id]);
    assert.ok(f.boss && f.canFlee === false && !f.loseOk && f.bgm && f.bg, id);
    assert.equal(f.group[0][0], id, 'showMon と おなじ 魔物');
    const m = MONSTERS[id];
    assert.ok(m?.boss && MONSTER_ART[id], id);
    assert.ok(m.drops.bonus.includes('limit_stone'), id);
  }
  assert.equal(MONSTERS[C8_PET].lv, 81);
  assert.equal(MONSTERS[C8_JAFAR].lv, 83);
  assert.equal(MONSTERS[C8_PET].name, 'オウムのイアゴン');
  assert.equal(MONSTERS[C8_JAFAR].name, '大臣ジャハール');
  // へびのつえは ジャハールと いっしょに 出る・黒いランプは 3だんめで あらわれる（数えない 形）
  assert.deepEqual(FIXED_C8A[C8_JAFAR].group.map((g) => g[0]), [C8_JAFAR, C8_STAFF]);
  for (const id of [C8_STAFF, C8_LAMP]) assert.ok(MONSTERS[id] && !Object.keys(MONSTERS).includes(id) && C8A_HIDDEN[id], id);
  assert.deepEqual(MONSTERS[C8_JAFAR].minionsFall, [C8_STAFF, C8_LAMP]);
  assert.deepEqual(Object.keys(ENCOUNTERS_C8A), ['t8a_palace', 't8a_deep']);
  for (const z of ['t8a_palace', 't8a_deep']) {
    assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C8A[z]);
    assert.equal(ZONE_BG[z], ZONE_BG_C8A[z]);
    assert.equal(rankPoints(ENCOUNTERS_C8A[z][0].group[0][0]).band, '第8章');
  }
  // 出現表の 魔物の レベル（1〜4階 Lv80〜82・5〜8階 Lv82〜84 の あたり）
  const lvs = (z) => ENCOUNTERS_C8A[z].flatMap((e) => e.group.map((g) => MONSTERS[g[0]].lv));
  assert.ok(lvs('t8a_palace').every((lv) => lv >= 77 && lv <= 82));
  assert.ok(lvs('t8a_deep').every((lv) => lv >= 78 && lv <= 84) && Math.max(...lvs('t8a_deep')) >= 83);
  assert.deepEqual(Object.keys(C8A_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const list of Object.values(C8A_TREASURE)) assert.equal(list.length, 2);
  assert.deepEqual(Object.keys(C8A_LETTER_REWARDS).map(Number), [1, 2, 3]);
  for (const list of Object.values(C8A_LETTER_REWARDS)) for (const [id, n] of list) assert.ok(ITEMS[id] && n >= 1, id);
});

// ───────────── 手下の 魔物 ─────────────
test('手下の 魔物 5しゅ: どれも 仲間に なる・ねらった 系統と ランク・出現表に 出る・Lv80〜84・素材の 入手先', () => {
  assert.deepEqual(C8A_MINIONS.slice().sort(), Object.keys(WANT).sort());
  const zoneOf = (sp) => Object.entries(ENCOUNTERS_C8A).filter(([, t]) => t.some((e) => e.group.some((g) => g[0] === sp))).map(([z]) => z);
  for (const [sp, [race, rank]] of Object.entries(WANT)) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_C8A[sp]);
    assert.equal(f, FRIENDS_C8A[sp]);
    assert.equal(m.race, race, sp);
    assert.ok(f.rate > 0 && !f.breedOnly && joinTier(sp), `${sp}: 仲間に なる`);
    assert.equal(MONSTER_RANKS[sp], rank, `${sp}: ランクの 表`);
    assert.equal(rankOf(sp, MONSTERS), rank, sp);
    assert.equal(rankPoints(sp).rank, rank, `${sp}: gen-monster-ranks と おなじ`);
    assert.equal(rankPoints(sp).band, '第8章');
    assert.ok(m.lv >= 80 && m.lv <= 84 && m.region === 6, sp);
    assert.ok(zoneOf(sp).length >= 1, `${sp}: 出現表`);
    assert.ok(!m.boss && m.desc && f.note && f.names.length === 4, sp);
    // 素材（今の 素材だけ）。入手先の 画面に 出る（第64回 ⑥a）
    assert.ok(MAT_DROPS[sp] && C8A_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', sp);
    assert.ok(monsterDrops(sp).some((d) => d.item === MAT_DROPS[sp][0]), `${sp}: 落とす 物`);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok((sum >= 5.8 && sum <= 6.1) || (sum >= 6.8 && sum <= 7.3), `${sp}: growth ${sum.toFixed(2)}`);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id] && !/^c8a/.test(ABILITIES[id].effect.type) && ABILITIES[id].effect.type !== 'callHelp', `${sp}: ${id}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const id of [m.drops.common?.[0], m.drops.rare?.[0]]) assert.ok(ITEMS[id], `${sp}: ${id}`);
    // レアの ドロップは 店の 品（宝箱の 品は 宝箱だけ）
    assert.ok(ITEMS[m.drops.rare[0]].price > 0 && !ITEMS_C8A[m.drops.rare[0]], sp);
  }
  assert.ok(BANDS.includes('第8章'));
  // 第8章の B〜S は 2わりまで（test/monsters-r43a）。F〜C が そろう
  const ch8 = Object.keys(MONSTER_RANKS).filter((sp) => rankPoints(sp).band === '第8章');
  assert.ok(ch8.filter((sp) => ['B', 'A', 'S'].includes(MONSTER_RANKS[sp])).length <= Math.max(2, ch8.length * 0.2));
  for (const r of ['F', 'E', 'D', 'C']) assert.ok(ch8.some((sp) => MONSTER_RANKS[sp] === r), r);
});

test('配合: 5しゅ みんな 系統まぜ配合（mix）の 子・系統配合の 子は A の 月のスカラベだけ', () => {
  for (const sp of C8A_MINIONS) {
    const f = FRIENDS_C8A[sp], race = MONSTERS[sp].race;
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
test('絵: 新しい 絵 3しゅ・のこり 2しゅは 今の 絵の 色がえ。ボスは 2倍の こまかさ（artScale 0.5）・ジャハールの コブラは コマ 2・3、魔人は 4・5', () => {
  let fresh = 0;
  for (const sp of C8A_MINIONS) {
    const m = MONSTERS[sp];
    if (MONSTER_ART[sp]) fresh++;
    else assert.ok(m.art && MONSTER_ART[m.art] && m.tint, `${sp}: 色がえ`);
    assert.equal(monsterFine(sp), 1, `${sp}: 手下は 今までの こまかさ`);
  }
  assert.equal(fresh, 3, '新しい 絵は 3しゅ まで');
  for (const id of ['palace_guard', 'sanbo', 'lamp_smoke', C8_STAFF, C8_LAMP, C8_PET]) {
    const [a, b] = palCheck(id, [0, 1]);
    assert.notEqual(a, b, `${id}: コマで うごく`);
  }
  const [j0, j1, c0, c1, g0, g1] = palCheck(C8_JAFAR, [0, 1, 2, 3, 4, 5]);
  assert.ok(j0 !== j1 && c0 !== c1 && g0 !== g1 && j0 !== c0 && c0 !== g0 && j0 !== g0, '魔術師・コブラ・魔人は ちがう え');
  for (const id of [C8_STAFF, C8_LAMP]) assert.equal(monsterFine(id), 1, `${id}: 今までの こまかさ`);
  // ボス: え の size は 今までの ボスの 2倍・artScale 0.5・見た目は 今までの ボスと おなじ くらい
  for (const id of [C8_PET, C8_JAFAR]) {
    assert.equal(MONSTERS[id].artScale, 0.5, id);
    assert.equal(monsterFine(id), 2, id);
    assert.equal(MONSTER_ART[id].npc, 0.6, id);
    const [w, h] = monsterSize(id);
    assert.ok(w >= 96 && w <= 128 && h >= 90 && h <= 130, `${id}: 見た目 ${w}×${h}`);
    assert.deepEqual(MONSTER_ART[id].size, [w * 2, h * 2]);
  }
  // 変身の え（pub の c8form 2・3 の ときだけ。battle-c7i.js の c7iSprite から よばれる）
  assert.equal(c8aSprite({ species: C8_JAFAR, c8form: 1 }, 0), null);
  assert.equal(c8aSprite({ species: C8_PET }, 0), null);
  assert.equal(c7iSprite({ species: C8_JAFAR, c8form: 1 }, 0), null);
});

// ───────────── オウムのイアゴン ─────────────
test('イアゴン: 聞き耳の 間に 当たった 呪文・合体技だけ おぼえる（物理・聞き耳の 外は おぼえない。max まで）', () => {
  const pc = parrotConf({ species: C8_PET });
  const b = bossBattle('pet');
  const p = b.enemies[0];
  const hero = b.allies[0];
  assert.ok(p.c8par && !listening(p));
  assert.equal(p.c8par.left, pc.every);
  assert.equal(pub(p).echoEvery, pc.every);
  // 聞き耳の 外: おぼえない
  spellHit(b, hero, p);
  assert.equal(p.c8par.words.length, 0);
  // listen に なるまで 動く
  for (let i = 0; i < pc.every - pc.listen; i++) assert.ok(turn(b, p).c8aParrot);
  assert.ok(listening(p) && pub(p).listen === 1);
  physHitEv(b, hero, p);
  assert.equal(p.c8par.words.length, 0, '物理は おぼえない');
  const ev = spellHit(b, hero, p, 500, 'merazoma', 'fire');
  assert.ok(ev.c8aLearn && p.c8par.words.length === 1 && p.c8par.words[0].el === 'fire');
  // 1回の 行動で 1つ（みんなへの 呪文でも）
  b.damage(hero, p, 300, ev, { element: 'fire' });
  assert.equal(p.c8par.words.length, 1);
  // 合体技（物理で ない）も おぼえる
  const dev = { ...ev0(), id: hero.id, dual: { id: 'x', name: 'クロス魔法剣' } };
  b.damage(hero, p, 500, dev, { element: 'light' });
  assert.equal(p.c8par.words.length, 2);
  for (let i = 0; i < 4; i++) spellHit(b, hero, p, 100, 'hyadaruko', 'ice');
  assert.equal(p.c8par.words.length, pc.max, 'max まで');
  assert.deepEqual(pub(p).words.length, pc.max);
});

test('イアゴン: オウムがえしは おぼえた 数だけ 強い（身を 守ると 半分）・何も ないと しっぱいして 目を まわす', () => {
  const pc = parrotConf({ species: C8_PET });
  const echoDmg = (n, guard) => {
    const b = bossBattle('pet', 11);
    const p = b.enemies[0];
    p.c8par.left = pc.listen;
    for (let i = 0; i < n; i++) spellHit(b, b.allies[i % b.allies.length], p, 100, 'merazoma', 'fire');
    for (const x of b.allies) x.defending = guard;
    const ev = effect(b, p, ECHO);
    assert.equal(ev.c8aEcho.n, n);
    assert.equal(p.c8par.words.length, 0, 'はね返すと わすれる');
    assert.equal(p.c8par.left, pc.every);
    return dmgOf(ev);
  };
  const one = echoDmg(1, false), three = echoDmg(3, false), guarded = echoDmg(3, true);
  assert.ok(three > one * 2, `${three} / ${one}`);
  assert.ok(guarded < three * 0.6, `${guarded} / ${three}`);
  // 何も おぼえて いない: しっぱい → 次の 番は 目を まわす（動けない）・守りが 下がる
  const b = bossBattle('pet', 4);
  const p = b.enemies[0];
  const ev = effect(b, p, ECHO);
  assert.ok(ev.c8aEcho.n === 0 && dmgOf(ev) === 0 && p.c8par.dizzy && p.debuffs.def);
  assert.equal(pub(p).dizzy, 1);
  turn(b, p);
  assert.equal(p.telegraph, DIZZY);
  p.telegraph = null;
  assert.ok(!p.c8par.dizzy);
  // しるしが 1つで オウムがえし
  p.c8par.left = 1;
  turn(b, p);
  assert.equal(p.telegraph, ECHO);
  // HP が へると はやく なる
  const b2 = bossBattle('pet', 5);
  const p2 = b2.enemies[0];
  p2.hp = Math.floor(p2.maxHp * (pc.p2At - 0.05));
  turn(b2, p2);
  assert.ok(p2.c8par.left <= pc.p2Every - 1);
  assert.equal(pub(p2).echoEvery, pc.p2Every);
});

test('イアゴン: 知っている 人は 聞き耳の 間は 呪文を 当てない・オウムがえしの 前に 守る。ふつうの オートは HPが へっていれば よく 守る', () => {
  const b = bossBattle('pet');
  const p = b.enemies[0];
  b.knowsCh6 = true;
  const sage = b.allies[1];
  p.c8par.left = 2;
  assert.ok(listening(p));
  let spells = 0;
  for (let i = 0; i < 30; i++) {
    const cmd = c8aPlan(b, sage, decideAlly);
    if (cmd?.type === 'ability' && ABILITIES[cmd.id]?.effect?.type === 'magic' && ['enemy', 'enemies', 'group'].includes(ABILITIES[cmd.id].target)) spells++;
  }
  assert.equal(spells, 0, '聞き耳の 間は 呪文を 当てない');
  // おぼえて いれば、オウムがえしの 前に 守る
  p.c8par.words.push({ id: 'merazoma', el: 'fire', name: 'メラゾーマ' });
  p.telegraph = ECHO;
  assert.ok(echoBefore(b, sage, p));
  assert.deepEqual(c8aPlan(b, sage, decideAlly), { type: 'defend' });
  assert.deepEqual(c7iPlan(b, sage, decideAlly), { type: 'defend' }, 'battle-c7i.js から よばれる');
  b.c6NoGuard = true;
  assert.notEqual(c8aPlan(b, sage, decideAlly)?.type, 'defend');
  // 何も おぼえて いなければ 守らない（しっぱいを まつ）
  b.c6NoGuard = false;
  p.c8par.words = [];
  assert.ok(!echoBefore(b, sage, p));
  // ふつうの オート
  const b2 = bossBattle('pet', 8);
  const p2 = b2.enemies[0];
  p2.c8par.words.push({ id: 'merazoma', el: 'fire', name: 'メラゾーマ' });
  p2.telegraph = ECHO;
  const h2 = b2.allies[0];
  h2.hp = Math.round(h2.maxHp * 0.5);
  let guards = 0;
  for (let i = 0; i < 40; i++) if (c8aPlan(b2, h2, decideAlly)?.type === 'defend') guards++;
  assert.ok(guards > 10 && guards < 40, `守った ${guards}/40`);
  h2.hp = h2.maxHp;
  assert.equal(c8aPlan(b2, h2, decideAlly), null, `HPが ${AUTO_GUARD.hp} いじょうは 守らない`);
  assert.equal(monsterDrops(C8_PET).filter((x) => x.kind === 'boss').length, 1);
});

// ───────────── 大臣ジャハール ─────────────
test('ジャハール（魔術師）: every 回で さいみんじゅつ（1人 こんらん）→ へびのつえを こわすと とけて うろたえる・regrow 回で もどる', () => {
  const vc = vizierConf({ species: C8_JAFAR });
  const b = bossBattle('jafar');
  const w = jafarOf(b), st = staffOf(b);
  const hero = b.allies[0];
  assert.ok(w.c8viz && formOf(w) === 1 && staffUp(b) && !lampUp(b));
  assert.equal(pub(w).c8form, 1);
  assert.equal(pub(st).c8staff, 1);
  assert.equal(pub(w).hypnoEvery, vc.staff.every);
  for (let i = 0; i < vc.staff.every - 1; i++) assert.ok(turn(b, w).c8aHypnoLeft);
  turn(b, w, { type: 'incapacitated' });
  assert.equal(w.telegraph, null, '動けない 番は 次へ');
  turn(b, w);
  assert.equal(w.telegraph, HYPNO);
  w.telegraph = null;
  for (const x of b.allies) x.resist.confuse = 1;
  const ev = effect(b, w, HYPNO);
  assert.equal(ev.c8aHypno.who.length, vc.staff.hypno.n);
  const who = b.get(ev.c8aHypno.who[0]);
  assert.ok(who.status.confuse);
  // つえを こわす
  const e2 = ev0();
  b.damage(hero, st, st.hp + 10, e2, { element: 'light' });
  assert.ok(!st.alive && e2.c8aBreak && !staffUp(b));
  assert.ok(!who.status.confuse, 'あやつられた 人が 目を さます');
  assert.ok(w.c8viz.daze && w.c8viz.down === vc.staff.regrow);
  turn(b, w);
  assert.equal(w.telegraph, DAZE, 'うろたえて 1回 動けない');
  w.telegraph = null;
  // つえが ない 間は しるしが すすまない・regrow 回で もどる（うろたえた 番も 1回）
  const left = w.c8viz.left;
  for (let i = 0; i < vc.staff.regrow - 2; i++) {
    turn(b, w);
    w.telegraph = null;
    assert.ok(!st.alive);
  }
  assert.equal(w.c8viz.left, left);
  const e3 = turn(b, w);
  assert.ok(st.alive && e3.c8aStaffBack && st.hp === st.maxHp);
  // つえは 光が よく効く
  assert.ok(MONSTERS[C8_STAFF].resist.light > 1);
});

test('ジャハール: HP が p2At より へると 次の 番に 大きな コブラへ（それまで HP は p2At より 下がらない）。つえは 消える', () => {
  const vc = vizierConf({ species: C8_JAFAR });
  const b = bossBattle('jafar');
  const w = jafarOf(b), st = staffOf(b);
  const hero = b.allies[0];
  const floor = Math.ceil(w.maxHp * vc.p2At - 1e-6) - 1;
  w.hp = floor + 500;
  b.damage(hero, w, 30000, ev0(), { element: 'phys' });
  assert.equal(w.hp, floor, 'いっきに たおせない');
  turn(b, w);
  assert.equal(w.telegraph, COBRA);
  w.telegraph = null;
  const atk = w.atk;
  const ev = effect(b, w, COBRA);
  assert.ok(ev.c8aCobra && formOf(w) === 2 && w.name === COBRA_NAME);
  assert.ok(!st.alive, 'つえは 消える');
  assert.ok(w.atk > atk);
  assert.deepEqual(w.actions.map((a) => a.id), COBRA_ACTIONS.map((a) => a.id));
  assert.equal(pub(w).c8form, 2);
  // コブラの 間は つえが もどらない
  for (let i = 0; i < 6; i++) {
    turn(b, w);
    w.telegraph = null;
    w.c8viz.coiled = false;
  }
  assert.ok(!st.alive);
});

test('ジャハール（コブラ）: とぐろの 間に 攻撃すると かみつかれ、いちげきが 強く なる。だれも 攻撃しないと からぶりして のびきる（×1.5）', () => {
  const vc = vizierConf({ species: C8_JAFAR });
  const strikeDmg = (attacks) => {
    const b = bossBattle('jafar', 6);
    const w = jafarOf(b);
    toForm(b, w, 2);
    w.c8viz.left = 1;
    turn(b, w);
    assert.equal(w.telegraph, COIL);
    w.telegraph = null;
    const ce = effect(b, w, COIL);
    assert.ok(ce.c8aCoil && w.c8viz.coiled && pub(w).coiled === 1);
    let bites = 0;
    for (let i = 0; i < attacks; i++) {
      const x = b.allies[i % b.allies.length];
      const before = x.hp;
      const ev = physHitEv(b, x, w, 200);
      if (ev.c8aBite) bites++;
      assert.ok(ev.c8aBite && (x.hp < before || ev.results.some((r) => r.id === x.id)), 'かみつかれる');
    }
    assert.equal(w.c8viz.counters, bites);
    turn(b, w);
    assert.equal(w.telegraph, STRIKE, 'とぐろの 次は かならず いちげき');
    w.telegraph = null;
    for (const x of b.allies) Object.assign(x, { alive: true, hp: x.maxHp, defending: false });
    const ev = effect(b, w, STRIKE);
    return { ev, w, b };
  };
  const one = strikeDmg(1), three = strikeDmg(3);
  assert.ok(one.ev.c8aStrike && three.ev.c8aStrike.n === 3);
  assert.ok(dmgOf(three.ev) > dmgOf(one.ev) * 1.2, `${dmgOf(three.ev)} / ${dmgOf(one.ev)}`);
  // だれも 攻撃しない: からぶり → のびきる
  const none = strikeDmg(0);
  assert.ok(none.ev.c8aWhiff && dmgOf(none.ev) === 0);
  const { w, b } = none;
  assert.equal(w.c8viz.open, vc.cobra.open.turns);
  assert.equal(pub(w).openK, vc.cobra.open.k);
  const hp = w.hp;
  b.damage(b.allies[0], w, 1000, ev0(), { element: 'phys', phys: true });
  assert.equal(hp - w.hp, Math.round(1000 * vc.cobra.open.k));
  // とぐろで ない ときは かみつかない
  const e2 = physHitEv(b, b.allies[0], w, 100);
  assert.ok(!e2.c8aBite);
});

test('ジャハール（コブラ）: 知っている 人は とぐろの 間は 攻撃しない。HP が p3At より へると ランプの 魔人（黒いランプが あらわれる）', () => {
  const vc = vizierConf({ species: C8_JAFAR });
  const b = bossBattle('jafar');
  const w = jafarOf(b);
  b.knowsCh6 = true;
  toForm(b, w, 2);
  w.c8viz.coiled = true;
  for (const x of b.allies) {
    const cmd = c8aPlan(b, x, decideAlly);
    assert.ok(!['attack', 'dual'].includes(cmd?.type) && !(cmd?.type === 'ability' && ['phys', 'magic'].includes(ABILITIES[cmd.id]?.effect?.type) && ABILITIES[cmd.id].target !== 'ally'), JSON.stringify(cmd));
  }
  b.c8aNoCoil = true;
  assert.ok(b.allies.some((x) => ['attack', 'ability'].includes(c8aPlan(b, x, decideAlly)?.type)));
  b.c8aNoCoil = false;
  w.c8viz.coiled = false;
  // 魔人へ
  const floor = Math.ceil(w.maxHp * vc.p3At - 1e-6) - 1;
  w.hp = floor + 300;
  b.damage(b.allies[0], w, 20000, ev0(), { element: 'phys' });
  assert.equal(w.hp, floor);
  turn(b, w);
  assert.equal(w.telegraph, GENIE);
  w.telegraph = null;
  const n = b.enemies.length;
  const ev = effect(b, w, GENIE);
  assert.ok(ev.c8aGenie && formOf(w) === 3 && w.name === GENIE_NAME);
  assert.deepEqual(w.actions.map((a) => a.id), GENIE_ACTIONS.map((a) => a.id));
  assert.equal(b.enemies.length, n + 1);
  const lamp = lampOf(b);
  assert.ok(lamp?.alive && lampUp(b) && ev.c8aGenie.lamp === lamp.id);
  assert.ok(ev.joined?.some((x) => x.id === lamp.id), 'がめんに 足す（ev.joined）');
  assert.equal(pub(lamp).c8lamp, 1);
  assert.equal(pub(w).c8form, 3);
  // 魔人の 間は HP の 下かぎりが ない
  const hp = w.hp;
  b.damage(b.allies[0], w, 1000, ev0(), { element: 'phys' });
  assert.equal(hp - w.hp, 1000);
});

test('ジャハール（魔人）: every 回で むげんの魔力（守ると 半分）。黒いランプを こわすと ランプに すいこまれる（動けない・×1.6）→ 出てくると ランプが また ともる', () => {
  const vc = vizierConf({ species: C8_JAFAR });
  const blastDmg = (guard) => {
    const b = bossBattle('jafar', 9);
    const w = jafarOf(b);
    toForm(b, w, 3);
    assert.equal(w.c8viz.left, vc.genie.every);
    for (let i = 0; i < vc.genie.every - 1; i++) assert.ok(turn(b, w).c8aBlastLeft);
    turn(b, w);
    assert.equal(w.telegraph, BLAST);
    assert.ok(vizierBigBefore(b, b.allies[0], w));
    w.telegraph = null;
    for (const x of b.allies) x.defending = guard;
    const ev = effect(b, w, BLAST);
    assert.ok(ev.c8aBlast);
    return dmgOf(ev);
  };
  const open = blastDmg(false), guarded = blastDmg(true);
  assert.ok(open > 0 && guarded < open * 0.6, `${guarded} / ${open}`);
  // ランプを こわす
  const b = bossBattle('jafar', 2);
  const w = jafarOf(b);
  toForm(b, w, 3);
  const lamp = lampOf(b);
  w.telegraph = BLAST;
  const hp0 = lamp.maxHp;
  const ev = ev0();
  b.damage(b.allies[0], lamp, lamp.hp + 10, ev, { element: 'bolt' });
  assert.ok(!lamp.alive && ev.c8aSeal && w.c8viz.seal > 0);
  assert.equal(w.telegraph, null, 'ならべて いた 大技は とりやめ');
  assert.ok(!vizierBigBefore(b, b.allies[0], w));
  assert.equal(pub(w).sealK, vc.genie.seal.k);
  const hp = w.hp;
  b.damage(b.allies[0], w, 1000, ev0(), { element: 'phys' });
  assert.equal(hp - w.hp, Math.round(1000 * vc.genie.seal.k));
  for (let i = 0; i < vc.genie.seal.turns; i++) {
    turn(b, w);
    assert.equal(w.telegraph, SEALED, `${i}: ランプの 中は 動けない`);
    w.telegraph = null;
  }
  const out = turn(b, w);
  assert.ok(out.c8aOut && lamp.alive && w.c8viz.seal === 0);
  assert.equal(lamp.maxHp, Math.round(hp0 * vc.genie.lampGrow), 'ランプは 少し かたく なる');
  // 知っている 人は ランプを ねらう
  b.knowsCh6 = true;
  let onLamp = 0;
  for (const x of b.allies) if (c8aPlan(b, x, decideAlly)?.target === lamp.id) onLamp++;
  assert.ok(onLamp >= 2, `${onLamp}`);
  // 魔人を たおすと ランプも くだけて 戦いが おわる
  b.damage(b.allies[0], w, w.hp + 10, ev0(), { element: 'phys' });
  assert.ok(!w.alive && !lamp.alive);
  b.checkEnd();
  assert.equal(b.pendingEnd?.outcome, 'win');
  assert.equal(monsterDrops(C8_JAFAR).filter((x) => x.kind === 'boss').length, 1);
});

test('シミュレーター: 知っている 人・知らない 人・完全オートで 戦いが おわる（しかけが 動く）。ゲストの カリムと いっしょ', () => {
  const r = ch8Run('pet', 81, true, 8080);
  assert.ok(['win', 'lose'].includes(r.outcome) && r.empties >= 1, JSON.stringify(r));
  const t = ch8Run('pet', 81, true, 8081, { skip: 'trick' });
  assert.ok(t.learned >= 1 && t.echoes >= 1, JSON.stringify(t));
  const j = ch8Run('jafar', 83, true, 8080);
  assert.ok(['win', 'lose'].includes(j.outcome) && j.breaks >= 1 && j.cobra === 1 && j.coils >= 1 && j.whiffs >= 1, JSON.stringify(j));
  if (j.outcome === 'win') assert.ok(j.genie === 1 && j.seals >= 1, JSON.stringify(j));
  const a = ch8Run('jafar', 83, false, 8081);
  assert.ok(['win', 'lose', 'timeout'].includes(a.outcome));
  for (const boss of ['pet', 'jafar']) for (const [job, list] of Object.entries(CH8_KIT[boss])) for (const id of list) if (id) assert.ok(ITEMS[id] && canEquip(job, id), `${job}: ${id}`);
});

// ───────────── 品 ─────────────
test('宝箱: 月の王宮の 地下迷宮 1〜8階に ★5の 装備 1つ（レア度4・src c8a）と 素材か 道具 1つ。第7章 第3幕の 氷の竜の城より 強い', () => {
  const ks = Object.values(C8A_K);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] > ks[i - 1]);
  assert.ok(C8A_K[1] > C7I_K[8]);
  const gear = Object.values(C8A_TREASURE).map((x) => x[0]);
  assert.equal(new Set(gear).size, 8);
  for (const id of gear) {
    const it = ITEMS[id];
    assert.ok(it === ITEMS_C8A[id] && it.rank === 10 && it.rarity === 4 && it.src === 'c8a', id);
    assert.ok(['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), id);
    assert.equal(starsOf(id), 5, id);
    assert.equal(rareWhereText(id), '月の王宮の地下迷宮の宝箱でしか手に入らない');
    assert.ok(it.desc && C8A_ITEM_KANA[id] && ITEM_KANA[id], id);
    assert.ok(!(it.resist?.water < 1), `${id}: 水に 強い 装備は 作らない`);
  }
  for (const [n, [, mat]] of Object.entries(C8A_TREASURE)) {
    assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type) && !ITEMS_C8A[mat], `${n}階: ${mat}（今の 素材・道具）`);
    assert.equal(C8A_TREASURE_N[n].length, 2);
    assert.equal(C8A_TREASURE_N[n][0], 1);
    assert.deepEqual(c8aChest(Number(n), 1), { item: mat, n: C8A_TREASURE_N[n][1] });
    assert.deepEqual(c8aChest(Number(n), 0), { item: C8A_TREASURE[n][0], n: 1 });
  }
  assert.equal(c8aChest(1, 2), null);
  assert.ok(ITEMS.c8at_palace_sword.atk > ITEMS.c7it_ice_sword.atk);
  assert.ok(ITEMS.c8at_moon_staff.bonus.mag > ITEMS.c7it_north_staff.bonus.mag);
});

test('ボスの 品・時をこえる手紙の ごほうび: いちばん 強い おうぎ・つえ。名前は かぶらない', () => {
  for (const [boss, [acc, weapon]] of Object.entries(C8A_DROPS)) {
    const m = MONSTERS[boss];
    assert.deepEqual(m.drops.boss, [acc]);
    assert.equal(m.drops.rare[0], weapon);
    assert.ok(ITEMS[acc].unique && ITEMS[acc].type === 'acc' && ITEMS[acc].src === 'pastboss' && ITEMS[acc].boss === boss);
    assert.equal(ITEMS[weapon].rarity, 5);
  }
  const sum = (id) => Object.values(ITEMS[id].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum('c8j_ruby_charm') > sum('c8p_feather_charm') && sum('c8p_feather_charm') > sum('c7h_shadow_charm'));
  // 第8章 第3幕の 品（ITEMS_C8C。マジカメックの つえ など）は のぞく
  const top = (cat) => Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+') && !ITEMS_C8C[id]).sort((x, y) => y[1].atk - x[1].atk)[0][0];
  assert.equal(top('fan'), 'c8p_parrot_fan');
  assert.equal(top('staff'), 'c8j_snake_staff');
  assert.equal(top('sword'), 'c8at_palace_sword');
  for (const list of Object.values(C8A_LETTER_REWARDS)) {
    const [id] = list[0];
    assert.ok(ITEMS[id] && ITEMS[id].src === 'letter7' && starsOf(id) === 5, id);
    assert.equal(rareWhereText(id), '時をこえる手紙でしか手に入らない');
    for (const [mat] of list.slice(1)) assert.ok(['mat', 'use'].includes(ITEMS[mat]?.type), mat);
  }
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!id.includes('+')) names.set(it.name, (names.get(it.name) || 0) + 1);
  for (const id of Object.keys(ITEMS_C8A)) assert.equal(names.get(ITEMS[id].name), 1, ITEMS[id].name);
});

// ───────────── 技の せつめい・エフェクト・がめん ─────────────
test('技の せつめい: 1文めだけで 何を するか わかる（スマホの たて持ちは 1文めだけ。30字くらいまで）', () => {
  for (const [id, a] of Object.entries(C8A_ABILITIES)) {
    assert.equal(ABILITIES[id], a, id);
    const s = firstSentence(a.desc);
    assert.ok(s.endsWith('。') && s.length <= 32, `${id}: ${s}（${s.length}字）`);
  }
});

test('エフェクト: 技の anim は ぜんぶ ある・大技は がめんの まん中に 大きく・とくべつな つぶ', () => {
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set([...Object.values(C8A_ABILITIES).map((a) => a.anim), 'a8c_whiff', 'a8j_genie'].filter((a) => /^a8[npjcg]_/.test(a)))];
  assert.ok(own.length >= 36, `${own.length}`);
  for (const a of own) {
    assert.equal(playC8aFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC7iFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playC7sFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    assert.equal(playTokei6Fx(fx, a, [{ x: 100, y: 60 }], 'fire', {}), true, a);
  }
  assert.equal(playC8aFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C8A_SCREEN_ANIMS, ...Object.keys(C8A_ALLY_FX), ...Object.keys(C8A_SFX)]) assert.ok(own.includes(a), a);
  for (const a of ['a8p_echo', 'a8j_hypno', 'a8c_strike', 'a8g_blast']) assert.ok(C8A_SCREEN_ANIMS.includes(a), a);
  for (const [k, v] of Object.entries(C8A_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.6, 0.99]) {
    C8A_FINE.c8awave(x, { x0: 100, y0: 30, r: 150, col: '#ffd66b', age: t * 700 }, t);
    C8A_FINE.c8aspiral(x, { x: 100, y: 60, size: 14, age: t * 1300 }, t);
  }
  assert.equal(C7I_FINE.c8awave, C8A_FINE.c8awave);
});

test('がめん: オウムがえし・さいみんじゅつ・とぐろ・魔力の しるし・聞き耳・×1.5・ランプの中・あやつられた 人の まど・バナー', () => {
  for (const id of C8A_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const scene = { time: 1000, c: new Map() };
  const n = () => drawn.length;
  let m = n();
  c8aDraw(scene, x, null, { alive: true, species: C8_PET, echoLeft: 2, echoEvery: 4, listen: 1, words: ['fire', 'ice'] }, 100, 20, 112, 112, 1);
  assert.ok(n() > m + 10 && drawn.includes('fillText'));
  m = n();
  c8aDraw(scene, x, null, { alive: true, species: C8_PET, echoLeft: 4, echoEvery: 4, words: [], dizzy: 1 }, 100, 20, 112, 112, 1);
  assert.ok(n() > m + 5);
  for (const c of [
    { c8form: 1, hypnoLeft: 1, hypnoEvery: 3, staffDown: 2 },
    { c8form: 2, coilLeft: 2, coilEvery: 3, openLeft: 2, openK: 1.5 },
    { c8form: 2, coiled: 1, counters: 1 },
    { c8form: 3, blastLeft: 1, blastEvery: 3 },
    { c8form: 3, sealLeft: 2, sealK: 1.6 },
  ]) {
    m = n();
    c8aDraw(scene, x, null, { alive: true, species: C8_JAFAR, ...c }, 100, 20, 124, 124, 1);
    assert.ok(n() > m + 4, JSON.stringify(c));
  }
  // あやつられた 人の まど
  const boxes = new Map();
  const box = () => {
    const set = new Set();
    return { classList: { toggle: (c, on) => (on ? set.add(c) : set.delete(c)), has: (c) => set.has(c) } };
  };
  boxes.set('a1', { box: box() });
  boxes.set('a2', { box: box() });
  const allies = [{ id: 'a1', alive: true, name: '勇者', status: ['confuse'] }, { id: 'a2', alive: true, name: '大賢者', status: [] }];
  const sc = {
    game: { audio: { sfx() {} } }, banners: [], banner(t, cls) { this.banners.push([t, cls]); }, shake() {},
    c: new Map([['a1', allies[0]], ['a2', allies[1]]]), allies: () => allies, statusBoxes: boxes,
  };
  c8aPresent(sc, { c8aHypno: { who: ['a1'] } }, {}, null, null);
  assert.ok(boxes.get('a1').box.classList.has('c8a-hypno') && !boxes.get('a2').box.classList.has('c8a-hypno'));
  assert.ok(sc.banners[0][0].includes('勇者') && sc.banners[0][1] === 'danger');
  c8aPresent(sc, { c8aBreak: { id: 'w' } }, {}, null, null);
  assert.ok(!boxes.get('a1').box.classList.has('c8a-hypno'));
  c8aMarks(sc);
  // バナー
  sc.banners = [];
  c8aPresent(sc, { c8aParrot: { left: 1 } }, {}, null, null);
  c8aPresent(sc, { c8aEcho: { n: 2 } }, {}, null, null);
  c8aPresent(sc, { c8aEcho: { n: 0 } }, {}, null, null);
  c8aPresent(sc, { c8aCoil: { id: 'w' } }, {}, null, null);
  c8aPresent(sc, { c8aWhiff: { k: 1.5 } }, {}, null, null);
  c8aPresent(sc, { c8aGenie: { id: 'w' } }, {}, null, null);
  c8aPresent(sc, { c8aSeal: { k: 1.6 } }, {}, null, null);
  c8aPresent(sc, { c8aOut: { id: 'w' } }, {}, null, null);
  assert.equal(sc.banners.length, 8);
  assert.deepEqual(sc.banners.map((b) => b[1]), ['danger', 'danger', 'combo', 'danger', 'combo', 'danger', 'combo', 'danger']);
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルは 小学校の 漢字（＋ ゆるした 字）・スペース なし', () => {
  const files = ['monsters-c8a.js', 'abilities-c8a.js', 'items-c8a.js', 'encounters-c8a.js', 'companions-c8a.js'].map((f) => `public/js/shared/data/${f}`)
    .concat(['public/js/shared/battle-c8a.js', 'public/js/client/battle-c8a.js']);
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    assert.deepEqual(checkFile(full), [], f);
  }
});
