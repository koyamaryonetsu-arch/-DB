// 第86回 B班: 幻の職業 2つ「天下一の格闘王」「混とんの大軍師」（docs/plan-jobs-r79.md の 11・docs/plan-r86-phantom-b.md）
//
// ・幻の職業（tier 4）。なり方は 今の 幻と おなじ: req の 2つを きわめる ＋ やりこみの 条件（data/phantom.js の PHANTOM_JOBS）。reqSuper などは 使わない
//   天下一の格闘王（tenkaichi_king）… 魔界の王の子（makai_prince）＋ 飛竜しょう天はの達人（hiryu_master）
//   混とんの大軍師（chaos_gunshi）  … ドラまた（doramata）＋ ほう神の大軍師（hoshin_gunshi）
// ・強さ（mods）は もとの 2つの 伝説の どの 強さも 下まわらない・合計は 幻の はんい（10.85〜11.9）
// ・この 職業だけの しくみは shared/battle-r86b.js（戦いの 中だけ。キャラにも セーブにも 項目を 足さない）。もとの 伝説の しくみを データで つなぐ:
//   reiMax    … 戦い 1回の れい丸の 数（battle-r84a.js の reiMax が 見る）。格闘王は 8発。カウンターが 決まるたびに 1発 もどる
//   formPct   … 水と お湯の すがたの 効き目（battle-r84b.js の formPct が 見る）。伝説と おなじ 25%（幻だからと 上げない）
//   passive.rise … 1回だけ 立ち上がる（battle-r84a.js。魔界の王の子と おなじ。2つ 重ならない）
//   sakusenSet・sakusenPct … 立てられる 作戦と 効き目（battle-r83a.js が 見る）。大軍師は 攻め・守り・速攻 ＋ 4つ目「大魔法の時間」（mahou）。効き目は 伝説と おなじ 25%
//   passive.hayakuchi … 早口（battle-r85a.js。となえた ターンに この わりあいで すぐ もう 1回 動ける）。大軍師は 半分
// ・技は abilities-r86b.js・ひらめき技は hirameki-r86b.js。えんしゅつは client/render/battlefx-r86b.js
// ・名前の 字: 「混沌」の 沌 は 習わない 字なので「混とん」（設計の まま）。「霊」「昇」は れい・しょう（もとの 系統と おなじ）
// jobs.js が JOBS に まぜて、PHANTOM_ORDER に 2つ 足す（R86B_JOBS）

export const JOBS_R86B = {
  // 天下一の格闘王: れい丸の 必殺と カウンターを 両方 持つ。カウンターが 決まると れい丸が もどる
  tenkaichi_king: {
    id: 'tenkaichi_king', name: '天下一の格闘王', kana: 'てんかいちのかくとうおう', short: '格闘王', tier: 4, req: ['makai_prince', 'hiryu_master'], family: 'phys', color: '#d8302a',
    desc: '武術会のリングで、だれにも負けなかった格闘の王。魔界の王の子と飛竜しょう天はの達人をきわめ、素手の技とカウンターをたくさん使った者だけがなれる。れい丸は1回の戦いで8発。カウンターが決まるたびに、れい丸が1発もどる。水とお湯のすがたも使え、たおれても1回だけ立ち上がる。',
    mods: { hp: 1.95, mp: 1.35, str: 2.2, def: 1.6, agi: 2.0, mag: 0.8, heal: 1.2 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1.5, agi: 1, hp: 1 },
    passive: { rise: { hp: 0.5, pow: 1.3, acts: 3 } },
    reiMax: 8,
    formPct: 0.25,
    learn: [[1, 'tkk_reigan'], [2, 'tkk_kaburu'], [3, 'tkk_mikiri'], [5, 'tkk_amaguri'], [6, 'tkk_kakehiki'], [7, 'tkk_sandan'], [8, 'tkk_touki'], [10, 'tenkaichi_king_sig']],
  },
  // 混とんの大軍師: 作戦で 仲間を そろえて、いちばん 強い 呪文を うつ
  chaos_gunshi: {
    id: 'chaos_gunshi', name: '混とんの大軍師', kana: 'こんとんのだいぐんし', short: '混とん軍師', tier: 4, req: ['doramata', 'hoshin_gunshi'], family: 'magic', color: '#5a2a9a',
    desc: '作戦と大魔法を、ひとつの頭で組み立てる大軍師。ドラまたとほう神の大軍師をきわめ、攻撃の呪文と作戦の技をたくさん使い、呪文で大きなダメージをあたえた者だけがなれる。4つ目の作戦「大魔法の時間」では、となえている仲間を守り、となえた呪文を強くする。半分の確率で早口になり、となえたらすぐに動ける。',
    mods: { hp: 1.6, mp: 1.95, str: 1.1, def: 1.35, agi: 1.65, mag: 2.0, heal: 1.4 },
    weapons: ['staff', 'whip', 'fan', 'dagger', 'none'], shield: false, armor: ['cloth', 'robe'], helm: true,
    perLv: { mag: 1.5, mp: 1, agi: 0.5 },
    passive: { hayakuchi: 0.5 },
    sakusenSet: ['seme', 'mamori', 'sokkou', 'mahou'],
    sakusenPct: 0.25,
    learn: [[1, 'kon_sakusen'], [2, 'kon_tonaeru'], [3, 'kon_dashin'], [5, 'kon_ragna'], [6, 'kon_teishoku'], [7, 'kon_dragslave'], [8, 'kon_minna'], [10, 'chaos_gunshi_sig']],
  },
};

export const R86B_JOBS = Object.keys(JOBS_R86B);

// 神殿の うわさ（数は 言わない。物語の 先は 書かない）
export const HINTS_R86B = {
  tenkaichi_king: '魔界の王の子と飛竜しょう天はの達人、2つの道をきわめて、素手の技とカウンターをみがきつづけた者は、天下一の格闘王になれるらしい…',
  chaos_gunshi: 'ドラまたとほう神の大軍師、2つの道をきわめて、呪文と作戦をたくさん使った者は、混とんの大軍師になれるらしい…',
};
