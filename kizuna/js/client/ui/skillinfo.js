// 戦いの 呪文・特技・道具の せつめい（カーソルを 合わせた とき、メッセージの まどに 出す。2026年10月 見なおし）
//   1行め: 種類と 属性（炎属性の ダメージの 呪文 など）・MP・相手（敵1体・敵全体・自分 など）
//   2行め: 威力・効果の 目安（ふつうの 攻撃の 何倍・ダメージ・回復の 量・何が 上がるか）
//   3行め: せつめい（data の desc）。転職の ペナルティ・上位の 技なども
// 相手を えらぶ 前（敵が 1体・自分に かける・全体の 技でも）に 見える。client/battle.js の abilityMenu・itemMenu
import { ABILITIES, abilityTypeText, abilityRole } from '../../shared/data/abilities.js?v=bdeec0bffe23';
import { ITEMS } from '../../shared/data/items.js?v=bdeec0bffe23';
import { JOBS } from '../../shared/data/jobs.js?v=bdeec0bffe23';
import { SKILL_UPS } from '../../shared/data/skill-ups.js?v=bdeec0bffe23';
import { mpCost, penaltyFor, comboAllowed } from '../../shared/stats.js?v=bdeec0bffe23';
import { targetText } from './info.js?v=bdeec0bffe23';

const STAT = { atk: '攻撃力', def: '守備力', agi: '素早さ', mag: '魔力', heal: '回復魔力', eva: 'かわしやすさ', dfn: '守備力', hit: '命中' };
const STATUS = { sleep: 'ねむり', paralyze: 'マヒ', confuse: '混乱', blind: 'まぼろし', silence: '呪文ふうじ', poison: '毒', stop: '動けない' };
const ITEM_TARGET = { self: '自分', ally: '味方1人', deadAlly: '死んだ味方1人', allies: '味方全員' };

const num = (x) => (Math.round(x * 10) / 10).toString();
const range = (b, k = 1) => (Array.isArray(b) ? `${Math.round(b[0] * k)}〜${Math.round(b[1] * k)}` : `${Math.round((b || 0) * k)}`);
const pct = (x) => `${Math.round(x * 100)}%`;

// 1つの 効果の 威力の 目安（pm: 職業レベル・転職の ペナルティを かけた 威力の 倍率）
function partText(e, pm) {
  if (!e) return '';
  switch (e.type) {
    case 'phys': {
      const m = (e.mult ?? 1) * pm;
      const hits = e.hits > 1 ? `×${e.hits}回${e.random ? '（ランダム）' : ''}` : '';
      const extra = [e.ignoreDef ? `守りを${pct(e.ignoreDef)}むし` : '', e.status ? `${STATUS[e.status.status] || ''}（${pct(e.status.chance ?? 1)}）` : '', e.debuff ? `${STAT[e.debuff.stat] || ''}ダウン` : ''].filter(Boolean).join('・');
      return `ふつうの攻撃の約${num(m)}倍${hits}${extra ? `・${extra}` : ''}`;
    }
    case 'magic': return `ダメージ約${range(e.base, pm)}${e.stat === 'heal' ? '（回復魔力で上がる）' : (e.thr ?? 20) < 99 ? '（魔力で上がる）' : ''}${e.status ? `・${STATUS[e.status.status] || ''}` : ''}`;
    case 'heal': return `HPを約${range(e.base, pm)}回復`;
    case 'regen': return `しばらくHPが少しずつ回復（${range(e.base)}ずつ）`;
    case 'mpHeal': return `MPを約${range(e.base)}回復`;
    case 'buff': {
      const st = (e.stats || [e.stat]).map((s) => STAT[s] || s).join('・');
      return `${e.target === 'enemy' || e.target === 'enemies' ? '敵の' : ''}${st}${e.add ? `+${pct(e.add)}` : `×${num(e.mult)}`}${e.dur ? `（${e.dur}秒）` : ''}`;
    }
    case 'debuff': return `敵の${(e.stats || [e.stat]).map((s) => STAT[s] || s).join('・')}×${num(e.mult)}${e.chance ? `（${pct(e.chance)}）` : ''}`;
    case 'status': return `${STATUS[e.status] || e.status}にする（${pct(e.chance ?? 1)}）${e.also ? `・${STATUS[e.also.status] || ''}` : ''}`;
    case 'atbSet': return `敵の動きを止める（${pct(e.chance ?? 1)}）`;
    case 'cure': return `${(e.statuses || []).map((s) => STATUS[s] || s).join('・')}を治す`;
    case 'revive': return `生き返らせる（HP${pct(e.hpRatio || 0.25)}）`;
    case 'reviveAll': return 'たおれた味方みんなを生き返らせる';
    case 'charge': return `次の攻撃が${num(e.mult)}倍`;
    case 'drainHp': return `ふつうの攻撃の約${num((e.mult ?? 1) * pm)}倍・HPをすいとる`;
    case 'drainMp': return `MPを${range(e.amount)}すいとる`;
    case 'cover': return `味方をかばう（${e.dur || 20}秒）`;
    case 'steal': return `物をぬすむ（${pct(e.chance ?? 1)}）`;
    case 'dispel': return '敵の強化を消す';
    case 'bondUp': return `きずなゲージ+${e.amount}`;
    case 'escape': return '戦いからにげる';
    case 'multi': return (e.parts || []).map((p) => partText(p, pm)).filter(Boolean).join('＋');
    default: return '';
  }
}

// 呪文・特技の せつめい（pc: 使う 人。{ job, jobs }。touch: タッチの とき「もう一度タップで使う」）
export function battleSkillText(id, pc, { touch = false } = {}) {
  const a = ABILITIES[id];
  if (!a) return '';
  const lines = [];
  const pen = pc ? penaltyFor(pc, id) : { powMult: 1 };
  const pm = pen.powMult || 1;
  // 見出し（「炎属性のダメージの呪文」など。属性も ここに 入る）・MP・相手
  const cost = a.effect?.type === 'mahouken' ? null : pc ? mpCost(pc, id) : a.mp || 0;
  lines.push(`【${abilityTypeText(a)}】${cost === null ? '' : `MP${cost}・`}${targetText(a) || '—'}`);
  const role = abilityRole(a);
  const pw = partText(a.effect, pm);
  if (pw) lines.push(`${role === 'dmg' ? '威力' : '効果'}：${pw}`);
  const notes = [];
  if (pen.jobPow > 1 && role !== 'sup') notes.push(`職業レベルで威力+${Math.round((pen.jobPow - 1) * 100)}%`);
  if (SKILL_UPS[id] && ABILITIES[SKILL_UPS[id]]) notes.push(`${ABILITIES[SKILL_UPS[id]].name}の上位の技`);
  if (pen.penalized) notes.push(`⚠${pen.label}`);
  if (a.kind === 'combo' && pc?.job && JOBS[pc.job] && !comboAllowed(pc, id)) notes.push('⚠今の職業では使えない');
  lines.push([a.desc || '', notes.length ? `（${notes.join('・')}）` : ''].filter(Boolean).join(''));
  if (touch) lines.push('▶もう一度タップで使う');
  return lines.filter(Boolean).join('\n');
}

// 道具の せつめい（戦いの 中）
export function battleItemText(id, { touch = false } = {}) {
  const it = ITEMS[id];
  if (!it) return '';
  const lines = [`【道具】${ITEM_TARGET[it.target] || '自分'}`];
  const pw = partText(it.effect, 1);
  if (pw) lines.push(`効果：${pw}`);
  if (it.desc) lines.push(it.desc);
  if (touch) lines.push('▶もう一度タップで使う');
  return lines.join('\n');
}
