// JSON データの読み込み口。ビルド時にバンドルされる。

import type { RawGameData } from './registry';
import { buildGameData, type GameData } from './registry';

import configJson from '../data/gameConfig.json';
import elementsJson from '../data/elements.json';
import statusesJson from '../data/statusEffects.json';
import classesJson from '../data/classes.json';
import skillsJson from '../data/skills.json';
import spellsJson from '../data/spells.json';
import monstersJson from '../data/monsters.json';
import itemsJson from '../data/items.json';
import equipmentJson from '../data/equipment.json';
import encountersJson from '../data/encounters.json';
import mapsJson from '../data/maps.json';
import actorsJson from '../data/actors.json';
import dialoguesJson from '../data/dialogues.json';
import questsJson from '../data/quests.json';

let cached: GameData | null = null;

export function loadGameData(): GameData {
  if (cached) return cached;
  const raw = {
    config: configJson,
    elements: elementsJson,
    statuses: statusesJson,
    classes: classesJson,
    skills: skillsJson,
    spells: spellsJson,
    monsters: monstersJson,
    items: itemsJson,
    equipment: equipmentJson,
    encounters: encountersJson,
    maps: mapsJson,
    actors: actorsJson,
    dialogues: dialoguesJson,
    quests: questsJson,
  } as unknown as RawGameData;
  cached = buildGameData(raw);
  return cached;
}
