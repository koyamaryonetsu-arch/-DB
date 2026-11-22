// 第3部 第3章 第1幕「星の船と、星座の島」の 戦いの しかけ（battle-c9a.js・battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c11a.md の 17-4
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ c11_act1）: 技「ながれ星」が ふえる … ほのかな光 STAR_EVERY 回に 1回、
//   スピカが いちばん HPが 多い 敵に 小さな ながれ星を 落とす（敵の 最大HPの STAR_RATE。STAR_MAX まで。ボスの しかけ〈かたい・まく〉は そのまま きく）。
//   battle-c9a.js の glow から よぶ。前の 6つの ごほうび（battle-c10a〜d.js）と 合わせて きく
// ・中ボス「星座のけもの」（monsters-c11a.js の c11a.kind 'beast'）… 3つの 星（あたま・むね・しっぽ ＝ 3体の 敵）。そろえて たおす
//   1つ たおしても、となりの 星（あたま−むね−しっぽ）が のこって いると、けものが revive 回 動いた あとで HP reviveHp で よみがえる
//   よみがえる 1回 前に「星が、また光りはじめた…」（気づける）。そのとき となりが いなければ よみがえらない
//   あたま … roar.every 回 動く ごとに 前ぶれ（ふつうに 動きながら。ねらう 人が 出る）→ 次の あたまの 番に 大きな かみつき（身を 守ると guardCut）
//   むね … 仲間の 星を 少し 回復（mend）・しっぽ … 全体攻撃
//   人が えらぶ 間は 待つ（前ぶれの 間 … b.tell 'fang'・'revive'）。しくみの ある ボスの しるし（b.mechBoss）
// ・新しい コマンド「時計を投げる」（m11_tokeinage。船長の 戦いで、時計を 持って いる 人に だけ 出る。その 人の 番を 使う）
// ・幕の ボス「いかり船長 イバリー」と「チクタクザメ」（c11a.kind 'pirate'）… 時計の おしつけ合い
//   1. 戦いの はじめ、船長が 目ざまし時計を 味方の 1人に 投げる（はじめの 文が 前ぶれ。名前の 横に 時計の しるしと 数）
//   2. 時計の 数は、だれかが 1回 動くたびに 1 へる（船長も 数える）。画面に 大きく「チク・タク　あと 5」
//   3. 持って いる 人は「時計を投げる」で 船長へ 投げ返せる（番を 使う）。船長は 時計を 受け取ると、つぎに 投げる 相手を きめる（前ぶれ）→ 自分の 番に 投げる
//   4. 数が 0 に なった 時に 持って いる 方を、サメが かむ
//      味方 … 最大HPの bite.ally（「防御」で guardCut）。時計は 船長の 手に もどる（ねじを まき直すまで 数は へらない）
//      船長 … 最大HPの bite.cap ＋ bite.dizzy 回の 番の 間 目を 回す（受ける ダメージ bite.dizzyK）。時計は サメの 中（目を 回し おわる 番に はき出す）
//   5. 早く 投げると 投げ返される。ぎりぎりまで 持つと あぶない（行動ゲージで「自分の 番が もう 1回 来るか」を 読む）
//   6. 船長は ふだん かたい（受ける ダメージ hard ＝ 3わり）。目を 回して いる 間だけ ふつう（より 少し 多く）通る
//   7. 「いかりなげ」: anchor.every 回 動く ごとに 前ぶれ（ふつうに 動きながら。時計を 持つ 人を ねらう ことが 多い）→ 次の 番。
//      当たると ダメージ ＋ 行動ゲージが 0 に。「防御」で ふせげる
//   8. HPが clock.two を 切ると、時計が 2つ（数が ちがう）。ひとりの 時は 1つの まま
//   9. スピカの「星のうた」: 時計の 数を 1回ぶん 止める（歌った 番と、その つぎの 1回は 数が へらない）
//   人数で 合わせる: 数の はじまりは 動く 人の 数（生きて いる 味方 ＋ 船長）＋ plus
//   勝つと 船長は たおれず、サメに 追われて にげる（HP 1 で 止まる。b.killed に 入れて 経験値・落とし物は ふつう）
// ・自動の 仲間（酒場の 人・家族の 仲間・魔物の 仲間）は、人が えらんで いる 時だけ、時計を 持って いて ちょうど よい 時の 3回に 1回 投げる。
//   完全オートは 投げない（かまれ つづけて 勝てない）
// ・戦いは、人が えらぶ 間 ずっと 待つ 形（b.tellAll）。b.mechBoss も 立てる（shared/ai.js の mechBoss）
// ・人数で 合わせる（few・solo・monK）は 第2章 第1幕と おなじ 数え方（battle-c10a.js の peopleOf10。魔物の 仲間は 半人ぶん）
import { MONSTERS } from './data/monsters.js?v=8db07833986d';
import { ABILITIES } from './data/abilities.js?v=8db07833986d';
import { C11A_STARS, C11A_HEAD, C11A_CHEST, C11A_TAIL, C11A_CAPTAIN, SHARK_NAME, CAPTAIN_SHORT } from './data/monsters-c11a.js?v=8db07833986d';
import { TOKEI_NAGE } from './data/abilities-c11a.js?v=8db07833986d';
import { C11A_B as C11A } from './maps/c11a-flags.js?v=8db07833986d';
import { SONG } from './data/abilities-c9d.js?v=8db07833986d';
import { canUse } from './ai.js?v=8db07833986d';
import { atbRate } from './battle.js?v=8db07833986d';
import { peopleOf10, someoneChooses } from './battle-c10a.js?v=8db07833986d';

export { TOKEI_NAGE };
export const FANG = 'm11b_fang';
export const THROW = 'm11p_throw';
export const ANCHOR = 'm11p_anchor';
export const DIZZY = 'm11p_dizzy';
export const AUTO_EVERY = 3;
// スピカの ごほうび「ながれ星」
export const STAR_EVERY = 2;
export const STAR_RATE = 0.025;
export const STAR_MAX = 1600;
// となりの 星
export const NEIGHBORS = { [C11A_HEAD]: [C11A_CHEST], [C11A_CHEST]: [C11A_HEAD, C11A_TAIL], [C11A_TAIL]: [C11A_CHEST] };
export const ROLE_NAME = { head: 'あたま', chest: 'むね', tail: 'しっぽ' };

const post = (ev) => (ev.postLines = ev.postLines || []);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};
const few = (arr, b, d) => (Array.isArray(arr) ? arr[peopleOf10(b) - 1] ?? d : d);
// 第101回 3回め: 仲間なしの 少ない パーティー（味方が みんな 家族の キャラで 2人か 3人。ゲストの スピカは 味方に 入らない）
//   bare: { hp: [2人, 3人], … } … ある キーは few より 先に きく（第1章 battle-c9a.js・第2章 battle-c10a.js と 同じ 考え）
export function bareOf(b) {
  const al = (b?.allies || []).filter((a) => a.kind !== 'guest');
  return al.length >= 2 && al.length <= 3 && al.every((a) => a.kind === 'player') ? al.length : 0;
}
const hide = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: false, configurable: true, writable: true });

// しかけの 数（人数で 合わせた もの）
export function c11aConf(species, b = null) {
  const c = MONSTERS[species]?.c11a || {};
  const f = c.few || {};
  const alone = b && b.allies.length === 1 ? c.solo || {} : {};
  const n = bareOf(b);
  const bare = n && c.bare ? Object.fromEntries(Object.entries(c.bare).map(([k, v]) => [k, Array.isArray(v) ? v[n - 2] : v]).filter(([, v]) => v !== undefined)) : {};
  const pick = (k, d) => (alone[k] ?? bare[k] ?? (b ? few(f[k], b, d) : d));
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  const out = {
    kind: c.kind, bare: n,
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
  };
  if (c.kind === 'beast') {
    Object.assign(out, {
      role: c.role, revive: pick('revive', c.revive ?? 2), reviveBy: c.reviveBy || 'beast', reviveHp: c.reviveHp ?? 0.5, reviveUp: pick('reviveUp', c.reviveUp ?? 0), linkK: pick('linkK', c.linkK ?? 1), linkAuto: c.linkAuto ?? c.linkK ?? 1, mend: c.mend ?? 0.05,
      roar: { every: 3, first: 2, mult: 2.3, guardCut: 0.35, ...(c.roar || {}) },
    });
  }
  if (c.kind === 'pirate') {
    Object.assign(out, {
      plus: pick('plus', c.clock?.plus ?? 2), two: pick('two', c.clock?.two ?? 0.5), twoPlus: c.clock?.twoPlus ?? 2,
      bite: { ally: 0.8, guardCut: 0.5, cap: 0.06, dizzy: 2, dizzyK: 1.25, ...(c.bite || {}), ...(bare.dizzy !== undefined ? { dizzy: bare.dizzy } : {}) },
      hard: pick('hard', c.hard ?? 0.3),
      anchor: { every: 3, first: 2, mult: 1, holder: 0.7, atb: 0, ...(c.anchor || {}) },
      song: c.song ?? 1,
    });
  }
  return out;
}
export const c11aState = (b) => b?.c11a || null;
export const captainOf = (b) => (b?.c11a?.kind === 'pirate' ? b.get(b.c11a.id) : null);
export const starsOf = (b) => (b?.c11a?.kind === 'beast' ? b.c11a.ids.map((id) => b.get(id)).filter(Boolean) : []);
const songOf = (b) => b.c9sp?.song || null;
const songReady = (b) => { const s = songOf(b); return !!s && s.charge >= s.max; };
const queued = (b, id) => b.queue.some((q) => q.cmd?.id === id);

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC10d の あと）─────────────
// かえす 値: スピカを 出すか（けもの・船長の 戦いは かならず。星のうたも）
export function setupC11a(b, lines) {
  // スピカの ごほうび（前の 幕の b.c10rew と おなじ 形で b.c11rew）
  if (flag(b, C11A.act1)) b.c11rew = { ...(b.c11rew || {}), star: true };
  const stars = b.enemies.filter((e) => MONSTERS[e.species]?.c11a?.kind === 'beast');
  const cap = b.enemies.find((e) => e.species === C11A_CAPTAIN);
  if (!stars.length && !cap) return false;
  b.c9songOn = true;
  b.mechBoss = true;
  if (cap) setupPirate(b, cap, lines);
  else setupBeast(b, stars, lines);
  b.tell = c11aTell(b);
  return true;
}
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}

function setupBeast(b, stars, lines) {
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（前の 幕の 中ボスと おなじ。前ぶれの 間だけ 待つ 形だと、人が えらぶ 2秒・5秒の 間に
  //   星が たくさん 動いて、完全オートの 方が 勝ちやすく なった … 人の 少ない 時ほど）
  b.tellAll = true;
  b.c11a = { kind: 'beast', ids: stars.map((e) => e.id), won: false, acts: 0, kills: 0, revives: 0, stayDead: 0, warns: 0, roars: 0, fangs: 0, fangGuards: 0, mends: 0 };
  for (const e of stars) {
    const cf = c11aConf(e.species, b);
    scale(e, cf);
    hide(e, '_b11', b);
    e.c11s = { role: cf.role, dead: false, left: 0, roarLeft: cf.roar.first, roarReady: false, aim: null };
  }
  lines.push(
    '夜空の星座が、光の線でつながって…大きなけもののすがたになって、下りてきた！',
    '（3つの星が、光の線でつながっている…。1つだけたおしても、だいじょうぶかな…？）',
  );
}

function setupPirate(b, cap, lines) {
  const cf = c11aConf(C11A_CAPTAIN, b);
  scale(cap, cf);
  hide(cap, '_b11', b);
  b.c11a = {
    kind: 'pirate', id: cap.id, won: false, clocks: [], freeze: 0, dizzy: 0, two: false, acts: 0,
    anchorLeft: cf.anchor.first, anchorReady: false, anchorAim: null,
    passes: 0, throws: 0, capBites: 0, allyBites: 0, biteGuards: 0, anchors: 0, anchorGuards: 0, songs: 0, autoPasses: 0, early: 0,
  };
  b.tellAll = true;
  for (const a of b.allies) {
    hide(a, '_b11', b);
    if (!a.abilities.includes(TOKEI_NAGE)) a.abilities = [TOKEI_NAGE, ...a.abilities];
  }
  // はじめの 時計（船長が 味方の 1人に 投げる）
  const t = b.get(pickAim(b));
  const k = { no: 0, holder: t.id, n: startCount(b), wound: true, aim: null };
  b.c11a.clocks.push(k);
  lines.push(
    `${cap.name}「門を通る者からは、光をいただく。それが、おれさまの仕事だ！」`,
    'チク、タク、チク、タク…。どこからか、時計の音が近づいてくる…。',
    `${CAPTAIN_SHORT}「ひっ…！こ、こんな時計、いらん！」`,
    `${CAPTAIN_SHORT}は、目ざまし時計を、${t.name}に投げつけた！（チク・タク　あと${k.n}）`,
    `（時計が0になった時に持っていると、${SHARK_NAME}にかまれる…！）`,
  );
}
// 数の はじまり（動く 人の 数 ＋ plus）
export function startCount(b) {
  const cf = c11aConf(C11A_CAPTAIN, b);
  return b.aliveAllies().length + 1 + cf.plus;
}

// ───────────── スピカの ごほうび「ながれ星」（battle-c9a.js の glow から。ほのかな光の あと）─────────────
const SPICA_ACTOR = { id: 'spica', side: 'ally', kind: 'guest', name: 'スピカ', alive: true, status: {}, buffs: {}, debuffs: {} };
let starDamageFn = null;
// battle-c9b.js の c9bDamage（しかけの ダメージの くさり）を わたして もらう（じゅんかんを さける）
export function setStarDamage(f) { starDamageFn = f; }
export function c11GlowStar(b, ev) {
  if (!b?.c11rew?.star || !b.c9sp || b.pendingEnd || b.over) return null;
  const s = b.c9sp;
  s.stars = (s.stars || 0) + 1;
  if (s.stars % STAR_EVERY) return null;
  const foes = b.aliveEnemies().filter((e) => !e.fake && !e.fled && !(e.c10v?.down) && !e.shade);
  const t = foes.slice().sort((x, y) => y.hp - x.hp)[0];
  if (!t) return null;
  let dmg = Math.max(1, Math.round(Math.min(t.maxHp * STAR_RATE, STAR_MAX)));
  if (starDamageFn) dmg = starDamageFn(b, SPICA_ACTOR, t, dmg, { element: 'light', c11Star: true }, ev);
  if (!(dmg > 0) || !t.alive) return null;
  t.hp = Math.max(0, t.hp - dmg);
  const lines = post(ev);
  lines.push(`スピカの「ながれ星」！小さな星が、${t.name}にふりそそいだ！${t.name}に${dmg}のダメージ！`);
  ev.results = ev.results || [];
  ev.results.push({ id: t.id, dmg, element: 'light' });
  ev.upd.push(t);
  ev.c11Star = { to: t.id, dmg };
  s.starHits = (s.starHits || 0) + dmg;
  if (t.hp <= 0) lines.push(...b.kill(t, 'light', ev));
  return ev.c11Star;
}

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// けもの: 'fang' … かみつきの 前ぶれ・'revive' … 星が また 光りはじめた・'beast' … いつも 待つ（b.tellAll は b.tell が ある 間だけ きく） ／ 船長: 'anchor' … いかりなげの 前ぶれ・'pirate' … いつも 待つ
export function c11aTell(b) {
  const st = b?.c11a;
  if (!st || st.won) return null;
  if (st.kind === 'pirate') {
    const cap = captainOf(b);
    if (!cap?.alive) return null;
    return st.anchorReady ? 'anchor' : 'pirate';
  }
  const stars = starsOf(b);
  if (stars.some((e) => e.alive && e.c11s?.roarReady)) return 'fang';
  if (stars.some((e) => !e.alive && e.c11s?.dead && e.c11s.left === 1)) return 'revive';
  return starsOf(b).some((e) => e.alive) ? 'beast' : null;
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter の はじめ。味方・敵 どちらも）─────────────
export function c11aAfter(b, c, ev) {
  const st = b.c11a;
  if (!st || st.won || !c || b.pendingEnd || b.over) return;
  if (st.kind === 'beast') return beastAfter(b, c, ev);
  return pirateAfter(b, c, ev);
}

// ── けもの ──
function beastAfter(b, c, ev) {
  const st = b.c11a;
  const stars = starsOf(b);
  // たおれた 星（この 行動で）
  for (const e of stars) {
    const s = e.c11s;
    if (e.alive || s.dead) continue;
    const cf = c11aConf(e.species, b);
    s.dead = true;
    s.left = cf.revive;
    // たおれた その 行動は 数えない
    s.fresh = true;
    s.roarReady = false;
    s.aim = null;
    st.kills++;
    if (stars.every((x) => !x.alive)) {
      st.won = true;
      continue;
    }
    post(ev).push(`${e.name}の光が、すうっと消えた…。（でも、ほかの星と、光の線でつながったまま…）`);
    ev.c11aOut = { id: e.id };
  }
  if (st.won) return;
  // reviveBy 'beast' … けもの（のこって いる 星）が 動いた 回数・'all' … だれかが 動いた 回数で 数える
  if (c11aConf(C11A_HEAD, b).reviveBy !== 'all' && (c.side !== 'enemy' || !c.c11s)) return;
  // たおれた 星の よみがえりまでの 数
  st.acts++;
  for (const e of stars) {
    const s = e.c11s;
    if (e.alive || !s.dead || !(s.left > 0)) continue;
    if (s.fresh) {
      s.fresh = false;
      continue;
    }
    s.left--;
    const nb = NEIGHBORS[e.species].map((sp) => stars.find((x) => x.species === sp)).filter((x) => x?.alive);
    if (s.left === 1) {
      if (nb.length) {
        st.warns++;
        post(ev).push(`星が、また光りはじめた…。（${e.name}が、もうすぐよみがえる！のこりの星も、早くたおそう！）`);
        ev.c11aWarn = { id: e.id };
        ev.warn = true;
      }
      continue;
    }
    if (s.left > 0) continue;
    if (!nb.length) {
      st.stayDead++;
      post(ev).push(`${e.name}は、となりの星の光がとどかず、もう光らない。`);
      continue;
    }
    revive(b, e, ev);
  }
}
function revive(b, e, ev) {
  const st = b.c11a;
  const cf = c11aConf(e.species, b);
  Object.assign(e, { alive: true, hp: Math.max(1, Math.round(e.maxHp * cf.reviveHp)), status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false, telegraph: null });
  e.c11s.dead = false;
  e.c11s.left = 0;
  e.c11s.roarLeft = cf.roar.first;
  st.revives++;
  // よみがえる たびに、けものの 光が 強く なる（3つの 星 みんなの 与える ダメージ ＋reviveUp。ばらばらに たおし続けると 苦しく なる）
  if (cf.reviveUp) {
    for (const x of starsOf(b)) {
      if (x._atk11 === undefined) hide(x, '_atk11', x.dmgRate > 0 ? x.dmgRate : 1);
      x.dmgRate = x._atk11 * (1 + cf.reviveUp * st.revives);
    }
  }
  // 経験値は 1回ぶんだけ（よみがえった 星を また たおしても ふえない）
  const i = b.killed.lastIndexOf(e.species);
  if (i >= 0) b.killed.splice(i, 1);
  post(ev).push(`となりの星から光がながれこんで…${e.name}が、よみがえった！（3つの星を、そろえてたおそう！）`);
  if (cf.reviveUp) post(ev).push('けものの光が、少し強くなった…！');
  ev.c11aRevive = { id: e.id, hp: e.hp };
  ev.warn = true;
  ev.upd.push(e);
}

// ── 船長 ──
function pirateAfter(b, c, ev) {
  const st = b.c11a;
  const cf = c11aConf(C11A_CAPTAIN, b);
  // 星のうた: 時計が 止まる（この 番と、つぎの song 回）
  if (ev.c9dSong) {
    st.songs++;
    st.freeze = cf.song + 1;
    post(ev).push('スピカの歌で、時計の音が、ぴたりと止まった！（つぎの1回は、数がへらない）');
    ev.c11aSong = { freeze: cf.song };
  }
  if (st.freeze > 0) {
    st.freeze--;
    ev.c11aTick = { frozen: true, clocks: clockPub(b) };
    return;
  }
  const bitten = [];
  for (const k of st.clocks) {
    if (!k.wound || k.holder == null) continue;
    // 船長が この 番に 投げた 時計は、受け取った 人が 1回 動けるまで へらない（投げた その 番では へらない）
    if (k.fresh) {
      k.fresh = false;
      continue;
    }
    k.n--;
    if (k.n <= 0) bitten.push(k);
  }
  ev.c11aTick = { clocks: clockPub(b) };
  for (const k of bitten) bite(b, k, ev, c.id);
  ev.upd.push(...b.allies.filter((a) => st.clocks.some((k) => k.holder === a.id)));
  const cap = captainOf(b);
  if (cap) ev.upd.push(cap);
}
// サメが かむ
function bite(b, k, ev, but = null) {
  const st = b.c11a;
  const cf = c11aConf(C11A_CAPTAIN, b);
  const cap = captainOf(b);
  if (!cap || st.won) return;
  const lines = post(ev);
  if (k.holder === 'cap') {
    st.capBites++;
    const dmg = Math.max(1, Math.round(cap.maxHp * cf.bite.cap));
    lines.push(`チク、タク…ジリリリリ！海の中から${SHARK_NAME}がとび出して、${CAPTAIN_SHORT}にガブリとかみついた！`);
    if (dmg >= cap.hp) {
      cap.hp = 1;
      bossDown(b, cap, ev);
      return;
    }
    cap.hp -= dmg;
    (ev.results = ev.results || []).push({ id: cap.id, dmg });
    lines.push(`${CAPTAIN_SHORT}に${dmg}のダメージ！`, `${CAPTAIN_SHORT}「ひいぃぃっ！」…目を回している！（今なら、こうげきがよく通る！）`);
    st.dizzy = Math.max(st.dizzy, cf.bite.dizzy);
    st.anchorReady = false;
    st.anchorAim = null;
    cap.telegraph = null;
    // 時計は サメの 中（目を 回し おわる 番に はき出す）
    Object.assign(k, { holder: null, n: 0, wound: false, aim: null });
    ev.c11aBite = { to: cap.id, cap: true, dmg };
    ev.warn = true;
    ev.upd.push(cap);
    return;
  }
  const t = b.get(k.holder);
  Object.assign(k, { holder: 'cap', n: startCount(b), wound: false, aim: null });
  if (t?.alive) {
    st.allyBites++;
    const guard = !!t.defending;
    if (guard) st.biteGuards++;
    const dmg = Math.max(1, Math.round(t.maxHp * cf.bite.ally * (guard ? cf.bite.guardCut : 1)));
    lines.push(`チク、タク…ジリリリリ！海の中から${SHARK_NAME}がとび出して、${t.name}にガブリとかみついた！`);
    if (guard) lines.push(`${t.name}は、身を守っていた！`);
    // サメの かみつきは 守りや 作戦に よらない（最大HPの わりあい。防御で 半分）
    const real = Math.min(t.hp, dmg);
    t.hp -= real;
    lines.push(`${t.name}は${real}のダメージを受けた！`);
    (ev.results = ev.results || []).push({ id: t.id, dmg: real });
    ev.upd.push(t);
    if (t.hp <= 0) lines.push(...b.kill(t, 'phys', ev));
    ev.c11aBite = { to: t.id, cap: false, guard, dmg };
    ev.warn = true;
  }
  k.aim = pickAim(b, but);
  const aim = b.get(k.aim);
  lines.push(`${SHARK_NAME}は、時計をぺっとはき出した。${CAPTAIN_SHORT}が、それを拾った…！${aim ? `（つぎは、${aim.name}に投げるつもりだ！）` : ''}`);
}
// 船長が 時計を 投げる 相手（つぎの 番が いちばん 遠い 人を ねらう ことが 多い。時計を 持って いない 人から）
//   第101回 見直し: 時計は「えらんで いる 人」（人が 動かす 仲間 … b.humans()）に 投げる。人が みんな たおれて いる・
//   だれも えらんで いない（完全オート）時だけ、ほかの 仲間へ。人が 2人 いじょうなら 同じ 人に つづけて 行きすぎない ように
export function choosersOf(b) {
  return (b.humans?.() || []).filter((a) => a.alive && !a.fled);
}
function pickAim(b, but = null) {
  const st = b.c11a;
  const hs = choosersOf(b);
  const al = hs.length ? hs : b.aliveAllies();
  if (!al.length) return null;
  const free = al.filter((a) => !st.clocks.some((k) => k.holder === a.id));
  let pool = free.length ? free : al;
  if (pool.length > 1 && st.lastAim) pool = pool.filter((a) => a.id !== st.lastAim);
  let id;
  if (pool.length > 1 && b.rng.chance(0.7)) {
    const ord = turnOrder(b, but, 3);
    const idx = (a) => { const i = ord.indexOf(a.id); return i < 0 ? 99 : i; };
    id = pool.slice().sort((x, y) => idx(y) - idx(x))[0].id;
  } else id = pool[b.rng.int(0, pool.length - 1)].id;
  st.lastAim = id;
  return id;
}

// これから 動く じゅん（id の ならび。but … 今 動いて いる 人〈次の 番は 1まわり あと〉。loops … 1人 なん回ぶん）
export function turnOrder(b, but = null, loops = 3) {
  const out = [];
  const qpos = new Map(b.queue.map((q, i) => [q.id, i]));
  for (const x of b.combatants) {
    if (!x.alive || x.fled) continue;
    const r = atbRate(x);
    if (!(r > 0)) continue;
    const full = 100 / r;
    let t0;
    if (x.id === but) t0 = full;
    else if (x.ready || x.queued) t0 = 0;
    else t0 = Math.max(0, (100 - (x.atb || 0)) / r);
    for (let i = 0; i < loops; i++) out.push({ id: x.id, t: t0 + i * full, q: i === 0 && qpos.has(x.id) ? qpos.get(x.id) : 999 });
  }
  out.sort((p, q) => p.t - q.t || p.q - q.q);
  return out.map((o) => o.id);
}
// 時計の 見こみ（今 動く 人 but の 行動の あと）: m … のこりの 数・cap … 船長の 番まで いくつ・hold … 持つ 人の 番まで いくつ
export function clockView(b, k, but = null) {
  const st = b.c11a;
  const free = st.freeze > 0 ? 1 : 0;
  const m = k.n - (free ? 0 : 1);
  const ord = turnOrder(b, but, 3);
  // 止まって いる 間（つぎの 1回）は 数が へらない ので、見こみを 1つ うしろへ
  const at = (id) => { const i = ord.indexOf(id); return i < 0 ? 99 : i - (free && st.freeze > 1 ? 1 : 0); };
  return { m, cap: at(st.id), hold: k.holder === 'cap' ? at(st.id) : at(k.holder) };
}
// 投げると よい か（投げた あと 船長の 番より 先に 0 に なる。船長が 投げ返す 番では 数は へらない）
export function throwGood(b, c, k) {
  const v = clockView(b, k, c.id);
  return v.m <= v.cap;
}
// 持って いても だいじょうぶ か（自分の つぎの 番が 0 より 先に 来る）
export function holdSafe(b, c, k) {
  const v = clockView(b, k, c.id);
  return v.hold <= v.m - 1;
}
// 味方が 持って いる 時計（数の 少ない じゅん）
export const clocksOf = (b, a) => (b?.c11a?.kind === 'pirate' ? b.c11a.clocks.filter((k) => k.wound && k.holder === a?.id).sort((x, y) => x.n - y.n) : []);

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c11aTurnStart(b, c, ev, stuck) {
  const st = b.c11a;
  if (!st || c.side === 'ally' || st.won || c.telegraph) return;
  if (st.kind === 'beast') return beastTurn(b, c, ev, stuck);
  if (c.id !== st.id) return;
  return pirateTurn(b, c, ev, stuck);
}
function beastTurn(b, c, ev, stuck) {
  const s = c.c11s;
  if (!s || stuck || s.role !== 'head') return;
  const st = b.c11a;
  const cf = c11aConf(c.species, b);
  if (s.roarReady) {
    c.telegraph = FANG;
    return;
  }
  s.roarLeft--;
  if (s.roarLeft > 0) return;
  s.roarLeft = cf.roar.every;
  const al = b.aliveAllies();
  const t = al[b.rng.int(0, al.length - 1)];
  if (!t) return;
  s.roarReady = true;
  s.aim = t.id;
  st.roars++;
  ev.lines.push(`${c.name}が、ぐるるる…とうなって、${t.name}をにらんだ！`, `（次に、${t.name}へ大きなかみつきが来る！${t.name}は「防御」でそなえよう！）`);
  ev.c11aRoar = { id: c.id, aim: t.id };
  ev.warn = true;
  ev.upd.push(c);
}
function pirateTurn(b, c, ev, stuck) {
  const st = b.c11a;
  const cf = c11aConf(C11A_CAPTAIN, b);
  st.acts++;
  ev.upd.push(c);
  if (st.dizzy > 0) {
    st.dizzy--;
    // 目を 回し おわる 番: サメが 時計を はき出す（船長が 拾う。つぎの 番に 投げる）
    if (st.dizzy === 0) spitOut(b, ev);
    c.telegraph = DIZZY;
    return;
  }
  if (stuck) return;
  // HPが 半分を 切ると 時計が 2つ（ひとりの 時は 1つ の まま）
  // 時計の 数は「人の 数」まで（2つめは えらんで いる 人が 2人 いじょうの 時だけ。完全オートは 今までと おなじ 数え方）
  const hs = choosersOf(b).length;
  if (!st.two && cf.two > 0 && c.hp <= c.maxHp * cf.two && b.allies.length > 1 && (hs >= 2 || (!hs && !someoneChooses(b)))) {
    st.two = true;
    const k = { no: 1, holder: 'cap', n: startCount(b) + cf.twoPlus, wound: false, aim: pickAim(b) };
    st.clocks.push(k);
    const aim = b.get(k.aim);
    ev.lines.push(`${CAPTAIN_SHORT}「ぐぬぬ…こうなったら、時計を2つだ！」`, `${CAPTAIN_SHORT}は、2つめの目ざまし時計を取り出した！${aim ? `（つぎは、${aim.name}に投げるつもりだ！）` : ''}`);
    ev.c11aTwo = { id: c.id };
    ev.warn = true;
  }
  // 時計を 持って いれば 投げる（番の はじめに。そのあと ふだんの 行動も する … 早く 投げても 船長の 番は へらない）
  if (st.clocks.some((k) => k.holder === 'cap')) throwClock(b, c, ev, true);
  if (st.anchorReady) {
    c.telegraph = ANCHOR;
    return;
  }
  st.anchorLeft--;
  if (st.anchorLeft > 0) return;
  st.anchorLeft = cf.anchor.every;
  const al = b.aliveAllies();
  const holders = al.filter((a) => st.clocks.some((k) => k.holder === a.id));
  const t = holders.length && b.rng.chance(cf.anchor.holder) ? holders[0] : al[b.rng.int(0, al.length - 1)];
  if (!t) return;
  st.anchorReady = true;
  st.anchorAim = t.id;
  ev.lines.push(`${CAPTAIN_SHORT}が、片手のいかりを、ぐるぐるまわしはじめた…！ねらいは、${t.name}だ！`, `（次に「いかりなげ」が来る！${t.name}は「防御」でふせげる！）`);
  ev.c11aAnchorUp = { id: c.id, aim: t.id };
  ev.warn = true;
}
function spitOut(b, ev) {
  const st = b.c11a;
  for (const k of st.clocks) {
    if (k.holder != null) continue;
    Object.assign(k, { holder: 'cap', n: startCount(b), wound: false, aim: pickAim(b) });
    const aim = b.get(k.aim);
    ev.lines.push(`${SHARK_NAME}が、時計をぺっとはき出した。${CAPTAIN_SHORT}は、ふらふらしながら、それを拾った…。${aim ? `（つぎは、${aim.name}に投げるつもりだ！）` : ''}`);
    ev.c11aSpit = { aim: k.aim };
  }
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c11aEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c11aFang': fang(b, c, ev); return true;
    case 'c11aMend': mend(b, c, ev); return true;
    case 'c11aPass': pass(b, c, ev); return true;
    case 'c11aThrow': throwClock(b, c, ev); return true;
    case 'c11aAnchor': anchor(b, c, ev); return true;
    case 'c11aDizzy': {
      ev.lines.push(`${CAPTAIN_SHORT}は、目を回して、ふらふらしている…。（今のうちだ！こうげきが、よく通る！）`);
      ev.c11aDizzy = { id: c.id, left: b.c11a?.dizzy || 0 };
      ev.upd.push(c);
      return true;
    }
    case 'c11aBrag': {
      ev.lines.push(`${CAPTAIN_SHORT}は、むねをはって、いばっている。`);
      ev.c11aBrag = { id: c.id };
      return true;
    }
    default: return false;
  }
}
function fang(b, c, ev) {
  const st = b.c11a;
  const s = c.c11s;
  const cf = c11aConf(c.species, b);
  if (s) s.roarReady = false;
  const t0 = b.get(s?.aim);
  const al = b.aliveAllies();
  const t = t0?.alive ? t0 : al[b.rng.int(0, al.length - 1)];
  if (s) s.aim = null;
  if (!t) return;
  st.fangs++;
  if (t.defending) st.fangGuards++;
  ev.fx = { type: 'ability', anim: 'c11b_fang', actor: c.id, targets: [t.id], side: 'enemy' };
  b.physHit(c, t, { mult: cf.roar.mult * (t.defending ? cf.roar.guardCut : 1), acc: 9 }, ev, 'phys');
  if (t.defending) post(ev).push(`${t.name}は、身を守って、こらえた！`);
  ev.c11aFang = { id: c.id, to: t.id, guard: !!t.defending };
  ev.warn = true;
  ev.upd.push(c);
}
function mend(b, c, ev) {
  const st = b.c11a;
  const cf = c11aConf(c.species, b);
  const mates = starsOf(b).filter((e) => e.alive && e.hp < e.maxHp);
  if (!mates.length) {
    ev.lines.push('しかし、どの星も、きずついていなかった。');
    return;
  }
  st.mends++;
  ev.results = ev.results || [];
  for (const e of mates) {
    const h = Math.min(e.maxHp - e.hp, Math.max(1, Math.round(e.maxHp * cf.mend)));
    e.hp += h;
    ev.results.push({ id: e.id, heal: h });
    ev.lines.push(`${e.name}のHPが${h}回復した！`);
    ev.upd.push(e);
  }
  ev.c11aMend = { id: c.id };
}
// 時計を投げる（だれでも。持って いる 人だけ。数の 少ない 時計から）
function pass(b, c, ev) {
  const st = b.c11a;
  ev.fx = { type: 'ability', anim: 'c11a_pass', actor: c.id, targets: [c.id], side: 'ally' };
  ev.lines.length = 0;
  const mine = st?.kind === 'pirate' && !st.won ? clocksOf(b, c) : [];
  const ch = b.curCmd?.choice;
  const k = mine.find((x) => x.no === ch) || mine[0];
  if (!k) {
    ev.lines.push(`${c.name}は、時計を投げようとした。`, 'しかし、時計を持っていない！');
    ev.c11aPass = { id: c.id, ok: false };
    return;
  }
  const cap = captainOf(b);
  st.passes++;
  const early = !throwGood(b, c, k);
  if (early) st.early++;
  k.holder = 'cap';
  k.aim = pickAim(b, c.id);
  ev.lines.push(`${c.name}は、目ざまし時計を、${cap?.name || '船長'}に投げ返した！（チク・タク　あと${Math.max(0, k.n - (st.freeze > 0 ? 0 : 1))}）`);
  post(ev).push(`${CAPTAIN_SHORT}「わ、わわっ！？」`);
  ev.c11aPass = { id: c.id, ok: true, no: k.no, n: k.n, aim: k.aim, early };
  ev.upd.push(c);
  if (cap) ev.upd.push(cap);
}
// 船長が 時計を 投げる（数の 少ない 時計から。前ぶれで きめた 相手へ）
function throwClock(b, c, ev, inline = false) {
  const st = b.c11a;
  const mine = st.clocks.filter((k) => k.holder === 'cap').sort((x, y) => (x.wound ? x.n : 99) - (y.wound ? y.n : 99));
  const k = mine[0];
  if (!k) {
    ev.lines.push(`${CAPTAIN_SHORT}は、あたりをきょろきょろ見回した。`);
    return;
  }
  const t0 = b.get(k.aim);
  const t = t0?.alive ? t0 : b.get(pickAim(b, c.id));
  if (!t) return;
  if (!k.wound) {
    k.n = startCount(b) + (k.no ? c11aConf(C11A_CAPTAIN, b).twoPlus : 0);
    k.wound = true;
  }
  k.holder = t.id;
  k.aim = null;
  k.fresh = true;
  st.throws++;
  if (!inline) ev.fx = { type: 'ability', anim: 'c11p_throw', actor: c.id, targets: [t.id], side: 'enemy' };
  ev.lines.push(`${CAPTAIN_SHORT}は、目ざまし時計を、${t.name}に投げつけた！（チク・タク　あと${k.n}）`);
  ev.c11aThrow = { id: c.id, to: t.id, no: k.no, n: k.n };
  ev.warn = true;
  ev.upd.push(c, t);
}
function anchor(b, c, ev) {
  const st = b.c11a;
  const cf = c11aConf(C11A_CAPTAIN, b);
  st.anchorReady = false;
  const t0 = b.get(st.anchorAim);
  const al = b.aliveAllies();
  const t = t0?.alive ? t0 : al[b.rng.int(0, al.length - 1)];
  st.anchorAim = null;
  if (!t) return;
  st.anchors++;
  ev.fx = { type: 'ability', anim: 'c11p_anchor', actor: c.id, targets: [t.id], side: 'enemy' };
  if (t.defending) {
    st.anchorGuards++;
    ev.lines.push(`いかりが、ぶうんととんできた！`, `${t.name}は、身を守って、いかりをはじき返した！`);
    ev.c11aAnchor = { id: c.id, to: t.id, guard: true };
    return;
  }
  b.physHit(c, t, { mult: cf.anchor.mult, acc: 9 }, ev, 'phys');
  if (t.alive && !t.ready && !t.queued) {
    t.atb = Math.min(t.atb || 0, cf.anchor.atb);
    post(ev).push(`${t.name}は、いかりのくさりにからまって、動きがおくれた！`);
  }
  ev.c11aAnchor = { id: c.id, to: t.id, guard: false };
  ev.warn = true;
  ev.upd.push(c, t);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c11aDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  const st = b.c11a;
  if (!st || st.won) return dmg;
  // 星座のけもの: 星が 1つ 消えて いる 間（よみがえる 前）は、のこりの 星が 光の 線で まもられる（受ける ダメージ linkK ばい）
  //   … 1つずつ たおして いくと 苦しい。3つを 同じくらいに けずって、近い 番で そろえて たおす
  if (st.kind === 'beast') {
    if (!t.c11s) return dmg;
    // だれも えらんで いない（完全オート・人が みんな たおれた）時は、線が もっと つよい（linkAuto）… そろえて たおさないと 勝てない
    const cf = c11aConf(t.species, b);
    const k = someoneChooses(b) ? cf.linkK : cf.linkAuto;
    if (k < 1 && starsOf(b).some((e) => !e.alive && e.c11s?.dead && e.c11s.left > 0)) {
      dmg = Math.max(1, Math.round(dmg * k));
      if (ev && !ev.c11aLink) {
        ev.c11aLink = true;
        post(ev).push(`（消えた星から、光の線がのびて、${t.name}をまもっている…！）`);
      }
    }
    return dmg;
  }
  if (st.kind !== 'pirate' || t.id !== st.id) return dmg;
  const cf = c11aConf(C11A_CAPTAIN, b);
  // ふだんは かたい（3わり）。目を 回して いる 間は よく 通る
  dmg = Math.max(1, Math.round(dmg * (st.dizzy > 0 ? cf.bite.dizzyK : cf.hard)));
  if (ev && !(st.dizzy > 0) && !ev.c11aHard) {
    ev.c11aHard = true;
    post(ev).push(`（${CAPTAIN_SHORT}は、ぶあついコートで、こうげきをはじいた…！）`);
  }
  // 船長は たおれない（HP 1 で 止まる → サメに 追われて にげる）
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    bossDown(b, t, ev);
  }
  return dmg;
}
function bossDown(b, c, ev) {
  const st = b.c11a;
  st.won = true;
  st.anchorReady = false;
  c.telegraph = null;
  for (const k of st.clocks) Object.assign(k, { holder: null, wound: false, n: 0, aim: null });
  b.killed.push(c.species);
  if (ev) {
    post(ev).push(
      `${CAPTAIN_SHORT}「ま、まいった…！もう、時計はこりごりだ…！」`,
      `チク、タク、チク、タク…。${SHARK_NAME}が、大きな口をあけて、${CAPTAIN_SHORT}めがけておよいできた！`,
      `${CAPTAIN_SHORT}「ひ、ひえぇぇ〜っ！おぼえてろーっ！」`,
      `${CAPTAIN_SHORT}は、${SHARK_NAME}に追われて、星の海のむこうへ、にげていった…。`,
    );
    ev.c11aDown = { id: c.id };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// この 幕の 戦いで なければ undefined。ふつうの オートは null
export function c11aPlan(b, c, decide, bestHit) {
  const st = b.c11a;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  if (st.kind === 'beast') return beastPlan(b, c, decide, bestHit, mode);
  return piratePlan(b, c, decide, bestHit, mode);
}
function beastPlan(b, c, decide, bestHit, mode) {
  const aimed = starsOf(b).some((e) => e.alive && e.c11s?.roarReady && e.c11s.aim === c.id);
  if (mode !== 'know' && mode !== 'blind') return null;
  if (mode === 'blind') {
    if (aimed && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    return null;
  }
  // 知って いる 人: かみつきの ねらい … 防御。ふだんは 3つの 星を 同じくらいに けずる（いちばん HPの わりあいが 多い 星）。
  //   星が たおれて いる 間は、のこりの 星を はやく（HPの 少ない じゅん）。仲間なしの ひとりは じゅんに たおす（よみがえるまでが 長い）
  if (aimed && !c.defending) return { type: 'defend' };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type)) return cmd;
  const stars = starsOf(b);
  const up = stars.filter((e) => e.alive);
  if (!up.length) return cmd;
  const down = stars.some((e) => !e.alive && e.c11s?.dead && e.c11s.left > 0);
  const pick = down || b.allies.length === 1 ? up.slice().sort((x, y) => x.hp - y.hp)[0] : up.slice().sort((x, y) => y.hp / y.maxHp - x.hp / x.maxHp)[0];
  // ひとり: 強く する 技より こうげき（HPが 少ない 時は ふだんの 考え）
  if (b.allies.length === 1 && c.hp / c.maxHp >= 0.45 && !(a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type))) return bestHit(b, c, pick) || cmd;
  if (cmd?.type === 'attack') return { type: 'attack', target: pick.id };
  if (a && a.target === 'enemy') return { ...cmd, target: pick.id };
  if (cmd?.type === 'defend' || (a && ['enemies', 'group'].includes(a.target))) return cmd;
  return cmd;
}
function piratePlan(b, c, decide, bestHit, mode) {
  const st = b.c11a;
  const mine = clocksOf(b, c);
  const k = mine[0] || null;
  const canPass = canUse(b, c, TOKEI_NAGE);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、ちょうど よい 時の 3回に 1回 投げる（数は 自動の 仲間 みんなで 1つ）
    if (c.kind === 'player' || !k || !canPass || !someoneChooses(b) || !throwGood(b, c, k)) return null;
    b.c11aAuto = (b.c11aAuto || 0) + 1;
    if (b.c11aAuto % AUTO_EVERY) return null;
    st.autoPasses++;
    return { type: 'ability', id: TOKEI_NAGE };
  }
  const anchored = st.anchorReady && st.anchorAim === c.id && !c.defending;
  if (mode === 'blind') {
    // 知らない 人: 時計を 持つと、数を 見ずに 投げて しまう ことが 多い・前ぶれに たまに 気づく
    if (k && canPass && b.rng.chance(0.4)) return { type: 'ability', id: TOKEI_NAGE };
    if (anchored && b.rng.chance(0.15)) return { type: 'defend' };
    return null;
  }
  // 知って いる 人
  if (k && canPass) {
    if (throwGood(b, c, k)) return { type: 'ability', id: TOKEI_NAGE };
    if (!holdSafe(b, c, k)) {
      // このままだと かまれる: 星のうた（時計を 止める）→ 投げ返す（船長の 番の 時 ちょうど 0 に なる ときは 身を 守る）
      if (songReady(b) && canUse(b, c, SONG) && !queued(b, SONG)) return { type: 'ability', id: SONG };
      return { type: 'ability', id: TOKEI_NAGE };
    }
  }
  if (anchored) return { type: 'defend' };
  // 船長が 目を 回して いる: いっせいに こうげき（だれかが とても あぶない 時の 回復・生き返りは そのまま）
  const cap = captainOf(b);
  if (st.dizzy > 0 && cap?.alive) {
    const cmd = base(b, c, decide);
    const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
    if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type) && b.allies.some((x) => !x.fled && (!x.alive || x.hp / x.maxHp < 0.35))) return cmd;
    return bestHit(b, c, cap) || cmd;
  }
  // ほかの 人が このままだと かまれる: 星のうたで 止める
  if (songReady(b) && canUse(b, c, SONG) && !queued(b, SONG)) {
    const doomed = st.clocks.some((x) => x.wound && x.holder && x.holder !== 'cap' && x.holder !== c.id && (() => { const v = clockView(b, x, c.id); return v.hold > v.m - 1 && v.hold <= v.m + 1; })());
    if (doomed) return { type: 'ability', id: SONG };
  }
  return null;
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
export function c11aBusy(b) {
  const st = b.c11a;
  if (!st || st.won) return false;
  if (st.kind === 'pirate') return st.anchorReady || st.clocks.some((k) => k.wound && k.holder && k.holder !== 'cap');
  return starsOf(b).some((e) => (e.alive && e.c11s?.roarReady) || (!e.alive && e.c11s?.dead && e.c11s.left > 0));
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵）─────────────
// 時計（船長の pub の clocks11）: [{ no, n〈のこりの 数〉, holder〈味方の id・'cap'・null … サメの 中〉, wound〈数が へって いる〉, aim〈つぎに 投げる 相手〉 }]
export function clockPub(b) {
  return (b?.c11a?.clocks || []).map((k) => ({ no: k.no, n: k.n, holder: k.holder, wound: !!k.wound, aim: k.aim || null }));
}
// 星座のけもの: c11Kind 'beast'・role11（'head'|'chest'|'tail'）・dead11（たおれて いる）・revive11（よみがえるまでの のこり。0 … よみがえらない）・
//   roar11（かみつきの 前ぶれ）・roarAim11・beastStage（曲 1 ふつう・2 前ぶれ／よみがえる 前・3 2つ いじょう たおれた・4 勝った）
// 船長: c11Kind 'pirate'・clocks11・dizzy11（目を 回して いる のこり）・anchor11（いかりなげの 前ぶれ）・anchorAim11・freeze11（止まって いる）・
//   c11Down（にげた）・pirateStage（曲 1 ふつう・2 目を 回した・3 HP 半分〈時計 2つ〉・4 勝った）
export function c11aPub(c, b = c?._b11) {
  const o = {};
  const st = b?.c11a;
  if (!st) return o;
  if (st.kind === 'beast' && c.c11s) {
    const s = c.c11s;
    const stars = starsOf(b);
    o.c11Kind = 'beast';
    o.role11 = s.role;
    o.dead11 = !c.alive ? 1 : 0;
    o.revive11 = !c.alive && s.dead && s.left > 0 ? s.left : 0;
    o.roar11 = c.alive && s.roarReady ? 1 : 0;
    o.roarAim11 = c.alive && s.roarReady ? s.aim : null;
    const downN = stars.filter((e) => !e.alive).length;
    o.beastStage = st.won ? 4 : stars.some((e) => (e.alive && e.c11s.roarReady) || (!e.alive && e.c11s.left === 1)) ? 2 : downN >= 2 ? 3 : 1;
    return o;
  }
  if (st.kind === 'pirate' && c.id === st.id) {
    o.c11Kind = 'pirate';
    o.clocks11 = clockPub(b);
    o.dizzy11 = st.dizzy;
    o.anchor11 = st.anchorReady ? 1 : 0;
    o.anchorAim11 = st.anchorReady ? st.anchorAim : null;
    o.freeze11 = st.freeze > 0 ? 1 : 0;
    o.c11Down = st.won ? 1 : 0;
    o.pirateStage = st.won ? 4 : st.dizzy > 0 ? 2 : c.hp <= c.maxHp * 0.5 ? 3 : 1;
  }
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: pass11（時計を投げる が ある 戦い）・clock11（持って いる 時計の いちばん 少ない 数。持って いない 時は null）・clockN11（持って いる 数）
export function c11aAllyPub(c, b = c?._b11) {
  const o = {};
  const st = b?.c11a;
  if (!st || st.kind !== 'pirate') return o;
  o.pass11 = 1;
  // 持って いない 時も null を 出す（がめんは 前の 値に 足して いく ので、消さないと しるしが のこる）
  const mine = clocksOf(b, c);
  o.clock11 = mine.length ? mine[0].n : null;
  o.clockN11 = mine.length;
  return o;
}
void C11A_STARS;
void C11A_CHEST;
void C11A_TAIL;
