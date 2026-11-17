// 第88回 G1班: ほう神演義の スーパー宝貝 7つ（docs/plan-r88-anime-gear.md の 2-1。ぜんぶ 伝説・そろいの 組 super_paopei）
//   のこりの 宝貝（崑崙・金鰲）は G2班が この ファイルに 足す
//   宝貝は「使う」物: use.ability … 戦いの 道具から 1つの 戦いで 1回（data/abilities-r88.js の かくし技）
import { weapon, armor, acc, priceUp } from './items-r88-kit.js';

const P = { work: 'houshin', set: 'super_paopei' };

const GEAR = {
  r88_raikoben: { ...weapon('whip', 'den'), ...P, name: '雷公べん', fx: [{ k: 'el_bolt', v: 8 }], bonus: { str: 16, mag: 16 }, use: { ability: 'r88u_raikou' }, look: 'royal', desc: 'スーパー宝貝の1つ。ムチの中でいちばん強い、最強の雷のムチ。ふつうの攻撃が雷になる。' },
  r88_kinben: { ...weapon('whip', 'den'), ...P, name: '禁べん', reach: 'all', bonus: { str: 18, agi: 8 }, use: { ability: 'r88u_kinben' }, look: 'chain', desc: 'スーパー宝貝の1つ。遠くはなれた敵までとどいて、打ちすえるムチ。ふつうの攻撃が敵全体にとどく。' },
  r88_taikyoku: { ...acc('den'), ...P, name: '太極図の巻物', fx: [{ k: 'mpregen', v: 8 }], bonus: { hp: 100, str: 20, def: 28, mag: 38, agi: 26, heal: 34, mp: 30 }, use: { ability: 'r88u_taikyoku' }, desc: 'スーパー宝貝の1つ。ほかの宝貝の力を消してしまう、白と黒の図の巻物。行動するたびにMPが回復する。' },
  r88_kinkosen: { ...weapon('dagger', 'den'), ...P, name: '金こうせん', fx: [{ k: 'chase', v: 8 }], bonus: { agi: 16, str: 10 }, use: { ability: 'r88u_kinko' }, look: 'jambiya', desc: 'スーパー宝貝の1つ。大きなはさみの形の宝貝。七色の竜をよび出す。ふつうの攻撃のあと、ときどきもう1回攻撃する。' },
  r88_keisei: { ...armor('robe', 'den'), ...P, name: 'けい世元じょう', fx: [{ k: 'evade', v: 8 }], bonus: { mag: 24, heal: 14, agi: 8 }, use: { ability: 'r88u_keisei' }, desc: 'スーパー宝貝の1つ。見た者の心をまどわす羽衣。敵の攻撃をかわしやすくなる。' },
  r88_rokkon: { ...armor('cloth', 'den'), ...P, name: '六こんばん', fx: [{ k: 'res_dark', v: 8 }], bonus: { hp: 40, agi: 10 }, use: { ability: 'r88u_rokkon' }, desc: 'スーパー宝貝の1つ。どんな物もつつみこむ、黒い布のマント。だれでも装備できる。闇に強い。' },
  r88_banko: { ...weapon('staff', 'den'), ...P, name: 'ばん古ばん', bonus: { mag: 46, heal: 24 }, use: { ability: 'r88u_banko' }, look: 'dragon', desc: 'スーパー宝貝の1つ。重力をあやつる旗。攻撃魔力がとても上がる。' },
};
priceUp(GEAR);

export const ITEMS_R88_HOUSHIN = GEAR;

export const R88_HOUSHIN_KANA = {
  r88_raikoben: 'らいこうべん', r88_kinben: 'きんべん', r88_taikyoku: 'たいきょくずのまきもの', r88_kinkosen: 'きんこうせん',
  r88_keisei: 'けいせいげんじょう', r88_rokkon: 'ろっこんばん', r88_banko: 'ばんこばん',
};
