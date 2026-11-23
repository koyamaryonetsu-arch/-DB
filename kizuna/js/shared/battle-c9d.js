// 第3部 第1章 第4幕「星のはかば」の 戦いの しかけ（battle-c9b.js・battle.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c9d.md の 12-3
//
// ・スピカの「星のうた」（SONG）… リーダーが c9_song1 を 持って いる 戦い（と 魔人の 戦い）で 出る
//   だれでも えらべる（その 人の 番を 使う）。スピカの ほのかな光（みんなが 1回ずつ 動いた ＝ 1つの 番）ごとに 1つ たまり、SONG_MAX（5）で 使える
//   （「てらす」とは べつに たまる）。味方 全員の 悪い 状態（どく・ねむり・こんらん・マヒ・まぼろし・ふうじ・おかし）を なおし、最大HPの SONG_HEAL 回復
//   オートでは 使わない（noAuto）。知って いる 人（シミュレーター）は おかし・ねむりの 仲間が いる 時に 使う
//   スピカと はなれて いる 間の 戦い（12-2）は、A班が hooks.leaderFlag で c9_child・c9_act1・c9_song1 に false を かえせば スピカごと 出ない
// ・幕の ボス「あそびたい魔人 ムウ」（monsters-c9d.js の c9d.kind 'mu'）… ふたり 同時に
//   はじめは 1体（ムウムウは たおれた すがたで かくれて いる）。HPが split を 切ると、次の 番で 2体に 分かれる（m9m_split）
//   片方が たおれると「ばたんきゅう」（ほんとうに たおれる ＝ alive false）。もう 片方の 番が 来ると「おきて、おきて！」（m9m_wake）で 起こす
//     起こす たびに 2体とも 攻撃 wakeUp ずつ 上がる（power）。2体とも たおれると 勝ち（すわりこむ。たおれない）
//   「仲間はずれは、いやだ！」: 2体の HPの 差が 最大の apart より 大きいと、多い 方の 攻撃 angry ばい（番の はじめに 見る）
//   おかしビーム: beam.every 回 動く ごとに 前ぶれ（m9m_beamup。ねらう 人が 出る）→ beam.wait 回 ふつうに 動いた あとの 番に うつ（m9m_beam）
//     ねらわれた 人が 身を 守って いれば ふせげる。当たると「おかし」（status.okashi。beam.turns 回 動けない・受ける ダメージ beam.taken ばい）
//   いっしょに ドーン: 2体が そろって いる 時、2体で doon.every 回 動く ごとに 前ぶれ（m9m_doonup）→ doon.wait 回 あとの その 体の 番に 全体へ（m9m_doon）
// ・自動の 仲間（酒場の 人）は 3回に 1回、HPの 多い 方を ねらう（AUTO_EVERY。数は みんなで 1つ）。家族の キャラの「オート」と 魔物の 仲間は ねらい分けない
// ・人数で 合わせる（few・solo・monK）は 第2幕・第3幕と おなじ 数え方（魔物の 仲間は 半人ぶん）
import { MONSTERS } from './data/monsters.js?v=dc7c9b067c89';
import { ABILITIES } from './data/abilities.js?v=dc7c9b067c89';
import { SONG } from './data/abilities-c9d.js?v=dc7c9b067c89';
import { C9D_MU, C9D_MUMU } from './data/monsters-c9d.js?v=dc7c9b067c89';
import { C9D } from './maps/c9d-flags.js?v=dc7c9b067c89';
import { canUse } from './ai.js?v=dc7c9b067c89';
// 第101回 R1班: 人数で 合わせる 数の えらび方（solo → bare → few）は 第1章 みんなで 同じ
import { pickPeople } from './battle-c9a.js?v=dc7c9b067c89';
import { someoneChooses } from './battle-c10a.js?v=dc7c9b067c89';

export { SONG };
export const SPLIT = 'm9m_split';
export const WAKE = 'm9m_wake';
export const BEAMUP = 'm9m_beamup';
export const BEAM = 'm9m_beam';
export const DOONUP = 'm9m_doonup';
export const DOON = 'm9m_doon';
export const SONG_MAX = 5;
export const SONG_HEAL = 0.1;
export const AUTO_EVERY = 3;
// 星のうたで なおる 悪い 状態
export const BAD_STATUS = ['poison', 'sleep', 'confuse', 'paralyze', 'blind', 'silence', 'okashi'];
export const OKASHI = 'okashi';

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const confOf = (m) => MONSTERS[m?.species]?.c9d || null;

// 人数（家族の キャラ ＝ kind 'player' の 数。魔物の 仲間は 半人ぶん。1〜5。battle-c9c.js の peopleOf9c と おなじ）
export function peopleOf9d(b) {
  if (b?.c9dPeople) return b.c9dPeople;
  const al = b?.allies || [];
  const p = al.filter((a) => a.kind === 'player').length;
  const n = p ? Math.floor(p + al.filter((a) => a.kind === 'monster').length * 0.5) : 0;
  return Math.max(1, Math.min(5, n || 4));
}
export function muConf(m, b = null) {
  const c = MONSTERS[C9D_MU].c9d;
  void m;
  // 仲間なしの ひとりは solo・仲間なしの 2人・3人は bare（第101回 R1班）を few より 先に（battle-c9a.js の pickPeople）
  const pick = pickPeople(c, b, peopleOf9d);
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return {
    tired: pick('tired', c.tired ?? 0.15),
    spd: pick('spd', 1),
    split: c.split ?? 0.75, part: c.part ?? 0.6, wake: pick('wake', c.wake ?? 0.4), wakeUp: pick('wakeUp', c.wakeUp ?? 0.2), apart: c.apart ?? 0.25, angry: c.angry ?? 1.5,
    beam: { every: 4, wait: 1, turns: 2, taken: 1.5, ...(c.beam || {}), every: pick('beamEvery', c.beam?.every ?? 4), wait: pick('beamWait', c.beam?.wait ?? 1) },
    doon: { every: 4, wait: 1, mult: 1.3, guardCut: 0.45, ...(c.doon || {}), every: pick('doonEvery', c.doon?.every ?? 4), wait: pick('doonWait', c.doon?.wait ?? 1), mult: (c.doon?.mult ?? 1.3) * pick('doonK', 1) },
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons),
  };
}
export const muState = (b) => b?.c9mu || null;
export const muOf = (b) => (b?.c9mu ? b.get(b.c9mu.mu) : null);
export const mumuOf = (b) => (b?.c9mu ? b.get(b.c9mu.mumu) : null);
export const musOf = (b) => [muOf(b), mumuOf(b)].filter(Boolean);
export const partnerOf = (b, c) => (c?.species === C9D_MU ? mumuOf(b) : c?.species === C9D_MUMU ? muOf(b) : null);
export const songOf = (b) => b?.c9sp?.song || null;
export const songReady = (b) => { const s = songOf(b); return !!s && s.charge >= s.max; };
export const okashiOf = (c) => !!c?.status?.[OKASHI];

// ───────────── はじめ（battle-c9b.js の setupC9b から）─────────────
// かえす 値: スピカを 出すか（魔人の 戦いは かならず）。星のうた … リーダーが c9_song1 か 魔人の 戦い（b.c9songOn。addTeru の あとで addSong）
export function setupC9d(b, lines) {
  let on = false;
  try {
    if (b.hooks?.leaderFlag?.(C9D.song1)) b.c9songOn = true;
  } catch { /* */ }
  const mu = b.enemies.find((e) => e.species === C9D_MU);
  if (mu) {
    setupMu(b, mu, lines);
    b.c9songOn = true;
    on = true;
  }
  return on;
}
// スピカが 入った あと（星のうたの たまりぐあい。何回 よんでも おなじ。シミュレーター・テストからも よぶ）
export function addSong(b) {
  const s = b.c9sp;
  if (!s || s.song) return s?.song || null;
  // 第3部 第2章 第2幕: 青の 音の ごほうび … 4回で たまる（battle-c10b.js の setupC10b が b.c10rew.songMax）
  s.song = { charge: 0, max: b.c10rew?.songMax || SONG_MAX, uses: 0 };
  for (const a of b.allies) if (!a.abilities.includes(SONG)) a.abilities = [SONG, ...a.abilities];
  return s.song;
}
export function songPub(b) {
  const s = songOf(b);
  return s ? { charge: s.charge, max: s.max } : null;
}

function setupMu(b, m, lines) {
  const mc = muConf(m, b);
  if (mc.hp !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * mc.hp));
  if (mc.atk !== 1) m.atk = Math.max(1, Math.round(m.atk * mc.atk));
  const mm = b.enemies.find((e) => e.species === C9D_MUMU);
  // はやさ（人数で。ひとりは ゆっくり … spd）
  if (mc.spd !== 1) for (const e of [m, mm].filter(Boolean)) e.speed = (e.speed || 1) * mc.spd;
  b.c9mu = { mu: m.id, mumu: mm?.id || null, split: false, won: false, H0: null, atk0: null, power: 1, wakes: 0, pair: 0, splits: 0, kos: 0, angers: 0, beams: 0, blocked: 0, okashi: 0, doons: 0, doonGuards: 0 };
  // 前ぶれ中の しるし（1つの 値）: b.c9mu.tele … 'beam'（おかしビームの ねらい あり）・'doon'（いっしょに ドーンの 前ぶれ）・null
  //   第3幕 B班の「前ぶれの 間は 人が えらぶまで 敵の 時間を 止める」しくみに あとで つなぐ（c9dTele(b) も おなじ）
  Object.defineProperty(b.c9mu, 'tele', { enumerable: false, get: () => c9dTele(b) });
  for (const e of [m, mm].filter(Boolean)) {
    Object.defineProperty(e, '_b9', { value: b, enumerable: false, configurable: true, writable: true });
    e.c9m = { acts: 0, beamLeft: mc.beam.every + (e === mm ? 2 : 0), beamAim: null, beamWait: 0, doon: false, doonWait: 0, angry: false, ko: false, sit: false };
  }
  // ムウムウは はじめは いない（分かれると 出る）
  if (mm) {
    Object.assign(mm, { alive: false, hp: 0, atk: m.atk });
    mm.c9m.hidden = true;
  }
  lines.push(
    `${m.name}「あそぼう！あそぼう！」`,
    `${m.name}「ここの星たち、ずーっとねてるんだもん。つまんないの。」`,
    '（ムウが2体になったら、同じくらいにけずって、2体いっしょにたおそう…！）',
  );
}

// 今 前ぶれ中か（'beam' … おかしビームの ねらいが 出て いる・'doon' … いっしょに ドーンの 前ぶれ・null … なし）
export function c9dTele(b) {
  const st = b?.c9mu;
  if (!st || st.won) return null;
  const up = musOf(b).filter((x) => x.alive && x.c9m);
  if (up.some((x) => x.c9m.beamAim)) return 'beam';
  if (up.some((x) => x.c9m.doon)) return 'doon';
  return null;
}

// ───────────── スピカの ほのかな光の あと（battle-c9b.js の c9bGlow から。1つの 番）─────────────
export function c9dGlow(b, out, lines) {
  const s = songOf(b);
  if (!s || s.charge >= s.max) return;
  s.charge++;
  if (s.charge >= s.max) {
    lines.push('スピカ「歌えるよ！星のうた！」');
    out.songReady = true;
  }
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c9dTurnStart(b, c, ev, stuck) {
  if (c.side === 'ally' || !c.c9m || !b.c9mu) return;
  const st = b.c9mu;
  const k = c.c9m;
  const mc = muConf(c, b);
  if (c.telegraph || st.won) return;
  k.acts++;
  ev.upd.push(c);
  // もとの 攻撃力（はじめの 番で おぼえる。シミュレーターの ATKK も 入る）
  if (st.atk0 == null) st.atk0 = muOf(b)?.atk || c.atk;
  if (st.H0 == null) st.H0 = muOf(b)?.maxHp || c.maxHp;
  angryCheck(b, ev);
  if (stuck) return;
  const p = partnerOf(b, c);
  if (!st.split) {
    if (c.hp <= c.maxHp * mc.split) {
      c.telegraph = SPLIT;
      return;
    }
  } else if (p && !p.alive) {
    // ばたんきゅうした 方は、へとへとの 自分では 起こせない（すぐ 起こすのは c9dDamage。ここでは ことばだけ 1回）
    k.doon = false;
    if (!k.tiredSaid) {
      k.tiredSaid = true;
      ev.lines.push(`${c.name}「…おきてよぉ…。でも、もう、へとへと…」`);
    }
  }
  // おかしビーム（前ぶれの あと）
  if (k.beamAim) {
    if (k.beamWait > 0) {
      k.beamWait--;
      ev.c9mBeamLeft = { id: c.id, aim: k.beamAim, left: k.beamWait };
      ev.lines.push(`（${b.get(k.beamAim)?.name || ''}が、ねらわれている…！「防御」で身を守ろう！）`);
      return;
    }
    c.telegraph = BEAM;
    return;
  }
  // いっしょに ドーン（前ぶれの あと）
  if (k.doon) {
    if (k.doonWait > 0) {
      k.doonWait--;
      ev.c9mDoonLeft = { id: c.id, left: k.doonWait };
      ev.lines.push('（ムウとムウムウが、手をつないで、力をためている…！「防御」でそなえよう！）');
      return;
    }
    c.telegraph = DOON;
    return;
  }
  k.beamLeft--;
  if (k.beamLeft <= 0) {
    c.telegraph = BEAMUP;
    return;
  }
  if (st.split && p?.alive && !p.c9m?.doon) {
    st.pair++;
    if (st.pair >= mc.doon.every) {
      st.pair = 0;
      c.telegraph = DOONUP;
    }
  }
}

// 仲間はずれ: HPが 多い 方が おこる（攻撃 angry ばい）。番の はじめに 見る
function angryCheck(b, ev) {
  const st = b.c9mu;
  const mc = muConf(null, b);
  const two = musOf(b);
  const both = st.split && two.length === 2 && two.every((x) => x.alive);
  for (const x of two) {
    const p = partnerOf(b, x);
    const mad = both && x.hp - p.hp > x.maxHp * mc.apart;
    if (mad && !x.c9m.angry) {
      st.angers++;
      ev.lines.push(`${x.name}「仲間はずれは、いやだ！」`, `${x.name}は、ぷんぷんおこっている！（HPを、同じくらいにけずろう！）`);
      ev.c9mAngry = { id: x.id };
      ev.warn = true;
      ev.upd.push(x);
    }
    x.c9m.angry = mad;
    x.atk = Math.max(1, Math.round(st.atk0 * st.power * (mad ? mc.angry : 1)));
  }
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の はじめ）─────────────
export function c9dEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c9mSplit': split(b, c, ev); return true;
    case 'c9mWake': wake(b, c, ev); return true;
    case 'c9mBeamUp': beamUp(b, c, ev); return true;
    case 'c9mBeam': beam(b, c, ev); return true;
    case 'c9mDoonUp': doonUp(b, c, ev); return true;
    case 'c9mDoon': doon(b, c, ev); return true;
    case 'c9dSong': song(b, c, ev); return true;
    default: return false;
  }
}

function split(b, c, ev) {
  const st = b.c9mu;
  const mm = mumuOf(b);
  if (!st || st.split) return;
  const mc = muConf(c, b);
  st.split = true;
  st.splits++;
  const hp = Math.max(1, Math.round((st.H0 || c.maxHp) * mc.part));
  c.maxHp = c.hp = hp;
  ev.lines.push('…ぽんっ！！', `${c.name}が、ふたつに分かれた！`);
  if (mm) {
    Object.assign(mm, { alive: true, hp, maxHp: hp, status: {}, buffs: {}, debuffs: {}, atb: 30, ready: false, queued: false, telegraph: null, defending: false });
    mm.atk = c.atk;
    mm.c9m.hidden = false;
    ev.lines.push(`${mm.name}「やっほー！いっしょにあそぼ！」`, `${c.name}「わーい！ふたりなら、たのしいね！」`);
    ev.upd.push(mm);
  }
  ev.lines.push('（片方だけたおしても、起こされてしまう…！2体を同じくらいにけずろう！）');
  ev.fx = { type: 'ability', anim: 'c9m_split', actor: c.id, targets: [c.id, ...(mm ? [mm.id] : [])], side: 'enemy' };
  ev.c9mSplit = { id: c.id, other: mm?.id || null };
  ev.warn = true;
  ev.upd.push(c);
}

function wake(b, c, ev) {
  const st = b.c9mu;
  const p = partnerOf(b, c);
  if (!st || !p || p.alive) {
    ev.lines.push(`${c.name}は、楽しそうに、くるくる回っている。`);
    return;
  }
  const mc = muConf(c, b);
  Object.assign(p, { alive: true, hp: Math.max(1, Math.round(p.maxHp * mc.wake)), status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false, telegraph: null, defending: false });
  Object.assign(p.c9m, { ko: false, beamAim: null, beamWait: 0, doon: false, doonWait: 0 });
  // たおした ことに しない（経験値は さいごに 1回）
  const k = b.killed.lastIndexOf(p.species);
  if (k >= 0) b.killed.splice(k, 1);
  st.wakes++;
  st.power = Math.round((st.power + mc.wakeUp) * 100) / 100;
  for (const x of musOf(b)) x.atk = Math.max(1, Math.round(st.atk0 * st.power * (x.c9m.angry ? mc.angry : 1)));
  ev.lines.push(`${p.name}「…ふぁ？」`, `${p.name}は、目をさました！`, `${c.name}「よーし、もっとあそぼう！」（2体とも、攻撃力が上がった！）`);
  ev.fx = { type: 'ability', anim: 'c9m_wake', actor: c.id, targets: [p.id], side: 'enemy' };
  ev.c9mWake = { id: c.id, to: p.id, wakes: st.wakes };
  ev.warn = true;
  ev.upd.push(c, p);
}

function beamUp(b, c, ev) {
  const k = c.c9m;
  if (!k) return;
  const mc = muConf(c, b);
  k.beamLeft = mc.beam.every;
  // ねらうのは、まだ おかしに なって いない 人（ほかの 体が ねらって いる 人も よける）
  const aimed = musOf(b).map((x) => x.c9m?.beamAim).filter(Boolean);
  const all = b.aliveAllies();
  const pool = all.filter((x) => !okashiOf(x) && !aimed.includes(x.id));
  // みんな もう ねらわれて いる・おかし … ことばだけ（ひとりの 時に 2体が 同じ 人を ねらい続けない）
  if (!pool.length) {
    ev.lines.push(`${c.name}「…みんな、もう、ねらわれてるや。」`);
    return;
  }
  const t = pool[b.rng.int(0, pool.length - 1)];
  k.beamAim = t.id;
  k.beamWait = mc.beam.wait;
  ev.lines.push(`${c.name}が、${t.name}を、じーっと見ている…！`, `${c.name}「ねえ、おかしになってよ〜」`, `（ねらいは${t.name}…！「防御」で身を守ろう！）`);
  ev.c9mBeamUp = { id: c.id, aim: t.id };
  ev.warn = true;
  ev.upd.push(c);
}

function beam(b, c, ev) {
  const st = b.c9mu;
  const k = c.c9m;
  if (!k) return;
  const mc = muConf(c, b);
  const t = b.get(k.beamAim);
  k.beamAim = null;
  k.beamWait = 0;
  st.beams++;
  if (!t?.alive) {
    ev.lines.push('おかしビームは、だれにも当たらなかった。');
    return;
  }
  ev.fx = { type: 'ability', anim: 'c9m_beam', actor: c.id, targets: [t.id], side: 'enemy' };
  if (t.defending) {
    st.blocked++;
    ev.lines.push(`${t.name}は、身を守って、おかしビームをはね返した！`, `${c.name}「ちぇ〜っ。」`);
    ev.c9mBeam = { id: c.id, to: t.id, blocked: true };
    ev.upd.push(t);
    return;
  }
  st.okashi++;
  setOkashi(b, t, mc.beam.turns, ev);
  ev.lines.push(`${t.name}は、ぽんっと、大きなおかしになってしまった！`, '（おかしの間は、動けない！スピカの「星のうた」でなおそう！）');
  ev.c9mBeam = { id: c.id, to: t.id, blocked: false };
  ev.warn = true;
}
// おかしに する（動けない。受ける ダメージ が ふえる）
export function setOkashi(b, t, turns, ev = null) {
  t.status[OKASHI] = { turns: turns + (t.ready || t.queued ? 0 : 0) };
  // 自分の 番を まって いた・えらんだ 行動は とりけす
  if (t.ready) t.ready = false;
  b.queue = b.queue.filter((q) => q.id !== t.id);
  t.queued = false;
  t.atb = 0;
  if (ev) ev.upd.push(t);
}

function doonUp(b, c, ev) {
  const k = c.c9m;
  const p = partnerOf(b, c);
  if (!k || !p?.alive) return;
  const mc = muConf(c, b);
  k.doon = true;
  k.doonWait = mc.doon.wait;
  ev.lines.push(`${c.name}と${p.name}が、手をつないだ！`, `${p.name}「いいよ〜！せーの、で、いくよ！」`, '（次に、いっしょにドーンが来る…！「防御」でそなえよう！）');
  ev.c9mDoonUp = { id: c.id, with: p.id };
  ev.warn = true;
  ev.upd.push(c, p);
}

function doon(b, c, ev) {
  const st = b.c9mu;
  const k = c.c9m;
  if (!k) return;
  k.doon = false;
  const p = partnerOf(b, c);
  if (!p?.alive) {
    ev.lines.push(`${c.name}「…あれ？ひとりじゃ、できないや。」`);
    return;
  }
  const mc = muConf(c, b);
  st.doons++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c9m_doon', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: mc.doon.mult * (t.defending ? mc.doon.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  st.doonGuards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.c9mDoon = { id: c.id, with: p.id, guarded };
  ev.warn = true;
  ev.upd.push(c, p);
}

// 星のうた（だれでも。その 人の 番を 使う）
function song(b, c, ev) {
  const s = songOf(b);
  if (!s) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  if (s.charge < s.max) {
    ev.lines.push('しかし、スピカの歌は、まだたまっていない…。');
    return;
  }
  s.charge = 0;
  s.uses++;
  ev.lines.push('スピカが、星のうたを歌った♪', 'あたたかい歌声が、みんなをつつみこむ…');
  ev.fx = { type: 'ability', anim: 'c9d_song', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'ally' };
  ev.results = ev.results || [];
  const cured = [];
  for (const t of b.aliveAllies()) {
    const bad = BAD_STATUS.filter((k) => t.status?.[k]);
    if (bad.length) {
      for (const k of bad) delete t.status[k];
      cured.push(t);
      // ねむり・マヒ・おかしで 動けなかった 人は すぐ 動ける ように（battle.js の executeNext が 'incapacitated' を ふつうの 番に する）
      if (bad.some((k) => ['sleep', 'paralyze', OKASHI].includes(k)) && !t.queued && !t.ready) t.atb = Math.max(t.atb, 60);
    }
    const heal = Math.min(t.maxHp - t.hp, Math.max(1, Math.round(t.maxHp * SONG_HEAL)));
    if (heal > 0) {
      t.hp += heal;
      ev.results.push({ id: t.id, heal });
    }
    ev.upd.push(t);
  }
  if (cured.length) ev.lines.push(`${cured.map((x) => x.name).join('と')}は、元にもどった！`);
  ev.lines.push('みんなのHPが、少し回復した！');
  ev.c9dSong = { by: c.id, cured: cured.map((x) => x.id) };
  ev.c9Spica = { light: b.c9sp.light, max: b.c9sp.max, song: songPub(b) };
  ev.upd.push(c);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の はじめ。味方 → 敵）─────────────
// 分かれる 前の ムウは HP 1 より 下がらない（分かれる 前に たおれない）
// 分かれた あと: たおされそうな 方は、もう 片方が へとへと（最大の tired いか）で なければ その場で 起こされる
//   （ばたんきゅう → すぐ「おきて、おきて！」。HP wake で もどる・2体とも 攻撃 wakeUp アップ）。2体とも へとへとに してから たおす
export function c9dDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || !t?.c9m || !b.c9mu) return dmg;
  const st = b.c9mu;
  if (!st.split && t.species === C9D_MU) return Math.max(0, Math.min(dmg, t.hp - 1));
  if (st.split && !st.won && dmg >= t.hp) {
    const p = partnerOf(b, t);
    if (p?.alive && !tiredOf(p, b)) {
      wakeNow(b, t, p, ev);
      // 受けた ダメージは そのまま 見せて、HPは 起こされた 値に（hp − dmg ＝ 起こされた HP）
      t.hp += dmg;
      void c; void info;
      return dmg;
    }
  }
  return dmg;
}
// へとへと（HPが 最大の tired いか）… この 体は 相手を 起こせない
export const tiredOf = (x, b) => !!x?.alive && !!b?.c9mu?.split && x.hp <= x.maxHp * muConf(x, b).tired;
function wakeNow(b, t, p, ev) {
  const st = b.c9mu;
  const mc = muConf(t, b);
  t.hp = Math.max(1, Math.round(t.maxHp * mc.wake));
  t.status = {};
  t.telegraph = null;
  Object.assign(t.c9m, { beamAim: null, beamWait: 0, doon: false, doonWait: 0 });
  if (p.c9m?.doon) p.c9m.doon = false;
  st.kos++;
  st.wakes++;
  st.power = Math.round((st.power + mc.wakeUp) * 100) / 100;
  for (const x of musOf(b)) x.atk = Math.max(1, Math.round(st.atk0 * st.power * (x.c9m.angry ? mc.angry : 1)));
  if (ev) {
    post(ev).push(`${t.name}「ばたんきゅう〜…」`, `${p.name}「おきて、おきて！」`, `${t.name}は、すぐに目をさました！（2体とも、攻撃力が上がった！）`,
      `（${p.name}が元気なうちは、すぐ起こされる…！2体とも、へとへとにしてから、たおそう！）`);
    ev.c9mWake = { id: p.id, to: t.id, wakes: st.wakes, now: true };
    ev.warn = true;
    ev.upd.push(t, p);
  }
}
// 受ける ダメージ（battle.js の damage。敵 → 味方）: おかしの 人は beam.taken ばい
export function c9dTaken(b, c, t, dmg, ev) {
  if (!(dmg > 0) || t?.side !== 'ally' || !okashiOf(t)) return dmg;
  const mu = muOf(b);
  const k = mu ? muConf(mu, b).beam.taken : 1.5;
  if (ev && !ev.c9dSoft) {
    ev.c9dSoft = true;
    post(ev).push(`（${t.name}は、おかしなので、やわらかい…！大ダメージ！）`);
  }
  return Math.round(dmg * k);
}
// おかしの 番（battle.js の doIncapacitated）: 1つ へる。0 で もどる
export function c9dIncap(b, c, ev) {
  const s = c.status[OKASHI];
  if (!s) return false;
  s.turns--;
  ev.name = 'おかし';
  if (s.turns <= 0) {
    delete c.status[OKASHI];
    ev.lines.push(`${c.name}は、ぽんっと、元のすがたにもどった！`);
    ev.atbAfter = 60;
  } else ev.lines.push(`${c.name}は、おかしになっていて、動けない…`);
  ev.c9dOkashi = { id: c.id, left: Math.max(0, s.turns) };
  ev.upd.push(c);
  return true;
}

// ───────────── たおれた（battle-c9b.js の c9bKill の はじめ。t.alive は まだ true）─────────────
export function c9dKill(b, t, ev) {
  const st = b.c9mu;
  if (!st || !t?.c9m || t.side !== 'enemy') return;
  const p = partnerOf(b, t);
  Object.assign(t.c9m, { beamAim: null, beamWait: 0, doon: false, doonWait: 0 });
  if (p?.alive && st.split) {
    // ばたんきゅう（もう 片方は へとへとで 起こせない。元気な ときは c9dDamage で すぐ 起こされる ので ここには 来ない）
    t.c9m.ko = true;
    st.kos++;
    if (p.c9m) p.c9m.doon = false;
    if (p.telegraph === DOON || p.telegraph === DOONUP) p.telegraph = null;
    if (ev) {
      post(ev).push(`${t.name}「ばたんきゅう〜…」`, `${p.name}「お、おきて…。…へとへとで、起こせないよぉ…」`, `（今のうちに、${p.name}もたおそう！）`);
      ev.c9mKO = { id: t.id, by: p.id };
      ev.warn = true;
      ev.upd.push(p);
    }
    return;
  }
  // 2体とも たおれた: 勝ち（ならんで すわりこむ）
  st.won = true;
  for (const x of musOf(b)) Object.assign(x.c9m, { ko: false, sit: true });
  if (ev) {
    const two = musOf(b).filter((x) => !x.c9m.hidden);
    post(ev).push(
      `${two.map((x) => x.name).join('と')}は、ならんで、ぺたんとすわりこんだ。`,
      `${MONSTERS[C9D_MU].short}「…はあ、はあ。たのしかったぁ〜。」`,
      ...(two.length > 1 ? [`${MONSTERS[C9D_MUMU].short}「こんなにあそんだの、初めて！」`] : []),
    );
    ev.c9mWin = { ids: two.map((x) => x.id) };
    ev.upd.push(...two);
  }
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// 魔人の 戦いで なければ undefined。ふつうの オート（家族の キャラ）は null
export function c9dPlan(b, c, decide, bestHit) {
  const st = b.c9mu;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  const up = musOf(b).filter((x) => x.alive);
  if (!up.length) return null;
  const high = up.slice().sort((x, y) => y.hp / y.maxHp - x.hp / x.maxHp || y.hp - x.hp)[0];
  void FINISH;
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 人の 仲間（酒場の 人）: 3回に 1回、HPの 多い 方を ねらう（家族の キャラの オート・魔物の 仲間は ねらい分けない）
    // 第101回 R3班: 自動の 仲間が しくみを 使うのは、人が えらんで いる 時だけ（第2章と 同じ きまり。battle-c10a.js の someoneChooses。完全オートは 勝てない）
    if (c.kind === 'player' || c.kind === 'monster' || up.length < 2 || !someoneChooses(b)) return null;
    b.c9mAuto = (b.c9mAuto || 0) + 1;
    if (b.c9mAuto % AUTO_EVERY) return null;
    return bestHit(b, c, high);
  }
  // ひとりの 時は、前ぶれの あと ふつうに 動く 回数が のこって いる 間は まだ 身を 守らない（番を むだに しない。
  //   仲間が いる 時は すぐ 守る … ムウの 番が 先に 来て 間に あわない ことが ある）
  const soon = (w) => !(w > 0) || b.allies.length > 1;
  const aimed = up.some((x) => x.c9m?.beamAim === c.id && soon(x.c9m.beamWait));
  const doonSoon = up.some((x) => x.c9m?.doon && soon(x.c9m.doonWait));
  const stuckMates = b.aliveAllies().filter((x) => okashiOf(x) || x.status?.sleep || x.status?.paralyze);
  const canSong = songReady(b) && canUse(b, c, SONG) && !b.queue.some((q) => q.cmd?.id === SONG);
  if (mode === 'blind') {
    if ((aimed || doonSoon) && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    if (stuckMates.length && canSong && b.rng.chance(0.15)) return { type: 'ability', id: SONG };
    return null;
  }
  // 知って いる 人: ねらわれたら 身を 守る・ドーンの 前は 身を 守る・おかしの 仲間は 星のうた・HPの 多い 方を けずる
  if (aimed && !c.defending) return { type: 'defend' };
  if (stuckMates.length && canSong) return { type: 'ability', id: SONG };
  // ドーンの 前は 身を 守る（たおれた 仲間が いる 時は 起こす 方が 先）
  if (doonSoon && !c.defending && !b.allies.some((x) => !x.fled && !x.alive)) return { type: 'defend' };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  // 片方が ばたんきゅう: もう 片方を、番が 来る 前に いちばん 大きい 1回で
  if (st.split && up.length === 1) return bestHit(b, c, up[0]) || cmd;
  // 2体とも へとへと: 全体こうげきで いっきに
  if (up.length === 2 && up.every((x) => tiredOf(x, b))) {
    const all = bestAll(b, c, up);
    if (all) return all;
  }
  const isMu = (id) => !!b.get(id)?.c9m;
  if (cmd?.type === 'attack' && isMu(cmd.target)) return { type: 'attack', target: high.id };
  if (a?.target === 'enemy' && isMu(cmd.target)) return { ...cmd, target: high.id };
  return cmd;
}
// 知って いる 人が 全体こうげきに きりかえる のこりの HP（2体とも これ いか）
export const FINISH = 0.3;
// 2体に 当たる 技で いちばん 大きい もの（なければ null）
function bestAll(b, c, ts) {
  let best = null;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || a.target !== 'enemies' || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    let dmg = 0;
    for (const t of ts) {
      if (e.type === 'phys') {
        const r = b.calcPhys(c, t, e, 1, e.element || 'phys', true);
        dmg += r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
      } else if (e.type === 'magic') dmg += b.calcMagic(c, t, e, 1, true).dmg;
    }
    if (dmg > 0 && (!best || dmg > best.dmg)) best = { cmd: { type: 'ability', id }, dmg };
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
export function c9dBusy(b) {
  const st = b.c9mu;
  if (!st || st.won) return false;
  const up = musOf(b).filter((x) => x.alive);
  if (up.some((x) => x.c9m?.beamAim || x.c9m?.doon)) return true;
  if (b.aliveAllies().some((x) => okashiOf(x)) && songReady(b)) return true;
  return false;
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵だけ）─────────────
// ムウ・ムウムウ: muStage（0 … 1体・1 … 2体に 分かれた。F班の 曲 addFormKey0）・muHide（まだ 出て いない）・muKO（ばたんきゅう）・
//   muSit（勝った。すわりこむ）・muAngry・muBeamAim（ねらいの id）・muBeamLeft・muDoon（いっしょに ドーンの 前ぶれ）・muDoonLeft・muWakes・muPower
export function c9dPub(c, b = c?._b9) {
  const o = {};
  if (!c?.c9m || !b?.c9mu) return o;
  const st = b.c9mu;
  const k = c.c9m;
  o.muStage = st.split ? 1 : 0;
  o.muHide = k.hidden ? 1 : 0;
  o.muKO = !c.alive && k.ko && !st.won ? 1 : 0;
  o.muSit = st.won && !k.hidden ? 1 : 0;
  o.muAngry = c.alive && k.angry ? 1 : 0;
  o.muBeamAim = c.alive ? k.beamAim || null : null;
  o.muBeamLeft = k.beamAim ? k.beamWait : null;
  o.muDoon = c.alive && k.doon ? 1 : 0;
  o.muDoonLeft = k.doon ? k.doonWait : null;
  o.muWakes = st.wakes;
  o.muPower = st.power;
  o.muTele = c9dTele(b);
  o.muTired = tiredOf(c, b) ? 1 : 0;
  return o;
}
void C9D_MUMU;
