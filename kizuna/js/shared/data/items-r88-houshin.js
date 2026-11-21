// 第88回 G1班: ほう神演義の スーパー宝貝 7つ（docs/plan-r88-anime-gear.md の 2-1。ぜんぶ 伝説・そろいの 組 super_paopei）
//   G2班: のこりの 宝貝（崑崙 26 ＋ 太極の打神べん・金鰲 11）を 足した
//   宝貝は「使う」物: use.ability … 戦いの 道具から 1つの 戦いで 1回（data/abilities-r88.js の かくし技）
import { weapon, armor, shield, acc, priceUp } from './items-r88-kit.js?v=c53292a2af59';

const P = { work: 'houshin', set: 'super_paopei' };
const H = { work: 'houshin' };
const NA = { work: 'houshin', set: 'nataku' };
const KO = { work: 'houshin', set: 'kotenka' };
const JIN = { work: 'houshin', set: 'jutenkun' };

const GEAR = {
  r88_raikoben: { ...weapon('whip', 'den'), ...P, name: '雷公べん', fx: [{ k: 'el_bolt', v: 8 }], bonus: { str: 16, mag: 16 }, use: { ability: 'r88u_raikou' }, look: 'raikou', desc: 'スーパー宝貝の1つ。ムチの中でいちばん強い、最強の雷のムチ。ふつうの攻撃が雷になる。' },
  r88_kinben: { ...weapon('whip', 'den'), ...P, name: '禁べん', reach: 'all', bonus: { str: 18, agi: 8 }, use: { ability: 'r88u_kinben' }, look: 'chain', desc: 'スーパー宝貝の1つ。遠くはなれた敵までとどいて、打ちすえるムチ。ふつうの攻撃が敵全体にとどく。' },
  r88_taikyoku: { ...acc('den'), ...P, name: '太極図の巻物', fx: [{ k: 'mpregen', v: 8 }], bonus: { hp: 100, str: 20, def: 28, mag: 38, agi: 26, heal: 34, mp: 30 }, use: { ability: 'r88u_taikyoku' }, desc: 'スーパー宝貝の1つ。ほかの宝貝の力を消してしまう、白と黒の図の巻物。行動するたびにMPが回復する。' },
  r88_kinkosen: { ...weapon('dagger', 'den'), ...P, name: '金こうせん', fx: [{ k: 'chase', v: 8 }], bonus: { agi: 16, str: 10 }, use: { ability: 'r88u_kinko' }, look: 'jambiya', desc: 'スーパー宝貝の1つ。大きなはさみの形の宝貝。七色の竜をよび出す。ふつうの攻撃のあと、ときどきもう1回攻撃する。' },
  r88_keisei: { ...armor('robe', 'den'), ...P, name: 'けい世元じょう', fx: [{ k: 'evade', v: 8 }], bonus: { mag: 24, heal: 14, agi: 8 }, use: { ability: 'r88u_keisei' }, desc: 'スーパー宝貝の1つ。見た者の心をまどわす羽衣。敵の攻撃をかわしやすくなる。' },
  r88_rokkon: { ...armor('cloth', 'den'), ...P, name: '六こんばん', fx: [{ k: 'res_dark', v: 8 }], bonus: { hp: 40, agi: 10 }, use: { ability: 'r88u_rokkon' }, desc: 'スーパー宝貝の1つ。どんな物もつつみこむ、黒い布のマント。だれでも装備できる。闇に強い。' },
  r88_banko: { ...weapon('staff', 'den'), ...P, name: 'ばん古ばん', bonus: { mag: 46, heal: 24 }, use: { ability: 'r88u_banko' }, look: 'dragon', desc: 'スーパー宝貝の1つ。重力をあやつる旗。攻撃魔力がとても上がる。' },

  // ───── G2班: 崑崙の 宝貝（太公望と 仲間・十二仙）─────
  r88_dashin: { ...weapon('whip', 'mei'), ...H, name: '太公望の打神べん', fx: [{ k: 'el_wind', v: 5 }], bonus: { mag: 10 }, look: 'dashin', desc: '太公望が元始天尊からもらった宝貝。大気と風をあやつる。ふつうの攻撃が風になる。きたえぬくと、太極図の力で生まれ変わるという。' },
  r88_dashin_taikyoku: { ...weapon('whip', 'den'), ...H, name: '太極の打神べん', fx: [{ k: 'el_wind', v: 7 }], bonus: { mag: 22, str: 10, mp: 20 }, use: { ability: 'r88u_dashin' }, look: 'dashin', desc: '太極図の力を合わせて生まれ変わった打神べん。風のすべてをあやつる。ふつうの攻撃が風になる。' },
  r88_tsurizao: { ...weapon('staff', 'shop'), ...H, name: 'まっすぐな針のつりざお', bonus: { mag: 1 }, look: 'cane', desc: '太公望がつりに使う、まがっていない針のつりざお。魚はつれないが、のんびりした心になれる。' },
  r88_kenkonken: { ...weapon('boomerang', 'mei'), ...NA, name: 'けんこんけん', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 6 }, look: 'crescent', desc: 'なたの宝貝。うでわの形で、とばして敵に当てる。ふつうの攻撃のあと、ときどきもう1回攻撃する。' },
  r88_kontenryo: { ...weapon('whip', 'fu3'), ...NA, name: '混天りょう', fx: [{ k: 'el_ice', v: 4 }], look: 'snake', desc: 'なたの宝貝の、長い布。水をふるわせてあやつる。ふつうの攻撃が氷になる。' },
  r88_kinsen: { ...acc('mei'), ...NA, name: '金せん', bonus: { str: 6, mag: 12 }, use: { ability: 'r88u_kinsen' }, desc: 'なたがかたにつける、金のレンガの宝貝。光の光線を打ち出す。' },
  r88_kasenso: { ...weapon('spear', 'mei'), ...NA, name: '火せんそう', fx: [{ k: 'el_fire', v: 6 }], bonus: { str: 4 }, look: 'winged', desc: '太いつ真人がなたにあたえた、熱を出すやり。ふつうの攻撃が炎になる。' },
  r88_fukarin: { ...acc('fu3'), ...NA, name: '風火輪', bonus: { agi: 14, hp: 10 }, desc: 'なたの足の下にうかぶ、2つの輪。速く空をとべる。素早さが上がる。' },
  r88_sansento: { ...weapon('spear', 'mei'), ...H, name: '三せん刀', fx: [{ k: 'el_wind', v: 6 }], bonus: { agi: 4 }, look: 'trident', desc: 'ようぜんの三つまたのやり。ふると風が起きる。ふつうの攻撃が風になる。' },
  r88_kotenken: { ...acc('fu3'), ...H, name: 'こう天犬', fx: [{ k: 'chase', v: 4 }], bonus: { str: 4, agi: 4 }, desc: 'ようぜんの宝貝の、空をかける犬。いっしょに戦って、ときどき敵にかみつく（追撃）。' },
  r88_bakuya: { ...weapon('sword', 'mei'), ...KO, name: 'ばくやの宝剣', fx: [{ k: 'el_light', v: 6 }], bonus: { str: 4 }, look: 'holy', desc: '黄天化の剣。つかから光のやいばが出る。ふつうの攻撃が光になる。' },
  r88_bakuya2: { ...weapon('sword', 'mei'), ...KO, name: 'ばくやの宝剣II', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 4 }, look: 'crystal', desc: '道徳真君が黄天化におくった、2つめのばくやの宝剣。つかの両はしから光のやいばが出る。会心の一撃が出やすい。' },
  r88_sanshin: { ...weapon('boomerang', 'fu3'), ...KO, name: 'さん心くぎ', fx: [{ k: 'chase', v: 4 }], look: 'star', desc: '黄天化の投げるくぎ。ばくやの宝剣を小さくしたような宝貝。ときどきもう1回攻撃する。' },
  r88_karyuhyo: { ...weapon('boomerang', 'fu3'), ...H, name: '黄天化の火竜ひょう', fx: [{ k: 'el_fire', v: 4 }], look: 'cross', desc: '炎の竜の形の、投げる宝貝。太公望から黄天化にわたった。ふつうの攻撃が炎になる。' },
  r88_tensoyoku: { ...acc('fu3'), ...H, name: '天そうよく', bonus: { agi: 12, mag: 4 }, desc: '雷しん子のせなかのつばさ。空を速くとべる。素早さが上がる。' },
  r88_gomasho: { ...weapon('bat', 'mei'), ...H, name: '降魔しょ', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'club', desc: 'いごの、玉が2つついたこんぼう。形をなぎなたなどにかえられる。会心の一撃が出やすい。' },
  r88_gokoseki: { ...weapon('boomerang', 'fu3'), ...H, name: '五光石', fx: [{ k: 'crit', v: 4 }], look: 'boomer', desc: 'せんぎょくの投げる石。かならず当たるが、けがはさせない。会心の一撃が出やすい。' },
  r88_doryu: { ...weapon('claw', 'fu3'), ...H, name: '土竜のツメ', fx: [{ k: 'evade', v: 4 }], look: 'claw', desc: '土行孫のツメ。土をほってもぐる。ツメだけとばすこともできる。敵の攻撃をかわしやすくなる。' },
  r88_muro: { ...shield('mei'), ...H, name: 'むろけんこんもう', fx: [{ k: 'res_fire', v: 6 }], bonus: { mag: 6 }, look: 'shell', desc: '竜きつ公主のあみの宝貝。水をあやつり、よう岩もひやしてかためる。炎に強い。' },
  r88_fuin: { ...acc('mei'), ...H, name: '太極ふ印', bonus: { mag: 18, mp: 10 }, use: { ability: 'r88u_fuin' }, desc: 'ふげん真人の宝貝。元素をあやつって、炎・氷・雷のどれかで敵全体をうつ。攻撃魔力が上がる。' },
  r88_zansen: { ...weapon('sword', 'mei'), ...H, name: '斬せん剣', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 6 }, look: 'katana', desc: '玉てい真人の剣。音の速さで切る。会心の一撃が出やすい。' },
  r88_kuryu: { ...shield('mei'), ...H, name: '九竜神火とう', fx: [{ k: 'def', v: 6 }], look: 'dragon', desc: '太いつ真人の、せん人界でいちばんかたい宝貝。敵をとじこめるほどかたい。守備力が上がる。' },
  r88_banten: { ...acc('mei'), ...H, name: '番天印', bonus: { mag: 12, str: 4 }, use: { ability: 'r88u_banten' }, desc: '大きなはんこの宝貝。しるしをつけた敵に、かならず光が当たる。' },
  r88_inyo: { ...acc('mei'), ...H, name: 'いん陽鏡', bonus: { mag: 12, heal: 4 }, use: { ability: 'r88u_inyo' }, desc: 'いくつものかがみで光をあやつる宝貝。光で同じ種類の敵みんなをうつ。' },
  r88_hocho: { ...weapon('dagger', 'fu3'), ...H, name: '万能包丁', fx: [{ k: 'crit', v: 4 }], look: 'knife', desc: '道行天尊の、何でも切れる包丁。会心の一撃が出やすい。' },
  r88_gokasen: { ...weapon('fan', 'mei'), ...H, name: '五火七きんせん', fx: [{ k: 'el_fire', v: 6 }], bonus: { mag: 6 }, look: 'phoenix', desc: 'だっきの宝貝のおうぎ。あおぐと炎が出る。ふつうの攻撃が炎になる。' },
  r88_momo: { ...acc('fu3'), ...H, name: '天界のもも', fx: [{ k: 'regen', v: 4 }], bonus: { hp: 30 }, desc: '太公望の大好物の、せん人の世界のもも。行動するたびにHPが少し回復する。' },

  // ───── G2班: 金鰲の 宝貝（ちょうこうめい・四聖・十天君）─────
  r88_bakuryu: { ...weapon('whip', 'fu3'), ...H, name: 'ばく竜さく', fx: [{ k: 'paralyze', v: 4 }], look: 'chain', desc: 'ちょうこうめいの、馬に使うむちの形の宝貝。敵をしばる。ときどき敵をマヒさせる。' },
  r88_kinto: { ...acc('mei'), ...H, name: '混元金と', bonus: { mag: 10, hp: 30 }, use: { ability: 'r88u_kinto' }, desc: '雲しょう三姉妹の、何でもすいこむつぼ。敵1体をすいこんで、しばらく動けなくする（大きな敵にはききにくい）。' },
  r88_kaitenju: { ...weapon('boomerang', 'fu3'), ...H, name: '開天じゅ', fx: [{ k: 'el_fire', v: 4 }], look: 'star', desc: '王魔（四聖）の玉。速くとび、当たるとばくはつする。ふつうの攻撃が炎になる。' },
  r88_kongenju: { ...weapon('boomerang', 'fu3'), ...H, name: '混元じゅ', fx: [{ k: 'crit', v: 4 }], look: 'cross', desc: '高友かん（四聖）の玉の宝貝。会心の一撃が出やすい。' },
  r88_hekichiju: { ...weapon('boomerang', 'fu3'), ...H, name: 'へき地じゅ', fx: [{ k: 'atk', v: 4 }], look: 'wing', desc: 'よう森（四聖）の玉の宝貝。大地をさくほどの力で、攻撃力が上がる。' },
  r88_jin_kanpyo: { ...acc('fu3'), ...JIN, name: '寒氷じんのお札', bonus: { mag: 8, hp: 10 }, use: { ability: 'r88u_jin_kanpyo' }, desc: '十天君の、空間の宝貝「寒氷じん」を開くお札。ふぶきと氷のかたまりで敵全体をうつ。' },
  r88_jin_retsuen: { ...acc('fu3'), ...JIN, name: '烈炎じんのお札', bonus: { mag: 8, str: 4 }, use: { ability: 'r88u_jin_retsuen' }, desc: '十天君の、空間の宝貝「烈炎じん」を開くお札。炎で敵全体をうつ。' },
  r88_jin_fuko: { ...acc('fu3'), ...JIN, name: '風こうじんのお札', bonus: { mag: 8, agi: 4 }, use: { ability: 'r88u_jin_fuko' }, desc: '十天君の、空間の宝貝「風こうじん」を開くお札。たつまきで敵全体をうつ。' },
  r88_jin_tenzetsu: { ...acc('fu3'), ...JIN, name: '天絶じんのお札', bonus: { mag: 8, def: 4 }, use: { ability: 'r88u_jin_tenzetsu' }, desc: '十天君の、空間の宝貝「天絶じん」を開くお札。いん石をふらせて敵全体をうつ。' },
  r88_jin_kosa: { ...acc('fu3'), ...JIN, name: '紅砂じんのお札', fx: [{ k: 'evade', v: 4 }], bonus: { agi: 6 }, use: { ability: 'r88u_jin_kosa' }, desc: '十天君の、空間の宝貝「紅砂じん」を開くお札。砂の中を一しゅんで動く。敵の攻撃をかわしやすくなる。' },
  r88_jin_kinko: { ...acc('mei'), ...JIN, name: '金光じんのお札', bonus: { mag: 14, agi: 4 }, use: { ability: 'r88u_jin_kinko' }, desc: '金光聖母の、空間の宝貝「金光じん」を開くお札。光をまげて敵全体の目をくらませ、混乱させる。' },
};
priceUp(GEAR, { r88_tsurizao: 60 });
// G5班: ライバルの まぼろしが きまったので、ガチャ・宝の 入れ物に 入れる（G2班の gacha: false を 外した。入らない 品は data/gacha-r88.js の gachaBlock が きめる）

export const ITEMS_R88_HOUSHIN = GEAR;

// 生まれ変わり（G2班）: 打神べんを 上限まで きたえて、太極図の巻物を 持って いると 太極の打神べん（伝説）に
export const R88_REBIRTH_HOUSHIN = {
  r88_dashin: { to: 'r88_dashin_taikyoku', gold: 20000, mats: [['star_shard', 10], ['limit_stone', 1]], need: { items: ['r88_taikyoku'] } },
};

export const R88_HOUSHIN_KANA = {
  r88_raikoben: 'らいこうべん', r88_kinben: 'きんべん', r88_taikyoku: 'たいきょくずのまきもの', r88_kinkosen: 'きんこうせん',
  r88_keisei: 'けいせいげんじょう', r88_rokkon: 'ろっこんばん', r88_banko: 'ばんこばん',
  r88_dashin: 'たいこうぼうのだしんべん', r88_dashin_taikyoku: 'たいきょくのだしんべん', r88_tsurizao: 'まっすぐなはりのつりざお',
  r88_kenkonken: 'けんこんけん', r88_kontenryo: 'こんてんりょう', r88_kinsen: 'きんせん', r88_kasenso: 'かせんそう',
  r88_fukarin: 'ふうかりん', r88_sansento: 'さんせんとう', r88_kotenken: 'こうてんけん', r88_bakuya: 'ばくやのほうけん',
  r88_bakuya2: 'ばくやのほうけんつー', r88_sanshin: 'さんしんくぎ', r88_karyuhyo: 'こうてんかのかりゅうひょう', r88_tensoyoku: 'てんそうよく',
  r88_gomasho: 'ごうましょ', r88_gokoseki: 'ごこうせき', r88_doryu: 'どりゅうのつめ', r88_muro: 'むろけんこんもう',
  r88_fuin: 'たいきょくふいん', r88_zansen: 'ざんせんけん', r88_kuryu: 'くりゅうしんかとう', r88_banten: 'ばんてんいん',
  r88_inyo: 'いんようきょう', r88_hocho: 'ばんのうぼうちょう', r88_gokasen: 'ごかしちきんせん', r88_momo: 'てんかいのもも',
  r88_bakuryu: 'ばくりゅうさく', r88_kinto: 'こんげんきんと', r88_kaitenju: 'かいてんじゅ', r88_kongenju: 'こんげんじゅ',
  r88_hekichiju: 'へきちじゅ', r88_jin_kanpyo: 'かんぴょうじんのおふだ', r88_jin_retsuen: 'れつえんじんのおふだ', r88_jin_fuko: 'ふうこうじんのおふだ',
  r88_jin_tenzetsu: 'てんぜつじんのおふだ', r88_jin_kosa: 'こうさじんのおふだ', r88_jin_kinko: 'きんこうじんのおふだ',
};
