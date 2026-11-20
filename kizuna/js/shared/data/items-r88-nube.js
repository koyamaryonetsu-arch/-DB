// 第88回 G8班: 地獄先生ぬ〜べ〜 の 品（docs/plan-r88-anime-gear.md の 2-8）
//   作品の 職業（小学校の先生・れい能力教師ぬ〜べ〜・おにの手のじごく先生）は つえ・たて・服と ローブ（ツメは 持てない）
//   ・おにの手は ツメでは なく アクセ（伝説。ゆうれいキラー・使う で おにの手）
//   ・ぬ〜べ〜の 3つ（白衣観音経・れい水しょう・念じゅ）… そろい nube_three
//   ・こわく しない。入れない 品: 玉もの 頭の 骨・絶おに・口さけ女 など（設計書 2-8）
//   ・名前の 字: 「霊・鬼・珠・狐・敷・勾・尾・符・晶・克」は 習わない 字なので かな
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=02b3721e7c0a';

const N = { work: 'nube' };
const N3 = { work: 'nube', set: 'nube_three' };

const GEAR = {
  // ───── ぬ〜べ〜の 品（れい能力の 道具）─────
  r88_nb_onite: { ...acc('den'), ...N, name: 'おにの手の黒い手ぶくろ', fx: [{ k: 'slay_spirit', v: 8 }], bonus: { hp: 100, str: 48, def: 34, agi: 22, heal: 22, mag: 24 }, use: { ability: 'r88u_onite' }, desc: '左手に強いおにの力をふういんした先生の、黒い手ぶくろ。生徒を守る時だけ、手ぶくろを外す。ゆうれい系の敵に大きなダメージ。使うと、おにの手で、形のないものにもさわれる一げきをはなつ。' },
  r88_nb_kannon: { ...weapon('staff', 'mei'), ...N3, name: '白衣観音経', fx: [{ k: 'el_light', v: 5 }], bonus: { mag: 14 }, look: 'healing', desc: 'おにの手を出す時にとなえる、まき物のお経。ふつうの攻撃が光になる。' },
  r88_nb_suisho: { ...acc('mei'), ...N3, name: 'れい水しょうの玉', fx: [{ k: 'mpregen', v: 5 }], bonus: { mag: 10 }, use: { ability: 'r88u_suisho' }, desc: 'のぞくと、かくれているようかいが見える水しょうの玉。行動するたびにMPが少し回復する。使うと、敵1体の正体をあばいて守備力を下げる。' },
  r88_nb_nenju: { ...acc('fu3'), ...N3, name: '念じゅ', fx: [{ k: 'res_dark', v: 4 }], bonus: { mag: 4 }, desc: 'いつも左手に持っている念じゅ。闇に強い。' },
  r88_nb_okiwa: { ...acc('mei'), ...N, name: '御おに輪', bonus: { str: 14 }, use: { ability: 'r88u_okiwa' }, desc: '童守寺で見つけられた、ふしぎな輪。おにの手の形を、刀やオノにかえる。力が上がる。使うと、おにの手を刀にかえて、同じ種類の敵みんなを切る。' },
  r88_nb_akira: { ...acc('fu3'), ...N, name: 'あきらへのお守り', fx: [{ k: 'guard_confuse', v: 4 }], bonus: { mag: 4 }, desc: '先生が、なやんでいる生徒のために作ったお守り。混乱にかかりにくい。' },
  r88_nb_ramen: { ...acc('fu3'), ...N, name: '先生のカップめん', fx: [{ k: 'regen', v: 4 }], desc: 'お金のない先生の、いつものごはん。行動するたびにHPが少し回復する。' },
  r88_nb_necktie: { ...acc('fu3'), ...N, name: '黒いネクタイ', bonus: { def: 12 }, desc: 'いつもの黒いスーツに、いつもしめている黒いネクタイ。守備力が上がる。' },
  r88_nb_monosashi: { ...weapon('staff', 'shop'), ...N, name: '竹のものさし', look: 'cane', desc: '教室の黒板の横にある、長い竹のものさし。' },
  r88_nb_shusseki: { ...shield('fu3'), ...N, name: '出席ぼ', fx: [{ k: 'def', v: 4 }], look: 'kite', desc: 'クラスのみんなの名前が書いてある出席ぼ。かたい表紙で身を守る。守備力が上がる。' },
  // ───── おに・ようかいの 品 ─────
  r88_nb_yoroi: { ...armor('cloth', 'mei'), ...N, name: 'おにのよろい', fx: [{ k: 'evade', v: 6 }], bonus: { hp: 24 }, desc: 'おにの手の中のおにの妹が、自分からよろいになって、先生と一つになった。空をとべる。だれでも装備できる。敵の攻撃をかわしやすくなる。' },
  r88_nb_kimono: { ...armor('robe', 'mei'), ...N, name: '雪女の着物', fx: [{ k: 'res_ice', v: 6 }], bonus: { mag: 8 }, desc: '雪と氷をあやつる雪女の着物。氷に強い。' },
  r88_nb_kakigori: { ...acc('fu3'), ...N, name: 'ゆきめのかき氷', fx: [{ k: 'res_fire', v: 4 }], bonus: { hp: 16 }, desc: '雪女のゆきめが作る、ひんやりおいしいかき氷。炎に強い。' },
  r88_nb_sasumata: { ...weapon('spear', 'mei'), ...N, name: '首さすまた', fx: [{ k: 'paralyze', v: 5 }], bonus: { mag: 6 }, look: 'halberd', desc: 'きつねのようかいの先生が使う、先にツメのようなやいばのついたさすまた。えを分けて、相手を動けなくする結界を作る。ときどき敵をマヒさせる。' },
  r88_nb_karin: { ...acc('mei'), ...N, name: '火輪びの術のお札', fx: [{ k: 'res_fire', v: 5 }], bonus: { mag: 12 }, use: { ability: 'r88u_karin' }, desc: 'しっぽをこすり合わせて、とても熱いきつね火を作る術のお札。炎に強い。使うと、敵全体をきつね火でつつむ。' },
  r88_nb_kuda: { ...acc('fu3'), ...N, name: '管ぎつねの竹づつ', fx: [{ k: 'chase', v: 4 }], bonus: { agi: 6 }, desc: '中に小さなきつね「管ぎつね」が入っている竹づつ。調べものや、うらないをしてくれる。ときどききつねがとび出して、もう1回攻撃する。' },
  r88_nb_senbei: { ...acc('fu3'), ...N, name: 'ざしきわらしの塩せんべい', fx: [{ k: 'crit', v: 4 }], bonus: { agi: 4 }, desc: '幸運をはこぶようかい、ざしきわらしの大好物。会心の一撃が出やすい。' },
  r88_nb_uta: { ...acc('fu3'), ...N, name: '人魚の歌', fx: [{ k: 'regen', v: 4 }], bonus: { heal: 6 }, desc: '人魚の少女が歌う、心をつたえる歌。聞くと、つかれがいえる。行動するたびにHPが少し回復する。' },
  // ───── 生徒の 品 ─────
  r88_nb_ball: { ...weapon('boomerang', 'fu3'), ...N, name: 'お経をまいたサッカーボール', fx: [{ k: 'slay_spirit', v: 4 }], look: 'star', desc: '先生がお経をまきつけて、サッカーのすきな生徒がけった、ボール。ゆうれい系の敵に大きなダメージ。' },
  r88_nb_kodai: { ...weapon('sword', 'mei'), ...N, name: '古代のお守りのやいば', fx: [{ k: 'slay_demon', v: 6 }], bonus: { str: 4 }, look: 'holy', desc: '生徒の勇気にこたえて、古代のお守りがやいばにかわった。あくま系の敵に大きなダメージ。' },
  r88_nb_magatama: { ...acc('fu3'), ...N, name: 'まが玉のお守り', fx: [{ k: 'guard_sleep', v: 4 }], bonus: { def: 4 }, desc: '5人の生徒が1つずつもらった、まが玉のお守り。ねむりにかかりにくい。' },
  r88_nb_towel: { ...acc('fu3'), ...N, name: '広のタオル', fx: [{ k: 'regen', v: 4 }], bonus: { hp: 12 }, desc: 'このタオルがないと、ねむれないという生徒のタオル。行動するたびにHPが少し回復する。' },
  r88_nb_boushi: { ...head('fu3'), ...N, name: 'かつやのぼうし', bonus: { def: 4, agi: 4 }, desc: 'いつもぼうしをかぶっている生徒の、お気に入りのぼうし。' },
  r88_nb_randoseru: { ...shield('fu3'), ...N, name: '黒いランドセル', fx: [{ k: 'guard_sleep', v: 4 }], look: 'heater', desc: '教科書がたくさんつまった、じょうぶなランドセル。ねむりにかかりにくい。' },
};
priceUp(GEAR, { r88_nb_monosashi: 60 });

export const ITEMS_R88_NUBE = GEAR;
// 生まれ変わりは ない
export const R88_REBIRTH_NUBE = {};

export const R88_NUBE_KANA = {
  r88_nb_onite: 'おにのてのくろいてぶくろ', r88_nb_kannon: 'びゃくえかんのんきょう', r88_nb_suisho: 'れいすいしょうのたま', r88_nb_nenju: 'ねんじゅ', r88_nb_okiwa: 'ぎょきりん',
  r88_nb_akira: 'あきらへのおまもり', r88_nb_ramen: 'せんせいのかっぷめん', r88_nb_necktie: 'くろいねくたい', r88_nb_monosashi: 'たけのものさし', r88_nb_shusseki: 'しゅっせきぼ',
  r88_nb_yoroi: 'おにのよろい', r88_nb_kimono: 'ゆきおんなのきもの', r88_nb_kakigori: 'ゆきめのかきごおり', r88_nb_sasumata: 'くびさすまた', r88_nb_karin: 'かりんびのじゅつのおふだ',
  r88_nb_kuda: 'くだぎつねのたけづつ', r88_nb_senbei: 'ざしきわらしのしおせんべい', r88_nb_uta: 'にんぎょのうた', r88_nb_ball: 'おきょうをまいたさっかーぼーる', r88_nb_kodai: 'こだいのおまもりのやいば',
  r88_nb_magatama: 'まがたまのおまもり', r88_nb_towel: 'ひろしのたおる', r88_nb_boushi: 'かつやのぼうし', r88_nb_randoseru: 'くろいらんどせる',
};
