// 第2部 第7章 第3幕「ひとりぼっちの星」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c7s.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の ブリザードだけ（第7章 第1幕・第2幕と おなじ きまり）。F〜C の 4しゅは noFamily
//   ドラゴン F・植物 E・悪魔 D・物質 C・せいれい A（docs/plan-r53-breed-more.md の 1 の 足りない 所。第2幕の あとで 少ない 所）
//   第7章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、B〜S は ブリザードだけ
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
// ・第3幕は ゲストが いない（4人 そろった パーティー。カイ・カリム・ミナモは 酒場の 仲間。docs/plan-ch7.md の 8-2）
export const FRIENDS_C7I = {
  // ドラゴン F（1/10）
  ice_bro: {
    rate: 1 / 10, mix: ['beast'], names: ['ブロスケ', 'コオリン', 'ヒエタ', 'ぽんぽこ'],
    growth: { hp: 1.05, mp: 0.55, str: 1.2, def: 1.0, agi: 1.0, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm7n_ib_ball'], [9, 'baikiruto'], [14, 'm7n_ib_barrage'], [20, 'hyadaruko']],
    gear: { weapons: [], armor: ['heavy'], shield: true, head: 'helm' },
    note: 'こおりのたまを投げるカメの兄弟。仲間になると、雪の日には、だれよりも早く雪合戦を始める。',
  },
  // 植物 E（1/11）
  ice_pakkun: {
    rate: 1 / 11, mix: ['slime'], names: ['パクリン', 'ヒヤパク', 'ゆきくち', 'あおはな'],
    growth: { hp: 1.1, mp: 0.6, str: 1.15, def: 1.0, agi: 0.75, mag: 0.75, heal: 0.55 },
    learn: [[1, 'm_bite'], [4, 'm7n_ip_bite'], [9, 'hyado'], [14, 'm7n_ip_breath'], [20, 'sukara']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '雪の中にすむ、青いパックンフラワー。仲間になると、あつい日に、つめたいいきでみんなをすずしくしてくれる。',
  },
  // 悪魔 D（1/15）
  thorn_goblin: {
    rate: 1 / 15, mix: ['plant'], names: ['トゲスケ', 'ゴブタ', 'イバラン', 'わいわい'],
    growth: { hp: 1.05, mp: 0.55, str: 1.25, def: 1.0, agi: 1.0, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm7n_tg_spear'], [9, 'baikiruto'], [14, 'm7n_tg_march'], [20, 'm7n_tg_cheer']],
    gear: { weapons: ['spear'], armor: ['heavy', 'cloth'], shield: true, head: 'helm' },
    note: '魔女の手下だったゴブリン。仲間になると、だれかがかつたびに、「ばんざーい！」と大さわぎする。',
  },
  // 物質 C（1/16）
  ice_mirror: {
    rate: 1 / 16, mix: ['spirit'], names: ['カガミン', 'ミラリー', 'コオリカ', 'うつしえ'],
    growth: { hp: 0.95, mp: 1.15, str: 0.75, def: 1.2, agi: 0.85, mag: 1.3, heal: 0.75 },
    learn: [[1, 'hyado'], [4, 'm7n_im_beam'], [9, 'sukara'], [14, 'm7n_im_frost'], [20, 'hyadaruko']],
    gear: { weapons: [], armor: [], shield: true, head: false },
    note: '女王のといかけにこたえていた、魔法の鏡。仲間になると、「この世で一番がんばったのは、あなたです」と、毎ばんほめてくれる。',
  },
  // せいれい A（なりにくい 1/26）
  blizzard: {
    rate: 1 / 26, mix: ['slime'], names: ['フブキ', 'ヒョウガ', 'シロウズ', 'こなゆき'],
    growth: { hp: 0.9, mp: 1.2, str: 0.85, def: 0.8, agi: 1.3, mag: 1.35, heal: 0.6 },
    learn: [[1, 'hyado'], [4, 'm7n_bz_claw'], [9, 'hyadaruko'], [14, 'm7n_bz_freeze'], [20, 'm7n_bz_storm']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'こおりでできた体のせいれい。仲間になると、夏でも、みんなのかき氷を作ってくれる。',
  },
};

// F〜C の 4しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['ice_bro', 'ice_pakkun', 'thorn_goblin', 'ice_mirror']) FRIENDS_C7I[sp].noFamily = true;
