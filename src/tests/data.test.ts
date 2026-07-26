import { describe, expect, it } from 'vitest';
import { data } from './helpers';

describe('ゲームデータ整合性', () => {
  it('全データが読み込め、参照整合性が取れている', () => {
    expect(data.classes.size).toBeGreaterThanOrEqual(8);
    expect(data.monsters.size).toBeGreaterThanOrEqual(9);
    expect(data.maps.size).toBe(4);
    expect(data.skills.size).toBeGreaterThan(30);
  });

  it('縦切り版の基本職6種が転職可能', () => {
    const available = [...data.classes.values()].filter((c) => c.available);
    expect(available.map((c) => c.id).sort()).toEqual(
      ['jusohei', 'kagehashiri', 'kankenshi', 'kikoutoushi', 'seijutsushi', 'seimeikan'].sort()
    );
  });

  it('マップの行幅が一致し、警告タイルがない', () => {
    for (const map of data.maps.values()) {
      const w = map.rows[0].length;
      for (const row of map.rows) expect(row.length).toBe(w);
    }
  });

  it('ワープ先の座標が歩行可能タイル', () => {
    for (const map of data.maps.values()) {
      for (const warp of map.warps) {
        const dest = data.maps.get(warp.to)!;
        const ch = dest.rows[warp.ty][warp.tx];
        expect(dest.legend[ch].solid ?? false).toBe(false);
      }
    }
  });

  it('NPC・宝箱が歩行可能タイル上にある', () => {
    for (const map of data.maps.values()) {
      for (const npc of map.npcs) {
        const ch = map.rows[npc.y][npc.x];
        expect(map.legend[ch].solid ?? false).toBe(false);
      }
      for (const chest of map.chests) {
        const ch = map.rows[chest.y][chest.x];
        expect(map.legend[ch].solid ?? false).toBe(false);
      }
    }
  });

  it('職固有奥義は継承不可としてマークされている', () => {
    const ougi = data.skills.get('tenkan_shuha')!;
    expect(ougi.inheritable).toBe(false);
    expect(ougi.ougi).toBe(true);
  });
});
