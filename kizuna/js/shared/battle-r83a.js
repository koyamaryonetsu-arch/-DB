// 第83回 A班: 封神演義の 系統（軍師）の 戦いの しかけ（data/jobs-r83a.js・data/abilities-r83a.js。docs/plan-r83-jobs-a.md）
//
// ■ 作戦（b.r83aPlan = { side, by, kind, pct, boost, boostBy }）
//   ・「作戦を立てる」で 1つ えらぶと、立てた 人（軍師）が たおれるか 作戦を かえる まで、その 側の 仲間全員に ずっと 効く（時間で 切れない）
//       seme   攻め … あたえる ダメージ ＋pct
//       mamori 守り … 受ける ダメージ −pct
//       sokkou 速攻 … 行動ゲージの たまる 速さ ＋pct（太公望から）
//   ・効き目（pct）は 立てた 人の 今の 職業の 段: せん人界の道士 15%・太公望 20%・ほう神の大軍師 25%（SAKUSEN_PCT）
//     ほかの 職業に 転職した あと（覚えた 技は どの 職業でも 使える）: 「作戦を立てる」を 覚えて いれば 攻め・守りを 15%（OTHER_PCT）
//   ・同時に 効くのは 1つだけ。軍師が 2人 いても 足さない（あとから 立てた 作戦が 前の 作戦に かわる ＝ 新しい 方）
//   ・ほう神計画: boost 回（立てた 人の 行動の 回数）の 間、効き目が 2倍
//   ・戦いの 人（combatant）に だけ 持つ。キャラ・セーブ・引っこしコードには 項目を 足さない（戦いごとに 作戦なし から 始まる）
//   ・家族 みんなの 画面: 仲間の まどに「攻め25%」などの 札（pub の r83aPlan。client/battle-r83a.js）
// ■ 強化ふうじ・太極図（c.r83aSeal = { left }）
//   ・敵の ふつうの 強化（攻撃力アップ などの バフ・力ため）を 消して、left 回 行動する 間 強化できなく する（applyBuff・力ため を とめる）
//   ・ボスの しかけ（形態・かまえ・前ぶれ・しるし・ずっと つづく 強化〈left が Infinity。おこった 攻撃力・空を とぶ かいひ など〉）は 消さない
//   ・太極図は 仲間全員の 弱体（デバフ）と 状態異常（毒・ねむり・マヒ・混乱・マヌーサ・マホトーン）も 治す
// ■ 先読みの策（c.r83aSaki）… 次の 自分の 番まで、前ぶれの ある 大技（ev.big）で 仲間全員が 受ける ダメージ 半分
// ■ 守りの旗（c.r83aHata = { left }）… 次に 受ける 1回の ダメージ 半分（left 回 行動したら 消える）
//   受ける ダメージの 下げすぎ ふせぎ: 守りの 作戦・先読みの策・守りの旗を 合わせても 0.45倍まで（身を 守って いる 人は 0.65倍まで。
//   身を 守る 0.5倍と 合わせて 約0.33倍）。CUT_FLOOR
// ■ 軍師の号令・ほう神計画: 仲間の 行動ゲージを まんたんに（すぐ 動ける。自分は のぞく。もう 番が 来て いる 人は そのまま）
// ■ オート（ai.js の decideAlly から r83aPlan）: 前ぶれ → 先読みの策・守りの旗／作戦が ない → 作戦（ボスは 守り・ふつうは 攻め）／
//   敵が 強化 → 太極図（2体 いじょう・仲間も 弱って いる）か 強化ふうじ／ボスで ほう神計画・軍師の号令
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { JOBS } from './data/jobs.js?v=ed660e1d3991';
import { BUFF_ACTS } from './buff-acts.js?v=ed660e1d3991';
// 第86回 B班: 4つ目の 作戦「大魔法の時間」（となえて いる 仲間〈battle-r85a.js〉を 守り、となえて うつ 呪文を 強く する）
import { ABILITIES } from './data/abilities.js?v=ed660e1d3991';
import { chanting } from './battle-r85a.js?v=ed660e1d3991';

export const R83A_LINE = ['fishing_doshi', 'sennin_doshi', 'taikobo', 'hoshin_gunshi'];
// 作戦の 表（ならびは 作戦を立てる メニューの じゅん）
export const SAKUSEN = {
  seme: { name: '攻めの作戦', mark: '攻め', sign: '+', desc: '仲間全員のあたえるダメージが上がる', color: '#ff8a5a' },
  mamori: { name: '守りの作戦', mark: '守り', sign: '-', desc: '仲間全員の受けるダメージが下がる', color: '#6ab8ff' },
  sokkou: { name: '速攻の作戦', mark: '速攻', sign: '+', desc: '仲間全員の番が早く来る', color: '#8ae8a0' },
  // 第86回 B班: 混とんの大軍師だけの 4つ目（jobs-r86b.js の sakusenSet。SAKUSEN_ORDER には 入れない）
  mahou: { name: '大魔法の時間', mark: '大魔法', sign: '', desc: 'となえている仲間の受けるダメージが下がり、となえてうつ呪文が強くなる', color: '#c08aff' },
};
export const SAKUSEN_ORDER = ['seme', 'mamori', 'sokkou'];
// 段ごとの 効き目（[基本職, 上級職, 超級職, 伝説]）・ほかの 職業に 転職した あと
export const SAKUSEN_PCT = [0.15, 0.15, 0.2, 0.25];
export const OTHER_PCT = 0.15;
// ほう神計画の 間の 倍
export const BOOST_MULT = 2;
// 先読みの策・守りの旗の 倍、下げすぎ ふせぎ（ふつう・身を 守って いる 人）
export const SAKI_CUT = 0.5;
export const HATA_CUT = 0.5;
export const CUT_FLOOR = { normal: 0.45, defending: 0.65 };
// 太極図・せん人のもも で 治す 状態異常（水のろう・地われ などの ボスの しかけは 入れない）
export const CURE_STATUSES = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];
const STATUS_NAMES = { sleep: 'ねむり', paralyze: 'マヒ', confuse: '混乱', blind: 'マヌーサ', silence: 'マホトーン', poison: '毒' };

const inLine = (job) => R83A_LINE.includes(job);
const knows = (c, id) => (c?.abilities || []).includes(id);
const partsOf = (e) => (e?.type === 'multi' ? e.parts || [] : [e || {}]);

// その 人が えらべる 作戦（c … 戦いの 人・pub）
export function sakusenSet(c) {
  if (!c || c.mon) return [];
  // 第86回 B班: 職業の データに ある 作戦（混とんの大軍師。jobs-r86b.js の sakusenSet）
  if (JOBS[c.job]?.sakusenSet) return JOBS[c.job].sakusenSet;
  const t = JOBS[c.job]?.tier ?? 0;
  if (inLine(c.job)) return t >= 2 ? SAKUSEN_ORDER : t >= 1 ? SAKUSEN_ORDER.slice(0, 2) : knows(c, 'sd_sakusen') ? SAKUSEN_ORDER.slice(0, 2) : [];
  return knows(c, 'sd_sakusen') ? SAKUSEN_ORDER.slice(0, 2) : [];
}
// その 人が 立てる 作戦の 効き目
export function sakusenPct(c) {
  if (!c) return 0;
  // 第86回 B班: 職業の データに ある 効き目（混とんの大軍師。伝説と おなじ 25%）
  if (JOBS[c.job]?.sakusenPct) return JOBS[c.job].sakusenPct;
  if (inLine(c.job)) return SAKUSEN_PCT[JOBS[c.job]?.tier ?? 0];
  return OTHER_PCT;
}

// 今 効いて いる 作戦（立てた 人が たおれて いたら null）
export function activePlan(b, side = null) {
  const p = b?.r83aPlan;
  if (!p) return null;
  const by = b.get?.(p.by);
  if (!by || !by.alive || by.fled) return null;
  if (side && p.side !== side) return null;
  return p;
}
// 今の 効き目（ほう神計画の 間は 2倍）
export const planPct = (p) => (p ? p.pct * (p.boost > 0 ? BOOST_MULT : 1) : 0);

// 仲間 みんなの 札・速さ（c.r83aPlan = { kind, pct }）を 今の 作戦に そろえる。かわった 人を ev.upd に
function syncPlan(b, ev) {
  const p = activePlan(b);
  for (const x of b.combatants || []) {
    const want = p && p.side === x.side && x.alive ? { kind: p.kind, pct: Math.round(planPct(p) * 100) } : null;
    const cur = x.r83aPlan || null;
    if (cur?.kind === want?.kind && cur?.pct === want?.pct) continue;
    if (want) x.r83aPlan = want;
    else delete x.r83aPlan;
    if (ev) ev.upd.push(x);
  }
}

// 速攻の 作戦（battle.js の speedMult）
export function r83aSpeed(c) {
  return c?.r83aPlan?.kind === 'sokkou' ? 1 + c.r83aPlan.pct / 100 : 1;
}

// ふつうの 強化（ずっと つづく 物〈ボスの しかけ〉は 数えない）。かいひも 数える
export function normalBuffs(t) {
  let n = 0;
  for (const v of Object.values(t?.buffs || {})) if (v && Number.isFinite(v.left)) n++;
  if (t?.charge > 1) n++;
  return n;
}
// ふつうの 強化を 消す（ずっと つづく 物は のこす）
export function r83aDispel(b, t, ev) {
  if (!normalBuffs(t)) return false;
  for (const [k, v] of Object.entries(t.buffs || {})) if (v && Number.isFinite(v.left)) delete t.buffs[k];
  if (t.charge > 1) t.charge = 1;
  ev.lines.push(`${t.name}の強くなっていた力が消えた！`);
  ev.upd.push(t);
  return true;
}
// 強化ふうじ（turns 回 行動する 間）
function seal(b, c, t, turns, ev) {
  r83aDispel(b, t, ev);
  t.r83aSeal = { left: Math.max(turns, t.r83aSeal?.left || 0) };
  ev.lines.push(`${t.name}は、しばらく強化できない！`);
  ev.upd.push(t);
}
// 仲間の 弱体と 状態異常を 治す
function cleanse(b, t, ev) {
  let any = false;
  if (Object.keys(t.debuffs || {}).length) {
    t.debuffs = {};
    ev.lines.push(`${t.name}の弱くなっていた力が元にもどった！`);
    any = true;
  }
  const cured = CURE_STATUSES.filter((s) => t.status?.[s]);
  for (const s of cured) delete t.status[s];
  if (cured.length) {
    ev.lines.push(`${t.name}の${cured.map((s) => STATUS_NAMES[s]).join('と')}が治った！`);
    any = true;
  }
  if (any) ev.upd.push(t);
  return any;
}
// 仲間の 行動ゲージを まんたんに（すぐ 動ける）
function hurry(b, c, t, ev) {
  if (!t?.alive || t.fled || t === c) return false;
  if (t.ready || t.queued) {
    ev.lines.push(`${t.name}は、もう動ける！`);
    return false;
  }
  t.atb = 100;
  ev.lines.push(`${t.name}は、すぐに動けそうだ！`);
  ev.upd.push(t);
  return true;
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export const R83A_TYPES = ['r83aSakusen', 'r83aSeal', 'r83aTaikyoku', 'r83aHata', 'r83aGorei', 'r83aSaki', 'r83aHoshin', 'r83aKeikaku', 'r83aTreasure'];
export function r83aEffect(b, c, a, eff, ev, targets, cmd, powMult = 1) {
  switch (eff.type) {
    case 'r83aSakusen': {
      const set = sakusenSet(c);
      if (!set.length) {
        ev.lines.push('しかし、作戦を立てられなかった…');
        return true;
      }
      let kind = cmd?.sakusen;
      if (!set.includes(kind)) kind = b.boss ? 'mamori' : 'seme';
      const before = activePlan(b);
      const pct = sakusenPct(c);
      b.r83aPlan = { side: c.side, by: c.id, kind, pct, boost: 0, boostBy: null };
      if (ev.fx) ev.fx.plan = kind;
      const S = SAKUSEN[kind];
      ev.lines.push(before && before.side === c.side ? `作戦をかえた！${S.name}だ！` : `${S.name}だ！`, `${S.desc}（${Math.round(pct * 100)}%）`);
      syncPlan(b, ev);
      ev.upd.push(c);
      return true;
    }
    case 'r83aSeal': {
      for (const t of targets) {
        if (!t.alive || t.side === c.side) continue;
        seal(b, c, t, eff.turns || 3, ev);
      }
      return true;
    }
    case 'r83aTaikyoku': {
      ev.lines.push('白と黒の光が、戦いの場を、すべて元にもどしていく…！');
      for (const t of targets) {
        if (!t.alive || t.side === c.side) continue;
        seal(b, c, t, eff.turns || 3, ev);
      }
      for (const x of b.sideOf(c, true)) if (x.alive) cleanse(b, x, ev);
      return true;
    }
    case 'r83aHata': {
      for (const t of targets) {
        if (!t.alive) continue;
        t.r83aHata = { left: eff.left || BUFF_ACTS };
        ev.upd.push(t);
      }
      ev.lines.push('仲間全員、次に受けるダメージが半分になる！');
      return true;
    }
    case 'r83aGorei': {
      const t = targets[0];
      if (!t || t === c) {
        ev.lines.push('しかし、自分に号令をかけることはできない！');
        return true;
      }
      hurry(b, c, t, ev);
      return true;
    }
    case 'r83aSaki': {
      c.r83aSaki = true;
      ev.lines.push(`${c.name}は、敵の大技を読んでいる！`, '（次の番まで、前ぶれのある大技のダメージが半分！）');
      ev.upd.push(c);
      return true;
    }
    case 'r83aHoshin': {
      const H = eff.r83aHoshin || eff;
      for (const t of targets) {
        if (!t.alive) continue;
        const k = 1 + (H.low || 1) * (1 - Math.max(0, t.hp) / Math.max(1, t.maxHp));
        const base = (eff.base || [100, 120]).map((v) => Math.round(v * k));
        b.magicHit(c, t, { type: 'magic', element: eff.element, base, thr: eff.thr }, ev, powMult);
        if (!t.alive && t.side !== c.side) {
          ev.lines.push(`${t.name}は、光にほう神された！`);
          for (const x of b.sideOf(c, true)) {
            if (!x.alive) continue;
            const d = Math.min(x.maxMp - x.mp, b.rng.int(H.mpBack?.[0] ?? 8, H.mpBack?.[1] ?? 14));
            if (d <= 0) continue;
            x.mp += d;
            ev.upd.push(x);
          }
          ev.lines.push('仲間全員のMPが回復した！');
        }
      }
      b.afterDamage(c, ev, eff.element);
      return true;
    }
    case 'r83aKeikaku': {
      let p = activePlan(b, c.side);
      if (!p) {
        const kind = 'seme';
        b.r83aPlan = { side: c.side, by: c.id, kind, pct: sakusenPct(c), boost: 0, boostBy: null };
        p = b.r83aPlan;
        ev.lines.push(`${SAKUSEN[kind].name}から始める！`);
      }
      p.boost = eff.left || 3;
      p.boostBy = c.id;
      ev.lines.push(`作戦の効き目が、${BOOST_MULT}倍になった！`);
      for (const t of targets) hurry(b, c, t, ev);
      syncPlan(b, ev);
      if (ev.fx) ev.fx.plan = p.kind;
      return true;
    }
    case 'r83aTreasure': {
      const foe = b.sideOf(c, false).find((x) => x.species && !x.clone);
      const g = foe && c.side === 'ally' && b.hooks?.gainGold ? b.hooks.gainGold(c, foe.species, eff.mult || 2) : 0;
      ev.lines.push(g > 0 ? `${g}ゴールドを手に入れた！` : 'しかし、宝箱はからっぽだった…。');
      return true;
    }
    default: return false;
  }
}

// ───────────── 強化を とめる（battle.js の applyBuff・力ため） ─────────────
export function r83aBuffBlock(b, c, t, ev) {
  if (!t?.r83aSeal || !(t.r83aSeal.left > 0)) return false;
  ev.lines.push(`しかし、${t.name}は強化をふうじられている！`);
  return true;
}

// ───────────── 行動の はじめ（battle.js の executeNext） ─────────────
export function r83aTurnStart(b, c, ev) {
  if (c.r83aSaki) {
    delete c.r83aSaki;
    ev.upd.push(c);
  }
  if (c.r83aSeal) {
    c.r83aSeal.left--;
    if (c.r83aSeal.left <= 0) {
      delete c.r83aSeal;
      if (c.alive) ev.lines.push(`${c.name}の強化ふうじがとけた。`);
    }
    ev.upd.push(c);
  }
  if (c.r83aHata) {
    c.r83aHata.left--;
    if (c.r83aHata.left <= 0) delete c.r83aHata;
    ev.upd.push(c);
  }
  const p = b.r83aPlan;
  if (p) {
    if (!activePlan(b)) {
      const by = b.get(p.by);
      ev.lines.push(`${by?.name || '軍師'}がたおれて、${SAKUSEN[p.kind]?.name || '作戦'}がとぎれた…`);
      delete b.r83aPlan;
    } else if (p.boost > 0 && p.boostBy === c.id) {
      p.boost--;
      if (p.boost <= 0) ev.lines.push('ほう神計画が終わって、作戦の効き目が元にもどった。');
    }
  }
  if (p || (b.combatants || []).some((x) => x.r83aPlan)) syncPlan(b, ev);
}

// ───────────── ダメージ（battle.js の damage） ─────────────
// 攻めの 作戦（あたえる ＋）・守りの 作戦／先読みの策／守りの旗（受ける −。下げすぎ ふせぎ あり）。へんじ: ダメージ
export function r83aDamage(b, c, t, dmg, info, ev) {
  if (!c || !t || c.side === t.side || !(dmg > 0)) return dmg;
  const p = activePlan(b);
  let up = 1, cut = 1;
  if (p?.kind === 'seme' && c.side === p.side) up += planPct(p);
  if (p?.kind === 'mamori' && t.side === p.side) cut *= 1 - planPct(p);
  // 第86回 B班: 大魔法の時間（となえて いる 仲間は 受ける ダメージ −・となえた 力で うつ 呪文は ＋）
  if (p?.kind === 'mahou' && c.side === p.side && mahouPowered(c, ev)) up += planPct(p);
  if (p?.kind === 'mahou' && t.side === p.side && chanting(t)) cut *= 1 - planPct(p);
  if (ev?.big && c.side !== t.side && (b.combatants || []).some((x) => x.side === t.side && x.alive && x.r83aSaki)) {
    cut *= SAKI_CUT;
    if (!ev.r83aSakiMsg) {
      ev.r83aSakiMsg = true;
      ev.lines.push('先読みの策で、大技をうまくかわした！');
      ev.r83aSaki = true;
    }
  }
  if (t.r83aHata) {
    cut *= HATA_CUT;
    delete t.r83aHata;
    if (!ev.r83aHataMsg) {
      ev.r83aHataMsg = true;
      ev.lines.push('守りの旗が、ダメージを半分にした！');
    }
    ev.upd.push(t);
  }
  if (cut < 1) cut = Math.max(cut, t.defending ? CUT_FLOOR.defending : CUT_FLOOR.normal);
  if (up === 1 && cut === 1) return dmg;
  return Math.max(1, Math.round(dmg * up * cut));
}

// 第86回 B班: 大魔法の時間で 強く なる 呪文か（その 行動で、となえた 力を 使って うった 呪文。大砲も ふつうの 呪文も。
//   battle-r85a.js の r85aMagic・battle-r86b.js の 太極・ギガ・スレイブが ev.r85aChantEnd に 自分を 入れる）
export function mahouPowered(c, ev) {
  if (!c || !ev || ev.id !== c.id || ev.r85aChantEnd !== c.id || !ev.ability) return false;
  const a = ABILITIES[ev.ability];
  return !!a && (a.kind === 'spell' || !!a.spellLike);
}

// クライアントに 見せる（pub）
export function r83aPub(c) {
  const out = {};
  if (c.r83aPlan) out.r83aPlan = { ...c.r83aPlan };
  if (c.r83aSeal) out.r83aSeal = c.r83aSeal.left;
  if (c.r83aSaki) out.r83aSaki = true;
  if (c.r83aHata) out.r83aHata = true;
  return out;
}

// ───────────── オート ─────────────
const CURE_SET = new Set(CURE_STATUSES);
const weak = (x) => Object.keys(x.debuffs || {}).length > 0 || Object.keys(x.status || {}).some((s) => CURE_SET.has(s));
// decideAlly の 4.8 の あと（mine … 使える 技 [{ id, a }]、fw … ai.js の fightWeight）
export function r83aPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length) return null;
  const has = (type) => mine.find(({ a }) => partsOf(a.effect).some((p) => p.type === type));
  const saki = has('r83aSaki'), plan = has('r83aSakusen'), tai = has('r83aTaikyoku'), seal1 = has('r83aSeal');
  const hata = has('r83aHata'), keikaku = has('r83aKeikaku'), gorei = has('r83aGorei');
  if (!saki && !plan && !tai && !seal1 && !hata && !keikaku && !gorei) return null;
  // 前ぶれ: 先読みの策（だれも 読んで いない 時）・守りの旗
  const tele = foes.some((f) => f.telegraph);
  const read = allies.some((x) => x.r83aSaki);
  if (tele && saki && !read) return { type: 'ability', id: saki.id };
  if (tele && hata && !read && allies.filter((x) => !x.r83aHata).length >= Math.ceil(allies.length / 2) && b.rng.chance(0.6)) return { type: 'ability', id: hata.id };
  // 作戦が ない: 作戦を 立てる（ボスは 守り・ふつうは 攻め。弱い 敵には 立てない）
  const cur = activePlan(b, c.side);
  if (plan && !cur && (b.boss || fw?.hard || (fw?.rounds ?? 0) >= 4)) return { type: 'ability', id: plan.id, sakusen: b.boss ? 'mamori' : 'seme' };
  // 敵の 強化を 消す・仲間の 弱りを 治す
  const pumped = foes.filter((f) => normalBuffs(f) > 0 && !(f.r83aSeal?.left > 0)).sort((x, y) => (y.boss ? 1 : 0) - (x.boss ? 1 : 0));
  const bad = allies.filter(weak).length;
  if (tai && (pumped.length >= 2 || (pumped.length && bad) || bad >= 2)) return { type: 'ability', id: tai.id };
  if (seal1 && pumped.length) return { type: 'ability', id: seal1.id, target: pumped[0].id };
  if (tai && pumped.length) return { type: 'ability', id: tai.id };
  // ボス: ほう神計画（作戦が ある 時）・軍師の号令（いちばん 強い 仲間）
  if (b.boss && keikaku && cur && !(cur.boost > 0) && c.mp >= c.maxMp * 0.35 && b.rng.chance(0.3)) return { type: 'ability', id: keikaku.id };
  if (b.boss && gorei && b.rng.chance(0.2)) {
    const pow = (x) => Math.max(x.atk || 0, x.mag || 0);
    const t = allies.filter((x) => x !== c && x.alive && !x.ready && !x.queued && (x.atb || 0) < 50 && !x.status?.sleep && !x.status?.paralyze).sort((x, y) => pow(y) - pow(x))[0];
    if (t) return { type: 'ability', id: gorei.id, target: t.id };
  }
  return null;
}
