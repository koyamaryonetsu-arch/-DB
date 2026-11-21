// 第94回 B班: 第3部 第2章 第1幕「赤と緑」の 戦いと 品（docs/plan-part3-c10a.md の 13-5・13-6）
// 名前の 約束・ふつうの 魔物 8しゅ・スピカの ごほうび・ドクター・タマゴン（あつく なったら 休む）・カビだんしゃく モルド（カビを てらす）・
// 自動の 仲間・人数で 合わせる・強さ（人が できる 動き・2秒と 5秒・赤 → 緑 と 緑 → 赤）・ふつうの 戦いの 長さ・品・ヒント・絵・背景・がめん・えんしゅつ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA, PART3_LATE_ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { C10A_B as C10A, C10A_ACT4, C10A_LEVERS, C10A_BONUS_B as C10A_BONUS, C10A_MAP, C10A_BATTLE, C10A_MON_PREFIX, C10A_BOSS_MON, C10A_TABLE, C10A_CHEST_IDS_B as C10A_CHEST_IDS, C10A_NOTES, C10A_TRACKS, C10A_OPEN } from '../public/js/shared/maps/c10a-flags.js';
import { MONSTERS_C10A, C10A_MINIONS, C10R_MON, C10G_MON, C10A_RECOLOR_BASE, C10A_NEW_ART, C10R_TAMAGON, C10G_MOLD, C10A_MAT_DROPS } from '../public/js/shared/data/monsters-c10a.js';
import { C10A_ABILITIES } from '../public/js/shared/data/abilities-c10a.js';
import { FRIENDS_C10A } from '../public/js/shared/data/companions-c10a.js';
import { ENCOUNTERS_C10A, FIXED_C10A, ZONE_BG_C10A } from '../public/js/shared/data/encounters-c10a.js';
import { ITEMS_C10A, C10A_TREASURE, C10A_K, C10A_SHOP_K, C10A_GEAR_CHESTS, C10A_SHOP_ADD, C10A_DROPS, NOTE_RE, NOTE_FA, c10aChest } from '../public/js/shared/data/items-c10a.js';
import { C10A_BOSS_HINTS, C10A_HINT_WHO } from '../public/js/shared/data/boss-hints-c10a.js';
import {
  c10Conf, c10Boss, c10aTell, c10aPlan, c10aPub, heatDelta, wallUp, peopleOf10, c10Stuck,
  DRILLUP, DRILL, OVER, COOL, BOMBUP, BOMB, NOBOSE, KINOKO, REWARD_HEAL, REWARD_TERU, AUTO_EVERY,
} from '../public/js/shared/battle-c10a.js';
import { TERU, TERU_MAX, teruOf } from '../public/js/shared/battle-c9b.js';
import { SONG } from '../public/js/shared/battle-c9d.js';
import { c9aAfter, bestHit, SPICA_HEAL } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { tableLength } from '../tools/sim-ch9-field.mjs';
import { decideAlly } from '../public/js/shared/ai.js';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC10aFx } from '../public/js/client/render/battlefx-c10a.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C10A_SCREEN_ANIMS, C10A_ALLY_FX, C10A_SFX, C10A_OWN_TELE, c10aDraw, c10aPresent, c10aSprite, c10aCmdInfo, c10Html, heatMeter, kabiMeter } from '../public/js/client/battle-c10a.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { C10A_TRACKS as AUDIO_C10A } from '../public/js/client/audio-c10a.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ boss = 'tamagon', kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = { c9_child: true, c9_act1: true, c9_song1: true }, enemies = null } = {}) {
  const four = ch9Party(boss, LV9[boss]);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: true, tactics: 'balanced' }));
  const id = boss === 'tamagon' ? C10A_BATTLE.red : C10A_BATTLE.green;
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(id), hooks: { leaderFlag: (f) => !!flags[f] } });
}
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
// 敵の 番（telegraph が あれば それ。なければ 決まった 技）
const foe = (b, m, id = null) => {
  if (id) m.telegraph = id;
  b.queue.push({ id: m.id, cmd: { type: 'ai' }, last: true });
  m.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const quiet = (m) => { m.actions = [{ w: 1, id: 'm_nothing' }]; };

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（13-6）: フラグ・レバー・おまけ・マップ・決まった 戦い・魔物の id・出る 表・宝箱・だいじな 物・曲・幕の 切りかえ', () => {
  assert.deepEqual(C10A, {
    start: 'c10_start', rStairs: 'c10_r_stairs', rBoss: 'c10_r_boss', redRun: 'c10_red_run', noteRe: 'c10_note_re',
    gRoot: 'c10_g_root', gBoss: 'c10_g_boss', noteFa: 'c10_note_fa', act1: 'c10_act1',
  });
  assert.equal(C10A_ACT4, 'c9_act4');
  assert.deepEqual(C10A_LEVERS, ['c10_lv1', 'c10_lv2', 'c10_lv3']);
  assert.deepEqual(C10A_BONUS, { r: 'c10_bonus_r', g: 'c10_bonus_g' });
  assert.deepEqual(Object.values(C10A_MAP), ['c10r_1', 'c10r_2', 'c10r_3', 'c10g_1', 'c10g_2']);
  assert.deepEqual(C10A_BATTLE, { red: 'c10r_boss', green: 'c10g_boss' });
  assert.deepEqual(C10A_BOSS_MON, { red: 'c10r_tamagon', green: 'c10g_mold' });
  for (const sp of C10R_MON) assert.ok(sp.startsWith(C10A_MON_PREFIX.red), sp);
  for (const sp of C10G_MON) assert.ok(sp.startsWith(C10A_MON_PREFIX.green), sp);
  assert.deepEqual(Object.values(C10A_TABLE), ['t10r_1', 't10r_2', 't10g_1', 't10g_2']);
  for (const t of Object.values(C10A_TABLE)) assert.ok(ENCOUNTER_TABLES[t], t);
  assert.deepEqual(C10A_CHEST_IDS.red, ['c10r_c1', 'c10r_c2', 'c10r_c3', 'c10r_c4', 'c10r_c5', 'c10r_c6']);
  assert.deepEqual(C10A_CHEST_IDS.green, ['c10g_c1', 'c10g_c2', 'c10g_c3', 'c10g_c4', 'c10g_c5', 'c10g_c6']);
  assert.deepEqual(C10A_CHEST_IDS.bonus, ['c10r_bonus', 'c10g_bonus']);
  assert.deepEqual(Object.keys(C10A_TREASURE).sort(), [...C10A_CHEST_IDS.red, ...C10A_CHEST_IDS.green, ...C10A_CHEST_IDS.bonus].sort());
  assert.deepEqual(C10A_NOTES, { re: 'note_re', fa: 'note_fa' });
  assert.equal(NOTE_RE, 'note_re');
  assert.equal(NOTE_FA, 'note_fa');
  assert.equal(C10A_OPEN, 'PART3_C10A_OPEN');
  // 曲（F班）: 決まった 戦いの bgm は 中ボスの 曲
  assert.deepEqual(Object.values(C10A_TRACKS), ['c10_fork', 'c10r_road', 'c10r_run', 'c10r_boss', 'c10g_roots', 'c10g_boss']);
  for (const id of Object.values(C10A_TRACKS)) assert.ok(AUDIO_C10A[id], `曲 ${id}`);
  assert.equal(FIXED_ENCOUNTERS.c10r_boss.bgm, 'c10r_boss');
  assert.equal(FIXED_ENCOUNTERS.c10g_boss.bgm, 'c10g_boss');
  for (const f of Object.values(FIXED_C10A)) assert.ok(f.boss && f.canFlee === false);
});

// ───────────── ふつうの 魔物 ─────────────
test('ふつうの 魔物 8しゅ: 赤 4しゅ Lv105〜106・緑 4しゅ Lv106〜107・仲間に なる・今の 素材・今 ある 系統・ランク・出る 表', () => {
  assert.equal(C10R_MON.length, 4);
  assert.equal(C10G_MON.length, 4);
  const races = new Set(Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C10A[id]).map(([, m]) => m.race));
  const mats = new Set(Object.values(MAT_DROPS).filter((v, i, a) => a.indexOf(v) === i).map((v) => v[0]));
  for (const sp of C10A_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && m.region === 6, sp);
    const [lo, hi] = C10R_MON.includes(sp) ? [105, 106] : [106, 107];
    assert.ok(m.lv >= lo && m.lv <= hi, `${sp}: Lv${m.lv}`);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && MONSTER_FRIENDS[sp] === FRIENDS_C10A[sp], `${sp}: 仲間に なる`);
    assert.ok(MONSTER_FRIENDS[sp].rate >= 1 / 26 && MONSTER_FRIENDS[sp].rate <= 1 / 10, sp);
    const g = Object.values(MONSTER_FRIENDS[sp].growth).reduce((s, v) => s + v, 0);
    assert.ok(g >= 5.8 - 1e-9 && g <= 7.3, `${sp}: growth ${g}`);
    for (const [, id] of MONSTER_FRIENDS[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(MAT_DROPS[sp] === C10A_MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]], `${sp}: 素材`);
    assert.ok(mats.has(MAT_DROPS[sp][0]), `${sp}: 今の 素材`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランク`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const d of Object.values(m.drops)) assert.ok(ITEMS[d[0]], `${sp}: ${d[0]}`);
  }
  // 出る 表（赤の 道は 赤の 魔物・緑の 道は 緑の 魔物だけ）
  for (const [t, rows] of Object.entries(ENCOUNTERS_C10A)) {
    const set = t.startsWith('t10r') ? C10R_MON : C10G_MON;
    for (const r of rows) for (const [sp] of r.group) assert.ok(set.includes(sp), `${t}: ${sp}`);
  }
  const seen = new Set(Object.values(ENCOUNTERS_C10A).flatMap((rows) => rows.flatMap((r) => r.group.map((g) => g[0]))));
  assert.equal(seen.size, 8, '8しゅ ぜんぶ 出る');
  // ランク: F〜C が いる・B〜S は いない
  const rk = C10A_MINIONS.map((sp) => MONSTER_RANKS[sp]);
  for (const r of ['F', 'E', 'D', 'C']) assert.ok(rk.includes(r), r);
  assert.ok(!rk.some((r) => ['B', 'A', 'S'].includes(r)));
  for (const sp of C10A_MINIONS) assert.ok(MONSTER_FRIENDS[sp].noFamily, `${sp}: 系統配合の 子に ならない`);
  assert.deepEqual(Object.values(ZONE_BG_C10A), ['c10r_road', 'c10r_road', 'c10g_roots', 'c10g_roots']);
  for (const t of Object.keys(ZONE_BG_C10A)) assert.equal(ZONE_BG[t], ZONE_BG_C10A[t]);
});

test('ふつうの 戦いの 長さ: 勇者 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 90秒 いない（赤 2つ・緑 2つの 表）', { timeout: 600000 }, () => {
  for (const t of Object.keys(ENCOUNTERS_C10A)) {
    const r = tableLength(t, 12);
    assert.equal(r.win, 1, t);
    assert.ok(r.avg <= 90, `${t}: ${r.avg}秒`);
  }
});

// ───────────── スピカの ごほうび ─────────────
test('スピカの ごほうび: 赤の 音（c10_note_re）で ほのかな光 6% → 9%・緑の 音（c10_note_fa）で てらすが 4回 → 3回・新しい コマンドは ない', () => {
  const plain = battle({ enemies: ['c10r_lizard'] });
  assert.equal(teruOf(plain).max, TERU_MAX);
  const re = battle({ enemies: ['c10r_lizard'], flags: { c9_child: true, c9_act1: true, c9_song1: true, c10_note_re: true } });
  const fa = battle({ enemies: ['c10r_lizard'], flags: { c9_child: true, c9_act1: true, c9_song1: true, c10_note_fa: true } });
  assert.equal(TERU_MAX, 4);
  assert.equal(REWARD_TERU, 3);
  assert.equal(teruOf(fa).max, 3, '緑の 音: 3回で たまる');
  assert.equal(teruOf(re).max, 4);
  assert.equal(SPICA_HEAL, 0.06);
  assert.equal(REWARD_HEAL, 0.09);
  const glowHeal = (b) => {
    for (const a of b.allies) a.hp = Math.round(a.maxHp * 0.3);
    const t = b.allies[0];
    t.hp = Math.round(t.maxHp * 0.1);
    const before = t.hp;
    for (const a of b.allies) c9aAfter(b, a, ev0());
    return (t.hp - before) / t.maxHp;
  };
  assert.ok(Math.abs(glowHeal(plain) - 0.06) < 0.002);
  assert.ok(Math.abs(glowHeal(re) - 0.09) < 0.002, '赤の 音: 9%');
  // コマンドは ふえない（てらす・星のうた だけ）
  const abil = (b) => b.allies[0].abilities.filter((id) => ABILITIES[id]?.noAuto && ABILITIES[id]?.kind === 'skill');
  assert.deepEqual(abil(re).sort(), abil(plain).sort());
  // 中ボスの 戦いは かならず スピカ・てらす・星のうた
  const t = battle({ flags: {} });
  assert.ok(t.c9sp?.teru && t.c9sp?.song, '中ボスの 戦いは スピカが 出る');
});

// ───────────── タマゴン ─────────────
test('タマゴン: あつさ（こうげき・特技・じゅもん ＋1・強い 技 ＋2・防御で 水を 飲んで −3・道具と 回復 ＋0）・炎を 受けると ＋1・5 で のぼせた（1回 動けない・ダメージ・2 に もどる）', () => {
  const b = battle();
  const m = c10Boss(b);
  assert.equal(m.species, C10R_TAMAGON);
  quiet(m);
  const [a0, a1] = b.allies;
  const cf = c10Conf(C10R_TAMAGON, b);
  assert.deepEqual([cf.heat.max, cf.heat.back, cf.heat.act, cf.heat.strong, cf.heat.cool], [5, 2, 1, 2, 3]);
  assert.equal(a0.c10heat, 0);
  act(b, a0, { type: 'attack', target: m.id });
  assert.equal(a0.c10heat, 1, 'こうげき ＋1');
  act(b, a0, { type: 'defend' });
  assert.equal(a0.c10heat, 0, '防御で 下がる（0 より 下がらない）');
  a0.c10heat = 4;
  act(b, a0, { type: 'defend' });
  assert.equal(a0.c10heat, 1, '防御で −3');
  // 道具・回復は ＋0
  assert.equal(heatDelta(a0, { type: 'item', id: 'toku_herb' }, cf), 0);
  assert.equal(heatDelta(a0, { type: 'ability', id: 'behoma' }, cf), 0);
  assert.equal(heatDelta(a0, { type: 'ability', id: TERU }, cf), 0);
  assert.equal(heatDelta(a0, { type: 'defend' }, cf), -3);
  const strong = Object.keys(ABILITIES).find((id) => ABILITIES[id].kind === 'spell' && ABILITIES[id].target === 'enemies' && (ABILITIES[id].mp || 0) >= 20);
  assert.equal(heatDelta(a0, { type: 'ability', id: strong }, cf), 2, `強い 技 ${strong}`);
  // 炎の 攻撃を 受けると ＋1（1回の 行動で 1つ）
  a1.c10heat = 0;
  const e = foe(b, m, 'm10t_steam');
  assert.ok(e.lines.some((l) => l.includes('湯気')));
  for (const a of b.aliveAllies()) assert.ok(a.c10heat >= 1, `${a.name}: 炎で ＋1`);
  // 5 で のぼせた
  a1.c10heat = 4;
  const hp0 = a1.hp;
  const e2 = act(b, a1, { type: 'attack', target: m.id });
  assert.ok(e2.c10Nobose?.includes(a1.id), e2.lines.join('/'));
  assert.equal(a1.c10heat, 2, 'のぼせたら 2 に もどる');
  assert.ok(a1.status[NOBOSE] && c10Stuck(a1));
  assert.ok(a1.hp < hp0, 'ダメージ');
  // 1回 動けない（番が とばされる）→ もどる
  b.onReady(a1);
  const q = b.queue.find((x) => x.id === a1.id);
  assert.equal(q?.cmd.type, 'incapacitated');
  b.queue = b.queue.filter((x) => x !== q);
  const e3 = act(b, a1, { type: 'incapacitated' });
  assert.ok(e3.c10Stuck && !a1.status[NOBOSE], e3.lines.join('/'));
  // がめんへ
  assert.equal(c10aPubAlly(a1).heat10, 2);
});
const c10aPubAlly = (a) => ({ heat10: a.c10heat, kabi10: a.c10kabi });

test('タマゴン: メカの あつさ（動く たびに ＋1・炎 ＋1・氷 −1）・6 で オーバーヒート（次の 番は 止まる・受ける ダメージ 1.5倍・0 に）・冷きゃく水・ドリルの 全体攻撃（前ぶれ → b.tell・防御で へる）・勝つと メカが 止まる（たおれない）', () => {
  const b = battle();
  const m = c10Boss(b);
  quiet(m);
  const k = m.c10t;
  const cf = c10Conf(C10R_TAMAGON, b);
  assert.equal(cf.mecha.max, 6);
  foe(b, m);
  assert.equal(k.heat, 1, '動く たびに ＋1');
  // 炎 ＋1・氷 −1
  const [a0] = b.allies;
  const fire = { mult: 1 };
  const ev = ev0();
  b.damage(a0, m, 100, ev, { element: 'fire' });
  assert.equal(k.heat, 2);
  b.damage(a0, m, 100, ev, { element: 'fire' });
  assert.equal(k.heat, 2, '1回の 行動に 1つ');
  b.damage(a0, m, 100, ev0(), { element: 'ice' });
  assert.equal(k.heat, 1, '氷で ひえる');
  void fire;
  // 6 で オーバーヒート
  k.heat = 5;
  const e = ev0();
  b.damage(a0, m, 100, e, { element: 'fire' });
  assert.ok(k.over && k.heat === 0, 'オーバーヒート');
  assert.ok(e.c10OverHeat);
  const hp = m.hp;
  b.damage(a0, m, 1000, ev0(), {});
  assert.equal(hp - m.hp, 1500, '止まって いる 間は 1.5倍');
  assert.equal(c10aPub(m).mOver, 1);
  const eo = foe(b, m);
  assert.ok(eo.c10Over, '次の 番は 止まる');
  assert.ok(!k.over && k.heat === 0, '止まった 番は あつく ならない');
  // ドリル: 前ぶれ → b.tell → 全体（防御で へる）
  k.drillLeft = 1;
  const eu = foe(b, m);
  assert.ok(eu.c10DrillUp && k.drillReady);
  assert.equal(c10aTell(b), 'drill');
  assert.equal(b.tell, 'drill');
  foe(b, m); // 1回 ふつうに 動く（wait）
  for (const a of b.allies) a.hp = a.maxHp = 99999;
  b.allies[0].defending = true;
  const ed = foe(b, m);
  assert.ok(ed.c10Drill, ed.lines.join('/'));
  const lost = b.allies.map((a) => a.maxHp - a.hp);
  assert.ok(lost[0] < Math.min(...lost.slice(1)), '身を 守ると へる');
  assert.equal(c10aTell(b), 'heat', 'いつも 人が えらぶのを 待つ（時間に 追われない）');
  assert.equal(b.tellAll, true);
  // HP 半分で 冷きゃく水（1回だけ）→ ドリルが ふえる
  for (const a of b.allies) a.hp = a.maxHp;
  m.hp = Math.round(m.maxHp * 0.45);
  k.heat = 4;
  const ec = foe(b, m);
  assert.ok(ec.c10Cool && k.cooled && k.heat === 0);
  assert.ok(k.drillLeft <= cf.drill.half);
  // 勝つ: HP 1 で 止まる（たおれない・勝ち）
  m.hp = 50;
  const ew = ev0();
  b.damage(a0, m, 999, ew, {});
  assert.ok(m.alive && m.hp === 1 && k.down, 'たおれない');
  assert.ok(ew.c10Down && b.pendingEnd?.outcome === 'win');
  assert.ok(b.killed.includes(C10R_TAMAGON), '経験値・落とし物は ふつう');
  assert.equal(c10aPub(m).c10Down, 1);
});

// ───────────── モルド ─────────────
test('モルド: カビの きり（毎回 2人・半分から 3人）・カビ 3 で きのこ（1回 動けない・0 に）・カビは 受ける 回復 −25%・攻撃 −10%・カビの かべ（半分）・てらすで カビと かべが 消える・星のうたで カビが 消える・大カビばくだん・勝つと メカが 止まる', () => {
  const b = battle({ boss: 'mold' });
  const m = c10Boss(b);
  assert.equal(m.species, C10G_MOLD);
  quiet(m);
  const cf = c10Conf(C10G_MOLD, b);
  assert.deepEqual([cf.kabi.max, cf.kabi.heal, cf.kabi.atk, cf.mist.n, cf.mist.half, cf.wall], [3, 0.25, 0.1, 2, 3, 0.5]);
  const e = foe(b, m);
  assert.equal(e.c10Mist.ids.length, 2, 'きりは 2人');
  assert.equal(b.allies.reduce((s, a) => s + a.c10kabi, 0), 2);
  // カビ 3 で きのこ
  const [a0, a1] = b.allies;
  for (const a of b.allies) a.c10kabi = 2;
  const e2 = foe(b, m);
  assert.equal(e2.c10Mist.kinoko.length, 2);
  for (const id of e2.c10Mist.kinoko) {
    const x = b.get(id);
    assert.ok(x.status[KINOKO] && x.c10kabi === 0);
  }
  // 回復 −25%（カビ 1つ）・攻撃 −10%
  for (const a of b.allies) { delete a.status[KINOKO]; a.c10kabi = 0; }
  a1.hp = 1;
  b.heal(a0, a1, { base: [400, 400], fixed: true }, ev0(), 1);
  const h0 = a1.hp - 1;
  a1.hp = 1;
  a1.c10kabi = 1;
  b.heal(a0, a1, { base: [400, 400], fixed: true }, ev0(), 1);
  assert.ok(Math.abs((a1.hp - 1) / h0 - 0.75) < 0.02, `回復 ${(a1.hp - 1)}/${h0}`);
  // かべ（半分）
  assert.ok(wallUp(b));
  let hp = m.hp;
  b.damage(a0, m, 1000, ev0(), {});
  assert.equal(hp - m.hp, 500, 'かべで 半分');
  a0.c10kabi = 2;
  hp = m.hp;
  b.damage(a0, m, 1000, ev0(), {});
  assert.equal(hp - m.hp, 400, 'カビ 2つで 攻撃 −20%');
  // てらす: カビと かべが 消える
  a0.c10kabi = 2;
  a1.c10kabi = 1;
  b.c9sp.teru.charge = b.c9sp.teru.max;
  const et = act(b, a0, { type: 'ability', id: TERU });
  assert.ok(et.c9bTeru && et.c10Clean?.teru, et.lines.join('/'));
  assert.ok(b.allies.every((a) => a.c10kabi === 0));
  assert.ok(!wallUp(b), 'かべが 消える（明るい 間）');
  hp = m.hp;
  b.damage(a0, m, 1000, ev0(), {});
  assert.equal(hp - m.hp, 1000);
  assert.equal(c10aPub(m).wall, 0);
  // 星のうた: カビが 消える（かべは 消えない）
  b.c9sp.teru.lit = 0;
  a1.c10kabi = 2;
  b.c9sp.song.charge = b.c9sp.song.max;
  const es = act(b, a0, { type: 'ability', id: SONG });
  assert.ok(es.c9dSong && es.c10Clean && !es.c10Clean.teru);
  assert.equal(a1.c10kabi, 0);
  assert.ok(wallUp(b), 'かべは 消えない');
  // HP 半分: きりが 3人・大カビばくだん（前ぶれ → b.tell）
  m.hp = Math.round(m.maxHp * 0.45);
  m.c10m.bombLeft = 1;
  const eh = foe(b, m);
  assert.ok(eh.c10Half && eh.c10Mist.ids.length === 3);
  assert.ok(eh.c10BombUp && m.c10m.bombReady, eh.lines.join('/'));
  assert.equal(c10aTell(b), 'bomb');
  foe(b, m); // 1回 ふつうに 動く（wait）
  for (const a of b.allies) { a.hp = a.maxHp = 99999; for (const k of Object.keys(a.status)) delete a.status[k]; }
  b.allies[0].defending = true;
  const eb = foe(b, m);
  assert.ok(eb.c10Bomb);
  const lost = b.allies.map((a) => a.maxHp - a.hp);
  assert.ok(lost[0] < Math.min(...lost.slice(1)), `身を 守ると へる ${lost} ${eb.lines.join('/')}`);
  // 勝つ
  m.hp = 30;
  const ew = ev0();
  b.damage(a0, m, 999, ew, {});
  assert.ok(m.alive && m.c10m.down && ew.c10Down && b.pendingEnd?.outcome === 'win');
});

// ───────────── 自動の 仲間・人数 ─────────────
test('自動の 仲間: タマゴン … 酒場の 人は あつさ 4 いじょうの 番の 3回に 1回 休む（家族の オート・魔物の 仲間は 休まない）／モルド … スピカの 技が たまって いて 役に 立つ 番の 3回に 1回 使う', () => {
  assert.equal(AUTO_EVERY, 3);
  const b = battle({ kinds: ['player', 'support', 'monster', 'support'] });
  const [p, s1, mon, s2] = b.allies;
  for (const a of b.allies) a.c10heat = 4;
  const plans = [];
  for (let i = 0; i < 6; i++) plans.push(c10aPlan(b, i % 2 ? s2 : s1, decideAlly, bestHit));
  assert.equal(plans.filter((x) => x?.type === 'defend').length, 2, '6回で 2回');
  assert.equal(c10aPlan(b, p, decideAlly, bestHit), null, '家族の オートは 休まない');
  assert.equal(c10aPlan(b, mon, decideAlly, bestHit), null, '魔物の 仲間は 休まない');
  s1.c10heat = 2;
  b.c10auto = 2;
  assert.equal(c10aPlan(b, s1, decideAlly, bestHit), null, 'あつく ない 時は 休まない');
  // 知って いる 人: のぼせる 前に 休む
  p.knows9 = 'know';
  assert.deepEqual(c10aPlan(b, p, decideAlly, bestHit), { type: 'defend' });
  // モルド
  const g = battle({ boss: 'mold', kinds: ['player', 'support', 'monster', 'support'] });
  const [gp, g1, gm, g2] = g.allies;
  g.c9sp.song.charge = g.c9sp.song.max;
  g1.c10kabi = 1;
  const gp2 = [];
  for (let i = 0; i < 6; i++) gp2.push(c10aPlan(g, i % 2 ? g2 : g1, decideAlly, bestHit));
  assert.equal(gp2.filter((x) => x?.id === SONG).length, 2, '6回で 2回 星のうた');
  assert.equal(c10aPlan(g, gp, decideAlly, bestHit), null, '家族の オートは スピカの 技を 使わない');
  assert.equal(c10aPlan(g, gm, decideAlly, bestHit), null);
  // 知って いる 人: カビ 2つで 星のうた・かべに てらす
  gp.knows9 = 'know';
  g1.c10kabi = 2;
  assert.deepEqual(c10aPlan(g, gp, decideAlly, bestHit), { type: 'ability', id: SONG });
  g1.c10kabi = 0;
  g.c9sp.song.charge = 0;
  g.c9sp.teru.charge = g.c9sp.teru.max;
  assert.deepEqual(c10aPlan(g, gp, decideAlly, bestHit), { type: 'ability', id: TERU });
});

test('人数で 合わせる: 家族の キャラの 数で HP・攻撃・魔物の 仲間は 半人ぶん・仲間なしの ひとりは solo', () => {
  for (const boss of ['tamagon', 'mold']) {
    const sp = boss === 'tamagon' ? C10R_TAMAGON : C10G_MOLD;
    const hp = (kinds) => c10Boss(battle({ boss, kinds })).maxHp;
    const base = MONSTERS[sp].hp;
    assert.equal(hp(['player', 'player', 'player', 'player']), base, `${boss}: 4人は もとの まま`);
    assert.ok(hp(['player', 'player', 'support', 'support']) < base, `${boss}: 2人`);
    assert.ok(hp(['player']) < base * 0.2, `${boss}: ひとりだけ`);
    const b = battle({ boss, kinds: ['player', 'monster', 'monster', 'monster'] });
    assert.equal(peopleOf10(b), 2, '魔物の 仲間は 半人ぶん');
    const c = MONSTERS[sp].c10;
    for (const k of ['hp', 'atk']) assert.equal(c.few[k].length, 5);
    assert.equal(c.few.hp[3], 1);
    assert.equal(c.few.atk[3], 1);
  }
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（えらぶ 時間 2秒・5秒）で 知って いる 人は 勝てる・知らない 人と 完全オートは 勝てない（少しの 回数）・赤 → 緑 と 緑 → 赤', { timeout: 1500000 }, () => {
  for (const boss of ['tamagon', 'mold']) {
    for (const react of [2000, 5000]) {
      const order = react === 2000 ? 'red' : 'green';
      const know = [1, 2, 3, 4, 5, 6].map((s) => ch9Run(boss, LV9[boss], 'know', 9090 + s * 7919, { react, flags: ORDER_FLAGS[order][boss] }));
      const w = know.filter((r) => r.outcome === 'win');
      assert.ok(w.length >= 2, `${boss} ${react}: 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
      const sec = w.reduce((s, r) => s + r.seconds, 0) / w.length;
      assert.ok(sec <= 540, `${boss} ${react}: 長さ ${sec}秒`);
    }
    const auto = [1, 2, 3, 4].map((s) => ch9Run(boss, LV9[boss], 'auto', 9090 + s * 7919, {}));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${boss}: 完全オート`);
    for (const [job, kit] of Object.entries(CH9_KIT[boss])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  assert.equal(LV9.tamagon, 107);
  assert.equal(LV9.mold, 108);
});

// ───────────── 品 ─────────────
test('品: 赤 6こ・緑 6こ・おまけ 2こ（★5 は 赤 2つ k 2.26〜2.28・緑 2つ k 2.28〜2.30・おまけ 1つずつ・のこりは 素材か 道具）・中ボスの 品・だいじな 物・くぼ地の 武具屋に 足す 品 4つ（k 2.16〜2.18）', () => {
  const gear = [...C10A_GEAR_CHESTS.red, ...C10A_GEAR_CHESTS.green, ...C10A_GEAR_CHESTS.bonus];
  assert.equal(gear.length, 6);
  for (const [id, [item, n]] of Object.entries(C10A_TREASURE)) {
    const it = ITEMS[item];
    assert.ok(it, item);
    assert.deepEqual(c10aChest(id), { item, n });
    if (gear.includes(id)) {
      assert.equal(it.src, id.startsWith('c10r') ? 'c10r' : 'c10g');
      assert.equal(it.rarity, 4);
      assert.equal(it.rank, 10);
      assert.notEqual(it.type, 'weapon', '武器は 作らない');
      assert.ok(rareWhereText(item)?.length > 4, item);
    } else assert.ok(['mat', 'use'].includes(it.type), `${id}: 素材か 道具 (${it.type})`);
  }
  for (const k of [C10A_K.r2, C10A_K.r5, C10A_K.rBonus]) assert.ok(k >= 2.26 && k <= 2.28, k);
  for (const k of [C10A_K.g3, C10A_K.g6, C10A_K.gBonus]) assert.ok(k >= 2.28 && k <= 2.3, k);
  // 店
  assert.equal(C10A_SHOP_ADD.length, 4);
  for (const k of Object.values(C10A_SHOP_K)) assert.ok(k >= 2.16 && k <= 2.18, k);
  for (const id of C10A_SHOP_ADD) { assert.equal(ITEMS[id].rarity, 0); assert.ok(ITEMS[id].price > 0); assert.notEqual(ITEMS[id].type, 'weapon'); }
  for (const id of Object.keys(ITEMS_C10A)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id}: 読みがな`); }
  // 中ボスの 品（1人 1つの アクセサリー。よい 力の 合計 287 まで）
  for (const [boss, [acc]] of Object.entries(C10A_DROPS)) {
    assert.equal(MONSTERS[boss].drops.boss[0], acc);
    assert.equal(ITEMS[acc].type, 'acc');
    assert.ok(ITEMS[acc].unique);
    const sum = Object.values(ITEMS[acc].bonus).reduce((s, v) => s + v, 0);
    assert.ok(sum <= 287 && sum >= 280, `${acc}: ${sum}`);
  }
  for (const id of [NOTE_RE, NOTE_FA]) assert.equal(ITEMS[id].type, 'key');
  for (const it of Object.values(ITEMS_C10A)) assert.ok(!it.resist?.water, it.name);
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 3つずつ（ぼんやり → はっきり）・言う 人は ノクト・13-5 の 文', () => {
  assert.equal(C10A_HINT_WHO, 'ノクト');
  assert.deepEqual(C10A_BOSS_HINTS.c10r_boss, ['あついな…。むりをすると、のぼせるぞ。', '防御で、水を飲め。あつさが下がる。', 'あのメカも、あつくなると止まる。炎を当てろ。氷は、ひやしてしまうぞ。']);
  assert.deepEqual(C10A_BOSS_HINTS.c10g_boss, ['カビがたまると、動けなくなるぞ。', 'スピカにてらしてもらえ。カビは、光に弱い。', 'てらすと、あいつのかべも消える。星のうたと、かわりばんこに使え。']);
  for (const id of Object.keys(C10A_BOSS_HINTS)) {
    assert.deepEqual(BOSS_HINTS[id], C10A_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    for (const t of C10A_BOSS_HINTS[id]) assert.ok(t.length <= 40, t);
  }
});

// ───────────── 絵・背景 ─────────────
test('絵: 新しい 絵は 4つまで・4しゅは 色ちがい・中ボスは 2倍の こまかさ（コマ 2・3 は メカが 止まる）・背景 4つ', () => {
  const fresh = C10A_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base && !MONSTER_ART[sp].tint);
  assert.deepEqual(fresh, C10A_NEW_ART);
  assert.ok(fresh.length <= 4);
  for (const [sp, base] of Object.entries(C10A_RECOLOR_BASE)) {
    assert.ok(MONSTER_ART[base], base);
    assert.ok(MONSTER_ART[sp].tint, `${sp}: 色ちがい`);
    assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size);
    assert.equal(MONSTERS[sp].race, MONSTERS[base].race, `${sp}: もとと おなじ 系統`);
  }
  const g = new Proxy({ w: 100, h: 100 }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  for (const sp of [...C10A_MINIONS, C10R_TAMAGON, C10G_MOLD]) for (const f of [0, 1]) MONSTER_ART[sp].draw(g, f);
  for (const sp of [C10R_TAMAGON, C10G_MOLD]) {
    for (const f of [2, 3]) MONSTER_ART[sp].draw(g, f);
    assert.equal(MONSTERS[sp].artScale, 0.5);
    assert.equal(monsterFine(sp), 2);
    assert.ok(MONSTER_ART[sp].size[0] >= 200);
    const [w, h] = monsterSize(sp);
    assert.ok(w >= 95 && w <= 130 && h >= 95 && h <= 130, `${sp}: ${w}×${h}`);
  }
  for (const id of ['c10r_road', 'c10r_heat', 'c10g_roots', 'c10g_tree']) assert.ok(battleBgSpec(id), id);
  assert.equal(FIXED_C10A.c10r_boss.bg, 'c10r_heat');
  assert.equal(FIXED_C10A.c10g_boss.bg, 'c10g_tree');
});

test('もとの 作品の 名前・決まり文句を 使わない（ゲームに 出る 文）', () => {
  const files = ['public/js/shared/data/monsters-c10a.js', 'public/js/shared/data/abilities-c10a.js', 'public/js/shared/data/items-c10a.js', 'public/js/shared/battle-c10a.js', 'public/js/client/battle-c10a.js', 'public/js/shared/data/boss-hints-c10a.js'];
  const bad = ['エッグマン', 'エッグ', 'ロボトニック', 'ソニック', 'バイキン', 'アンパン', 'ハーヒフーヘホー', 'はひふへほ', 'ばいばいきーん', 'ポチッとな', 'ポチッとね'];
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    for (const w of bad) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  assert.equal(MONSTERS[C10R_TAMAGON].name, 'ドクター・タマゴン');
  assert.equal(MONSTERS[C10G_MOLD].name, 'カビだんしゃくモルド');
});

// ───────────── がめん ─────────────
test('がめん: 仲間の まどの あつさ・カビの めもり・画面の 上の まど・メカが 止まる え・しるし・バナー・えんしゅつ・コマンドの せつめい', () => {
  for (const id of C10A_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  assert.deepEqual(heatMeter(4), { label: 'あつさ', on: 4, max: 5, hot: true });
  assert.deepEqual(kabiMeter(1), { label: 'カビ', on: 1, max: 3, hot: false });
  const tm = { species: C10R_TAMAGON, alive: true, c10Kind: 'tamagon', mHeat: 4, mHeatMax: 6 };
  const allies = [{ name: 'タロウ', alive: true, heat10: 4, heatMax10: 5 }];
  const h = c10Html(tm, allies);
  assert.ok(h.html.includes('メカのあつさ') && h.html.includes('タロウ') && h.cls.includes('warn'), h.html);
  assert.ok(c10Html({ ...tm, drill: 1 }, []).html.includes('ドリル'));
  assert.ok(c10Html({ ...tm, mOver: 1 }, []).html.includes('オーバーヒート'));
  const md = { species: C10G_MOLD, alive: true, c10Kind: 'mold', wall: 1 };
  assert.ok(c10Html(md, []).html.includes('カビのかべ：あり'));
  assert.ok(c10Html({ ...md, wall: 0, wallLit: 2 }, []).html.includes('あと2'));
  assert.ok(c10Html(md, [{ name: 'ハナ', alive: true, kabi10: 2, kabiMax10: 3 }]).html.includes('ハナ'));
  assert.equal(c10Html({ species: 'c10r_lizard', alive: true }, []).html, '');
  // え: 勝った あとは メカが 止まる（消えない）
  const down = { species: C10R_TAMAGON, alive: true, c10Down: 1, dead: 1 };
  try { c10aSprite(down, 0); } catch { /* え を かく ところは ブラウザだけ */ }
  assert.equal(down.dead, -1);
  assert.equal(c10aSprite({ species: C10R_TAMAGON, alive: true }, 0), null);
  // しるしが こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  const scene = { time: 0, enemies: () => [tm], allies: () => allies, c: { get: () => ({ name: 'タロウ' }) } };
  for (const c of [tm, { ...tm, drill: 1 }, { ...tm, mOver: 1 }, md, { ...md, bomb: 1 }, { ...md, c10Down: 1 }]) c10aDraw(scene, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const sc2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, enemies: () => [tm], c: { get: () => ({ name: 'タロウ' }) } };
  for (const e of [{ c10Nobose: ['a0'] }, { c10OverHeat: {} }, { c10Iced: {} }, { c10DrillUp: {} }, { c10Cool: {} }, { c10Mist: { ids: ['a0'], kinoko: ['a0'] } }, { c10Clean: { teru: true } }, { c10Half: {} }, { c10BombUp: {} }, { c10Down: { id: 'x' } }]) c10aPresent(sc2, e);
  for (const w of ['のぼせた', 'オーバーヒート', 'ひえて', 'ドリル', '冷きゃく水', 'きのこ', 'カビとかべ', 'ふえた', '大カビばくだん', '止まった']) assert.ok(banners.some((t) => t.includes(w)), w);
  // コマンドの せつめい（新しい コマンドは ない）
  assert.ok(c10aCmdInfo({ enemies: () => [tm], allies: () => [] }, { name: 'タロウ', heat10: 4, heatMax10: 5 }).includes('防御'));
  assert.equal(c10aCmdInfo({ enemies: () => [tm], allies: () => [] }, { name: 'タロウ', heat10: 1, heatMax10: 5 }), '');
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C10A_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC10aFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C10A_SCREEN_ANIMS, ...Object.keys(C10A_ALLY_FX), ...Object.keys(C10A_SFX)]) assert.ok(anims.includes(a), a);
  for (const [kk, v] of Object.entries(C10A_ALLY_FX)) assert.equal(CH4_ALLY_FX[kk], v, kk);
  for (const a of Object.values(C10A_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
  // 前ぶれの 技の 名前
  for (const id of [DRILLUP, DRILL, OVER, COOL, BOMBUP, BOMB]) assert.ok(ABILITIES[id], id);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c10a.js', 'public/js/shared/data/abilities-c10a.js',
    'public/js/shared/data/encounters-c10a.js', 'public/js/shared/data/companions-c10a.js', 'public/js/shared/data/items-c10a.js', 'public/js/shared/data/boss-hints-c10a.js',
    'public/js/shared/battle-c10a.js', 'public/js/client/battle-c10a.js', 'public/js/client/render/c10a-art.js', 'public/js/client/render/c10a-bg.js', 'public/js/client/render/battlefx-c10a.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
