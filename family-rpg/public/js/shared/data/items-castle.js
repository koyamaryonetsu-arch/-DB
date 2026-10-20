// 第5章 Step 8「影の城」の 品（B8: 品。items.js で まぜる。A8 が 宝箱で 使う）
// 名前の 約束（docs/plan-ch5.md の 17）: CASTLE_TREASURE（影の城の 各階の 宝箱の 中み。{ 1: [...], … 12: [...] }。1階が 下、12階が 上）
//
// ・★の きまり（家族:「★5が MAX。★5の 中で 強いのを 今後 出していく。強さの 上限なし」・17「影の城の 宝・ボスの 品は ★5（ランク10）」）:
//   ぜんぶ ランク10（テストの きまりで ランクは 10まで）＝★5。めずらしさは 名前の 色（レア度 4＝オレンジ）
//   「あとの 品ほど 強い」は 強さの かけ算（k）で: 1階 1.10 → 12階 1.27（大地の神殿 8階の 大地の剣 1.08 より 上）。
//   まぼろしの 品（アクセサリー）は あとの まぼろしほど ボーナスが 多い（みんなが くれる 王家の守りのお守りと おなじ くらいまで）。いちばん 強いのは ソリトゥスの 品（B9）
// ・まぼろしの 品（src: 'phantom'）: たおすと かならず 1つ（monsters-phantom.js の drops.boss）。それぞれの まぼろしに ちなむ
// ・素材: 黒い風の羽（風の階）・影火の石（炎の階）・黒しんじゅ（水の階）。れん金（CASTLE_RECIPES）で ★5 を もっと 強い ★5 に
// 強さの めやす（items-earth.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const RAR = 4;
const W = (cat, k) => ({ type: 'weapon', cat, rank: R, rarity: RAR, atk: Math.round(SWORD[R] * CAT_K[cat] * RAR_K[RAR] * k) });
const A = (armorType, k) => ({ type: 'armor', armorType, rank: R, rarity: RAR, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[RAR] * k) });
const S = (k) => ({ type: 'shield', rank: R, rarity: RAR, def: Math.round(CLOTH[R] * RAR_K[RAR] * k) });
const H = (helm, k) => ({ type: 'head', rank: R, rarity: RAR, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[RAR] * k) });
const C = () => ({ type: 'acc', rank: R, rarity: RAR });
// 階ごとの 強さの かけ算（深い＝上の 階ほど 大きい）
export const CASTLE_K = { 1: 1.1, 2: 1.11, 3: 1.13, 4: 1.15, 5: 1.16, 6: 1.18, 7: 1.19, 8: 1.21, 9: 1.22, 10: 1.24, 11: 1.25, 12: 1.27 };
const K = CASTLE_K;

// ───── 素材（影の城の 魔物が 落とす。れん金で 使う）─────
const MATS = {
  cs_wind_feather: { name: '黒い風の羽', type: 'mat', price: 0, sell: 60, desc: '影の城の風の階でとれる、黒い羽。ふくと、つむじ風がおきる。' },
  cs_ember_stone: { name: '影火の石', type: 'mat', price: 0, sell: 60, desc: '影の城の炎の階でとれる、むらさきの火がゆれる石。さわってもあつくない。' },
  cs_black_pearl: { name: '黒しんじゅ', type: 'mat', price: 0, sell: 65, desc: '影の城の水の階でとれる、黒く光るしんじゅ。のぞくと、自分のすがたがうつる。' },
};

// ───── 影の城の 宝箱（そこだけの 品。ぜんぶ ランク10 ＝★5・オレンジ）─────
const CASTLE = { src: 'castle' };
const TREASURE = {
  // 1階（風の階の 入口）
  cs_vane_bangle: { ...C(), ...CASTLE, name: '風見のうでわ', bonus: { agi: 12, hp: 30, def: 6 }, resist: { wind: 0.7 }, desc: '風見どりの形をした、銀のうでわ。だれでも装備でき、素早さとHPが上がり、風に強い。' },
  // 2階（風車）
  cs_mill_axe: { ...W('axe', K[2]), ...CASTLE, name: '風車のはねのオノ', bonus: { str: 8, agi: -2 }, resist: { wind: 0.85 }, desc: '風車のはねのように大きなオノ。ふると、風がうなる。風に少し強い。' },
  cs_whirl_boomerang: { ...W('boomerang', K[2]), ...CASTLE, name: '旋風のブーメラン', bonus: { agi: 6 }, desc: 'つむじ風にのって、ぐるりと飛ぶブーメラン。敵全体に当たる。' },
  // 3階（風の流れ）
  cs_storm_mantle: { ...A('cloth', K[3]), ...CASTLE, name: 'あらしの羽のマント', bonus: { agi: 10, hp: 20 }, resist: { wind: 0.7, bolt: 0.85 }, desc: '黒い風の羽をあんだマント。だれでも装備でき、風と雷に強い。' },
  cs_weasel_claw: { ...W('claw', K[3]), ...CASTLE, name: 'かまいたちのツメ', bonus: { agi: 8 }, crit: 0.04, desc: '風のやいばのように、するどいツメ。会心が出やすい。' },
  // 4階（風の ふういんの とびら）
  cs_gale_helm: { ...H(true, K[4]), ...CASTLE, name: '天風のかぶと', bonus: { hp: 24 }, resist: { wind: 0.7, blind: 0.6 }, desc: '空の風のかざりのついたかぶと。風に強く、まぼろしにかかりにくい。戦士などが装備できる。' },
  cs_sky_boots: { ...C(), ...CASTLE, name: '空かけるくつ', bonus: { agi: 18, str: 4 }, resist: { wind: 0.8 }, desc: '風にのって、空をかけるようなくつ。だれでも装備でき、素早さがとても上がる。' },
  // 5階（炎の階の 入口）
  cs_flame_shield: { ...S(K[5]), ...CASTLE, name: '炎よけのたて', bonus: { hp: 20 }, resist: { fire: 0.7 }, desc: '炎をはじく、赤い金のたて。炎に強い。' },
  // 6階（炎の柱）
  cs_blackfire_dagger: { ...W('dagger', K[6]), ...CASTLE, name: '黒炎の短剣', bonus: { agi: 10 }, resist: { fire: 0.85 }, onHit: { status: 'blind', chance: 0.12 }, desc: '黒い炎がゆらめく短剣。ときどき敵にまぼろしを見せる。炎に少し強い。' },
  cs_phoenix_fan: { ...W('fan', K[6]), ...CASTLE, name: '不死鳥のおうぎ', bonus: { agi: 14, mag: 10 }, resist: { fire: 0.8 }, desc: '不死鳥の羽でできたおうぎ。炎に強い。' },
  // 7階（氷の像）
  cs_ember_gi: { ...A('gi', K[7]), ...CASTLE, name: 'ほむらの道着', bonus: { agi: 14, str: 6 }, resist: { fire: 0.8, ice: 0.85 }, desc: 'ほのおのもようの道着。とても動きやすく、炎と氷に強い。' },
  cs_candle_staff: { ...W('staff', K[7]), ...CASTLE, name: 'ともしびのつえ', bonus: { mag: 50, heal: 30 }, mpRegen: 1, resist: { dark: 0.85 }, desc: '先にやさしい火がともるつえ。行動するたびに、MPが少し回復する。闇に少し強い。' },
  // 8階（炎の ふういんの とびら）
  cs_blackfire_mail: { ...A('heavy', K[8]), ...CASTLE, name: '黒炎のよろい', bonus: { hp: 36, agi: -2 }, resist: { fire: 0.7, dark: 0.85 }, desc: '黒い炎をとじこめた、重いよろい。炎に強く、闇に少し強い。' },
  cs_phoenix_ring: { ...C(), ...CASTLE, name: '火の鳥の指輪', bonus: { hp: 40, mag: 10, str: 6 }, resist: { fire: 0.6, ice: 0.8 }, desc: '火の鳥の羽をとじこめた指輪。だれでも装備でき、HPが上がり、炎と氷に強い。' },
  // 9階（水の階の 入口）
  cs_mirror_shield: { ...S(K[9]), ...CASTLE, name: '水鏡のたて', bonus: { hp: 24, mag: 6 }, resist: { ice: 0.75, bolt: 0.85 }, desc: '水鏡のように、すがたをうつすたて。氷に強く、雷に少し強い。' },
  // 10階（水の高さ）
  cs_tide_spear: { ...W('spear', K[10]), ...CASTLE, name: '水かげのやり', bonus: { agi: 8, str: 6 }, resist: { ice: 0.85 }, desc: '水の中の影のように、すっとのびるやり。氷に少し強い。' },
  cs_ripple_whip: { ...W('whip', K[10]), ...CASTLE, name: 'さざなみのムチ', bonus: { agi: 6 }, onHit: { status: 'sleep', chance: 0.12 }, desc: 'さざなみのようにしなるムチ。ときどき敵をねむらせる。' },
  // 11階（流れる 床）
  cs_pearl_robe: { ...A('robe', K[11]), ...CASTLE, name: '黒しんじゅのローブ', bonus: { mag: 18, heal: 18 }, resist: { ice: 0.8, sleep: 0.6 }, desc: '黒しんじゅをぬいつけたローブ。魔力が上がり、氷に強く、ねむりにくい。' },
  cs_tide_crown: { ...H(false, K[11]), ...CASTLE, name: '水の王のかんむり', bonus: { hp: 24, mag: 10, agi: 6 }, resist: { confuse: 0.5, ice: 0.85 }, desc: '水の国の王がかぶっていたかんむり。だれでも装備でき、混乱に強い。' },
  // 12階（水の ふういんの とびら。てっぺんへの 階だんの 前）
  cs_castle_sword: { ...W('sword', K[12]), ...CASTLE, name: '影の城の剣', bonus: { str: 10, agi: 6 }, resist: { dark: 0.75, wind: 0.85 }, desc: '影の城のいちばん上の宝箱にねむっていた剣。闇に強く、風に少し強い。' },
  cs_wave_bat: { ...W('bat', K[12]), ...CASTLE, name: '大波のバット', bonus: { str: 6, agi: 3 }, crit: 0.05, desc: '大波のように、ずしんとひびくバット。会心が出やすい。' },
};

// ───── 3人の まぼろしの 品（かならず 1つ。1人 1つの アクセサリー〈unique・レア度3〉。monsters-phantom.js の drops.boss）─────
//   src: 'phantom'（「まぼろしからしか手に入らない」）。ふつうの ボスの 品（src: 'boss'。第32回の きまり … レア度2・とくせい 1つ・店と おなじ 強さ）より 強い ★5
const BOSS = {
  // ストルムのまぼろし: 嵐の 将軍の うでわの まぼろし（1人 1つの アクセサリー）
  ph_storm_bangle: {
    ...C(), rarity: 3, src: 'phantom', boss: 'phantom_storm', unique: true, name: '嵐のまぼろしのうでわ', bonus: { agi: 14, hp: 36, str: 8, def: 6 }, resist: { wind: 0.6, bolt: 0.8 },
    desc: 'ストルムのまぼろしが消えたあとにのこった、嵐のうでわ。だれでも装備でき、素早さとHPと力が上がり、風と雷に強い。',
  },
  // イグニアのまぼろし: 炎の 魔女の イヤリングの まぼろし
  ph_ignia_earring: {
    ...C(), rarity: 3, src: 'phantom', boss: 'phantom_ignia', unique: true, name: '炎のまぼろしのイヤリング', bonus: { mag: 18, hp: 36, agi: 8, heal: 8 }, mpRegen: 1, resist: { fire: 0.6 },
    desc: 'イグニアのまぼろしが消えたあとにのこった、炎のイヤリング。だれでも装備でき、魔力とHPが上がり、炎に強い。行動するたびにMPが少し回復する。',
  },
  // モルガナのまぼろし: 水鏡の 魔人の ペンダントの まぼろし
  ph_morgana_pendant: {
    ...C(), rarity: 3, src: 'phantom', boss: 'phantom_morgana', unique: true, name: '水鏡のまぼろしのペンダント', bonus: { hp: 46, mag: 14, def: 12, agi: 10 }, resist: { ice: 0.7, fire: 0.8, confuse: 0.6 },
    desc: 'モルガナのまぼろしが消えたあとにのこった、水鏡のペンダント。だれでも装備でき、HP・魔力・守り・素早さが上がり、氷と炎に強く、混乱しにくい。',
  },
};

// ───── れん金でしか 作れない 品（★5 → もっと 強い ★5。data/alchemy.js の CASTLE_RECIPES）─────
const ALCH = {
  cs_alch_sword: { ...W('sword', 1.22), src: 'alchemy', name: 'あけぼのの大地の剣', bonus: { str: 10, agi: 6 }, resist: { wind: 0.8, fire: 0.8, blast: 0.85 }, desc: '大地の剣に、黒い風の羽と影火の石の力をこめた剣。風と炎に強く、爆発に少し強い。' },
  cs_alch_mail: { ...A('heavy', 1.2), src: 'alchemy', name: '影火の岩ばんよろい', bonus: { hp: 40, agi: -2 }, resist: { fire: 0.7, blast: 0.8, bolt: 0.85 }, desc: '岩ばんのよろいを、影火の石できたえなおしたよろい。炎と爆発に強く、雷に少し強い。' },
  cs_alch_crown: { ...H(false, 1.2), src: 'alchemy', name: '黒しんじゅのかんむり', bonus: { hp: 26, mag: 12, agi: 6 }, resist: { confuse: 0.5, sleep: 0.5, ice: 0.85 }, desc: '大地のかんむりに、黒しんじゅをちりばめたかんむり。だれでも装備でき、混乱とねむりに強い。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(ALCH)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_CASTLE = { ...MATS, ...TREASURE, ...BOSS, ...ALCH };

// 影の城の 各階の 宝箱の 中み（1階が 下、12階が 上。A8 が 宝箱で 使う）
export const CASTLE_TREASURE = {
  1: ['cs_vane_bangle'],
  2: ['cs_mill_axe', 'cs_whirl_boomerang'],
  3: ['cs_storm_mantle', 'cs_weasel_claw'],
  4: ['cs_gale_helm', 'cs_sky_boots'],
  5: ['cs_flame_shield'],
  6: ['cs_blackfire_dagger', 'cs_phoenix_fan'],
  7: ['cs_ember_gi', 'cs_candle_staff'],
  8: ['cs_blackfire_mail', 'cs_phoenix_ring'],
  9: ['cs_mirror_shield'],
  10: ['cs_tide_spear', 'cs_ripple_whip'],
  11: ['cs_pearl_robe', 'cs_tide_crown'],
  12: ['cs_castle_sword', 'cs_wave_bat'],
};

// 3人の まぼろしが かならず 落とす 品（まぼろしの ID → 品の ID）
export const PHANTOM_DROPS = { phantom_storm: 'ph_storm_bangle', phantom_ignia: 'ph_ignia_earring', phantom_morgana: 'ph_morgana_pendant' };

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 5 … 第5章）。★5（大地の神殿の 宝箱）＋ 影の城の 素材 → もっと 強い ★5
export const CASTLE_RECIPES = [
  { id: 'r_castle_dawn_sword', tier: 5, out: 'cs_alch_sword', ins: ['et_earth_sword', 'cs_wind_feather', 'cs_ember_stone'] },
  { id: 'r_castle_ember_mail', tier: 5, out: 'cs_alch_mail', ins: ['et_bedrock_mail', 'cs_ember_stone', 'cs_ember_stone'] },
  { id: 'r_castle_pearl_crown', tier: 5, out: 'cs_alch_crown', ins: ['et_earth_crown', 'cs_black_pearl', 'cs_black_pearl'] },
];

// 読みがな（あいうえお順の ならびかえ）
export const CASTLE_ITEM_KANA = {
  cs_wind_feather: 'くろいかぜのはね', cs_ember_stone: 'かげびのいし', cs_black_pearl: 'くろしんじゅ',
  cs_vane_bangle: 'かざみのうでわ', cs_mill_axe: 'ふうしゃのはねのおの', cs_whirl_boomerang: 'せんぷうのぶーめらん', cs_storm_mantle: 'あらしのはねのまんと',
  cs_weasel_claw: 'かまいたちのつめ', cs_gale_helm: 'てんぷうのかぶと', cs_sky_boots: 'そらかけるくつ', cs_flame_shield: 'ほのおよけのたて',
  cs_blackfire_dagger: 'こくえんのたんけん', cs_phoenix_fan: 'ふしちょうのおうぎ', cs_ember_gi: 'ほむらのどうぎ', cs_candle_staff: 'ともしびのつえ',
  cs_blackfire_mail: 'こくえんのよろい', cs_phoenix_ring: 'ひのとりのゆびわ', cs_mirror_shield: 'みずかがみのたて', cs_tide_spear: 'みずかげのやり',
  cs_ripple_whip: 'さざなみのむち', cs_pearl_robe: 'くろしんじゅのろーぶ', cs_tide_crown: 'みずのおうのかんむり', cs_castle_sword: 'かげのしろのけん',
  cs_wave_bat: 'おおなみのばっと',
  ph_storm_bangle: 'あらしのまぼろしのうでわ', ph_ignia_earring: 'ほのおのまぼろしのいやりんぐ', ph_morgana_pendant: 'みずかがみのまぼろしのぺんだんと',
  cs_alch_sword: 'あけぼののだいちのけん', cs_alch_mail: 'かげびのがんばんよろい', cs_alch_crown: 'くろしんじゅのかんむり',
};
