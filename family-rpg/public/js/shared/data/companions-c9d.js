// 第3部 第1章 第4幕「星のはかば」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c9c.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子には ならない（5しゅ ぜんぶ noFamily）。つりばしヤギ（けもの D）を 系統配合の 子に すると、
//   はじめの ころの けものの 配合（test/monsters-r23 の「第1章の 魔物どうし」）に Lv103 の 子が まざる ため
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C9D = {
  c9d_twins: {
    rate: 1 / 12, mix: ['plant'], names: ['ヤッホー', 'コダマ', 'フタリ', 'エコー'],
    growth: { hp: 0.95, mp: 1.2, str: 0.8, def: 0.9, agi: 1.15, mag: 1.4, heal: 0.9 },
    learn: [[1, 'm_tackle'], [4, 'm9d_tw_bump'], [9, 'hoimi'], [14, 'm9d_tw_hum'], [20, 'm9d_tw_echo']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'こだまのふたご。仲間になると、名前をよぶと、ふたりで返事をしてくれる。',
  },
  c9d_spider: {
    rate: 1 / 11, mix: ['material'], names: ['タニワタ', 'イトハシ', 'ブランコ', 'クモスケ'],
    growth: { hp: 1.1, mp: 0.6, str: 1.25, def: 1.1, agi: 1.1, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9d_sp_bite'], [9, 'baikiruto'], [14, 'm9d_sp_web'], [20, 'm9d_sp_swing']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '谷わたりグモ。仲間になると、高い木の上まで、糸のはしごをかけてくれる。',
  },
  c9d_moth: {
    rate: 1 / 10, mix: ['demon'], names: ['ホシガ', 'リンプン', 'キララ', 'ヨアカリ'],
    growth: { hp: 1.0, mp: 1.05, str: 0.9, def: 0.9, agi: 1.15, mag: 1.15, heal: 0.8 },
    learn: [[1, 'm_bite'], [4, 'm9d_mt_wing'], [9, 'hoimi'], [14, 'm9d_mt_dust'], [20, 'm9d_mt_light']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '星あかりのガ。仲間になると、夜のたき火のまわりを、くるくるまってくれる。',
  },
  c9d_goat: {
    rate: 1 / 24, mix: ['slime'], names: ['カラン', 'ヤギベル', 'ツリバシ', 'ピョンタ'],
    growth: { hp: 1.3, mp: 0.5, str: 1.3, def: 1.25, agi: 0.65, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm9d_gt_horn'], [9, 'sukara'], [14, 'm9d_gt_jump'], [20, 'm9d_gt_bell']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'つりばしヤギ。仲間になると、朝になると、つののかねをカランと鳴らして起こしてくれる。',
  },
  c9d_kage: {
    rate: 1 / 16, mix: ['undead'], names: ['カゲボウ', 'クロネコ', 'ヒカリメ', 'ヨルニャン'],
    growth: { hp: 1.0, mp: 0.7, str: 1.2, def: 0.95, agi: 1.4, mag: 0.85, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9d_kg_claw'], [9, 'baikiruto'], [14, 'm9d_kg_shadow'], [20, 'm9d_kg_eyes']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'かげぼうしネコ。仲間になると、暗い所で、光る目で道をてらしてくれる。',
  },
};

// 5しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C9D)) FRIENDS_C9D[sp].noFamily = true;
