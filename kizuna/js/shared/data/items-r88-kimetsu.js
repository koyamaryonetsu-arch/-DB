// 第88回 G10班: きめつのやいばの 品（docs/plan-r88-anime-gear.md の 3-4）
//   作品の 職業（きさつ隊・炎柱・日の呼吸の使い手）は 剣・短剣・服と 道着
//   ・主人公の 刀 … 今 ある 日輪刀（店の 品）→ 炎のつばの黒い日輪刀（名品）→ 赤く光る日輪刀（伝説）に 生まれ変わる（R88_REBIRTH_KIMETSU）
//   ・柱 9人の 刀（そろい hashira9。持って いる 数で しょう号）。日輪刀は 持ち主の 呼吸で 色が かわる
//   ・今 ある 日輪刀・炎の羽織 は こわさず、作品の 品として 数える（R88_TAG_KIMETSU。強さ・手に入れ方は かえない）
//   ・入れない 品: 鬼の 血鬼術・本物の 銃（設計書 3-4）。こわい 名前は やさしく した
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=7eefef6c1f45';

const K = { work: 'kimetsu' };
const H = { work: 'kimetsu', set: 'hashira9' };

const GEAR = {
  // ───── 主人公の 刀（日輪刀から 生まれ変わる）─────
  r88_km_tsuba: { ...weapon('sword', 'mei'), ...K, name: '炎のつばの黒い日輪刀', fx: [{ k: 'el_fire', v: 6 }], bonus: { str: 6, agi: 4 }, look: 'katana', desc: 'からくり人形の中から出てきた古い刀を、きたえ直した黒い日輪刀。炎の形のつばは、炎柱の弟からもらった物。ふつうの攻撃が炎になる。' },
  r88_km_kakuto: { ...weapon('sword', 'den'), ...K, name: '赤く光る日輪刀', fx: [{ k: 'slay_demon', v: 8 }], bonus: { str: 20, agi: 10 }, use: { ability: 'r88u_km_kakuto' }, look: 'katana', desc: '強い思いで、まっ赤にそまった日輪刀。あくま系の敵に大きなダメージ。使うと、赤い刀で敵1体に炎の一げき。' },
  // ───── 柱 9人の 刀（そろい）─────
  r88_km_mizu: { ...weapon('sword', 'mei'), ...H, name: '水の日輪刀', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, look: 'katana', desc: '水柱の、青くすんだ日輪刀。しずかな水面のように、どんな攻撃もうけ流す。敵の攻撃をかわしやすくなる。' },
  r88_km_honoo: { ...weapon('sword', 'mei'), ...H, name: '炎の日輪刀', fx: [{ k: 'el_fire', v: 6 }], bonus: { str: 6 }, look: 'katana', desc: '炎柱の、赤い日輪刀。つばも炎の形。心を燃やして戦う。ふつうの攻撃が炎になる。' },
  r88_km_mushi: { ...weapon('dagger', 'mei'), ...H, name: '虫の日輪刀', fx: [{ k: 'poison', v: 6 }], bonus: { agi: 8 }, look: 'stiletto', desc: '虫柱の、細い日輪刀。先だけで、ちょうのように軽くつく。さやにしまう時に、薬を入れかえる。ときどき敵を毒にする。' },
  r88_km_oto: { ...weapon('axe', 'mei'), ...H, name: '音の日輪刀', bonus: { str: 8 }, use: { ability: 'r88u_km_oto' }, look: 'crescent', desc: '音柱の、くさりでつないだ大きな二本の刀。とてもはで。使うと、火薬玉をまいて、同じ種類の敵みんなを、音とばくはつでつつむ。' },
  r88_km_koi: { ...weapon('whip', 'mei'), ...H, name: 'こいの日輪刀', reach: 'group', bonus: { agi: 6 }, look: 'whip', desc: 'こい柱の、うすくて長い桜色の日輪刀。ムチのようにしなる。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_km_hebi: { ...weapon('sword', 'mei'), ...H, name: 'へびの日輪刀', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 4 }, look: 'scimitar', desc: 'へび柱の、へびのようにうねった日輪刀。思いがけない所から切りかかる。会心の一撃が出やすい。' },
  r88_km_kaze: { ...weapon('sword', 'mei'), ...H, name: '風の日輪刀', fx: [{ k: 'el_wind', v: 6 }], bonus: { str: 6 }, look: 'katana', desc: '風柱の、緑の日輪刀。とげとげのもようが入っている。ふつうの攻撃が風になる。' },
  r88_km_kasumi: { ...weapon('sword', 'mei'), ...H, name: 'かすみの日輪刀', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 6 }, look: 'katana', desc: 'かすみ柱の、白い日輪刀。かすみのように、すがたをつかませない。ときどきもう1回攻撃する。' },
  r88_km_tekkyu: { ...weapon('axe', 'den'), ...H, name: 'くさりの鉄球と手オノ', reach: 'group', bonus: { str: 34, hp: 40, agi: -12 }, look: 'tekkyu', desc: '岩柱の、くさりでつないだ大きな鉄球と手オノ。柱の中でいちばん強い。ふつうの攻撃が同じ種類の敵みんなにとどき、力がとても上がるが、素早さが下がる。' },
  // ───── 仲間の 刀 ─────
  r88_km_kaminari: { ...weapon('sword', 'mei'), ...K, name: '雷の日輪刀', fx: [{ k: 'el_bolt', v: 6 }], bonus: { agi: 8 }, look: 'katana', desc: '黄色に、いなずまのもようが入った日輪刀。ねむっている時ほど強い？ふつうの攻撃が雷になる。' },
  r88_km_gizagiza: { ...weapon('dagger', 'mei'), ...K, name: 'ギザギザの二刀', fx: [{ k: 'chase', v: 6 }], bonus: { str: 6 }, look: 'kris', desc: 'いのししの少年が、自分で石でたたいてギザギザにした2本の刀。ときどきもう1回攻撃する。' },
  r88_km_hana: { ...weapon('sword', 'mei'), ...K, name: '花の日輪刀', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 6 }, look: 'katana', desc: 'もも色で、うめの花の形のつばがついた日輪刀。目がとてもよく、すきを見のがさない。会心の一撃が出やすい。' },
  r88_km_iro: { ...weapon('sword', 'fu3'), ...K, name: '色のかわらない日輪刀', bonus: { str: 10, mag: -10 }, look: 'broad', desc: '呼吸が使えない剣士の、色のかわらない日輪刀。それでも、あきらめずに戦う。力が上がるが、魔力が下がる。' },
  r88_km_hajimari: { ...weapon('sword', 'den'), ...K, name: '始まりの剣士の日輪刀', fx: [{ k: 'slay_demon', v: 8 }], bonus: { str: 22, agi: 12 }, look: 'katana', desc: 'すべての呼吸のはじまりの剣士の、黒い日輪刀。あくま系の敵に大きなダメージ。' },
  // ───── 防具・小物 ─────
  r88_km_karakuri: { ...acc('mei'), ...K, name: 'けいこのからくり人形', fx: [{ k: 'counter', v: 6 }], bonus: { str: 6 }, desc: '刀かじの里の、6本のうでのからくり人形。けいこの相手をしてくれる。ときどきやりかえす。' },
  r88_km_ichimatsu: { ...armor('cloth', 'fu3'), ...K, name: '市松もようの羽織', fx: [{ k: 'hp', v: 4 }], desc: '緑と黒の、四角いもようの羽織。だれでも装備できる。最大HPが上がる。' },
  r88_km_katami: { ...armor('cloth', 'fu3'), ...K, name: '片身がわりの羽織', fx: [{ k: 'def', v: 4 }], desc: '右と左で、ちがうもようの羽織。大切な2人の羽織を合わせて作った。守備力が上がる。' },
  r88_km_uroko: { ...armor('cloth', 'fu3'), ...K, name: 'うろこもようの黄色い羽織', bonus: { agi: 10 }, desc: '黄色に、三角のうろこのもようの羽織。育ての親のおじいさんとおそろい。素早さが上がる。' },
  r88_km_chou: { ...armor('cloth', 'fu3'), ...K, name: 'ちょうの羽織', fx: [{ k: 'guard_poison', v: 4 }], desc: 'ちょうのはねのような、うすい羽織。姉からうけついだ。毒にかかりにくい。' },
  r88_km_taifuku: { ...armor('cloth', 'fu3'), ...K, name: 'きさつ隊の隊服', bonus: { def: 6, hp: 16 }, desc: '黒くてじょうぶな、きさつ隊の服。せなかに「めつ」の字。守備力と最大HPが上がる。' },
  r88_km_mimikazari: { ...acc('mei'), ...K, name: '日の耳かざり', fx: [{ k: 'res_fire', v: 6 }], bonus: { hp: 20 }, desc: '花札のような形の耳かざり。始まりの剣士から、家族へと受けつがれてきた。炎に強い。' },
  r88_km_kamikazari: { ...acc('fu3'), ...K, name: 'ちょうのかみかざり', fx: [{ k: 'guard_poison', v: 4 }], desc: 'ちょうの形のかみかざり。姉妹でおそろい。毒にかかりにくい。' },
  r88_km_inoshishi: { ...head('fu3'), ...K, name: 'いのししのかぶり物', bonus: { str: 8 }, desc: 'いのししの頭の形のかぶり物。かぶると、つい「つっこむ！」と走り出したくなる。力が上がる。' },
  r88_km_tengu: { ...head('mei'), ...K, name: '天ぐのお面', fx: [{ k: 'evade', v: 6 }], desc: '赤い顔の天ぐのお面。やさしい顔をかくすために、育ての親がいつもつけている。敵の攻撃をかわしやすくなる。' },
  r88_km_yakuyoke: { ...head('fu3'), ...K, name: 'やくよけのお面', fx: [{ k: 'res_dark', v: 4 }], desc: '育ての親が、弟子のぶじをいのってほった、きつねのお面。闇に強い。' },
  r88_km_hyottoko: { ...head('fu3'), ...K, name: 'ひょっとこのお面', fx: [{ k: 'def', v: 4 }], desc: '刀かじの人たちがつける、口をとがらせた顔のお面。守備力が上がる。' },
  r88_km_ensho: { ...acc('fu3'), ...K, name: '炎柱の書', fx: [{ k: 'res_fire', v: 4 }], desc: '代々の炎柱が書きのこした、古い本。炎に強い。' },
  r88_km_hako: { ...shield('mei'), ...K, name: 'きりくもすぎの箱', fx: [{ k: 'res_dark', v: 6 }], bonus: { hp: 20 }, look: 'tower', desc: 'とても軽い木で作って、うるしをぬった、せおう箱。中で、妹がねむっている。闇に強い。' },
  r88_km_take: { ...acc('fu3'), ...K, name: '口にくわえた竹', fx: [{ k: 'guard_confuse', v: 4 }], desc: '妹がいつも口にくわえている、みじかい竹。心をしずめる。混乱にかかりにくい。' },
  r88_km_fuji: { ...acc('fu3'), ...K, name: 'ふじの花', fx: [{ k: 'res_dark', v: 4 }], desc: 'わるいものがきらうという、むらさき色の花。闇に強い。' },
  r88_km_karasu: { ...acc('fu3'), ...K, name: 'かすがいがらす', bonus: { agi: 12 }, desc: 'きさつ隊の1人1人についている、話せるからす。つぎの行き先を、大きな声で教えてくれる。素早さが上がる。' },
};
priceUp(GEAR);

export const ITEMS_R88_KIMETSU = GEAR;
// 生まれ変わり: 日輪刀（今 ある 店の 品・★1）→ 炎のつばの黒い日輪刀（1回 きたえると）→ 赤く光る日輪刀（上限まで きたえて、限界の石。柱の 刀を 3本 持つ）
export const R88_REBIRTH_KIMETSU = {
  nichirin: { to: 'r88_km_tsuba', shop: true, at: 0, gold: 6000, mats: [['star_shard', 5], ['flame_stone', 3]] },
  r88_km_tsuba: { to: 'r88_km_kakuto', keep: true, gold: 30000, mats: [['star_shard', 12], ['flame_stone', 5], ['limit_stone', 2]], need: { sets: { hashira9: 3 } } },
};
// 今 ある 品を 作品の 品として 数える（とびら・ガチャの「持って いる」。強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_KIMETSU = { nichirin: 'kimetsu', flame_haori: 'kimetsu' };

export const R88_KIMETSU_KANA = {
  r88_km_tsuba: 'ほのおのつばのくろいにちりんとう', r88_km_kakuto: 'あかくひかるにちりんとう',
  r88_km_mizu: 'みずのにちりんとう', r88_km_honoo: 'ほのおのにちりんとう', r88_km_mushi: 'むしのにちりんとう', r88_km_oto: 'おとのにちりんとう', r88_km_koi: 'こいのにちりんとう',
  r88_km_hebi: 'へびのにちりんとう', r88_km_kaze: 'かぜのにちりんとう', r88_km_kasumi: 'かすみのにちりんとう', r88_km_tekkyu: 'くさりのてっきゅうとておの',
  r88_km_kaminari: 'かみなりのにちりんとう', r88_km_gizagiza: 'ぎざぎざのにとう', r88_km_hana: 'はなのにちりんとう', r88_km_iro: 'いろのかわらないにちりんとう',
  r88_km_hajimari: 'はじまりのけんしのにちりんとう', r88_km_karakuri: 'けいこのからくりにんぎょう',
  r88_km_ichimatsu: 'いちまつもようのはおり', r88_km_katami: 'かたみがわりのはおり', r88_km_uroko: 'うろこもようのきいろいはおり', r88_km_chou: 'ちょうのはおり',
  r88_km_taifuku: 'きさつたいのたいふく', r88_km_mimikazari: 'ひのみみかざり', r88_km_kamikazari: 'ちょうのかみかざり', r88_km_inoshishi: 'いのししのかぶりもの',
  r88_km_tengu: 'てんぐのおめん', r88_km_yakuyoke: 'やくよけのおめん', r88_km_hyottoko: 'ひょっとこのおめん', r88_km_ensho: 'えんばしらのしょ',
  r88_km_hako: 'きりくもすぎのはこ', r88_km_take: 'くちにくわえたたけ', r88_km_fuji: 'ふじのはな', r88_km_karasu: 'かすがいがらす',
};
