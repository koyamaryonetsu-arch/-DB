// レア装備（第31回 C）。items.js で まぜる
//
// 第35回: ★（強さ）と レア度（めずらしさ）を 分けた（家族:「★の 数と ランクの 関係が わからない」）
//   ★（starsFor・rare-loot.js の starsOf）… 強さ。名前の あとの ★の 数・説明の「強さ ★★★（ランク7）」
//     ★1 … 店で 買える 品だけ（強さは その ステージの 店の 品。きたえられない・れん金で 回数も ふやせない）
//     ★2〜★5 … 店では 買えない 品。ランク（強さの ものさし）で きまる（STARS_BY_RANK）
//       ★2 ランク1〜4（序章〜第2章）・★3 ランク5〜7（第3〜4章）・★4 ランク8（第5章）・★5 ランク9〜10（その先）
//     同じ ランクなら 店の 品（★1）より 強い。★が 多いほど 強い（★と ランクが さかさまに ならない）
//   レア度（rarity 0〜5）… めずらしさ。名前の 色（client/ui/rarity.js・css の .rar.r1〜r5）と 宝箱・店の 出やすさ
//     0 … 店で 買える 品（色なし）
//     1 緑 … 店では 買えない ふつうの 品（ふしぎなかじで 作る 品・指輪 など）
//     2 青 … むかしからの「★の 品」（star: true）・宝の洞窟の 品・ボスの 品（第32回）
//     3 紫 … 宝の洞窟の 品・ランク7より 上の ★の 品・れん金がまの 品（第32回）
//     4 オレンジ … 宝の洞窟の 主の 宝箱・ひみつのダンジョン（20階から）
//     5 金・にじ … ひみつのダンジョンの 深い 階（50階から）だけ
//   rarity が ない 装備は assignRarity が 上の きまりで つける（店の 品は 0）。きたえた 装備（+1〜）は もとの 装備と おなじ
//   （RAR_K … データを 作る ときの 強さの かけ算。むかしの レア度の まま。★とは べつ）
//
// 手に入る 所（src）
//   'tm'     … 宝の洞窟の 宝箱。grp: 地図の 名前の ことばの なかま（data/rare-loot.js の TM_WORD_GROUP）
//   'boss'   … 物語の ボスが かならず 落とす（第32回。前は 4回に 1回）。boss: 魔物の ID
//   'region' … ふつうの 魔物が まれに 落とす。region: 地方（1 ミドリナ・2 海・3 シロガネ・4 コガネ・5 星の塔）
//   'sd'     … ひみつのダンジョンだけ（ほかでは 出ない）
//
// とくせい（今 ある しくみ ＋ 第31回で 足した 2つ）
//   resist: { fire: 0.8 } … 属性の ダメージ・状態異常の かかりやすさに かける / onHit … 武器で なぐると ときどき 状態異常
//   crit: 0.03 … 会心の 出やすさを 足す（shared/battle.js の calcPhys）
//   mpRegen: 1 … 戦いで 行動する たびに MPが 回復する（shared/battle.js）

// 強さの めやす（items.js の EQUIP_RANKS の 剣・だれでも 着られる 服）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
// 武器の 種類ごとの 強さ（剣を 1）。店の ランク7の 品の わりあい
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
// レア度で 少しずつ 強く
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
// 売り値（ランクと レア度）
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

const W = (cat, rank, rarity, k = 1) => ({ type: 'weapon', cat, rank, rarity, atk: Math.round(SWORD[rank] * CAT_K[cat] * RAR_K[rarity] * k) });
const A = (armorType, rank, rarity, k = 1) => ({ type: 'armor', armorType, rank, rarity, def: Math.round(CLOTH[rank] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rank, rarity, k = 1) => ({ type: 'shield', rank, rarity, def: Math.round(CLOTH[rank] * RAR_K[rarity] * k) });
const H = (rank, rarity, helm = false, k = 1) => ({ type: 'head', rank, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[rank] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rank, rarity) => ({ type: 'acc', rank, rarity });
const tm = (grp) => ({ src: 'tm', grp });
const boss = (id) => ({ src: 'boss', boss: id });
const region = (n) => ({ src: 'region', region: n });
const SD = { src: 'sd' };
// ボスの 品（第32回）: その ランクの 店の 品と おなじ 強さの ★2（レア度の ぶんを もどす）
const BW = (cat, rank) => W(cat, rank, 2, 1 / RAR_K[2]);
const BA = (armorType, rank) => A(armorType, rank, 2, 1 / RAR_K[2]);
const BS = (rank) => S(rank, 2, 1 / RAR_K[2]);
const BH = (rank, helm = false) => H(rank, 2, helm, 1 / RAR_K[2]);

const GEAR = {
  // ═════ 宝の洞窟（tm）═════
  // ── 大地・岩（守り・HP・マヒに強い）──
  rock_axe: { ...W('axe', 2, 2), ...tm('rock'), name: '岩くだきのオノ', bonus: { def: 2 }, desc: '岩もくだける、ずっしり重いオノ。' },
  rockhill_shield: { ...S(3, 2), ...tm('rock'), name: '岩山のたて', bonus: { hp: 8 }, resist: { paralyze: 0.8 }, desc: '岩山からけずり出したたて。マヒしにくい。' },
  kintaro_axe: { ...W('axe', 4, 3), ...tm('rock'), name: '金太ろうのまさかり', bonus: { str: 4, hp: 10 }, desc: 'クマとすもうをとった力もちの子のオノ。力とHPが上がる。' },
  gravity_gi: { ...A('gi', 5, 3), ...tm('rock'), name: '重力の道着', bonus: { str: 6, agi: -2 }, desc: '着ているだけで修行になる、とても重い道着。力が上がる。' },
  earth_helm: { ...H(6, 2, true), ...tm('rock'), name: '大地のかぶと', bonus: { hp: 15 }, resist: { paralyze: 0.7 }, desc: '大地の力をこめたかぶと。HPが上がり、マヒしにくい。' },
  kaname_charm: { ...C(6, 3), ...tm('rock'), name: 'かなめ石のお守り', bonus: { def: 8, hp: 20 }, resist: { paralyze: 0.6 }, desc: '地しんをしずめる石のお守り。守りとHPが上がり、マヒしにくい。' },
  mithril_mail: { ...A('heavy', 7, 3), ...tm('rock'), name: 'ミスリルのよろい', bonus: { agi: 2 }, resist: { paralyze: 0.8 }, desc: '鉄より軽く、銀より強い、まぼろしの金属のよろい。' },
  titan_club: { ...W('bat', 8, 4), ...tm('rock'), name: 'タイタンのこんぼう', bonus: { str: 8, hp: 20 }, desc: '山をもち上げた大男たちのこんぼう。力とHPが大きく上がる。' },

  // ── まぼろし（マヌーサ・混乱に強い／ときどき混乱させる）──
  haze_fan: { ...W('fan', 3, 2), ...tm('mirage'), name: 'かげろうのおうぎ', bonus: { agi: 5 }, resist: { blind: 0.7 }, desc: 'かげろうがゆらゆらゆれるおうぎ。マヌーサにかかりにくい。' },
  bewitch_whip: { ...W('whip', 4, 2), ...tm('mirage'), name: 'まどわしのムチ', onHit: { status: 'confuse', chance: 0.15 }, desc: 'ふるとまぼろしが見え、ときどき敵を混乱させるムチ。' },
  mirage_pierce: { ...C(5, 3), ...tm('mirage'), name: 'しんきろうのピアス', bonus: { agi: 8 }, resist: { blind: 0.5, confuse: 0.5 }, desc: '砂ばくのしんきろうをとじこめたピアス。マヌーサと混乱に強い。' },
  foxfire_robe: { ...A('cloth', 6, 3), ...tm('mirage'), name: 'キツネ火のころも', bonus: { agi: 6, mag: 6 }, resist: { confuse: 0.6 }, desc: 'キツネのまぼろしの火でそめたころも。だれでも装備でき、混乱しにくい。' },
  tanuki_leaf: { ...H(7, 2), ...tm('mirage'), name: 'タヌキのはっぱ', bonus: { agi: 5 }, resist: { blind: 0.6 }, desc: '頭にのせると、すがたを化かせる…気がするはっぱ。' },
  mirage_sword: { ...W('sword', 8, 4), ...tm('mirage'), name: 'まぼろしの剣', bonus: { agi: 6 }, onHit: { status: 'confuse', chance: 0.12 }, desc: '本物か、まぼろしか…。ときどき敵を混乱させる。' },

  // ── ねむり（ねむりに強い／ときどき ねむらせる）──
  cloud_staff: { ...W('staff', 2, 2), ...tm('sleep'), name: 'ひつじ雲のつえ', bonus: { mag: 4, heal: 3 }, onHit: { status: 'sleep', chance: 0.15 }, desc: 'ふわふわの雲がついたつえ。たたくと、ときどき敵がねむる。' },
  lullaby_fan: { ...W('fan', 4, 2), ...tm('sleep'), name: '子もり歌のおうぎ', bonus: { heal: 4 }, onHit: { status: 'sleep', chance: 0.15 }, desc: 'あおぐと子もり歌が聞こえるおうぎ。ときどき敵がねむる。' },
  sleeping_ribbon: { ...H(5, 3), ...tm('sleep'), name: 'ねむり姫のリボン', bonus: { mag: 4, heal: 4 }, resist: { sleep: 0.3 }, desc: '100年のねむりから目覚めたお姫様のリボン。ねむりにとても強い。' },
  dream_dagger: { ...W('dagger', 6, 3), ...tm('sleep'), name: '夢見の短剣', bonus: { agi: 4 }, onHit: { status: 'sleep', chance: 0.2 }, desc: '切られた者は、あまい夢を見てねむってしまう。' },
  baku_pillow: { ...W('fan', 7, 3), ...tm('sleep'), name: 'バクのまくら', bonus: { hp: 20, heal: 8 }, resist: { sleep: 0.4 }, onHit: { status: 'sleep', chance: 0.2 }, desc: '悪い夢を食べるバクの毛のまくら。ねむりに強く、敵をねむらせる。' },
  dream_robe: { ...A('robe', 8, 4), ...tm('sleep'), name: 'ゆめみのローブ', bonus: { mag: 10, mp: 20 }, resist: { sleep: 0.3, confuse: 0.6 }, desc: '星の夢をぬいこんだローブ。ねむりと混乱に強い。' },

  // ── ひみつ（忍び・スパイ・探てい・ロボット。会心）──
  shinobi_knife: { ...W('dagger', 3, 2), ...tm('secret'), name: '忍びの小刀', bonus: { agi: 4 }, crit: 0.03, desc: '忍びがかくし持つ小刀。会心の一撃が出やすい。' },
  spy_pen: { ...W('dagger', 4, 2), ...tm('secret'), name: 'スパイの万年筆', bonus: { mag: 3, agi: 3 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: 'ペン先からしびれ薬の出る、ひみつの万年筆。ときどき敵をマヒさせる。' },
  detective_cane: { ...W('staff', 5, 3), ...tm('secret'), name: '名探ていのステッキ', bonus: { mag: 10, agi: 4 }, resist: { blind: 0.6, confuse: 0.6 }, desc: 'どんなトリックも見ぬくステッキ。マヌーサと混乱に強い。' },
  shinobi_garb: { ...A('gi', 6, 3), ...tm('secret'), name: '忍び装束', bonus: { agi: 8 }, crit: 0.03, desc: '音もなく動ける忍びの服。素早さが上がり、会心が出やすい。' },
  magic_pocket: { ...C(6, 3), ...tm('secret'), name: 'ふしぎなポケット', bonus: { mp: 20, mag: 5 }, mpRegen: 1, desc: '何でも出てきそうなポケット。行動するたびにMPが1回復する。' },
  master_sakabatou: { ...W('sword', 7, 3), ...tm('secret'), name: '名工の逆ば刀', bonus: { agi: 4, def: 4 }, crit: 0.04, desc: '名工が最後に打った逆ば刀。人を守るための刀。会心が出やすい。' },
  shadow_knife: { ...W('dagger', 8, 4), ...tm('secret'), name: '影うちの小刀', bonus: { agi: 8 }, crit: 0.08, desc: '影から影へ。急所をねらう忍びの名刀。会心がとても出やすい。' },

  // ── 古代（魔力・MPの 回復）──
  rune_staff: { ...W('staff', 3, 2), ...tm('ancient'), name: '古代文字のつえ', bonus: { mag: 8 }, mpRegen: 1, desc: 'なぞの古代文字がほられたつえ。行動するたびにMPが1回復する。' },
  haniwa_shield: { ...S(4, 2), ...tm('ancient'), name: 'はにわのたて', bonus: { hp: 10 }, desc: '古代の土の人形をかたどった、まるいたて。HPが上がる。' },
  levistone: { ...C(5, 3), ...tm('ancient'), name: 'ひこう石のペンダント', bonus: { agi: 10, mp: 10 }, mpRegen: 1, desc: '青く光る、空にうかぶ石のペンダント。体が軽くなり、MPも回復する。' },
  explorer_whip: { ...W('whip', 6, 3), ...tm('ancient'), name: '考古学者のムチ', bonus: { agi: 5 }, crit: 0.03, resist: { poison: 0.6 }, desc: '古代の遺せきをかけめぐった学者のムチ。会心が出やすい。' },
  magatama: { ...C(7, 3), ...tm('ancient'), name: 'まが玉の首かざり', bonus: { mag: 8, heal: 8, mp: 15 }, mpRegen: 2, desc: '古代の王がつけていた緑の石。行動するたびにMPが2回復する。' },
  lost_crown: { ...H(8, 4), ...tm('ancient'), name: '失われた王国のかんむり', bonus: { mag: 10, heal: 6, agi: 4 }, mpRegen: 2, desc: '海にしずんだ王国の金のかんむり。行動するたびにMPが2回復する。' },

  // ── 氷・雪・白銀・冬・氷河・つらら（氷に強い／こおらせて マヒ）──
  icicle_dagger: { ...W('dagger', 2, 2), ...tm('ice'), name: 'つららの短剣', onHit: { status: 'paralyze', chance: 0.1 }, desc: 'つららをけずった短剣。ときどき敵をこおらせて動けなくする。' },
  snowkid_hood: { ...H(3, 2), ...tm('ice'), name: '雪んこのずきん', bonus: { hp: 6 }, resist: { ice: 0.8 }, desc: '雪国の子がかぶる、ぬくぬくのずきん。氷に強い。' },
  icicle_boomerang: { ...W('boomerang', 3, 2), ...tm('ice'), name: 'つららのブーメラン', bonus: { agi: 2 }, desc: 'きらきら光る、こおりのブーメラン。敵全体に当たる。' },
  polar_claw: { ...W('claw', 4, 2), ...tm('ice'), name: '白クマのツメ', bonus: { str: 3 }, resist: { ice: 0.9 }, desc: '北の海の白クマのような、大きなツメ。' },
  silver_coat: { ...A('cloth', 5, 2), ...tm('ice'), name: '白銀のコート', bonus: { hp: 10 }, resist: { ice: 0.7 }, desc: '雪の色をした、ぬくぬくのコート。だれでも装備でき、氷に強い。' },
  snowqueen_shield: { ...S(5, 3), ...tm('ice'), name: '雪の女王のたて', resist: { ice: 0.6 }, desc: '雪の女王が持っていた、氷のかがみのたて。氷にとても強い。' },
  winter_katana: { ...W('sword', 6, 3), ...tm('ice'), name: '冬将軍の刀', bonus: { agi: 3 }, onHit: { status: 'paralyze', chance: 0.12 }, desc: '冬をつれてくる将軍の刀。切られた敵は、こおりついて動けなくなる。' },
  glacier_spear: { ...W('spear', 7, 3), ...tm('ice'), name: '氷河のやり', resist: { ice: 0.8 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: '千年とけない氷河の氷のやり。ときどき敵をこおらせる。' },
  snowflower_brooch: { ...C(7, 2), ...tm('ice'), name: '雪の花のブローチ', bonus: { mag: 6, mp: 10 }, resist: { ice: 0.7 }, desc: '雪の花の形のブローチ。魔力が上がり、氷に強くなる。' },
  aurora_staff: { ...W('staff', 8, 3), ...tm('ice'), name: 'オーロラのつえ', bonus: { mag: 30, heal: 14 }, resist: { ice: 0.85 }, desc: '夜空のオーロラをとじこめたつえ。呪文の力がとても上がる。' },
  white_dragon_mail: { ...A('heavy', 8, 4), ...tm('ice'), name: '白銀竜のよろい', bonus: { hp: 20 }, resist: { ice: 0.6, fire: 0.85 }, desc: '雪山の白い竜のうろこのよろい。氷にとても強い。' },

  // ── 炎・火・ようがん・赤岩・火の山・火山（炎に強い）──
  firebird_fan: { ...W('fan', 2, 2), ...tm('fire'), name: '火の鳥のおうぎ', bonus: { agi: 2, mag: 2 }, resist: { fire: 0.9 }, desc: '火の鳥の羽でできたおうぎ。少し炎に強い。' },
  salamander_scale: { ...C(3, 2), ...tm('fire'), name: '火トカゲのうろこ', bonus: { def: 3 }, resist: { fire: 0.7 }, desc: '炎の中にすむトカゲのうろこ。炎に強くなる。' },
  lava_axe: { ...W('axe', 4, 2), ...tm('fire'), name: 'ようがんのオノ', bonus: { str: 2 }, desc: '冷えたようがんでつくった、赤黒いオノ。' },
  magma_pan: { ...W('axe', 5, 3), ...tm('fire'), name: 'マグマのフライパン', bonus: { def: 3, heal: 4 }, resist: { fire: 0.85 }, desc: '火山の熱でもこげない、シェフのあこがれのフライパン。' },
  redrock_mail: { ...A('heavy', 5, 2), ...tm('fire'), name: '赤岩のよろい', resist: { fire: 0.8 }, desc: '火山の赤い岩をはりつけた、かたいよろい。炎に強い。' },
  fire_drake_spear: { ...W('spear', 6, 3), ...tm('fire'), name: '火竜のやり', bonus: { str: 3 }, resist: { fire: 0.85 }, desc: '火竜のキバを先につけたやり。' },
  flame_haori: { ...A('gi', 6, 3), ...tm('fire'), name: '炎の羽織', bonus: { str: 4, agi: 3 }, resist: { fire: 0.8 }, desc: '炎のもようの羽織。心を燃やして戦う人のための服。' },
  fireball_bat: { ...W('bat', 7, 3), ...tm('fire'), name: '火の玉バット', bonus: { str: 5 }, crit: 0.04, desc: '火の玉のような打球が飛ぶバット。会心が出やすい。' },
  phoenix_plume: { ...H(7, 3), ...tm('fire'), name: '不死鳥の羽根かざり', bonus: { heal: 8, hp: 15 }, resist: { fire: 0.8 }, desc: '何度でもよみがえる鳥の羽根のかざり。回復の力とHPが上がる。' },
  kagutsuchi: { ...W('sword', 8, 4), ...tm('fire'), name: 'カグツチの剣', bonus: { str: 6 }, resist: { fire: 0.8 }, desc: '火の神の名をもつ、赤くかがやく剣。炎に強くなる。' },
  lavastone_ring: { ...C(8, 3), ...tm('fire'), name: 'ようがん石の指輪', bonus: { str: 8, def: 4 }, resist: { fire: 0.7 }, desc: '火山のおくでとれる、熱い石の指輪。力と守りが上がる。' },

  // ═════ 物語の ボスが かならず 落とす（boss）═════
  // 第32回: かならず 落とす かわりに、その章の 店の いちばん よい 装備と おなじ くらいの 強さ（ランクも おなじ・★2）＋ とくせい 1つ。
  //         れん金がまで その章の 品と 合わせると、もっと 強い ★3〜★4 に なる（data/alchemy.js）
  // 第1章（店 ランク3）
  treant_staff: { ...BW('staff', 3), ...boss('dark_treant'), name: 'ねじれ木のつえ', bonus: { mag: 4, heal: 10 }, resist: { poison: 0.7 }, desc: 'ダークトレントの枝のつえ。回復の力が上がり、毒にかかりにくい。' },
  goldoon_fist: { ...BW('claw', 3), ...boss('goldoon'), name: 'ゴルドーンのこぶし', bonus: { def: 3 }, resist: { paralyze: 0.8 }, desc: '岩の大男ゴルドーンの、こぶしの形のナックル。マヒしにくい。' },
  // 第2章（店 ランク4）
  kraken_whip: { ...BW('whip', 4), ...boss('giant_squid'), name: 'クラーケンのムチ', onHit: { status: 'paralyze', chance: 0.12 }, desc: '大王イカの足のようにからみつくムチ。ときどき敵をマヒさせる。' },
  storm_general_helm: { ...BH(4, true), ...boss('storm_general'), name: '嵐の将軍のかぶと', bonus: { hp: 8 }, resist: { wind: 0.8 }, desc: 'ストルムのかぶと。風に強い。' },
  // 第3章（店 ランク5）
  mammoth_fur: { ...BA('cloth', 5), ...boss('blizzard_mammoth'), name: 'マンモスの毛皮', bonus: { hp: 12 }, resist: { ice: 0.75 }, desc: 'ブリザマンモスの毛皮。だれでも装備でき、氷に強い。' },
  magma_hammer: { ...BW('axe', 5), ...boss('magma_golem'), name: 'ようがんの大づち', bonus: { str: 3 }, resist: { fire: 0.85 }, desc: 'マグマゴーレムの体からできた大づち。炎に少し強い。' },
  flare_shield: { ...BS(5), ...boss('flame_knight'), name: '炎の騎士のたて', resist: { fire: 0.75 }, desc: 'フレアードのたて。炎に強い。' },
  guardian_halberd: { ...BW('spear', 5), ...boss('trial_guardian'), name: '竜の番人のほこ', bonus: { def: 4 }, crit: 0.03, desc: '竜の番人が持っていた大きなほこ。会心が出やすい。' },
  witch_broom: { ...BW('staff', 5), ...boss('flame_witch'), name: '炎の魔女のほうき', bonus: { mag: 16, agi: 4 }, resist: { fire: 0.85 }, desc: 'イグニアのほうき。魔力と素早さが上がり、炎に少し強い。' },
  witch_hat: { ...BH(5), ...boss('flame_witch_true'), name: '魔女の黒いぼうし', bonus: { mag: 6, mp: 10 }, mpRegen: 1, desc: '真の姿のイグニアがかぶっていたぼうし。行動するたびにMPが1回復する。' },
  // 第4章（店 ランク6）
  scorpion_whip: { ...BW('whip', 6), ...boss('armor_scorpion'), name: 'サソリのしっぽムチ', onHit: { status: 'poison', chance: 0.3 }, desc: 'よろい大サソリのしっぽのムチ。ときどき敵を毒にする。' },
  ankh_staff: { ...BW('staff', 6), ...boss('mummy_king'), name: 'アンクのつえ', bonus: { heal: 14, mag: 8 }, mpRegen: 1, desc: '命のしるしの形をした、古代の王のつえ。行動するたびにMPが1回復する。' },
  traitor_dagger: { ...BW('dagger', 6), ...boss('zaid_minister'), name: 'うらぎりの短剣', bonus: { agi: 5 }, onHit: { status: 'confuse', chance: 0.15 }, desc: '大臣ザイードのかくし持っていた短剣。ときどき敵を混乱させる。' },
  majin_scimitar: { ...BW('sword', 6), ...boss('zaid_demon'), name: '魔神の三日月刀', bonus: { str: 3 }, crit: 0.03, desc: '砂の魔神の大きな三日月刀。会心が出やすい。' },
  whalebone_boomerang: { ...BW('boomerang', 6), ...boss('sand_whale'), name: 'クジラの骨のブーメラン', bonus: { hp: 12 }, resist: { paralyze: 0.8 }, desc: '砂クジラの骨のブーメラン。敵全体に当たり、マヒしにくい。' },
  seawitch_dress: { ...BA('robe', 6), ...boss('morgana'), name: '海の魔女のドレス', bonus: { mag: 8, mp: 12 }, resist: { ice: 0.8 }, desc: 'モルガナのドレス。魔力とMPが上がり、氷に強い。' },
  leviathan_shield: { ...BS(6), ...boss('morgana_true'), name: 'リヴァイアサンのたて', resist: { ice: 0.8 }, desc: '海の大竜のうろこのたて。氷に強い。' },
  // 第5章（店 ランク7）
  hundred_eye_helm: { ...BH(7, true), ...boss('argos'), name: '百目のかぶと', bonus: { agi: 4 }, resist: { blind: 0.5, confuse: 0.7 }, desc: 'アルゴスの目のもようのかぶと。マヌーサと混乱にかかりにくい。' },
  old_fang_sword: { ...BW('sword', 7), ...boss('old_dragon'), name: '古竜のキバの剣', bonus: { str: 4, hp: 15 }, resist: { fire: 0.85 }, desc: '古竜オルドラのキバをけずった剣。炎に少し強い。' },

  // ═════ ふつうの 魔物が まれに 落とす（region）═════
  // 1: ミドリナ地方
  gold_axe: { ...W('axe', 3, 3), ...region(1), name: '金のオノ', desc: '「落としたのは、このオノですか？」正直者がもらった金のオノ。' },
  fairy_fan: { ...W('fan', 3, 2), ...region(1), name: 'ようせいの羽のおうぎ', bonus: { agi: 5, mag: 2 }, desc: 'ようせいの羽でできた、すきとおったおうぎ。' },
  needle_sword: { ...W('dagger', 3, 2), ...region(1), name: 'ぬいばりの剣', crit: 0.05, desc: '小さな体で大おにをたおした、ぬいばりの剣。会心が出やすい。' },
  // 2: 風の海
  sea_trident: { ...W('spear', 5, 3), ...region(2), name: '海神のほこ', resist: { ice: 0.9 }, desc: '海の神の三つまたのほこ。' },
  mermaid_shield: { ...S(4, 2), ...region(2), name: '人魚のたて', resist: { ice: 0.85 }, desc: '人魚の住む海でひろったたて。少し氷に強い。' },
  kappa_claw: { ...W('claw', 4, 2), ...region(2), name: 'カッパの水かきのツメ', bonus: { agi: 4 }, resist: { ice: 0.9 }, desc: '泳ぎの名人カッパの水かきのツメ。素早さが上がる。' },
  // 3: シロガネ地方
  dwarf_pick: { ...W('axe', 5, 2), ...region(3), name: 'ドワーフのつるはし', bonus: { def: 2 }, desc: '山にすむ小人たちの、こわれないつるはし。' },
  yeti_club: { ...W('bat', 6, 2), ...region(3), name: 'イエティのこんぼう', bonus: { hp: 12 }, desc: '雪山の大男がふり回していたこんぼう。' },
  aurora_robe: { ...A('robe', 6, 3), ...region(3), name: 'オーロラのローブ', bonus: { mag: 8, heal: 6 }, resist: { ice: 0.8 }, desc: 'オーロラの色にかがやくローブ。氷に強い。' },
  // 4: コガネ地方
  magic_carpet: { ...A('cloth', 7, 2), ...region(4), name: '魔法のじゅうたんのマント', bonus: { agi: 8 }, desc: '空飛ぶじゅうたんでつくったマント。だれでも装備できる。' },
  thief_knife: { ...W('dagger', 7, 2), ...region(4), name: '40人のとうぞくのナイフ', bonus: { agi: 4 }, desc: '「ひらけゴマ！」の宝のほら穴で見つけたナイフ。' },
  gold_abacus: { ...W('fan', 7, 3), ...region(4), name: '黄金のそろばん', bonus: { mag: 6, agi: 4 }, desc: '社長がはじく金色のそろばん。ふると、お金の音がする。' },
  // 5: 星の塔
  shooting_boomerang: { ...W('boomerang', 8, 3), ...region(5), name: '流れ星のブーメラン', bonus: { agi: 6 }, desc: '流れ星のように光って飛ぶブーメラン。' },
  little_prince_cape: { ...A('cloth', 8, 3), ...region(5), name: '星の王子のマント', bonus: { hp: 15, mag: 5 }, resist: { sleep: 0.6 }, desc: '小さな星から来た王子のマント。大切なものは、目に見えない。' },
  milkyway_whip: { ...W('whip', 8, 2), ...region(5), name: '天の川のムチ', bonus: { mag: 4 }, desc: '天の川のように、星のつぶが光るムチ。' },

  // ═════ ひみつのダンジョンだけ（sd）═════
  // ★4（20階から）
  nyoibo: { ...W('spear', 5, 4), ...SD, name: 'にょいぼう', bonus: { str: 5 }, desc: 'のびたりちぢんだりする、サルの王さまの棒。' },
  glass_slipper: { ...C(5, 4), ...SD, name: 'ガラスのくつ', bonus: { agi: 12, heal: 4 }, desc: '12時になってもとけない、魔法のガラスのくつ。' },
  outlaw_hat: { ...H(5, 4), ...SD, name: '森の義ぞくのぼうし', bonus: { agi: 6 }, crit: 0.03, desc: '森にかくれる義ぞくの、羽根のついたぼうし。会心が出やすい。' },
  hermes_hat: { ...H(6, 4), ...SD, name: 'ヘルメスのぼうし', bonus: { agi: 12 }, desc: 'つばさのついた旅の神のぼうし。とても素早くなる。' },
  muramasa: { ...W('sword', 6, 4, 1.06), ...SD, name: 'よう刀むらまさ', bonus: { str: 8, def: -5 }, crit: 0.06, desc: 'ふしぎな力のやどる刀。とても強いが、身の守りが下がる。' },
  pegasus_clothes: { ...A('cloth', 6, 4), ...SD, name: 'ペガサスの服', bonus: { agi: 10 }, desc: '天馬の羽のように軽い服。だれでも装備できる。' },
  masamune: { ...W('sword', 7, 4), ...SD, name: '名刀まさむね', bonus: { agi: 5 }, crit: 0.05, desc: '名人が打った美しい刀。会心が出やすい。' },
  aegis_shield: { ...S(7, 4), ...SD, name: 'アイギスのたて', resist: { paralyze: 0.5, confuse: 0.5, sleep: 0.5 }, desc: '女神のたて。マヒ・混乱・ねむりにかかりにくい。' },
  moon_goddess_fan: { ...W('fan', 7, 4), ...SD, name: '月の女神のおうぎ', bonus: { mag: 8, heal: 8, agi: 5 }, desc: '月の光を集めたおうぎ。魔力と回復の力が上がる。' },
  kusanagi: { ...W('sword', 8, 4), ...SD, name: '草なぎの剣', bonus: { agi: 4 }, resist: { fire: 0.8 }, desc: '火の海をなぎはらったという、神の剣。炎に強くなる。' },
  thunder_hammer: { ...W('axe', 8, 4), ...SD, name: '雷神のつち', bonus: { str: 6 }, resist: { bolt: 0.7 }, desc: '雷の神のつち。投げると、かならず手もとにもどってくる。' },
  fenrir_claw: { ...W('claw', 8, 4), ...SD, name: 'フェンリルのツメ', bonus: { agi: 6 }, crit: 0.04, desc: '神々もおそれた大オオカミのツメ。会心が出やすい。' },
  philosopher_stone: { ...C(8, 4), ...SD, name: '賢者の石', bonus: { mag: 10, heal: 10 }, mpRegen: 3, desc: '何でも金に変えるという赤い石。行動するたびにMPが3回復する。' },
  // ★5（50階から。今の いちばん 強い 装備より 上）
  kinto_cloud: { ...C(8, 5), ...SD, name: 'きんと雲のかけら', bonus: { agi: 18, hp: 20 }, desc: '心のきれいな人だけが乗れる、金色の雲のかけら。' },
  heavenly_robe: { ...A('robe', 8, 5), ...SD, name: '天の羽衣', bonus: { mag: 14, heal: 14, agi: 6 }, resist: { sleep: 0.5, confuse: 0.5 }, desc: '天女の羽衣。魔力と回復の力が上がり、ねむりと混乱に強い。' },
  lake_holy_sword: { ...W('sword', 9, 5), ...SD, name: '湖の聖剣', bonus: { str: 6, hp: 20 }, resist: { dark: 0.7 }, desc: '湖のせいれいからさずかった王の剣。闇に強い。' },
  allfather_spear: { ...W('spear', 9, 5), ...SD, name: '主神のやり', bonus: { agi: 5 }, crit: 0.05, desc: '投げれば、かならず敵をつらぬく神のやり。会心が出やすい。' },
  god_dragon_mail: { ...A('heavy', 9, 5), ...SD, name: '神竜のよろい', bonus: { hp: 30 }, resist: { fire: 0.7, ice: 0.7, bolt: 0.8 }, desc: '神の竜のうろこのよろい。炎・氷・雷に強い。' },
  thunder_god_staff: { ...W('staff', 9, 5), ...SD, name: '大神のいかずちのつえ', bonus: { mag: 44, heal: 10 }, resist: { bolt: 0.7 }, mpRegen: 2, desc: '空の王の雷をやどすつえ。呪文の力がとても上がる。' },
  yata_mirror: { ...S(10, 5), ...SD, name: 'やたの鏡のたて', resist: { dark: 0.7, blind: 0.3, confuse: 0.5 }, desc: '光をはね返す、神の鏡のたて。闇とまどわしに強い。' },
  heaven_earth_sword: { ...W('sword', 10, 5), ...SD, name: '天地の神剣', bonus: { str: 8, agi: 6 }, crit: 0.04, desc: '天と地を分けたという、神の剣。' },
  rainbow_cape: { ...A('cloth', 10, 5), ...SD, name: '七色のマント', bonus: { agi: 10, mag: 10, hp: 20 }, resist: { fire: 0.85, ice: 0.85 }, desc: 'にじの七色にかがやくマント。だれでも装備できる。' },
  galaxy_bell: { ...C(10, 5), ...SD, name: '銀河のすず', bonus: { str: 10, agi: 15, mag: 10 }, crit: 0.03, mpRegen: 2, desc: '銀河のかなたから来た、ふしぎなすず。' },
};

// 店では 買えない（price 0）。売り値は ランクと レア度で
for (const it of Object.values(GEAR)) {
  it.price = 0;
  it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const RARE_GEAR = GEAR;

// 読みがな（あいうえお順）
export const RARE_GEAR_KANA = {
  rock_axe: 'いわくだきのおの', rockhill_shield: 'いわやまのたて', kintaro_axe: 'きんたろうのまさかり', gravity_gi: 'じゅうりょくのどうぎ',
  earth_helm: 'だいちのかぶと', kaname_charm: 'かなめいしのおまもり', mithril_mail: 'みすりるのよろい', titan_club: 'たいたんのこんぼう',
  haze_fan: 'かげろうのおうぎ', bewitch_whip: 'まどわしのむち', mirage_pierce: 'しんきろうのぴあす', foxfire_robe: 'きつねびのころも',
  tanuki_leaf: 'たぬきのはっぱ', mirage_sword: 'まぼろしのけん',
  cloud_staff: 'ひつじぐものつえ', lullaby_fan: 'こもりうたのおうぎ', sleeping_ribbon: 'ねむりひめのりぼん', dream_dagger: 'ゆめみのたんけん',
  baku_pillow: 'ばくのまくら', dream_robe: 'ゆめみのろーぶ',
  shinobi_knife: 'しのびのこがたな', spy_pen: 'すぱいのまんねんひつ', detective_cane: 'めいたんていのすてっき', shinobi_garb: 'しのびしょうぞく',
  magic_pocket: 'ふしぎなぽけっと', master_sakabatou: 'めいこうのさかばとう', shadow_knife: 'かげうちのこがたな',
  rune_staff: 'こだいもじのつえ', haniwa_shield: 'はにわのたて', levistone: 'ひこうせきのぺんだんと', explorer_whip: 'こうこがくしゃのむち',
  magatama: 'まがたまのくびかざり', lost_crown: 'うしなわれたおうこくのかんむり',
  icicle_dagger: 'つららのたんけん', snowkid_hood: 'ゆきんこのずきん', icicle_boomerang: 'つららのぶーめらん', polar_claw: 'しろくまのつめ',
  silver_coat: 'しろがねのこーと', snowqueen_shield: 'ゆきのじょおうのたて', winter_katana: 'ふゆしょうぐんのかたな', glacier_spear: 'ひょうがのやり',
  snowflower_brooch: 'ゆきのはなのぶろーち', aurora_staff: 'おーろらのつえ', white_dragon_mail: 'はくぎんりゅうのよろい',
  firebird_fan: 'ひのとりのおうぎ', salamander_scale: 'ひとかげのうろこ', lava_axe: 'ようがんのおの', magma_pan: 'まぐまのふらいぱん',
  redrock_mail: 'あかいわのよろい', fire_drake_spear: 'かりゅうのやり', flame_haori: 'ほのおのはおり', fireball_bat: 'ひのたまばっと',
  phoenix_plume: 'ふしちょうのはねかざり', kagutsuchi: 'かぐつちのけん', lavastone_ring: 'ようがんせきのゆびわ',
  treant_staff: 'ねじれぎのつえ', goldoon_fist: 'ごるどーんのこぶし', kraken_whip: 'くらーけんのむち', storm_general_helm: 'あらしのしょうぐんのかぶと',
  mammoth_fur: 'まんもすのけがわ', magma_hammer: 'ようがんのおおづち', flare_shield: 'ほのおのきしのたて', guardian_halberd: 'りゅうのばんにんのほこ',
  witch_broom: 'ほのおのまじょのほうき', witch_hat: 'まじょのくろいぼうし', scorpion_whip: 'さそりのしっぽむち', ankh_staff: 'あんくのつえ',
  traitor_dagger: 'うらぎりのたんけん', majin_scimitar: 'まじんのみかづきとう', whalebone_boomerang: 'くじらのほねのぶーめらん',
  seawitch_dress: 'うみのまじょのどれす', leviathan_shield: 'りゔぁいあさんのたて', hundred_eye_helm: 'ひゃくめのかぶと', old_fang_sword: 'こりゅうのきばのけん',
  gold_axe: 'きんのおの', fairy_fan: 'ようせいのはねのおうぎ', needle_sword: 'ぬいばりのけん', sea_trident: 'かいじんのほこ',
  mermaid_shield: 'にんぎょのたて', kappa_claw: 'かっぱのみずかきのつめ', dwarf_pick: 'どわーふのつるはし', yeti_club: 'いえてぃのこんぼう',
  aurora_robe: 'おーろらのろーぶ', magic_carpet: 'まほうのじゅうたんのまんと', thief_knife: 'よんじゅうにんのとうぞくのないふ', gold_abacus: 'おうごんのそろばん',
  shooting_boomerang: 'ながれぼしのぶーめらん', little_prince_cape: 'ほしのおうじのまんと', milkyway_whip: 'あまのがわのむち',
  nyoibo: 'にょいぼう', glass_slipper: 'がらすのくつ', outlaw_hat: 'もりのぎぞくのぼうし', hermes_hat: 'へるめすのぼうし', muramasa: 'ようとうむらまさ',
  pegasus_clothes: 'ぺがさすのふく', masamune: 'めいとうまさむね', aegis_shield: 'あいぎすのたて', moon_goddess_fan: 'つきのめがみのおうぎ',
  kusanagi: 'くさなぎのけん', thunder_hammer: 'らいじんのつち', fenrir_claw: 'ふぇんりるのつめ', philosopher_stone: 'けんじゃのいし',
  kinto_cloud: 'きんとうんのかけら', heavenly_robe: 'てんのはごろも', lake_holy_sword: 'みずうみのせいけん', allfather_spear: 'しゅしんのやり',
  god_dragon_mail: 'しんりゅうのよろい', thunder_god_staff: 'おおがみのいかずちのつえ', yata_mirror: 'やたのかがみのたて', heaven_earth_sword: 'てんちのしんけん',
  rainbow_cape: 'なないろのまんと', galaxy_bell: 'ぎんがのすず',
};

// ───── レア度を つける（items.js が ぜんぶ まぜた あと、きたえた 装備を 作る 前に よぶ）─────
const EQUIP_TYPES = ['weapon', 'armor', 'shield', 'head', 'acc'];
// ほかの 担当の 品の レア度（その 品が ある ときだけ。こうふくの靴は 宝の洞窟の 高い レア）
export const RARITY_OVERRIDE = { koufuku_kutsu: 4, shiawase_boushi: 3 };
// rarity が ない 装備の きまり: 店の 品 0・★の 品 2（ランク7から 3）・ボスの 品 3・ほかの 店で 買えない 品 1
export function defaultRarity(it) {
  if (it.star) return it.rank >= 7 ? 3 : 2;
  if (it.unique) return 3;
  if (!(it.price > 0)) return 1;
  return 0;
}
// 店で 買える 装備か（レア度 0。第35回: ★1で 固定・きたえられない）。きたえた 装備（+1〜）も もとの 装備と おなじ
export function isShopGear(it) {
  if (!it || !EQUIP_TYPES.includes(it.type)) return false;
  return Number.isInteger(it.rarity) ? it.rarity === 0 : (RARITY_OVERRIDE[it.base] ?? defaultRarity(it)) === 0;
}
// ★の 数（強さ。第35回）: 店の 品は 1。店では 買えない 品は ランクで 2〜5（ランク1〜4 ★2・5〜7 ★3・8 ★4・9〜10 ★5）
export const STARS_BY_RANK = [2, 2, 2, 2, 2, 3, 3, 3, 4, 5, 5];
export const STARS_MAX = 5;
export function starsFor(it) {
  if (!it || !EQUIP_TYPES.includes(it.type)) return 0;
  if (isShopGear(it)) return 1;
  const r = Math.max(1, Math.min(STARS_BY_RANK.length - 1, it.rank || 1));
  return STARS_BY_RANK[r];
}
export function assignRarity(table) {
  for (const [id, it] of Object.entries(table)) {
    if (!it || it.base || !EQUIP_TYPES.includes(it.type)) continue;
    if (RARITY_OVERRIDE[id] && it.rarity === undefined) it.rarity = RARITY_OVERRIDE[id];
    if (it.rarity === undefined) it.rarity = defaultRarity(it);
  }
  return table;
}
