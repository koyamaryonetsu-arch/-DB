// 第2部 第6章 Step 3・4「星めぐりの古道」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-past.js と おなじ）:
// ・ふつうの 魔物は 1/14〜1/18・強い 魔物（大きな 魔物・竜）は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_ROAD = {
  star_wolf: {
    rate: 1 / 16, names: ['ホシカゲ', 'セイザ', 'ギンガ', 'よぞらん'],
    growth: { hp: 1.05, mp: 0.6, str: 1.2, def: 0.95, agi: 1.2, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_tackle'], [4, 'm6_sw_fang'], [9, 'm6_sw_howl'], [14, 'baikiruto'], [20, 'm6_sw_pack']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '体に星座の線が光るオオカミ。仲間になると、夜道で星の光をたよりに先を歩いてくれる。',
  },
  sun_ram: {
    rate: 1 / 20, names: ['ヒナタ', 'モコモコ', 'キンメ', 'ひだまり'],
    growth: { hp: 1.25, mp: 0.8, str: 1.0, def: 1.25, agi: 0.55, mag: 0.7, heal: 1.0 },
    learn: [[1, 'hoimi'], [4, 'm6_sr_horn'], [9, 'm6_sr_wool'], [14, 'sukara'], [20, 'm6_sr_rush']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '金色の毛の大きなひつじ。仲間になると、毛の中がひだまりのようにあたたかい。めったに仲間にならない。',
  },
  dust_mole: {
    rate: 1 / 16, names: ['ホシモグ', 'キラッチ', 'ホリホリ', 'もぐら'],
    growth: { hp: 1.05, mp: 0.6, str: 1.15, def: 1.15, agi: 0.85, mag: 0.7, heal: 0.55 },
    learn: [[1, 'm_tackle'], [4, 'm6_dm_claw'], [9, 'm6_dm_pile'], [14, 'baikiruto'], [20, 'm6_dm_dust']],
    gear: { weapons: ['claw'], armor: ['cloth'], shield: false, head: 'hat' },
    note: '星くずをほるモグラ。仲間になると、ときどき地面から、きらきらの星くずをほり出してくる。',
  },
  warp_wisp: {
    rate: 1 / 16, names: ['ユラギ', 'ゆがみん', 'ワープ', 'ぐにゃ'],
    growth: { hp: 0.85, mp: 1.35, str: 0.65, def: 0.8, agi: 1.35, mag: 1.4, heal: 0.75 },
    learn: [[1, 'mera'], [4, 'm6_ww_flash'], [9, 'm6_ww_haste'], [14, 'merami'], [20, 'm6_ww_warp']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: '時のゆがみから生まれた精。仲間になると、ときどき時計が少しだけはやく進む。',
  },
  crab_star: {
    rate: 1 / 22, names: ['カニボシ', 'ガニー', 'セイザン', 'はさみん'],
    growth: { hp: 1.2, mp: 0.5, str: 1.2, def: 1.4, agi: 0.45, mag: 0.6, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm6_cb_pinch'], [9, 'kabau'], [14, 'm6_cb_shell'], [20, 'm6_cb_foam']],
    gear: { weapons: [], armor: ['heavy'], shield: true, head: false },
    note: 'こうらに星座のもようがある大きなカニ。仲間になると、仲間をかばってくれる。めったに仲間にならない。',
  },
  toki_owl: {
    rate: 1 / 18, names: ['ホウホウ', 'ヨミミ', 'トキワス', 'ふくまる'],
    growth: { hp: 0.95, mp: 1.1, str: 1.0, def: 0.85, agi: 1.15, mag: 1.2, heal: 0.75 },
    learn: [[1, 'm_tackle'], [4, 'm6_no_talon'], [9, 'm6_no_song'], [14, 'rariho'], [20, 'm6_no_eye']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '夜の古道を見はるフクロウ。仲間になると、夜でもよく見える目で、道を教えてくれる。',
  },
  twin_star: {
    rate: 1 / 18, names: ['フタボシ', 'ミラ', 'ツインク', 'ぴかやみ'],
    growth: { hp: 0.85, mp: 1.35, str: 0.65, def: 0.85, agi: 1.1, mag: 1.4, heal: 1.0 },
    learn: [[1, 'hoimi'], [4, 'm6_ts_spark'], [9, 'behoimi'], [14, 'm6_ts_swap'], [20, 'm6_ts_twin']],
    gear: { weapons: ['staff'], armor: ['cloth', 'robe'], shield: false, head: false },
    note: '光の顔と闇の顔をもつ、ふたごの星の精。仲間になると、2つの顔がかわりばんこに話しかけてくる。',
  },
  dust_drake: {
    rate: 1 / 24, names: ['ホシリュウ', 'クズドラ', 'スターダ', 'ほしまる'],
    growth: { hp: 1.25, mp: 0.6, str: 1.25, def: 1.2, agi: 0.6, mag: 0.6, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm6_dd_tail'], [9, 'm6_dd_roar'], [14, 'baikiruto'], [20, 'm6_dd_breath']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '星くずを食べて大きくなった竜。仲間になると、星くずのおやつをほしがる。めったに仲間にならない。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_ROAD)) f.noFamily = true;
