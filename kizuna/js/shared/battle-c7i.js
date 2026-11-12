// 第2部 第7章 第3幕「ひとりぼっちの星」の ボスの 戦いの しかけ（battle-c7s.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・いばらの魔女マレフィナ（monsters-c7i.js の c7i.kind 'witch'。Step 5 の さいごの 中ボス。2だん）
//   1だんめ（魔女）「いばらのかべ」: 前に いばらのかべ（c7_thorn。べつの 敵。炎が よく効く）が ある 間、魔女が 受ける ダメージは thorn.cut ばい。
//     かべを こわすと、魔女が thorn.regrow 回 動くまで かべは ない（また はえる）。
//     curse.every 回 動く たびに（しるし c.c7mal.left）「百年ねむりののろい」（m7m_curse）: 身を 守って いない 人を みんな ねむらせる。
//     身を 守って いる 人は のろいを はね返す（ねむらない）。
//   HP が p2At より へると、次の 番に「本当の姿」（m7m_transform）… 黒い 竜に 変身する。それまでは HP が p2At より 下がらない（いっきに たおせない）。
//     変身で いばらのかべは もえて 消え、攻撃力と 速さが 上がる。行動は 竜の 技に 入れかわる（DRAGON_ACTIONS）。え は 竜の すがた（pub の c7form 2）
//   2だんめ（黒い 竜）: dragon.every 回 動く たびに「黒いほのおのいき」（m7d_breath。みんなに 炎の 大技。身を 守ると 半分）。
//     HP が dragon.p3At より へると dragon.p3Every に（はやく なる）
// ・カイの影（c7i.kind 'shade'。第7章の さいごの ボス）「かげブーメラン」
//   every 回 動く たびに、行動の はじめに 1人を ねらう（c.c7shade.aims。頭の 上に ねらいの しるし）。そのあとは ふつうに 動く。
//   lead 回 あとの 影の 番に、かならず「かげブーメラン」（m7h_throw）:
//     ねらわれた 人が 身を 守って いれば、はね返す … 影に 最大HPの reflect の ダメージ・影は ふらつく（次の 番は 動けない・守りが stagger ばい）。
//     守って いなければ、その 人に とても 大きな ダメージ（hit）・もどってくる ブーメランが ほかの みんなにも 当たる（back）。
//   HP が p2At より へると「かげぶんしん」… 2人を いっしょに ねらう・every が p2Every に（はやく なる）
// ・ふつうの オート（家族が「オート」に した とき）: 大技（のろい・いき・ねらわれた 人への ブーメラン）が 自分の 次の 番より 先に 来る とき、
//   HPが へっていれば よく 身を 守る（battle-ch6.js の AUTO_GUARD。ほかの ボスと おなじ。b.c6Naive … しない 人）
// ・知っている 人（シミュレーター tools/sim-ch7.mjs。b.knowsCh6）: のろい・いきの 前に 身を 守る（b.c6NoGuard … しない）／
//   いばらのかべが ある 間は かべを 先に こわす（炎の 技が あれば 炎。b.c7iNoThorn … しない）／
//   ねらわれたら、ブーメランの 前に 身を 守って はね返す（b.c7iNoGuardAim … しない）
import { MONSTERS } from './data/monsters.js?v=d13bba1204d4';
import { ABILITIES } from './data/abilities.js?v=d13bba1204d4';
import { C7_WITCH, C7_THORN, C7_SHADOW, DRAGON_ACTIONS } from './data/monsters-c7i.js?v=d13bba1204d4';
import { BUFF_ACTS } from './buff-acts.js?v=d13bba1204d4';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=d13bba1204d4';
import { canUse } from './ai.js?v=d13bba1204d4';
import { AUTO_GUARD } from './battle-ch6.js?v=d13bba1204d4';
// 第2部 第8章 第1幕: オウムのイアゴン（オウムがえし）・大臣ジャハール（さいみんじゅつ → とぐろ → ランプ）。battle-c8a.js
import { setupC8a, c8aTurnStart, c8aEffect, c8aPlan, c8aPub, c8aDamage, c8aKill } from './battle-c8a.js?v=d13bba1204d4';

export { C7_WITCH, C7_THORN, C7_SHADOW };
export const CURSE = 'm7m_curse';
export const TRANSFORM = 'm7m_transform';
export const BREATH = 'm7d_breath';
export const THROW = 'm7h_throw';
export const DAZE = 'm7h_daze';
export const DRAGON_NAME = '黒竜マレフィナ';
const FOES = new Set(['enemy', 'group', 'enemies']);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});

const confOf = (m) => MONSTERS[m?.species]?.c7i || null;
export function witchConf(m) {
  const c = confOf(m) || {};
  return {
    thorn: { cut: 0.35, regrow: 3, ...(c.thorn || {}) },
    curse: { every: 4, turns: [2, 3], ...(c.curse || {}) },
    p2At: c.p2At ?? 0.5,
    dragon: { every: 3, p3At: 0.25, p3Every: 2, breath: {}, atk: 1.1, speed: 1, ...(c.dragon || {}) },
  };
}
export const shadeConf = (m) => ({ every: 3, lead: 1, p2At: 0.5, p2Every: 2, hit: {}, back: {}, reflect: 0.05, stagger: 0.8, daze: true, ...(confOf(m)?.shade || {}) });
export const isThorn = (m) => !!MONSTERS[m?.species]?.c7thorn;
export const isDragon = (m) => !!m?.c7mal?.dragon;
export const thornOf = (b) => b.enemies.find((e) => isThorn(e) && !e.fled) || null;
const witchOf = (b) => b.enemies.find((e) => e.c7mal && e.alive) || null;
const shadeOf = (b) => b.enemies.find((e) => e.c7shade && e.alive) || null;
const breathEvery = (c) => {
  const d = witchConf(c).dragon;
  return c.hp / c.maxHp < d.p3At ? d.p3Every : d.every;
};
const shadeP2 = (c) => c.hp / c.maxHp < shadeConf(c).p2At;
const aimEvery = (c) => (shadeP2(c) ? shadeConf(c).p2Every : shadeConf(c).every);
// いばらのかべが 立って いるか
export const thornUp = (b) => !!thornOf(b)?.alive;
// ねらわれて いる 人（たおれた 人は のぞく）
export function aimed(b, s = shadeOf(b)) {
  if (!s?.c7shade) return [];
  return s.c7shade.aims.map((id) => b.get(id)).filter((x) => x?.alive);
}

// ───────────── はじめ（battle-c7s.js の setupC7s の さいご）─────────────
export function setupC7i(b) {
  const lines = [];
  for (const e of b.enemies) {
    const conf = confOf(e);
    if (!conf) continue;
    if (conf.kind === 'witch') {
      e.c7mal = { dragon: false, left: witchConf(e).curse.every, down: 0, curses: 0, breaths: 0, breaks: 0, burnt: false };
      // がめんへ（pub）: いばらのかべも 魔女の ようすを 見る
      for (const s of b.enemies) if (isThorn(s)) s.c7m = e.c7mal;
      lines.push(`${e.name}の前に、黒いいばらのかべが、ぐんぐんのびていく…！`, '（いばらのかべがある間は、魔女にダメージがとどきにくい。炎でよくもえそうだ…！）');
    }
    if (conf.kind === 'shade') {
      e.c7shade = { left: aimEvery(e), aims: [], lead: 0, daze: false, marks: 0, throws: 0, reflects: 0, hits: 0 };
      lines.push(`${e.name}が、黒いブーメランを、くるくる回している…`, '（ねらわれた人は、身を守ると、ブーメランをはね返せそうだ…！）');
    }
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1300 });
  // 第8章 第1幕の ボス（battle-c8a.js）
  setupC8a(b);
}

// ───────────── 行動の はじめ（battle-c7s.js の c7sTurnStart の はじめ）─────────────
// 動けない 番も しるしを 数える（しるしが 1つの 番が 動けない ときは、次の 番に）
export function c7iTurnStart(b, c, ev, stuck) {
  // 第8章 第1幕（battle-c8a.js）
  c8aTurnStart(b, c, ev, stuck);
  if (c.c7mal) witchTurn(b, c, ev, stuck);
  else if (c.c7shade) shadeTurn(b, c, ev, stuck);
}

function witchTurn(b, c, ev, stuck) {
  const w = c.c7mal;
  const wc = witchConf(c);
  // こわれた いばらのかべが また はえる（魔女の 間だけ）
  const th = thornOf(b);
  if (!w.dragon && th && !th.alive && !w.burnt) {
    w.down--;
    if (w.down <= 0) {
      Object.assign(th, { alive: true, hp: th.maxHp, status: {}, buffs: {}, debuffs: {}, ready: false, queued: false, telegraph: null });
      th.atb = 0;
      const k = b.killed.lastIndexOf(th.species);
      if (k >= 0) b.killed.splice(k, 1);
      ev.lines.push(`${c.name}の前に、また、いばらのかべがのびてきた…！`);
      ev.c7iRegrow = { id: c.id, thorn: th.id };
      ev.upd.push(th);
    } else ev.lines.push(`（いばらが、また、のびようとしている…あと${w.down}回）`);
  }
  if (c.telegraph) return;
  if (!w.dragon) {
    // HP が へったら、次の 番で 黒い 竜に
    if (c.hp / c.maxHp < wc.p2At) {
      if (!stuck) c.telegraph = TRANSFORM;
      ev.upd.push(c);
      return;
    }
    if (w.left <= 1) {
      if (!stuck) c.telegraph = CURSE;
    } else {
      w.left--;
      if (w.left === 1) ev.lines.push(`${c.name}の糸車が、からからと回り出した…！`, '（次にマレフィナが動くと、百年ねむりののろい…！身を守れ！）');
      ev.c7iCurse = { id: c.id, left: w.left, every: wc.curse.every };
    }
    ev.upd.push(c);
    return;
  }
  // 黒い 竜: 黒いほのおのいきまで
  w.left = Math.min(w.left, breathEvery(c));
  if (w.left <= 1) {
    if (!stuck) c.telegraph = BREATH;
  } else {
    w.left--;
    if (w.left === 1) ev.lines.push(`${c.name}のむねが、黒く光り出した…！`, '（次に竜が動くと、黒いほのおのいき…！身を守れ！）');
    ev.c7iBreath = { id: c.id, left: w.left, every: breathEvery(c) };
  }
  ev.upd.push(c);
}

function shadeTurn(b, c, ev, stuck) {
  const s = c.c7shade;
  if (c.telegraph) return;
  // はね返された あとは ふらふら（1回 動けない）
  if (s.daze) {
    s.daze = false;
    if (!stuck) c.telegraph = DAZE;
    ev.upd.push(c);
    return;
  }
  // ねらって いる 人が いる: lead が のこり 1つの 番に ブーメラン
  s.aims = aimed(b, c).map((x) => x.id);
  if (s.aims.length) {
    if (s.lead <= 1) {
      if (!stuck) c.telegraph = THROW;
    } else {
      s.lead--;
      const names = s.aims.map((id) => b.get(id).name).join('と');
      ev.lines.push(`${c.name}は、${names}を、じっとねらっている…`);
      if (s.lead === 1) ev.lines.push(`（次に影が動くと、かげブーメラン…！${names}は身を守れ！）`);
      ev.c7iAimLeft = { id: c.id, who: s.aims.slice(), lead: s.lead };
    }
    ev.upd.push(c);
    return;
  }
  // 2だんめ: はやく なる
  s.left = Math.min(s.left, aimEvery(c));
  if (s.left <= 1) {
    // ねらう（この 番は ふつうに 動く）
    const n = shadeP2(c) ? 2 : 1;
    const pool = b.aliveAllies().slice();
    const picks = [];
    while (picks.length < n && pool.length) picks.push(pool.splice(b.rng.int(0, pool.length - 1), 1)[0]);
    if (!picks.length) return;
    const sc = shadeConf(c);
    s.aims = picks.map((x) => x.id);
    s.lead = Math.max(1, sc.lead);
    s.left = aimEvery(c);
    s.marks++;
    const names = picks.map((x) => x.name).join('と');
    ev.lines.push(`${c.name}の黒いひとみが、${names}をとらえた…！`, `（${names}がねらわれた！ブーメランが来る前に身を守ると、はね返せる！）`);
    ev.c7iMark = { id: c.id, who: s.aims.slice(), lead: s.lead };
    ev.warn = true;
    ev.upd.push(c, ...picks);
    return;
  }
  s.left--;
  ev.c7iShade = { id: c.id, left: s.left, every: aimEvery(c) };
  ev.upd.push(c);
}

// ───────────── 技の こうか（battle-c7s.js の c7sEffect の のこり）─────────────
export function c7iEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c7iCurse': curse(b, c, ev); return true;
    case 'c7iTransform': transform(b, c, ev); return true;
    case 'c7iBreath': breath(b, c, ev); return true;
    case 'c7iThrow': throwAt(b, c, ev); return true;
    case 'c7iDaze': daze(b, c, ev); return true;
    // 第8章 第1幕（battle-c8a.js）
    default: return c8aEffect(b, c, a, eff, ev);
  }
}

// 百年ねむりののろい: 身を 守って いない 人を みんな ねむらせる（守って いる 人は はね返す）
function curse(b, c, ev) {
  const w = c.c7mal;
  const wc = witchConf(c);
  if (w) w.left = wc.curse.every;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a7m_curse', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  const slept = [], safe = [];
  for (const t of targets) {
    if (t.defending) {
      safe.push(t);
      continue;
    }
    if (b.tryStatus(c, t, { status: 'sleep', chance: 1, turns: wc.curse.turns, quiet: true }, ev)) slept.push(t);
  }
  if (safe.length) ev.lines.push(`${safe.map((x) => x.name).join('と')}は、身を守って、のろいをはね返した！`);
  if (w) w.curses++;
  ev.c7iSleep = { id: c.id, slept: slept.map((x) => x.id), safe: safe.map((x) => x.id) };
  ev.warn = true;
  ev.upd.push(c);
}

// 本当の姿: 黒い 竜に 変身（いばらのかべは もえて 消える。ならんで いた 行動・前ぶれは そのまま）
function transform(b, c, ev) {
  const w = c.c7mal;
  const wc = witchConf(c);
  if (!w || w.dragon) return;
  w.dragon = true;
  w.burnt = true;
  w.left = breathEvery(c);
  c.name = DRAGON_NAME;
  c.actions = DRAGON_ACTIONS.map((x) => ({ ...x }));
  c.atk = Math.round(c.atk * (wc.dragon.atk ?? 1));
  c.speed = (c.speed || 1) * (wc.dragon.speed ?? 1);
  ev.fx = { type: 'ability', anim: 'a7m_transform', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push('マレフィナの体を、みどりのほのおがつつみこんだ…！', 'マレフィナは、大きな黒い竜に姿をかえた！');
  const th = thornOf(b);
  if (th?.alive) {
    th.alive = false;
    th.hp = 0;
    th.telegraph = null;
    if (th.queued) {
      b.queue = b.queue.filter((q) => q.id !== th.id);
      th.queued = false;
    }
    ev.lines.push('いばらのかべは、ほのおにまかれて、もえつきた！');
    ev.upd.push(th);
  }
  (ev.postLines = ev.postLines || []).push('（黒い竜は、ときどき黒いほのおのいきをはく…！むねが光ったら、身を守れ！）');
  ev.c7iDragon = { id: c.id, thorn: th?.id || null };
  ev.warn = true;
  ev.upd.push(c);
}

// 黒いほのおのいき（みんなに 炎の 物理の 大技。身を 守ると 半分）
function breath(b, c, ev) {
  const w = c.c7mal;
  if (w) {
    w.left = breathEvery(c);
    w.breaths++;
  }
  const bc = witchConf(c).dragon.breath || {};
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'a7d_breath', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: bc.mult ?? 1.3, ignoreDef: bc.ignoreDef ?? 0.3, acc: 1.2 }, ev, 'fire');
  ev.c7iFire = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}

// かげブーメラン: ねらった 人へ（守って いれば はね返す）
function throwAt(b, c, ev) {
  const s = c.c7shade;
  const sc = shadeConf(c);
  const list = s ? aimed(b, c) : [];
  if (s) {
    s.aims = [];
    s.lead = 0;
    s.left = aimEvery(c);
    s.throws++;
  }
  if (!list.length) {
    ev.lines.push('しかし、ねらった相手が、もういない！');
    return;
  }
  ev.fx = { type: 'ability', anim: 'a7h_throw', actor: c.id, targets: list.map((x) => x.id), side: 'enemy' };
  const back = [], hit = [];
  let reflected = 0;
  for (const t of list) {
    if (!c.alive) break;
    if (t.defending) {
      back.push(t);
      ev.lines.push(`${t.name}は、身を守って、かげブーメランをはね返した！`);
      const dmg = Math.max(1, Math.round(c.maxHp * (sc.reflect ?? 0.05)));
      b.damage(t, c, dmg, ev, { element: 'phys' });
      reflected++;
    } else {
      hit.push(t);
      b.physHit(c, t, { mult: sc.hit.mult ?? 2.0, ignoreDef: sc.hit.ignoreDef ?? 0.3, acc: 1.3 }, ev, 'phys');
    }
  }
  // もどってくる ブーメラン（当たった ぶんだけ。ねらわれて いない 人へ）
  if (hit.length && c.alive) {
    const others = b.aliveAllies().filter((x) => !list.includes(x));
    if (others.length) ev.lines.push('もどってくるブーメランが、みんなをおそった！');
    for (const x of others) for (let i = 0; i < hit.length; i++) b.physHit(c, x, { mult: sc.back.mult ?? 0.55, ignoreDef: sc.back.ignoreDef ?? 0.2, acc: 1.1 }, ev, 'phys');
  }
  if (s) {
    s.reflects += reflected;
    s.hits += hit.length;
  }
  if (reflected && c.alive) {
    // ふらつく: 次の 番は 動けない・守りが 下がる
    if (s && sc.daze) s.daze = true;
    c.debuffs.def = { mult: sc.stagger ?? 0.8, lv: 1, left: BUFF_ACTS };
    (ev.postLines = ev.postLines || []).push(`${c.name}は、はね返されたブーメランに当たって、ふらついた！（守りが下がった）`);
  }
  ev.c7iThrow = { id: c.id, back: back.map((x) => x.id), hit: hit.map((x) => x.id) };
  ev.warn = !!hit.length;
  ev.upd.push(c, ...list);
}

function daze(b, c, ev) {
  ev.c7iDaze = { id: c.id };
}

// ───────────── ダメージ（battle-c7s.js の c7sDamage の さいご。味方 → 敵 だけ）─────────────
// いばらのかべが ある 間の 魔女は cut ばい。変身の 前は HP が p2At より 下がらない
export function c7iDamage(b, c, t, dmg, info, ev) {
  // 第8章 第1幕: イアゴンの 聞き耳・ジャハールの とぐろ・のびきり・ランプの 中・変身の 前（battle-c8a.js）
  dmg = c8aDamage(b, c, t, dmg, info, ev);
  if (!(dmg > 0) || !t.c7mal || t.c7mal.dragon) return dmg;
  const wc = witchConf(t);
  if (thornUp(b)) {
    dmg = Math.max(1, Math.round(dmg * wc.thorn.cut));
    if (!ev.c7iCut) {
      ev.c7iCut = true;
      (ev.postLines = ev.postLines || []).push('いばらのかべにはばまれて、ダメージが小さくなった…！');
    }
  }
  const floor = Math.ceil(t.maxHp * wc.p2At) - 1;
  if (t.hp - dmg < floor) dmg = Math.max(0, t.hp - floor);
  return dmg;
}

// ───────────── たおれた（battle-c7s.js の c7sKill の さいご）─────────────
// いばらのかべ: 魔女が regrow 回 動くと また はえる
export function c7iKill(b, t, ev) {
  // 第8章 第1幕: へびのつえ・黒いランプが こわれた（battle-c8a.js）
  c8aKill(b, t, ev);
  if (!isThorn(t)) return;
  const w = witchOf(b);
  if (!w?.c7mal || w.c7mal.dragon) return;
  w.c7mal.down = witchConf(w).thorn.regrow;
  w.c7mal.breaks++;
  if (!ev) return;
  (ev.postLines = ev.postLines || []).push('いばらのかべが、くずれおちた！', `（今なら、${w.name}にダメージがとどく！）`);
  ev.c7iBreak = { id: w.id, thorn: t.id };
  ev.upd.push(w);
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
// のろい・いき（みんなへの 大技）が c の 次の 番より 先に 来るか
export function witchBigBefore(b, c, w = witchOf(b)) {
  if (!w?.c7mal) return false;
  if (w.telegraph === CURSE || w.telegraph === BREATH) return true;
  if (w.telegraph === TRANSFORM) return false;
  if (!w.c7mal.dragon && w.hp / w.maxHp < witchConf(w).p2At) return false;
  return actsBefore(b, c, w) >= w.c7mal.left;
}
// かげブーメランが c の 次の 番より 先に c に 来るか（c が ねらわれて いる とき）
export function throwBefore(b, c, s = shadeOf(b)) {
  if (!s?.c7shade || !s.c7shade.aims.includes(c.id)) return false;
  if (s.telegraph === THROW) return true;
  return actsBefore(b, c, s) >= Math.max(1, s.c7shade.lead);
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

// ───────────── オート（battle-c7s.js の c7sPlan の はじめ）─────────────
// 第7章 第3幕の ボスが いなければ null（ほかの ボスの 考えへ）
export function c7iPlan(b, c, decide) {
  if (c.side !== 'ally' || b.c7iInner || c.status?.rift) return null;
  // 第8章 第1幕の ボス（イアゴン・ジャハール。battle-c8a.js）
  const ap = c8aPlan(b, c, decide);
  if (ap) return ap;
  const w = witchOf(b);
  const s = shadeOf(b);
  if (!w && !s) return null;
  const soon = w ? witchBigBefore(b, c, w) : throwBefore(b, c, s);
  // ふつうの オート: 大技が 自分の 番より 先に 来る ときは、HPが へっていれば よく 身を 守る
  if (!b.knowsCh6) {
    if (b.c6Naive || !soon) return null;
    return c.hp / c.maxHp < AUTO_GUARD.hp && b.rng.chance(AUTO_GUARD.chance) ? { type: 'defend' } : null;
  }
  let base;
  b.c7iInner = true;
  try {
    base = decide(b, c);
  } finally {
    b.c7iInner = false;
  }
  const a = base?.type === 'ability' ? ABILITIES[base.id] : null;
  const saving = a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35));
  // カイの影: ねらわれたら 身を 守って はね返す（回復より 先）
  if (s && soon && !b.c7iNoGuardAim) return { type: 'defend' };
  if (saving) return base;
  if (w) {
    if (soon && !b.c6NoGuard) return { type: 'defend' };
    // いばらのかべを 先に こわす（炎の 技が あれば 炎が いちばん 大きい。敵みんなへの 技は そのまま … かべにも 当たる）
    const th = thornOf(b);
    if (th?.alive && !w.c7mal.dragon && !b.c7iNoThorn) {
      if (a?.target !== 'enemies') {
        const h = bestHit(b, c, th);
        if (h.dmg > 0) return h.cmd;
      }
    }
    return base;
  }
  return base;
}

// ───────────── がめんへ（battle-c7s.js の c7sPub の さいご）─────────────
// マレフィナ: c7form（1 魔女・2 黒い 竜）・curseLeft・curseEvery（のろいまで）・breathLeft・breathEvery（いきまで）・thornDown（かべが また はえるまで）・cut（かべの 間の ダメージの ばい）
// いばらのかべ: c7thorn
// カイの影: aimLeft・aimEvery（ねらいまで）・aims（ねらわれた 人の id）・aimLead（ブーメランまで）・daze・p2（かげぶんしん）
export function c7iPub(c, o) {
  // 第8章 第1幕（battle-c8a.js）
  c8aPub(c, o);
  if (c.c7mal) {
    const wc = witchConf(c);
    o.c7form = c.c7mal.dragon ? 2 : 1;
    if (c.c7mal.dragon) {
      o.breathLeft = c.c7mal.left;
      o.breathEvery = breathEvery(c);
    } else {
      o.curseLeft = c.c7mal.left;
      o.curseEvery = wc.curse.every;
      if (c.c7mal.down > 0) o.thornDown = c.c7mal.down;
      o.cut = wc.thorn.cut;
    }
  }
  if (isThorn(c)) o.c7thorn = 1;
  if (c.c7shade) {
    o.aimLeft = c.c7shade.left;
    o.aimEvery = aimEvery(c);
    o.aims = c.c7shade.aims.slice();
    o.aimLead = c.c7shade.lead;
    if (c.c7shade.daze) o.daze = 1;
    if (shadeP2(c)) o.p2 = 1;
  }
}
