// 宝の地図の 場所の 光（まだ ほっていない 場所）
//   ひろえる きらきら（白と うすい 黄色の 十字）と まちがえない ように、赤むらさきの 光の 柱・地面の わ・のぼる 火の粉（赤むらさきと 金）
//   x, y … 地面の 点（がめんの 座標）/ t … 時間（ミリびょう）/ k … 大きさ（1マス 16ドットの とき 1）
export const GLOW_MAIN = '#ff3d96';
export const GLOW_SUB = '#ffd23a';

function diamond(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.7, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.7, y);
  ctx.closePath();
  ctx.fill();
}

export function drawTreasureGlow(ctx, x, y, t, k = 1) {
  const pulse = 0.5 + 0.5 * Math.sin(t / 260);
  const H = 54 * k, W = 8 * k;
  ctx.save();
  // 光の 柱（下が こく、上へ 消える）
  const g = ctx.createLinearGradient(0, y, 0, y - H);
  g.addColorStop(0, `rgba(255, 61, 150, ${0.5 + 0.25 * pulse})`);
  g.addColorStop(0.6, `rgba(255, 61, 150, ${0.18 + 0.1 * pulse})`);
  g.addColorStop(1, 'rgba(255, 61, 150, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - W / 2, y - H, W, H);
  // まん中の しろっぽい すじ
  const g2 = ctx.createLinearGradient(0, y, 0, y - H * 0.85);
  g2.addColorStop(0, `rgba(255, 225, 240, ${0.55 + 0.3 * pulse})`);
  g2.addColorStop(1, 'rgba(255, 225, 240, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(x - 1.2 * k, y - H * 0.85, 2.4 * k, H * 0.85);
  // 地面の わ（ふくらんだり ちぢんだり）
  ctx.strokeStyle = `rgba(255, 61, 150, ${0.65 + 0.3 * pulse})`;
  ctx.lineWidth = Math.max(1, 1.6 * k);
  const r = (6.5 + 3 * pulse) * k;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255, 210, 58, ${0.35 + 0.35 * (1 - pulse)})`;
  ctx.lineWidth = Math.max(1, k);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  // のぼる 火の粉（ひし形）
  for (let i = 0; i < 5; i++) {
    const ph = (t / 1100 + i / 5) % 1;
    const sx = x + Math.sin(i * 2.3 + t / 420) * 5 * k;
    const sy = y - 4 * k - ph * H * 0.9;
    ctx.globalAlpha = Math.max(0, 1 - ph);
    ctx.fillStyle = i % 2 ? GLOW_SUB : GLOW_MAIN;
    diamond(ctx, sx, sy, (2.6 - ph * 1.4) * k);
  }
  ctx.restore();
}
