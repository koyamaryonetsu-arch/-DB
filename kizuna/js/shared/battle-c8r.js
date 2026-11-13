// 第2部 第8章 第4幕「時のはざま」の 戦いの しかけ（battle-c8c.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・時の門番フリーゾン（monsters-c8r.js の c8r.kind 'gate'。広間に 3回 あらわれる）
//   第1形態（c8_gate1）… HP が leaveAt より へるか、leaveActs 回 動くと 去る（勝ち。とちゅうで 終わる 戦い）
//   第2形態（c8_gate2）… HP が leaveAt より へると 去る。見くだしの かまえ（下の stance）の おためし
//   第3形態（c8_gatekeeper。Step 7 の さいご）→ HP が finalAt より へると 最終形態（m8g_final。それまで HP は finalAt より 下がらない）
//   見くだしの かまえ（stance）: かまえて いる 間、味方の 攻撃は 指 1本で 受け流される（ダメージ stance.cut ばい）。
//     つながる攻撃（フリーゾンが 動いてから 次に 動くまでに、ちがう 仲間が need 人 当てる）か、合体技が 当たると くずれる
//     （stance.open 回 動く 間 ダメージ stance.weak ばい）。最終形態に なる とき リオンの「弱くても、ひとりじゃない」で need が 1 へる
//   時の大玉（orb）: orb.every 回 動く たびに 大玉を ためる（前ぶれ）→ 次の 番に はなつ（みんなに 光の 大技。身を 守ると 半分）。
//     はなつ 時に かまえが くずれて いると、大玉は 消える（m8g_orbfail）
// ・心の ためし「守りぬく」（c8r.kind 'wind'。月のつばさ・カリム）: やみの風（たおせない）が winActs 回 ふくまで、ともしび（味方の がわの 灯。動かない）を 守る。
//   ふきけし小おに（たおすと respawn 回 あとに また 来る）が ともしびを ふく。やみの風は gust.every 回ごとに「大風」（前ぶれ → ともしびへ。
//   身を 守る 人が いると 半分・かばう 人が いると その 人が うける）。ともしびが 消えると 負け・夜が 明けると 勝ち。弱体（攻撃力ダウン）も 効く
// ・心の ためし「一騎うち」（c8r.kind 'duel'。氷のつばさ・リオン）: リオン ひとりが 見くだす影と 1対1。
//   リオンは パーティーの ゲスト（いなければ ここで 作る。強さは 第78回の きまりの 形）。人の 家族が いると、さいしょの 人が リオンを 動かす。
//   ほかの 人は「おうえん」だけ（技は おうえん 3つ。ふつうの 攻撃・攻撃の 技は おうえん〈力〉に かわる。回復・強くする 技は リオンに 届く）。
//   おうえんで「ゆうき」が たまり、courage こ で リオンの 次の 攻撃が「ゆうきの一撃」（power ばい）。影の 大剣（big.every 回ごと。前ぶれ）は 身を 守ると 半分。
//   見くだすことば（リオンの 攻撃力ダウン）は、その 前の 自分の 番から おうえんが あれば 効かない。リオンが たおれると 負け
// ・ソリトゥスの 本当の すがた（c8r.kind 'solitus'。3だん）
//   ① くらい心（よくばり・いかり・ひとりじめ・見くだす）を 1つずつ まとう。HP が その 心の さかい（heartAt）まで へると 心が ゆらぐ
//      （それまで HP は さかいより 下がらない）。ゆらいで いる 間に「よびかける」（m8s_call。みんなが 使える 技）で 心が はがれる。
//      waver 回 動く 間に よびかけないと、心が かたまる（HP が harden もどる）。はがれた 心の 持ち主が 1回だけ 手を かす:
//      ジャハール … へびで ソリトゥスを 1回 しばる / ハデロス … 青い火で みんなの 力（攻撃・魔力）を 上げる / クッパード … 大きな こうらで 次の 攻撃を 1回 ふせぐ /
//      フリーゾン（さいご）… ぶつぶつ 言いながら 指で はじく（ダメージ）。big.every 回ごとに「くらい心の あらし」（前ぶれ。身を 守ると 半分）
//   ② ひとりぼっちの 星: alone.every 回ごとに 1人を ひとりに する（battle-earth.js の trap。仲間が「よびかける」と もどる）。
//      ひとりの 人が いる 間は ダメージ alone.cut ばい。tear.every 回ごとに「星の なみだ」（ひとりの 人が 多いほど 強い）。
//      HP が 1 で 心が ゆらぎ、「よびかける」で ③へ
//   ③ 千年の約束: みんなが 動くと 光が たまる（promise.per・かけつけで promise.help）。100 で「千年の約束」（m8s_promise）。
//      HP は 千年の約束で しか 0 に ならない（しめくくり）。crack.every 回ごとに「時の くずれ」（前ぶれ。身を 守ると 半分）
//   段が かわると みんな 生き返って 回復し、しるし（c8s_p2・c8s_p3）を つける（hooks.markFlag）。次の 戦いは その 段から（hooks.leaderFlag）
// ・かけつけ（門番の 本当の 戦い・ソリトゥス）: 戦う 人数の 上限に 入りきらない 4人の 勇者（と ソリトゥスでは 第1部の 仲間）が、
//   ボスが help.every 回 動く ごとに 1人ずつ 手だすけ（守り・攻撃・回復・力・MP）。戦いに 出て いる ゲストは かけつけない
// ・ふつうの オート（家族が「オート」に した とき）: 大技（時の大玉・大風・影の 大剣・くらい心の あらし・星の なみだ・時の くずれ）が 自分の 次の 番より 先に
//   来る とき、HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD。b.c6Naive … しない 人）。よびかける・千年の約束・おうえんの 使いわけは しない
// ・知っている 人（シミュレーター tools/sim-ch8.mjs。b.knowsCh6）:
//   門番 … 大玉を ためて いる 間・かまえの 間は いちばん 大きい 1回の 攻撃で つながる攻撃を つなぐ・大玉が とめられない ときは 身を 守る（b.c8rNoChain・b.c6NoGuard）
//   守りぬく … 小おにを 先に たおす・ともしびの HP が へったら 回復・大風の 前に 身を 守る（b.c8rNoPuff）
//   一騎うち … おうえんを 使いわける・大剣の 前に リオンは 身を 守る
//   ソリトゥス … 心が ゆらいだら すぐ よびかける（b.c8rNoCall）・ひとりの 仲間に よびかける・大技の 前に 身を 守る・千年の約束を 使う
import { MONSTERS } from './data/monsters.js?v=1ce6e2458180';
import { ABILITIES } from './data/abilities.js?v=1ce6e2458180';
import { GUESTS } from './data/shops.js?v=1ce6e2458180';
import {
  C8_WIND, C8_PUFF, GATE_FINAL_ACTIONS, FINAL_NAME, HEARTS, HEART_ACTIONS, STAR_ACTIONS, PROMISE_ACTIONS,
} from './data/monsters-c8r.js?v=1ce6e2458180';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub, allyFromCharacter } from './battle.js?v=1ce6e2458180';
import { canUse } from './ai.js?v=1ce6e2458180';
import { AUTO_GUARD } from './battle-ch6.js?v=1ce6e2458180';
import { trap } from './battle-earth.js?v=1ce6e2458180';
import { fightPower, scaleGuestActor } from './guest-rule.js?v=1ce6e2458180';
import { makeNpcSupportChar } from './world/party.js?v=1ce6e2458180';

export const ORB = 'm8g_orb';
export const ORBFAIL = 'm8g_orbfail';
export const FINAL = 'm8g_final';
export const LEAVE = 'm8g_leave';
export const GUST = 'm8t_gust';
export const PUFF = 'm8t_puff';
export const DAWN = 'm8t_dawn';
export const BIG_SLASH = 'm8d_big';
export const CHEERS = ['m8d_cheer_pow', 'm8d_cheer_def', 'm8d_cheer_heal'];
export const CALL = 'm8s_call';
export const PROMISE = 'm8s_promise';
export const SL_BIG = 'm8s_big';
export const HARDEN = 'm8s_harden';
export const BOUND = 'm8s_bound';
export const ALONE_S = 'm8s_alone';
export const TEAR = 'm8s_tear';
export const CRACK = 'm8s_crack';
export const SHELL = 'm8s_shell';
export const PROMISE_MAX = 100;
// 心の 名前・持ち主
export const HEART_NAME = { greed: 'よくばりの心', anger: 'いかりの心', hoard: 'ひとりじめの心', scorn: '見くだす心' };
export const HEART_OWNER = { greed: 'ジャハール', anger: 'ハデロス', hoard: 'クッパード', scorn: 'フリーゾン' };
// かけつけの 人（name … 戦いに 出て いる ゲストと くらべる 名前）
export const HELPERS = {
  karim: { name: 'カリム', say: '「みんなは、ぼくが守る！」', kind: 'guard' },
  kai: { name: 'カイ', say: '「いっくぜー！つながる、ブーメラン！」', kind: 'hit', k: 0.018 },
  minamo: { name: 'ミナモ', say: '「星よ、みんなをいやして…！」', kind: 'heal', k: 0.18 },
  rion: { name: 'リオン', say: '「ぼくも、いっしょに戦う！」', kind: 'power' },
  nocto: { name: 'ノクト', say: '「…ぼくの影も、かしてやる。」', kind: 'hit', k: 0.022 },
  sara: { name: 'サラ', say: '「みんな、もうちょっとだよ！」', kind: 'heal', k: 0.16 },
  luca: { name: 'ルカ', say: '「とりゃーっ！ホシフル村の、とびげり！」', kind: 'hit', k: 0.016 },
  baba: { name: 'ばあちゃん', say: '「ほれ、まじないじゃ。元気をお出し。」', kind: 'mp', k: 0.15 },
  astel: { name: '星の竜アステル', say: '「千年の約束、わたしも見とどけよう。」', kind: 'hit', k: 0.026 },
};
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const confOf = (m) => MONSTERS[m?.species]?.c8r || null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function gateConf(m) {
  const c = confOf(m) || {};
  return {
    form: c.form || 3, leaveAt: c.leaveAt ?? 0, leaveActs: c.leaveActs ?? 0,
    stance: c.stance ? { cut: 0.25, need: 3, open: 2, weak: 1.5, ...c.stance } : null,
    orb: c.orb ? { every: 4, base: [560, 600], ...c.orb } : null,
    finalAt: c.finalAt ?? 0,
    final: { atk: 1.08, speed: 1.12, orbEvery: 3, ...(c.final || {}) },
  };
}
export function windConf(m) {
  const c = confOf(m) || {};
  return { winActs: c.winActs ?? 8, gust: { every: 3, k: 0.45, ...(c.gust || {}) }, puffs: c.puffs ?? 2, respawn: c.respawn ?? 2, torch: { hp: 3200, def: 160, ...(c.torch || {}) } };
}
export function duelConf(m) {
  const c = confOf(m) || {};
  return { big: { every: 3, mult: 1.9, ...(c.big || {}) }, courage: c.courage ?? 3, power: c.power ?? 2.2 };
}
export function solConf(m) {
  const c = confOf(m) || {};
  return {
    stages: c.stages || [60000, 62000, 150000],
    heartAt: c.heartAt || [0.75, 0.5, 0.25, 0],
    waver: c.waver ?? 1, harden: c.harden ?? 0.08, hardenUp: c.hardenUp ?? 1.08,
    big: { every: 4, base: [470, 510], ...(c.big || {}) },
    alone: { every: 3, turns: 4, cut: 0.45, ...(c.alone || {}) },
    tear: { every: 4, base: [470, 510], per: 0.3, ...(c.tear || {}) },
    crack: { every: 3, base: [520, 560], ...(c.crack || {}) },
    promise: { per: 7, help: 12, dmg: 0.2, heal: 0.3, ...(c.promise || {}) },
  };
}
const gateOf = (b) => b.enemies.find((e) => e.c8g && e.alive) || null;
export const solOf = (b) => b.enemies.find((e) => e.c8s && e.alive) || null;
export const windOf = (b) => b.enemies.find((e) => e.c8w && e.alive) || null;
export const shadowOf = (b) => b.enemies.find((e) => e.c8d && e.alive) || null;
export const torchOf = (b) => (b.c8guard ? b.get(b.c8guard.torch) : null);
export const rionOf = (b) => (b.c8duel ? b.get(b.c8duel.rion) : null);
export const puffsAlive = (b) => b.enemies.filter((e) => e.alive && e.species === C8_PUFF);
// かまえを くずすのに いる つながる攻撃の 数
export function chainNeed(g, m) {
  const gc = gateConf(m);
  if (!gc.stance) return 0;
  const need = g.form === 4 ? gc.final.need ?? gc.stance.need : gc.stance.need;
  return Math.max(2, need - (g.rion ? 1 : 0));
}
export const stanceUp = (m) => !!m?.c8g && !!gateConf(m).stance && m.c8g.open <= 0;
// その 敵の ターンを すぐ 入れる（この 行動の すぐ あと。去る・へんしん）
function reactNow(b, t, id) {
  t.telegraph = id;
  b.queue = b.queue.filter((q) => q.id !== t.id);
  b.queue.unshift({ id: t.id, cmd: { type: 'ai' }, last: true });
  t.queued = true;
  t.ready = false;
}
// 味方の 1回の 行動の 中で、1回だけ ことばを 出す
function once(ev, key, lines) {
  if (ev[key]) return;
  ev[key] = true;
  post(ev).push(...lines);
}

// ───────────── はじめ（battle-c8c.js の setupC8c の さいご）─────────────
export function setupC8r(b) {
  const lines = [];
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    if (conf.kind === 'gate') setupGate(b, e, conf, lines);
    else if (conf.kind === 'wind') setupGuard(b, e, lines);
    else if (conf.kind === 'duel') setupDuel(b, e, lines);
    else if (conf.kind === 'solitus') setupSolitus(b, e, conf, lines);
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1400 });
}

function setupGate(b, e, conf, lines) {
  const gc = gateConf(e);
  e.c8g = { form: gc.form, acts: 0, open: 0, chain: 0, hitters: [], left: gc.orb?.every || 0, orb: false, rion: false, atk0: e.atk, spd0: e.speed || 1, breaks: 0, orbs: 0, stops: 0, defl: 0, leave: null };
  if (gc.form === 1) lines.push(`${e.name}「おやおや。ずいぶん小さなお客さまですね。」`, `${e.name}「少しだけ、遊んであげましょう。」`);
  else if (gc.form === 2) lines.push(`${e.name}「また会いましたね。今度は、少しだけ本気を出しましょう。」`, '（ばらばらの攻撃は、受け流されてしまう…！ちがう仲間がつづけて攻撃して、かまえをくずそう！）');
  else lines.push(`${e.name}「ここまで来るとは、ほめてあげましょう。」`, `${e.name}「でも、ここで、おしまいです。」`, '（ちがう仲間がつづけて攻撃するか、合体技で、見くだしのかまえをくずそう…！）');
  if (conf.help) setupHelp(b, e, conf.help);
}

// ───────────── かけつけ ─────────────
function setupHelp(b, boss, conf) {
  const here = new Set(b.allies.map((a) => a.name));
  const list = (conf.who || []).filter((id) => HELPERS[id] && !here.has(HELPERS[id].name));
  if (!list.length) return;
  b.c8help = { list, i: 0, every: conf.every || 2, cnt: 0, due: false, by: boss.id, n: 0 };
}
// （行動の はじめの しかけは 敵の 番だけ よばれる〈battle-ch6.js の ch6TurnStart〉ので、ボスが 動く 前に 手だすけ する）
function helperTurn(b, c, ev) {
  const h = b.c8help;
  if (!h || c.id !== h.by) return;
  h.cnt++;
  if (h.cnt < h.every) return;
  h.cnt = 0;
  doHelp(b, ev);
}
// 手だすけ（ボスが help.every 回 動く ごとに、ボスの 番の 前に 1つ。ことばは べつの まど）
export function doHelp(b, ev) {
  const h = b.c8help;
  const boss = h ? b.get(h.by) : null;
  if (!h || !boss?.alive) return null;
  const id = h.list[h.i % h.list.length];
  h.i++;
  h.n++;
  const hp = HELPERS[id];
  const lines = [`（かけつけ）${hp.name}${hp.say}`];
  const upd = [];
  const results = [];
  const allies = b.aliveAllies().filter((x) => !x.status?.rift && !x.c8torch);
  if (hp.kind === 'guard') {
    for (const x of allies) x.buffs.def = { mult: 1.2, base: 1.2, lv: 1, left: 3 };
    lines.push(`${hp.name}のたてが、みんなを守った！（みんなの守りが上がった）`);
    upd.push(...allies);
  } else if (hp.kind === 'power') {
    for (const x of allies) x.buffs.atk = { mult: 1.15, base: 1.15, lv: 1, left: 3 };
    lines.push(`${hp.name}のゆうきが、みんなに力をくれた！（みんなの攻撃力が上がった）`);
    upd.push(...allies);
  } else if (hp.kind === 'heal') {
    for (const x of allies) {
      const real = Math.min(x.maxHp - x.hp, Math.round(x.maxHp * hp.k));
      x.hp += real;
      results.push({ id: x.id, heal: real });
    }
    lines.push(`${hp.name}の歌で、みんなのHPが回復した！`);
    upd.push(...allies);
  } else if (hp.kind === 'mp') {
    for (const x of allies) x.mp = Math.min(x.maxMp, x.mp + Math.round(x.maxMp * hp.k));
    lines.push(`${hp.name}のおまじないで、みんなのMPが回復した！`);
    upd.push(...allies);
  } else {
    const d = safeHit(b, boss, Math.round(boss.maxHp * hp.k));
    if (d > 0) results.push({ id: boss.id, dmg: d });
    lines.push(`${boss.name}に${d}のダメージ！`);
    upd.push(boss);
  }
  // 千年の約束の 光も たまる
  if (boss.c8s?.stage === 3) addGauge(boss, solConf(boss).promise.help);
  const dur = 1600;
  b.emit({ t: 'msg', lines, upd: upd.map(pub), results, fx: { type: 'ability', anim: `c8r_help_${hp.kind}`, actor: boss.id, targets: hp.kind === 'hit' ? [boss.id] : allies.map((x) => x.id), side: 'ally' }, c8rHelp: { who: id, name: hp.name, kind: hp.kind }, dur });
  if (ev) ev.extraLock = (ev.extraLock || 0) + dur;
  return id;
}
// しかけの 床を こえない ダメージ（かけつけ・心の 持ち主の 手だすけ）
function safeHit(b, t, d) {
  const floor = floorOf(t);
  const dd = Math.max(0, Math.min(d, t.hp - Math.max(1, floor)));
  t.hp -= dd;
  return dd;
}
// その 敵の HP が 下がりきらない ところ（しかけの さかい）
function floorOf(t) {
  if (t.c8g) {
    const g = t.c8g;
    const gc = gateConf(t);
    if (g.form <= 2 && gc.leaveAt) return Math.ceil(t.maxHp * gc.leaveAt);
    if (g.form === 3 && gc.finalAt) return Math.ceil(t.maxHp * gc.finalAt);
    return 0;
  }
  if (t.c8s) {
    const s = t.c8s;
    if (s.stage === 1) return Math.max(1, Math.ceil(t.maxHp * solConf(t).heartAt[s.heart]));
    return 1;
  }
  return 0;
}

// ───────────── 守りぬく ─────────────
function setupGuard(b, wind, lines) {
  const wc = windConf(wind);
  wind.c8w = { acts: 0, left: wc.gust.every, gusts: 0, guarded: 0 };
  // ともしび（味方の がわ。動かない・回復や かばうは とどく）
  const n = b.combatants.filter((x) => x.side === 'ally').length;
  const torch = {
    side: 'ally', kind: 'guest', name: 'ともしび', charId: null, controller: null, auto: true, tactics: 'balanced', tacBy: null, manualTac: false,
    look: null, job: null, eq: '', mon: 'c8_torch', lv: wind.lv,
    maxHp: wc.torch.hp, hp: wc.torch.hp, maxMp: 0, mp: 0, atk: 0, dfn: wc.torch.def, agi: 1, mag: 0, healPow: 0,
    weaponCat: null, weaponId: null, acc: null, onHit: null, crit: 0, mpRegen: 0, resist: {}, race: 'material',
    abilities: [], autoOff: [], cmdOff: [], penChar: { job: null, jobs: {} }, favs: [], use: null, hiraNew: [],
    atb: 0, ready: false, queued: false, buffs: {}, debuffs: {}, status: {}, alive: true, charge: 1, cover: null,
    speed: 1e-6, c8torch: true, id: 'a' + n, slot: n,
  };
  b.combatants.push(torch);
  // ひとりや 2人で 戦う ときは、小おには 1ぴきずつ・来るのも おそい（ひとりでも とける）
  const few = b.allies.filter((x) => !x.c8torch).length <= 2;
  const puffs = few ? 1 : wc.puffs;
  for (const p of b.enemies.filter((e) => e.species === C8_PUFF).slice(puffs)) Object.assign(p, { fled: true, alive: false });
  b.c8guard = { torch: torch.id, wind: wind.id, due: 0, respawn: few ? wc.respawn + 1 : wc.respawn, puffs, win: wc.winActs, few };
  if (few) torch.maxHp = torch.hp = Math.round(torch.maxHp * 1.4);
  lines.push('やみの風が、ふきあれている…！', `（やみの風が${wc.winActs}回ふくまで、ともしびを守りぬこう！小おにはたおしても、また来る…！）`);
}
function windTurn(b, c, ev, stuck) {
  const w = c.c8w;
  const wc = windConf(c);
  const g = b.c8guard;
  if (c.telegraph) return;
  w.acts++;
  // 夜が 明けた（ふき おわった）
  if (w.acts > wc.winActs) {
    c.telegraph = DAWN;
    ev.upd.push(c);
    return;
  }
  // 小おにが また 来る
  if (g.due > 0) {
    g.due--;
    if (g.due === 0) {
      const room = Math.min(g.puffs - puffsAlive(b).length, 7 - b.aliveEnemies().length);
      if (room > 0) {
        const added = b.addEnemies(Array(room).fill(C8_PUFF));
        for (const m of added) m.atb = b.rng.float(0, 30);
        ev.lines.push(`${MONSTERS[C8_PUFF].name}が、また、ふわふわとやってきた！`);
        ev.joined = (ev.joined || []).concat(added.map(pub));
      }
    }
  }
  if (w.left <= 1) {
    if (!stuck) c.telegraph = GUST;
  } else {
    w.left--;
    if (w.left === 1) ev.lines.push(`${c.name}が、ごうごうと、うずをまき始めた…！`, '（次にやみの風が動くと、大風…！身を守るか、ともしびをかばおう！）');
    ev.c8tGustLeft = { id: c.id, left: w.left };
  }
  ev.c8tDawnLeft = { id: c.id, left: Math.max(0, wc.winActs - w.acts) };
  ev.upd.push(c);
}
// 大風（ともしびへ。身を 守る 人が いると 半分・かばう 人が いると その 人へ）
function gust(b, c, ev) {
  const w = c.c8w;
  const wc = windConf(c);
  w.left = wc.gust.every;
  w.gusts++;
  const torch = torchOf(b);
  if (!torch?.alive) return;
  const to = b.coverRedirect(torch);
  ev.pushCover = true;
  if (b.cur?.coverMsg) {
    ev.lines.push(b.cur.coverMsg);
    delete b.cur.coverMsg;
  }
  ev.fx = { type: 'ability', anim: 'c8t_gust', actor: c.id, targets: [to.id], side: 'enemy' };
  const k = c.debuffs?.atk ? c.debuffs.atk.mult : 1;
  if (to !== torch) {
    b.physHit(c, to, { mult: 1.2 * k, acc: 1.2 }, ev, 'phys');
  } else {
    let d = Math.round(wc.torch.hp * wc.gust.k * k);
    const guard = b.aliveAllies().find((x) => x.defending && !x.c8torch);
    if (guard) {
      d = Math.round(d * 0.5);
      w.guarded++;
      ev.lines.push(`${guard.name}が、ともしびを手でかこって守った！`);
    }
    b.damage(c, torch, d, ev, { element: 'wind' });
  }
  ev.c8tGust = { id: c.id, to: to.id };
  ev.warn = true;
  ev.upd.push(c);
}
// ふーっ（小おにが ともしびを ふく。かばう 人が いると その 人へ）
function puff(b, c, ev) {
  const torch = torchOf(b);
  if (!torch?.alive) return;
  const to = b.coverRedirect(torch);
  if (b.cur?.coverMsg) {
    ev.lines.push(b.cur.coverMsg);
    delete b.cur.coverMsg;
  }
  ev.fx = { type: 'ability', anim: 'c8t_puff', actor: c.id, targets: [to.id], side: 'enemy' };
  b.physHit(c, to, { mult: 1.0, acc: 1.2 }, ev, 'wind');
  ev.c8tPuff = { id: c.id, to: to.id };
}
function dawn(b, c, ev) {
  ev.lines.push('東の空が、明るくなってきた…！', '夜明けの光で、やみの風が、すうっと消えていく…！', 'ともしびを、守りぬいた！');
  ev.fx = { type: 'ability', anim: 'c8t_dawn', actor: c.id, targets: [c.id], side: 'enemy' };
  for (const e of b.enemies) if (e.alive && e !== c) b.kill(e, null, ev);
  b.kill(c, null, ev);
  ev.c8tDawn = { id: c.id };
  ev.upd.push(...b.enemies);
}

// ───────────── 一騎うち ─────────────
function setupDuel(b, sh, lines) {
  const dc = duelConf(sh);
  sh.c8d = { left: dc.big.every, bigs: 0, mocks: 0, blocked: 0 };
  let rion = b.allies.find((a) => a.name === 'リオン' && a.kind === 'guest');
  if (!rion) rion = addRion(b);
  if (!rion) return;
  rion.c8rion = true;
  // 人の 家族が いれば、さいしょの 人が リオンを 動かす（オートの ときは オート）
  const human = b.allies.find((a) => a.kind === 'player' && a.controller);
  if (human) {
    rion.controller = human.controller;
    rion.auto = !!human.auto;
  }
  for (const x of b.allies) {
    if (x === rion) continue;
    x.c8cheer = true;
    x.abilities = CHEERS.slice();
  }
  // おうえんの 人が 少ない（ひとり・2人）ときは、影も 小さい（ひとりでも とける）
  const n = b.allies.filter((x) => x.c8cheer).length;
  const k = n <= 1 ? { hp: 0.6, atk: 0.82 } : n === 2 ? { hp: 0.8, atk: 0.92 } : null;
  if (k) {
    sh.maxHp = sh.hp = Math.round(sh.maxHp * k.hp);
    sh.atk = Math.round(sh.atk * k.atk);
  }
  b.c8duel = { rion: rion.id, courage: 0, need: dc.courage, power: dc.power, ready: false, cheers: 0, strikes: 0, lastCheer: -1 };
  lines.push(`${sh.name}「おまえなんか、ひとりでは何もできない。」`, 'リオン「…それでも、ぼくは、にげない！」', '（リオンと影の、一騎うち…！みんなは「おうえん」で、リオンをささえよう！）');
}
// ゲストの リオンが いない ときは ここで 作る（第78回の きまりの 形: 家族の 人の 力の 平均の 0.94 くらい）
function addRion(b) {
  const def = GUESTS.rion8;
  if (!def) return null;
  const fam = b.allies.filter((a) => !a.mon && a.kind !== 'guest');
  const lv = clamp(Math.round(fam.reduce((s, a) => s + (a.lv || 1), 0) / Math.max(1, fam.length)) || def.minLevel, def.minLevel, def.minLevel + 8);
  const ch = makeNpcSupportChar({ ...def }, lv);
  if (!ch) return null;
  const a = allyFromCharacter(ch, { kind: 'guest', auto: true, tactics: ch.tactics });
  const n = b.combatants.filter((x) => x.side === 'ally').length;
  a.id = 'a' + n;
  a.slot = n;
  b.combatants.push(a);
  if (fam.length) {
    const want = (fam.reduce((s, x) => s + fightPower(x), 0) / fam.length) * 0.94;
    const k = clamp(want / Math.max(1, fightPower(a)), 0.85, 1.15);
    scaleGuestActor(a, k);
  }
  return a;
}
function duelTurn(b, c, ev, stuck) {
  const d = c.c8d;
  const dc = duelConf(c);
  // 見くだすことばは、前の 自分の 番から おうえんが あれば 効かない
  const r = rionOf(b);
  d.cheered = !!r?.c8cheered;
  if (r) r.c8cheered = false;
  if (c.telegraph) return;
  if (d.left <= 1) {
    if (!stuck) c.telegraph = BIG_SLASH;
  } else {
    d.left--;
    if (d.left === 1) ev.lines.push(`${c.name}が、かげの剣を、高くふりかぶった…！`, '（次に影が動くと、かげの大剣…！リオンは身を守ろう！）');
    ev.c8dBigLeft = { id: c.id, left: d.left, every: dc.big.every };
  }
  ev.upd.push(c);
}
function duelHit(b, c, ev, mult, big) {
  const r = rionOf(b);
  if (!r?.alive) return;
  ev.fx = { type: 'ability', anim: big ? 'c8d_big' : 'c8d_slash', actor: c.id, targets: [r.id], side: 'enemy' };
  b.physHit(c, r, { mult, acc: 1.2 }, ev, 'phys');
}
// おうえん（家族の キャラ）
function cheer(b, c, kind, ev) {
  const D = b.c8duel;
  const r = rionOf(b);
  if (!D || !r?.alive) {
    ev.lines.push('しかし、おうえんする相手がいない！');
    return;
  }
  ev.fx = { type: 'ability', anim: 'c8d_cheer', actor: c.id, targets: [r.id], side: 'ally' };
  if (kind === 'pow') b.applyBuff(c, r, { stat: 'atk', mult: 1.2 }, ev);
  else if (kind === 'def') b.applyBuff(c, r, { stat: 'def', mult: 1.3 }, ev);
  else {
    const real = Math.min(r.maxHp - r.hp, Math.round(r.maxHp * 0.22));
    r.hp += real;
    ev.results = ev.results || [];
    ev.results.push({ id: r.id, heal: real });
    ev.lines.push(real > 0 ? `${r.name}のHPが${real}回復した！` : `${r.name}のキズは、もうない！`);
  }
  D.cheers++;
  D.lastCheer = b.turnCount;
  r.c8cheered = true;
  if (!D.ready) {
    D.courage = Math.min(D.need, D.courage + 1);
    if (D.courage >= D.need) {
      D.ready = true;
      post(ev).push(`${r.name}のむねに、みんなの声がとどいた…！ゆうきが、いっぱいになった！`, `（${r.name}の次の攻撃は「ゆうきの一撃」！）`);
    } else post(ev).push(`（${r.name}のゆうき ${D.courage}/${D.need}）`);
  }
  ev.c8dCheer = { by: c.id, kind, courage: D.courage, ready: D.ready };
  ev.upd.push(r, c);
}

// ───────────── ソリトゥス ─────────────
function setupSolitus(b, s, conf, lines) {
  const sc = solConf(s);
  let start = 1;
  if (b.c8sStart) start = b.c8sStart;
  else {
    try {
      if (b.hooks?.leaderFlag?.('c8s_p3')) start = 3;
      else if (b.hooks?.leaderFlag?.('c8s_p2')) start = 2;
    } catch { /* */ }
  }
  s.c8s = {
    stage: 0, heart: 0, waver: 0, acts0: b.allyActs || 0, mag0: s.mag, left: sc.big.every, bound: 0, shell: 0, gauge: 0, peeled: [], hardens: 0, calls: 0, aloneN: 0, tears: 0, cracks: 0, promises: 0, bigs: 0, atk0: s.atk,
  };
  // みんなが「よびかける」を 使える
  for (const a of b.allies) if (!a.abilities.includes(CALL)) a.abilities = [CALL, ...a.abilities];
  if (conf.help) setupHelp(b, s, conf.help);
  goStage(b, s, start, null, lines);
}
function goStage(b, s, n, ev, out) {
  const sc = solConf(s);
  const st = s.c8s;
  st.stage = n;
  st.waver = 0;
  st.bound = 0;
  st.shell = 0;
  s.maxHp = s.hp = sc.stages[n - 1];
  s.telegraph = null;
  s.buffs = {};
  s.debuffs = {};
  const lines = out || post(ev);
  if (n === 1) {
    st.heart = 0;
    st.left = sc.big.every;
    s.actions = HEART_ACTIONS[HEARTS[0]].map((x) => ({ ...x }));
    lines.push('ソリトゥス「…また、来たのか。」', 'ソリトゥスのまわりに、4つのくらい心が、うずをまいている…！', `（今は「${HEART_NAME[HEARTS[0]]}」…！心がゆらいだら「よびかける」で、はがせるかもしれない）`);
  } else if (n === 2) {
    st.left = sc.alone.every;
    st.tearLeft = sc.tear.every;
    s.actions = STAR_ACTIONS.map((x) => ({ ...x }));
    lines.push('くらい心が、ぜんぶはがれた…！', 'ソリトゥス「…ひとりぼっちの、星。それが、ぼくの、本当のすがた。」', '（ひとりにされた仲間には、すぐ「よびかける」…！）');
  } else {
    st.left = sc.crack.every;
    st.gauge = 0;
    st.acts0 = b.allyActs || 0;
    s.actions = PROMISE_ACTIONS.map((x) => ({ ...x }));
    lines.push('時のはざまが、ガラガラと、くずれ始めた…！', 'ソリトゥス「どうして…どうして、ぼくを、ひとりにしないの…？」', '（千年前と今のみんなの光がたまったら「千年の約束」…！さいごは、千年の約束でしめくくろう）');
    for (const a of b.allies) if (!a.abilities.includes(PROMISE)) a.abilities = [PROMISE, ...a.abilities];
  }
  if (!ev) return;
  // 段が かわると、みんな 生き返って 回復する（次の 段から やり直せる しるし）
  const al = b.allies.filter((a) => !a.c8torch);
  st.hpBefore = al.reduce((t, a) => t + (a.alive ? a.hp : 0), 0) / Math.max(1, al.reduce((t, a) => t + a.maxHp, 0));
  st.deadBefore = al.filter((a) => !a.alive).length;
  for (const a of b.allies) {
    if (a.c8torch) continue;
    if (a.status?.rift) delete a.status.rift;
    a.alive = true;
    a.hp = a.maxHp;
    a.mp = Math.max(a.mp, Math.round(a.maxMp * 0.5));
    ev.upd.push(a);
  }
  lines.push('千年前と今のみんなの光が、仲間をつつんだ…！（みんなのHPが回復した）');
  try {
    b.hooks?.markFlag?.(`c8s_p${n}`);
  } catch { /* */ }
  ev.c8sStage = { id: s.id, stage: n };
  ev.upd.push(s);
}
export function addGauge(s, n) {
  const st = s?.c8s;
  if (!st || st.stage !== 3) return;
  const was = st.gauge;
  st.gauge = Math.min(PROMISE_MAX, st.gauge + n);
  if (was < PROMISE_MAX && st.gauge >= PROMISE_MAX) st.full = true;
}
function solTurn(b, c, ev, stuck) {
  const st = c.c8s;
  const sc = solConf(c);
  // こうらの 守り（クッパードの 手だすけ）: 次の 攻撃を 1回 ふせぐ（この 番は こうらに はね返される）
  if (st.shell === 1 && !c.telegraph && !stuck) {
    st.shell = 0;
    c.telegraph = SHELL;
    ev.upd.push(c);
    return;
  }
  if (c.telegraph) return;
  // へびに しばられて いる（ジャハールの 手だすけ）
  if (st.bound > 0) {
    st.bound--;
    if (!stuck) c.telegraph = BOUND;
    ev.upd.push(c);
    return;
  }
  if (st.stage === 1) {
    // 心が ゆらいで いる: よびかけないと かたまる
    if (st.waver > 0) {
      st.waver--;
      if (st.waver === 0) {
        if (!stuck) c.telegraph = HARDEN;
        ev.upd.push(c);
        return;
      }
      ev.lines.push(`${c.name}の「${HEART_NAME[HEARTS[st.heart]]}」が、ゆらいでいる…！（今だ！よびかけよう！）`);
    }
    if (st.left <= 1) {
      if (!stuck) c.telegraph = SL_BIG;
    } else {
      st.left--;
      if (st.left === 1) ev.lines.push(`${c.name}のまわりで、くらい心が、ぐるぐると、うずをまき始めた…！`, '（次にソリトゥスが動くと、くらい心のあらし…！身を守れ！）');
      ev.c8sBigLeft = { id: c.id, left: st.left, every: sc.big.every };
    }
    ev.upd.push(c);
    return;
  }
  if (st.stage === 2) {
    if (st.waver > 0) {
      st.waver--;
      if (st.waver === 0) {
        if (!stuck) c.telegraph = HARDEN;
      } else ev.lines.push(`${c.name}の光が、ゆらいでいる…！（今だ！よびかけよう！）`);
      ev.upd.push(c);
      return;
    }
    // 星の なみだ・ひとりに する
    if (st.tearLeft <= 1) {
      if (!stuck) c.telegraph = TEAR;
      ev.upd.push(c);
      return;
    }
    st.tearLeft--;
    if (st.tearLeft === 1) ev.lines.push(`${c.name}の目に、星のなみだが、たまっていく…！`, '（次にソリトゥスが動くと、星のなみだ…！身を守って、ひとりの仲間にはよびかけよう！）');
    ev.c8sTearLeft = { id: c.id, left: st.tearLeft, every: sc.tear.every };
    st.left--;
    if (st.left <= 0) {
      st.left = sc.alone.every;
      const free = b.aliveAllies().filter((x) => !x.status?.rift);
      if (free.length >= 2 && !stuck) c.telegraph = ALONE_S;
    }
    ev.upd.push(c);
    return;
  }
  // 3だんめ
  if (st.left <= 1) {
    if (!stuck) c.telegraph = CRACK;
  } else {
    st.left--;
    if (st.left === 1) ev.lines.push('時のはざまの天井に、大きなひびが走った…！', '（次にソリトゥスが動くと、時のくずれ…！身を守れ！）');
    ev.c8sCrackLeft = { id: c.id, left: st.left, every: sc.crack.every };
  }
  ev.upd.push(c);
}
// みんなへの 魔法の 大技（身を 守ると 半分）
function magicAll(b, c, base, element, mult, ev) {
  const targets = b.aliveAllies().filter((x) => !x.c8torch);
  for (const t of targets) {
    const r = b.calcMagic(c, t, { base, thr: 99, element }, 1);
    let dmg = Math.round(r.dmg * mult);
    if (t.defending) dmg = Math.round(dmg * 0.5);
    if (r.resisted || dmg <= 0) {
      ev.lines.push(`${t.name}はダメージを受けない！`);
      continue;
    }
    b.damage(c, t, dmg, ev, { element });
  }
  return targets;
}
// 心が はがれる（よびかけた）→ 心の 持ち主が 1回だけ 手を かす
function peel(b, s, by, ev) {
  const st = s.c8s;
  const sc = solConf(s);
  const h = HEARTS[st.heart];
  st.peeled.push(h);
  st.waver = 0;
  st.calls++;
  const who = HEART_OWNER[h];
  ev.lines.push(`「${by.name}だよ！もう、ひとりじゃないよ！」`, `${s.name}から「${HEART_NAME[h]}」が、はがれおちた！`);
  ev.c8sPeel = { id: s.id, heart: h, by: by.id };
  const L = post(ev);
  if (h === 'greed') {
    st.bound = 1;
    L.push(`${who}「それは、わしの心じゃ！返してもらうぞ！」`, `${who}のへびが、${s.name}を、ぐるぐるしばった！（1回動けない）`);
  } else if (h === 'anger') {
    for (const x of b.aliveAllies()) {
      x.buffs.atk = { mult: 1.2, base: 1.2, lv: 1, left: 3 };
      x.buffs.mag = { mult: 1.2, base: 1.2, lv: 1, left: 3 };
      ev.upd.push(x);
    }
    L.push(`${who}「おれの、いかりを、かってに使うなーっ！」`, `${who}の青い火が、みんなの力をもやした！（攻撃力と魔力が上がった）`);
  } else if (h === 'hoard') {
    st.shell = 1;
    L.push(`${who}「ワガハイの心を、ひとりじめするなー！」`, `${who}の大きなこうらが、みんなの前に、ドスンとおちた！（次の攻撃を1回ふせぐ）`);
  } else {
    const d = Math.max(0, Math.min(Math.round(s.maxHp * 0.04), s.hp - 1));
    s.hp -= d;
    ev.results = ev.results || [];
    if (d > 0) ev.results.push({ id: s.id, dmg: d });
    L.push(`${who}「…ふん。わたしの心です。返していただきますよ。」`, `${who}は、ぶつぶつ言いながら、${s.name}を指ではじいた！（${d}のダメージ）`);
  }
  ev.c8sHelp = { id: s.id, who: h };
  st.heart++;
  if (st.heart >= HEARTS.length) {
    goStage(b, s, 2, ev);
    return;
  }
  const nh = HEARTS[st.heart];
  s.actions = HEART_ACTIONS[nh].map((x) => ({ ...x }));
  L.push(`${s.name}は、こんどは「${HEART_NAME[nh]}」をまとった…！`);
  void sc;
  ev.upd.push(s);
}
// よびかける（ソリトゥスの 心が ゆらいで いる 間）
function callOut(b, c, ev) {
  if (c.use) delete c.use[CALL];
  const s = solOf(b);
  if (!s || s.c8s.stage === 3 || !s.c8s.waver) {
    ev.lines.push(s ? `しかし、${s.name}には、まだ声がとどかない…（心がゆらいだ時によびかけよう）` : 'しかし、だれもいない。');
    ev.c8sCallMiss = { by: c.id };
    return;
  }
  ev.fx = { type: 'ability', anim: 'c8s_call', actor: c.id, targets: [s.id], side: 'ally' };
  if (s.c8s.stage === 1) return peel(b, s, c, ev);
  // 2だんめの さいご: 本当の すがたに よびかける
  s.c8s.waver = 0;
  s.c8s.calls++;
  ev.lines.push(`「${c.name}だよ！ぼくたちは、ここにいるよ！」`, `${s.name}「…ここに、いる…？」`);
  goStage(b, s, 3, ev);
}
// 千年の約束
function promise(b, c, ev) {
  if (c.use) delete c.use[PROMISE];
  const s = solOf(b);
  const st = s?.c8s;
  syncGauge(b);
  if (!s || st.stage !== 3 || st.gauge < PROMISE_MAX) {
    ev.lines.push('しかし、みんなの光が、まだたまっていない…！');
    return;
  }
  const pc = solConf(s).promise;
  const members = b.aliveAllies().filter((x) => !x.status?.rift && !x.c8torch);
  st.gauge = 0;
  st.full = false;
  st.promises++;
  const names = members.map((x) => x.name);
  ev.name = '千年の約束';
  ev.lines.push(`${names.join('・')}と、千年前の4人の勇者の、合体技！`, '「千年の約束」！！');
  if (st.promises === 1) ev.lines.push('カイの手の、4人目の紋章が、はじめて光った…！', 'カイ「…光った！おれの紋章が、光ったよ！」');
  ev.fx = { type: 'ability', anim: 'c8s_promise', actor: c.id, targets: [s.id], side: 'ally', ids: members.map((x) => x.id), names };
  ev.extraLock = (ev.extraLock || 0) + 2400;
  const dmg = Math.max(1, Math.round(s.maxHp * pc.dmg * b.rng.float(0.97, 1.03)));
  b.damage(c, s, dmg, ev, { element: 'light', promise: true });
  ev.results = ev.results || [];
  for (const x of members) {
    if (!x.alive) continue;
    const real = Math.min(x.maxHp - x.hp, Math.round(x.maxHp * pc.heal));
    x.hp += real;
    ev.results.push({ id: x.id, heal: real });
    ev.upd.push(x);
  }
  ev.c8sPromise = { by: c.id, ids: members.map((x) => x.id), n: st.promises };
}

// 千年の約束の 光: 味方が 1回 動く ごとに たまる（b.allyActs で 数える。ダメージ・オート・ボスの 番で あわせる）
export function syncGauge(b) {
  const s = solOf(b);
  const st = s?.c8s;
  if (!st) return;
  const n = (b.allyActs || 0) - (st.acts0 ?? 0);
  st.acts0 = b.allyActs || 0;
  if (n > 0) addGauge(s, solConf(s).promise.per * n);
}

// ───────────── 行動の はじめ（battle-c8c.js の c8cTurnStart の はじめ。敵の 番だけ）─────────────
// 動けない 番も しるしを 数える
export function c8rTurnStart(b, c, ev, stuck) {
  helperTurn(b, c, ev);
  syncGauge(b);
  if (c.side === 'ally') return;
  if (c.c8g) gateTurn(b, c, ev, stuck);
  else if (c.c8w) windTurn(b, c, ev, stuck);
  else if (c.c8d) duelTurn(b, c, ev, stuck);
  else if (c.c8s) solTurn(b, c, ev, stuck);
}

function gateTurn(b, c, ev, stuck) {
  const g = c.c8g;
  const gc = gateConf(c);
  // フリーゾンが 動くと、つながりは とぎれる
  g.chain = 0;
  g.hitters = [];
  if (c.telegraph) return;
  g.acts++;
  // 第1形態: leaveActs 回 動いたら 去る
  if (gc.leaveActs && g.acts > gc.leaveActs) {
    g.leave = 'turns';
    c.telegraph = LEAVE;
    ev.upd.push(c);
    return;
  }
  // 大玉を ためて いる: はなつ（かまえが くずれて いれば 消える）
  if (g.orb) {
    if (!stuck) {
      c.telegraph = g.orbBroken ? ORBFAIL : ORB;
      if (g.open > 0) g.open--;
    }
    ev.upd.push(c);
    return;
  }
  // くずれた かまえが もどる
  if (g.open > 0) {
    g.open--;
    if (g.open === 0) {
      ev.lines.push(`${c.name}は、ふっとわらって、また、見くだしのかまえにもどった…！`);
      ev.c8gStance = { id: c.id, up: true };
    }
  }
  if (gc.orb) {
    g.left--;
    if (g.left <= 0) {
      g.orb = true;
      g.orbBroken = false;
      // 大玉を ためる ときは、かまえなおす（ためて いる 間に くずすと 止まる）
      if (g.open > 0) {
        g.open = 0;
        ev.c8gStance = { id: c.id, up: true };
      }
      ev.lines.push(`${c.name}が、指先に、大きな光の玉をため始めた…！`, `（次にフリーゾンが動くと、時の大玉…！ちがう仲間が${chainNeed(g, c)}人つづけて攻撃するか、合体技で、かまえをくずせば止められる！）`);
      ev.c8gCharge = { id: c.id };
    }
    ev.c8gOrbLeft = { id: c.id, left: g.orb ? 0 : g.left };
  }
  ev.upd.push(c);
}
// 時の大玉
function orb(b, c, ev) {
  const g = c.c8g;
  const gc = gateConf(c);
  g.orb = false;
  g.orbBroken = false;
  g.orbs++;
  g.left = g.form === 4 ? gc.final.orbEvery : gc.orb.every;
  ev.fx = { type: 'ability', anim: 'c8g_orb', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy', element: 'light' };
  ev.lines.push('大きな光の玉が、ゆっくりと、おちてきた…！');
  magicAll(b, c, gc.orb.base, 'light', 1, ev);
  ev.c8gOrb = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}
function orbFail(b, c, ev) {
  const g = c.c8g;
  const gc = gateConf(c);
  g.orb = false;
  g.orbBroken = false;
  g.stops++;
  g.left = g.form === 4 ? gc.final.orbEvery : gc.orb.every;
  ev.fx = { type: 'ability', anim: 'c8g_orbfail', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('かまえがくずれて、光の玉が、しゅるしゅるとしぼんで消えた！');
  ev.c8gOrbFail = { id: c.id };
  ev.upd.push(c);
}
// 最終形態
function final(b, c, ev) {
  const g = c.c8g;
  const gc = gateConf(c);
  if (g.form === 4) return;
  g.form = 4;
  g.open = 0;
  g.orb = false;
  g.left = gc.final.orbEvery;
  g.rion = true;
  c.name = FINAL_NAME;
  c.actions = GATE_FINAL_ACTIONS.map((x) => ({ ...x }));
  c.atk = Math.round(g.atk0 * gc.final.atk);
  c.speed = g.spd0 * gc.final.speed;
  ev.fx = { type: 'ability', anim: 'c8g_final', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('フリーゾンの体が、まぶしく光った…！', 'つるりとした、さいごのすがたがあらわれた！');
  post(ev).push(
    'リオン「…ぼくは、弱いかもしれない。」', 'リオン「でも…ひとりじゃない！」', 'リオンの声に、みんなの心が1つになった！',
    `（${chainNeed(g, c)}人つづけて攻撃すれば、かまえをくずせるようになった！）`,
  );
  ev.c8gFinal = { id: c.id, need: chainNeed(g, c) };
  ev.warn = true;
  ev.upd.push(c);
}
// 去る（とちゅうで 終わる 戦い。勝ち。のこりの HPは そのまま 見せる）
function leave(b, c, ev) {
  const g = c.c8g;
  const hp = c.hp;
  ev.lines.push(g.form === 1 ? `${c.name}「ほう…少しは、やるようですね。」` : `${c.name}「…今日は、このくらいにしておきましょう。」`, `${c.name}「つづきは、また、のちほど。」`);
  ev.fx = { type: 'ability', anim: 'c8g_leave', actor: c.id, targets: [c.id], side: 'enemy' };
  b.kill(c, null, ev);
  c.hp = hp;
  ev.c8gLeave = { id: c.id, why: g.leave || 'hp' };
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-c8c.js の c8cEffect の のこり）─────────────
export function c8rEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c8gOrb': orb(b, c, ev); return true;
    case 'c8gOrbFail': orbFail(b, c, ev); return true;
    case 'c8gFinal': final(b, c, ev); return true;
    case 'c8gLeave': leave(b, c, ev); return true;
    case 'c8tGust': gust(b, c, ev); return true;
    case 'c8tPuff': puff(b, c, ev); return true;
    case 'c8tDawn': dawn(b, c, ev); return true;
    case 'c8dSlash': duelHit(b, c, ev, 1.15, false); ev.c8dSlash = { id: c.id }; return true;
    case 'c8dBig': {
      c.c8d.left = duelConf(c).big.every;
      c.c8d.bigs++;
      duelHit(b, c, ev, duelConf(c).big.mult, true);
      ev.c8dBig = { id: c.id };
      ev.warn = true;
      return true;
    }
    case 'c8dMock': {
      const r = rionOf(b);
      c.c8d.mocks++;
      ev.fx = { type: 'ability', anim: 'c8d_mock', actor: c.id, targets: r ? [r.id] : [], side: 'enemy' };
      if (!r?.alive) return true;
      if (c.c8d.cheered || r.c8cheered) {
        c.c8d.blocked++;
        ev.lines.push(`リオン「みんなの声が、聞こえる…！そんなことばには、まけない！」`);
        ev.c8dMock = { id: c.id, blocked: true };
      } else {
        r.debuffs.atk = { mult: 0.8, base: 0.8, lv: 1, left: 3 };
        ev.lines.push(`${r.name}の攻撃力が下がった…！（おうえんがあれば、ことばに負けない）`);
        ev.c8dMock = { id: c.id, blocked: false };
      }
      ev.upd.push(r);
      return true;
    }
    case 'c8dCheer': cheer(b, c, eff.cheer, ev); return true;
    case 'c8sCall': callOut(b, c, ev); return true;
    case 'c8sPromise': promise(b, c, ev); return true;
    case 'c8sShell': {
      ev.fx = { type: 'ability', anim: 'c8s_shell', actor: c.id, targets: [c.id], side: 'enemy' };
      ev.lines.push('クッパードのこうらが、ソリトゥスの攻撃を、ゴイーンとはね返した！');
      ev.c8sShell = { id: c.id };
      return true;
    }
    case 'c8sBig': {
      const st = c.c8s;
      const sc = solConf(c);
      st.left = sc.big.every;
      st.bigs++;
      ev.fx = { type: 'ability', anim: 'c8s_big', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy', element: 'dark' };
      magicAll(b, c, sc.big.base, 'dark', 1, ev);
      ev.c8sBig = { id: c.id };
      ev.warn = true;
      return true;
    }
    case 'c8sHarden': {
      const st = c.c8s;
      const sc = solConf(c);
      st.waver = 0;
      st.hardens++;
      const h = Math.round(c.maxHp * sc.harden);
      c.hp = Math.min(c.maxHp, c.hp + h);
      ev.results = ev.results || [];
      ev.results.push({ id: c.id, heal: h });
      ev.lines.push(st.stage === 1 ? `だれも、よびかけなかった…。${c.name}の「${HEART_NAME[HEARTS[st.heart]]}」が、また、かたまった…！` : `だれも、よびかけなかった…。${c.name}の光が、また、とじてしまった…！`, `${c.name}のHPが${h}回復した！`);
      // かたまる たびに、くらい心が 強く なる（攻撃力・魔力 hardenUp ばい）
      st.power = (st.power || 1) * sc.hardenUp;
      c.atk = Math.round(st.atk0 * st.power);
      c.mag = Math.round((st.mag0 || c.mag) * st.power);
      ev.lines.push(`${c.name}のくらい心が、強くなった…！`);
      // かたまった 心が あふれて、みんなに 闇（身を 守ると 半分）
      ev.fx = { type: 'ability', anim: 'c8s_harden', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy', element: 'dark' };
      ev.lines.push('かたまったくらい心が、あふれ出した…！');
      magicAll(b, c, sc.big.base, 'dark', 0.8, ev);
      ev.c8sHarden = { id: c.id };
      ev.warn = true;
      ev.upd.push(c);
      return true;
    }
    case 'c8sAlone': {
      const free = b.aliveAllies().filter((x) => !x.status?.rift && !x.c8torch);
      const pool = free.filter((x) => x.kind !== 'guest');
      const t = b.rng.pick(pool.length ? pool : free);
      if (!t || free.length < 2) {
        ev.lines.push('しかし、だれもひとりにならなかった！');
        return true;
      }
      c.c8s.aloneN++;
      ev.fx = { type: 'ability', anim: 'c8s_alone', actor: c.id, targets: [t.id], side: 'enemy' };
      trap(b, t, c, 'alone', ev, solConf(c).alone.turns);
      ev.c8sAlone = { id: c.id, who: t.id };
      return true;
    }
    case 'c8sTear': {
      const st = c.c8s;
      const sc = solConf(c);
      st.tearLeft = sc.tear.every;
      st.tears++;
      const n = b.aliveAllies().filter((x) => x.status?.rift?.kind === 'alone').length;
      ev.fx = { type: 'ability', anim: 'c8s_tear', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy', element: 'light' };
      if (n) ev.lines.push(`（ひとりぼっちの仲間が${n}人…星のなみだが、つよくなった…！）`);
      magicAll(b, c, sc.tear.base, 'light', 1 + sc.tear.per * n, ev);
      ev.c8sTear = { id: c.id, alone: n };
      ev.warn = true;
      return true;
    }
    case 'c8sCrack': {
      const st = c.c8s;
      const sc = solConf(c);
      st.left = sc.crack.every;
      st.cracks++;
      ev.fx = { type: 'ability', anim: 'c8s_crack', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy', element: 'dark' };
      magicAll(b, c, sc.crack.base, 'dark', 1, ev);
      ev.c8sCrack = { id: c.id };
      ev.warn = true;
      return true;
    }
    default: return false;
  }
}

// ───────────── ダメージ（battle-c8c.js の c8cDamage の はじめ）─────────────
export function c8rDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0)) return dmg;
  if (t.c8s) syncGauge(b);
  if (c?.side !== 'ally') return dmg;
  // 一騎うち: おうえんの 人の 攻撃は おうえん（力）に・リオンの ゆうきの一撃
  if (b.c8duel && t.side === 'enemy') {
    if (c.c8cheer) {
      if (!ev.c8dSwap) {
        ev.c8dSwap = true;
        post(ev).push('これは、一騎うちだ…！手は出せない。でも、声なら、とどく！');
        cheer(b, c, 'pow', ev);
      }
      return 0;
    }
    if (c.c8rion && b.c8duel.ready) {
      b.c8duel.ready = false;
      b.c8duel.courage = 0;
      b.c8duel.strikes++;
      once(ev, 'c8dStrikeMsg', ['リオン「みんな…ありがとう！」', 'リオンの「ゆうきの一撃」！']);
      ev.c8dStrike = { id: c.id };
      return Math.round(dmg * b.c8duel.power);
    }
    return dmg;
  }
  // 守りぬく: やみの風は たおせない
  if (t.c8w) {
    once(ev, 'c8tWindMsg', ['（やみの風は、たおせない…！ともしびを守りぬこう！）']);
    return 0;
  }
  if (t.c8g) return gateDamage(b, c, t, dmg, info, ev);
  if (t.c8s) return solDamage(b, c, t, dmg, info, ev);
  return dmg;
}

// つながる攻撃の 数: フリーゾンが 動いてから、次に 動くまでに 当てた ちがう 仲間の 数（フリーゾンが 動くと とぎれる）
export function chainOf(b, g, c, ev) {
  if (!ev.c8gChain) {
    ev.c8gChain = true;
    if (!g.hitters) g.hitters = [];
    if (!g.hitters.includes(c.id)) g.hitters.push(c.id);
    g.chain = g.hitters.length;
  }
  return g.chain;
}
function gateDamage(b, c, t, dmg, info, ev) {
  const g = t.c8g;
  const gc = gateConf(t);
  const st = gc.stance;
  if (st && g.form >= 2) {
    if (g.open > 0) dmg = Math.round(dmg * st.weak);
    else {
      const chain = chainOf(b, g, c, ev);
      const need = chainNeed(g, t);
      if (ev.dual || chain >= need) {
        g.open = st.open;
        g.breaks++;
        if (g.orb) g.orbBroken = true;
        // くずした 1回目は、まだ 少し 受け流される（合体技は 半分・つながる攻撃は そのまま）。この あとの 攻撃が 大きい
        dmg = Math.round(dmg * (ev.dual ? 0.5 : 1));
        once(ev, 'c8gBreakMsg', [ev.dual ? '合体技が、見くだしのかまえを、うちくだいた！' : `つながる攻撃${chain}！見くだしのかまえが、くずれた！`, `${t.name}「な…！？」（今なら、ダメージが大きい！）`]);
        ev.c8gBreak = { id: t.id, by: c.id, dual: !!ev.dual, chain };
        ev.upd.push(t);
      } else {
        dmg = Math.max(1, Math.round(dmg * st.cut));
        g.defl++;
        once(ev, 'c8gDeflMsg', [`${t.name}は、指1本で、こうげきを受け流した…！（つながる攻撃${chain}/${need}）`]);
        ev.c8gDefl = { id: t.id, chain, need };
      }
    }
  }
  const floor = floorOf(t);
  if (floor > 0 && t.hp - dmg <= floor) {
    dmg = Math.max(0, t.hp - floor);
    if (g.form <= 2) {
      if (!g.leave) {
        g.leave = 'hp';
        reactNow(b, t, LEAVE);
      }
    } else if (g.form === 3 && t.telegraph !== FINAL) reactNow(b, t, FINAL);
  }
  return dmg;
}

function solDamage(b, c, t, dmg, info, ev) {
  const st = t.c8s;
  const sc = solConf(t);
  if (st.stage === 2 && b.aliveAllies().some((x) => x.status?.rift?.kind === 'alone')) {
    dmg = Math.max(1, Math.round(dmg * sc.alone.cut));
    once(ev, 'c8sAloneMsg', [`（ひとりぼっちの仲間がいる間、${t.name}は、からにとじこもっている…！よびかけよう！）`]);
  }
  if (st.stage === 3 && info.promise) return dmg;
  const floor = floorOf(t);
  if (t.hp - dmg <= floor) {
    dmg = Math.max(0, t.hp - floor);
    if (st.stage === 1 && !st.waver) {
      st.waver = sc.waver + 1;
      once(ev, 'c8sWaverMsg', [`${t.name}の「${HEART_NAME[HEARTS[st.heart]]}」が、ゆらいだ…！`, '（今だ！「よびかける」で、くらい心をはがそう！）']);
      ev.c8sWaver = { id: t.id, heart: HEARTS[st.heart] };
      ev.upd.push(t);
    } else if (st.stage === 2 && !st.waver) {
      st.waver = sc.waver + 1;
      once(ev, 'c8sWaverMsg', [`${t.name}の光が、ちかちかと、ゆらいだ…！`, '（今だ！ひとりぼっちの星に「よびかける」…！）']);
      ev.c8sWaver = { id: t.id, star: true };
      ev.upd.push(t);
    } else if (st.stage === 3) once(ev, 'c8sLastMsg', ['（さいごは、みんなの「千年の約束」で…！）']);
  }
  return dmg;
}

// ───────────── たおれた（battle-c8c.js の c8cKill の はじめ）─────────────
export function c8rKill(b, t, ev) {
  // ともしびが 消えた・リオンが たおれた: 負け
  if (t?.c8torch || t?.c8rion) {
    b.pendingEnd = { outcome: 'lose' };
    b.queue = [];
    if (ev) post(ev).push(t.c8torch ? 'ともしびが、ふっと消えてしまった…。' : 'リオンは、ひざをついてしまった…。');
    return;
  }
  // 守りぬく: 戦う 人が みんな たおれたら 負け（ともしびは 戦えない）
  if (t?.side === 'ally' && b.c8guard && !b.aliveAllies().some((x) => !x.c8torch && x !== t)) {
    b.pendingEnd = { outcome: 'lose' };
    b.queue = [];
    return;
  }
  // 小おにを たおした: respawn 回 あとに また 来る
  if (t?.species === C8_PUFF && b.c8guard) {
    if (!b.c8guard.due) b.c8guard.due = b.c8guard.respawn;
  }
}

// ───────────── 大技が 近いか ─────────────
function actsBefore(b, c, e) {
  if (!e?.alive) return 0;
  const re = atbRate(e);
  if (!(re > 0)) return 0;
  const mine = 100 / atbRate(c);
  const t0 = e.ready || e.queued ? 0 : (100 - e.atb) / re;
  if (t0 > mine) return 0;
  return 1 + Math.floor((mine - t0) / (100 / re));
}
// 大技が c の 次の 番より 先に 来るか
export function c8rBigBefore(b, c) {
  const g = gateOf(b);
  if (g?.c8g?.orb) return g.telegraph === ORB || (!g.telegraph && !g.c8g.orbBroken && actsBefore(b, c, g) >= 1);
  const w = windOf(b);
  if (w) return w.telegraph === GUST || (!w.telegraph && w.c8w.left <= 1 && actsBefore(b, c, w) >= 1);
  const d = shadowOf(b);
  if (d) return d.telegraph === BIG_SLASH || (!d.telegraph && d.c8d.left <= actsBefore(b, c, d));
  const s = solOf(b);
  if (s) {
    if ([SL_BIG, TEAR, CRACK].includes(s.telegraph)) return true;
    if (s.telegraph) return false;
    const st = s.c8s;
    const left = st.stage === 2 ? st.tearLeft : st.left;
    return actsBefore(b, c, s) >= left;
  }
  return false;
}

// その 敵に いちばん 大きい ダメージの 1回の 行動（攻撃・1体の 技。{ cmd, dmg }）
function bestHit(b, c, t) {
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
  return best;
}
const hurtCmd = (a) => a && FOES.has(a.target) && ['phys', 'magic'].includes(prim(a).type);

// ───────────── オート（battle-c8c.js の c8cPlan の はじめ）─────────────
// 第8章 第4幕の しかけが なければ null（ほかの ボスの 考えへ）
export function c8rPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c8rInner || c.status?.rift) return null;
  if (c.c8torch) return { type: 'defend' };
  const g = gateOf(b);
  const w = windOf(b);
  const d = b.c8duel ? shadowOf(b) : null;
  const s = solOf(b);
  if (!g && !w && !d && !s) return null;
  if (s) syncGauge(b);
  const soon = c8rBigBefore(b, c);
  // 一騎うちの おうえんの 人は、だれでも おうえん（知って いる 人は 使いわける）
  if (d && c.c8cheer) return cheerPlan(b, c, d, soon);
  // ふつうの オート: 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  if (!b.knowsCh6) {
    if (b.c6Naive || !soon) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c8rInner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c8rInner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && !x.c8torch && (!x.alive || x.hp / x.maxHp < 0.35));
  if (g) {
    if (saving) return base;
    return gatePlan(b, c, g, base, a, soon);
  }
  if (w) return guardPlan(b, c, w, base, a, saving, soon);
  if (d) {
    if (soon && !b.c6NoGuard) return { type: 'defend' };
    return base;
  }
  if (saving) return base;
  return solPlan(b, c, s, base, a, soon);
}

function gatePlan(b, c, g, base, a, soon) {
  const gg = g.c8g;
  // 大玉を ためて いる 間は、いちばん 大きい 1回の 攻撃で つながる攻撃を つなぐ（全体の 攻撃なら そのまま）
  if (gg.orb && !gg.orbBroken && stanceUp(g) && !b.c8rNoChain) {
    // 大玉を とめられない（自分の 番が 間に あわない）ときは 身を 守る
    const hit = gg.hitters || [];
    // もう 当てた 人は ふつうに（回復・守り）
    if (hit.includes(c.id)) return soon && !b.c6NoGuard ? { type: 'defend' } : base;
    if (soon && !b.c6NoGuard) {
      // 今の つながり ＋ 自分 ＋ フリーゾンより 先に 動ける まだ 当てて いない 仲間 で とどくか
      const tt = (x) => (x.ready || x.queued ? 0 : (100 - x.atb) / Math.max(1e-9, atbRate(x)));
      const bt = g.telegraph ? 0 : tt(g);
      const more = b.aliveAllies().filter((x) => x !== c && !hit.includes(x.id) && !x.status?.rift && !x.c8torch && tt(x) < bt).length;
      if (hit.length + 1 + more < chainNeed(gg, g)) return { type: 'defend' };
    }
    if (hurtCmd(a) && a.target !== 'enemy') return base;
    const h = bestHit(b, c, g);
    if (h.dmg > 0) return h.cmd;
  }
  if (soon && gg.orb && !gg.orbBroken && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

function guardPlan(b, c, w, base, a, saving, soon) {
  const torch = torchOf(b);
  // 自分が あぶない ときは ふつうに（自分の 回復）
  if (c.hp / c.maxHp < 0.4) return base;
  // 大風の 前に 身を 守る（だれかが 守って いれば よい）
  if (soon && !b.c6NoGuard && !b.aliveAllies().some((x) => x.defending && !x.c8torch)) return { type: 'defend' };
  // ともしびが へって いれば 回復（回復の 技を もって いる 人）
  if (torch?.alive && torch.hp / torch.maxHp < 0.6) {
    // いちばん 大きい 回復の 技
    const heal = (c.abilities || []).filter((id) => {
      const ab = ABILITIES[id];
      return ab && ab.target === 'ally' && prim(ab).type === 'heal' && canUse(b, c, id) && !c.autoOff?.includes(id);
    }).sort((x, y) => (prim(ABILITIES[y]).base?.[1] || 0) - (prim(ABILITIES[x]).base?.[1] || 0))[0];
    if (heal) return { type: 'ability', id: heal, target: torch.id };
  }
  if (saving) return base;
  // 大風の 前に 身を 守る（だれかが 守って いれば よい）
  if (soon && !b.c6NoGuard && !b.aliveAllies().some((x) => x.defending && !x.c8torch)) return { type: 'defend' };
  // 小おにを 先に たおす（HP の 少ない ほう）
  const puffs = puffsAlive(b);
  if (puffs.length && !b.c8rNoPuff) {
    if (hurtCmd(a) && a.target !== 'enemy') return base;
    const t = puffs.slice().sort((x, y) => x.hp - y.hp)[0];
    const h = bestHit(b, c, t);
    if (h.dmg > 0) return h.cmd;
  }
  return base;
}

function cheerPlan(b, c, d, soon) {
  const r = rionOf(b);
  if (!r?.alive) return { type: 'defend' };
  if (!b.knowsCh6) return { type: 'ability', id: CHEERS[0], target: c.id };
  if (r.hp / r.maxHp < 0.5) return { type: 'ability', id: CHEERS[2], target: c.id };
  if (soon && !r.buffs?.def) return { type: 'ability', id: CHEERS[1], target: c.id };
  return { type: 'ability', id: CHEERS[0], target: c.id };
}

function solPlan(b, c, s, base, a, soon) {
  const st = s.c8s;
  // 心が ゆらいだら すぐ よびかける（だれかが よびかけに 行って いれば ほかは ふつう）
  if (st.waver && st.stage <= 2) {
    const going = b.queue.some((q) => q.cmd?.type === 'ability' && q.cmd.id === CALL);
    if (!going && (!b.c8rNoCall || b.rng.chance(0.2))) return { type: 'ability', id: CALL, target: s.id };
  }
  // 千年の約束（光が たまったら）
  if (st.stage === 3 && st.gauge >= PROMISE_MAX) {
    const going = b.queue.some((q) => q.cmd?.type === 'ability' && q.cmd.id === PROMISE);
    if (!going) return { type: 'ability', id: PROMISE, target: s.id };
  }
  // ひとりの 仲間に よびかける（だれかが 行って いれば ほかは ふつう）
  const lone = b.aliveAllies().find((x) => x !== c && x.status?.rift?.kind === 'alone' && !b.queue.some((q) => q.cmd?.type === 'call' && q.cmd.target === x.id));
  if (lone) return { type: 'call', target: lone.id };
  if (soon && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

// ───────────── がめんへ（battle-c8c.js の c8cPub の さいご）─────────────
// 門番: gForm（1〜4）・stance（1 かまえ）・open（くずれた のこり）・need（くずす 人数）・chain（今の つながり）・orbLeft・orbEvery・charge（大玉を ためて いる）
// やみの風: dawnLeft（夜明けまで）・gustLeft・gustEvery / ともしび: torch / 見くだす影: bigLeft・bigEvery / リオン: rion・courage・courageMax・brave / おうえんの 人: cheer
// ソリトゥス: slStage・heart（0〜3）・waver・bigLeft・bigEvery・tearLeft・crackLeft・gauge・gaugeMax・shell・bound
export function c8rPub(c, o) {
  // がめんは まえの ようすに 上書きで まぜる（client/battle.js の Object.assign）ので、なくなった しるしも 0 で おくる
  if (c.c8g) {
    const g = c.c8g;
    const gc = gateConf(c);
    o.gForm = g.form;
    o.stance = gc.stance && g.open <= 0 ? 1 : 0;
    o.open = g.open > 0 ? g.open : 0;
    o.need = chainNeed(g, c);
    o.orbLeft = gc.orb && !g.orb ? g.left : 0;
    o.orbEvery = gc.orb ? (g.form === 4 ? gc.final.orbEvery : gc.orb.every) : 0;
    o.charge = g.orb ? 1 : 0;
    o.chain = g.chain || 0;
  }
  if (c.c8w) {
    const w = c.c8w;
    const wc = windConf(c);
    o.dawnLeft = Math.max(0, wc.winActs - w.acts);
    o.dawnMax = wc.winActs;
    o.gustLeft = w.left;
    o.gustEvery = wc.gust.every;
  }
  if (c.c8torch) o.torch = 1;
  if (c.c8d) {
    o.bigLeft = c.c8d.left;
    o.bigEvery = duelConf(c).big.every;
  }
  if (c.c8rion) o.rion = 1;
  if (c.c8cheer) o.cheer = 1;
  if (c.c8s) {
    const st = c.c8s;
    const sc = solConf(c);
    o.slStage = st.stage;
    o.heart = st.stage === 1 ? st.heart : -1;
    o.waver = st.waver > 0 ? 1 : 0;
    o.bigLeft = st.stage === 1 ? st.left : 0;
    o.bigEvery = st.stage === 1 ? sc.big.every : 0;
    o.tearLeft = st.stage === 2 ? st.tearLeft : 0;
    o.crackLeft = st.stage === 3 ? st.left : 0;
    o.gauge = st.stage === 3 ? st.gauge : 0;
    o.gaugeMax = PROMISE_MAX;
    o.shell = st.shell ? 1 : 0;
    o.bound = st.bound > 0 ? 1 : 0;
  }
}
