import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';

describe('シード付き乱数', () => {
  it('同じシードは同じ列を生む', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('異なるシードは異なる列を生む', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('range は両端を含む', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rng.range(1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('weighted は重みに従って選ぶ', () => {
    const rng = createRng(9);
    let heavy = 0;
    for (let i = 0; i < 1000; i++) {
      const v = rng.weighted([
        { value: 'a', weight: 9 },
        { value: 'b', weight: 1 },
      ]);
      if (v === 'a') heavy++;
    }
    expect(heavy).toBeGreaterThan(800);
  });
});
