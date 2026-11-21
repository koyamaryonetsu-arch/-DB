// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の 戦いの しかけ（data/jobs-r86b.js・data/abilities-r86b.js。docs/plan-r86-phantom-b.md）
// どれも 戦いの 中だけ（戦いの 人〈combatant〉に つける。キャラ・セーブ・引っこしコードには 何も 足さない）
//
// もとの 4つの 伝説の しくみは そのまま 使う（データで つなぐ。jobs-r86b.js の reiMax・formPct・passive.rise・sakusenSet・sakusenPct・passive.hayakuchi）
//   れい丸の 数（battle-r84a.js）・水と お湯の すがた（battle-r84b.js）・1回だけ 立ち上がる（battle-r84a.js）・
//   作戦（battle-r83a.js。4つ目「大魔法の時間」mahou も battle-r83a.js の r83aDamage）・となえる／大砲の 呪文・早口（battle-r85a.js）
//
// ■ 天下一の格闘王
//   ・カウンターが 決まるたびに れい丸が 1発 もどる（上限まで。reiMax の ある 職業だけ ＝ 格闘王）。
//     カウンター ＝ 反撃の 構え（stance 'counter'）の 反撃・飛竜しょう天は／れい丸・しょう天はの 竜巻（行動の あと。r86bResolve）
//   ・れい丸・しょう天は（type 'r86bReiHiryu'）: 飛竜しょう天はの かまえ（c.stance.kind 'hiryu'。battle-r84b.js が ダメージで 当たりを おぼえ、
//     攻撃が 来なかった 時の 風の 一ふり ＋ MP 半分も もとの まま）に rei86（使う れい丸の 数）・reiAdd（1発ごとの 倍）を のせた もの。
//     攻撃を 受けると、行動の あと（r86bResolve。battle-r84b.js の r84bResolve より 先）に れい丸を rei86 発 使って
//     竜巻を 敵全体へ（1体ごとの 倍 ＝（mult ＋ reiAdd × うった 数）×（1 ＋ vsBuff × 敵の 強化の 数）× 水の すがたなら water）。
//     れい丸が たりない 時は rei86 を はずして、ふつうの 飛竜しょう天は（r84bResolve）に まかせる
// ■ 混とんの大軍師
//   ・みんなでとなえる（type 'r86bChantAll'）: 仲間全員を「となえている」（battle-r85a.js の c.r85aChant）に する。自分は 早口も ある
//   ・太極・ギガ・スレイブ（magic の しるし r86bTaiGiga。battle.js の 'magic' で battle-r85a.js より 先に うけとる）:
//     となえて いる 時だけ（r85aLocked）。敵全体の ふつうの 強化を 消す（battle-r83a.js の r83aDispel。ボスの しかけは 消さない）→
//     のこりの MP を 全部 使う（はらった MP ＋ のこり）。1体ごとの ダメージ ＝ 使った MP × GIGA_PER × 魔力の 倍、
//     上限は ギガ・スレイブと おなじ（1体 GIGA_CAP・ボスは 最大HP の GIGA_BOSS）。作戦や 天気で 上がっても こえない（damage の info.r86bCap）
//     敵の がわ（職業の試練の まぼろし）は 力 ENEMY_BIG・使う MP は ENEMY_GIGA_MP まで
// battle.js から よぶ: r86bEffect（switch）・r86bMagic（'magic' の はじめ）・r86bResolve（行動の あと）・r86bPub（pub）
// ai.js から よぶ: r86bPlan（オートの 動き。この 2つの 職業の 技だけを 見る）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { JOBS } from './data/jobs.js?v=93a310251ce7';
import { ABILITIES } from './data/abilities.js?v=93a310251ce7';
import { mpCost, weaponOk } from './stats.js?v=93a310251ce7';
import { reiLeft, reiMax } from './battle-r84a.js?v=93a310251ce7';
import { boostCount, hiryuMult, HIRYU_MP_BACK } from './battle-r84b.js?v=93a310251ce7';
import { activePlan, r83aDispel, normalBuffs } from './battle-r83a.js?v=93a310251ce7';
import { chanting, CHANT_LEFT, HAYAKUCHI_ATB, GIGA_PER, GIGA_BOSS, GIGA_CAP, ENEMY_BIG } from './battle-r85a.js?v=93a310251ce7';

export const R86B_JOBS = ['tenkaichi_king', 'chaos_gunshi'];
// カウンターが 決まった 時に もどる れい丸の 数
export const COUNTER_REI = 1;
// まぼろし（敵の がわ）が 太極・ギガ・スレイブで 使う MP の 上限
export const ENEMY_GIGA_MP = 200;

const partsOf = (e) => (e?.type === 'multi' ? e.parts || [] : [e || {}]);
const canAct = (t) => !!t?.alive && !t.fled && !t.status?.sleep && !t.status?.paralyze;

// れい丸が もどる（reiMax の ある 職業〈格闘王〉だけ）。もどった 数
function reiBack(t, n, ev, why) {
  if (!t || !JOBS[t.job]?.reiMax) return 0;
  const max = reiMax(t);
  const before = reiLeft(t);
  t.r84aRei = Math.min(max, before + n);
  const got = t.r84aRei - before;
  if (got > 0) {
    ev.lines.push(`${why}れい丸が${got}発もどった！（のこり${t.r84aRei}発）`);
    (ev.r86bReiBack = ev.r86bReiBack || []).push(t.id);
    ev.upd.push(t);
  }
  return got;
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export const R86B_TYPES = ['r86bReiHiryu', 'r86bChantAll'];
export function r86bEffect(b, c, a, eff, ev, targets, cmd, powMult = 1) {
  switch (eff.type) {
    case 'r86bReiHiryu': {
      // 飛竜しょう天はの かまえ（battle-r84b.js と おなじ 形）に、のせる れい丸の 数を 足す
      c.stance = {
        kind: 'hiryu', mult: eff.mult ?? 2.4, vsBuff: eff.vsBuff ?? 0.25, water: eff.water ?? 1.4, swing: eff.swing ?? 0.9, name: a.name,
        pow: Math.min(1, powMult || 1), mpBack: Math.floor((a.mp || 0) * HIRYU_MP_BACK), rei86: eff.rei || 2, reiAdd: eff.reiAdd ?? 1,
      };
      ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: [c.id], side: c.side };
      const left = reiLeft(c);
      ev.lines.push(left >= (eff.rei || 2) ? '（攻撃してきたら、れい丸をのせた竜巻でやり返すかまえだ…！）' : '（攻撃してきたら、竜巻でやり返すかまえだ…！れい丸は、たりない）');
      ev.r84bHiryuSet = c.id;
      ev.upd.push(c);
      return true;
    }
    case 'r86bChantAll': {
      const ids = [];
      for (const t of targets) {
        if (!t.alive || t.side !== c.side || t.fled) continue;
        const s = t.status || {};
        if (s.sleep || s.paralyze || s.silence || s.prison || s.rift) continue;
        t.r85aChant = { left: CHANT_LEFT };
        ids.push(t.id);
        ev.upd.push(t);
      }
      ev.r86bChantAll = ids;
      ev.lines.push(ids.length ? '仲間全員が、声を合わせて呪文をとなえ始めた！' : 'しかし、だれもとなえられなかった…');
      if (ids.length) ev.lines.push('（となえている：いちばん強い呪文がうてる。ふつうの呪文なら強くなる）');
      // 早口（自分が となえて いれば）
      const hk = JOBS[c.job]?.passive?.hayakuchi;
      if (hk && ids.includes(c.id) && b.rng.chance(hk)) {
        ev.atbAfter = HAYAKUCHI_ATB;
        ev.r85aHaya = c.id;
        ev.lines.push('早口で、あっというまにとなえ終わった！すぐに動ける！');
      }
      return true;
    }
    default: return false;
  }
}

// ───────────── 太極・ギガ・スレイブ（battle.js の 'magic' の はじめ。battle-r85a.js の r85aMagic より 先）。ここで おわったら true ─────────────
export function r86bMagic(b, c, a, cmd, ev, powMult, targets) {
  const eff = a.effect || {};
  if (!eff.r86bTaiGiga) return false;
  let pow = powMult;
  if (c.side !== 'enemy') {
    if (!c.r85aChant) {
      ev.lines.push('しかし、となえていないので、呪文が形にならなかった…');
      return true;
    }
  } else pow *= ENEMY_BIG;
  if (c.r85aChant) {
    delete c.r85aChant;
    ev.r85aChantEnd = c.id;
    ev.upd.push(c);
  }
  // 1) 白と 黒の 光で 敵全体の ふつうの 強化を 消す（ボスの しかけは 消さない）
  ev.lines.push('白と黒の光が、敵の強くなった力をのみこんでいく…！');
  let gone = 0;
  for (const t of targets) if (t.alive && t.side !== c.side && r83aDispel(b, t, ev)) gone++;
  // 2) のこりの MP を 全部 使う
  const paid = c.side === 'ally' && c.penChar && ev.ability ? mpCost(c.penChar, ev.ability) : a.mp || 0;
  let used = Math.max(0, (c.mp || 0) + paid);
  if (c.side === 'enemy') used = Math.min(used, ENEMY_GIGA_MP);
  c.mp = c.side === 'enemy' ? Math.max(0, c.mp - Math.max(0, used - paid)) : 0;
  ev.upd.push(c);
  ev.lines.push(`${c.name}は、のこりのMPを全部ときはなった！（MP${used}）`);
  const base = used * GIGA_PER;
  const { r85aBig, r85aGiga, r86bTaiGiga, ...rest } = eff;
  for (const t of targets) {
    if (!t.alive) continue;
    const res = b.calcMagic(c, t, { ...rest, base: [base, base] }, pow);
    const cap = taiGigaCap(t, pow);
    const d = Math.min(cap, res.dmg);
    if (d <= 0) {
      ev.lines.push(`しかし${t.name}には効かなかった！`);
      (ev.results = ev.results || []).push({ id: t.id, miss: true });
      continue;
    }
    // 作戦（攻め・大魔法の時間）や 天気で 上がっても 上限を こえない（battle.js の damage の info.r86bCap）
    b.damage(c, t, d, ev, { r86bCap: cap });
  }
  b.afterDamage(c, ev, null);
  ev.r85aBig = { by: c.id, anim: a.anim };
  ev.r86bGiga = { by: c.id, used, gone };
  return true;
}
// 太極・ギガ・スレイブの 1体の 上限（ギガ・スレイブと おなじ: 1体 GIGA_CAP・ボスは 最大HP の GIGA_BOSS）
export function taiGigaCap(t, pow = 1) {
  const cap = Math.round(GIGA_CAP * Math.min(1, pow));
  return t?.boss ? Math.min(cap, Math.max(1, Math.round((t.maxHp || 0) * GIGA_BOSS))) : cap;
}

// ───────────── 行動の あと（battle.js の executeNext。resolveCounters の あと・r84bResolve の 前） ─────────────
export function r86bResolve(b, ev) {
  // 1) 反撃の 構えの 反撃（resolveCounters が 出した ev.counter）: 格闘王は れい丸が もどる（1回の 行動で 1人 1回）
  const done = new Set();
  for (const k of ev.counter || []) {
    if (done.has(k.actor)) continue;
    const t = b.get(k.actor);
    if (!t?.alive || !JOBS[t.job]?.reiMax) continue;
    done.add(k.actor);
    reiBack(t, COUNTER_REI, ev, 'カウンターが決まった！');
  }
  // 2) 飛竜しょう天はの かまえに 当たった 人（battle-r84b.js の r84bDamage が ev.r84bHiryu に 入れる）
  const list = ev.r84bHiryu;
  if (!list?.length) return;
  const rest = [];
  for (const id of list) {
    const t = b.get(id);
    const st = t?.stance;
    if (!canAct(t) || st?.kind !== 'hiryu') {
      rest.push(id);
      continue;
    }
    const back = () => reiBack(t, COUNTER_REI, ev, 'カウンターが決まった！');
    if (!st.rei86) {
      // ふつうの 飛竜しょう天は（r84bResolve が やり返す）。格闘王なら れい丸が もどる
      rest.push(id);
      if (JOBS[t.job]?.reiMax && b.sideOf(t, false).some((x) => x.alive)) back();
      continue;
    }
    const have = reiLeft(t);
    if (have < st.rei86) {
      // れい丸が たりない: ふつうの 飛竜しょう天は に まかせる
      ev.lines.push('れい丸がたりない…ふつうの飛竜しょう天はだ！');
      delete st.rei86;
      rest.push(id);
      if (b.sideOf(t, false).some((x) => x.alive)) back();
      continue;
    }
    t.stance = null;
    ev.upd.push(t);
    const foes = b.sideOf(t, false).filter((x) => x.alive);
    if (!foes.length) continue;
    const shots = st.rei86;
    t.r84aRei = have - shots;
    const big = { ...st, mult: (st.mult ?? 2.4) + (st.reiAdd ?? 1) * shots };
    ev.lines.push(`${t.name}の${st.name}！れい丸を${shots}発のせた竜巻が、敵全体をまき上げた！`);
    let strong = false;
    for (const f of foes) {
      if (boostCount(f) > 0) strong = true;
      b.physHit(t, f, { mult: hiryuMult(big, t, f), acc: 1.5 }, ev, 'wind', st.pow || 1);
    }
    if (strong) ev.lines.push('強くなっていた敵ほど、竜巻が大きくなった！');
    (ev.r84bHiryuRet = ev.r84bHiryuRet || []).push({ by: t.id, targets: foes.map((f) => f.id), banner: 'れい丸・しょう天は！' });
    ev.r86bReiHiryu = { by: t.id, shots, targets: foes.map((f) => f.id) };
    ev.lines.push(`（れい丸を${shots}発うった。のこり${t.r84aRei}発）`);
    back();
  }
  if (rest.length) ev.r84bHiryu = rest;
  else delete ev.r84bHiryu;
}

// クライアントに 見せる（pub）: れい丸・しょう天はの かまえ（れい丸を のせる かまえか）
export function r86bPub(c) {
  return c.stance?.kind === 'hiryu' && c.stance.rei86 ? { r86bReiStance: true } : {};
}

// ───────────── オート（ai.js の decideAlly。この 2つの 職業の 技だけを 見る） ─────────────
// オートが その 技を えらぶ わりあい（tools/sim-r86b.mjs で 合わせた。R86B_AI=tele:0.4 などで ためせる）
//   tele … 前ぶれに れい丸・しょう天は ／ mad … 自分が おこらせた 敵が いる ／ buffed … 敵の 強化が 2つ いじょう ／ kake … ボスに かけひき ／ mikiri … ボスに 見切りのかまえ
//   mahou … ボスで 作戦を 立てる 時に 大魔法の時間に する ／ minna … みんなでとなえる ／ taiMp … 敵の 強化を 消す 時に 太極・ギガ・スレイブを うつ MP の わりあい
export const R86B_AI = { tele: 0.35, mad: 0.6, buffed: 0.5, kake: 0.05, mikiri: 0.08, mahou: 1, minna: 0.2, taiMp: 0.5 };
const mineOf = (mine, job) => mine.filter(({ a }) => a.job === job);
const typeIn = (list, type) => list.find(({ a }) => partsOf(a.effect).some((p) => p.type === type));
export function r86bPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length || c.side !== 'ally') return null;
  const tk = mineOf(mine, 'tenkaichi_king');
  const cg = mineOf(mine, 'chaos_gunshi');
  const hasSig = (c.abilities || []).includes('chaos_gunshi_sig');
  if (!tk.length && !cg.length && !hasSig) return null;
  const hard = !!(b.boss || fw?.hard);
  const tele = foes.some((f) => f.telegraph);
  // ── 天下一の格闘王 ──
  if (tk.length) {
    const sig = typeIn(tk, 'r86bReiHiryu');
    const kake = typeIn(tk, 'r84bKakehiki');
    const mikiri = tk.find(({ a }) => a.effect?.type === 'stance');
    const standing = c.stance?.kind === 'hiryu' || c.stance?.kind === 'counter';
    const mad = foes.some((f) => f.r84bIkari?.by === c.id);
    const top = Math.max(0, ...foes.map((f) => boostCount(f)));
    if (sig && !standing) {
      if (tele && b.rng.chance(R86B_AI.tele)) return { type: 'ability', id: sig.id };
      if (mad && b.rng.chance(R86B_AI.mad)) return { type: 'ability', id: sig.id };
      if (top >= 2 && b.rng.chance(R86B_AI.buffed)) return { type: 'ability', id: sig.id };
    }
    if (kake && b.boss && sig && !mad && b.rng.chance(R86B_AI.kake)) return { type: 'ability', id: kake.id };
    if (mikiri && b.boss && !standing && b.rng.chance(R86B_AI.mikiri)) return { type: 'ability', id: mikiri.id };
  }
  // ── 混とんの大軍師 ──
  if (cg.length || hasSig) {
    const plan = typeIn(cg, 'r83aSakusen');
    const minna = typeIn(cg, 'r86bChantAll');
    const chantA = typeIn(cg, 'r85aChant') || mine.find(({ a }) => a.effect?.type === 'r85aChant');
    const cur = activePlan(b, c.side);
    const bigs = (c.abilities || []).filter((id) => ABILITIES[id]?.effect?.r85aBig);
    // 1) 作戦が ない: 大魔法の時間（となえて うつ 呪文が ある 時。ボス）・守り（ボス）・攻め（ふつう）
    if (plan && !cur && (hard || (fw?.rounds ?? 0) >= 4)) {
      const kind = chantA && bigs.length && b.boss && b.rng.chance(R86B_AI.mahou) ? 'mahou' : b.boss ? 'mamori' : 'seme';
      return { type: 'ability', id: plan.id, sakusen: kind };
    }
    // 2) となえて いる: 敵の ふつうの 強化が ある・とどめ・敵が 多くて MP が たっぷり → 太極・ギガ・スレイブ（ほかは ドラまたの オートに まかせる）
    if (chanting(c) && hasSig && sigOk(b, c)) {
      const pumped = foes.filter((f) => normalBuffs(f) > 0).length;
      const boss = foes.find((f) => f.boss);
      const est = boss ? estTai(b, c, boss) : 0;
      if ((pumped >= 1 && c.mp >= c.maxMp * R86B_AI.taiMp) || (boss && est >= boss.hp) || (foes.length >= 2 && c.mp >= c.maxMp * 0.8)) {
        return { type: 'ability', id: 'chaos_gunshi_sig' };
      }
    }
    // 3) 大魔法の時間の ボス戦: ときどき みんなでとなえる（となえて いない 仲間が 2人 いじょう）
    if (minna && b.boss && cur?.kind === 'mahou' && !tele && allies.filter((x) => !x.r85aChant).length >= 2 && b.rng.chance(R86B_AI.minna)) return { type: 'ability', id: minna.id };
  }
  return null;
}
// 太極・ギガ・スレイブが うてるか（となえて いるか どうかは 見ない）
function sigOk(b, c) {
  const id = 'chaos_gunshi_sig';
  const a = ABILITIES[id];
  if (!a || c.autoOff?.includes(id) || c.status?.silence || b?.noSpells) return false;
  if (!weaponOk(a, c.weaponCat)) return false;
  return mpCost(c.penChar, id) <= c.mp;
}
function estTai(b, c, t) {
  const used = c.mp;
  const res = b.calcMagic(c, t, { type: 'magic', base: [used * GIGA_PER, used * GIGA_PER], thr: ABILITIES.chaos_gunshi_sig.effect.thr }, 1, true);
  return Math.min(taiGigaCap(t), res.dmg);
}
