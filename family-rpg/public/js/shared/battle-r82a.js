// 第82回 A班: 犬夜叉の 系統の 戦いの しくみ（docs/plan-jobs-r79.md の 8-1・8-3。docs/plan-r82-jobs-a.md）
// どれも 戦いの 中だけ（c.youkai など 戦いの 中の 人に つける。キャラ〈セーブ〉には 何も 足さない）
//
// 1. ようかい化（jobs の passive.youkai … 力と 素早さの 倍。基本職 1.3 → 伝説 1.6）
//    ・自分の 番の はじめに HP が YOUKAI_AT（3わり）いか → ようかい化（c.youkai）。力と 素早さが passive.youkai 倍
//    ・刀（剣の 武器）を 持って いる 間は ならない（つめ・素手の 時だけ。clawHand）
//    ・ようかい化の 間は 命令を 聞かない: 「めいれいさせろ」の 人にも コマンドを 出さず、自動で つめで あばれる（youkaiCmd）
//      battle.js の onReady が youkaiAuto で コマンドを 出さない。pub の youkai で 家族 みんなの 画面に しるし（client/battle-r82a.js）
//    ・HP が YOUKAI_OFF（半分）より 上に もどる・「おすわり！」・「よう力をおさえる」で もどる。もどった あと しばらく（youkaiCalm 回）ならない
// 2. 大よう化・せいぎょ（こうか daiyoukai）: turns 回の 行動の 間、命令できる まま ようかい化の 力（c.youkaiCtl）。武器は 何でも よい
// 3. おすわり！（こうか osuwari）: 仲間1人が 地面に めりこむ（c.osuwari）。次に 敵から 受ける ダメージが 半分・ようかい化が おさまる
// 4. 風の技（phys の vsBuff）: 自分を 強くして いる 敵（バフ・力ため）には vsBuff 倍（強くして いる 数 2つ・3つで +0.1 ずつ）
//    phys の youkaiMult: ようかい化（大よう化も）の 間は その 倍
// 5. ばくりゅうは（こうか bakuryu）: かまえ（c.stance.kind = 'bakuryu'）。次の 自分の 番までに 敵の 呪文・ブレス・ためた 大技
//    （真・ばくりゅうはは 物理の 技も）を 受けると、その ダメージは 半分に なり、行動の あとで 風の 属性で 敵全体へ 返す（r82aResolve）
//    ・返す ダメージ = 受ける はずだった ダメージ × ret。ただし 1体ごとに「自分の 物理の cap 倍（守りも 入れた みつもり）」まで（強すぎない ように）
//    ・返すのは かまえ 1回に つき 1回。受けなかった ときは 次の 自分の 番の はじめに 風の 一ふり（敵全体・物理の swing 倍）
// battle.js から よぶ: r82aTurnStart（executeNext の 行動の はじめ）・youkaiAuto（onReady）・youkaiCmd（行動を きめる 前）・
//   r82aEffect（applyAbility の こうか）・r82aPhysMult（calcPhys）・r82aDamage（damage）・r82aResolve（行動の あと）・r82aPub（pub）
// ai.js から よぶ: r82aPlan（オートの 動き）
import { JOBS } from './data/jobs.js';
import { ABILITIES } from './data/abilities.js';
import { mpCost } from './stats.js';

export const YOUKAI_AT = 0.3;
export const YOUKAI_OFF = 0.5;
// もどった あと ようかい化しない 行動の 回数（おすわり！）
export const OSUWARI_CALM = 2;
// ばくりゅうはで 受ける ダメージの わりあい（まきこむ ので 半分）
export const BAKURYU_TAKE = 0.5;
// おすわり！の ダメージの わりあい
export const OSUWARI_TAKE = 0.5;

const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});
export const youkaiRate = (c) => (c?.side === 'ally' ? JOBS[c.job]?.passive?.youkai || 0 : 0);
// つめ・素手（刀を 持って いない）
export const clawHand = (c) => !c?.weaponCat || c.weaponCat === 'claw' || c.weaponCat === 'none';

// 今 ようかい化するか（自分の 番の はじめに 見る）
export function youkaiReady(c) {
  return !!(youkaiRate(c) && c.alive && !c.youkai && !c.youkaiCtl && !(c.youkaiCalm > 0) && clawHand(c)
    && c.maxHp > 0 && c.hp <= c.maxHp * YOUKAI_AT);
}
// 命令を 聞かない（battle.js の onReady。コマンドを 出さずに 自動で 動く）
export const youkaiAuto = (c) => c?.side === 'ally' && (!!c.youkai || youkaiReady(c));

function powerUp(c, m) {
  if (c.yk0) return;
  c.yk0 = { atk: c.atk, agi: c.agi };
  c.atk = Math.round(c.atk * m);
  c.agi = Math.round(c.agi * m);
}
function powerDown(c) {
  if (!c.yk0) return;
  c.atk = c.yk0.atk;
  c.agi = c.yk0.agi;
  delete c.yk0;
}
function enterYoukai(c, ev) {
  c.youkai = true;
  powerUp(c, youkaiRate(c) || 1.3);
  ev.lines.push(`${c.name}の目が赤く光った！ようかいの血があばれだした！`);
  ev.lines.push(`（${c.name}は、ようかい化して命令が聞こえない！）`);
  ev.youkaiOn = c.id;
  ev.upd.push(c);
}
export function exitYoukai(c, ev, line) {
  if (!c.youkai) return false;
  c.youkai = false;
  powerDown(c);
  ev.lines.push(line || `${c.name}は、もとのすがたにもどった。`);
  ev.youkaiOff = c.id;
  ev.upd.push(c);
  return true;
}

// ───────────── 行動の はじめ ─────────────
export function r82aTurnStart(b, c, ev) {
  if (c?.side !== 'ally') return;
  // ばくりゅうはの かまえが とける（返して いなければ 風の 一ふり）
  if (c.stance?.kind === 'bakuryu') {
    const st = c.stance;
    c.stance = null;
    ev.upd.push(c);
    if (c.alive && !c.status?.sleep && !c.status?.paralyze) swing(b, c, st, ev);
  }
  if (c.youkaiCalm > 0) c.youkaiCalm--;
  // 大よう化・せいぎょの のこり
  if (c.youkaiCtl) {
    if (c.youkaiCtl.left <= 0) {
      c.youkaiCtl = null;
      powerDown(c);
      ev.lines.push(`${c.name}の大ようの力が、おさまった。`);
      ev.youkaiOff = c.id;
      ev.upd.push(c);
    } else c.youkaiCtl.left--;
  }
  if (!c.alive) return;
  // HP が 半分より 上に もどった（刀に もちかえる ことは 戦いの 中では ないが、念の ため）
  if (c.youkai && (c.hp > c.maxHp * YOUKAI_OFF || !clawHand(c))) {
    exitYoukai(c, ev, `${c.name}のようかいの血が、しずまった。もとのすがたにもどった。`);
    c.youkaiCalm = Math.max(c.youkaiCalm || 0, 1);
  }
  if (youkaiReady(c)) enterYoukai(c, ev);
}

// 受けなかった ばくりゅうは: 敵全体に 風の 一ふり
function swing(b, c, st, ev) {
  const foes = b.sideOf(c, false).filter((x) => x.alive);
  if (!foes.length) return;
  ev.lines.push(`${c.name}は、かまえをといて、風の一ふり！`);
  for (const t of foes) b.physHit(c, t, { mult: st.swing || 0.8 }, ev, 'wind', st.pow || 1);
  ev.bakuryuSwing = c.id;
}

// ───────────── ようかい化の 間の 行動（命令を 聞かない） ─────────────
// へんじ: かわりの コマンド（ようかい化して いない ときは null）
export function youkaiCmd(b, c, cmd, ev) {
  if (c?.side !== 'ally' || !c.youkai || cmd?.type === 'incapacitated') return null;
  const foes = b.aliveEnemies().filter((f) => !f.burrow);
  if (!foes.length) return { type: 'defend' };
  const t = b.rng.pick(foes);
  ev.lines.push(`${c.name}は、ようかいの血のままにあばれている！`);
  ev.youkaiAct = c.id;
  // つめの 技（MP が たりる 物）を ときどき。いちばん 強い 物
  const claws = (c.abilities || []).filter((id) => {
    const a = ABILITIES[id];
    if (!a || a.hidden || a.weapon !== 'fist' || prim(a).type !== 'phys' || !['enemy', 'enemies'].includes(a.target)) return false;
    return mpCost(c.penChar, id) <= c.mp;
  });
  if (claws.length && b.rng.chance(0.45)) {
    const power = (id) => {
      const e = prim(ABILITIES[id]);
      return (e.mult || 1) * (e.hits || 1) * (e.youkaiMult || 1) * (ABILITIES[id].target === 'enemies' ? Math.min(3, foes.length) : 1);
    };
    const id = claws.sort((x, y) => power(y) - power(x))[0];
    return { type: 'ability', id, target: t.id, youkai: true };
  }
  return { type: 'attack', target: t.id, youkai: true };
}

// ───────────── 技の こうか ─────────────
// へんじ: この ファイルの こうかなら true
export function r82aEffect(b, c, a, eff, ev, targets, powMult = 1) {
  switch (eff.type) {
    case 'osuwari': {
      for (const t of targets) {
        if (!t.alive) continue;
        t.osuwari = true;
        ev.lines.push(`${t.name}は、ずどーん！と地面にめりこんだ！`);
        exitYoukai(t, ev, `${t.name}のようかい化が、おさまった！`);
        if (youkaiRate(t)) t.youkaiCalm = Math.max(t.youkaiCalm || 0, OSUWARI_CALM);
        ev.lines.push(`（${t.name}が次に受けるダメージは、半分になる）`);
        ev.osuwari = t.id;
        ev.upd.push(t);
      }
      return true;
    }
    case 'youkaiCalm': {
      exitYoukai(c, ev, `${c.name}のようかい化が、おさまった！`);
      c.youkaiCalm = Math.max(c.youkaiCalm || 0, eff.acts || 3);
      ev.lines.push(`${c.name}は、しばらくようかい化しない。`);
      ev.upd.push(c);
      return true;
    }
    case 'daiyoukai': {
      exitYoukai(c, ev, `${c.name}は、あばれる血を、自分の心でおさえこんだ！`);
      // 倍は 技の mult（せいぎょ して いる ぶん、あばれる ようかい化より 少し ひかえめ。ない 時は passive.youkai）
      if (!c.youkaiCtl) powerUp(c, eff.mult || youkaiRate(c) || 1.6);
      c.youkaiCtl = { left: eff.turns || 3 };
      ev.lines.push(`${c.name}は、大ようの力を自分のものにした！（攻撃力と素早さが上がった）`);
      ev.youkaiOn = c.id;
      ev.upd.push(c);
      return true;
    }
    case 'bakuryu': {
      c.stance = { kind: 'bakuryu', ret: eff.ret ?? 1, cap: eff.cap ?? 3, swing: eff.swing ?? 0.8, phys: !!eff.phys, name: a.name, pow: Math.min(1, powMult || 1) };
      ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: [c.id], side: c.side };
      ev.lines.push(eff.phys ? '（敵の大技も、物理の大技も、待ちかまえている…！）' : '（敵の呪文・ブレス・大技を、待ちかまえている…！）');
      ev.bakuryuSet = c.id;
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// ───────────── ダメージの 計算 ─────────────
// 物理の ダメージに かける 数（風の技の vsBuff・ようかい化の youkaiMult）
export function buffCount(t) {
  let n = 0;
  for (const [k, v] of Object.entries(t?.buffs || {})) if (v && k !== 'eva') n++;
  if (t?.charge > 1) n++;
  return n;
}
export function r82aPhysMult(c, t, eff = {}) {
  let m = 1;
  if (eff.vsBuff) {
    const n = buffCount(t);
    if (n > 0) m *= eff.vsBuff + 0.1 * Math.min(2, n - 1);
  }
  if (eff.youkaiMult && (c?.youkai || c?.youkaiCtl)) m *= eff.youkaiMult;
  return m;
}

// ばくりゅうはで 返せる 当たりか
function bigHit(c, ev, st, info) {
  if (ev.big) return true;
  const ab = ev.ability ? ABILITIES[ev.ability] : null;
  if (!ab) return false;
  if (ab.kind === 'spell' || ab.spellLike) return true;
  const parts = ab.effect?.type === 'multi' ? ab.effect.parts || [] : [ab.effect || {}];
  if (parts.some((p) => p.type === 'magic' || p.breath)) return true;
  return !!(st.phys && info?.phys);
}

// 敵から 受ける ダメージ（damage の 中）: おすわり！で 半分・ばくりゅうはで まきこむ。へんじ: 受ける ダメージ
export function r82aDamage(b, c, t, dmg, info, ev) {
  if (t?.side !== 'ally' || !c || c.side === t.side || !(dmg > 0)) return dmg;
  let d = dmg;
  const st = t.stance?.kind === 'bakuryu' ? t.stance : null;
  if (st && t.alive && bigHit(c, ev, st, info)) {
    (ev.bakuryu = ev.bakuryu || []).push({ by: t.id, amount: dmg });
    d = Math.max(1, Math.round(d * BAKURYU_TAKE));
    if (!ev.bakuryuMsg) {
      ev.bakuryuMsg = true;
      ev.lines.push(`${t.name}は、鉄さいがで敵の力を受けとめた！`);
    }
  }
  if (t.osuwari) {
    delete t.osuwari;
    d = Math.max(1, Math.round(d * OSUWARI_TAKE));
    ev.lines.push(`${t.name}は、地面にめりこんでいたので、ダメージが半分になった！`);
    ev.upd.push(t);
  }
  return d;
}

// 返す ダメージ（1体ぶん）。raw … 受ける はずだった ダメージ × ret、cap … 自分の 物理の 何倍まで（守りも 入れた みつもり）
export function bakuryuDamage(b, by, f, raw, st) {
  const cap = b.calcPhys(by, f, { mult: st.cap }, 1, 'phys', true).dmg;
  return Math.max(1, Math.round(Math.min(raw, cap) * (f.resist?.wind ?? 1)));
}

// 行動の あと: 受けとめた 力を 風で 返す
export function r82aResolve(b, ev) {
  const list = ev.bakuryu;
  if (!list) return;
  delete ev.bakuryu;
  delete ev.bakuryuMsg;
  const sum = new Map();
  for (const k of list) sum.set(k.by, (sum.get(k.by) || 0) + k.amount);
  for (const [id, amount] of sum) {
    const t = b.get(id);
    const st = t?.stance;
    if (!t?.alive || st?.kind !== 'bakuryu' || t.status?.sleep || t.status?.paralyze) continue;
    t.stance = null;
    const foes = b.sideOf(t, false).filter((x) => x.alive);
    ev.upd.push(t);
    if (!foes.length) continue;
    ev.lines.push(`${t.name}の${st.name}！受けとめた力を風にまきこんで、はね返した！`);
    const ret = { by: t.id, targets: foes.map((f) => f.id) };
    for (const f of foes) {
      const d = bakuryuDamage(b, t, f, amount * (st.ret ?? 1) * b.rng.float(0.95, 1.05), st);
      b.damage(t, f, d, ev, { element: 'wind' });
    }
    (ev.bakuryuRet = ev.bakuryuRet || []).push(ret);
  }
}

// クライアントに 見せる（pub）: youkai … 0 ふつう / 1 ようかい化（命令が とどかない）/ 2 大よう化・せいぎょ、osuwari … めりこんで いる
// （画面は 前の 中みに Object.assign で かさねるので、仲間には いつも 両方 のせる。もどった ことも とどく）
export function r82aPub(c) {
  if (c.side !== 'ally') return {};
  return { youkai: c.youkai ? 1 : c.youkaiCtl ? 2 : 0, osuwari: !!c.osuwari };
}

// ───────────── オートの 動き（ai.js の decideAlly） ─────────────
// mine … 使える 技（{ id, a }）。へんじ: コマンド か null
export function r82aPlan(b, c, foes, mine, allies) {
  if (!foes.length) return null;
  const has = (type) => mine.filter(({ a }) => (a.effect?.type === 'multi' ? a.effect.parts || [] : [a.effect || {}]).some((p) => p.type === type));
  // 1) ようかい化して あばれて いる 仲間が あぶない: おすわり！
  const osu = has('osuwari');
  if (osu.length) {
    const wild = allies.find((x) => x !== c && x.youkai && x.hp / x.maxHp < 0.2);
    if (wild && b.rng.chance(0.5)) return { type: 'ability', id: osu[0].id, target: wild.id };
  }
  // 2) 自分が つめで HP が へってきた: おすわり！（よう力をおさえる が あれば そちら）。ようかい化の 前に しずめる
  if (youkaiRate(c) && clawHand(c) && !c.youkai && !c.youkaiCtl && !(c.youkaiCalm > 0) && c.hp / c.maxHp < 0.45) {
    const calm = has('youkaiCalm');
    if (calm.length && b.rng.chance(0.7)) return { type: 'ability', id: calm[0].id };
    if (osu.length && b.rng.chance(0.6)) return { type: 'ability', id: osu[0].id, target: c.id };
  }
  // 3) 前ぶれが 見えたら ばくりゅうはの かまえ
  const tele = foes.some((f) => f.telegraph);
  const bk = has('bakuryu');
  if (tele && bk.length && c.stance?.kind !== 'bakuryu' && b.rng.chance(0.85)) {
    const best = bk.sort((x, y) => (y.a.effect.ret || 1) - (x.a.effect.ret || 1))[0];
    return { type: 'ability', id: best.id, target: foes[0].id };
  }
  // 4) 敵が 多ければ 風の技（敵全体）
  // （運を 使うのは 風の技を 持って いる 時だけ。ほかの 職業の オートの ながれを かえない）
  const wind = foes.length >= 3 ? mine.filter(({ a }) => a.target === 'enemies' && prim(a).type === 'phys' && prim(a).vsBuff) : [];
  if (wind.length && b.rng.chance(0.6)) {
    {
      const pw = (x) => (prim(x.a).mult || 1) * (prim(x.a).hits || 1);
      const best = wind.sort((x, y) => pw(y) - pw(x))[0];
      return { type: 'ability', id: best.id, target: foes[0].id };
    }
  }
  // 5) 強い 敵には ときどき 大よう化・せいぎょ
  const dy = has('daiyoukai');
  if (dy.length && b.boss && !c.youkaiCtl && !c.youkai && b.rng.chance(0.2)) return { type: 'ability', id: dy[0].id };
  return null;
}
