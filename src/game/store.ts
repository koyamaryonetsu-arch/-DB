// ゲーム全体で共有する状態（データ・進行状態・設定・RNG）

import { loadGameData } from '../core/dataload';
import type { GameData } from '../core/registry';
import type { RunState, Settings } from '../core/types';
import { createRng, randomSeed, type Rng } from '../core/rng';
import { AUTO_SLOT, saveToSlot, loadFromSlot, type LoadResult } from '../core/save';

export const DEFAULT_KEYMAP: Record<string, string[]> = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'KeyZ', 'Space'],
  cancel: ['Escape', 'KeyX'],
  menu: ['KeyC'],
  dash: ['ShiftLeft', 'ShiftRight'],
};

export function defaultSettings(): Settings {
  return {
    textSpeed: 2,
    battleSpeed: 2,
    bgmVol: 0.5,
    seVol: 0.6,
    alwaysDash: false,
    screenShake: true,
    flashReduce: false,
    difficulty: 'normal',
    keymap: JSON.parse(JSON.stringify(DEFAULT_KEYMAP)),
  };
}

class Store {
  data: GameData = loadGameData();
  state: RunState | null = null;
  rng: Rng = createRng(randomSeed());
  settings: Settings = this.loadSettings();

  get config() {
    return this.data.config;
  }

  /** 進行状態を必須で取得（未開始ならエラー） */
  get run(): RunState {
    if (!this.state) throw new Error('ゲームが開始されていません');
    return this.state;
  }

  startRun(state: RunState): void {
    this.state = state;
    this.rng = createRng(state.rngSeed >>> 0);
  }

  loadSettings(): Settings {
    const base = defaultSettings();
    try {
      const raw = globalThis.localStorage?.getItem(this.data.config.settingsKey);
      if (!raw) return base;
      const parsed = JSON.parse(raw) as Partial<Settings>;
      const merged = { ...base, ...parsed };
      merged.keymap = { ...base.keymap, ...(parsed.keymap ?? {}) };
      return merged;
    } catch {
      return base;
    }
  }

  saveSettings(): void {
    try {
      globalThis.localStorage?.setItem(this.data.config.settingsKey, JSON.stringify(this.settings));
    } catch {}
  }

  autosave(): void {
    if (!this.state) return;
    this.state.rngSeed = this.rng.getSeed();
    try {
      saveToSlot(globalThis.localStorage, this.config.saveKey, AUTO_SLOT, this.state, this.config.saveVersion);
    } catch {}
  }

  saveGame(slot: string): boolean {
    if (!this.state) return false;
    this.state.rngSeed = this.rng.getSeed();
    try {
      saveToSlot(globalThis.localStorage, this.config.saveKey, slot, this.state, this.config.saveVersion);
      return true;
    } catch {
      return false;
    }
  }

  loadGame(slot: string): LoadResult {
    try {
      const res = loadFromSlot(globalThis.localStorage, this.config.saveKey, slot, this.config.saveVersion);
      if (res.ok && res.state) this.startRun(res.state);
      return res;
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  hasAnySave(): boolean {
    try {
      const slots = ['slot1', 'slot2', 'slot3', AUTO_SLOT];
      return slots.some(
        (s) => globalThis.localStorage?.getItem(`${this.config.saveKey}:${s}`) !== null
      );
    } catch {
      return false;
    }
  }
}

export const G = new Store();
