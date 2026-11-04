// 第64回 ⑥c: れん金がまで 装備に 効果を つける（家族が 決めた: 入れた 素材で 効果が きまる → きたえるほど 強く）
//   ・つけられるのは 店で 買えない 装備（★2〜）。1つの 装備に 1つ（つけなおすと 入れかわる）
//   ・効果は「つけた 人の、その 装備の しゅるい」に のこる（char.gearFx[もとの 装備の id] = 効果。c.alchemy.cap と 同じ 考え方）
//     同じ 装備を 2つ 持っていても、その 人が 装備した ときだけ 効く。きたえた +1〜 も 同じ しゅるい
//   ・強さは 装備の +の 数で 上がる（fxPower）
//   ・「使う」効果: 戦いの「道具」から 何回でも 使える（1回の 行動を つかう。MP は いらない）
import { ITEMS } from './items.js?v=49f690cedd1e';
import { isShopGear } from './items-rare.js?v=49f690cedd1e';

export const STAR = 'star_shard';

// 効果（slots … つけられる 部位・mats … いる 素材・use … 道具として 使う 技）
export const GEAR_FX = {
  chase: { name: '追撃', slots: ['weapon'], mats: [['wind_feather', 3], [STAR, 1]], desc: 'ふつうの攻撃のあと、ときどきもう1回攻撃する' },
  drain: { name: 'HP吸収', slots: ['weapon'], mats: [['beast_fang', 3], [STAR, 1]], desc: 'ふつうの攻撃で、あたえたダメージの一部だけHPが回復する' },
  mana: { name: 'MP吸収', slots: ['weapon'], mats: [['magic_powder', 3], [STAR, 1]], desc: 'ふつうの攻撃が当たると、MPが少し回復する' },
  useIo: { name: 'イオの力', slots: ['weapon'], mats: [['magic_powder', 2], ['silver_shard', 1], [STAR, 1]], desc: '戦いの「道具」で使うと、敵全体にイオ（MPはいらない。何回でも）', use: 'io', useHi: 'iora' },
  regen: { name: 'いやし', slots: ['armor', 'shield', 'head'], mats: [['pretty_shell', 3], [STAR, 1]], desc: '行動するたびに、HPが少し回復する' },
  counter: { name: '反撃', slots: ['armor', 'shield'], mats: [['iron_shard', 3], [STAR, 1]], desc: 'ふつうの攻撃をされると、ときどきやりかえす' },
  useSukuruto: { name: '守りの光', slots: ['shield'], mats: [['silver_shard', 2], [STAR, 1]], desc: '戦いの「道具」で使うと、味方全員にスクルト（MPはいらない。何回でも）', use: 'sukuruto' },
  useHoimi: { name: 'いやしの光', slots: ['armor', 'head'], mats: [['herb', 3], [STAR, 1]], desc: '戦いの「道具」で使うと、自分にホイミ（+5からベホイミ。MPはいらない。何回でも）', use: 'hoimi', useHi: 'behoimi' },
};
export const GEAR_FX_ORDER = Object.keys(GEAR_FX);
// 「使う」効果が もっと 強く なる +の 数
export const USE_HI_PLUS = 5;

const EQUIP_SLOTS = ['weapon', 'armor', 'shield', 'head'];
export const baseOf = (id) => ITEMS[id]?.base || id;

// その 装備に 効果を つけられるか（できない ときは わけ）
export function fxBlock(id, kind) {
  const it = ITEMS[id];
  if (!it || !EQUIP_SLOTS.includes(it.type)) return 'その装備には、効果をつけられない。';
  const base = ITEMS[baseOf(id)] || it;
  if (isShopGear(base)) return '店の品（★1）には、効果をつけられない。';
  if (kind && !GEAR_FX[kind]?.slots.includes(it.type)) return 'その効果は、この装備にはつけられない。';
  return null;
}

// 強さ（plus … 装備の +の 数）
export function fxPower(kind, plus = 0) {
  const p = Math.max(0, plus | 0);
  switch (kind) {
    case 'chase': return { chance: Math.min(0.6, 0.25 + 0.03 * p), mult: 0.5 };
    case 'drain': return { rate: Math.min(0.3, 0.08 + 0.015 * p) };
    case 'mana': return { mp: 2 + Math.floor(p / 2) };
    case 'regen': return { rate: Math.min(0.1, 0.03 + 0.005 * p) };
    case 'counter': return { chance: Math.min(0.5, 0.15 + 0.025 * p), mult: 0.7 };
    default: {
      const f = GEAR_FX[kind];
      return f?.use ? { use: p >= USE_HI_PLUS && f.useHi ? f.useHi : f.use } : {};
    }
  }
}

// 効果の みじかい せつめい（強さの 数つき）
export function fxText(kind, plus = 0) {
  const f = GEAR_FX[kind];
  if (!f) return '';
  const p = fxPower(kind, plus);
  const pct = (v) => `${Math.round(v * 100)}%`;
  switch (kind) {
    case 'chase': return `${f.name}（${pct(p.chance)}の確率）`;
    case 'drain': return `${f.name}（ダメージの${pct(p.rate)}）`;
    case 'mana': return `${f.name}（MP+${p.mp}）`;
    case 'regen': return `${f.name}（最大HPの${pct(p.rate)}）`;
    case 'counter': return `${f.name}（${pct(p.chance)}の確率）`;
    default: return `${f.name}（道具で使う）`;
  }
}

// その 人が 今 装備している 物の 効果（[{ kind, slot, id, plus }]）
export function gearFxOf(char) {
  const out = [];
  const fx = char?.gearFx;
  if (!fx || typeof fx !== 'object') return out;
  for (const slot of EQUIP_SLOTS) {
    const id = char.equip?.[slot];
    if (!id || !ITEMS[id]) continue;
    const kind = fx[baseOf(id)];
    if (!GEAR_FX[kind] || !GEAR_FX[kind].slots.includes(slot)) continue;
    out.push({ kind, slot, id, plus: ITEMS[id].plus || 0 });
  }
  return out;
}

// 戦いで 道具と して 使える 装備の 効果（[{ slot, id, ability }]）
export function gearUses(char) {
  return gearFxOf(char).filter((x) => GEAR_FX[x.kind].use).map((x) => ({ slot: x.slot, id: x.id, kind: x.kind, ability: fxPower(x.kind, x.plus).use }));
}

// セーブの 直し（へんな 形は すてる）
export function repairGearFx(char) {
  if (!char || char.gearFx === undefined) return;
  if (!char.gearFx || typeof char.gearFx !== 'object' || Array.isArray(char.gearFx)) { delete char.gearFx; return; }
  for (const [k, v] of Object.entries(char.gearFx)) if (!ITEMS[k] || !GEAR_FX[v]) delete char.gearFx[k];
}
