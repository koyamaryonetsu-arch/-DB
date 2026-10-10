// どうぐ・そうびの データ
// type: use(つかう どうぐ) weapon armor shield head acc key(だいじなもの)
// weapon.cat: sword dagger axe staff spear claw fan whip bat boomerang
//   ムチは ふつうの 攻撃で 敵1グループ、ブーメランは 敵全体（2体め からは 少し 弱く なる。shared/battle.js の WEAPON_REACH）
// armor.armorType: cloth(だれでも) heavy(戦士) robe(僧侶/魔法使い/旅芸人) gi(武闘家/戦士/旅芸人)
// head.helm: true だと 戦士だけ
// rank: 装備の ランク（1〜10。下の EQUIP_RANKS）。star: 店では 買えない 1つ上の 品（宝箱・レアドロップ）
// unique: 1人 1つの 品（ボスが 落とす 物）。データを 合わせる ときに ふえすぎない

import { ITEMS_CH2 } from './items-ch2.js?v=b13027e590f9';
import { ITEMS_TM } from './items-tm.js?v=b13027e590f9';
import { NIGHT_ITEMS, NIGHT_ITEM_KANA } from './night.js?v=b13027e590f9';
import { SKY_ITEMS, SKY_ITEM_KANA } from './sky.js?v=b13027e590f9';
import { ITEMS_FORGE, FORGE_KANA, addUpgradeItems } from './items-forge.js?v=b13027e590f9';
import { ITEMS_CASINO, CASINO_KANA } from './items-casino.js?v=b13027e590f9';
import { RARE_ITEMS, RARE_ITEM_KANA } from './monsters-rare.js?v=b13027e590f9';
import { ESCAPE_ITEMS, ESCAPE_KANA } from './escape.js?v=b13027e590f9';
import { ITEMS_CH3, CH3_ITEM_KANA } from './items-ch3.js?v=b13027e590f9';
import { ITEMS_CH4, CH4_ITEM_KANA } from './items-ch4.js?v=b13027e590f9';
import { ITEMS_TEMPLE, TEMPLE_ITEM_KANA } from './items-temple.js?v=b13027e590f9';

export const ITEMS = {
  // ───── つかう どうぐ ─────
  herb: {
    name: '薬草', type: 'use', price: 8, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [30, 40], fixed: true },
    desc: 'HPを35ほど回復する薬草。',
  },
  antidote: {
    name: '毒消し草', type: 'use', price: 10, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['poison'] },
    desc: '毒を消す草。',
  },
  moonherb: {
    name: '満月草', type: 'use', price: 25, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['paralyze', 'sleep', 'confuse'] },
    desc: 'マヒ・ねむり・混乱を治す不思議な草。',
  },
  magic_water: {
    name: '魔法の聖水', type: 'use', price: 0, sell: 75, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [20, 28] },
    desc: 'MPを25ほど回復する。とても貴重。',
  },
  holy_water: {
    name: '聖水', type: 'use', price: 20, target: 'self', battle: false, field: true,
    effect: { type: 'repel', seconds: 120 },
    desc: 'しばらくの間、弱いモンスターが寄ってこなくなる。',
  },
  return_wing: {
    name: '帰り道の羽', type: 'use', price: 25, target: 'self', battle: false, field: true,
    effect: { type: 'warp' },
    desc: '一度行った町や村へひとっ飛びでもどれる羽。',
  },
  smoke_ball: {
    name: 'けむり玉', type: 'use', price: 30, target: 'self', battle: true, field: false,
    effect: { type: 'escape' },
    desc: '戦いから必ず逃げられる。ボスには効かない。',
  },
  revive_flower: {
    name: 'よみがえりの花', type: 'use', price: 0, sell: 200, target: 'deadAlly', battle: true, field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '死んでしまった仲間を生き返らせる不思議な花。',
  },
  jelly: {
    name: 'ぷるりんゼリー', type: 'use', price: 0, sell: 6, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [10, 14], fixed: true },
    desc: 'ぷるりんが落とすぷるぷるのゼリー。少しHPが回復する。',
  },
  star_shard: {
    name: '星のかけら', type: 'use', price: 0, sell: 0, target: 'self', battle: false, field: false,
    desc: 'きらきら光る星のかけら。ルミナの町の「星集めのおばあさん」が集めている。',
  },
  seed_str: {
    name: '力の種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'str', amount: [1, 2] }, desc: '食べると力が少し上がる。',
  },
  seed_def: {
    name: '守りの種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'def', amount: [1, 2] }, desc: '食べると身の守りが少し上がる。',
  },
  seed_agi: {
    name: '素早さの種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'agi', amount: [1, 2] }, desc: '食べると素早さが少し上がる。',
  },
  seed_mag: {
    name: 'かしこさの種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'mag', amount: [1, 2] }, desc: '食べると魔力が少し上がる。',
  },
  seed_hp: {
    name: '命の木の実', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'hp', amount: [3, 5] }, desc: '食べると最大HPが上がる。',
  },

  // ───── ぶき ─────
  wood_sword: { name: '木の剣', type: 'weapon', rank: 1, cat: 'sword', atk: 6, price: 30, desc: '木でできたけいこ用の剣。' },
  bronze_sword: { name: '銅の剣', type: 'weapon', rank: 2, cat: 'sword', atk: 12, price: 110, desc: '銅でできた剣。' },
  iron_sword: { name: '鉄の剣', type: 'weapon', rank: 3, cat: 'sword', atk: 20, price: 420, desc: 'じょうぶな鉄の剣。' },
  stardust_sword: { name: '星くずの剣', type: 'weapon', rank: 3, star: true, cat: 'sword', atk: 27, bonus: { agi: 4 }, price: 0, sell: 600, desc: '星の光を宿した剣。軽くて素早くふれる。' },
  stone_axe: { name: '石のオノ', type: 'weapon', rank: 2, cat: 'axe', atk: 15, price: 160, desc: '重たい石のオノ。' },
  iron_axe: { name: '鉄のオノ', type: 'weapon', rank: 3, cat: 'axe', atk: 25, bonus: { agi: -3 }, price: 520, desc: '威力はあるが少し重い。' },
  bronze_knife: { name: '銅のナイフ', type: 'weapon', rank: 1, cat: 'dagger', atk: 8, price: 60, desc: '軽いナイフ。' },
  poison_knife: { name: '毒のナイフ', type: 'weapon', rank: 2, cat: 'dagger', atk: 12, price: 300, onHit: { status: 'poison', chance: 0.25 }, desc: '時々敵を毒にするナイフ。' },
  oak_staff: { name: 'かしのつえ', type: 'weapon', rank: 1, cat: 'staff', atk: 5, bonus: { mag: 4, heal: 4 }, price: 45, desc: '魔力を高める木のつえ。' },
  wizard_staff: { name: '魔道士のつえ', type: 'weapon', rank: 3, cat: 'staff', atk: 9, bonus: { mag: 10 }, price: 340, desc: '攻撃呪文の威力が上がるつえ。' },
  healing_staff: { name: 'いやしのつえ', type: 'weapon', rank: 3, cat: 'staff', atk: 8, bonus: { heal: 12 }, price: 340, desc: '回復呪文の効き目が上がるつえ。' },
  bronze_spear: { name: '銅のやり', type: 'weapon', rank: 2, cat: 'spear', atk: 12, price: 120, desc: '銅でできたやり。' },
  iron_spear: { name: '鉄のやり', type: 'weapon', rank: 3, cat: 'spear', atk: 19, price: 400, desc: '鉄のやり。' },
  bronze_knuckle: { name: 'ブロンズナックル', type: 'weapon', rank: 2, cat: 'claw', atk: 10, price: 90, desc: 'こぶしにはめる銅の武器。' },
  iron_claw: { name: '鉄のツメ', type: 'weapon', rank: 3, cat: 'claw', atk: 18, bonus: { agi: 2 }, price: 380, desc: 'するどい鉄のツメ。' },
  leather_whip: { name: '皮のムチ', type: 'weapon', rank: 2, cat: 'whip', atk: 10, price: 180, desc: 'しなやかな皮のムチ。魔物使いや旅芸人が使う。' },
  thorn_whip: { name: '茨のムチ', type: 'weapon', rank: 3, cat: 'whip', atk: 18, price: 460, desc: 'トゲの付いたムチ。' },
  flame_whip: { name: '炎のムチ', type: 'weapon', rank: 3, star: true, cat: 'whip', atk: 22, bonus: { mag: 4 }, price: 0, sell: 520, desc: '炎をまとったムチ。ランプの精がごくまれに持っている。' },
  feather_fan: { name: '羽のおうぎ', type: 'weapon', rank: 1, cat: 'fan', atk: 7, bonus: { agi: 3 }, price: 70, desc: '軽い羽のおうぎ。' },
  dancer_fan: { name: 'おどり子のおうぎ', type: 'weapon', rank: 3, cat: 'fan', atk: 14, bonus: { agi: 5 }, price: 360, desc: 'おどり子が使う美しいおうぎ。' },
  // 新しい 職業の ぶき
  harisen: { name: 'ハリセン', type: 'weapon', rank: 1, cat: 'fan', atk: 5, bonus: { agi: 2 }, price: 40, desc: '紙でできたおうぎ。たたくといい音がする。遊び人のあいぼう。' },
  signal_flag: { name: '手旗', type: 'weapon', rank: 1, cat: 'fan', atk: 6, bonus: { def: 2 }, price: 50, desc: '合図に使う旗。鉄道員のあいぼう。' },
  ballpen: { name: 'ボールペン', type: 'weapon', rank: 1, cat: 'dagger', atk: 6, bonus: { mag: 2 }, price: 30, desc: '会社員には、なくてはならない道具。ペンは剣よりも強し？' },
  penlight: { name: 'ペンライト', type: 'weapon', rank: 2, cat: 'staff', atk: 7, bonus: { heal: 5, agi: 2 }, price: 160, desc: 'キラキラ光るライト。ふると仲間が元気になる。' },
  wood_bat: { name: '木のバット', type: 'weapon', rank: 1, cat: 'bat', atk: 8, price: 60, desc: '木でできたバット。よくしなる。' },
  bamboo_bat: { name: '竹のバット', type: 'weapon', rank: 2, cat: 'bat', atk: 13, price: 170, desc: '竹を何まいも重ねたバット。軽くてふりやすい。' },
  metal_bat: { name: '金属バット', type: 'weapon', rank: 3, cat: 'bat', atk: 19, price: 380, desc: 'カキーンといい音がするバット。' },
  legend_bat: { name: 'ホームランバット', type: 'weapon', rank: 4, cat: 'bat', atk: 31, bonus: { agi: 3 }, price: 1300, desc: '海の男たちが使う、よく飛ぶバット。当たれば場外ホームラン！' },
  katana: { name: '刀', type: 'weapon', rank: 3, cat: 'sword', atk: 24, bonus: { agi: 2 }, price: 760, desc: 'よく切れる刀。サムライのたましい。' },
  // 料理・仕事・お笑いの 職業の ぶき（2026年10月）
  kitchen_knife: { name: '包丁', type: 'weapon', rank: 1, cat: 'dagger', atk: 9, bonus: { heal: 2 }, price: 80, desc: 'よく切れる包丁。料理人のあいぼう。' },
  ladle: { name: 'おたま', type: 'weapon', rank: 1, cat: 'staff', atk: 5, bonus: { heal: 5 }, price: 50, desc: 'スープをすくうおたま。料理人の大切な道具。' },
  mop: { name: 'モップ', type: 'weapon', rank: 1, cat: 'staff', atk: 6, bonus: { agi: 2 }, price: 40, desc: 'ゆかをぴかぴかにするモップ。アルバイトのあいぼう。' },
  frying_pan: { name: 'フライパン', type: 'weapon', rank: 2, cat: 'axe', atk: 15, bonus: { def: 2 }, price: 220, desc: 'ふりまわすと「カーン！」といい音がするフライパン。' },
  deck_brush: { name: 'デッキブラシ', type: 'weapon', rank: 3, cat: 'staff', atk: 11, bonus: { agi: 3, def: 2 }, price: 400, desc: '長い手の付いた、じょうぶなブラシ。' },
  whisk: { name: 'あわだて器', type: 'weapon', rank: 3, cat: 'fan', atk: 15, bonus: { agi: 4, heal: 4 }, price: 480, desc: 'クリームをあわだてる道具。パティシエのあいぼう。' },
  center_mic: { name: 'センターマイク', type: 'weapon', rank: 3, cat: 'staff', atk: 11, bonus: { mag: 6, agi: 2 }, price: 450, desc: 'まんざいのまん中に立つマイク。お笑い芸人のあいぼう。' },
  chinese_wok: { name: '中華なべ', type: 'weapon', rank: 4, cat: 'axe', atk: 30, bonus: { def: 4 }, price: 1400, desc: '大きな鉄のなべ。重いが、たてにもなる。' },
  gold_mic: { name: '金のマイク', type: 'weapon', rank: 5, cat: 'staff', atk: 16, bonus: { mag: 14, agi: 4 }, price: 2400, desc: '金色にかがやくマイク。話すとみんなが聞き入る。' },
  chef_knife: { name: '三ツ星の包丁', type: 'weapon', rank: 6, cat: 'dagger', atk: 36, bonus: { agi: 3, heal: 8 }, price: 3600, desc: '世界一のシェフが使う包丁。金色の手もとがかがやく。' },
  // ニート・ユーチューバー・ゲーマー・サイヤ人・中二病・設備屋・ゴム人間などの 道具（2026年10月 第21回）
  pillow: { name: 'まくら', type: 'weapon', rank: 1, cat: 'fan', atk: 4, bonus: { heal: 3, hp: 5 }, price: 30, desc: 'ふかふかのまくら。投げてよし、ねてよし。ニートのあいぼう。' },
  selfie_stick: { name: '自どり棒', type: 'weapon', rank: 1, cat: 'staff', atk: 6, bonus: { mag: 2 }, price: 60, desc: 'スマホをつけてのばす棒。ユーチューバーのあいぼう。' },
  game_controller: { name: 'ゲームのコントローラー', type: 'weapon', rank: 1, cat: 'boomerang', atk: 4, bonus: { agi: 3 }, price: 100, desc: 'コードの付いたコントローラー。ふり回して投げると、敵全体に当たる。ゲーマーのあいぼう。' },
  battle_suit: { name: 'サイヤ人の戦闘服', type: 'armor', rank: 1, armorType: 'gi', def: 6, bonus: { agi: 1 }, price: 120, desc: 'かたの部分がじょうぶな、よくのびる戦闘服。サイヤ人の正装。' },
  chuuni_bokken: { name: 'ふう印の木刀', type: 'weapon', rank: 2, cat: 'sword', atk: 13, bonus: { mag: 4 }, price: 260, desc: 'ふう印の紙と包帯をまいた木刀。本人いわく、やみの力がふう印されている。' },
  monkey_wrench: { name: 'モンキーレンチ', type: 'weapon', rank: 3, cat: 'axe', atk: 22, bonus: { def: 2 }, price: 520, desc: 'ねじの大きさに合わせて口が開く、仕事道具のレンチ。' },
  gaming_keyboard: { name: 'ゲーミングキーボード', type: 'weapon', rank: 4, cat: 'axe', atk: 28, bonus: { agi: 5 }, price: 1300, desc: 'にじ色に光るキーボード。ふり回すと、キーが飛び散る。' },
  gold_button: { name: '金の記念たて', type: 'shield', rank: 5, def: 18, bonus: { mag: 4, heal: 4 }, price: 1800, desc: '登録者100万人の記念にもらった、金色にかがやくたて。' },
  straw_hat: { name: '麦わらぼうし', type: 'head', rank: 4, def: 6, bonus: { agi: 3, hp: 10 }, price: 600, desc: '赤いリボンの麦わらぼうし。かぶると、なぜか元気がわいてくる。だれでも装備できる。' },
  pipe_wrench: { name: 'パイプレンチ', type: 'weapon', rank: 6, cat: 'axe', atk: 54, bonus: { def: 4 }, price: 3800, desc: '太い配管もがっちりつかむ、赤い大きなレンチ。' },
  dark_feather_staff: { name: '黒い羽根のつえ', type: 'weapon', rank: 6, cat: 'staff', atk: 17, bonus: { mag: 24, agi: 3 }, price: 3400, desc: '黒い羽根とむらさきの宝石のつえ。呪文の力が大きく上がる。' },
  // おかん・最強のおかんの 道具（2026年10月 第22回）
  slipper: { name: 'スリッパ', type: 'weapon', rank: 4, cat: 'fan', atk: 22, bonus: { agi: 4, heal: 2 }, price: 850, desc: 'おかんのピンクのスリッパ。はたくと、スパーンといい音がする。' },
  leopard_shirt: { name: 'ヒョウがらの服', type: 'armor', rank: 5, armorType: 'cloth', def: 21, bonus: { agi: 3, hp: 15 }, price: 1600, desc: 'ヒョウがらの、はでな服。着ると、なぜか強気になれる。' },
  // ブーメラン（ふつうの 攻撃で 敵全体に 当たる。何体にも 当たる ぶん、同じ ランクの 剣より 攻撃力は 低い）
  wood_boomerang: { name: '木のブーメラン', type: 'weapon', rank: 1, cat: 'boomerang', atk: 5, price: 120, upMat: 'wind_feather', desc: '投げると敵全体に当たって、手もとにもどってくる木のブーメラン。' },
  iron_boomerang: { name: '鉄のブーメラン', type: 'weapon', rank: 3, cat: 'boomerang', atk: 13, price: 620, desc: '重みのある鉄のブーメラン。敵全体をなぎはらって、もどってくる。' },
  silver_boomerang: { name: '銀のブーメラン', type: 'weapon', rank: 4, cat: 'boomerang', atk: 19, price: 1250, desc: '銀でつくった、よく飛ぶブーメラン。' },
  // はがねの ブーメランは 第3章の 店で 売る（店の 品ぞろえは 第3章で 足す）
  steel_boomerang: { name: 'はがねのブーメラン', type: 'weapon', rank: 5, cat: 'boomerang', atk: 26, price: 2500, desc: 'はがねをきたえた、するどいブーメラン。' },
  gale_boomerang: { name: 'はやてのブーメラン', type: 'weapon', rank: 4, star: true, cat: 'boomerang', atk: 24, bonus: { agi: 4 }, price: 0, sell: 820, upMat: 'wind_feather', desc: '風をまとって飛ぶブーメラン。ストームバードがごくまれに持っている。' },

  // ───── よろい・ふく ─────
  cloth: { name: '布の服', type: 'armor', rank: 1, armorType: 'cloth', def: 4, price: 10, desc: 'ふつうの布の服。' },
  suit: { name: 'スーツ', type: 'armor', rank: 2, armorType: 'cloth', def: 9, bonus: { def: 2 }, price: 260, desc: 'びしっと決まるスーツ。着ると仕事ができそうに見える。' },
  travel_clothes: { name: '旅人の服', type: 'armor', rank: 1, armorType: 'cloth', def: 7, price: 70, desc: '旅に向いたじょうぶな服。' },
  leather_armor: { name: '皮のよろい', type: 'armor', rank: 2, armorType: 'cloth', def: 11, price: 190, desc: 'なめし革のよろい。' },
  wind_clothes: { name: '風の服', type: 'armor', rank: 2, star: true, armorType: 'cloth', def: 10, bonus: { agi: 8 }, price: 0, sell: 300, desc: '風のように身軽に動ける服。' },
  chain_mail: { name: 'くさりかたびら', type: 'armor', rank: 2, armorType: 'heavy', def: 16, price: 280, desc: 'くさりを編んだよろい。' },
  iron_armor: { name: '鉄のよろい', type: 'armor', rank: 3, armorType: 'heavy', def: 23, bonus: { agi: -2 }, price: 560, desc: 'じょうぶな鉄のよろい。' },
  wizard_robe: { name: '魔道士のローブ', type: 'armor', rank: 2, armorType: 'robe', def: 8, bonus: { mag: 4 }, price: 130, desc: '魔力を高めるローブ。' },
  holy_robe: { name: '聖なるローブ', type: 'armor', rank: 3, armorType: 'robe', def: 12, bonus: { heal: 6 }, price: 360, desc: 'いやしの力が宿るローブ。' },
  martial_gi: { name: '武道着', type: 'armor', rank: 2, armorType: 'gi', def: 9, bonus: { agi: 2 }, price: 150, desc: '動きやすい武闘家の服。' },
  dragon_gi: { name: '竜の道着', type: 'armor', rank: 3, armorType: 'gi', def: 15, bonus: { agi: 4 }, price: 480, desc: '竜のししゅうがある道着。' },
  star_mail: { name: '星のよろい', type: 'armor', rank: 3, star: true, armorType: 'cloth', def: 18, bonus: { agi: 3, mag: 3 }, price: 0, sell: 700, desc: '星の布を織りこんだ不思議なよろい。だれでも装備できる。' },

  // ───── たて ─────
  leather_shield: { name: '皮のたて', type: 'shield', rank: 1, def: 4, price: 50, desc: '皮でできたたて。' },
  briefcase: { name: 'ビジネスバッグ', type: 'shield', rank: 1, def: 5, price: 90, desc: '書類でいっぱいのがんじょうなかばん。たてにもなる。' },
  scale_shield: { name: 'うろこのたて', type: 'shield', rank: 2, def: 8, price: 190, desc: '魔物のうろこのたて。' },
  iron_shield: { name: '鉄のたて', type: 'shield', rank: 3, def: 12, price: 400, desc: '鉄のたて。' },

  // ───── かぶと・ぼうし ─────
  leather_hat: { name: '皮のぼうし', type: 'head', rank: 1, def: 2, price: 30, desc: '皮のぼうし。' },
  bb_helmet: { name: 'ヘルメット', type: 'head', rank: 2, helm: true, def: 5, price: 150, desc: '頭を守るじょうぶなヘルメット。野球選手や鉄道員にも。' },
  pointy_hat: { name: 'とんがりぼうし', type: 'head', rank: 2, def: 4, bonus: { mag: 3 }, price: 150, desc: '魔法使いに人気のぼうし。' },
  bandana: { name: 'バンダナ', type: 'head', rank: 2, def: 3, bonus: { agi: 2 }, price: 80, desc: '頭に巻く布。' },
  iron_helm: { name: '鉄かぶと', type: 'head', rank: 3, helm: true, def: 7, price: 300, desc: '鉄のかぶと。戦士だけが装備できる。' },

  // ───── アクセサリー ─────
  power_ring: { name: '力の指輪', type: 'acc', rank: 2, bonus: { str: 5 }, price: 0, sell: 150, desc: '力が5上がる指輪。' },
  guard_ring: { name: '守りの指輪', type: 'acc', rank: 2, bonus: { def: 6 }, price: 0, sell: 150, desc: '身の守りが6上がる指輪。' },
  swift_ring: { name: 'はやてのリング', type: 'acc', rank: 3, bonus: { agi: 10 }, price: 0, sell: 300, desc: '素早さが10上がる。行動の順番が早く来る！' },
  star_charm: { name: '星のお守り', type: 'acc', rank: 2, bonus: { hp: 10, mp: 5 }, resist: { sleep: 0.5, poison: 0.5 }, price: 0, sell: 200, desc: 'ねむりと毒にかかりにくくなるお守り。' },
  mage_earring: { name: '魔法のイヤリング', type: 'acc', rank: 2, bonus: { mp: 8, mag: 2 }, price: 0, sell: 200, desc: 'MPと魔力が上がるイヤリング。' },
  // ボスが かならず 落とす 物（1人 1つ）
  forest_necklace: { name: '森の首かざり', type: 'acc', rank: 2, unique: true, bonus: { hp: 15, heal: 4 }, resist: { poison: 0.5 }, price: 0, sell: 150, desc: 'ダークトレントが落とした木の実の首かざり。HPと回復魔力が上がり、毒にかかりにくい。' },
  rock_bangle: { name: '岩のうでわ', type: 'acc', rank: 3, unique: true, bonus: { def: 6, str: 4 }, price: 0, sell: 250, desc: 'ゴルドーンの体からけずり出したうでわ。力と身の守りが上がる。' },

  // ───── だいじなもの ─────
  star_flower: { name: '星の花', type: 'key', desc: '星見の丘にさく、星の光を吸った花。' },
  spirit_wood: { name: 'せいれいの木', type: 'key', desc: '森の主からもらった不思議な材木。' },
  cave_key: { name: '洞窟のカギ', type: 'key', desc: 'なげきの洞窟のおくのとびらを開くカギ。' },
  guardian_stone: { name: '守り星の石', type: 'key', desc: 'ホシフル村を守ってきた星の石。ヒビが入っている。' },
  mike_bell: { name: 'ミケのすず', type: 'key', desc: '迷子のねこミケの首輪に付いていたすず。' },
};
Object.assign(ITEMS, ITEMS_CH2, ITEMS_TM);
// 夜の 品物（night.js）・空の 旅（sky.js）
Object.assign(ITEMS, NIGHT_ITEMS, SKY_ITEMS);
// ふしぎなかじの 素材と 作れる 装備（items-forge.js）
Object.assign(ITEMS, ITEMS_FORGE);
// カジノの 景品・メダル王の ごほうび（items-casino.js）
Object.assign(ITEMS, ITEMS_CASINO);
// めずらしい 魔物が 落とす 物（monsters-rare.js）
Object.assign(ITEMS, RARE_ITEMS);
// みちびきの糸（escape.js）
Object.assign(ITEMS, ESCAPE_ITEMS);
// 第3章「星の竜がねむる山」（items-ch3.js）
Object.assign(ITEMS, ITEMS_CH3);
// 第4章「砂の海にしずむ星」（items-ch4.js）
Object.assign(ITEMS, ITEMS_CH4);
// 第4章 Step 7: モルガナが 落とす 品（items-temple.js）
Object.assign(ITEMS, ITEMS_TEMPLE);
// きたえた 装備（'iron_sword+1'〜'+3'）。新しい 装備を 足す ときは この 行より 上で
addUpgradeItems(ITEMS);

// ───── 装備の ランク（長い 物語の ための ものさし）─────
// 1つの 章で 1〜2ランク すすむ。新しい 章を 作る ときは、その章の 町で 次の ランクを 売る。
//   ・店で 売るのは その章の ランク。物語が すすむと 品ぞろえが ふえる（shops.js の more）
//   ・★（star）は 店で 買えない 少し 強い 品。宝箱・ボス・魔物の レアドロップで 手に入る
//   ・「伝説」の 名前は ランク10（さいごの 章）だけで 使う
// sword: その ランクの 剣の 攻撃力の めやす（ほかの 武器は これより 弱く、ボーナスが つく）
// cloth: その ランクの だれでも 着られる 服の 守備力の めやす
export const EQUIP_RANKS = [
  { rank: 1, name: '木と皮', where: '序章のホシフル村', sword: 6, cloth: 5 },
  { rank: 2, name: '銅と石', where: '第1章のルミナの町', sword: 12, cloth: 10 },
  { rank: 3, name: '鉄', where: '第1章のルミナの町（森の主を助けたあと）', sword: 20, cloth: 14 },
  { rank: 4, name: '銀と海', where: '第2章のカモメ港', sword: 30, cloth: 17 },
  { rank: 5, name: 'はがね', where: '第3章の鉱山の町カナトコ（鉱山を取りもどすと品ぞろえがふえる）', sword: 40, cloth: 22 },
  { rank: 6, name: '魔法', where: '第4章の王都サファラ', sword: 50, cloth: 27 },
  { rank: 7, name: 'プラチナ', where: '第4章の砂の港ドゥナ（第4章クリアのあと）', sword: 61, cloth: 33 },
  { rank: 8, name: '光', where: '第6章（これから）', sword: 72, cloth: 39 },
  { rank: 9, name: '竜', where: '第7章（これから）', sword: 85, cloth: 46 },
  { rank: 10, name: '伝説', where: '最後の章（これから）', sword: 100, cloth: 54 },
];
export const RANK_MAX = EQUIP_RANKS.length;

// そうび部位
export const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export const SLOT_NAMES = { weapon: '武器', armor: 'よろい', shield: 'たて', head: '頭', acc: 'アクセ' };
export const SLOT_OF_TYPE = { weapon: 'weapon', armor: 'armor', shield: 'shield', head: 'head', acc: 'acc' };

export const WEAPON_CAT_NAMES = {
  sword: '剣', dagger: '短剣', axe: 'オノ', staff: 'つえ', spear: 'やり', claw: 'ツメ', fan: 'おうぎ', whip: 'ムチ', bat: 'バット', boomerang: 'ブーメラン', none: '素手',
};

// きたえた 装備（'iron_sword+2'）の もとの 装備（みため・エフェクト・装備できる 職業は もとと おなじ）
export function baseItemId(id) {
  return (id && ITEMS[id]?.base) || id;
}

export function sellPrice(id) {
  const it = ITEMS[id];
  if (!it || it.type === 'key') return 0;
  if (it.sell !== undefined) return it.sell;
  return Math.floor((it.price || 0) * 3 / 4);
}

// ───── 読みがな（道具の「あいうえお順」ならべかえ）─────
// 新しい 道具を 作ったら ここにも 読みを 足す（ない ときは 名前の カタカナを ひらがなに して ならべる）
export const ITEM_KANA = {
  herb: 'やくそう', antidote: 'どくけしそう', moonherb: 'まんげつそう', magic_water: 'まほうのせいすい', holy_water: 'せいすい',
  return_wing: 'かえりみちのはね', smoke_ball: 'けむりだま', revive_flower: 'よみがえりのはな', star_shard: 'ほしのかけら',
  seed_str: 'ちからのたね', seed_def: 'まもりのたね', seed_agi: 'すばやさのたね', seed_mag: 'かしこさのたね', seed_hp: 'いのちのきのみ',
  wood_sword: 'きのけん', bronze_sword: 'どうのけん', iron_sword: 'てつのけん', stardust_sword: 'ほしくずのけん',
  stone_axe: 'いしのおの', iron_axe: 'てつのおの', bronze_knife: 'どうのないふ', poison_knife: 'どくのないふ',
  wizard_staff: 'まどうしのつえ', bronze_spear: 'どうのやり', iron_spear: 'てつのやり', iron_claw: 'てつのつめ',
  leather_whip: 'かわのむち', thorn_whip: 'いばらのむち', flame_whip: 'ほのおのむち', feather_fan: 'はねのおうぎ', dancer_fan: 'おどりこのおうぎ',
  signal_flag: 'てばた', wood_bat: 'きのばっと', bamboo_bat: 'たけのばっと', metal_bat: 'きんぞくばっと', katana: 'かたな',
  wood_boomerang: 'きのぶーめらん', iron_boomerang: 'てつのぶーめらん', silver_boomerang: 'ぎんのぶーめらん', steel_boomerang: 'はがねのぶーめらん', gale_boomerang: 'はやてのぶーめらん',
  cloth: 'ぬののふく', travel_clothes: 'たびびとのふく', leather_armor: 'かわのよろい', wind_clothes: 'かぜのふく', iron_armor: 'てつのよろい',
  wizard_robe: 'まどうしのろーぶ', holy_robe: 'せいなるろーぶ', martial_gi: 'ぶどうぎ', dragon_gi: 'りゅうのどうぎ', star_mail: 'ほしのよろい',
  leather_shield: 'かわのたて', iron_shield: 'てつのたて', leather_hat: 'かわのぼうし', iron_helm: 'てつかぶと',
  power_ring: 'ちからのゆびわ', guard_ring: 'まもりのゆびわ', star_charm: 'ほしのおまもり', mage_earring: 'まほうのいやりんぐ',
  forest_necklace: 'もりのくびかざり', rock_bangle: 'いわのうでわ', star_flower: 'ほしのはな', spirit_wood: 'せいれいのき',
  cave_key: 'どうくつのかぎ', guardian_stone: 'まもりぼしのいし',
  silver_sword: 'ぎんのけん', pirate_axe: 'かいぞくのおの', silver_dagger: 'ぎんのないふ', wave_staff: 'なみのつえ', sea_fan: 'うみかぜのおうぎ',
  storm_whip: 'あらしのむち', thunder_sword: 'いかずちのけん', silver_mail: 'ぎんのよろい', sailor_clothes: 'ふなのりのふく', wave_gi: 'なみのどうぎ',
  silver_shield: 'ぎんのたて', shell_shield: 'かいのたて', silver_helm: 'ぎんのかぶと', captain_hat: 'せんちょうのぼうし',
  wind_ring: 'かぜのゆびわ', deep_ring: 'しんかいのゆびわ', storm_bangle: 'あらしのうでわ', sea_charm: 'うみのおまもり',
  light_orb: 'ひかりのたま', wind_star: 'かぜのまもりぼし', bottle_letter: 'びんのてがみ',
  kitchen_knife: 'ほうちょう', whisk: 'あわだてき', chinese_wok: 'ちゅうかなべ', gold_mic: 'きんのまいく', chef_knife: 'みつぼしのほうちょう',
  pillow: 'まくら', selfie_stick: 'じどりぼう', game_controller: 'げーむのこんとろーらー', battle_suit: 'さいやじんのせんとうふく', chuuni_bokken: 'ふういんのぼくとう',
  monkey_wrench: 'もんきーれんち', gaming_keyboard: 'げーみんぐきーぼーど', gold_button: 'きんのきねんたて', straw_hat: 'むぎわらぼうし', pipe_wrench: 'ぱいぷれんち',
  dark_feather_staff: 'くろいはねのつえ', slipper: 'すりっぱ', leopard_shirt: 'ひょうがらのふく',
  tm_gold_bangle: 'おうごんのうでわ', tm_gem_ring: 'ほうせきのゆびわ', tm_dragon_scale: 'えんりゅうのうろこ', tm_dark_ring: 'やみのゆびわ', tm_ice_pendant: 'こおりのぺんだんと', tm_shadow_anklet: 'かげのあんくれっと',
};

Object.assign(ITEM_KANA, NIGHT_ITEM_KANA, SKY_ITEM_KANA);
Object.assign(ITEM_KANA, FORGE_KANA, RARE_ITEM_KANA);
Object.assign(ITEM_KANA, CASINO_KANA);
Object.assign(ITEM_KANA, ESCAPE_KANA);
Object.assign(ITEM_KANA, CH3_ITEM_KANA);
Object.assign(ITEM_KANA, CH4_ITEM_KANA, TEMPLE_ITEM_KANA);

export function itemKana(id) {
  // きたえた 装備は もとの 装備の 読み ＋ 回数（鉄の剣 → 鉄の剣+1 の じゅん）
  const up = ITEMS[id];
  if (up?.base && ITEMS[up.base]) return `${itemKana(up.base)}+${up.plus}`;
  const k = ITEM_KANA[id];
  if (k) return k;
  // カタカナ → ひらがな（「ー」は そのまま）
  return String(ITEMS[id]?.name || id).replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// 道具の 種類の じゅん（ならべかえ）: 回復 → 状態 → 生き返り → 種 → ほかの 道具 → 武器 → よろい → たて → かぶと → アクセサリー
const TYPE_ORDER = ['weapon', 'armor', 'shield', 'head', 'acc'];
const USE_ORDER = ['heal', 'mpHeal', 'cure', 'revive', 'seed'];
export function itemTypeRank(id) {
  const it = ITEMS[id];
  if (!it) return 999;
  if (it.type === 'use') {
    const u = USE_ORDER.indexOf(it.effect?.type);
    return u >= 0 ? u : USE_ORDER.length;
  }
  const t = TYPE_ORDER.indexOf(it.type);
  return t >= 0 ? 10 + t : 20;
}

// ならべかえ: 'got'（手に入れた順）/ 'kana'（あいうえお順）/ 'type'（種類順）
export const ITEM_SORTS = { got: '手に入れた順', kana: 'あいうえお順', type: '種類順' };
const ITEM_POS = new Map(Object.keys(ITEMS).map((id, i) => [id, i]));
// きたえた 装備は もとの 装備の すぐ うしろ
const itemPos = (id) => (ITEMS[id]?.base ? (ITEM_POS.get(ITEMS[id].base) ?? 0) + ITEMS[id].plus / 10 : ITEM_POS.get(id) ?? 0);
export function sortItemIds(ids, mode) {
  const list = ids.slice();
  if (mode === 'kana') list.sort((a, b) => itemKana(a).localeCompare(itemKana(b), 'ja'));
  else if (mode === 'type') list.sort((a, b) => itemTypeRank(a) - itemTypeRank(b) || (ITEMS[a].rank || 0) - (ITEMS[b].rank || 0) || itemPos(a) - itemPos(b));
  return list;
}
