// 職業データ
// mods: キャラクターの基本ステータスにかける倍率
// family: 系統（同じ系統どうしは転職ペナルティが軽い）
// learn: [職業レベル, 技ID]
// perLv: その職業のレベル1つにつき、どの職業でも有効な「ずっと残るボーナス」

export const JOBS = {
  warrior: {
    id: 'warrior', name: '戦士', kana: 'せんし', family: 'phys', color: '#d4574e',
    desc: 'たくましい からだで なかまを まもる。けんの わざ「大地斬」「海波斬」が とくい。',
    mods: { hp: 1.25, mp: 0.4, str: 1.25, def: 1.3, agi: 0.85, mag: 0.5, heal: 0.5 },
    weapons: ['sword', 'axe', 'dagger'], shield: true, armor: ['cloth', 'heavy', 'gi'], helm: true,
    perLv: { hp: 1 },
    learn: [
      [1, 'daichi'], [3, 'kabau'], [5, 'chikaratame'], [7, 'kaiha'], [9, 'kabutowari'],
      [11, 'kuuretsu'], [14, 'majingiri'], [17, 'tsurugimai'], [20, 'tamashii'],
    ],
  },
  monk: {
    id: 'monk', name: '武闘家', kana: 'ぶとうか', family: 'phys', color: '#e0913a',
    desc: 'とても すばやく、こうどうの じゅんばんが はやく まわってくる。こぶしの わざで かいしんを ねらう。',
    mods: { hp: 1.05, mp: 0.5, str: 1.12, def: 0.9, agi: 1.45, mag: 0.5, heal: 0.7 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { agi: 0.5 },
    learn: [
      [1, 'seiken'], [3, 'mikawashi'], [5, 'bakuretsu'], [7, 'kamaitachi'], [9, 'kiaitame'],
      [12, 'mouko'], [15, 'mawashigeri'], [18, 'issen'], [20, 'hyakuretsu'],
    ],
  },
  priest: {
    id: 'priest', name: '僧侶', kana: 'そうりょ', family: 'magic', color: '#5aa0d8',
    desc: 'かいふくの じゅもん「ホイミ」で なかまを たすける。パーティーの いのちづな。',
    mods: { hp: 0.95, mp: 1.2, str: 0.85, def: 1.0, agi: 0.95, mag: 0.8, heal: 1.45 },
    weapons: ['staff', 'spear'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 0.5, mp: 0.3 },
    learn: [
      [1, 'hoimi'], [2, 'sukara'], [4, 'kiarii'], [5, 'bagi'], [7, 'mahoton'],
      [9, 'behoimi'], [11, 'zao'], [13, 'sukuruto'], [15, 'kiariku'], [17, 'bagima'], [19, 'behomara'],
    ],
  },
  mage: {
    id: 'mage', name: '魔法使い', kana: 'まほうつかい', family: 'magic', color: '#9a6ad0',
    desc: 'こうげき呪文「メラ」「ヒャド」で てきを やっつける。からだは よわいので まもってもらおう。',
    mods: { hp: 0.8, mp: 1.4, str: 0.7, def: 0.8, agi: 1.0, mag: 1.45, heal: 0.8 },
    weapons: ['staff', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, mp: 0.3 },
    learn: [
      [1, 'mera'], [2, 'hyado'], [4, 'gira'], [5, 'rukani'], [7, 'rariho'],
      [9, 'io'], [11, 'merami'], [13, 'hyadaruko'], [15, 'begirama'], [17, 'iora'], [20, 'merazoma'],
    ],
  },
  performer: {
    id: 'performer', name: '旅芸人', kana: 'たびげいにん', family: 'tech', color: '#4fb880',
    desc: 'おどりや うたで なかまを もりあげる。きような ので、ほかの しょくぎょうの わざも うまく つかえる。',
    mods: { hp: 1.0, mp: 1.0, str: 0.95, def: 0.95, agi: 1.15, mag: 1.0, heal: 1.0 },
    weapons: ['dagger', 'fan'], shield: true, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mp: 0.3, agi: 0.2 },
    versatile: true, // 旅芸人は転職ペナルティが軽い
    learn: [
      [1, 'hustle'], [3, 'piorimu'], [5, 'manusa'], [7, 'medapani'], [9, 'baikiruto'],
      [11, 'juggling'], [13, 'ouen'], [16, 'tatakai_uta'], [19, 'zameha_dance'],
    ],
  },
};

export const JOB_ORDER = ['warrior', 'monk', 'priest', 'mage', 'performer'];

export const JOB_MAX_LEVEL = 20;

// 職業レベルに必要な累計職業経験値
export function jobExpForLevel(lv) {
  if (lv <= 1) return 0;
  const n = lv - 1;
  return Math.round(6 * Math.pow(n, 2.2) + 8 * n);
}
