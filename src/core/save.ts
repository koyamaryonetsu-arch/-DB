// セーブ/ロード: バージョン + 移行 + 簡易改ざん検知 + エクスポート/インポート

import type { RunState } from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SALT = 'astral-ring-v1';

/** djb2 ハッシュによる簡易チェックサム */
export function checksum(payload: string): string {
  let h = 5381;
  const s = payload + SALT;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export interface SaveEnvelope {
  version: number;
  sum: string;
  data: RunState;
}

export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/** version n → n+1 の移行関数（テストから登録可能なよう export） */
export const MIGRATIONS: Record<number, Migration> = {
  // 例: 1: (d) => ({ ...d, newField: 0 })
};

export function serializeSave(state: RunState, version: number): string {
  const payload = JSON.stringify(state);
  const env: SaveEnvelope = { version, sum: checksum(payload), data: state };
  return JSON.stringify(env);
}

export interface LoadResult {
  ok: boolean;
  state?: RunState;
  error?: string;
}

export function deserializeSave(raw: string, currentVersion: number): LoadResult {
  let env: SaveEnvelope;
  try {
    env = JSON.parse(raw) as SaveEnvelope;
  } catch {
    return { ok: false, error: 'セーブデータを読み取れません。' };
  }
  if (!env || typeof env !== 'object' || !env.data || typeof env.version !== 'number') {
    return { ok: false, error: 'セーブデータの形式が不正です。' };
  }
  const payload = JSON.stringify(env.data);
  if (checksum(payload) !== env.sum) {
    return { ok: false, error: 'セーブデータが破損しています。' };
  }
  let data = env.data as unknown as Record<string, unknown>;
  let v = env.version;
  while (v < currentVersion) {
    const mig = MIGRATIONS[v];
    if (!mig) return { ok: false, error: `旧バージョン(${v})の移行に対応していません。` };
    data = mig(data);
    v++;
  }
  const state = data as unknown as RunState;
  state.version = currentVersion;
  return { ok: true, state };
}

export const SAVE_SLOTS = ['slot1', 'slot2', 'slot3'] as const;
export const AUTO_SLOT = 'auto';

export function slotKey(baseKey: string, slot: string): string {
  return `${baseKey}:${slot}`;
}

export function saveToSlot(
  storage: StorageLike,
  baseKey: string,
  slot: string,
  state: RunState,
  version: number
): void {
  storage.setItem(slotKey(baseKey, slot), serializeSave(state, version));
}

export function loadFromSlot(
  storage: StorageLike,
  baseKey: string,
  slot: string,
  version: number
): LoadResult {
  const raw = storage.getItem(slotKey(baseKey, slot));
  if (raw === null) return { ok: false, error: 'データがありません。' };
  return deserializeSave(raw, version);
}

export interface SlotSummary {
  slot: string;
  exists: boolean;
  name?: string;
  level?: number;
  mapName?: string;
  playSeconds?: number;
  corrupt?: boolean;
}

export function summarizeSlot(
  storage: StorageLike,
  baseKey: string,
  slot: string,
  version: number,
  mapNameOf: (id: string) => string
): SlotSummary {
  const raw = storage.getItem(slotKey(baseKey, slot));
  if (raw === null) return { slot, exists: false };
  const res = deserializeSave(raw, version);
  if (!res.ok || !res.state) return { slot, exists: true, corrupt: true };
  const hero = res.state.party[0];
  return {
    slot,
    exists: true,
    name: hero?.name,
    level: hero?.level,
    mapName: mapNameOf(res.state.mapId),
    playSeconds: res.state.playSeconds,
  };
}

export function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}
