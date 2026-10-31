// 第2部 第7章 第1幕「緑の王国」の ボスの 戦いの しかけ（battle-ch6.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・水門の ウツボきょうだい（monsters-c7.js の c7.kind 'twin'。Step 1 の さいごの 中ボス）「2ひきで 1組」
//   2ひきとも 生きている 間は、どちらかが 1回 動く たびに「いき」の しるし（b.c7twin.left。はじめは twin.sync）が 1つ へる。
//   しるしが 1つの ときに どちらかが 動くと、かならず「ふたごの大うずしお」（m7g_swirl。みんなに 物理の 大技。身を 守ると 半分）→ しるしは また いっぱい。
//   かたほうが たおれると、もう かたほうが twin.call 回めの 行動で「よびもどし」（m7g_call）: HP callHp で 生き返り、2ひきとも 攻撃力 ×rage（rageMax 回まで）。
//   その 前に のこった 1ぴきも たおせば 勝ち（「いっしょに たおそう」）。1ぴきの 間は 大うずしおは ない
// ・うずの魔女オクタリア（c7.kind 'witch'。みどりの水の神殿の ボス）「声うばい」
//   every 回 動く たびに（しるし c.witch.left）「声うばいの歌」（m7t_steal）: 1人の 声を 声の貝（c7_shell。べつの 敵）に すいこむ
//   （呪文が 使えない … マホトーン〈voice〉。呪文の 多い 人から ねらう）。貝の 中の 声が chorusAt いじょうなら かわりに
//   「うばった声の大合唱」（m7t_chorus。みんなに 大きな 呪文。声 1つで per ずつ 強く なる）。
//   声の貝を こわすと、声が みんな もどり、魔女は よろめく（ゲージ 0・守り ×stagger〈3回 行動の 間〉・前ぶれも とりやめ）。
//   貝が ない 間は 声を うばえない（しるしは すすまない）。貝は 魔女が regrow 回 動くと また できる（からっぽ）。
//   HP が p2At より へると（2だんめ）every が p2Every に（はやく なる）
// ・ふつうの オート（家族が「オート」に した とき）: 大うずしお・大合唱が 自分の 次の 番より 先に 来る とき、HPが へっていれば よく 身を 守る
//   （battle-ch6.js の AUTO_GUARD。ほかの ボスと おなじ。b.c6Naive … しない 人）
// ・知っている 人（シミュレーター tools/sim-ch7.mjs。b.knowsCh6）: 大うずしお・大合唱の 前に 身を 守る（b.c6NoGuard … しない）／
//   ウツボは HP の 多い ほうを ねらって 2ひきを いっしょに へらす（b.c7NoSplit … しない）／声が 貝に 入ったら 貝を こわす（b.c7NoShell … しない）
import { MONSTERS } from './data/monsters.js?v=a5c15ff5e061';
import { ABILITIES } from './data/abilities.js?v=a5c15ff5e061';
import { C7_GATE, C7_GATE_B, C7_TEMPLE, C7_SHELL } from './data/monsters-c7.js?v=a5c15ff5e061';
import { BUFF_ACTS } from './buff-acts.js?v=a5c15ff5e061';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=a5c15ff5e061';
import { canUse } from './ai.js?v=a5c15ff5e061';
import { AUTO_GUARD } from './battle-ch6.js?v=a5c15ff5e061';

export { C7_GATE, C7_GATE_B, C7_TEMPLE, C7_SHELL };
export const SWIRL = 'm7g_swirl';
export const CALL = 'm7g_call';
export const STEAL = 'm7t_steal';
export const CHORUS = 'm7t_chorus';
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});

const c7Conf = (m) => MONSTERS[m?.species]?.c7 || null;
const twinConf = (m) => ({ call: 3, callHp: 0.5, rage: 1.12, rageMax: 2, sync: 6, swirl: {}, ...(c7Conf(m)?.twin || {}) });
const witchConf = (m) => ({ every: 3, p2At: 0.5, p2Every: 2, chorusAt: 2, chorus: {}, regrow: 4, stagger: 0.8, ...(c7Conf(m)?.witch || {}) });
export const isShell = (m) => !!MONSTERS[m?.species]?.c7shell;
const partnerOf = (b, c) => b.enemies.find((e) => e !== c && e.twin && e.species === twinConf(c).partner) || null;
// 短い 名前（「ウツボのザブン」→「ザブン」。セリフ用）
const short = (c) => MONSTERS[c?.species]?.short || c?.name || '';
const shellOf = (b) => b.enemies.find((e) => isShell(e) && !e.fled) || null;
const witchOf = (b) => b.enemies.find((e) => e.witch && e.alive) || null;
// 2だんめか（HP が p2At より へった）
const witchP2 = (c) => c.hp / c.maxHp < witchConf(c).p2At;
const everyOf = (c) => (witchP2(c) ? witchConf(c).p2Every : witchConf(c).every);
// 貝の 中の 声（声を とりもどした 人〈ほかの 方法で マホトーンが とけた 人〉は 数えない）
export function voicesOf(b, w) {
  if (!w?.witch) return 0;
  w.witch.voices = w.witch.voices.filter((id) => b.get(id)?.status?.silence?.voice);
  return w.witch.voices.length;
}

// ───────────── はじめ（battle-ch6.js の setupCh6 の さいご）─────────────
export function setupC7(b) {
  const lines = [];
  let twinMax = 0;
  for (const e of b.enemies) {
    const conf = c7Conf(e);
    if (!conf) continue;
    if (conf.kind === 'twin') {
      e.twin = { call: 0, rage: 0 };
      twinMax = Math.max(twinMax, twinConf(e).sync);
    }
    if (conf.kind === 'witch') {
      const wc = witchConf(e);
      e.witch = { left: wc.every, voices: [], down: 0, steals: 0, choruses: 0, breaks: 0 };
      lines.push(`${e.name}の首で、大きな貝のペンダントが、あやしく光っている…！`, '（あの貝に、人の声をすいこむようだ…！）');
      // がめんへ（pub）: 声の貝も 中の 声の 数を 見る
      for (const s of b.enemies) if (isShell(s)) s.c7w = e.witch;
    }
  }
  if (twinMax) {
    b.c7twin = { left: twinMax, max: twinMax, swirls: 0, calls: 0 };
    // がめんへ（pub）: 2ひきとも おなじ いきの しるしを 見る
    for (const e of b.enemies) if (e.twin) e.twin.sync = b.c7twin;
    lines.push('2ひきのウツボが、水門の前で、ぐるぐると回っている…！', '（かたほうだけたおしても、もうかたほうが、よびもどしそうだ…！）');
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
}

// ───────────── 行動の はじめ（battle-ch6.js の ch6TurnStart の はじめ）─────────────
// 動けない 番も しるしを 数える（しるしが 1つの 番が 動けない ときは、次の 番に）
export function c7TurnStart(b, c, ev, stuck) {
  if (c.twin) twinTurn(b, c, ev, stuck);
  else if (c.witch) witchTurn(b, c, ev, stuck);
}

function twinTurn(b, c, ev, stuck) {
  const p = partnerOf(b, c);
  const tw = b.c7twin;
  if (!p || !tw || c.telegraph) return;
  if (!p.alive) {
    // よびもどしまでの 数（たおれた ときに c7Kill が call に する）
    if (!(c.twin.call > 0)) c.twin.call = twinConf(c).call;
    if (c.twin.call <= 1) {
      if (!stuck) c.telegraph = CALL;
    } else {
      c.twin.call--;
      ev.lines.push(c.twin.call > 1 ? `${c.name}は、水の底の${short(p)}を、じっと見ている…（よびもどすまで、あと${c.twin.call}回）` : `${c.name}が、大きく口を開けた…！（次に動くと、${short(p)}をよびもどす！）`);
      ev.c7CallLeft = { id: c.id, left: c.twin.call };
    }
    ev.upd.push(c);
    return;
  }
  if (tw.left <= 1) {
    if (!stuck) c.telegraph = SWIRL;
  } else {
    tw.left--;
    ev.lines.push(tw.left > 1 ? `2ひきのいきが、合ってきた…（大うずしおまで、あと${tw.left}）` : '2ひきが、ぐるぐると回る速さを上げた…！');
    if (tw.left === 1) ev.lines.push('（次にどちらかが動くと、ふたごの大うずしお…！身を守れ！）');
    ev.c7Sync = { id: c.id, left: tw.left, max: tw.max };
  }
  ev.upd.push(c, p);
}

function witchTurn(b, c, ev, stuck) {
  const w = c.witch;
  const wc = witchConf(c);
  const shell = shellOf(b);
  // こわれた 貝が また できる
  if (shell && !shell.alive) {
    w.down--;
    if (w.down <= 0) {
      Object.assign(shell, { alive: true, hp: shell.maxHp, status: {}, buffs: {}, debuffs: {}, ready: false, queued: false, telegraph: null });
      shell.atb = 0;
      const k = b.killed.lastIndexOf(shell.species);
      if (k >= 0) b.killed.splice(k, 1);
      w.left = everyOf(c);
      ev.lines.push(`${c.name}の首に、また声の貝ができた…！`);
      ev.c7Regrow = { id: c.id, shell: shell.id };
      ev.upd.push(shell);
    } else ev.lines.push(`（声の貝が、また大きくなろうとしている…あと${w.down}回）`);
  }
  if (c.telegraph) return;
  // 2だんめ: はやく なる
  w.left = Math.min(w.left, everyOf(c));
  if (!shell?.alive) return;
  const n = voicesOf(b, c);
  if (w.left <= 1) {
    if (!stuck) c.telegraph = n >= wc.chorusAt ? CHORUS : STEAL;
  } else {
    w.left--;
    if (w.left === 1) {
      if (n >= wc.chorusAt) ev.lines.push(`声の貝が、ぶるぶるとふるえ出した…！（${n}人の声）`, '（次にオクタリアが動くと、うばった声の大合唱…！貝をこわすか、身を守れ！）');
      else ev.lines.push(`${c.name}が、歌う前のように、大きくいきをすった…`, '（次にオクタリアが動くと、だれかの声がうばわれる…！）');
    }
    ev.c7Witch = { id: c.id, left: w.left, voices: n, chorus: n >= wc.chorusAt };
  }
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-ch6.js の ch6Effect の のこり）─────────────
export function c7Effect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c7Swirl': swirl(b, c, ev); return true;
    case 'c7Call': call(b, c, ev); return true;
    case 'c7Steal': steal(b, c, ev); return true;
    case 'c7Chorus': chorus(b, c, ev); return true;
    default: return false;
  }
}

// ふたごの大うずしお（2ひきが そろって いる ときだけ）
function swirl(b, c, ev) {
  const p = partnerOf(b, c);
  const tw = b.c7twin;
  if (tw) tw.left = tw.max;
  if (!p?.alive) {
    ev.lines.push(`しかし、${c.name}ひとりでは、うずしおがおこらない！`);
    return;
  }
  const sc = twinConf(c).swirl;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a7g_swirl', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy', pair: p.id };
  for (const t of targets) b.physHit(c, t, { mult: sc.mult ?? 1.6, ignoreDef: sc.ignoreDef ?? 0.35, acc: 1.2 }, ev, 'phys');
  if (tw) {
    tw.swirls++;
    (ev.postLines = ev.postLines || []).push(`（2ひきのいきが、またもとにもどった…　あと${tw.max}）`);
  }
  ev.c7Swirl = { id: c.id, pair: p.id };
  ev.warn = true;
  ev.upd.push(c, p);
}

// よびもどし: たおれた きょうだいが 生き返る・2ひきとも 少し 強く なる
function call(b, c, ev) {
  const p = partnerOf(b, c);
  const tc = twinConf(c);
  c.twin.call = 0;
  if (!p || p.alive || p.fled) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  Object.assign(p, { alive: true, hp: Math.max(1, Math.round(p.maxHp * (tc.callHp ?? 0.5))), status: {}, buffs: {}, debuffs: {}, ready: false, queued: false, telegraph: null, stance: null });
  p.atb = 0;
  if (p.twin) p.twin.call = 0;
  // 経験値は 1回 たおした ぶんだけ（図鑑の 数も ふやさない）
  const k = b.killed.lastIndexOf(p.species);
  if (k >= 0) b.killed.splice(k, 1);
  ev.fx = { type: 'ability', anim: 'a7g_call', actor: c.id, targets: [p.id], side: 'enemy' };
  ev.lines.push(`水の底から、${p.name}がよみがえった！`);
  let angry = false;
  for (const e of [c, p]) {
    if ((e.twin?.rage || 0) >= (tc.rageMax ?? 2)) continue;
    e.twin.rage = (e.twin.rage || 0) + 1;
    e.atk = Math.round(e.atk * (tc.rage ?? 1.12));
    angry = true;
  }
  if (angry) ev.lines.push('2ひきは、いかりで体をふるわせた！（攻撃力が上がった）');
  (ev.postLines = ev.postLines || []).push('（2ひきを、いっしょにたおさないと…！）');
  if (b.c7twin) b.c7twin.calls++;
  ev.c7Call = { id: c.id, back: p.id };
  ev.warn = true;
  ev.upd.push(c, p);
}

// 声うばいの歌: 呪文の 多い 人から 1人（もう 声を うばわれた 人は のぞく）
function steal(b, c, ev) {
  const w = c.witch;
  const wc = witchConf(c);
  if (w) w.left = everyOf(c);
  const shell = shellOf(b);
  if (!w || !shell?.alive) {
    ev.lines.push('しかし、声の貝がない！');
    return;
  }
  const pool = b.aliveAllies().filter((x) => !x.status.silence?.voice);
  if (!pool.length) return chorus(b, c, ev);
  const score = (x) => (x.mag || 0) + (x.healPow || 0) + b.rng.float(0, 30);
  const t = pool.sort((x, y) => score(y) - score(x))[0];
  t.status.silence = { turns: 99, voice: true };
  w.voices.push(t.id);
  w.steals++;
  const n = voicesOf(b, c);
  ev.fx = { type: 'ability', anim: 'a7t_steal', actor: c.id, targets: [t.id], side: 'enemy', shell: shell.id };
  ev.lines.push(`${t.name}の声が、光のたまになって、声の貝にすいこまれた！`, `${t.name}は、声が出ない！（呪文が使えない）`);
  (ev.postLines = ev.postLines || []).push(n >= wc.chorusAt ? `（声の貝の中で、${n}人の声がないている…！声がたまると、大合唱…！）` : '（声の貝をこわせば、声がもどりそうだ…！）');
  ev.c7Steal = { id: c.id, who: t.id, voices: n };
  ev.warn = true;
  ev.upd.push(t, shell, c);
}

// うばった声の大合唱（声の 数だけ 強い 呪文）。声は 貝に のこる（こわせば もどる）
function chorus(b, c, ev) {
  const w = c.witch;
  const wc = witchConf(c);
  if (w) w.left = everyOf(c);
  const n = voicesOf(b, c);
  const ch = wc.chorus;
  const k = 1 + (ch.per ?? 0.45) * n;
  const base = (ch.base || [300, 330]).map((v) => Math.round(v * k));
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a7t_chorus', actor: c.id, targets: targets.map((t) => t.id), side: 'enemy', voices: n };
  for (const t of targets) b.magicHit(c, t, { type: 'magic', base, thr: 99 }, ev, 1);
  if (w) w.choruses++;
  ev.c7Chorus = { id: c.id, voices: n };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── たおれた（battle-ch5.js の towerKill から）─────────────
// ウツボ: もう 1ぴきが よびもどしの 数を はじめる / 声の貝: 声が もどり、魔女が よろめく
export function c7Kill(b, t, ev) {
  if (t.twin) {
    const p = partnerOf(b, t);
    if (!p?.alive) return;
    p.twin.call = twinConf(p).call;
    t.telegraph = null;
    if (!ev) return;
    (ev.postLines = ev.postLines || []).push(`${short(p)}「${short(t)}…！今、よびもどしてやる…！」`, `（${short(p)}が${p.twin.call}回動くと、${short(t)}がよみがえる…！その前に、たおそう！）`);
    ev.c7Down = { id: t.id, partner: p.id, call: p.twin.call };
    ev.upd.push(p);
    return;
  }
  if (!isShell(t)) return;
  const w = witchOf(b);
  if (!w) return;
  const wc = witchConf(w);
  const back = [];
  for (const id of w.witch.voices) {
    const a = b.get(id);
    if (a?.status?.silence?.voice) {
      delete a.status.silence;
      back.push(a);
    }
  }
  w.witch.voices = [];
  w.witch.down = wc.regrow;
  w.witch.breaks++;
  w.witch.left = everyOf(w);
  // よろめく: ならんでいた 行動・前ぶれは とりやめ・ゲージは 0 から・守りが 下がる（3回 行動の 間）
  if (w.queued) {
    b.queue = b.queue.filter((q) => q.id !== w.id);
    w.queued = false;
  }
  w.ready = false;
  w.atb = 0;
  if (w.telegraph === STEAL || w.telegraph === CHORUS) w.telegraph = null;
  w.debuffs.def = { mult: wc.stagger ?? 0.8, lv: 1, left: BUFF_ACTS };
  if (!ev) return;
  const post = (ev.postLines = ev.postLines || []);
  post.push('声の貝が、パリーン！とわれた！');
  if (back.length) post.push(`${back.map((a) => a.name).join('と')}の声が、もどってきた！`);
  post.push(`${w.name}は、ぐらりとよろめいた！（守りが下がった）`);
  ev.c7Break = { id: w.id, back: back.map((a) => a.id) };
  ev.upd.push(w, ...back);
}

// ───────────── 大技が 近いか ─────────────
// その 敵が c の 次の 番までに 何回 動くか
function actsBefore(b, c, e) {
  if (!e?.alive) return 0;
  const re = atbRate(e);
  if (!(re > 0)) return 0;
  const mine = 100 / atbRate(c);
  const t0 = e.ready || e.queued ? 0 : (100 - e.atb) / re;
  if (t0 > mine) return 0;
  return 1 + Math.floor((mine - t0) / (100 / re));
}
// ふたごの大うずしおが c の 次の 番より 先に 来るか
export function swirlBefore(b, c) {
  const tw = b.c7twin;
  if (!tw) return false;
  const eels = b.enemies.filter((e) => e.twin && e.alive);
  if (eels.length < 2) return false;
  if (eels.some((e) => e.telegraph === SWIRL)) return true;
  return eels.reduce((s, e) => s + actsBefore(b, c, e), 0) >= tw.left;
}
// うばった声の大合唱が c の 次の 番より 先に 来るか
export function chorusBefore(b, c, w = witchOf(b)) {
  if (!w?.witch) return false;
  if (w.telegraph === CHORUS) return true;
  const shell = shellOf(b);
  if (!shell?.alive || voicesOf(b, w) < witchConf(w).chorusAt) return false;
  return actsBefore(b, c, w) >= w.witch.left;
}

// その 敵に いちばん 大きい ダメージの 1回の 行動（攻撃・1体の 技。{ cmd, dmg }）
function bestHit(b, c, t) {
  const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
  let best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit };
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !FOES.has(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
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

// ───────────── オート（battle-ch6.js の ch6Plan の はじめ）─────────────
// 第7章の ボスが いなければ null（ほかの ボスの 考えへ）
export function c7Plan(b, c, decide) {
  if (c.side !== 'ally' || b.c7Inner) return null;
  const eels = b.aliveEnemies().filter((e) => e.twin);
  const w = witchOf(b);
  if (!eels.length && !w) return null;
  const soon = eels.length ? swirlBefore(b, c) : chorusBefore(b, c, w);
  // ふつうの オート: 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  if (!b.knowsCh6) {
    if (b.c6Naive || !soon) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c7Inner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c7Inner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  if (saving) return base;
  if (eels.length) {
    if (soon && !b.c6NoGuard) return { type: 'defend' };
    // 2ひきを いっしょに へらす（HP の 多い ほうを ねらう）
    if (eels.length === 2 && !b.c7NoSplit && base?.target) {
      const tgt = b.get(base.target);
      const ab = base.type === 'ability' ? ABILITIES[base.id] : null;
      const single = base.type === 'attack' || (ab && (ab.target === 'enemy' || ab.target === 'group'));
      if (tgt?.twin && single) {
        const hi = eels.slice().sort((x, y) => y.hp / y.maxHp - x.hp / x.maxHp)[0];
        if (hi !== tgt && hi.hp / hi.maxHp - tgt.hp / tgt.maxHp > 0.03) return { ...base, target: hi.id };
      }
    }
    return base;
  }
  // オクタリア: 声が 貝に 入ったら 貝を こわす（大合唱が 近い ときは とくに）
  const shell = shellOf(b);
  const n = voicesOf(b, w);
  if (shell?.alive && !b.c7NoShell && (n > 0 || soon)) {
    const h = bestHit(b, c, shell);
    // 1回で こわせる・大合唱が まだ 先・守らない 人は 貝へ（ほとんど 当たらない 人〈貝の HP の 8%より 小さい〉は ふだんの 行動）
    if (h.dmg >= shell.hp || ((!soon || b.c6NoGuard) && h.dmg >= shell.maxHp * 0.08)) return h.cmd;
  }
  if (soon && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

// ───────────── がめんへ（battle-ch6.js の ch6Pub の さいご）─────────────
// ウツボ: twinLeft・twinMax（大うずしおまでの いき）・callLeft（よびもどしまで）・rage
// オクタリア: witchLeft・witchEvery（声うばいまで）・voices（貝の 中の 声）・chorus（次は 大合唱）・p2・shellDown（貝が また できるまで）
// 声の貝: c7shell・voices
export function c7Pub(c, o) {
  if (c.twin) {
    o.twin = 1;
    if (c.twin.sync) {
      o.twinLeft = c.twin.sync.left;
      o.twinMax = c.twin.sync.max;
    }
    if (c.twin.call > 0) o.callLeft = c.twin.call;
    if (c.twin.rage) o.rage = c.twin.rage;
  }
  if (c.witch) {
    const wc = witchConf(c);
    o.witchLeft = c.witch.left;
    o.witchEvery = everyOf(c);
    o.voices = c.witch.voices.length;
    o.chorus = c.witch.voices.length >= wc.chorusAt ? 1 : 0;
    if (witchP2(c)) o.p2 = 1;
    if (c.witch.down > 0) o.shellDown = c.witch.down;
  }
  if (isShell(c)) {
    o.c7shell = 1;
    o.voices = c.c7w ? c.c7w.voices.length : 0;
  }
}
