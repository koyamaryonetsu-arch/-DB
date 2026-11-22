// 第3部 第2章 第2幕「青と白」の 戦いの しかけ（battle-c9a.js・battle-c9b.js・battle-ch4.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c10b.md の 14-3
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ）: c10_note_so … 星のうたが 5回 → 4回で たまる（b.c10rew.songMax）／
//   c10_note_la … 戦いの はじめから てらすが たまって いる（b.c10rew.teruFull）。第1幕の ごほうび（battle-c10a.js）と 合わせて きく
// ・青の 中ボス「サー・ゲッコー」（monsters-c10b.js の c10b.kind 'gecko'）… 水を たもつ
//   広間の 水の めもり（boss.c10x.water。0〜water.max。はじめ water.start）。画面の 上に 出る
//   ゲッコーは 動く たびに「かわき」: めもりが 1 へる（dry.every 回の うち dry.skip 回めは へらない ＝ 3回に 2回）
//   めもり 0 の 間 …「砂の体」: 受ける ダメージ sand ばい（1わり）。番ごとに「砂あらし」（全体。m10x_storm）
//   めもり 2 いじょう …「ぬれた」: 受ける ダメージ wet ばい（1.3）。雷は さらに bolt ばい
//   「水の音を鳴らす」（m10_mizuoto。だれでも。その 人の 番を 使う）: めもり ＋water.ring（さい大 water.max）。水・氷の 技を 当てても ＋water.elem（1回の 行動に 1つ）
//   めもり water.max で「大かんそう」の 前ぶれ（ふつうに 動きながら。b.tell 'dry'）→ 次の 番に めもり 0 ＋ 全体に 大きな ダメージ（m10x_dry。身を 守ると guardCut）
//     前ぶれの 間に 雷か 氷を 当てると 止まる（めもりは 2 に・ゲッコーは 1回 しびれる m10x_stop）＝ 2 を たもつ
//   勝つと ゲッコーは びしょぬれで しょんぼり（たおれない。HP 1 … b.killed に 入れて 経験値・落とし物は ふつう）
//   自動の 仲間（酒場の 人・家族の 仲間）は、人が えらんで いる 時だけ、めもり 1 いかの 番の 3回に 1回 鳴らす
// ・白の 中ボス「かいとう シロフクロウ」（c10b.kind 'owl'。まぼろし c10b_owl_fake）… 本物を 見きわめる
//   はじめ 3人（左・中・右）。本物は 1人（b.c10b.real）。まぼろしは ゲージが たまらない（tmul 0 … 動かない）
//   本物が 動くと、名前（「左の シロフクロウ」）が ログと バナーに 出る ＝ よく 見て いれば 本物が わかる
//   本物を 攻撃 → ふつうに ダメージ。まぼろしを ねらって 攻撃 → すりぬけて、その 人に「からかいの羽」（小さな ダメージ ＋ 次の 番が おくれる）
//     （battle-ch4.js の mirageHit の はじめで b.c10oHit を よぶ）。全体攻撃は みんなに 当たるが、本物が 受けるのは aoe ばい（半分）
//   shuffle 回 動く ごとに「シャッフル」（ふつうに 動きながら 前ぶれ → 次の 番 m10o_shuffle）: 本物が どれかに 入れかわる（見えない）
//   スピカの「てらす」: 明るい 間（てらすの lit … 3回の 番）、本物が 光る（シャッフルしても 光った まま）
//   HPが 半分を 切ると、まぼろしが 1人 ふえて 4人に。シャッフルは 毎回（halfShuffle）
//   「ぬすむ」（steal.every 回 動く ごとに ふつうに 動きながら 前ぶれ・ねらう 人 → 次の 番 m10o_steal）: その 人の よい 効果（バフ）を ぜんぶ 自分に。身を 守ると ふせげる
//   勝つと 3人は 1人に もどり、ぼうしを 取って おじぎ（たおれない）
//   自動の 仲間（酒場の 人・家族の 仲間）は、人が えらんで いる 時だけ、3回に 1回 本物を ねらう（魔物の 仲間は 毎回 … AUTO_EVERY_MON。のこりは でたらめ）。完全オートは みんな でたらめ（まぼろしを たたき続ける）
// ・人数で 合わせる（few・solo・monK）は 第1幕と おなじ 数え方（battle-c10a.js の peopleOf10。魔物の 仲間は 半人ぶん）
import { MONSTERS } from './data/monsters.js?v=8f07681fe7a2';
import { ABILITIES } from './data/abilities.js?v=8f07681fe7a2';
import { DUAL_TECHS } from './data/dual.js?v=8f07681fe7a2';
import { C10B_GECKO, C10B_OWL, C10B_OWL_FAKE, OWL_NAME } from './data/monsters-c10b.js?v=8f07681fe7a2';
import { MIZUOTO } from './data/abilities-c10b.js?v=8f07681fe7a2';
import { C10B_B as C10B } from './maps/c10b-flags.js?v=8f07681fe7a2';
import { TERU } from './data/abilities-c9b.js?v=8f07681fe7a2';
import { canUse } from './ai.js?v=8f07681fe7a2';
import { peopleOf10, someoneChooses } from './battle-c10a.js?v=8f07681fe7a2';

export { MIZUOTO };
export const STORM = 'm10x_storm';
export const DRY = 'm10x_dry';
export const STOP = 'm10x_stop';
export const SHUFFLE = 'm10o_shuffle';
export const STEAL = 'm10o_steal';
// スピカの ごほうび
export const REWARD_SONG = 4;
export const AUTO_EVERY = 3;
export const AUTO_EVERY_MON = 1;
// 場所の 名前（左から）
export const OWL_POS = { 3: ['左', 'まん中', '右'], 4: ['左はし', '左から2', '右から2', '右はし'] };

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const post = (ev) => (ev.postLines = ev.postLines || []);
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};
const few = (arr, b, d) => (Array.isArray(arr) ? arr[peopleOf10(b) - 1] ?? d : d);

// 中ボスの しかけの 数（人数で 合わせた もの）
export function c10bConf(species, b = null) {
  const c = MONSTERS[species]?.c10b || {};
  const f = c.few || {};
  const alone = b && b.allies.length === 1 ? c.solo || {} : {};
  const pick = (k, d) => (alone[k] ?? (b ? few(f[k], b, d) : d));
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  return {
    kind: c.kind,
    water: { start: 2, max: 3, ring: 2, elem: 1, ...(c.water || {}) },
    dry: { every: 3, skip: 3, ...(c.dry || {}) },
    sand: pick('sand', c.sand ?? 0.1),
    storm: { mult: 0.35, ...(c.storm || {}), mult: (c.storm?.mult ?? 0.35) * pick('stormK', 1) },
    wet: c.wet ?? 1.3, bolt: c.bolt ?? 1.3,
    big: { mult: 2.3, guardCut: 0.35, ...(c.big || {}), mult: (c.big?.mult ?? 2.3) * pick('bigK', 1) },
    n: c.n ?? 3, half: c.half ?? 4, shuffle: pick('shuffle', c.shuffle ?? 2), halfShuffle: pick('halfShuffle', c.halfShuffle ?? 1), aoe: pick('aoe', c.aoe ?? 0.5),
    tease: { dmg: 0.06, delay: 40, ...(c.tease || {}) }, steal: { every: 5, ...(c.steal || {}), every: pick('stealEvery', c.steal?.every ?? 5) },
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
  };
}
export const c10bState = (b) => b?.c10b || null;
export const c10bBoss = (b) => (b?.c10b ? b.get(b.c10b.id) : null);
export const geckoOf = (b) => (b?.c10b?.kind === 'gecko' ? b.get(b.c10b.id) : null);
export const owlReal = (b) => (b?.c10b?.kind === 'owl' ? b.get(b.c10b.real) : null);
export const owlsOf = (b) => (b?.c10b?.kind === 'owl' ? b.c10b.ids.map((id) => b.get(id)).filter(Boolean) : []);
export const owlVisible = (b) => owlsOf(b).filter((e) => e.alive);
const teruOf = (b) => b.c9sp?.teru || null;
export const litNow10b = (b) => (teruOf(b)?.lit || 0) > 0;
const teruReady = (b) => { const t = teruOf(b); return !!t && t.charge >= t.max; };
export const waterOf = (b) => geckoOf(b)?.c10x?.water ?? null;

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC10a の あと）─────────────
// かえす 値: スピカを 出すか（中ボスの 戦いは かならず。星のうたも）
export function setupC10b(b, lines) {
  // スピカの ごほうび（第1幕の b.c10rew に 足す）
  const rew = {};
  if (flag(b, C10B.noteSo)) rew.songMax = REWARD_SONG;
  if (flag(b, C10B.noteLa)) rew.teruFull = true;
  if (rew.songMax || rew.teruFull) b.c10rew = { ...(b.c10rew || {}), ...rew };
  const g = b.enemies.find((e) => e.species === C10B_GECKO);
  const owls = b.enemies.filter((e) => e.species === C10B_OWL || e.species === C10B_OWL_FAKE);
  if (!g && !owls.length) return false;
  b.c9songOn = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（battle.js の tick。第1幕の 中ボスと おなじ）
  b.tellAll = true;
  if (g) setupGecko(b, g, lines);
  else setupOwl(b, owls, lines);
  b.tell = c10bTell(b);
  return true;
}
// 人数で 合わせる: HP・はやさ・与える ダメージ（物理も 呪文も。battle.js の dmgRate … 呪文の 技は 魔力に よらない ので 攻撃力では へらない）
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}
function setupGecko(b, m, lines) {
  const cf = c10bConf(C10B_GECKO, b);
  scale(m, cf);
  Object.defineProperty(m, '_b10b', { value: b, enumerable: false, configurable: true, writable: true });
  m.c10x = { water: cf.water.start, acts: 0, dryN: 0, bigReady: false, stun: false, down: false };
  b.c10b = { kind: 'gecko', id: m.id, won: false, rings: 0, elems: 0, ticks: 0, sandTurns: 0, storms: 0, bigs: 0, bigGuards: 0, stops: 0 };
  for (const a of b.allies) if (!a.abilities.includes(MIZUOTO)) a.abilities = [MIZUOTO, ...a.abilities];
  lines.push(
    `${m.name}「おや、お客さまかな。ここの青い光の玉は、わが一族が、いただいた。」`,
    `${m.name}「水など、いらぬ。かわいた砂こそ、うつくしい。」`,
    '（あいつの体は、かわいた砂…！「水の音を鳴らす」で、広間に水をよぼう！）',
  );
}
function setupOwl(b, owls, lines) {
  const cf = c10bConf(C10B_OWL, b);
  for (const e of owls) {
    scale(e, cf);
    Object.defineProperty(e, '_b10b', { value: b, enumerable: false, configurable: true, writable: true });
  }
  // はじめは n 人だけ 見える（のこりは HP 半分で 出る）
  owls.forEach((e, i) => {
    if (i >= cf.n) Object.assign(e, { alive: false, hp: 0, atb: 0 });
  });
  const vis = owls.slice(0, cf.n);
  const real = vis[b.rng.int(0, vis.length - 1)];
  b.c10b = {
    kind: 'owl', id: real.id, real: real.id, ids: owls.map((e) => e.id), n: vis.length, half: false, won: false, acts: 0,
    shuffleLeft: cf.shuffle, shuffleReady: false, stealLeft: cf.steal.every, stealReady: false, stealAim: null, seen: null,
    teases: 0, fakeHits: 0, realHits: 0, shuffles: 0, steals: 0, stealBlocked: 0, moves: 0,
  };
  for (const e of owls) setFake(e, e !== real);
  for (const e of owls) e.atb = 0;
  rename(b);
  b.c10oHit = (c, t, ev) => owlFakeHit(b, c, t, ev);
  lines.push(
    `${OWL_NAME}「ごきげんよう。月の夜に、ようこそ。」`,
    `${OWL_NAME}「白い光の玉は、わたしがいただきます。…さて、本物は、どれでしょう？」`,
    '（3人のうち、本物は1人だけ…！動いたのが本物だ。よく見よう！）',
  );
}
function setFake(e, fake) {
  e.c10oFake = !!fake;
  if (fake) e.tmul = 0;
  else delete e.tmul;
}
// 場所の 名前（左から。見えて いる 人数で）
function rename(b) {
  const vis = owlVisible(b);
  const names = OWL_POS[vis.length] || OWL_POS[3];
  vis.forEach((e, i) => { e.name = `${names[i] || ''}の${MONSTERS[C10B_OWL].short}`; e.c10oPos = i; });
}

// ───────────── スピカ（battle-c9b.js の addTeru・battle-c9d.js の addSong から）─────────────
export const c10SongMax = (b, d) => b?.c10rew?.songMax || d;
export const c10TeruFull = (b) => !!b?.c10rew?.teruFull;

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// 'dry' … 大かんそうの 前ぶれ・'steal' … ぬすむの 前ぶれ・'gecko'・'owl' … いつも 人が えらぶのを 待つ・null
export function c10bTell(b) {
  const st = b?.c10b;
  if (!st || st.won) return null;
  if (st.kind === 'gecko') {
    const m = geckoOf(b);
    if (!m?.alive) return null;
    return m.c10x.bigReady ? 'dry' : 'gecko';
  }
  return st.stealReady ? 'steal' : 'owl';
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter の はじめ。味方・敵 どちらも）─────────────
export function c10bAfter(b, c, ev) {
  const st = b.c10b;
  if (!st || st.won || !c || b.pendingEnd || b.over) return;
  if (st.kind === 'gecko') {
    const m = geckoOf(b);
    if (c !== m || !m?.c10x || m.c10x.down) return;
    // かわき（大かんそうの 前ぶれと 大かんそうの 番は のぞく）
    if (ev.c10xDryUp || ev.c10xDry) return;
    const cf = c10bConf(C10B_GECKO, b);
    const k = m.c10x;
    k.dryN++;
    if (k.dryN % cf.dry.skip === 0 || k.water <= 0) return;
    k.water--;
    st.ticks++;
    ev.upd.push(m);
    ev.c10xTick = { id: m.id, water: k.water };
    if (k.water <= 0) {
      post(ev).push(`${m.name}のまわりの水が、すっかりかわいてしまった！`, `${m.name}の体が、かわいた砂になった…（こうげきが、ほとんど通らない！）`);
      ev.c10xSand = { id: m.id };
      ev.warn = true;
    } else post(ev).push(`${m.name}が、まわりの水を、すいこんだ…（水が、へった）`);
    return;
  }
  // シロフクロウ: まぼろしの HPは 本物と おなじ（AIの ねらいも かたよらない）
  const real = owlReal(b);
  if (real) for (const e of owlVisible(b)) if (e !== real) e.hp = real.hp;
  if (c.side === 'enemy') {
    // シャッフルの 番（本物は もう 入れかわって いる）: どれか わからなく なる（てらして いれば わかる）
    if (ev.c10oShuffle) {
      st.seen = litNow10b(b) ? st.real : null;
      return;
    }
    if (c.id !== st.real) return;
    st.moves++;
    // 本物が 動いた: 場所が わかる
    {
      st.seen = st.real;
      ev.c10oMoved = { id: c.id, pos: c.c10oPos, n: owlVisible(b).length, name: c.name };
    }
    return;
  }
  if (ev.c9bTeru) {
    const r = owlReal(b);
    if (r) {
      st.seen = r.id;
      post(ev).push(`スピカの光で、${r.name}が、きらきらとかがやいた！（それが本物だ！）`);
      ev.c10oLit = { id: r.id };
      ev.upd.push(...owlsOf(b));
    }
  }
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c10bTurnStart(b, c, ev, stuck) {
  const st = b.c10b;
  if (!st || c.side === 'ally' || st.won) return;
  if (st.kind === 'gecko') {
    if (c.id !== st.id || c.telegraph) return;
    return geckoTurn(b, c, ev, stuck);
  }
  if (c.id !== st.real || c.telegraph) return;
  owlTurn(b, c, ev, stuck);
}
function geckoTurn(b, c, ev, stuck) {
  const k = c.c10x;
  const cf = c10bConf(C10B_GECKO, b);
  if (k.down) return;
  k.acts++;
  ev.upd.push(c);
  if (stuck) return;
  if (k.stun) {
    k.stun = false;
    c.telegraph = STOP;
    return;
  }
  if (k.bigReady) {
    c.telegraph = DRY;
    return;
  }
  // 水が いっぱい: ふつうに 動きながら 大かんそうの 前ぶれ（次の 番に 大かんそう）
  if (k.water >= cf.water.max) {
    dryUp(b, c, ev);
    return;
  }
  if (k.water <= 0) {
    b.c10b.sandTurns++;
    c.telegraph = STORM;
  }
}
function owlTurn(b, c, ev, stuck) {
  const st = b.c10b;
  const cf = c10bConf(C10B_OWL, b);
  st.acts++;
  ev.upd.push(c);
  // HPが 半分を 切った: まぼろしが 1人 ふえる
  if (!st.half && c.hp <= c.maxHp * 0.5) {
    st.half = true;
    const extra = owlsOf(b).find((e) => !e.alive);
    if (extra) {
      Object.assign(extra, { alive: true, hp: c.hp, maxHp: c.maxHp, atb: 0, ready: false, queued: false, status: {}, buffs: {}, debuffs: {}, telegraph: null });
      setFake(extra, true);
      st.n = owlVisible(b).length;
      rename(b);
      ev.upd.push(...owlsOf(b));
    }
    st.shuffleLeft = Math.min(st.shuffleLeft, cf.halfShuffle);
    ev.lines.push(`${OWL_NAME}「ふふ。では、ここからは、もうひとり。」`, '白い羽の中から、シロフクロウが、もう1人あらわれた！（4人になった…！）');
    ev.c10oHalf = { n: st.n };
    ev.warn = true;
  }
  if (stuck) return;
  if (st.shuffleReady) {
    c.telegraph = SHUFFLE;
    return;
  }
  if (st.stealReady) {
    c.telegraph = STEAL;
    return;
  }
  // ふつうに 動く。前ぶれ（ぬすむ・シャッフル）は ふつうに 動きながら 出す（次の 番に する）
  st.shuffleLeft--;
  st.stealLeft--;
  if (st.stealLeft <= 0) stealUp(b, c, ev);
  else if (st.shuffleLeft <= 0) shuffleUp(b, c, ev);
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c10bEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c10xRing': ring(b, c, ev); return true;
    case 'c10xStorm': storm(b, c, ev); return true;
    case 'c10xDry': dry(b, c, ev); return true;
    case 'c10xStop': {
      ev.lines.push(`${c.name}は、しびれて動けない！（今のうちだ！）`);
      ev.c10xStopTurn = { id: c.id };
      ev.upd.push(c);
      return true;
    }
    case 'c10oShuffle': shuffle(b, c, ev); return true;
    case 'c10oSteal': steal(b, c, ev); return true;
    default: return false;
  }
}
// 水の音を鳴らす（だれでも。その 人の 番を 使う）
function ring(b, c, ev) {
  const m = geckoOf(b);
  if (!m?.alive || !m.c10x || b.c10b.won) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  const cf = c10bConf(C10B_GECKO, b);
  const k = m.c10x;
  const before = k.water;
  k.water = Math.min(cf.water.max, k.water + cf.water.ring);
  b.c10b.rings++;
  ev.fx = { type: 'ability', anim: 'c10b_ring', actor: c.id, targets: [m.id], side: 'ally' };
  if (k.water === before) ev.lines.push('広間は、もう水でいっぱいだ…。');
  else ev.lines.push('チリーン…と、すんだ音がひびいた。', `広間のゆかから、水がわき出てきた！（水 ${k.water}/${cf.water.max}）`);
  if (k.water >= 2 && before < 2) ev.lines.push(`${m.name}は、びしょぬれになった！（こうげきが、よく通る！）`);
  if (k.water >= cf.water.max && before < cf.water.max) ev.lines.push(`${m.name}「…水が、多すぎる。」（気をつけて！）`);
  ev.c10xRing = { by: c.id, water: k.water, before };
  ev.upd.push(m);
}
function storm(b, c, ev) {
  const cf = c10bConf(C10B_GECKO, b);
  b.c10b.storms++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c10x_storm', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  for (const t of targets) b.physHit(c, t, { mult: cf.storm.mult, acc: 9 }, ev, 'phys');
  ev.lines.push('（水がない間は、砂あらしがつづく…！「水の音を鳴らす」で、水をよぼう！）');
  ev.c10xStorm = { id: c.id };
  ev.upd.push(c);
}
function dryUp(b, c, ev) {
  const k = c.c10x;
  if (!k) return;
  k.bigReady = true;
  ev.lines.push(`${c.name}「水が多すぎる。ぜんぶ、すい上げてしまおう。」ステッキの砂時計が、さかさになった…！`, '（もうすぐ、大かんそうが来る…！雷か氷を当てれば止まる！「防御」でもそなえられる！）');
  ev.c10xDryUp = { id: c.id };
  ev.warn = true;
  ev.upd.push(c);
}
function dry(b, c, ev) {
  const k = c.c10x;
  if (!k) return;
  const cf = c10bConf(C10B_GECKO, b);
  k.bigReady = false;
  k.water = 0;
  b.c10b.bigs++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c10x_dry', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy' };
  let guarded = 0;
  for (const t of targets) {
    if (t.defending) guarded++;
    b.physHit(c, t, { mult: cf.big.mult * (t.defending ? cf.big.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  b.c10b.bigGuards += guarded;
  if (guarded) ev.lines.push(guarded === targets.length ? 'みんな、身を守って、こらえた！' : '身を守った人は、こらえた！');
  ev.lines.push(`広間の水が、ぜんぶなくなった…！${c.name}の体が、かわいた砂にもどった！`);
  ev.c10xDry = { id: c.id, guarded };
  ev.warn = true;
  ev.upd.push(c);
}
// 大かんそうが 止まった（前ぶれの 間に 雷か 氷が 当たった）
function stopBig(b, m, ev) {
  const k = m.c10x;
  k.bigReady = false;
  k.water = 2;
  k.stun = !!c10bConf(C10B_GECKO, b).stun;
  if (m.telegraph === DRY) m.telegraph = null;
  b.c10b.stops++;
  if (ev) {
    post(ev).push(`${m.name}の砂時計が、ぴしっと止まった！大かんそうを、止めた！`, '（広間の水は、ちょうど2つにもどった）');
    ev.c10xStop = { id: m.id };
    ev.upd?.push(m);
  }
}

function shuffleUp(b, c, ev) {
  const st = b.c10b;
  st.shuffleReady = true;
  ev.lines.push(`${c.name}「さあ、よく見ていてくださいね。」羽のマントが、大きく広がった…！`, '（次に、シロフクロウたちが入れかわる…！今のうちに、本物をよく見ておこう！）');
  ev.c10oShuffleUp = { id: c.id, pos: c.c10oPos };
  ev.warn = true;
  ev.upd.push(c);
}
function shuffle(b, c, ev) {
  const st = b.c10b;
  const cf = c10bConf(C10B_OWL, b);
  st.shuffleReady = false;
  st.shuffleLeft = st.half ? cf.halfShuffle : cf.shuffle;
  st.shuffles++;
  const vis = owlVisible(b);
  const to = vis[b.rng.int(0, vis.length - 1)];
  moveReal(b, c, to);
  ev.fx = { type: 'ability', anim: 'c10o_shuffle', actor: c.id, targets: vis.map((e) => e.id), side: 'enemy' };
  ev.lines.push(`${vis.length}人のシロフクロウが、白い羽の中で、くるくると入れかわった！`);
  if (litNow10b(b)) ev.lines.push(`スピカの光で、${to.name}が、まだかがやいている！`);
  else ev.lines.push('（どれが本物か、わからなくなった…！次に動くのを、待とう！）');
  ev.c10oShuffle = { n: vis.length };
  ev.upd.push(...owlsOf(b));
}
// 本物を 入れかえる（動く 力・よい 効果・HPを うつす）
function moveReal(b, from, to) {
  const st = b.c10b;
  if (to !== from) {
    to.buffs = from.buffs || {};
    to.debuffs = from.debuffs || {};
    to.status = from.status || {};
    from.buffs = {};
    from.debuffs = {};
    from.status = {};
    to.telegraph = null;
    from.telegraph = null;
    setFake(from, true);
    setFake(to, false);
  }
  if (to !== from) {
    to.hp = from.hp;
    to.maxHp = from.maxHp;
  }
  to.atb = 0;
  from.atb = 0;
  st.real = to.id;
  st.id = to.id;
}
function stealUp(b, c, ev) {
  const st = b.c10b;
  const pool = b.aliveAllies();
  if (!pool.length) return;
  const nb = (x) => Object.values(x.buffs || {}).filter(Boolean).length;
  const most = Math.max(...pool.map(nb));
  const cand = most > 0 ? pool.filter((x) => nb(x) === most) : pool;
  const aim = cand[b.rng.int(0, cand.length - 1)];
  st.stealReady = true;
  st.stealAim = aim.id;
  ev.lines.push(`${c.name}「次は、${aim.name}の力を、いただきます。」`, `（ねらいは、${aim.name}…！「防御」で、ぬすまれないようにしよう！）`);
  ev.c10oStealUp = { id: c.id, aim: aim.id };
  ev.warn = true;
  ev.upd.push(c);
}
function steal(b, c, ev) {
  const st = b.c10b;
  const cf = c10bConf(C10B_OWL, b);
  st.stealReady = false;
  st.stealLeft = cf.steal.every;
  const t = b.get(st.stealAim);
  st.stealAim = null;
  st.steals++;
  ev.fx = { type: 'ability', anim: 'c10o_steal', actor: c.id, targets: t ? [t.id] : [], side: 'enemy' };
  if (!t?.alive) {
    ev.lines.push(`${c.name}「…おや、いませんね。」`);
    return;
  }
  if (t.defending) {
    st.stealBlocked++;
    ev.lines.push(`${t.name}は、しっかり身を守った！${c.name}は、何もぬすめなかった！`);
    ev.c10oSteal = { id: c.id, aim: t.id, blocked: true, got: 0 };
    return;
  }
  const keys = Object.entries(t.buffs || {}).filter(([, v]) => v).map(([k]) => k);
  for (const k of keys) {
    c.buffs = c.buffs || {};
    c.buffs[k] = { ...t.buffs[k] };
    delete t.buffs[k];
  }
  if (t.regen) {
    c.regen = t.regen;
    t.regen = null;
    keys.push('regen');
  }
  if (keys.length) ev.lines.push(`${c.name}は、${t.name}のよい効果を、ぜんぶぬすんだ！`, `${c.name}「ふふ。いただきました。」`);
  else ev.lines.push(`${c.name}は、${t.name}から、ぬすもうとした…が、何もなかった。`);
  ev.c10oSteal = { id: c.id, aim: t.id, blocked: false, got: keys.length };
  ev.upd.push(t, c);
}

// ───────────── まぼろしに 当たった（battle-ch4.js の mirageHit の はじめ。b.c10oHit）─────────────
// 当たりは そこで おしまい（true）。えらんで ねらった 攻撃は「からかいの羽」（1回の 行動に 1つ）・全体攻撃は すりぬける だけ
export function owlFakeHit(b, c, t, ev) {
  const st = b.c10b;
  if (!st || st.kind !== 'owl' || !t?.c10oFake || !c || c.side === t.side) return false;
  if (st.won) return true;
  const who = b.get(c.id) || c;
  // 全体攻撃（ねらって いない）: まぼろしにも 当たった ように 見せる（ダメージの 数は 出るが、本物の HPは へらない … c10bDamage）
  if (!aimedAt(b, who, t)) return false;
  st.fakeHits++;
  if (ev.c10oTease) return true;
  const cf = c10bConf(C10B_OWL, b);
  const d = who.side === 'ally' && who.alive ? Math.max(0, Math.min(who.hp - 1, Math.round(who.maxHp * cf.tease.dmg))) : 0;
  if (d > 0) {
    who.hp -= d;
    (ev.results = ev.results || []).push({ id: who.id, dmg: d });
  }
  ev.atbAfter = -cf.tease.delay;
  st.teases++;
  ev.lines.push(`すりぬけた！${t.name}は、まぼろしだった！`);
  post(ev).push(`${OWL_NAME}「ふふっ、はずれです。」`, `からかいの羽が、${who.name}にまとわりつく！（${d}のダメージ・次の番が、おそくなる）`);
  ev.c10oTease = { id: who.id, fake: t.id };
  ev.warn = true;
  ev.upd.push(who, t);
  return true;
}
// その 行動が この 魔物を えらんで ねらった ものか（全体・グループ・でたらめに 当たる 技は ちがう）
export function aimedAt(b, c, t) {
  const cmd = b.actCmd;
  if (!cmd || cmd.target !== t.id) return false;
  return !wideCmd(c, cmd);
}
function wideCmd(c, cmd) {
  if (cmd.type === 'ability') {
    const a = ABILITIES[cmd.id];
    return !!a && (a.target === 'enemies' || a.target === 'group' || !!prim(a).random);
  }
  if (cmd.type === 'dual') return DUAL_TECHS[cmd.id]?.target === 'enemies';
  if (cmd.type === 'attack') return !!c?.gearReach || c?.weaponCat === 'whip' || c?.weaponCat === 'boomerang';
  return false;
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c10bDamage(b, c, t, dmg, info, ev) {
  const st = b.c10b;
  if (!(dmg > 0) || !st || st.won || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  if (st.kind === 'gecko') {
    if (t.id !== st.id || !t.c10x) return dmg;
    const cf = c10bConf(C10B_GECKO, b);
    const k = t.c10x;
    const el = info?.element;
    let stopped = false;
    // 大かんそうの 前ぶれの 間に 雷か 氷 → 止まる
    if (k.bigReady && (el === 'bolt' || el === 'ice') && once(ev, 'xstop')) {
      stopBig(b, t, ev);
      stopped = true;
    }
    if (k.water <= 0) {
      dmg = Math.max(1, Math.round(dmg * cf.sand));
      if (ev && !ev.c10xSandHit) {
        ev.c10xSandHit = true;
        post(ev).push('（かわいた砂の体で、こうげきが、ほとんど通らない…！）');
      }
    } else if (k.water >= 2) dmg = Math.round(dmg * cf.wet * (el === 'bolt' ? cf.bolt : 1));
    // 水・氷の 技を 当てると 水が ふえる（1回の 行動に 1つ）
    if ((el === 'water' || el === 'ice') && !stopped && !k.bigReady && k.water < cf.water.max && once(ev, 'xel')) {
      k.water = Math.min(cf.water.max, k.water + cf.water.elem);
      st.elems++;
      if (ev) {
        post(ev).push(`${el === 'ice' ? '氷がとけて' : '水しぶきで'}、${t.name}がぬれた！（水 ${k.water}/${cf.water.max}）`);
        ev.c10xWet = { id: t.id, water: k.water };
        ev.upd?.push(t);
      }
    }
    if (dmg >= t.hp) {
      dmg = Math.max(0, t.hp - 1);
      bossDown(b, t, ev);
    }
    return dmg;
  }
  // シロフクロウ（全体攻撃は 本物も まぼろしも aoe ばい。まぼろしの HPは へらない ように 先に 足して おく … どれが 本物か ダメージの 文では わからない）
  if (!st.ids.includes(t.id)) return dmg;
  const cf = c10bConf(C10B_OWL, b);
  if (!aimedAt(b, b.get(c.id) || c, t)) dmg = Math.max(1, Math.round(dmg * cf.aoe));
  if (t.c10oFake) {
    t.hp += dmg;
    return dmg;
  }
  if (t.id !== st.real) return dmg;
  st.realHits++;
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    bossDown(b, t, ev);
  }
  return dmg;
}
const once = (ev, key) => {
  if (!ev) return true;
  ev.c10bOnce = ev.c10bOnce || new Set();
  if (ev.c10bOnce.has(key)) return false;
  ev.c10bOnce.add(key);
  return true;
};
function bossDown(b, c, ev) {
  const st = b.c10b;
  st.won = true;
  c.telegraph = null;
  if (st.kind === 'gecko') {
    c.c10x.down = true;
    c.c10x.bigReady = false;
    b.killed.push(c.species);
    if (ev) {
      post(ev).push(
        `ザッバーン！${c.name}は、頭から水をかぶって、びしょぬれになった！`,
        `${c.name}「…なんと。この私が、びしょぬれとは…。」`,
        `${c.name}は、ぬれたコートを、しょんぼりとしぼった。`,
      );
    }
  } else {
    // まぼろしは 羽に なって 消え、本物が 1人 のこる
    b.killed.push(C10B_OWL);
    for (const e of owlsOf(b)) {
      if (e === c) continue;
      Object.assign(e, { alive: false, hp: 0, ready: false, queued: false, telegraph: null });
      b.queue = b.queue.filter((q) => q.id !== e.id);
    }
    c.name = OWL_NAME;
    st.stealReady = false;
    st.shuffleReady = false;
    if (ev) {
      post(ev).push(
        'まぼろしのシロフクロウが、白い羽になって、ふわりと消えていった…',
        `${OWL_NAME}「…負けました。おみごとです。」`,
        `${OWL_NAME}は、羽かざりのぼうしを取って、ていねいにおじぎをした。`,
      );
      ev.upd.push(...owlsOf(b));
    }
  }
  if (ev) {
    ev.c10bDown = { id: c.id, kind: st.kind };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── たおれた（battle-c9b.js の c9bKill から。t.alive は まだ true）─────────────
// 本物の シロフクロウが ほかの 形で たおれた（ふつうは HP 1 で 止まる）: まぼろしも 消えて 勝ち
export function c10bKill(b, t, ev) {
  const st = b.c10b;
  if (!st || st.won || st.kind !== 'owl' || t?.id !== st.real) return;
  st.won = true;
  if (t.species !== C10B_OWL) b.killed.push(C10B_OWL);
  for (const e of owlsOf(b)) {
    if (e === t) continue;
    Object.assign(e, { alive: false, hp: 0, ready: false, queued: false, telegraph: null });
    ev?.upd?.push(e);
  }
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// 中ボスの 戦いで なければ undefined。ふつうの オートは null
export function c10bPlan(b, c, decide, bestHit) {
  const st = b.c10b;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  return st.kind === 'gecko' ? geckoPlan(b, c, mode, decide, bestHit) : owlPlan(b, c, mode, decide, bestHit);
}
const queued = (b, id) => b.queue.some((q) => q.cmd?.id === id);
function geckoPlan(b, c, mode, decide, bestHit) {
  const m = geckoOf(b);
  if (!m?.alive) return null;
  const k = m.c10x;
  const canRing = canUse(b, c, MIZUOTO) && !queued(b, MIZUOTO);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 人の 仲間: めもり 1 いかの 番の 3回に 1回 鳴らす（数は 自動の 仲間 みんなで 1つ）。人が えらんで いる 時だけ
    if (c.kind === 'player' || c.kind === 'monster' || k.water > 1 || k.bigReady || !canRing || !someoneChooses(b)) return null;
    b.c10bAuto = (b.c10bAuto || 0) + 1;
    return b.c10bAuto % AUTO_EVERY ? null : { type: 'ability', id: MIZUOTO };
  }
  if (mode === 'blind') {
    if (k.bigReady && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    if (k.water <= 0 && canRing && b.rng.chance(0.15)) return { type: 'ability', id: MIZUOTO };
    return null;
  }
  // 知って いる 人: 大かんそうの 前ぶれ … 雷か 氷を 当てる（なければ 身を 守る）・水が ない … 鳴らす・
  //   水 1 … 水か 氷の 技（なければ ふつう）・ぬれて いる … 雷の 技
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  if (k.bigReady) {
    if (!b.queue.some((q) => q.c10bStop)) {
      const hit = bestElem(b, c, m, ['bolt', 'ice']);
      if (hit) return hit;
    }
    return c.defending ? cmd : { type: 'defend' };
  }
  if (k.water <= 0) return canRing ? { type: 'ability', id: MIZUOTO } : { type: 'defend' };
  if (k.water === 1 && !queued(b, MIZUOTO)) {
    const w = bestElem(b, c, m, ['water', 'ice']);
    if (w) return w;
  }
  if (k.water >= 2) {
    const bolt = bestElem(b, c, m, ['bolt']);
    if (bolt) return bolt;
  }
  void bestHit;
  return cmd;
}
function owlPlan(b, c, mode, decide, bestHit) {
  const st = b.c10b;
  const real = owlReal(b);
  if (!real?.alive) return null;
  const vis = owlVisible(b);
  const rand = () => vis[b.rng.int(0, vis.length - 1)];
  const know = mode === 'know';
  if (!know) {
    const cmd = base(b, c, decide);
    // 自動の 仲間（人が えらんで いる 時）: 3回に 1回 本物を ねらう（魔物の 仲間は AUTO_EVERY_MON 回に 1回 … 今は 毎回。数は それぞれ みんなで 1つ）
    let to = null;
    if (mode !== 'blind' && c.kind !== 'player' && someoneChooses(b)) {
      const mon = c.kind === 'monster';
      const key = mon ? 'c10bAutoMon' : 'c10bAuto';
      b[key] = (b[key] || 0) + 1;
      if (b[key] % (mon ? AUTO_EVERY_MON : AUTO_EVERY) === 0) to = real;
    }
    // 知らない 人: たまに 動いた 本物に 気づく
    if (mode === 'blind' && st.seen === real.id && b.rng.chance(0.15)) to = real;
    if (mode === 'blind' && st.stealReady && st.stealAim === c.id && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    return retarget(b, c, cmd, to || rand());
  }
  // 知って いる 人: ぬすむの ねらいは 身を 守る・本物が わかって いれば 本物を ねらう（全体の 技より 1人の 技）・
  //   わからない 時は てらす（たまって いれば）・全体の 技・回復・守り（次に 動くまで 待つ）
  if (st.stealReady && st.stealAim === c.id && !c.defending) return { type: 'defend' };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.4))) return cmd;
  const known = st.seen === real.id || litNow10b(b);
  if (known) {
    if (cmd && wideCmd(c, cmd) && hurts(cmd)) return bestHit(b, c, real) || { type: 'attack', target: real.id };
    return retarget(b, c, cmd, real);
  }
  if (teruReady(b) && canUse(b, c, TERU) && !queued(b, TERU)) return { type: 'ability', id: TERU };
  if (cmd && (wideCmd(c, cmd) || !targetsFoe(cmd))) return cmd;
  // 全体の 技（本物にも 半分 当たる）
  const wide = bestWide(b, c, real);
  if (wide) return wide;
  return c.defending ? cmd : { type: 'defend' };
}
const hurts = (cmd) => cmd.type === 'attack' || cmd.type === 'dual' || cmd.type === 'mahouken' || ['phys', 'magic', 'multi'].includes(prim(ABILITIES[cmd.id]).type);
const targetsFoe = (cmd) => cmd.type === 'attack' || cmd.type === 'mahouken' || (cmd.type === 'dual' && DUAL_TECHS[cmd.id]?.target !== 'allies') || ['enemy', 'enemies', 'group'].includes(ABILITIES[cmd.id]?.target);
// 1人を ねらう 攻撃なら、ねらいを to に かえる
function retarget(b, c, cmd, to) {
  if (!cmd || !to) return cmd;
  if (cmd.type === 'attack' || cmd.type === 'mahouken') return { ...cmd, target: to.id };
  if (cmd.type === 'ability' && ABILITIES[cmd.id]?.target === 'enemy') return { ...cmd, target: to.id };
  if (cmd.type === 'dual' && DUAL_TECHS[cmd.id]?.target === 'enemy') return { ...cmd, target: to.id };
  return cmd;
}
// その 属性の 技で いちばん 大きい 1回（なければ null）
function bestElem(b, c, t, els) {
  let best = null;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !['enemy', 'enemies', 'group'].includes(a.target) || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    if (!els.includes(e.element)) continue;
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, e.element, true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
    if (dmg > 0 && (!best || dmg > best.dmg)) best = { cmd: { type: 'ability', id, ...(a.target === 'enemy' ? { target: t.id } : {}) }, dmg };
  }
  return best?.cmd || null;
}
// 全体の ダメージの 技で いちばん 大きい もの（なければ null）
function bestWide(b, c, t) {
  let best = null;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || a.target !== 'enemies' || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, e.element, true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg;
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
export function c10bBusy(b) {
  const st = b.c10b;
  if (!st || st.won) return false;
  return !!c10bTell(b);
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から）─────────────
// ゲッコー: c10Kind 'gecko'・water・waterMax・big（大かんそうの 前ぶれ）・stun（しびれた）・c10Down
// シロフクロウ（本物も まぼろしも おなじ 形。どれが 本物かは 出さない）: c10Kind 'owl'・species（いつも c10b_owl）・hp・maxHp（本物の HP）・
//   owlPos・owlN（場所と 人数）・owlLit（てらして いる 間の 本物）・owlSteal（ぬすむの ねらいの 人の id）・owlShuffle（シャッフルの 前ぶれ）・c10Down
export function c10bPub(c, b = c?._b10b) {
  const o = {};
  const st = b?.c10b;
  if (!st) return o;
  if (st.kind === 'gecko' && c.id === st.id && c.c10x) {
    const cf = c10bConf(C10B_GECKO, b);
    o.c10Kind = 'gecko';
    o.water = c.c10x.water;
    o.waterMax = cf.water.max;
    o.big = c.c10x.bigReady ? 1 : 0;
    o.stun = c.c10x.stun || c.telegraph === STOP ? 1 : 0;
    o.c10Down = st.won ? 1 : 0;
    // 曲の もりあがり（F班）: 1 ふつう・2 砂の体・3 大かんそうの 前ぶれ・4 勝った
    o.geckoStage = st.won ? 4 : c.c10x.bigReady ? 3 : c.c10x.water <= 0 ? 2 : 1;
    return o;
  }
  if (st.kind === 'owl' && st.ids.includes(c.id)) {
    o.c10Kind = 'owl';
    o.species = C10B_OWL;
    const r = b.get(st.real);
    o.hp = c.alive ? r?.hp ?? c.hp : 0;
    o.maxHp = r?.maxHp ?? c.maxHp;
    o.owlPos = c.c10oPos ?? 0;
    o.owlN = owlVisible(b).length;
    o.owlLit = !st.won && c.id === st.real && litNow10b(b) ? 1 : 0;
    o.owlSteal = st.stealReady ? st.stealAim : null;
    o.owlShuffle = st.shuffleReady ? 1 : 0;
    o.owlHalf = st.half ? 1 : 0;
    o.c10Down = st.won && c.id === st.real ? 1 : 0;
    o.owlStage = st.won ? 4 : st.half ? 3 : st.shuffleReady ? 2 : 1;
  }
  return o;
}
void C10B_OWL_FAKE;
