import { describe, expect, it } from 'vitest';
import {
  AUTO_SLOT,
  MIGRATIONS,
  deserializeSave,
  formatPlayTime,
  loadFromSlot,
  saveToSlot,
  serializeSave,
  summarizeSlot,
  type StorageLike,
} from '../core/save';
import { data, testState } from './helpers';

function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

describe('セーブ・ロード', () => {
  it('往復で状態が一致する', () => {
    const state = testState();
    state.flags.mainStep = 2;
    state.inventory.gold = 999;
    const raw = serializeSave(state, data.config.saveVersion);
    const result = deserializeSave(raw, data.config.saveVersion);
    expect(result.ok).toBe(true);
    expect(result.state).toEqual(state);
  });

  it('改ざんを検知する', () => {
    const state = testState();
    const raw = serializeSave(state, data.config.saveVersion);
    const tampered = raw.replace('"gold":120', '"gold":99999');
    const result = deserializeSave(tampered, data.config.saveVersion);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('破損');
  });

  it('壊れたJSONを安全に拒否する', () => {
    const result = deserializeSave('{not json', data.config.saveVersion);
    expect(result.ok).toBe(false);
  });

  it('スロット保存・読込・要約が機能する', () => {
    const storage = memoryStorage();
    const state = testState();
    saveToSlot(storage, 'test', 'slot1', state, data.config.saveVersion);
    const loaded = loadFromSlot(storage, 'test', 'slot1', data.config.saveVersion);
    expect(loaded.ok).toBe(true);
    expect(loaded.state!.party[0].name).toBe('テスト');
    const summary = summarizeSlot(storage, 'test', 'slot1', data.config.saveVersion, (id) =>
      data.maps.get(id)?.name ?? id
    );
    expect(summary.exists).toBe(true);
    expect(summary.name).toBe('テスト');
    expect(summary.mapName).toBe('ルミナ村');
    const empty = summarizeSlot(storage, 'test', AUTO_SLOT, data.config.saveVersion, (id) => id);
    expect(empty.exists).toBe(false);
  });

  it('旧バージョンのデータ移行が動く', () => {
    const state = testState();
    const raw = serializeSave(state, 0); // 旧バージョンとして保存
    MIGRATIONS[0] = (d) => ({ ...d, migrated: true });
    try {
      const result = deserializeSave(raw, 1);
      expect(result.ok).toBe(true);
      expect((result.state as unknown as Record<string, unknown>).migrated).toBe(true);
      expect(result.state!.version).toBe(1);
    } finally {
      delete MIGRATIONS[0];
    }
  });

  it('未知の旧バージョンはエラーになる', () => {
    const state = testState();
    const raw = serializeSave(state, 0);
    const result = deserializeSave(raw, 1);
    expect(result.ok).toBe(false);
  });

  it('エクスポート文字列はインポートで復元できる', () => {
    const state = testState();
    const exported = serializeSave(state, data.config.saveVersion);
    const imported = deserializeSave(exported, data.config.saveVersion);
    expect(imported.ok).toBe(true);
    expect(imported.state!.rngSeed).toBe(state.rngSeed);
  });

  it('プレイ時間の表示形式', () => {
    expect(formatPlayTime(0)).toBe('0:00');
    expect(formatPlayTime(3660)).toBe('1:01');
  });
});
