// 第98回 K2班: 天下無そうの剣ごうの オート と 持てる 玉（data/jobs-r98-kengou.js。しくみは 親の 物〈玉がえ・属性の 剣・玉を はめかえる 剣〉と
//   弱点の もう 一太刀〈battle-r82b.js の weakSlash〉）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   この ファイルは client/battle.js も ai.js 経由で 読む ので、玉がえの メニュー（client/battle-r82b.js の tamaMenu）にも 6つの 玉が 出る
import { TAMA_BY_JOB, TAMA_ORDER, bestTama, tamaOf, tamaScore } from './battle-r82b.js?v=6a6b763889f6';

// 持てる 玉: 竜神けんのサムライと おなじ 6つ（雷・火・水・氷・風・竜神）
TAMA_BY_JOB.tenka_kengou = TAMA_ORDER;

// オートの わりあい（tools/sim-r86a.mjs・tools/sim-jobs.mjs で 合わせた）
export const KENGOU_AI = { mantle: 0.4, sig: 0.4, boss: 0.8, many: 0.05, duel: 0.65 };
const pw = (a) => (a.effect.mult || 1) * (a.effect.hits || 1);

export function kengouPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'tenka_kengou');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const boss = foes.find((f) => f.boss);
  // 前ぶれの 間は「大わざに そなえる」に まかせる
  if (foes.some((f) => f.telegraph)) return null;
  // 1) 玉がえ: 弱点の 玉が 分かって いて、今の 玉より はっきり よい（YAIBA と おなじ 物さし）
  const swap = find('kg_tamagae');
  if (swap) {
    const el = bestTama(b, c, foes);
    if (el) return { type: 'ability', id: swap.id, tama: el };
  }
  // 2) ボス: マントを ぬぐ／ときどき 看板（7つの 玉。弱点に 当たれば もう 一太刀）／1体の いちばん 強い 剣
  if (boss) {
    if (c.hp < c.maxHp * 0.35) return null;
    const mantle = find('kg_mantle');
    if (mantle && !c.buffs?.atk && b.rng.chance(KENGOU_AI.mantle)) return { type: 'ability', id: mantle.id };
    const sig = find('tenka_kengou_sig');
    if (sig && b.rng.chance(KENGOU_AI.sig)) return { type: 'ability', id: sig.id, target: boss.id };
    if (b.rng.chance(KENGOU_AI.boss)) {
      const one = my.filter(({ id, a }) => a.target === 'enemy' && a.effect?.type === 'phys' && id !== 'tenka_kengou_sig').sort((x, y) => pw(y.a) - pw(x.a))[0];
      if (one) return { type: 'ability', id: one.id, target: boss.id };
    }
    return null;
  }
  // 3) 敵が 多い ＝ 全体の 剣（雷神の神速ぎり・風の玉・竜巻閃）
  if (foes.length >= 3 && b.rng.chance(KENGOU_AI.many)) {
    const all = find('kg_ikari') || find('kg_tatsumaki');
    if (all) return { type: 'ability', id: all.id };
  }
  // 4) ふつうの 戦い ＝ 1体ずつ 属性斬り・二の太刀（今の 玉が 弱点の 敵を 先に。弱点なら はやい もう 一太刀）
  const ft = find('kg_futatachi');
  if (ft && b.rng.chance(KENGOU_AI.duel)) {
    const el = tamaOf(c);
    const t = foes.slice().sort((x, y) => tamaScore(b, c, el, [y]) - tamaScore(b, c, el, [x]) || x.hp - y.hp)[0];
    return { type: 'ability', id: ft.id, target: t.id };
  }
  return null;
}
