// 第101回 B班: 第3部 第3章 第1幕「星の船と、星座の島」の 戦いと 品（docs/plan-part3-c11a.md の 17-4・17-5・17-6）
// 名前の 約束・海と 島の 魔物・星座のけもの（そろえて たおす）・時計を投げる と いかり船長（時計の おしつけ合い）・スピカの ごほうび（ながれ星）・
// 自動の 仲間・人数で 合わせる・強さ（人が できる 動き・完全オートは 作戦ごと）・品・ヒント・絵・背景・がめん（コマンドの 行き先）・えんしゅつ・
// もとの お話の 名前を 使わない・曲の ピンチ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS, ITEM_KANA, PART3_LATE_ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { monsterDrops, MAT_DROPS } from '../public/js/shared/data/loot.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { MONSTER_RANKS } from '../public/js/shared/data/monster-ranks.js';
import { rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { BOSS_HINTS, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { canEquip } from '../public/js/shared/stats.js';
import { TACTICS, mechBoss, decideAlly } from '../public/js/shared/ai.js';
import { GUEST_MAX_LEVEL } from '../public/js/shared/guest-rule.js';
import {
  C11A_B as C11A, C11A_CON_B, C11A_MAP_B, C11A_BATTLE_B as C11A_BATTLE, C11A_MON_PREFIX_B, C11A_CHEST_IDS_B, C11A_KEYS_B, C11A_CMD_B, C11A_TRACKS_B, C11A_OPEN_B,
} from '../public/js/shared/maps/c11a-flags.js';
import { C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import { C10C_B as C10C } from '../public/js/shared/maps/c10c-flags.js';
import { C10D_B as C10D } from '../public/js/shared/maps/c10d-flags.js'; // 第99回 A班: c10d-names-b.js は 消した（同じ 名前は maps/c10d-flags.js に）
import {
  MONSTERS_C11A, C11A_SEA_MON, C11A_ISLE_MON, C11A_MINIONS, C11A_RECOLOR_BASE, C11A_NEW_ART, C11A_HEAD, C11A_CHEST, C11A_TAIL, C11A_STARS, C11A_CAPTAIN,
  CAPTAIN_NAME, CAPTAIN_SHORT, SHARK_NAME, BEAST_NAME, C11A_MAT_DROPS,
} from '../public/js/shared/data/monsters-c11a.js';
import { C11A_ABILITIES, TOKEI_NAGE } from '../public/js/shared/data/abilities-c11a.js';
import { ENCOUNTERS_C11A, FIXED_C11A, ZONE_BG_C11A, C11A_ZONES } from '../public/js/shared/data/encounters-c11a.js';
import { FRIENDS_C11A } from '../public/js/shared/data/companions-c11a.js';
import {
  ITEMS_C11A, C11A_TREASURE, C11A_K, C11A_SHOP_K, C11A_GEAR_CHESTS, C11A_PERCH_ARMS, C11A_PERCH_TOOLS, C11A_DROPS, STAR_CHART, STAR_SHIP, c11aChest,
} from '../public/js/shared/data/items-c11a.js';
import { C10D_K, C10D_SHOP_K } from '../public/js/shared/data/items-c10d.js';
import { C10C_SHOP_K } from '../public/js/shared/data/items-c10c.js';
import { C11A_BOSS_HINTS, C11A_HINT_WHO } from '../public/js/shared/data/boss-hints-c11a.js';
import {
  c11aConf, c11aTell, c11aPlan, c11aPub, c11aAllyPub, captainOf, starsOf, clocksOf, startCount, turnOrder, throwGood, holdSafe, NEIGHBORS,
  STAR_EVERY, STAR_RATE, AUTO_EVERY, FANG, ANCHOR, DIZZY,
} from '../public/js/shared/battle-c11a.js';
import { TERU } from '../public/js/shared/battle-c9b.js';
import { SONG } from '../public/js/shared/battle-c9d.js';
import { REWARD_HEAL, REWARD_TERU } from '../public/js/shared/battle-c10a.js';
import { REWARD_SONG } from '../public/js/shared/battle-c10b.js';
import { REWARD_LIT } from '../public/js/shared/battle-c10c.js';
import { bestHit } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { AUTO_TACTICS } from '../tools/sim-ch10.mjs';
import { CH11A_LV, CH10_NOTES } from '../tools/sim-ch11.mjs';
import { ORDER_FLAGS } from '../tools/sim-ch10.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC11aFx } from '../public/js/client/render/battlefx-c11a.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { C11A_BG } from '../public/js/client/render/c11a-bg.js';
import {
  C11A_SCREEN_ANIMS, C11A_ALLY_FX, C11A_SFX, C11A_OWN_TELE, c11aHtml, c11aSprite, c11aDraw, c11aPresent, c11aCmdItems, c11aCmdPick, c11aStatus, c11aBannerOne,
} from '../public/js/client/battle-c11a.js';
import { c9bCmdItems } from '../public/js/client/battle-c9b.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { allyAnimFor } from '../public/js/client/render/battlefx-r27.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { SceneAudio, clockPinch } from '../public/js/client/audio-scene.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
const BASE_FLAGS = { c9_child: true, c9_act1: true, c9_song1: true };
const ALL6 = { ...BASE_FLAGS, [C10A.noteRe]: true, [C10A.noteFa]: true, [C10B.noteSo]: true, [C10B.noteLa]: true, [C10C.noteSi]: true, [C10D.noteDo]: true };
const KEY = { [C11A_BATTLE.beast]: 'beast', [C11A_BATTLE.pirate]: 'pirate' };
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ id = C11A_BATTLE.pirate, kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = ALL6, enemies = null, auto = true, hooks = {} } = {}) {
  const four = ch9Party(KEY[id] || 'pirate', 120);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: k === 'player' ? auto : true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(id), hooks: { leaderFlag: (f) => !!flags[f], ...hooks } });
}
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const foe = (b, m, id = null) => {
  if (id) m.telegraph = id;
  b.queue.push({ id: m.id, cmd: { type: 'ai' }, last: true });
  m.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const quiet = (m) => { m.actions = [{ w: 1, id: 'm_nothing' }]; };
const big = (b) => { for (const a of b.allies) { a.hp = a.maxHp = 99999; } };
const pass = (b, a) => act(b, a, { type: 'ability', id: TOKEI_NAGE });
const nop = (b, a) => act(b, a, { type: 'defend' });
const holderOf = (b, i = 0) => b.c11a.clocks[i].holder;
const allText = (ev) => [...(ev?.lines || []), ...(ev?.postLines || [])].join('\n');

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（17-5）: フラグ・星座の しるし・マップ・決まった 戦い・魔物の id・宝箱・だいじな 物・コマンド・曲・幕の 切りかえ（maps/c11a-flags.js。B の 形の 名前）', () => {
  assert.deepEqual(C11A, {
    act4: 'c10_act4', start: 'c11a_start', chart: 'c11a_chart', launch: 'c11a_launch', perch: 'c11a_perch',
    light1: 'c11a_light1', light2: 'c11a_light2', light3: 'c11a_light3', beast: 'c11a_beast', pirate: 'c11a_pirate', act1: 'c11_act1',
  });
  assert.deepEqual(C11A_CON_B, ['c11a_con0', 'c11a_con1a', 'c11a_con1b', 'c11a_con2a', 'c11a_con2b', 'c11a_con3a', 'c11a_con3b']);
  assert.deepEqual(Object.values(C11A_MAP_B), ['c11_sea', 'c11a_perch', 'c11a_isle1', 'c11a_isle2', 'c11a_isle3']);
  assert.deepEqual(C11A_BATTLE, { beast: 'c11a_beast', pirate: 'c11a_pirate' });
  for (const sp of Object.keys(MONSTERS_C11A)) assert.ok(sp.startsWith(C11A_MON_PREFIX_B), sp);
  assert.deepEqual(C11A_CHEST_IDS_B, ['c11a_c1', 'c11a_c2', 'c11a_c3', 'c11a_c4', 'c11a_c5', 'c11a_c6', 'c11a_c7', 'c11a_c8']);
  assert.deepEqual(Object.keys(C11A_TREASURE).sort(), [...C11A_CHEST_IDS_B].sort());
  assert.deepEqual(C11A_KEYS_B, { chart: STAR_CHART, ship: STAR_SHIP });
  assert.deepEqual([STAR_CHART, STAR_SHIP], ['star_chart', 'star_ship']);
  assert.equal(C11A_CMD_B, 'c11apass');
  assert.equal(C11A_OPEN_B, 'PART3_C11A_OPEN');
  assert.deepEqual(Object.values(C11A_TRACKS_B), ['c11a_sea', 'c11a_isle', 'c11a_perch', 'c11a_const', 'c11a_launch', 'c11a_beast', 'c11a_pirate']);
  // 決まった 戦い: にげられない・ボス・曲は F班の id
  for (const id of Object.values(C11A_BATTLE)) {
    assert.ok(FIXED_C11A[id].boss && FIXED_C11A[id].canFlee === false && FIXED_ENCOUNTERS[id] === FIXED_C11A[id], id);
    assert.equal(FIXED_ENCOUNTERS[id].bgm, id);
  }
  assert.deepEqual(groupOf(C11A_BATTLE.beast), [C11A_HEAD, C11A_CHEST, C11A_TAIL]);
  assert.deepEqual(groupOf(C11A_BATTLE.pirate), [C11A_CAPTAIN], 'サメは ねらえない（的に ならない）');
  // 出る 所の 表（海 ＝ 船の 上・島 1〜3）
  assert.deepEqual(C11A_ZONES, ['t11a_sea', 't11a_isle1', 't11a_isle2', 't11a_isle3']);
  for (const z of C11A_ZONES) assert.equal(ENCOUNTER_TABLES[z], ENCOUNTERS_C11A[z]);
  assert.equal(ZONE_BG.t11a_sea, 'c11a_deck');
  for (const z of ['t11a_isle1', 't11a_isle2', 't11a_isle3']) assert.equal(ZONE_BG_C11A[z], 'c11a_isle');
});

// ───────────── 海と 島の 魔物 ─────────────
test('海と 島の 魔物 8しゅ: Lv118〜120・仲間に なる・今の 素材・ランク・落とす 品の きまり・出る 表（海 4しゅ・島 4しゅ）・新しい 絵 2しゅ ＋ 色ちがい 6しゅ', () => {
  assert.equal(C11A_MINIONS.length, 8);
  const sea = new Set(ENCOUNTERS_C11A.t11a_sea.flatMap((r) => r.group.map((g) => g[0])));
  assert.deepEqual([...sea].sort(), [...C11A_SEA_MON].sort());
  const isle = new Set(['t11a_isle1', 't11a_isle2', 't11a_isle3'].flatMap((t) => ENCOUNTERS_C11A[t].flatMap((r) => r.group.map((g) => g[0]))));
  assert.deepEqual([...isle].sort(), [...C11A_ISLE_MON].sort());
  for (const sp of C11A_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m.lv >= 118 && m.lv <= 120, `${sp} Lv${m.lv}`);
    assert.equal(m.region, 6, sp);
    assert.ok(!m.boss, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    const list = monsterDrops(sp);
    const common = list.find((d) => d.kind === 'common');
    const rare = list.find((d) => d.kind === 'rare');
    assert.ok(common && rare && rare.n >= 32 && rare.n <= 128, sp);
    assert.ok(ITEMS[C11A_MAT_DROPS[sp][0]], `${sp}: 素材 ${C11A_MAT_DROPS[sp][0]}`);
    assert.deepEqual(MAT_DROPS[sp], C11A_MAT_DROPS[sp]);
    const f = MONSTER_FRIENDS[sp];
    assert.ok(f && f === FRIENDS_C11A[sp] && f.noFamily, `${sp}: 仲間に なる`);
    assert.ok(f.rate >= 1 / 26 && f.rate <= 1 / 10, sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランク`);
    assert.ok(MONSTER_ART[sp], `${sp}: え`);
  }
  const ranks = new Set(C11A_MINIONS.map((sp) => MONSTER_RANKS[sp]));
  for (const r of ['F', 'E', 'D', 'C']) assert.ok(ranks.has(r), `ランク ${r}`);
  assert.equal(C11A_NEW_ART.length, 2);
  assert.ok(C11A_NEW_ART.length <= 4, '新しい 絵は 4しゅまで');
  assert.equal(Object.keys(C11A_RECOLOR_BASE).length + C11A_NEW_ART.length, 8);
  for (const [sp, base] of Object.entries(C11A_RECOLOR_BASE)) assert.ok(MONSTER_ART[base] && MONSTER_ART[sp].tint, `${sp} は ${base} の 色ちがい`);
  // 星の海らしい 名前（星の くらげ・ほうき星の 魚）
  assert.ok(MONSTERS.c11a_jelly.name.includes('クラゲ') && MONSTERS.c11a_comet.name.includes('ほうきぼし'));
});

// ───────────── 星座のけもの ─────────────
test('星座のけもの: 3つの 星（あたま・むね・しっぽ ＝ 3体）・1つ たおしても となりが いると よみがえる（HP 半分・前に「星が、また光りはじめた…」）・となりが いなければ よみがえらない・そろえて たおすと 勝ち', () => {
  assert.equal(BEAST_NAME, '星座のけもの');
  for (const sp of C11A_STARS) assert.equal(MONSTERS[sp].lv, 119);
  assert.deepEqual(NEIGHBORS, { [C11A_HEAD]: [C11A_CHEST], [C11A_CHEST]: [C11A_HEAD, C11A_TAIL], [C11A_TAIL]: [C11A_CHEST] });
  const b = battle({ id: C11A_BATTLE.beast });
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b), 'しくみの ある ボス・人が えらぶ 間は 待つ');
  assert.ok(b.c9sp?.teru && b.c9sp?.song, 'スピカ（てらす・星のうた）');
  big(b);
  const [head, chest, tail] = starsOf(b);
  for (const e of [head, chest, tail]) quiet(e);
  const cf = c11aConf(C11A_TAIL, b);
  assert.equal(cf.reviveHp, 0.5);
  // しっぽを たおす → だれかが revive 回 動くと（その 1回 前に 前ぶれ）HP 半分で よみがえる
  tail.hp = 1;
  const a0 = b.allies[0];
  act(b, a0, { type: 'attack', target: tail.id });
  assert.equal(tail.alive, false);
  assert.ok(tail.c11s.dead && tail.c11s.left === cf.revive, JSON.stringify(tail.c11s));
  let warned = false;
  let revived = null;
  for (let i = 0; i < cf.revive; i++) {
    const ev = nop(b, b.allies[1 + (i % 3)]);
    if (allText(ev).includes('星が、また光りはじめた…')) warned = true;
    if (ev.c11aWarn) assert.equal(c11aTell(b), 'revive', 'よみがえる 前は 人を 待つ');
    if (ev.c11aRevive) revived = ev;
  }
  assert.ok(warned, '前ぶれの 文');
  assert.ok(revived && tail.alive && tail.hp === Math.round(tail.maxHp * 0.5), `HP ${tail.hp}`);
  assert.equal(b.c11a.revives, 1);
  // よみがえると けものの 光が 強く なる（3つの 星の 与える ダメージ）
  assert.ok(head.dmgRate > 1 && allText(revived).includes('強くなった'), `${head.dmgRate}`);
  // となりの 星が いない: あたま → むね の じゅんに たおすと、あたまが よみがえる 時に むねが いないので、あたまは もう 光らない
  //   （むねは しっぽが いるので よみがえる）
  head.hp = 1;
  act(b, a0, { type: 'attack', target: head.id });
  chest.hp = 1;
  act(b, b.allies[1], { type: 'attack', target: chest.id });
  for (let i = 0; i < cf.revive + 1; i++) nop(b, b.allies[2]);
  assert.equal(head.alive, false, 'あたまは もう 光らない');
  assert.ok(b.c11a.stayDead >= 1);
  assert.equal(chest.alive, true, 'むねは しっぽから 光が とどく');
  // そろえて たおす: のこりの 2つを 続けて → 勝ち
  chest.hp = 1;
  tail.hp = 1;
  act(b, a0, { type: 'attack', target: chest.id });
  act(b, b.allies[1], { type: 'attack', target: tail.id });
  assert.ok(b.c11a.won && (b.over || b.result?.outcome === 'win' || b.pendingEnd || !b.aliveEnemies().length));
  // 経験値は 1回ぶん（よみがえった 星を また たおしても ふえない）
  for (const sp of C11A_STARS) assert.equal(b.killed.filter((x) => x === sp).length, 1, sp);
});

test('星座のけもの: 星ごとの 役わり … あたま（前ぶれ → 大きな かみつき・防御で へる）・むね（仲間の 星を 回復）・しっぽ（全体攻撃）', () => {
  assert.equal(MONSTERS[C11A_HEAD].c11a.role, 'head');
  assert.equal(MONSTERS[C11A_CHEST].c11a.role, 'chest');
  assert.equal(MONSTERS[C11A_TAIL].c11a.role, 'tail');
  assert.ok(MONSTERS[C11A_CHEST].actions.some((a) => a.id === 'm11b_mend'));
  assert.ok(MONSTERS[C11A_TAIL].actions.some((a) => ABILITIES[a.id]?.target === 'enemies'), 'しっぽ … 全体');
  const b = battle({ id: C11A_BATTLE.beast });
  const [head, chest, tail] = starsOf(b);
  head.c11s.roarLeft = 1;
  quiet(head);
  const ev = foe(b, head);
  assert.ok(ev.c11aRoar && head.c11s.roarReady, '前ぶれ（ふつうに 動きながら）');
  assert.equal(c11aTell(b), 'fang');
  const aim = b.get(head.c11s.aim);
  // ねらわれた 人が 防御 → へる
  aim.hp = aim.maxHp = 99999;
  nop(b, aim);
  assert.ok(aim.defending);
  const hp0 = aim.hp;
  const ev2 = foe(b, head);
  assert.ok(ev2.c11aFang?.guard && !head.c11s.roarReady, JSON.stringify(ev2.c11aFang));
  const guarded = hp0 - aim.hp;
  const b2 = battle({ id: C11A_BATTLE.beast, seed: 3 });
  const h2 = starsOf(b2)[0];
  h2.c11s.roarLeft = 1;
  quiet(h2);
  foe(b2, h2);
  const t2 = b2.get(h2.c11s.aim);
  t2.hp = t2.maxHp = 99999;
  foe(b2, h2);
  assert.ok(guarded < (99999 - t2.hp) * 0.6, `防御 ${guarded} / ふつう ${99999 - t2.hp}`);
  // むね: 仲間の 星を 回復
  tail.hp = tail.maxHp - 2000;
  const ev3 = foe(b, chest, 'm11b_mend');
  assert.ok(ev3.c11aMend && tail.hp > tail.maxHp - 2000);
  // がめんへ
  const p = c11aPub(tail, b);
  assert.equal(p.c11Kind, 'beast');
  assert.equal(p.role11, 'tail');
});

test('星座のけもの: 星が 1つ 消えて いる 間は のこりの 星が 光の 線で まもられる（linkK）・だれも えらんで いない（完全オート）時は もっと つよい（linkAuto）', () => {
  const hit = (auto, down) => {
    const b = battle({ id: C11A_BATTLE.beast, auto, seed: 5 });
    big(b);
    const [head, , tail] = starsOf(b);
    for (const e of starsOf(b)) quiet(e);
    if (down) { tail.hp = 1; act(b, b.allies[1], { type: 'attack', target: tail.id }); assert.equal(tail.alive, false); }
    let sum = 0;
    let said = false;
    // よみがえる 前（revive 回 より 少ない 回数）だけ はかる
    for (let i = 0; i < 3; i++) {
      head.hp = head.maxHp;
      const ev = act(b, b.allies[0], { type: 'attack', target: head.id });
      sum += head.maxHp - head.hp;
      if (allText(ev).includes('光の線がのびて')) said = true;
    }
    return { sum, said, cf: c11aConf(C11A_HEAD, b) };
  };
  const base = hit(false, false);
  const link = hit(false, true);
  assert.ok(!base.said && link.said, '文');
  assert.ok(base.cf.linkK < 1 && base.cf.linkAuto < base.cf.linkK, JSON.stringify(base.cf));
  const r = link.sum / base.sum;
  assert.ok(r < base.cf.linkK + 0.15 && r > base.cf.linkK - 0.15, `人 ${r}`);
  const autoBase = hit(true, false);
  const autoLink = hit(true, true);
  const ra = autoLink.sum / autoBase.sum;
  assert.ok(ra < base.cf.linkAuto + 0.1 && ra < r, `完全オート ${ra}`);
});

// ───────────── いかり船長と 時計 ─────────────
test('いかり船長: はじめに 時計を 味方の 1人へ（数は 動く 人の 数 ＋ 2）・だれかが 動くたびに 1 へる・0 で 持って いる 人を サメが かむ（防御で 半分）・時計は 船長へ もどる', () => {
  assert.ok(CAPTAIN_NAME.startsWith('いかり船長') && !CAPTAIN_NAME.includes(' ') && CAPTAIN_SHORT === 'イバリー');
  assert.equal(SHARK_NAME, 'チクタクザメ');
  assert.equal(MONSTERS[C11A_CAPTAIN].lv, 120);
  const b = battle();
  assert.ok(b.tellAll && b.mechBoss && mechBoss(b));
  assert.equal(c11aTell(b), 'pirate');
  big(b);
  quiet(captainOf(b));
  assert.equal(b.c11a.clocks.length, 1);
  const k = b.c11a.clocks[0];
  assert.equal(k.n, 4 + 1 + 2, '4人 ＋ 船長 ＋ 2');
  assert.equal(startCount(b), 7);
  const holder = b.get(k.holder);
  assert.ok(holder?.side === 'ally');
  assert.ok(b.allies.every((a) => a.abilities[0] === TOKEI_NAGE || a.abilities.includes(TOKEI_NAGE)), '時計を投げる');
  // 名前の 横の しるし（がめんへ: 味方の pub）
  assert.equal(c11aAllyPub(holder, b).clock11, 7);
  assert.equal(c11aAllyPub(b.allies.find((a) => a !== holder), b).clock11, null, '持って いない 時は null（がめんの しるしが 消える）');
  // 1回 動くたびに 1 へる（だれでも）
  const other = b.allies.find((a) => a !== holder);
  nop(b, other);
  assert.equal(k.n, 6);
  foe(b, captainOf(b), 'm11p_brag');
  assert.equal(k.n, 5, '船長も 数える');
  // 0 に なると かまれる（防御で 半分）
  holder.hp = holder.maxHp = 10000;
  k.n = 1;
  const ev = nop(b, holder);
  assert.ok(ev.c11aBite && !ev.c11aBite.cap && ev.c11aBite.guard, JSON.stringify(ev.c11aBite));
  const cf = c11aConf(C11A_CAPTAIN, b);
  assert.equal(10000 - holder.hp, Math.round(10000 * cf.bite.ally * cf.bite.guardCut));
  assert.ok(allText(ev).includes('チクタクザメ'));
  assert.equal(k.holder, 'cap', '時計は 船長の 手に');
  assert.ok(!k.wound && k.aim, 'ねじを まき直すまで 数は へらない・つぎに 投げる 相手（前ぶれ）');
  const n0 = k.n;
  nop(b, other);
  assert.equal(k.n, n0);
  // 防御しないと 大きな ダメージ
  const b2 = battle();
  big(b2);
  const h2 = b2.get(holderOf(b2));
  h2.hp = h2.maxHp = 10000;
  b2.c11a.clocks[0].n = 1;
  act(b2, b2.allies.find((a) => a !== h2), { type: 'defend' });
  assert.equal(10000 - h2.hp, Math.round(10000 * cf.bite.ally));
});

test('時計を投げる: 持って いる 人だけ（番を 使う）・船長は 自分の 番に 投げ返す（前ぶれで きめた 相手。投げた 番は 数が へらない）・0 で 船長が かまれると 目を 回す（2回の 番・受ける ダメージが ふえる）', () => {
  const b = battle();
  big(b);
  const cap = captainOf(b);
  quiet(cap);
  const k = b.c11a.clocks[0];
  const holder = b.get(k.holder);
  const other = b.allies.find((a) => a !== holder);
  // 持って いない 人は 投げられない
  const ev0 = pass(b, other);
  assert.ok(ev0.c11aPass && !ev0.c11aPass.ok && allText(ev0).includes('持っていない'));
  assert.equal(k.holder, holder.id);
  // 投げる → 船長が 持つ（投げた 行動も 1 へる）
  k.n = 6;
  const ev = pass(b, holder);
  assert.ok(ev.c11aPass?.ok);
  assert.equal(k.holder, 'cap');
  assert.equal(k.n, 5);
  assert.ok(k.aim && b.get(k.aim)?.side === 'ally', 'つぎに 投げる 相手（前ぶれ）');
  assert.equal(c11aPub(cap, b).clocks11[0].aim, k.aim);
  // 船長の 番: 投げ返す（その 番は 数が へらない）
  const aim = k.aim;
  const evc = foe(b, cap);
  assert.ok(evc.c11aThrow && evc.c11aThrow.to === aim, JSON.stringify(evc.c11aThrow));
  assert.equal(k.holder, aim);
  assert.equal(k.n, 5, '投げた 番は へらない');
  // 船長が 持って いる 時に 0 → 船長が かまれる・目を 回す
  const h2 = b.get(k.holder);
  k.n = 1;
  const capHp = cap.hp;
  const ev2 = pass(b, h2);
  assert.ok(ev2.c11aBite?.cap, '投げて すぐ 0 … 船長が かまれる');
  assert.ok(cap.hp < capHp);
  const cf = c11aConf(C11A_CAPTAIN, b);
  assert.equal(b.c11a.dizzy, cf.bite.dizzy);
  assert.equal(k.holder, null, '時計は サメの 中');
  // ふだんは かたい（3わり）・目を 回して いる 間は ふつうより 多く
  const hitOnce = () => { const hp = cap.hp; act(b, b.allies[0], { type: 'attack', target: cap.id }); return hp - cap.hp; };
  const dz = hitOnce();
  // 目を 回して いる 船長の 番（2回）は 動けない。2回めに サメが 時計を はき出す
  const d1 = foe(b, cap);
  assert.ok(d1.c11aDizzy, '目を 回す');
  assert.equal(b.c11a.dizzy, 1);
  const d2 = foe(b, cap);
  assert.ok(d2.c11aDizzy && d2.c11aSpit, 'はき出す');
  assert.equal(k.holder, 'cap');
  assert.equal(b.c11a.dizzy, 0);
  const hard = hitOnce();
  assert.ok(hard < dz * 0.45, `かたい ${hard} / 目を 回す ${dz}`);
  assert.equal(cf.hard, 0.3);
  assert.equal(c11aTell(b), 'pirate');
});

test('いかり船長: いかりなげ（前ぶれ → 次の 番。時計を 持つ 人を ねらう ことが 多い・防御で ふせげる・当たると 番が おそく なる）・HP 半分で 時計が 2つ（ひとりは 1つ）・星のうたで 数が 止まる・勝つと にげる', () => {
  const b = battle();
  big(b);
  const cap = captainOf(b);
  quiet(cap);
  // 時計を 持たない 時の 船長の 番で 前ぶれ
  b.c11a.clocks[0].holder = b.allies[0].id;
  b.c11a.anchorLeft = 1;
  const ev = foe(b, cap);
  assert.ok(ev.c11aAnchorUp && b.c11a.anchorReady, JSON.stringify(ev.c11aAnchorUp));
  assert.equal(c11aTell(b), 'anchor');
  const t = b.get(b.c11a.anchorAim);
  nop(b, t);
  const hp0 = t.hp;
  const ev2 = foe(b, cap);
  assert.ok(ev2.c11aAnchor?.guard && t.hp === hp0, '防御で ふせげる');
  b.c11a.anchorLeft = 1;
  foe(b, cap);
  const t2 = b.get(b.c11a.anchorAim);
  t2.atb = 80;
  t2.defending = false;
  const ev3 = foe(b, cap);
  assert.ok(ev3.c11aAnchor && !ev3.c11aAnchor.guard && t2.atb === 0, `ゲージ ${t2.atb}`);
  // HP 半分 → 時計が 2つ（数が ちがう）
  cap.hp = Math.floor(cap.maxHp * 0.49);
  b.c11a.anchorReady = false;
  const ev4 = foe(b, cap);
  assert.ok(ev4.c11aTwo && b.c11a.clocks.length === 2);
  assert.ok(ev4.c11aThrow, '2つめを すぐ 投げる');
  const [k1, k2] = b.c11a.clocks;
  assert.notEqual(k1.n, k2.n);
  // ひとりは 1つの まま
  const solo = battle({ kinds: ['player'] });
  const sc = captainOf(solo);
  quiet(sc);
  sc.hp = Math.floor(sc.maxHp * 0.3);
  foe(solo, sc);
  assert.equal(solo.c11a.clocks.length, 1);
  assert.equal(startCount(solo), 1 + 1 + 2, 'ひとりでも 投げ返す ひまが ある');
  // 星のうた: 歌った 番と つぎの 1回は 数が へらない
  const b5 = battle();
  big(b5);
  quiet(captainOf(b5));
  const k5 = b5.c11a.clocks[0];
  k5.n = 5;
  b5.c9sp.song.charge = b5.c9sp.song.max;
  const sev = act(b5, b5.allies[0], { type: 'ability', id: SONG });
  assert.ok(sev.c11aSong && allText(sev).includes('止まった'));
  assert.equal(k5.n, 5);
  nop(b5, b5.allies[1]);
  assert.equal(k5.n, 5, 'つぎの 1回も へらない');
  nop(b5, b5.allies[2]);
  assert.equal(k5.n, 4);
  // 勝つと HP 1 で 止まり、サメに 追われて にげる（たおれない）
  const b6 = battle();
  const c6 = captainOf(b6);
  quiet(c6);
  c6.hp = 3;
  b6.c11a.dizzy = 2;
  const wev = act(b6, b6.allies[0], { type: 'attack', target: c6.id });
  assert.ok(b6.c11a.won && c6.hp === 1 && c6.alive, `HP ${c6.hp}`);
  assert.ok(allText(wev).includes('にげていった') && wev.c11aDown);
  assert.ok(b6.killed.includes(C11A_CAPTAIN), '経験値と 品は ふつう');
  assert.equal(c11aPub(c6, b6).c11Down, 1);
  assert.equal(c11aPub(c6, b6).pirateStage, 4);
});

test('いかり船長: 時計は えらんで いる 人に 来る（人が 2人 いじょうなら 同じ 人に つづけて 行きすぎない）・時計の 数は 人の 数まで・人が みんな たおれたら 自動の 仲間へ', () => {
  const half = (b) => {
    const cap = captainOf(b);
    quiet(cap);
    cap.hp = Math.floor(cap.maxHp * 0.49);
    foe(b, cap);
  };
  // 1人＋酒場3人: はじめの 時計は 人へ・HP 半分でも 時計は 1つ
  for (const seed of [1, 2, 3, 4, 5]) {
    const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false, seed });
    big(b);
    assert.equal(holderOf(b), b.allies[0].id, `seed ${seed}`);
    half(b);
    assert.equal(b.c11a.clocks.length, 1, '人が 1人 … 時計 1つ');
  }
  // 2人＋酒場2人: 時計は 2人の どちらかへ・HP 半分で 2つ（2人が 1つずつ）
  const b2 = battle({ kinds: ['player', 'player', 'support', 'support'], auto: false });
  big(b2);
  const hs = [b2.allies[0].id, b2.allies[1].id];
  assert.ok(hs.includes(holderOf(b2)));
  half(b2);
  assert.equal(b2.c11a.clocks.length, 2);
  for (const k of b2.c11a.clocks) if (k.holder) assert.ok(hs.includes(k.holder), '時計は 人へ');
  // 人が みんな たおれたら 自動の 仲間へ
  const b3 = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false, seed: 2 });
  big(b3);
  b3.c11a.clocks[0].holder = null;
  b3.allies[0].hp = 0;
  b3.allies[0].alive = false;
  const cap3 = captainOf(b3);
  quiet(cap3);
  b3.c11a.clocks[0].holder = cap3.id;
  for (let i = 0; i < 4 && b3.c11a.clocks[0].holder === cap3.id; i++) foe(b3, cap3);
  const h3 = b3.c11a.clocks[0].holder;
  assert.ok(h3 && h3 !== b3.allies[0].id, `${h3}`);
});

// ───────────── 自動の 仲間・知って いる 人の 読み ─────────────
test('自動の 仲間: 人が えらんで いる 時だけ、ちょうど よい 時の 3回に 1回 時計を 投げる（完全オートは 投げない）・知って いる 人は 行動ゲージで ちょうど よい 時を 読む', () => {
  const b = battle({ kinds: ['player', 'support', 'support', 'support'], auto: false });
  big(b);
  const cap = captainOf(b);
  quiet(cap);
  const sup = b.allies[1];
  const k = b.c11a.clocks[0];
  k.holder = sup.id;
  k.n = 1;
  assert.ok(throwGood(b, sup, k), 'あと 1 は いつでも よい');
  const picks = [0, 1, 2, 3, 4, 5].map(() => c11aPlan(b, sup, decideAlly, bestHit));
  assert.equal(picks.filter((p) => p?.id === TOKEI_NAGE).length, 6 / AUTO_EVERY, JSON.stringify(picks));
  // ちょうど よく ない（数が 多い）時は 投げない
  k.n = 30;
  assert.equal(throwGood(b, sup, k), false);
  for (let i = 0; i < 6; i++) assert.notEqual(c11aPlan(b, sup, decideAlly, bestHit)?.id, TOKEI_NAGE);
  // 完全オート（みんな オート）
  const fa = battle({ kinds: ['player', 'support', 'support', 'support'], auto: true });
  fa.c11a.clocks[0].holder = fa.allies[1].id;
  fa.c11a.clocks[0].n = 1;
  for (let i = 0; i < 6; i++) assert.equal(c11aPlan(fa, fa.allies[1], decideAlly, bestHit), null);
  fa.c11a.clocks[0].holder = fa.allies[0].id;
  assert.equal(c11aPlan(fa, fa.allies[0], decideAlly, bestHit), null, '家族の キャラの オートも 投げない');
  // 知って いる 人: 自分の 番が もう 1回 来る なら 待つ・来ないなら 投げる
  const kb = battle();
  big(kb);
  quiet(captainOf(kb));
  const me = kb.allies[0];
  for (const a of kb.allies) a.knows9 = 'know';
  const kk = kb.c11a.clocks[0];
  kk.holder = me.id;
  kk.n = 40;
  assert.ok(holdSafe(kb, me, kk));
  assert.notEqual(c11aPlan(kb, me, decideAlly, bestHit)?.id, TOKEI_NAGE, 'まだ 持つ');
  kk.n = 1;
  assert.equal(c11aPlan(kb, me, decideAlly, bestHit)?.id, TOKEI_NAGE, 'あと 1 … 投げる');
  // これから 動く じゅん（行動ゲージ）
  const ord = turnOrder(kb, me.id, 2);
  assert.equal(ord.length, (kb.allies.length + 1) * 2);
  assert.ok(ord.indexOf(me.id) > 0, '今 動いた 人は うしろ');
});

test('人数で 合わせる: 家族の キャラの 数で HP・与える ダメージ・時計の 数の はじまり・仲間なしの ひとりは solo（時計 1つ）・魔物の 仲間', () => {
  const hp = (id, kinds) => battle({ id, kinds }).enemies[0].maxHp;
  for (const id of Object.values(C11A_BATTLE)) {
    const sp = groupOf(id)[0];
    assert.equal(hp(id, ['player', 'player', 'player', 'player']), Math.round(MONSTERS[sp].hp * MONSTERS[sp].c11a.few.hp[3]), `${id}: 4人は few の 4人め`);
    assert.ok(hp(id, ['player', 'player', 'support', 'support']) < MONSTERS[sp].hp, `${id}: 2人`);
    assert.ok(hp(id, ['player']) < MONSTERS[sp].hp * 0.35, `${id}: ひとりだけ`);
    for (const k of ['hp', 'atk']) assert.equal(MONSTERS[sp].c11a.few[k].length, 5);
  }
  assert.equal(startCount(battle({ kinds: ['player', 'player', 'support', 'support'] })), 4 + 1 + 2);
  assert.equal(startCount(battle({ kinds: ['player', 'player'] })), 2 + 1 + MONSTERS[C11A_CAPTAIN].c11a.bare.plus[0], '仲間なしの 2人は bare');
  // 5人は 時計の ひまを 足さない（plus 0 … 人が 多いと 投げ合いが らく すぎる）
  const five = battle({ kinds: ['player', 'player', 'player', 'player', 'player'] });
  assert.equal(startCount(five), 5 + 1 + c11aConf(C11A_CAPTAIN, five).plus);
  assert.equal(c11aConf(C11A_CAPTAIN, five).plus, 0);
  assert.equal(c11aConf(C11A_CAPTAIN, battle({ kinds: ['player'] })).two, 0, 'ひとりは 時計 1つ');
  const mon = battle({ kinds: ['player', 'monster', 'monster', 'monster'] });
  assert.ok(captainOf(mon).maxHp < captainOf(battle({ kinds: ['player', 'player', 'support', 'support'] })).maxHp, '魔物の 仲間は 時計を 投げない ぶん やさしく');
  // ゲストの Lv の 上限（この 幕の 強さ）
  assert.equal(GUEST_MAX_LEVEL, 122); // 第102回 B班: 第3部 第3章 第2幕で 120 → 122
});

// ───────────── スピカの ごほうび ─────────────
test('人数で 合わせる: 仲間なしの 少ない パーティー（味方が みんな 家族の キャラで 2人・3人）は bare の 表が few より 先', () => {
  for (const sp of [C11A_HEAD, C11A_CAPTAIN]) {
    const bare = MONSTERS[sp].c11a.bare;
    assert.ok(bare && Array.isArray(bare.hp) && bare.hp.length === 2 && bare.atk.length === 2, sp);
    const id = sp === C11A_HEAD ? C11A_BATTLE.beast : C11A_BATTLE.pirate;
    for (const [n, kinds] of [[2, ['player', 'player']], [3, ['player', 'player', 'player']]]) {
      const b = battle({ id, kinds });
      const cf = c11aConf(sp, b);
      assert.equal(cf.bare, n, `${sp} ${n}人だけ`);
      assert.equal(cf.hp, bare.hp[n - 2]);
      assert.equal(cf.atk, bare.atk[n - 2]);
      assert.equal(b.enemies[0].maxHp, Math.round(MONSTERS[b.enemies[0].species].hp * bare.hp[n - 2]), 'HP に きく');
    }
    // 自動の 仲間が いる・4人・ひとり・魔物の 仲間 … bare は きかない（few か solo）
    for (const kinds of [['player', 'player', 'support', 'support'], ['player', 'player', 'player', 'support'], ['player', 'player', 'player', 'player'], ['player'], ['player', 'monster']]) {
      const b = battle({ id, kinds });
      const cf = c11aConf(sp, b);
      assert.equal(cf.bare, 0, kinds.join(','));
    }
    const two = c11aConf(sp, battle({ id, kinds: ['player', 'player', 'support', 'support'] }));
    assert.equal(two.hp, MONSTERS[sp].c11a.few.hp[1], '2人＋自動2 は few');
  }
});

test('スピカの ごほうび: この 幕の クリア（c11_act1）で 技「ながれ星」… ほのかな光 2回に 1回、いちばん HPが 多い 敵に 小さな ながれ星（前の 6つの ごほうびと 合わせて きく）', () => {
  const ALL7 = { ...ALL6, [C11A.act1]: true };
  const plain = battle({ enemies: ['c11a_crab', 'c11a_ram'], flags: ALL6 });
  const star = battle({ enemies: ['c11a_crab', 'c11a_ram'], flags: ALL7 });
  assert.ok(!plain.c11rew?.star);
  assert.ok(star.c11rew?.star);
  assert.deepEqual(star.c10rew, { heal: REWARD_HEAL, teruMax: REWARD_TERU, songMax: REWARD_SONG, teruFull: true, teruLit: REWARD_LIT, glowStart: true }, '前の 6つも きく');
  // はじめの ほのかな光（金の 音）が 1回め → つぎの ほのかな光で ながれ星
  assert.equal(star.c9sp.glows, 1);
  const crab = star.enemies[0];
  quiet(crab);
  quiet(star.enemies[1]);
  const hp0 = star.enemies.map((e) => e.hp);
  let ev = null;
  for (const a of star.allies) { ev = nop(star, a); }
  assert.equal(star.c9sp.glows, 2);
  assert.equal(STAR_EVERY, 2);
  const top = star.enemies.slice().sort((x, y) => hp0[star.enemies.indexOf(y)] - hp0[star.enemies.indexOf(x)])[0];
  assert.ok(ev.c9Spica?.star, 'ながれ星');
  assert.equal(ev.c9Spica.star.to, top.id, 'いちばん HPが 多い 敵');
  assert.equal(ev.c9Spica.star.dmg, Math.round(top.maxHp * STAR_RATE));
  assert.ok(allText(ev).includes('ながれ星'));
  // ボスの しかけ（船長は かたい）も きく
  const pb = battle({ flags: ALL7 });
  const cap = captainOf(pb);
  quiet(cap);
  big(pb);
  pb.c9sp.stars = 1;
  let pev = null;
  for (let i = 0; i < 2 && !pev?.c9Spica?.star; i++) for (const a of pb.allies) { pev = nop(pb, a); if (pev?.c9Spica?.star) break; }
  assert.ok(pev?.c9Spica?.star);
  assert.ok(pev.c9Spica.star.dmg <= Math.round(Math.min(cap.maxHp * STAR_RATE, 1600) * 0.3) + 1, '船長は かたい');
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（2秒・5秒）で 知って いる 人は 勝てる・知らない 人と 完全オート（作戦ごと）は 勝ちにくい（少しの 回数）', { timeout: 2400000 }, () => {
  assert.deepEqual(CH11A_LV, { beast: 119, pirate: 120 });
  assert.deepEqual(ORDER_FLAGS.c11a.pirate, CH10_NOTES);
  for (const key of ['beast', 'pirate']) {
    for (const react of [2000, 5000]) {
      const know = [1, 2, 3, 4].map((s) => ch9Run(key, LV9[key], 'know', 9090 + s * 7919, { react, flags: ORDER_FLAGS.c11a[key] }));
      const w = know.filter((r) => r.outcome === 'win');
      assert.ok(w.length >= 2, `${key} ${react}: 知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
      const sec = w.reduce((s, r) => s + r.seconds, 0) / w.length;
      assert.ok(sec <= 660, `${key} ${react}: 長さ ${sec}秒`);
    }
    for (const [job, kit] of Object.entries(CH9_KIT[key])) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  }
  for (const tactics of AUTO_TACTICS) {
    const auto = [1, 2].map((s) => ch9Run('pirate', LV9.pirate, 'auto', 9090 + s * 7919, { flags: ORDER_FLAGS.c11a.pirate, tactics }));
    assert.equal(auto.filter((r) => r.outcome === 'win').length, 0, `船長: 完全オート（${TACTICS[tactics].name}）`);
  }
  const blind = [1, 2, 3, 4].map((s) => ch9Run('pirate', LV9.pirate, 'blind', 9090 + s * 7919, { flags: ORDER_FLAGS.c11a.pirate }));
  assert.ok(blind.filter((r) => r.outcome === 'win').length <= 1, '船長: 知らない 人');
  // ひとりの 完全オートは 時計を 投げない ので 勝てない
  const soloAuto = [1, 2].map((s) => ch9Run('pirate', LV9.pirate, 'auto', 9090 + s * 7919, { party: 'solo', flags: ORDER_FLAGS.c11a.pirate }));
  assert.equal(soloAuto.filter((r) => r.outcome === 'win').length, 0);
});

// ───────────── 品 ─────────────
test('品: 宝箱 8こ（★5 は 3つ k 2.42〜2.46・のこりは 素材か 道具）・とまり木の島の 店（防具 5つ k 2.32〜2.34）・ボスの 品・だいじな 物（中みの ない 星図・星の船）・武器は 作らない', () => {
  // k は 前の 幕から 同じ はばで 上げる（★5 2.38〜2.42 → 2.42〜2.46・店 2.28〜2.30 → 2.32〜2.34）
  const step = C10D_SHOP_K.lo - C10C_SHOP_K.lo;
  assert.ok(Math.abs(C11A_SHOP_K.lo - C10D_SHOP_K.lo - step) < 1e-9 && Math.abs(C11A_SHOP_K.hi - C10D_SHOP_K.hi - step) < 1e-9);
  assert.ok(Math.abs(Math.min(...Object.values(C11A_K)) - Math.max(...Object.values(C10D_K))) < 1e-9);
  assert.deepEqual(Object.values(C11A_K), [2.42, 2.44, 2.46]);
  assert.equal(C11A_GEAR_CHESTS.length, 3);
  for (const id of C11A_CHEST_IDS_B) {
    const c = c11aChest(id);
    assert.ok(c && ITEMS[c.item], id);
    const it = ITEMS[c.item];
    if (C11A_GEAR_CHESTS.includes(id)) {
      assert.ok(['armor', 'shield', 'head'].includes(it.type) && it.rarity === 4 && it.src === 'c11a', id);
      assert.equal(rareWhereText(c.item), '星の海の宝箱でしか手に入らない');
    } else assert.ok(it.type !== 'weapon' && !['armor', 'shield', 'head', 'acc'].includes(it.type), `${id}: 素材か 道具`);
  }
  assert.equal(c11aChest('nope'), null);
  for (const id of C11A_PERCH_ARMS) {
    const it = ITEMS[id];
    assert.ok(it && it.price > 0 && it.rarity === 0 && it.rank === 10 && ['armor', 'shield', 'head'].includes(it.type), id);
  }
  assert.equal(C11A_PERCH_ARMS.length, 5);
  for (const id of C11A_PERCH_TOOLS) assert.ok(ITEMS[id]?.price > 0, id);
  for (const it of Object.values(ITEMS_C11A)) assert.notEqual(it.type, 'weapon', '武器は 作らない');
  for (const id of Object.keys(ITEMS_C11A)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id} の 読みがな`); }
  // ボスの 品（1人 1つ・よい 力の 合計は 287 まで）
  assert.deepEqual(C11A_DROPS, { [C11A_HEAD]: ['c11ab_star_collar'], [C11A_CAPTAIN]: ['c11ab_anchor_badge'] });
  for (const [sp, [id]] of Object.entries(C11A_DROPS)) {
    const it = ITEMS[id];
    assert.ok(it.unique && it.type === 'acc' && it.src === 'pastboss' && it.boss === sp, id);
    assert.ok(Object.values(it.bonus).reduce((s, v) => s + v, 0) <= 287, id);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'boss' && d.item === id));
    assert.ok(!it.resist?.water, '水に 強い 装備は 作らない');
  }
  for (const id of [STAR_CHART, STAR_SHIP]) assert.equal(ITEMS[id].type, 'key', id);
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 船長は 3だん・中ボスは 2だん（17-4 の 文）・言う 人は ノクト', () => {
  assert.equal(C11A_HINT_WHO, 'ノクト');
  assert.equal(C11A_BOSS_HINTS[C11A_BATTLE.pirate].length, 3);
  assert.equal(C11A_BOSS_HINTS[C11A_BATTLE.beast].length, 2);
  assert.deepEqual(C11A_BOSS_HINTS[C11A_BATTLE.pirate], [
    'あの時計が0になった時、持っているやつが、かまれるぞ。',
    '「時計を投げる」で、船長に投げ返せ。早すぎると、また投げ返される。',
    '数が1か2になるまで、がまんしろ。船長が目を回したら、いっせいにこうげきだ。',
  ]);
  for (const id of Object.values(C11A_BATTLE)) {
    assert.deepEqual(BOSS_HINTS[id], C11A_BOSS_HINTS[id]);
    assert.equal(BOSS_HINT_WHO[id], 'ノクト');
    for (const t of C11A_BOSS_HINTS[id]) assert.ok(t.length <= 44, t);
  }
});

// ───────────── 絵・背景 ─────────────
test('絵: 新しい 絵（ほうきぼしウオ・ほしつなぎ）・星座のけもの 3つと 船長は 2倍の こまかさ（コマ 2・3 … 光が 弱い・にげる）・背景 3つ', () => {
  for (const sp of [...C11A_NEW_ART, ...C11A_STARS, C11A_CAPTAIN]) {
    const a = MONSTER_ART[sp];
    assert.ok(a?.draw && a.pal?.length, sp);
    assert.ok(monsterSize(sp)[0] > 0);
  }
  for (const sp of [...C11A_STARS, C11A_CAPTAIN]) {
    assert.equal(MONSTERS[sp].artScale, 0.5, sp);
    assert.ok(monsterFine(sp) > 1, sp);
  }
  // 色を 決まった パレットだけで かく（コマ 0〜3 を にせの g で 回して こわれない）
  const g = { w: 96, h: 96 };
  for (const k of ['ell', 'rect', 'poly', 'line']) g[k] = () => {};
  for (const sp of [...C11A_NEW_ART, ...C11A_STARS, C11A_CAPTAIN]) for (let f = 0; f < 4; f++) MONSTER_ART[sp].draw({ ...g, w: MONSTER_ART[sp].size[0], h: MONSTER_ART[sp].size[1] }, f);
  for (const id of ['c11a_deck', 'c11a_isle', 'c11a_gate']) {
    assert.ok(C11A_BG[id] && battleBgSpec(id)?.deco === id, id);
  }
  assert.equal(FIXED_C11A[C11A_BATTLE.beast].bg, 'c11a_isle');
  assert.equal(FIXED_C11A[C11A_BATTLE.pirate].bg, 'c11a_gate');
});

test('もとの お話の 名前・絵・せりふを 使わない（ピーター・パンの 海ぞくの 船長と ワニ … かぎの 手・ワニ は 出さない）', () => {
  const BAD = ['フック', 'ピーター', 'ワニ', 'わに', 'スミー', 'ネバーランド', 'ティンカー', 'かぎの手', 'かぎづめ', 'チクタクワニ', 'ホック', 'Hook', 'Peter'];
  const files = ['public/js/shared/data/monsters-c11a.js', 'public/js/shared/data/abilities-c11a.js', 'public/js/shared/data/items-c11a.js', 'public/js/shared/data/boss-hints-c11a.js',
    'public/js/shared/data/companions-c11a.js', 'public/js/shared/battle-c11a.js', 'public/js/client/battle-c11a.js'];
  // ゲームに 出る 文（コメントは のぞく）
  for (const f of files) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    for (const w of BAD) assert.ok(!src.includes(w), `${f}: ${w}`);
  }
  const texts = [CAPTAIN_NAME, SHARK_NAME, ...Object.values(C11A_ABILITIES).flatMap((a) => [a.name, a.cast, a.desc]), ...Object.values(MONSTERS_C11A).flatMap((m) => [m.name, m.desc]), ...Object.values(ITEMS_C11A).flatMap((i) => [i.name, i.desc])];
  for (const t of texts) for (const w of BAD) assert.ok(!String(t).includes(w), `${t}: ${w}`);
  // 手は いかり・サメ・えらそうで こわがり
  assert.ok(MONSTERS[C11A_CAPTAIN].desc.includes('いかり') && MONSTERS[C11A_CAPTAIN].desc.includes('苦手'));
  assert.ok(SHARK_NAME.includes('ザメ'));
});

// ───────────── がめん ─────────────
test('がめん: 大きな 知らせは 1つずつ（前の 知らせを 消す・はばに おさめて 折り返す … スマホで 2つ かさなった）', () => {
  const removed = [];
  const shown = [];
  const olds = [{ remove: () => removed.push(1) }, { remove: () => removed.push(2) }];
  const scene = { stage: { querySelectorAll: (q) => (q === '.b-banner' ? olds.splice(0) : []) }, banner(t, c) { shown.push([t, c]); } };
  c11aBannerOne(scene);
  c11aBannerOne(scene);
  scene.banner('ガブッ！', 'combo');
  assert.deepEqual(removed, [1, 2], '前の 知らせを 消す');
  assert.equal(shown.length, 1);
  assert.ok(shown[0][1].includes('combo') && shown[0][1].includes('c11a-bn'), shown[0][1]);
  const src = readFileSync(new URL('../public/js/client/battle-c11a.js', import.meta.url), 'utf8');
  assert.ok(/\.b-banner\.c11a-bn \{ white-space: normal; width: 94%/.test(src), '折り返す');
});

test('本物の 流れ（tools/real-boss.mjs）: けもの・船長も 回る（かんたんな 人 … 時計を投げる・前ぶれで 防御・回復・強い こうげき）', { timeout: 600000 }, async () => {
  const { realRun } = await import('../tools/real-boss.mjs');
  const prev = process.env.HUMAN;
  process.env.HUMAN = 'easy';
  try {
    const r = await realRun('beast', 'k1fam', 9090);
    assert.ok(['win', 'lose'].includes(r.outcome), r.outcome);
    assert.equal(r.rej, 0, 'はねかえされた コマンドが ない');
    const p = await realRun('pirate', 'p2', 9090);
    assert.ok(['win', 'lose'].includes(p.outcome) && p.rej === 0);
    assert.ok((p.sent[TOKEI_NAGE] || 0) >= 1, JSON.stringify(p.sent));
  } finally {
    if (prev === undefined) delete process.env.HUMAN; else process.env.HUMAN = prev;
  }
});

test('がめん: 上の まど（大きく「チク・タク　あと ○」・持って いる 人・目を 回して いる・いかりなげ・星の ようす）・仲間の まどの 時計の しるし・バナー・コマンド「時計を投げる」・コマンドの 行き先・曲の ピンチ', () => {
  for (const id of C11A_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  const allies = [{ id: 'a0', name: 'タロウ', alive: true, clock11: 2 }, { id: 'a1', name: 'ハナ', alive: true }];
  const cap = { id: 'e0', species: C11A_CAPTAIN, alive: true, c11Kind: 'pirate', clocks11: [{ no: 0, n: 2, holder: 'a0', wound: true, aim: null }], dizzy11: 0, anchor11: 0 };
  const t1 = c11aHtml([cap], allies, 'a0');
  assert.ok(t1.html.includes('チク・タク　あと2') && t1.html.includes('あなたが持っている') && t1.html.includes('hot') && t1.cls.includes('warn'), t1.html);
  const t2 = c11aHtml([cap], allies, 'a1');
  assert.ok(t2.html.includes('タロウが持っている'), t2.html);
  const t3 = c11aHtml([{ ...cap, clocks11: [{ no: 0, n: 7, holder: 'cap', wound: false, aim: 'a1' }], dizzy11: 1 }], allies, 'a0');
  assert.ok(t3.html.includes('つぎは ハナに') && t3.html.includes('目を回している') && t3.cls.includes('good'), t3.html);
  assert.ok(c11aHtml([{ ...cap, anchor11: 1, anchorAim11: 'a0', clocks11: [] }], allies, 'a0').html.includes('いかりなげ'));
  assert.ok(c11aHtml([{ ...cap, c11Down: 1 }], allies).html.includes('にげていった'));
  const st = (role, o = {}) => ({ id: role, species: { head: C11A_HEAD, chest: C11A_CHEST, tail: C11A_TAIL }[role], alive: true, c11Kind: 'beast', role11: role, dead11: 0, revive11: 0, ...o });
  const tb = c11aHtml([st('head'), st('chest'), st('tail', { alive: false, dead11: 1, revive11: 1 })], allies, 'a0');
  assert.ok(tb.html.includes('しっぽ') && tb.html.includes('よみがえるまであと1') && tb.html.includes('また光りはじめた'), tb.html);
  assert.ok(c11aHtml([st('head', { roar11: 1, roarAim11: 'a0' }), st('chest'), st('tail')], allies, 'a0').html.includes('あなたに来る'));
  assert.equal(c11aHtml([], allies).html, '');
  // え: 勝つと にげる え（コマ 2・3。消えない）
  const down = { species: C11A_CAPTAIN, alive: true, c11Down: 1, dead: 1 };
  try { c11aSprite(down, 0); } catch { /* え を かく ところは ブラウザだけ */ }
  assert.equal(down.dead, -1);
  assert.equal(c11aSprite({ species: C11A_CAPTAIN, alive: true }, 0), null);
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  const scene = { time: 0, enemies: () => [cap], allies: () => allies };
  for (const c of [cap, { ...cap, dizzy11: 1 }, { ...cap, anchor11: 1 }, st('head', { roar11: 1 }), { ...cap, c11Down: 1 }]) c11aDraw(scene, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const sc2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, myActor: { id: 'a0' } };
  for (const e of [{ c11aBite: { cap: true } }, { c11aBite: { cap: false } }, { c11aThrow: { to: 'a0', n: 6 } }, { c11aPass: { ok: true, id: 'a0' } }, { c11aTwo: {} }, { c11aAnchorUp: {} }, { c11aSong: {} }, { c11aRoar: {} }, { c11aWarn: {} }, { c11aRevive: {} }, { c11aDown: { id: 'e0' } }]) c11aPresent(sc2, e);
  for (const w of ['船長にかみついた', 'かまれた', 'あなたに投げられた', '投げ返した', '2つ', 'いかりなげ', '止まった', 'かみつき', '光りはじめた', 'よみがえった', 'にげていった']) assert.ok(banners.some((t) => t.includes(w)), w);
  // 仲間の まど: 時計を 持って いる 人の 名前の 横に しるし
  const kids = [];
  const parent = { querySelector: () => kids[0] || null };
  const name = { parentNode: parent, after: (el) => kids.push(el) };
  const fakeDoc = globalThis.document;
  globalThis.document = { createElement: () => ({ className: '', classList: { toggle(c, on) { this[c] = on; } }, remove() { kids.length = 0; } }), getElementById: () => true, head: { append() {} } };
  try {
    c11aStatus({ name }, { alive: true, clock11: 2 });
    assert.equal(kids[0].textContent, '時計2');
    assert.equal(kids[0].classList.hot, true);
    c11aStatus({ name }, { alive: true });
    assert.equal(kids.length, 0);
  } finally {
    globalThis.document = fakeDoc;
  }
  // コマンド「時計を投げる」（持って いる 人だけ。いちばん 上・1回で 決定）
  const me = { id: 'a0', name: 'タロウ', abilities: [TERU, TOKEI_NAGE] };
  const ci = c11aCmdItems({ enemies: () => [cap], allies: () => allies }, me);
  assert.ok(ci.items[0].html.includes('時計を投げる') && ci.items[0].html.includes('あと2') && ci.items[0].value === C11A_CMD_B, JSON.stringify(ci.items));
  assert.ok(ci.info.includes('あと2'));
  assert.equal(c11aCmdItems({ enemies: () => [cap], allies: () => allies }, { id: 'a1', abilities: [TOKEI_NAGE] }).items.length, 0, '持って いない 人には 出ない');
  const c9 = c9bCmdItems({ enemies: () => [cap], allies: () => allies, c9spica: null }, me);
  assert.equal(c9.items[0].value, 'c11apass', 'いちばん 上');
  const sent = [];
  assert.equal(c11aCmdPick({ send: (m) => sent.push(m) }, me, 'c11apass'), true);
  assert.deepEqual(sent, [{ type: 'ability', id: TOKEI_NAGE }]);
  assert.equal(c11aCmdPick({ send: (m) => sent.push(m) }, me, 'c10dring'), false);
  assert.ok(ABILITIES[TOKEI_NAGE].cmdOnly && ABILITIES[TOKEI_NAGE].noAuto, '特技の 一覧には 出さない');
  // コマンドの 行き先（battle.js → c8r → c9a → c9b → c11a）: 第2幕・前の 幕の 不具合を くりかえさない
  const route = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.ok(/case 'c11apass':[^\n]*return c8rCmdPick\(this, a, it\.value\)/.test(route), 'battle.js の 行き先');
  for (const f of ['battle-c8r.js', 'battle-c9a.js']) {
    const src = readFileSync(new URL(`../public/js/client/${f}`, import.meta.url), 'utf8');
    assert.ok(src.includes("value === 'c11apass'"), f);
  }
  assert.ok(readFileSync(new URL('../public/js/client/battle-c9b.js', import.meta.url), 'utf8').includes("if (value === 'c11apass') return c11aCmdPick(scene, a, value);"));
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音・味方の 足もとの 光
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C11A_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC11aFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC11aFx(fx, a, [], null, {}), true, `${a}: 的が ない 時も`);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C11A_SCREEN_ANIMS, ...Object.keys(C11A_ALLY_FX), ...Object.keys(C11A_SFX)]) assert.ok(anims.includes(a), a);
  for (const [kk, v] of Object.entries(C11A_ALLY_FX)) assert.equal(CH4_ALLY_FX[kk], v, kk);
  assert.equal(allyAnimFor('c11a_pass', TOKEI_NAGE), 'buff');
  for (const a of Object.values(C11A_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
  // 曲（F班の 船長の 曲）: 味方が 持って いる 時計が 2 いかの 時も ピンチと おなじ きざみ
  assert.equal(clockPinch([{ side: 'ally', alive: true, clock11: 2, hp: 100, maxHp: 100 }]), true);
  assert.equal(clockPinch([{ side: 'ally', alive: true, clock11: 3, hp: 100, maxHp: 100 }]), false);
  const sent2 = [];
  const sa = new SceneAudio({ music: { id: 'c11a_pirate' }, setPinch: (v) => sent2.push(v), setPhase() {}, setTimeOfDay() {}, stopAmbience() {}, playAmbience() {} }, { tracks: {} });
  sa.battleTick({ combatants: [{ side: 'ally', alive: true, hp: 100, maxHp: 100, clock11: 5 }], boss: true });
  sa.battleTick({ combatants: [{ side: 'ally', alive: true, hp: 100, maxHp: 100, clock11: 1 }], boss: true });
  assert.deepEqual(sent2, [false, true]);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c11a.js', 'public/js/shared/data/abilities-c11a.js',
    'public/js/shared/data/encounters-c11a.js', 'public/js/shared/data/companions-c11a.js', 'public/js/shared/data/items-c11a.js', 'public/js/shared/data/boss-hints-c11a.js',
    'public/js/shared/battle-c11a.js', 'public/js/client/battle-c11a.js', 'public/js/client/render/c11a-art.js', 'public/js/client/render/c11a-bg.js', 'public/js/client/render/battlefx-c11a.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
void DIZZY; void ANCHOR; void FANG;
