// シード指定可能な決定的乱数（mulberry32）

export interface Rng {
  next(): number; // [0, 1)
  int(maxExclusive: number): number;
  range(min: number, max: number): number; // 整数 [min, max]
  chance(p: number): boolean;
  pick<T>(arr: T[]): T;
  weighted<T>(entries: { value: T; weight: number }[]): T;
  getSeed(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    range: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted: (entries) => {
      const total = entries.reduce((a, e) => a + e.weight, 0);
      let r = next() * total;
      for (const e of entries) {
        r -= e.weight;
        if (r <= 0) return e.value;
      }
      return entries[entries.length - 1].value;
    },
    getSeed: () => s,
  };
}

/** 非決定でよい場面用のシード生成 */
export function randomSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}
