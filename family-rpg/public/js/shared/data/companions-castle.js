// 第5章 Step 9（B9）: 仲間の ノクト（名前の 約束 NOCTO_COMPANION。docs/plan-ch5.md の 17）
// ・クリアの あと（c5_clear）、酒場の 仲間に なる（A9 が 酒場に ならべる。shops.js の NPC_SUPPORTS と おなじ 形）
//   world/party.js の makeNpcSupportChar が skills を ひらめき技（char.hirameki）として 入れる（職業を かえても 使える）
// ・ソリトゥスの 第3段階で ゲストとして 加わる ノクトも、この 形（強さは NOCTO_GUEST。shared/battle-final.js の noctoGuestChar）
// ・ここは ほかの データを import しない（酒場の 一覧からも 読む ため）
//
// 職業は 魔剣士（闇の 剣と 忍びの わざ。せいちょうは ふつうの 魔剣士と おなじ）。
// 技は 前の 戦いに ちなむ: 紋章のつるぎ → 夜明けのつるぎ・黒い星のあらし → 白い星のあらし・かげぶんしん・ひとりにしない（data/abilities-final.js）
// 見た目（render/hero.js）: 黒い かみの 長い 前がみ・色白・きりっとした 目・むらさきの 服。絵は ふつうの 人の 絵を 使う
export const NOCTO_COMPANION = {
  id: 'npc_nocto', name: 'ノクト', job: 'magic_swordsman', tactics: 'balanced', minLevel: 55, unlock: 'c5_clear',
  look: { body: 0, hair: 0, hairColor: 0, skin: 0, color: 3, style: 'side', hcol: 'black', tone: 'fair', face: 'sharp' },
  skills: ['nc_dawn_blade', 'nc_star_storm', 'nc_shadow_step', 'nc_not_alone'],
  gear: { weapon: 'akatsuki_sword', armor: 'shiraha_mantle', shield: 'akatsuki_shield', head: 'shiraha_hat' },
  desc: 'もうひとりの紋章の子。もう、ひとりじゃない。夜明けのつるぎと白い星で、いっしょに戦ってくれる。',
};

// ソリトゥスの 第3段階で 加わる ゲストの ノクト（その 戦いだけ。ゲストなので 経験値・装備は のこらない）
//   lv … レベル（主人公より 低い ときは この レベル）/ jobLv … 魔剣士の 職業レベル / gear … 装備（紋章は ノクトの紋章）
export const NOCTO_GUEST = {
  lv: 55, jobLv: 10,
  gear: { weapon: 'akatsuki_sword', armor: 'nocto_star_cloak', shield: 'akatsuki_shield', head: 'akatsuki_helm', acc: 'nocto_crest' },
};
