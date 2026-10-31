// 第5章 Step 8「影の城」B8（戦い・品）
// 新しい 魔物（風の階・炎の階・水の階で ちがう 組。かおのない影も）・色ちがい・出現表（t5_castle_wind・t5_castle_fire・t5_castle_water）・仲間・
// 3人の まぼろし（phantom_storm・phantom_ignia・phantom_morgana）と 新しい しかけ「風のかべ」「かげ火の力」「水かさ」・前の しかけ・
// ふつうの オートと 知っている 人の オート・シミュレーション・品（影の城の 宝箱・まぼろしの 品・素材・れん金）・★の きまり・絵・背景・エフェクト・がめん・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly, decideMonster } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool } from '../public/js/shared/data/companions.js';
import { regionOf, starsOf, rarityOf, bossRareOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { RECIPES } from '../public/js/shared/data/alchemy.js';
import { canEquip } from '../public/js/shared/stats.js';
import {
  MONSTERS_PHANTOM, PHANTOM_HIDDEN, PHANTOM_MAT_DROPS, PHANTOMS, PHANTOM_STORM, PHANTOM_IGNIA, PHANTOM_MORGANA, PHANTOM_SOLDIER, PHANTOM_FLAME,
} from '../public/js/shared/data/monsters-phantom.js';
import { PHANTOM_ABILITIES } from '../public/js/shared/data/abilities-phantom.js';
import { FRIENDS_PHANTOM } from '../public/js/shared/data/companions-phantom.js';
import { ENCOUNTERS_PHANTOM, FIXED_PHANTOM, ZONE_BG_PHANTOM, PHANTOM_VARIANTS } from '../public/js/shared/data/encounters-phantom.js';
import { ITEMS_CASTLE, CASTLE_TREASURE, CASTLE_RECIPES, CASTLE_ITEM_KANA, PHANTOM_DROPS, CASTLE_K } from '../public/js/shared/data/items-castle.js';
import { EARTH_TREASURE, GATHER_GIFTS } from '../public/js/shared/data/items-earth.js';
import { MONSTERS_EARTH } from '../public/js/shared/data/monsters-earth.js';
import { WALL, TORNADO, INFERNO, WAVE, WAVE_CHARGE, AUTO_GUARD, flamesOf, phantomPlan, phantomEst } from '../public/js/shared/battle-phantom.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar } from '../tools/sim.js';
import { phantomRun, phantomParty, PHANTOM_KIT, PHANTOM_LV } from '../tools/sim-phantom.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { PHANTOM_BASE, PHANTOM_TINT } from '../public/js/client/render/ch5-phantom-art.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { PHANTOM_BG, PHANTOM_DECOS, drawPhantomBg, drawPhantomFloorBg } from '../public/js/client/render/ch5-phantom-bg.js';
import { playPhantomFx } from '../public/js/client/render/battlefx-phantom.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { PHANTOM_SCREEN_ANIMS, PHANTOM_ALLY_FX, PHANTOM_SFX, phantomDraw, phantomPresent } from '../public/js/client/battle-phantom.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';
import { ITEMS_PRIZE_R50 } from '../public/js/shared/data/items-prize-r50.js';

const NEW = Object.keys(MONSTERS_PHANTOM).filter((id) => !PHANTOMS.includes(id));
const WIND = ['gale_crow', 'mill_keeper', 'wind_weasel'];
const FIRE = ['ember_wolf', 'candle_ghost', 'blackflame_knight'];
const WATER = ['mirror_jelly', 'shade_serpent', 'foam_siren'];
const PARTY = (lv = 53) => [makeChar('warrior', lv, 10, 'せんし', 52), makeChar('priest', lv, 10, 'そうりょ', 52), makeChar('mage', lv, 10, 'まほう', 52), makeChar('monk', lv, 10, 'ぶとう', 52)];
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced', controller: 'sim' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || [PHANTOM_STORM], boss: opts.boss ?? true, canFlee: false });
  for (const a of b.allies) a.use = null;
  return { b, m: b.enemies[0], a: b.allies };
}
const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
function act(b, c, cmd) {
  const ev = evOf(c);
  b.cur = ev;
  b.perform(c, cmd, ev);
  b.cur = null;
  if (ev.postLines) ev.lines.push(...ev.postLines);
  return ev;
}
const has = (ev, text) => [...ev.lines, ...(ev.postLines || [])].some((l) => l.includes(text));
const dmgTo = (ev, t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);
// 行動の はじめ（battle-ch5.js の towerTurnStart → phantomTurnStart）だけ 動かす
function turnStart(b, c) {
  b.queue = [{ id: c.id, cmd: { type: 'ability', id: 'm_pm_dazzled' }, last: true }];
  c.queued = true;
  b.executeNext();
}

// ───────────── データ ─────────────
test('魔物: 影の城の 新しい 魔物 9しゅ（風・炎・水の 階で 3しゅずつ。Lv52〜54・空の レアの 地方 6）と 3人の まぼろし', () => {
  assert.deepEqual(NEW.sort(), [...WIND, ...FIRE, ...WATER].sort());
  for (const id of NEW) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_PHANTOM[id]);
    assert.ok(m.lv >= 52 && m.lv <= 54, id);
    assert.equal(regionOf(id), 6, id);
    assert.ok(!m.boss, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(m.desc && m.desc.length > 10, id);
  }
  // 風の階 Lv52・炎の階 Lv53・水の階 Lv54
  for (const [ids, lv] of [[WIND, 52], [FIRE, 53], [WATER, 54]]) for (const id of ids) assert.equal(MONSTERS[id].lv, lv, id);
  // 弱点: 風の階は 炎か 雷・炎の階は 氷・水の階は 雷
  for (const id of WIND) assert.ok(Math.max(MONSTERS[id].resist.fire || 1, MONSTERS[id].resist.bolt || 1) >= 1.3, id);
  for (const id of FIRE) assert.ok(MONSTERS[id].resist.ice >= 1.3, id);
  for (const id of WATER) assert.ok(MONSTERS[id].resist.bolt >= 1.3, id);
  // 3人の まぼろし（前の 章の ボスの 強い 形。おすすめ Lv52・53・54）
  assert.deepEqual(PHANTOMS, [PHANTOM_STORM, PHANTOM_IGNIA, PHANTOM_MORGANA]);
  for (const [id, lv, kind] of [[PHANTOM_STORM, 52, 'storm'], [PHANTOM_IGNIA, 53, 'ignia'], [PHANTOM_MORGANA, 54, 'morgana']]) {
    const m = MONSTERS[id];
    assert.ok(m.boss && m.turns === 2 && m.lv === lv && m.castle?.kind === kind && m.phantom, id);
    assert.ok(m.name.endsWith('のまぼろし'), id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    assert.ok(!MONSTER_FRIENDS[id], `${id}: 仲間に ならない`);
  }
  // もとの ボスより 強い（HPと 攻撃力）
  for (const [id, from] of [[PHANTOM_STORM, 'storm_general'], [PHANTOM_IGNIA, 'flame_witch'], [PHANTOM_MORGANA, 'morgana']]) {
    assert.ok(MONSTERS[id].hp > MONSTERS[from].hp * 3 && MONSTERS[id].str > MONSTERS[from].str * 3, id);
  }
  // 前の しかけを のこす: ストルム（竜巻の 前ぶれ・嵐の兵・よろいが くだける）・イグニア（かげ火・大炎の 前ぶれ・かげろう）・モルガナ（まぼろし・水の衣・鏡写し・大波）
  const ids = (m) => m.actions.map((a) => a.id);
  assert.ok(ids(MONSTERS[PHANTOM_STORM]).includes('m_ps_tornado_charge') && MONSTERS[PHANTOM_STORM].phases.filter((p) => p.summon).length === 2);
  assert.ok(MONSTERS[PHANTOM_STORM].phases.some((p) => p.debuff?.def && p.buff?.atk));
  assert.equal(ABILITIES.m_ps_tornado_charge.effect.next, TORNADO);
  for (const a of ['m_pi_call', 'm_pi_inferno_charge', 'm_pi_haze']) assert.ok(ids(MONSTERS[PHANTOM_IGNIA]).includes(a), a);
  assert.equal(ABILITIES.m_pi_inferno_charge.effect.next, INFERNO);
  const mo = MONSTERS[PHANTOM_MORGANA];
  assert.ok(mo.mirage && mo.veil && mo.mirrorCopy && mo.castle.tide.max >= 4);
  assert.ok(mo.mirage.mirror > MONSTERS.morgana.mirage.mirror, '月の鏡の 光が もどるのが おそい');
  assert.ok(ids(mo).includes(WAVE_CHARGE) && ABILITIES.m_pm_wave_build.effect.next === WAVE);
  // 新しい しかけの 技
  assert.equal(ABILITIES[WALL].effect.type, 'psWall');
  assert.equal(ABILITIES[INFERNO].effect.type, 'piInferno');
  for (const a of Object.values(PHANTOM_ABILITIES)) assert.ok(a.name && a.desc && a.anim && a.cast, a.name);
  // まぼろしの 手下は 図鑑・魔物の 数に 入らない（数えない 形）
  for (const id of [PHANTOM_SOLDIER, PHANTOM_FLAME]) {
    assert.ok(MONSTERS[id] === PHANTOM_HIDDEN[id] && !Object.keys(MONSTERS).includes(id), id);
    assert.ok(MONSTER_ART[MONSTERS[id].art] && MONSTERS[id].tint, `${id}: もとの 魔物の 色がえ`);
  }
  // そのままの 名前を 使わない（第5章 Step 6・7 と おなじ ことば。かおのない影を 使う ので）
  const words = ['ロボット兵', 'ラピュタ', 'オーム', '王蟲', 'カオナシ', 'コダマ', 'こだま'];
  const texts = [
    ...Object.keys(MONSTERS_PHANTOM).flatMap((id) => [MONSTERS[id].name, MONSTERS[id].desc]),
    ...Object.values(PHANTOM_HIDDEN).flatMap((m) => [m.name, m.desc]),
    ...Object.values(FRIENDS_PHANTOM).flatMap((f) => [...f.names, f.note]),
    ...Object.values(PHANTOM_ABILITIES).flatMap((a) => [a.name, a.desc, a.cast]),
    ...Object.values(ITEMS_CASTLE).flatMap((it) => [it.name, it.desc]),
    ...PHANTOM_VARIANTS.map((v) => MONSTERS[v].name),
  ].join('|');
  for (const w of words) assert.ok(!texts.includes(w), w);
});

test('落とす物: まぼろしは それぞれ ちなんだ ★5の 品を かならず 1つ。城の 魔物は 素材（黒い風の羽・影火の石・黒しんじゅ）', () => {
  for (const [id, item] of Object.entries(PHANTOM_DROPS)) {
    assert.deepEqual(MONSTERS[id].drops.boss, [item], id);
    assert.equal(bossRareOf(id), null, 'ふつうの ボスの 品（第32回の きまり）とは べつ');
    const it = ITEMS[item];
    assert.ok(it.src === 'phantom' && it.boss === id && it.rank === 10, item);
    assert.equal(rareWhereText(item), 'まぼろしからしか手に入らない');
    assert.equal(starsOf(item), 5, `${item}: ★5`);
    assert.equal(rarityOf(item), 3, `${item}: 1人 1つの 品は レア度3（ノクトの お守りと おなじ）`);
    const rng = makeRng(4);
    for (let i = 0; i < 30; i++) assert.ok(rollDrops(id, rng).includes(item), `${id}: かならず`);
    assert.ok(monsterDrops(id).some((d) => d.item === item && d.rate === 1));
  }
  // あとの まぼろしの 品ほど 強い（ストルム → イグニア → モルガナ）。大地の神殿の 品より 強い
  // 1人 1つの アクセサリー。あとの まぼろしの 品ほど 強い（ノクト（1回目）の お守りより 強く、みんなが くれる お守りまで）
  const bsum = (it) => Object.values(it.bonus || {}).reduce((s, v) => s + Math.max(0, v), 0);
  const [s1, s2, s3] = Object.values(PHANTOM_DROPS).map((id) => ITEMS[id]);
  for (const it of [s1, s2, s3]) assert.ok(it.type === 'acc' && it.unique, it.name);
  assert.ok(bsum(ITEMS.nocto_earth_charm) < bsum(s1) && bsum(s1) <= bsum(s2) && bsum(s2) < bsum(s3) && bsum(s3) <= bsum(ITEMS[GATHER_GIFTS.nefi]));
  const mats = { cs_wind_feather: WIND, cs_ember_stone: FIRE, cs_black_pearl: WATER };
  for (const [mat, ids] of Object.entries(mats)) {
    assert.equal(ITEMS[mat].type, 'mat');
    for (const id of ids) {
      assert.equal(MAT_DROPS[id], PHANTOM_MAT_DROPS[id]);
      assert.equal(MAT_DROPS[id][0], mat, id);
    }
  }
});

test('仲間: 新しい 魔物 9しゅは 仲間に なる（1/14〜1/24・系統配合の 子には ならない）。まぼろし・手下は ならない', () => {
  for (const id of NEW) {
    const f = MONSTER_FRIENDS[id];
    assert.equal(f, FRIENDS_PHANTOM[id]);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 14, id);
    assert.ok(f.noFamily && !familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    assert.ok(f.names.length >= 3 && f.note, id);
    for (const [, ab] of f.learn) {
      assert.ok(ABILITIES[ab], `${id}: ${ab}`);
      assert.ok(!['psWall', 'piCall', 'piInferno', 'pmWave', 'reflect', 'telegraph'].includes(ABILITIES[ab].effect.type), `${id}: ${ab}`);
    }
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 && sum <= 7.3, `${id}: ${sum}`);
  }
  for (const id of [...PHANTOMS, PHANTOM_SOLDIER, PHANTOM_FLAME]) assert.ok(!MONSTER_FRIENDS[id], id);
  for (const id of ['blackflame_knight', 'shade_serpent', 'mill_keeper']) assert.ok(MONSTER_FRIENDS[id].rate <= 1 / 20, id);
});

test('出現表と きまった 戦い: 名前の 約束（t5_castle_wind・fire・water／phantom_storm・ignia・morgana・背景 castle_wind・fire・water・曲 phantom）', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_PHANTOM), ['t5_castle_wind', 't5_castle_fire', 't5_castle_water']);
  const sps = (t) => new Set(ENCOUNTERS_PHANTOM[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const [t, list] of Object.entries(ENCOUNTERS_PHANTOM)) {
    assert.equal(ENCOUNTER_TABLES[t], list);
    for (const e of list) for (const [sp, mn, mx] of e.group) {
      assert.ok(MONSTERS[sp], `${t}: ${sp}`);
      assert.ok(mn >= 0 && mx >= mn && mx <= 3);
    }
    // かおのない影（大地の神殿の 15-4 の 魔物）は どの 階にも 少し
    assert.ok(sps(t).has('faceless_shade') && MONSTERS_EARTH.faceless_shade, t);
  }
  // 階ごとに ちがう 組（ほかの 階の 魔物は 出ない）
  for (const [t, ids] of [['t5_castle_wind', WIND], ['t5_castle_fire', FIRE], ['t5_castle_water', WATER]]) {
    for (const id of ids) assert.ok(sps(t).has(id), `${t}: ${id}`);
    for (const id of NEW.filter((x) => !ids.includes(x))) assert.ok(!sps(t).has(id), `${t}: ${id} は 出ない`);
  }
  for (const v of PHANTOM_VARIANTS) assert.ok(MONSTERS[v] && Object.keys(ENCOUNTERS_PHANTOM).some((t) => sps(t).has(v)), v);
  assert.deepEqual(ZONE_BG_PHANTOM, { t5_castle_wind: 'castle_wind', t5_castle_fire: 'castle_fire', t5_castle_water: 'castle_water' });
  for (const [t, bg] of Object.entries(ZONE_BG_PHANTOM)) assert.equal(ZONE_BG[t], bg);
  for (const [id, bg, n] of [[PHANTOM_STORM, 'castle_wind', 1], [PHANTOM_IGNIA, 'castle_fire', 1], [PHANTOM_MORGANA, 'castle_water', 3]]) {
    const f = FIXED_ENCOUNTERS[id];
    assert.equal(f, FIXED_PHANTOM[id]);
    assert.deepEqual(f.group, [[id, n, n]]);
    assert.equal(f.bg, bg);
    assert.equal(f.bgm, 'phantom');
    assert.ok(f.boss === true && f.canFlee === false && !f.loseOk, id);
  }
});

// ───────────── 品 ─────────────
test('影の城の 宝箱（CASTLE_TREASURE）: 1〜12階に 1〜2こ。ぜんぶ ランク10の ★5。深い（上の）階ほど 強い・大地の神殿より 強い', () => {
  assert.deepEqual(Object.keys(CASTLE_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const all = [];
  for (const [fl, ids] of Object.entries(CASTLE_TREASURE)) {
    assert.ok(ids.length >= 1 && ids.length <= 2, fl);
    for (const id of ids) {
      const it = ITEMS[id];
      assert.ok(it && it === ITEMS_CASTLE[id] && it.src === 'castle' && it.price === 0 && it.sell > 0, id);
      assert.ok(it.rank === 10 && starsOf(id) === 5, `${id}: ★5（ランク10）`);
      assert.ok(rarityOf(id) >= 4, id);
      assert.equal(rareWhereText(id), '影の城の宝箱でしか手に入らない');
      all.push([Number(fl), id]);
    }
  }
  assert.equal(new Set(all.map(([, id]) => id)).size, all.length);
  // 武器は 10しゅるい ぜんぶ・防具も そろう
  const cats = new Set(all.map(([, id]) => ITEMS[id]).filter((it) => it.type === 'weapon').map((it) => it.cat));
  assert.deepEqual([...cats].sort(), ['axe', 'bat', 'boomerang', 'claw', 'dagger', 'fan', 'spear', 'staff', 'sword', 'whip']);
  for (const t of ['armor', 'shield', 'head', 'acc']) assert.ok(all.some(([, id]) => ITEMS[id].type === t), t);
  // 階の 強さの かけ算は 上の 階ほど 大きい
  for (let f = 2; f <= 12; f++) assert.ok(CASTLE_K[f] > CASTLE_K[f - 1], `${f}階`);
  // 同じ 種類なら 上の 階ほど 強い・大地の神殿の 宝箱（★5）より 強い
  const key = (it) => `${it.type}:${it.cat || it.armorType || ''}:${it.helm ? 'h' : ''}`;
  const pow = (it) => it.atk || it.def || 0;
  for (const [f1, a] of all) for (const [f2, b] of all) {
    const A = ITEMS[a], B = ITEMS[b];
    if (f1 < f2 && key(A) === key(B) && A.type !== 'acc') assert.ok(pow(A) < pow(B), `${a}（${f1}階）< ${b}（${f2}階）`);
  }
  const earth = Object.values(EARTH_TREASURE).flat().map((id) => ITEMS[id]);
  for (const [, id] of all) {
    const it = ITEMS[id];
    const e = earth.filter((x) => key(x) === key(it) && x.type !== 'acc');
    for (const x of e) assert.ok(pow(it) > pow(x), `${id} > ${x.name}`);
  }
  // 12階の 剣は 今の ★5の 剣の 中で いちばん 強い（ソリトゥスの 品〈B9〉より 前。第6章の 千年前・星めぐりの古道・時計塔の 品〈src: 'past'・'pastboss'・'road'・'tokei'〉は もっと あと）
  // 第50回 D3: 第6章の 区切りの あとに ならぶ 景品（data/items-prize-r50.js）も もっと あと
  const prizeR50 = new Set(Object.values(ITEMS_PRIZE_R50));
  const swords = Object.values(ITEMS).filter((it) => it.type === 'weapon' && it.cat === 'sword' && !it.base && it.rank <= 10 && it.src !== 'alchemy' && it.src !== 'final' && it.src !== 'past' && it.src !== 'pastboss' && it.src !== 'road' && it.src !== 'tokei' && it.src !== 'clear6' && it.src !== 'c7' && it.src !== 'letter7' && !prizeR50.has(it));
  // ソリトゥスの 夜明けの星の剣（B9。src: 'final'）は もっと 強い（いちばん 最後の 品）
  assert.ok(Object.values(ITEMS).filter((it) => it.src === 'final' && it.cat === 'sword').every((s) => s.atk > ITEMS.cs_castle_sword.atk));
  assert.equal(Math.max(...swords.map((s) => s.atk)), ITEMS.cs_castle_sword.atk);
  for (const id of Object.keys(ITEMS_CASTLE)) assert.ok(CASTLE_ITEM_KANA[id] && ITEM_KANA[id], `${id} の よみがな`);
});

test('★の きまり: 影の城の 品は ぜんぶ ランク10（テストの きまりで 10まで）＝★5。「あとの 品ほど 強い」は 強さの かけ算で', () => {
  for (const [id, it] of Object.entries(ITEMS_CASTLE)) {
    if (it.type === 'mat') continue;
    assert.ok(it.rank <= 10, `${id}: ランク10まで`);
    assert.equal(starsOf(id), 5, id);
  }
});

test('れん金: 影の城の 素材の レシピ 3つ。★5（大地の神殿の 宝箱）→ もっと 強い ★5', () => {
  assert.equal(CASTLE_RECIPES.length, 3);
  for (const r of CASTLE_RECIPES) {
    assert.ok(RECIPES.includes(r), r.id);
    assert.equal(r.tier, 5);
    assert.ok(r.ins.some((i) => ['cs_wind_feather', 'cs_ember_stone', 'cs_black_pearl'].includes(i)));
    const from = r.ins.find((i) => ['weapon', 'armor', 'head'].includes(ITEMS[i].type));
    assert.ok(Object.values(EARTH_TREASURE).flat().includes(from), from);
    assert.equal(starsOf(from), 5);
    assert.equal(starsOf(r.out), 5);
    const k = ITEMS[r.out].type === 'weapon' ? 'atk' : 'def';
    assert.ok(ITEMS[r.out][k] > ITEMS[from][k], r.id);
    assert.equal(rareWhereText(r.out), 'れん金でしか作れない');
  }
});

// ───────────── ストルムのまぼろし ─────────────
test('風のかべ: まとうと 物理の 攻撃は はばまれて 少しだけ・当てた 人に 風の はね返し。呪文は そのまま。ストルムが 3回 動くと 消える', () => {
  const { b, m, a } = battle({ seed: 11 });
  m.hp = m.maxHp = 999999;
  const ev = act(b, m, { type: 'ability', id: WALL });
  assert.ok(m.windWall && ev.psWall === m.id && has(ev, '風のかべ'));
  assert.equal(pub(m).windWall, 1);
  const conf = MONSTERS[PHANTOM_STORM].castle.wall;
  // 物理: ダメージが へり、はね返される
  const hp0 = a[0].hp;
  const e1 = evOf(a[0]);
  b.damage(a[0], m, 1000, e1, { element: 'phys', phys: true });
  assert.equal(dmgTo(e1, m), Math.round(1000 * conf.cut));
  assert.ok(e1.psBounce && has(e1, 'はね返した'));
  assert.equal(hp0 - a[0].hp, Math.min(hp0, Math.round(a[0].maxHp * conf.back)));
  // 呪文（物理で ない）・合体技は そのまま
  const e2 = evOf(a[2]);
  b.damage(a[2], m, 1000, e2, { element: 'fire' });
  assert.equal(dmgTo(e2, m), 1000);
  const e3 = { ...evOf(a[0]), dual: true };
  b.damage(a[0], m, 1000, e3, { element: 'phys', phys: true });
  assert.equal(dmgTo(e3, m), 1000);
  // オートの みつもり: 物理は 小さく 見る（呪文や かべの ない 敵に かえる）
  assert.equal(phantomEst(a[0], m), conf.cut);
  assert.equal(phantomEst(a[0], { ...m, windWall: null }), 1);
  // ストルムが 動く たびに へって、conf.acts 回で 消える
  for (let i = 0; i < conf.acts; i++) {
    assert.ok(m.windWall, `${i}回め`);
    b.queue = [{ id: m.id, cmd: { type: 'attack', target: a[0].id }, last: true }];
    m.queued = true;
    b.executeNext();
  }
  assert.equal(m.windWall, null);
  assert.equal(pub(m).windWall, 0);
  // かべが ある 間は、もう かべを えらばない（竜巻の 前ぶれも かべの あと）
  m.windWall = { left: 2 };
  for (let i = 0; i < 30; i++) {
    m.recent = [];
    const cmd = decideMonster(b, m);
    assert.ok(cmd.id !== WALL && cmd.id !== 'm_ps_tornado_charge', cmd.id);
  }
});

test('ストルムのまぼろし: 竜巻の 前ぶれ → 大竜巻（みんなに 物理の 大技・身を 守ると 半分）。嵐の兵を 2回 よぶ・たおれると 兵も 消える', () => {
  const { b, m, a } = battle({ seed: 12 });
  act(b, m, { type: 'ability', id: 'm_ps_tornado_charge' });
  assert.equal(m.telegraph, TORNADO);
  const cmd = decideMonster(b, m);
  assert.ok(cmd.id === TORNADO && cmd.big);
  const e = ABILITIES[TORNADO].effect;
  const r0 = b.calcPhys(m, a[0], e, 1, 'wind', true).dmg;
  a[0].defending = true;
  const r1 = b.calcPhys(m, a[0], e, 1, 'wind', true).dmg;
  assert.ok(Math.abs(r1 - r0 / 2) <= 1, `${r0} → ${r1}`);
  a[0].defending = false;
  // HP70%・40%で 嵐の兵の まぼろしを よぶ
  const ev = evOf(a[0]);
  b.damage(a[0], m, Math.round(m.maxHp * 0.35), ev, { element: 'fire' });
  assert.equal(b.aliveEnemies().filter((x) => x.species === PHANTOM_SOLDIER).length, 2);
  const ev2 = evOf(a[0]);
  b.damage(a[0], m, Math.round(m.maxHp * 0.3), ev2, { element: 'fire' });
  assert.equal(b.aliveEnemies().filter((x) => x.species === PHANTOM_SOLDIER).length, 4);
  // たおれると 兵も 消える（勝ち）
  const ev3 = evOf(a[0]);
  b.damage(a[0], m, m.hp, ev3, { element: 'fire' });
  assert.equal(b.aliveEnemies().length, 0);
  assert.ok(has(ev3, '嵐の兵のまぼろしも'));
});

// ───────────── イグニアのまぼろし ─────────────
test('かげ火の力: かげ火を よぶ（4体まで）。大炎は のこっている かげ火を すいこんで、その 数だけ 強く なる（すいこまれた かげ火は 消える）', () => {
  const { b, m, a } = battle({ seed: 13, enemies: [PHANTOM_IGNIA] });
  const conf = MONSTERS[PHANTOM_IGNIA].castle;
  const e1 = act(b, m, { type: 'ability', id: 'm_pi_call' });
  assert.equal(flamesOf(b).length, conf.call);
  assert.ok(e1.piCall?.length === conf.call && e1.joined?.length === conf.call);
  act(b, m, { type: 'ability', id: 'm_pi_call' });
  assert.equal(flamesOf(b).length, conf.max);
  m.recent = [];
  assert.ok(!MONSTERS[PHANTOM_IGNIA].actions.filter((x) => x.id === 'm_pi_call').some((x) => x.cond.includes('c5:piCall')) || flamesOf(b).length >= conf.max);
  // 大炎の ダメージ: かげ火 4体の 時と 0体の 時（守りは おなじ・ばらつきは 平均で）
  const total = (n, seed) => {
    const { b: bb, m: mm, a: aa } = battle({ seed, enemies: [PHANTOM_IGNIA] });
    for (const x of aa) x.hp = x.maxHp = 99999;
    if (n) bb.addEnemies(Array(n).fill(PHANTOM_FLAME));
    const ev = act(bb, mm, { type: 'ability', id: INFERNO });
    assert.equal(ev.piInferno.fuel, n);
    assert.equal(flamesOf(bb).length, 0, 'すいこまれて 消える');
    assert.equal(bb.killed.length, 0, 'たおした ことには ならない');
    return aa.reduce((s, x) => s + dmgTo(ev, x), 0);
  };
  let d0 = 0, d4 = 0;
  for (let s = 0; s < 6; s++) {
    d0 += total(0, 30 + s);
    d4 += total(4, 30 + s);
  }
  const k = d4 / d0;
  assert.ok(Math.abs(k - (1 + conf.fuel.per * 4)) < 0.6, `${k.toFixed(2)}`);
  // 前ぶれ → 次の 番に 大炎
  const { b: b2, m: m2 } = battle({ seed: 14, enemies: [PHANTOM_IGNIA] });
  act(b2, m2, { type: 'ability', id: 'm_pi_inferno_charge' });
  assert.equal(m2.telegraph, INFERNO);
  // かげ火の まぼろしは 氷が とても よく 効く
  assert.ok(MONSTERS[PHANTOM_FLAME].resist.ice >= 2);
});

// ───────────── モルガナのまぼろし ─────────────
test('水かさ: 本物が 動く たびに 上がる（分身は 上げない）。いっぱいで かならず 大波の 前ぶれ（2だん）→ 大波。水の衣を 雷で はじくと 下がる', () => {
  const { b, a } = battle({ seed: 15, enemies: [PHANTOM_MORGANA, PHANTOM_MORGANA, PHANTOM_MORGANA] });
  const real = b.get(b.mirage.real);
  const clone = b.enemies.find((e) => e.clone);
  const max = MONSTERS[PHANTOM_MORGANA].castle.tide.max;
  assert.deepEqual(b.pmTide, { lv: 0, max, down: MONSTERS[PHANTOM_MORGANA].castle.tide.down });
  for (const x of b.enemies) assert.equal(pub(x).tide, 0, '3人とも おなじ 水かさ');
  turnStart(b, clone);
  assert.equal(b.pmTide.lv, 0, '分身は 上げない');
  turnStart(b, real);
  assert.equal(b.pmTide.lv, 1);
  for (const x of b.enemies) assert.equal(pub(x).tide, 1);
  while (b.pmTide.lv < max) turnStart(b, real);
  assert.equal(b.pmTide.lv, max);
  // いっぱい: かならず 大波の 前ぶれ（本物だけ。その 番の はじめに 前ぶれが きまる）
  assert.equal(real.telegraph, WAVE_CHARGE);
  assert.ok(!clone.telegraph);
  real.veilCharge = null;
  const cmd = decideMonster(b, real);
  assert.equal(cmd.id, WAVE_CHARGE);
  const ev = act(b, real, cmd);
  assert.equal(b.pmTide.lv, 0, '前ぶれで 水かさは 0 に もどる');
  assert.equal(real.waveStage, 1);
  assert.ok(ev.pmTide?.full && ev.fx?.type === 'wave');
  // 2だん目 → 大波（身を 守ると 半分）
  act(b, real, { type: 'ability', id: real.telegraph });
  assert.equal(real.telegraph, WAVE);
  const e = ABILITIES[WAVE].effect;
  const r0 = b.calcPhys(real, a[1], e, 1, 'phys', true).dmg;
  a[1].defending = true;
  assert.ok(Math.abs(b.calcPhys(real, a[1], e, 1, 'phys', true).dmg - r0 / 2) <= 1);
  a[1].defending = false;
  // 水の衣を 雷で はじくと 水かさが 下がる
  b.pmTide.lv = 4;
  real.veil = true;
  const ev2 = evOf(a[0]);
  b.damage(a[0], real, 300, ev2, { element: 'bolt' });
  assert.ok(!real.veil && ev2.veilBreak === real.id);
  assert.equal(b.pmTide.lv, 4 - b.pmTide.down);
  assert.ok(ev2.pmTide?.down && (ev2.postLines || []).some((l) => l.includes('水かさが下がった')));
  // 水の衣: 受ける ダメージが へる・炎は 効かない（第4章の モルガナと おなじ）
  real.veil = true;
  const ev3 = evOf(a[0]);
  b.damage(a[0], real, 1000, ev3, { element: 'phys', phys: true });
  assert.equal(dmgTo(ev3, real), Math.round(1000 * MONSTERS[PHANTOM_MORGANA].veil.cut));
  const ev4 = evOf(a[0]);
  b.damage(a[0], real, 1000, ev4, { element: 'fire' });
  assert.equal(dmgTo(ev4, real), 0);
});

test('モルガナのまぼろし: 3人の うち 1人が 本物（分身に 当てると キズが いえる）。月の鏡で まぶしいのは 1回だけ', () => {
  const { b, a } = battle({ seed: 16, enemies: [PHANTOM_MORGANA, PHANTOM_MORGANA, PHANTOM_MORGANA] });
  assert.ok(b.mirage && b.mirage.species === PHANTOM_MORGANA);
  const real = b.get(b.mirage.real);
  const clone = b.enemies.find((e) => e.clone);
  real.hp -= 1000;
  const hp0 = real.hp;
  const ev = act(b, a[0], { type: 'attack', target: clone.id });
  if (!(ev.results || []).some((r) => r.miss && r.id === clone.id)) {
    assert.ok(!clone.alive && real.hp > hp0, 'キズが いえる');
  }
  // まぶしい 番は その 1回だけ（2回行動の のこりは 動く）
  assert.equal(ABILITIES[MONSTERS[PHANTOM_MORGANA].mirage.dazzled].effect.type, 'nothing');
});

// ───────────── オート ─────────────
test('ふつうの オート: まぼろしの 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る。知っている 人は いつも 守る', () => {
  const run = (know) => {
    let guard = 0;
    for (let s = 0; s < 40; s++) {
      const { b, m, a } = battle({ seed: 100 + s });
      if (know) b.knowsPhantom = true;
      m.telegraph = TORNADO;
      m.atb = 99;
      const c = a[0];
      c.hp = Math.round(c.maxHp * (AUTO_GUARD.hp - 0.1));
      const cmd = phantomPlan(b, c, decideAlly);
      if (cmd?.type === 'defend') guard++;
    }
    return guard;
  };
  const auto = run(false), know = run(true);
  assert.equal(know, 40);
  assert.ok(auto > 10 && auto < 40, `${auto}`);
  // HPが 多い ときの ふつうの オートは 守らない（ほかの 戦いでは 何も しない）
  const { b, m, a } = battle({ seed: 9 });
  m.telegraph = TORNADO;
  m.atb = 99;
  assert.equal(phantomPlan(b, a[0], decideAlly), null);
  const { b: b2, a: a2 } = battle({ seed: 9, enemies: ['ember_wolf'], boss: false });
  assert.equal(phantomPlan(b2, a2[0], decideAlly), null);
});

test('知っている 人（knowsPhantom）: 風のかべの 間は 物理の かわりに 呪文など・かげ火を 先に ねらう', () => {
  const { b, m, a } = battle({ seed: 21 });
  b.knowsPhantom = true;
  m.windWall = { left: 2 };
  for (let s = 0; s < 10; s++) {
    const cmd = phantomPlan(b, a[3], () => ({ type: 'attack', target: m.id }));
    assert.ok(cmd && !(cmd.type === 'attack' && cmd.target === m.id), JSON.stringify(cmd));
  }
  const { b: b2, m: m2, a: a2 } = battle({ seed: 22, enemies: [PHANTOM_IGNIA] });
  b2.knowsPhantom = true;
  act(b2, m2, { type: 'ability', id: 'm_pi_call' });
  const fl = flamesOf(b2);
  const cmd = phantomPlan(b2, a2[0], () => ({ type: 'attack', target: m2.id }));
  assert.ok(fl.some((f) => f.id === cmd.target), JSON.stringify(cmd));
  // 回復は そのまま
  const heal = { type: 'ability', id: 'behoimi', target: a2[0].id };
  assert.deepEqual(phantomPlan(b2, a2[1], () => heal), heal);
});

test('シミュレーション: tools/sim-phantom.mjs（超級職 4人・その ころの ★装備）。3人とも さいごまで 戦える・知っている 人は 合体技', { timeout: 240000 }, () => {
  for (const boss of ['storm', 'ignia', 'morgana']) {
    assert.deepEqual(phantomParty(boss, PHANTOM_LV[boss]).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
    for (const [job, k] of Object.entries(PHANTOM_KIT[boss])) for (const id of k) assert.ok(id === null || (ITEMS[id] && canEquip(job, id)), `${boss} ${job}: ${id}`);
    for (const know of [false, true]) {
      const r = phantomRun(boss, PHANTOM_LV[boss], know, 5252);
      assert.ok(['win', 'lose'].includes(r.outcome), `${boss} ${know}: ${r.outcome}`);
      if (know) assert.ok(r.duals > 0, `${boss}: 知っている 人は 合体技`);
      else assert.equal(r.duals, 0);
      // 第38回 C: 早く 勝つと 風のかべが 出ない ことも ある（その ときは もう1つの たねで）
      if (boss === 'storm') assert.ok(r.walls >= 1 || phantomRun(boss, PHANTOM_LV[boss], know, 5253).walls >= 1, JSON.stringify(r));
      if (boss === 'ignia') assert.ok(r.calls >= 1, JSON.stringify(r));
      if (boss === 'morgana') assert.ok(r.waves >= 1, JSON.stringify(r));
    }
  }
  // あとの まぼろしの 装備ほど 強い（前の まぼろしの 品を 使う）
  assert.ok(PHANTOM_KIT.ignia.high_priest.includes('ph_storm_bangle') && PHANTOM_KIT.morgana.daikenja.includes('ph_ignia_earring'));
});

test('きまった 戦い phantom_morgana: 台本の ["battle", "phantom_morgana"] と おなじ（背景・曲・ボス・3人）。さいごまで 動く', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(59), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], PHANTOM_MORGANA);
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.equal(start.snap.bg, 'castle_water');
  assert.equal(start.snap.bgm, 'phantom');
  assert.equal(start.snap.boss, true);
  assert.equal(start.snap.canFlee, false);
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.deepEqual(en.map((x) => x.species), [PHANTOM_MORGANA, PHANTOM_MORGANA, PHANTOM_MORGANA]);
  assert.ok(en.every((x) => x.tide === 0 && x.tideMax > 0));
  await ken.settle(60000);
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
    eye(cx, cy, r) { colors.add('#ffffff'); colors.add('#1a1026'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 新しい 魔物 9しゅ（パレットの 中・はみださない・2コマ・大きさ）と 3人の まぼろし（もとの ボスの え・ちがう 色・すきとおる）', () => {
  const BW = 256, BASE_Y = 124;
  for (const id of NEW) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    assert.ok(d.size.every((v) => Number.isInteger(v) && v >= 20 && v <= 72), `${id}: size`);
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
  }
  for (const v of PHANTOM_VARIANTS) assert.ok(MONSTER_ART[MONSTERS[v].art], v);
  // まぼろし: もとの ボスの え の 大きさ・パレット ＋ 影の もや。1つの 色あいに そろえる（tint）・下が すきとおる（fade）
  for (const id of PHANTOMS) {
    const d = MONSTER_ART[id], base = MONSTER_ART[PHANTOM_BASE[id]];
    assert.ok(d && base && d !== base, id);
    assert.deepEqual(d.size, base.size);
    assert.ok(base.pal.every((c) => d.pal.includes(c)) && d.pal.length > base.pal.length, id);
    assert.equal(d.tint, PHANTOM_TINT[id]);
    assert.ok(d.fade && d.fade.at(-1)[1] < 0.5, `${id}: 下が すきとおる`);
    const s = stubG(...d.size);
    d.draw(s.g, 0);
    const pal = new Set(d.pal.map((c) => c.toLowerCase()));
    assert.deepEqual([...s.colors].filter((c) => !pal.has(String(c).toLowerCase())), [], `${id}: パレット`);
  }
  assert.equal(new Set(Object.values(PHANTOM_TINT).map((t) => t.hueTo)).size, 3, '3人とも ちがう 色');
  // 出現表の 3体が ならんでも ちぢみすぎない
  for (const t of Object.keys(ENCOUNTERS_PHANTOM)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
  assert.ok(MONSTER_ART.phantom_morgana.size[1] + 2 <= BASE_Y);
});

test('絵: 戦いの 背景 3つ（風の階・炎の階・水の階）と エフェクト（新しい 技 ぜんぶ）', () => {
  assert.deepEqual(Object.keys(PHANTOM_BG).sort(), ['castle_fire', 'castle_water', 'castle_wind']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(PHANTOM_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(PHANTOM_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawPhantomBg(ctx, d, 78);
    drawPhantomFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 120, `${id}: こまかく かく ${calls.length - n}`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const own = [...new Set(Object.values(PHANTOM_ABILITIES).map((a) => a.anim).filter((a) => a !== 'none'))];
  for (const a of own) {
    assert.equal(playPhantomFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, a);
    // 星の塔・クモイ・星読み・大地の神殿の エフェクトの あとに よばれる（battlefx-ch5.js → … → battlefx-earth.js → battlefx-phantom.js）
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playPhantomFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of PHANTOM_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(PHANTOM_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(PHANTOM_SFX)) assert.ok(own.includes(a), a);
});

test('がめん: まぼろしの ざんぞう・風のかべの わ・大炎の 前ぶれの すじ・水かさ（1人めだけ）・バナー', () => {
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const storm = { id: 'e1', species: PHANTOM_STORM, alive: true };
  const scene = { time: 100, enemies: () => [storm], layout: [] };
  const draw = (c, sc = scene) => { drawn.length = 0; phantomDraw(sc, x, {}, c, 10, 10, 70, 86, 1); return drawn.length; };
  assert.equal(draw({ species: 'ember_wolf', alive: true }), 0);
  const plain = draw(storm);
  storm.windWall = 1;
  assert.ok(draw(storm) > plain, '風のかべ');
  // 水かさ: 1人めだけ かく
  const m1 = { id: 'e1', species: PHANTOM_MORGANA, alive: true, tide: 3, tideMax: 6 };
  const m2 = { id: 'e2', species: PHANTOM_MORGANA, alive: true, tide: 3, tideMax: 6 };
  const sc2 = { time: 50, enemies: () => [m1, m2], layout: [] };
  assert.ok(draw(m1, sc2) > 0);
  assert.equal(draw(m2, sc2), 0);
  // バナー
  const banners = [];
  const sc = { game: { audio: { sfx() {} } }, banner: (t, k) => banners.push([t, k]), c: new Map([['a0', { name: 'ケン' }]]), enemies: () => [m1], shake() {}, allyFx() {} };
  phantomPresent(sc, { lines: [], psWall: 'e1' }, {}, null, null);
  phantomPresent(sc, { lines: [] }, { type: 'telegraph' }, null, { species: PHANTOM_STORM });
  phantomPresent(sc, { lines: [], psWallEnd: 'e1' }, {}, null, null);
  phantomPresent(sc, { lines: [], piCall: ['e2'] }, {}, null, null);
  phantomPresent(sc, { lines: [] }, { type: 'telegraph' }, null, { species: PHANTOM_IGNIA });
  phantomPresent(sc, { lines: [], piInferno: { fuel: 2 } }, {}, null, null);
  phantomPresent(sc, { lines: [], pmTide: { lv: 2, down: true } }, {}, null, null);
  phantomPresent(sc, { lines: [], pmTide: { lv: 6, full: true } }, {}, null, null);
  assert.deepEqual(banners.map((y) => y[1]), ['danger', 'danger', 'combo', 'danger', 'danger', 'danger', 'combo', 'danger']);
  assert.ok(banners[0][0].includes('風のかべ') && banners[5][0].includes('2体'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-phantom.js', 'public/js/shared/data/abilities-phantom.js', 'public/js/shared/data/items-castle.js',
    'public/js/shared/data/encounters-phantom.js', 'public/js/shared/data/companions-phantom.js', 'public/js/shared/battle-phantom.js', 'public/js/client/battle-phantom.js'];
  const all = gameFiles();
  for (const f of files) {
    const full = all.find((y) => y.endsWith(f));
    assert.ok(full, `${f} が gameFiles に ない`);
    const bad = checkFile(full).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
