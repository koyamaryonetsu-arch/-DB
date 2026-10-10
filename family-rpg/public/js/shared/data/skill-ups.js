// 上位の 技（2026年10月 見なおし）
//
// 技の 威力は、その 技の 職業の レベルで 上がる（stats.js の jobPower。1レベルで +4%・マスターで +36%）。
// 前は、上の 職業に なった ばかりの とき、マスターした 下の 職業の 技（かめはめ波 +36%）の ほうが、
// 上の 技（超かめはめ波 +0%）より 強かった（「ダメージが 変わらない」）。
// そこで 上位の 技は、もとの 技の 職業レベルの 威力を うけつぐ（大きい ほう）。
// 上の 技の 倍率は もとの 技の 1.3〜1.5倍 いじょう に して ある（test/review-r26.test.js）
//
// SKILL_UPS[上位の 技] = もとの 技
export const SKILL_UPS = {
  // かめはめ波の なかま（サイヤ人 → スーパーサイヤ人 → 2 → 3）
  sz_kame: 'sy_kamehameha',
  s2_kame: 'sz_kame',
  s3_kame: 's2_kame',
  hi_bigbang_kame: 'sy_bigbang',
  s2_final: 'sz_kikouha',
  // 呪文の 上位（魔法使い・僧侶・賢者 → 超級職）
  am_meragaia: 'merazoma',
  hi_ima_mera: 'merazoma',
  am_begiragon: 'begirama',
  hi_giragureido: 'begirama',
  am_ionazun: 'iora',
  dz_iogurande: 'iora',
  sg_bagikurosu: 'bagima',
  hp_bagimuta: 'sg_bagikurosu',
  // 剣の 技の 上位
  dk_gigabreak: 'mk_inazuma',
  lt_gigacross: 'hr_gigaslash',
};

// もとの 技（ない ときは null）
export function skillBase(id) {
  return SKILL_UPS[id] || null;
}
