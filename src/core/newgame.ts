// ニューゲーム: 初期状態の構築と仲間加入

import type { GameData } from './registry';
import type { PartyMember, PersonalityKey, RunState } from './types';
import { derivedStats } from './stats';
import { syncLearnedForClass } from './mastery';

export interface NewGameOptions {
  name: string;
  gender: 'a' | 'b';
  appearance: number;
  seed: number;
}

export function createMember(
  actorId: string,
  data: GameData,
  opts?: { name?: string; gender?: 'a' | 'b'; appearance?: number }
): PartyMember {
  const actor = data.actors.get(actorId);
  if (!actor) throw new Error(`未定義のアクター: ${actorId}`);
  const personality: Record<PersonalityKey, number> = {
    courage: 5,
    mercy: 5,
    wisdom: 5,
    freedom: 5,
    order: 5,
    ambition: 5,
  };
  const member: PartyMember = {
    actorId,
    name: opts?.name ?? actor.name,
    gender: opts?.gender ?? 'a',
    appearance: opts?.appearance ?? 0,
    level: actor.joinLevel,
    exp: 0,
    classId: actor.defaultClassId,
    mastery: { [actor.defaultClassId]: 0 },
    learned: [],
    loadout: [],
    passives: [],
    baseStats: { ...actor.baseStats },
    personality,
    hp: 1,
    mp: 0,
    gauge: 0,
    row: 'front',
    equipment: { ...actor.startEquipment },
  };
  // 加入レベル分の成長を初期値へ織り込み（決定的: 中央値）
  for (let l = 1; l < actor.joinLevel; l++) {
    for (const [k, range] of Object.entries(actor.growth)) {
      const key = k as keyof typeof member.baseStats;
      member.baseStats[key] += Math.floor((range[0] + range[1]) / 2);
    }
  }
  // 加入レベル相当の経験値
  member.exp = levelBaseExp(actor.joinLevel);
  const cls = data.classes.get(actor.defaultClassId);
  if (cls) syncLearnedForClass(member, cls, data);
  const ds = derivedStats(member, data);
  member.hp = ds.maxHp;
  member.mp = ds.maxMp;
  return member;
}

function levelBaseExp(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(6 * Math.pow(level - 1, 2.45));
}

export function buildNewGame(opts: NewGameOptions, data: GameData): RunState {
  const hero = createMember('hero', data, {
    name: opts.name,
    gender: opts.gender,
    appearance: opts.appearance,
  });
  const state: RunState = {
    version: data.config.saveVersion,
    party: [hero],
    inventory: {
      items: { iyashi_ba: 4, gedoku_mi: 2 },
      equips: {},
      gold: 120,
    },
    flags: { mainStep: 0 },
    chests: {},
    mapId: 'village',
    pos: { x: 12, y: 15, dir: 'down' },
    steps: 0,
    timeIndex: 0,
    playSeconds: 0,
    zukan: [],
    rngSeed: opts.seed,
  };
  return state;
}

/** 仲間加入（重複加入は無視） */
export function joinMember(state: RunState, actorId: string, data: GameData): PartyMember | null {
  if (state.party.some((m) => m.actorId === actorId)) return null;
  const member = createMember(actorId, data);
  state.party.push(member);
  return member;
}
