// 戦いの あとの レベルアップの まとめ（第31回）
//   1レベルずつ 出さない。1回の 戦いで 上がった ぶんを 1人 1〜2行に まとめる（client/ui/result.js が 1画面に 出す）
//     「ユウ　Lv12→15　戦士Lv3→4！　HP+20　力+9　守り+6」
//     「覚えた：ホイミ、ベホイミ」
//   マスター・新しい 職業・ヒントは べつの 行（notes。めったに 出ない 大事な 知らせ）
import { JOB_MAX_LEVEL } from '../data/jobs.js?v=6f78c11061a2';
import { ABILITIES } from '../data/abilities.js?v=6f78c11061a2';
import { abilityFor } from '../ability-label.js?v=6f78c11061a2';
import { jobLabel } from '../job-label.js?v=6f78c11061a2';

export const GROW_STATS = ['maxHp', 'maxMp', 'str', 'def', 'agi', 'mag', 'heal'];
const SHORT = { maxHp: 'HP', maxMp: 'MP', str: '力', def: '守り', agi: '素早さ', mag: '魔力', heal: '回復' };
export const statShort = (k) => SHORT[k] || k;

// 覚えた 技の 名前（掛け合わせ技は そう わかるように）。who: 覚えた 人（男の子の 美少女戦士などは 名前が かわる。ability-label.js）
export function learnName(id, who = null) {
  const a = abilityFor(id, who);
  if (!a) return '';
  return a.kind === 'combo' ? `掛け合わせ技「${a.name}」` : a.name;
}

// name … 名前、ups … gainExp の 結果（1レベルごと）、jups … gainJobBattles の 結果（1職業レベルごと）、who … その キャラ（技・職業の 名前に 使う。job-label.js）
// かえす もの: { lines: [まとめの 行（0〜2行）], notes: [★の 知らせ] }
export function growthSummary(name, ups = [], jups = [], who = null) {
  const lines = [], notes = [];
  if (!ups.length && !jups.length) return { lines, notes };
  const gains = {}, learned = [];
  for (const u of [...ups, ...jups]) {
    for (const [k, v] of Object.entries(u.gains || {})) if (v > 0) gains[k] = (gains[k] || 0) + v;
    for (const id of u.learned || []) if (ABILITIES[id] && !learned.includes(id)) learned.push(id);
  }
  const head = [];
  if (ups.length) head.push(`Lv${ups[0].level - 1}→${ups[ups.length - 1].level}`);
  // 職業レベル（戦いの とちゅうで 転職は しないので ふつうは 1つの 職業）
  const byJob = new Map();
  for (const u of jups) {
    const r = byJob.get(u.job) || { from: u.lv - 1, to: u.lv };
    r.to = u.lv;
    byJob.set(u.job, r);
  }
  const jn = (j) => jobLabel(j, who) || j;
  for (const [job, r] of byJob) head.push(`${jn(job)}Lv${r.from}→${r.to}`);
  const st = GROW_STATS.filter((k) => gains[k] > 0).map((k) => `${statShort(k)}+${gains[k]}`).join('　');
  lines.push(`${name}　${head.join('　')}！${st ? `　${st}` : ''}`);
  if (learned.length) lines.push(`覚えた：${learned.map((id) => learnName(id, who)).join('、')}`);
  for (const u of jups) {
    if (u.lv >= JOB_MAX_LEVEL) notes.push(`★ ${name}は${jn(u.job)}をマスターした！`);
    for (const id of u.unlocked || []) notes.push(`★ ${name}は${jn(id)}になれるようになった！（ルミナの町の神殿で転職できる）`);
    for (const id of u.hinted || []) notes.push(`☆ 新しい職業「${jn(id)}」のヒントを見つけた！（神殿で見られる）`);
  }
  return { lines, notes };
}
