// 第50回 D3: 景品の 品（カジノ・小さなメダル・星のかけら。data/prizes-r50.js の ならび。items.js で まぜる）
//
// ・強い装備: その段で 手に入る いちばん 強い 装備と おなじ くらい（店の 品より 少し 上・宝箱の ★4 と ならぶ）
//   カジノの 品は src: 'casino'（カジノの景品でしか手に入らない）。メダル・星のかけらの 品は src なし（店では買えない）
// ・見た目: prizeCat: 'look' の 服（見た目装備に ちょうど よい。絵は client/render/prize-looks.js）と 乗り物券（prizeRide）
// ・便利な道具:
//   jobBook … 使った 人の 今の 職業の 修行が n回 すすむ（戦いに n回 勝った ことに なる。職業レベルの 上限まで）
//   expBook … 次の レベルまでの 経験値の k ばい を もらう（魔物の 仲間にも 使える。レベルの 上限では 使えない）
//   しあわせのリボン … しあわせのぼうしと おなじ 力（perk: expHat。アクセサリー）
// ・魔物: prizeMonster … 使うと その 魔物が 仲間に なる（仲間が いっぱいなら 魔物あずかり所へ。world/prizes-r50.js）
// 使った ときの しょりは world/prizes-r50.js（world/services.js の useItem から よぶ）
const CASINO = { src: 'casino' };
const SELL_R = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const w = (cat, rank, rarity, atk, o = {}) => ({ type: 'weapon', cat, rank, rarity, atk, price: 0, ...o });
const a = (armorType, rank, rarity, def, o = {}) => ({ type: 'armor', armorType, rank, rarity, def, price: 0, ...o });
const sh = (rank, rarity, def, o = {}) => ({ type: 'shield', rank, rarity, def, price: 0, ...o });
const hd = (rank, rarity, def, o = {}) => ({ type: 'head', rank, rarity, def, price: 0, ...o });
const ac = (rank, rarity, o = {}) => ({ type: 'acc', rank, rarity, price: 0, ...o });
const LOOK = { prizeCat: 'look' };
// 使う 道具（フィールドで。戦いでは 使えない）
const book = (name, effect, desc) => ({ name, type: 'use', price: 0, sell: 0, target: 'ally', battle: false, field: true, effect, desc });
const ride = (vehicle, name, desc) => ({ name, type: 'use', price: 0, sell: 0, target: 'self', battle: false, field: true, effect: { type: 'prizeRide', vehicle }, desc });
const call = (species, name, desc) => ({ name, type: 'use', price: 0, sell: 0, target: 'self', battle: false, field: true, effect: { type: 'prizeMonster', species }, desc });

export const ITEMS_PRIZE_R50 = {
  // ───── 便利な 道具 ─────
  pz_job_book: book('修行の書', { type: 'jobBook', n: 5 }, '読むと、今の職業の修行が5回分すすむ。'),
  pz_job_book2: book('修行の大書', { type: 'jobBook', n: 15 }, '読むと、今の職業の修行が15回分すすむ。'),
  pz_job_book3: book('修行の秘伝書', { type: 'jobBook', n: 30 }, '読むと、今の職業の修行が30回分すすむ。'),
  pz_job_book4: book('伝説の修行書', { type: 'jobBook', n: 60 }, '読むと、今の職業の修行が60回分すすむ。'),
  pz_exp_book: book('経験の書', { type: 'expBook', k: 0.5 }, '読むと、次のレベルまでに必要な経験値の半分をもらえる。魔物の仲間にも使える。'),
  pz_exp_book2: book('経験の大書', { type: 'expBook', k: 1 }, '読むと、次のレベルまでに必要な経験値をもらえる。魔物の仲間にも使える。'),
  pz_exp_book3: book('経験の秘伝書', { type: 'expBook', k: 2 }, '読むと、次のレベルまでに必要な経験値の2倍をもらえる。魔物の仲間にも使える。'),
  pz_lucky_ribbon: ac(5, 3, { ...CASINO, name: 'しあわせのリボン', bonus: { agi: 3 }, perk: 'expHat', desc: 'むすぶとしあわせな気持ちになるリボン。つけた人は、戦いでもらえる経験値が2倍になる。でも、パーティーでいちばんレベルが高い人には効かない。' }),

  // ───── 乗り物券（使うと その 乗り物が もらえる。メニューの「乗り物」で 選べる）─────
  pz_ride_gold_bike: ride('gold_bicycle', '金色の自転車の乗り物券', '使うと、金色の自転車がもらえる。走る時に乗れる。'),
  pz_ride_gold_horse: ride('gold_mane_horse', '金のたてがみの馬の乗り物券', '使うと、金のたてがみの馬がもらえる。走る時に乗れる。'),
  pz_ride_gold_carpet: ride('gold_carpet', '金色のじゅうたんの乗り物券', '使うと、金色の空飛ぶじゅうたんがもらえる。走る時に乗れる。'),
  pz_ride_lucky_pegasus: ride('lucky_pegasus', '幸運の天馬の乗り物券', '使うと、幸運の天馬がもらえる。走る時に乗れる。'),
  pz_ride_gold_car: ride('gold_open_car', '黄金のオープンカーの乗り物券', '使うと、黄金のオープンカーがもらえる。走る時に乗れる。'),
  pz_ride_galaxy_bike: ride('galaxy_bicycle', '銀河の自転車の乗り物券', '使うと、銀河の自転車がもらえる。走る時に乗れる。'),
  pz_ride_galaxy_pegasus: ride('galaxy_pegasus', '銀河の天馬の乗り物券', '使うと、銀河の天馬がもらえる。走る時に乗れる。'),
  pz_ride_rainbow_carpet: ride('rainbow_carpet', 'にじ色のじゅうたんの乗り物券', '使うと、にじ色の空飛ぶじゅうたんがもらえる。走る時に乗れる。'),
  pz_ride_medal_carpet: ride('medal_carpet', 'メダル王のじゅうたんの乗り物券', '使うと、メダル王のじゅうたんがもらえる。走る時に乗れる。'),
  pz_ride_star_bike: ride('star_bicycle', '星のかけらの自転車の乗り物券', '使うと、星のかけらの自転車がもらえる。走る時に乗れる。'),
  pz_ride_comet_cloud: ride('comet_cloud', 'ほうき星の雲の乗り物券', '使うと、ほうき星の雲がもらえる。走る時に乗れる。'),

  // ───── めずらしい 魔物（よびぶえ）─────
  pz_call_coin_rabbit: call('coin_rabbit', 'コインうさぎのよびぶえ', 'ふくと、コインうさぎがやってきて仲間になる。仲間がいっぱいの時は、魔物あずかり所へ行く。'),
  pz_call_roulette_slime: call('roulette_slime', 'ルーレットぷるりんのよびぶえ', 'ふくと、ルーレットぷるりんがやってきて仲間になる。仲間がいっぱいの時は、魔物あずかり所へ行く。'),
  pz_call_joker_devil: call('joker_devil', 'ジョーカーデビルのよびぶえ', 'ふくと、ジョーカーデビルがやってきて仲間になる。仲間がいっぱいの時は、魔物あずかり所へ行く。'),
  pz_call_medal_king: call('medal_king', 'メダルキングのよびぶえ', 'ふくと、メダルキングがやってきて仲間になる。仲間がいっぱいの時は、魔物あずかり所へ行く。'),
  pz_call_star_pegasus: call('star_pegasus', '星くずペガサスのよびぶえ', 'ふくと、星くずペガサスがやってきて仲間になる。仲間がいっぱいの時は、魔物あずかり所へ行く。'),
  pz_call_gold_dragon: call('gold_dragon', 'ゴールドドラゴンのよびぶえ', 'ふくと、ゴールドドラゴンがやってきて仲間になる。仲間がいっぱいの時は、魔物あずかり所へ行く。'),

  // ───── カジノの 景品: 装備・おしゃれ着 ─────
  // はじめから（第1・2章の 店は 銀の剣 30・雷の剣 38）
  pz_seven_sword: w('sword', 4, 2, 38, { ...CASINO, name: 'ラッキーセブンの剣', bonus: { agi: 3 }, crit: 0.02, desc: 'つかに7の数字がきざまれた剣。会心が出やすい。' }),
  pz_tuxedo: a('cloth', 3, 2, 14, { ...CASINO, ...LOOK, name: 'カジノのタキシード', bonus: { agi: 2 }, desc: 'カジノのお客さんのための、黒いタキシード。だれでも装備できる。見た目装備にもぴったり。' }),
  // 第2章クリア（第3章の 店は はがねの剣 40・流星の剣 50）
  pz_roulette_spear: w('spear', 5, 3, 47, { ...CASINO, name: 'ルーレットのやり', bonus: { agi: 4 }, desc: '赤と黒にぬり分けられたやり。くるくる回すと、素早くなる。' }),
  pz_stardust_dress: a('cloth', 5, 3, 26, { ...CASINO, ...LOOK, name: '星くずのドレス', bonus: { mag: 4 }, desc: '星くずをちりばめた青いドレス。だれでも装備できる。見た目装備にもぴったり。' }),
  // 第3章クリア（第4章の 店は プラチナソード 61・王家の黄金の剣 64）
  pz_ace_sword: w('sword', 7, 3, 66, { ...CASINO, name: 'スペードのエースの剣', bonus: { str: 4 }, desc: 'いちばん強いカードの名前をもつ剣。' }),
  pz_diamond_mail: a('heavy', 7, 3, 58, { ...CASINO, name: 'ダイヤのよろい', resist: { ice: 0.85 }, desc: 'ダイヤのもようがかがやくよろい。氷に少し強い。' }),
  // 第4章クリア（第5章の はじめの 店は 光の剣 72・星読みの剣 78）
  pz_club_axe: w('axe', 8, 4, 88, { ...CASINO, name: 'クラブのキングのオノ', bonus: { str: 4 }, desc: 'クラブのキングがかかげる、大きなオノ。' }),
  pz_jewel_tiara: hd(8, 4, 18, { ...CASINO, name: 'ほうせきのティアラ', bonus: { mag: 6, agi: 4 }, desc: '色とりどりのほうせきがならんだティアラ。だれでも装備できる。' }),
  // 星の番人の あと（あかつきの剣 85・大地の剣 121 の あいだ）
  pz_fivecard_sword: w('sword', 9, 4, 100, { ...CASINO, name: 'ファイブカードの剣', bonus: { str: 5, agi: 5 }, desc: '5まいのカードがそろった、まぼろしの手の剣。' }),
  pz_night_tux: a('cloth', 9, 4, 50, { ...CASINO, ...LOOK, name: '夜会のタキシード', bonus: { agi: 6, mag: 4 }, resist: { sleep: 0.7 }, desc: '星の夜のパーティーで着る、白いタキシード。だれでも装備できる。ねむりにくい。' }),
  // 第1部クリア（影の城の剣 142・夜明けの星の剣 150）
  pz_triple7_sword: w('sword', 10, 4, 141, { ...CASINO, name: 'スリーセブンの大剣', bonus: { str: 6 }, crit: 0.03, desc: '7が3つならんだ大当たりの大剣。会心が出やすい。' }),
  pz_goldstar_mail: a('heavy', 10, 4, 124, { ...CASINO, name: 'ゴールドスターのよろい', bonus: { hp: 20 }, resist: { dark: 0.85 }, desc: '金の星がかがやくよろい。闇に少し強い。' }),
  pz_dealer_ring: ac(10, 5, { ...CASINO, name: '名ディーラーの指輪', bonus: { agi: 12, mag: 12 }, mpRegen: 2, desc: '伝説のディーラーの指輪。行動するたびにMPが2回復する。' }),
  // 第6章（1）（時のいせきの剣 152・サソリのツメ 128）
  pz_time_claw: w('claw', 10, 4, 138, { ...CASINO, name: '時のルーレットのツメ', bonus: { agi: 8 }, crit: 0.03, desc: '時計のはりのような、金色のツメ。会心が出やすい。' }),
  pz_gear_shield: sh(10, 4, 82, { ...CASINO, name: '歯車ルーレットのたて', resist: { fire: 0.85, ice: 0.85 }, desc: '大きな歯車がゆっくり回るたて。炎と氷に少し強い。' }),
  // 第6章（2）（みちしるべのやり 144・時計塔のローブ 98）
  pz_comet_spear: w('spear', 10, 4, 150, { ...CASINO, name: 'ほうき星のやり', bonus: { agi: 6, hp: 10 }, desc: '光のしっぽを引く、ほうき星のようなやり。' }),
  pz_night_dress: a('cloth', 10, 4, 88, { ...CASINO, ...LOOK, name: '星空のパーティードレス', bonus: { mag: 10, mp: 10 }, desc: '夜空の色に、星のししゅうをしたドレス。だれでも装備できる。見た目装備にもぴったり。' }),
  // 第6章（3）（時計塔の剣 167・時計塔のよろい 149）
  pz_king_clock_sword: w('sword', 10, 5, 172, { ...CASINO, name: '時のカジノ王の剣', bonus: { str: 8, agi: 8 }, crit: 0.04, desc: '時計の文字ばんをかたどった、金と赤の剣。会心が出やすい。' }),
  pz_clock_mail: a('heavy', 10, 5, 154, { ...CASINO, name: '時計じかけの金のよろい', bonus: { hp: 30 }, resist: { fire: 0.85, bolt: 0.85 }, desc: '小さな歯車がたくさんついた金のよろい。炎と雷に少し強い。' }),
  pz_casino_crown: hd(10, 5, 42, { ...CASINO, name: 'カジノ王のかんむり', bonus: { str: 8, agi: 8, mag: 8, hp: 20 }, desc: 'カジノの王さまだけがかぶれる、金のかんむり。だれでも装備できる。' }),

  // ───── 小さなメダルの ごほうび ─────
  pz_medal_mantle: a('cloth', 8, 3, 42, { ...LOOK, name: 'メダル王のマント', bonus: { hp: 15 }, desc: 'メダル王とおそろいの、むらさきのマント。だれでも装備できる。' }),
  pz_medal_shield: sh(9, 4, 50, { name: 'メダル王のたて', resist: { bolt: 0.85 }, desc: '大きな金のメダルの形のたて。雷に少し強い。' }),
  pz_medal_sword: w('sword', 10, 4, 140, { name: 'メダル王の剣', bonus: { str: 6, agi: 4 }, desc: 'メダル王がわかいころに使っていた剣。' }),
  pz_medal_gold_crown: hd(10, 4, 38, { name: 'メダル王の金のかんむり', bonus: { str: 5, agi: 5, mag: 5, heal: 5 }, desc: 'メダル王の、とっておきのかんむり。だれでも装備できる。' }),
  pz_medal_armor: a('heavy', 10, 5, 152, { name: 'メダル王のよろい', bonus: { hp: 25 }, resist: { dark: 0.85, light: 0.85 }, desc: '小さなメダルを100まい集めた人だけがもらえる、金のよろい。光と闇に少し強い。' }),

  // ───── 星のかけらの こうかん ─────
  pz_star_cape: a('cloth', 5, 3, 24, { ...LOOK, name: '星くずのマント', bonus: { mp: 6 }, desc: '星のかけらをぬいつけた、こん色のマント。だれでも装備できる。' }),
  pz_star_boomerang: w('boomerang', 7, 3, 42, { name: '星のかけらのブーメラン', bonus: { agi: 4 }, desc: '星のかけらでできたブーメラン。敵みんなに当たる。' }),
  pz_star_mail: a('heavy', 10, 4, 92, { name: '星座のよろい', bonus: { hp: 15 }, resist: { light: 0.85 }, desc: '星座のもようがうかぶよろい。光に少し強い。' }),
  pz_star_robe: a('robe', 10, 4, 92, { name: '星のしずくのローブ', bonus: { mag: 10, heal: 6 }, desc: '星のしずくでそめたローブ。呪文の力が上がる。' }),
  pz_milky_sword: w('sword', 10, 4, 162, { name: '天の川の剣', bonus: { agi: 6, mag: 6 }, desc: '天の川の光をとじこめた剣。' }),
  pz_star_crown: hd(10, 5, 46, { name: '星の王のかんむり', bonus: { mp: 15, mag: 6 }, desc: '星の光でできたかんむり。だれでも装備できる。' }),
};
// 売り値（ランクと レア度で。店では 買えない）
for (const it of Object.values(ITEMS_PRIZE_R50)) {
  if (it.rarity === undefined) continue;
  it.sell = Math.round(SELL_R[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const PRIZE_R50_KANA = {
  pz_job_book: 'しゅぎょうのしょ', pz_job_book2: 'しゅぎょうのたいしょ', pz_job_book3: 'しゅぎょうのひでんしょ', pz_job_book4: 'でんせつのしゅぎょうしょ',
  pz_exp_book: 'けいけんのしょ', pz_exp_book2: 'けいけんのたいしょ', pz_exp_book3: 'けいけんのひでんしょ',
  pz_ride_gold_bike: 'きんいろのじてんしゃののりものけん', pz_ride_gold_horse: 'きんのたてがみのうまののりものけん',
  pz_ride_gold_carpet: 'きんいろのじゅうたんののりものけん', pz_ride_lucky_pegasus: 'こううんのてんまののりものけん',
  pz_ride_gold_car: 'おうごんのおーぷんかーののりものけん', pz_ride_galaxy_bike: 'ぎんがのじてんしゃののりものけん',
  pz_ride_galaxy_pegasus: 'ぎんがのてんまののりものけん', pz_ride_rainbow_carpet: 'にじいろのじゅうたんののりものけん',
  pz_ride_medal_carpet: 'めだるおうのじゅうたんののりものけん', pz_ride_star_bike: 'ほしのかけらのじてんしゃののりものけん',
  pz_ride_comet_cloud: 'ほうきぼしのくもののりものけん',
  pz_call_star_pegasus: 'ほしくずぺがさすのよびぶえ',
  pz_seven_sword: 'らっきーせぶんのけん', pz_tuxedo: 'かじののたきしーど', pz_roulette_spear: 'るーれっとのやり',
  pz_stardust_dress: 'ほしくずのどれす', pz_ace_sword: 'すぺーどのえーすのけん', pz_diamond_mail: 'だいやのよろい',
  pz_club_axe: 'くらぶのきんぐのおの', pz_fivecard_sword: 'ふぁいぶかーどのけん', pz_night_tux: 'やかいのたきしーど',
  pz_triple7_sword: 'すりーせぶんのたいけん', pz_dealer_ring: 'めいでぃーらーのゆびわ', pz_time_claw: 'ときのるーれっとのつめ',
  pz_gear_shield: 'はぐるまるーれっとのたて', pz_comet_spear: 'ほうきぼしのやり', pz_night_dress: 'ほしぞらのぱーてぃーどれす',
  pz_king_clock_sword: 'ときのかじのおうのけん', pz_clock_mail: 'とけいじかけのきんのよろい', pz_casino_crown: 'かじのおうのかんむり',
  pz_medal_mantle: 'めだるおうのまんと', pz_medal_shield: 'めだるおうのたて', pz_medal_sword: 'めだるおうのけん',
  pz_medal_gold_crown: 'めだるおうのきんのかんむり', pz_medal_armor: 'めだるおうのよろい',
  pz_star_cape: 'ほしくずのまんと', pz_star_boomerang: 'ほしのかけらのぶーめらん', pz_star_mail: 'せいざのよろい',
  pz_star_robe: 'ほしのしずくのろーぶ', pz_milky_sword: 'あまのがわのけん', pz_star_crown: 'ほしのおうのかんむり',
};
