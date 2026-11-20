// 第88回 G18班: はなかっぱ・おしり探ていの 品（docs/plan-r88-anime-gear.md の 4-8・4-9）
//   はなかっぱ … 作品の 職業（カッパ・はなかっぱ・筋肉ニンニク・かっぱの大王）は ツメ・つえ・オノ・服と 道着。頭は ぼうし
//   ・頭のつぼみ（はなかっぱの 一の試練の ごほうび）→ きたえると 大人の花に 生まれ変わる（大きく なって、自分の 花が 決まる）
//   ・わかランの花（伝説）… ちょう兵衛と がりぞーの まぼろしに 勝つと とり返せる。いやしと 回復の 力が 大きく 上がる
//   ・今 ある カッパのお皿は こわさず、作品の 品として 数える（R88_TAG_HANAKAPPA。強さ・手に入れ方は かえない）
//   おしり探てい … 作品の 職業（少年探てい団・おしり探てい）は つえ・短剣・ブーメラン・服と ローブ
//   ・名探ていのスーツとちょうネクタイ … 使う:「しつれい、こかせていただきます」で 敵1グループを ねむらせる
//   ・風のみちしるべ（伝説）… 満月の 夜の かいとうUの まぼろしに 勝つと もらえる
//   作品の 字は 使える 字に 直した（蘭 → ラン／蝶 → ちょう／紳 → しん／錠 → じょう／筋肉ニンニクの にんにく → ムキムキにんにく など）
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=bb73dc4f9aca';

const K = { work: 'hanakappa' };
const O = { work: 'oshiri' };

const GEAR = {
  // ───── はなかっぱ ─────
  r88_hk_tsubomi: { ...head('fu3'), ...K, name: '頭のつぼみ', fx: [{ k: 'regen', v: 4 }], bonus: { heal: 6 }, desc: '頭にちょこんとのった、まだ小さなつぼみ。気持ちしだいで、いろいろな花がさく。行動するたびにHPが少し回復する。きたえると……？' },
  r88_hk_hana: { ...head('mei'), ...K, name: '大人の花', fx: [{ k: 'regen', v: 6 }], bonus: { heal: 14, mag: 8 }, desc: '大きくなって、なりたい自分になれた時に、はじめて決まる自分だけの花。行動するたびにHPが回復し、回復の力が上がる。' },
  r88_hk_wakaran: { ...acc('den'), ...K, name: 'わかランの花', fx: [{ k: 'regen', v: 8 }], bonus: { heal: 70, hp: 90, mp: 40, mag: 30, def: 20 }, desc: 'ちょう兵衛がずっとねらっている、ふしぎな花。そばにいると、心も体もわかがえるようだという。いやしと回復の力が大きく上がる。' },
  r88_hk_ougi: { ...weapon('fan', 'fu3'), ...K, name: '黒い羽根のおうぎ', fx: [{ k: 'el_dark', v: 4 }], look: 'feather', desc: '黒羽屋ちょう兵衛が、ばさっとあおぐ黒い羽根のおうぎ。ふつうの攻撃が闇の力になる。' },
  r88_hk_megane: { ...head('fu3'), ...K, name: 'ガリガリのメガネ', bonus: { agi: 12 }, desc: 'ちょう兵衛の子分、がりぞーのメガネ。たのまれると、すぐ走り出す。素早さが上がる。' },
  r88_hk_ribbon: { ...acc('fu3'), ...K, name: 'ちょうのリボン', fx: [{ k: 'evade', v: 4 }], desc: 'アゲルちゃんの、ひらひらのリボン。ちょうのようにひらりとかわす。敵の攻撃をかわしやすくなる。' },
  r88_hk_ninniku: { ...acc('fu3'), ...K, name: 'ムキムキにんにく', bonus: { str: 16 }, desc: '食べると頭にニンニクの花がさいて、体がムキムキになるという、元気のでるにんにく。力が上がる。' },
  r88_hk_ohagi: { ...acc('fu3'), ...K, name: 'おはぎ', fx: [{ k: 'regen', v: 4 }], desc: 'あんこたっぷりの、手作りのおはぎ。ほおばると、ほっとする。行動するたびにHPが少し回復する。' },
  r88_hk_momo: { ...acc('fu3'), ...K, name: 'ももの花かざり', bonus: { heal: 14 }, desc: 'ももかっぱちゃんの頭にさく、ピンクのももの花のかざり。回復の力が上がる。' },
  r88_hk_himawari: { ...acc('fu3'), ...K, name: '大きなひまわり', bonus: { hp: 36 }, desc: 'ひまごろうの頭にさく、お日さまみたいな大きなひまわり。最大HPが上がる。' },
  r88_hk_hasu: { ...acc('fu3'), ...K, name: 'はすの花', bonus: { mp: 30 }, desc: 'はす次ろうの頭にさく、しずかなはすの花。心がおちついて、最大MPが上がる。' },
  // ───── おしり探てい ─────
  r88_os_suit: { ...armor('cloth', 'mei'), ...O, name: '名探ていのスーツとちょうネクタイ', fx: [{ k: 'crit', v: 6 }], bonus: { mag: 6 }, use: { ability: 'r88u_os_shitsurei' }, desc: 'ププッとわらう名探ていの、きちんとしたスーツとちょうネクタイ。だれでも装備できる。会心の一撃が出やすい。使うと、ていねいにことわってから……敵1グループをねむらせる。' },
  r88_os_stick: { ...weapon('staff', 'mei'), ...O, name: 'しん士のステッキ', bonus: { agi: 16, mag: 6 }, look: 'cane', desc: 'いつも手にしている、しん士のステッキ。くるりと回して、事件の現場へいそぐ。素早さが上がる。' },
  r88_os_potato: { ...acc('fu3'), ...O, name: 'スイートポテト', fx: [{ k: 'regen', v: 4 }], desc: '名探ていの大好物。あたたかい飲み物といっしょに、ティータイムにいただく。行動するたびにHPが少し回復する。' },
  r88_os_jumbo: { ...acc('mei'), ...O, name: 'ジャンボスイートポテト', bonus: { heal: 20, hp: 24 }, desc: '町のみんなで力を合わせて作った、とても大きなスイートポテト。回復の力と最大HPが上がる。' },
  r88_os_note: { ...acc('fu3'), ...O, name: '助手のノート', fx: [{ k: 'crit', v: 4 }], desc: '助手のブラウンが、手がかりを書きとめるノート。会心の一撃が出やすい。' },
  r88_os_hensou: { ...head('mei'), ...O, name: '変装の道具', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: '大どろぼう、かいとうUの変装の道具。だれにでも化けられる。敵の攻撃をかわしやすくなる。' },
  r88_os_mantle: { ...armor('cloth', 'mei'), ...O, name: 'かいとうUのマント', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: 'かいとうUが、夜空にひるがえすマント。だれでも装備できる。敵の攻撃をかわしやすくなる。' },
  r88_os_yokoku: { ...acc('fu3'), ...O, name: 'かいとうUの予告状', bonus: { agi: 14 }, desc: 'お宝をいただく前に、かいとうUがとどける予告状。素早さが上がる。' },
  r88_os_tejou: { ...weapon('whip', 'fu3'), ...O, name: 'しょちょうの手じょう', fx: [{ k: 'paralyze', v: 4 }], look: 'chain', desc: 'マルチーズしょちょうの手じょう。くさりのついたわっかを投げて、つかまえる。ムチと同じあつかい。ときどき敵をマヒさせる。' },
  r88_os_michishirube: { ...acc('den'), ...O, name: '風のみちしるべ', fx: [{ k: 'evade', v: 8 }], bonus: { agi: 80, hp: 60, str: 30, mag: 30, def: 30 }, desc: '風にのって空をとぶ島の、大とうだいで青く光る石。かいとうUがねらうお宝。素早さが大きく上がり、敵の攻撃をかわしやすくなる。' },
};
priceUp(GEAR);

export const ITEMS_R88_KIDS = GEAR;
// 頭のつぼみ → 大人の花（3回 きたえた あと、かじ屋で もう1回）
export const R88_REBIRTH_KIDS = {
  r88_hk_tsubomi: { to: 'r88_hk_hana', at: 3, gold: 8000, mats: [['star_shard', 6], ['magic_powder', 4]] },
};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_KIDS = { kappa_sara: 'hanakappa' };

export const R88_KIDS_KANA = {
  r88_hk_tsubomi: 'あたまのつぼみ', r88_hk_hana: 'おとなのはな', r88_hk_wakaran: 'わからんのはな', r88_hk_ougi: 'くろいはねのおうぎ',
  r88_hk_megane: 'がりがりのめがね', r88_hk_ribbon: 'ちょうのりぼん', r88_hk_ninniku: 'むきむきにんにく', r88_hk_ohagi: 'おはぎ',
  r88_hk_momo: 'もものはなかざり', r88_hk_himawari: 'おおきなひまわり', r88_hk_hasu: 'はすのはな',
  r88_os_suit: 'めいたんていのすーつとちょうねくたい', r88_os_stick: 'しんしのすてっき', r88_os_potato: 'すいーとぽてと',
  r88_os_jumbo: 'じゃんぼすいーとぽてと', r88_os_note: 'じょしゅののーと', r88_os_hensou: 'へんそうのどうぐ', r88_os_mantle: 'かいとうゆーのまんと',
  r88_os_yokoku: 'かいとうゆーのよこくじょう', r88_os_tejou: 'しょちょうのてじょう', r88_os_michishirube: 'かぜのみちしるべ',
};
