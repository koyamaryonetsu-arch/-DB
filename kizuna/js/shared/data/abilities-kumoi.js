// 第5章 Step 3・4「クモイ地方」と「しずみゆく島の古い神殿」の 魔物と ガイアイーターの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（gaiaFeed … 土はこび・gaiaEat … 土を 食べる）は shared/battle-gaia.js の gaiaEffect
export const KUMOI_ABILITIES = {
  // ── クモイ地方 ──
  // 雲ひつじ
  m_wool_tackle: {
    name: 'もこもこタックル', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, acc: 0.9 }, cast: '{a}は、もこもこの体で、{t}に体当たりしてきた！', anim: 'wool_tackle',
    desc: 'もこもこの雲の体で、1人に体当たりする。',
  },
  m_sleep_cloud: {
    name: 'ねむり雲', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] }, cast: '{a}の毛から、ふわふわのねむり雲がひろがった…！', anim: 'sleep_cloud',
    desc: 'ねむり雲で、敵みんなをねむらせることがある。',
  },
  m_wool_puff: {
    name: '毛をふくらませる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 25 }, cast: '{a}の雲の毛が、ぷっくりふくらんだ！', anim: 'guard',
    desc: '雲の毛をふくらませて、守りを上げる。',
  },
  // 空とびエイ
  m_ray_glide: {
    name: '急降下', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, acc: 0.9 }, cast: '{a}は、雲の上から{t}に、まっすぐまいおりてきた！', anim: 'ray_glide',
    desc: '空の上から、1人にまいおりて攻撃する。',
  },
  m_ray_sting: {
    name: '雷のしっぽ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.0, element: 'bolt', status: { status: 'paralyze', chance: 0.25, turns: [1, 1] } }, cast: '{a}は、ぱちぱち光るしっぽで、{t}をたたいた！', anim: 'ray_sting',
    desc: '雷のしっぽでたたく。しびれさせることがある。',
  },
  m_ray_wave: {
    name: '雲の波', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [36, 46], thr: 99 }, cast: '{a}が大きなひれをふると、雲の波がおしよせた！', anim: 'cloud_wave',
    desc: '雲の波をおこして、敵みんなにダメージ。',
  },
  // かみなりぐも
  m_puff_bolt: {
    name: 'いなずま', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [72, 88], thr: 99 }, cast: '{a}がゴロゴロ鳴って、{t}にいなずまがおちた！', anim: 'puff_bolt',
    desc: '1人にいなずまをおとす。',
  },
  m_puff_rain: {
    name: 'かみなりの雨', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [40, 50], thr: 99 }, cast: '{a}が大きくふくらんで、いなずまの雨がふりそそいだ！', anim: 'thunder_rain',
    desc: 'いなずまの雨をふらせて、敵みんなにダメージ。',
  },
  m_puff_charge: {
    name: '雷をためる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'mag', mult: 1.3, dur: 25 }, cast: '{a}は、ゴロゴロと雷をためている…！', anim: 'buff',
    desc: '雷をためて、魔力を上げる。',
  },
  // 雲海へび
  m_serpent_bind: {
    name: 'しめつける', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, debuff: { stat: 'agi', mult: 0.7, dur: 25, chance: 0.8 } }, cast: '{a}は、長い体で{t}をぐるぐるとしめつけた！', anim: 'serpent_bind',
    desc: '長い体でしめつける。素早さが下がる。',
  },
  m_serpent_breath: {
    name: '雲のいき', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [42, 52], thr: 99, breath: true }, cast: '{a}は、つめたい雲のいきをはきだした！', anim: 'cloud_breath',
    desc: 'つめたい雲のいきで、敵みんなにダメージ。',
  },

  // ── しずみゆく島の 古い神殿 ──
  // 石の守り手
  m_keeper_stomp: {
    name: '大地の足ぶみ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.85, ignoreDef: 0.15 }, cast: '{a}は、石の足で大地をふみならした！\n神殿が、ぐらぐらゆれる！', anim: 'stomp',
    desc: '大地をふみならして、敵みんなにダメージ。',
  },
  m_keeper_wall: {
    name: '石のかべ', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 25 }, cast: '{a}の体が、石のかべのようにかたまった！', anim: 'guard',
    desc: '石のかべのようにかたまって、守りを大きく上げる。',
  },
  // 岩もぐら
  m_mole_drill: {
    name: 'ドリルづめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, ignoreDef: 0.25, acc: 0.92 }, cast: '{a}は、ツメを回して、{t}につっこんできた！', anim: 'mole_drill',
    desc: '回るツメでつっこむ。守りを少しつらぬく。',
  },
  m_mole_dirt: {
    name: '土かけ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'status', status: 'blind', chance: 0.45, turns: [2, 3] }, cast: '{a}は、{t}の顔に土をかけた！', anim: 'dirt_throw',
    desc: '土をかけて、目をくらませることがある。',
  },
  // つちくいムカデ
  m_larva_fang: {
    name: '毒のキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.15, status: { status: 'poison', chance: 0.5 } }, cast: '{a}は、毒のキバで{t}にかみついた！', anim: 'larva_fang',
    desc: '毒のキバでかみつく。毒にすることがある。',
  },
  m_larva_curl: {
    name: 'まるまる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 25 }, cast: '{a}は、くるりとまるまった！', anim: 'guard',
    desc: 'まるまって、守りを上げる。',
  },
  // はにわ兵
  m_haniwa_spear: {
    name: '土のやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, acc: 0.95 }, cast: '{a}は、土のやりで{t}をついた！', anim: 'haniwa_spear',
    desc: '土のやりで、1人をつく。',
  },
  m_haniwa_song: {
    name: 'ふしぎな歌', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.25, turns: [1, 2] }, cast: '{a}は、ぽっかりあいた口で、ふしぎな歌を歌った…', anim: 'haniwa_song',
    desc: 'ふしぎな歌で、敵みんなを混乱させることがある。',
  },
  // 雲間のゆうれい
  m_wraith_chill: {
    name: 'つめたい手', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'ice', base: [96, 114], thr: 99 }, cast: '{a}は、つめたい手で{t}にふれた！', anim: 'wraith_chill',
    desc: 'こおりのようにつめたい手で、1人にダメージ。',
  },
  m_wraith_mist: {
    name: '雲のきり', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.35, turns: [2, 3] }, cast: '{a}のまわりから、こい雲のきりがわきだした…！', anim: 'mist',
    desc: 'こいきりで、敵みんなの目をくらませることがある。',
  },
  // 雷雲ワイバーン
  m_wyvern_dive: {
    name: 'つばさの急降下', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, acc: 0.9 }, cast: '{a}は、雷雲の上から{t}にとびかかった！', anim: 'wyvern_dive',
    desc: '空の上から、1人にとびかかる。',
  },
  m_wyvern_thunder: {
    name: 'いかずちのいき', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [62, 76], thr: 99, breath: true }, cast: '{a}は、いかずちのいきをはきだした！', anim: 'thunder_breath',
    desc: 'いかずちのいきで、敵みんなにダメージ。',
  },
  m_wyvern_tail: {
    name: 'しっぽでうつ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.15, status: { status: 'paralyze', chance: 0.2, turns: [1, 1] } }, cast: '{a}は、雷をまとったしっぽで{t}をうった！', anim: 'tail_whip',
    desc: 'しっぽでうつ。しびれさせることがある。',
  },

  // ── ガイアイーター（多部位。shared/battle-gaia.js）──
  // 頭
  m_gaia_bite: {
    name: 'かみくだく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, debuff: { stat: 'def', mult: 0.8, dur: 20, chance: 0.7 } }, cast: '{a}は、大あごで{t}をかみくだこうとした！', anim: 'gaia_bite',
    desc: '大あごでかみくだく。守備力が下がる。',
  },
  m_gaia_dust: {
    name: '土石のいき', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', base: [150, 175], thr: 99, breath: true }, cast: '{a}は、土と石のいきをはきだした！', anim: 'gaia_dust',
    desc: '土と石のいきで、敵みんなにダメージ。',
  },
  // 前ぶれ「大あごを 大きく 開けた」→ つぎの 番に 大地のみこみ（みんなに 物理。守りを 半分 むし。身を 守ると 半分）
  m_gaia_maw: {
    name: '大地のみこみの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_gaia_devour' }, cast: '{a}が、大あごを大きく開けた…！\n島の土が、すいこまれていく…！', anim: 'maw_charge',
    desc: '次の番に「大地のみこみ」。身を守ろう。',
  },
  m_gaia_devour: {
    name: '大地のみこみ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.45, ignoreDef: 0.5 }, cast: '{a}の、大地のみこみ！\n大地ごと、みんなをのみこもうとする！', anim: 'gaia_devour',
    desc: '大地ごとのみこもうとする。敵みんなに、とても大きなダメージ。身を守ると半分になる。',
  },
  // 体
  m_gaia_coil: {
    name: 'まきつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, debuff: { stat: 'agi', mult: 0.7, dur: 25, chance: 0.7 } }, cast: '{a}は、{t}にぐるりとまきついた！', anim: 'gaia_coil',
    desc: '体でまきつく。素早さが下がる。',
  },
  m_gaia_eat: {
    name: '土を食べる', kind: 'monster', target: 'self',
    effect: { type: 'gaiaEat', pct: 0.06 }, cast: '{a}は、島の土をばりばりと食べた！', anim: 'gaia_eat',
    desc: '島の土を食べて、キズをふさぐ。',
  },
  // 前ぶれ「とぐろを まいた」→ つぎの 番に 大地ゆるがし
  m_gaia_rumble: {
    name: '大地ゆるがしの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_gaia_quake' }, cast: '{a}が、体を大きくとぐろにまいた…！\n島が、ゆれ始めた…！', anim: 'rumble_charge',
    desc: '次の番に「大地ゆるがし」。身を守ろう。',
  },
  m_gaia_quake: {
    name: '大地ゆるがし', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.25, ignoreDef: 0.3 }, cast: '{a}の、大地ゆるがし！\n島がまっぷたつにわれそうなほど、ゆれた！', anim: 'gaia_quake',
    desc: '島をゆるがして、敵みんなに大きなダメージ。身を守ると半分になる。',
  },
  // しっぽ
  m_gaia_sting: {
    name: '毒ばり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, status: { status: 'poison', chance: 0.6 } }, cast: '{a}は、毒ばりで{t}をさした！', anim: 'gaia_sting',
    desc: '毒ばりでさす。毒にすることがある。',
  },
  m_gaia_feed: {
    name: '土はこび', kind: 'monster', target: 'self',
    effect: { type: 'gaiaFeed', pct: 0.05 }, cast: '{a}が、島の土をかき集めて、体にはこんだ！', anim: 'gaia_feed',
    desc: '島の土を体にはこんで、体と頭のキズをふさぐ。',
  },
  // 前ぶれ「毒ばりが むらさきに 光った」→ つぎの 番に 毒ばりの雨（ばらばらに 6回）
  m_gaia_needle_charge: {
    name: '毒ばりの雨の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_gaia_needles' }, cast: '{a}の先の毒ばりが、むらさきに光り始めた…！', anim: 'needle_charge',
    desc: '次の番に「毒ばりの雨」。身を守ろう。',
  },
  m_gaia_needles: {
    name: '毒ばりの雨', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.0, hits: 6, random: true }, cast: '{a}の、毒ばりの雨！\n毒ばりが、雨のようにふってきた！', anim: 'needle_rain',
    desc: '毒ばりを雨のようにふらせる。だれに当たるかは、わからない。身を守ると半分になる。',
  },
};
