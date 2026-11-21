// 第88回 G10班: ナルトの 品（docs/plan-r88-anime-gear.md の 3-3）
//   作品の 職業（木の葉の忍び・七代目火影）は 短剣・ツメ・ブーメラン・服と 道着
//   ・忍刀七人衆の 7本（そろい shinobi7。持って いる 数で しょう号）
//   ・六道せん人の 宝具 5つ（そろい rikudo_hougu。3つ 持って つけると マヒの力〈ふうじる 力〉）
//   ・イタチの 2つ（とつかの剣 ＋ スサノオのやたの鏡。そろい totsuka_yata。1人が 両方 つけると 反撃）
//   ・今 ある クナイ・草なぎの剣 は こわさず、作品の 品として 数える（R88_TAG_NARUTO。強さ・手に入れ方は かえない）
//   ・名前は 使える 字に 直した（首斬り包丁 → 大包丁・鮫肌 → さめはだ・八咫鏡 → スサノオのやたの鏡〈今の「やたの鏡のたて」と べつ〉 など）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=d4d473d565e8';

const N = { work: 'naruto' };
const S7 = { work: 'naruto', set: 'shinobi7' };
const RH = { work: 'naruto', set: 'rikudo_hougu' };
const TY = { work: 'naruto', set: 'totsuka_yata' };

const GEAR = {
  // ───── ナルトと 木の葉の 里の 品 ─────
  r88_nr_shuriken: { ...weapon('boomerang', 'shop'), ...N, name: '木の葉の手裏剣', look: 'star', desc: '忍びが最初に習う、4つのやいばの手裏剣。くるくる回して投げる。' },
  r88_nr_hitai: { ...head('fu3'), ...N, name: '木の葉のひたい当て', fx: [{ k: 'def', v: 4 }], desc: '木の葉のマークが入った、鉄の板のついたはちまき。一人前の忍びのしるし。守備力が上がる。' },
  r88_nr_orange: { ...armor('gi', 'fu3'), ...N, name: 'オレンジの忍び服', fx: [{ k: 'hp', v: 4 }], desc: 'とても目立つ、オレンジ色の忍び服。あきらめない心がつまっている。最大HPが上がる。' },
  r88_nr_kibaku: { ...acc('fu3'), ...N, name: '起爆札', bonus: { str: 4 }, use: { ability: 'r88u_nr_kibaku' }, desc: 'クナイにまいて投げる、ふしぎなお札。使うと、同じ種類の敵みんなの近くで、ばくはつさせる。' },
  r88_nr_ramen: { ...acc('fu3'), ...N, name: '一楽のラーメン', fx: [{ k: 'regen', v: 4 }], desc: '木の葉の里の、みんな大好きなラーメン。食べると元気が出る。行動するたびにHPが少し回復する。' },
  r88_nr_gama: { ...acc('fu3'), ...N, name: 'ガマちゃんのさいふ', bonus: { mp: 20 }, desc: 'カエルの形をした、がま口のさいふ。中のおこづかいは、だいたいラーメンにかわる。最大MPが上がる。' },
  r88_nr_fuuma: { ...weapon('boomerang', 'mei'), ...N, name: '風魔手裏剣', fx: [{ k: 'el_wind', v: 6 }], bonus: { agi: 4 }, look: 'cross', desc: 'たたむと小さく、広げると大きな4まいのやいばになる手裏剣。ふつうの攻撃が風になる。' },
  r88_nr_omori: { ...acc('fu3'), ...N, name: 'リーの重り', bonus: { str: 14, agi: -8 }, desc: '足につけて、ふだんから体をきたえる重り。力が上がるが、素早さが下がる。外すと、とても速く動けるという。' },
  r88_nr_tights: { ...armor('gi', 'fu3'), ...N, name: '緑のタイツ', bonus: { agi: 10 }, desc: '「青春だ！」が口ぐせの先生と弟子の、緑の全身タイツ。動きやすい。素早さが上がる。' },
  r88_nr_makimono: { ...acc('fu3'), ...N, name: '忍具のまき物', fx: [{ k: 'chase', v: 4 }], desc: '開くと、たくさんの武器がとび出すまき物。ときどきもう1回攻撃する。' },
  r88_nr_chakuratou: { ...weapon('claw', 'mei'), ...N, name: 'アスマのチャクラ刀', fx: [{ k: 'el_wind', v: 6 }], bonus: { str: 4 }, look: 'katar', desc: '手にはめて使う、2本の刀。風の力をのせると、とてもよく切れる。ふつうの攻撃が風になる。' },
  r88_nr_hakkou: { ...weapon('dagger', 'mei'), ...N, name: '白光のチャクラ刀', fx: [{ k: 'el_light', v: 6 }], bonus: { agi: 6 }, look: 'kunai', desc: '「木の葉の白いきば」とよばれた忍びの、白く光る短刀。ふつうの攻撃が光になる。' },
  r88_nr_hyoutan: { ...shield('mei'), ...N, name: '砂のひょうたん', fx: [{ k: 'counter', v: 6 }], look: 'tower', desc: 'せなかにせおう、大きなひょうたん。中の砂が、かってに持ち主を守る。ときどきやりかえす。' },
  r88_nr_oougi: { ...weapon('fan', 'mei'), ...N, name: 'テマリの大おうぎ', fx: [{ k: 'el_wind', v: 6 }], bonus: { mag: 6 }, look: 'feather', desc: '人の背たけほどもある、大きなおうぎ。ひとあおぎで大風がふく。ふつうの攻撃が風になる。' },
  r88_nr_karakuri: { ...acc('mei'), ...N, name: 'あやつり人形', fx: [{ k: 'chase', v: 5 }, { k: 'poison', v: 4 }], desc: 'チャクラの糸で動かす、からくり人形。うでの中にしかけがある。ときどきもう1回攻撃し、敵を毒にする。' },
  r88_nr_kubikazari: { ...acc('mei'), ...N, name: '初代火影の首かざり', bonus: { mp: 30, mag: 6, hp: 10 }, desc: '里の長からたくされた、みどりの石の首かざり。「火影になる」とちかった約束のしるし。最大MPが上がる。' },
  r88_nr_kasa: { ...head('mei'), ...N, name: '火影のかさ', bonus: { mag: 12 }, desc: '「火」の字が書かれた、里の長のかさ。かぶると、心がひきしまる。魔力が上がる。' },
  r88_nr_nyoi: { ...weapon('staff', 'mei'), ...N, name: '金ごうにょい', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'cane', desc: '三代目の長と心を通わせる、さるの王が化けた、金色の長いぼう。とてもかたい。会心の一撃が出やすい。' },
  r88_nr_kuchiyose: { ...acc('mei'), ...N, name: '口寄せのまき物', bonus: { hp: 20, str: 6 }, use: { ability: 'r88u_nr_kuchiyose' }, desc: '大きなガマとけい約をむすぶ、長いまき物。使うと、大きなガマをよび出して、敵全体をおしつぶす。' },
  r88_nr_haori: { ...armor('cloth', 'mei'), ...N, name: '火影の羽織', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: 'すそにほのおのもようがある、白い羽織。四代目から受けつがれた。だれでも装備できる。敵の攻撃をかわしやすくなる。' },
  r88_nr_hiraishin: { ...weapon('dagger', 'den'), ...N, name: '飛雷神のクナイ', fx: [{ k: 'chase', v: 8 }], bonus: { agi: 24, str: 8 }, look: 'kunai', desc: '三つまたの、とくべつなクナイ。投げた所へ一しゅんでとんでいく。素早さが大きく上がり、ときどきもう1回攻撃する。' },
  r88_nr_akatsuki: { ...armor('robe', 'mei'), ...N, name: 'あかつきのコート', fx: [{ k: 'res_dark', v: 6 }], bonus: { mag: 6 }, desc: '赤い雲のもようの、黒くて長いコート。闇に強い。' },
  r88_nr_shakujo: { ...weapon('staff', 'den'), ...N, name: '六道せん人のしゃくじょう', fx: [{ k: 'el_light', v: 8 }], bonus: { mag: 24, heal: 10 }, look: 'ring', desc: '忍びのはじまりの人が持っていた、黒い玉から作られたしゃくじょう。ふつうの攻撃が光になる。' },
  // ───── 忍刀七人衆の 7本（霧の 里の 刀。持ち主が かわって 受けつぐ）─────
  r88_nr_kubikiri: { ...weapon('axe', 'mei'), ...S7, name: '断刀・大包丁', fx: [{ k: 'drain', v: 6 }], bonus: { str: 6 }, look: 'battle', desc: '大きな包丁のような形の刀。かけても、元にもどる。あたえたダメージの一部だけHPが回復する。' },
  r88_nr_samehada: { ...weapon('axe', 'den'), ...S7, name: '大刀・さめはだ', fx: [{ k: 'mana', v: 8 }], bonus: { str: 20, hp: 30 }, look: 'samehada', desc: 'さめのはだのような、ざらざらのうろこでおおわれた大きな刀。生きているように動き、チャクラを食べる。攻撃が当たるとMPが回復する。' },
  r88_nr_nuibari: { ...weapon('spear', 'mei'), ...S7, name: '長刀・ぬいばり', fx: [{ k: 'paralyze', v: 5 }], bonus: { agi: 4 }, look: 'rod', desc: '長い糸のついた、はりのような刀。さしたものを糸でぬいとめる。ときどき敵をマヒさせる。' },
  r88_nr_kabutowari: { ...weapon('axe', 'mei'), ...S7, name: 'どん刀・かぶとわり', fx: [{ k: 'crit', v: 6 }], bonus: { str: 8 }, look: 'hammer', desc: 'オノとつちを、くさりでつないだ刀。どんなにかたい守りも打ちくだく。会心の一撃が出やすい。' },
  r88_nr_shibuki: { ...weapon('sword', 'mei'), ...S7, name: '爆刀・しぶき', reach: 'group', bonus: { str: 4 }, look: 'broad', desc: 'たくさんの起爆札がまかれた刀。ふるたびに、ばくはつがおこる。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_nr_kiba: { ...weapon('dagger', 'mei'), ...S7, name: '雷刀・きば', fx: [{ k: 'el_bolt', v: 6 }], bonus: { agi: 6 }, look: 'jambiya', desc: '2本で1組の、雷をまとう刀。ふつうの攻撃が雷になる。' },
  r88_nr_hiramekarei: { ...weapon('sword', 'mei'), ...S7, name: 'そう刀・ヒラメカレイ', fx: [{ k: 'chase', v: 6 }], bonus: { str: 4 }, look: 'great', desc: 'ためたチャクラで、大きなやいばの形を作る、2本の持ち手の刀。ときどきもう1回攻撃する。' },
  // ───── 六道せん人の 宝具（金角と 銀角が 使った 5つ）─────
  r88_nr_basho: { ...weapon('fan', 'den'), ...RH, name: 'ばしょうせん', fx: [{ k: 'el_wind', v: 8 }], bonus: { mag: 20, agi: 8 }, use: { ability: 'r88u_nr_basho' }, look: 'tessen', desc: 'いろいろな力を出せる、大きなうちわ。ふつうの攻撃が風になる。使うと、炎・雷・風のどれかを、敵全体にふき出す。' },
  r88_nr_benihyoutan: { ...acc('mei'), ...RH, name: '紅ひょうたん', bonus: { mag: 8, def: 6 }, use: { ability: 'r88u_nr_benihyoutan' }, desc: 'いつもの口ぐせを言った相手を、中にすいこむ赤いひょうたん。使うと、敵1体を2回の間動けなくする。' },
  r88_nr_kohaku: { ...acc('mei'), ...RH, name: 'こはくのじょうへい', bonus: { mag: 10, hp: 10 }, use: { ability: 'r88u_nr_kohaku' }, desc: 'よばれて返事をした相手を、中にすいこむつぼ。使うと、敵1体をねむらせる。' },
  r88_nr_koukin: { ...weapon('whip', 'mei'), ...RH, name: 'こうきんじょう', fx: [{ k: 'paralyze', v: 5 }], bonus: { mag: 4 }, look: 'chain', desc: 'しばった相手から、いつもの口ぐせを引き出す金のなわ。ときどき敵をマヒさせる。' },
  r88_nr_shichisei: { ...weapon('sword', 'mei'), ...RH, name: '七星剣', fx: [{ k: 'mana', v: 6 }], bonus: { mag: 6 }, look: 'holy', desc: '引き出した口ぐせを切りとる、ふしぎな剣。攻撃が当たるとMPが回復する。' },
  // ───── イタチの 2つ（大きな よろいの 武者が 持つ）─────
  r88_nr_totsuka: { ...weapon('sword', 'den'), ...TY, name: 'とつかの剣', fx: [{ k: 'crit', v: 8 }], bonus: { str: 18, mag: 10 }, use: { ability: 'r88u_nr_totsuka' }, look: 'holy', desc: '中の水がやいばになっている、まぼろしの剣。会心の一撃が出やすい。使うと、敵1体を夢の世界にふうじる（大きな敵にはきかない）。' },
  r88_nr_yata: { ...shield('den'), ...TY, name: 'スサノオのやたの鏡', resist: { fire: 0.8, ice: 0.8, bolt: 0.8 }, bonus: { def: 10 }, look: 'mirror', desc: '受けた攻撃に合わせて、形をかえる鏡のたて。炎・氷・雷に強い。' },
};
// 木の葉の手裏剣は 店の 品（★1。G4班の しくみで ホシフル村の よろず屋に ならぶ）
priceUp(GEAR, { r88_nr_shuriken: 70 });

export const ITEMS_R88_NARUTO = GEAR;
// 生まれ変わりは ない
export const R88_REBIRTH_NARUTO = {};
// 今 ある 品を 作品の 品として 数える（とびら・ガチャの「持って いる」。強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_NARUTO = { kunai: 'naruto', kusanagi: 'naruto' };

export const R88_NARUTO_KANA = {
  r88_nr_shuriken: 'このはのしゅりけん', r88_nr_hitai: 'このはのひたいあて', r88_nr_orange: 'おれんじのしのびふく', r88_nr_kibaku: 'きばくふだ',
  r88_nr_ramen: 'いちらくのらーめん', r88_nr_gama: 'がまちゃんのさいふ', r88_nr_fuuma: 'ふうましゅりけん', r88_nr_omori: 'りーのおもり',
  r88_nr_tights: 'みどりのたいつ', r88_nr_makimono: 'にんぐのまきもの', r88_nr_chakuratou: 'あすまのちゃくらとう', r88_nr_hakkou: 'はっこうのちゃくらとう',
  r88_nr_hyoutan: 'すなのひょうたん', r88_nr_oougi: 'てまりのおおおうぎ', r88_nr_karakuri: 'あやつりにんぎょう', r88_nr_kubikazari: 'しょだいほかげのくびかざり',
  r88_nr_kasa: 'ほかげのかさ', r88_nr_nyoi: 'こんごうにょい', r88_nr_kuchiyose: 'くちよせのまきもの', r88_nr_haori: 'ほかげのはおり',
  r88_nr_hiraishin: 'ひらいしんのくない', r88_nr_akatsuki: 'あかつきのこーと', r88_nr_shakujo: 'りくどうせんにんのしゃくじょう',
  r88_nr_kubikiri: 'だんとうおおぼうちょう', r88_nr_samehada: 'たいとうさめはだ', r88_nr_nuibari: 'ちょうとうぬいばり', r88_nr_kabutowari: 'どんとうかぶとわり',
  r88_nr_shibuki: 'ばくとうしぶき', r88_nr_kiba: 'らいとうきば', r88_nr_hiramekarei: 'そうとうひらめかれい',
  r88_nr_basho: 'ばしょうせん', r88_nr_benihyoutan: 'べにひょうたん', r88_nr_kohaku: 'こはくのじょうへい', r88_nr_koukin: 'こうきんじょう', r88_nr_shichisei: 'しちせいけん',
  r88_nr_totsuka: 'とつかのけん', r88_nr_yata: 'すさのおのやたのかがみ',
};
