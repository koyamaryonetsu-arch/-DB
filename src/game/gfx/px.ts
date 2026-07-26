// 小さなピクセルキャンバス描画API。16bit風の輪郭付きスプライトを合成する。

export class Px {
  readonly w: number;
  readonly h: number;
  readonly grid: (string | null)[][];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.grid = Array.from({ length: h }, () => Array.from({ length: w }, () => null));
  }

  set(x: number, y: number, c: string): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.grid[Math.floor(y)][Math.floor(x)] = c;
  }

  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.grid[y][x];
  }

  rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string): void {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, c: string, thick = 1): void {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + ((x2 - x1) * i) / steps);
      const y = Math.round(y1 + ((y2 - y1) * i) / steps);
      for (let t = 0; t < thick; t++) {
        this.set(x + (t % 2 === 0 ? Math.floor(t / 2) : -Math.ceil(t / 2)), y, c);
      }
    }
  }

  /** 不透明領域の縁に輪郭色を引く */
  outline(c: string): void {
    const marks: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.grid[y][x] !== null) continue;
        const near =
          this.get(x - 1, y) !== null ||
          this.get(x + 1, y) !== null ||
          this.get(x, y - 1) !== null ||
          this.get(x, y + 1) !== null;
        if (near) marks.push([x, y]);
      }
    }
    for (const [x, y] of marks) this.set(x, y, c);
  }

  /** 決定的な擬似ノイズ点描（seedで固定） */
  speckle(x: number, y: number, w: number, h: number, c: string, density: number, seed: number): void {
    let s = seed >>> 0;
    const rand = () => {
      s = (s * 1103515245 + 12345) >>> 0;
      return (s >>> 16) / 65536;
    };
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (rand() < density && this.get(xx, yy) !== null) this.set(xx, yy, c);
      }
    }
  }

  drawTo(ctx: CanvasRenderingContext2D, ox: number, oy: number, scale = 1): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.grid[y][x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }
}
