// 第3部 第1章 第1幕「星ふるえの夜」B（戦いと 品）。docs/plan-part3.md の 9-3
// 名前の 約束・ふつうの 魔物 6しゅ（素材・仲間・出る 表・ランク・絵）・星の子（リーダーの フラグで 出る・わくを 使わない・5人でも おなじ）・
// 中ボス「3人組と スイトール1号」（前ぶれ・防御で 守る・すいこみ口・光が 3つ へると 負け）・
// ボス「ホシモリの ともしびの ためし」（ともしび・明かりを わける・夜明けの めもり・まっくらで 負け・半分から 2人）・
// 強さ（知って いる 人は 勝てる・完全オートは 勝てない）・品（★5 の k・宝箱の id）・負けた 時の ヒント・絵・がめん・字の きまり
// A の マップ・台本は まだ ないので、きまった 戦いは Battle を じかに 作って 動かす（世界で 作る ところは startFixedBattle で 見る）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, pub } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS, rankOf } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO, bossHintAt } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { C9A, C9A_BATTLE, C9A_BOSS_MON, C9A_MON_PREFIX, C9A_TRACKS, SPICA, STAR_FORK } from '../public/js/shared/maps/c9a-flags.js';
import {
  MONSTERS_C9A, C9A_MINIONS, C9A_FOREST_MON, C9A_CAVE_MON, C9A_FOREST_BASE, C9A_HIDDEN, C9A_MAT_DROPS, C9A_SUITORU, C9A_HOSHIMORI, C9A_NOZZLE, TRIO,
} from '../public/js/shared/data/monsters-c9a.js';
import { C9A_ABILITIES, SHARE } from '../public/js/shared/data/abilities-c9a.js';
import { FRIENDS_C9A } from '../public/js/shared/data/companions-c9a.js';
import { ENCOUNTERS_C9A, FIXED_C9A, ZONE_BG_C9A } from '../public/js/shared/data/encounters-c9a.js';
import { ITEMS_C9A, C9A_TREASURE, C9A_CHEST_IDS, C9A_GEAR_CHESTS, c9aChest, C9A_DROPS, C9A_K, C9A_ITEM_KANA } from '../public/js/shared/data/items-c9a.js';
import { C9A_BOSS_HINTS, C9A_HINT_WHO } from '../public/js/shared/data/boss-hints-c9a.js';
import {
  AIM, SUCK, REST, BREATH, DAWN, SPICA_HEAL, addSpica, mechaOf, nozzleOf, hoshimoriOf, litAllies, unlitAllies, guardOf, c9aEffect, c9aPlan, c9aPub, trialConf,
} from '../public/js/shared/battle-c9a.js';
import { towerTurnStart } from '../public/js/shared/battle-ch5.js';
import { ch9Party, ch9Run, CH9_LV, CH9_KIT } from '../tools/sim-ch9.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC9aFx, C9A_FINE } from '../public/js/client/render/battlefx-c9a.js';
import { playC8cFx, C8C_FINE } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import {
  C9A_SCREEN_ANIMS, C9A_ALLY_FX, C9A_SFX, C9A_OWN_TELE, c9aDraw, c9aPresent, c9aSprite, c9aCmdItems, c9aCmdPick, spicaStars,
} from '../public/js/client/battle-c9a.js';
import { c8rCmdItems, c8rCmdPick } from '../public/js/client/battle-c8r.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { rankPoints } from '../tools/gen-monster-ranks.mjs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { Bot, tickN } from './helpers.js';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const turn = (b, c, cmd = { type: 'ai' }) => {
  const ev = ev0();
  towerTurnStart(b, c, ev, cmd);
  return ev;
};
const effect = (b, c, id, targets = []) => {
  const ev = { ...ev0(), fx: { targets: targets.map((t) => t.id) } };
  assert.ok(c9aEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id);
  return ev;
};
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
function battle(which, { n = 4, flags = {}, seed = 3, enemies = null, lv = null } = {}) {
  const party = ch9Party(which === 'normal' ? 'trio' : which, lv || CH9_LV[which] || 97).slice(0, Math.min(4, n));
  // 5人目（ゲストの わく）: 4人と おなじ 勇者を もう 1人
  while (party.length < n) party.push(ch9Party('trio', 96)[0]);
  const allies = party.map((c) => ({ char: c, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' }));
  const en = enemies || (which === 'normal' ? ['c9a_star_wolf'] : groupOf(C9A_BATTLE[which]));
  return new Battle({ rng: makeRng(seed), boss: which !== 'normal', canFlee: which === 'normal', allies, enemies: en, hooks: { leaderFlag: (f) => !!flags[f] } });
}
// 味方が 1回ずつ 動く（ATB を まわさずに。executeNext で その 人の 番を すぐ）
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（9-4）: 決まった 戦い c9a_trio・c9a_trial・ボスの 魔物の id・星の子・星の音さ・曲・出る 表・背景', () => {
  assert.deepEqual(Object.keys(FIXED_C9A).sort(), Object.values(C9A_BATTLE).sort());
  const trio = FIXED_ENCOUNTERS[C9A_BATTLE.trio];
  const trial = FIXED_ENCOUNTERS[C9A_BATTLE.trial];
  assert.equal(trio.group[0][0], C9A_BOSS_MON.trio);
  assert.equal(trial.group[0][0], C9A_BOSS_MON.trial);
  assert.deepEqual(trio.group.map((g) => g[0]), [C9A_SUITORU, C9A_NOZZLE], 'すいこみ口は べつの 的');
  for (const f of [trio, trial]) {
    assert.ok(f.boss && f.canFlee === false && !f.loseOk, '負けても よい 戦いでは ない');
    assert.ok(battleBgSpec(f.bg), f.bg);
  }
  assert.equal(trio.bgm, C9A_TRACKS.trio);
  assert.equal(trial.bgm, C9A_TRACKS.trial);
  assert.equal(C9A_SUITORU, C9A_BOSS_MON.trio);
  assert.equal(C9A_HOSHIMORI, C9A_BOSS_MON.trial);
  for (const id of Object.keys(MONSTERS_C9A)) assert.ok(id.startsWith(C9A_MON_PREFIX), id);
  for (const id of Object.keys(C9A_HIDDEN)) assert.ok(id.startsWith(C9A_MON_PREFIX) && MONSTERS[id] && !Object.keys(MONSTERS).includes(id), `${id}: 図鑑に 出ない`);
  assert.equal(SPICA, 'spica');
  assert.equal(ITEMS[STAR_FORK]?.type, 'key');
  assert.equal(ITEMS[STAR_FORK].name, '星の音さ');
  assert.deepEqual(Object.keys(ENCOUNTERS_C9A), ['t9a_forest', 't9a_b1', 't9a_b2', 't9a_b3', 't9a_b4']);
  for (const z of Object.keys(ENCOUNTERS_C9A)) {
    assert.ok(ENCOUNTER_TABLES[z], z);
    assert.ok(battleBgSpec(ZONE_BG[z]), `${z}: 背景`);
    assert.equal(ZONE_BG[z], ZONE_BG_C9A[z]);
  }
  // 3人組の 名前は もとの 作品の 名前を そのまま 使わない（もじり）
  assert.deepEqual(TRIO, { group: 'ホシドロ一味', leader: 'キラジョ', maker: 'ボヤッチ', strong: 'ズラッカ' });
  const text = JSON.stringify([MONSTERS_C9A, C9A_ABILITIES]);
  for (const w of ['ドロンボー', 'ドロンジョ', 'ボヤッキー', 'トンズラー', 'ポチっとな', 'おしおき', 'やっておしまい']) assert.ok(!text.includes(w), w);
});

// ───────────── ふつうの 魔物 6しゅ ─────────────
test('ふつうの 魔物 6しゅ: 仲間に なる・素材・出る 表・ランク（F〜C が いる・B〜S は 1しゅ）・系統・Lv・森は 第1章の 魔物の 星の すがた', () => {
  assert.equal(C9A_MINIONS.length, 6);
  const races = new Set(Object.values(MONSTERS).filter((m) => !m.boss).map((m) => m.race));
  const names = Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C9A[id]).map(([, m]) => m.name);
  for (const sp of C9A_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && !m.boss, sp);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && FRIENDS_C9A[sp], `${sp}: 仲間に なる`);
    assert.ok(MAT_DROPS[sp] && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', `${sp}: 今の 素材`);
    assert.deepEqual(MAT_DROPS[sp], C9A_MAT_DROPS[sp]);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランクの 表`);
    assert.ok(!names.includes(m.name), `${sp}: 名前が かぶらない`);
    assert.ok(m.desc && m.desc.length < 80, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const [, id] of FRIENDS_C9A[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(Object.values(ENCOUNTERS_C9A).some((t) => t.some((e) => e.group.some((g) => g[0] === sp))), `${sp}: 出る 表`);
  }
  for (const sp of C9A_FOREST_MON) assert.ok(m96(sp), sp);
  function m96(sp) { return MONSTERS[sp].lv >= 96 && MONSTERS[sp].lv <= 97; }
  for (const sp of C9A_CAVE_MON) assert.ok(MONSTERS[sp].lv >= 97 && MONSTERS[sp].lv <= 98, sp);
  // 森 3しゅは 第1章の ささやきの森（forest の 表）の 魔物の 星の すがた
  for (const [sp, base] of Object.entries(C9A_FOREST_BASE)) {
    assert.ok(ENCOUNTER_TABLES.forest.some((e) => e.group.some((g) => g[0] === base)), `${base} は ささやきの森の 魔物`);
    assert.ok(MONSTERS[sp].name.startsWith('星くず') && MONSTERS[sp].name.includes(MONSTERS[base].name.replace(/^(はぐれ|ねむり)/, '')), `${sp}: ${MONSTERS[sp].name}`);
    assert.equal(MONSTERS[sp].race, MONSTERS[base].race);
  }
  // くらやみ虫（暗い マスだけ）・こけ玉（たおすと こけが 光る）は A班の フィールドの しるし
  assert.equal(MONSTERS.c9a_yamimushi.darkOnly, true);
  assert.equal(MONSTERS.c9a_kokedama.mossGlow, true);
  assert.ok(!ENCOUNTERS_C9A.t9a_b1.concat(ENCOUNTERS_C9A.t9a_b2, ENCOUNTERS_C9A.t9a_forest).some((e) => e.group.some((g) => g[0] === 'c9a_yamimushi')), 'くらやみ虫は 地下3階から');
  // ランク: F〜C が いる・B〜S は 2わりまで（1しゅ）
  const ranks = C9A_MINIONS.map((sp) => rankOf(sp, MONSTERS));
  for (const r of ['F', 'E', 'D', 'C']) assert.ok(ranks.includes(r), r);
  assert.ok(ranks.filter((r) => ['B', 'A', 'S'].includes(r)).length <= 1);
  for (const sp of C9A_MINIONS) assert.equal(rankPoints(sp).band, '第3部 第1章', sp);
  // 第8章 第4幕の さいごの 魔物より 少し 強い
  for (const sp of C9A_MINIONS) assert.ok(MONSTERS[sp].hp >= 2500 && MONSTERS[sp].exp > MONSTERS.sand_knight.exp, sp);
});

// ───────────── 星の子 ─────────────
test('星の子: リーダーが c9_child を 持つと 出る・わくを 使わない・全員が 動いた あとに いちばん HPの 少ない 仲間を 6% 回復・5人でも おなじ', () => {
  const off = battle('normal');
  assert.equal(off.c9sp, undefined, 'フラグが ない ときは 出ない');
  assert.equal(off.snapshot().spica, null);
  for (const n of [1, 4, 5]) {
    const b = battle('normal', { n, flags: { [C9A.child]: true } });
    assert.ok(b.c9sp, `${n}人: 出る`);
    assert.equal(b.allies.length, n, `${n}人: わくを 使わない`);
    assert.ok(!b.combatants.some((x) => x.name === 'スピカ'), '戦う 人には 入らない');
    assert.deepEqual(b.snapshot().spica, { light: 3, max: 3, glows: 0 });
    // HPを へらして、全員が 1回ずつ 動くと ほのかな光
    const [a0] = b.allies;
    a0.hp = Math.round(a0.maxHp * 0.3);
    let last;
    for (const [i, a] of b.allies.entries()) {
      const hp0 = a0.hp;
      last = act(b, a, { type: 'defend' });
      if (i < n - 1) assert.equal(a0.hp, hp0, '全員が 動くまでは 光らない');
    }
    assert.equal(b.c9sp.glows, 1, `${n}人`);
    assert.equal(last.c9Spica.to, a0.id);
    assert.equal(last.c9Spica.heal, Math.round(a0.maxHp * SPICA_HEAL));
    assert.ok(last.lines.some((l) => l.includes('スピカのほのかな光')));
    // 攻撃は しない
    assert.ok(!last.results.some((r) => r.dmg > 0));
  }
  // 戦いを まわしても こわれない（ふつうの 魔物を たおす）
  const b = battle('normal', { flags: { [C9A.child]: true }, enemies: ['c9a_star_wolf', 'c9a_star_kinoko'] });
  for (let t = 0; t < 300000 && !b.over; t += 50) b.tick(50);
  assert.equal(b.result.outcome, 'win');
  assert.ok(b.c9sp.glows >= 1);
});

test('星の子: 世界で 作る 戦い（world/battles.js の makeBattle）は リーダーの フラグを 見る', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(90), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  const start = (flag) => {
    if (flag) c.flags[C9A.child] = true;
    else delete c.flags[C9A.child];
    for (const x of [...world.battles.values()]) world.battles.delete(x.id);
    startFixedBattle(world, bot.s, [bot.s], 'c8_gate1');
    return [...world.battles.values()].pop();
  };
  assert.equal(start(false).battle.c9sp, undefined, 'フラグなし');
  const ctx = start(true);
  assert.ok(ctx.battle.c9sp, 'c9_child で 星の子');
  assert.deepEqual(ctx.battle.snapshot().spica.max, 3);
  await tickN(world, 1);
});

// ───────────── 中ボス ─────────────
test('中ボス「3人組と スイトール1号」: 3回 動くと すいこみ口を 向ける（前ぶれ）→ 次に すいこむ。防御の 人が 前に 立つ・守れないと 光が へり メカが 強く なる', () => {
  const b = battle('trio');
  const m = mechaOf(b);
  const n = nozzleOf(b);
  assert.ok(m && n && b.c9sp, '星の子は かならず 出る');
  assert.equal(b.c9sp.light, 3);
  assert.equal(n.speed < 0.001, true, 'すいこみ口は 動かない');
  // 1・2回目は ふつう
  turn(b, m);
  assert.equal(m.telegraph, null);
  turn(b, m);
  assert.equal(m.telegraph, null);
  // 3回目: すいこみ口を 向ける（前ぶれ）
  turn(b, m);
  assert.equal(m.telegraph, AIM);
  m.telegraph = null;
  const evA = effect(b, m, AIM);
  assert.ok(evA.c9tAim && m.c9t.aim);
  assert.ok(evA.lines.some((l) => l.includes('すいこみ口が、星の子の方を向いた')));
  // 次の 番: すいこむ
  turn(b, m);
  assert.equal(m.telegraph, SUCK);
  m.telegraph = null;
  // 防御の 人が いる → 代わりに 受ける（光は へらない）
  const g = b.allies[0];
  g.defending = true;
  const hp0 = g.hp;
  const ev1 = effect(b, m, SUCK);
  assert.equal(ev1.c9tSuck.guard, g.id);
  assert.equal(guardOf(b), g);
  assert.ok(g.hp < hp0, '中くらいの ダメージ');
  assert.ok(g.hp > 0);
  assert.equal(b.c9sp.light, 3);
  g.defending = false;
  // 守れない → 光が 1つ へり、メカが 回復・攻撃が 強く なる
  m.hp = m.maxHp - 5000;
  const atk0 = m.atk;
  const ev2 = effect(b, m, SUCK);
  assert.equal(ev2.c9tSuck.guard, null);
  assert.equal(b.c9sp.light, 2);
  assert.ok(m.hp > m.maxHp - 5000 && m.atk > atk0);
  assert.equal(ev2.c9Spica.light, 2);
  // かばう の 人も 前に 立つ
  b.allies[1].cover = { target: 'all', left: 2 };
  assert.equal(guardOf(b), b.allies[1]);
  b.allies[1].cover = null;
  // 3つ へると 負け
  effect(b, m, SUCK);
  assert.equal(b.c9sp.light, 1);
  assert.ok(!b.pendingEnd);
  const ev3 = effect(b, m, SUCK);
  assert.equal(b.c9sp.light, 0);
  assert.deepEqual(b.pendingEnd, { outcome: 'lose' });
  assert.ok(ev3.postLines.some((l) => l.includes('全部すいこまれて')));
  // がめんへ
  const o = c9aPub(m);
  assert.ok('c9Aim' in o && o.c9AimEvery === 3);
  assert.equal(c9aPub(n).c9Nozzle, 1);
});

test('中ボス: すいこみ口を こわすと すいこみが 止まり、メカは 1回 休む → 3回 動くと 直る。メカを たおすと すいこみ口も・3人組は にげる', () => {
  const b = battle('trio');
  const m = mechaOf(b);
  const n = nozzleOf(b);
  turn(b, m);
  turn(b, m);
  turn(b, m);
  m.telegraph = null;
  effect(b, m, AIM);
  assert.ok(m.c9t.aim);
  // すいこみ口を こわす（味方の 攻撃で）
  const ev = { ...ev0(), id: b.allies[0].id };
  b.damage(b.allies[0], n, n.hp + 10, ev, { element: 'phys', phys: true });
  assert.ok(!n.alive);
  assert.ok(ev.c9tBreak?.stop, 'すいこみが 止まった');
  assert.ok(!m.c9t.aim && m.c9t.broken);
  // 1回 休む
  turn(b, m);
  assert.equal(m.telegraph, REST);
  m.telegraph = null;
  const evR = effect(b, m, REST);
  assert.ok(evR.c9tRest);
  turn(b, m);
  assert.equal(m.telegraph, null, '休みは 1回');
  assert.ok(!n.alive);
  // 3回 動くと 直る（すいこみ口が もどる）
  const evF = turn(b, m);
  assert.ok(evF.c9tFix && n.alive && n.hp === n.maxHp);
  assert.ok(!m.c9t.broken && m.c9t.aimLeft === 3, 'また 3回で 向ける');
  // メカを たおす: すいこみ口も いっしょに・3人組は 空の かなたへ
  const ev2 = { ...ev0(), id: b.allies[0].id };
  b.damage(b.allies[0], m, m.hp + 10, ev2, { element: 'phys', phys: true });
  assert.ok(!m.alive && !n.alive);
  assert.ok(ev2.c9tDown);
  assert.ok((ev2.postLines || []).concat(ev2.lines).some((l) => l.includes('空のかなた')));
  b.checkEnd();
  assert.deepEqual(b.pendingEnd, { outcome: 'win' });
});

// ───────────── ボス ─────────────
test('ボス「ホシモリの ともしびの ためし」: 全員に ともしび・やみの いぶき（前ぶれ・ねらう 人）で 消える・身を 守ると 消えない・消えた 人は ダメージと 回復が 半分', () => {
  const b = battle('trial');
  const h = hoshimoriOf(b);
  assert.ok(h && b.c9sp);
  assert.equal(litAllies(b).length, 4);
  for (const a of b.allies) {
    assert.ok(a.c9torch && a.abilities[0] === SHARE, '全員が ともしびと「明かりをわける」');
    assert.equal(pub(a).torch9, 1);
  }
  assert.equal(h.turns, 2, '1つの 番に 2回 動く');
  // 番の はじめ（1回目）で めもりと いぶきを 数える
  h.queued = true;
  let ev = turn(b, h);
  assert.equal(h.c9h.dawn, 1);
  assert.equal(ev.c9hDawn.dawn, 1);
  h.queued = false;
  turn(b, h);
  assert.equal(h.c9h.dawn, 1, '2回目の 行動は 数えない');
  h.queued = true;
  ev = turn(b, h);
  assert.equal(h.c9h.dawn, 2);
  assert.equal(ev.c9hWarn.ids.length, 1, '前ぶれ・ねらう 人は 1人');
  assert.ok(ev.lines.some((l) => l.includes('大きく息をすいこんだ')));
  const [tid] = ev.c9hWarn.ids;
  const t = b.get(tid);
  assert.deepEqual(c9aPub(h).hmBreathAim, [tid]);
  // 次の 番: やみの いぶき
  ev = turn(b, h);
  assert.equal(h.telegraph, BREATH);
  h.telegraph = null;
  t.defending = true;
  ev = effect(b, h, BREATH);
  assert.deepEqual(ev.c9hBreath.kept, [tid], '身を 守ると 手で かこって 消えない');
  assert.ok(t.c9torch);
  // 身を 守らないと 消える
  t.defending = false;
  h.c9h.aim = [tid];
  ev = effect(b, h, BREATH);
  assert.deepEqual(ev.c9hBreath.out, [tid]);
  assert.ok(!t.c9torch);
  assert.equal(pub(t).torch9, 0);
  // 消えた 人の 攻撃は 半分（ホシモリの HP は 1 より 下がらない）
  const other = b.allies.find((x) => x.c9torch);
  const e1 = { ...ev0(), id: t.id };
  b.damage(t, h, 1000, e1, { element: 'phys', phys: true });
  const e2 = { ...ev0(), id: other.id };
  b.damage(other, h, 1000, e2, { element: 'phys', phys: true });
  const d1 = e1.results.find((r) => r.id === h.id)?.dmg;
  const d2 = e2.results.find((r) => r.id === h.id)?.dmg;
  assert.equal(d1 * 2, d2);
  const e3 = { ...ev0(), id: other.id };
  b.damage(other, h, h.hp + 99999, e3, { element: 'phys', phys: true });
  assert.ok(h.alive && h.hp === 1, 'たおれない');
  // 回復も 半分
  const healer = b.allies.find((x) => x.job === 'high_priest');
  const hurt = b.allies.find((x) => x !== healer);
  const eff = { type: 'heal', base: [400, 400], fixed: true };
  healer.c9torch = true;
  hurt.hp = 1;
  const h1 = { ...ev0() };
  b.heal(healer, hurt, eff, h1, 1);
  healer.c9torch = false;
  hurt.hp = 1;
  const h2 = { ...ev0() };
  b.heal(healer, hurt, eff, h2, 1);
  assert.equal(h1.results[0].heal, h2.results[0].heal * 2);
});

test('ボス: 明かりを わける（ともしびが ある 人だけ）・星の子の 光は 3回に 1回 つける・夜明けの めもり（大きな 一撃で もう 1・16 で 勝ち・うなずく）・まっくらで 負け・半分から 2人', () => {
  const b = battle('trial');
  const h = hoshimoriOf(b);
  const [a, c2] = b.allies;
  c2.c9torch = false;
  // 明かりを わける
  let ev = effect(b, a, SHARE, [c2]);
  assert.ok(ev.c9hShare && c2.c9torch);
  // ともしびが ない 人は わけられない
  a.c9torch = false;
  c2.c9torch = false;
  ev = effect(b, a, SHARE, [c2]);
  assert.ok(!c2.c9torch && ev.lines.some((l) => l.includes('自分のともしびが消えている')));
  // コマンドで（ほんとうの 行動）
  b.allies[2].c9torch = true;
  const e = act(b, b.allies[2], { type: 'ability', id: SHARE, target: a.id });
  assert.ok(e.c9hShare && a.c9torch);
  // 星の子の ほのかな光: 3回に 1回 消えた ともしびを つける
  b.c9sp.glows = 2;
  c2.c9torch = false;
  for (const x of b.allies) act(b, x, { type: 'defend' });
  assert.equal(b.c9sp.glows, 3);
  assert.ok(c2.c9torch, '3回目の 光で つく');
  // 夜明けの めもり: 大きな 一撃で もう 1
  h.queued = true;
  h.c9h.dmg = trialConf(h).big;
  let tv = turn(b, h);
  assert.equal(tv.c9hDawn.gain, 2);
  // 半分を こえると いぶきは 2人に
  h.c9h.dawn = 9;
  h.c9h.aim = [];
  h.c9h.left = 1;
  tv = turn(b, h);
  assert.equal(tv.c9hWarn.ids.length, 2);
  // 16 で 勝ち（たおれずに うなずく）
  h.c9h.aim = [];
  h.c9h.dawn = 15;
  tv = turn(b, h);
  assert.equal(h.telegraph, DAWN);
  h.telegraph = null;
  ev = effect(b, h, DAWN);
  assert.ok(ev.c9hWin && h.alive && h.c9h.won);
  assert.deepEqual(b.pendingEnd, { outcome: 'win' });
  assert.ok(b.killed.includes(C9A_HOSHIMORI), '経験値・落とし物は ふつう');
  assert.equal(c9aPub(h).hmWin, 1);
  // まっくら: 全員の ともしびが 消えると 負け
  const b2 = battle('trial', { seed: 5 });
  const h2 = hoshimoriOf(b2);
  for (const x of b2.allies.slice(1)) x.c9torch = false;
  h2.c9h.aim = [b2.allies[0].id];
  ev = effect(b2, h2, BREATH);
  assert.ok(ev.c9hDark);
  assert.deepEqual(b2.pendingEnd, { outcome: 'lose' });
  // HPが 0 の 人の ともしびも 消える（のこりが ない と まっくら）
  const b3 = battle('trial', { seed: 7 });
  for (const x of b3.allies.slice(1)) x.c9torch = false;
  b3.kill(b3.allies[0], null, ev0());
  assert.ok(!b3.allies[0].c9torch);
  assert.deepEqual(b3.pendingEnd, { outcome: 'lose' });
  assert.equal(unlitAllies(b3).length, 3);
});

test('オート: 完全オートは 防御も 明かりを わけるも えらばない（c9aPlan は null）。知って いる 人は 防御・明かりを わける', () => {
  const b = battle('trial');
  const decide = () => ({ type: 'attack' });
  const [a, c2] = b.allies;
  c2.c9torch = false;
  assert.equal(c9aPlan(b, a, decide), null, '完全オート');
  b.knowsCh9 = 'know';
  assert.deepEqual(c9aPlan(b, a, decide), { type: 'ability', id: SHARE, target: c2.id });
  assert.ok(ABILITIES[SHARE].noAuto, 'オートの 技には 入らない');
  const t = battle('trio');
  const m = mechaOf(t);
  m.c9t.aim = true;
  assert.equal(c9aPlan(t, t.allies[0], decide), null);
  t.knowsCh9 = 'know';
  assert.deepEqual(c9aPlan(t, t.allies[0], decide), { type: 'defend' });
});

// ───────────── 強さ ─────────────
test('強さ: 知って いる 人は 勝てる・完全オートは 勝てない（3人組・ためし。少しの 回数）', { timeout: 600000 }, () => {
  for (const boss of ['trio', 'trial']) {
    const know = [1, 2, 3, 4, 5, 6].map((s) => ch9Run(boss, CH9_LV[boss], 'know', 9090 + s * 7919));
    assert.ok(know.filter((r) => r.outcome === 'win').length >= 3, `${boss}: 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
    const auto = [1, 2, 3, 4].map((s) => ch9Run(boss, CH9_LV[boss], 'auto', 9090 + s * 7919));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `${boss}: 完全オート`);
    const wins = know.filter((r) => r.outcome === 'win');
    const sec = wins.reduce((s, r) => s + r.seconds, 0) / wins.length;
    assert.ok(sec >= 200 && sec <= 420, `${boss}: 長さ ${sec}秒`);
  }
  // その ころの ★装備は だれでも つけられる
  for (const boss of ['trio', 'trial']) for (const [job, kit] of Object.entries(CH9_KIT[boss])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
});

// ───────────── 品 ─────────────
test('品: 宝箱の id（13こ）・階ごとに ★5 装備 1つ（k 2.10〜2.14）＋ 素材か 道具・ボスの 品・星の音さ・読みがな', () => {
  assert.deepEqual(C9A_CHEST_IDS, ['c9a_f1', 'c9a_f2', 'c9a_b1a', 'c9a_b1b', 'c9a_b2a', 'c9a_b2b', 'c9a_b3a', 'c9a_b3b', 'c9a_b4a', 'c9a_b4b', 'c9a_s1', 'c9a_s2', 'c9a_fork1']);
  for (const id of C9A_CHEST_IDS) {
    const c = c9aChest(id);
    assert.ok(c && ITEMS[c.item] && c.n >= 1, id);
    const gear = ['weapon', 'armor', 'shield', 'head', 'acc'].includes(ITEMS[c.item].type);
    assert.equal(gear, C9A_GEAR_CHESTS.includes(id), `${id}: ★5 装備は …a と f1 だけ`);
    if (gear) {
      assert.equal(c.n, 1);
      const it = ITEMS[c.item];
      assert.ok(it.rank === 10 && it.rarity === 4 && it.src === 'c9a', id);
      assert.equal(rareWhereText(c.item), '星ふるえの夜の宝箱でしか手に入らない');
    } else assert.ok(['mat', 'use'].includes(ITEMS[c.item].type), `${id}: 素材か 道具`);
  }
  assert.equal(c9aChest('nope'), null);
  // k: 森 2.10 → 地下4階 2.14（第8章 第4幕は 2.03〜2.08）
  assert.deepEqual(Object.values(C9A_K), [2.10, 2.11, 2.12, 2.13, 2.14]);
  // ボスの 品
  for (const [boss, [acc, wep]] of Object.entries(C9A_DROPS)) {
    assert.deepEqual(MONSTERS[boss].drops.boss, [acc]);
    assert.deepEqual(MONSTERS[boss].drops.rare, [wep, 1]);
    assert.ok(ITEMS[acc].type === 'acc' && ITEMS[acc].rarity === 3 && ITEMS[acc].unique);
    assert.ok(ITEMS[wep].type === 'weapon' && ITEMS[wep].rarity === 5);
  }
  // おうぎ・つえは 今までで いちばん 強い（作品の 伝説の 品は 同じ 強さに ならぶ）
  const top = (cat) => Math.max(...Object.entries(ITEMS).filter(([id, it]) => it.type === 'weapon' && it.cat === cat && !it.base && !id.includes('+') && !ITEMS_C9A[id] && !it.work).map(([, it]) => it.atk));
  assert.ok(ITEMS.c9b_kirajo_fan.atk > top('fan'));
  assert.ok(ITEMS.c9b_owl_staff.atk > top('staff'));
  // 新しい お守りは 第2部の さいごの お守りと ならぶ くらい（作品の 伝説の アクセが 8わりを 下回らない）
  const bsum = (it) => Object.values(it.bonus || {}).reduce((t, v) => t + Math.max(0, v), 0);
  assert.ok(bsum(ITEMS.c9b_dawn_feather) >= bsum(ITEMS.c8s_promise_crest) && bsum(ITEMS.c9b_dawn_feather) <= 287);
  assert.ok(bsum(ITEMS.c9b_trio_badge) <= bsum(ITEMS.c9b_dawn_feather));
  // 読みがな・水に 強い 装備は 作らない
  for (const id of Object.keys(ITEMS_C9A)) {
    assert.ok(ITEM_KANA[id] && C9A_ITEM_KANA[id], id);
    assert.ok(!ITEMS[id].resist?.water, id);
  }
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 2つの 戦いに 3つずつ（ぼんやり → はっきり）・言う 人は ノクト・40字 くらい', () => {
  for (const id of Object.values(C9A_BATTLE)) {
    assert.equal(C9A_BOSS_HINTS[id].length, 3, id);
    assert.deepEqual(BOSS_HINTS[id], C9A_BOSS_HINTS[id], 'E班の しくみに まざる');
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    for (const t of C9A_BOSS_HINTS[id]) assert.ok(t.length >= 10 && t.length <= 42 && !/ /.test(t), `${id}: ${t}`);
    assert.equal(bossHintAt(id, 9), C9A_BOSS_HINTS[id][2]);
  }
  assert.equal(C9A_HINT_WHO, 'ノクト');
  assert.ok(C9A_BOSS_HINTS.c9a_trio[2].includes('防御') && C9A_BOSS_HINTS.c9a_trio[2].includes('すいこみ口'));
  assert.ok(C9A_BOSS_HINTS.c9a_trial[2].includes('明かりをわける'));
});

// ───────────── 絵 ─────────────
test('絵: 新しい 絵は 3しゅ（地下道）・森は 今の 絵の 色がえ ＋ 星の きらめき・ボス 2体は 2倍の こまかさ・ホシモリは うなずく コマ・すいこみ口', () => {
  const fresh = C9A_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base);
  assert.deepEqual(fresh, C9A_CAVE_MON, '新しい 絵は 3しゅ');
  for (const sp of C9A_FOREST_MON) {
    const a = MONSTER_ART[sp];
    assert.ok(a.base && a.tint, sp);
    assert.deepEqual(a.size, MONSTER_ART[C9A_FOREST_BASE[sp]].size);
  }
  const g = new Proxy({ w: 100, h: 100 }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  for (const sp of [...C9A_MINIONS, C9A_SUITORU, C9A_HOSHIMORI, C9A_NOZZLE]) {
    assert.ok(MONSTER_ART[sp], sp);
    for (const f of [0, 1]) MONSTER_ART[sp].draw(g, f);
  }
  for (const f of [2, 3]) MONSTER_ART[C9A_HOSHIMORI].draw(g, f);
  for (const sp of [C9A_SUITORU, C9A_HOSHIMORI]) {
    assert.equal(MONSTERS[sp].artScale, 0.5, sp);
    assert.equal(monsterFine(sp), 2, sp);
    assert.ok(MONSTER_ART[sp].size[0] >= 200, `${sp}: 2倍の 大きさで かく`);
    const [w, h] = monsterSize(sp);
    assert.ok(w >= 100 && w <= 130 && h >= 100 && h <= 130, `${sp}: 見た目 ${w}×${h}`);
  }
  // 勝つと うなずく（え の コマ 2・3。ふつうは null）
  assert.equal(c9aSprite({ species: C9A_HOSHIMORI, hmWin: 0 }, 0), null);
  // 背景 2つ
  for (const id of ['c9a_forest', 'c9a_cave']) assert.ok(battleBgSpec(id), id);
});

// ───────────── がめん ─────────────
test('がめん: 星の子の光・すいこみ口の しるし・夜明けの めもり・バナー・コマンド「明かりをわける」（いちばん 上）・えんしゅつ', () => {
  for (const id of C9A_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  assert.equal(spicaStars(2, 3), '★★☆');
  const drawn = [];
  const grad = { addColorStop() {} };
  const x = new Proxy({}, { get: (o, k) => (k in o ? o[k] : /Gradient$/.test(k) ? () => grad : (...a) => drawn.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  const mech = { id: 'e1', species: C9A_SUITORU, alive: true, c9Aim: 1, c9AimLeft: 0, c9AimEvery: 3 };
  const scene = { time: 1000, c: new Map([['a0', { name: '勇者' }]]), allies: () => [], enemies: () => [mech] };
  for (const c of [
    mech,
    { species: C9A_SUITORU, alive: true, c9Aim: 0, c9AimLeft: 2, c9AimEvery: 3 },
    { species: C9A_SUITORU, alive: true, c9Broken: 1, c9FixLeft: 2, c9AimEvery: 3 },
    { species: C9A_NOZZLE, alive: true, c9Nozzle: 1 },
    { species: C9A_HOSHIMORI, alive: true, hmDawn: 5, hmDawnMax: 16, hmBreathLeft: 1, hmBreathEvery: 2, hmBreathAim: [] },
    { species: C9A_HOSHIMORI, alive: true, hmDawn: 9, hmDawnMax: 16, hmBreathAim: ['a0'] },
  ]) {
    const n0 = drawn.length;
    c9aDraw(scene, x, null, c, 80, 20, 100, 100, 1);
    assert.ok(drawn.length > n0, JSON.stringify(c));
  }
  const banners = [];
  const s2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, glowStatus() {}, c: new Map([['a0', { name: '勇者' }]]), c9spica: { light: 3, max: 3 } };
  for (const ev of [{ c9tAim: {} }, { c9tSuck: { guard: 'a0' } }, { c9tSuck: { guard: null, light: 2 } }, { c9tBreak: { stop: true } }, { c9tFix: {} }, { c9tDown: {} },
    { c9hWarn: { ids: ['a0'] } }, { c9hBreath: { out: ['a0'], kept: [] } }, { c9hShare: { to: 'a0' } }, { c9hWin: {} }, { c9hDark: {} }, { c9Spica: { light: 3, relit: 'a0' } }]) {
    const n0 = banners.length;
    c9aPresent(s2, ev, null, null, null);
    assert.ok(banners.length > n0, JSON.stringify(ev));
  }
  c9aPresent(s2, { c9Spica: { light: 1, lost: true } }, null, null, null);
  assert.equal(s2.c9spica.light, 1);
  // コマンド: ともしびが 消えた 仲間が いる 時だけ、いちばん 上に「明かりをわける」
  const me = { id: 'a0', name: '勇者', alive: true, torch9: 1, abilities: [SHARE] };
  const out = { id: 'a1', name: '大賢者', alive: true, hp: 300, torch9: 0 };
  const sent = [];
  const menus = [];
  const sc = { enemies: () => [], allies: () => [me, out], send: (c) => sent.push(c), showMenu: (items, pick) => menus.push({ items, pick }), openCommand() {} };
  assert.deepEqual(c9aCmdItems(sc, me).items.map((i) => i.value), ['c9ashare']);
  assert.deepEqual(c8rCmdItems(sc, me).items.map((i) => i.value), ['c9ashare'], 'client/battle.js の コマンドの いちばん 上');
  assert.equal(c9aCmdItems(sc, { ...me, torch9: 0 }).items.length, 0, '自分の 火が ない 時は 出ない');
  assert.equal(c9aCmdItems({ ...sc, allies: () => [me] }, me).items.length, 0, '消えた 仲間が いない 時は 出ない');
  c8rCmdPick(sc, me, 'c9ashare');
  assert.deepEqual(menus[0].items.map((i) => i.value), ['a1']);
  menus[0].pick({ value: 'a1' });
  assert.deepEqual(sent.pop(), { type: 'ability', id: SHARE, target: 'a1' });
  assert.equal(c9aCmdPick(sc, me, 'other'), false);
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C9A_ABILITIES).map((a) => a.anim))];
  anims.push('c9t_boom');
  for (const a of anims) {
    assert.equal(playC9aFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  assert.equal(playC9aFx(fx, 'slash_fast', [{ x: 1, y: 1 }], null), false);
  for (const a of [...C9A_SCREEN_ANIMS, ...Object.keys(C9A_ALLY_FX), ...Object.keys(C9A_SFX)]) assert.ok(anims.includes(a), a);
  for (const [k, v] of Object.entries(C9A_ALLY_FX)) assert.equal(CH4_ALLY_FX[k], v, k);
  assert.equal(C8C_FINE.c9aflame, C9A_FINE.c9aflame);
  const xx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  for (const t of [0, 0.3, 0.9]) C9A_FINE.c9aflame(xx, { x: 10, y: 10, size: 6, age: t * 500 }, t);
  // 技の せつめいは 1文めで わかる・名前は かぶらない
  const others = Object.entries(ABILITIES).filter(([id]) => !C9A_ABILITIES[id]).map(([, a]) => a.name);
  for (const [id, a] of Object.entries(C9A_ABILITIES)) {
    assert.ok(a.desc && firstSentence(a.desc).length <= 34, `${id}: ${firstSentence(a.desc)}`);
    assert.ok(a.cast, id);
    assert.ok(!others.includes(a.name), `${id}: ${a.name}`);
  }
});

// ───────────── 字の きまり ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c9a.js', 'public/js/shared/data/abilities-c9a.js', 'public/js/shared/data/encounters-c9a.js', 'public/js/shared/data/companions-c9a.js',
    'public/js/shared/data/items-c9a.js', 'public/js/shared/data/boss-hints-c9a.js', 'public/js/shared/battle-c9a.js', 'public/js/client/battle-c9a.js',
    'public/js/client/render/c9a-art.js', 'public/js/client/render/c9a-bg.js', 'public/js/client/render/battlefx-c9a.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
