// 第50回 D3: 景品の 乗り物の 絵（data/vehicles-prize.js。vehicle-art.js が 道具を わたして よぶ）
//   今の 乗り物の 作り方（馬・自転車・車・空飛ぶじゅうたん・雲）を 色がえで 使い回す。4方向・2〜3コマは もとと おなじ
export function addPrizeVehicleArt(ART, kit) {
  const { horseArt, bikeArt, carArt, deckArt, carpetPaint, cloudPaint, rgba, twinkle } = kit;
  // きらきら（金・星の 乗り物）
  const sparkle = (col) => (p, view, f, { w }) => {
    for (let i = 0; i < 3; i++) twinkle(p, 6 + i * (w / 3) + ((f + i) % 2) * 3, 6 + ((i + f) % 3) * 4, rgba(col, 0.75));
  };
  const carpet = (cols, glow) => deckArt({
    w: 48, fw: 40, sit: true, lift: 8, crop: 33, frames: 2, seatUp: 0,
    paint: carpetPaint(cols),
    fx(p, view, f, { g, w }) {
      for (let i = 0; i < 3; i++) twinkle(p, 6 + i * (w / 3) + f * 3, g + 6 + (i % 2) * 2, rgba(glow, 0.75));
    },
  });

  // ───── 自転車 ─────
  ART.gold_bicycle = bikeArt({ kind: 'bicycle', color: '#e8b830' });
  ART.galaxy_bicycle = bikeArt({ kind: 'bicycle', color: '#3a2a8a' });
  ART.star_bicycle = bikeArt({ kind: 'bicycle', color: '#6ac8f0' });
  // ───── 馬・天馬 ─────
  ART.gold_mane_horse = horseArt({ coat: '#f6f2ea', mane: '#f2c14e', saddle: '#c83a3a', trim: '#f2c14e', hoof: '#8a6a2a', muzzle: '#f8e4d8' });
  ART.lucky_pegasus = horseArt({ coat: '#fff6ec', mane: '#ff8ac8', saddle: '#e8b830', wings: '#ffe0f0', fly: true, muzzle: '#ffe8f0' });
  ART.galaxy_pegasus = horseArt({ coat: '#2a3480', mane: '#a8d8ff', saddle: '#f2c14e', wings: '#c8d8ff', fly: true, hoof: '#1a1e4a', muzzle: '#4a54a0' });
  // ───── 空飛ぶじゅうたん ─────
  ART.gold_carpet = carpet(['#e8b830', '#a8761a', '#fff6c8'], '#fff2a8');
  ART.rainbow_carpet = carpet(['#e85a8a', '#4a7ae8', '#f2e04e'], '#ffffff');
  ART.medal_carpet = carpet(['#6a3ab8', '#3a1a6a', '#f2c14e'], '#ffe08a');
  // ───── 車・雲 ─────
  ART.gold_open_car = carArt({ body: '#e8b830', len: 56, h: 11, roof: 'open', cab: [18, 42], stripe: '#fff6c8', rim: '#f4f4f8', fx: sparkle('#fff2a8') });
  ART.comet_cloud = deckArt({ w: 52, fw: 40, lift: 7, frames: 2, deckY: 1, paint: cloudPaint('#d8eeff', '#8ab8e8'), fx: sparkle('#e8f6ff') });
}
