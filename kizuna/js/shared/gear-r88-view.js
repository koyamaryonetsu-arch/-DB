// 第88回: 作品を 思い出す 装備の せつめいの 文（装備の まど・くらべる まど・道具の せつめい。client/ui/info.js・equip-compare.js・menu.js）
//   「作品の力：風の力+5（…）」「使う：…（1つの戦いで1回）」「そろい：七つの玉 3/7」
import { ITEMS, baseItemId } from './data/items.js?v=efa1b5f542af';
import { ABILITIES } from './data/abilities.js?v=efa1b5f542af';
import { GEAR_SETS, tierRule } from './data/gear-sets.js?v=efa1b5f542af';
import { WORKS } from './data/works.js?v=efa1b5f542af';
import { GRADES } from './data/items-r88-kit.js?v=efa1b5f542af';
import { REBIRTH } from './data/items-alchemy.js?v=efa1b5f542af';
import { fxText, fxShort } from './data/gear-fx.js?v=efa1b5f542af';
import { innateFx, ownedSetIds, wornSetIds, itemReach, rebirthNeedText } from './gear-r88.js?v=efa1b5f542af';

const EL = { fire: '炎', ice: '氷', bolt: '雷', wind: '風', light: '光', dark: '闇' };
const workIt = (id) => {
  const it = ITEMS[baseItemId(id)];
  return it?.work ? it : null;
};

// 名前の よこの みじかい しるし（「雷+5・使う」）
export function r88Short(id) {
  const it = workIt(id);
  if (!it) return '';
  const parts = [];
  const f = fxShort(innateFx(id));
  if (f) parts.push(f);
  if (it.orb?.el) parts.push(`${EL[it.orb.el] || ''}の玉`);
  if (it.use?.ability) parts.push('使う');
  return parts.join('・');
}

// そろいの 数（「スーパー宝貝 3/7（つけている 2）」）
export function setLine(id, who = null) {
  const it = workIt(id);
  const set = GEAR_SETS[it?.set];
  if (!set) return '';
  const own = who ? ownedSetIds(who, it.set).length : 0;
  const hasWear = set.tiers.some((t) => tierRule(set, t) === 'wear');
  const wear = who && hasWear ? wornSetIds(who, it.set).length : 0;
  return `${set.name} ${own}/${set.items.length}${hasWear && who ? `（つけている${wear}）` : ''}`;
}

// 説明の 行（[文]。作品の 品で ない 物は []）
export function r88DetailLines(id, who = null) {
  const it = workIt(id);
  if (!it) return [];
  const out = [];
  const g = GRADES[it.grade];
  if (WORKS[it.work]) out.push(`作品：${WORKS[it.work].name}${g && it.grade !== 'shop' ? `（${g.name}）` : ''}`);
  const fx = innateFx(id);
  if (fx.length) out.push(`作品の力：${fx.map((x) => fxText(x.k, x.v)).join('・')}`);
  if (it.orb?.el) out.push(`玉：つけると、武器のふつうの攻撃が${EL[it.orb.el] || ''}になる（武器に属性があれば、そちらが先）`);
  const a = ABILITIES[it.use?.ability];
  if (a) out.push(`使う：${a.name}（1つの戦いで1回・MPなし）${a.desc ? `\n　${a.desc}` : ''}`);
  // G2班: 使うと HPが へる 品（雷神）・形を かえる 武器（鋼金暗器）
  if (a && it.use.hpCost) out.push(`　使うと、HPが少しへる（最大HPの${Math.round(it.use.hpCost * 100)}%）`);
  if (it.shape && it.form) out.push(`形：${it.form}（装備のまどの「形をかえる」で、持てる形にかえられる）`);
  const set = GEAR_SETS[it.set];
  if (set) {
    out.push(`そろい：${setLine(id, who)}`);
    for (const t of set.tiers) out.push(`　${t.text}`);
  }
  const rb = REBIRTH[baseItemId(id)];
  if (rb && ITEMS[rb.to] && rb.need) out.push(`生まれ変わる条件：${rebirthNeedText(rb.need)}`);
  return out;
}

// 第96回: 道具の まどの 紹介の いちばん 上に 出す「効果」（1つ 1行・短く）と、その 下に 出す くわしい 行に 分ける。
//   中みは r88DetailLines と おなじ（ならびだけ かえる）。もどりち: { fx: [文], more: [文] }
export function r88Parts(id, who = null) {
  const it = workIt(id);
  if (!it) return { fx: [], more: [] };
  const fx = [];
  const more = [];
  const g = GRADES[it.grade];
  if (WORKS[it.work]) more.push(`作品：${WORKS[it.work].name}${g && it.grade !== 'shop' ? `（${g.name}）` : ''}`);
  const inn = innateFx(id);
  if (inn.length) fx.push(`作品の力：${inn.map((x) => fxText(x.k, x.v)).join('・')}`);
  if (it.orb?.el) fx.push(`玉：ふつうの攻撃が${EL[it.orb.el] || ''}になる`);
  if (it.orb?.el) more.push('玉：武器に属性があれば、そちらが先');
  const a = ABILITIES[it.use?.ability];
  if (a) {
    fx.push(`使う：${a.name}（1つの戦いで1回）`);
    more.push(`使う：${a.name}（1つの戦いで1回・MPなし）${a.desc ? `\n　${a.desc}` : ''}`);
    if (it.use.hpCost) more.push(`　使うと、HPが少しへる（最大HPの${Math.round(it.use.hpCost * 100)}%）`);
  }
  if (it.shape && it.form) {
    fx.push(`形：${it.form}`);
    more.push(`形：${it.form}（装備のまどの「形をかえる」で、持てる形にかえられる）`);
  }
  const set = GEAR_SETS[it.set];
  if (set) {
    fx.push(`そろい：${setLine(id, who)}`);
    more.push(`そろい：${set.name}`);
    for (const t of set.tiers) more.push(`　${t.text}`);
  }
  const rb = REBIRTH[baseItemId(id)];
  if (rb && ITEMS[rb.to] && rb.need) fx.push(`生まれ変わる条件：${rebirthNeedText(rb.need)}`);
  return { fx, more };
}

// とどく 広さの 文（info.js の ムチ・ブーメランの 行の かわり。ない ときは ''）
export function r88ReachText(id) {
  const r = itemReach(id);
  if (!r) return '';
  return `${r === 'group' ? '攻撃で同じ種類の敵みんなに当たる' : '攻撃で敵全体に当たる'}（2体目から少しずつ弱くなる）`;
}
