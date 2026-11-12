// 第78回 3-10: 家族ミッション・家族の記録（shared/data/missions.js・shared/world/missions.js・client/ui/missions.js。docs/plan-r78-mission.md）
//   1. 週の 入れかわり（日本時間の 月曜 0:00）・同じ 週は 同じ 3つ・2週 続けて 同じ 物が 出ない
//   2. 人間の キャラが 2人 いじょうの 時だけ 数える・ひとりでは 進まない・ひとりモードでは 何も しない
//   3. 達成の 知らせ・ごほうびの 受けとりは 1回だけ・週を またいだ 時（先週の 分は 次の 週の 間だけ）
//   4. しょうごう・スタンプ（3つとも 達成した 週の 合計）・ネタバレ・冒険のしおりの 行・メニューの 入口・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { startFieldBattle, battleTick } from '../public/js/shared/world/battles.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import {
  MISSIONS, MISSION_KINDS, ALWAYS_KINDS, MILESTONES, weekNo, weekStart, daysLeft, pickWeek, openKinds, missionText, weekReward, earnedOf, cleanFamm, DAY_MS,
} from '../public/js/shared/data/missions.js';
import { missionState, ensureWeek, missionView, missionBump, missionClaim, missionChest, chatName } from '../public/js/shared/world/missions.js';
import { shioriOf, TRACK_IDS } from '../public/js/shared/world/shiori.js';
import { stampPresetsOf, STAMP_PRESETS } from '../public/js/shared/data/stamps.js';
import { exportCode } from '../public/js/shared/world/transfer.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const HOUR = 60 * 60 * 1000;
// 2026-11-16（月）0:00 日本時間 = 2026-11-15 15:00 UTC
const MON = Date.UTC(2026, 10, 15, 15, 0, 0);
const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

// ───────────── 1. 週の きまり ─────────────
test('週: 日本時間の 月曜 0:00 で 入れかわる・のこりの 日数', () => {
  const jst = new Date(MON + 9 * HOUR);
  assert.equal(jst.getUTCDay(), 1, '月よう日');
  assert.equal(jst.getUTCHours(), 0);
  const w = weekNo(MON);
  assert.equal(weekNo(MON - 1), w - 1, '日曜 23:59 は 先週');
  assert.equal(weekNo(MON + 7 * DAY_MS - 1), w, 'つぎの 日曜の おわりまで 同じ 週');
  assert.equal(weekNo(MON + 7 * DAY_MS), w + 1);
  assert.equal(weekStart(w), MON);
  // UTC の 月曜 0:00 は 日本では 月曜の 朝 9時（もう 入れかわって いる）
  assert.equal(weekNo(MON + 9 * HOUR), w);
  assert.equal(daysLeft(MON), 7);
  assert.equal(daysLeft(MON + 6 * DAY_MS + 12 * HOUR), 1, '日曜の 昼は のこり1日');
  assert.equal(daysLeft(MON + 3 * DAY_MS), 4);
});

test('えらびかた: 10〜15しゅるい・同じ 週は 同じ 3つ・2週 続けて 同じ 物は 出ない', () => {
  assert.ok(MISSION_KINDS.length >= 10 && MISSION_KINDS.length <= 15, `${MISSION_KINDS.length}`);
  assert.ok(ALWAYS_KINDS.length >= 6, 'いつでも 出せる 物だけでも 2週 続かない ように えらべる');
  for (const k of MISSION_KINDS) assert.ok(MISSIONS[k].need >= 1 && missionText(k).length > 4, k);
  const w0 = weekNo(MON);
  for (const kinds of [MISSION_KINDS, ALWAYS_KINDS]) {
    let prev = pickWeek(w0 - 1, kinds);
    for (let w = w0; w < w0 + 60; w++) {
      const a = pickWeek(w, kinds, prev);
      assert.deepEqual(a, pickWeek(w, kinds, prev), '同じ 週は 同じ');
      assert.equal(a.length, 3);
      assert.equal(new Set(a).size, 3);
      assert.ok(a.every((k) => kinds.includes(k)));
      assert.ok(!a.some((k) => prev.includes(k)), `週${w}: ${a} / 先週 ${prev}`);
      prev = a;
    }
  }
  // いろいろな 物が 出る
  const seen = new Set();
  for (let w = w0; w < w0 + 40; w++) pickWeek(w, MISSION_KINDS).forEach((k) => seen.add(k));
  assert.ok(seen.size >= 10, `${seen.size}`);
});

test('えらびかた: まだ 開いて いない しくみの ミッションは 出さない（いちばん 進んで いない 人で きめる）', () => {
  const fresh = { flags: {} };
  const adv = { flags: { c1_clear: true, monster_bond: true }, dualSeen: { dt_x: 1 }, treasureMaps: [{ seed: 1, lv: 3 }] };
  assert.deepEqual(openKinds([]), ALWAYS_KINDS);
  assert.deepEqual(openKinds([fresh]), ALWAYS_KINDS);
  assert.deepEqual(openKinds([adv]).sort(), MISSION_KINDS.slice().sort());
  assert.deepEqual(openKinds([adv, fresh]), ALWAYS_KINDS, '進んで いない 人に あわせる');
  // 主を たおした 地図しか ない → 宝の地図・ボスは 出さない
  const done = { ...adv, treasureMaps: [{ seed: 1, lv: 3, cleared: true }] };
  assert.ok(!openKinds([done]).includes('tmap') && !openKinds([done]).includes('boss'));
});

// ───────────── 2. 世界で 数える ─────────────
async function family(clock, n = 2) {
  const world = new GameWorld({ offline: false, rng: makeRng(78), checkPassword: () => true, rateLimit: false, now: () => clock.t });
  const bots = [];
  for (let i = 0; i < n; i++) {
    const b = new Bot(world, ['パパ', 'ユイ', 'ソラ'][i]);
    await b.login();
    await b.createAndPlay(['warrior', 'mage', 'priest'][i]);
    await b.settle();
    bots.push(b);
  }
  return { world, bots };
}
function joinParty(a, b) {
  a.send({ t: 'party', action: 'invite', sid: b.s.id });
  b.send({ t: 'party', action: 'accept' });
  assert.equal(a.party.members.length, 2);
}
function place(bots, map = 'overworld', x = FIELD.x, y = FIELD.y) {
  for (const b of bots) { b.s.map = map; b.s.x = x; b.s.y = y; b.s.busy = null; b.s.invuln = 0; b.s.reading = false; }
}
// 勝った 戦い（敵を みんな たおした ことに して 終わらせる）
function winBattle(world, bot, group = ['pururin', 'pururin', 'pururin']) {
  const sym = { id: 'w' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false };
  const ctx = startFieldBattle(world, bot.s, sym);
  const b = ctx.battle;
  for (const e of b.enemies) { e.hp = 0; e.alive = false; b.killed.push(e.species); }
  b.endBattle({ outcome: 'win' });
  battleTick(world, ctx, 0);
  return ctx;
}
const view = (world, bot) => missionView(world, world.data.characters[bot.char.id]);
const progOf = (world, kind) => {
  const w = ensureWeek(world);
  const i = w.list.findIndex((m) => m.k === kind);
  return i < 0 ? null : w.prog[i];
};

test('数える: 2人が 同じ パーティーで 勝つと 進む・ひとりでは 進まない', { timeout: 60000 }, async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  const w = ensureWeek(world);
  w.list = [{ k: 'kill', need: 60 }, { k: 'win', need: 25 }, { k: 'kinds', need: 12 }];
  // ひとり（パーティーを 組んで いない）
  place([papa]);
  winBattle(world, papa);
  assert.equal(progOf(world, 'win'), 0, 'ひとりでは 進まない');
  assert.equal(progOf(world, 'kill'), 0);
  assert.deepEqual(Object.keys(w.by), [], 'ひとりでは がんばりにも 入らない');
  // 2人 同じ パーティー・近くに いる
  joinParty(papa, kid);
  place([papa, kid]);
  const ctx = winBattle(world, papa, ['pururin', 'pururin', 'koumorin']);
  assert.equal(ctx.sids.length, 2, '2人 いっしょに 戦った');
  assert.equal(progOf(world, 'win'), 1);
  assert.equal(progOf(world, 'kill'), 3);
  assert.equal(progOf(world, 'kinds'), 2);
  const pc = world.data.characters[papa.char.id];
  const kc = world.data.characters[kid.char.id];
  assert.equal(w.by[pc.id].b, 1);
  assert.equal(w.by[kc.id].n[0], 3, 'ひとりずつの がんばり');
  // 同じ しゅるいは 2回 数えない
  place([papa, kid]);
  winBattle(world, papa, ['pururin']);
  assert.equal(progOf(world, 'kinds'), 2);
  assert.equal(progOf(world, 'kill'), 4);
  // パーティーでも はなれて いる 人は 入らない → ひとりの 戦い
  place([papa]);
  kid.s.x = FIELD.x + 30;
  winBattle(world, papa);
  assert.equal(progOf(world, 'win'), 2, 'はなれて いると ひとりの 戦い');
  const st = missionState(world);
  assert.equal(st.total.wins, 2);
  assert.equal(st.total.kills, 4);
  // サーバーの 状態は 世界の 側（キャラには 入らない）
  assert.equal(pc.famm, undefined);
  assert.ok(!('missions' in pc));
});

test('達成: 家族 みんなに 知らせる・ごほうびは 1回だけ・いっしょに 遊んで いない 人は 受けとれない', { timeout: 60000 }, async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid, sora] } = await family(clock, 3);
  const w = ensureWeek(world);
  w.list = [{ k: 'win', need: 2 }, { k: 'kill', need: 60 }, { k: 'chest', need: 1 }];
  joinParty(papa, kid);
  place([papa, kid]);
  winBattle(world, papa);
  sora.msgs.length = 0;
  place([papa, kid]);
  winBattle(world, papa);
  assert.ok(w.at[0] > 0, '達成');
  const toast = sora.msgs.find((m) => m.t === 'toast' && /家族ミッション達成/.test(m.text));
  assert.ok(toast, 'パーティーに いない 家族にも 知らせる');
  assert.ok(sora.msgs.some((m) => m.t === 'chat' && m.from === '家族ミッション'), 'チャットにも');
  assert.ok(world.data.familyBoard.some((e) => e.kind === 'mission'), '家族のけいじ板にも');
  // 受けとる（パパ）
  const pc = world.data.characters[papa.char.id];
  const g0 = pc.gold;
  const water0 = (pc.items.find((x) => x.id === 'magic_water')?.n) || 0;
  assert.equal(view(world, papa).week.claim, 1);
  papa.send({ t: 'mission', action: 'claim', which: 'cur' });
  const res = papa.msgs.filter((m) => m.t === 'mission').pop();
  assert.equal(res.ok, true, res.text);
  assert.equal(pc.gold, g0 + weekReward(0, pc.level).gold);
  assert.equal(pc.items.find((x) => x.id === 'magic_water').n, water0 + 2);
  // 2回目は もらえない
  const r2 = missionClaim(world, pc, 'cur');
  assert.equal(r2.ok, false);
  assert.equal(pc.gold, g0 + weekReward(0, pc.level).gold);
  // いっしょに 遊んで いない ソラは 受けとれない
  const sc = world.data.characters[sora.char.id];
  assert.equal(missionClaim(world, sc, 'cur').ok, false);
  assert.equal(view(world, sora).week.claim, 0);
  // 宝箱（いっしょに 同じ マップ）で 2つ目
  place([papa, kid]);
  missionChest(world, papa.s);
  assert.ok(w.at[2] > 0);
  // 2つ目の 分だけ 受けとれる（1つ目は もう 受けとった）
  assert.equal(view(world, papa).week.claim, 1);
  assert.equal(missionClaim(world, pc, 'cur').ok, true);
  assert.equal(view(world, papa).week.claim, 0);
  // ユイは 2つ とも
  assert.equal(view(world, kid).week.claim, 2);
});

test('宝箱・ダンジョンの 階: 2人が 同じ マップに いる 時だけ', { timeout: 60000 }, async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  const w = ensureWeek(world);
  w.list = [{ k: 'chest', need: 4 }, { k: 'floor', need: 6 }, { k: 'win', need: 25 }];
  place([papa]);
  missionChest(world, papa.s);
  assert.equal(w.prog[0], 0, 'ひとり');
  joinParty(papa, kid);
  place([papa]);
  kid.s.map = 'village';
  missionChest(world, papa.s);
  assert.equal(w.prog[0], 0, 'ちがう マップ');
  place([papa, kid]);
  missionChest(world, papa.s);
  assert.equal(w.prog[0], 1);
  // 階: ダンジョンの マップへ いっしょに 来た（同じ 階は 1回だけ）
  const dun = Object.keys((await import('../public/js/shared/maps/index.js')).MAPS).filter((id) => (world.mapKind(id) === 'dungeon')).slice(0, 2);
  assert.equal(dun.length, 2);
  const { missionFloor } = await import('../public/js/shared/world/missions.js');
  place([papa, kid], dun[0], 3, 3);
  missionFloor(world, papa.s, dun[0]);
  missionFloor(world, papa.s, dun[0]);
  assert.equal(w.prog[1], 1, '同じ 階は 1回');
  place([papa], dun[1], 3, 3);
  missionFloor(world, papa.s, dun[1]);
  assert.equal(w.prog[1], 1, 'ひとりで 来た 階は 数えない');
  place([papa, kid], dun[1], 3, 3);
  missionFloor(world, papa.s, dun[1]);
  assert.equal(w.prog[1], 2);
  missionFloor(world, papa.s, 'overworld');
  assert.equal(w.prog[1], 2, 'ダンジョン いがいは 数えない');
});

test('週を またぐ: 新しい 3つ・先週の ごほうびは 次の 週の 間だけ・前の 週の 結果', { timeout: 60000 }, async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  const w = ensureWeek(world);
  const first = w.list.map((m) => m.k);
  joinParty(papa, kid);
  // 1つ 達成（数を 直に 足す）
  const kind = w.list[0].k;
  missionBump(world, [papa.s.char, kid.s.char], kind, w.list[0].need);
  assert.ok(w.at[0] > 0);
  const pc = world.data.characters[papa.char.id];
  // 同じ 週の 中は 同じ 3つ
  clock.t = MON + 6 * DAY_MS + 23 * HOUR;
  assert.equal(ensureWeek(world), w);
  // 月曜 0:00 で 入れかわる
  clock.t = MON + 7 * DAY_MS;
  const w2 = ensureWeek(world);
  assert.notEqual(w2, w);
  assert.equal(w2.no, w.no + 1);
  assert.ok(!w2.list.some((m) => first.includes(m.k)), `2週 続けない: ${first} → ${w2.list.map((m) => m.k)}`);
  assert.deepEqual(w2.prog, [0, 0, 0]);
  const v = view(world, papa);
  assert.equal(v.prev.no, w.no);
  assert.equal(v.prev.claim, 1, '先週の 分を 受けとれる');
  assert.equal(v.week.claim, 0);
  assert.equal(v.record.hist.at(-1).d, 1);
  assert.equal(missionClaim(world, pc, 'prev').ok, true);
  assert.equal(missionClaim(world, pc, 'prev').ok, false, '1回だけ');
  // ユイは 受けとらずに 2週 たった → 消える（前の 週の 結果は 見える）
  clock.t = MON + 14 * DAY_MS;
  ensureWeek(world);
  const kc = world.data.characters[kid.char.id];
  const v3 = view(world, kid);
  assert.equal(v3.prev.no, w.no + 1, '先週は もう 次の 週');
  assert.equal(v3.prev.claim, 0);
  assert.equal(missionClaim(world, kc, 'prev').ok, false);
  assert.equal(missionState(world).hist.find((h) => h.no === w.no).d, 1, '前の 前の 週の 結果も のこる');
  // 何週も あいた ときは、先週と して 見せても 受けとれない
  clock.t = MON + 40 * DAY_MS;
  ensureWeek(world);
  const st = missionState(world);
  st.prev.at[0] = 1;
  st.prev.by[kc.id] = { name: 'ユイ', n: [1, 0, 0], b: 1, k: 0 };
  assert.equal(view(world, kid).prev.open, false);
  assert.equal(view(world, kid).prev.claim, 0);
  assert.equal(missionClaim(world, kc, 'prev').ok, false);
  // 何週も あいた あとでも こわれない（ばつも ない）
  clock.t = MON + 100 * DAY_MS;
  const w9 = ensureWeek(world);
  assert.equal(w9.no, weekNo(clock.t));
  assert.equal(w9.list.length, 3);
});

test('しょうごう・スタンプ: 3つとも 達成した 週の 合計（続けて で なくて よい）', { timeout: 60000 }, async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  joinParty(papa, kid);
  const pc = world.data.characters[papa.char.id];
  const fullWeek = () => {
    const w = ensureWeek(world);
    for (const m of w.list) missionBump(world, [papa.s.char, kid.s.char], m.k, m.need);
    assert.ok(w.full);
  };
  fullWeek();
  assert.equal(missionState(world).fullBy[pc.id], 1);
  assert.equal(pc.famm, undefined, '1週では まだ');
  // 1週 あける（遊ばない 週）→ それでも 合計で 2週
  clock.t += 14 * DAY_MS;
  papa.msgs.length = 0;
  fullWeek();
  assert.equal(missionState(world).fullBy[pc.id], 2);
  assert.deepEqual(pc.famm, { t: [2], w: 2 }, 'あたらしい しょうごうは すぐ つく');
  assert.ok(papa.msgs.some((m) => m.t === 'toast' && m.text.includes(MILESTONES[0].title)));
  assert.equal(chatName(pc), `${pc.name}〈${MILESTONES[0].title}〉`);
  // チャットの 名前の 横に 出る
  papa.send({ t: 'chat', stamp: 'やったね！' });
  assert.equal(kid.msgs.filter((m) => m.t === 'chat').pop().from, chatName(pc));
  // ここだけの スタンプ
  const pre = stampPresetsOf(pc);
  assert.equal(pre.length, STAMP_PRESETS.length + 1);
  assert.deepEqual(pre.at(-1).list, [MILESTONES[0].stamp]);
  assert.equal(stampPresetsOf(world.data.characters[papa.char.id] && {}), STAMP_PRESETS);
  // はずす・つける
  papa.send({ t: 'mission', action: 'wear', n: 0 });
  assert.deepEqual(pc.famm, { t: [2] });
  assert.equal(chatName(pc), pc.name);
  papa.send({ t: 'mission', action: 'wear', n: 8 });
  assert.equal(papa.msgs.filter((m) => m.t === 'mission').pop().ok, false, 'もって いない しょうごうは つけられない');
  papa.send({ t: 'mission', action: 'wear', n: 2 });
  assert.equal(pc.famm.w, 2);
  // つぎの しょうごうまで
  assert.deepEqual(view(world, papa).me.next.n, 4);
  // こわれた 記録の 手直し
  const c2 = { famm: { t: [2, 99, 2], w: 7 } };
  cleanFamm(c2);
  assert.deepEqual(c2, { famm: { t: [2] } });
  const c3 = { famm: { t: [] } };
  cleanFamm(c3);
  assert.equal(c3.famm, undefined);
  assert.deepEqual(earnedOf({}).length, 0);
});

test('引っこしコード: ふだんの キャラには 家族ミッションの 項目が ない（コードが 長く ならない）', async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  joinParty(papa, kid);
  place([papa, kid]);
  winBattle(world, papa);
  const pc = world.data.characters[papa.char.id];
  assert.equal(pc.famm, undefined);
  assert.ok(!JSON.stringify(pc).includes('famm'));
  const code = exportCode(pc);
  assert.ok(typeof code === 'string' && code.length > 10);
  // 世界の 側に ある（セーブに のこる）
  const saved = JSON.parse(JSON.stringify(world.data));
  assert.ok(saved.missions.week.by[pc.id]);
  assert.equal(saved.missions._ok, undefined);
  // セーブを 読みなおしても つづく
  const w2 = new GameWorld({ offline: false, data: saved, rateLimit: false, now: () => clock.t });
  assert.equal(ensureWeek(w2).by[pc.id].b, 1);
});

test('ひとりモード: 進まない・何も 書かない・画面は「家族サーバーでいっしょに遊ぶと進みます」', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false, now: () => MON + HOUR });
  const bot = new Bot(world, 'ソロ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  place([bot]);
  winBattle(world, bot);
  missionChest(world, bot.s);
  assert.equal(missionBump(world, [bot.s.char, bot.s.char], 'win', 1), false);
  bot.send({ t: 'mission', action: 'view' });
  bot.send({ t: 'mission', action: 'claim', which: 'cur' });
  const res = bot.msgs.filter((m) => m.t === 'mission');
  assert.equal(res.length, 2);
  assert.ok(res.every((m) => m.offline === true && !m.week));
  assert.equal(world.data.missions, undefined, 'ひとりモードの セーブには 何も 書かない');
  // 冒険のしおりには 出さない
  assert.ok(!shioriOf(bot.s.char, { missions: res[0] }).tracks.some((t) => t.id === 'mission'));
  assert.ok(!shioriOf(bot.s.char).tracks.some((t) => t.id === 'mission'));
  const src = fs.readFileSync(new URL('../public/js/client/ui/missions.js', import.meta.url), 'utf8');
  assert.ok(src.includes('家族サーバーでいっしょに遊ぶと進みます'));
});

test('冒険のしおり: 家族サーバーでは「家族ミッション」の 行が 出る', async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  joinParty(papa, kid);
  place([papa, kid]);
  winBattle(world, papa);
  const v = view(world, papa);
  const s = shioriOf(world.data.characters[papa.char.id], { missions: v });
  const t = s.tracks.find((x) => x.id === 'mission');
  assert.ok(t);
  assert.equal(t.total, 3);
  assert.equal(t.items.length, 3);
  assert.ok(TRACK_IDS.includes('mission'));
  assert.ok(t.note.includes(`のこり${v.week.days}日`));
});

test('ネタバレ: いっしょに たおした ボスは、見て いる キャラが たおした ボスだけ 名前を 出す', async () => {
  const clock = { t: MON + 10 * HOUR };
  const { world, bots: [papa, kid] } = await family(clock);
  const st = missionState(world);
  const bosses = Object.keys(MONSTERS).filter((k) => MONSTERS[k].boss).slice(0, 2);
  const [a, b] = bosses.length >= 2 ? bosses : Object.keys(MONSTERS).slice(-2);
  st.total.boss = { [a]: 1, [b]: 2 };
  const pc = world.data.characters[papa.char.id];
  pc.kills[a] = 1;
  const v = view(world, papa);
  assert.deepEqual(v.record.bosses.map((x) => x.name), [MONSTERS[a].name]);
  assert.ok(!JSON.stringify(v).includes(MONSTERS[b].name), 'まだ たおして いない ボスの 名前は おくらない');
  const vk = view(world, kid);
  assert.equal(vk.record.bosses.length, 0);
  // ミッションの 文に ボスの 名前・物語の 先は ない
  for (const k of MISSION_KINDS) {
    const text = missionText(k);
    for (const m of Object.values(MONSTERS)) if (m.boss) assert.ok(!text.includes(m.name), `${k}: ${m.name}`);
  }
});

test('画面: メニューの 入口・文字のきまり・しおりと おなじ 大きさの まど', () => {
  const menu = fs.readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.ok(menu.includes("{ label: '家族ミッション', value: 'mission' }"));
  assert.ok(menu.includes("case 'mission': this.main.append(missionsPreview(this))"));
  assert.ok(menu.includes('openMissions(this)'));
  const css = fs.readFileSync(new URL('../public/js/client/ui/r78-mission-css.js', import.meta.url), 'utf8');
  assert.ok(css.includes('overflow-x: hidden'));
  assert.ok(css.includes('@media (orientation: portrait)'));
  for (const f of ['public/js/shared/data/missions.js', 'public/js/shared/world/missions.js', 'public/js/client/ui/missions.js', 'public/js/client/ui/r78-mission-css.js']) {
    const bad = checkFile(new URL(`../${f}`, import.meta.url).pathname).filter((r) => r.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
