import { describe, expect, it } from 'vitest';
import {
  MAX_INHERITED,
  MAX_LOADOUT,
  canEquipSkill,
  changeClass,
  equipSkill,
  meetsUnlockConditions,
  normalizeLoadout,
} from '../core/skills';
import { clampVitals, derivedStats } from '../core/stats';
import { data, testHero } from './helpers';

describe('技セットの制約', () => {
  it('技は最大8個まで', () => {
    const hero = testHero();
    // 現職の技を大量に習得させる
    hero.learned = [
      'kanjin', 'ryusei_zuki', 'shugo_enjin', 'seimyaku_giri', 'tenkan_shuha',
      'teppeki_shisei', 'tate_uchi', 'shinkyaku', 'hako_sho', 'kagenui',
    ];
    hero.loadout = [];
    let equipped = 0;
    for (const sid of hero.learned) {
      if (equipSkill(hero, sid, data).ok) equipped++;
    }
    expect(hero.loadout.length).toBeLessThanOrEqual(MAX_LOADOUT);
    expect(equipped).toBeLessThanOrEqual(MAX_LOADOUT);
  });

  it('継承技（他職の技）は最大4枠', () => {
    const hero = testHero(); // 現職: 環剣士
    hero.learned = [
      'kanjin',
      'teppeki_shisei', 'tate_uchi', // 重装兵
      'shinkyaku', 'hako_sho', // 気鋼闘士
      'kagenui', // 影走り
    ];
    hero.loadout = ['kanjin'];
    expect(equipSkill(hero, 'teppeki_shisei', data).ok).toBe(true);
    expect(equipSkill(hero, 'tate_uchi', data).ok).toBe(true);
    expect(equipSkill(hero, 'shinkyaku', data).ok).toBe(true);
    expect(equipSkill(hero, 'hako_sho', data).ok).toBe(true);
    const fifth = equipSkill(hero, 'kagenui', data);
    expect(fifth.ok).toBe(false);
    expect(hero.loadout.filter((s) => s !== 'kanjin').length).toBe(MAX_INHERITED);
  });

  it('他職の奥義（継承不可技）は装備できない', () => {
    const hero = testHero();
    hero.classId = 'kikoutoushi'; // 拳士に転職した状態
    hero.mastery.kikoutoushi = 0;
    hero.learned = ['kanjin', 'tenkan_shuha', 'shinkyaku'];
    hero.loadout = [];
    expect(equipSkill(hero, 'shinkyaku', data).ok).toBe(true);
    expect(equipSkill(hero, 'kanjin', data).ok).toBe(true); // 通常技は継承可
    const ougi = canEquipSkill(hero, 'tenkan_shuha', data);
    expect(ougi.ok).toBe(false); // 環剣士奥義は他職で使えない
  });

  it('normalizeLoadout が制約違反を自動修復する', () => {
    const hero = testHero();
    hero.classId = 'seijutsushi';
    hero.mastery.seijutsushi = 0;
    hero.learned = ['kanjin', 'ryusei_zuki', 'shugo_enjin', 'seimyaku_giri', 'tenkan_shuha', 'luxia'];
    hero.loadout = ['kanjin', 'ryusei_zuki', 'shugo_enjin', 'seimyaku_giri', 'tenkan_shuha', 'luxia'];
    normalizeLoadout(hero, data);
    expect(hero.loadout).not.toContain('tenkan_shuha'); // 他職奥義除去
    const inherited = hero.loadout.filter((s) => s !== 'luxia');
    expect(inherited.length).toBeLessThanOrEqual(MAX_INHERITED);
  });
});

describe('転職', () => {
  it('転職条件: ランク不足なら不可、満たせば可', () => {
    const hero = testHero();
    const seikenshou = data.classes.get('seikenshou')!;
    expect(meetsUnlockConditions(hero, seikenshou, {})).toBe(false);
    hero.mastery.kankenshi = 340; // ランク5
    hero.mastery.seijutsushi = 100; // ランク3
    expect(meetsUnlockConditions(hero, seikenshou, {})).toBe(true);
  });

  it('転職でレベルは維持され、能力は職業補正で変わる', () => {
    const hero = testHero();
    const beforeLevel = hero.level;
    const beforeStats = derivedStats(hero, data);
    changeClass(hero, 'seijutsushi', data);
    clampVitals(hero, data);
    const afterStats = derivedStats(hero, data);
    expect(hero.level).toBe(beforeLevel);
    expect(hero.classId).toBe('seijutsushi');
    expect(afterStats.magic).toBeGreaterThan(beforeStats.magic);
    expect(afterStats.attack).toBeLessThan(beforeStats.attack);
    expect(hero.hp).toBeLessThanOrEqual(afterStats.maxHp);
  });

  it('転職後も習得済みの継承可能技は残る', () => {
    const hero = testHero();
    expect(hero.learned).toContain('kanjin');
    changeClass(hero, 'jusohei', data);
    expect(hero.learned).toContain('kanjin');
    expect(hero.learned).toContain('teppeki_shisei'); // 新職ランク1技を習得
  });
});
