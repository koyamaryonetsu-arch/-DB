// 第3部 第1章 第2幕「鉱山の底の先」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c9a.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。6しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは 大ミミズだけ（第1幕の 石の子どもと おなじ きまり）。ほかは noFamily
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C9B = {
  c9b_crab: {
    rate: 1 / 12, mix: ['material'], names: ['スイショウ', 'カニマル', 'キラハサミ', 'ガニー'],
    growth: { hp: 1.15, mp: 0.5, str: 1.2, def: 1.4, agi: 0.6, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9u_cr_pinch'], [9, 'sukara'], [14, 'm9u_cr_shell'], [20, 'm9u_cr_bubble']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'すいしょうのこうらのカニ。仲間になると、こうらのすいしょうを、毎日ていねいにみがいている。',
  },
  c9b_kinoko: {
    rate: 1 / 10, mix: ['slime'], names: ['ヒカリタケ', 'ポワン', 'アカリ', 'キノピカ'],
    growth: { hp: 1.15, mp: 0.95, str: 1.0, def: 1.1, agi: 0.7, mag: 1.0, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm9u_kn_bonk'], [9, 'hoimi'], [14, 'm9u_kn_spore'], [20, 'm9u_kn_glow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '光るキノコ。仲間になると、ねる前に、かさの明かりを少しだけ小さくしてくれる。',
  },
  c9b_bat: {
    rate: 1 / 11, mix: ['demon'], names: ['キーン', 'バタバタ', 'ヨルミ', 'コウちゃん'],
    growth: { hp: 0.95, mp: 0.6, str: 1.25, def: 0.9, agi: 1.45, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9u_bt_fang'], [9, 'baikiruto'], [14, 'm9u_bt_dive'], [20, 'm9u_bt_wave']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '大地の下のコウモリ。仲間になると、さかさまにぶら下がって、ぐっすりねむる。',
  },
  c9b_mimizu: {
    rate: 1 / 24, mix: ['dragon'], names: ['ニョロン', 'クラミミ', 'ナガナガ', 'モグモグ'],
    growth: { hp: 1.35, mp: 0.5, str: 1.3, def: 1.15, agi: 0.75, mag: 0.55, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9u_mz_wrap'], [9, 'sukara'], [14, 'm9u_mz_dust'], [20, 'm9u_mz_dig']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '暗やみの大きなミミズ。仲間になると、明るいところにも、少しずつなれてきた。',
  },
  c9b_mole_spear: {
    rate: 1 / 14, mix: ['beast'], names: ['モグヤリ', 'ツンツン', 'ヘイタイ', 'モグスケ'],
    growth: { hp: 1.1, mp: 0.5, str: 1.35, def: 1.15, agi: 1.0, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9u_ms_poke'], [9, 'baikiruto'], [14, 'm9u_ms_ehhen'], [20, 'm9u_ms_line']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'もぐらの兵隊。仲間になると、だれもいないのに、ときどき「えっへん」といばっている。',
  },
  c9b_mole_pot: {
    rate: 1 / 16, mix: ['plant'], names: ['ナベスケ', 'オタマ', 'モグナベ', 'グツグツ'],
    growth: { hp: 1.2, mp: 0.8, str: 1.1, def: 1.25, agi: 0.65, mag: 0.85, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm9u_mp_ladle'], [9, 'hoimi'], [14, 'm9u_mp_lid'], [20, 'm9u_mp_soup']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'なべをかぶったもぐら。仲間になると、ごはんの時間に、あつあつのスープを作ってくれる。',
  },
};

// 大ミミズ いがいの 5しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['c9b_crab', 'c9b_kinoko', 'c9b_bat', 'c9b_mole_spear', 'c9b_mole_pot']) FRIENDS_C9B[sp].noFamily = true;
