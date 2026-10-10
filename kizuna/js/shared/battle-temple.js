// 第4章 Step 7「砂の底の神殿とモルガナ」の たたかいの しかけ（battle.js・ai.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・呪文を はね返す（reflect）: 鏡の騎士・まどわしの鏡の「体が 光った」、真の すがたの モルガナの「鏡のうろこ」。
//   光ってから つぎの 自分の 番まで、味方の 呪文（1体・グループ・全体）を はね返す（となえた 人に 半分の 強さで）。光った 番の のこりの 行動は とりやめ
// ・鏡写し（monsters の mirrorCopy。モルガナ）: おなじ 呪文を 2回 つづけて モルガナに 使うと、2回目は はね返される
// ・水の衣（monsters の veil。モルガナ）: まとっている 間は 受ける ダメージが 半分（cut）・炎は 効かない（block）。
//   雷の ダメージで はじけとぶ（breakBy）。はじけた あと wait 回 動くと、前ぶれ「水をまとい始めた…」→ つぎの 番に また まとう
// ・大波（真の すがた）: 2だんの 前ぶれ（stage 1「水がうずをまいている…」→ stage 2「うずが大きくなっていく…」）→ つぎの 番に 大波（防御で 半分）
// ・水のろう（真の すがた）: 1人を とじこめる（その 人の 番が 2回 くるまで 動けない）。ろうは 敵の がわに 出る（water_prison）。
//   ろうを こわすと 早く 出られる。モルガナが たおれると ろうも 消える（monsters の minionsFall）
// ・水の守りの歌（17-2）: morgana_true の 戦いを 始める 時、戦いに 入っている 家族の だれかが わらべ歌（SONG_FLAGS）を ぜんぶ
//   聞いていれば、はじめの SONG.waves 回の 大波の ダメージが SONG.cut ばいに なる
// ・鏡のうつし身（utsushimi）: 戦いの はじめに、パーティーの 人数ぶんの「〇〇のうつし身」に かわる（職業・レベル・見た目〈見た目装備も〉・
//   覚えている 技は うつした 人と おなじ。強さは MIRROR_RATE ばい）。技は 仲間の オートの AI（ai.js の decideAlly）で えらぶ
// ・シミュレーター（tools/sim.js）: b.knowsTemple … しかけを 知っている 人（大波の 前に 身を 守る・おなじ 呪文を つづけない・
//   水の衣に きずな技〈雷〉・水のろうを こわす）。b.templeNaive … 知らない 人（光っていても 呪文・大波でも 身を 守らない）
import { MONSTERS } from './data/monsters.js?v=1a19851ff61f';
import { ABILITIES, ELEMENT_NAMES } from './data/abilities.js?v=1a19851ff61f';
// わらべ歌の フラグ（物語の データ。読むだけ）
import { SONG_FLAGS } from './maps/ch4.js?v=1a19851ff61f';
import { decideAlly } from './ai.js?v=1a19851ff61f';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate, pub } from './battle.js?v=1a19851ff61f';
import { mirageSync } from './battle-ch4.js?v=1a19851ff61f';

export const UTSUSHIMI = 'utsushimi';
export const PRISON = 'water_prison';
export const WAVE = 'm_big_wave';
// うつし身の 強さ（うつした 人の 強さ × これ。少し 弱く）
export const MIRROR_RATE = { hp: 1.05, atk: 0.85, dfn: 0.9, mag: 0.85, heal: 0.75, agi: 0.95 };
// はね返った 呪文の 強さ（となえた 人に 当たる）。1回で たおれて しまわない ように、さいだいHPの REFLECT_CAP まで
export const REFLECT_MULT = 0.5;
export const REFLECT_CAP = 0.3;
// 水の守りの歌: はじめの waves 回の 大波が cut ばい
export const SONG = { waves: 1, cut: 0.5 };
// うつし身が 使わない 技の こうか（戦いを こわす もの・にげる・追い出す・けしさる・生き返らせる・お金・ぬすむ・どれか ひとつ など）
const MIRROR_SKIP = new Set(['escape', 'banish', 'destroy', 'revive', 'reviveAll', 'goldThrow', 'steal', 'scan', 'bondUp', 'allMp', 'random', 'callHelp', 'stance', 'hurt', 'overtime', 'mahouken', 'flee']);

const isSpell = (a) => !!a && (a.kind === 'spell' || !!a.spellLike);
const foeKinds = new Set(['enemy', 'group', 'enemies']);
// 番の のこりの 行動を とりやめる（構えて まつ・前ぶれ）
function endTurn(b, c, ev) {
  b.queue = b.queue.filter((q) => q.id !== c.id);
  ev.forceLast = true;
  ev.atbAfter = 0;
}

// ───────────── たたかいの はじめ（Battle の constructor。分身より 先）─────────────
export function setupTemple(b, opts = {}) {
  if (b.enemies.some((e) => e.species === UTSUSHIMI && !e.mirrorOf)) setupUtsushimi(b);
  // 水の衣: はじめから まとっている
  for (const e of b.enemies) {
    if (!MONSTERS[e.species]?.veil) continue;
    e.veil = true;
    e.veilGone = 0;
  }
  // 水の守りの歌（真の すがたの モルガナの 戦い）
  if (b.enemies.some((e) => e.species === 'morgana_true')) {
    const song = opts.song !== undefined ? !!opts.song : heardSongs(opts.allies);
    if (song) {
      b.song = { left: SONG.waves, cut: SONG.cut, now: false };
      b.emit({ t: 'msg', lines: ['水の守りの歌が、みんなをつつんでいる…', '（大波のいきおいが、やわらぎそうだ）'], fx: { type: 'song' }, dur: 1800 });
    }
  }
}

// 戦いに 入っている 家族の だれかが、わらべ歌を 4つとも 聞いている（キャラの flags）
export function heardSongs(allies = []) {
  return allies.some((a) => {
    const f = a?.char?.flags;
    return a.kind !== 'guest' && !a.char?.species && f && SONG_FLAGS.every((k) => f[k]);
  });
}

// ───────────── 鏡のうつし身 ─────────────
// 1体の しるし（utsushimi）を、パーティーの 人数ぶんの うつし身に かえる
export function setupUtsushimi(b) {
  const marks = b.combatants.filter((x) => x.side === 'enemy' && x.species === UTSUSHIMI && !x.mirrorOf);
  b.combatants = b.combatants.filter((x) => !marks.includes(x));
  for (const a of b.allies) {
    const e = mirrorCopy(a);
    e.id = 'e' + (b.nextId++);
    e.slot = b.combatants.filter((x) => x.side === 'enemy').length;
    b.combatants.push(e);
  }
}

// うつし身が 使える 技（覚えている 技から。戦いを こわす 技は 使わない）
export function mirrorSkillOk(id) {
  const a = ABILITIES[id];
  if (!a || a.kind === 'bond' || a.hidden) return false;
  const effs = a.effect?.type === 'multi' ? a.effect.parts || [] : [a.effect || {}];
  return effs.every((e) => !MIRROR_SKIP.has(e.type));
}

const R = (v, k) => Math.max(1, Math.round((v || 0) * k));

// 味方 a の うつし身（敵の がわ）。見た目（look・職業・見た目装備 eq・魔物の 仲間なら mon）は そのまま
export function mirrorCopy(a) {
  const K = MIRROR_RATE;
  const maxHp = R(a.maxHp, K.hp);
  const name = `${a.name}のうつし身`;
  return {
    side: 'enemy', kind: 'monster', species: UTSUSHIMI, mirrorOf: a.id,
    name, baseName: name, letter: '',
    lv: a.lv, maxHp, hp: maxHp, maxMp: a.maxMp || 0, mp: a.maxMp || 0,
    atk: R(a.atk, K.atk), dfn: R(a.dfn, K.dfn), agi: R(a.agi, K.agi), mag: R(a.mag, K.mag), healPow: R(a.healPow, K.heal),
    resist: { ...(a.resist || {}) }, race: a.race || 'human', metal: false, flying: false, boss: false,
    turns: 1, size: 'm', speed: 1,
    actions: [{ w: 1, id: 'attack' }], used: {}, recent: [],
    abilities: (a.abilities || []).filter(mirrorSkillOk),
    tactics: a.tactics && a.tactics !== 'manual' ? a.tactics : 'balanced',
    autoOff: (a.autoOff || []).slice(),
    penChar: a.penChar, weaponCat: a.weaponCat, onHit: a.onHit,
    look: a.look, job: a.job, eq: a.eq, mon: a.mon,
    atb: 0, ready: false, queued: false, buffs: {}, debuffs: {}, status: {},
    alive: true, charge: 1, telegraph: null, cover: null,
  };
}

// うつし身から 見た たたかい（味方と 敵を 入れかえた かげ。仲間の オートの AI を そのまま 使う）
function mirrorView(b) {
  const v = Object.create(b);
  v.aliveAllies = () => b.aliveEnemies();
  v.aliveEnemies = () => b.aliveAllies();
  Object.defineProperty(v, 'allies', { get: () => b.enemies });
  Object.defineProperty(v, 'enemies', { get: () => b.allies });
  v.humans = () => [];
  v.bond = 0;
  for (const k of ['knowsMirage', 'knowsBurrow', 'ignoreBurrow', 'ignoreStance', 'ignoreChant', 'focusBoss', 'knowsTemple', 'templeNaive']) v[k] = false;
  return v;
}

function mirrorDecide(b, m) {
  let cmd = null;
  try {
    cmd = decideAlly(mirrorView(b), m);
  } catch {
    cmd = null;
  }
  if (!cmd || !['attack', 'ability', 'defend'].includes(cmd.type)) cmd = { type: 'attack' };
  if (cmd.type === 'ability' && !m.abilities.includes(cmd.id)) cmd = { type: 'attack' };
  if (cmd.type === 'attack' && !b.get(cmd.target)?.alive) cmd.target = undefined;
  return cmd;
}

// ───────────── 魔物の 番の はじめ（ai.js の decideMonster。まぼろしの あと）─────────────
export function templeAction(b, m) {
  // うつし身: 仲間の オートの AI で えらぶ
  if (m.mirrorOf) return mirrorDecide(b, m);
  // 水の衣を また まとう（前ぶれの つぎの 番。分身は まねを する だけ）
  if (m.veilCharge && !m.clone) {
    const id = m.veilCharge;
    m.veilCharge = null;
    syncVeil(b, m);
    return { type: 'ability', id };
  }
  // 大波を 出す 番: 水の守りの歌が あれば、この 大波は 軽く なる
  if (m.waveStage && m.telegraph && ABILITIES[m.telegraph]?.effect?.type !== 'wave') {
    m.waveStage = 0;
    if (b.song?.left > 0) {
      b.song.left--;
      b.song.now = true;
    }
  }
  return null;
}

// こうどうの はじめ（battle.js の executeNext。反撃の構えと おなじ ところ）: 光が 消える・水の衣の じかん・歌の あと
export function templeTurnStart(b, c, ev) {
  if (b.song) b.song.now = false;
  if (c.reflect) {
    c.reflect = null;
    ev.lines.push(`${c.name}の光が、おさまった。`);
    ev.upd.push(c);
  }
  if (c.side === 'enemy' && !c.clone && MONSTERS[c.species]?.veil && !c.veil) c.veilGone = (c.veilGone || 0) + 1;
  // 分身にも おなじ HPを 見せる（いやしの水で 回復した あとも）
  if (c.shade) mirageSync(b, c);
}

// 魔物の こうどうの じょうけん（ai.js の condOk。't:' の あと）
export function templeCond(b, m, cond) {
  if (cond === 'noReflect') return !m.reflect;
  if (cond === 'noVeil') {
    const conf = MONSTERS[m.species]?.veil;
    return !!conf && !m.veil && !m.veilCharge && (m.veilGone || 0) >= (conf.wait ?? 2);
  }
  if (cond === 'noWave') return !m.telegraph && !m.waveStage;
  // 水のろう: まだ ろうが なく、動ける 味方が 2人いじょう
  if (cond === 'noPrison') {
    if (b.enemies.some((e) => e.alive && e.species === PRISON)) return false;
    return b.aliveAllies().filter((x) => !x.status.prison).length >= 2;
  }
  return true;
}

// ───────────── 技の こうか（battle.js の applyAbility の のこり）─────────────
export function templeEffect(b, c, a, eff, ev, targets) {
  switch (eff.type) {
    case 'reflect': {
      c.reflect = { kind: eff.kind || 'glow' };
      ev.fx = { type: 'reflect', actor: c.id, kind: c.reflect.kind };
      ev.warn = true;
      ev.lines.push('（今、呪文をとなえると、はね返されそうだ…！）');
      endTurn(b, c, ev);
      ev.upd.push(c);
      return true;
    }
    case 'veilCharge': {
      c.veilCharge = eff.next;
      syncVeil(b, c, ev);
      ev.fx = { type: 'veilCharge', actor: c.id };
      ev.warn = true;
      ev.lines.push('（次の番に、また水の衣をまとうつもりだ…！）');
      endTurn(b, c, ev);
      return true;
    }
    case 'veil': {
      c.veil = true;
      c.veilGone = 0;
      syncVeil(b, c, ev);
      ev.fx = { type: 'veil', actor: c.id, on: true, targets: [c.id, ...cloneIds(b, c).filter((id) => b.get(id)?.alive)] };
      ev.lines.push('（受けるダメージが半分になり、炎が効かなくなった…！）');
      return true;
    }
    case 'dazzle': {
      // 月の鏡で まぶしい: この 番は 何も できない（2回行動の のこりも）
      endTurn(b, c, ev);
      return true;
    }
    case 'wave': {
      c.telegraph = eff.next;
      c.waveStage = eff.stage || 1;
      ev.fx = { type: 'wave', actor: c.id, stage: c.waveStage };
      ev.warn = true;
      ev.lines.push(c.waveStage >= 2 ? '（次の番に、大波が来る！身を守れ！）' : '（もうすぐ、大きな波が来そうだ…！身を守るじゅんびを！）');
      endTurn(b, c, ev);
      ev.upd.push(c);
      return true;
    }
    case 'prison': prisonStart(b, c, eff, ev, targets); return true;
    default: return false;
  }
}

// ───────────── 水の衣 ─────────────
const cloneIds = (b, c) => (b.mirage && b.mirage.real === c.id ? b.mirage.clones.slice() : []);

// 分身も おなじ すがたに（水の衣・前ぶれ）。ev … がめんへ おくる イベント（ない ときは 今の こうどう）
function syncVeil(b, c, ev = b.cur) {
  c.veilShow = c.veilCharge ? 1 : 0;
  if (ev) ev.upd.push(c);
  for (const id of cloneIds(b, c)) {
    const x = b.get(id);
    if (!x) continue;
    x.veil = c.veil;
    x.veilShow = c.veilShow;
    if (ev) ev.upd.push(x);
  }
}

// ダメージの はじめ（battle.js の damage。分身の あと）: 水の衣（半分・炎は 効かない・雷で はじける）と 水の守りの歌。
// null … ダメージなし（ことばは ここで 出す）。ほかは ダメージの 数
export function templeDamage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0) return dmg;
  // 水の守りの歌（大波）
  if (b.song?.now && c.side === 'enemy' && t.side === 'ally' && ev.ability === WAVE) {
    if (!ev.songLine) {
      ev.songLine = true;
      ev.lines.push('水の守りの歌が、大波のいきおいをやわらげた！');
      ev.song = true;
      if (b.song.left <= 0) (ev.postLines = ev.postLines || []).push('（水の守りの歌は、しずかに消えていった…）');
    }
    return Math.max(1, Math.round(dmg * b.song.cut));
  }
  if (!t.veil || c.side === t.side) return dmg;
  const conf = MONSTERS[t.species]?.veil;
  if (!conf) return dmg;
  const el = info?.element;
  if (el && el === conf.breakBy) {
    // 雷: そのまま 当たって、水の衣が はじけとぶ
    t.veil = false;
    t.veilGone = 0;
    syncVeil(b, t, ev);
    ev.veilBreak = t.id;
    ev.postLines = ev.postLines || [];
    if (!ev.postLines.includes('水の衣が、はじけとんだ！')) ev.postLines.push('水の衣が、はじけとんだ！');
    return dmg;
  }
  if (el && (conf.block || []).includes(el)) {
    ev.lines.push(`水の衣が、${ELEMENT_NAMES[el] || el}をかき消した！`);
    (ev.results = ev.results || []).push({ id: t.id, dmg: 0, miss: true, veil: true });
    return null;
  }
  return Math.max(1, Math.round(dmg * (conf.cut ?? 0.5)));
}

// 味方の オートの みつもり（battle.js の calcPhys・calcMagic の estimate）: 水の衣を 見る
export function templeEst(b, c, t, element) {
  if (!t?.veil || !c || c.side === t.side) return 1;
  const conf = MONSTERS[t.species]?.veil;
  if (!conf) return 1;
  if (element && element === conf.breakBy) return b.knowsTemple ? 1.5 : 1;
  if (element && (conf.block || []).includes(element)) return 0;
  return conf.cut ?? 0.5;
}

// ───────────── 呪文を はね返す・鏡写し ─────────────
// 味方が 敵に 呪文を となえた（battle.js の perform。MPを はらった あと）。はね返したら true（あたる ぶんも ここで あてる）
export function reflectSpell(b, c, a, cmd, ev, powMult, targets) {
  if (c.side !== 'ally' || !isSpell(a) || !foeKinds.has(a.target)) return false;
  const back = [];
  for (const t of targets) {
    if (!t?.alive || t.side === c.side) continue;
    if (t.reflect) back.push({ t, why: t.reflect.kind });
    else if (MONSTERS[t.species]?.mirrorCopy && !t.clone) {
      // 鏡写し: おなじ 呪文を つづけて 使うと はね返す（はね返しても おぼえて いる）
      if (cmd.id && t.lastSpell === cmd.id) back.push({ t, why: 'copy' });
      t.lastSpell = cmd.id;
    }
  }
  if (!back.length) return false;
  const keep = targets.filter((t) => !back.some((x) => x.t === t));
  if (keep.length) b.applyAbility(c, a, cmd, ev, powMult, keep);
  const { t: t0, why } = back[0];
  ev.lines.push(why === 'copy' ? '鏡写し！呪文ははね返された！' : `${t0.name}の${why === 'scale' ? 'うろこ' : '体'}が光り、呪文をはね返した！`);
  ev.reflected = back.map((x) => x.t.id);
  const hit = new Set([...(ev.fx?.targets || []), ...back.map((x) => x.t.id), c.id]);
  bounce(b, c, a, ev, powMult);
  ev.fx = { ...(ev.fx || {}), type: 'ability', anim: a.anim, actor: c.id, targets: [...hit], side: 'ally', element: a.effect?.element, reflect: t0.id, copy: why === 'copy' };
  return true;
}

// はね返った 呪文が となえた 人に 当たる（1回だけ。ダメージは REFLECT_MULT ばい）
function bounce(b, c, a, ev, powMult) {
  const e = a.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a.effect || {};
  if ((e.type === 'magic' || e.type === 'gather') && Array.isArray(e.base)) {
    const res = b.calcMagic(c, c, { ...e, type: 'magic', base: e.base.map((v) => Math.max(1, Math.round(v * REFLECT_MULT))) }, powMult);
    const dmg = Math.min(res.dmg, Math.max(1, Math.round(c.maxHp * REFLECT_CAP)));
    if (res.resisted || dmg <= 0) ev.lines.push(`${c.name}はダメージを受けない！`);
    else b.damage(c, c, dmg, ev, { element: e.element });
  } else if (e.type === 'status') b.tryStatus(c, c, e, ev, powMult);
  else if (e.type === 'debuff') b.applyDebuff(c, c, e, ev, powMult);
  else ev.lines.push('しかし、何も起こらなかった。');
  ev.upd.push(c);
}

// ───────────── 水のろう ─────────────
function prisonStart(b, c, eff, ev, targets) {
  const free = b.aliveAllies().filter((x) => !x.status.prison);
  let t = targets[0];
  if (!t || !t.alive || t.side === c.side || t.status.prison) t = free.length ? b.rng.pick(free) : null;
  if (!t || free.length < 2) {
    ev.lines.push('しかし、水のたまは、はじけて消えた！');
    return;
  }
  const [p] = b.addEnemies([PRISON]);
  p.atb = 0;
  p.holds = t.id;
  // ろうの 中に 見える 人（がめん）
  p.inside = { name: t.name, look: t.look, job: t.job, eq: t.eq, mon: t.mon };
  t.status.prison = { turns: eff.turns || 2, by: p.id };
  // とじこめられた 人は、ならんで いた 行動も できない
  b.queue = b.queue.filter((q) => q.id !== t.id || q.cmd?.type === 'dual');
  if (t.ready || t.queued) {
    t.ready = false;
    t.queued = false;
    t.atb = 0;
  }
  ev.joined = (ev.joined || []).concat(pub(p));
  ev.lines.push(`${t.name}は、水のろうにとじこめられた！`, '（ろうを攻撃してこわせば、早く助け出せそうだ…！）');
  ev.fx = { type: 'prison', actor: c.id, targets: [t.id], prison: p.id };
  ev.warn = true;
  ev.upd.push(t, p);
}

// ろうを 消す（たおした ことには しない。経験値も ない）
function vanishPrison(b, p, ev) {
  Object.assign(p, { alive: false, hp: 0, ready: false, queued: false, status: {}, buffs: {}, debuffs: {}, telegraph: null });
  b.queue = b.queue.filter((q) => q.id !== p.id);
  if (ev) {
    (ev.results = ev.results || []).push({ id: p.id, pop: true });
    ev.upd.push(p);
  }
}

// とじこめられた 人の 番（battle.js の doIncapacitated）
export function prisonTurn(b, c, ev) {
  const s = c.status.prison;
  ev.name = '水のろう';
  ev.fx = { type: 'prisonTurn', actor: c.id };
  s.turns--;
  if (s.turns > 0) {
    ev.lines.push(`${c.name}は、水のろうの中で、もがいている…！`);
    return;
  }
  delete c.status.prison;
  const p = b.get(s.by);
  if (p?.alive) vanishPrison(b, p, ev);
  ev.lines.push(`水のろうがはじけて、${c.name}は外に出られた！`);
  ev.atbAfter = 60;
  ev.upd.push(c);
}

// たおれた（battle.js の kill の はじめ）: 水のろうは こわれて 中の 人が 出る（ことばを かえす）。
// とじこめられた まま たおれた 人の ろうは 消える（null … ふつうの きまりで つづける）
export function templeKill(b, t, ev) {
  if (t.side === 'enemy' && t.species === PRISON) {
    const who = b.get(t.holds);
    vanishPrison(b, t, ev);
    const out = ['水のろうが、こわれた！'];
    if (who?.status?.prison) {
      delete who.status.prison;
      out.push(`${who.name}は、水のろうから助け出された！`);
      if (ev) ev.upd.push(who);
    }
    return out;
  }
  if (t.side === 'ally' && t.status?.prison) {
    const p = b.get(t.status.prison.by);
    if (p?.alive) vanishPrison(b, p, ev);
  }
  return null;
}

// ───────────── オートの 仲間・シミュレーター ─────────────
// 味方の オート（ai.js の decideAlly の はじめ）。知っている 人は 大波の 前に 身を 守り、水の衣に きずな技（雷）
export function templePlan(b, c, foes) {
  if (c.side !== 'ally' || !b.knowsTemple) return null;
  const mine = 100 / atbRate(c);
  // 大波が 自分の つぎの 番より 先に 来る
  const wave = b.aliveEnemies().find((e) => e.telegraph === WAVE);
  if (wave && (100 - wave.atb) / atbRate(wave) <= mine) return { type: 'defend' };
  if (b.bond >= 100 && !b.humans().some((h) => h.alive)) {
    const v = foes.find((f) => f.veil && !f.clone);
    if (v) return { type: 'bond', target: v.id };
  }
  return null;
}

// きずな技を 使って よいか（知っている 人は、水の衣を まとう 敵が いる 時は 衣の 時まで とっておく）
export function bondOk(b) {
  if (!b.knowsTemple) return true;
  const veiled = b.aliveEnemies().filter((e) => MONSTERS[e.species]?.veil && !e.clone);
  return !veiled.length || veiled.some((e) => e.veil);
}

// 大波の 前ぶれに 気づかない 人（b.templeNaive）は、ふつうの「大技に そなえる」も しない
export function waveIgnored(b, f) {
  return !!b.templeNaive && !!f.waveStage;
}

// 呪文の あたる 敵（ai.js の chooseAttack の みつもり）
function spellTargets(b, c, a, target) {
  const foes = b.sideOf(c, false).filter((x) => x.alive);
  if (a.target === 'enemies') return foes;
  const t = b.get(target);
  if (!t) return [];
  if (a.target === 'group') return foes.filter((x) => x.species === t.species);
  return [t];
}

// こうげきの えらびかた（ai.js の chooseAttack。opts の final を かえる）:
// 光っている 敵に 呪文は 使わない（知らない 人を のぞく）。知っている 人は 鏡写しを さけ、水のろうを 先に こわす
export function templeAdjust(b, c, opts) {
  if (c.side !== 'ally' || b.templeNaive) return;
  for (const o of opts) {
    const cmd = o.cmd;
    const t = b.get(cmd.target);
    if (b.knowsTemple && t?.species === PRISON && cmd.type !== 'ability') o.final *= 4;
    if (cmd.type !== 'ability') continue;
    const a = ABILITIES[cmd.id];
    if (b.knowsTemple && t?.species === PRISON && a?.target === 'enemy') o.final *= 4;
    if (!isSpell(a) || !foeKinds.has(a.target)) continue;
    const ts = spellTargets(b, c, a, cmd.target);
    // 光っている 敵: 呪文しか ない ときは 身を 守って 光が 消えるのを まつ（反撃の構えと おなじ。ai.js の risky）
    if (ts.some((x) => x.reflect)) {
      o.final *= 0.05;
      o.risky = true;
    }
    else if (b.knowsTemple && ts.some((x) => MONSTERS[x.species]?.mirrorCopy && !x.clone && x.lastSpell === cmd.id)) o.final *= 0.05;
  }
}

// ───────────── がめんへ ─────────────
// pub（battle.js）に まぜる
// （がめんは 前の じょうほうに 上がきするので、敵は 消えた ときも 0・null を おくる）
export function templePub(c) {
  if (c.side !== 'enemy') return {};
  const out = { reflect: c.reflect?.kind || null, wave: c.waveStage || 0, veilCharge: !!(c.veilShow || c.veilCharge) };
  if (c.veil !== undefined) out.veil = c.veil ? 1 : 0;
  if (c.mirrorOf) out.mirror = true;
  if (c.inside) out.inside = c.inside;
  return out;
}

// snapshot（battle.js）に まぜる: 水の守りの歌の のこり
export function templeSnap(b) {
  return b.song ? { song: b.song.left } : null;
}
