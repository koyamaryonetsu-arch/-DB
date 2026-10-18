// 第5章 Step 6・7「根の島」と「大地の神殿」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-hoshiyomi.js と おなじ）:
// ・ふつうの 魔物は 1/12〜1/18・強い 魔物（神殿の 深い 階の 魔物）は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（まもる・のみこむ・ノクトの 技は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）
// ・天空のまもり兵 × 物質系の S ＋ ノクトの 品（大地のかけらのお守り）→ ボス級「天空のきょ兵」（data/monsters-boss.js の 素材配合）
export const FRIENDS_EARTH = {
  root_sprite: {
    rate: 1 / 12, names: ['コロン', 'ネッコ', 'カラコロ', 'ちびね'],
    growth: { hp: 0.9, mp: 1.05, str: 0.9, def: 1.0, agi: 1.4, mag: 1.0, heal: 0.75 },
    learn: [[1, 'm_tackle'], [4, 'm_rs_root'], [8, 'hoimi'], [13, 'm_rs_rattle'], [19, 'behoimi']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '木の根から生まれた、小さな森のせいれい。頭をからから鳴らして、ついてくる。',
  },
  sky_guard: {
    rate: 1 / 18, names: ['マモル', 'ロボ', 'テツ', 'そらまる'],
    growth: { hp: 1.2, mp: 0.5, str: 1.2, def: 1.3, agi: 0.55, mag: 0.75, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm_sg_arm'], [9, 'kabau'], [14, 'sukara'], [20, 'm_sg_beam']],
    gear: { weapons: [], armor: ['heavy'], shield: true, head: false },
    note: '空の古い城を守っていた機械の兵。今は仲間を守って、目からビームを出す。',
  },
  earth_pillbug: {
    rate: 1 / 22, names: ['ダンゴ', 'コロコロ', 'まるお', 'ゴロン'],
    growth: { hp: 1.25, mp: 0.45, str: 1.15, def: 1.4, agi: 0.55, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_tackle'], [4, 'm_pb_curl'], [9, 'm_pb_roll'], [14, 'sukara'], [20, 'm_pb_stomp']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '大地の下にすむ大きなダンゴムシ。仲間になると、もうおこらない。めったに仲間にならない。',
  },
  faceless_shade: {
    rate: 1 / 22, names: ['オメン', 'ポツリ', 'シロメン', 'ひとりん'],
    growth: { hp: 1.05, mp: 1.25, str: 0.8, def: 0.9, agi: 1.0, mag: 1.35, heal: 0.6 },
    learn: [[1, 'mera'], [4, 'm_fs_grab'], [9, 'manusa'], [14, 'm_fs_gold'], [20, 'merami']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: 'お面をつけた、顔のない影。仲間になると、もうさびしくない。めったに仲間にならない。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_EARTH)) f.noFamily = true;
