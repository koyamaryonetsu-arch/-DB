// ゲームデータレジストリ: JSON を型付きで保持し、参照整合性を検証する

import type {
  ActorDefinition,
  ClassDefinition,
  DialogueDefinition,
  ElementDefinition,
  EncounterZoneDef,
  EquipmentDefinition,
  GameConfig,
  ItemDefinition,
  MapDefinition,
  MonsterDefinition,
  QuestDefinition,
  SkillDefinition,
  StatusDefinition,
} from './types';

export interface GameData {
  config: GameConfig;
  elements: Map<string, ElementDefinition>;
  statuses: Map<string, StatusDefinition>;
  classes: Map<string, ClassDefinition>;
  skills: Map<string, SkillDefinition>;
  monsters: Map<string, MonsterDefinition>;
  items: Map<string, ItemDefinition>;
  equipment: Map<string, EquipmentDefinition>;
  encounters: Map<string, EncounterZoneDef>;
  maps: Map<string, MapDefinition>;
  actors: Map<string, ActorDefinition>;
  dialogues: Map<string, DialogueDefinition>;
  quests: Map<string, QuestDefinition>;
}

export interface RawGameData {
  config: GameConfig;
  elements: ElementDefinition[];
  statuses: StatusDefinition[];
  classes: ClassDefinition[];
  skills: SkillDefinition[];
  spells: SkillDefinition[];
  monsters: MonsterDefinition[];
  items: ItemDefinition[];
  equipment: EquipmentDefinition[];
  encounters: EncounterZoneDef[];
  maps: MapDefinition[];
  actors: ActorDefinition[];
  dialogues: DialogueDefinition[];
  quests: QuestDefinition[];
}

function toMap<T extends { id: string }>(list: T[], kind: string): Map<string, T> {
  const m = new Map<string, T>();
  for (const item of list) {
    if (m.has(item.id)) throw new Error(`データ重複: ${kind}/${item.id}`);
    m.set(item.id, item);
  }
  return m;
}

export function buildGameData(raw: RawGameData): GameData {
  const data: GameData = {
    config: raw.config,
    elements: toMap(raw.elements, 'elements'),
    statuses: toMap(raw.statuses, 'statuses'),
    classes: toMap(raw.classes, 'classes'),
    skills: toMap([...raw.skills, ...raw.spells], 'skills'),
    monsters: toMap(raw.monsters, 'monsters'),
    items: toMap(raw.items, 'items'),
    equipment: toMap(raw.equipment, 'equipment'),
    encounters: toMap(raw.encounters, 'encounters'),
    maps: toMap(raw.maps, 'maps'),
    actors: toMap(raw.actors, 'actors'),
    dialogues: toMap(raw.dialogues, 'dialogues'),
    quests: toMap(raw.quests, 'quests'),
  };
  validate(data);
  return data;
}

function validate(d: GameData): void {
  const err = (msg: string): never => {
    throw new Error(`データ整合性エラー: ${msg}`);
  };
  for (const c of d.classes.values()) {
    for (const ls of c.learnableSkills) {
      if (!d.skills.has(ls.skillId)) err(`class ${c.id} が未定義スキル ${ls.skillId} を参照`);
    }
    for (const p of c.passiveSkills) {
      if (!d.skills.has(p)) err(`class ${c.id} が未定義パッシブ ${p} を参照`);
    }
  }
  for (const m of d.monsters.values()) {
    for (const s of m.skills) {
      if (!d.skills.has(s)) err(`monster ${m.id} が未定義スキル ${s} を参照`);
    }
    for (const drop of m.drops) {
      if (drop.itemId && !d.items.has(drop.itemId)) err(`monster ${m.id} のドロップ ${drop.itemId}`);
      if (drop.equipId && !d.equipment.has(drop.equipId)) err(`monster ${m.id} のドロップ ${drop.equipId}`);
    }
    for (const rule of m.aiPattern) {
      if (rule.do.skillId && !d.skills.has(rule.do.skillId))
        err(`monster ${m.id} のAIが未定義スキル ${rule.do.skillId} を参照`);
      if (rule.do.summonId && !d.monsters.has(rule.do.summonId))
        err(`monster ${m.id} のAIが未定義召喚 ${rule.do.summonId} を参照`);
    }
  }
  for (const z of d.encounters.values()) {
    for (const g of z.groups) {
      for (const mid of g.monsters) {
        if (!d.monsters.has(mid)) err(`encounter ${z.id} が未定義モンスター ${mid} を参照`);
      }
    }
  }
  for (const map of d.maps.values()) {
    const w = map.rows[0]?.length ?? 0;
    for (const row of map.rows) {
      if (row.length !== w) err(`map ${map.id} の行幅が不一致`);
      for (const ch of row) {
        if (!map.legend[ch]) err(`map ${map.id} に未定義タイル '${ch}'`);
      }
    }
    for (const ch of Object.values(map.legend)) {
      if (ch.encounter && !d.encounters.has(ch.encounter))
        err(`map ${map.id} が未定義エンカウント ${ch.encounter} を参照`);
    }
    for (const warp of map.warps) {
      if (!d.maps.has(warp.to)) err(`map ${map.id} のワープ先 ${warp.to}`);
    }
    for (const npc of map.npcs) {
      if (!d.dialogues.has(npc.dialogueId)) err(`map ${map.id} のNPC ${npc.id} の会話 ${npc.dialogueId}`);
    }
    for (const chest of map.chests) {
      if (chest.itemId && !d.items.has(chest.itemId)) err(`map ${map.id} の宝箱 ${chest.itemId}`);
      if (chest.equipId && !d.equipment.has(chest.equipId)) err(`map ${map.id} の宝箱 ${chest.equipId}`);
    }
  }
  for (const a of d.actors.values()) {
    if (!d.classes.has(a.defaultClassId)) err(`actor ${a.id} の初期職業 ${a.defaultClassId}`);
    for (const eq of Object.values(a.startEquipment)) {
      if (eq && !d.equipment.has(eq)) err(`actor ${a.id} の初期装備 ${eq}`);
    }
  }
  for (const s of d.skills.values()) {
    if (s.comboParts) {
      for (const part of s.comboParts) {
        if (!d.actors.has(part.actorId)) err(`combo ${s.id} の参加者 ${part.actorId}`);
      }
    }
  }
}
