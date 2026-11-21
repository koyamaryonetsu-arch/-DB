// 第88回 G12班: ドラえもんの 品（docs/plan-r88-anime-gear.md の 3-8）
//   作品の 職業（ネコ型ロボット・耳無しネコ型ロボット・ドラえもん・のぶドラ）は つえ・ブーメラン・素手・たて・服
//   ・ひみつ道具は「使う」品が 多い（1つの 戦いで 1回。data/abilities-r88.js の r88u_dr_）
//   ・もしもボックス（伝説）… 使うと 天気を えらんで かえる（晴れ・雨・かみなり の 3つが 道具に ならぶ。
//     どれか 1つを 使うと 3つとも 使った ことに なる。use.pick。shared/gear-r88.js の r88Uses）
//   ・今 ある タケコプター・ネコのすず・ふしぎなポケットにも 作品を つけた（R88_TAG_DORAEMON。強さ・手に入れ方は かえない）
//   ・名前が 今 ある 技（ドラえもんの 職業の ひみつ道具）と かぶる 品は 少し かえた（設計書の「実装メモ（G12班）」）
//   ・入れない 品: 熱線銃の ような あぶない 道具・出木杉の 品（設計書 3-8）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=93a310251ce7';

const D = { work: 'doraemon' };
// もしもボックスの 天気（use.pick の じゅん）
export const MOSHIMO_PICKS = ['r88u_dr_moshimo_sun', 'r88u_dr_moshimo_rain', 'r88u_dr_moshimo_thunder'];

const GEAR = {
  // ───── ひみつ道具（戦いの 道具）─────
  r88_dr_kuuki: { ...weapon('claw', 'mei'), ...D, name: '空気ほうのつつ', fx: [{ k: 'el_wind', v: 6 }], bonus: { str: 6 }, use: { ability: 'r88u_dr_dokan' }, look: 'knuckle', desc: 'うでにはめる、つつの形のひみつ道具。「ドカン！」と言うと、空気のかたまりがとび出す。ふつうの攻撃が風になる。使うと、敵1体に大きな空気のかたまり。' },
  r88_dr_shock: { ...weapon('boomerang', 'mei'), ...D, name: 'のび太のショックガン', fx: [{ k: 'paralyze', v: 6 }], bonus: { agi: 4 }, look: 'cross', desc: '光線を当てて、きずつけずに気ぜつさせる道具。うつのが得意な男の子のお気に入り。ときどき敵をマヒさせる。' },
  r88_dr_hirari: { ...shield('mei'), ...D, name: 'ひらりマント', fx: [{ k: 'evade', v: 6 }], look: 'light', desc: '赤いマント。ひらりとふると、向かってくる物の向きがかわる。敵の攻撃をかわしやすくなる。' },
  r88_dr_denko: { ...weapon('sword', 'mei'), ...D, name: '名刀電光丸', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 4 }, look: 'katana', desc: '相手の動きを読んで、かってに戦ってくれる刀。はがないので、打って気ぜつさせる。ときどきもう1回攻撃する。' },
  r88_dr_tebukuro: { ...weapon('claw', 'fu3'), ...D, name: 'スーパー手ぶくろ', bonus: { str: 12 }, look: 'fist', desc: 'はめると、大きな木も引きぬけるほどの力が出る手ぶくろ。力が上がる。' },
  r88_dr_setchaku: { ...weapon('boomerang', 'mei'), ...D, name: 'しゅんかん接着じゅう', bonus: { agi: 6 }, use: { ability: 'r88u_dr_setchaku' }, look: 'cross', desc: 'すぐにかたまる接着ざいをとばす道具。使うと、敵1体を2回の間動けなくする（大きな敵にはききにくい）。' },
  r88_dr_small: { ...weapon('staff', 'mei'), ...D, name: 'ドラえもんのスモールライト', bonus: { mag: 8 }, use: { ability: 'r88u_dr_small' }, look: 'penlight', desc: '当てた物を小さくする、かい中電とうの形の道具。つえと同じあつかい。使うと、敵1体の攻撃力を下げる。' },
  r88_dr_big: { ...weapon('staff', 'mei'), ...D, name: 'ドラえもんのビッグライト', bonus: { mag: 8, heal: 4 }, use: { ability: 'r88u_dr_big' }, look: 'penlight', desc: '当てた物を大きくする、かい中電とうの形の道具。つえと同じあつかい。使うと、仲間1人の攻撃力を上げる。' },
  r88_dr_barrier: { ...acc('mei'), ...D, name: 'バリヤーポイント', bonus: { def: 10 }, use: { ability: 'r88u_dr_barrier' }, desc: '体のまわりに、見えないかべを作る道具。使うと、少しの間、自分の守備力が大きく上がる。' },
  r88_dr_yamabiko: { ...shield('mei'), ...D, name: '改良型山びこ山', fx: [{ k: 'counter', v: 6 }], look: 'crest', desc: '声だけでなく、光や風も、そのままはね返す小さな山。ときどきやりかえす。' },
  r88_dr_hoop: { ...acc('fu3'), ...D, name: '通りぬけフープ', bonus: { agi: 8 }, use: { ability: 'r88u_dr_hoop' }, desc: 'かべにはりつけると、通りぬけられる輪。使うと、少しの間、自分が敵の攻撃をすりぬけやすくなる。' },
  r88_dr_kakure: { ...armor('robe', 'fu3'), ...D, name: 'かくれマント', fx: [{ k: 'evade', v: 4 }], desc: 'かぶると、すがたが見えなくなるマント。ローブと同じあつかい。敵の攻撃をかわしやすくなる。' },
  r88_dr_koe: { ...acc('mei'), ...D, name: 'コエカタマリン', bonus: { str: 8 }, use: { ability: 'r88u_dr_koe' }, desc: '飲んでから大声を出すと、声が字のかたまりになってとんでいく薬。使うと、同じ種類の敵みんなに声のかたまりをぶつける。' },
  r88_dr_korobashi: { ...acc('fu3'), ...D, name: 'ころばし屋の人形', bonus: { agi: 6 }, use: { ability: 'r88u_dr_korobashi' }, desc: '10円入れると、ねらった相手をころばせに行く、小さな人形。使うと、敵1体をころばせて、動くのをおそくする。' },
  r88_dr_kibi: { ...acc('mei'), ...D, name: 'きびだんごのふくろ', bonus: { heal: 8 }, use: { ability: 'r88u_dr_kibi' }, desc: 'ももたろう印のきびだんごが入ったふくろ。食べた動物は、言うことを聞くようになる。使うと、同じ種類の敵みんなをおとなしくさせて、ねむらせる。' },
  r88_dr_tanma: { ...acc('mei'), ...D, name: 'タンマウォッチ', bonus: { agi: 10 }, use: { ability: 'r88u_dr_tanma' }, desc: 'おすと、自分のほかの時間が止まる時計。使うと、敵全体の動く番をおくらせる。' },
  r88_dr_furoshiki: { ...acc('mei'), ...D, name: 'ドラえもんのタイムふろしき', bonus: { heal: 10 }, use: { ability: 'r88u_dr_furoshiki' }, desc: 'つつむと、時間をもどしたり進めたりできるふろしき。使うと、仲間1人の状態異常と、下がった力を元にもどす。' },
  r88_dr_door: { ...acc('mei'), ...D, name: 'ピンクのどこでもドア', bonus: { agi: 8 }, use: { ability: 'r88u_dr_door' }, desc: '行きたい所を思いうかべて開けると、そこにつながるピンクのドア。使うと、かならずにげられる（にげられない戦いはだめ）。' },
  r88_dr_moshimo: { ...acc('den'), ...D, name: 'ドラえもんのもしもボックス', bonus: { hp: 100, mag: 44, def: 34, agi: 34, heal: 34 }, use: { ability: MOSHIMO_PICKS[0], pick: MOSHIMO_PICKS }, desc: '「もしも〇〇だったら」と電話で言うと、そういう世界になる電話ボックス。使うと、晴れ・雨・かみなりの中から、選んだ天気に空をかえる。' },
  // ───── みんなの 道具・小物 ─────
  r88_dr_ishikoro: { ...head('fu3'), ...D, name: '石ころのぼうし', fx: [{ k: 'evade', v: 4 }], desc: 'かぶると、道ばたの石ころのように、だれにも気にされなくなるぼうし。敵の攻撃をかわしやすくなる。' },
  r88_dr_honyaku: { ...acc('fu3'), ...D, name: 'ほんやくコンニャク', fx: [{ k: 'guard_confuse', v: 4 }], desc: '食べると、どんな言葉もわかるようになるコンニャク。混乱にかかりにくい。' },
  r88_dr_gourmet: { ...acc('fu3'), ...D, name: 'ドラえもんのグルメテーブルかけ', fx: [{ k: 'regen', v: 4 }], desc: '食べたい物を言うと、出てくるテーブルかけ。行動するたびにHPが少し回復する。' },
  r88_dr_dorayaki: { ...acc('fu2'), ...D, name: 'できたてのどら焼き', fx: [{ k: 'mpregen', v: 4 }], desc: 'ネコ型ロボットの大好物。ふかふかで、あんこたっぷり。行動するたびにMPが少し回復する。' },
  r88_dr_minidora: { ...acc('fu3'), ...D, name: 'ミニドラ', fx: [{ k: 'chase', v: 4 }], desc: '小さな小さなネコ型ロボット。「ドララ！」と言って、いっしょに戦ってくれる。ときどきもう1回攻撃する。' },
  // ───── 友だちの 品 ─────
  r88_dr_bat: { ...weapon('bat', 'fu3'), ...D, name: 'ガキ大将のバット', fx: [{ k: 'crit', v: 4 }], look: 'bat', desc: '空き地の野球チームの、キャプテンのバット。会心の一撃が出やすい。' },
  r88_dr_mic: { ...weapon('fan', 'mei'), ...D, name: 'リサイタルのマイク', bonus: { str: 8, hp: 20 }, use: { ability: 'r88u_dr_recital' }, look: 'mic', desc: 'ガキ大将が空き地でリサイタルを開く時のマイク。おうぎと同じあつかい。使うと、すごい歌声で敵全体を混乱させる。' },
  r88_dr_megane: { ...head('fu3'), ...D, name: '丸いメガネ', fx: [{ k: 'crit', v: 4 }], resist: { sleep: 1.3 }, desc: 'うつのとひるねが得意な男の子のメガネ。会心の一撃が出やすいが、ねむりにかかりやすい。' },
  r88_dr_violin: { ...weapon('fan', 'fu3'), ...D, name: 'バイオリン', bonus: { mag: 6 }, use: { ability: 'r88u_dr_violin' }, look: 'feather', desc: 'やさしい女の子が、毎日練習しているバイオリン。おうぎと同じあつかい。使うと、ふしぎな音色で敵全体の守備力を下げる。' },
  r88_dr_radicon: { ...weapon('boomerang', 'fu3'), ...D, name: 'ラジコン', fx: [{ k: 'chase', v: 4 }], look: 'wing', desc: 'お金持ちの男の子がじまんする、空をとぶラジコン。ときどきもう1回攻撃する。' },
  r88_dr_houdai: { ...acc('mei'), ...D, name: '無敵ほう台', bonus: { str: 6, mag: 6 }, use: { ability: 'r88u_dr_houdai' }, desc: 'お金持ちの男の子が、未来のデパートで買った小さなほう台。指さして「発射」と言うと、かならず当たる。使うと、敵1体に大きなダメージ。' },
  r88_dr_ribbon: { ...head('fu3'), ...D, name: '赤いリボン', bonus: { heal: 10 }, desc: '妹のネコ型ロボットの、耳につけた赤いリボン。回復の力が上がる。' },
  r88_dr_melonpan: { ...acc('fu2'), ...D, name: 'メロンパン', fx: [{ k: 'regen', v: 4 }], desc: '妹のネコ型ロボットの大好物。あまくて、さくさく。行動するたびにHPが少し回復する。' },
};
priceUp(GEAR);

export const ITEMS_R88_DORAEMON = GEAR;
// 生まれ変わりは ない
export const R88_REBIRTH_DORAEMON = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_DORAEMON = { takecopter: 'doraemon', neko_suzu: 'doraemon', magic_pocket: 'doraemon' };

export const R88_DORAEMON_KANA = {
  r88_dr_kuuki: 'くうきほうのつつ', r88_dr_shock: 'のびたのしょっくがん', r88_dr_hirari: 'ひらりまんと', r88_dr_denko: 'めいとうでんこうまる',
  r88_dr_tebukuro: 'すーぱーてぶくろ', r88_dr_setchaku: 'しゅんかんせっちゃくじゅう', r88_dr_small: 'どらえもんのすもーるらいと', r88_dr_big: 'どらえもんのびっぐらいと',
  r88_dr_barrier: 'ばりやーぽいんと', r88_dr_yamabiko: 'かいりょうがたやまびこさん', r88_dr_hoop: 'とおりぬけふーぷ', r88_dr_kakure: 'かくれまんと',
  r88_dr_koe: 'こえかたまりん', r88_dr_korobashi: 'ころばしやのにんぎょう', r88_dr_kibi: 'きびだんごのふくろ', r88_dr_tanma: 'たんまうぉっち',
  r88_dr_furoshiki: 'どらえもんのたいむふろしき', r88_dr_door: 'ぴんくのどこでもどあ', r88_dr_moshimo: 'どらえもんのもしもぼっくす',
  r88_dr_ishikoro: 'いしころのぼうし', r88_dr_honyaku: 'ほんやくこんにゃく', r88_dr_gourmet: 'どらえもんのぐるめてーぶるかけ', r88_dr_dorayaki: 'できたてのどらやき',
  r88_dr_minidora: 'みにどら', r88_dr_bat: 'がきだいしょうのばっと', r88_dr_mic: 'りさいたるのまいく', r88_dr_megane: 'まるいめがね',
  r88_dr_violin: 'ばいおりん', r88_dr_radicon: 'らじこん', r88_dr_houdai: 'むてきほうだい', r88_dr_ribbon: 'あかいりぼん', r88_dr_melonpan: 'めろんぱん',
};
