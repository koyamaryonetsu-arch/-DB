// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c11c.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・7しゅ とも 系統配合（familyPool）の 子には ならない（noFamily）
// ・ランクは 出現表から（tools/gen-monster-ranks.mjs の 表 … data/monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C11D = {
  c11d_knight: {
    rate: 1 / 12, mix: ['material'], names: ['プリズン', 'ニジキシ', 'カケラン', 'ピカナイト'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.3, agi: 0.8, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11d_kn_slash'], [9, 'sukara'], [14, 'baikiruto'], [20, 'm11d_kn_prism']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'プリズムナイト。仲間になると、雨上がりの空に、にじを見つけて教えてくれる。',
  },
  c11d_crown: {
    rate: 1 / 12, mix: ['beast'], names: ['カンムリ', 'エッヘン', 'オウサマドリ', 'ピカン'],
    growth: { hp: 0.95, mp: 1.2, str: 0.85, def: 0.9, agi: 1.35, mag: 1.3, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm11d_cr_peck'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11d_cr_proud']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'かんむりどり。仲間になると、いばるのをやめて、かんむりを、かしてくれる。',
  },
  c11d_dazzle: {
    rate: 1 / 13, mix: ['beast'], names: ['マバユ', 'シロハネ', 'キラリン', 'ピッカ'],
    growth: { hp: 0.95, mp: 1.2, str: 0.85, def: 0.9, agi: 1.35, mag: 1.3, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm11d_dz_peck'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11d_dz_flash']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'まばゆどり。仲間になると、暗い夜道で、はねをぼんやり光らせてくれる。',
  },
  c11d_hmirror: {
    rate: 1 / 13, mix: ['material'], names: ['テカガミ', 'ミラリン', 'ウツリン', 'キララ'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 1.0, agi: 1.0, mag: 1.45, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11d_hm_beam'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11d_hm_flash']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'てかがみ。仲間になると、出かける前に、ねぐせがないか見せてくれる。',
  },
  c11d_dawn: {
    rate: 1 / 14, mix: ['material'], names: ['アカツキ', 'アサヒ', 'ヨアケン', 'サンライ'],
    growth: { hp: 1.0, mp: 0.5, str: 1.35, def: 1.0, agi: 1.35, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11d_dw_slash'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11d_dw_sun']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'あかつきナイト。仲間になると、朝いちばんに、おはようと起こしてくれる。',
  },
  c11d_shard: {
    rate: 1 / 24, mix: ['spirit'], names: ['カケラ', 'ホシクズ', 'キラボシ', 'ツブツブ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.75, def: 0.95, agi: 1.15, mag: 1.4, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11d_sh_beam'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11d_sh_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしのかけら。仲間になると、ねる前に、星のお話を1つしてくれる。',
  },
  c11d_nmirror: {
    rate: 1 / 14, mix: ['material'], names: ['ヨルカガミ', 'ホシウツシ', 'ネムリン', 'クロミラ'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 1.0, agi: 1.0, mag: 1.45, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11d_nm_beam'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11d_nm_sleep']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'よるのかがみ。仲間になると、ねむれない夜に、星空をうつして見せてくれる。',
  },
};

// 7しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C11D)) FRIENDS_C11D[sp].noFamily = true;
