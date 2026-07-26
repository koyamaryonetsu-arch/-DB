import { describe, expect, it } from 'vitest';
import {
  gainJobExp,
  jobExpMultiplier,
  jobExpToNext,
  rankForJobExp,
  rankName,
  RANK_THRESHOLDS,
} from '../core/mastery';
import { data, testHero } from './helpers';

describe('職業熟練度', () => {
  it('ランク境界が正しい', () => {
    expect(rankForJobExp(0)).toBe(1);
    expect(rankForJobExp(RANK_THRESHOLDS[1])).toBe(2);
    expect(rankForJobExp(RANK_THRESHOLDS[7])).toBe(8);
    expect(rankForJobExp(999999)).toBe(8);
    expect(rankName(1)).toBe('見習い');
    expect(rankName(8)).toBe('極星');
  });

  it('弱すぎる敵からは職業経験値が減る/入らない', () => {
    expect(jobExpMultiplier(3, 3)).toBe(1);
    expect(jobExpMultiplier(8, 3)).toBe(0.5);
    expect(jobExpMultiplier(11, 3)).toBe(0);
  });

  it('職業経験値でランクアップし技を習得する', () => {
    const hero = testHero();
    const cls = data.classes.get('kankenshi')!;
    expect(hero.learned).toContain('kanjin'); // ランク1技は初期習得
    const result = gainJobExp(hero, cls, RANK_THRESHOLDS[1], 5, data);
    expect(result.toRank).toBe(2);
    expect(hero.learned).toContain('ryusei_zuki');
    expect(result.learnedSkills).toContain('ryusei_zuki');
    // ランク2でパッシブ1つ目も解放
    expect(hero.learned).toContain('kan_no_kago');
  });

  it('jobExpToNext は残り必要量を返す', () => {
    expect(jobExpToNext(0)).toBe(RANK_THRESHOLDS[1]);
    expect(jobExpToNext(RANK_THRESHOLDS[7])).toBeNull();
  });

  it('レベル差ペナルティが実際の加算に反映される', () => {
    const hero = testHero();
    hero.level = 12;
    const cls = data.classes.get('kankenshi')!;
    const result = gainJobExp(hero, cls, 100, 2, data); // 差10 → 0倍
    expect(result.gained).toBe(0);
    expect(hero.mastery.kankenshi).toBe(0);
  });
});
