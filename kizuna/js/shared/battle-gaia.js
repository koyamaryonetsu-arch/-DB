// 第5章 Step 4「しずみゆく島の古い神殿」の ボス ガイアイーターの 多部位の 戦い（battle.js・battle-ch5.js から 短い よびだしで よぶ）
//
// ・部位（monsters-kumoi.js の gaia）: しっぽ（gaia_tail）・体（gaia_body）・頭（gaia_eater。この 戦いの 本体）。
//   きまった 戦い gaia_eater では 左から しっぽ・体・頭 の じゅんに ならぶ。部位は それぞれ ゲージを ためて 1回ずつ 動く
//   しっぽ … 「土はこび」で 体と 頭の キズを ふさぐ（gaiaFeed。さいだいHPの feed わり）。たおすと 土を はこべなくなる
//   体     … かたい こうら: ふつうの ダメージは shell ばい（合体技・爆発は そのまま）。生きている 間は 頭を まもる
//   頭     … 体が 生きている 間は、頭への ダメージが guard ばい。頭を たおすと のこりの 部位も くずれおちる（minionsFall → 勝ち）
//   前ぶれの ある 大技（GAIA_BIG）: 頭の 大地のみこみ・体の 大地ゆるがし・しっぽの 毒ばりの雨（身を 守ると 半分）
// ・正しい じゅん … しっぽ → 体 → 頭（がめんに「ねらいめ」の しるし。client/battle-gaia.js）
// ・オートの 仲間（ふつう）は 何も かわらない（いつもの ように ダメージの 多い 部位を ねらう。こうらや まもりは 見つもりに 入れない）。
//   シミュレーター（tools/sim-gaia.mjs）の 知っている 人（b.knowsGaia）は、しっぽ → 体 → 頭の じゅんに ねらい、大技が 自分の 番より 先に 来る ときは 身を 守る
import { MONSTERS } from './data/monsters.js?v=a02b94650854';
import { GAIA, GAIA_BODY, GAIA_TAIL } from './data/monsters-kumoi.js?v=a02b94650854';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=a02b94650854';

export { GAIA, GAIA_BODY, GAIA_TAIL };
// 前ぶれの ある 大技（つぎの 番に 出る）
export const GAIA_BIG = ['m_gaia_devour', 'm_gaia_quake', 'm_gaia_needles'];
// ねらう じゅん（左から）
export const GAIA_ORDER = [GAIA_TAIL, GAIA_BODY, GAIA];
// 部位の みじかい 名前（がめん・ことば）
export const PART_NAMES = { tail: 'しっぽ', body: '体', head: '頭' };
// まもり・こうらの ことばを 出す 回数（その あとは がめんの しるしだけ）
export const NOTE_MAX = 2;
const confOf = (m) => MONSTERS[m?.species]?.gaia || null;
const partOf = (b, sp) => b.enemies.find((e) => e.species === sp && e.alive) || null;

// ───────────── はじめ（battle.js の constructor）─────────────
// 頭の 名前を「ガイアイーターの頭」に。はじめの ことば（どの 部位が 何を して いるか）
export function setupGaia(b) {
  const head = b.enemies.find((e) => e.species === GAIA);
  if (!head) return;
  head.baseName = head.name = 'ガイアイーターの頭';
  const lines = [];
  if (partOf(b, GAIA_BODY)) lines.push('ガイアイーターの頭は、かたい体に守られている…！');
  if (partOf(b, GAIA_TAIL)) lines.push('しっぽが、体に島の土をはこんでいる…！');
  if (lines.length) b.emit({ t: 'msg', lines, fx: { type: 'gaia_start' }, dur: 1800 });
}

// その 部位が 今 まもられて いるか（頭: 体が 生きている）・こうらが あるか（体）・土を はこんで もらって いるか（体: しっぽが 生きている）
export function gaiaState(b, m) {
  const conf = confOf(m);
  if (!conf || !m.alive) return null;
  return {
    part: conf.part,
    guarded: conf.part === 'head' && !!partOf(b, GAIA_BODY),
    shell: conf.part === 'body',
    fed: conf.part === 'body' && !!partOf(b, GAIA_TAIL),
  };
}

// 今 いちばん ねらうと よい 部位（しっぽ → 体 → 頭 の じゅんで 生きている もの）
export function gaiaFocus(b) {
  for (const sp of GAIA_ORDER) {
    const p = partOf(b, sp);
    if (p) return p;
  }
  return null;
}

// ───────────── ダメージ（battle.js の damage。templeDamage の あと）─────────────
// 頭: 体が 生きている 間は guard ばい。体: ふつうの ダメージは shell ばい（合体技・爆発は そのまま）。ことばは 1回の 行動で 1回
export function gaiaDamage(b, c, t, dmg, info, ev) {
  if (!c || dmg <= 0 || c.side === t.side) return dmg;
  const conf = confOf(t);
  if (!conf) return dmg;
  let k = 1;
  // ことばは この 戦いで NOTE_MAX 回まで（毎回 長い 文に ならない ように。しるしは がめんに いつも 出る）
  const say = (key, line, post = false) => {
    b.gaiaSaid = b.gaiaSaid || {};
    if ((b.gaiaSaid[key] || 0) >= NOTE_MAX) return;
    b.gaiaSaid[key] = (b.gaiaSaid[key] || 0) + 1;
    if (post) (ev.postLines = ev.postLines || []).push(line);
    else ev.lines.push(line);
  };
  if (conf.part === 'head' && partOf(b, GAIA_BODY)) {
    k = conf.guard ?? 0.4;
    if (!ev.gaiaGuard) {
      ev.gaiaGuard = t.id;
      say('guard', '（かたい体に守られて、頭にダメージがとどきにくい…！）');
    }
  } else if (conf.part === 'body' && !ev.dual && info?.element !== 'blast') {
    k = conf.shell ?? 0.5;
    if (!ev.gaiaShell) {
      ev.gaiaShell = t.id;
      say('shell', '（かたいこうらで、ダメージが半分になった！）');
    }
  } else if (conf.part === 'body' && !ev.gaiaCrack) {
    // 合体技・爆発は こうらを つらぬく
    ev.gaiaCrack = t.id;
    say(ev.dual ? 'dual' : 'blast', ev.dual ? '合体技が、かたいこうらをつらぬいた！' : '爆発が、かたいこうらをつらぬいた！', true);
  }
  return k === 1 ? dmg : Math.max(1, Math.round(dmg * k));
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
// gaiaFeed … しっぽの 土はこび（体と 頭を さいだいHPの pct 回復）/ gaiaEat … 体が 土を 食べる（じぶんを pct 回復）
export function gaiaEffect(b, c, a, eff, ev) {
  if (eff.type !== 'gaiaFeed' && eff.type !== 'gaiaEat') return false;
  const list = eff.type === 'gaiaEat' ? [c] : [partOf(b, GAIA_BODY), partOf(b, GAIA)].filter(Boolean);
  const hit = [];
  for (const t of list) {
    const amt = Math.min(t.maxHp - t.hp, Math.round(t.maxHp * (eff.pct || 0.05)));
    if (amt <= 0) continue;
    t.hp += amt;
    ev.results = ev.results || [];
    ev.results.push({ id: t.id, heal: amt });
    ev.lines.push(`${t.name}のキズが、土でふさがっていく…！（HP${amt}回復）`);
    ev.upd.push(t);
    hit.push(t.id);
  }
  if (!hit.length) ev.lines.push('しかし、ふさぐキズはなかった。');
  ev.fx = { type: 'gaiaFeed', anim: a.anim, actor: c.id, targets: hit, side: 'enemy' };
  return true;
}

// 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）
//   gaiaFeed … 体か 頭が へっている（しっぽの 土はこび）/ gaiaHurt … じぶんが へっている（体の 土を 食べる）
export function gaiaCond(b, m, cond) {
  if (cond === 'gaiaFeed') return [partOf(b, GAIA_BODY), partOf(b, GAIA)].some((p) => p && p.hp < p.maxHp * 0.92);
  if (cond === 'gaiaHurt') return m.hp < m.maxHp * 0.85;
  return null;
}

// ───────────── たおれた（battle-ch5.js の towerKill から）─────────────
// しっぽ・体が たおれた ときの ことば（頭が たおれた あとの くずれおちる 部位には 言わない）
export function gaiaKill(b, t, ev) {
  const conf = confOf(t);
  if (!conf || t.side !== 'enemy' || conf.part === 'head') return;
  if (!partOf(b, GAIA)) return;
  const lines = conf.part === 'tail'
    ? ['しっぽがちぎれた！', 'もう、体に土をはこべない！']
    : ['頭を守っていた体が、くずれおちた！', '頭がむき出しになった！'];
  if (ev) {
    (ev.postLines = ev.postLines || []).push(...lines);
    ev.gaiaPart = { part: conf.part };
  }
}

// ───────────── 知っている 人の オート（battle-ch5.js の towerPlan から。b.knowsGaia）─────────────
// ・大技（前ぶれの あと）が 自分の 番より 先に 来る ときは 身を 守る
// ・しっぽ → 体 → 頭 の じゅんに ねらう（ふつうの えらびかたで 技を きめて、1体を ねらう 技の 相手を かえる）
export function gaiaPlan(b, c, decide) {
  if (c.side !== 'ally' || !b.knowsGaia || b.gaiaInner) return null;
  const focus = gaiaFocus(b);
  if (!focus) return null;
  const mine = 100 / atbRate(c);
  // b.gaiaNoGuard・b.gaiaNoOrder … シミュレーターで 1つずつ はずして くらべる とき
  for (const e of b.gaiaNoGuard ? [] : b.aliveEnemies()) {
    if (GAIA_BIG.includes(e.telegraph) && (100 - e.atb) / atbRate(e) <= mine) return { type: 'defend' };
  }
  if (b.gaiaNoOrder) return null;
  let cmd;
  b.gaiaInner = true;
  try {
    cmd = decide(b, c);
  } finally {
    b.gaiaInner = false;
  }
  const t = cmd?.target ? b.get(cmd.target) : null;
  if (t && t.side === 'enemy' && t !== focus && ['attack', 'ability', 'mahouken'].includes(cmd.type)) return { ...cmd, target: focus.id };
  return cmd;
}

// ───────────── がめんへ（battle.js の pub。battle-ch5.js の towerPub から）─────────────
export function gaiaPub(c) {
  const conf = c.side === 'enemy' ? confOf(c) : null;
  return conf ? { gaiaPart: conf.part } : {};
}
