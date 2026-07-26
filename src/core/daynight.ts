// 昼夜サイクル: フィールドの歩数で時間が進む

import type { RunState } from './types';

export const TIME_NAMES = ['朝', '昼', '夕', '夜'];
export const STEPS_PER_SEGMENT = 110;

/** 歩数を加算し、時間帯が変わったら新しい timeIndex を返す */
export function advanceSteps(state: RunState, n: number): number | null {
  const before = state.timeIndex;
  state.steps += n;
  const seg = Math.floor(state.steps / STEPS_PER_SEGMENT) % 4;
  if (seg !== before) {
    state.timeIndex = seg;
    return seg;
  }
  return null;
}

/** 宿に泊まる: 朝へ進める */
export function restToMorning(state: RunState): void {
  const currentSeg = Math.floor(state.steps / STEPS_PER_SEGMENT);
  const mod = currentSeg % 4;
  const add = mod === 0 ? 4 : 4 - mod;
  state.steps = (currentSeg + add) * STEPS_PER_SEGMENT;
  state.timeIndex = 0;
}

export function isNight(state: RunState): boolean {
  return state.timeIndex === 3;
}
