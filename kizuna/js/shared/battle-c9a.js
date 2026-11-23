// 第3部 第1章 第1幕「星ふるえの夜」の 戦いの しかけ（battle-c8r.js と battle.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3.md の 9-3
//
// ・星の子（スピカ）… 戦いの わくを 使わない 味方（第8章 第4幕の「かけつけ」と おなじ 考え。何人で 遊んでも おなじ）
//   出る 条件: パーティーの リーダーが c9_child を 持って いる（hooks.leaderFlag）。3人組・ためしの 戦いは かならず 出る
//   味方が 全員 1回ずつ 動いた あとに「ほのかな光」… HPが いちばん 少ない（わりあい）仲間を 最大HPの heal（6%）回復。攻撃は しない
//   画面の 上に「星の子の光 ★★★」（snapshot の spica・ev.c9Spica）
// ・中ボス「3人組と スイトール1号」（monsters-c9a.js の c9a.kind 'trio'）… 星の子の 光を 守る
//   メカは aim 回 動く ごとに すいこみ口を 星の子に 向ける（m9t_aim。前ぶれの 文）→ 次の メカの 番で すいこむ（m9t_suck）
//   その 間に だれかが「防御」を えらぶ（か「かばう」を して いる）と、前に 立って 代わりに 受ける（中くらいの ダメージ）
//   すいこみ口（c9a_suikomi。べつの 的）を こわすと すいこみは 止まり、メカは 1回 休む（m9t_rest）。fix 回 動くと 直る
//   守れないと 星の子の 光が 1つ へり、メカが 回復して 攻撃が 強く なる（lost.heal・lost.up）。光が 0 で 負け
// ・幕の ボス「ホシモリの ともしびの ためし」（c9a.kind 'trial'）… 明かりを 消さずに、夜明けまで たえる
//   はじめに 味方 全員が「ともしび」（a.c9torch）。やみの いぶき（every 回 動く ごとに 前ぶれ・ねらう 人が 出る → 次の 番）で 消える
//   （身を 守って いる 人は 手で かこって 消えない）。消えた 人は 与える ダメージと 回復が half ばい
//   明かりを わける（m9_share。ともしびが ある 人だけ。仲間 1人の ともしびを つけ直す）。星の子の ほのかな光も spicaEvery 回に 1回 つける
//   夜明けの めもり: ホシモリが 動く たびに 1（ともしびが 1つでも あれば）。その 前の ホシモリの 番から big の ダメージを 与えて いれば もう 1
//   dawn で 勝ち（たおれずに うなずく）。全員の ともしびが 消えると「まっくら」で 負け。HPが 0 の 人の ともしびは 消える
//   めもりが two（半分）を こえると、いぶきは 2人に。HP は 1 より 下がらない（たおす ボスでは ない）
// ・ふつうの オート（家族が「オート」に した とき）: しくみを 使わない（防御も 明かりを わけるも えらばない ＝ 今の 自動の 動き）
// ・知っている 人（シミュレーター tools/sim-ch9.mjs。b.knowsCh9 'know'）: 3人組 … 前ぶれで 1人が 防御・のこりは すいこみ口／
//   ためし … ともしびが 消えた 仲間に 明かりを わける・いぶきで ねらわれた 人は 身を 守る。'blind'（知らない 人）は たまに 気づく だけ
import { MONSTERS } from './data/monsters.js?v=ae1035a9a013';
import { ABILITIES } from './data/abilities.js?v=ae1035a9a013';
import { SHARE } from './data/abilities-c9a.js?v=ae1035a9a013';
import { C9A_NOZZLE } from './data/monsters-c9a.js?v=ae1035a9a013';
import { C9A } from './maps/c9a-flags.js?v=ae1035a9a013';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { pub, atbRate } from './battle.js?v=ae1035a9a013';
import { canUse } from './ai.js?v=ae1035a9a013';
// 第3部 第1章 第2幕: スピカの てらす・デデドン大王（battle-c9b.js）
import { setupC9b, addTeru, teruPub, c9bGlow, c9bTurnStart, c9bEffect, c9bDamage, c9bKill, c9bPlan, c9bPub, c9bTell } from './battle-c9b.js?v=ae1035a9a013';
// 第3部 第2章 第1幕: あつさ・カビ・スピカの ごほうび（battle-c10a.js）
import { c10aAfter, c10GlowHeal, c10aAllyPub, someoneChooses } from './battle-c10a.js?v=ae1035a9a013';
// 第3部 第2章 第2幕: 水の めもり・本物が 動いた・てらす（battle-c10b.js）
import { c10bAfter } from './battle-c10b.js?v=ae1035a9a013';
// 第3部 第2章 第3幕: てらす（まぶしい・とばりが 消える）・星のうた（音が 止まる）・うき石（battle-c10c.js）
import { c10cAfter, c10cAllyPub } from './battle-c10c.js?v=ae1035a9a013';
// 第3部 第2章 第4幕: てらす（うつし身が 消える）・星のうた（まくが 1色 へる）・まくを まとい直す・しるし・金の 音の ごほうび（battle-c10d.js）
import { c10dAfter, c10dAllyPub, c10GlowStart } from './battle-c10d.js?v=ae1035a9a013';
// 第3部 第3章 第1幕: 時計の 数・サメ・星が よみがえる・スピカの ながれ星（battle-c11a.js）
import { c11aAfter, c11aAllyPub, c11GlowStar } from './battle-c11a.js?v=ae1035a9a013';
// 第3部 第3章 第2幕: スピカの わすれ・天人・わすれの じょうたい・スピカの 名前をよぶ声（battle-c11b.js）
import { c11bAfter, c11bAllyPub, c11bGlowCall } from './battle-c11b.js?v=ae1035a9a013';
// 第3部 第3章 第3幕: メカの こわれた 体・てらした カード・へいたい・スピカの ふたりの光（battle-c11c.js）
import { c11cAfter, c11cAllyPub, c11cGlowTwin } from './battle-c11c.js?v=ae1035a9a013';

export { SHARE };
export const AIM = 'm9t_aim';
export const SUCK = 'm9t_suck';
export const REST = 'm9t_rest';
export const BREATH = 'm9h_breath';
export const DAWN = 'm9h_dawn';
export const SPICA_HEAL = 0.06;
export const SPICA_LIGHT = 3;
export const SPICA_SAY = 'スピカ';

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const confOf = (m) => MONSTERS[m?.species]?.c9a || null;
const stars = (n, max) => '★'.repeat(Math.max(0, n)) + '☆'.repeat(Math.max(0, max - n));

// 人数（家族の キャラ ＝ kind 'player' の 数。1〜5）で 合わせる 表（monsters-c9a.js の c9a.few。[1人, 2人, 3人, 4人, 5人]）
//   人が 動かす キャラが 少ない ときは、自動の 仲間が しくみを 使わない ぶん やさしく する（しくみは おなじ）
//   家族の キャラが 1人も いない 戦い（テスト・古い シミュレーター）は 4人と おなじ
export function peopleOf(b) {
  if (b?.c9people) return b.c9people;
  const n = (b?.allies || []).filter((a) => a.kind === 'player').length;
  return Math.max(1, Math.min(5, n || 4));
}
// 第101回 R1班: 仲間なしの 少ない パーティー … 味方（ゲストを のぞく）が みんな 家族の キャラ（kind 'player'）で 2人か 3人。
//   その 時は 人数の 表 few と ならべた bare（[2人, 3人]）を 先に 見る（few は 家族の キャラの 数で 引くので、
//   「人2人だけ」が「2人＋自動2人」と、「人3人だけ」が「3人＋自動1人」と 同じ 強さに なって いた … docs/plan-sim-vs-real.md の 7-2）
//   ひとりだけ（solo）・自動の 仲間が いる 時は 0（今の まま）
export function bareOf(b) {
  const al = (b?.allies || []).filter((a) => a.kind !== 'guest');
  if (al.length < 2 || al.length > 3) return 0;
  return al.every((a) => a.kind === 'player') ? al.length : 0;
}
// 人数で 合わせた 数を えらぶ（第1章 みんなで 使う）: solo（仲間なしの ひとり）→ bare（仲間なしの 2人・3人）→ few（people(b) 人め）
//   people … その 幕の 人数の 数え方（peopleOf・kingPeople など。魔物の 仲間の 数え方が ちがう）
export function pickPeople(c, b, people = peopleOf) {
  if (!b) return (k, d) => d;
  const f = c.few || {};
  const alone = b.allies.length === 1 ? c.solo || {} : {};
  const n = bareOf(b);
  const bare = n ? c.bare || {} : {};
  const at = (arr, i) => (Array.isArray(arr) ? arr[i] : undefined);
  return (k, d) => alone[k] ?? at(bare[k], n - 2) ?? at(f[k], people(b) - 1) ?? d;
}
// 第92回 第2便: 人数の 表（few）・仲間なしの ひとり（solo … 戦う 人が 1人だけ。few より 先）から えらぶ
//   第101回 R1班: 仲間なしの 2人・3人（bare）も（pickPeople）
const pick9 = (c, b) => pickPeople(c, b, peopleOf);
// ボスの HP・攻撃力を 人数で 合わせる（few.hp・few.atk・solo）
function scale9(b, m, conf) {
  const pick = pick9(conf, b);
  // 魔物の 仲間 1体ごとの 上げ（monK。家族の キャラが いる とき）
  const mons = (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  const hp = pick('hp', 1) * (1 + (conf.monK?.hp || 0) * mons), atk = pick('atk', 1) * (1 + (conf.monK?.atk || 0) * mons);
  if (hp !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * hp));
  if (atk !== 1) m.atk = Math.max(1, Math.round(m.atk * atk));
}
export function trioConf(m, b = null) {
  const c = confOf(m) || {};
  const f = c.few || {};
  void f;
  const pick = pick9(c, b);
  return {
    aim: pick('aim', c.aim ?? 3), suck: { mult: 2.1, ...(c.suck || {}) }, lost: { heal: 0.06, up: 1.12, ...(c.lost || {}) }, fix: c.fix ?? 3, light: c.light ?? SPICA_LIGHT,
    guard: pick('guard', 1), nozzle: pick('nozzle', 1), wait: pick('wait', 0),
  };
}
export function trialConf(m, b = null) {
  const c = confOf(m) || {};
  const pick = pick9(c, b);
  const every = c.every ?? 3;
  const dawn = c.dawn ?? 16;
  return {
    dawn: pick('dawn', dawn), every: pick('every', every),
    big: c.big ?? 9000, half: c.half ?? 0.5, spicaEvery: c.spicaEvery ?? 3, two: pick('two', c.two ?? 0.5), breath: c.breath || [300, 330],
    // 第92回 第2便: 息を すいこんでから いぶきまでに ふつうに 動く 回数（人が 読んで 身を 守る・わける 間）
    bwait: pick('bwait', c.bwait ?? 0),
  };
}
export const mechaOf = (b) => (b.c9trio ? b.get(b.c9trio.mecha) : null);
export const nozzleOf = (b) => (b.c9trio ? b.get(b.c9trio.nozzle) : null);
export const hoshimoriOf = (b) => (b.c9trial ? b.get(b.c9trial.hm) : null);
export const spicaOf = (b) => b.c9sp || null;
// ともしびが ついて いる 生きた 仲間
export const litAllies = (b, but = null) => b.aliveAllies().filter((x) => x !== but && x.c9torch);
export const unlitAllies = (b) => b.aliveAllies().filter((x) => !x.c9torch);

// ───────────── はじめ（battle-c8r.js の setupC8r の さいご）─────────────
export function setupC9a(b) {
  const lines = [];
  let on = false;
  b.c9people = peopleOf(b);
  try {
    on = !!b.hooks?.leaderFlag?.(C9A.child);
  } catch { /* */ }
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    if (conf.kind === 'trio') {
      setupTrio(b, e, lines);
      on = true;
    } else if (conf.kind === 'trial') {
      setupTrial(b, e, lines);
      on = true;
    }
  }
  // 第3部 第1章 第2幕: デデドン大王・てらす（リーダーが c9_act1）
  if (setupC9b(b, lines)) {
    addSpica(b);
    addTeru(b);
  }
  if (on) addSpica(b);
  // 第101回 R1班: 第1章の しくみの ある ボス（3人組・ためし・大王・ナゾカケ・ヒックリカエール2号・ムウ）も、
  //   人が えらぶ 間 ずっと 待つ 形（b.tellAll。第2章・第3章と 同じ。battle.js の tick・battle-tell.js の tellHold）。
  //   前ぶれの ない 間も c9Tell が 'wait' を かえす（ボスが 生きて いる 間）。オートの 人・自動の 仲間は 待たない・1つの まど 20秒まで
  if (b.c9trio || b.c9trial || b.c9king || b.c9nazo || b.c9sand || b.c9mu) {
    b.c9wait = true;
    b.tellAll = true;
    b.tell = c9Tell(b);
  }
  // 第3部 第2章 第4幕: 金の 音の ごほうび … 戦いの はじめにも ほのかな光（battle-c10d.js）
  if (b.c9sp && c10GlowStart(b)) glowNow(b, lines);
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1500, c9Spica: spicaPub(b) });
}

// 星の子を 戦いに 入れる（わくは 使わない。何回 よんでも おなじ。シミュレーター・テストからも よぶ）
export function addSpica(b, light = null) {
  if (b.c9sp) return b.c9sp;
  const max = light ?? (mechaOf(b) ? trioConf(mechaOf(b)).light : SPICA_LIGHT);
  b.c9sp = { light: max, max, acted: [], glows: 0, heals: 0, relit: 0 };
  return b.c9sp;
}
export function spicaPub(b) {
  const s = b.c9sp;
  return s ? { light: s.light, max: s.max, glows: s.glows, ...(s.teru ? { teru: teruPub(b) } : {}) } : null;
}

function setupTrio(b, m, lines) {
  const tc = trioConf(m, b);
  scale9(b, m, confOf(m));
  const nz = b.enemies.find((e) => e.species === C9A_NOZZLE);
  // すいこみ口の HP は 人数で 合わせる（few.nozzle）
  if (nz && tc.nozzle !== 1) nz.maxHp = nz.hp = Math.max(1, Math.round(nz.maxHp * tc.nozzle));
  m.c9t = { acts: 0, aimLeft: tc.aim, aim: false, wait: 0, broken: !nz, rest: 0, fix: 0, power: 1, atk0: m.atk, sucks: 0, guards: 0, lost: 0, breaks: 0, fixes: 0 };
  b.c9trio = { mecha: m.id, nozzle: nz?.id || null };
  lines.push(
    'キラジョ「オーッホッホ！その子の光は、わたしたちホシドロ一味がいただくわ！」',
    'ボヤッチ「すいこみメカ、スイトール1号でございマス！」',
    'ズラッカ「ぜーんぶ、すいこむだっぺ！」',
    '（すいこみ口が星の子をむいたら「防御」で前に立とう！すいこみ口をこわすと、止まるかも…！）',
  );
}

function setupTrial(b, h, lines) {
  const hc = trialConf(h, b);
  scale9(b, h, confOf(h));
  h.c9h = { acts: 0, dawn: 0, max: hc.dawn, every: hc.every, left: hc.every, aim: [], dmg: 0, bigs: 0, breaths: 0, shares: 0, kept: 0, outs: 0, relit: 0, won: false, dark: false };
  b.c9trial = { hm: h.id };
  for (const a of b.allies) {
    a.c9torch = true;
    if (!a.abilities.includes(SHARE)) a.abilities = [SHARE, ...a.abilities];
  }
  lines.push(
    'ホシモリ「…千年、待っていた。星の子をつれた者たちよ。」',
    'ホシモリ「その明かり、夜明けまで、消さずにいられるか。」',
    '（みんなの「ともしび」を、夜明けまで守ろう！火が消えた仲間には「明かりをわける」！）',
  );
}

// ───────────── 味方が 1回 動いた あと（battle.js の executeNext・防御の さいご）: 星の子の ほのかな光 ─────────────
// 第101回 R3班: 第3部の ボス戦の たおれた・生き返った 数（負けた 時の ひとこと … world/boss-hints.js の partyNote が 見る）
//   b.c9life = { down: たおれて いる 味方の id, died: 1回 いじょう たおれた 味方の id, revives: 生き返った 回数 }。ゲストは 数えない
export function c9Life(b) {
  const L = (b.c9life ??= { down: new Set(), died: new Set(), revives: 0 });
  for (const a of b.allies) {
    if (a.kind === 'guest' || a.fled) continue;
    if (!a.alive) {
      L.down.add(a.id);
      L.died.add(a.id);
    } else if (L.down.has(a.id)) {
      L.down.delete(a.id);
      L.revives++;
    }
  }
  return L;
}
export function c9aAfter(b, c, ev) {
  if (b.c9trio || b.c9trial || b.c9king || b.c9nazo || b.c9sand || b.c9mu || b.c10 || b.c10b || b.c10c || b.c10d || b.c11a || b.c11b || b.c11c) c9Life(b);
  // 第92回 第3便: 前ぶれの しるし（battle-tell.js。敵・味方の どの 行動の あとも 入れ直す）
  // 第3部 第2章 第1幕: あつさ・メカの あつさ・カビが 消える（battle-c10a.js。b.tell より 先）
  if (b.c10) c10aAfter(b, c, ev);
  if (b.c10b) c10bAfter(b, c, ev);
  if (b.c10c) c10cAfter(b, c, ev);
  if (b.c10d) c10dAfter(b, c, ev);
  if (b.c11a) c11aAfter(b, c, ev);
  if (b.c11b) c11bAfter(b, c, ev);
  if (b.c11c) c11cAfter(b, c, ev);
  if (b.c9trio || b.c9trial || b.c9king || b.c9nazo || b.c9sand || b.c9mu || b.c10 || b.c10b || b.c10c || b.c10d || b.c11a || b.c11b || b.c11c) b.tell = c9Tell(b);
  const s = b.c9sp;
  if (!s || b.pendingEnd || b.over || c?.side !== 'ally') return;
  for (const id of [c.id, ...(ev?.dual?.m || [])]) if (!s.acted.includes(id)) s.acted.push(id);
  const alive = b.aliveAllies();
  if (!alive.length || alive.some((x) => !s.acted.includes(x.id))) return;
  s.acted = [];
  glow(b, ev);
}
// 今、こたえが いる 前ぶれが 出て いるか（battle-tell.js の b.tell。null … ない）
//   すいこみ口が 星の子を 向いた（3人組）・やみの いぶきの ねらい（ためし）・大王・第3幕（battle-c9b.js の c9bTell）
export function c9Tell(b) {
  if (b.over || b.pendingEnd) return null;
  const m = mechaOf(b);
  if (m?.alive && m.c9t?.aim) return 'suck';
  const h = hoshimoriOf(b);
  if (h?.alive && h.c9h && !h.c9h.won && h.c9h.aim.length) return 'breath';
  // 第101回 R1班: 第1章の ボスは 前ぶれが ない 間も 待つ（'wait'。setupC9a の b.c9wait）
  return c9bTell(b) || (b.c9wait && !h?.c9h?.won && !b.c9mu?.won && b.enemies.some((e) => e.boss && e.alive) ? 'wait' : null);
}
// 戦いの はじめの ほのかな光（第3部 第2章 第4幕の 金の 音の ごほうび。いつもの ほのかな光と おなじ 中み）
export function glowNow(b, lines = []) {
  const ev = { lines: [], upd: [], results: [] };
  glow(b, ev);
  lines.push(...(ev.postLines || []));
  b.c10dGlow0 = ev.c9Spica || true;
  return ev;
}
function glow(b, ev) {
  const s = b.c9sp;
  s.glows++;
  const alive = b.aliveAllies();
  const t = alive.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
  const lines = post(ev);
  const out = { glow: true, light: s.light, max: s.max, glows: s.glows };
  if (t) {
    // 第3部 第2章 第1幕: 赤の 音の ごほうび … 9%（battle-c10a.js）
    const real = Math.min(t.maxHp - t.hp, Math.max(1, Math.round(t.maxHp * c10GlowHeal(b, SPICA_HEAL))));
    if (real > 0) {
      t.hp += real;
      s.heals += real;
      ev.results = ev.results || [];
      ev.results.push({ id: t.id, heal: real });
      lines.push(`${SPICA_SAY}のほのかな光！${t.name}のHPが${real}回復した！`);
      out.to = t.id;
      out.heal = real;
    } else lines.push(`${SPICA_SAY}のほのかな光が、みんなをてらした。`);
    ev.upd.push(t);
  }
  // ともしびの ためし: spicaEvery 回に 1回、消えた ともしびを 1つ つける
  const h = hoshimoriOf(b);
  if (h?.c9h && s.glows % trialConf(h).spicaEvery === 0) {
    const u = unlitAllies(b)[0];
    if (u) {
      u.c9torch = true;
      s.relit++;
      h.c9h.relit++;
      lines.push(`${SPICA_SAY}の光で、${u.name}のともしびが、ふたたびともった！`);
      out.relit = u.id;
      ev.upd.push(u);
    }
  }
  // 第3部 第1章 第2幕: てらすが たまる・明るい 番が へる（battle-c9b.js）
  c9bGlow(b, out, lines);
  // 第3部 第3章 第1幕: スピカの ごほうび「ながれ星」（battle-c11a.js）
  const star = c11GlowStar(b, ev);
  if (star) out.star = star;
  // 第3部 第3章 第2幕: スピカの ごほうび「名前をよぶ声」（battle-c11b.js）
  const named = c11bGlowCall(b, ev);
  if (named) out.named = named;
  // 第3部 第3章 第3幕: スピカの ごほうび「ふたりの光」（battle-c11c.js）
  const twin = c11cGlowTwin(b, ev);
  if (twin) out.twin = twin;
  ev.c9Spica = out;
}

// ───────────── 行動の はじめ（battle-c8r.js の c8rTurnStart の はじめ。敵の 番だけ）─────────────
export function c9aTurnStart(b, c, ev, stuck) {
  if (c.side === 'ally') return;
  if (c.c9t) trioTurn(b, c, ev, stuck);
  else if (c.c9h) trialTurn(b, c, ev, stuck);
  // 第3部 第1章 第2幕・第3幕（battle-c9b.js・battle-c9c.js）
  else c9bTurnStart(b, c, ev, stuck);
}

function trioTurn(b, c, ev, stuck) {
  const t = c.c9t;
  const tc = trioConf(c, b);
  if (c.telegraph) return;
  t.acts++;
  // すいこみ口が こわれて いる: 1回 休む → fix 回 動くと 直る
  if (t.broken) {
    t.fix++;
    if (t.rest > 0) {
      t.rest--;
      if (!stuck) c.telegraph = REST;
    }
    if (t.fix >= tc.fix && fixNozzle(b, c, ev)) {
      t.broken = false;
      t.aimLeft = tc.aim;
    } else ev.c9tFixLeft = { id: c.id, left: Math.max(0, tc.fix - t.fix) };
    ev.upd.push(c);
    return;
  }
  // すいこみ口を 向けて いる: すいこむ（人が 少ない ときは wait 回 ふつうに 動いて から）
  if (t.aim) {
    if (t.wait > 0) {
      t.wait--;
      ev.c9tWait = { id: c.id, left: t.wait };
      ev.upd.push(c);
      return;
    }
    if (!stuck) c.telegraph = SUCK;
    ev.upd.push(c);
    return;
  }
  t.aimLeft--;
  if (t.aimLeft <= 0 && !stuck) c.telegraph = AIM;
  ev.c9tAimLeft = { id: c.id, left: Math.max(0, t.aimLeft), every: tc.aim };
  ev.upd.push(c);
}
// すいこみ口が 直る（たおれた すいこみ口を もう一度 出す。クライアントは「生き返った 敵」と おなじ）
function fixNozzle(b, c, ev) {
  const n = nozzleOf(b);
  if (!n) return false;
  if (!n.alive) {
    Object.assign(n, { alive: true, hp: n.maxHp, status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false });
    ev.upd.push(n);
  }
  c.c9t.fixes++;
  ev.lines.push('ボヤッチ「すいこみ口、なおったでございマス！」', 'キラジョ「さあ、もう一度、ねらうのよ！」');
  ev.c9tFix = { id: c.id, nozzle: n.id };
  return true;
}

function trialTurn(b, c, ev, stuck) {
  const h = c.c9h;
  const hc = trialConf(c, b);
  if (c.telegraph || h.won) return;
  // 1つの 番に 2回 動く（turns: 2）ときは、はじめの 1回で めもり・いぶきを 数える（あとの 1回は ふつうの 行動。battle.js の onReady）
  if ((c.turns || 1) > 1 && !c.queued) return;
  h.acts++;
  // 夜明けの めもり（ともしびが 1つでも あれば）。大きな ダメージを 与えた 番は もう 1つ
  const gain = (litAllies(b).length ? 1 : 0) + (h.dmg >= hc.big ? 1 : 0);
  if (h.dmg >= hc.big) {
    h.bigs++;
    ev.lines.push('（大きな一撃で、夜明けが、ぐっと近づいた！）');
  }
  h.dmg = 0;
  h.dawn = Math.min(h.max, h.dawn + gain);
  ev.c9hDawn = { id: c.id, dawn: h.dawn, max: h.max, gain };
  if (h.dawn >= h.max) {
    c.telegraph = DAWN;
    ev.upd.push(c);
    return;
  }
  if (h.aim.length) {
    if (h.wait > 0) {
      h.wait--;
      ev.c9hWait = { id: c.id, left: h.wait };
      ev.upd.push(c);
      return;
    }
    if (!stuck) c.telegraph = BREATH;
    ev.upd.push(c);
    return;
  }
  h.left--;
  if (h.left <= 0) {
    const n = h.dawn > h.max * hc.two ? 2 : 1;
    const pool = litAllies(b);
    const aim = [];
    while (aim.length < n && pool.length) aim.push(pool.splice(b.rng.int(0, pool.length - 1), 1)[0]);
    if (aim.length) {
      h.aim = aim.map((x) => x.id);
      h.wait = hc.bwait;
      ev.lines.push(`${c.name}が、大きく息をすいこんだ…！`, `（ねらいは${aim.map((x) => x.name).join('と')}のともしび…！身を守るか、消えたら「明かりをわける」！）`);
      ev.c9hWarn = { id: c.id, ids: h.aim.slice() };
      ev.warn = true;
    } else h.left = hc.every;
  }
  ev.c9hBreathLeft = { id: c.id, left: Math.max(0, h.left), every: hc.every };
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-c8r.js の c8rEffect の のこり）─────────────
export function c9aEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c9tAim': aim(b, c, ev); return true;
    case 'c9tSuck': suck(b, c, ev); return true;
    case 'c9tRest': {
      ev.lines.push('ボヤッチ「直しているあいだは、動けないでございマス〜！」');
      ev.c9tRest = { id: c.id };
      return true;
    }
    case 'c9hBreath': breath(b, c, ev); return true;
    case 'c9hDawn': dawn(b, c, ev); return true;
    case 'c9aShare': share(b, c, ev); return true;
    // 第3部 第1章 第2幕（battle-c9b.js）
    default: return c9bEffect(b, c, a, eff, ev);
  }
}

function aim(b, c, ev) {
  const t = c.c9t;
  if (!t) return;
  t.aim = true;
  t.wait = trioConf(c, b).wait;
  ev.lines.push('すいこみ口が、星の子の方を向いた！', t.wait > 0
    ? '（もうすこしで、すいこまれる…！だれかが「防御」で、星の子の前に立とう！）'
    : '（次にメカが動くと、すいこまれる…！だれかが「防御」で、星の子の前に立とう！）');
  ev.c9tAim = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}
// 星の子の 前に 立つ 人（身を 守って いる・みんなを かばって いる。HPの 多い 人）
export function guardOf(b) {
  const g = b.aliveAllies().filter((x) => x.defending || (x.cover && (x.cover.target === 'all' || x.cover.left > 0)));
  return g.sort((x, y) => (y.defending ? 1 : 0) - (x.defending ? 1 : 0) || y.hp - x.hp)[0] || null;
}
function suck(b, c, ev) {
  const t = c.c9t;
  const tc = trioConf(c, b);
  const s = b.c9sp || addSpica(b);
  t.aim = false;
  t.aimLeft = tc.aim;
  t.sucks++;
  const g = guardOf(b);
  if (g) {
    t.guards++;
    ev.lines.push(`${g.name}が、星の子の前に立って、すいこみを受けとめた！`);
    ev.fx = { type: 'ability', anim: 'c9t_suck', actor: c.id, targets: [g.id], side: 'enemy' };
    // 人が 動かす キャラ（家族の キャラ）が 受けとめる ときは、人数で 合わせる（few.guard）
    b.physHit(c, g, { mult: tc.suck.mult * (g.kind === 'player' ? tc.guard : 1), acc: 9 }, ev, 'phys');
    ev.c9tSuck = { id: c.id, guard: g.id, light: s.light };
    ev.upd.push(c);
    return;
  }
  // 守れなかった: 星の子の 光が 1つ へる → メカが 回復して 強く なる
  s.light = Math.max(0, s.light - 1);
  t.lost++;
  const heal = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * tc.lost.heal));
  c.hp += heal;
  t.power *= tc.lost.up;
  c.atk = Math.round(t.atk0 * t.power);
  ev.fx = { type: 'ability', anim: 'c9t_suck', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.results = ev.results || [];
  if (heal > 0) ev.results.push({ id: c.id, heal });
  ev.lines.push('スピカ「きゃっ…！」', `星の子の光が、1つすいこまれてしまった…！（${stars(s.light, s.max)}）`);
  if (heal > 0) ev.lines.push(`${c.name}のHPが${heal}回復した！`);
  ev.lines.push('ズラッカ「光をすったら、力がわいてきたっぺ！」（メカの攻撃力が上がった）');
  ev.c9tSuck = { id: c.id, guard: null, light: s.light };
  ev.c9Spica = { light: s.light, max: s.max, lost: true };
  ev.warn = true;
  ev.upd.push(c);
  if (s.light <= 0) {
    post(ev).push('星の子の光が、全部すいこまれてしまった…。');
    b.pendingEnd = { outcome: 'lose' };
    b.queue = [];
  }
}

function breath(b, c, ev) {
  const h = c.c9h;
  const hc = trialConf(c, b);
  const ids = h.aim.slice();
  h.aim = [];
  h.left = hc.every;
  h.breaths++;
  const targets = ids.map((id) => b.get(id)).filter((x) => x?.alive);
  ev.fx = { type: 'ability', anim: 'c9h_breath', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', element: 'dark' };
  const out = [];
  const kept = [];
  for (const t of targets) {
    const r = b.calcMagic(c, t, { base: hc.breath, thr: 99, element: 'dark' }, 1);
    if (r.dmg > 0 && !r.resisted) b.damage(c, t, Math.round(r.dmg), ev, { element: 'dark' });
    if (!t.alive || !t.c9torch) continue;
    if (t.defending) {
      kept.push(t.id);
      h.kept++;
      ev.lines.push(`${t.name}は、ともしびを手でかこって守った！`);
    } else {
      t.c9torch = false;
      out.push(t.id);
      h.outs++;
      ev.lines.push(`${t.name}のともしびが、ふっと消えた…！`);
    }
    ev.upd.push(t);
  }
  ev.c9hBreath = { id: c.id, out, kept };
  ev.warn = true;
  darkCheck(b, ev);
}
// 全員の ともしびが 消えた: まっくらで 負け
function darkCheck(b, ev, but = null) {
  const h = hoshimoriOf(b);
  if (!h?.c9h || h.c9h.won || b.pendingEnd || b.over) return;
  const alive = b.aliveAllies().filter((x) => x !== but);
  if (!alive.length || litAllies(b, but).length) return;
  h.c9h.dark = true;
  if (ev) {
    post(ev).push('あたりが、まっくらになってしまった…。', 'ホシモリ「…明かりは、つながらなかったか。」');
    ev.c9hDark = { id: h.id };
  }
  b.pendingEnd = { outcome: 'lose' };
  b.queue = [];
}
// 夜明け（たおれずに うなずく。たおした ことに して 経験値・お金・落とし物は ふつう）
function dawn(b, c, ev) {
  const h = c.c9h;
  h.won = true;
  ev.lines.push('星の石の根に、夜明けの光が、とどいた…！', `${c.name}は、しずかに、うなずいた。`, `${c.name}「…よくぞ、明かりをつないだ。」`);
  ev.fx = { type: 'ability', anim: 'c9h_dawn', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.c9hWin = { id: c.id };
  b.killed.push(c.species);
  c.telegraph = null;
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
  ev.upd.push(c);
}
// 明かりを わける（ともしびが ある 人 → 仲間 1人）
function share(b, c, ev) {
  const h = hoshimoriOf(b);
  const t = (ev.fx?.targets || []).map((id) => b.get(id))[0] || null;
  if (!h?.c9h) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  if (!c.c9torch) {
    ev.lines.push('しかし、自分のともしびが消えている！');
    return;
  }
  if (!t?.alive) {
    ev.lines.push('しかし、わける相手がいない！');
    return;
  }
  if (t.c9torch) {
    ev.lines.push(`${t.name}のともしびは、もうついている。`);
    return;
  }
  t.c9torch = true;
  h.c9h.shares++;
  ev.lines.push(`${t.name}のともしびが、ふたたびともった！`);
  ev.c9hShare = { by: c.id, to: t.id };
  ev.upd.push(t, c);
}

// ───────────── ダメージ（battle-c8r.js の c8rDamage の はじめ。味方 → 敵 だけ）─────────────
// ともしびが 消えた 人の 攻撃は 半分・ホシモリは HP 1 より 下がらない（与えた ダメージは めもりの「大きな 一撃」に 数える）
export function c9aDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally') return dmg;
  if (b.c9trial && !c.c9torch) {
    dmg = Math.max(1, Math.round(dmg * trialConf(hoshimoriOf(b)).half));
    if (!ev.c9hHalf) {
      ev.c9hHalf = true;
      post(ev).push(`（${c.name}のともしびが消えているので、力が半分…）`);
    }
  }
  if (t.c9h) {
    dmg = Math.max(0, Math.min(dmg, t.hp - 1));
    t.c9h.dmg += dmg;
  }
  // 第3部 第1章 第2幕: 大王は すわりこむ（battle-c9b.js）
  return c9bDamage(b, c, t, dmg, info, ev);
}
// 回復の 強さ（battle.js の heal）。ともしびが 消えた 人の 回復は 半分
export function c9aHealMul(b, c) {
  if (!b?.c9trial || c?.side !== 'ally' || c.c9torch) return 1;
  return trialConf(hoshimoriOf(b)).half;
}

// ───────────── たおれた（battle-c8r.js の c8rKill の はじめ。t.alive は まだ true）─────────────
export function c9aKill(b, t, ev) {
  if (!t) return;
  // 第3部 第1章 第2幕: 皿を こわした（battle-c9b.js）
  c9bKill(b, t, ev);
  // ためし: たおれた 人の ともしびは 消える → まっくらか
  if (t.side === 'ally' && b.c9trial) {
    if (t.c9torch && ev) post(ev).push(`${t.name}のともしびも、消えてしまった…。`);
    t.c9torch = false;
    darkCheck(b, ev, t);
    return;
  }
  if (t.side !== 'enemy' || !b.c9trio) return;
  const m = mechaOf(b);
  // すいこみ口を こわした: すいこみは 止まり、メカは 1回 休む
  if (t.species === C9A_NOZZLE && m?.alive && m.c9t) {
    const k = m.c9t;
    const wasAim = k.aim;
    Object.assign(k, { broken: true, rest: 1, fix: 0, aim: false, aimLeft: trioConf(m).aim });
    k.breaks++;
    if (m.telegraph === SUCK || m.telegraph === AIM) m.telegraph = null;
    if (ev) {
      post(ev).push('すいこみ口が、ボカーンとこわれた！', 'ボヤッチ「あわわ、すいこみ口がーっ！」', wasAim ? '（すいこみが止まった！メカは、しばらく動けない…！）' : '（メカは、しばらく動けない…！）');
      ev.c9tBreak = { id: m.id, nozzle: t.id, stop: wasAim };
      ev.upd.push(m);
    }
    return;
  }
  // メカを たおした: すいこみ口も いっしょに。3人組は 空の かなたへ
  if (t === m) {
    const n = nozzleOf(b);
    if (n?.alive) {
      b.kill(n, null, ev);
      if (ev) ev.upd.push(n);
    }
    if (ev) {
      post(ev).push(
        'スイトール1号が、プスプスとけむりを上げ始めた…！',
        'キラジョ「ちょっとボヤッチ！なんとかしなさいよ！」',
        'ボヤッチ「もう、むりでございマ〜ス！」',
        'ドッカーン！！',
        'ホシドロ一味は、空のかなたへ、ふっとんでいった…',
        'ズラッカ「おぼえてろだっぺ〜！」',
      );
      ev.c9tDown = { id: m.id };
    }
  }
}

// ───────────── オート（battle-c8r.js の c8rPlan の はじめ）─────────────
// 第3部 第1章 第1幕の しかけが なければ null（ほかの ボスの 考えへ）。ふつうの オートも null（しくみを 使わない）
const hurtCmd = (a) => a && ['enemy', 'group', 'enemies'].includes(a.target) && ['phys', 'magic'].includes(prim(a).type);
// 1人ずつの 知りかた（c.knows9。シミュレーターが 人数ごとに 入れる）が あれば そちらを 先に 見る
export const AUTO_SHARE_EVERY = 3;
export function c9aPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift) return null;
  // 第3部 第1章 第2幕: デデドン大王（battle-c9b.js）
  const p9b = c9bPlan(b, c, decide, bestHit);
  if (p9b !== undefined) return p9b;
  const mode = c.knows9 ?? b.knowsCh9;
  const m = mechaOf(b);
  const h = hoshimoriOf(b);
  if (!(m?.alive && m.c9t) && !(h?.alive && h.c9h)) return null;
  if (mode !== 'know' && mode !== 'blind') return h?.c9h ? autoShare(b, c) : null;
  if (m?.c9t) return trioPlan(b, c, m, mode, decide);
  return trialPlan(b, c, h, mode, decide);
}
function base(b, c, decide) {
  b.c9Inner = true;
  try {
    return decide(b, c);
  } finally {
    b.c9Inner = false;
  }
}
function trioPlan(b, c, m, mode, decide) {
  const t = m.c9t;
  const n = nozzleOf(b);
  const guarded = guardOf(b) || b.queue.some((q) => q.cmd?.type === 'defend');
  // 前ぶれ: だれも 守って いなければ 自分が 星の子の 前に 立つ（知らない 人は たまに 気づく）
  if (t.aim && !guarded && (mode === 'know' || b.rng.chance(0.12))) return { type: 'defend' };
  if (mode !== 'know') return null;
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  // だれかが とても あぶない ときの 回復・生き返りは そのまま
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  // すいこみ口が もうすぐ 向く・向いて いる 間は、すいこみ口を こわしに いく
  if (n?.alive && (t.aim || t.aimLeft <= 1)) {
    if (hurtCmd(a) && a.target !== 'enemy') return cmd;
    const hit = bestHit(b, c, n);
    if (hit) return hit;
  }
  // ふだんは メカの 本体を ねらう
  if (cmd?.type === 'attack' && cmd.target === n?.id) return { type: 'attack', target: m.id };
  if (a?.target === 'enemy' && cmd.target === n?.id) return { ...cmd, target: m.id };
  return cmd;
}
function trialPlan(b, c, h, mode, decide) {
  const hh = h.c9h;
  // 知っている 人が 少ない（家族の キャラが 2人 まで）: 自分が ねらわれて いれば、わけるより 先に 身を 守る（自分の 火が 消えると わけられない）
  if (mode === 'know' && peopleOf(b) <= 2 && hh.aim.includes(c.id) && !c.defending) return { type: 'defend' };
  // ともしびが 消えた 仲間に 明かりを わける（だれかが 行って いれば ほかは ふつう。知らない 人は たまに 気づく）
  if (c.c9torch && canUse(b, c, SHARE) && (mode === 'know' || b.rng.chance(0.18))) {
    const t = unlitAllies(b).find((x) => !b.queue.some((q) => q.cmd?.id === SHARE && q.cmd.target === x.id));
    if (t) return { type: 'ability', id: SHARE, target: t.id };
  }
  if (mode !== 'know') return null;
  // やみの いぶきで ねらわれて いる: 身を 守る（手で かこう）
  if (hh.aim.includes(c.id) && !c.defending) return { type: 'defend' };
  return base(b, c, decide);
}
// 自動の 人の 仲間（酒場の 人・家族の キャラの 仲間・ゲスト）: ともしびが 消えた 仲間が いて、自分の 火が ある 番の 3回に 1回だけ 明かりを わける
//   （ひとりで 遊ぶ 家族の ため。数は 自動の 仲間 みんなで 1つ … 何人 いても 3回に 1回。
//    全員 オートだと それでも 間に あわずに 負ける。いぶきから 身を 守る ことは しない）
//   魔物の 仲間は わけない（魔物の 仲間は かたくて、わけまで すると 完全オートでも 5わり 勝って しまう。tools/sim-ch9.mjs の k1mon）
function autoShare(b, c) {
  // 家族の キャラ（kind 'player'）の「オート」は 今までどおり（完全オートは 勝てない まま）
  // 第101回 R3班: 自動の 仲間が しくみを 使うのは、人が えらんで いる 時だけ（第2章と 同じ きまり。battle-c10a.js の someoneChooses。完全オートは 勝てない）
  if (c.kind === 'player' || c.kind === 'monster' || !c.c9torch || !canUse(b, c, SHARE) || !someoneChooses(b)) return null;
  const t = unlitAllies(b).find((x) => !b.queue.some((q) => q.cmd?.id === SHARE && q.cmd.target === x.id));
  if (!t) return null;
  b.c9autoShare = (b.c9autoShare || 0) + 1;
  if (b.c9autoShare % AUTO_SHARE_EVERY) return null;
  return { type: 'ability', id: SHARE, target: t.id };
}
// その 敵に いちばん 大きい ダメージの 1回の 行動
export function bestHit(b, c, t) {
  const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
  let best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit };
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || a.target !== 'enemy' || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, e.element || 'phys', true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    else continue;
    if (dmg > best.dmg) best = { cmd: { type: 'ability', id, target: t.id }, dmg };
  }
  return best.dmg > 0 ? best.cmd : null;
}

// ───────────── 大技が 近いか（c の 次の 番より 先に メカ・ホシモリが 動くか）─────────────
export function c9aSoon(b, c, e) {
  if (!e?.alive) return false;
  const re = atbRate(e);
  if (!(re > 0)) return false;
  const t0 = e.ready || e.queued ? 0 : (100 - e.atb) / re;
  return t0 <= 100 / atbRate(c);
}

// ───────────── がめんへ（battle.js の pub の さいご。味方も 敵も）─────────────
// 味方: torch9（ともしび 1 ついて いる・0 消えた。ためしの 戦いだけ）
// スイトール1号: c9Aim（向けて いる）・c9AimLeft・c9AimEvery・c9Broken（すいこみ口が こわれて いる）・c9FixLeft
// すいこみ口: c9Nozzle / ホシモリ: hmDawn・hmDawnMax・hmBreathLeft・hmBreathEvery・hmBreathAim（ねらう 人の id）・hmWin（うなずいた）
export function c9aPub(c) {
  const o = {};
  if (c.side === 'ally') {
    if (c.c9torch !== undefined) o.torch9 = c.c9torch ? 1 : 0;
    // 第3部 第2章 第1幕: あつさ・カビ（battle-c10a.js）
    // 第3部 第2章 第3幕: うき石・せまい（battle-c10c.js）
    // 第3部 第2章 第4幕: 色の しるし（battle-c10d.js）
    return Object.assign(o, c10aAllyPub(c), c10cAllyPub(c), c10dAllyPub(c), c11aAllyPub(c), c11bAllyPub(c), c11cAllyPub(c));
  }
  if (c.c9t) {
    const t = c.c9t;
    const tc = trioConf(c);
    o.c9Aim = t.aim ? 1 : 0;
    o.c9AimLeft = t.broken ? 0 : t.aimLeft;
    o.c9AimEvery = tc.aim;
    o.c9Broken = t.broken ? 1 : 0;
    o.c9FixLeft = t.broken ? Math.max(0, tc.fix - t.fix) : 0;
  }
  if (c.species === C9A_NOZZLE) o.c9Nozzle = 1;
  if (c.c9h) {
    const h = c.c9h;
    o.hmDawn = h.dawn;
    o.hmDawnMax = h.max;
    o.hmBreathLeft = h.aim.length ? 0 : h.left;
    o.hmBreathEvery = h.every ?? trialConf(c).every;
    o.hmBreathAim = h.aim.slice();
    o.hmWin = h.won ? 1 : 0;
    // 曲の もりあがり（client/audio-scene.js の addFormKey('dawnStage')）: 1 夜・2 夜明け前・3 夜明け・4 夜明けの さいご
    o.dawnStage = dawnStage(h.dawn, h.max, h.won);
  }
  // 第3部 第1章 第2幕: 大王・皿・見えにくい 魔物（battle-c9b.js）
  return Object.assign(o, c9bPub(c));
}
// 夜明けの めもりの 段（docs/plan-part3.md の「実装メモ（F班）」… めもり 16 の 0〜4 → 1・5〜9 → 2・10〜13 → 3・14〜 → 4。
//   人数で めもりの 数が かわるので、わりあいで きめる）
export function dawnStage(dawn, max, won = false) {
  if (won || !(max > 0)) return 4;
  const r = dawn / max;
  return r >= 14 / 16 ? 4 : r >= 10 / 16 ? 3 : r >= 5 / 16 ? 2 : 1;
}
// クライアントへ おくる じょうほう（battle.js の snapshot）
export function c9aSnap(b) {
  return spicaPub(b);
}
// pub を 使う ところ（テストの ため）
export const c9aPubOf = (c) => ({ ...pub(c) });
