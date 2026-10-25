// 乗り物（第37回 C）
//
// ・ルミナの町の 乗り物屋で ゴールドで 買う。1度 買えば ずっと 持っている（char.vehicles）
// ・メニューの「乗り物」で 持っている 乗り物から 1つ えらぶ（char.vehicle。「乗らない」は null）
// ・走っている 時だけ、その 乗り物に 乗った 絵に なる。歩く・止まると いつもの 絵。速さは 同じ（絵だけ）
// ・乗っている 間は 仲間・馬車・ついてくる 魔物の 絵は 出さない（みんなで 乗っている あつかい）
// ・船・大鳥・竜・トロッコに 乗っている 時は そちらが 先（乗り物の 絵に しない）
// ・マルチプレイ: ひとりずつ 自分の 乗り物。ほかの 人には いちの じょうほう（snap の vh）で とどく
//
// たなに 出る 物:
//   jobs が ない 物（ふつうの 乗り物）… いつでも
//   jobs が ある 物（職業に ちなんだ 乗り物）… その 職業の どれかに 1度でも なった 人だけ
//   （かくれた 職業の ネタバレを さけるため。もう 持っている 物は いつでも 出る）
// 絵は client/render/vehicle-art.js（4方向・2〜3コマ）

// id: { name, price, jobs?, desc }
export const VEHICLES = {
  // ───── ふつうの 乗り物（いつでも 売っている） ─────
  kickboard: { name: 'キックボード', price: 150, desc: '足でけって進む、小さな板。' },
  unicycle: { name: '一輪車', price: 200, desc: '車輪が1つだけ。うまく乗れたら、ちょっとじまん。' },
  bicycle: { name: '自転車', price: 400, desc: 'ベルのついた、青い自転車。' },
  horse: { name: '茶色の馬', price: 1200, desc: 'よく走る、元気な馬。' },
  carpet: { name: '空飛ぶじゅうたん', price: 5000, desc: '地面の少し上を、ふわりと飛ぶじゅうたん。' },

  // ───── 職業に ちなんだ 乗り物（その 職業に 1度でも なった 人だけ） ─────
  armor_horse: { name: 'よろい馬', price: 2400, jobs: ['warrior', 'battlemaster', 'sword_master'], desc: '鉄のよろいを着た、たくましい馬。' },
  cloud: { name: '黄色い雲', price: 2800, jobs: ['monk', 'holyfist', 'god_hand'], desc: '心のきれいな人だけが乗れる、ふわふわの雲。' },
  pegasus: { name: '天馬', price: 4000, jobs: ['priest', 'paladin', 'high_priest'], desc: '白いつばさのある、聖なる馬。' },
  // 第41回 B: 雪の女王・第5のせいれい（水の せいれいの 馬）
  water_horse: { name: '水の馬', price: 6000, jobs: ['snow_queen', 'fifth_spirit'], desc: '水でできた、すきとおった馬。走るたびに、しぶきが光る。' },
  book: { name: '空飛ぶ本', price: 2600, jobs: ['mage', 'sage', 'archmage', 'daikenja'], desc: '大きな呪文の本。開くと空にうかぶ。' },
  big_ball: { name: '大玉', price: 900, jobs: ['performer'], desc: 'サーカスの大玉。玉の上で、上手に走る。' },
  pogo: { name: 'ホッピング', price: 600, jobs: ['jester'], desc: 'ぴょんぴょんはねる、ばねの乗り物。' },
  taxi: { name: 'タクシー', price: 1800, jobs: ['salaryman', 'bucho'], desc: '会社にいそぐ時の、黄色いタクシー。' },
  limo: { name: '黒い高級車', price: 6000, jobs: ['shacho', 'tatakiage', 'career'], desc: 'ぴかぴかの、長い黒い車。' },
  open_car: { name: 'オープンカー', price: 3500, jobs: ['idol', 'superstar', 'fruit_idol', 'storm_idol'], desc: 'やねのない、ピンクの車。ファンに手をふろう。' },
  trolley: { name: 'トロッコ', price: 1000, jobs: ['railman'], desc: '線路の仕事で使う、手こぎのトロッコ。' },
  red_train: { name: '赤い電車', price: 4500, jobs: ['train_driver', 'keikyu_driver', 'keikyu_president'], desc: '赤い車体に白い線の、速い電車。' },
  relief_car: { name: 'リリーフカー', price: 2200, jobs: ['ballplayer', 'major_leaguer', 'nitoryu', 'hall_of_fame'], desc: '野球場で、ピッチャーを運ぶ小さな車。' },
  tricycle: { name: '三輪車', price: 500, jobs: ['schoolkid', 'middleschooler', 'highschooler', 'homeroom_3b'], desc: 'なつかしい、赤い三輪車。' },
  town_bus: { name: '町のバス', price: 2500, jobs: ['civil_local', 'civil_national', 'career'], desc: '町の人を乗せて走る、小さなバス。' },
  police_bike: { name: '白バイ', price: 3000, jobs: ['police'], desc: '赤いランプの、白いオートバイ。' },
  fire_truck: { name: '消防車', price: 3800, jobs: ['firefighter'], desc: 'はしごをつんだ、赤い消防車。' },
  food_cart: { name: '屋台', price: 1600, jobs: ['cook', 'patissier', 'star_chef'], desc: 'のれんのかかった、車輪つきの屋台。' },
  delivery_bike: { name: '出前バイク', price: 1400, jobs: ['parttimer', 'seishain', 'tatakiage'], desc: 'うしろに、出前の箱をつんだバイク。' },
  roll_chair: { name: 'キャスターつきのいす', price: 300, jobs: ['neet'], desc: '部屋から出なくても、どこへでも行ける…？' },
  dark_wings: { name: '闇のつばさ', price: 3300, jobs: ['chuuni', 'datenshi'], desc: '黒い羽がまう、闇のつばさ。' },
  bukujutsu: { name: 'ぶくう術', price: 4000, jobs: ['saiyan', 'super_saiyan', 'ss2', 'ss3'], desc: '気をまとって、空を飛ぶ術。' },
  drone: { name: '大きなドローン', price: 2400, jobs: ['youtuber', 'streamer', 'creator'], desc: 'カメラつきの、人を乗せて飛ぶドローン。' },
  kart: { name: 'レーシングカート', price: 2000, jobs: ['gamer', 'pro_gamer'], desc: 'ゲームの中から出てきたような、みどりのカート。' },
  mamachari: { name: 'ママチャリ', price: 700, jobs: ['okan', 'saikyo_okan'], desc: '前のかごに、ネギが入った自転車。' },
  spy_car: { name: '黒いスポーツカー', price: 4200, jobs: ['spy', 'assassin', 'black_org'], desc: 'ひくくて速い、なぞの黒い車。' },
  skateboard: { name: 'ターボつきスケボー', price: 1500, jobs: ['shonen_tantei', 'oshiri_tantei', 'meitantei'], desc: 'うしろからけむりが出る、速いスケボー。' },
  propeller: { name: '竹とんぼプロペラ', price: 2000, jobs: ['neko_robot', 'mimi_robot', 'doraemon'], desc: '頭につけると、空を飛べるプロペラ。' },
  lotus: { name: 'ハスの葉', price: 1200, jobs: ['kappa', 'hanakappa', 'kinniku_kappa'], desc: '水の上でも、地面の上でもすべる大きな葉。' },
  sakura_dash: { name: '桜の風', price: 2600, jobs: ['rurouni', 'hitokiri', 'himura', 'hiten'], desc: '桜の花びらをまきあげて、風のように走る。' },
  glider: { name: '白いハンググライダー', price: 3600, jobs: ['magician', 'kaito', 'kaito_kid'], desc: '月夜ににあう、白いつばさ。' },
  rock_cart: { name: 'れん成の石車', price: 2400, jobs: ['alchemist', 'state_alchemist', 'fullmetal'], desc: '地面の石をれん成して作った車。' },
  baby_dragon: { name: '子どもの竜', price: 5000, jobs: ['magic_knight', 'dragon_knight', 'magic_swordsman', 'ryumajin'], desc: 'せなかに乗せてくれる、みどりの竜の子。' },
  pirate_cart: { name: '車輪つきの海賊船', price: 3000, jobs: ['pirate', 'guardian'], desc: '陸の上でも走れる、小さな海賊船。' },
  gomu_rocket: { name: 'ゴムのロケット', price: 4000, jobs: ['rubber', 'nika'], desc: 'うでをのばして、びよーんと前へとぶ。' },
  ninja_dash: { name: '忍び走り', price: 2800, jobs: ['ninja', 'konoha', 'hokage'], desc: 'うでを後ろにのばして、風より速く走る。' },
  slime: { name: '大きなぷるりん', price: 1800, jobs: ['tamer', 'monster_master'], desc: 'なかよしになった、大きなぷるりん。' },
  shooting_star: { name: 'ほうき星', price: 4400, jobs: ['fortune', 'summoner', 'star_diva'], desc: '光のしっぽを引いて飛ぶ、小さな星。' },
  white_horse: { name: '白馬', price: 5000, jobs: ['samurai', 'shogun', 'abarenbo_shogun'], desc: '町を走る上様の、白い馬。' },
  swan_boat: { name: 'スワンボート', price: 1500, jobs: ['comedian', 'm1_champion'], desc: 'こいで進む、白鳥の形のボート。陸でも走る。' },
  kei_truck: { name: '軽トラ', price: 2600, jobs: ['setsubiya', 'ryonetsu', 'facility_genius'], desc: 'にだいに、はしごとエアコンの外の機械をつんだ軽トラ。' },
  commuter_train: { name: '満員電車', price: 2000, jobs: ['shachiku', 'black_star'], desc: '朝の電車。中はぎゅうぎゅう…。' },
  flying_card: { name: '空飛ぶカード', price: 3000, jobs: ['rakuten_cardman'], desc: '大きな赤いカード。ポイントでうかぶ…？' },
  steam_train: { name: '蒸気機関車', price: 6500, jobs: ['kisatsu', 'enbashira', 'hinokami'], desc: 'けむりを上げて走る、黒い機関車。' },
  psy_float: { name: '念力ふわり', price: 3000, jobs: ['esper'], desc: '念力で、自分の体をうかせる。' },
  broom: { name: '空飛ぶほうき', price: 2800, jobs: ['wizard_student', 'harry'], desc: '魔法学校の生徒の、空飛ぶほうき。' },
  crescent: { name: '三日月', price: 4800, jobs: ['sailor_soldier', 'sailor_moon', 'neo_queen'], desc: '月の光でできた、三日月の乗り物。' },
  hero_pegasus: { name: '勇者の天馬', price: 8000, jobs: ['hero', 'loto_hero'], desc: '金のよろいの、勇者だけの天馬。' },
  dark_throne: { name: '空飛ぶ玉座', price: 9000, jobs: ['maou', 'hakaishin'], desc: '魔物の王がすわる、空にうかぶいす。' },
};

// 第39回 C: たのまれごとで しか もらえない 乗り物（data/vehicles-family.js）
import { FAMILY_VEHICLES } from './vehicles-family.js?v=0c8f643f1d08'; Object.assign(VEHICLES, FAMILY_VEHICLES);
export const VEHICLE_ORDER = Object.keys(VEHICLES);
const has = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(VEHICLES, id);
export const vehicleKnown = has;

// 乗り物屋
export const VEHICLE_SHOP = {
  name: 'ルミナの乗り物屋', keeper: '乗り物屋のハヤテ',
  hello: 'いらっしゃい！ここは乗り物屋だよ。\n走る時に乗れる乗り物を売ってるんだ。\n乗っても速さは同じだけど、気分は最高さ！',
};

// その 人が 1度でも なった 職業（今の 職業も）
export function jobsEver(c) {
  const out = new Set();
  if (c?.job) out.add(c.job);
  if (c?.jobs && typeof c.jobs === 'object') for (const k of Object.keys(c.jobs)) out.add(k);
  return out;
}

// たなに 出す 乗り物（ID の ならび）。もう 持っている 物も 出す
export function vehicleShelf(c) {
  const ever = jobsEver(c);
  const own = new Set(ownedVehicles(c));
  return VEHICLE_ORDER.filter((id) => {
    const v = VEHICLES[id];
    return !v.jobs || own.has(id) || v.jobs.some((j) => ever.has(j));
  });
}

// 持っている 乗り物（知っている 物だけ。ならびは VEHICLE_ORDER）
export function ownedVehicles(c) {
  const list = Array.isArray(c?.vehicles) ? c.vehicles : [];
  return VEHICLE_ORDER.filter((id) => list.includes(id));
}

// えらんでいる 乗り物（持っていない・知らない 物は null）
export function chosenVehicle(c) {
  const v = c?.vehicle;
  return has(v) && Array.isArray(c.vehicles) && c.vehicles.includes(v) ? v : null;
}

// セーブを 読む ときの 手直し（何回 よんでも おなじ。新しい 項目なので 版は 上げない）
//   ・vehicles は 文字の ならび（かさならない）。知らない 乗り物も けさずに とっておく（あとの 版で 知っている 物に なる かも）
//   ・vehicle は 持っている 物か null
export function cleanVehicles(c) {
  if (!c || typeof c !== 'object' || c.species) return c;
  const list = Array.isArray(c.vehicles) ? c.vehicles.filter((x) => typeof x === 'string' && x.length <= 40) : [];
  c.vehicles = [...new Set(list)];
  if (typeof c.vehicle !== 'string' || !c.vehicles.includes(c.vehicle)) c.vehicle = null;
  return c;
}

// 買う（たなに ある・まだ 持っていない・ゴールドが たりる）。{ ok, text }
export function buyVehicle(c, id) {
  if (!has(id)) return { ok: false, text: 'その乗り物はありません' };
  if (!vehicleShelf(c).includes(id)) return { ok: false, text: 'その乗り物はありません' };
  cleanVehicles(c);
  const v = VEHICLES[id];
  if (c.vehicles.includes(id)) return { ok: false, text: `${v.name}は、もう持っているよ。` };
  if ((c.gold || 0) < v.price) return { ok: false, text: 'おや？ゴールドが足りないみたいだね。' };
  c.gold -= v.price;
  c.vehicles.push(id);
  return { ok: true, text: `${v.name}を買った！` };
}

// えらぶ（null … 乗らない）。{ ok, text }
export function chooseVehicle(c, id) {
  cleanVehicles(c);
  if (id === null || id === undefined || id === '') {
    const was = c.vehicle;
    c.vehicle = null;
    return { ok: true, text: was ? '乗り物に乗らないことにした。' : '今は乗り物に乗っていない。' };
  }
  if (!has(id) || !c.vehicles.includes(id)) return { ok: false, text: 'その乗り物は持っていない' };
  c.vehicle = id;
  return { ok: true, text: `${VEHICLES[id].name}に乗ることにした！\n（走ると乗る）` };
}

// 今 乗り物の 絵に するか（client/field.js の 自分・ほかの 人）
//   vehicle … えらんでいる 乗り物、running … 走っている（動いている）、
//   ship・air・cart・hidden … 船・大鳥や竜・トロッコ・かくれている（そちらが 先）
export function rideShown(vehicle, { running = false, ship = false, air = false, cart = false, hidden = false } = {}) {
  if (!has(vehicle) || !running || ship || air || cart || hidden) return null;
  return vehicle;
}
