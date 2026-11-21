// 第85回 B班: 烈火の炎の 系統（火の 道具箱）の 戦いの しかけ（data/jobs-r85b.js・data/abilities-r85b.js。docs/plan-r85-jobs-b.md）
// どれも 戦いの 中だけ（戦いの 人〈combatant〉に つける。キャラ・セーブ・引っこしコードには 何も 足さない）
//
// ■ 火竜をよぶ（type 'r85bRyu'。cmd.ryu … よぶ 火竜〈abilities-r85b.js の RYU〉・cmd.target … 火竜の あいて）
//   ・1つの 技で、よぶ 火竜を えらぶ（YAIBA の 玉がえと おなじ メニュー。client/battle-r85b.js の ryuMenu）。えらんだ 火竜の 技が その場で 1回 出る
//     （すがたを かえる のでは ない）。あいての いる 火竜（敵1体・同じ種類・たおれた 仲間）は、火竜を えらんだ あとで あいてを えらぶ
//   ・炎術士の「火竜をよぶ」は 4ひき（なだれ・さいは・ほむら・せつな）・伝説の「火竜をよぶ・八竜」は 8ひき（＋まどか・るい・こくう・れっしん）
//   ・MP は 火竜ごと（技の MP は いちばん 安い 火竜。高い 火竜は 出す ときに のこりを はらう〈ryuMp〉。たりなければ 来ない〈技の MP は もどる〉）
//   ・cmd.ryu が ない（オート・古い 画面）: autoRyu が きめる。あいてが ない 時は ボス → HP の 多い 敵・たおれた 仲間の 先頭
//   ・火竜・二ひき同時（twin）: えらんだ 火竜 ＋ 炎術士の 4ひきから もう 1ぴき（運。えらんだ 火竜とは ちがう）。それぞれ twin 倍・MP は 技の 分だけ
//   ・ほかの 職業に 転職した あと: 技を 覚えて いれば 使える。よべるのは その 技の 火竜（4ひきの 技なら 4ひき・八竜なら 8ひき）。強さも その 技の まま
// ■ 火竜の 中み（1ぴき 1ぴきは 同じ 段の 専門の 職業の 同じ 役の 技より 少し 弱い。何でも できる かわり）
//   ・まどか（t.r85bMadoka = { cut, left }）: 受ける ダメージ ×(1−cut)。left は かかった 人の 行動の 回数。
//     軍師の 守りの 作戦 などと 重ねても 下限（CUT_FLOOR 0.45倍・身を 守って いる 人は 0.65倍。battle-r83a.js）より 下げない（r85bCut → r85bFloor）
//   ・るい（t.r85bRui = { add, left }）: 物理を よけやすい。今の よけ（強化の よけ・水の すがた・敵前だい逃亡）と 合わせて EVA_TOTAL（0.6 ＝ 強化の よけの 上限）まで。
//     前ぶれの ある 大技（ev.big）は よけられない（らんまの 系統と おなじ）
//   ・れっしん: たおれた 仲間 1人を 生き返らせる（HP hpRatio）。たおれた 仲間が いなければ 仲間全員を 少し 回復（むだに しない）
// ■ 晴れの 天気で この 系統の 炎の 技（R85B_FIRE）が ×1.3。今 ある 天気の 倍（味方の 晴れ ＝ 1.3・敵の 晴れ ＝ 0.7）と 足し算・かけ算に しない（全体で 1.3 に そろえる）
// ■ 姫を守る忍び（type 'r85bHime'）: 仲間 1人を かばう（今 ある かばう ＝ c.cover）＋ 自分の 守備力が 上がる
// battle.js から よぶ: r85bTurnStart（行動の はじめ・防御）・r85bEffect（switch）・r85bEva（calcPhys の よけ）・r85bDamage（damage の 天気の あと）・
//   r85bCut（damage の 作戦の 前）・r85bFloor（damage の 体をはって守る の あと）・r85bPub（pub）
// ai.js から よぶ: r85bPlan（オートの 動き。この 系統の 技だけを 見る）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { ABILITIES } from './data/abilities.js?v=d4d473d565e8';
import { RYU, RYU_SET, R85B_FIRE } from './data/abilities-r85b.js?v=d4d473d565e8';
import { mpCost } from './stats.js?v=d4d473d565e8';
import { BUFF_ACTS } from './buff-acts.js?v=d4d473d565e8';
import { weatherMult, WEATHER_UP } from './battle-weather.js?v=d4d473d565e8';
import { CUT_FLOOR } from './battle-r83a.js?v=d4d473d565e8';
import { r84bEva } from './battle-r84b.js?v=d4d473d565e8';

export const R85B_LINE = ['enjutsushi', 'rekka'];
// 強化の よけ・水の すがた・敵前だい逃亡・るい を 合わせた よけの 上限（るいは この 上限までしか 足さない）
export const EVA_TOTAL = 0.6;

// その 技で よべる 火竜（なければ []）
export function ryuSetOf(id) {
  const e = ABILITIES[id]?.effect;
  return e?.type === 'r85bRyu' ? RYU_SET[e.set] || [] : [];
}
// その 火竜を よぶ MP（char … キャラ〈penChar・pub の pc〉。二ひき同時は 技の MP だけ）
export function ryuMp(char, id, k) {
  const a = ABILITIES[id];
  const base = mpCost(char, id);
  if (!a || !RYU[k] || a.effect?.twin || !(a.mp > 0)) return base;
  return Math.max(base, Math.ceil((RYU[k].mp * base) / a.mp));
}
// あいての いる 火竜か（'enemy'・'group'・'deadAlly'）
export const ryuNeedsTarget = (k) => ['enemy', 'group', 'deadAlly'].includes(RYU[k]?.target);

const deadOf = (b, c) => b.sideOf(c, true).filter((x) => !x.alive && !x.fled);
const aliveFoes = (b, c) => b.sideOf(c, false).filter((x) => x.alive && !x.burrow);
// あいてが ない 時の 敵: ボス → HP の 多い 敵
export function bigFoe(b, c) {
  return aliveFoes(b, c).sort((x, y) => (y.boss ? 1 : 0) - (x.boss ? 1 : 0) || y.hp - x.hp)[0] || null;
}

// cmd.ryu が ない 時の 火竜（たおれた 仲間 → れっしん・敵が 多い → なだれ・ボス → こくう／さいは）
export function autoRyu(b, c, set) {
  if (set.includes('resshin') && deadOf(b, c).length) return 'resshin';
  if (aliveFoes(b, c).length >= 3 && set.includes('nadare')) return 'nadare';
  if (set.includes('kokuu')) return 'kokuu';
  return set.includes('saiha') ? 'saiha' : set[0];
}

// 火竜の 技を 1回 出す（scale … 強さの 倍〈八竜・二ひき同時〉）。へんじ: その 火竜の えんしゅつ（ev.fx）
function summon(b, c, a, k, cmd, ev, powMult, scale) {
  const r = RYU[k];
  let effect = r.effect, target = r.target;
  const up = (p) => (p.type === 'phys' ? { ...p, mult: p.mult * scale } : p);
  effect = effect.type === 'multi' ? { ...effect, parts: effect.parts.map(up) } : up(effect);
  // れっしん: たおれた 仲間が いなければ 仲間全員を 少し 回復
  let wanted = cmd?.target;
  if (effect.type === 'r85bResshin') {
    const dead = deadOf(b, c);
    if (dead.length) {
      if (!dead.some((x) => x.id === wanted)) wanted = dead[0].id;
      effect = { type: 'revive', hpRatio: r.effect.hpRatio };
    } else {
      target = 'allies';
      effect = { type: 'heal', base: r.effect.heal, thr: r.effect.thr };
    }
  } else if (target === 'enemy' || target === 'group') {
    const t = b.get(wanted);
    if (!t || !t.alive || t.side === c.side) wanted = bigFoe(b, c)?.id;
  }
  const ab = { ...a, name: `${a.name}（${r.name}）`, anim: r.anim, target, effect, cast: r.line };
  const tc = { ...cmd, target: wanted };
  ev.lines.push(r.line);
  b.applyAbility(c, ab, tc, ev, powMult);
  if (ev.fx) ev.fx.ryu = k;
  return ev.fx;
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export const R85B_TYPES = ['r85bRyu', 'r85bHime', 'r85bMadoka', 'r85bRui'];
export function r85bEffect(b, c, a, eff, ev, targets, cmd, powMult = 1) {
  switch (eff.type) {
    case 'r85bRyu': {
      const set = RYU_SET[eff.set] || RYU_SET.four;
      let k = cmd?.ryu;
      if (!set.includes(k)) k = autoRyu(b, c, set);
      // 高い 火竜は のこりの MP を はらう（たりなければ 来ない。技の MP は もどる）
      const id = cmd?.id;
      if (c.side === 'ally' && c.penChar && id && !eff.twin) {
        const base = mpCost(c.penChar, id), need = ryuMp(c.penChar, id, k);
        if (c.mp < need - base) {
          c.mp += base;
          ev.lines.push(`しかしMPが足りず、${RYU[k].name}は来てくれなかった…`);
          ev.upd.push(c);
          return true;
        }
        c.mp -= need - base;
      }
      const scale = (eff.pow || 1) * (eff.twin || 1);
      const fx1 = summon(b, c, a, k, cmd, ev, powMult, scale);
      ev.r85bRyu = [k];
      if (eff.twin) {
        const pool = RYU_SET.four.filter((x) => x !== k);
        const k2 = b.rng.pick(pool);
        ev.lines.push(`もう1ぴき、${RYU[k2].name}もやってきた！`);
        const fx2 = summon(b, c, a, k2, { ...cmd, target: undefined }, ev, powMult, scale);
        ev.r85bRyu.push(k2);
        // えんしゅつは 1ぴきめ（ev.fx）の あとに 2ひきめ（ev.r85bTwin。client/battle-r85b.js の r85bPresent）
        if (fx2 && fx2 !== fx1) ev.r85bTwin = fx2;
        if (fx1) ev.fx = fx1;
      }
      ev.upd.push(c);
      return true;
    }
    case 'r85bMadoka': {
      for (const t of targets) {
        if (!t.alive) continue;
        t.r85bMadoka = { cut: eff.cut ?? 0.25, left: eff.left ?? 3 };
        ev.upd.push(t);
      }
      ev.lines.push('（仲間全員の受けるダメージが、しばらくへる）');
      return true;
    }
    case 'r85bRui': {
      for (const t of targets) {
        if (!t.alive) continue;
        t.r85bRui = { add: eff.add ?? 0.15, left: eff.left ?? 3 };
        ev.upd.push(t);
      }
      ev.lines.push('（仲間全員が、しばらく攻撃をよけやすい）');
      return true;
    }
    case 'r85bHime': {
      const t = targets[0];
      if (t && t !== c && t.alive) {
        c.cover = { target: t.id, left: BUFF_ACTS };
        ev.lines.push(`${c.name}は、${t.name}をかばっている！`);
      }
      b.applyBuff(c, c, { stat: 'def', mult: eff.def ?? 1.4 }, ev, powMult);
      ev.r85bHime = { by: c.id, to: t?.id };
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// ───────────── 行動の はじめ（battle.js の executeNext・防御） ─────────────
export function r85bTurnStart(b, c, ev) {
  for (const k of ['r85bMadoka', 'r85bRui']) {
    const s = c[k];
    if (!s) continue;
    s.left--;
    if (s.left <= 0) {
      delete c[k];
      if (c.alive) ev.lines.push(k === 'r85bMadoka' ? `${c.name}をつつむ炎のけっかいが、きえた。` : `${c.name}のまわりのまぼろしが、きえた。`);
    }
    ev.upd.push(c);
  }
}

// ───────────── よける（battle.js の calcPhys。c … 攻撃する 人、t … 受ける 人） ─────────────
export function r85bEva(b, c, t) {
  if (!t?.r85bRui || !c || c.side === t.side || b?.cur?.big) return 0;
  const now = (t.buffs?.eva?.add || 0) + r84bEva(b, c, t);
  return Math.max(0, Math.min(t.r85bRui.add || 0, EVA_TOTAL - now));
}

// ───────────── ダメージ（battle.js の damage） ─────────────
// 晴れの 天気で この 系統の 炎の 技が ×1.3（天気の 倍の あとに よぶ。全体で WEATHER_UP に そろえる）
export function r85bDamage(b, c, t, dmg, info, ev) {
  if (!c || !t || c.side === t.side || !(dmg > 0) || info?.element !== 'fire') return dmg;
  if (b?.weather?.kind !== 'sun' || !R85B_FIRE.has(ev?.ability)) return dmg;
  const now = weatherMult(b, c.side, 'fire');
  if (Math.abs(now - WEATHER_UP) < 1e-9) return dmg;
  if (!ev.r85bSun) {
    ev.r85bSun = true;
    ev.lines.push('晴れの空の下で、炎がいっそう強くもえた！');
  }
  return Math.max(1, Math.round((dmg * WEATHER_UP) / now));
}
// まどか: 受ける ダメージを へらす（作戦・先読みの策 などの 前。もとの ダメージを info.r85bRaw に）
export function r85bCut(b, c, t, dmg, info, ev) {
  if (!t?.r85bMadoka || !c || c.side === t.side || !(dmg > 0)) return dmg;
  info.r85bRaw = dmg;
  if (!ev.r85bCutMsg) {
    ev.r85bCutMsg = true;
    ev.r85bMadokaHit = true;
  }
  return Math.max(1, Math.round(dmg * (1 - (t.r85bMadoka.cut || 0))));
}
// 下げすぎ ふせぎ（まどか と 作戦・先読みの策・守りの旗・体をはって守る を 合わせても CUT_FLOOR まで）
export function r85bFloor(t, dmg, info = {}) {
  const raw = info.r85bRaw;
  if (!(raw > 0) || !(dmg > 0)) return dmg;
  const floor = Math.round(raw * (t?.defending ? CUT_FLOOR.defending : CUT_FLOOR.normal));
  return Math.max(dmg, Math.min(raw, floor));
}

// クライアントに 見せる（pub）。仲間には いつも のせる（きえた ことも とどく）
export function r85bPub(c) {
  if (c.side !== 'ally') return {};
  return { r85bMadoka: c.r85bMadoka ? Math.max(0, c.r85bMadoka.left) : 0, r85bRui: c.r85bRui ? Math.max(0, c.r85bRui.left) : 0 };
}

// ───────────── オート（ai.js の decideAlly） ─────────────
// オートが その 火竜を えらぶ わりあい（tools/sim-r85b.mjs で 合わせた。R85B_AI=boss:0.5,… で ためせる）
export const R85B_AI = { revive: 0.9, madoka: 0.6, guard: 0.2, mezame: 0.5, rui: 0.3, boss: 0.7, many: 0.6, slow: 0.4, blind: 0.15, hime: 0.25, twin: 0.35 };
// mine … 使える 技 [{ id, a }]、fw … ai.js の fightWeight。この 系統の 技（火竜をよぶ・姫を守る忍び）だけを 見る
export function r85bPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length) return null;
  const ryus = mine.filter(({ a }) => a.effect?.type === 'r85bRyu');
  const hime = mine.find(({ a }) => a.effect?.type === 'r85bHime');
  if (!ryus.length && !hime) return null;
  const pc = c.penChar || c;
  // よべる 火竜（MP が たりる もの）。同じ 火竜が いくつかの 技に ある 時は 強い ほう（八竜）
  const call = (k, opts = {}) => {
    const list = ryus.filter(({ id, a }) => !a.effect.twin && ryuSetOf(id).includes(k) && c.mp >= ryuMp(pc, id, k)).sort((x, y) => (y.a.effect.pow || 1) - (x.a.effect.pow || 1));
    return list[0] ? { type: 'ability', id: list[0].id, ryu: k, ...opts } : null;
  };
  const dead = deadOf(b, c);
  const tele = foes.some((f) => f.telegraph);
  const boss = foes.find((f) => f.boss);
  // 1) 仲間が たおれた ＝ れっしん
  if (dead.length && b.rng.chance(R85B_AI.revive)) {
    const cmd = call('resshin', { target: dead[0].id });
    if (cmd) return cmd;
  }
  // 2) 前ぶれが 見えた ＝ まどか（まだ かかって いない 人が 半分 いじょう）／るい
  if (tele) {
    const need = allies.filter((x) => !x.r85bMadoka).length >= Math.ceil(allies.length / 2);
    if (need && b.rng.chance(R85B_AI.madoka)) {
      const cmd = call('madoka');
      if (cmd) return cmd;
    }
    if (!allies.some((x) => x.r85bRui) && b.rng.chance(R85B_AI.rui)) {
      const cmd = call('rui');
      if (cmd) return cmd;
    }
    // 前ぶれの 間は 攻めの 火竜を よばない（ai.js の「大わざに そなえる」〈身を 守る・守りの 補助〉に まかせる）
    return null;
  }
  // 2.5) ボス: けっかいが 切れて いる 仲間が 多い 時は ときどき まどか（前ぶれを 待たずに）
  if (boss && allies.filter((x) => !x.r85bMadoka).length > allies.length / 2 && b.rng.chance(R85B_AI.guard)) {
    const cmd = call('madoka');
    if (cmd) return cmd;
  }
  // 3) ボスで 弱った 仲間を かばう（姫を守る忍び。自分の HP が 多い 時）
  if (hime && boss && !c.cover && c.hp >= c.maxHp * 0.6) {
    const weak = allies.filter((x) => x !== c && x.hp < x.maxHp * 0.45).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    if (weak && b.rng.chance(R85B_AI.hime)) return { type: 'ability', id: hime.id, target: weak.id };
  }
  // 4) ボス ＝ こくう・さいは（二ひき同時も ときどき）
  if (boss) {
    // 自分の HP が へって いる 時は 回復・守りに まかせる
    if (c.hp < c.maxHp * 0.4) return null;
    // 火影の目ざめが 切れて いたら かけ直す（攻撃・守備・素早さ ＋ 回復。この 系統の 技）
    const mezame = mine.find(({ a }) => a.job === 'rekka' && a.effect?.type === 'multi' && a.effect.parts.some((p) => p.type === 'buff' && p.stats?.includes('def')) && a.target === 'self');
    if (mezame && !c.buffs?.def && b.rng.chance(R85B_AI.mezame)) return { type: 'ability', id: mezame.id };
    if (b.rng.chance(R85B_AI.boss)) {
      const cmd = call('kokuu', { target: boss.id });
      if (cmd) return cmd;
      // こくうを よべない（炎術士・MP が たりない）: 二ひき同時 か さいは
      const twin = ryus.find(({ a }) => a.effect.twin);
      if (twin && b.rng.chance(R85B_AI.twin)) return { type: 'ability', id: twin.id, ryu: 'saiha', target: boss.id };
      const cmd2 = call('saiha', { target: boss.id });
      if (cmd2) return cmd2;
    }
    return null;
  }
  // 5) 敵が 多い ＝ なだれ（強い 敵が 多い 時は ときどき せつなで 目つぶし）
  if (foes.length >= 3) {
    if (fw?.hard && !foes.some((f) => f.status?.blind) && b.rng.chance(R85B_AI.blind)) {
      const cmd = call('setsuna');
      if (cmd) return cmd;
    }
    if (b.rng.chance(R85B_AI.many)) {
      const cmd = call('nadare');
      if (cmd) return cmd;
    }
    return null;
  }
  // 6) 強い 敵が 1体 ＝ ほむらで おくらせる（ボスには 効きにくい ので 使わない）
  if (foes.length === 1 && fw?.hard && b.rng.chance(R85B_AI.slow)) {
    const cmd = call('homura', { target: foes[0].id });
    if (cmd) return cmd;
  }
  return null;
}
