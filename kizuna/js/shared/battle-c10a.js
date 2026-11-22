// 第3部 第2章 第1幕「赤と緑」の 戦いの しかけ（battle-c9a.js・battle-c9b.js・battle.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c10a.md の 13-5
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ）: c10_note_re … ほのかな光の 回復 6% → 9%（b.c10rew.heal）／
//   c10_note_fa … てらすが 4回 → 3回で たまる（b.c10rew.teruMax）。新しい コマンドは ふやさない
// ・赤の 中ボス「ドクター・タマゴン と グルグルドリル号」（monsters-c10a.js の c10.kind 'tamagon'）… あつく なったら 休む
//   味方 1人ずつの「あつさ」（a.c10heat。0〜heat.max）: こうげき・特技・じゅもん ＋act（強い 技は ＋strong・合体技は 出した みんなが ＋act）・炎の 攻撃を 受けると ＋fire・
//     防御で −cool（水を 飲む）・道具と 回復は ＋0。max で「のぼせた！」（status.nobose … 1回 動けない ＋ ダメージ。あつさは back に）
//   メカの「あつさ」（boss.c10t.heat。0〜mecha.max）: 動いた あとに ＋1・炎を 当てると ＋fire・氷を 当てると ice（−1）（1回の 行動に 1つ）
//     max で「オーバーヒート！」: 次の メカの 番は 止まる（m10t_over）。止まるまで 受ける ダメージ mecha.over ばい。めもりは 0
//   HPが coolAt を 切ると「冷きゃく水」（m10t_cool。1回だけ）: メカの めもりが 0 に・ドリルの 全体攻撃が ふえる（drill.half）
//   ドリルの 全体攻撃: drill.every 回 動く ごとに 前ぶれ（m10t_drillup。b.tell 'drill'）→ drill.wait 回 ふつうに 動いた あとに 全体（m10t_drill。身を 守ると guardCut）
//   勝つと メカは けむりを はいて 止まる（たおれない。HP 1 で すわりこむ … b.killed に 入れて 経験値・落とし物は ふつう）
//   自動の 仲間（酒場の 人・家族の 仲間）は あつさが 4 いじょうの 番の 3回に 1回 休む（防御）。ただし 人が 自分で えらんで いる 時だけ（みんな オートなら 休まない）。家族の キャラの オート・魔物の 仲間は 休まない
// ・緑の 中ボス「カビだんしゃく モルド と カビカビ号」（c10.kind 'mold'）… カビを てらす
//   メカは 番の はじめに「カビの きり」（前ぶれ なし）: 味方 mist.n 人（HP 半分 いかは mist.half 人）に カビ ＋1（a.c10kabi。さい大 kabi.max）
//     カビ 1つに つき 受ける 回復 −kabi.heal・攻撃 −kabi.atk。max で「きのこに なった！」（status.kinoko … 1回 動けない。カビは 0 に）
//   カビの かべ: メカが 受ける ダメージ wall ばい。スピカの「てらす」で、みんなの カビが 消え、かべも 明るい 間（てらすの lit … 3回の 番）消える
//   スピカの「星のうた」: みんなの カビが 消える（かべは 消えない）
//   HPが 半分を 切ると、きりが mist.half 人に・「大カビばくだん」（bomb.every 回 動く ごとに 前ぶれ m10m_bombup。b.tell 'bomb' → 全体 m10m_bomb。身を 守ると へる）
//   勝つと メカは 止まり、だんしゃくは たおれない（しょんぼり）
//   自動の 仲間（酒場の 人）は、スピカの 技が たまって いて 役に 立つ 番の 3回に 1回 使う（星のうた … カビが ある・てらす … かべが ある）
// ・人数で 合わせる（few・solo・monK）は 第1章 第4幕と おなじ 数え方（魔物の 仲間は 半人ぶん）。仲間なしの 2人／3人は bare（c10Pick）
import { MONSTERS } from './data/monsters.js?v=c5f1443d1cb0';
import { ABILITIES } from './data/abilities.js?v=c5f1443d1cb0';
import { C10R_TAMAGON, C10G_MOLD, DRILL_NAME, KABI_NAME } from './data/monsters-c10a.js?v=c5f1443d1cb0';
import { C10A_B as C10A } from './maps/c10a-flags.js?v=c5f1443d1cb0';
import { TERU } from './data/abilities-c9b.js?v=c5f1443d1cb0';
import { SONG } from './data/abilities-c9d.js?v=c5f1443d1cb0';
import { canUse } from './ai.js?v=c5f1443d1cb0';

export const DRILLUP = 'm10t_drillup';
export const DRILL = 'm10t_drill';
export const OVER = 'm10t_over';
export const COOL = 'm10t_cool';
export const BOMBUP = 'm10m_bombup';
export const BOMB = 'm10m_bomb';
export const NOBOSE = 'nobose';
export const KINOKO = 'kinoko';
// スピカの ごほうび
export const REWARD_HEAL = 0.09;
export const REWARD_TERU = 3;
export const AUTO_EVERY = 3;

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};

// 人数（家族の キャラ ＝ kind 'player' の 数。魔物の 仲間は 半人ぶん。1〜5。battle-c9d.js の peopleOf9d と おなじ）
export function peopleOf10(b) {
  if (b?.c10People) return b.c10People;
  const al = b?.allies || [];
  const p = al.filter((a) => a.kind === 'player').length;
  const n = p ? Math.floor(p + al.filter((a) => a.kind === 'monster').length * 0.5) : 0;
  return Math.max(1, Math.min(5, n || 4));
}
const few = (arr, b, d) => (Array.isArray(arr) ? arr[peopleOf10(b) - 1] ?? d : d);
// 第101回 R2班: 仲間なしの 少ない パーティー（味方〈ゲストを のぞく〉が みんな 家族の キャラで 2人か 3人）→ 2 か 3。ほかは 0
//   自動の 仲間（酒場・家族の 仲間・魔物）が いる 時と ひとりだけ（solo）は 0（今の まま）
export function bareOf10(b) {
  const al = (b?.allies || []).filter((a) => a.kind !== 'guest');
  return (al.length === 2 || al.length === 3) && al.every((a) => a.kind === 'player') ? al.length : 0;
}
// 人数で 合わせた 数を 引く（solo → bare〈[2人, 3人]〉→ few〈[1人〜5人]〉の じゅんに きく）。第2章の 4つの 幕で 同じ 物を 使う
export function c10Pick(c, b) {
  const f = c.few || {};
  const alone = b && b.allies.length === 1 ? c.solo || {} : {};
  const n = b ? bareOf10(b) : 0;
  const bare = n ? c.bare || {} : {};
  return (k, d) => {
    if (alone[k] !== undefined) return alone[k];
    if (Array.isArray(bare[k]) && bare[k][n - 2] != null) return bare[k][n - 2];
    return b ? few(f[k], b, d) : d;
  };
}
// 中ボスの しかけの 数（人数で 合わせた もの）
export function c10Conf(species, b = null) {
  const c = MONSTERS[species]?.c10 || {};
  const pick = c10Pick(c, b);
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return {
    kind: c.kind,
    heat: { max: 5, back: 2, act: 1, strong: 2, fire: 1, cool: 3, nobose: 0.12, ...(c.heat || {}), nobose: pick('nobose', c.heat?.nobose ?? 0.12) },
    mecha: { max: 6, fire: 1, ice: -1, over: 1.5, ...(c.mecha || {}) },
    drill: { every: 5, half: 3, wait: 1, mult: 2, guardCut: 0.4, ...(c.drill || {}), mult: (c.drill?.mult ?? 2) * pick('drillK', 1) },
    coolAt: c.coolAt ?? 0.5,
    kabi: { max: 3, heal: 0.25, atk: 0.1, ...(c.kabi || {}), turns: pick('kinokoTurns', c.kabi?.turns ?? 1) },
    mist: { n: pick('mistN', c.mist?.n ?? 2), half: pick('mistHalf', c.mist?.half ?? 3) },
    wall: pick('wall', c.wall ?? 0.5),
    bomb: { every: 4, wait: 1, mult: 2, guardCut: 0.4, ...(c.bomb || {}), mult: (c.bomb?.mult ?? 2) * pick('bombK', 1) },
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
  };
}
export const c10State = (b) => b?.c10 || null;
export const c10Boss = (b) => (b?.c10 ? b.get(b.c10.id) : null);
export const tamagonOf = (b) => (b?.c10?.kind === 'tamagon' ? b.get(b.c10.id) : null);
export const moldOf = (b) => (b?.c10?.kind === 'mold' ? b.get(b.c10.id) : null);
// 1回 動けない 状態（のぼせた・きのこ）。battle.js の onReady・doIncapacitated などが 見る
export const c10Stuck = (c) => !!(c?.status?.[NOBOSE] || c?.status?.[KINOKO]);
const teruOf = (b) => b.c9sp?.teru || null;
const songOf = (b) => b.c9sp?.song || null;
export const litNow10 = (b) => (teruOf(b)?.lit || 0) > 0;
const teruReady = (b) => { const t = teruOf(b); return !!t && t.charge >= t.max; };
const songReady = (b) => { const s = songOf(b); return !!s && s.charge >= s.max; };
// モルドの カビの かべ（てらして いる 間は ない）
export const wallUp = (b) => !!moldOf(b) && !b.c10.won && !litNow10(b);

// ───────────── はじめ（battle-c9b.js の setupC9b から）─────────────
// かえす 値: スピカを 出すか（中ボスの 戦いは かならず。星のうたも）
export function setupC10a(b, lines) {
  // スピカの ごほうび（先に 取った 音）
  const rew = {};
  if (flag(b, C10A.noteRe)) rew.heal = REWARD_HEAL;
  if (flag(b, C10A.noteFa)) rew.teruMax = REWARD_TERU;
  if (rew.heal || rew.teruMax) b.c10rew = rew;
  const boss = b.enemies.find((e) => MONSTERS[e.species]?.c10);
  if (!boss) return false;
  const cf = c10Conf(boss.species, b);
  if (cf.hp !== 1) boss.maxHp = boss.hp = Math.max(1, Math.round(boss.maxHp * cf.hp));
  if (cf.atk !== 1) boss.atk = Math.max(1, Math.round(boss.atk * cf.atk));
  if (cf.spd !== 1) boss.speed = (boss.speed || 1) * cf.spd;
  Object.defineProperty(boss, '_b10', { value: b, enumerable: false, configurable: true, writable: true });
  b.c10 = { kind: cf.kind, id: boss.id, won: false, half: false, nobose: 0, overs: 0, drills: 0, drillGuards: 0, cools: 0, mists: 0, kinoko: 0, bombs: 0, bombGuards: 0, cleans: 0 };
  b.c9songOn = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（battle.js の tick。前ぶれの 間だけで なく いつも … c10aTell）
  b.tellAll = true;
  if (cf.kind === 'tamagon') {
    boss.c10t = { heat: 0, over: false, acts: 0, drillLeft: cf.drill.every, drillReady: false, drillWait: 0, cooled: false, down: false };
    for (const a of b.allies) a.c10heat = 0;
    lines.push(
      `${boss.name}「むむっ！だれじゃ、わしの${DRILL_NAME}のじゃまをするのは！」`,
      `${boss.name}「ここの赤い光の玉は、わしらがいただくのじゃ！」`,
      '（熱の間は、とてもあつい…！あつくなったら「防御」で休もう。メカも、あつくなると止まるらしい…）',
    );
  } else {
    boss.c10m = { acts: 0, bombLeft: cf.bomb.every, bombReady: false, bombWait: 0, down: false };
    for (const a of b.allies) a.c10kabi = 0;
    lines.push(
      `${boss.name}「ごきげんよう。この大木は、わがはいの${KABI_NAME}が、いただいた。」`,
      `${boss.name}「ふっふっふ。じめじめは、すばらしい。」`,
      '（カビのきりに気をつけよう…！カビは、スピカの光に弱いかも…）',
    );
  }
  // はじめから 人が えらぶのを 待つ（battle-tell.js）
  b.tell = c10aTell(b);
  return true;
}

// ───────────── スピカ（battle-c9a.js の glow・battle-c9b.js の addTeru から）─────────────
// （仲間なしの ひとりは ほのかな光が 1回 動く たびに 来る ので、ごほうびの 上がりは 半分 … どちらを 先に しても 差が 小さく なる ように）
export const c10GlowHeal = (b, d) => (b?.c10rew?.heal ? (b.allies?.length === 1 ? d + (b.c10rew.heal - d) / 2 : b.c10rew.heal) : d);
export const c10TeruMax = (b, d) => b?.c10rew?.teruMax || d;

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// 'drill' … ドリルの 全体攻撃の 前ぶれ・'bomb' … 大カビばくだんの 前ぶれ・null
export function c10aTell(b) {
  const m = c10Boss(b);
  if (!m?.alive || b.c10.won) return null;
  if (m.c10t?.drillReady) return 'drill';
  if (m.c10m?.bombReady) return 'bomb';
  // タマゴン: 休むか 決める しくみ なので、いつも 人が えらぶのを 待つ（時間に 追われない … 人が ゆっくり えらんでも おなじ。13-5）
  if (m.c10t) return 'heat';
  // モルド: スピカの 技を いつ 使うか 決める しくみ なので、おなじく いつも 待つ（えらぶのに 5秒 かかる 人でも、カビが 先に たまりすぎない）
  if (m.c10m) return 'kabi';
  return null;
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter の はじめ。味方・敵 どちらも）─────────────
// cmd … その 行動の コマンド（battle.js の lastCmd）
export function c10aAfter(b, c, ev, cmd = b.lastCmd) {
  const st = b.c10;
  if (!st || st.won || !c || b.pendingEnd || b.over) return;
  if (st.kind === 'tamagon') {
    const m = c10Boss(b);
    if (c.side === 'enemy') {
      // メカは 動く たびに あつく なる（止まって いた 番・冷きゃく水の 番は のぞく）
      if (c === m && m.c10t && !ev.c10Over && !ev.c10Cool && !m.c10t.down) mechaHeat(b, m, 1, ev);
      return;
    }
    const cf = c10Conf(C10R_TAMAGON, b);
    const ids = ev?.dual?.m?.length ? ev.dual.m : [c.id];
    // 合体技は 出した みんなが ＋act（力を 合わせる ので 1人ぶんは ふつうの 技と おなじ）
    const d = ev?.dual ? cf.heat.act : heatDelta(c, cmd, cf);
    for (const id of ids) {
      const x = b.get(id);
      if (x?.alive && x.side === 'ally') addHeat(b, x, d, ev);
    }
    return;
  }
  // モルド: てらす・星のうたで カビが 消える
  if (c.side === 'ally' && (ev?.c9bTeru || ev?.c9dSong)) {
    let n = 0;
    for (const x of b.allies) if (x.c10kabi) { n += x.c10kabi; x.c10kabi = 0; ev.upd.push(x); }
    st.cleans++;
    if (n) post(ev).push(ev.c9bTeru ? 'スピカの光で、みんなのカビが、消えていった！' : 'スピカの歌で、みんなのカビが、消えていった！');
    if (ev.c9bTeru) post(ev).push(`${KABI_NAME}の、カビのかべが、光でとけていく…！（しばらく、ダメージが通る！）`);
    ev.c10Clean = { by: c.id, teru: !!ev.c9bTeru };
    const m = c10Boss(b);
    if (m) ev.upd.push(m);
  }
}
// その 行動で あつさが どれだけ かわるか（こうげき・特技・じゅもん ＋act・強い 技 ＋strong・防御 −cool・道具と 回復 0）
export function heatDelta(c, cmd, cf = c10Conf(C10R_TAMAGON)) {
  if (!cmd) return 0;
  switch (cmd.type) {
    case 'defend': return -cf.heat.cool;
    case 'attack': return cf.heat.act;
    case 'mahouken': return cf.heat.strong;
    case 'dual': return cf.heat.act;
    case 'ability': {
      const a = ABILITIES[cmd.id];
      if (!a || a.noAuto || a.kind === 'riddle') return 0;
      const t = prim(a).type;
      if (['heal', 'revive', 'reviveAll', 'cure', 'cureAll'].includes(t) || a.target === 'ally' || a.target === 'allies' || a.target === 'self') return 0;
      return strongOf(a) ? cf.heat.strong : cf.heat.act;
    }
    default: return 0;
  }
}
// 強い 技（MP 20 いじょう・とても 強い 物理）
export const strongOf = (a) => (a?.mp || 0) >= 20 || (prim(a).mult || 0) >= 2.4;
function addHeat(b, x, d, ev) {
  if (!d || x.c10heat === undefined) return;
  const cf = c10Conf(C10R_TAMAGON, b);
  const before = x.c10heat;
  x.c10heat = Math.max(0, Math.min(cf.heat.max, before + d));
  if (x.c10heat !== before) ev?.upd?.push(x);
  if (d < 0 && before > 0) post(ev).push(`${x.name}は、水を飲んで、ひと休み。（あつさが下がった）`);
  if (x.c10heat >= cf.heat.max) nobose(b, x, ev);
}
function nobose(b, x, ev) {
  const cf = c10Conf(C10R_TAMAGON, b);
  x.c10heat = cf.heat.back;
  b.c10.nobose++;
  const dmg = Math.max(0, Math.min(x.hp - 1, Math.round(x.maxHp * cf.heat.nobose)));
  if (dmg > 0) {
    x.hp -= dmg;
    if (ev) (ev.results = ev.results || []).push({ id: x.id, dmg });
  }
  x.status[NOBOSE] = { turns: 1 };
  if (x.ready) x.ready = false;
  b.queue = b.queue.filter((q) => q.id !== x.id || q.cmd?.type === 'dual');
  x.queued = b.queue.some((q) => q.id === x.id);
  x.atb = 0;
  if (ev) {
    post(ev).push(`${x.name}は、あつさで、のぼせてしまった！（${dmg}のダメージ・1回、動けない…）`, '（あつくなったら「防御」で、水を飲んで休もう！）');
    ev.c10Nobose = [...(ev.c10Nobose || []), x.id];
    ev.warn = true;
    ev.upd.push(x);
  }
}
// メカの あつさ
function mechaHeat(b, m, d, ev) {
  const k = m.c10t;
  if (!k || k.over || k.down || !d) return;
  const cf = c10Conf(C10R_TAMAGON, b);
  k.heat = Math.max(0, Math.min(cf.mecha.max, k.heat + d));
  ev?.upd?.push(m);
  if (k.heat >= cf.mecha.max) {
    k.heat = 0;
    k.over = true;
    b.c10.overs++;
    if (m.telegraph === DRILL) m.telegraph = null;
    if (ev) {
      post(ev).push(`${DRILL_NAME}から、白いけむりが、もくもく出てきた！`, 'オーバーヒート！メカが、止まった！（今なら、ダメージが大きく通る！）');
      ev.c10OverHeat = { id: m.id };
      ev.warn = true;
    }
  }
}
// 1回の 行動に 1つ（同じ 行動で 何回 当てても 1つ）
const once = (ev, key) => {
  if (!ev) return true;
  ev.c10once = ev.c10once || new Set();
  if (ev.c10once.has(key)) return false;
  ev.c10once.add(key);
  return true;
};

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c10aTurnStart(b, c, ev, stuck) {
  const st = b.c10;
  if (!st || c.side === 'ally' || st.won || c.id !== st.id) return;
  if (c.telegraph) return;
  ev.upd.push(c);
  if (c.c10t) return tamagonTurn(b, c, ev, stuck);
  if (c.c10m) return moldTurn(b, c, ev, stuck);
}
function tamagonTurn(b, c, ev, stuck) {
  const k = c.c10t;
  const cf = c10Conf(C10R_TAMAGON, b);
  if (k.down) return;
  k.acts++;
  // オーバーヒート: この 番は 止まる
  if (k.over) {
    c.telegraph = OVER;
    return;
  }
  if (stuck) return;
  // HPが 半分を 切った: 冷きゃく水（1回だけ）
  if (!k.cooled && c.hp <= c.maxHp * cf.coolAt) {
    c.telegraph = COOL;
    return;
  }
  if (k.drillReady) {
    if (k.drillWait > 0) {
      k.drillWait--;
      ev.c10DrillLeft = { id: c.id, left: k.drillWait };
      ev.lines.push('（ドリルが、うなりを上げている…！「防御」でそなえよう！）');
      return;
    }
    c.telegraph = DRILL;
    return;
  }
  k.drillLeft--;
  if (k.drillLeft <= 0) c.telegraph = DRILLUP;
}
function moldTurn(b, c, ev, stuck) {
  const k = c.c10m;
  const st = b.c10;
  const cf = c10Conf(C10G_MOLD, b);
  if (k.down) return;
  k.acts++;
  if (!st.half && c.hp <= c.maxHp * 0.5) {
    st.half = true;
    ev.lines.push(`${c.name}「ぐぬぬ…。ならば、とっておきの、じめじめじゃ！」`, '（カビのきりが、ふえた…！大カビばくだんにも、気をつけよう！）');
    ev.c10Half = { id: c.id };
    ev.warn = true;
  }
  if (stuck) return;
  // カビの きり（前ぶれ なし・毎回）
  mist(b, c, ev, st.half ? cf.mist.half : cf.mist.n);
  if (!st.half) return;
  if (k.bombReady) {
    if (k.bombWait > 0) {
      k.bombWait--;
      ev.c10BombLeft = { id: c.id, left: k.bombWait };
      ev.lines.push('（大きなカビの玉が、ふくらんでいく…！「防御」でそなえよう！）');
      return;
    }
    c.telegraph = BOMB;
    return;
  }
  k.bombLeft--;
  if (k.bombLeft <= 0) c.telegraph = BOMBUP;
}
function mist(b, c, ev, n) {
  const st = b.c10;
  const cf = c10Conf(C10G_MOLD, b);
  // カビの 少ない 人から（同じ 数なら くじ）… ひとりに かたよらない（スピカの 技で 消す 前に、きのこに なりにくい）
  const pool = b.aliveAllies().filter((x) => x.c10kabi !== undefined && !x.status[KINOKO]).map((x) => ({ x, r: (x.c10kabi || 0) + b.rng.float(0, 0.99) }));
  const hit = pool.sort((p, q) => p.r - q.r).slice(0, n).map((p) => p.x);
  if (!hit.length) return;
  st.mists++;
  const kin = [];
  for (const x of hit) {
    x.c10kabi = Math.min(cf.kabi.max, (x.c10kabi || 0) + 1);
    if (x.c10kabi >= cf.kabi.max) {
      x.c10kabi = 0;
      kin.push(x);
      st.kinoko++;
      x.status[KINOKO] = { turns: cf.kabi.turns };
      if (x.ready) x.ready = false;
      b.queue = b.queue.filter((q) => q.id !== x.id || q.cmd?.type === 'dual');
      x.queued = b.queue.some((q) => q.id === x.id);
      x.atb = 0;
    }
    ev.upd.push(x);
  }
  ev.lines.push(`${KABI_NAME}が、カビのきりを、ぷしゅーっとまいた！`, `${hit.map((x) => x.name).join('と')}に、カビがついた…`);
  if (kin.length) {
    post(ev).push(`${kin.map((x) => x.name).join('と')}は、カビだらけで、きのこになってしまった！（1回、動けない…）`, '（カビは、スピカの光や歌で消せる！）');
    ev.warn = true;
  }
  ev.c10Mist = { ids: hit.map((x) => x.id), kinoko: kin.map((x) => x.id) };
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c10aEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c10tDrillUp': drillUp(b, c, ev); return true;
    case 'c10tDrill': drill(b, c, ev); return true;
    case 'c10tOver': over(b, c, ev); return true;
    case 'c10tCool': cool(b, c, ev); return true;
    case 'c10mBombUp': bombUp(b, c, ev); return true;
    case 'c10mBomb': bomb(b, c, ev); return true;
    default: return false;
  }
}
function drillUp(b, c, ev) {
  const k = c.c10t;
  if (!k) return;
  const cf = c10Conf(C10R_TAMAGON, b);
  k.drillReady = true;
  k.drillWait = cf.drill.wait;
  ev.lines.push('（もうすぐ、ドリルがみんなにおそいかかる…！「防御」で身を守ろう！）');
  ev.c10DrillUp = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}
function drill(b, c, ev) {
  const k = c.c10t;
  if (!k) return;
  const cf = c10Conf(C10R_TAMAGON, b);
  k.drillReady = false;
  k.drillWait = 0;
  k.drillLeft = k.cooled ? cf.drill.half : cf.drill.every;
  b.c10.drills++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c10t_drill', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: cf.drill.mult * (t.defending ? cf.drill.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  b.c10.drillGuards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.c10Drill = { id: c.id, guarded };
  ev.warn = true;
  ev.upd.push(c);
}
function over(b, c, ev) {
  const k = c.c10t;
  if (!k) return;
  k.over = false;
  ev.lines.push(`${DRILL_NAME}は、ぷしゅう…と止まったまま、動かない。`);
  ev.fx = { type: 'ability', anim: 'c10t_over', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.c10Over = { id: c.id };
  ev.upd.push(c);
}
function cool(b, c, ev) {
  const k = c.c10t;
  if (!k) return;
  k.cooled = true;
  k.heat = 0;
  k.over = false;
  k.drillLeft = Math.min(k.drillLeft, c10Conf(C10R_TAMAGON, b).drill.half);
  b.c10.cools++;
  ev.lines.push('メカのあつさが、0にもどってしまった！', `${c.name}「ここからが、本番じゃ！ドリル、最大回転！」（ドリルの攻撃が、ふえる…！）`);
  ev.fx = { type: 'ability', anim: 'c10t_cool', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.c10Cool = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}
function bombUp(b, c, ev) {
  const k = c.c10m;
  if (!k) return;
  const cf = c10Conf(C10G_MOLD, b);
  k.bombReady = true;
  k.bombWait = cf.bomb.wait;
  ev.lines.push('（もうすぐ、大カビばくだんが来る…！「防御」で身を守ろう！）');
  ev.c10BombUp = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}
function bomb(b, c, ev) {
  const k = c.c10m;
  if (!k) return;
  const cf = c10Conf(C10G_MOLD, b);
  k.bombReady = false;
  k.bombWait = 0;
  k.bombLeft = cf.bomb.every;
  b.c10.bombs++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c10m_bomb', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: cf.bomb.mult * (t.defending ? cf.bomb.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  b.c10.bombGuards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.c10Bomb = { id: c.id, guarded };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の はじめ。味方 → 敵）─────────────
// カビの 人の 攻撃は へる・カビの かべ（半分）・オーバーヒート中（1.5倍）・メカの あつさ（炎 ＋1・氷 −1）・HP 1 で 止まる（勝ち）
export function c10aDamage(b, c, t, dmg, info, ev) {
  const st = b.c10;
  if (!(dmg > 0) || !st || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  if (c.c10kabi > 0) {
    const cf = c10Conf(C10G_MOLD, b);
    dmg = Math.max(1, Math.round(dmg * (1 - cf.kabi.atk * c.c10kabi)));
  }
  if (t.id !== st.id || st.won) return dmg;
  if (t.c10t) {
    const cf = c10Conf(C10R_TAMAGON, b);
    if (t.c10t.over) dmg = Math.round(dmg * cf.mecha.over);
    const el = info?.element;
    if (el === 'fire' && once(ev, 'mf')) mechaHeat(b, t, cf.mecha.fire, ev);
    else if (el === 'ice' && once(ev, 'mi') && !t.c10t.over) {
      const before = t.c10t.heat;
      t.c10t.heat = Math.max(0, t.c10t.heat + cf.mecha.ice);
      if (before > t.c10t.heat && ev) {
        post(ev).push(`（氷で、${DRILL_NAME}が、ひえてしまった…）`);
        ev.c10Iced = { id: t.id };
        ev.upd.push(t);
      }
    }
  }
  if (t.c10m && wallUp(b)) {
    dmg = Math.max(1, Math.round(dmg * c10Conf(C10G_MOLD, b).wall));
    if (ev && !ev.c10Wall) {
      ev.c10Wall = true;
      post(ev).push(c10Conf(C10G_MOLD, b).wall < 0.5 ? '（カビのかべで、ダメージがほとんど通らない…！）' : '（カビのかべで、ダメージが半分になった…）');
    }
  }
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    bossDown(b, t, ev);
  }
  return dmg;
}
function bossDown(b, c, ev) {
  const st = b.c10;
  st.won = true;
  const k = c.c10t || c.c10m;
  if (k) {
    k.down = true;
    Object.assign(k, { drillReady: false, bombReady: false, over: false });
  }
  c.telegraph = null;
  b.killed.push(c.species);
  if (ev) {
    if (c.c10t) {
      post(ev).push(
        `${DRILL_NAME}は、プスプスと、けむりをはいて、止まった…！`,
        `${c.name}「ぬぬぬ…！わしのドリルが…！」`,
        `${c.name}「ええい、きょうのところは、引き上げじゃ！にげる用意じゃ〜！」`,
      );
    } else {
      post(ev).push(
        `${KABI_NAME}のプロペラが、ひゅるる…と、止まった。`,
        `${c.name}「…なんと。わがはいのカビが、光にまけるとは…。」`,
        `${c.name}は、しょんぼりと、ぼうしをかぶりなおした。`,
      );
    }
    ev.c10Down = { id: c.id };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── 受ける ダメージ（battle.js の damage。敵 → 味方）: 炎の 攻撃を 受けると あつさ ＋1 ─────────────
export function c10aTaken(b, c, t, dmg, info, ev) {
  const st = b.c10;
  if (!(dmg > 0) || !st || st.kind !== 'tamagon' || st.won || t?.side !== 'ally' || c?.side !== 'enemy') return dmg;
  if (info?.element === 'fire' && t.c10heat !== undefined && once(ev, `h${t.id}`)) {
    const cf = c10Conf(C10R_TAMAGON, b);
    if (t.c10heat + cf.heat.fire < cf.heat.max) {
      t.c10heat += cf.heat.fire;
      ev?.upd?.push(t);
    } else addHeat(b, t, cf.heat.fire, ev);
  }
  return dmg;
}
// 受ける 回復（battle.js の heal）: カビ 1つに つき −kabi.heal
export function c10aHealTo(b, t) {
  if (!b?.c10 || !(t?.c10kabi > 0)) return 1;
  return Math.max(0, 1 - c10Conf(C10G_MOLD, b).kabi.heal * t.c10kabi);
}
// 動けない 番（battle.js の doIncapacitated）: のぼせた・きのこ
export function c10aIncap(b, c, ev) {
  const key = c.status[NOBOSE] ? NOBOSE : c.status[KINOKO] ? KINOKO : null;
  if (!key) return false;
  const s = c.status[key];
  s.turns--;
  if (s.turns <= 0) delete c.status[key];
  ev.name = key === NOBOSE ? 'のぼせた' : 'きのこ';
  ev.lines.push(key === NOBOSE ? `${c.name}は、のぼせて、ふらふらしている…` : `${c.name}は、きのこになっていて、動けない…`);
  if (!c.status[key]) ev.lines.push(key === NOBOSE ? `${c.name}は、なんとか、立ち直った！` : `${c.name}は、ぶるぶるっと、カビをはらいおとした！`);
  ev.c10Stuck = { id: c.id, kind: key };
  ev.upd.push(c);
  return true;
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// 中ボスの 戦いで なければ undefined。ふつうの オート（家族の キャラ）は null
export function c10aPlan(b, c, decide, bestHit) {
  const st = b.c10;
  if (!st) return undefined;
  const m = c10Boss(b);
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won || !m?.alive) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  return st.kind === 'tamagon' ? tamagonPlan(b, c, m, mode, decide, bestHit) : moldPlan(b, c, m, mode, decide, bestHit);
}
function tamagonPlan(b, c, m, mode, decide, bestHit) {
  const cf = c10Conf(C10R_TAMAGON, b);
  const k = m.c10t;
  const heat = c.c10heat || 0;
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 人の 仲間（酒場の 人）: あつさが 4 いじょうの 番の 3回に 1回 休む（数は 自動の 仲間 みんなで 1つ）
    if (c.kind === 'player' || c.kind === 'monster' || heat < cf.heat.max - 1 || !someoneChooses(b)) return null;
    b.c10auto = (b.c10auto || 0) + 1;
    return b.c10auto % AUTO_EVERY ? null : { type: 'defend' };
  }
  const alone = b.allies.length === 1;
  const drillSoon = k.drillReady && (!(k.drillWait > 0) || !alone);
  if (mode === 'blind') {
    if ((drillSoon || heat >= cf.heat.max - 1) && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    return null;
  }
  // 知って いる 人: ドリルの 前は 身を 守る（水も 飲める）・この 行動で のぼせるなら 休む・ふだんは 炎で メカを あつく する（氷は 使わない）
  if (drillSoon && !c.defending) return { type: 'defend' };
  let cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  if (heat + Math.max(cf.heat.act, heatDelta(c, cmd, cf)) >= cf.heat.max) return { type: 'defend' };
  // 強い 技で のぼせそうなら ふつうの 攻撃に
  if (heat + heatDelta(c, cmd, cf) >= cf.heat.max) cmd = { type: 'attack', target: m.id };
  // 炎の 技（メカに 当てる）
  // （ひとりの 時は 手数が 少ない ので、ふだんの いちばん 強い 技の まま）
  const fire = !k.over && !alone ? bestElem(b, c, m, 'fire', heat + cf.heat.act < cf.heat.max - 1 ? 99 : cf.heat.act) : null;
  if (fire) return fire;
  if (a && prim(a).element === 'ice' && a.target !== 'ally' && a.target !== 'allies') return bestHit(b, c, m) || { type: 'attack', target: m.id };
  return cmd;
}
function moldPlan(b, c, m, mode, decide, bestHit) {
  const k = m.c10m;
  const mates = b.aliveAllies();
  const kabi2 = mates.some((x) => (x.c10kabi || 0) >= 2);
  const kabi1 = mates.some((x) => (x.c10kabi || 0) >= 1);
  const queued = (id) => b.queue.some((q) => q.cmd?.id === id);
  const canSong = songReady(b) && canUse(b, c, SONG) && !queued(SONG) && !queued(TERU);
  const canTeru = teruReady(b) && canUse(b, c, TERU) && !queued(TERU);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 人の 仲間（酒場の 人）: スピカの 技が たまって いて 役に 立つ 番の 3回に 1回 使う
    if (c.kind === 'player' || c.kind === 'monster' || !someoneChooses(b)) return null;
    const useSong = canSong && kabi1;
    const useTeru = canTeru && (kabi1 || wallUp(b));
    if (!useSong && !useTeru) return null;
    b.c10auto = (b.c10auto || 0) + 1;
    if (b.c10auto % AUTO_EVERY) return null;
    return { type: 'ability', id: useSong ? SONG : TERU };
  }
  const alone = b.allies.length === 1;
  const bombSoon = k.bombReady && (!(k.bombWait > 0) || !alone);
  if (mode === 'blind') {
    if (bombSoon && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    if (kabi2 && (canSong || canTeru) && b.rng.chance(0.15)) return { type: 'ability', id: canSong ? SONG : TERU };
    return null;
  }
  // 知って いる 人: 大カビばくだんの 前は 身を 守る・カビが 2つ たまった 人が いれば 星のうた（なければ てらす）・かべが ある 間に てらす が たまれば てらす
  if (bombSoon && !c.defending) return { type: 'defend' };
  if (kabi2 && canSong) return { type: 'ability', id: SONG };
  if (canTeru && (wallUp(b) || kabi2)) return { type: 'ability', id: TERU };
  const cmd = base(b, c, decide);
  void bestHit;
  return cmd;
}
// 人が 自分で えらんで いる 家族の キャラが いるか（みんな オート〈完全オート〉の 時は、自動の 仲間も しくみを 使わない … 13-5「完全オートは 勝てない」）
export const someoneChooses = (b) => b.allies.some((x) => x.alive && x.kind === 'player' && x.controller && !x.auto);
// その 属性の 技で いちばん 大きい 1回（あつさの 上がりが lim いかの 技だけ。なければ null）
function bestElem(b, c, t, el, lim) {
  let best = null;
  const cf = c10Conf(C10R_TAMAGON, b);
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !['enemy', 'enemies', 'group'].includes(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    if (e.element !== el) continue;
    if (heatDelta(c, { type: 'ability', id }, cf) > lim) continue;
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, el, true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    if (dmg > 0 && (!best || dmg > best.dmg)) best = { cmd: { type: 'ability', id, ...(a.target === 'enemy' ? { target: t.id } : {}) }, dmg };
  }
  return best?.cmd || null;
}
function base(b, c, decide) {
  b.c9Inner = true;
  try {
    return decide(b, c);
  } finally {
    b.c9Inner = false;
  }
}
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c10aBusy(b) {
  const st = b.c10;
  if (!st || st.won) return false;
  return !!c10aTell(b);
}

// ───────────── がめんへ ─────────────
// 中ボス（battle-c9b.js の c9bPub から）: c10Kind・mHeat・mHeatMax・mOver（オーバーヒートで 止まって いる）・drill（前ぶれ）・drillLeft・cooled・
//   wall（カビの かべ）・wallLit（てらして いる のこり）・bomb（前ぶれ）・half・c10Down（勝った。メカが 止まった）
export function c10aPub(c, b = c?._b10) {
  const o = {};
  if (!b?.c10 || c?.id !== b.c10.id) return o;
  const st = b.c10;
  o.c10Kind = st.kind;
  o.c10Down = st.won ? 1 : 0;
  if (c.c10t) {
    const cf = c10Conf(C10R_TAMAGON, b);
    o.mHeat = c.c10t.heat;
    o.mHeatMax = cf.mecha.max;
    o.mOver = c.c10t.over ? 1 : 0;
    o.drill = c.c10t.drillReady ? 1 : 0;
    o.drillLeft = Math.max(0, c.c10t.drillLeft);
    o.cooled = c.c10t.cooled ? 1 : 0;
  }
  if (c.c10m) {
    o.wall = wallUp(b) ? 1 : 0;
    o.wallLit = st.won ? 0 : teruOf(b)?.lit || 0;
    o.bomb = c.c10m.bombReady ? 1 : 0;
    o.half = st.half ? 1 : 0;
  }
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: heat10・heatMax10（あつさ）・kabi10・kabiMax10（カビ）
export function c10aAllyPub(c) {
  const o = {};
  if (c.c10heat !== undefined) {
    o.heat10 = c.c10heat;
    o.heatMax10 = 5;
  }
  if (c.c10kabi !== undefined) {
    o.kabi10 = c.c10kabi;
    o.kabiMax10 = 3;
  }
  return o;
}
void C10G_MOLD;
