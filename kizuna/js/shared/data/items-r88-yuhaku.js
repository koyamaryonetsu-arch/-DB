// 第88回 G7班: 幽☆遊☆白書（ゲームの 字は「ゆう☆遊☆白書」）の 品（docs/plan-r88-anime-gear.md の 2-6）
//   れい界探ていの 七つ道具（作品に 出る 5つ）・れい光玉・桑原の 剣・蔵馬と 飛影の 品・闇の三大秘宝（そろい yami_hihou）・暗黒武とう会の 相手の 品
//   作品の 字は 使える 字に 直した（霊撃輪具 → れいげきリング・霊光玉 → れい光玉 など。設計書の「実装メモ（G7班）」）
//   入れない 品: 七つ道具の のこり 2つ・Dr.イチガキ・魔性使いチーム・五連邪の 品（設計書 2-6）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=7f0a6eee2a0c';

const Y = { work: 'yuhaku' };
const H = { work: 'yuhaku', set: 'yami_hihou' };

const GEAR = {
  // ───── れい界と ゆう助・くわばらの 品 ─────
  r88_yh_gakuran: { ...armor('gi', 'fu3'), ...Y, name: '緑の学ラン', fx: [{ k: 'hp', v: 4 }], desc: 'けんか屋の中学生がいつも着ている、緑の学生服。最大HPが上がる。' },
  r88_yh_ring: { ...acc('mei'), ...Y, name: 'れいげきリング', fx: [{ k: 'crit', v: 6 }], bonus: { str: 8, mag: 6 }, desc: 'れい界探ていの七つ道具で、ただ1つの攻撃の道具。指にはめると、れい丸が強くなる。会心の一撃が出やすい。' },
  r88_yh_lupe: { ...acc('fu3'), ...Y, name: 'れいとう眼鏡', fx: [{ k: 'crit', v: 4 }], bonus: { mag: 4 }, desc: 'れい界探ていの七つ道具。かくれた物を見つける虫めがね。会心の一撃が出やすい。' },
  r88_yh_youkikei: { ...acc('fu3'), ...Y, name: 'よう気計', bonus: { agi: 14 }, desc: 'れい界探ていの七つ道具。うで時計の形で、ようかいのいる方角ときょりがわかる。素早さが上がる。' },
  r88_yh_itako: { ...acc('fu3'), ...Y, name: 'イタコ笛', bonus: { mag: 12 }, desc: 'れい界探ていの七つ道具。ふくと、ようかいにだけ聞こえる音が出る。魔力が上がる。' },
  r88_yh_mejirushi: { ...acc('fu3'), ...Y, name: '目じるしール', bonus: { agi: 6, str: 4 }, use: { ability: 'r88u_yh_mejirushi' }, desc: 'れい界探ていの七つ道具。はった人にしかはがせないシール。使うと、敵1体にはって、動きをにぶくする。' },
  r88_yh_reikou: { ...acc('den'), ...Y, name: 'れい光玉', bonus: { hp: 110, str: 32, mag: 32, def: 24, agi: 24, heal: 20 }, desc: 'れい光はどうけんの師しょうが、すべての力をこめた光の玉。うけつぐと、力と魔力とHPが大きく上がる。' },
  r88_yh_reiken: { ...weapon('sword', 'mei'), ...Y, name: 'れい剣', fx: [{ k: 'el_light', v: 6 }], bonus: { str: 4 }, look: 'holy', desc: 'リーゼントのけんか屋が、れい力で作る光の剣。ふつうの攻撃が光になる。' },
  r88_yh_tameshi: { ...weapon('sword', 'mei'), ...Y, name: '試しの剣', reach: 'group', bonus: { str: 4 }, look: 'leaf', desc: 'つかだけの剣。持つ人の気をすって、やいばがのびる。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_yh_jigento: { ...weapon('sword', 'den'), ...Y, name: '次元刀', fx: [{ k: 'crit', v: 8 }], bonus: { str: 20, agi: 8 }, use: { ability: 'r88u_yh_jigento' }, look: 'crystal', desc: '空間そのものを切る、ふしぎな剣。会心の一撃がとても出やすい。使うと、敵1体を守りごと切りさく。' },
  r88_yh_oshaburi: { ...acc('mei'), ...Y, name: 'れい界のおしゃぶり', fx: [{ k: 'mpregen', v: 6 }], bonus: { mag: 8 }, use: { ability: 'r88u_yh_mafuukan' }, desc: 'れい界の王子が、いつもくわえているおしゃぶり。力をためこんでいる。行動するたびにMPが少し回復する。使うと、ためた力で仲間みんなの守りを上げる。' },
  r88_yh_kai: { ...weapon('staff', 'fu3'), ...Y, name: 'ぼたんのかい', fx: [{ k: 'el_wind', v: 4 }], bonus: { mag: 4 }, look: 'broom', desc: 'れい界の案内人がのって、空をとぶかい。ふつうの攻撃が風になる。' },
  // ───── くらまと 飛影の 品 ─────
  r88_yh_rosewhip: { ...weapon('whip', 'mei'), ...Y, name: 'ローズウィップ', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 4 }, look: 'thorn', desc: 'よう力でバラをトゲのムチにかえたもの。トゲは鉄も切る。ときどきもう1回攻撃する。' },
  r88_yh_tane: { ...acc('fu3'), ...Y, name: '魔界の植物のたね', bonus: { mag: 8 }, use: { ability: 'r88u_yh_tane' }, desc: '魔界の植物のたね。よう力でそだてると、つるがのびる。使うと、敵1体をつるでしばってマヒさせる。' },
  r88_yh_zense: { ...acc('mei'), ...Y, name: '前世の実', bonus: { mag: 8, str: 6 }, use: { ability: 'r88u_yh_zense' }, desc: 'むかしのすがたにもどれる、ふしぎな実。使うと、しばらく攻撃力と魔力が大きく上がる。' },
  r88_yh_hiei: { ...weapon('sword', 'mei'), ...Y, name: '飛影の刀', fx: [{ k: 'el_fire', v: 6 }], bonus: { agi: 6 }, look: 'katana', desc: '小さな剣士の刀。黒い炎をまとわせて切る。ふつうの攻撃が炎になる。' },
  r88_yh_hachimaki: { ...head('mei'), ...Y, name: '第三の目のはちまき', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 4 }, desc: 'ひたいの第三の目をかくす白いはちまき。何でも見とおす。敵の攻撃をかわしやすくなる。' },
  r88_yh_houtai: { ...acc('mei'), ...Y, name: '右うでの包帯', orb: { el: 'fire', v: 6 }, bonus: { str: 8, mag: 6 }, desc: '黒い竜の力をふうじた包帯。つけると、武器のふつうの攻撃が炎になる。' },
  // ───── 闇の三大秘宝（そろい）─────
  r88_yh_goma: { ...weapon('sword', 'mei'), ...H, name: '降魔の剣', fx: [{ k: 'el_dark', v: 6 }], bonus: { str: 4 }, look: 'scimitar', desc: '闇の三大秘宝の1つ。切った物を魔物にかえるという剣。ふつうの攻撃が闇になる。' },
  r88_yh_ankoku: { ...shield('mei'), ...H, name: '暗黒鏡', fx: [{ k: 'def', v: 5 }], use: { ability: 'r88u_yh_ankoku', hpCost: 0.5 }, look: 'mirror', desc: '闇の三大秘宝の1つ。ねがいをかなえるかわりに、たくさんの力をとる鏡。使うと、つけた人のHPを半分使って、仲間1人のHPをすっかり回復する。' },
  r88_yh_gakidama: { ...acc('mei'), ...H, name: 'がき玉', fx: [{ k: 'mana', v: 6 }], bonus: { mag: 8 }, desc: '闇の三大秘宝の1つ。力をすいとる玉。攻撃が当たるとMPが回復する。' },
  // ───── 暗黒武とう会・魔界の 相手の 品 ─────
  r88_yh_yoyo: { ...weapon('boomerang', 'fu3'), ...Y, name: 'デビルヨーヨー', fx: [{ k: 'chase', v: 4 }], look: 'star', desc: '小さな赤毛の戦士のヨーヨー。ときどきもう1回攻撃する。' },
  r88_yh_kibidango: { ...acc('mei'), ...Y, name: 'き美団子', bonus: { def: 8, hp: 20 }, use: { ability: 'r88u_yh_kibidango' }, desc: 'サル・キジ・イヌの3つのすがたに化けられる、ふしぎなだんご。使うと、化けて体がかたくなり、守備力が大きく上がる。' },
  r88_yh_makoku: { ...weapon('sword', 'mei'), ...Y, name: '魔こく鳴斬剣', fx: [{ k: 'el_dark', v: 6 }], bonus: { agi: 4 }, look: 'katana', desc: 'おにの少年剣士の刀。ふると、なき声のような音がひびく。ふつうの攻撃が闇になる。' },
  r88_yh_karasu: { ...head('fu3'), ...Y, name: 'からすのマスク', fx: [{ k: 'res_fire', v: 4 }], desc: '黒い服の戦士がつけている、口もとをかくすマスク。炎に強い。' },
  r88_yh_bui_yoroi: { ...armor('heavy', 'mei'), ...Y, name: '武威のよろい', fx: [{ k: 'def', v: 6 }], bonus: { hp: 30, str: -10 }, desc: '強すぎる気をおさえるための、重いよろい。守備力がとても上がるが、力が下がる。' },
  r88_yh_bui_ono: { ...weapon('axe', 'mei'), ...Y, name: '武威の大オノ', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'battle', desc: 'よろいの戦士がふり回す、大きなオノ。会心の一撃が出やすい。' },
  r88_yh_sunglass: { ...head('fu3'), ...Y, name: '戸ぐろのサングラス', bonus: { str: 8 }, desc: '大きなけんか屋がかけている、黒いサングラス。力が上がる。' },
  r88_yh_rinka: { ...weapon('boomerang', 'mei'), ...Y, name: 'りん火円れき刀', fx: [{ k: 'chase', v: 6 }], bonus: { str: 4 }, look: 'crescent', desc: '魔界の剣士の、大きな輪の形の刀。ときどきもう1回攻撃する。' },
};
priceUp(GEAR);

export const ITEMS_R88_YUHAKU = GEAR;

// 生まれ変わり: なし
export const R88_REBIRTH_YUHAKU = {};

export const R88_YUHAKU_KANA = {
  r88_yh_gakuran: 'みどりのがくらん', r88_yh_ring: 'れいげきりんぐ', r88_yh_lupe: 'れいとうめがね', r88_yh_youkikei: 'ようきけい', r88_yh_itako: 'いたこぶえ',
  r88_yh_mejirushi: 'めじるしーる', r88_yh_reikou: 'れいこうぎょく', r88_yh_reiken: 'れいけん', r88_yh_tameshi: 'ためしのけん', r88_yh_jigento: 'じげんとう',
  r88_yh_oshaburi: 'れいかいのおしゃぶり', r88_yh_kai: 'ぼたんのかい', r88_yh_rosewhip: 'ろーずうぃっぷ', r88_yh_tane: 'まかいのしょくぶつのたね', r88_yh_zense: 'ぜんせのみ',
  r88_yh_hiei: 'ひえいのかたな', r88_yh_hachimaki: 'だいさんのめのはちまき', r88_yh_houtai: 'みぎうでのほうたい', r88_yh_goma: 'ごうまのけん', r88_yh_ankoku: 'あんこくきょう',
  r88_yh_gakidama: 'がきだま', r88_yh_yoyo: 'でびるよーよー', r88_yh_kibidango: 'きびだんご', r88_yh_makoku: 'まこくめいざんけん', r88_yh_karasu: 'からすのますく',
  r88_yh_bui_yoroi: 'ぶいのよろい', r88_yh_bui_ono: 'ぶいのおおおの', r88_yh_sunglass: 'とぐろのさんぐらす', r88_yh_rinka: 'りんかえんれきとう',
};
