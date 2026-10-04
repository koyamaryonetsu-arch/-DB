// お店・ほしのかけら交換・サポートなかま
// お店: name 店の なまえ / kind かんばんの しゅるい / keeper 店の人 / hello さいしょの ことば / items 売っている 品物
//       more: 物語が すすむと ふえる 品物 [{ show: { all: [フラグ] }, items: [...], hello }]（show の 書き方は NPC と おなじ。hello が あれば あいさつも かわる）

import { SHOPS_CH2 } from './items-ch2.js';
import { NIGHT_SHOPS } from './night.js';
import { SHOPS_CH3, CH3_GUESTS } from './items-ch3.js';
import { SHOPS_CH4 } from './items-ch4.js';

export const SHOPS = {
  village: {
    name: 'ホシフル村のよろず屋',
    kind: 'general',
    keeper: 'よろず屋のおじさん',
    hello: 'いらっしゃい！ホシフル村のよろず屋だよ。\n薬草から剣まで、何でもそろってるよ。\n今日はどんなご用だい？',
    items: ['herb', 'antidote', 'holy_water', 'guide_thread', 'wood_sword', 'oak_staff', 'bronze_knife', 'feather_fan', 'harisen', 'ballpen', 'signal_flag', 'wood_bat', 'cloth', 'leather_hat', 'leather_shield'],
  },
  weapon: {
    name: 'ルミナの武器屋',
    kind: 'weapon',
    keeper: '武器屋のおやじ',
    hello: 'ここは武器屋だ。\n強い武器がなけりゃ、魔物とは戦えねえぞ。\nどんな用だい？',
    items: ['bronze_sword', 'stone_axe', 'bronze_knife', 'bronze_spear', 'bronze_knuckle', 'feather_fan', 'oak_staff',
      'poison_knife', 'leather_whip', 'penlight', 'bamboo_bat', 'wood_boomerang'],
    // 森の主を 助けると 鉄の 武器が とどく
    more: [{
      show: { all: ['c1_treant'] },
      items: ['iron_sword', 'iron_axe', 'iron_spear', 'iron_claw', 'dancer_fan', 'wizard_staff', 'healing_staff', 'thorn_whip', 'metal_bat', 'katana', 'iron_boomerang'],
      hello: 'ここは武器屋だ。\n森が元にもどって、鉄の武器がとどくようになったぞ！\nどんな用だい？',
    }],
  },
  armor: {
    name: 'ルミナの防具屋',
    kind: 'armor',
    keeper: '防具屋のおねえさん',
    hello: '防具屋へようこそ！\n身を守る装備は、とっても大切よ。\nどんなご用かしら？',
    items: ['travel_clothes', 'leather_armor', 'martial_gi', 'wizard_robe', 'chain_mail', 'suit',
      'leather_shield', 'scale_shield', 'briefcase', 'leather_hat', 'bandana', 'pointy_hat', 'bb_helmet'],
    more: [{
      show: { all: ['c1_treant'] },
      items: ['holy_robe', 'dragon_gi', 'iron_armor', 'iron_shield', 'iron_helm'],
      hello: '防具屋へようこそ！\n鉄の防具も入ったのよ。\nどんなご用かしら？',
    }],
  },
  item: {
    name: 'ルミナの道具屋',
    kind: 'item',
    keeper: '道具屋のむすめ',
    hello: 'いらっしゃいませ！道具屋です。\n旅のおともに、薬草はいかがですか？\nどんなご用でしょう？',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'],
  },
};
Object.assign(SHOPS, SHOPS_CH2);
// 夜の 商人（night.js）
Object.assign(SHOPS, NIGHT_SHOPS);
// 第3章の お店（items-ch3.js）
Object.assign(SHOPS, SHOPS_CH3);
// 第4章（items-ch4.js）
Object.assign(SHOPS, SHOPS_CH4);

// 物語で ふえた 品ぞろえ（hasFlag: その人の 世界の フラグ）
function moreOpen(shop, hasFlag) {
  return (shop?.more || []).filter((m) => {
    const show = m.show || {};
    if (show.all && !show.all.every(hasFlag)) return false;
    if (show.not && show.not.some(hasFlag)) return false;
    return true;
  });
}

// 今 売っている 品物
export function shopItems(shop, hasFlag = () => false) {
  if (!shop) return [];
  const out = [...shop.items];
  for (const m of moreOpen(shop, hasFlag)) for (const id of m.items) if (!out.includes(id)) out.push(id);
  return out;
}

// 店の人の あいさつ（品ぞろえが ふえたら かわる）
export function shopHello(shop, hasFlag = () => false) {
  const open = moreOpen(shop, hasFlag).filter((m) => m.hello);
  return open.length ? open[open.length - 1].hello : shop?.hello || '';
}

// ほしのかけら と こうかん
export const STAR_TRADES = [
  { shards: 2, item: 'magic_water' },
  { shards: 4, item: 'revive_flower' },
  { shards: 6, item: 'power_ring' },
  { shards: 8, item: 'guard_ring' },
  { shards: 10, item: 'swift_ring' },
  { shards: 15, item: 'star_mail' },
];

// やどや・きょうかいの ねだん
export const INN_PRICE = { village: 0, town: 12 };
export function revivePrice(level) { return 10 + level * 8; }
export const CURE_PRICE = 10;

// 酒場の サポートなかま（家族の キャラクターも ここに ならぶ）
export const NPC_SUPPORTS = [
  { id: 'npc_gard', name: 'ガルド', job: 'warrior', look: { body: 0, hair: 2, hairColor: 3, skin: 1, color: 0 }, tactics: 'balanced', desc: '力じまんの戦士。仲間を守るのが得意。' },
  { id: 'npc_mina', name: 'ミーナ', job: 'priest', look: { body: 1, hair: 1, hairColor: 1, skin: 0, color: 4 }, tactics: 'heal', desc: '優しい僧侶。回復を任せて安心。' },
  { id: 'npc_poporo', name: 'ポポロ', job: 'mage', look: { body: 0, hair: 0, hairColor: 5, skin: 0, color: 3 }, tactics: 'balanced', desc: '元気な魔法使いの子ども。メラが大好き。' },
  { id: 'npc_rin', name: 'リン', job: 'monk', look: { body: 1, hair: 3, hairColor: 0, skin: 1, color: 1 }, tactics: 'aggressive', desc: '素早い武闘家。真っ先に飛びこんでいく。' },
  { id: 'npc_tina', name: 'ティナ', job: 'performer', look: { body: 1, hair: 2, hairColor: 6, skin: 0, color: 2 }, tactics: 'balanced', desc: '旅のおどり子。ピオリムでみんなを速くする。' },
  { id: 'npc_luca', name: 'ルカ', job: 'monk', look: { body: 0, hair: 2, hairColor: 2, skin: 1, color: 5 }, tactics: 'aggressive', desc: 'ホシフル村の幼なじみ。いっしょに旅をしたくてうずうずしている。', unlock: 'c1_clear' },
];

// ものがたりで いっしょに たたかう ゲスト
export const GUESTS = {
  luca: { id: 'guest_luca', name: 'ルカ', job: 'monk', look: { body: 0, hair: 2, hairColor: 2, skin: 1, color: 5 }, tactics: 'aggressive', minLevel: 2 },
};
// 第3章: 竜のみこユキナ（items-ch3.js）
Object.assign(GUESTS, CH3_GUESTS);
