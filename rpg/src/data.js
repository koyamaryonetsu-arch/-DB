'use strict';
/* =====================================================================
 * data.js — game database
 * ===================================================================== */

const STATS = ['str', 'agi', 'vit', 'int', 'luck'];
const STAT_NAMES = { str: 'ちから', agi: 'すばやさ', vit: 'たいりょく', int: 'かしこさ', luck: 'うんのよさ' };

/* ---------- jobs ---------- */
const JOBS = {
  hero: {
    name: '勇者', short: '勇', sprite: 'hero',
    base: { str: 11, agi: 8, vit: 10, int: 7, luck: 6 }, grow: { str: 2.2, agi: 1.6, vit: 2.1, int: 1.3, luck: 1.1 },
    hp0: 22, mp0: 6, mpMul: 1.2, expMul: 1.1, crit: 1 / 32,
    spells: [[3, 'volca'], [4, 'rafi'], [6, 'puri'], [7, 'porta'], [9, 'igni'], [11, 'exo'], [13, 'holia']],
    desc: 'せかいを すくう さだめを せおった 者。',
  },
  warrior: {
    name: '戦士', short: '戦', sprite: 'warrior',
    base: { str: 14, agi: 4, vit: 13, int: 2, luck: 4 }, grow: { str: 2.6, agi: 0.9, vit: 2.2, int: 0.3, luck: 0.8 },
    hp0: 26, mp0: 0, mpMul: 0, expMul: 1.0, crit: 1 / 40, spells: [],
    desc: 'ちからと たいりょくに すぐれ おもい よろいも みにつけられる。',
  },
  fighter: {
    name: '武闘家', short: '武', sprite: 'fighter',
    base: { str: 12, agi: 12, vit: 9, int: 3, luck: 7 }, grow: { str: 2.1, agi: 2.4, vit: 1.6, int: 0.4, luck: 1.2 },
    hp0: 20, mp0: 0, mpMul: 0, expMul: 0.95, crit: 1 / 12, spells: [],
    desc: 'すばやい うごきで かいしんの いちげきを くりだす。',
  },
  priest: {
    name: '僧侶', short: '僧', sprite: 'priest',
    base: { str: 7, agi: 6, vit: 9, int: 9, luck: 7 }, grow: { str: 1.2, agi: 1.2, vit: 1.6, int: 1.8, luck: 1.2 },
    hp0: 17, mp0: 10, mpMul: 1.6, expMul: 0.9, crit: 1 / 48,
    spells: [[1, 'rafi'], [3, 'puri'], [5, 'aegis'], [7, 'vento'], [9, 'sancta'], [12, 'rafir'], [14, 'exo']],
    desc: 'かいふくの じゅもんで なかまを ささえる。',
  },
  mage: {
    name: '魔法使い', short: '魔', sprite: 'mage',
    base: { str: 5, agi: 8, vit: 6, int: 12, luck: 6 }, grow: { str: 0.8, agi: 1.4, vit: 1.0, int: 2.6, luck: 1.0 },
    hp0: 12, mp0: 14, mpMul: 1.6, expMul: 1.05, crit: 1 / 64,
    spells: [[1, 'volca'], [3, 'mirage'], [5, 'somni'], [7, 'glaci'], [9, 'igni'], [11, 'fracta'], [12, 'porta'], [14, 'exo']],
    desc: 'こうげきの じゅもんを あやつる。 からだは よわい。',
  },
  merchant: {
    name: '商人', short: '商', sprite: 'merchant',
    base: { str: 9, agi: 6, vit: 10, int: 7, luck: 11 }, grow: { str: 1.6, agi: 1.2, vit: 1.8, int: 1.2, luck: 1.8 },
    hp0: 19, mp0: 0, mpMul: 0, expMul: 0.8, crit: 1 / 40, spells: [],
    desc: 'せんとうの あと ゴールドを よけいに ひろうことがある。',
  },
  jester: {
    name: '遊び人', short: '遊', sprite: 'jester',
    base: { str: 6, agi: 9, vit: 8, int: 6, luck: 15 }, grow: { str: 1.0, agi: 1.6, vit: 1.4, int: 1.0, luck: 2.6 },
    hp0: 15, mp0: 0, mpMul: 0, expMul: 0.7, crit: 1 / 24, spells: [],
    desc: 'きまぐれで たたかいの さなかにも あそんでしまう。',
  },
};
const JOB_ORDER = ['warrior', 'fighter', 'priest', 'mage', 'merchant', 'jester'];

function expForLevel(L, job) {
  if (L <= 1) return 0;
  const n = L - 1;
  return Math.floor((7 * Math.pow(n, 2.35) + 5 * n) * (JOBS[job] ? JOBS[job].expMul : 1));
}

/* ---------- personalities ---------- */
const PERSONALITIES = {
  brave: { name: 'ゆうかん', mul: { str: 1.1, agi: 1.0, vit: 1.1, int: 0.9, luck: 0.9 }, desc: 'おそれを しらない まっすぐな こころ。' },
  calm: { name: 'れいせい', mul: { str: 0.95, agi: 1.1, vit: 0.95, int: 1.15, luck: 1.0 }, desc: 'どんな ときも おちついて ものごとを みる。' },
  kind: { name: 'やさしい', mul: { str: 0.9, agi: 1.0, vit: 1.1, int: 1.05, luck: 1.1 }, desc: 'ひとの いたみが わかる あたたかな こころ。' },
  nimble: { name: 'すばしこい', mul: { str: 0.95, agi: 1.25, vit: 0.9, int: 1.0, luck: 1.0 }, desc: 'かぜのように かろやかな みのこなし。' },
  hot: { name: 'ねっけつ', mul: { str: 1.25, agi: 1.0, vit: 1.05, int: 0.8, luck: 0.95 }, desc: 'こころに もえる ほのおを やどす。' },
  lucky: { name: 'ラッキー', mul: { str: 0.95, agi: 1.0, vit: 0.95, int: 1.0, luck: 1.3 }, desc: 'なぜか いつも ついている。' },
  sharp: { name: 'きれもの', mul: { str: 0.9, agi: 1.05, vit: 0.9, int: 1.3, luck: 1.0 }, desc: 'するどい ちえで みちを ひらく。' },
  steady: { name: 'がんばりや', mul: { str: 1.05, agi: 1.0, vit: 1.15, int: 1.0, luck: 0.95 }, desc: 'あきらめず こつこつ つみあげる。' },
};

/* ---------- spells ----------
 * target: enemy | group | all | ally | party | self | none
 * type: dmg | heal | cure | buff | debuff | status | banish | warp | escape | repel */
const SPELLS = {
  volca: { name: 'ボルカ', mp: 2, target: 'enemy', type: 'dmg', elem: 'fire', power: [8, 13], sfx: 'fire', desc: 'ひのたまで てき1たいを やく' },
  igni: { name: 'イグニ', mp: 4, target: 'group', type: 'dmg', elem: 'fire', power: [11, 17], sfx: 'fire', desc: 'ほのおの うずで てき1グループを やく' },
  glaci: { name: 'グラキ', mp: 4, target: 'enemy', type: 'dmg', elem: 'ice', power: [22, 30], sfx: 'ice', desc: 'こおりの やいばで てき1たいを きりさく' },
  vento: { name: 'ヴェント', mp: 3, target: 'group', type: 'dmg', elem: 'wind', power: [9, 21], sfx: 'wind', desc: 'しんくうの かぜで てき1グループを きりさく' },
  rafi: { name: 'ラフィ', mp: 3, target: 'ally', type: 'heal', power: [30, 40], sfx: 'heal', field: true, desc: 'みかた1人の HPを かいふく' },
  rafir: { name: 'ラフィール', mp: 6, target: 'ally', type: 'heal', power: [85, 110], sfx: 'heal', field: true, desc: 'みかた1人の HPを おおきく かいふく' },
  puri: { name: 'ピュリ', mp: 2, target: 'ally', type: 'cure', status: 'poison', sfx: 'heal', field: true, desc: 'みかた1人の どくを けす' },
  aegis: { name: 'アイギス', mp: 2, target: 'ally', type: 'buff', stat: 'def', sfx: 'buff', desc: 'みかた1人の しゅびりょくを あげる' },
  fracta: { name: 'フラクタ', mp: 3, target: 'group', type: 'debuff', stat: 'def', elem: 'debuff', sfx: 'debuff', desc: 'てき1グループの しゅびりょくを さげる' },
  somni: { name: 'ソムニ', mp: 3, target: 'group', type: 'status', status: 'sleep', elem: 'sleep', sfx: 'sleep', desc: 'てき1グループを ねむらせる' },
  mirage: { name: 'ミラジュ', mp: 3, target: 'group', type: 'status', status: 'mirage', elem: 'mirage', sfx: 'spell', desc: 'まぼろしで てきの こうげきを はずれやすくする' },
  sancta: { name: 'サンクタ', mp: 4, target: 'group', type: 'banish', elem: 'banish', sfx: 'spell', desc: 'せいなる ひかりで アンデッドを きよめる' },
  porta: { name: 'ポルタ', mp: 6, target: 'none', type: 'warp', field: true, battle: false, sfx: 'warp', desc: 'いちど いった 町へ いっしゅんで とぶ' },
  exo: { name: 'エクソ', mp: 4, target: 'none', type: 'escape', field: true, battle: false, sfx: 'warp', desc: 'ダンジョンから そとへ だっしゅつする' },
  holia: { name: 'ホーリア', mp: 3, target: 'none', type: 'repel', field: true, battle: false, sfx: 'spell', desc: 'よわい まものを よせつけなくする' },
};

/* ---------- items ----------
 * kind: use | key | weapon | armor | shield | helm
 * equip: list of jobs */
const ALL_JOBS = ['hero', 'warrior', 'fighter', 'priest', 'mage', 'merchant', 'jester'];
const ITEMS = {
  herb: { name: 'やくそう', kind: 'use', price: 8, target: 'ally', heal: [25, 35], battle: true, field: true, desc: 'HPを 30ほど かいふくする' },
  antidote: { name: 'どくけしそう', kind: 'use', price: 10, target: 'ally', cure: 'poison', battle: true, field: true, desc: 'どくを けす' },
  mpdrop: { name: 'まりょくのしずく', kind: 'use', price: 0, sell: 120, target: 'ally', mpheal: [20, 30], battle: true, field: true, desc: 'MPを 25ほど かいふくする' },
  feather: { name: 'かえりのはね', kind: 'use', price: 25, target: 'none', warp: true, battle: false, field: true, desc: 'いちど いった 町へ もどれる' },
  holywater: { name: 'きよめのみず', kind: 'use', price: 20, target: 'none', repel: true, battle: false, field: true, desc: 'よわい まものが よってこなくなる' },
  fireorb: { name: 'ほむらのいし', kind: 'use', price: 0, sell: 60, target: 'group', spell: 'igni', battle: true, field: false, consume: true, desc: 'たたかいで つかうと ほのおが ほとばしる' },
  seed_str: { name: 'ちからのみ', kind: 'use', price: 0, sell: 50, target: 'ally', stat: 'str', field: true, battle: false, desc: 'ちからが すこし あがる' },
  seed_agi: { name: 'すばやさのみ', kind: 'use', price: 0, sell: 50, target: 'ally', stat: 'agi', field: true, battle: false, desc: 'すばやさが すこし あがる' },
  seed_life: { name: 'いのちのみ', kind: 'use', price: 0, sell: 50, target: 'ally', stat: 'mhp', field: true, battle: false, desc: 'さいだいHPが すこし あがる' },
  star: { name: 'ほしのかけら', kind: 'key', stack: true, desc: 'ふしぎに かがやく ちいさな かけら。 あつめている 人が いるらしい' },
  oldkey: { name: 'ふるびたカギ', kind: 'key', desc: 'ふるい カギの とびらを ひらける' },
  blastorb: { name: 'ばくれつだま', kind: 'key', desc: 'いわも くだく おそろしい ちからを ひめた たま' },
  royalpass: { name: 'おうのてがた', kind: 'key', desc: 'ソレイア王の いんが おされた てがた' },

  /* weapons */
  oakstaff: { name: 'かしのつえ', kind: 'weapon', atk: 3, price: 10, equip: ALL_JOBS },
  club: { name: 'こんぼう', kind: 'weapon', atk: 7, price: 30, equip: ['hero', 'warrior', 'priest', 'merchant', 'jester'] },
  bronzeknife: { name: 'せいどうのナイフ', kind: 'weapon', atk: 9, price: 55, equip: ['hero', 'warrior', 'mage', 'merchant', 'jester'] },
  coppersword: { name: 'どうのつるぎ', kind: 'weapon', atk: 12, price: 100, equip: ['hero', 'warrior', 'merchant'] },
  bronzeclaw: { name: 'どうのツメ', kind: 'weapon', atk: 11, price: 90, equip: ['fighter'] },
  spiritstaff: { name: 'せいれいのつえ', kind: 'weapon', atk: 8, price: 80, equip: ['priest', 'mage'] },
  stoneaxe: { name: 'いしのオノ', kind: 'weapon', atk: 16, price: 210, equip: ['warrior', 'merchant', 'jester'] },
  chainsickle: { name: 'くさりがま', kind: 'weapon', atk: 18, price: 290, equip: ['hero', 'warrior', 'fighter', 'merchant'] },
  ironclaw: { name: 'てつのツメ', kind: 'weapon', atk: 22, price: 430, equip: ['fighter'] },
  ironspear: { name: 'てつのやり', kind: 'weapon', atk: 24, price: 560, equip: ['hero', 'warrior', 'priest'] },
  flamestaff: { name: 'ほむらのつえ', kind: 'weapon', atk: 12, price: 0, sell: 300, equip: ['priest', 'mage', 'hero'], cast: 'volca', desc: 'たたかいで つかうと ボルカの こうかがある' },
  steelsword: { name: 'はがねのつるぎ', kind: 'weapon', atk: 32, price: 0, sell: 750, equip: ['hero', 'warrior', 'merchant'] },

  /* armor */
  clothes: { name: 'ぬののふく', kind: 'armor', def: 4, price: 10, equip: ALL_JOBS },
  travelcloak: { name: 'たびのマント', kind: 'armor', def: 7, price: 45, equip: ALL_JOBS },
  gi: { name: 'ぶどうぎ', kind: 'armor', def: 10, price: 80, equip: ['fighter', 'jester', 'hero'] },
  robe: { name: 'まほうのローブ', kind: 'armor', def: 9, price: 90, equip: ['mage', 'priest', 'jester'] },
  leather: { name: 'かわのよろい', kind: 'armor', def: 12, price: 130, equip: ['hero', 'warrior', 'fighter', 'priest', 'merchant'] },
  scalemail: { name: 'うろこのよろい', kind: 'armor', def: 16, price: 220, equip: ['hero', 'warrior', 'priest', 'merchant'] },
  chainmail: { name: 'くさりかたびら', kind: 'armor', def: 20, price: 360, equip: ['hero', 'warrior', 'priest', 'merchant'] },
  ironarmor: { name: 'てつのよろい', kind: 'armor', def: 26, price: 0, sell: 450, equip: ['hero', 'warrior'] },
  starmail: { name: 'ほしくずのよろい', kind: 'armor', def: 30, price: 0, sell: 900, equip: ['hero', 'warrior', 'priest', 'merchant', 'fighter', 'mage', 'jester'], desc: 'ほしのかけらで あまれた かるい よろい' },

  /* shields */
  potlid: { name: 'なべのふた', kind: 'shield', def: 2, price: 20, equip: ['hero', 'warrior', 'priest', 'merchant', 'jester', 'mage'] },
  leathershield: { name: 'かわのたて', kind: 'shield', def: 4, price: 60, equip: ['hero', 'warrior', 'priest', 'merchant', 'jester'] },
  scaleshield: { name: 'うろこのたて', kind: 'shield', def: 7, price: 170, equip: ['hero', 'warrior', 'priest', 'merchant'] },
  bronzeshield: { name: 'せいどうのたて', kind: 'shield', def: 11, price: 380, equip: ['hero', 'warrior'] },

  /* helmets */
  hairband: { name: 'ヘアバンド', kind: 'helm', def: 2, price: 30, equip: ALL_JOBS },
  leatherhat: { name: 'かわのぼうし', kind: 'helm', def: 3, price: 60, equip: ['hero', 'warrior', 'priest', 'merchant', 'mage', 'jester'] },
  pointyhat: { name: 'とんがりぼうし', kind: 'helm', def: 5, price: 120, equip: ['mage', 'jester'] },
  ironhelm: { name: 'てつかぶと', kind: 'helm', def: 9, price: 420, equip: ['hero', 'warrior'] },
};
const EQUIP_SLOTS = ['weapon', 'armor', 'shield', 'helm'];
const SLOT_NAMES = { weapon: 'ぶき', armor: 'よろい', shield: 'たて', helm: 'かぶと' };

/* ---------- monsters ----------
 * res: resistance 0 normal .. 3 immune (fire, ice, wind, sleep, mirage, debuff, banish)
 * acts: [action, weight]  actions: attack | spell:<id> | sleepspore | poisonbite | guard | flee | heavy | drain | breath | call
 */
const MONSTERS = {
  jelly_blue: { name: 'あおゼリー', hp: 7, atk: 9, def: 5, agi: 4, exp: 3, gold: 2, drop: ['herb', 16], acts: [['attack', 1]] },
  crow: { name: 'やみガラス', hp: 9, atk: 11, def: 6, agi: 13, exp: 4, gold: 3, acts: [['attack', 1]] },
  rabbit: { name: 'とげウサギ', hp: 12, atk: 13, def: 7, agi: 14, exp: 5, gold: 4, drop: ['herb', 12], acts: [['attack', 5], ['heavy', 1]] },
  jelly_mud: { name: 'どろゼリー', hp: 11, atk: 12, def: 7, agi: 5, exp: 5, gold: 5, drop: ['antidote', 10], acts: [['attack', 2], ['poisonbite', 1]] },
  crow_night: { name: 'よいどりガラス', hp: 16, atk: 17, def: 9, agi: 24, exp: 9, gold: 7, acts: [['attack', 1]] },
  mushroom: { name: 'ねむりダケ', hp: 15, atk: 15, def: 9, agi: 6, exp: 9, gold: 7, drop: ['herb', 10], res: { sleep: 3 }, acts: [['attack', 3], ['sleepspore', 1]] },
  ant: { name: 'くろアリ', hp: 16, atk: 17, def: 18, agi: 7, exp: 10, gold: 8, acts: [['attack', 1]] },
  bat: { name: 'キバコウモリ', hp: 13, atk: 16, def: 8, agi: 18, exp: 9, gold: 6, res: { wind: 1 }, acts: [['attack', 3], ['drain', 1]] },
  apprentice: { name: 'みならいまどうし', hp: 14, atk: 12, def: 9, agi: 10, exp: 12, gold: 12, drop: ['mpdrop', 24], res: { fire: 1 }, acts: [['attack', 2], ['spell:volca', 2]] },
  frog: { name: 'どくガエル', hp: 20, atk: 20, def: 12, agi: 9, exp: 14, gold: 11, drop: ['antidote', 8], acts: [['attack', 2], ['poisonbite', 1]] },
  skeleton: { name: 'がいこつへい', hp: 25, atk: 23, def: 15, agi: 10, exp: 17, gold: 15, undead: true, res: { sleep: 3, mirage: 1 }, acts: [['attack', 4], ['heavy', 1]] },
  flame: { name: 'ほのおのこ', hp: 18, atk: 19, def: 13, agi: 15, exp: 15, gold: 12, res: { fire: 3, ice: 0 }, weak: 'ice', acts: [['attack', 2], ['breath', 1]] },
  bee: { name: 'さしバチ', hp: 16, atk: 21, def: 11, agi: 21, exp: 14, gold: 10, acts: [['attack', 2], ['poisonbite', 1]] },
  mushroom_blue: { name: 'まひダケ', hp: 22, atk: 21, def: 13, agi: 8, exp: 16, gold: 13, res: { sleep: 3 }, acts: [['attack', 3], ['sleepspore', 2]] },
  guard_golem: { name: 'いしのばんぺい', hp: 210, atk: 31, def: 20, agi: 8, exp: 180, gold: 90, boss: true, actsPerTurn: 2, res: { sleep: 3, mirage: 2, debuff: 1, fire: 1, ice: 1, wind: 1 }, acts: [['attack', 3], ['heavy', 3], ['guard', 1]] },
  rockman: { name: 'いわおとこ', hp: 38, atk: 28, def: 32, agi: 5, exp: 26, gold: 22, res: { sleep: 1, wind: 1 }, acts: [['attack', 3], ['heavy', 1], ['guard', 1]] },
  ghost: { name: 'まよいゴースト', hp: 26, atk: 24, def: 16, agi: 16, exp: 22, gold: 16, undead: true, res: { sleep: 3, mirage: 2 }, acts: [['attack', 3], ['spell:mirage', 1]] },
  orc: { name: 'オーク', hp: 46, atk: 33, def: 18, agi: 12, exp: 32, gold: 30, drop: ['seed_str', 32], acts: [['attack', 4], ['heavy', 1]] },
  apprentice_dark: { name: 'やみまどうし', hp: 30, atk: 22, def: 16, agi: 15, exp: 28, gold: 26, drop: ['mpdrop', 12], res: { fire: 1, sleep: 1 }, acts: [['attack', 1], ['spell:igni', 2], ['spell:somni', 1]] },
  jelly_red: { name: 'ほむらゼリー', hp: 24, atk: 26, def: 18, agi: 12, exp: 20, gold: 16, res: { fire: 3 }, weak: 'ice', acts: [['attack', 3], ['breath', 1]] },
  bat_red: { name: 'ちすいコウモリ', hp: 22, atk: 26, def: 14, agi: 22, exp: 20, gold: 14, res: { wind: 1 }, acts: [['attack', 2], ['drain', 2]] },
  skeleton_red: { name: 'ちぞめがいこつ', hp: 34, atk: 30, def: 20, agi: 14, exp: 30, gold: 26, undead: true, res: { sleep: 3, mirage: 1 }, acts: [['attack', 3], ['heavy', 2]] },
  rabbit_dark: { name: 'かげウサギ', hp: 26, atk: 27, def: 17, agi: 26, exp: 22, gold: 18, acts: [['attack', 3], ['heavy', 1]] },
  star: { name: 'キラキラぼし', hp: 5, atk: 12, def: 255, agi: 255, exp: 220, gold: 12, rare: true, res: { fire: 3, ice: 3, wind: 3, sleep: 3, mirage: 3, debuff: 3, banish: 3 }, acts: [['flee', 3], ['attack', 1]] },
  boss_knight: {
    name: 'ボルザーク', hp: 290, atk: 39, def: 24, agi: 22, exp: 620, gold: 300, boss: true, actsPerTurn: 2,
    res: { sleep: 3, mirage: 2, debuff: 1, banish: 3, fire: 1 }, acts: [['attack', 5], ['spell:igni', 2], ['darkslash', 1.5], ['selfheal', 0]],
  },
  boss_beast: {
    name: 'もりのぬし', hp: 380, atk: 40, def: 26, agi: 14, exp: 520, gold: 180, boss: true,
    res: { sleep: 2, mirage: 1, banish: 3, wind: 1 }, acts: [['attack', 4], ['heavy', 2], ['roar', 1]],
  },
};
/* extra per-action tuning */
const MONSTER_ACT_NAMES = {
  sleepspore: 'は あまい ほうしを まきちらした！',
  poisonbite: 'は どくの キバで かみついた！',
  heavy: 'の するどい いちげき！',
  drain: 'は ちを すった！',
  breath: 'は ひのいきを はいた！',
  guard: 'は みを まもっている。',
  darkslash: 'は やみの つるぎを ふりおろした！',
  roar: 'は おそろしい おたけびを あげた！',
};

/* ---------- encounter tables ----------
 * formation: [[monster, min, max], ...], weight */
const ENCOUNTERS = {
  A: {
    day: [
      [[['jelly_blue', 1, 3]], 5], [[['crow', 1, 2]], 3], [[['jelly_blue', 1, 2], ['crow', 1, 1]], 3],
      [[['rabbit', 1, 1]], 2], [[['jelly_blue', 2, 4]], 1],
    ],
    night: [
      [[['crow', 1, 3]], 3], [[['jelly_mud', 1, 2]], 2], [[['rabbit', 1, 2]], 3], [[['crow_night', 1, 1]], 2], [[['jelly_blue', 2, 3], ['crow', 1, 1]], 2],
    ],
  },
  B: {
    day: [
      [[['rabbit', 1, 2]], 3], [[['jelly_mud', 1, 3]], 3], [[['mushroom', 1, 2]], 3], [[['ant', 1, 2]], 2],
      [[['apprentice', 1, 1], ['jelly_mud', 1, 1]], 2], [[['bat', 1, 3]], 2],
    ],
    night: [
      [[['bat', 2, 3]], 3], [[['crow_night', 1, 2]], 3], [[['mushroom', 1, 2], ['ant', 1, 1]], 2], [[['apprentice', 1, 2]], 2], [[['rabbit', 2, 3]], 1],
    ],
  },
  C: { // underground passage & tower
    day: [
      [[['bat', 2, 3]], 3], [[['skeleton', 1, 1]], 3], [[['frog', 1, 2]], 3], [[['flame', 1, 2]], 2], [[['bee', 1, 3]], 3],
      [[['skeleton', 1, 1], ['bat', 1, 2]], 2], [[['apprentice', 1, 2], ['frog', 1, 1]], 2], [[['mushroom_blue', 1, 2]], 2],
    ],
  },
  D: {
    day: [
      [[['rockman', 1, 1]], 2], [[['frog', 2, 3]], 2], [[['bee', 2, 3]], 2], [[['orc', 1, 1]], 2], [[['jelly_red', 1, 3]], 3],
      [[['skeleton', 1, 2], ['flame', 1, 1]], 2], [[['mushroom_blue', 1, 2], ['bee', 1, 1]], 2],
    ],
    night: [
      [[['ghost', 1, 2]], 3], [[['bat_red', 2, 3]], 3], [[['orc', 1, 2]], 2], [[['skeleton_red', 1, 1]], 2], [[['rabbit_dark', 1, 2]], 2], [[['apprentice_dark', 1, 1]], 1],
    ],
  },
  E: { // shirube cave
    day: [
      [[['rockman', 1, 2]], 3], [[['ghost', 1, 3]], 3], [[['skeleton_red', 1, 1], ['bat_red', 1, 1]], 2], [[['apprentice_dark', 1, 1], ['ghost', 1, 1]], 2],
      [[['jelly_red', 2, 3]], 2], [[['orc', 1, 1], ['skeleton', 1, 1]], 2], [[['rabbit_dark', 1, 2]], 2],
    ],
  },
  N: { // north-east highlands (optional, a bit tougher)
    day: [
      [[['orc', 1, 1]], 2], [[['rabbit_dark', 1, 2]], 3], [[['bee', 2, 3]], 2], [[['mushroom_blue', 1, 2]], 2], [[['frog', 2, 3]], 2],
    ],
    night: [
      [[['bat_red', 2, 3]], 3], [[['ghost', 1, 2]], 2], [[['orc', 1, 2]], 2], [[['skeleton_red', 1, 1]], 2],
    ],
  },
};
/* chance per encounter to replace the formation with the rare star (zones) */
const RARE_STAR = { B: 1 / 90, C: 1 / 70, D: 1 / 60, E: 1 / 60, N: 1 / 60 };

/* ---------- shops ---------- */
const SHOPS = {
  soleia_weapon: { title: 'ぶきや', items: ['oakstaff', 'club', 'bronzeknife', 'coppersword', 'bronzeclaw', 'spiritstaff'] },
  soleia_armor: { title: 'ぼうぐや', items: ['clothes', 'travelcloak', 'gi', 'robe', 'leather', 'potlid', 'leathershield', 'hairband', 'leatherhat'] },
  soleia_item: { title: 'どうぐや', items: ['herb', 'antidote', 'feather', 'holywater'] },
  norde_weapon: { title: 'ぶきや', items: ['coppersword', 'stoneaxe', 'chainsickle', 'ironclaw', 'ironspear', 'spiritstaff'] },
  norde_armor: { title: 'ぼうぐや', items: ['leather', 'scalemail', 'chainmail', 'robe', 'scaleshield', 'bronzeshield', 'pointyhat', 'ironhelm'] },
  norde_item: { title: 'どうぐや', items: ['herb', 'antidote', 'feather', 'holywater'] },
  tower_item: { title: 'ぎょうしょうにん', items: ['herb', 'antidote', 'feather'] },
};

/* star collector rewards: [needed total, item] */
const STAR_REWARDS = [[2, 'mpdrop'], [4, 'flamestaff'], [6, 'steelsword'], [9, 'starmail']];
const STAR_TOTAL = 10;

/* recruitable candidates at the tavern (defaults) */
const TAVERN_CANDIDATES = [
  { name: 'ガルド', job: 'warrior', gender: 'm', pers: 'brave' },
  { name: 'リン', job: 'fighter', gender: 'f', pers: 'nimble' },
  { name: 'セシル', job: 'priest', gender: 'f', pers: 'kind' },
  { name: 'ノア', job: 'mage', gender: 'm', pers: 'sharp' },
  { name: 'トルテ', job: 'merchant', gender: 'm', pers: 'lucky' },
  { name: 'ポポ', job: 'jester', gender: 'f', pers: 'lucky' },
  { name: 'ミラ', job: 'mage', gender: 'f', pers: 'calm' },
  { name: 'ブラム', job: 'priest', gender: 'm', pers: 'steady' },
  { name: 'エマ', job: 'warrior', gender: 'f', pers: 'hot' },
];
const START_KIT = {
  hero: ['clothes'],
  warrior: ['club', 'clothes', 'potlid'],
  fighter: ['clothes'],
  priest: ['oakstaff', 'clothes'],
  mage: ['oakstaff', 'clothes'],
  merchant: ['club', 'clothes'],
  jester: ['clothes', 'hairband'],
};
