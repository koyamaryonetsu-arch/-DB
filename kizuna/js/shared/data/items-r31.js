// 第31回の 装備（担当B）: しあわせのぼうし・こうふくのくつ（items.js で まぜる）
//   perk … 強さ いがいの ふしぎな 力（戦いの 経験値・歩くと MP。world/perks.js が 使う）
//   ・しあわせのぼうし（頭）: つけた 人の 経験値が 2倍。ただし その 戦いの パーティー（馬車の 仲間も ふくむ）で
//     いちばん レベルが 高い 人（同じ レベルが 何人も いれば その 人たち）が つけても 効かない。カジノの 景品
//   ・こうふくのくつ（アクセサリー）: つけた 人ごとに 10歩 歩くと MPが 1 回復（フィールドと ダンジョン。サーバーで 数える）。
//     メダル王の ごほうび（35枚）・宝の洞窟の 高い レアの 宝（担当C）
export const HAT_EXP_MULT = 2;
export const SHOE_STEPS = 10;
export const SHOE_MP = 1;

export const ITEMS_R31 = {
  shiawase_boushi: {
    name: 'しあわせのぼうし', type: 'head', rank: 4, star: true, def: 5, bonus: { mp: 5 }, perk: 'expHat', price: 0, sell: 500,
    desc: 'かぶるとしあわせな気持ちになるぼうし。かぶった人は、戦いでもらえる経験値が2倍になる。でも、パーティーでいちばんレベルが高い人がかぶっても効かない。',
  },
  koufuku_kutsu: {
    name: 'こうふくのくつ', type: 'acc', rank: 5, star: true, bonus: { agi: 4 }, perk: 'walkMp', price: 0, sell: 500,
    desc: 'はくと足どりが軽くなる、ふしぎなくつ。フィールドやダンジョンを10歩歩くごとに、はいている人のMPが1回復する。',
  },
};

export const R31_ITEM_KANA = { shiawase_boushi: 'しあわせのぼうし', koufuku_kutsu: 'こうふくのくつ' };

// メニュー・お店の せつめいに 出す みじかい 力の 文（ui/info.js）。ない 品は ''
export const PERK_TEXT = {
  expHat: `経験値${HAT_EXP_MULT}倍（パーティーでいちばんレベルが高い人は効かない）`,
  walkMp: `${SHOE_STEPS}歩歩くごとにMP+${SHOE_MP}（フィールド・ダンジョン）`,
};
export function perkText(it) {
  return (it && PERK_TEXT[it.perk]) || '';
}
