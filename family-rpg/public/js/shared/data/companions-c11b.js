// 第3部 第3章 第2幕「月の都と、名前のランプ」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c11a.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・7しゅ とも 系統配合（familyPool）の 子には ならない（noFamily）
// ・ランクは 出現表から（tools/gen-monster-ranks.mjs の 表 … data/monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C11B = {
  c11b_moth: {
    rate: 1 / 11, mix: ['beast'], names: ['ツキアカリ', 'リンプン', 'ヒラリ', 'ランプガ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.75, def: 0.95, agi: 1.1, mag: 1.4, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11m_mt_powder'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11m_mt_glow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'つきあかりガ。仲間になると、夜の道で、はねのこなを光らせて明かりになってくれる。',
  },
  c11b_kage: {
    rate: 1 / 12, mix: ['undead'], names: ['ロジウラ', 'カゲスケ', 'ノビノビ', 'ウラボウ'],
    growth: { hp: 1.05, mp: 0.5, str: 1.2, def: 1.0, agi: 1.25, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm11m_kg_trip'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11m_kg_hide']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ろじうらぼうし。仲間になると、かくれんぼで、ぜったいに見つからない場所を教えてくれる。',
  },
  c11b_cat: {
    rate: 1 / 14, mix: ['beast'], names: ['ツキミ', 'ヤネノスケ', 'ミカヅキ', 'ニャンムーン'],
    growth: { hp: 1.0, mp: 0.5, str: 1.25, def: 0.9, agi: 1.4, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm11m_ct_claw'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11m_ct_moon']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'やねのつきみネコ。仲間になると、まん丸の月の夜に、いっしょに月を見てくれる。',
  },
  c11b_lamp: {
    rate: 1 / 13, mix: ['material'], names: ['ナフダ', 'ポッチ', 'ヒトモシ', 'ランプン'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 1.0, agi: 1.0, mag: 1.45, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11m_lp_flame'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11m_lp_name']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'なふだランプ。仲間になると、家族みんなの名前を、札に書いて下げてくれる。',
  },
  c11b_guard: {
    rate: 1 / 14, mix: ['material'], names: ['ハカリ', 'テンビン', 'ギンペイ', 'ヤリスケ'],
    growth: { hp: 1.25, mp: 0.4, str: 1.3, def: 1.45, agi: 0.6, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11m_gd_spear'], [9, 'sukara'], [14, 'm11m_gd_scale'], [20, 'baikiruto']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'はかりのへい。仲間になると、おやつを、みんなに同じだけ分けてくれる。',
  },
  c11b_dim: {
    rate: 1 / 10, mix: ['slime'], names: ['クスミ', 'ボンヤリ', 'スネボシ', 'ハイイロ'],
    growth: { hp: 1.15, mp: 0.6, str: 1.1, def: 1.15, agi: 0.75, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11m_dm_bump'], [9, 'hoimi'], [14, 'sukara'], [20, 'm11m_dm_dim']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'くすみぼし。仲間になると、少しずつ、また明るく光るようになる。',
  },
  c11b_cloud: {
    rate: 1 / 24, mix: ['spirit'], names: ['ワスレン', 'モクモク', 'ボンヤリン', 'キリスケ'],
    growth: { hp: 1.0, mp: 1.2, str: 0.8, def: 0.95, agi: 1.1, mag: 1.35, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11m_cl_mist'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11m_cl_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'わすれぐも。仲間になると、いやなことだけ、ふわっとわすれさせてくれる。',
  },
};

// 7しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C11B)) FRIENDS_C11B[sp].noFamily = true;
