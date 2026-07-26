// 星環の継承者: コア型定義（Phaser 非依存）

export type ElementId =
  | 'slash' // 斬
  | 'blunt' // 打
  | 'pierce' // 刺
  | 'lumen' // 光熱
  | 'cryo' // 冷晶
  | 'volt' // 雷磁
  | 'gravity' // 重力
  | 'psyche' // 精神
  | 'none'; // 無属性

export type StatusId =
  | 'poison'
  | 'venom'
  | 'sleep'
  | 'paralysis'
  | 'confusion'
  | 'silence'
  | 'blind'
  | 'bleed'
  | 'burn'
  | 'freeze'
  | 'pressure'
  | 'fear'
  | 'curse';

export type StatKey = 'hp' | 'mp' | 'attack' | 'defense' | 'magic' | 'spirit' | 'agility' | 'luck';
export type BuffKey = 'attack' | 'defense' | 'magic' | 'spirit' | 'agility' | 'accuracy' | 'evasion';

export type PersonalityKey = 'courage' | 'mercy' | 'wisdom' | 'freedom' | 'order' | 'ambition';

export type TargetKind =
  | 'enemySingle'
  | 'enemyGroup'
  | 'enemyAll'
  | 'allySingle'
  | 'allyAll'
  | 'allyDead'
  | 'self';

export type SkillCategory = 'physical' | 'magical' | 'heal' | 'support' | 'debuff' | 'passive';

export type WeaponType =
  | 'sword'
  | 'greatsword'
  | 'spear'
  | 'axe'
  | 'bow'
  | 'dagger'
  | 'knuckle'
  | 'staff'
  | 'resonstaff'
  | 'bellblade'
  | 'ringblade'
  | 'ancientgun'
  | 'grimoire';

export type EquipSlot = 'weapon' | 'shield' | 'body' | 'head' | 'accessory';

export interface BaseStats {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  magic: number;
  spirit: number;
  agility: number;
  luck: number;
}

export interface ElementDefinition {
  id: ElementId;
  name: string;
  physical: boolean;
}

export interface StatusDefinition {
  id: StatusId;
  name: string;
  /** 毎ターン終了時の最大HP割合ダメージ */
  dotPct?: number;
  /** 行動不能（睡眠・凍結） */
  blockAct?: boolean;
  /** 一定確率で行動失敗（麻痺・恐怖） */
  blockActChance?: number;
  /** 術式（spell）を封じる */
  blockSpells?: boolean;
  /** 混乱: ランダム対象へ攻撃 */
  confuse?: boolean;
  /** 命中率乗数（暗闇） */
  accMul?: number;
  /** 素早さ乗数（重圧） */
  agiMul?: number;
  /** 攻撃力乗数（恐怖） */
  atkMul?: number;
  /** 被弾で解除される確率（睡眠・混乱） */
  wakeOnHitChance?: number;
  /** 奥義ゲージ増加を止める（呪縛） */
  gaugeBlock?: boolean;
  /** 持続ターン [最小, 最大] */
  duration: [number, number];
}

export interface SkillDefinition {
  id: string;
  name: string;
  /** skill=特技 / spell=術式 / combo=連携技 / passive=パッシブ */
  kind: 'skill' | 'spell' | 'combo' | 'passive';
  category: SkillCategory;
  element: ElementId;
  /** 威力（100 = 通常攻撃相当）。0 なら補助のみ */
  power: number;
  hits?: number;
  accuracy?: number;
  mpCost: number;
  target: TargetKind;
  /** 連携判定などに使うタグ（sword/star/fist/dagger/song 等） */
  tags?: string[];
  /** 他職業へ継承可能か（職固有奥義は false） */
  inheritable: boolean;
  /** 奥義: 奥義ゲージを消費 */
  ougi?: boolean;
  gaugeCost?: number;
  /** HP割合が一定以下でないと使えない（天環終刃） */
  requiresHpRateLte?: number;
  /** 使用後に自分へかかるデバフ */
  selfAfterBuffs?: { stat: BuffKey; stages: number }[];
  addStatus?: { id: StatusId; chance: number }[];
  cureStatus?: StatusId[] | 'all';
  buffs?: { stat: BuffKey; stages: number }[];
  /** 蘇生時のHP割合 */
  revive?: number;
  /** 与ダメージの割合を吸収 */
  drainHp?: number;
  drainMp?: number;
  /** 防御力無視率 0..1 */
  defensePierce?: number;
  /** 対象の強化を1つ解除してから攻撃 */
  dispel?: boolean;
  /** かばう（そのターン、単体攻撃を肩代わり） */
  cover?: boolean;
  /** 挑発（敵の単体攻撃を引き付ける） */
  taunt?: boolean;
  /** 盗む */
  steal?: boolean;
  healPower?: number;
  healMp?: number;
  /** フィールドで使用可能（回復系） */
  fieldUsable?: boolean;
  /** 行動速度補正 */
  priority?: number;
  /** 特定アクター専用 */
  actorOnly?: string;
  /** 連携技: 参加者条件 */
  comboParts?: { actorId: string; tag: string }[];
  /** パッシブ効果 */
  passive?: {
    statMul?: Partial<Record<StatKey, number>>;
    critBonus?: number;
    elementBoost?: Partial<Record<ElementId, number>>;
  };
  description: string;
}

export interface UnlockCondition {
  type: 'classRank' | 'flag' | 'actor';
  classId?: string;
  rank?: number;
  flag?: string;
  actorId?: string;
}

export interface ClassDefinition {
  id: string;
  name: string;
  category: 'basic' | 'advanced' | 'fusion' | 'legendary';
  description: string;
  /** 基礎値に対する百分率補正 (100 = 等倍) */
  statModifiers: Record<StatKey, number>;
  allowedWeapons: WeaponType[];
  learnableSkills: { rank: number; skillId: string }[];
  /** インデックス順にランク 2/4/6 で解放 */
  passiveSkills: string[];
  unlockConditions: UnlockCondition[];
  /** 縦切り版で転職可能か */
  available: boolean;
}

export interface AiCondition {
  hpRateLte?: number;
  hpRateGte?: number;
  turnGte?: number;
  everyTurns?: number;
  phaseGte?: number;
  alliesAliveLte?: number;
  alliesAliveGte?: number;
  selfHasStatus?: StatusId;
  selfMissingStatus?: StatusId;
  partyHasBuff?: BuffKey;
  flagNotSet?: string;
  flagGte?: [string, number];
  once?: string;
}

export interface AiRule {
  if?: AiCondition;
  do: {
    action: 'skill' | 'attack' | 'summon' | 'wait';
    skillId?: string;
    summonId?: string;
    setFlag?: [string, number];
    message?: string;
  };
  weight?: number;
}

export interface DropDefinition {
  itemId?: string;
  equipId?: string;
  chance: number;
}

export interface ScoutDefinition {
  rate: number;
  favoriteItemId?: string;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  description: string;
  family: string;
  level: number;
  stats: BaseStats;
  /** 属性倍率 (1=等倍, 0.5=半減, 1.5=弱点, 0=無効) */
  resistances: Partial<Record<ElementId, number>>;
  /** 状態異常耐性 0..1 (1=無効) */
  statusResist: Partial<Record<StatusId, number>>;
  skills: string[];
  drops: DropDefinition[];
  exp: number;
  gold: number;
  jobExp: number;
  scout?: ScoutDefinition;
  aiPattern: AiRule[];
  spriteKey: string;
  boss?: boolean;
  /** ボスの根などのリンクユニット */
  linkedTo?: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  usableInBattle: boolean;
  usableInField: boolean;
  keyItem?: boolean;
  target: 'allySingle' | 'allyAll' | 'allyDead' | 'none';
  effect?: {
    healHp?: number;
    healMp?: number;
    cureStatus?: StatusId[] | 'all';
    revive?: number;
    warpVillage?: boolean;
  };
  /** スカウト用の好物として使える */
  scoutTreat?: boolean;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  description: string;
  slot: EquipSlot;
  weaponType?: WeaponType;
  price: number;
  stats: Partial<Record<StatKey, number>>;
  attackElement?: ElementId;
  elementBoost?: Partial<Record<ElementId, number>>;
  elementResist?: Partial<Record<ElementId, number>>;
  statusResist?: Partial<Record<StatusId, number>>;
  mpCostMul?: number;
  lowHpAttackBonus?: number;
  battleStartBuffs?: { stat: BuffKey; stages: number }[];
  sellable?: boolean;
}

export interface EncounterGroupDef {
  monsters: string[];
  weight: number;
  /** 出現する時間帯 (省略=常時) 0=朝 1=昼 2=夕 3=夜 */
  times?: number[];
}

export interface EncounterZoneDef {
  id: string;
  rate: number;
  groups: EncounterGroupDef[];
}

export interface MapNpcDef {
  id: string;
  x: number;
  y: number;
  sprite: string;
  dialogueId: string;
  /** 表示される時間帯 */
  times?: number[];
  shop?: 'item' | 'equip' | 'inn' | 'temple';
}

export interface MapWarpDef {
  x: number;
  y: number;
  to: string;
  tx: number;
  ty: number;
  dir?: 'up' | 'down' | 'left' | 'right';
}

export interface MapChestDef {
  id: string;
  x: number;
  y: number;
  itemId?: string;
  equipId?: string;
  gold?: number;
}

export interface MapEventDef {
  id: string;
  x?: number;
  y?: number;
  /** 矩形トリガー用の幅・高さ（省略時 1×1） */
  w?: number;
  h?: number;
  trigger: 'enter' | 'interact' | 'auto';
  /** 発火条件: mainStep がこの値のときのみ */
  mainStep?: number;
  once?: boolean;
}

export interface MapDefinition {
  id: string;
  name: string;
  kind: 'town' | 'world' | 'dungeon';
  tileset: string;
  rows: string[];
  legend: Record<string, { tile: string; solid?: boolean; encounter?: string; water?: boolean }>;
  npcs: MapNpcDef[];
  warps: MapWarpDef[];
  chests: MapChestDef[];
  events: MapEventDef[];
  bgm: string;
  /** 昼夜が進行するマップか */
  advanceTime?: boolean;
}

export interface DialogueChoice {
  text: string;
  personality?: Partial<Record<PersonalityKey, number>>;
  setFlag?: [string, number];
}

export interface DialogueEntry {
  if?: { flagGte?: [string, number]; flagLt?: [string, number]; times?: number[] };
  lines: string[];
  choices?: DialogueChoice[];
}

export interface DialogueDefinition {
  id: string;
  speaker?: string;
  entries: DialogueEntry[];
}

export interface ActorDefinition {
  id: string;
  name: string;
  defaultClassId: string;
  joinLevel: number;
  baseStats: BaseStats;
  /** レベルアップ時の成長量 [最小, 最大] */
  growth: Record<StatKey, [number, number]>;
  startEquipment: Partial<Record<EquipSlot, string>>;
  sprite: string;
  bio: string;
}

export interface QuestDefinition {
  id: string;
  name: string;
  steps: string[];
}

export interface GameConfig {
  title: string;
  subtitle: string;
  titleEn: string;
  version: string;
  saveVersion: number;
  currency: string;
  saveKey: string;
  settingsKey: string;
  chapterEndText: string[];
  /** 店の品揃え（Late は環晶入手後に追加） */
  shops: Record<string, string[]>;
}

// ---- ランタイム状態 ----

export interface PartyMember {
  actorId: string;
  name: string;
  gender: 'a' | 'b';
  appearance: number;
  level: number;
  exp: number;
  classId: string;
  /** classId -> 職業経験値 */
  mastery: Record<string, number>;
  learned: string[];
  loadout: string[];
  passives: string[];
  baseStats: BaseStats;
  personality: Record<PersonalityKey, number>;
  hp: number;
  mp: number;
  gauge: number;
  row: 'front' | 'back';
  equipment: Partial<Record<EquipSlot, string>>;
}

export interface Inventory {
  items: Record<string, number>;
  equips: Record<string, number>;
  gold: number;
}

export interface Settings {
  textSpeed: number; // 1..3
  battleSpeed: number; // 1..3
  bgmVol: number; // 0..1
  seVol: number; // 0..1
  alwaysDash: boolean;
  screenShake: boolean;
  flashReduce: boolean;
  difficulty: 'story' | 'normal' | 'tactics';
  keymap: Record<string, string[]>;
}

export interface RunState {
  version: number;
  party: PartyMember[];
  inventory: Inventory;
  flags: Record<string, number>;
  chests: Record<string, boolean>;
  mapId: string;
  pos: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' };
  steps: number;
  timeIndex: number; // 0朝 1昼 2夕 3夜
  playSeconds: number;
  zukan: string[];
  rngSeed: number;
}

export interface DerivedStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  spirit: number;
  agility: number;
  luck: number;
  critBonus: number;
  elementBoost: Partial<Record<ElementId, number>>;
  elementResist: Partial<Record<ElementId, number>>;
  statusResist: Partial<Record<StatusId, number>>;
  mpCostMul: number;
  lowHpAttackBonus: number;
  attackElement: ElementId;
  battleStartBuffs: { stat: BuffKey; stages: number }[];
}
