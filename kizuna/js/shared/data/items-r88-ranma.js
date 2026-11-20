// 第88回 G8班: らんま1/2 の 品（docs/plan-r88-anime-gear.md の 2-7）
//   作品の 職業（無差別格闘流の門下生・早おとめ乱馬・飛竜しょう天はの達人）は ツメと 素手・服と 道着
//   ・伝説の 品は ない（作品の 中に「いちばんの 品」が ない。ライバルの さいごの コロンも 名品を くれる）
//   ・呪泉郷の 水 3つ … 上がる 所と 下がる 所が ある。お湯の やかんを 持って いると、つけた 水の 下がる 所が 消える（そろい jusen）
//   ・止水おけ ＋ 開水つぼ … ジャコウ王朝の 1組の 秘宝（そろい shisui_kaisui）
//   ・すがたの 書き方は 職業と 同じ（jobs-r84b.js）: 水を かぶった すがたは「水のすがた」。男女が 入れかわる 話には しない
//   ・入れない 品: のどかの 日本刀（設計書 2-7）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=bb73dc4f9aca';

const R = { work: 'ranma' };
const J = { work: 'ranma', set: 'jusen' };
const K = { work: 'ranma', set: 'shisui_kaisui' };

const GEAR = {
  // ───── 乱馬と 天道家・早おとめ家の 品 ─────
  r88_rm_china: { ...armor('gi', 'mei'), ...R, name: '赤い中国服', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 8 }, desc: 'おさげの格闘家がいつも着ている、赤い中国服。動きやすく、敵の攻撃をかわしやすくなる。' },
  r88_rm_hige: { ...acc('fu3'), ...R, name: '竜のひげ', bonus: { str: 12, hp: 10 }, desc: 'おさげをむすぶ、ふしぎなひも。とても強い毛はえ薬だという。力が上がる。' },
  r88_rm_yakan: { ...acc('fu3'), ...J, name: 'お湯のやかん', fx: [{ k: 'res_ice', v: 4 }], bonus: { hp: 20 }, desc: 'いつでもお湯をわかせる、小さなやかん。お湯をかぶると、水のすがたが元にもどる。氷に強い。持っていると、呪泉郷の水の下がる所が消える。' },
  r88_rm_akane_gi: { ...armor('gi', 'fu3'), ...R, name: 'あかねの道着', bonus: { str: 8 }, desc: '天道道場のむすめが、けいこで着る道着。力が上がる。' },
  r88_rm_placard: { ...shield('fu3'), ...R, name: 'プラカード', fx: [{ k: 'guard_confuse', v: 4 }], look: 'tower', desc: 'パンダのすがたの時は話せないので、字を書いて見せる板。「落ちつけ」と書いてある。混乱にかかりにくい。' },
  // ───── 呪泉郷の 水（上がる 所と 下がる 所）─────
  r88_rm_nyan: { ...acc('fu3'), ...J, name: 'ニャンニーチュアンの水', bonus: { agi: 18, str: -10 }, desc: '呪泉郷の泉の水。かぶると、小がらで身軽な「水のすがた」になる。素早さが上がるが、力が下がる。' },
  r88_rm_panda: { ...acc('fu3'), ...J, name: 'シオンマオニーチュアンの水', bonus: { hp: 70, agi: -10 }, desc: '呪泉郷の泉の水。かぶると、大きなパンダのすがたになる。最大HPが大きく上がるが、素早さが下がる。' },
  r88_rm_buta: { ...acc('fu3'), ...J, name: 'ヘイトゥンニーチュアンの水', fx: [{ k: 'evade', v: 6 }], bonus: { hp: -40 }, desc: '呪泉郷の泉の水。かぶると、小さな黒いこぶたのすがたになる。敵の攻撃をかわしやすくなるが、最大HPが下がる。' },
  r88_rm_shisui: { ...acc('mei'), ...K, name: '止水おけ', fx: [{ k: 'res_ice', v: 5 }], bonus: { def: 8 }, use: { ability: 'r88u_shisui' }, desc: 'ジャコウ王朝の秘宝のおけ。くんだ水をかけると、お湯でもすがたが元にもどらない。開水つぼと1組。氷に強い。使うと、敵1体のすがたをかためて動けなくする。' },
  r88_rm_kaisui: { ...acc('mei'), ...K, name: '開水つぼ', fx: [{ k: 'guard_confuse', v: 5 }], bonus: { hp: 24 }, use: { ability: 'r88u_kaisui' }, desc: 'ジャコウ王朝の秘宝の、やかんの形のつぼ。わかしたお湯で、止水おけの力を消す。止水おけと1組。混乱にかかりにくい。使うと、仲間みんなの弱くなっていた力を元にもどす。' },
  // ───── ライバル・仲間の 品 ─────
  r88_rm_bangasa: { ...weapon('axe', 'mei'), ...R, name: '番がさ', bonus: { def: 12 }, look: 'hammer', desc: 'いつも道にまよう格闘家が持ち歩く、とても重いかさ。こん棒のようにも使う。守備力も上がる。' },
  r88_rm_bandana: { ...weapon('boomerang', 'fu3'), ...R, name: '良がのバンダナ', fx: [{ k: 'chase', v: 4 }], look: 'cross', desc: '回して投げると、やいばのように切れるバンダナ。ときどきもう1回攻撃する。' },
  r88_rm_sosui: { ...weapon('bat', 'mei'), ...R, name: 'シャンプーのそうすい', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 4 }, look: 'club', desc: '女けつ族のむすめが両手に持つ、2本の大きなこん棒。会心の一撃が出やすい。' },
  r88_rm_jitensha: { ...acc('fu3'), ...R, name: '出前の自転車', bonus: { agi: 16 }, desc: '中国料理の店「ねこはんてん」の出前で乗り回す自転車。やねの上でも走る。素早さが上がる。' },
  r88_rm_okamochi: { ...shield('fu3'), ...R, name: '岡持ち', fx: [{ k: 'regen', v: 4 }], look: 'tower', desc: '出前の料理を入れて運ぶ箱。中のラーメンは、まだあつあつ。行動するたびにHPが少し回復する。' },
  r88_rm_senpatsu: { ...acc('fu3'), ...R, name: 'わすれのシャンプー', bonus: { mag: 6 }, use: { ability: 'r88u_senpatsu' }, desc: '漢方の薬をまぜたシャンプーと、つぼおしの技で、少しの間、覚えていることをわすれさせる。使うと、敵1体を混乱させる。' },
  r88_rm_anki: { ...weapon('whip', 'mei'), ...R, name: 'ムースの暗器', fx: [{ k: 'paralyze', v: 5 }], bonus: { agi: 4 }, look: 'chain', desc: 'そでの下にかくした、たくさんの武器。くさりがまをのばして戦う。ときどき敵をマヒさせる。' },
  r88_rm_megane: { ...head('fu3'), ...R, name: 'びんぞこメガネ', bonus: { def: 8 }, crit: -0.015, desc: 'とてもあついレンズのメガネ。かけないと、何も見えない。守備力が上がるが、会心の一撃が少し出にくい。' },
  r88_rm_bokuto: { ...weapon('sword', 'fu3'), ...R, name: '九能の木刀', fx: [{ k: 'chase', v: 4 }], look: 'wood', desc: '高校の剣道部の主将が、いつも持っている木刀。「つきつきつき」とつきをひたすら出す。ときどきもう1回攻撃する。' },
  r88_rm_ribbon: { ...weapon('whip', 'fu3'), ...R, name: '新体操のリボン', fx: [{ k: 'paralyze', v: 4 }], look: 'whip', desc: '新体操部のエースのリボン。しかけがあって、かたくもなる。ときどき敵をマヒさせる。' },
  r88_rm_club: { ...weapon('bat', 'fu3'), ...R, name: '新体操のこん棒', fx: [{ k: 'crit', v: 4 }], look: 'bat', desc: '新体操のこん棒。中にしかけがある。会心の一撃が出やすい。' },
  r88_rm_ball: { ...weapon('boomerang', 'fu3'), ...R, name: '新体操のボール', fx: [{ k: 'chase', v: 4 }], look: 'star', desc: '新体操のボール。しかけで、はねかえってまたとんでくる。ときどきもう1回攻撃する。' },
  r88_rm_shibire: { ...acc('fu3'), ...R, name: '小太刀のしびれ薬', bonus: { agi: 6 }, use: { ability: 'r88u_shibire' }, desc: '新体操部のエースが、道具にしこむしびれ薬。使うと、敵1体をマヒさせる。' },
  r88_rm_hera_big: { ...weapon('axe', 'mei'), ...R, name: '大きなヘラ', fx: [{ k: 'crit', v: 6 }], look: 'battle', desc: 'お好み焼き屋の少女が、せなかにかつぐ大きなヘラ。会心の一撃が出やすい。' },
  r88_rm_hera_small: { ...weapon('boomerang', 'fu3'), ...R, name: '小さなヘラ', fx: [{ k: 'chase', v: 4 }], look: 'boomer', desc: '1本から3本、つぎつぎに投げる小さなヘラ。ときどきもう1回攻撃する。' },
  // ───── 女けつ族の 秘宝と 八宝さいの 品 ─────
  r88_rm_cologne: { ...weapon('staff', 'mei'), ...R, name: 'コロンのつえ', bonus: { agi: 12, mag: 8 }, look: 'cane', desc: '女けつ族の長のおばあさんが、身がるにとびのる長いつえ。素早さが上がる。' },
  r88_rm_fujinsen: { ...weapon('fan', 'mei'), ...R, name: '風神せん', fx: [{ k: 'el_wind', v: 5 }, { k: 'guard_poison', v: 4 }], look: 'tessen', desc: '女けつ族の秘宝のおうぎ。あおぐと、毒もふきとばす大風が起きる。ふつうの攻撃が風になる。毒にかかりにくい。' },
  r88_rm_hanten: { ...acc('mei'), ...R, name: '反転宝じゅ', fx: [{ k: 'guard_confuse', v: 5 }], bonus: { mag: 8 }, use: { ability: 'r88u_hanten' }, desc: '女けつ族の秘宝のブローチ。さかさにつけると、好きがきらいにかわる。混乱にかかりにくい。使うと、敵1体を混乱させる。' },
  r88_rm_hadoku: { ...shield('mei'), ...R, name: '破毒のたて', fx: [{ k: 'guard_poison', v: 6 }], look: 'crest', desc: '女けつ族の秘宝のたて。まん中に「破」の字。どんな毒もふせぐが、薬には弱いという。毒にかかりにくい。' },
  r88_rm_kaen: { ...weapon('staff', 'mei'), ...R, name: '火炎じょう', fx: [{ k: 'el_fire', v: 5 }], bonus: { mag: 12 }, use: { ability: 'r88u_kaen' }, look: 'dragon', desc: '女けつ族の秘宝の、竜のついたつえ。ふつうの攻撃が炎になる。使うと、地面をついて、竜に大きな炎をはかせる。' },
  r88_rm_houyou: { ...acc('mei'), ...R, name: '熱愛ほうよう香', bonus: { mag: 8, agi: 4 }, use: { ability: 'r88u_houyou' }, desc: '女けつ族の秘宝のお香。かがせて合言葉を言うと、言った人にだきついてはなれない。使うと、敵1体が少しの間動けない。' },
  r88_rm_horegusuri: { ...acc('mei'), ...R, name: 'ほれ薬のうで輪', bonus: { agi: 8, hp: 16 }, use: { ability: 'r88u_horegusuri' }, desc: '女けつ族の家宝のうで輪。一しゅん玉・一日玉・一生玉の3つの玉がついている。使うと、敵1体が少しの間動けない。' },
  r88_rm_nanban: { ...shield('mei'), ...R, name: 'なんばんミラー', fx: [{ k: 'evade', v: 5 }], use: { ability: 'r88u_nanban' }, look: 'mirror', desc: '女けつ族の秘宝のかがみ。時をこえることができるという。敵の攻撃をかわしやすくなる。使うと、かならずにげられる（にげられない戦いはだめ）。' },
  r88_rm_happo: { ...weapon('boomerang', 'mei'), ...R, name: '八宝大か輪', bonus: { str: 6 }, use: { ability: 'r88u_happo' }, look: 'star', desc: '八宝さいが、火薬も自分でまぜて作る大きな花火玉。投げ返されると自分も大さわぎ。使うと、敵全体に大きな花火をはれつさせる。' },
};
priceUp(GEAR);

export const ITEMS_R88_RANMA = GEAR;
// 生まれ変わりは ない
export const R88_REBIRTH_RANMA = {};

export const R88_RANMA_KANA = {
  r88_rm_china: 'あかいちゅうごくふく', r88_rm_hige: 'りゅうのひげ', r88_rm_yakan: 'おゆのやかん', r88_rm_akane_gi: 'あかねのどうぎ', r88_rm_placard: 'ぷらかーど',
  r88_rm_nyan: 'にゃんにーちゅあんのみず', r88_rm_panda: 'しおんまおにーちゅあんのみず', r88_rm_buta: 'へいとぅんにーちゅあんのみず', r88_rm_shisui: 'しすいおけ', r88_rm_kaisui: 'かいすいつぼ',
  r88_rm_bangasa: 'ばんがさ', r88_rm_bandana: 'りょうがのばんだな', r88_rm_sosui: 'しゃんぷーのそうすい', r88_rm_jitensha: 'でまえのじてんしゃ', r88_rm_okamochi: 'おかもち',
  r88_rm_senpatsu: 'わすれのしゃんぷー', r88_rm_anki: 'むーすのあんき', r88_rm_megane: 'びんぞこめがね', r88_rm_bokuto: 'くのうのぼくとう', r88_rm_ribbon: 'しんたいそうのりぼん',
  r88_rm_club: 'しんたいそうのこんぼう', r88_rm_ball: 'しんたいそうのぼーる', r88_rm_shibire: 'こだちのしびれぐすり', r88_rm_hera_big: 'おおきなへら', r88_rm_hera_small: 'ちいさなへら',
  r88_rm_cologne: 'ころんのつえ', r88_rm_fujinsen: 'ふうじんせん', r88_rm_hanten: 'はんてんほうじゅ', r88_rm_hadoku: 'はどくのたて', r88_rm_kaen: 'かえんじょう',
  r88_rm_houyou: 'ねつあいほうようこう', r88_rm_horegusuri: 'ほれぐすりのうでわ', r88_rm_nanban: 'なんばんみらー', r88_rm_happo: 'はっぽうだいかりん',
};
