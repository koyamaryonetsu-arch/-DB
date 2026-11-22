// 第93回 B班: 第3部 第1章 第4幕「星のはかば」の 戦いと 品（docs/plan-part3-c9d.md の 12-3・12-4）
// 名前の 約束・ふつうの 魔物 5しゅ（ふたご・暗い 所の しるしの 魔物）・スピカの 星のうた・あそびたい魔人 ムウ（分かれる・ばたんきゅう・起こす・
// 仲間はずれ・おかしビーム・いっしょに ドーン・すわりこむ）・自動の 仲間・人数で 合わせる・強さ（人が できる 動き）・前ぶれの 長さ・
// ふつうの 戦いの 長さ・品・ヒント・絵・背景・がめん・えんしゅつ・曲の だん・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
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
import { C9D, C9D_ACT3, C9D_ECHOES, C9D_MAP, C9D_BATTLE, C9D_MON_PREFIX, C9D_BOSS_MON, C9D_TABLE, C9D_CHEST_IDS, C9D_TRACKS } from '../public/js/shared/maps/c9d-flags.js';
import { MONSTERS_C9D, C9D_MINIONS, C9D_LANE_MON, C9D_DARK_MON, C9D_RECOLOR_BASE, C9D_NEW_ART, C9D_MU, C9D_MUMU, C9D_TWIN, C9D_KAGE, C9D_MAT_DROPS } from '../public/js/shared/data/monsters-c9d.js';
import { C9D_ABILITIES, SONG } from '../public/js/shared/data/abilities-c9d.js';
import { FRIENDS_C9D } from '../public/js/shared/data/companions-c9d.js';
import { ENCOUNTERS_C9D, FIXED_C9D, ZONE_BG_C9D } from '../public/js/shared/data/encounters-c9d.js';
import { ITEMS_C9D, C9D_TREASURE, C9D_K, C9D_GEAR_CHESTS, C9D_DROPS, c9dChest } from '../public/js/shared/data/items-c9d.js';
import { C9D_BOSS_HINTS, C9D_HINT_WHO } from '../public/js/shared/data/boss-hints-c9d.js';
import {
  muOf, mumuOf, muConf, c9dTurnStart, c9dEffect, c9dPub, c9dPlan, peopleOf9d, songOf, okashiOf, setOkashi,
  SPLIT, WAKE, BEAMUP, BEAM, DOONUP, DOON, SONG_MAX, SONG_HEAL, AUTO_EVERY, BAD_STATUS,
} from '../public/js/shared/battle-c9d.js';
import { TERU } from '../public/js/shared/battle-c9b.js';
import { c9aPlan, bestHit, c9aAfter } from '../public/js/shared/battle-c9a.js';
import { ch9Run, ch9Party, LV9, CH9_KIT } from '../tools/sim-ch9.mjs';
import { tableLength } from '../tools/sim-ch9-field.mjs';
import { MONSTER_ART, monsterSize, monsterFine } from '../public/js/client/render/monsters.js';
import { playC9dFx } from '../public/js/client/render/battlefx-c9d.js';
import { playC8cFx } from '../public/js/client/render/battlefx-c8c.js';
import { battleBgSpec } from '../public/js/client/render/battlefx.js';
import { allyAnimFor } from '../public/js/client/render/battlefx-r27.js';
import { C9D_SCREEN_ANIMS, C9D_ALLY_FX, C9D_SFX, C9D_OWN_TELE, c9dDraw, c9dPresent, c9dSprite, c9dCmdItems, c9dCmdPick, muHtml, songText } from '../public/js/client/battle-c9d.js';
import { c9aCmdItems } from '../public/js/client/battle-c9a.js';
import { CH4_ALLY_FX } from '../public/js/client/battle-ch4.js';
import { CH6_OWN_TELE } from '../public/js/client/battle-ch6.js';
import { FORM_KEYS0 } from '../public/js/client/audio-scene.js';
import { C9D_TRACKS as AUDIO_C9D } from '../public/js/client/audio-c9d.js';
import { firstSentence } from '../public/js/client/ui/skillinfo.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const ev0 = () => ({ lines: [], upd: [], results: [] });
const groupOf = (id) => FIXED_ENCOUNTERS[id].group.flatMap(([sp, n]) => Array(n).fill(sp));
// kinds … 味方の 種類（'player' 家族の キャラ・'support' 酒場の 人・'monster' 魔物の 仲間）
function battle({ kinds = ['player', 'player', 'player', 'player'], seed = 3, flags = { c9_child: true, c9_act1: true, c9_song1: true }, enemies = null } = {}) {
  const four = ch9Party('mu', LV9.mu);
  const allies = kinds.map((k, i) => ({ char: structuredClone(four[i % 4]), kind: k, controller: k === 'player' ? 'sim' : null, auto: true, tactics: 'balanced' }));
  return new Battle({ rng: makeRng(seed), boss: !enemies, canFlee: !!enemies, allies, enemies: enemies || groupOf(C9D_BATTLE.mu), hooks: { leaderFlag: (f) => !!flags[f] } });
}
const act = (b, a, cmd) => {
  b.queue.push({ id: a.id, cmd, last: true });
  a.queued = true;
  b.executeNext();
  return b.flush().filter((e) => e.t === 'act').pop();
};
const eff = (b, c, id) => { const ev = ev0(); assert.ok(c9dEffect(b, c, ABILITIES[id], ABILITIES[id].effect, ev), id); return ev; };
// ボスの 番を 1回（前ぶれ → その 技）。ふつうの 技の ときは tg に その id
function bossAct(b, c) {
  const ev = ev0();
  c9dTurnStart(b, c, ev, false);
  const tg = c.telegraph;
  if (tg) {
    c.telegraph = null;
    if (/^c9m/.test(ABILITIES[tg].effect.type)) Object.assign(ev, eff(b, c, tg), { tg });
    else ev.tg = tg;
  }
  return ev;
}
// 分かれた あとの 戦い
function splitBattle(opts) {
  const b = battle(opts);
  const m = muOf(b);
  m.hp = Math.round(m.maxHp * 0.7);
  assert.equal(bossAct(b, m).tg, SPLIT);
  return b;
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（12-4）: フラグ・ひびきの石・マップ・決まった 戦い c9d_mu・魔物の id・出る 表・宝箱・曲', () => {
  assert.deepEqual(Object.values(C9D), ['c9_song1', 'c9_door', 'c9_g2', 'c9_grave', 'c9_mu', 'c9_hollow', 'c9_act4']);
  assert.equal(C9D_ACT3, 'c9_act3');
  assert.deepEqual(C9D_ECHOES, ['c9_echo1', 'c9_echo2', 'c9_echo3', 'c9_echo4', 'c9_echo5']);
  assert.deepEqual(C9D_MAP, { g1: 'c9d_g1', g2: 'c9d_g2', grave: 'c9d_grave' });
  assert.deepEqual(C9D_BATTLE, { mu: 'c9d_mu' });
  assert.deepEqual(C9D_BOSS_MON, { mu: 'c9d_mu', mumu: 'c9d_mumu' });
  assert.equal(C9D_MU, C9D_BOSS_MON.mu);
  assert.equal(C9D_MUMU, C9D_BOSS_MON.mumu);
  assert.deepEqual(C9D_TABLE, { lane: 't9d_lane', lane2: 't9d_lane2' });
  assert.deepEqual(Object.keys(ENCOUNTERS_C9D), ['t9d_lane', 't9d_lane2']);
  for (const t of Object.keys(ENCOUNTERS_C9D)) { assert.ok(ENCOUNTER_TABLES[t], t); assert.ok(ZONE_BG[t], t); }
  const f = FIXED_ENCOUNTERS[C9D_BATTLE.mu];
  assert.ok(f && f.boss && f.canFlee === false);
  assert.equal(FIXED_C9D.c9d_mu, f);
  assert.equal(f.bgm, 'c9d_mu');
  assert.equal(f.bg, 'c9d_grave');
  for (const sp of Object.keys(MONSTERS_C9D)) assert.ok(sp.startsWith(C9D_MON_PREFIX), sp);
  assert.deepEqual(C9D_CHEST_IDS, ['c9d_c1', 'c9d_c2', 'c9d_c3', 'c9d_c4', 'c9d_c5', 'c9d_c6', 'c9d_c7', 'c9d_c8']);
  assert.deepEqual(Object.keys(C9D_TREASURE), C9D_CHEST_IDS);
  assert.deepEqual(Object.values(C9D_TRACKS), ['c9d_lane', 'c9d_grave', 'c9d_mu', 'c9d_song', 'c9d_end']);
  // F班の 曲が ある・muStage は 0 から 数える だん（audio-scene.js の addFormKey0）
  assert.ok(AUDIO_C9D.c9d_mu, '魔人の 曲');
  assert.ok(FORM_KEYS0.includes('muStage'));
  // もとの 作品の 名前・せりふは 使わない
  const text = JSON.stringify([MONSTERS_C9D, C9D_ABILITIES, ITEMS_C9D, C9D_BOSS_HINTS]);
  for (const w of ['ブウ', 'ブー', 'ドラゴンボール', 'チョコに', 'バビディ', 'カッチン', 'サタン']) assert.ok(!text.includes(w), w);
});

// ───────────── ふつうの 魔物 5しゅ ─────────────
test('ふつうの 魔物 5しゅ: 仲間に なる・今の 素材・出る 表・ランク・今 ある 系統・Lv102〜103・ふたごは 2ひき 1組・暗い 所の しるしの 魔物（darkOnly・見えにくい）・新しい 絵は 3しゅまで', () => {
  assert.equal(C9D_MINIONS.length, 5);
  assert.equal(C9D_LANE_MON.length, 4);
  assert.deepEqual(C9D_DARK_MON, [C9D_KAGE]);
  const races = new Set(Object.entries(MONSTERS).filter(([id, m]) => !m.boss && !MONSTERS_C9D[id]).map(([, m]) => m.race));
  const names = Object.entries(MONSTERS).filter(([id]) => !MONSTERS_C9D[id]).map(([, m]) => m.name);
  const mats = new Set(Object.entries(MAT_DROPS).filter(([sp]) => !MONSTERS_C9D[sp]).map(([, d]) => d[0]));
  for (const sp of C9D_MINIONS) {
    const m = MONSTERS[sp];
    assert.ok(m && !m.boss && m.region === 6, sp);
    assert.ok(m.lv >= 102 && m.lv <= 103, `${sp}: Lv${m.lv}`);
    assert.ok(races.has(m.race), `${sp}: 今 ある 系統`);
    assert.ok(MONSTER_FRIENDS[sp] && FRIENDS_C9D[sp], `${sp}: 仲間に なる`);
    assert.ok(FRIENDS_C9D[sp].rate >= 1 / 26 && FRIENDS_C9D[sp].rate <= 1 / 10, sp);
    assert.deepEqual(MAT_DROPS[sp], C9D_MAT_DROPS[sp]);
    assert.ok(mats.has(MAT_DROPS[sp][0]) && ITEMS[MAT_DROPS[sp][0]]?.type === 'mat', `${sp}: 今の 素材`);
    assert.ok(MONSTER_RANKS[sp], `${sp}: ランクの 表`);
    assert.ok(!names.includes(m.name), `${sp}: 名前が かぶらない`);
    assert.ok(m.desc && m.desc.length < 80, sp);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    for (const [, id] of FRIENDS_C9D[sp].learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(Object.values(ENCOUNTERS_C9D).some((t) => t.some((e) => e.group.some((g) => g[0] === sp))), `${sp}: 出る 表`);
    assert.ok(FRIENDS_C9D[sp].mix?.length, sp);
  }
  // ふたご: 出る ときは かならず 2ひき
  for (const t of Object.values(ENCOUNTERS_C9D)) for (const e of t) for (const [sp, lo, hi] of e.group) if (sp === C9D_TWIN) assert.deepEqual([lo, hi], [2, 2]);
  // 暗い 所の しるしの 魔物
  assert.equal(MONSTERS[C9D_KAGE].darkOnly, true);
  assert.equal(MONSTERS[C9D_KAGE].lv, 103);
  assert.ok(MONSTERS[C9D_KAGE].c9b?.hide > 0, 'スピカの てらすで 消える 見えにくさ');
  // 系統配合の 子には ならない（はじめの ころの けものの 配合に まざらない。まぜ配合の 子には なる）
  assert.deepEqual(C9D_MINIONS.filter((sp) => !FRIENDS_C9D[sp].noFamily), []);
  // 経験値と お金は 第3幕より 多い（ふたごは 2ひきで）
  for (const sp of C9D_MINIONS) {
    const k = sp === C9D_TWIN ? 2 : 1;
    assert.ok(MONSTERS[sp].exp * k > MONSTERS.c9c_bat.exp && MONSTERS[sp].gold * k > MONSTERS.c9c_bat.gold, sp);
  }
});

test('ふつうの 戦いの 長さ: 勇者 Lv102 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 90秒 いない（ふたごの道 1階・2階）', { timeout: 600000 }, () => {
  for (const t of Object.keys(ENCOUNTERS_C9D)) {
    const r = tableLength(t, 16);
    assert.equal(r.win, 1, t);
    assert.ok(r.avg <= 90, `${t}: ${r.avg}秒`);
  }
});

// ───────────── スピカの 星のうた ─────────────
test('スピカの 星のうた: リーダーが c9_song1・5回の 番で たまる（てらすとは べつ）・悪い 状態を なおし 最大HPの 1わり 回復・オートは 使わない', () => {
  // c9_song1 が なければ 出ない（てらすは 出る）
  const no = battle({ enemies: ['c9d_moth'], flags: { c9_child: true, c9_act1: true } });
  assert.ok(no.c9sp?.teru && !songOf(no));
  const b = battle({ enemies: ['c9d_moth', 'c9d_moth'] });
  const s = songOf(b);
  assert.ok(s && s.max === SONG_MAX && s.charge === 0);
  for (const a of b.allies) assert.ok(a.abilities.includes(SONG) && a.abilities.includes(TERU), 'みんな えらべる');
  assert.equal(ABILITIES[SONG].noAuto, true);
  assert.equal(ABILITIES[SONG].name, 'スピカ：星のうた');
  // 番（みんなが 1回ずつ 動いた）ごとに 1つ。てらすとは べつに たまる
  const t = b.c9sp.teru;
  for (let round = 0; round < SONG_MAX; round++) for (const a of b.allies) c9aAfter(b, a, ev0());
  assert.equal(s.charge, SONG_MAX);
  assert.equal(t.charge, t.max, 'てらすは 4回で べつに たまる');
  t.charge = 0;
  // 悪い 状態を なおす・回復
  const [a0, a1, a2] = b.allies;
  a1.status.sleep = { turns: 3 };
  a1.status.poison = { turns: 9 };
  setOkashi(b, a2, 2);
  a1.hp = Math.round(a1.maxHp * 0.5);
  const hp1 = a1.hp;
  const e = act(b, a0, { type: 'ability', id: SONG });
  assert.ok(e.c9dSong, e.lines.join('/'));
  for (const k of BAD_STATUS) { assert.ok(!a1.status[k], k); assert.ok(!a2.status[k], k); }
  assert.equal(a1.hp - hp1, Math.round(a1.maxHp * SONG_HEAL));
  assert.equal(s.charge, 0);
  assert.equal(t.charge, 0, 'てらすの たまりは かわらない');
  // たまって いない ときは 何も 起きない
  const e2 = act(b, a0, { type: 'ability', id: SONG });
  assert.ok(!e2.c9dSong && e2.lines.some((l) => l.includes('まだ')));
  // スピカと はなれて いる 戦い（A班が leaderFlag で false）… スピカごと 出ない
  const apart = battle({ enemies: ['c9d_moth'], flags: {} });
  assert.equal(apart.c9sp, undefined);
});

// ───────────── ムウ ─────────────
test('ムウ: はじめは 1体（ムウムウは かくれて いる）・分かれる 前は たおれない・4分の3 を 切ると 2体に 分かれる（HP は もとの 6わり ずつ）・muStage', () => {
  const b = battle();
  const m = muOf(b);
  const mm = mumuOf(b);
  assert.ok(m.alive && !mm.alive, 'はじめは 1体');
  assert.equal(b.c9mu.tele, null, '前ぶれ なし');
  assert.ok(b.c9sp && songOf(b), 'スピカと 星のうたは かならず');
  assert.equal(c9dPub(m, b).muStage, 0);
  assert.equal(c9dPub(mm, b).muHide, 1);
  // 分かれる 前は HP 1 より 下がらない
  b.damage(b.allies[0], m, m.maxHp * 2, ev0());
  assert.ok(m.alive && m.hp === 1);
  m.hp = Math.round(m.maxHp * 0.76);
  assert.notEqual(bossAct(b, m).tg, SPLIT);
  const H = b.c9mu.H0;
  m.hp = Math.round(m.maxHp * 0.74);
  const r = bossAct(b, m);
  assert.equal(r.tg, SPLIT);
  assert.ok(r.c9mSplit);
  assert.ok(m.alive && mm.alive, '2体に なった');
  assert.equal(m.maxHp, Math.round(H * muConf(m, b).part));
  assert.equal(mm.maxHp, m.maxHp);
  assert.equal(mm.hp, mm.maxHp);
  assert.equal(c9dPub(m, b).muStage, 1);
  assert.equal(c9dPub(mm, b).muStage, 1);
  assert.equal(c9dPub(mm, b).muHide, 0);
  assert.equal(MONSTERS[C9D_MU].hp > 0 && MONSTERS[C9D_MU].lv, 104);
  assert.equal(MONSTERS[C9D_MUMU].lv, 104);
});

test('ムウ: 片方を たおしても、もう 片方が へとへと（最大の 15% いか）で なければ すぐ「おきて、おきて！」（HP 4わり・2体とも 攻撃 2わり 上がる）・へとへとなら ばたんきゅうの まま・2体とも たおすと すわりこんで 勝ち', () => {
  const b = splitBattle();
  const m = muOf(b);
  const mm = mumuOf(b);
  const a0 = b.allies[0];
  const atk0 = m.atk;
  assert.equal(muConf(m, b).tired, 0.15);
  // もう 片方が 元気 … その場で 起こされる（たおれない）
  mm.hp = 5;
  const w = act(b, a0, { type: 'attack', target: mm.id });
  assert.ok(mm.alive && w.c9mWake?.now, w.lines.join('/'));
  assert.equal(mm.hp, Math.round(mm.maxHp * muConf(mm, b).wake));
  assert.ok(w.lines.some((l) => l.includes('おきて、おきて')));
  assert.equal(b.c9mu.wakes, 1);
  assert.equal(b.c9mu.power, 1.2);
  assert.equal(m.atk, Math.round(atk0 * 1.2));
  assert.equal(mm.atk, Math.round(atk0 * 1.2));
  assert.ok(!b.killed.includes(C9D_MUMU), 'たおした ことに しない');
  // もう 片方が へとへと … ばたんきゅうの まま（自分の 番が 来ても 起こせない）
  m.hp = Math.floor(m.maxHp * 0.15);
  assert.equal(c9dPub(m, b).muTired, 1, 'へとへとの しるし');
  mm.hp = 3;
  const k = act(b, a0, { type: 'attack', target: mm.id });
  assert.ok(!mm.alive && k.c9mKO, k.lines.join('/'));
  assert.equal(c9dPub(mm, b).muKO, 1);
  assert.ok(!b.over && !b.pendingEnd, 'まだ 勝ちでは ない');
  const t = bossAct(b, m);
  assert.notEqual(t.tg, WAKE);
  assert.ok(!mm.alive, 'へとへとで 起こせない');
  m.hp = 3;
  const last = act(b, a0, { type: 'attack', target: m.id });
  assert.ok(last.c9mWin, last.lines.join('/'));
  assert.ok(last.lines.some((l) => l.includes('すわりこんだ')));
  assert.equal(c9dPub(m, b).muSit, 1);
  assert.equal(c9dPub(mm, b).muSit, 1);
  b.checkEnd();
  assert.equal(b.result?.outcome || b.pendingEnd?.outcome, 'win');
  assert.deepEqual(b.killed.filter((x) => x === C9D_MU || x === C9D_MUMU).sort(), [C9D_MU, C9D_MUMU].sort(), '経験値は 2体 1回ずつ');
});

test('ムウ: 仲間はずれは いやだ（HPの 差が 大きいと 多い 方が おこって 攻撃 アップ）', () => {
  const b = splitBattle();
  const m = muOf(b);
  const mm = mumuOf(b);
  bossAct(b, mm);
  const base = m.atk;
  mm.hp = Math.round(mm.maxHp * 0.4);
  const r = bossAct(b, m);
  assert.ok(r.c9mAngry && m.c9m.angry, '多い 方が おこる');
  assert.ok(!mm.c9m.angry);
  assert.equal(m.atk, Math.round(base * muConf(m, b).angry));
  assert.equal(c9dPub(m, b).muAngry, 1);
  // 同じくらいに もどると おさまる
  m.hp = mm.hp;
  bossAct(b, m);
  assert.ok(!m.c9m.angry);
  assert.equal(m.atk, base);
});

test('ムウ: おかしビーム（前ぶれ → ねらいの 人 → 1回 あとに うつ）・身を 守ると ふせげる・おかしは 2回 動けない ＋ 受ける ダメージ 1.5倍・星のうたで なおる', () => {
  const b = splitBattle({ seed: 5 });
  const m = muOf(b);
  const mc = muConf(m, b);
  m.c9m.beamLeft = 1;
  const up = bossAct(b, m);
  assert.equal(up.tg, BEAMUP);
  const aim = m.c9m.beamAim;
  assert.ok(aim && up.c9mBeamUp.aim === aim);
  assert.equal(b.c9mu.tele, 'beam', '前ぶれ中の しるし');
  c9aAfter(b, b.allies[0], ev0());
  assert.equal(b.tell, 'beam', '待つ しくみ（battle-tell.js）の b.tell');
  assert.equal(c9dPub(m, b).muBeamAim, aim);
  // 前ぶれから うつまで ふつうに wait 回（人が 2びょうで えらんでも 間に あう）
  for (let i = 0; i < mc.beam.wait; i++) assert.notEqual(bossAct(b, m).tg, BEAM);
  const t = b.get(aim);
  t.defending = true;
  const blk = bossAct(b, m);
  assert.equal(blk.tg, BEAM);
  assert.ok(blk.c9mBeam.blocked && !okashiOf(t), '身を 守ると ふせげる');
  // 当たると おかし
  m.c9m.beamLeft = 1;
  bossAct(b, m);
  const t2 = b.get(m.c9m.beamAim);
  t2.defending = false;
  for (let i = 0; i < mc.beam.wait; i++) bossAct(b, m);
  const hit = bossAct(b, m);
  assert.ok(!hit.c9mBeam.blocked && okashiOf(t2));
  assert.equal(t2.status.okashi.turns, mc.beam.turns);
  // 受ける ダメージ 1.5倍
  const hp = t2.hp;
  b.damage(m, t2, 100, ev0());
  assert.equal(hp - t2.hp, Math.round(100 * mc.beam.taken));
  // 2回 動けない（番が とばされる）→ もどる
  t2.hp = t2.maxHp;
  t2.queued = false;
  for (let i = 0; i < mc.beam.turns; i++) {
    b.onReady(t2);
    assert.equal(b.queue[b.queue.length - 1].cmd.type, 'incapacitated');
    const q = b.queue.pop();
    b.queue.unshift(q);
    b.executeNext();
    const e = b.flush().filter((x) => x.t === 'act').pop();
    assert.ok(e.c9dOkashi, e.lines.join('/'));
  }
  assert.ok(!okashiOf(t2), 'もとに もどった');
  // 星のうたで なおる
  setOkashi(b, t2, 2);
  songOf(b).charge = SONG_MAX;
  act(b, b.allies.find((x) => x !== t2), { type: 'ability', id: SONG });
  assert.ok(!okashiOf(t2));
});

test('ムウ: いっしょに ドーン（2体 そろって いる 時・前ぶれ → 全体に 大きな ダメージ・身を 守ると へる）・片方が たおれると やめる', () => {
  const b = splitBattle({ seed: 9 });
  const m = muOf(b);
  const mm = mumuOf(b);
  for (const x of [m, mm]) x.c9m.beamLeft = 99;
  b.c9mu.pair = muConf(m, b).doon.every - 1;
  const up = bossAct(b, m);
  assert.equal(up.tg, DOONUP);
  assert.equal(c9dPub(m, b).muDoon, 1);
  assert.equal(b.c9mu.tele, 'doon', '前ぶれ中の しるし');
  for (let i = 0; i < muConf(m, b).doon.wait; i++) assert.notEqual(bossAct(b, m).tg, DOON);
  const [g, n] = b.allies;
  g.defending = true;
  n.defending = false;
  for (const a of b.allies) a.hp = a.maxHp;
  const d = bossAct(b, m);
  assert.equal(d.tg, DOON);
  assert.ok(d.c9mDoon.guarded >= 1);
  assert.ok(g.maxHp - g.hp < n.maxHp - n.hp, '身を 守った 人は へる');
  // 片方が ばたんきゅう（すぐ 起こされる）と いっしょに ドーンは やめ
  b.c9mu.pair = 99;
  bossAct(b, m);
  assert.ok(m.c9m.doon);
  assert.equal(b.c9mu.tele, 'doon');
  mm.hp = 2;
  const wk = act(b, b.allies[0], { type: 'attack', target: mm.id });
  assert.ok(wk.c9mWake?.now && mm.alive);
  assert.ok(!m.c9m.doon);
  assert.equal(b.c9mu.tele, null);
});

test('ムウ: 自動の 仲間 … 酒場の 人は 3回に 1回 HPの 多い 方を ねらう・家族の オートと 魔物の 仲間は しない・知って いる 人は ねらわれたら 防御・おかしの 仲間に 星のうた・HPの 多い 方を けずる', () => {
  const b = splitBattle({ kinds: ['player', 'support', 'support', 'monster'] });
  const m = muOf(b);
  const mm = mumuOf(b);
  mm.hp = Math.round(mm.maxHp * 0.9);
  m.hp = Math.round(m.maxHp * 0.5);
  const decide = () => ({ type: 'attack', target: m.id });
  const [pl, s1, s2, mon] = b.allies;
  assert.equal(c9dPlan(b, pl, decide, bestHit), null, '家族の キャラの オート');
  assert.equal(c9dPlan(b, mon, decide, bestHit), null, '魔物の 仲間');
  // 第101回 R3班: 自動の 仲間が ねらい分けるのは、人が えらんで いる 時だけ（battle-c10a.js の someoneChooses。完全オートでは しない）
  for (let i = 0; i < AUTO_EVERY * 2; i++) assert.equal(c9dPlan(b, i % 2 ? s1 : s2, decide, bestHit), null, '完全オート');
  pl.controller ??= 'sim';
  pl.auto = false;
  const picks = [];
  for (let i = 0; i < AUTO_EVERY * 2; i++) picks.push(c9dPlan(b, i % 2 ? s1 : s2, decide, bestHit));
  const hits = picks.filter(Boolean);
  assert.equal(hits.length, 2, '3回に 1回');
  for (const x of hits) assert.equal(x.target, mm.id, 'HPの 多い 方');
  // 知って いる 人
  pl.knows9 = 'know';
  assert.equal(c9aPlan(b, pl, decide).target, mm.id, 'HPの 多い 方を けずる');
  m.c9m.beamAim = pl.id;
  assert.equal(c9aPlan(b, pl, decide).type, 'defend', 'ねらわれたら 身を 守る');
  m.c9m.beamAim = null;
  setOkashi(b, s1, 2);
  songOf(b).charge = SONG_MAX;
  assert.equal(c9aPlan(b, pl, decide).id, SONG, 'おかしの 仲間に 星のうた');
  assert.equal(c9dPlan(b, s2, decide, bestHit) === null || c9dPlan(b, s2, decide, bestHit)?.id !== SONG, true, '自動の 仲間は 星のうたを 使わない');
});

// ───────────── 人数で 合わせる ─────────────
test('人数で 合わせる: 家族の キャラの 数で HP・攻撃・ドーン・魔物の 仲間は 半人ぶん・仲間なしの ひとりは solo（ドーン なし・おかしビームは 少なめ）', () => {
  const hp = (kinds) => { const b = battle({ kinds }); return muOf(b).maxHp; };
  const base = MONSTERS[C9D_MU].hp;
  // 第101回 R1班 2便: 人が えらぶ 間 ずっと 待つ 形（b.tellAll）で 人4人 9.8分・5人 13.6分に なった ので 4人・5人も HP を 下げた（前は 4人 もとの まま・5人 大きく）
  const few = MONSTERS[C9D_MU].c9d.few;
  assert.equal(hp(['player', 'player', 'player', 'player']), Math.round(base * few.hp[3]), '4人');
  assert.ok(few.hp[3] < 1);
  assert.equal(hp(['player', 'player', 'support', 'support']), Math.round(base * few.hp[1]), '2人＋酒場 2人');
  assert.equal(hp(['player', 'player', 'player', 'player', 'player']), Math.round(base * few.hp[4]), '5人');
  // 1人＋魔物3（2人めの 表を 使う）の HP は もとの まま（monK で もどす。0.68 × 0.64）
  assert.equal(hp(['player', 'monster', 'monster', 'monster']), Math.round(base * 0.68 * (1 - 0.12 * 3)));
  assert.ok(hp(['player']) < base * 0.3, 'ひとりだけ');
  const b = battle({ kinds: ['player', 'monster', 'monster', 'monster'] });
  assert.equal(peopleOf9d(b), 2, '魔物の 仲間は 半人ぶん');
  const solo = battle({ kinds: ['player'] });
  const sc = muConf(muOf(solo), solo);
  assert.ok(sc.beam.every > muConf(muOf(b), b).beam.every && sc.doon.every > 20, 'ひとりは ドーン なし・おかしビームは 少なめ');
  const two = battle({ kinds: ['player', 'player', 'support', 'support'] });
  assert.ok(muConf(muOf(two), two).doon.mult < muConf(muOf(b), battle()).doon.mult, '人が 少ない ときの ドーンは 弱め（自動の 仲間は 身を 守らない）');
});

// ───────────── 強さ ─────────────
test('強さ: 人が できる 動き（えらぶ 時間 2びょう・ブラウザの 速さ）で 知って いる 人は 勝てる・完全オートは 勝てない（少しの 回数）', { timeout: 1200000 }, () => {
  const human = { legacy: true, react: 2000, speed: 0.85, textSpeed: 0.8 };
  const know = [1, 2, 3, 4, 5, 6].map((s) => ch9Run('mu', LV9.mu, 'know', 9090 + s * 7919, human));
  assert.ok(know.filter((r) => r.outcome === 'win').length >= 3, `知って いる 人 ${know.map((r) => r.outcome).join(',')}`);
  const auto = [1, 2, 3, 4].map((s) => ch9Run('mu', LV9.mu, 'auto', 9090 + s * 7919, human));
  assert.ok(auto.filter((r) => r.outcome === 'win').length <= 1, `完全オート ${auto.map((r) => r.outcome).join(',')}`);
  const wins = know.filter((r) => r.outcome === 'win');
  const sec = wins.reduce((s, r) => s + r.seconds, 0) / wins.length;
  assert.ok(sec >= 240 && sec <= 540, `長さ ${sec}秒`);
  assert.ok(know.every((r) => r.mSplit === 1), 'かならず 分かれる');
  for (const [job, kit] of Object.entries(CH9_KIT.mu)) for (const id of kit) if (id) assert.ok(canEquip(job, id), `${job}: ${id}`);
  assert.equal(LV9.mu, 104);
});

test('前ぶれの 長さ: おかしビーム・ドーンの 前ぶれの 間は b.tell（待つ しくみ）・2びょうで えらぶ 人は 身を 守れる（ブラウザの 速さ）', { timeout: 600000 }, () => {
  const human = { legacy: true, react: 2000, speed: 0.85, textSpeed: 0.8 };
  const runs = [1, 2, 3, 4, 5, 6].map((s) => ch9Run('mu', LV9.mu, 'know', 7000 + s * 31, human));
  const beams = runs.reduce((s, r) => s + r.mBeams, 0);
  const blocked = runs.reduce((s, r) => s + r.mBlocked, 0);
  assert.ok(beams >= 3, `ビーム ${beams}`);
  assert.ok(blocked / beams >= 0.6, `身を 守れた ${blocked}/${beams}`);
});

// ───────────── 品 ─────────────
test('品: 宝箱 8こ（★5 は 4つ・k 2.22〜2.26。のこりは 素材か 道具）・ボスの 品（章の おわりの お守り 1つ）・読みがな・前の 章の 店に まざらない', () => {
  assert.equal(Object.keys(C9D_TREASURE).length, 8);
  assert.equal(C9D_GEAR_CHESTS.length, 4);
  for (const [id, [item, n]] of Object.entries(C9D_TREASURE)) {
    const it = ITEMS[item];
    assert.ok(it, item);
    assert.deepEqual(c9dChest(id), { item, n });
    if (C9D_GEAR_CHESTS.includes(id)) {
      assert.equal(it.src, 'c9d');
      assert.equal(it.rarity, 4);
      assert.equal(it.rank, 10);
      assert.notEqual(it.type, 'weapon', '武器は 作らない（前の 章の いちばん 強い 武器の テスト）');
      assert.ok(rareWhereText(item)?.includes('ふたごの道'), item);
    } else assert.ok(['mat', 'use'].includes(it.type), `${id}: 素材か 道具 (${it.type})`);
  }
  for (const k of Object.values(C9D_K)) assert.ok(k >= 2.22 && k <= 2.26, k);
  for (const id of Object.keys(ITEMS_C9D)) { assert.ok(PART3_LATE_ITEMS.has(id), id); assert.ok(ITEM_KANA[id], `${id}: 読みがな`); }
  const [acc] = C9D_DROPS.c9d_mu;
  assert.equal(MONSTERS.c9d_mu.drops.boss[0], acc);
  assert.equal(ITEMS[acc].type, 'acc');
  assert.ok(ITEMS[acc].unique);
  const sum = Object.values(ITEMS[acc].bonus).reduce((s, v) => s + v, 0);
  assert.ok(sum <= 287 && sum >= 280, `${acc}: よい 力の 合計 ${sum}`);
  for (const it of Object.values(ITEMS_C9D)) assert.ok(!it.resist?.water, it.name);
});

// ───────────── ヒント ─────────────
test('負けた 時の ヒント: 3つ（ぼんやり → はっきり）・言う 人は ノクト・12-3 の 文', () => {
  const h = C9D_BOSS_HINTS.c9d_mu;
  assert.equal(h.length, 3);
  assert.deepEqual(BOSS_HINTS.c9d_mu, h);
  assert.equal(BOSS_HINT_WHO.c9d_mu, C9D_HINT_WHO);
  assert.equal(C9D_HINT_WHO, 'ノクト');
  for (const t of h) assert.ok(t.length <= 46, t);
  assert.ok(h[0].includes('起こされる'));
  assert.ok(h[1].includes('同じくらい') && h[1].includes('へとへと'));
  assert.ok(h[2].includes('へとへと') && h[2].includes('全体攻撃') && h[2].includes('星のうた'));
});

// ───────────── 絵・背景 ─────────────
test('絵: 新しい 絵は 3つ（こだまのふたご・つりばしヤギ・かげぼうしネコ）・2しゅは 色ちがい・ボスは 2倍の こまかさ（コマ 2・3 ばたんきゅう／4・5 すわりこむ）・背景 2つ', () => {
  const fresh = C9D_MINIONS.filter((sp) => MONSTER_ART[sp] && !MONSTER_ART[sp].base && !MONSTER_ART[sp].tint);
  assert.deepEqual(fresh, C9D_NEW_ART, '新しい 絵は 3しゅまで');
  assert.ok(fresh.length <= 3);
  for (const [sp, base] of Object.entries(C9D_RECOLOR_BASE)) {
    assert.ok(MONSTER_ART[base], base);
    assert.ok(MONSTER_ART[sp].tint, `${sp}: 色ちがい`);
    assert.deepEqual(MONSTER_ART[sp].size, MONSTER_ART[base].size);
    assert.equal(MONSTERS[sp].race, MONSTERS[base].race, `${sp}: もとと おなじ 系統`);
  }
  const g = new Proxy({ w: 100, h: 100 }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  for (const sp of [...C9D_MINIONS, C9D_MU, C9D_MUMU]) {
    assert.ok(MONSTER_ART[sp], sp);
    for (const f of [0, 1]) MONSTER_ART[sp].draw(g, f);
  }
  for (const sp of [C9D_MU, C9D_MUMU]) {
    for (const f of [2, 3, 4, 5]) MONSTER_ART[sp].draw(g, f);
    assert.equal(MONSTERS[sp].artScale, 0.5);
    assert.equal(monsterFine(sp), 2);
    assert.ok(MONSTER_ART[sp].size[0] >= 200);
    const [w, h] = monsterSize(sp);
    assert.ok(w >= 95 && w <= 130 && h >= 95 && h <= 130, `${sp}: ${w}×${h}`);
  }
  // 2体 ならんでも 見分けが つく（色が ちがう）
  assert.notDeepEqual(MONSTER_ART[C9D_MU].pal, MONSTER_ART[C9D_MUMU].pal);
  for (const id of ['c9d_lane', 'c9d_grave']) assert.ok(battleBgSpec(id), id);
  assert.deepEqual(Object.values(ZONE_BG_C9D), ['c9d_lane', 'c9d_lane']);
});

// ───────────── がめん ─────────────
test('がめん: スピカの まどの 星のうた・コマンド「スピカ：星のうた」（いちばん 上）・2体の HPの まど・ばたんきゅうは 消えない・しるし・バナー・えんしゅつ', () => {
  for (const id of C9D_OWN_TELE) assert.ok(CH6_OWN_TELE.has(id), id);
  assert.equal(songText({ charge: 2, max: 5 }), 'うた ♪♪・・・');
  assert.equal(songText({ charge: 5, max: 5 }), 'うた OK');
  // 2体の HPの まど（分かれる 前は 出さない）
  const mu = { species: C9D_MU, alive: true, hp: 6000, maxHp: 12000, muStage: 1 };
  const mumu = { species: C9D_MUMU, alive: true, hp: 11000, maxHp: 12000, muStage: 1, muAngry: 1 };
  assert.equal(muHtml([{ ...mu, muStage: 0 }, { species: C9D_MUMU, alive: false, muHide: 1 }]).html, '');
  const h = muHtml([mu, mumu]);
  assert.ok(h.html.includes('ムウ') && h.html.includes('ムウムウ') && h.html.includes('width:50%') && h.html.includes('ぷんぷん'), h.html);
  const ko = muHtml([{ ...mu, alive: false, muKO: 1 }, { ...mumu, muAngry: 0, muTired: 1 }]);
  assert.ok(ko.html.includes('ばたんきゅう') && ko.html.includes('たおそう') && ko.cls.includes('warn'), ko.html);
  const tired = muHtml([{ ...mu, muTired: 1 }, { ...mumu, muAngry: 0, muTired: 1 }]);
  assert.ok(tired.html.includes('へとへと') && tired.html.includes('いっきに') && tired.cls.includes('warn'), tired.html);
  assert.ok(muHtml([{ ...mu, muTired: 1 }, { ...mumu, muAngry: 0 }]).html.includes('もう片方も'));
  // え: ばたんきゅう・すわりこむ は 消えない（dead -1）・まだ いない ムウムウは すぐ 消す
  const k = { species: C9D_MU, alive: false, muKO: 1, dead: 1 };
  try { c9dSprite(k, 0); } catch { /* え を かく ところは ブラウザだけ（document が いる） */ }
  assert.equal(k.dead, -1);
  const sit = { species: C9D_MUMU, alive: false, muSit: 1, dead: 1 };
  try { c9dSprite(sit, 1); } catch { /* */ }
  assert.equal(sit.dead, -1);
  const hid = { species: C9D_MUMU, alive: false, muHide: 1, dead: 1 };
  assert.equal(c9dSprite(hid, 0), null);
  assert.equal(hid.dead, 2);
  assert.equal(c9dSprite({ species: C9D_MU, alive: true }, 0), null);
  // コマンド
  const me = { id: 'a0', abilities: [SONG] };
  const sc = { c9spica: { light: 3, max: 3, teru: { charge: 0, max: 4, lit: 0, song: { charge: 5, max: 5 } } }, enemies: () => [], allies: () => [{ name: 'タロウ', alive: true, status: ['okashi'] }], sent: [], send(x) { this.sent.push(x); } };
  const items = c9aCmdItems(sc, me);
  assert.deepEqual(items.items.map((i) => i.value), ['c9dsong']);
  assert.ok(items.info.includes('タロウ'));
  assert.equal(c9dCmdPick(sc, me, 'c9dsong'), true);
  assert.deepEqual(sc.sent.pop(), { type: 'ability', id: SONG });
  assert.equal(c9dCmdPick(sc, me, 'other'), false);
  sc.c9spica.teru.song.charge = 3;
  assert.deepEqual(c9dCmdItems(sc, me).items, [], 'たまって いない ときは 出さない');
  // しるしが こわれない
  const x = new Proxy({}, { get: () => () => {}, set: () => true });
  const scene = { time: 0, enemies: () => [mu, mumu], c: { get: () => ({ name: 'タロウ' }) } };
  for (const c of [mu, mumu, { ...mu, muBeamAim: 'a0' }, { ...mu, muDoon: 1 }, { ...mu, muTired: 1 }, { ...mu, alive: false, muKO: 1 }, { ...mu, muSit: 1, alive: false }]) c9dDraw(scene, x, null, c, 10, 10, 40, 40, 1);
  // バナー
  const banners = [];
  const sc2 = { game: { audio: { sfx() {} } }, banner: (t) => banners.push(t), shake() {}, c: { get: () => ({ name: 'タロウ' }) } };
  for (const e of [{ c9mSplit: {} }, { c9mKO: { id: 'x', by: 'y' } }, { c9mWake: {} }, { c9mAngry: {} }, { c9mBeamUp: { aim: 'a0' } }, { c9mBeam: { blocked: true } }, { c9mBeam: { blocked: false, to: 'a0' } }, { c9mDoonUp: {} }, { c9mWin: {} }, { c9dSong: {} }, { c9Spica: { songReady: true } }]) c9dPresent(sc2, e);
  for (const w of ['分かれた', 'ばたんきゅう', '起こされた', '仲間はずれ', 'おかしビーム', 'はね返した', 'おかしにされた', 'いっしょにドーン', 'すわりこんだ', '星のうた']) assert.ok(banners.some((t) => t.includes(w)), w);
  // えんしゅつ: 技の anim は ぜんぶ ある（battlefx-c8c.js から とどく）・大きく 出す 技・味方の まど・音
  const fx = new Proxy({}, { get: () => () => {} });
  const anims = [...new Set(Object.values(C9D_ABILITIES).map((a) => a.anim))];
  for (const a of anims) {
    assert.equal(playC9dFx(fx, a, [{ x: 100, y: 60 }, { x: 140, y: 70 }], null, {}), true, a);
    assert.equal(playC8cFx(fx, a, [{ x: 100, y: 60 }], null, {}), true, `${a}: battlefx-c8c.js から とどく`);
  }
  for (const a of [...C9D_SCREEN_ANIMS, ...Object.keys(C9D_ALLY_FX), ...Object.keys(C9D_SFX)]) assert.ok(anims.includes(a), a);
  for (const [kk, v] of Object.entries(C9D_ALLY_FX)) assert.equal(CH4_ALLY_FX[kk], v, kk);
  assert.ok(allyAnimFor(ABILITIES[SONG].anim, SONG), '星のうたの 味方がわの 光');
  for (const a of Object.values(C9D_ABILITIES)) assert.ok(firstSentence(a.desc).length >= 6 && firstSentence(a.desc).length <= 40, a.name);
});

// ───────────── 字 ─────────────
test('文字: 子ども向けの 漢字・文の 中に 空白なし（kanji-check の gameFiles に 入って いる）', () => {
  const mine = [
    'public/js/shared/data/monsters-c9d.js', 'public/js/shared/data/abilities-c9d.js',
    'public/js/shared/data/encounters-c9d.js', 'public/js/shared/data/companions-c9d.js', 'public/js/shared/data/items-c9d.js', 'public/js/shared/data/boss-hints-c9d.js',
    'public/js/shared/battle-c9d.js', 'public/js/client/battle-c9d.js', 'public/js/client/render/c9d-art.js', 'public/js/client/render/c9d-bg.js', 'public/js/client/render/battlefx-c9d.js',
  ];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});
