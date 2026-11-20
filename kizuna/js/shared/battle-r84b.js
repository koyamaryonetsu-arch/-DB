// 第84回 B班: らんま1/2 の 系統（手数と カウンター）の 戦いの しかけ（data/jobs-r84b.js・data/abilities-r84b.js。docs/plan-r84-jobs-b.md）
// どれも 戦いの 中だけ（戦いの 人〈combatant〉に つける。キャラ・セーブ・引っこしコードには 何も 足さない）
//
// ■ 水の すがた・お湯の すがた（c.r84bForm = 'mizu' | 'oyu'。戦いの はじめは お湯の すがた〈START_FORM〉）
//   ・水  … 行動ゲージが 速く たまる（×(1＋pct)）・物理の 攻撃を よけやすい（＋pct×0.8。上限 EVA_CAP）
//   ・お湯 … 物理の ダメージが 大きい（×(1＋pct)）・受ける ダメージが へる（×(1−pct×0.6)）
//   ・pct は 今の 職業の 段: 門下生 15%・早おとめ乱馬 20%・飛竜しょう天はの達人 25%（FORM_PCT）。
//     ほかの 職業に 転職した あと: 「水をかぶる／お湯をかぶる」を 覚えて いれば 15%（OTHER_PCT。上級職と おなじ）。覚えて いなければ すがたは ない
//   ・「水をかぶる／お湯をかぶる」（1つの 技）で えらぶ（cmd.form。YAIBA の 玉がえと おなじ メニュー）。すばやい（次の 番が すぐ 来る）
//   ・勝手に かわる: 雨の 天気に なった・水の 属性の 攻撃を 受けた → 水／晴れの 天気に なった・炎の 属性の 攻撃を 受けた → お湯
//     （天気は 自分の 番の はじめに 見る。同じ 天気の 間は 1回だけ かわる ので、自分で もどす ことも できる）
//   ・前ぶれの ある 大技（ev.big）は 水の すがたでも よけられない（よける だけで ボスの 大技を 受けない、に しない）
//   ・心の水（c.r84bKokoro = { left }）: left 回 行動する 間、水と お湯の 両方の よい 所
// ■ 飛竜しょう天は（かまえ。c.stance = { kind: 'hiryu', … }。今 ある「反撃の 構え」を 広げた もの）
//   ・次の 自分の 番までに 敵の 攻撃（物理でも 呪文でも）を 受けると、行動の あとで 風の 竜巻を 敵全体へ（1回だけ）
//   ・強さ = mult ×（1 ＋ vsBuff × その 敵の 強化の 数〈上限 BOOST_CAP〉）× 水の すがたなら water
//   ・強化の 数（boostCount）: ふつうの 強化（攻撃力アップ などの バフ・かいひ・力ため）は 1つずつ。
//     ボスの しかけ（ずっと つづく 強化〈left が Infinity〉）は いくつ あっても 1つ だけ。形態・前ぶれ・かまえは 数えない。
//     かけひきで おこって いれば ＋1。ぜんぶで BOOST_CAP（4）まで
//   ・攻撃が 来なかった ときは、次の 自分の 番の はじめに 弱い 風の 一ふり（敵全体・swing 倍）＋ 使った MP の 半分が もどる
// ■ 飛竜こうりんだん（phys の vsBuff84）… かまえ なしで 竜巻。敵の 強化の 数 1つごとに ＋vsBuff84（上限 BOOST_CAP）
// ■ かけひき（t.r84bIkari = { left, atk, by }）… 敵を おこらせる: 攻撃力 ×atk・守備力 ×def（ボスは bossDef・長さ bossLeft）
//   おこった 敵は、おこらせた 人（by）を ねらいやすい（TAUNT。ボスは TAUNT_BOSS。前ぶれの 大技は かえない。r84bTaunt）
//   守り下げは ほかの 守り下げと 足し算に しない（今の 守り下げより 弱い ときは 長さだけ のばす。かさねがけの 2だんかいめにも ならない）
// ■ 敵前だい逃亡（t.r84bDodge = { add }）… 仲間全員が 1回 行動する 間 よけやすい（物理。前ぶれの 大技は よけられない）・自分の 次の 番が 早い
// ■ どげざ … 今 ある 行動ゲージを 下げる しくみ（atbSet。ボスは 効きにくく、下がり方も 半分）
// ■ 乱れ打ち（effect.r84b 'midare'）・手数の 技（'te'）・自信の気だん（'jishin'）… battle.js の 'phys' の はじめで r84bPhys
// battle.js から よぶ: r84bTurnStart（行動の はじめ・反撃の 構えが とける 前）・r84bPhys（'phys'）・r84bEffect（switch）・
//   r84bPhysMult（calcPhys）・r84bEva（calcPhys の よけ）・r84bSpeed（speedMult）・r84bDamage（damage）・r84bResolve（行動の あと）・r84bPub（pub）・
//   r84bTaunt（敵の 行動が きまった あと）
// ai.js から よぶ: r84bPlan（オートの 動き）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { JOBS } from './data/jobs.js?v=69e37e491d1f';
import { R84B_FORM_ATB } from './data/abilities-r84b.js?v=69e37e491d1f';
import { ABILITIES } from './data/abilities.js?v=69e37e491d1f';

export const R84B_LINE = ['musabetsu_student', 'ranma', 'hiryu_master'];
// すがたの 表（ならびは メニューの じゅん）
export const FORMS = {
  mizu: { name: '水のすがた', mark: '水', pour: '水をかぶる', color: '#5ab8ff', desc: '素早くなり、物理の攻撃をよけやすい' },
  oyu: { name: 'お湯のすがた', mark: '湯', pour: 'お湯をかぶる', color: '#ff8a5a', desc: '物理の攻撃が強くなり、受けるダメージがへる' },
};
export const FORM_ORDER = ['mizu', 'oyu'];
// 段ごとの 上がる 量（[基本職, 上級職, 超級職, 伝説]）・ほかの 職業に 転職した あと
export const FORM_PCT = [0.15, 0.15, 0.2, 0.25];
export const OTHER_PCT = 0.15;
// よけやすさ（pct × EVA_RATE。上限 EVA_CAP）・お湯の 守り（受ける ダメージ × (1 − pct × GUARD_RATE)）
export const EVA_RATE = 0.8;
export const EVA_CAP = 0.2;
export const GUARD_RATE = 0.6;
// 強化の 数の 上限（飛竜しょう天は・飛竜こうりんだん）
export const BOOST_CAP = 4;
// 乱れ打ち（[回数, 1回の 倍]）
export const MIDARE = { mizu: [8, 0.32], oyu: [1, 2.7], none: [4, 0.55] };
// 自信の気だん: × (JISHIN_MIN ＋ JISHIN_HP × のこりの HP の わりあい)
export const JISHIN_MIN = 0.6;
export const JISHIN_HP = 0.5;

const inLine = (job) => R84B_LINE.includes(job);
const knows = (c, id) => (c?.abilities || []).includes(id);

// その 人の すがたの 上がる 量（すがたを 持てない 人は 0）
export function formPct(c) {
  if (!c || c.mon || c.side === 'enemy') return 0;
  if (inLine(c.job)) return FORM_PCT[JOBS[c.job]?.tier ?? 1];
  // 第86回 B班: 職業の データに すがたの 効き目が ある（天下一の格闘王。伝説と おなじ 25%。jobs-r86b.js の formPct）
  if (JOBS[c.job]?.formPct) return JOBS[c.job].formPct;
  return knows(c, 'ms_mizu') ? OTHER_PCT : 0;
}
// 今の すがた（null … すがた なし）
// 戦いの はじめは お湯の すがた（START_FORM。戦いの 人に まだ すがたが ない とき）
export const START_FORM = 'oyu';
export const formOf = (c) => (formPct(c) > 0 ? (FORMS[c?.r84bForm] ? c.r84bForm : START_FORM) : null);
const kokoro = (c) => !!c?.r84bKokoro;
export const isMizu = (c) => formPct(c) > 0 && (formOf(c) === 'mizu' || kokoro(c));
export const isOyu = (c) => formPct(c) > 0 && (formOf(c) === 'oyu' || kokoro(c));

// すがたを かえる。へんじ: かわったら true
export function setForm(c, form, ev, line = null) {
  if (!FORMS[form] || formPct(c) <= 0 || formOf(c) === form) return false;
  c.r84bForm = form;
  ev.lines.push(line || `${c.name}は、${FORMS[form].name}になった！`);
  ev.r84bForm = { id: c.id, form };
  ev.upd.push(c);
  return true;
}

// 敵が 自分を 強化して いる 数（ボスの ずっと つづく 強化は 1つ だけ・おこって いれば ＋1。上限 BOOST_CAP）
export function boostCount(t) {
  let n = 0, forever = false;
  for (const v of Object.values(t?.buffs || {})) {
    if (!v) continue;
    if (Number.isFinite(v.left)) n++;
    else forever = true;
  }
  if (t?.charge > 1) n++;
  if (forever) n++;
  if (t?.r84bIkari) n++;
  return Math.min(BOOST_CAP, n);
}

// ───────────── 行動ゲージ・よける・ダメージの 倍 ─────────────
// 水の すがたは 行動ゲージが 速い（battle.js の speedMult）
export function r84bSpeed(c) {
  return isMizu(c) ? 1 + formPct(c) : 1;
}
// よけやすさ（battle.js の calcPhys。c … 攻撃する 人、t … 受ける 人）。前ぶれの 大技は よけられない
export function r84bEva(b, c, t) {
  if (!t || !c || c.side === t.side || b?.cur?.big) return 0;
  let e = 0;
  if (isMizu(t)) e += Math.min(EVA_CAP, formPct(t) * EVA_RATE);
  if (t.r84bDodge) e += t.r84bDodge.add || 0;
  return e;
}
// 物理の ダメージの 倍（battle.js の calcPhys）: お湯の すがた・飛竜こうりんだん（vsBuff84）
export function r84bPhysMult(c, t, eff = {}) {
  let m = 1;
  if (isOyu(c)) m *= 1 + formPct(c);
  if (eff.vsBuff84) m *= 1 + eff.vsBuff84 * boostCount(t);
  return m;
}

// ───────────── 技の こうか（battle.js の applyAbility の 'phys' の はじめ） ─────────────
export function r84bPhys(b, c, a, cmd, ev, powMult, targets) {
  const { r84b, ...rest } = a.effect;
  if (r84b === 'midare') {
    const f = isMizu(c) && !isOyu(c) ? 'mizu' : isOyu(c) && !isMizu(c) ? 'oyu' : kokoro(c) ? 'mizu' : 'none';
    const [hits, mult] = MIDARE[f];
    rest.hits = hits;
    rest.mult = mult * (kokoro(c) ? 1 + formPct(c) * 0.5 : 1);
    ev.lines.push(f === 'mizu' ? '水のすがたで、目にもとまらぬ8回の乱れ打ち！' : f === 'oyu' ? 'お湯のすがたで、ずしんと重い一撃！' : '4回の乱れ打ち！');
  } else if (r84b === 'te') {
    if (isMizu(c)) {
      const add = Math.max(1, Math.round((rest.hits || 1) * 0.2));
      rest.hits = (rest.hits || 1) + add;
      ev.lines.push(`水のすがたで、手数が${add}回ふえた！`);
    }
  } else if (r84b === 'jishin') {
    const r = c.maxHp > 0 ? Math.max(0, c.hp) / c.maxHp : 1;
    rest.mult = (rest.mult ?? 1) * (JISHIN_MIN + JISHIN_HP * r);
  }
  b.applyAbility(c, { ...a, effect: rest }, cmd, ev, powMult, targets);
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export const R84B_TYPES = ['r84bForm', 'r84bHiryu', 'r84bKakehiki', 'r84bToubou', 'r84bKokoro'];
export function r84bEffect(b, c, a, eff, ev, targets, cmd, powMult = 1) {
  switch (eff.type) {
    case 'r84bForm': {
      if (formPct(c) <= 0) {
        ev.lines.push('しかし、何も起こらなかった…');
        return true;
      }
      let want = cmd?.form;
      if (!FORMS[want]) want = formOf(c) === 'mizu' ? 'oyu' : 'mizu';
      ev.atbAfter = R84B_FORM_ATB;
      if (ev.fx) {
        ev.fx.form = want;
        // えんしゅつ: 水しぶき（水）・ゆげ（お湯）。client/render/battlefx-r84b.js
        ev.fx.element = want === 'mizu' ? 'water' : 'fire';
      }
      if (formOf(c) === want) ev.lines.push(`${c.name}は、もう${FORMS[want].name}だ。`);
      else {
        setForm(c, want, ev, `${c.name}は、${FORMS[want].name}になった！`);
        ev.lines.push(`（${FORMS[want].desc}）`);
      }
      ev.upd.push(c);
      return true;
    }
    case 'r84bHiryu': {
      // mpBack … 攻撃が 来なかった ときに もどる MP（使った MP の 半分）
      c.stance = { kind: 'hiryu', mult: eff.mult ?? 1.5, vsBuff: eff.vsBuff ?? 0.25, water: eff.water ?? 1.2, swing: eff.swing ?? 0.6, name: a.name, pow: Math.min(1, powMult || 1), mpBack: Math.floor((a.mp || 0) * HIRYU_MP_BACK) };
      ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: [c.id], side: c.side };
      ev.lines.push('（攻撃してきたら、竜巻でやり返すかまえだ…！）');
      ev.r84bHiryuSet = c.id;
      ev.upd.push(c);
      return true;
    }
    case 'r84bKakehiki': {
      for (const t of targets) {
        if (!t.alive || t.side === c.side) continue;
        anger(b, c, t, eff, ev);
      }
      return true;
    }
    case 'r84bToubou': {
      for (const t of targets) {
        if (!t.alive || t.side !== c.side) continue;
        t.r84bDodge = { add: eff.add ?? 0.2 };
        ev.upd.push(t);
      }
      ev.lines.push('…と見せかけて、にげなかった！', '（仲間全員が1回動くまで、よけやすい！）');
      ev.atbAfter = eff.atb ?? 80;
      return true;
    }
    case 'r84bKokoro': {
      c.r84bKokoro = { left: eff.left || 3 };
      ev.lines.push(`${c.name}の心が、しずかな水のようになった！`, '（水のすがたとお湯のすがたの、両方のよい所を持つ）');
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// かけひき: おこらせる（ボスは 効きにくく・みじかい）
function anger(b, c, t, eff, ev) {
  const boss = !!t.boss;
  const ch = (boss ? 0.7 : 0.9) * (t.resist?.debuff ?? 1);
  if (!b.rng.chance(ch)) {
    ev.lines.push(`しかし${t.name}は、相手にしなかった！`);
    return;
  }
  const left = boss ? eff.bossLeft ?? 2 : eff.left ?? 4;
  const def = boss ? eff.bossDef ?? 0.8 : eff.def ?? 0.6;
  t.r84bIkari = { left: Math.max(left, t.r84bIkari?.left || 0), atk: eff.atk ?? 1.1, by: c.id };
  // 守り下げ: ほかの 守り下げと 足し算に しない（強い ほうを のこす。長さは 長い ほう）
  const cur = t.debuffs?.def;
  t.debuffs = t.debuffs || {};
  if (!cur || cur.mult > def) t.debuffs.def = { mult: def, base: def, lv: 1, left: Math.max(left, Number.isFinite(cur?.left) ? cur.left : 0) };
  else if (Number.isFinite(cur.left)) cur.left = Math.max(cur.left, left);
  ev.lines.push(`${t.name}は、かんかんにおこった！`, `（${t.name}の攻撃力が少し上がり、守備力が大きく下がった）`);
  ev.r84bAnger = (ev.r84bAnger || []).concat(t.id);
  ev.upd.push(t);
}

// おこった 敵は、おこらせた 人を ねらいやすい（battle.js の executeNext。敵の 行動が きまった あと）。
// 1人を ねらう 攻撃と 技だけ（前ぶれの 大技〈big〉・全体の 技・自分や 仲間に かける 技は かえない）。ボスは TAUNT_BOSS
export const TAUNT = 0.6;
export const TAUNT_BOSS = 0.4;
export function r84bTaunt(b, m, cmd) {
  const by = m?.r84bIkari?.by && b.get(m.r84bIkari.by);
  if (!by || !by.alive || by.fled || by.side === m.side || !cmd || cmd.big || cmd.target === by.id) return cmd;
  const single = cmd.type === 'attack' || (cmd.type === 'ability' && ABILITIES[cmd.id]?.target === 'enemy');
  if (!single || !cmd.target || b.get(cmd.target)?.side !== by.side) return cmd;
  if (!b.rng.chance(m.boss ? TAUNT_BOSS : TAUNT)) return cmd;
  return { ...cmd, target: by.id, taunted: true };
}

// ───────────── 行動の はじめ（battle.js の executeNext。反撃の 構えが とける 前） ─────────────
export function r84bTurnStart(b, c, ev) {
  // 飛竜しょう天はの かまえが とける（攻撃が 来なかった: 弱い 風の 一ふり）
  if (c.stance?.kind === 'hiryu') {
    const st = c.stance;
    c.stance = null;
    ev.upd.push(c);
    if (c.alive && !c.status?.sleep && !c.status?.paralyze) swing(b, c, st, ev);
  }
  if (c.r84bKokoro) {
    c.r84bKokoro.left--;
    if (c.r84bKokoro.left < 0) {
      delete c.r84bKokoro;
      if (c.alive) ev.lines.push(`${c.name}の心の水が、もとにもどった。`);
    }
    ev.upd.push(c);
  }
  if (c.r84bDodge) {
    delete c.r84bDodge;
    ev.upd.push(c);
  }
  if (c.r84bIkari) {
    c.r84bIkari.left--;
    if (c.r84bIkari.left <= 0) {
      delete c.r84bIkari;
      if (c.alive) ev.lines.push(`${c.name}のいかりが、おさまった。`);
    }
    ev.upd.push(c);
  }
  // 天気で すがたが かわる（同じ 天気の 間は 1回だけ）
  if (formPct(c) > 0 && c.alive) {
    const wx = b.weather?.kind || null;
    if (wx !== c.r84bWx) {
      c.r84bWx = wx;
      if (wx === 'rain') setForm(c, 'mizu', ev, `${c.name}は、雨にぬれて、水のすがたになった！`);
      else if (wx === 'sun') setForm(c, 'oyu', ev, `${c.name}は、お日さまにあたためられて、お湯のすがたになった！`);
    }
  }
}

// 攻撃が 来なかった 飛竜しょう天は: 敵全体に 弱い 風の 一ふり ＋ 使った MP の 半分が もどる
export const HIRYU_MP_BACK = 0.5;
function swing(b, c, st, ev) {
  const back = Math.min(c.maxMp - c.mp, st.mpBack || 0);
  if (back > 0) {
    c.mp += back;
    ev.lines.push(`${c.name}のMPが${back}もどった。`);
  }
  const foes = b.sideOf(c, false).filter((x) => x.alive);
  if (!foes.length) return;
  ev.lines.push(`${c.name}は、かまえをといて、風の一ふり！`);
  for (const t of foes) b.physHit(c, t, { mult: st.swing || 0.6, acc: 1.5 }, ev, 'wind', st.pow || 1);
  ev.r84bSwing = c.id;
}

// ───────────── ダメージ（battle.js の damage） ─────────────
// お湯の 守り・おこった 敵の 攻撃力・属性で すがたが かわる・飛竜しょう天はの かまえに 当たった。へんじ: ダメージ
export function r84bDamage(b, c, t, dmg, info, ev) {
  if (!c || !t || c.side === t.side || !(dmg > 0)) return dmg;
  let d = dmg;
  if (c.r84bIkari) d *= c.r84bIkari.atk || 1;
  if (isOyu(t)) d *= 1 - formPct(t) * GUARD_RATE;
  if (formPct(t) > 0 && t.alive) {
    if (info?.element === 'water') setForm(t, 'mizu', ev, `${t.name}は、水をあびて、水のすがたになった！`);
    else if (info?.element === 'fire') setForm(t, 'oyu', ev, `${t.name}は、ほのおであたためられて、お湯のすがたになった！`);
  }
  if (t.stance?.kind === 'hiryu' && t.alive) {
    ev.r84bHiryu = ev.r84bHiryu || [];
    if (!ev.r84bHiryu.includes(t.id)) ev.r84bHiryu.push(t.id);
  }
  return d === dmg ? dmg : Math.max(1, Math.round(d));
}

// 飛竜しょう天は 1体ぶんの 倍（オートと テストも 使う）
export function hiryuMult(st, by, f) {
  return (st.mult ?? 1.5) * (1 + (st.vsBuff ?? 0.25) * boostCount(f)) * (isMizu(by) ? st.water ?? 1.2 : 1);
}

// 行動の あと: かまえに 当たった 人が 竜巻で やり返す
export function r84bResolve(b, ev) {
  const list = ev.r84bHiryu;
  if (!list) return;
  delete ev.r84bHiryu;
  for (const id of list) {
    const t = b.get(id);
    const st = t?.stance;
    if (!t?.alive || st?.kind !== 'hiryu' || t.status?.sleep || t.status?.paralyze) continue;
    t.stance = null;
    ev.upd.push(t);
    const foes = b.sideOf(t, false).filter((x) => x.alive);
    if (!foes.length) continue;
    ev.lines.push(`${t.name}の${st.name}！うずまく竜巻が、敵全体をまき上げた！`);
    let strong = false;
    for (const f of foes) {
      const n = boostCount(f);
      if (n > 0) strong = true;
      b.physHit(t, f, { mult: hiryuMult(st, t, f), acc: 1.5 }, ev, 'wind', st.pow || 1);
    }
    if (strong) ev.lines.push('強くなっていた敵ほど、竜巻が大きくなった！');
    (ev.r84bHiryuRet = ev.r84bHiryuRet || []).push({ by: t.id, targets: foes.map((f) => f.id) });
  }
}

// クライアントに 見せる（pub）。画面は 前の 中みに かさねるので、すがたが ある 人には いつも r84bForm を のせる（なし は ''）
export function r84bPub(c) {
  const out = {};
  if (formPct(c) > 0) {
    out.r84bForm = formOf(c) || '';
    // 心の水の のこり（この あとに 動ける 回数。0 … 次の 自分の 番で もどる）
    out.r84bKokoro = kokoro(c) ? Math.max(0, c.r84bKokoro.left) : 0;
  }
  if (c.r84bDodge || c.side === 'ally') out.r84bDodge = !!c.r84bDodge;
  if (c.r84bIkari || c.side === 'enemy') out.r84bIkari = c.r84bIkari ? c.r84bIkari.left : 0;
  return out;
}

// ───────────── オート（ai.js の decideAlly） ─────────────
const partsOf = (e) => (e?.type === 'multi' ? e.parts || [] : [e || {}]);
// オートが その 技を えらぶ わりあい（tools/sim-r84b.mjs で 合わせた。R84B_AI=tele:0.5,… で ためせる）
export const R84B_AI = { form: 0.7, tele: 0.3, mad: 0.6, buffed: 0.5, kake: 0.04, kokoro: 0.06, toubou: 0.4, te: 0.5, kidan: 0.35 };
// mine … 使える 技 [{ id, a }]、fw … ai.js の fightWeight
export function r84bPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length) return null;
  const has = (type) => mine.find(({ a }) => partsOf(a.effect).some((p) => p.type === type));
  const form = has('r84bForm'), hiryu = has('r84bHiryu'), kake = mine.filter(({ a }) => a.effect?.type === 'r84bKakehiki');
  const kokoroA = has('r84bKokoro'), toubou = has('r84bToubou');
  const te = mine.filter(({ a }) => a.effect?.type === 'phys' && a.effect.r84b === 'te' && a.target === 'enemies');
  if (!form && !hiryu && !kake.length && !kokoroA && !toubou && !te.length) return null;
  const hard = b.boss || fw?.hard;
  const tele = foes.some((f) => f.telegraph);
  // 1) すがたを えらぶ（はじめは お湯。ボス ＝ お湯・ざこが 多い ＝ 水。すぐ おわる 弱い 敵には かえない）
  const want = b.boss ? 'oyu' : foes.length >= 3 ? 'mizu' : null;
  if (form && want && formOf(c) !== want && !kokoro(c) && (hard || foes.length >= 3 || (fw?.rounds ?? 0) >= 4) && b.rng.chance(R84B_AI.form)) return { type: 'ability', id: form.id, form: want };
  // 2) 前ぶれが 見えたら 飛竜しょう天はの かまえ（自分が ねらわれる かは 分からないので いつもでは ない）
  if (tele && hiryu && c.stance?.kind !== 'hiryu' && b.rng.chance(R84B_AI.tele)) return { type: 'ability', id: hiryu.id };
  // 3) 敵が 強化して いる・自分が おこらせた 敵が いる（ねらわれやすい）: 飛竜しょう天は
  const top = Math.max(0, ...foes.map((f) => boostCount(f)));
  const mad = foes.some((f) => f.r84bIkari?.by === c.id);
  if (hiryu && c.stance?.kind !== 'hiryu' && (mad || top >= 2) && b.rng.chance(mad ? R84B_AI.mad : R84B_AI.buffed)) return { type: 'ability', id: hiryu.id };
  // 4) ボス: おこって いない 時に ときどき かけひき（自分を ねらわせて、飛竜しょう天はで やり返す）
  if (kake.length && b.boss && hiryu && !mad && b.rng.chance(R84B_AI.kake)) {
    const t = foes.filter((f) => !f.r84bIkari).sort((x, y) => (y.boss ? 1 : 0) - (x.boss ? 1 : 0))[0];
    if (t) {
      const all = kake.find(({ a }) => a.target === 'enemies');
      if (all && foes.filter((f) => !f.r84bIkari).length >= 2) return { type: 'ability', id: all.id };
      const one = kake.find(({ a }) => a.target === 'enemy') || kake[0];
      return { type: 'ability', id: one.id, target: t.id };
    }
  }
  // 5) ボスで ときどき 心の水・前ぶれに 敵前だい逃亡
  if (kokoroA && b.boss && !kokoro(c) && b.rng.chance(R84B_AI.kokoro)) return { type: 'ability', id: kokoroA.id };
  if (toubou && tele && !allies.some((x) => x.r84bDodge) && b.rng.chance(R84B_AI.toubou)) return { type: 'ability', id: toubou.id };
  // 6) 敵が 多い 時は 手数の 技（ばらばらに 当てる）
  if (te.length && foes.length >= 3 && b.rng.chance(R84B_AI.te)) return { type: 'ability', id: te[0].id };
  // 7) ボス: HP が 多い（自信が ある）時は 自信の気だん（いちばん 強い 方）
  const kidan = mine.filter(({ a }) => a.effect?.r84b === 'jishin').sort((x, y) => (y.a.effect.mult || 0) - (x.a.effect.mult || 0))[0];
  if (kidan && b.boss && c.hp >= c.maxHp * 0.6 && c.mp >= c.maxMp * 0.25 && b.rng.chance(R84B_AI.kidan)) {
    const t = foes.slice().sort((x, y) => (y.boss ? 1 : 0) - (x.boss ? 1 : 0))[0];
    return { type: 'ability', id: kidan.id, target: t.id };
  }
  return null;
}
