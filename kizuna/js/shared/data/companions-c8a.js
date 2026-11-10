// 第2部 第8章 第1幕「月の王宮の うらぎり」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c7i.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の 月のスカラベだけ（第7章と おなじ きまり）。F〜C の 4しゅは noFamily
//   悪魔 F・植物 E・ドラゴン D・せいれい C・けもの A（docs/plan-r53-breed-more.md の 1 の 足りない 所。第7章の あとで 少ない 所）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、B〜S は 月のスカラベだけ
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
// ・ゲストの カリムは A（物語の ゲスト。docs/plan-ch8.md の 5-2）
export const FRIENDS_C8A = {
  // 悪魔 F（1/10）
  palace_guard: {
    rate: 1 / 10, mix: ['material'], names: ['ラズル', 'ターバン', 'ミカヅキ', 'エイスケ'],
    growth: { hp: 1.05, mp: 0.55, str: 1.25, def: 1.05, agi: 0.95, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm8n_pg_slash'], [9, 'sukara'], [14, 'm8n_pg_rush'], [20, 'm8n_pg_guard']],
    gear: { weapons: ['sword'], armor: ['heavy', 'cloth'], shield: true, head: 'helm' },
    note: '大臣にあやつられていた、王宮の衛兵。仲間になると、夜も目をこすりながら、みんなのねどこを見はってくれる。',
  },
  // 植物 E（1/11）
  sanbo: {
    rate: 1 / 11, mix: ['slime'], names: ['サボン', 'トゲマル', 'つみつみ', 'ノッポ'],
    growth: { hp: 1.15, mp: 0.55, str: 1.15, def: 1.05, agi: 0.6, mag: 0.75, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm8n_sb_needle'], [9, 'gira'], [14, 'm8n_sb_roll'], [20, 'm8n_sb_grow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'まるいサボテンがつみかさなった魔物。仲間になると、雨の日には、うれしくて1つずつのびる。',
  },
  // ドラゴン D（1/15）
  cobrar: {
    rate: 1 / 15, mix: ['beast'], names: ['コブスケ', 'ニョロ', 'ツボスケ', 'シャーリー'],
    growth: { hp: 1.0, mp: 0.6, str: 1.2, def: 0.95, agi: 1.15, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm8n_cb_bite'], [9, 'baikiruto'], [14, 'm8n_cb_jump'], [20, 'm8n_cb_glare']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'つぼの中からとび出すへび。仲間になると、お気に入りのつぼの中で、まるくなってねむる。',
  },
  // せいれい C（1/16）
  lamp_smoke: {
    rate: 1 / 16, mix: ['undead'], names: ['モクモク', 'ケムリン', 'ムラサキ', 'ゆらり'],
    growth: { hp: 0.9, mp: 1.2, str: 0.75, def: 0.85, agi: 1.15, mag: 1.4, heal: 0.75 },
    learn: [[1, 'gira'], [4, 'm8n_ls_arm'], [9, 'manusa'], [14, 'm8n_ls_smoke'], [20, 'begirama']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '黒いランプからもれ出た、けむりの精。仲間になると、たき火のけむりと、なかよくおしゃべりしている。',
  },
  // けもの A（なりにくい 1/26）
  moon_scarab: {
    rate: 1 / 26, mix: ['material'], names: ['ツキムシ', 'ギンカブ', 'スカラ', 'ふたつわれ'],
    growth: { hp: 0.95, mp: 0.95, str: 1.1, def: 1.2, agi: 1.15, mag: 1.0, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm8n_ms_beam'], [9, 'sukara'], [14, 'm8n_ms_split'], [20, 'm8n_ms_shine']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: '月の光で銀色にかがやくスカラベ。仲間になると、まい晩、2つにわれて、どちらが先に帰るか、きょうそうしている。',
  },
};

// F〜C の 4しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['palace_guard', 'sanbo', 'cobrar', 'lamp_smoke']) FRIENDS_C8A[sp].noFamily = true;
