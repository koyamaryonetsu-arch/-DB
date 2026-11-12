// 第2部 第8章 第1幕「月の王宮の うらぎり」の ボスの 戦いの しかけ（battle-c7i.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・オウムのイアゴン（monsters-c8a.js の c8a.kind 'parrot'。Step 1 の さいごの 中ボス）「オウムがえし」
//   every 回 動く たびに（しるし c.c8par.left）「オウムがえし」（m8p_echo）。しるしが のこり listen いかの 間は「聞き耳」:
//   その 間に 味方が イアゴンに 当てた 呪文（ダメージの ある 呪文。1回の 行動で 1つ）を 覚える（max まで。頭の 上の ふきだし）。
//   オウムがえし: 覚えた 呪文を みんなに はね返す（覚えた 数だけ 強い・さいごの 呪文の 属性・身を 守ると 半分）。
//   何も 覚えて いないと しっぱいして 目を まわす（次の 番は 動けない・守りが dizzy ばい）。HP が p2At より へると every が p2Every に
// ・大臣ジャハール（c8a.kind 'vizier'。第1幕の さいごの ボス。3だん）
//   1だんめ（へびの つえの 魔術師）「さいみんじゅつ」: 横に へびのつえ（c8_staff。べつの 敵）。staff.every 回 動く たびに（しるし c.c8viz.left）
//     さいみんじゅつ（m8j_hypno）… 1人を あやつる（こんらん）。つえが こわれると、あやつられた 人は 目を さまし、ジャハールは うろたえて 1回 動けない
//     （ならべて いた さいみんじゅつも とりやめ）。つえは ジャハールが staff.regrow 回 動くと もどる。つえが ない 間は しるしは すすまない
//   HP が p2At より へると、次の 番に「大へびの姿」（m8j_cobra）… 大きな コブラに。それまで HP は p2At より 下がらない。つえは 消える
//   2だんめ（大きな コブラ）「とぐろ」: cobra.every 回 動く たびに「とぐろをまく」（m8c_coil）。とぐろの 間に コブラを 攻撃すると、
//     その 人に かみつく（カウンター。1回の 行動で 1回）。次の コブラの 番に かならず「大へびのいちげき」（m8c_strike。みんなに 物理の 大技。
//     かみついた 数だけ 強い・身を 守ると 半分）。だれも 攻撃して いなければ からぶりして のびきる（open.turns 回 動く 間、受ける ダメージが open.k ばい）
//   HP が p3At より へると、次の 番に「ランプの魔人」（m8c_genie）。横に 黒いランプ（c8_lamp。b.addEnemies）が あらわれる。それまで HP は p3At より 下がらない
//   3だんめ（ランプの 魔人）「ランプ」: genie.every 回 動く たびに「むげんの魔力」（m8g_blast。みんなに 闇の 大技。身を 守ると 半分）。
//     黒いランプを こわすと、魔人は 自分の ランプに すいこまれる（ならべて いた 大技も とりやめ）: seal.turns 回 動けない・受ける ダメージ seal.k ばい。
//     出てくると、ランプに また 火が ともる（HP は lampGrow ばいずつ ふえる）。HP が p4At より へると every が p4Every に
// ・ふつうの オート（家族が「オート」に した とき）: 大技（オウムがえし・いちげき・むげんの魔力）が 自分の 次の 番より 先に 来る とき、
//   HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD。ほかの ボスと おなじ。b.c6Naive … しない 人）
// ・知っている 人（シミュレーター tools/sim-ch8.mjs。b.knowsCh6）:
//   イアゴン … 聞き耳の 間は 呪文を 当てない（物理の 攻撃に かえる。b.c8aNoQuiet … しない）・オウムがえしの 前に（覚えて いれば）身を 守る（b.c6NoGuard）
//   ジャハール … さいみんじゅつが 近い ときは つえを こわす（b.c8aNoStaff）・とぐろの 間は コブラを 攻撃しない（b.c8aNoCoil）・
//     黒いランプを 先に こわす（b.c8aNoLamp）・むげんの魔力の 前に 身を 守る（b.c6NoGuard）
import { MONSTERS } from './data/monsters.js?v=787cfdb825c5';
import { ABILITIES } from './data/abilities.js?v=787cfdb825c5';
import { C8_PET, C8_JAFAR, C8_STAFF, C8_LAMP, COBRA_ACTIONS, GENIE_ACTIONS } from './data/monsters-c8a.js?v=787cfdb825c5';
import { BUFF_ACTS } from './buff-acts.js?v=787cfdb825c5';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub } from './battle.js?v=787cfdb825c5';
import { canUse } from './ai.js?v=787cfdb825c5';
import { AUTO_GUARD } from './battle-ch6.js?v=787cfdb825c5';
// 第2部 第8章 第2幕: ペイニックと パニクル（ばけばけ大作戦）・よみの王ハデロス（たましいのけいやく → おこった 赤い 炎）。battle-c8b.js
import { setupC8b, c8bTurnStart, c8bEffect, c8bPlan, c8bPub, c8bDamage, c8bKill } from './battle-c8b.js?v=787cfdb825c5';

export { C8_PET, C8_JAFAR, C8_STAFF, C8_LAMP };
export const ECHO = 'm8p_echo';
export const DIZZY = 'm8p_dizzy';
export const HYPNO = 'm8j_hypno';
export const DAZE = 'm8j_daze';
export const COBRA = 'm8j_cobra';
export const COIL = 'm8c_coil';
export const STRIKE = 'm8c_strike';
export const GENIE = 'm8c_genie';
export const BLAST = 'm8g_blast';
export const SEALED = 'm8g_sealed';
export const COBRA_NAME = '大へびジャハール';
export const GENIE_NAME = '魔人ジャハール';
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
// 属性の よびかた（オウムがえしの ことば）
const EL_NAME = { fire: '炎', ice: '氷', bolt: '雷', wind: '風', light: '光', dark: '闇', water: '水', blast: 'ばくはつ', void: '魔法' };

const confOf = (m) => MONSTERS[m?.species]?.c8a || null;
export const parrotConf = (m) => ({ every: 4, listen: 2, max: 3, echo: { base: [180, 200], per: 0.5 }, p2At: 0.5, p2Every: 3, dizzy: 0.8, ...(confOf(m)?.parrot || {}) });
export function vizierConf(m) {
  const c = confOf(m) || {};
  return {
    staff: { every: 4, regrow: 4, hypno: { n: 1, turns: [2, 3] }, ...(c.staff || {}) },
    p2At: c.p2At ?? 0.67,
    cobra: { every: 3, counter: { mult: 0.85, ignoreDef: 0.3 }, strike: { mult: 0.9, per: 0.25, max: 2.0, ignoreDef: 0.3 }, open: { k: 1.5, turns: 2 }, atk: 1.06, ...(c.cobra || {}) },
    p3At: c.p3At ?? 0.34,
    genie: { every: 3, p4At: 0.15, p4Every: 2, blast: { base: [220, 250] }, seal: { turns: 3, k: 1.6 }, lampGrow: 1.25, atk: 1.04, ...(c.genie || {}) },
  };
}
export const isStaff = (m) => !!MONSTERS[m?.species]?.c8staff;
export const isLamp = (m) => !!MONSTERS[m?.species]?.c8lamp;
export const staffOf = (b) => b.enemies.find((e) => isStaff(e) && !e.fled) || null;
export const lampOf = (b) => b.enemies.find((e) => isLamp(e) && !e.fled) || null;
const parrotOf = (b) => b.enemies.find((e) => e.c8par && e.alive) || null;
const vizierOf = (b) => b.enemies.find((e) => e.c8viz && e.alive) || null;
export const staffUp = (b) => !!staffOf(b)?.alive;
export const lampUp = (b) => !!lampOf(b)?.alive;
export const formOf = (m) => m?.c8viz?.form || 0;
const echoEvery = (c) => {
  const pc = parrotConf(c);
  return c.hp / c.maxHp < pc.p2At ? pc.p2Every : pc.every;
};
const blastEvery = (c) => {
  const g = vizierConf(c).genie;
  return c.hp / c.maxHp < g.p4At ? g.p4Every : g.every;
};
// イアゴンが 聞き耳を して いるか（オウムがえしの 前の listen 回）
export function listening(p) {
  if (!p?.c8par || p.c8par.dizzy) return false;
  return p.telegraph === ECHO || p.c8par.left <= parrotConf(p).listen;
}

// ───────────── はじめ（battle-c7i.js の setupC7i の さいご）─────────────
export function setupC8a(b) {
  const lines = [];
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    if (conf.kind === 'parrot') {
      e.c8par = { left: echoEvery(e), words: [], dizzy: false, echoes: 0, empties: 0, heard: 0 };
      lines.push(`${e.name}「ジャハールさまのじゃまは、させないぞー！」`, '（イアゴンは、聞いた呪文をまねするらしい…！耳をすませている間は、呪文をひかえよう…！）');
    }
    if (conf.kind === 'vizier') {
      e.c8viz = { form: 1, left: vizierConf(e).staff.every, down: 0, daze: false, hypno: [], hypnos: 0, breaks: 0, coiled: false, counters: 0, open: 0, coils: 0, strikes: 0, whiffs: 0, seal: 0, seals: 0, blasts: 0 };
      lines.push(`${e.name}「フフフ…このへびのつえの前では、だれもさからえぬ…」`, '（へびのつえの目が、あやしく光っている…！こわせば、さいみんじゅつは使えないはずだ！）');
    }
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
  // 第8章 第2幕の ボス（battle-c8b.js）
  setupC8b(b);
}

// ───────────── 行動の はじめ（battle-c7i.js の c7iTurnStart の はじめ）─────────────
// 動けない 番も しるしを 数える（しるしが 1つの 番が 動けない ときは、次の 番に）
export function c8aTurnStart(b, c, ev, stuck) {
  // 第8章 第2幕（battle-c8b.js）
  c8bTurnStart(b, c, ev, stuck);
  if (c.c8par) parrotTurn(b, c, ev, stuck);
  else if (c.c8viz) vizierTurn(b, c, ev, stuck);
}

function parrotTurn(b, c, ev, stuck) {
  const p = c.c8par;
  const pc = parrotConf(c);
  if (c.telegraph) return;
  // オウムがえしに しっぱいして 目を まわして いる（1回 動けない）
  if (p.dizzy) {
    p.dizzy = false;
    if (!stuck) c.telegraph = DIZZY;
    ev.upd.push(c);
    return;
  }
  p.left = Math.min(p.left, echoEvery(c));
  if (p.left <= 1) {
    if (!stuck) c.telegraph = ECHO;
    ev.upd.push(c);
    return;
  }
  p.left--;
  if (p.left === pc.listen) ev.lines.push(`${c.name}が、耳をすませ始めた…`, '（聞き耳だ！今、呪文を当てると、覚えられてしまう…！）');
  if (p.left === 1) ev.lines.push(`${c.name}が、むねをふくらませた…！`, `（次に${c.name}が動くと、オウムがえし…！${p.words.length ? '身を守れ！' : '何も覚えていなければ、しっぱいするはずだ！'}）`);
  ev.c8aParrot = { id: c.id, left: p.left, every: echoEvery(c), listen: p.left <= pc.listen };
  ev.upd.push(c);
}

function vizierTurn(b, c, ev, stuck) {
  const v = c.c8viz;
  const vc = vizierConf(c);
  // こわれた へびのつえが もどる（1だんめの 間だけ）
  if (v.form === 1) {
    const st = staffOf(b);
    if (st && !st.alive && v.down > 0) {
      v.down--;
      if (v.down <= 0) {
        revivePart(b, st);
        ev.lines.push(`へびのつえが、${c.name}の手に、すうっともどってきた…！`);
        ev.c8aStaffBack = { id: c.id, staff: st.id };
        ev.upd.push(st);
      } else ev.lines.push(`（へびのつえが、もどろうとしている…あと${v.down}回）`);
    }
  }
  if (c.telegraph) return;
  // つえを こわされて うろたえて いる（1回 動けない）
  if (v.daze) {
    v.daze = false;
    if (!stuck) c.telegraph = DAZE;
    ev.upd.push(c);
    return;
  }
  if (v.form === 1) {
    if (c.hp / c.maxHp < vc.p2At) {
      if (!stuck) c.telegraph = COBRA;
      ev.upd.push(c);
      return;
    }
    // つえが ない 間は さいみんじゅつの しるしは すすまない
    if (!staffUp(b)) {
      ev.upd.push(c);
      return;
    }
    if (v.left <= 1) {
      if (!stuck) c.telegraph = HYPNO;
    } else {
      v.left--;
      if (v.left === 1) ev.lines.push(`${c.name}のつえの目が、赤くぎらぎらと光り出した…！`, '（次にジャハールが動くと、さいみんじゅつ…！その前に、へびのつえをこわせ！）');
      ev.c8aHypnoLeft = { id: c.id, left: v.left, every: vc.staff.every };
    }
    ev.upd.push(c);
    return;
  }
  if (v.form === 2) {
    if (c.hp / c.maxHp < vc.p3At) {
      if (!stuck) c.telegraph = GENIE;
      ev.upd.push(c);
      return;
    }
    // とぐろの あとは かならず 大へびのいちげき
    if (v.coiled) {
      if (!stuck) c.telegraph = STRIKE;
      ev.upd.push(c);
      return;
    }
    if (v.open > 0) {
      v.open--;
      if (v.open === 0) ev.lines.push(`${c.name}が、体をたてなおした…`);
    }
    if (v.left <= 1) {
      if (!stuck) c.telegraph = COIL;
    } else {
      v.left--;
      if (v.left === 1) ev.lines.push(`${c.name}が、長い体を、ゆっくりとまき始めた…`, '（次にコブラが動くと、とぐろ…！とぐろの間に攻撃すると、かみつかれるぞ！）');
      ev.c8aCoilLeft = { id: c.id, left: v.left, every: vc.cobra.every };
    }
    ev.upd.push(c);
    return;
  }
  // 3だんめ: ランプに すいこまれて いる 間は 動けない
  if (v.seal > 0) {
    v.seal--;
    if (v.seal > 0) {
      if (!stuck) c.telegraph = SEALED;
      ev.upd.push(c);
      return;
    }
    // 出てくる（この 番は ふつうに 動く）。ランプに また 火が ともる
    const lamp = lampOf(b);
    if (lamp) {
      lamp.maxHp = Math.round(lamp.maxHp * vc.genie.lampGrow);
      revivePart(b, lamp);
      ev.upd.push(lamp);
    }
    ev.lines.push(`${c.name}が、ランプの中から、けむりといっしょにとび出してきた！`, '黒いランプに、また火がともった…！');
    ev.c8aOut = { id: c.id, lamp: lamp?.id || null };
    ev.warn = true;
  }
  v.left = Math.min(v.left, blastEvery(c));
  if (v.left <= 1) {
    if (!stuck) c.telegraph = BLAST;
  } else {
    v.left--;
    if (v.left === 1) ev.lines.push(`黒いランプから、魔力があふれ出しそうだ…！`, '（次に魔人が動くと、むげんの魔力…！ランプをこわすか、身を守れ！）');
    ev.c8aBlastLeft = { id: c.id, left: v.left, every: blastEvery(c) };
  }
  ev.upd.push(c);
}

// こわれた つえ・ランプを もどす（いばらのかべと おなじ。たおした 数からも はずす）
function revivePart(b, m) {
  Object.assign(m, { alive: true, hp: m.maxHp, status: {}, buffs: {}, debuffs: {}, ready: false, queued: false, telegraph: null });
  m.atb = 0;
  const k = b.killed.lastIndexOf(m.species);
  if (k >= 0) b.killed.splice(k, 1);
}
// つえ・ランプを けす（変身の とき。たおした ことには ならない）
function vanishPart(b, m) {
  if (!m?.alive) return false;
  m.alive = false;
  m.hp = 0;
  m.telegraph = null;
  if (m.queued) {
    b.queue = b.queue.filter((q) => q.id !== m.id);
    m.queued = false;
  }
  return true;
}
// あやつられた 人が 目を さます
function wake(b, v, ev) {
  const woke = [];
  for (const id of v.hypno) {
    const x = b.get(id);
    if (x?.alive && x.status?.confuse) {
      delete x.status.confuse;
      woke.push(x);
      ev.upd.push(x);
    }
  }
  v.hypno = [];
  if (woke.length) (ev.postLines = ev.postLines || []).push(`${woke.map((x) => x.name).join('と')}は、はっと目をさました！`);
  return woke;
}

// ───────────── 技の こうか（battle-c7i.js の c7iEffect の のこり）─────────────
export function c8aEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c8aEcho': echo(b, c, ev); return true;
    case 'c8aDizzy': ev.c8aDizzy = { id: c.id }; return true;
    case 'c8aHypno': hypno(b, c, ev); return true;
    case 'c8aDaze': ev.c8aDaze = { id: c.id }; return true;
    case 'c8aCobra': toCobra(b, c, ev); return true;
    case 'c8aCoil': coil(b, c, ev); return true;
    case 'c8aStrike': strike(b, c, ev); return true;
    case 'c8aGenie': toGenie(b, c, ev); return true;
    case 'c8aBlast': blast(b, c, ev); return true;
    case 'c8aSealed': ev.c8aSealed = { id: c.id, left: c.c8viz?.seal || 0 }; return true;
    // 第8章 第2幕（battle-c8b.js）
    default: return c8bEffect(b, c, a, eff, ev);
  }
}

// みんなへの 呪文の 大技（身を 守ると 半分。calcMagic の 0.75 に もう少し かける）
function magicAll(b, c, base, element, k, ev) {
  for (const t of b.aliveAllies()) {
    const r = b.calcMagic(c, t, { base, thr: 99, element }, k);
    let dmg = r.dmg;
    if (t.defending) dmg = Math.round(dmg * 0.67);
    if (r.resisted || dmg <= 0) {
      ev.lines.push(`${t.name}はダメージを受けない！`);
      continue;
    }
    b.damage(c, t, dmg, ev, { element });
  }
}

// オウムがえし: 聞き耳の 間に 覚えた 呪文を はね返す（何も なければ しっぱいして 目を まわす）
function echo(b, c, ev) {
  const p = c.c8par;
  const pc = parrotConf(c);
  const words = p ? p.words.splice(0) : [];
  if (p) p.left = echoEvery(c);
  if (!words.length) {
    if (p) {
      p.empties++;
      p.dizzy = true;
    }
    c.debuffs.def = { mult: pc.dizzy, lv: 1, left: BUFF_ACTS };
    ev.fx = { type: 'ability', anim: 'a8p_dizzy', actor: c.id, targets: [c.id], side: 'enemy' };
    ev.lines.push(`…しかし、${c.name}は、何も覚えていなかった！`, `${c.name}「あれ？えーっと…なんだっけ？」`);
    (ev.postLines = ev.postLines || []).push(`${c.name}は、目をまわした！（次の番は動けない・守りが下がった！）`);
    ev.c8aEcho = { id: c.id, n: 0 };
    ev.upd.push(c);
    return;
  }
  const last = words[words.length - 1];
  const k = 1 + (pc.echo.per ?? 0.5) * (words.length - 1);
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a8p_echo', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', element: last.el || undefined };
  ev.lines.push(`${c.name}「${words.map((w) => w.name).join('！')}！」`, '覚えた呪文を、そっくりそのまま、はね返した！');
  magicAll(b, c, pc.echo.base, last.el, k, ev);
  if (p) p.echoes++;
  ev.c8aEcho = { id: c.id, n: words.length, el: last.el || null, names: words.map((w) => w.name) };
  ev.warn = true;
  ev.upd.push(c);
}

// さいみんじゅつ: n 人を あやつる（こんらん）
function hypno(b, c, ev) {
  const v = c.c8viz;
  const vc = vizierConf(c);
  if (v) v.left = vc.staff.every;
  if (!staffUp(b)) {
    ev.lines.push('しかし、へびのつえがない！');
    return;
  }
  const pool = b.aliveAllies().filter((x) => !x.status?.confuse && !x.status?.rift);
  const picks = [];
  while (picks.length < (vc.staff.hypno.n || 1) && pool.length) picks.push(pool.splice(b.rng.int(0, pool.length - 1), 1)[0]);
  ev.fx = { type: 'ability', anim: 'a8j_hypno', actor: c.id, targets: picks.map((x) => x.id), side: 'enemy' };
  const hit = [], safe = [];
  for (const t of picks) {
    if (b.tryStatus(c, t, { status: 'confuse', chance: 1, turns: vc.staff.hypno.turns, quiet: true }, ev)) hit.push(t);
    else safe.push(t);
  }
  if (hit.length) {
    ev.lines.push(`${hit.map((x) => x.name).join('と')}は、${c.name}にあやつられてしまった！`);
    (ev.postLines = ev.postLines || []).push('（へびのつえをこわすと、さいみんじゅつがとける…！）');
  }
  if (safe.length) ev.lines.push(`${safe.map((x) => x.name).join('と')}は、ぐっとこらえて、目をそらした！`);
  if (v) {
    v.hypno.push(...hit.map((x) => x.id));
    v.hypnos++;
  }
  ev.c8aHypno = { id: c.id, who: hit.map((x) => x.id), safe: safe.map((x) => x.id) };
  ev.warn = !!hit.length;
  ev.upd.push(c, ...picks);
}

// 大へびの姿（2だんめ）: つえは 消え、あやつられた 人は 目を さます
function toCobra(b, c, ev) {
  const v = c.c8viz;
  const vc = vizierConf(c);
  if (!v || v.form !== 1) return;
  v.form = 2;
  v.left = vc.cobra.every;
  v.daze = false;
  c.name = COBRA_NAME;
  c.actions = COBRA_ACTIONS.map((x) => ({ ...x }));
  c.atk = Math.round(c.atk * (vc.cobra.atk ?? 1));
  ev.fx = { type: 'ability', anim: 'a8j_cobra', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('ジャハールの体が、ぐんぐんのびて、うろこにおおわれていく…！', 'ジャハールは、大きなコブラに姿をかえた！');
  const st = staffOf(b);
  if (vanishPart(b, st)) {
    ev.lines.push('へびのつえは、コブラの体にすいこまれて消えた！');
    ev.upd.push(st);
  }
  wake(b, v, ev);
  (ev.postLines = ev.postLines || []).push('（コブラは、ときどきとぐろをまく…！とぐろの間は、攻撃するとかみつかれるぞ！）');
  ev.c8aCobra = { id: c.id, staff: st?.id || null };
  ev.warn = true;
  ev.upd.push(c);
}

// とぐろをまく（次の 番に 大へびのいちげき。とぐろの 間に 攻撃すると かみつく）
function coil(b, c, ev) {
  const v = c.c8viz;
  if (!v) return;
  v.coiled = true;
  v.counters = 0;
  v.coils++;
  v.left = vizierConf(c).cobra.every;
  (ev.postLines = ev.postLines || []).push('（とぐろの間に攻撃すると、かみつかれる…！次のコブラの番は、大へびのいちげき！）');
  ev.c8aCoil = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// 大へびのいちげき（かみついた 数だけ 強い）／だれも 攻撃して いなければ からぶりして のびきる
function strike(b, c, ev) {
  const v = c.c8viz;
  const cc = vizierConf(c).cobra;
  const n = v?.counters || 0;
  if (v) {
    v.coiled = false;
    v.counters = 0;
  }
  if (!n) {
    if (v) {
      v.open = cc.open.turns;
      v.whiffs++;
    }
    ev.fx = { type: 'ability', anim: 'a8c_whiff', actor: c.id, targets: [c.id], side: 'enemy' };
    ev.lines.push('だれも攻撃してこない…！コブラは、しびれをきらしてとびかかった！', 'しかし、いきおいあまって、柱に、どーんと頭を打った！');
    (ev.postLines = ev.postLines || []).push(`${c.name}は、のびきってしまった！（今なら、ダメージが${cc.open.k}倍！）`);
    ev.c8aWhiff = { id: c.id, k: cc.open.k, turns: cc.open.turns };
    ev.upd.push(c);
    return;
  }
  const sc = cc.strike;
  const mult = Math.min(sc.max ?? 2, (sc.mult ?? 0.9) + (sc.per ?? 0.25) * n);
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a8c_strike', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult, ignoreDef: sc.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'phys');
  if (v) v.strikes++;
  ev.c8aStrike = { id: c.id, n };
  ev.warn = true;
  ev.upd.push(c);
}

// ランプの魔人（3だんめ）: 黒いランプが あらわれる
function toGenie(b, c, ev) {
  const v = c.c8viz;
  const vc = vizierConf(c);
  if (!v || v.form !== 2) return;
  v.form = 3;
  v.left = blastEvery(c);
  v.coiled = false;
  v.counters = 0;
  v.open = 0;
  c.name = GENIE_NAME;
  c.actions = GENIE_ACTIONS.map((x) => ({ ...x }));
  c.atk = Math.round(c.atk * (vc.genie.atk ?? 1));
  ev.fx = { type: 'ability', anim: 'a8j_genie', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('コブラの体が、赤いけむりにつつまれていく…！', 'ジャハールは、大きなランプの魔人に姿をかえた！');
  let lamp = lampOf(b);
  if (lamp) {
    revivePart(b, lamp);
    ev.upd.push(lamp);
  } else {
    const added = b.addEnemies([C8_LAMP]);
    lamp = added[0];
    if (lamp) {
      lamp.atb = 0;
      ev.joined = (ev.joined || []).concat(added.map(pub));
    }
  }
  if (lamp) ev.lines.push('魔人のそばに、黒いランプがうかび上がった！');
  (ev.postLines = ev.postLines || []).push('（魔人の力は、あの黒いランプから来ているようだ…！ランプをこわすと、どうなる…？）');
  ev.c8aGenie = { id: c.id, lamp: lamp?.id || null };
  ev.warn = true;
  ev.upd.push(c);
}

// むげんの魔力（みんなに 闇の 大技。身を 守ると 半分）
function blast(b, c, ev) {
  const v = c.c8viz;
  if (v) {
    v.left = blastEvery(c);
    v.blasts++;
  }
  const bc = vizierConf(c).genie.blast || {};
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a8g_blast', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', element: 'dark' };
  magicAll(b, c, bc.base || [220, 250], 'dark', 1, ev);
  ev.c8aBlast = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// ───────────── ダメージ（battle-c7i.js の c7iDamage の はじめ。味方 → 敵 だけ）─────────────
// イアゴン: 聞き耳の 間に 当たった 呪文を 覚える／ジャハール: とぐろの 間は かみつく・のびきった 間と ランプの 中は ダメージが ふえる・変身の 前は HP が 下がりきらない
export function c8aDamage(b, c, t, dmg, info, ev) {
  // 第8章 第2幕: 小鬼の パニック・けんか／ハデロスの けいやくしょ・頭が ひえる・おこる 前（battle-c8b.js）
  dmg = c8bDamage(b, c, t, dmg, info, ev);
  if (!(dmg > 0) || c?.side !== 'ally') return dmg;
  if (t.c8par) hear(b, c, t, info, ev);
  const v = t.c8viz;
  if (!v) return dmg;
  const vc = vizierConf(t);
  if (v.form === 2) {
    if (v.coiled && c.alive && !ev.c8aBit) bite(b, t, c, ev);
    if (v.open > 0) dmg = Math.round(dmg * vc.cobra.open.k);
  }
  if (v.form === 3 && v.seal > 0) dmg = Math.round(dmg * vc.genie.seal.k);
  const at = v.form === 1 ? vc.p2At : v.form === 2 ? vc.p3At : 0;
  if (at > 0) {
    // 小数の ずれで ちょうど at に ならない ように（90000 × 0.34 ＝ 30600.000…04）
    const floor = Math.ceil(t.maxHp * at - 1e-6) - 1;
    if (t.hp - dmg < floor) dmg = Math.max(0, t.hp - floor);
  }
  return dmg;
}

// 聞き耳の 間に 当たった 呪文（ダメージの ある 呪文・物理で ない 合体技。1回の 行動で 1つ）を 覚える
function hear(b, c, t, info, ev) {
  if (info.phys || ev.c8aHeard || !listening(t)) return;
  // 呪文（技）か 合体技の 名前
  const name = ev.dual?.name || (ev.ability ? ABILITIES[ev.ability]?.name : null);
  if (!name) return;
  ev.c8aHeard = true;
  const p = t.c8par;
  const max = parrotConf(t).max;
  const el = info.element && info.element !== 'phys' ? info.element : null;
  const a = { name };
  p.words.push({ id: ev.dual?.id || ev.ability, el, name });
  while (p.words.length > max) p.words.shift();
  p.heard++;
  const elTxt = el && EL_NAME[el] ? `${EL_NAME[el]}の` : '';
  (ev.postLines = ev.postLines || []).push(`${t.name}「${a.name}！${a.name}！」（${elTxt}呪文を、覚えられてしまった…！）`);
  ev.c8aLearn = { id: t.id, words: p.words.map((w) => w.el || 'none') };
  ev.upd.push(t);
}

// とぐろの 間の かみつき（1回の 行動で 1回）
function bite(b, cobra, c, ev) {
  ev.c8aBit = true;
  const v = cobra.c8viz;
  v.counters++;
  const cc = vizierConf(cobra).cobra.counter || {};
  (ev.postLines = ev.postLines || []).push(`${cobra.name}が、とぐろの中から、${c.name}にかみついた！`);
  b.physHit(cobra, c, { mult: cc.mult ?? 0.85, ignoreDef: cc.ignoreDef ?? 0.3, acc: 1.3 }, ev, 'phys');
  ev.c8aBite = { id: cobra.id, who: c.id, n: v.counters };
  ev.upd.push(cobra, c);
}

// ───────────── たおれた（battle-c7i.js の c7iKill の はじめ）─────────────
// へびのつえ: あやつられた 人が 目を さます・ジャハールは うろたえる／黒いランプ: 魔人が ランプに すいこまれる
export function c8aKill(b, t, ev) {
  // 第8章 第2幕: 小鬼の かたほうが たおれた（battle-c8b.js）
  c8bKill(b, t, ev);
  if (!isStaff(t) && !isLamp(t)) return;
  const w = vizierOf(b);
  if (!w?.c8viz) return;
  const v = w.c8viz;
  const vc = vizierConf(w);
  const post = ev ? (ev.postLines = ev.postLines || []) : [];
  if (isStaff(t) && v.form === 1) {
    v.down = vc.staff.regrow;
    v.breaks++;
    v.left = vc.staff.every;
    v.daze = true;
    // ならべて いた さいみんじゅつは とりやめ
    if (w.telegraph === HYPNO) w.telegraph = null;
    const woke = ev ? wake(b, v, ev) : [];
    if (!ev) v.hypno = [];
    post.push('へびのつえが、くだけちった！', `${w.name}「な、なに…！？わたしのつえが…！」`, `（${w.name}は、うろたえている！）`);
    if (ev) {
      ev.c8aBreak = { id: w.id, staff: t.id, woke: woke.map((x) => x.id) };
      ev.upd.push(w);
    }
    return;
  }
  if (isLamp(t) && v.form === 3) {
    v.seal = vc.genie.seal.turns + 1;
    v.seals++;
    v.left = blastEvery(w);
    // ならべて いた 大技も とりやめ（ランプに すいこまれる）
    w.telegraph = null;
    if (w.queued) {
      b.queue = b.queue.filter((q) => q.id !== w.id);
      w.queued = false;
    }
    w.ready = false;
    w.atb = 0;
    post.push('黒いランプが、ひびわれた…！', `${w.name}「な、なんだ…！？ランプに、すいこまれる…！」`, `${w.name}は、自分のランプの中に、すいこまれてしまった！（ダメージが${vc.genie.seal.k}倍！）`);
    if (ev) {
      ev.c8aSeal = { id: w.id, lamp: t.id, turns: vc.genie.seal.turns, k: vc.genie.seal.k };
      ev.upd.push(w);
    }
  }
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
// オウムがえし（覚えた 呪文が ある とき）が c の 次の 番より 先に 来るか
export function echoBefore(b, c, p = parrotOf(b)) {
  if (!p?.c8par || p.c8par.dizzy || !p.c8par.words.length) return false;
  if (p.telegraph === ECHO) return true;
  return actsBefore(b, c, p) >= p.c8par.left;
}
// ジャハールの みんなへの 大技（いちげき〈かみついた とき〉・むげんの魔力）が c の 次の 番より 先に 来るか
export function vizierBigBefore(b, c, w = vizierOf(b)) {
  const v = w?.c8viz;
  if (!v) return false;
  if (v.form === 2) return v.coiled && v.counters > 0 && (w.telegraph === STRIKE || actsBefore(b, c, w) >= 1);
  if (v.form !== 3 || v.seal > 0) return false;
  if (w.telegraph === BLAST) return true;
  if (w.telegraph) return false;
  return actsBefore(b, c, w) >= v.left;
}

// その 敵に いちばん 大きい ダメージの 1回の 行動（攻撃・1体の 技。physOnly … 呪文は のぞく。{ cmd, dmg }）
function bestHit(b, c, t, physOnly = false) {
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
    } else if (e.type === 'magic' && !physOnly) dmg = b.calcMagic(c, t, e, 1, true).dmg;
    else continue;
    if (dmg > best.dmg) best = { cmd: { type: 'ability', id, target: t.id }, dmg };
  }
  return best;
}
// 敵に 当てる 呪文か（イアゴンが 覚える もの）
const isSpell = (cmd) => cmd?.type === 'ability' && FOES.has(ABILITIES[cmd.id]?.target) && prim(ABILITIES[cmd.id]).type === 'magic';
// 敵に ダメージを あたえる 行動か（とぐろの 間は しない）
function isAttack(cmd) {
  if (!cmd) return false;
  if (cmd.type === 'attack' || cmd.type === 'dual') return true;
  if (cmd.type !== 'ability') return false;
  const a = ABILITIES[cmd.id];
  return FOES.has(a?.target) && ['phys', 'magic', 'allMp', 'pay'].includes(prim(a).type);
}

// ───────────── オート（battle-c7i.js の c7iPlan の はじめ）─────────────
// 第8章 第1幕の ボスが いなければ null（ほかの ボスの 考えへ）
export function c8aPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c8aInner || c.status?.rift) return null;
  // 第8章 第2幕の ボス（ペイニックと パニクル・ハデロス。battle-c8b.js）
  const bp = c8bPlan(b, c, decide);
  if (bp) return bp;
  const p = parrotOf(b);
  const w = vizierOf(b);
  if (!p && !w) return null;
  const soon = p ? echoBefore(b, c, p) : vizierBigBefore(b, c, w);
  // ふつうの オート: 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  if (!b.knowsCh6) {
    if (b.c6Naive || !soon) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c8aInner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c8aInner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  if (saving) return base;
  if (p) {
    if (soon && !b.c6NoGuard) return { type: 'defend' };
    // 聞き耳の 間は 呪文を 当てない（いちばん 大きい 物理の 攻撃に かえる）
    if (listening(p) && !b.c8aNoQuiet && isSpell(base)) return bestHit(b, c, p, true).cmd;
    return base;
  }
  const v = w.c8viz;
  if (v.form === 1) {
    // さいみんじゅつが 近い ときは、へびのつえを こわす
    const st = staffOf(b);
    if (st?.alive && !b.c8aNoStaff && (v.left <= 2 || w.telegraph === HYPNO) && a?.target !== 'enemies') {
      const h = bestHit(b, c, st);
      if (h.dmg > 0) return h.cmd;
    }
    return base;
  }
  if (v.form === 2) {
    // とぐろの 間は 攻撃しない（守る。回復・補助は そのまま）
    if (v.coiled && !b.c8aNoCoil && isAttack(base)) return { type: 'defend' };
    if (soon && !b.c6NoGuard) return { type: 'defend' };
    return base;
  }
  // 3だんめ: ランプを 先に こわす（大技が 来る 前に こわせない ときは 守る）
  const lamp = lampOf(b);
  if (lamp?.alive && v.seal <= 0 && !b.c8aNoLamp) {
    const h = bestHit(b, c, lamp);
    if (soon && h.dmg < lamp.hp && !b.c6NoGuard) return { type: 'defend' };
    if (a?.target !== 'enemies' && h.dmg > 0) return h.cmd;
    return base;
  }
  if (soon && !b.c6NoGuard) return { type: 'defend' };
  return base;
}

// ───────────── がめんへ（battle-c7i.js の c7iPub の さいご）─────────────
// イアゴン: echoLeft・echoEvery（オウムがえしまで）・listen（聞き耳）・words（覚えた 呪文の 属性）・dizzy
// ジャハール: c8form（1 魔術師・2 コブラ・3 魔人）・hypnoLeft・hypnoEvery・staffDown（つえが もどるまで）・coilLeft・coilEvery・coiled・counters・
//   openLeft・openK（のびきった 間）・blastLeft・blastEvery・sealLeft・sealK（ランプの 中）
// へびのつえ: c8staff／黒いランプ: c8lamp
export function c8aPub(c, o) {
  // 第8章 第2幕（battle-c8b.js）
  c8bPub(c, o);
  if (c.c8par) {
    o.echoLeft = c.c8par.left;
    o.echoEvery = echoEvery(c);
    o.words = c.c8par.words.map((w) => w.el || 'none');
    if (listening(c)) o.listen = 1;
    if (c.c8par.dizzy) o.dizzy = 1;
  }
  if (c.c8viz) {
    const v = c.c8viz;
    const vc = vizierConf(c);
    o.c8form = v.form;
    if (v.form === 1) {
      o.hypnoLeft = v.left;
      o.hypnoEvery = vc.staff.every;
      if (v.down > 0) o.staffDown = v.down;
    } else if (v.form === 2) {
      o.coilLeft = v.left;
      o.coilEvery = vc.cobra.every;
      if (v.coiled) {
        o.coiled = 1;
        o.counters = v.counters;
      }
      if (v.open > 0) {
        o.openLeft = v.open;
        o.openK = vc.cobra.open.k;
      }
    } else {
      o.blastLeft = v.left;
      o.blastEvery = blastEvery(c);
      if (v.seal > 0) {
        o.sealLeft = Math.max(1, v.seal - 1);
        o.sealK = vc.genie.seal.k;
      }
    }
  }
  if (isStaff(c)) o.c8staff = 1;
  if (isLamp(c)) o.c8lamp = 1;
}
