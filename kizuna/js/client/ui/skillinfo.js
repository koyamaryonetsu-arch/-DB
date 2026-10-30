// 戦いの 呪文・特技・道具の せつめい（カーソルを 合わせた とき、メッセージの まどに 出す。2026年10月 見なおし）
//   1行め: 種類と 属性（炎属性の ダメージの 呪文 など）・MP・相手（敵1体・敵全体・自分 など）
//   2行め: 威力・効果の 目安（ふつうの 攻撃の 何倍・ダメージ・回復の 量・何が 上がるか）
//   3行め: せつめい（data の desc）。転職の ペナルティ・上位の 技なども
// 相手を えらぶ 前（敵が 1体・自分に かける・全体の 技でも）に 見える。client/battle.js の abilityMenu・itemMenu
import { ABILITIES, abilityTypeText, abilityRole } from '../../shared/data/abilities.js?v=a9ce9cd0de1b';
import { abilityFor, abilityLabel } from '../../shared/ability-label.js?v=a9ce9cd0de1b';
import { ITEMS } from '../../shared/data/items.js?v=a9ce9cd0de1b';
import { JOBS } from '../../shared/data/jobs.js?v=a9ce9cd0de1b';
import { SKILL_UPS } from '../../shared/data/skill-ups.js?v=a9ce9cd0de1b';
import { mpCost, penaltyFor, comboAllowed } from '../../shared/stats.js?v=a9ce9cd0de1b';
import { targetText, itemDetail } from './info.js?v=a9ce9cd0de1b';
// 第38回 C: バフ・デバフは 3回行動のあいだ・じわじわ回復の 回数は 技の レベルで（shared/buff-acts.js）
import { REGEN_BASE, regenTimes, skillLevel } from '../../shared/buff-acts.js?v=a9ce9cd0de1b';
// 第50回 N1: 今の 魔力・回復魔力での 威力の 目安（shared/skill-power.js）
import { powStats, powMults, partPower, partPowerText } from '../../shared/skill-power.js?v=a9ce9cd0de1b';
export { powStats };
// 第50回 D4: 上の 職業の 技ほど 補助が 長く・2段階・回復が 多い（shared/skill-tier.js）。文は tierText だけで つくる
import { skillMods, TIER_MODS } from '../../shared/skill-tier.js?v=a9ce9cd0de1b';
import { stackMult } from '../../shared/battle.js?v=a9ce9cd0de1b';

const STAT = { atk: '攻撃力', def: '守備力', agi: '素早さ', mag: '魔力', heal: '回復魔力', eva: 'かわしやすさ', dfn: '守備力', hit: '命中' };
const STATUS = { sleep: 'ねむり', paralyze: 'マヒ', confuse: '混乱', blind: 'まぼろし', silence: '呪文ふうじ', poison: '毒', stop: '動けない' };
const SEED = { str: '力', def: '身の守り', agi: '素早さ', mag: '攻撃魔力', hp: '最大HP', mp: '最大MP', heal: '回復魔力' };
const ITEM_TARGET = { self: '自分', ally: '味方1人', deadAlly: '死んだ味方1人', allies: '味方全員' };

const num = (x) => (Math.round(x * 10) / 10).toString();
const range = (b, k = 1) => (Array.isArray(b) ? `${Math.round(b[0] * k)}〜${Math.round(b[1] * k)}` : `${Math.round((b || 0) * k)}`);
const pct = (x) => `${Math.round(x * 100)}%`;

// 補助の 倍率と 回数（tm: 技の ランクの こうか。2段階の 技は 2段階めの 倍率）
//   基本職 … 攻撃力1.3倍・3回行動のあいだ ／ 伝説 … 攻撃力1.8倍（2段階）・5回行動のあいだ
function tierText(m, tm, acts = true) {
  const st = tm.stages >= 2 ? `${num(stackMult(m, tm.stages))}倍（${tm.stages}段階）` : `${num(m)}倍`;
  return acts ? `${st}・${tm.acts}回行動のあいだ` : `${st}（${tm.acts}回行動）`;
}

// 1つの 効果の 威力の 目安（pm: 職業レベル・転職の ペナルティを かけた 威力の 倍率。lv: 技の レベル〈じわじわ回復の 回数〉。道具は 0）
// st: 今の 魔力・回復魔力（{ mag, heal }。あれば 魔力で 上がる 呪文は 今の 魔力での ダメージ・回復を 出す。第50回 N1）
// tm: 技の ランクの こうか（skill-tier.js。道具・ランク0は TIER_MODS[0]。第50回 D4）
function partText(e, pm, lv = 0, st = null, tm = TIER_MODS[0]) {
  if (!e) return '';
  switch (e.type) {
    case 'phys': {
      const m = (e.mult ?? 1) * pm;
      const hits = e.hits > 1 ? `×${e.hits}回${e.random ? '（ランダム）' : ''}` : '';
      const extra = [e.ignoreDef ? `守りを${pct(e.ignoreDef)}むし` : '', e.status ? `${STATUS[e.status.status] || ''}（${pct(e.status.chance ?? 1)}）` : '', e.debuff ? `${STAT[e.debuff.stat] || ''}${tierText(e.debuff.mult, tm, false)}` : ''].filter(Boolean).join('・');
      return `ふつうの攻撃の約${num(m)}倍${hits}${extra ? `・${extra}` : ''}`;
    }
    case 'magic':
      if (st) return `${nowText(e, pm, st)}${e.status ? `・${STATUS[e.status.status] || ''}` : ''}`;
      return `ダメージ約${range(e.base, pm)}${e.stat === 'heal' ? '（回復魔力で上がる）' : (e.thr ?? 20) < 99 ? '（魔力で上がる）' : ''}${e.status ? `・${STATUS[e.status.status] || ''}` : ''}`;
    case 'heal': return st && !e.fixed ? `今の回復魔力でHPを約${range(nowRange(e, pm, st), tm.healMul)}回復` : `HPを約${range(e.base, pm * tm.healMul)}回復`;
    case 'regen': return st && !e.fixed ? `毎ターンの初めにHPを${range(nowRange(e, pm, st), tm.healMul)}回復・${lv ? regenTimes(lv) : REGEN_BASE}回（今の回復魔力で）` : `毎ターンの初めにHPを${range(e.base, tm.healMul)}回復・${lv ? regenTimes(lv) : REGEN_BASE}回`;
    // 推理（弱点の 属性で 攻撃）・ミナデイン（仲間の MPを 集める）
    case 'deduce':
    case 'gather': return e.base ? (st ? nowText(e, pm, st) : `ダメージ約${range(e.base, pm)}`) : '';
    case 'mpHeal': return `MPを約${range(e.base)}回復`;
    case 'buff': {
      const st = (e.stats || [e.stat]).map((s) => STAT[s] || s).join('・');
      const foe = e.target === 'enemy' || e.target === 'enemies' ? '敵の' : '';
      if (e.add) return `${foe}${st}+${pct(Math.min(0.6, e.add * tm.stages))}${tm.stages >= 2 ? `（${tm.stages}段階）` : ''}・${tm.acts}回行動のあいだ`;
      return `${foe}${st}${tierText(e.mult, tm)}`;
    }
    case 'debuff': return `敵の${(e.stats || [e.stat]).map((s) => STAT[s] || s).join('・')}${tierText(e.mult, tm)}${e.chance ? `（${pct(e.chance)}）` : ''}`;
    case 'status': return `${STATUS[e.status] || e.status}にする（${pct(e.chance ?? 1)}）${e.also ? `・${STATUS[e.also.status] || ''}` : ''}`;
    case 'atbSet': return `敵の動きを止める（${pct(e.chance ?? 1)}）`;
    case 'cure': return `${(e.statuses || []).map((s) => STATUS[s] || s).join('・')}を治す`;
    case 'revive': return `生き返らせる（HP${pct(Math.min(1, (e.hpRatio || 0.25) * tm.healMul))}）`;
    case 'reviveAll': return 'たおれた味方みんなを生き返らせる';
    case 'charge': return `次の攻撃が${num(e.mult)}倍`;
    case 'drainHp': return `ふつうの攻撃の約${num((e.mult ?? 1) * pm)}倍・HPをすいとる`;
    case 'drainMp': return `MPを${range(e.amount)}すいとる`;
    case 'cover': return `味方をかばう・${TIER_MODS[0].acts}回行動のあいだ${e.defMult ? `（守備力${num(e.defMult)}倍）` : ''}`;
    case 'steal': return `物をぬすむ（${pct(e.chance ?? 1)}）`;
    case 'dispel': return '敵の強化を消す';
    case 'escape': return '戦いからにげる';
    case 'seed': return `${SEED[e.stat] || ''}が${range(e.amount)}上がる（ずっと）`;
    case 'multi': return (e.parts || []).map((p) => partText(p, pm, lv, st, tm)).filter(Boolean).join('＋');
    default: return '';
  }
}

// 今の 魔力での ダメージ（「今の魔力でダメージ約120〜150」。相手の 耐性は 考えない）
function nowText(e, pm, st) {
  return partPowerText(partPower(e, pm, st));
}
function nowRange(e, pm, st) {
  const p = partPower(e, pm, st);
  return p ? [p.min, p.max] : e.base;
}

// リストの 2行めに 出す 威力の みじかい 文（第50回 N1。オートで 使う 技・メニューの「呪文・技」）
//   物理「威力×1.8」・魔力「今の魔力でダメージ約120〜150」・回復「今の回復魔力で約80〜95回復」・そのほかは 効果の 文
// st: 今の 魔力（{ mag, heal }。たくさん ならべる ときは 先に powStats で 1回だけ 出して わたす）
export function skillPowerLine(id, pc, { who = pc, lv = null, st = powStats(pc) } = {}) {
  const a = abilityFor(id, who);
  if (!a?.effect) return '';
  const { pm, base } = powMults(pc, id);
  const slv = lv || skillLvFor(pc, id);
  // 第50回 D4: 上の 職業の 技は 回復が 多い（ランクの 倍率）
  const tm = skillMods(pc, id);
  const one = (e) => {
    if (e?.type === 'multi') return (e.parts || []).map(one).filter(Boolean).join('＋');
    const heal = e?.type === 'heal' || e?.type === 'regen';
    const p = partPower(e, heal ? pm * tm.healMul : pm, st, base);
    return p ? partPowerText(p) : partText(e, pm, slv, st, tm);
  };
  return one(a.effect);
}

// 技の 効果の 目安（メニューの「呪文・技」にも 出す。lv: 技の レベル）
export function skillEffectText(id, pc, lv = 1, who = pc) {
  const a = abilityFor(id, who);
  if (!a) return '';
  const pen = pc ? penaltyFor(pc, id) : { powMult: 1 };
  return partText(a.effect, pen.powMult || 1, lv, powStats(pc), skillMods(pc, id));
}

// 技の レベル（pc.skillUse か、戦いの slv〈Lv2 いじょうの 技〉から）
export function skillLvFor(pc, id, slv = null) {
  if (slv) return slv[id] || 1;
  return skillLevel(pc?.skillUse, id);
}

// 呪文・特技の せつめい（pc: 使う 人。{ job, jobs }。touch: タッチの とき「もう一度タップで使う」）
// who: 名前・説明を きめる 人（look を 見る。男の子の 美少女戦士などは かわる。ability-label.js。look の ない pc なら もとの まま）
// lv: 技の レベル（第38回 C。じわじわ回復の 回数に かかわる。わからない ときは pc.skillUse から）
export function battleSkillText(id, pc, { touch = false, who = pc, lv = null } = {}) {
  const a = abilityFor(id, who);
  if (!a) return '';
  const lines = [];
  const pen = pc ? penaltyFor(pc, id) : { powMult: 1 };
  const pm = pen.powMult || 1;
  // 見出し（「炎属性のダメージの呪文」など。属性も ここに 入る）・MP・相手
  const cost = a.effect?.type === 'mahouken' ? null : pc ? mpCost(pc, id) : a.mp || 0;
  lines.push(`【${abilityTypeText(a)}】${cost === null ? '' : `MP${cost}・`}${targetText(a) || '—'}`);
  const role = abilityRole(a);
  const slv = lv || skillLvFor(pc, id);
  const pw = partText(a.effect, pm, slv, powStats(pc), skillMods(pc, id));
  if (pw) lines.push(`${role === 'dmg' ? '威力' : '効果'}：${pw}`);
  const notes = [];
  if (slv > 1) notes.push(`技Lv${slv}`);
  if (pen.jobPow > 1 && role !== 'sup') notes.push(`職業レベルで威力+${Math.round((pen.jobPow - 1) * 100)}%`);
  if (SKILL_UPS[id] && ABILITIES[SKILL_UPS[id]]) notes.push(`${abilityLabel(SKILL_UPS[id], who)}の上位の技`);
  if (pen.penalized) notes.push(`⚠${pen.label}`);
  if (a.kind === 'combo' && pc?.job && JOBS[pc.job] && !comboAllowed(pc, id)) notes.push('⚠今の職業では使えない');
  lines.push([a.desc || '', notes.length ? `（${notes.join('・')}）` : ''].filter(Boolean).join(''));
  if (touch) lines.push('▶もう一度タップで使う');
  return lines.filter(Boolean).join('\n');
}

// 戦いの 呪文・特技の 一覧: 長おし・Yキーで お気に入り（第27回）の ひとこと を そえる
export function favHint(text, touch = false) {
  if (!text) return text;
  if (touch) return text.replace('▶もう一度タップで使う', '▶もう一度タップで使う・長おしでお気に入り');
  return `${text}\n（長おし・Yキーでお気に入り）`;
}

// 道具の せつめい（戦いの 中）
export function battleItemText(id, { touch = false } = {}) {
  const it = ITEMS[id];
  if (!it) return '';
  const lines = itemLines(it);
  if (touch) lines.push('▶もう一度タップで使う');
  return lines.join('\n');
}

// 道具の 1〜3行め（だれに・効果・せつめい）。戦いと メニューで おなじ 文
function itemLines(it) {
  const lines = [`【道具】${ITEM_TARGET[it.target] || '自分'}`];
  const pw = partText(it.effect, 1);
  if (pw) lines.push(`効果：${pw}`);
  if (it.desc) lines.push(it.desc);
  return lines;
}

// どこで 使えるか（第27回 メニューの 道具）
export function itemWhereText(it) {
  if (!it || it.type !== 'use') return '';
  if (it.battle && it.field) return '使える所：戦い・フィールド';
  if (it.battle) return '使える所：戦いだけ';
  if (it.field) return '使える所：フィールドだけ（戦いでは使えない）';
  return '';
}

// メニューの「道具」の せつめい（第27回）。使う 道具は 戦いと おなじ 文（だれに・効果・せつめい）＋ 使える所。
// 装備・素材・大事な物は info.js の itemDetail（強さ・装備できる 人）。touch: スマホで「もう一度タップで…」
const GEAR = ['weapon', 'armor', 'shield', 'head', 'acc'];
export function menuItemText(id, { touch = false, mons = null } = {}) {
  const it = ITEMS[id];
  if (!it) return '';
  const lines = it.type === 'use' && it.effect ? [...itemLines(it), itemWhereText(it)] : [itemDetail(id, mons)];
  if (touch && it.type !== 'key') lines.push(`▶もう一度タップで${it.type === 'use' && it.field ? '「使う」など' : GEAR.includes(it.type) ? '「装備する」など' : '「捨てる」など'}`);
  return lines.filter(Boolean).join('\n');
}
