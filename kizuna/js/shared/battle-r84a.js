// 第84回 A班: 幽☆遊☆白書の 系統（一発の 重い 格闘家）の 戦いの しかけ（data/jobs-r84a.js・data/abilities-r84a.js。docs/plan-r84-jobs-a.md）
//
// ■ れい丸の 数（c.r84aRei … のこりの 数。戦いの 人〈combatant〉に だけ 持つ。キャラ・セーブ・引っこしコードには 足さない）
//   ・れい丸の 技（effect.rei の ある phys）は、MP の ほかに「れい丸」を 使う。のこりが 足りない 時は えらべない
//     （battle.js の validate・ai.js の canUse・client/battle.js の 技の 一覧〈うすく・わけを 出す〉）
//   ・戦い 1回に 持てる 数（reiMax）は 今の 職業の 段: ふりょう 0・れい界探てい 2・うら飯ゆう助 4・魔界の王の子 6（REI_BY_TIER）。
//     戦いの はじめは まんたん（c.r84aRei が まだ ない ＝ まんたん）
//   ・ほかの 職業に 転職した あと（覚えた 技は どの 職業でも 使える）: れい丸の 技を 1つでも 覚えて いれば 2発（OTHER_REI）。
//     この 系統の ふりょうに もどった 時も 2発（覚えて いれば）
//   ・「れい力をためる」で 1発・「とう気をねる」で 2発 もどる（上限まで。type 'r84aCharge'）
//   ・のこりを ぜんぶ うつ 技（rei.all）: うった 数で 強さが かわる（base ＋ per × 数 ／ hitsPer … 数 × hitsPer 回 当てる。upTo … うつ 数の 上限）。
//     min 発 いじょう ないと えらべない（超・れい丸は 2）
//   ・家族 みんなの 画面: 仲間の まどに「れい丸3」の 札（pub の r84aRei）
// ■ 1回だけ 立ち上がる（jobs の passive.rise。うら飯ゆう助・魔界の王の子。味方だけ）
//   ・攻撃の ダメージで HP が 0 に なった 時、戦い 1回に 1度だけ、たおれずに HP（最大HP × rise.hp）で 立ち上がる（c.r84aRose）。
//     伝説は そのあと rise.acts 回の 行動の 間 物理の 力が rise.pow 倍（c.r84aRise）
//   ・順番: battle.js の damage の さいご（かばう・作戦・おすわり などで へらした あとの ダメージで 0 に なった 時）。
//     たおれる 前に 立ち上がるので、ほかの 生き返り（ザオラル などの 呪文・ゲームの神の ロード・道具）より いつも 先。
//     生き返った あとでも 2回めは ない（その 戦いで 1回だけ）
//   ・立ち上がらない 時: 毒・はね返りの ダメージ・ボスの「そくし」あつかいの しかけ（ハデロスの けいやくしょ など、kill を 直接 よぶ もの）。
//     全めつの 判定（checkEnd）は 生きて いる 人を 数えるだけ なので、立ち上がった 人が いれば 戦いは つづく
// ■ 合体技の 強さ（battle-dual.js の memberPower）: れい丸の 技は 使う 数の √ で わって 数える（reiDualMult。合体技は れい丸を 使わない）
// ■ 仲間のために（c.r84aNakama = { left, base, per, cap }）: left 回の 行動の 間、物理の 力が base ＋ per × たおれた 仲間の 数（cap まで）
// ■ オート（ai.js の decideAlly から r84aPlan・chooseAttack から r84aAdjust）
//   ・れい丸の 技は 強い 敵（ボス・すぐ たおせない 敵）にだけ。ざこには むだに しない
//   ・のこりを ぜんぶ うつ 技は、れい丸が まんたんの 時だけ（へって いる 時は 1発ずつ）
//   ・れい丸が 0 に なったら、強い 敵なら れい力をためる（とう気をねる）・ほかは こぶしの 技
//   ・たおれた 仲間が いれば 仲間のために
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { JOBS } from './data/jobs.js?v=47d41c6909c7';
import { ABILITIES } from './data/abilities.js?v=47d41c6909c7';
import { mpCost } from './stats.js?v=47d41c6909c7';

export const R84A_LINE = ['furyo', 'reikai_tantei', 'yusuke', 'makai_prince'];
// 段ごとの れい丸の 数（[基本職, 上級職, 超級職, 伝説]）・ほかの 職業に 転職した あと
export const REI_BY_TIER = [0, 2, 4, 6];
export const OTHER_REI = 2;

const partsOf = (e) => (e?.type === 'multi' ? e.parts || [] : [e || {}]);
// れい丸を 使う 技か（effect.rei）
export const reiOf = (a) => partsOf(a?.effect).find((p) => p.rei)?.rei || null;
const REI_IDS = () => Object.keys(ABILITIES).filter((id) => reiOf(ABILITIES[id]));
let reiIds = null;
const knowsRei = (c) => {
  reiIds = reiIds || new Set(REI_IDS());
  return (c?.abilities || []).some((id) => reiIds.has(id));
};

// 戦い 1回に 持てる れい丸の 数（c … 戦いの 人・pub）
export function reiMax(c) {
  if (!c || c.mon) return 0;
  const other = knowsRei(c) ? OTHER_REI : 0;
  // 第86回 B班: 職業の データに れい丸の 数が ある（天下一の格闘王 8発。jobs-r86b.js の reiMax）
  if (JOBS[c.job]?.reiMax) return Math.max(JOBS[c.job].reiMax, other);
  if (R84A_LINE.includes(c.job)) return Math.max(REI_BY_TIER[JOBS[c.job]?.tier ?? 0] || 0, other);
  return other;
}
// のこりの れい丸（まだ 1発も うって いなければ まんたん）
export function reiLeft(c) {
  const max = reiMax(c);
  if (!max) return 0;
  const n = c.r84aRei;
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : max;
}
// その 技に いる れい丸の 数（れい丸を 使わない 技は 0）
export function reiNeed(a) {
  const r = reiOf(a);
  if (!r) return 0;
  return r.all ? Math.max(1, r.min || 1) : Math.max(1, r.use || 1);
}
// れい丸が 足りるか（れい丸を 使わない 技は いつも true）
export function reiOk(c, a) {
  const need = reiNeed(a);
  return !need || reiLeft(c) >= need;
}
// えらべない わけ（足りる 時は null）
export function reiReason(c, a) {
  if (reiOk(c, a)) return null;
  const left = reiLeft(c);
  if (!reiMax(c)) return 'れい丸をうてない';
  return left <= 0 ? 'れい丸がもうない' : `れい丸が${reiNeed(a)}発いる（のこり${left}発）`;
}

// ───────────── れい丸の 技（battle.js の applyAbility の 'phys' の はじめ） ─────────────
export function r84aPhys(b, c, a, cmd, ev, powMult, targets) {
  const { rei, ...rest } = a.effect;
  const have = reiLeft(c);
  const need = reiNeed(a);
  if (have < need) {
    // 命令を 出した あとで 足りなく なった（ふつうは validate・canUse で えらべない）。MP は 返す
    ev.lines.push('しかし、れい丸がもうない！');
    if (c.side === 'ally' && ev.ability) c.mp = Math.min(c.maxMp, c.mp + mpCost(c.penChar, ev.ability));
    ev.upd.push(c);
    return;
  }
  const shots = rei.all ? Math.min(have, rei.upTo || have) : need;
  c.r84aRei = have - shots;
  if (rei.all) {
    if (rei.hitsPer) rest.hits = shots * rei.hitsPer;
    if (rei.per) rest.mult = (rei.base || 0) + rei.per * shots;
  }
  b.applyAbility(c, { ...a, effect: rest }, cmd, ev, powMult, targets);
  if (ev.fx) ev.fx.rei = shots;
  ev.lines.push(`（れい丸を${shots}発うった。のこり${c.r84aRei}発）`);
  ev.upd.push(c);
}

// 物理の 力の 倍（battle.js の calcPhys）: 仲間のために・立ち上がった あとの 力・オートの みつもり（のこりを ぜんぶ うつ 技）
const deadMates = (b, c) => (b?.combatants || []).filter((x) => x.side === c.side && x !== c && !x.alive && !x.fled).length;
// （合体技の 2人の かげ〈battle.js の dualProxy。Object.create〉には のらない: 自分の 項目〈own〉だけ 見る）
const own = (c, k) => (c && Object.prototype.hasOwnProperty.call(c, k) ? c[k] : undefined);
export function nakamaMult(b, c) {
  const N = own(c, 'r84aNakama');
  if (!N || !(N.left > 0)) return 1;
  return Math.min(N.cap || 1.7, (N.base || 1.1) + (N.per || 0.2) * deadMates(b, c));
}
export function r84aPhysMult(b, c, t, eff, estimate = false) {
  let m = nakamaMult(b, c);
  const R = own(c, 'r84aRise');
  if (R?.left > 0) m *= R.pow || 1;
  const r = eff?.rei;
  if (estimate && r?.all) {
    const n = Math.min(reiLeft(c), r.upTo || Infinity);
    if (n < (r.min || 1)) return 0;
    if (r.hitsPer) m *= n * r.hitsPer;
    if (r.per) m *= ((r.base || 0) + r.per * n) / (eff.mult || 1);
  }
  return m;
}

// 合体技の 強さの 見つもり（battle-dual.js の memberPower）: れい丸の 技は 使う 数（うつ 数）の √ で わる
//   （1発の 技は そのまま・2発の 技は 0.71倍・6発 ぜんぶ うつ 技は 0.41倍。合体技は れい丸を 使わないので、何発ぶんも まとめて 数えない）
export function reiDualMult(c, a) {
  const r = reiOf(a);
  if (!r) return 1;
  const n = r.all ? Math.min(reiLeft(c), r.upTo || Infinity) : r.use || 1;
  return 1 / Math.sqrt(Math.max(1, n));
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export const R84A_TYPES = ['r84aCharge', 'r84aNakama'];
export function r84aEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'r84aCharge': {
      const max = reiMax(c);
      if (!max) {
        ev.lines.push('しかし、れい丸はうてない…');
        return true;
      }
      const before = reiLeft(c);
      c.r84aRei = Math.min(max, before + (eff.add || 1));
      const got = c.r84aRei - before;
      ev.lines.push(got > 0 ? `れい丸が${got}発もどった！（のこり${c.r84aRei}発）` : `れい丸は、もういっぱいだ！（${max}発）`);
      ev.upd.push(c);
      return true;
    }
    case 'r84aNakama': {
      c.r84aNakama = { left: eff.left || 3, base: eff.base, per: eff.per, cap: eff.cap };
      const n = deadMates(b, c);
      ev.lines.push(n > 0 ? `たおれた仲間の思いが、${c.name}の力になる！` : `${c.name}の力が上がった！`);
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// ───────────── 行動の はじめ（battle.js の executeNext・身を 守る） ─────────────
export function r84aTurnStart(b, c, ev) {
  if (c.r84aNakama) {
    c.r84aNakama.left--;
    if (c.r84aNakama.left <= 0) delete c.r84aNakama;
    ev.upd.push(c);
  }
  if (c.r84aRise) {
    c.r84aRise.left--;
    if (c.r84aRise.left <= 0) delete c.r84aRise;
    ev.upd.push(c);
  }
}

// ───────────── 1回だけ 立ち上がる（battle.js の damage。kill の 前） ─────────────
export const riseOf = (c) => (c?.side === 'ally' && !c.mon ? JOBS[c.job]?.passive?.rise || null : null);
export const RISE_WORDS = ['「まだ、終わってねえ！」', '「へっ…これくらいで、ねてられるかよ！」'];
// 立ち上がったら true（t.hp が 1 いじょうに なる）
export function r84aRise(b, t, ev) {
  if (!t || !t.alive || t.hp > 0 || t.r84aRose || t.fled) return false;
  const R = riseOf(t);
  if (!R) return false;
  t.r84aRose = true;
  t.hp = Math.max(1, Math.round(t.maxHp * (R.hp || 0.3)));
  if (R.pow && R.acts) t.r84aRise = { left: R.acts, pow: R.pow };
  ev.lines.push(`${t.name}は、ひざをついた…`, `${t.name}${RISE_WORDS[R.pow ? 1 : 0]}`, `${t.name}は、もう一度立ち上がった！`);
  if (R.pow) ev.lines.push(`${t.name}の力が、はね上がった！`);
  ev.results = ev.results || [];
  ev.results.push({ id: t.id, heal: t.hp, rise: true });
  ev.r84aRise = t.id;
  ev.upd.push(t);
  return true;
}

// クライアントに 見せる（pub）
export function r84aPub(c) {
  const out = {};
  const max = reiMax(c);
  if (max) out.r84aRei = { n: reiLeft(c), max };
  if (c.r84aNakama) out.r84aNakama = c.r84aNakama.left;
  if (c.r84aRise) out.r84aRise = c.r84aRise.left;
  if (riseOf(c)) out.r84aRose = !!c.r84aRose;
  return out;
}

// ───────────── オート ─────────────
// れい丸が 0 の 時に ためる わりあい（強い 敵の 時）
export const CHARGE_CHANCE = 0.4;
// decideAlly の 4.9 の あと（mine … 使える 技 [{ id, a }]、fw … ai.js の fightWeight）
export function r84aPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length) return null;
  const find = (type) => mine.filter(({ a }) => partsOf(a.effect).some((p) => p.type === type));
  const charge = find('r84aCharge');
  const nakama = find('r84aNakama')[0];
  if (!charge.length && !nakama) return null;
  const hard = !!fw?.hard;
  // 仲間のために: たおれた 仲間が いる（ボスでは ときどき いなくても）
  const dead = deadMates(b, c);
  if (nakama && hard && !c.r84aNakama && ((dead >= 1 && b.rng.chance(0.6)) || (b.boss && b.rng.chance(0.1)))) return { type: 'ability', id: nakama.id };
  // れい丸が 0: 強い 敵なら ためる（HP が へって いれば HP も もどる とう気を 先に）
  const max = reiMax(c);
  if (charge.length && max && reiLeft(c) <= 0 && hard && b.rng.chance(CHARGE_CHANCE)) {
    const heals = (x) => partsOf(x.a.effect).some((p) => p.type === 'heal');
    const pick = c.hp / c.maxHp < 0.6 ? charge.find(heals) || charge[0] : charge.slice().sort((x, y) => (y.a.effect.add || 2) - (x.a.effect.add || 2))[0];
    return { type: 'ability', id: pick.id };
  }
  return null;
}

// のこりを ぜんぶ うつ 技を まんたんの 時に えらびやすく する 倍（一気に うつ 見せ場）
export const ALL_FULL = 1.6;
// chooseAttack の えらぶ 前（opts … { cmd, score, final }。fw … fightWeight）: ざこに れい丸を 使わない・ぜんぶ うつ 技は まんたんの 時
export function r84aAdjust(b, c, opts, fw) {
  const max = reiMax(c);
  if (!max) return;
  for (const o of opts) {
    if (o.cmd?.type !== 'ability') continue;
    const r = reiOf(ABILITIES[o.cmd.id]);
    if (!r) continue;
    if (!fw?.hard) o.final *= 0.02;
    else if (r.all) o.final *= reiLeft(c) >= max ? ALL_FULL : 0.3;
  }
}
