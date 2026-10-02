// 天気（第3章）: 雪・ふぶき・火の粉を フィールドの 上に かさねて かく（2D・2.5D とも）
// マップの weather（'snow' 'blizzard' 'embers'）か weatherAt(x, y) で きまる
const KINDS = {
  // しんしんと ふる 雪
  snow: { n: 70, vy: [12, 24], wind: 6, sway: 6, size: [1, 2], cols: ['#ffffff', '#eef4ff', '#dce8ff'], haze: 0 },
  // ふぶき（ななめに はげしく。ときどき 強い 風）
  blizzard: { n: 240, vy: [46, 84], wind: 70, sway: 10, size: [1, 2], cols: ['#ffffff', '#f0f6ff', '#d8e6ff'], haze: 0.16, gust: true },
  // 火の山の 火の粉（下から 上へ）
  embers: { n: 36, vy: [-22, -9], wind: 4, sway: 8, size: [1, 2], cols: ['#ffb040', '#ff7a2a', '#ffe08a'], haze: 0, flicker: true },
};

const rnd = (a, b) => a + Math.random() * (b - a);

export class Weather {
  constructor() {
    this.parts = [];
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
  }

  // ctx … フィールドの キャンバス（せかいの ドットの 大きさで かく）/ camX, camY … カメラ（つぶを 地面と いっしょに 動かす）
  draw(ctx, vw, vh, dt, kind, camX, camY) {
    const cfg = KINDS[kind];
    if (!cfg) {
      if (this.kind) { this.parts = []; this.kind = null; }
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
    // つよい 風（ふぶき）
    if (cfg.gust) {
      const g = Math.max(0, Math.sin(this.t * 0.7) * Math.sin(this.t * 0.23 + 1)) * 90;
      this.gust += (g - this.gust) * Math.min(1, sec * 2);
    }
    if (cfg.haze) {
      ctx.fillStyle = `rgba(232, 240, 255, ${cfg.haze + this.gust / 900})`;
      ctx.fillRect(0, 0, vw, vh);
    }
    for (const p of this.parts) {
      const wind = cfg.wind + this.gust;
      p.x += (wind * p.z + Math.sin(this.t * 1.7 + p.ph) * cfg.sway) * sec - dcx * p.z;
      p.y += p.vy * p.z * sec - dcy * p.z;
      if (p.x < -4) p.x += vw + 8;
      else if (p.x > vw + 4) p.x -= vw + 8;
      if (p.y < -4) p.y += vh + 8;
      else if (p.y > vh + 4) p.y -= vh + 8;
      if (cfg.flicker && Math.sin(this.t * 9 + p.ph * 3) < -0.6) continue;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      // ふぶきは すこし ながく（すじに みえる）
      if (kind === 'blizzard' && p.z > 1) ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 1, 1);
    }
  }
}

export const WEATHER_KINDS = Object.keys(KINDS);
