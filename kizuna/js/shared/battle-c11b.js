// 第3部 第3章 第2幕「月の都と、名前のランプ」の 戦いの しかけ（battle-c9a.js・battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c11b.md の 18-4
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ c11_act2）: 技「名前をよぶ声」が ふえる … 戦いで 1回だけ、たおれた 仲間（ゲストを のぞく）が
//   いる 時の ほのかな光で、スピカが その 人の 名前を よんで 生き返らせる（最大HPの CALL_HP）。battle-c9a.js の glow から よぶ。
//   前の 7つの ごほうび（battle-c10a〜d.js・battle-c11a.js の ながれ星）と 合わせて きく
// ・中ボス「ランプの番人カンテラ」（monsters-c11b.js の c11b.kind 'keeper'）… ランプが 明るい ／ 暗い を くり返す
//   明るい 間 … 物理（戦う・物理の 技）が 受ける ダメージ cut（3わり）。呪文は ふつう ／ 暗い 間 … 呪文（物理 いがい）が cut。物理は ふつう
//   every 回 番人が 動く ごとに、1回 前に 前ぶれ（「ランプが、ちらちら…」・名前の 横に しるし）→ 次の 番人の 番で 明かりが かわる ＋ 全体攻撃（防御で guardCut）
// ・新しい コマンド「よびかける」（m11_yobikake。オボロの 戦いで だれでも。その 人の 番を 使う。ねらいは スピカか 味方 1人 … cmd.choice）
//   スピカ … わすれが 1 へる ／ わすれの じょうたいの 仲間 … すぐ 治る（自分には きかない）
// ・幕の ボス「月のむかえ オボロ」と 天人 2体（c11b.kind 'oboro'・'tennin'）… わすれの 衣
//   1. 「わすれの衣」（robe.every 回 動く ごとに 前ぶれ → 次の 番）: スピカの わすれ ＋1（0〜max。画面に 大きく「スピカの思い出　あと 3」）
//   2. わすれが max（3）に なると、スピカは つれて いかれて 負け（全滅と 同じ。b.pendingEnd lose → 負けた 時の ヒント・やり直しは ふつう）
//   3. 「よびかける」を スピカに … わすれ −1
//   4. 「わすれの光」（flash.every 回 動く ごとに 前ぶれ → 次の 番・全体）: 光の ダメージ ＋ 当たった 人は「わすれ」の じょうたい
//      （呪文か 特技の 多い 方が flash.turns 回の 番の 間 えらべない … 技を いったん しまう）。「防御」で ふせげる。
//      ほかの 人の「よびかける」で すぐ 治る。スピカの「星のうた」でも みんな 治る
//   5. 天人が いる 間、オボロは かたい（受ける ダメージ hard）。天人は たおしても、オボロが back 回 動くと もどる（1回 前に 前ぶれ）
//   6. HPが 半分を 切ると、衣を かけた あと robe.twice の わりあいで つづけて もう 1回（すぐ 次の 前ぶれ）
//   （設計に ない 足し物: だれも えらんで いない〈完全オート・人が みんな たおれた〉時は 衣が robe.auto 回ごと・オボロの 受ける ダメージ autoK ばい。
//     前の 幕の けものの linkAuto と 同じ 考え。自動の 仲間が 強い 組〈1人＋家族の 仲間3 など〉の 完全オートが 3〜4わり 勝って いた）
//   人数で 合わせる（few・bare・solo・monK）。ひとりの 時は 衣が おそい・天人 1体
//   勝つと オボロは たおれず 引く（HP 1 で 止まる。b.killed に 入れて 経験値・落とし物は ふつう）
// ・自動の 仲間（酒場の 人・家族の 仲間・魔物の 仲間）は、人が えらんで いる 時だけ（someoneChooses）、わすれが 2 いじょうの 時の 3回に 1回 よびかける。
//   番人の 戦いでは、人が えらんで いる 時だけ、明かりが かわる 前ぶれで 2回に 1回 身を 守る
//   完全オートは よびかけない（スピカを つれて いかれて 勝てない）
// ・戦いは、人が えらぶ 間 ずっと 待つ 形（b.tellAll）。b.mechBoss も 立てる（shared/ai.js の mechBoss）
// ・人数の 数え方は 第2章 第1幕と おなじ（battle-c10a.js の peopleOf10。魔物の 仲間は 半人ぶん）。bare … 味方が みんな 家族の キャラで 2人・3人
import { MONSTERS } from './data/monsters.js?v=6a7817ffa6c0';
import { ABILITIES } from './data/abilities.js?v=6a7817ffa6c0';
import { C11B_KEEPER, C11B_OBORO, C11B_TENNIN, KEEPER_SHORT, OBORO_SHORT } from './data/monsters-c11b.js?v=6a7817ffa6c0';
import { YOBIKAKE } from './data/abilities-c11b.js?v=6a7817ffa6c0';
import { C11B_B as C11B } from './data/c11b-names-b.js?v=6a7817ffa6c0';
import { SONG } from './data/abilities-c9d.js?v=6a7817ffa6c0';
import { TERU as TERU_ID } from './data/abilities-c9b.js?v=6a7817ffa6c0';
import { TOKEI_NAGE as TOKEI_ID } from './data/abilities-c11a.js?v=6a7817ffa6c0';
import { canUse } from './ai.js?v=6a7817ffa6c0';
import { peopleOf10, someoneChooses } from './battle-c10a.js?v=6a7817ffa6c0';

export { YOBIKAKE };
export const SWITCH = 'm11k_switch';
export const ROBE = 'm11o_robe';
export const FLASH = 'm11o_flash';
export const AUTO_EVERY = 3;
export const SPICA = 'spica';
// スピカの ごほうび「名前をよぶ声」
export const CALL_HP = 0.3;
// わすれに しない 技（しくみの コマンド）
const KEEP = new Set([YOBIKAKE, SONG, TERU_ID, TOKEI_ID]);

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
// 仲間なしの 少ない パーティー（味方が みんな 家族の キャラで 2人か 3人。ゲストの スピカは 味方に 入らない）
export function bareOf(b) {
  const al = (b?.allies || []).filter((a) => a.kind !== 'guest');
  return al.length >= 2 && al.length <= 3 && al.every((a) => a.kind === 'player') ? al.length : 0;
}
const hide = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: false, configurable: true, writable: true });

// しかけの 数（人数で 合わせた もの）
export function c11bConf(species, b = null) {
  const c = MONSTERS[species]?.c11b || {};
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
  if (c.kind === 'keeper') {
    Object.assign(out, { every: pick('every', c.every ?? 3), cut: pick('cut', c.cut ?? 0.3), cutAuto: c.cutAuto ?? c.cut ?? 0.3, wave: { mult: 0.8, guardCut: 0.4, ...(c.wave || {}) } });
  }
  if (c.kind === 'oboro') {
    Object.assign(out, {
      max: c.max ?? 3,
      robe: { every: 4, first: 3, twice: 0.5, auto: 2, ...(c.robe || {}), every: pick('robe', c.robe?.every ?? 4) },
      flash: { every: 5, first: 5, base: [520, 560], turns: 2, ...(c.flash || {}), every: pick('flash', c.flash?.every ?? 5) },
      hard: pick('hard', c.hard ?? 0.4), autoK: c.autoK ?? 1, back: pick('back', c.back ?? 8), tennin: pick('tennin', 2),
    });
  }
  return out;
}
export const c11bState = (b) => b?.c11b || null;
export const keeperOf = (b) => (b?.c11b?.kind === 'keeper' ? b.get(b.c11b.id) : null);
export const oboroOf = (b) => (b?.c11b?.kind === 'oboro' ? b.get(b.c11b.id) : null);
export const tenninOf = (b) => (b?.c11b?.kind === 'oboro' ? b.c11b.tennin.map((id) => b.get(id)).filter(Boolean) : []);
export const tenninUp = (b) => tenninOf(b).filter((e) => e.alive);
const songOf = (b) => b.c9sp?.song || null;
const songReady = (b) => { const s = songOf(b); return !!s && s.charge >= s.max; };
const queued = (b, id, choice) => b.queue.some((q) => q.cmd?.id === id && (choice === undefined || (q.cmd.choice ?? SPICA) === choice));

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC11a の あと）─────────────
// かえす 値: スピカを 出すか（番人・オボロの 戦いは かならず。星のうたも）
export function setupC11b(b, lines) {
  // スピカの ごほうび（前の 幕の b.c11rew と おなじ 形）
  if (flag(b, C11B.act2)) b.c11rew = { ...(b.c11rew || {}), call: true };
  const keeper = b.enemies.find((e) => e.species === C11B_KEEPER);
  const oboro = b.enemies.find((e) => e.species === C11B_OBORO);
  if (!keeper && !oboro) return false;
  b.c9songOn = true;
  b.mechBoss = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（前の 幕と おなじ）
  b.tellAll = true;
  for (const a of b.allies) hide(a, '_b11b', b);
  if (oboro) setupOboro(b, oboro, lines);
  else setupKeeper(b, keeper, lines);
  b.tell = c11bTell(b);
  return true;
}
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}

function setupKeeper(b, k, lines) {
  const cf = c11bConf(C11B_KEEPER, b);
  scale(k, cf);
  hide(k, '_b11b', b);
  b.c11b = { kind: 'keeper', id: k.id, won: false, phase: 'light', left: cf.every, warn: false, acts: 0, switches: 0, waves: 0, waveGuards: 0, cutHits: 0, goodHits: 0 };
  lines.push(
    `${KEEPER_SHORT}「ここは、名前の塔。消された名前に、さわってはならぬ。」`,
    `${KEEPER_SHORT}は、大きなランプを、高くかかげた！ランプが、まぶしく光っている…！`,
    '（ランプが明るい間は、物理が効きにくい。暗い間は、呪文が効きにくい…！）',
  );
}

function setupOboro(b, o, lines) {
  const cf = c11bConf(C11B_OBORO, b);
  scale(o, cf);
  hide(o, '_b11b', b);
  const ts = b.enemies.filter((e) => e.species === C11B_TENNIN);
  const tcf = c11bConf(C11B_TENNIN, b);
  b.c11b = {
    kind: 'oboro', id: o.id, tennin: ts.map((e) => e.id), won: false, lost: false, forget: 0, max: cf.max,
    robeLeft: cf.robe.first, robeReady: false, flashLeft: cf.flash.first, flashReady: false, acts: 0,
    robes: 0, twice: 0, calls: 0, wasted: 0, cures: 0, autoCalls: 0, flashes: 0, flashGuards: 0, forgotHits: 0, songCures: 0, tKills: 0, tBacks: 0, peak: 0,
  };
  ts.forEach((e, i) => {
    scale(e, { ...tcf, hp: cf.hp > 0 ? Math.min(1, cf.hp) : 1, atk: cf.atk });
    hide(e, '_b11b', b);
    e.c11t = { dead: false, left: 0, fresh: false, gone: i >= cf.tennin };
    // ひとりの 時は 天人 1体（のこりは はじめから いない）
    if (e.c11t.gone) Object.assign(e, { alive: false, hp: 0 });
  });
  for (const a of b.allies) {
    if (!a.abilities.includes(YOBIKAKE)) a.abilities = [YOBIKAKE, ...a.abilities];
  }
  lines.push(
    `${OBORO_SHORT}「ひめさま。おむかえにあがりました。」`,
    `${OBORO_SHORT}「下の世界のことは、すべて、おわすれください。」`,
    `（スピカの思い出が、すべて消えると、スピカがつれていかれてしまう…！「よびかける」で、スピカの名前をよぼう！）`,
  );
}

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// 番人: 'lamp' … 明かりが かわる 前ぶれ・'keeper' … いつも 待つ ／ オボロ: 'robe' … わすれの衣・'flash' … わすれの光・'oboro' … いつも 待つ
export function c11bTell(b) {
  const st = b?.c11b;
  if (!st || st.won || st.lost) return null;
  if (st.kind === 'keeper') return keeperOf(b)?.alive ? (st.warn ? 'lamp' : 'keeper') : null;
  if (!oboroOf(b)?.alive) return null;
  return st.robeReady ? 'robe' : st.flashReady ? 'flash' : 'oboro';
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter。味方・敵 どちらも）─────────────
export function c11bAfter(b, c, ev) {
  const st = b.c11b;
  if (!st || st.won || st.lost || !c || b.pendingEnd || b.over) return;
  if (st.kind !== 'oboro') return;
  // 星のうた: わすれの じょうたいの 人が みんな 治る
  if (ev.c9dSong) {
    const fixed = b.allies.filter((a) => a.c11f);
    for (const a of fixed) remember(b, a, ev, true);
    if (fixed.length) {
      st.songCures += fixed.length;
      post(ev).push(`スピカの歌で、${fixed.map((x) => x.name).join('と')}は、わすれていたことを思い出した！`);
      ev.c11bSong = { cured: fixed.map((x) => x.id) };
    }
  }
  // わすれの じょうたいの のこり（その 人の 番を 数える）
  if (c.side === 'ally' && c.c11f) {
    c.c11f.left--;
    if (c.c11f.left <= 0) remember(b, c, ev);
  }
  // 天人: たおれた（もどるのは オボロが back 回 動いた あと … oboroTurn の tenninBack）
  for (const e of tenninOf(b)) {
    const s = e.c11t;
    if (s.gone || e.alive || s.dead) continue;
    s.dead = true;
    s.left = c11bConf(C11B_OBORO, b).back;
    st.tKills++;
    post(ev).push(`${e.name}は、雲の中へ、すうっと消えた…。${tenninUp(b).length ? '' : `（今なら、${OBORO_SHORT}にこうげきが通る！）`}`);
    ev.c11bOut = { id: e.id, left: tenninUp(b).length };
  }
}
// 天人が もどる（オボロの 番の はじめに 1つ 数える）
function tenninBack(b, ev) {
  const st = b.c11b;
  for (const e of tenninOf(b)) {
    const s = e.c11t;
    if (s.gone || e.alive || !s.dead) continue;
    s.left--;
    if (s.left === 1) {
      ev.lines.push('雲の中に、天人のすがたが、また見えはじめた…。');
      ev.c11bBackSoon = { id: e.id };
      continue;
    }
    if (s.left > 0) continue;
    Object.assign(e, { alive: true, hp: e.maxHp, status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false, telegraph: null });
    s.dead = false;
    s.left = 0;
    st.tBacks++;
    // 経験値は 1回ぶんだけ
    const i = b.killed.lastIndexOf(e.species);
    if (i >= 0) b.killed.splice(i, 1);
    ev.lines.push(`${e.name}が、雲の中から、もどってきた！（${OBORO_SHORT}が、また、まもられている…）`);
    ev.c11bBack = { id: e.id };
    ev.warn = true;
    ev.upd.push(e);
  }
}

// わすれの じょうたい … しまった 技を もどす
function remember(b, a, ev, quiet = false) {
  const f = a.c11f;
  if (!f) return;
  const have = new Set(a.abilities);
  a.abilities = [...a.abilities, ...f.stash.filter((id) => !have.has(id))];
  delete a.c11f;
  if (!quiet) post(ev).push(`${a.name}は、わすれていた${f.kind === 'spell' ? '呪文' : '特技'}を、思い出した！`);
  ev.upd.push(a);
}
// その 人の 呪文・特技（しくみの コマンドは のぞく）
function forgettable(a, kind) {
  return (a.abilities || []).filter((id) => {
    const ab = ABILITIES[id];
    if (!ab || KEEP.has(id) || ab.cmdOnly) return false;
    const spell = ab.kind === 'spell' || !!ab.spellLike;
    return kind === 'spell' ? spell : !spell && ['skill', 'monster', 'combo'].includes(ab.kind);
  });
}
function forget(b, a, turns) {
  if (a.c11f) return a.c11f.kind;
  const sp = forgettable(a, 'spell');
  const sk = forgettable(a, 'skill');
  const kind = sp.length >= sk.length ? 'spell' : 'skill';
  const stash = kind === 'spell' ? sp : sk;
  if (!stash.length) return null;
  const out = new Set(stash);
  a.abilities = a.abilities.filter((id) => !out.has(id));
  a.c11f = { kind, left: turns, stash };
  return kind;
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c11bTurnStart(b, c, ev, stuck) {
  const st = b.c11b;
  if (!st || c.side === 'ally' || st.won || st.lost || c.telegraph) return;
  if (c.id !== st.id) return;
  if (st.kind === 'keeper') return keeperTurn(b, c, ev, stuck);
  return oboroTurn(b, c, ev, stuck);
}
function keeperTurn(b, c, ev, stuck) {
  const st = b.c11b;
  const cf = c11bConf(C11B_KEEPER, b);
  st.acts++;
  ev.upd.push(c);
  if (st.warn) {
    c.telegraph = SWITCH;
    return;
  }
  if (stuck) return;
  st.left--;
  if (st.left > 0) return;
  st.warn = true;
  const next = st.phase === 'light' ? '暗く' : '明るく';
  ev.lines.push(`${KEEPER_SHORT}のランプが、ちらちらと、またたきはじめた…！`, `（次に、ランプが${next}なる！かわる時に、光の波が来る。「防御」でそなえよう！）`);
  ev.c11bWarn = { id: c.id, next: st.phase === 'light' ? 'dark' : 'light' };
  ev.warn = true;
  void cf;
}
function oboroTurn(b, c, ev, stuck) {
  const st = b.c11b;
  const cf = c11bConf(C11B_OBORO, b);
  st.acts++;
  ev.upd.push(c);
  tenninBack(b, ev);
  if (stuck) return;
  if (st.robeReady) {
    c.telegraph = ROBE;
    return;
  }
  if (st.flashReady) {
    c.telegraph = FLASH;
    return;
  }
  st.robeLeft--;
  st.flashLeft--;
  if (st.robeLeft <= 0) {
    // だれも えらんで いない（完全オート・人が みんな たおれた）時は、衣が 早い（robe.auto）… よびかけないと 勝てない
    st.robeLeft = someoneChooses(b) ? cf.robe.every : Math.min(cf.robe.every, cf.robe.auto ?? cf.robe.every);
    robeUp(b, c, ev);
    return;
  }
  if (st.flashLeft <= 0) {
    st.flashLeft = cf.flash.every;
    st.flashReady = true;
    ev.lines.push(`${OBORO_SHORT}の衣が、ぼうっと白く光りはじめた…！`, '（次に「わすれの光」が来る！当たると、呪文か特技をわすれてしまう。「防御」でふせげる！）');
    ev.c11bFlashUp = { id: c.id };
    ev.warn = true;
  }
}
function robeUp(b, c, ev, again = false) {
  const st = b.c11b;
  st.robeReady = true;
  const left = st.max - st.forget;
  ev.lines.push(
    again ? `${OBORO_SHORT}は、もう一度、わすれの衣を、ふわりとひろげた…！` : `${OBORO_SHORT}が、うすい衣を、ふわりとひろげた…！`,
    `（次に、スピカに「わすれの衣」がかかる！思い出が、あと${left - 1}になる…。${left <= 2 ? '今すぐ「よびかける」で、スピカの名前をよぼう！' : '「よびかける」で、スピカの名前をよぼう！'}）`,
  );
  ev.c11bRobeUp = { id: c.id, forget: st.forget, again };
  ev.warn = true;
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c11bEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c11bSwitch': lampSwitch(b, c, ev); return true;
    case 'c11bRobe': robe(b, c, ev); return true;
    case 'c11bFlash': flash(b, c, ev); return true;
    case 'c11bCall': call(b, c, ev); return true;
    case 'c11bDrop': drop(b, c, ev); return true;
    case 'c11bBow': {
      ev.lines.push(`${OBORO_SHORT}「…どうか、おとなしく、ひめさまをおわたしください。」`);
      ev.c11bBow = { id: c.id };
      return true;
    }
    default: return false;
  }
}
// 明かりが かわる（全体攻撃。身を 守ると へる）
function lampSwitch(b, c, ev) {
  const st = b.c11b;
  const cf = c11bConf(C11B_KEEPER, b);
  if (!st || st.kind !== 'keeper') return;
  st.warn = false;
  st.left = cf.every;
  st.phase = st.phase === 'light' ? 'dark' : 'light';
  st.switches++;
  st.waves++;
  ev.fx = { type: 'ability', anim: st.phase === 'dark' ? 'c11k_dark' : 'c11k_light', actor: c.id, targets: b.aliveAllies().map((x) => x.id), side: 'enemy' };
  ev.lines.push(st.phase === 'dark' ? 'ランプの光が、ふっと消えた！あたりが、暗くなった…！' : 'ランプが、ぱあっと、まぶしく光った！');
  for (const t of b.aliveAllies()) {
    const guard = !!t.defending;
    if (guard) st.waveGuards++;
    b.physHit(c, t, { mult: cf.wave.mult * (guard ? cf.wave.guardCut : 1), acc: 9 }, ev, 'phys');
  }
  post(ev).push(st.phase === 'dark' ? '（暗い間は、呪文が効きにくい！物理でこうげきしよう！）' : '（明るい間は、物理が効きにくい！呪文でこうげきしよう！）');
  ev.c11bSwitch = { id: c.id, phase: st.phase };
  ev.warn = true;
  ev.upd.push(c);
}
// わすれの 衣（スピカの わすれ ＋1。max で つれて いかれて 負け）
function robe(b, c, ev) {
  const st = b.c11b;
  const cf = c11bConf(C11B_OBORO, b);
  if (!st || st.kind !== 'oboro') return;
  st.robeReady = false;
  st.robes++;
  st.forget = Math.min(st.max, st.forget + 1);
  st.peak = Math.max(st.peak, st.forget);
  ev.fx = { type: 'ability', anim: 'c11o_robe', actor: c.id, targets: [c.id], side: 'enemy' };
  const left = st.max - st.forget;
  ev.lines.push('うすい衣が、スピカに、ふわりとかかった…。');
  ev.c11bRobe = { id: c.id, forget: st.forget, left };
  ev.warn = true;
  ev.upd.push(c);
  if (left <= 0) {
    st.lost = true;
    post(ev).push(
      'スピカ「……。」',
      'スピカは、何も言わずに、雲の車のほうへ、歩いていく…。',
      `${OBORO_SHORT}「ひめさま。まいりましょう。」`,
      'スピカは、雲の車に、つれていかれてしまった…。',
    );
    ev.c11bTaken = { id: c.id };
    b.pendingEnd = { outcome: 'lose' };
    b.queue = [];
    return;
  }
  ev.lines.push(left === 1 ? 'スピカ「…あなたたち、だあれ…？　…ううん、知ってる…はず…」' : 'スピカ「…あれ？　わたし、どうして、ここに…？」');
  post(ev).push(`（スピカの思い出　あと${left}）`);
  // HPが 半分を 切ると、つづけて もう 1回（すぐ 次の 前ぶれ）
  if (c.hp <= c.maxHp * 0.5 && b.rng.chance(cf.robe.twice)) {
    st.twice++;
    robeUp(b, c, { ...ev, lines: post(ev) }, true);
    ev.c11bRobeUp = { id: c.id, forget: st.forget, again: true };
  }
}
// わすれの 光（全体。身を 守ると わすれない）
function flash(b, c, ev) {
  const st = b.c11b;
  const cf = c11bConf(C11B_OBORO, b);
  if (!st || st.kind !== 'oboro') return;
  st.flashReady = false;
  st.flashes++;
  const targets = b.aliveAllies();
  ev.fx = { type: 'ability', anim: 'c11o_flash', actor: c.id, targets: targets.map((x) => x.id), side: 'enemy', element: 'light' };
  const hit = [];
  const kept = [];
  for (const t of targets) {
    const r = b.calcMagic(c, t, { base: cf.flash.base, thr: 99, element: 'light' }, 1);
    if (r.dmg > 0 && !r.resisted) b.damage(c, t, Math.round(r.dmg), ev, { element: 'light' });
    if (!t.alive) continue;
    if (t.defending) {
      kept.push(t.id);
      st.flashGuards++;
      continue;
    }
    const k = forget(b, t, cf.flash.turns);
    if (!k) continue;
    hit.push(t.id);
    st.forgotHits++;
    post(ev).push(`${t.name}は、${k === 'spell' ? '呪文' : '特技'}を、わすれてしまった！`);
    ev.upd.push(t);
  }
  if (kept.length) post(ev).push(`${kept.map((id) => b.get(id)?.name).join('と')}は、身を守って、光をふせいだ！`);
  if (hit.length) post(ev).push('（ほかの人が「よびかける」と、すぐ思い出す。スピカの「星のうた」でも治る！）');
  ev.c11bFlash = { id: c.id, hit, kept };
  ev.warn = true;
  ev.upd.push(c);
}
// 天人: 月の しずく（オボロを 少し 回復）
function drop(b, c, ev) {
  const o = oboroOf(b);
  if (!o?.alive || o.hp >= o.maxHp) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  const h = Math.min(o.maxHp - o.hp, Math.max(1, Math.round(o.maxHp * 0.02)));
  o.hp += h;
  ev.results = ev.results || [];
  ev.results.push({ id: o.id, heal: h });
  ev.lines.push(`${o.name}のHPが${h}回復した！`);
  ev.c11bDrop = { id: c.id, heal: h };
  ev.upd.push(o);
}
// よびかける（だれでも。ねらいは cmd.choice … 'spica' か 味方の id。ない 時は スピカ）
function call(b, c, ev) {
  const st = b.c11b;
  ev.lines.length = 0;
  // がめんの「スピカの思い出」を すぐ 新しく（オボロの pub）
  const ob = oboroOf(b);
  if (ob) ev.upd.push(ob);
  const ch = b.curCmd?.choice ?? SPICA;
  ev.fx = { type: 'ability', anim: 'c11b_call', actor: c.id, targets: [c.id], side: 'ally' };
  if (!st || st.kind !== 'oboro' || st.won || st.lost) {
    ev.lines.push(`${c.name}は、大きな声でよびかけた！`, 'しかし、何も起こらなかった。');
    ev.c11bCall = { id: c.id, to: ch, ok: false };
    return;
  }
  if (ch === SPICA) {
    ev.lines.push(`${c.name}は、スピカの名前を、大きな声でよんだ！「スピカ！」`);
    if (st.forget > 0) {
      st.forget--;
      st.calls++;
      const left = st.max - st.forget;
      ev.lines.push(`スピカ「…${c.name}…？　…うん、おぼえてる！」`, `スピカの思い出が、1つもどった！（スピカの思い出　あと${left}）`);
      ev.c11bCall = { id: c.id, to: SPICA, ok: true, forget: st.forget, left };
    } else {
      st.wasted++;
      ev.lines.push('スピカは、にっこりわらった。（思い出は、まだ消えていない）');
      ev.c11bCall = { id: c.id, to: SPICA, ok: false, forget: st.forget, left: st.max - st.forget };
    }
    return;
  }
  const t = b.get(ch);
  if (!t || t.side !== 'ally' || !t.alive) {
    ev.lines.push(`${c.name}は、大きな声でよびかけた！`, 'しかし、へんじがない…。');
    ev.c11bCall = { id: c.id, to: ch, ok: false };
    return;
  }
  ev.lines.push(`${c.name}は、${t.name}の名前を、大きな声でよんだ！`);
  if (t === c) {
    ev.lines.push('しかし、自分の名前をよんでも、思い出せない…。');
    ev.c11bCall = { id: c.id, to: t.id, ok: false };
    return;
  }
  if (t.c11f) {
    st.cures++;
    remember(b, t, ev, true);
    ev.lines.push(`${t.name}は、はっと思い出した！（わすれていた技が、また使える！）`);
    ev.c11bCall = { id: c.id, to: t.id, ok: true, cured: true };
    return;
  }
  st.wasted++;
  ev.lines.push(`${t.name}は、げんきに、へんじをした。`);
  ev.c11bCall = { id: c.id, to: t.id, ok: false };
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c11bDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  const st = b.c11b;
  if (!st || st.won || st.lost || t.id !== st.id) return dmg;
  if (st.kind === 'keeper') {
    const cf = c11bConf(C11B_KEEPER, b);
    const phys = !!info?.phys;
    const weak = st.phase === 'light' ? phys : !phys;
    if (weak) {
      st.cutHits++;
      // だれも えらんで いない（完全オート・人が みんな たおれた）時は、もっと ききにくい（cutAuto。設計に ない 足し物 … 前の 幕の けものの linkAuto と 同じ 考え）
      dmg = Math.max(1, Math.round(dmg * (someoneChooses(b) ? cf.cut : cf.cutAuto)));
      if (ev && !ev.c11bCut) {
        ev.c11bCut = true;
        post(ev).push(st.phase === 'light' ? '（まぶしいランプの光で、物理がはじかれた…！）' : '（暗やみに、呪文がすいこまれた…！）');
      }
    } else st.goodHits++;
    return dmg;
  }
  // オボロ: 天人が いる 間は かたい
  const cf = c11bConf(C11B_OBORO, b);
  // だれも えらんで いない（完全オート・人が みんな たおれた）時は、衣に つつまれて もっと かたい（autoK。設計に ない 足し物）
  if (!someoneChooses(b)) dmg = Math.max(1, Math.round(dmg * cf.autoK));
  if (tenninUp(b).length) {
    dmg = Math.max(1, Math.round(dmg * cf.hard));
    if (ev && !ev.c11bHard) {
      ev.c11bHard = true;
      post(ev).push(`（天人が、${OBORO_SHORT}をまもっている…！）`);
    }
  }
  // オボロは たおれない（HP 1 で 止まる → 雲の 車で 引く）
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    oboroDown(b, t, ev);
  }
  return dmg;
}
function oboroDown(b, c, ev) {
  const st = b.c11b;
  st.won = true;
  st.robeReady = false;
  st.flashReady = false;
  c.telegraph = null;
  b.killed.push(c.species);
  for (const e of tenninUp(b)) e.telegraph = null;
  if (ev) {
    post(ev).push(
      `${OBORO_SHORT}「……。」`,
      `${OBORO_SHORT}は、しずかに、衣をたたんだ。`,
      `${OBORO_SHORT}「…今日のところは、引きましょう。」`,
      `${OBORO_SHORT}と天人たちは、雲の車に乗って、空の上へ、引いていった…。`,
    );
    ev.c11bDown = { id: c.id };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── スピカの ごほうび「名前をよぶ声」（battle-c9a.js の glow から。ほのかな光の あと）─────────────
export function c11bGlowCall(b, ev) {
  if (!b?.c11rew?.call || !b.c9sp || b.pendingEnd || b.over || b.c9sp.called) return null;
  const t = b.allies.find((a) => !a.alive && !a.fled && a.kind !== 'guest');
  if (!t) return null;
  b.c9sp.called = t.id;
  Object.assign(t, { alive: true, hp: Math.max(1, Math.round(t.maxHp * CALL_HP)), atb: 0, status: {} });
  const lines = post(ev);
  lines.push(`スピカ「${t.name}！」`, `スピカの、名前をよぶ声がとどいて…${t.name}が、生き返った！`);
  ev.results = ev.results || [];
  ev.results.push({ id: t.id, heal: t.hp });
  ev.upd.push(t);
  ev.c11bName = { to: t.id, hp: t.hp };
  return ev.c11bName;
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// この 幕の 戦いで なければ undefined。ふつうの オートは null
export function c11bPlan(b, c, decide, bestHit) {
  const st = b.c11b;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won || st.lost) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  if (st.kind === 'keeper') return keeperOf(b)?.alive ? keeperPlan(b, c, decide, mode) : null;
  return oboroPlan(b, c, decide, bestHit, mode);
}
// 今の 明かりで いちばん 通る こうげき（呪文・物理の 技・戦う。全体の 技は 1体ぶんで 見る）
export function phaseBest(b, c, t) {
  const st = b.c11b;
  const cf = c11bConf(C11B_KEEPER, b);
  const k = (phys) => ((st.phase === 'light' ? phys : !phys) ? cf.cut : 1);
  const r0 = b.calcPhys(c, t, { mult: 1 }, 1, 'phys', true);
  let best = { cmd: { type: 'attack', target: t.id }, dmg: r0.dmg * r0.hit * k(true) };
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || !['enemy', 'enemies', 'group'].includes(a.target) || a.kind === 'combo' || c.autoOff?.includes(id) || a.noAuto || !canUse(b, c, id)) continue;
    const e = prim(a);
    let dmg = 0;
    if (e.type === 'phys') {
      const r = b.calcPhys(c, t, e, 1, e.element || 'phys', true);
      dmg = r.dmg * r.hit * (e.random ? 1 : e.hits || 1) * k(true);
    } else if (e.type === 'magic') dmg = b.calcMagic(c, t, e, 1, true).dmg * k(false);
    else continue;
    if (dmg > best.dmg) best = { cmd: a.target === 'enemies' ? { type: 'ability', id } : { type: 'ability', id, target: t.id }, dmg };
  }
  return best.dmg > 0 ? best.cmd : null;
}
function keeperPlan(b, c, decide, mode) {
  const st = b.c11b;
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、明かりが かわる 前ぶれで 2回に 1回 身を 守る（完全オートは 守らない）
    if (c.kind === 'player' || !st.warn || c.defending || !someoneChooses(b)) return null;
    b.c11bKAuto = (b.c11bKAuto || 0) + 1;
    return b.c11bKAuto % 2 ? { type: 'defend' } : null;
  }
  if (mode === 'blind') {
    if (st.warn && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    return null;
  }
  // 知って いる 人: 明かりが かわる 前は 身を 守る・だれかが あぶない 時の 回復と 生き返り・ふだんは 今の 明かりで 通る こうげき
  if (st.warn && !c.defending) return { type: 'defend' };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type)) return cmd;
  const k = keeperOf(b);
  if (!k?.alive) return cmd;
  return phaseBest(b, c, k) || cmd;
}
// オボロの 戦いの 人: しくみの 役
function needSpica(b) {
  const st = b.c11b;
  return st.forget >= st.max - 1 || (st.forget >= 1 && st.robeReady);
}
function oboroPlan(b, c, decide, bestHit, mode) {
  const st = b.c11b;
  const canCall = canUse(b, c, YOBIKAKE);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、わすれが 2 いじょうの 時の 3回に 1回 よびかける（数は 自動の 仲間 みんなで 1つ）
    if (c.kind === 'player' || !canCall || !someoneChooses(b) || st.forget < 2 || queued(b, YOBIKAKE, SPICA)) return null;
    b.c11bAuto = (b.c11bAuto || 0) + 1;
    if (b.c11bAuto % AUTO_EVERY) return null;
    st.autoCalls++;
    return { type: 'ability', id: YOBIKAKE, choice: SPICA };
  }
  if (mode === 'blind') {
    // 知らない 人: わすれが 2 いじょうで、たまに 気づいて よびかける・光の 前ぶれに たまに 気づく
    if (canCall && st.forget >= st.max - 1 && !queued(b, YOBIKAKE, SPICA) && b.rng.chance(0.25)) return { type: 'ability', id: YOBIKAKE, choice: SPICA };
    if (st.flashReady && !c.defending && b.rng.chance(0.15)) return { type: 'defend' };
    return null;
  }
  // 知って いる 人
  if (canCall && needSpica(b) && !queued(b, YOBIKAKE, SPICA)) return { type: 'ability', id: YOBIKAKE, choice: SPICA };
  if (st.flashReady && !c.defending && !c.c11f) return { type: 'defend' };
  // わすれた 仲間が 2人 いじょう: 星のうた
  const lost = b.aliveAllies().filter((x) => x.c11f);
  if (lost.length >= 2 && songReady(b) && canUse(b, c, SONG) && !queued(b, SONG)) return { type: 'ability', id: SONG };
  // 回復の 呪文を わすれた 仲間（自分 いがい）: よびかける
  const healer = lost.find((x) => x !== c && x.c11f.kind === 'spell' && x.c11f.stash.some((id) => ['heal', 'revive', 'reviveAll'].includes(prim(ABILITIES[id]).type)) && !queued(b, YOBIKAKE, x.id));
  if (canCall && healer) return { type: 'ability', id: YOBIKAKE, choice: healer.id };
  const cmd = base(b, c, decide);
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type)) return cmd;
  if (cmd?.type === 'defend' || cmd?.type === 'item') return cmd;
  // ねらい: 天人が いれば 天人（HPの 少ない 方）・いなければ オボロ
  const up = tenninUp(b).sort((x, y) => x.hp - y.hp);
  const o = oboroOf(b);
  const t = up[0] || (o?.alive ? o : null);
  if (!t) return cmd;
  if (cmd?.type === 'attack') return { type: 'attack', target: t.id };
  if (a && a.target === 'enemy') return bestHit(b, c, t) || { ...cmd, target: t.id };
  if (a && ['enemies', 'group'].includes(a.target)) return cmd;
  return bestHit(b, c, t) || cmd;
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
export function c11bBusy(b) {
  const st = b.c11b;
  if (!st || st.won || st.lost) return false;
  if (st.kind === 'keeper') return st.warn && !!keeperOf(b)?.alive;
  return st.robeReady || st.flashReady || st.forget >= st.max - 1 || tenninUp(b).length > 0;
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵）─────────────
// 番人: c11bKind 'keeper'・lamp11b（'light'|'dark'）・lampWarn11b（かわる 前ぶれ）・lampLeft11b（かわるまで 番人の 番 いくつ）・keeperStage（曲 1 明るい・2 暗い・3 前ぶれ・4 勝った）
// オボロ: c11bKind 'oboro'・forget11b（わすれの 数）・forgetMax11b・robe11b（衣の 前ぶれ）・flash11b（光の 前ぶれ）・tennin11b（いる 天人の 数）・
//   c11bDown（引いた）・c11bTaken（スピカが つれて いかれた）・oboroStage（曲 1 ふつう・2 前ぶれ・3 思い出 あと 1・4 勝った）
// 天人: c11bKind 'tennin'・back11b（もどるまで あと いくつ。0 … もどらない／いる）
export function c11bPub(c, b = c?._b11b) {
  const o = {};
  const st = b?.c11b;
  if (!st) return o;
  if (st.kind === 'keeper' && c.id === st.id) {
    o.c11bKind = 'keeper';
    o.lamp11b = st.phase;
    o.lampWarn11b = st.warn ? 1 : 0;
    o.lampLeft11b = st.left;
    o.keeperStage = st.won || !c.alive ? 4 : st.warn ? 3 : st.phase === 'dark' ? 2 : 1;
    return o;
  }
  if (st.kind !== 'oboro') return o;
  if (c.id === st.id) {
    o.c11bKind = 'oboro';
    o.forget11b = st.forget;
    o.forgetMax11b = st.max;
    o.robe11b = st.robeReady ? 1 : 0;
    o.flash11b = st.flashReady ? 1 : 0;
    o.tennin11b = tenninUp(b).length;
    o.c11bDown = st.won ? 1 : 0;
    o.c11bTaken = st.lost ? 1 : 0;
    o.oboroStage = st.won ? 4 : st.max - st.forget <= 1 ? 3 : st.robeReady || st.flashReady ? 2 : 1;
    return o;
  }
  if (c.c11t) {
    o.c11bKind = 'tennin';
    o.back11b = !c.alive && c.c11t.dead && !c.c11t.gone ? c.c11t.left : 0;
    o.gone11b = c.c11t.gone ? 1 : 0;
  }
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: call11b（よびかける が ある 戦い）・forgot11b（わすれて いる 物 'spell'|'skill'。ない 時は null）・forgotLeft11b
export function c11bAllyPub(c, b = c?._b11b) {
  const o = {};
  const st = b?.c11b;
  if (!st || st.kind !== 'oboro') return o;
  o.call11b = 1;
  // ない 時も null を 出す（がめんは 前の 値に 足して いく ので、消さないと しるしが のこる）
  o.forgot11b = c.c11f ? c.c11f.kind : null;
  o.forgotLeft11b = c.c11f ? c.c11f.left : null;
  return o;
}
