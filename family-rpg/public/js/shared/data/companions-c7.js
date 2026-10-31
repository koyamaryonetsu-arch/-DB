// 第2部 第7章 第1幕「緑の王国」の 魔物の 仲間（companions.js で まぜる）と、ゲスト・酒場の カリム（名前の 約束 docs/plan-ch7.md の 3）
// 第26回の きまり（data/companions-tokei6.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js。docs/plan-r53-breed-more.md の 4 の A）。10しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは B・A の 2しゅだけ（水のようま・のろいだま。第6章 Step 6 と おなじ）。F〜C の 8しゅは noFamily
//   （はじめの ころの 親どうしの 系統配合から Lv68 の 魔物が 生まれない ように。test/monsters-r23.test.js。まぜ配合では 生まれる）
//   ドラゴン F・悪魔 F・植物 E・物質 E・ドラゴン E・せいれい D・スライム D・ゾンビ C・せいれい B・ゾンビ A（docs/plan-r53-breed-more.md の 1 の 足りない 所）
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C7 = {
  // ドラゴン F（1/10）
  nokonoko: {
    rate: 1 / 10, mix: ['material'], names: ['ノコタ', 'コウラ', 'ミドリン', 'のそのそ'],
    growth: { hp: 1.1, mp: 0.5, str: 1.05, def: 1.4, agi: 0.85, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm7_nk_shell'], [9, 'sukara'], [14, 'm7_nk_hide'], [20, 'kabau']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: 'みどりのこうらのカメ。仲間になると、さんぽの時、いつもこうらをぴかぴかにみがいてくる。',
  },
  // 悪魔 F（1/10）
  crow_messenger: {
    rate: 1 / 10, mix: ['beast'], names: ['クロウ', 'カァスケ', 'ハネミ', 'くろまめ'],
    growth: { hp: 0.85, mp: 1.1, str: 0.95, def: 0.8, agi: 1.35, mag: 1.15, heal: 0.6 },
    learn: [[1, 'mera'], [4, 'm7_cw_peck'], [9, 'm7_cw_hex'], [14, 'medapani'], [20, 'm7_cw_caw']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '魔女のしらせをはこんでいた、黒いカラス。仲間になると、家族への手紙を、だれより早くとどけてくれる。',
  },
  // 植物 E（1/11）
  pakkun: {
    rate: 1 / 11, mix: ['dragon'], names: ['パックン', 'パクパク', 'ハナクチ', 'もぐもぐ'],
    growth: { hp: 1.1, mp: 0.7, str: 1.2, def: 1.0, agi: 0.7, mag: 0.8, heal: 0.5 },
    learn: [[1, 'mera'], [4, 'm7_pk_bite'], [9, 'm7_pk_fire'], [14, 'merami'], [20, 'baikiruto']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '大きな口の花。仲間になると、ごはんの時間になると、いちばんに口をパクパクさせる。',
  },
  // 物質 E（1/11）
  card_soldier: {
    rate: 1 / 11, mix: ['demon'], names: ['ハート', 'スペード', 'ジャック', 'トランプン'],
    growth: { hp: 1.0, mp: 0.5, str: 1.2, def: 1.15, agi: 1.0, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_swing'], [4, 'm7_cs_spear'], [9, 'sukara'], [14, 'm7_cs_march'], [20, 'kabau']],
    gear: { weapons: ['spear'], armor: ['heavy'], shield: true, head: 'helm' },
    note: 'トランプの体の兵。仲間になると、ならぶ時はいつも、まっすぐ一列にならびたがる。',
  },
  // ドラゴン E（1/11）
  uzu_eel: {
    rate: 1 / 11, mix: ['slime'], names: ['ウツボン', 'ニョロ', 'キイロメ', 'うずまる'],
    growth: { hp: 1.15, mp: 0.6, str: 1.25, def: 0.95, agi: 0.95, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_tackle'], [4, 'm7_ue_bite'], [9, 'baikiruto'], [14, 'm7_ue_swirl'], [20, 'sukara']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: '水路にすむ大きなウツボ。仲間になると、おふろに入ると、なかなか出てこない。',
  },
  // せいれい D（1/15）
  march_broom: {
    rate: 1 / 15, mix: ['material'], names: ['ザッザ', 'ホウキン', 'バケツ', 'おそうじ'],
    growth: { hp: 0.95, mp: 1.05, str: 0.95, def: 0.9, agi: 1.15, mag: 1.15, heal: 0.75 },
    learn: [[1, 'hoimi'], [4, 'm7_mb_bucket'], [9, 'm7_mb_sweep'], [14, 'behoimi'], [20, 'piorimu']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '魔法で動き出した水くみのほうき。仲間になると、だれもたのんでいないのに、町じゅうをそうじしてしまう。',
  },
  // スライム D（1/15）
  gesso: {
    rate: 1 / 15, mix: ['spirit'], names: ['ゲソゲソ', 'イカリン', 'しろまる', 'ふわイカ'],
    growth: { hp: 0.9, mp: 1.05, str: 0.95, def: 0.85, agi: 1.3, mag: 1.15, heal: 0.6 },
    learn: [[1, 'hyado'], [4, 'm7_gs_dash'], [9, 'm7_gs_ink'], [14, 'hyadaruko'], [20, 'piorimu']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '水の中をふわふわおよぐ白いイカ。仲間になると、びっくりした時に、すみをはいてしまう。',
  },
  // ゾンビ C（1/16）
  teresa: {
    rate: 1 / 16, mix: ['spirit'], names: ['テレテレ', 'ブーブー', 'しろぼう', 'はずかし'],
    growth: { hp: 0.9, mp: 1.1, str: 1.0, def: 0.85, agi: 1.2, mag: 1.2, heal: 0.6 },
    learn: [[1, 'mera'], [4, 'm7_tr_boo'], [9, 'm7_tr_tongue'], [14, 'm7_tr_shy'], [20, 'medapani']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'まるい白いおばけ。仲間になると、写真をとろうとすると、いつも顔をかくしてしまう。',
  },
  // せいれい B（なりにくい 1/22）
  water_youma: {
    rate: 1 / 22, mix: ['demon'], names: ['ミズハ', 'アクア', 'しずく', 'ナミヨ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.8, def: 0.9, agi: 1.1, mag: 1.35, heal: 0.75 },
    learn: [[1, 'hyado'], [4, 'm7_wy_lash'], [9, 'm7_wy_mist'], [14, 'hyadaruko'], [20, 'm7_wy_drain']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: '神殿の水にひそんでいた、ようま。仲間になると、のどがかわいた人に、そっと水をくれる。',
  },
  // ゾンビ A（なりにくい 1/26）
  curse_lump: {
    rate: 1 / 26, mix: ['demon'], names: ['ノロイ', 'モヤモヤ', 'ドンヨリ', 'たくさんめ'],
    growth: { hp: 1.05, mp: 1.1, str: 1.1, def: 0.95, agi: 0.9, mag: 1.25, heal: 0.5 },
    learn: [[1, 'mera'], [4, 'm7_cl_hands'], [9, 'm7_cl_eye'], [14, 'hyadaruko'], [20, 'm7_cl_storm']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: 'いやな思いがかたまった、のろいのかたまり。仲間になると、みんなのいやな気持ちを、すいとって小さくなる。',
  },
};

// F〜C の 8しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['nokonoko', 'crow_messenger', 'pakkun', 'card_soldier', 'uzu_eel', 'march_broom', 'gesso', 'teresa']) FRIENDS_C7[sp].noFamily = true;

// ───── ゲストの カリム（千年前の 若い 騎士。たてで みんなを 守る）─────
// A が 台本の ['guest', 'karim'] で 入れる（c7_kingdom で 入る・Step 2 の さいごまで）。data/shops.js の GUESTS.karim
// world/party.js の guestChar → makeNpcSupportChar で、レベルは パーティーの いちばん 高い レベル（minLevel より 下には ならない）
// 職業は ガーディアン（守りの 頂点。たて・重い よろい・かぶと）。作戦は バランス
// その子だけの 技（ひらめき技として 入る）: 王家のたて（仲間みんなの 守備力を 大きく 上げる。abilities-c7.js の kr7_shield）
// 装備は 緑の王国の 店の 品（items-c7.js）
export const KARIM_GUEST = {
  id: 'guest_karim', name: 'カリム', job: 'guardian', tactics: 'balanced', minLevel: 68,
  look: { body: 0, hair: 0, hairColor: 0, skin: 1, color: 2, style: 'short', hcol: 'black', tone: 'tan', face: 'brave' },
  skills: ['kr7_shield'],
  gear: { weapon: 'c7_kingdom_spear', armor: 'c7_kingdom_mail', shield: 'c7_kingdom_shield', head: 'c7_kingdom_helm' },
};

// ───── 仲間に なった あとの 酒場の カリム（c7_karim から。A が 台本で 酒場に ならべる … shops.js の NPC_SUPPORTS と おなじ 形）─────
//   ミナモ（story-ch6d.js の MINAMO_SUPPORT）・ノクト（companions-castle.js の NOCTO_COMPANION）と おなじ。強さは ゲストの ときと おなじ 形
//   （レベルは パーティーの いちばん 高い レベル・ガーディアン・王家のたて・緑の王国の 店の 装備）
export const KARIM_SUPPORT = {
  ...KARIM_GUEST, id: 'npc_karim', minLevel: 70, unlock: 'c7_karim',
  desc: '千年前の緑の王国の、若い騎士。まじめで、王家のたてで、みんなを守ってくれる。',
};
