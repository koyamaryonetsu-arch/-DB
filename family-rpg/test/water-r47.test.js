// 第47回: 新しい 属性「水」（water）。docs/plan-r47-water.md
//  ・属性の 一覧・画面の しるし（色）・図鑑と 見える化の ならびに 水が 入る
//  ・水の 技（もとから 水の 技・ほかの 属性で 代わりに して いた 技）は element: 'water'。氷の 技は 氷の まま
//  ・魔物の 水の 効きぐあいは きまり（data/water.js）で つく。1体ずつ きめた もの・色ちがい・ボス・古い セーブ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ABILITIES, ELEMENT_NAMES, ELEMENT_ORDER, abilityTypeText, abilityRole } from '../public/js/shared/data/abilities.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import {
  WATER_VALUES, WATER_BOSS_WEAK_MAX, WATER_OVERRIDE, WATER_SEA, WATER_FIRE, WATER_SAND, WATER_ROCK, WATER_MACHINE, WATER_RULE, waterRuleOf,
} from '../public/js/shared/data/water.js';
import { registerVariant, variantId } from '../public/js/shared/data/variants.js';
import { deduceElement } from '../public/js/shared/data/abilities-jobs6.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { traitText } from '../public/js/shared/data/rare-loot.js';
import { ELEMENT_FX } from '../public/js/client/render/battlefx-r27.js';
import { newCharacter, newMonsterCompanion, computeStats, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { noteTried } from '../public/js/shared/world/party.js';
import { Battle, affinityOf } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';

const src = (p) => readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const ALL = Object.getOwnPropertyNames(MONSTERS);
const ELEMS7 = ['fire', 'ice', 'wind', 'blast', 'bolt', 'light', 'dark'];

// 水の 技（ダメージ）。[id, もとの 属性]（null … 属性なし だった）
const WATER_SKILLS = [
  // ポケモン
  ['pk_watergun', null], ['pk_surf', null], ['pk_hydropump', null],
  // 魔物の 技（第2章の 海・第4章の 水の神殿・影の城の 水の階）
  ['m_splash', null], ['m_tidal', null], ['m_maelstrom', null],
  ['m_water_shot', null], ['m_water_rain', null], ['m_water_breath', null], ['m_guard_spear', null], ['m_guard_whirl', null],
  ['m_morgana_blade', null], ['m_morgana_whirl', null], ['m_mtrue_breath', null], ['m_big_wave', null],
  ['m_mj_bubble', null], ['m_ss_tide', null], ['m_fsi_shot', null], ['m_pm_blade', null], ['m_pm_whirl', null], ['m_pm_splash', null], ['m_pm_wave', null],
  ['m6_cb_foam', 'ice'],
  // 職業の 技・ひらめき
  ['pr_uzushio', 'ice'], ['hi_oouzushio', 'ice'], ['ff_housui', 'ice'], ['ff_issei', 'ice'], ['hi_shoukaki', 'ice'],
  ['ks_minamo', null], ['ks_uchishio', null], ['ks_nejire', null], ['kisatsu_sig', null], ['hi_suiryuu', null], ['kp_mizu', null],
];
// 水を 使うが 氷の 技（こおらせる・つめたい）。氷の まま
const ICE_STAYS = ['hyado', 'hyadaruko', 'hi_koori_nami', 'rn_chiller', 'hi_tsurara', 'm_ghost_tear', 'hi_eternal_blizzard'];
// 水の 回復・補助（ダメージで ない ので 属性なし）
const WATER_HEALS = ['sm_undine', 'fs_mizu', 'm_spirit_mend', 'm_morgana_heal', 'm_pm_heal', 'pk_aquaring', 'kp_osara'];
// 水の 絵だが 水の 技では ない（消毒スプレー）
const WATER_ANIM_NOT_WATER = ['ct_shoudoku'];
const WATER_ANIMS = new Set(['water', 'water_shot', 'water_rain', 'water_breath', 'whirlpool', 'big_wave', 'pk_water', 'pk_hydro', 'mj_bubble', 'ss_tide', 'fsi_shot', 'pm_blade', 'pm_whirl', 'pm_splash', 'pm_wave']);
const elemOf = (a) => a.effect?.element;

test('水の 属性: 名前と ならび（氷の あと）。推理・とくせいの 文・技の 説明にも 出る', () => {
  assert.equal(ELEMENT_NAMES.water, '水');
  assert.ok(ELEMENT_ORDER.includes('water'));
  assert.equal(ELEMENT_ORDER.indexOf('water'), ELEMENT_ORDER.indexOf('ice') + 1, '氷の すぐ あと');
  assert.equal(new Set(ELEMENT_ORDER).size, ELEMENT_ORDER.length);
  for (const el of ELEMENT_ORDER) assert.ok(ELEMENT_NAMES[el], el);
  // 推理（いちばんの 弱点）でも えらべる。同じ 強さなら 前の 属性（氷）
  assert.equal(deduceElement({ resist: { water: 1.5 } }), 'water');
  assert.equal(deduceElement({ resist: { ice: 1.5, water: 1.5 } }), 'ice');
  assert.equal(deduceElement({ resist: MONSTERS.sand_slime.resist }), 'water', '砂ぷるりんは 水が いちばん');
  // 技の 説明の 見出し
  assert.equal(abilityTypeText(ABILITIES.pk_surf), '水属性のダメージの特技');
  assert.equal(abilityTypeText(ABILITIES.kp_mizu), '水属性のダメージの特技');
  // 装備の とくせいの 文
  assert.match(traitText('mermaid_shield'), /氷・水に強い/);
});

test('画面: 水の しるしの 色（氷と ちがう 青）・戦いの 色・図鑑と 見える化は ELEMENT_ORDER で ならべる', () => {
  const css = src('css/style.css');
  const bg = (cls) => (new RegExp(`\\.elem\\.e-${cls} \\{ background: (#[0-9a-f]{6}); \\}`).exec(css) || [])[1];
  assert.ok(bg('water'), '.elem.e-water');
  assert.notEqual(bg('water'), bg('ice'), '氷と ちがう 色');
  // 戦いの えんしゅつの 色（その 属性だけの 色は ほかと かさならない）
  assert.ok(ELEMENT_FX.water && ELEMENT_FX.water.name === '水');
  const sig = Object.values(ELEMENT_FX).map((v) => v.colors[1].toLowerCase());
  assert.equal(new Set(sig).size, sig.length);
  assert.match(src('js/client/battle.js'), /water: \['#[0-9a-f]{6}'/, '味方の まどの 色');
  assert.match(src('js/client/battle.js'), /el === 'water'\) return 'ice'/, '味方の まどの 形（氷と おなじ 水しぶき）');
  assert.match(src('js/client/render/enemyfx.js'), /ELEM_COL = \{[^}]*water: '#/);
  assert.match(src('js/client/render/enemyfx.js'), /ELEM_HIT = \{[^}]*water: '/);
  assert.match(src('js/client/render/battlefx.js'), /\n {2}water: \['#/);
  // 図鑑の 属性の 行・見える化・弱点を 見る は ELEMENT_ORDER を そのまま 使う
  assert.match(src('js/client/ui/menu.js'), /for \(const e of ELEMENT_ORDER\)/);
  assert.match(src('js/shared/battle.js'), /for \(const el of ELEMENT_ORDER\) ev\.results\.push/);
  // 仲間の 魔物の たいせいの 下限（0.3）にも 水
  assert.match(src('js/shared/stats.js'), /\['fire', 'ice', 'water', 'wind'/);
});

test('水の 技: element は water（ほかの 属性で 代わりに して いた ものも）。氷の 技・水の 回復は そのまま', () => {
  for (const [id, before] of WATER_SKILLS) {
    const a = ABILITIES[id];
    assert.ok(a, id);
    assert.equal(abilityRole(a), 'dmg', `${id} は ダメージの 技`);
    assert.equal(elemOf(a), 'water', `${id}（${a.name}）は 水${before ? `（前は ${ELEMENT_NAMES[before]}）` : ''}`);
  }
  // 合体技: ウーウーカンカンピーポーの 放水
  const siren = DUAL_TECHS.dt_uukanpi.parts.find((p) => p.type === 'power');
  assert.equal(siren.element, 'water');
  for (const id of ICE_STAYS) {
    if (!ABILITIES[id]) continue;
    const els = ABILITIES[id].effect.type === 'multi' ? ABILITIES[id].effect.parts.map((p) => p.element).filter(Boolean) : [elemOf(ABILITIES[id])];
    assert.ok(els.includes('ice') && !els.includes('water'), `${id} は 氷の まま`);
  }
  assert.equal(elemOf(ABILITIES.hi_aqua.effect.parts ? { effect: ABILITIES.hi_aqua.effect.parts.find((p) => p.element) } : ABILITIES.hi_aqua), 'ice', 'アクア・イリュージョンは こおらせる ので 氷');
  for (const id of WATER_HEALS) {
    assert.ok(ABILITIES[id], id);
    assert.notEqual(abilityRole(ABILITIES[id]), 'dmg', id);
    assert.equal(elemOf(ABILITIES[id]), undefined, `${id} は 属性なし`);
  }
  // 水の 絵の ダメージの 技は、水（消毒スプレーは のぞく）
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (!WATER_ANIMS.has(a.anim) || abilityRole(a) !== 'dmg' || WATER_ANIM_NOT_WATER.includes(id)) continue;
    assert.equal(elemOf(a), 'water', `${id}（${a.name}）`);
  }
  // 1つの effect に element が 2つ ない（書きかえの まちがい）
  for (const f of ['abilities-jobs2.js', 'hirameki-r27.js', 'abilities-jobs6.js', 'abilities-temple.js', 'abilities-phantom.js']) {
    for (const line of src(`js/shared/data/${f}`).split('\n')) assert.ok((line.match(/element: '/g) || []).length <= 1 || /parts:/.test(line), `${f}: ${line.trim()}`);
  }
  // せつめいの 文
  assert.match(ABILITIES.hi_oouzushio.desc, /水のダメージ/);
  for (const [id] of WATER_SKILLS) assert.deepEqual(checkText(ABILITIES[id].desc || ''), [], id);
});

test('魔物の 水の 効きぐあい: すべての 魔物に resist.water。きまりの 表の とおり', () => {
  const vals = new Set(Object.values(WATER_VALUES));
  for (const id of ALL) {
    const m = MONSTERS[id];
    if (m.variant) continue;
    assert.equal(typeof m.resist?.water, 'number', `${id} に 水`);
    assert.ok(vals.has(m.resist.water) || m.boss, `${id}: ${m.resist.water}`);
    assert.ok(WATER_RULE[id], `${id} の きまり`);
  }
  // 表に 書いた ID は みんな いる（書きまちがい なし）・2つの 表に 入って いない
  const seen = new Map();
  for (const [name, list] of Object.entries({ WATER_SEA, WATER_FIRE, WATER_SAND, WATER_ROCK, WATER_MACHINE, OVERRIDE: Object.keys(WATER_OVERRIDE) })) {
    for (const id of list) {
      assert.ok(MONSTERS[id], `${name}: ${id}`);
      assert.ok(!seen.has(id), `${id} が ${seen.get(id)} と ${name} に`);
      seen.set(id, name);
    }
  }
  // きまりごと
  const want = (id, v, rule) => {
    assert.equal(MONSTERS[id].resist.water, v, `${id}（${MONSTERS[id].name}）`);
    if (rule) assert.equal(WATER_RULE[id], rule, `${id} の きまり`);
  };
  for (const id of WATER_SEA) want(id, WATER_VALUES.resist, 'sea');
  for (const id of WATER_SAND) want(id, MONSTERS[id].boss ? WATER_BOSS_WEAK_MAX : WATER_VALUES.weak);
  for (const id of WATER_ROCK) assert.ok(MONSTERS[id].resist.water > 1 && MONSTERS[id].resist.water <= WATER_VALUES.weakSoft, id);
  for (const id of WATER_MACHINE) want(id, WATER_VALUES.weakSoft, 'machine');
  // 炎の 魔物（炎が 0.5いか・氷が 1.2いじょう）は 弱い。竜は 1.25
  want('lamp', 1.5, 'fire'); want('fire_hound', 1.5, 'fire'); want('magma_slime', 1.5, 'fire'); want('candle_ghost', 1.5, 'fire');
  want('chibi_dragon', 1.25, 'fire'); want('great_dragon', 1.25, 'fire'); want('lantern_ghost', 1.5, 'fire');
  // 氷の 魔物（氷が 0.5いか）・植物は 少し 強い。メタルは 効かない。ほかは ふつう
  want('snowman', 0.75, 'ice'); want('frost_wolf', 0.75, 'ice'); want('tsurara_sou', 0.75, 'ice');
  want('kobushi', 0.75, 'plant'); want('elder_treant', 0.75, 'plant');
  want('kirakira', 0, 'metal'); want('gold_beetle', 0, 'metal'); want('silver_king', 0, 'metal');
  want('goblin', 1, 'none'); want('skeleton', 1, 'none'); want('pururin', 1, 'none');
  // 水の 魔物の 例
  want('marine_slime', 0.5); want('armor_crab', 0.5); want('water_dragon', 0.5); want('giant_squid', 0.5); want('morgana', 0.5);
  // もう1回 きまりを 当てても おなじ（resist.water を けして 計算しなおす）
  for (const id of ALL) {
    const m = MONSTERS[id];
    if (m.variant) continue;
    const { water, ...rest } = m.resist;
    assert.equal(waterRuleOf(id, { ...m, resist: rest }).value, water, id);
  }
  // 共有の resist（岩・メタル）を かきかえて いない: ストーンゴーレムと 岩男は べつの オブジェクト
  assert.notEqual(MONSTERS.rockman.resist, MONSTERS.rock_shard.resist);
  // データに 書いた resist.water が あれば、それを 使う
  assert.deepEqual(waterRuleOf('lamp', { resist: { fire: 0.3, ice: 1.5, water: 0.9 } }), { value: 0.9, rule: 'data' });
});

test('1体ずつ きめた もの: ポケモンは タイプの とおり・第6章の ボス・からからガエル', () => {
  for (const id of ['charmander', 'charmeleon', 'charizard', 'flareon']) assert.equal(MONSTERS[id].resist.water, 1.5, id);
  for (const id of ['squirtle', 'wartortle', 'blastoise', 'vaporeon', 'bulbasaur', 'ivysaur', 'venusaur']) assert.equal(MONSTERS[id].resist.water, 0.5, id);
  for (const id of ['pikachu', 'raichu', 'eevee', 'jolteon', 'umbreon', 'snorlax', 'gengar', 'mew']) assert.equal(MONSTERS[id].resist.water, 1, id);
  for (const id of ['sand_clock', 'geardon', 'carillon']) assert.equal(MONSTERS[id].resist.water, 1, `${id}: しかけの ボスは ふつう`);
  assert.equal(MONSTERS.dry_frog.resist.water, 1, 'ひからびた カエル');
  for (const [id, v] of Object.entries(WATER_OVERRIDE)) {
    assert.equal(MONSTERS[id].resist.water, v, id);
    assert.equal(WATER_RULE[id], 'override', id);
  }
});

test('色ちがいは もとの 魔物の 水を うけつぐ', () => {
  for (const [base, kind] of [['gear_beetle', 'red'], ['chrono_knight', 'clock'], ['sand_slime', 'dark'], ['marine_slime', 'gold'], ['snowman', 'shadow'], ['lamp', 'dark']]) {
    const id = registerVariant(base, kind);
    assert.equal(id, variantId(base, kind));
    assert.equal(MONSTERS[id].resist.water, MONSTERS[base].resist.water, id);
  }
  // 物語で 使って いる 色ちがいも
  for (const id of Object.getOwnPropertyNames(MONSTERS).filter((k) => MONSTERS[k].variant)) {
    assert.equal(MONSTERS[id].resist.water, MONSTERS[MONSTERS[id].variant.base].resist.water, id);
  }
});

// ボスの 作戦（この 属性が 効く）。水は それを こえない
const BOSS_PLAN = {
  goldoon: 'blast', tm_golem: 'blast', giant_squid: 'bolt', tm_king: 'bolt', tm_serpent: 'fire', tm_dragon: 'ice',
  blizzard_mammoth: 'fire', magma_golem: 'ice', flame_knight: 'ice', flame_witch: 'ice', flame_witch_true: 'light', phantom_ignia: 'ice',
  trial_guardian: 'dark', zaid_demon: 'ice', sand_whale: 'bolt', morgana: 'bolt', morgana_true: 'bolt', phantom_morgana: 'bolt',
  old_dragon: 'ice', dark_treant: 'fire', ar_genie: 'ice', ar_sun: 'ice', ar_sharkking: 'bolt', argos: 'bolt',
};
// 水で かわった ボス（ドキュメントの 表と おなじ）
const BOSS_CHANGED = {
  dark_treant: 0.75, goldoon: 1.25, giant_squid: 0.5, tm_golem: 1.25, tm_king: 0.5, tm_dragon: 1.25, tm_serpent: 0.5,
  blizzard_mammoth: 0.75, magma_golem: 1.25, flame_knight: 1.25, trial_guardian: 1.2, flame_witch: 1.2, flame_witch_true: 1.25,
  zaid_demon: 1.25, sand_whale: 1.25, morgana: 0.5, morgana_true: 0.5, old_dragon: 1.25, phantom_ignia: 1.25, phantom_morgana: 0.5,
  ar_genie: 1.2, ar_sun: 1.2, ar_moon: 0.75, ar_sharkking: 1.25,
};

test('ボス: 水の 弱点は 1.25まで・もとからの いちばんの 弱点を こえない・作戦の 属性は 水より 効く', () => {
  const bosses = ALL.filter((id) => MONSTERS[id].boss && !MONSTERS[id].variant);
  for (const id of bosses) {
    const r = MONSTERS[id].resist;
    if (WATER_RULE[id] === 'override') continue;
    assert.ok(r.water <= WATER_BOSS_WEAK_MAX, `${id}: ${r.water}`);
    if (r.water > 1) assert.ok(r.water <= Math.max(...ELEMS7.map((k) => r[k] ?? 1)), `${id}: 水が いちばんの 弱点を こえない`);
  }
  for (const [id, el] of Object.entries(BOSS_PLAN)) {
    const r = MONSTERS[id].resist;
    assert.ok((r[el] ?? 1) >= r.water, `${id}: ${ELEMENT_NAMES[el]}（${r[el]}）が 水（${r.water}）いじょう`);
    assert.ok((r[el] ?? 1) >= 1.2, `${id}: ${ELEMENT_NAMES[el]}は 弱点`);
  }
  // かわった ボスの 一覧（ふえたら ここと docs/plan-r47-water.md を いっしょに）
  const changed = Object.fromEntries(bosses.filter((id) => MONSTERS[id].resist.water !== 1).map((id) => [id, MONSTERS[id].resist.water]));
  assert.deepEqual(changed, BOSS_CHANGED);
});

// 戦いの じゅんび（敵は なにも しない）
function setup(enemies) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(30));
  fullHeal(c);
  const b = new Battle({ rng: makeRng(1), allies: [{ char: c, controller: 's1' }], enemies, canFlee: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return { b, me: b.allies[0] };
}

test('戦い: 水の 技は 炎の 魔物に 弱点・水の 魔物には 効きにくい（ためすと 図鑑に のる）', () => {
  const { b, me } = setup(['lamp', 'marine_slime']);
  const [lamp, slime] = b.enemies;
  for (const e of b.enemies) e.hp = e.maxHp = 99999;
  const eff = ABILITIES.pk_watergun.effect;
  const plain = { ...eff, element: undefined };
  const dmg = (t, e) => b.calcMagic(me, t, e, 1, true).dmg;
  assert.ok(Math.abs(dmg(lamp, eff) / dmg(lamp, plain) - 1.5) < 0.05, '炎の 魔物に 1.5倍');
  assert.ok(Math.abs(dmg(slime, eff) / dmg(slime, plain) - 0.5) < 0.05, '水の 魔物に 0.5倍');
  const ev = { lines: [], upd: [] };
  b.applyAbility(me, ABILITIES.pk_watergun, { target: lamp.id }, ev, 1);
  assert.ok(ev.lines.includes('弱点をついた！'), ev.lines.join(' / '));
  assert.ok(b.tried.has('lamp|water'));
  assert.equal(affinityOf(MONSTERS.marine_slime.resist.water), 'resist');
  // 見える化・弱点を 見る: 水も 出る
  const { b: b2, me: me2 } = setup(['sand_slime']);
  const ev2 = { lines: [], upd: [] };
  b2.applyAbility(me2, { ...ABILITIES.fg_mieruka }, {}, ev2, 1);
  assert.ok(ev2.results.some((r) => r.element === 'water' && r.aff === 'weak'), '水の 弱点');
  assert.ok(ev2.lines.some((l) => l.includes('水')), ev2.lines.join(' / '));
});

test('古い セーブ・水の ない データは ふつう（1倍）', () => {
  // 人: 装備に 水が なければ resist.water は ない → 1倍
  const c = newCharacter({ id: 'p', name: 'ヒナ', job: 'warrior' });
  assert.equal(computeStats(c).resist.water, undefined);
  // 敵: resist に 水の ない 魔物（前の データ）でも、水の 技は ふつうの ダメージ
  const { b, me } = setup(['goblin']);
  const e = b.enemies[0];
  e.hp = e.maxHp = 99999;
  delete e.resist.water;
  const eff = ABILITIES.pk_watergun.effect;
  assert.equal(b.calcMagic(me, e, eff, 1, true).dmg, b.calcMagic(me, e, { ...eff, element: undefined }, 1, true).dmg);
  assert.equal(affinityOf(e.resist.water ?? 1), 'normal');
  // 図鑑: 前の セーブ（水を ためして いない）は「？」のまま。ためすと el_water が ふえる
  const old = { bestiary: { goblin: { kills: 3, el_fire: 1 } } };
  noteTried(old, new Set(['goblin|water']));
  assert.deepEqual(old.bestiary.goblin, { kills: 3, el_fire: 1, el_water: 1 });
});

test('仲間の 魔物は しゅぞくの 水・人は 水の 装備で 水に 強く なる', () => {
  for (const [sp, v] of [['marine_slime', 0.5], ['squirtle', 0.5], ['charmander', 1.5], ['snowman', 0.75]]) {
    const m = newMonsterCompanion({ id: sp, name: 'なかま', species: sp, level: 10 });
    assert.equal(computeStats(m).resist.water, v, sp);
  }
  // 水に 強い 装備（水の 名前が ついた 4つ）
  const WATER_GEAR = { water_hagoromo: 0.85, mermaid_dress: 0.7, mermaid_shield: 0.85, cs_tide_crown: 0.85 };
  for (const [id, v] of Object.entries(WATER_GEAR)) {
    assert.equal(ITEMS[id].resist.water, v, id);
    assert.match(ITEMS[id].desc, /水に|水にも|と水に/, `${id} の せつめい`);
    assert.deepEqual(checkText(ITEMS[id].desc), [], id);
  }
  const withWater = Object.keys(ITEMS).filter((id) => ITEMS[id].resist?.water && !id.includes('+')); // +1〜 は きたえた 物
  assert.deepEqual(withWater.sort(), Object.keys(WATER_GEAR).sort(), 'ほかの 装備には つけない');
  const c = newCharacter({ id: 'p', name: 'ヒナ', job: 'priest' });
  c.equip.armor = 'water_hagoromo';
  assert.equal(computeStats(c).resist.water, 0.85);
});
