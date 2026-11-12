// 第2部 第8章 第4幕「時のはざま」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c8c.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の すなどけいの騎士だけ（第7章・第8章 第1〜3幕と おなじ きまり）。F〜C の 4しゅは noFamily
//   せいれい F・ゾンビ E・せいれい D・ドラゴン C・ゾンビ A（docs/plan-r53-breed-more.md の 1。せいれいの D・ゾンビの E と A が 少ない）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第4幕の B〜S は すなどけいの騎士だけ
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
// ・ゲストの カリム・ミナモ（第8章 第4幕用）は data/shops.js の GUESTS.karim8r・GUESTS.minamo8（物語の ゲスト。docs/plan-ch8.md の 9-2）
export const FRIENDS_C8R = {
  // せいれい F（1/10）
  toki_soul: {
    rate: 1 / 10, mix: ['undead'], names: ['トキタマ', 'ムラビ', 'ユラリ', 'ポワ'],
    growth: { hp: 0.9, mp: 1.2, str: 0.7, def: 0.85, agi: 1.25, mag: 1.4, heal: 0.7 },
    learn: [[1, 'mera'], [4, 'm8n_ts_drain'], [9, 'piorimu'], [14, 'm8n_ts_flame'], [20, 'merazoma']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '時のはざまをただようたましい。仲間になると、なつかしい思い出の話を、ぽつりぽつりと聞かせてくれる。',
  },
  // ゾンビ E（1/11）
  kage_scarab: {
    rate: 1 / 11, mix: ['beast'], names: ['カゲスカ', 'スナムシ', 'コロコロ', 'トキカゲ'],
    growth: { hp: 1.05, mp: 0.55, str: 1.25, def: 1.15, agi: 1.05, mag: 0.6, heal: 0.45 },
    learn: [[1, 'm_bite'], [4, 'm8n_ks_bite'], [9, 'sukara'], [14, 'm8n_ks_sand'], [20, 'm8n_ks_rewind']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '時のすなをまとったスカラベのかげ。仲間になると、時のすなを丸めて、小さな玉を作るのが大すき。',
  },
  // せいれい D（1/15）
  toki_moth: {
    rate: 1 / 15, mix: ['plant'], names: ['トケイガ', 'モスモス', 'ハネチク', 'リンプン'],
    growth: { hp: 0.95, mp: 1.1, str: 0.85, def: 0.85, agi: 1.35, mag: 1.3, heal: 0.6 },
    learn: [[1, 'gira'], [4, 'm8n_tm_bite'], [9, 'baikiruto'], [14, 'm8n_tm_flutter'], [20, 'm8n_tm_powder']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'とけいのもようのはねのガ。仲間になると、夜のランプのまわりを、いつまでもくるくる回っている。',
  },
  // ドラゴン C（1/16）
  chikutaku_wani: {
    rate: 1 / 16, mix: ['slime'], names: ['チクタク', 'ワニオ', 'カチカチ', 'ガブ'],
    growth: { hp: 1.2, mp: 0.4, str: 1.35, def: 1.2, agi: 0.85, mag: 0.4, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm8n_cw_chomp'], [9, 'baikiruto'], [14, 'm8n_cw_tail'], [20, 'm8n_cw_tick']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: 'おなかでとけいが鳴るワニ。仲間になると、朝になると、おなかのとけいで、みんなを起こしてくれる。',
  },
  // ゾンビ A（なりにくい 1/26）
  sand_knight: {
    rate: 1 / 26, mix: ['material'], names: ['スナキシ', 'トケイモリ', 'サラサラ', 'アワセ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.3, agi: 0.9, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm8n_sk_slash'], [9, 'sukara'], [14, 'm8n_sk_turn'], [20, 'm8n_sk_sand']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: 'helm' },
    note: 'すなどけいの体の騎士。仲間になると、すなが落ちきるたびに、自分で体をひっくり返している。',
  },
};

// F〜C の 4しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['toki_soul', 'kage_scarab', 'toki_moth', 'chikutaku_wani']) FRIENDS_C8R[sp].noFamily = true;
