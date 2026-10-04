// 天気: 雪・ふぶき・火の粉・湯けむり（第3章）・砂ぼこり・砂嵐（第4章）を フィールドの 上に かさねて かく（2D・2.5D とも）
// マップの weather（'snow' 'blizzard' 'embers' 'steam' 'sand' 'sandstorm'）か weatherAt(x, y) で きまる
// haze … かすみの こさ / hazeRgb … かすみの 色（ないときは 白っぽい 青）/ clear … まんなか（自分の まわり）だけ かすみを うすく
// streak … つぶを 風の むきに のばす ながさ / puffs … 大きな 砂けむりの かず / gustAmp … 強い 風の 強さ
const KINDS = {
  // しんしんと ふる 雪
  snow: { n: 70, vy: [12, 24], wind: 6, sway: 6, size: [1, 2], cols: ['#ffffff', '#eef4ff', '#dce8ff'], haze: 0 },
  // ふぶき（ななめに はげしく。ときどき 強い 風）
  blizzard: { n: 240, vy: [46, 84], wind: 70, sway: 10, size: [1, 2], cols: ['#ffffff', '#f0f6ff', '#d8e6ff'], haze: 0.16, gust: true },
  // 火の山の 火の粉（下から 上へ）
  embers: { n: 36, vy: [-22, -9], wind: 4, sway: 8, size: [1, 2], cols: ['#ffb040', '#ff7a2a', '#ffe08a'], haze: 0, flicker: true },
  // 温泉の 湯けむり（ふわふわ 上へ。うっすら 白く かすむ）
  steam: { n: 40, vy: [-15, -6], wind: 2, sway: 12, size: [2, 3], cols: ['rgba(255,255,255,0.55)', 'rgba(255,250,240,0.45)', 'rgba(236,242,255,0.5)'], haze: 0.05 },
  // 第4章: 砂ぼこり（西から 東へ ながれる 細かい 砂。ほんのり あたたかく かすむ）
  sand: {
    n: 56, vy: [-4, 6], wind: 44, sway: 4, size: [1, 1], cols: ['#f6e0aa', '#e8c88e', '#fff2d0', '#d8b274'],
    haze: 0.05, hazeRgb: '255, 212, 148', streak: 2,
  },
  // 砂嵐（よこなぐりの こい 砂と 強い 風。黄土色に かすむが、まんなか（自分の まわり）は 見える）
  sandstorm: {
    n: 330, vy: [-10, 14], wind: 190, sway: 12, size: [1, 2], cols: ['#ecc88e', '#d8aa6a', '#c08a4e', '#f8e2b4', '#a87644'],
    haze: 0.26, hazeRgb: '188, 130, 70', gust: true, gustAmp: 160, streak: 5, clear: 0.62, puffs: 9,
  },
};
const HAZE_RGB = '232, 240, 255';

const rnd = (a, b) => a + Math.random() * (b - a);

export class Weather {
  constructor() {
    this.parts = [];
    this.puffs = [];
    this.kind = null;
    this.t = 0;
    this.last = null;
    this.gust = 0;
  }

  reset(cfg, vw, vh) {
    this.parts = [];
    for (let i = 0; i < cfg.n; i++) {
      this.parts.push({
        x: rnd(0, vw), y: rnd(0, vh), z: rnd(0.55, 1.25), vy: rnd(cfg.vy[0], cfg.vy[1]),
        s: Math.random() < 0.3 ? cfg.size[1] : cfg.size[0], c: cfg.cols[Math.floor(Math.random() * cfg.cols.length)], ph: rnd(0, 6.28),
      });
    }
    this.puffs = [];
    for (let i = 0; i < (cfg.puffs || 0); i++) {
      this.puffs.push({ x: rnd(0, vw), y: rnd(0, vh), r: rnd(14, 34), z: rnd(0.7, 1.3), ph: rnd(0, 6.28) });
    }
  }

  // ctx … フィールドの キャンバス（せかいの ドットの 大きさで かく）/ camX, camY … カメラ（つぶを 地面と いっしょに 動かす）
  // night … 夜の くらさ（0〜0.5。第4章の 砂の かすみは 夜は うすく。ほかの 天気は いままで どおり）
  draw(ctx, vw, vh, dt, kind, camX, camY, night = 0) {
    const cfg = KINDS[kind];
    if (!cfg) {
      if (this.kind) { this.parts = []; this.puffs = []; this.kind = null; }
      return;
    }
    if (this.kind !== kind || this.vw !== vw || this.vh !== vh) {
      this.kind = kind;
      this.vw = vw;
      this.vh = vh;
      this.reset(cfg, vw, vh);
      this.last = null;
    }
    const sec = Math.min(0.05, dt / 1000);
    this.t += sec;
    // カメラが うごいた ぶん（大きく とんだ ときは リセット）
    let dcx = 0, dcy = 0;
    if (this.last) {
      dcx = camX - this.last.x;
      dcy = camY - this.last.y;
      if (Math.abs(dcx) > 80 || Math.abs(dcy) > 80) { dcx = 0; dcy = 0; }
    }
    this.last = { x: camX, y: camY };
    // つよい 風（ふぶき・砂嵐）
    const amp = cfg.gustAmp || 90;
    if (cfg.gust) {
      const g = Math.max(0, Math.sin(this.t * 0.7) * Math.sin(this.t * 0.23 + 1)) * amp;
      this.gust += (g - this.gust) * Math.min(1, sec * 2);
    }
    const dim = cfg.hazeRgb ? 1 - Math.min(0.5, night) * 1.2 : 1;
    if (cfg.haze) {
      const rgb = cfg.hazeRgb || HAZE_RGB;
      const a = (cfg.haze + this.gust / (amp * 10)) * dim;
      if (cfg.clear) {
        // まんなか（自分の まわり）は うすく、はしへ いくほど こく
        const cx = vw / 2, cy = vh / 2;
        const g = ctx.createRadialGradient(cx, cy, Math.min(vw, vh) * 0.16, cx, cy, Math.hypot(vw, vh) * 0.56);
        g.addColorStop(0, `rgba(${rgb}, ${(a * (1 - cfg.clear)).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb}, ${Math.min(0.62, a * 1.5).toFixed(3)})`);
        ctx.fillStyle = g;
      } else ctx.fillStyle = `rgba(${rgb}, ${a})`;
      ctx.fillRect(0, 0, vw, vh);
    }
    const wind = cfg.wind + this.gust;
    // 大きな 砂けむり（うすい かたまりが 風で ながれる）
    if (this.puffs.length) {
      const rgb = cfg.hazeRgb || HAZE_RGB;
      for (const p of this.puffs) {
        p.x += wind * 1.2 * p.z * sec - dcx * p.z;
        p.y += Math.sin(this.t * 0.8 + p.ph) * 6 * sec - dcy * p.z;
        if (p.x - p.r > vw) { p.x = -p.r; p.y = rnd(0, vh); }
        else if (p.x + p.r < 0) p.x = vw + p.r;
        if (p.y < -p.r) p.y += vh + p.r * 2;
        else if (p.y > vh + p.r) p.y -= vh + p.r * 2;
        for (const k of [1, 0.62]) {
          ctx.fillStyle = `rgba(${rgb}, ${(0.07 * dim).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * k * 1.6, p.r * k * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // 夜は 砂の つぶも すこし くらく
    if (dim < 1) ctx.globalAlpha = 0.45 + dim * 0.55;
    for (const p of this.parts) {
      p.x += (wind * p.z + Math.sin(this.t * 1.7 + p.ph) * cfg.sway) * sec - dcx * p.z;
      p.y += p.vy * p.z * sec - dcy * p.z;
      if (p.x < -4) p.x += vw + 8;
      else if (p.x > vw + 4) p.x -= vw + 8;
      if (p.y < -4) p.y += vh + 8;
      else if (p.y > vh + 4) p.y -= vh + 8;
      if (cfg.flicker && Math.sin(this.t * 9 + p.ph * 3) < -0.6) continue;
      ctx.fillStyle = p.c;
      if (cfg.streak) {
        // 砂は 風の むきに のびた すじ（強い 風ほど ながい）
        const len = Math.max(1, Math.round(cfg.streak * p.z * (1 + this.gust / 200)));
        ctx.fillRect(Math.round(p.x) - len, Math.round(p.y), len + p.s - 1, p.s);
        continue;
      }
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      // ふぶきは すこし ながく（すじに みえる）
      if (kind === 'blizzard' && p.z > 1) ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 1, 1);
    }
    if (dim < 1) ctx.globalAlpha = 1;
  }
}

export const WEATHER_KINDS = Object.keys(KINDS);
// かすみの 色（テスト・ほかの 絵で つかう）
export const hazeOf = (kind) => (KINDS[kind]?.haze ? KINDS[kind].hazeRgb || HAZE_RGB : null);
