// 第50回 D3: 景品の おしゃれ着の 見た目（hero-outfit.js の ARMOR_OUTFIT に まぜる。data/items-prize-r50.js）
//   タキシード … 蝶ネクタイと くろい えりの 上着（お笑い芸人の 服と おなじ かき方）
//   ドレス … フリルの スカートの ドレス（kind: 'dress'）／マント … 旅の マント（cloak の 色）
export const PRIZE_ARMOR_LOOK = {
  pz_tuxedo: { kind: 'suit', main: '#1c1a26', bow: '#c41a2a', lapel: '#0e0c14', pants: '#1c1a26' },
  pz_night_tux: { kind: 'suit', main: '#f4f2ee', bow: '#2a3a8a', lapel: '#c8ccd8', pants: '#2a2a3a' },
  pz_stardust_dress: { kind: 'dress', main: '#3a5ad8', trim: '#fff2a8' },
  pz_night_dress: { kind: 'dress', main: '#1a2466', trim: '#c8d8ff' },
  pz_star_cape: { kind: 'travel', main: '#2a3a7a', cloak: '#1a2458' },
  pz_medal_mantle: { kind: 'travel', main: '#4a2a7a', cloak: '#6a3ab8' },
};
