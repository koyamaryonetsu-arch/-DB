// 第5章 Step 3・4「クモイ地方・しずみゆく島の古い神殿」B（戦い・品）
// 新しい 魔物（10しゅ）・出現表（t5_kumoi・t5_ruin_up・t5_ruin_low・t5_ruin_cloud）・仲間・ガイアイーター（gaia_eater）と
// 新しい しくみ「多部位の 戦い」（しっぽ・体・頭。まもり・こうら・土はこび・前ぶれの 大技・頭を たおすと 勝ち）・知っている 人の オート・
// シミュレーション・品（ハネノの 店・神殿の 宝箱・ボスの 品・空の レア・れん金）・絵・背景・エフェクト・がめん・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, EQUIP_RANKS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { monsterDrops, MAT_DROPS, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, familyPool } from '../public/js/shared/data/companions.js';
import { regionOf, regionRareList, rareIds, rarityOf, bossRareOf } from '../public/js/shared/data/rare-loot.js';
import { RECIPES, RECIPE_BY_ID, matchPot } from '../public/js/shared/data/alchemy.js';
import { MONSTERS_KUMOI, GAIA_PARTS, KUMOI_MAT_DROPS, GAIA, GAIA_BODY, GAIA_TAIL } from '../public/js/shared/data/monsters-kumoi.js';
import { KUMOI_ABILITIES } from '../public/js/shared/data/abilities-kumoi.js';
import { FRIENDS_KUMOI } from '../public/js/shared/data/companions-kumoi.js';
import { ENCOUNTERS_KUMOI, FIXED_KUMOI, ZONE_BG_KUMOI, KUMOI_VARIANTS } from '../public/js/shared/data/encounters-kumoi.js';
import {
  ITEMS_KUMOI, KUMOI_SHOP_WEAPONS, KUMOI_SHOP_ARMOR, KUMOI_SHOP_TOOLS, RUIN_TREASURE, KUMOI_RECIPES, KUMOI_ITEM_KANA,
} from '../public/js/shared/data/items-kumoi.js';
import { gaiaFocus, gaiaState, gaiaPlan, GAIA_BIG, GAIA_ORDER, NOTE_MAX } from '../public/js/shared/battle-gaia.js';
import { towerCond } from '../public/js/shared/battle-ch5.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeChar, runBattle, CH5_KUMOI } from '../tools/sim.js';
import { gaiaRun, gaiaParty, GAIA_KIT } from '../tools/sim-gaia.mjs';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { KUMOI_BG, KUMOI_DECOS, drawKumoiBg, drawKumoiFloorBg } from '../public/js/client/render/ch5-kumoi-bg.js';
import { playKumoiFx } from '../public/js/client/render/battlefx-kumoi.js';
import { playTowerFx } from '../public/js/client/render/battlefx-ch5.js';
import { GAIA_SCREEN_ANIMS, GAIA_ALLY_FX, GAIA_SFX, gaiaDraw, gaiaView, gaiaPresent } from '../public/js/client/battle-gaia.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NEW = Object.keys(MONSTERS_KUMOI).filter((id) => id !== GAIA);
const KUMOI = ['cloud_sheep', 'sky_ray', 'thunder_puff', 'sky_serpent'];
const RUIN = ['stone_keeper', 'rock_mole', 'gaia_larva', 'haniwa_soldier'];
const CLOUD = ['cloud_wraith', 'cloud_wyvern'];
const PARTY = (lv = 45) => [makeChar('warrior', lv, 10, 'せんし', 48), makeChar('priest', lv, 10, 'そうりょ', 48), makeChar('mage', lv, 10, 'まほう', 48), makeChar('monk', lv, 10, 'ぶとう', 48)];
const GROUP = () => FIXED_ENCOUNTERS.gaia_eater.group.flatMap(([sp, n]) => Array(n).fill(sp));
function battle(opts = {}) {
  const party = opts.party || PARTY();
  const allies = party.map((c) => ({ char: c, kind: 'support', auto: true, tactics: 'balanced' }));
  const b = new Battle({ rng: makeRng(opts.seed ?? 3), allies, enemies: opts.enemies || GROUP(), boss: true, canFlee: false });
  for (const a of b.allies) a.use = null;
  const part = (sp) => b.enemies.find((e) => e.species === sp);
  return { b, tail: part(GAIA_TAIL), body: part(GAIA_BODY), head: part(GAIA), w: b.allies[0], p: b.allies[1], m: b.allies[2], k: b.allies[3] };
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
const dmgTo = (ev, t) => (ev.results || []).filter((r) => r.id === t.id).reduce((s, r) => s + (r.dmg || 0), 0);

// ───────────── データ ─────────────
test('魔物: クモイ地方 4・神殿 4・雲の中 2 の 新しい 魔物 10しゅ（Lv43〜47・空の レアの 地方 6）と ガイアイーター。技も ぜんぶ ある', () => {
  assert.deepEqual(NEW.slice().sort(), [...KUMOI, ...RUIN, ...CLOUD].sort());
  for (const id of Object.keys(MONSTERS_KUMOI)) {
    const m = MONSTERS[id];
    assert.equal(m, MONSTERS_KUMOI[id], `${id}: monsters.js に まざる`);
    assert.ok(m.name && m.desc, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    if (id === GAIA) continue;
    assert.ok(m.lv >= 43 && m.lv <= 47 && !m.boss, id);
    assert.equal(regionOf(id), 6, `${id}: 空の レアの 地方`);
  }
  for (const [id, a] of Object.entries(KUMOI_ABILITIES)) assert.equal(ABILITIES[id], a, `abilities.js に まざる: ${id}`);
  // 雲の 中の 魔物は 強くて、経験値と お金が 多い
  const avg = (ids, k) => ids.reduce((s, id) => s + MONSTERS[id][k], 0) / ids.length;
  for (const k of ['exp', 'gold', 'hp']) assert.ok(avg(CLOUD, k) > avg([...KUMOI, ...RUIN], k) * 1.25, k);
  // 弱点: 雷雲は 風・雷の 魔物は 雷が 効きにくい・石の守り手は 爆発・つちくいムカデは 炎
  assert.ok(MONSTERS.thunder_puff.resist.bolt === 0 && MONSTERS.thunder_puff.resist.wind > 1.2);
  assert.ok(MONSTERS.stone_keeper.resist.blast > 1.2 && MONSTERS.gaia_larva.resist.fire > 1.2);
});

test('ガイアイーター: 部位は しっぽ・体・頭（gaia_tail・gaia_body・gaia_eater）。部位は 図鑑に 出ない（数えない 形）・頭を たおすと のこりも くずれる', () => {
  const head = MONSTERS[GAIA];
  assert.equal(head.name, 'ガイアイーター');
  assert.ok(head.boss && head.size === 'xl');
  assert.deepEqual(head.minionsFall.slice().sort(), [GAIA_BODY, GAIA_TAIL].sort());
  for (const [id, m] of Object.entries(GAIA_PARTS)) {
    assert.equal(MONSTERS[id], m, id);
    assert.ok(!Object.keys(MONSTERS).includes(id), `${id}: 図鑑・魔物の 数に 出ない`);
    assert.ok(m.boss && m.noBefriend && m.part === GAIA, id);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
  }
  assert.deepEqual([head.gaia.part, MONSTERS[GAIA_BODY].gaia.part, MONSTERS[GAIA_TAIL].gaia.part], ['head', 'body', 'tail']);
  assert.ok(head.gaia.guard > 0 && head.gaia.guard < 1);
  assert.ok(MONSTERS[GAIA_BODY].gaia.shell > 0 && MONSTERS[GAIA_BODY].gaia.shell < 1);
  assert.ok(MONSTERS[GAIA_TAIL].gaia.feed > 0);
  // 部位ごとの 弱点（頭 氷・体 爆発・しっぽ 炎）と 前ぶれの ある 大技
  assert.ok(head.resist.ice > 1 && MONSTERS[GAIA_BODY].resist.blast > 1 && MONSTERS[GAIA_TAIL].resist.fire > 1);
  const tele = (sp) => MONSTERS[sp].actions.map((a) => ABILITIES[a.id]?.effect).filter((e) => e?.type === 'telegraph').map((e) => e.next);
  assert.deepEqual([...tele(GAIA), ...tele(GAIA_BODY), ...tele(GAIA_TAIL)].sort(), GAIA_BIG.slice().sort());
  for (const id of GAIA_BIG) assert.equal(ABILITIES[id].target, 'enemies', id);
  assert.equal(head.phases.length, 1);
});

test('落とす物: ガイアイーターは 大ムカデのキバのお守り（1人 1つ）と 大ムカデのよろい（★2）を かならず。ふつうの 魔物は よく・レア・素材', () => {
  const d = monsterDrops(GAIA);
  assert.deepEqual(d.filter((x) => x.kind === 'boss').map((x) => x.item), ['gaia_fang_charm']);
  assert.equal(bossRareOf(GAIA), 'mukade_mail');
  const rng = makeRng(9);
  for (let i = 0; i < 10; i++) {
    const got = rollDrops(GAIA, rng);
    assert.ok(got.includes('gaia_fang_charm') && got.includes('mukade_mail'));
  }
  assert.ok(ITEMS.gaia_fang_charm.unique && ITEMS.gaia_fang_charm.type === 'acc' && ITEMS.gaia_fang_charm.rank === 8);
  for (const id of NEW) {
    const list = monsterDrops(id);
    assert.ok(list.some((x) => x.kind === 'common') && list.some((x) => x.kind === 'rare'), id);
    assert.ok(MAT_DROPS[id] && ITEMS[MAT_DROPS[id][0]], `${id}: 素材`);
  }
  assert.deepEqual(Object.keys(KUMOI_MAT_DROPS).sort(), NEW.slice().sort());
  for (const id of ['cloud_cotton', 'land_shard']) assert.equal(ITEMS[id].type, 'mat');
});

test('仲間: 新しい 魔物 10しゅは 仲間に なる（1/12〜1/24・系統配合の 子には ならない・覚える 技は 味方で うごく もの）。ガイアイーターは ならない', () => {
  assert.deepEqual(Object.keys(FRIENDS_KUMOI).sort(), NEW.slice().sort());
  const bad = new Set(['callHelp', 'stance', 'telegraph', 'reflect', 'foresee', 'burrow', 'mirage', 'flee', 'gaiaFeed', 'gaiaEat']);
  for (const [id, f] of Object.entries(FRIENDS_KUMOI)) {
    assert.equal(MONSTER_FRIENDS[id], f, `${id}: companions.js に まざる`);
    assert.ok(f.rate >= 1 / 24 && f.rate <= 1 / 12, `${id}: ${f.rate}`);
    assert.equal(f.noFamily, true);
    assert.ok(!familyPool(MONSTERS[id].race, MONSTERS).includes(id), id);
    assert.equal(f.names.length, 4);
    const sum = Object.values(f.growth).reduce((s, v) => s + v, 0);
    assert.ok(sum >= 5.8 - 1e-9 && sum <= 7.3, `${id}: growth ${sum}`);
    for (const [lv, ab] of f.learn) {
      assert.ok(ABILITIES[ab] && !bad.has(ABILITIES[ab].effect.type) && lv >= 1, `${id}: ${ab}`);
    }
    assert.ok(f.note);
  }
  // 雲の 中の 魔物は めったに 仲間に ならない
  for (const id of CLOUD) assert.ok(FRIENDS_KUMOI[id].rate <= 1 / 20, id);
  for (const id of [GAIA, GAIA_BODY, GAIA_TAIL]) assert.equal(MONSTER_FRIENDS[id], undefined, id);
});

test('出現表と きまった 戦い: 名前の 約束（t5_kumoi・t5_ruin_up・t5_ruin_low・t5_ruin_cloud／gaia_eater・背景 kumoi・sink_ruin・sink_ruin_deep・曲 gaia）', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS_KUMOI).sort(), ['t5_kumoi', 't5_ruin_cloud', 't5_ruin_low', 't5_ruin_up']);
  const species = (t) => new Set(ENCOUNTER_TABLES[t].flatMap((e) => e.group.map(([sp]) => sp)));
  for (const t of Object.keys(ENCOUNTERS_KUMOI)) {
    assert.equal(ENCOUNTER_TABLES[t], ENCOUNTERS_KUMOI[t]);
    assert.equal(NIGHT_ZONES[t], undefined, `${t}: 昼と 夜の 区別は ない`);
    assert.equal(ZONE_BG[t], ZONE_BG_KUMOI[t]);
    for (const e of ENCOUNTER_TABLES[t]) {
      assert.ok(e.w > 0);
      for (const [sp, mn, mx] of e.group) {
        assert.ok(MONSTERS[sp] && !MONSTERS[sp].boss, `${t}: ${sp}`);
        assert.ok(mn >= 0 && mx >= mn && mx <= 3);
      }
    }
    assert.ok([...species(t)].some((sp) => MONSTERS_KUMOI[sp] || MONSTERS[sp]?.variant), `${t}: 新しい 魔物`);
  }
  for (const sp of KUMOI) assert.ok(species('t5_kumoi').has(sp), sp);
  for (const sp of ['stone_keeper', 'rock_mole']) assert.ok(species('t5_ruin_up').has(sp), sp);
  for (const sp of ['gaia_larva', 'haniwa_soldier']) assert.ok(species('t5_ruin_low').has(sp), sp);
  for (const sp of CLOUD) assert.ok(species('t5_ruin_cloud').has(sp), sp);
  // 色ちがい（data/variants.js）: 雲の 中だけ。図鑑・魔物の 数には 出ない
  assert.deepEqual(KUMOI_VARIANTS, ['v_dark_cloud_sheep', 'v_red_gaia_larva']);
  for (const id of KUMOI_VARIANTS) {
    assert.ok(MONSTERS[id]?.variant && !Object.keys(MONSTERS).includes(id), id);
    assert.ok(species('t5_ruin_cloud').has(id), id);
  }
  assert.deepEqual(ZONE_BG_KUMOI, { t5_kumoi: 'kumoi', t5_ruin_up: 'sink_ruin', t5_ruin_low: 'sink_ruin_deep', t5_ruin_cloud: 'sink_ruin_deep' });
  assert.deepEqual(Object.keys(FIXED_KUMOI), ['gaia_eater']);
  const f = FIXED_ENCOUNTERS.gaia_eater;
  assert.equal(f, FIXED_KUMOI.gaia_eater);
  assert.deepEqual(f.group.map(([sp]) => sp), GAIA_ORDER, '左から しっぽ・体・頭');
  assert.equal(f.bg, 'sink_ruin_deep');
  assert.equal(f.bgm, 'gaia');
  assert.ok(f.boss && f.canFlee === false && f.loseOk === undefined);
  for (const bg of ['kumoi', 'sink_ruin', 'sink_ruin_deep']) assert.ok(battleBgSpec(bg), bg);
});

// ───────────── 品 ─────────────
test('ハネノの 店（ランク8「光」・★なし）: 武器は 10しゅるい ぜんぶ・防具（よろい 4しゅ・たて・かぶと・ぼうし）・道具', () => {
  assert.equal(EQUIP_RANKS.find((r) => r.rank === 8).where, '第5章の雲の上の町ハネノ');
  for (const id of [...KUMOI_SHOP_WEAPONS, ...KUMOI_SHOP_ARMOR]) {
    const it = ITEMS[id];
    assert.ok(it && it.rank === 8 && it.price > 0 && rarityOf(id) === 0 && !it.star && !it.unique, id);
    assert.ok(KUMOI_ITEM_KANA[id], id);
  }
  assert.deepEqual(KUMOI_SHOP_WEAPONS.map((id) => ITEMS[id].cat).sort(), ['axe', 'bat', 'boomerang', 'claw', 'dagger', 'fan', 'spear', 'staff', 'sword', 'whip']);
  assert.deepEqual(KUMOI_SHOP_ARMOR.filter((id) => ITEMS[id].type === 'armor').map((id) => ITEMS[id].armorType).sort(), ['cloth', 'gi', 'heavy', 'robe']);
  assert.ok(KUMOI_SHOP_ARMOR.some((id) => ITEMS[id].type === 'shield'));
  assert.ok(KUMOI_SHOP_ARMOR.some((id) => ITEMS[id].type === 'head' && ITEMS[id].helm) && KUMOI_SHOP_ARMOR.some((id) => ITEMS[id].type === 'head' && !ITEMS[id].helm));
  // ランク7（ドゥナ）より 強い
  assert.ok(ITEMS.light_sword.atk > ITEMS.platinum_sword.atk && ITEMS.light_mail.def > ITEMS.platinum_mail.def);
  for (const id of KUMOI_SHOP_TOOLS) assert.ok(ITEMS[id]?.type === 'use' && ITEMS[id].price > 0, id);
  assert.ok(KUMOI_SHOP_TOOLS.includes('kumo_wataame') && KUMOI_SHOP_TOOLS.includes('hanebito_salve'));
});

test('神殿の 宝箱（RUIN_TREASURE）: 1〜7階に 1〜2こ・そこだけの ★2〜★4。深い 階ほど 強い（レア度が 下がらない）', () => {
  assert.deepEqual(Object.keys(RUIN_TREASURE).map(Number), [1, 2, 3, 4, 5, 6, 7]);
  const shop = new Set([...KUMOI_SHOP_WEAPONS, ...KUMOI_SHOP_ARMOR]);
  let prev = 0;
  const all = [];
  for (let f = 1; f <= 7; f++) {
    const list = RUIN_TREASURE[f];
    assert.ok(list.length >= 1 && list.length <= 2, `${f}階`);
    for (const id of list) {
      const it = ITEMS[id];
      assert.ok(it && ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type), id);
      assert.ok(rarityOf(id) >= 2 && rarityOf(id) <= 4, `${id}: ★${rarityOf(id)}`);
      assert.ok(rarityOf(id) >= prev, `${f}階 ${id}: 深い 階ほど 強い`);
      assert.ok(!(it.price > 0) && it.sell > 0 && !shop.has(id) && (it.type === 'acc' || ITEMS[`${id}+1`]), id);
      assert.ok(KUMOI_ITEM_KANA[id] && it.desc, id);
      all.push(id);
    }
    prev = Math.max(...list.map(rarityOf));
  }
  assert.equal(new Set(all).size, all.length, 'ぜんぶ ちがう 品');
  // 宝の洞窟・魔物・ひみつのダンジョン・ボスの 品の 中には 入らない（そこだけ）
  for (const src of ['tm', 'boss', 'region', 'sd']) for (const id of all) assert.ok(!rareIds(src).includes(id), `${src}: ${id}`);
  assert.equal(rarityOf('tenku_sword'), 4);
});

test('空の レア: 雲の上の 魔物は まれに（500体に 1体）地方 6 の レア装備。れん金の レシピ 3つ（この章の 素材）', () => {
  const sky = regionRareList('cloud_sheep');
  assert.deepEqual(sky.slice().sort(), ['hayate_sword', 'nimbus_broom', 'wing_sandals']);
  for (const id of sky) assert.ok(rarityOf(id) >= 2 && ITEMS[id].region === 6, id);
  // 星の塔の 魔物は 今までどおり 地方 5
  assert.equal(regionOf('comet_bird'), 5);
  assert.ok(!regionRareList('comet_bird').includes('hayate_sword'));
  // れん金
  assert.ok(KUMOI_RECIPES.length >= 2 && KUMOI_RECIPES.length <= 4);
  for (const r of KUMOI_RECIPES) {
    assert.equal(RECIPE_BY_ID[r.id], RECIPES.find((x) => x.id === r.id), r.id);
    assert.equal(r.tier, 5);
    assert.ok(r.ins.some((id) => ['cloud_cotton', 'land_shard'].includes(id)), `${r.id}: この章の 素材`);
    const m = matchPot(r.ins);
    assert.ok(m.ok && m.out === r.out, r.id);
  }
  assert.equal(matchPot(['mukade_mail', 'land_shard', 'land_shard']).out, 'gaia_god_mail');
  assert.equal(rarityOf('gaia_god_mail'), 4);
  for (const id of Object.keys(ITEMS_KUMOI)) assert.equal(ITEMS[id], ITEMS_KUMOI[id], id);
});

// ───────────── 多部位の 戦い ─────────────
test('はじめ: 頭の 名前は「ガイアイーターの頭」。どの 部位が 何を して いるかの ことば。がめんへ 部位（gaiaPart）', () => {
  const { b, head, body, tail } = battle();
  assert.equal(head.name, 'ガイアイーターの頭');
  assert.equal(body.name, 'ガイアイーターの体');
  assert.equal(tail.name, 'ガイアイーターのしっぽ');
  const start = b.flush().find((e) => e.fx?.type === 'gaia_start');
  assert.ok(start && start.lines.some((l) => l.includes('守られている')) && start.lines.some((l) => l.includes('土をはこんでいる')));
  assert.deepEqual([pub(tail).gaiaPart, pub(body).gaiaPart, pub(head).gaiaPart], ['tail', 'body', 'head']);
  assert.deepEqual(gaiaState(b, head), { part: 'head', guarded: true, shell: false, fed: false });
  assert.deepEqual(gaiaState(b, body), { part: 'body', guarded: false, shell: true, fed: true });
  // ねらいめは しっぽ → 体 → 頭
  assert.equal(gaiaFocus(b), tail);
  b.kill(tail);
  assert.equal(gaiaFocus(b), body);
  b.kill(body);
  assert.equal(gaiaFocus(b), head);
});

test('まもり: 体が 生きている 間は 頭への ダメージが へる（体が たおれると もとどおり）。ことばは さいしょの 数回だけ', () => {
  const run = (killBody) => {
    const { b, head, body, w } = battle({ seed: 5 });
    if (killBody) b.kill(body);
    let sum = 0;
    let said = 0;
    for (let i = 0; i < 6; i++) {
      head.hp = head.maxHp;
      const ev = act(b, w, { type: 'attack', target: head.id });
      sum += dmgTo(ev, head);
      if (has(ev, 'ダメージがとどきにくい')) said++;
    }
    return { sum, said };
  };
  const guarded = run(false), open = run(true);
  const k = MONSTERS[GAIA].gaia.guard;
  assert.ok(guarded.sum < open.sum * (k + 0.12) && guarded.sum > open.sum * (k - 0.12), `${guarded.sum} / ${open.sum}`);
  assert.equal(guarded.said, NOTE_MAX);
  assert.equal(open.said, 0);
});

test('こうら: 体への ふつうの ダメージは 半分。爆発の 呪文と 合体技は そのまま（こうらを つらぬく）', () => {
  const { b, body, w, m } = battle({ seed: 7 });
  const phys = (t) => { const ev = act(b, w, { type: 'attack', target: t.id }); return dmgTo(ev, t); };
  // 物理: 体と おなじ 守りの ほかの 部位と くらべる かわりに、こうらの 倍率を なくした ときと くらべる
  let a = 0, c = 0;
  for (let i = 0; i < 6; i++) { body.hp = body.maxHp; a += phys(body); }
  const conf = body.species && MONSTERS[GAIA_BODY].gaia;
  const save = conf.shell;
  conf.shell = 1;
  for (let i = 0; i < 6; i++) { body.hp = body.maxHp; c += phys(body); }
  conf.shell = save;
  assert.ok(a < c * 0.65 && a > c * 0.35, `${a} / ${c}`);
  // 爆発の 呪文（イオラ）: こうらの ことばは 出ず、「つらぬいた」
  m.abilities.push('iora');
  m.mp = 999;
  const ev = act(b, m, { type: 'ability', id: 'iora', target: body.id });
  assert.ok(!has(ev, 'こうらで、ダメージが半分'));
  assert.ok(has(ev, 'こうらをつらぬいた'));
});

test('土はこび: しっぽは 体と 頭の キズを ふさぐ（さいだいHPの 5%）。へって いない 時は 使わない。体は 土を 食べて 回復', () => {
  const { b, tail, body, head } = battle();
  const feed = MONSTERS[GAIA_TAIL].actions.find((a) => a.id === 'm_gaia_feed');
  assert.ok(feed.cond.includes('c5:gaiaFeed'));
  // へって いない 時は 使わない（c5:gaiaFeed。ai.js の condOk → battle-ch5.js の towerCond）
  assert.equal(towerCond(b, tail, 'gaiaFeed'), false);
  assert.equal(towerCond(b, body, 'gaiaHurt'), false);
  body.hp -= 2000;
  head.hp -= 2000;
  assert.equal(towerCond(b, tail, 'gaiaFeed'), true);
  assert.equal(towerCond(b, body, 'gaiaHurt'), true);
  const ev = act(b, tail, { type: 'ability', id: 'm_gaia_feed' });
  const heal = (t) => (ev.results || []).find((r) => r.id === t.id)?.heal || 0;
  assert.equal(heal(body), Math.round(body.maxHp * 0.05));
  assert.equal(heal(head), Math.round(head.maxHp * 0.05));
  assert.equal(ev.fx.type, 'gaiaFeed');
  assert.deepEqual(ev.fx.targets.sort(), [body.id, head.id].sort());
  // 体が たおれると、頭だけ
  b.kill(body);
  const ev2 = act(b, tail, { type: 'ability', id: 'm_gaia_feed' });
  assert.deepEqual(ev2.fx.targets, [head.id]);
  // 体の 土を食べる（じぶん）
  const { b: b2, body: body2 } = battle();
  body2.hp = Math.round(body2.maxHp * 0.5);
  const ev3 = act(b2, body2, { type: 'ability', id: 'm_gaia_eat' });
  assert.equal((ev3.results || []).find((r) => r.id === body2.id).heal, Math.round(body2.maxHp * 0.06));
});

test('前ぶれ: 頭は「大あごを大きく開けた」→ 次の 番に 大地のみこみ（みんな。身を 守ると 半分）。体・しっぽも 前ぶれの ある 大技', () => {
  const { b, head, w, p } = battle({ seed: 11 });
  const ev = act(b, head, { type: 'ability', id: 'm_gaia_maw' });
  assert.equal(head.telegraph, 'm_gaia_devour');
  assert.ok(has(ev, '大あごを大きく開けた'));
  // 身を 守った 人は 半分くらい
  w.defending = true;
  let a = 0, c = 0;
  for (let i = 0; i < 8; i++) {
    w.hp = w.maxHp; p.hp = p.maxHp;
    const e = act(b, head, { type: 'ability', id: 'm_gaia_devour', big: true });
    a += dmgTo(e, w);
    w.defending = false;
    w.hp = w.maxHp;
    const e2 = act(b, head, { type: 'ability', id: 'm_gaia_devour', big: true });
    c += dmgTo(e2, w);
    w.defending = true;
  }
  assert.ok(a < c * 0.65, `${a} / ${c}`);
  assert.ok(ABILITIES.m_gaia_needles.effect.random && ABILITIES.m_gaia_needles.effect.hits === 6);
});

test('頭を たおすと 勝ち: のこりの 体も くずれおちる。しっぽ・体を たおすと 短い ことば', () => {
  const { b, tail, body, head, w } = battle();
  tail.hp = 1;
  const ev = act(b, w, { type: 'attack', target: tail.id });
  if (!tail.alive) {
    assert.ok(has(ev, 'しっぽがちぎれた') && ev.gaiaPart.part === 'tail');
  }
  b.kill(tail);
  const ev2 = evOf(w);
  b.kill(body, null, ev2);
  b.cur = null;
  assert.ok((ev2.postLines || []).some((l) => l.includes('頭がむき出しになった')));
  const lines = b.kill(head);
  assert.ok(lines.some((l) => l.includes('くずれおちた')) || !b.aliveEnemies().length);
  b.checkEnd();
  assert.equal(b.aliveEnemies().length, 0);
  // 頭が 先に たおれても、のこりは いっしょに くずれる（勝ち）
  const s = battle();
  s.b.kill(s.head);
  assert.ok(!s.tail.alive && !s.body.alive);
});

test('オートの 仲間（ふつう）は 何も かわらない。知っている 人（knowsGaia）は 大技の 前に 身を 守り、しっぽ → 体 → 頭の じゅんに ねらう', () => {
  const { b, tail, body, head, w } = battle({ seed: 13 });
  assert.equal(gaiaPlan(b, w, decideAlly), null, 'ふつうの オート');
  b.knowsGaia = true;
  for (let i = 0; i < 6; i++) {
    const cmd = decideAlly(b, w);
    if (cmd.target && b.get(cmd.target)?.side === 'enemy') assert.equal(cmd.target, tail.id, JSON.stringify(cmd));
  }
  b.kill(tail);
  for (let i = 0; i < 4; i++) {
    const cmd = decideAlly(b, w);
    if (cmd.target && b.get(cmd.target)?.side === 'enemy') assert.equal(cmd.target, body.id);
  }
  // 大技が 自分の 番より 先に 来る: 身を 守る
  head.telegraph = 'm_gaia_devour';
  head.atb = 95;
  w.atb = 0;
  assert.deepEqual(decideAlly(b, w), { type: 'defend' });
});

// ───────────── シミュレーション・きまった 戦い ─────────────
test('シミュレーション: tools/sim.js の ch5kumoi（出現表）と tools/sim-gaia.mjs（超級職 4人。完全オート／知っている）。さいごまで 戦える', () => {
  assert.deepEqual([...new Set(CH5_KUMOI.map((x) => x[0]))], ['t5_kumoi', 't5_ruin_up', 't5_ruin_low', 't5_ruin_cloud']);
  for (const t of Object.keys(ENCOUNTERS_KUMOI)) {
    const group = ENCOUNTER_TABLES[t][0].group.flatMap(([sp, , mx]) => Array(mx).fill(sp));
    const r = runBattle(PARTY(45), group, { seed: 3 });
    assert.equal(r.outcome, 'win', t);
  }
  // 超級職 4人（勇者・大賢者・ゴッドハンド・大神官）
  assert.deepEqual(gaiaParty(45).map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  for (const k of Object.values(GAIA_KIT)) for (const id of k) assert.ok(id === null || ITEMS[id], id);
  for (const know of [false, true]) {
    const r = gaiaRun(45, know, 777);
    assert.ok(['win', 'lose'].includes(r.outcome), `${know}: ${r.outcome}`);
    if (know) assert.ok(r.duals > 0, '知っている 人は 合体技');
  }
});

test('きまった 戦い gaia_eater: 台本の ["battle", "gaia_eater"] と おなじ（背景・曲・ボス・部位の ならび）。さいごまで 動く', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(57), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  ken.s.busy = null;
  const done = startFixedBattle(world, ken.s, [ken.s], 'gaia_eater');
  const start = ken.msgs.filter((x) => x.t === 'battleStart').pop();
  assert.equal(start.snap.bg, 'sink_ruin_deep');
  assert.equal(start.snap.bgm, 'gaia');
  assert.equal(start.snap.boss, true);
  assert.equal(start.snap.canFlee, false);
  const en = start.snap.combatants.filter((x) => x.side === 'enemy');
  assert.deepEqual(en.map((x) => x.species), GAIA_ORDER);
  assert.deepEqual(en.map((x) => x.gaiaPart), ['tail', 'body', 'head']);
  assert.equal(en[2].name, 'ガイアイーターの頭');
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
    eye(cx, cy, r) { colors.add('#ffffff'); pts.push([cx - r, cy - r], [cx + r, cy + r]); },
    dot(x, y, c) { colors.add(c); pts.push([x, y]); },
  };
  return { g, colors, pts };
}
const outside = (pts, w, h, extra = 0.6) => pts.filter(([x, y]) => x < -(1 + extra) / w || x > 1 + (1 + extra) / w || y < -(1 + extra) / h || y > 1 + (1 + extra) / h);

test('絵: 新しい 魔物 10しゅと ガイアイーター（体ぜんぶ）・部位 3つ（パレットの 中・はみださない・2コマ・大きさ）', () => {
  const BW = 256, BASE_Y = 124;
  const ids = [...NEW, GAIA, 'gaia_tail', 'gaia_body', 'gaia_head'];
  for (const id of ids) {
    const d = MONSTER_ART[id];
    assert.ok(d, `${id} の え`);
    const max = id.startsWith('gaia_') && id !== 'gaia_larva' ? 130 : 70;
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
    if (MONSTERS[id]?.flying) assert.ok(W > H, `${id}: とぶ 魔物は よこに ひろい`);
  }
  // 部位 3つが ならんで 戦いの え に 入る（ちぢめても 0.9 より 大きい）・頭が いちばん 高い
  const parts = ['gaia_tail', 'gaia_body', 'gaia_head'].map((id) => MONSTER_ART[id].size);
  const total = parts.reduce((s, [w]) => s + w + 6, 0);
  assert.ok(total * 0.9 <= BW - 12, `${total}`);
  assert.ok(parts[2][1] > parts[1][1] && parts[1][1] > parts[0][1]);
  assert.ok(parts.every(([, h]) => h + 2 <= BASE_Y));
  // 体ぜんぶの え（図鑑・showMon）は アルゴスと おなじ くらい 大きい
  const [gw, gh] = MONSTER_ART[GAIA].size;
  assert.ok(gw <= BW - 12 && gw * gh >= MONSTER_ART.argos.size[0] * MONSTER_ART.argos.size[1] * 0.8);
  // 出現表の 3体が ならんでも ちぢみすぎない
  for (const t of Object.keys(ENCOUNTERS_KUMOI)) {
    for (const e of ENCOUNTER_TABLES[t]) {
      const wsum = e.group.reduce((s, [sp, , mx]) => s + mx * ((MONSTER_ART[MONSTERS[sp].art || sp]?.size[0] || 40) + 6), 0);
      assert.ok(wsum * 0.55 <= BW - 12, `${t}: ${JSON.stringify(e.group)}`);
    }
  }
});

test('絵: 戦いの 背景 3つ（雲の上の 島・古い神殿・雲が 入った 下の 階）と エフェクト（新しい 技 ぜんぶ）', () => {
  assert.deepEqual(Object.keys(KUMOI_BG).sort(), ['kumoi', 'sink_ruin', 'sink_ruin_deep']);
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...args) => { calls.push(k); return undefined; }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (const [id, d] of Object.entries(KUMOI_BG)) {
    assert.equal(battleBgSpec(id), d);
    assert.ok(KUMOI_DECOS.has(d.deco));
    assert.ok(d.sky.length >= 3 && d.ground.length === 2);
    const n = calls.length;
    drawKumoiBg(ctx, d, 78);
    drawKumoiFloorBg(ctx, d, 78);
    assert.ok(calls.length - n > 200, `${id}: こまかく かく`);
  }
  const fx = new Proxy({}, { get: () => () => {} });
  const reuse = new Set(['guard', 'buff']);
  const own = [...new Set(Object.values(KUMOI_ABILITIES).map((a) => a.anim).filter((a) => !reuse.has(a)))];
  for (const a of own) {
    assert.equal(playKumoiFx(fx, a, [{ x: 100, y: 60 }], null, { from: { x: 120, y: 50 }, to: [{ x: 128, y: 120 }] }), true, a);
    // 星の塔の エフェクトの あとに よばれる（battlefx-ch4.js → battlefx-ch5.js → battlefx-kumoi.js）
    assert.equal(playTowerFx(fx, a, [{ x: 100, y: 60 }], null, { to: [] }), true, a);
  }
  assert.equal(playKumoiFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of GAIA_SCREEN_ANIMS) assert.ok(own.includes(a), a);
  for (const a of Object.keys(GAIA_ALLY_FX)) assert.ok(own.includes(a), a);
  for (const a of Object.keys(GAIA_SFX)) assert.ok(own.includes(a), a);
  for (const a of ['maw_charge', 'rumble_charge', 'needle_charge', 'gaia_feed']) assert.ok(own.includes(a), a);
});

test('がめん: ねらいめ（しっぽ → 体 → 頭）・頭の まもりの たて・土はこびの つぶ を かく。部位が たおれると ねらいめが 次へ', () => {
  const mk = (species, alive = true) => ({ species, alive });
  const tail = mk(GAIA_TAIL), body = mk(GAIA_BODY), head = mk(GAIA);
  const scene = { enemies: () => [tail, body, head], time: 100 };
  assert.equal(gaiaView(scene).focus, tail);
  const drawn = [];
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...args) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const draw = (c) => { drawn.length = 0; gaiaDraw(scene, x, {}, c, 10, 10, 80, 80, 1); return drawn.length; };
  const ring = draw(tail);
  assert.ok(ring > 0, 'しっぽに ねらいめ');
  assert.ok(draw(head) > 0, '頭に まもりの たて');
  assert.ok(draw(body) > 0, '体に 土はこびの つぶ');
  tail.alive = false;
  assert.equal(gaiaView(scene).focus, body);
  assert.equal(draw(tail), 0, 'たおれた 部位は かかない');
  body.alive = false;
  assert.equal(gaiaView(scene).focus, head);
  const onlyRing = draw(head);
  assert.ok(onlyRing > 0);
  assert.equal(draw({ species: 'argos', alive: true }), 0, 'ほかの 魔物は かかない');
  // ねらう じゅんの ヒントは わ だけ（家族の 答え）: はじめの バナーは 出さない・図鑑にも 順番は 書かない
  const banners = [];
  const sc = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), c: new Map(), fx: { play() {} } };
  gaiaPresent(sc, { lines: [] }, { type: 'gaia_start' }, null, null);
  assert.deepEqual(banners, []);
  gaiaPresent(sc, { lines: [], gaiaPart: { part: 'tail' } }, {}, null, null);
  assert.equal(banners.length, 1, '部位を たおした ときは 短い バナー');
  assert.ok(!MONSTERS[GAIA].desc.includes('順に'));
});

// ───────────── 文字 ─────────────
test('文字: 新しい ゲームの 文の ファイルは gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = ['public/js/shared/data/monsters-kumoi.js', 'public/js/shared/data/abilities-kumoi.js', 'public/js/shared/data/items-kumoi.js', 'public/js/shared/data/encounters-kumoi.js',
    'public/js/shared/data/companions-kumoi.js', 'public/js/shared/battle-gaia.js', 'public/js/client/battle-gaia.js'];
  const list = gameFiles();
  for (const f of files) {
    const full = list.find((x) => x.endsWith(f));
    assert.ok(full, `gameFiles: ${f}`);
    const bad = checkFile(full).filter((p) => p.kind === 'kanji' || p.kind === 'space');
    assert.deepEqual(bad, [], f);
  }
});
