// カジノの 景品と メダル王の ごほうび（items.js で まぜる）
// ・どれも 店では 買えない（price: 0）。売ると 少しだけ（コインで 買うより ずっと 安い）
// ・ランク4〜5（第2章の カモメ港の 品より 少し 強い）。40枚・50枚の ごほうびは これからの 章の ランク6
export const ITEMS_CASINO = {
  // ───── カジノの 景品 ─────
  pururin_shield: {
    name: 'ぷるりんのたて', type: 'shield', rank: 4, star: true, def: 18, bonus: { hp: 10 }, price: 0, sell: 300,
    desc: 'ぷるりんの形をした、ぷるぷるのたて。攻撃をやわらかく受け止める。最大HPも少し上がる。',
  },
  starry_cloak: {
    name: '星空のマント', type: 'armor', rank: 5, star: true, armorType: 'cloth', def: 21, bonus: { agi: 4, mag: 4 }, resist: { sleep: 0.5 }, price: 0, sell: 500,
    desc: '夜空のもようのマント。だれでも装備できる。素早さと魔力が上がり、ねむりにかかりにくい。',
  },
  hayabusa_sword: {
    name: 'はやぶさの剣', type: 'weapon', rank: 5, star: true, cat: 'sword', atk: 33, bonus: { agi: 12 }, price: 0, sell: 600,
    desc: 'はやぶさの羽のように軽い剣。とても素早く動けるようになる。',
  },

  // ───── メダル王の ごほうび ─────
  killer_earring: {
    name: 'キラーピアス', type: 'acc', rank: 4, bonus: { str: 6, agi: 6 }, price: 0, sell: 300,
    desc: 'するどく光るピアス。力と素早さが6ずつ上がる。',
  },
  mystic_hat: {
    name: 'ふしぎなぼうし', type: 'head', rank: 4, star: true, def: 6, bonus: { mp: 15, mag: 3 }, price: 0, sell: 300,
    desc: 'かぶると頭がすっきりする不思議なぼうし。MPと魔力が上がる。だれでも装備できる。',
  },
  kira_mail: {
    name: 'きらきらのよろい', type: 'armor', rank: 5, star: true, armorType: 'cloth', def: 24, bonus: { def: 3 }, resist: { fire: 0.8, ice: 0.8 }, price: 0, sell: 600,
    desc: 'きらきらぷるりんのように光るよろい。だれでも装備でき、炎と氷に少し強い。',
  },
  star_bangle: {
    name: '星ふるうでわ', type: 'acc', rank: 5, bonus: { agi: 20 }, price: 0, sell: 500,
    desc: '星がふるように光るうでわ。素早さが20上がる。',
  },
  kira_sword: {
    name: 'きらきらの剣', type: 'weapon', rank: 5, star: true, cat: 'sword', atk: 42, bonus: { agi: 3 }, price: 0, sell: 800,
    desc: 'メダル王の宝物庫にねむっていた、きらきら光る剣。',
  },
  kira_shield: {
    name: 'きらきらのたて', type: 'shield', rank: 6, star: true, def: 26, resist: { fire: 0.8, ice: 0.8, bolt: 0.8 }, price: 0, sell: 700,
    desc: 'きらきら光るたて。炎・氷・雷に少し強い。',
  },
  medal_crown: {
    name: 'メダル王のかんむり', type: 'head', rank: 6, star: true, def: 12, bonus: { str: 4, def: 4, agi: 4, mag: 4, heal: 4 }, price: 0, sell: 1000,
    desc: 'メダル王とおそろいのかんむり。全ての強さが少しずつ上がる。',
  },

  // ───── だいじな もの（数は c.medalSpots で 数える。メニューの 表示に 使う）─────
  small_medal: {
    name: '小さなメダル', type: 'key',
    desc: '星のもようがきざまれた小さなメダル。世界中にかくされていて、メダル王が集めている。',
  },
};

// 読みがな（道具の「あいうえお順」）
export const CASINO_KANA = {
  pururin_shield: 'ぷるりんのたて', starry_cloak: 'ほしぞらのまんと', hayabusa_sword: 'はやぶさのけん',
  killer_earring: 'きらーぴあす', mystic_hat: 'ふしぎなぼうし', kira_mail: 'きらきらのよろい', star_bangle: 'ほしふるうでわ',
  kira_sword: 'きらきらのけん', kira_shield: 'きらきらのたて', medal_crown: 'めだるおうのかんむり', small_medal: 'ちいさなめだる',
};
