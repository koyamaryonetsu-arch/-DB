// お店・ほしのかけら交換・サポートなかま

export const SHOPS = {
  village: {
    name: 'ホシフル村の よろずや',
    items: ['herb', 'antidote', 'holy_water', 'wood_sword', 'oak_staff', 'bronze_knife', 'feather_fan', 'cloth', 'leather_hat', 'leather_shield'],
  },
  weapon: {
    name: 'ルミナの ぶきや',
    items: ['bronze_sword', 'stone_axe', 'bronze_knife', 'bronze_spear', 'bronze_knuckle', 'feather_fan', 'oak_staff',
      'iron_sword', 'iron_axe', 'iron_spear', 'iron_claw', 'dancer_fan', 'wizard_staff', 'healing_staff', 'poison_knife', 'leather_whip', 'thorn_whip'],
  },
  armor: {
    name: 'ルミナの ぼうぐや',
    items: ['travel_clothes', 'leather_armor', 'martial_gi', 'wizard_robe', 'chain_mail', 'holy_robe', 'dragon_gi', 'iron_armor',
      'leather_shield', 'scale_shield', 'iron_shield', 'leather_hat', 'bandana', 'pointy_hat', 'iron_helm'],
  },
  item: {
    name: 'ルミナの どうぐや',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'smoke_ball'],
  },
};

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
  { id: 'npc_gard', name: 'ガルド', job: 'warrior', look: { body: 0, hair: 2, hairColor: 3, skin: 1, color: 0 }, tactics: 'balanced', desc: 'ちからじまんの せんし。なかまを まもるのが とくい。' },
  { id: 'npc_mina', name: 'ミーナ', job: 'priest', look: { body: 1, hair: 1, hairColor: 1, skin: 0, color: 4 }, tactics: 'heal', desc: 'やさしい そうりょ。かいふくを まかせて あんしん。' },
  { id: 'npc_poporo', name: 'ポポロ', job: 'mage', look: { body: 0, hair: 0, hairColor: 5, skin: 0, color: 3 }, tactics: 'balanced', desc: 'げんきな まほうつかいの こども。メラが だいすき。' },
  { id: 'npc_rin', name: 'リン', job: 'monk', look: { body: 1, hair: 3, hairColor: 0, skin: 1, color: 1 }, tactics: 'aggressive', desc: 'すばやい ぶとうか。まっさきに とびこんでいく。' },
  { id: 'npc_tina', name: 'ティナ', job: 'performer', look: { body: 1, hair: 2, hairColor: 6, skin: 0, color: 2 }, tactics: 'balanced', desc: 'たびの おどりこ。ピオリムで みんなを はやくする。' },
  { id: 'npc_luca', name: 'ルカ', job: 'monk', look: { body: 0, hair: 2, hairColor: 2, skin: 1, color: 5 }, tactics: 'aggressive', desc: 'ホシフル村の おさななじみ。いっしょに たびを したくて うずうず している。', unlock: 'c1_clear' },
];

// ものがたりで いっしょに たたかう ゲスト
export const GUESTS = {
  luca: { id: 'guest_luca', name: 'ルカ', job: 'monk', look: { body: 0, hair: 2, hairColor: 2, skin: 1, color: 5 }, tactics: 'aggressive', minLevel: 2 },
};
