// 第44回（ポケモン P1。docs/plan-breed-new.md の 7-1）: ポケモンの 魔物 19しゅ（配合と 進化で 生まれる）
//
// ・家族だけで 遊ぶ ゲームなので、本物の 名前（家族の 答え。2026年10月25日）
// ・やせいには いない（breedOnly）。配合（data/companions-pokemon.js の レシピ）と 進化で 会える
//   レベルで 進化: ピカチュウ →（Lv25）ライチュウ・ヒトカゲ → リザード → リザードン（Lv25・Lv50）・ゼニガメ・フシギダネの 系統も おなじ
//   石で 進化: イーブイ → ブースター（ほのおのいし）・シャワーズ（みずのいし）・サンダース（かみなりのいし）・ブラッキー（つきのいし）
// ・ここの 数字（hp・str など）は 敵と して 出す とき の もの（いつか どこかの 物語で 敵に 出してよい。7-1 の 5）。
//   仲間の 強さは companions-pokemon.js の growth で きまる
// ・絵は client の 魔物の 絵（しゅぞくID で 引く。絵の 係 P2 が かく）
// ・lv は 図鑑の ならびと 敵の 強さの めやす（進化の 前ほど 小さい）
// monsters.js（MONSTERS）が まぜる。ここは ほかの データを import しない

const mon = (o) => ({ exp: 0, gold: 0, breedOnly: true, ...o });

export const MONSTERS_POKEMON = {
  // ───── でんき ─────
  pikachu: mon({
    name: 'ピカチュウ', lv: 15, hp: 120, mp: 40, str: 50, def: 36, agi: 62, mag: 46,
    race: 'beast', size: 's', hit: 'bite', resist: { bolt: 0.5, wind: 0.8, paralyze: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_thundershock' }, { w: 1, id: 'pk_quickattack' }],
    desc: 'ほっぺの電気ぶくろから電気を出す、黄色いネズミの魔物。なかよくなると、かたにのってくる。',
  }),
  raichu: mon({
    name: 'ライチュウ', lv: 32, hp: 300, mp: 70, str: 104, def: 72, agi: 110, mag: 96,
    race: 'beast', size: 'm', hit: 'bite', resist: { bolt: 0.4, wind: 0.8, paralyze: 0.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_thunderbolt' }, { w: 1, id: 'pk_quickattack' }, { w: 1, id: 'pk_thunderwave', cond: 'notRecent:pk_thunderwave' }],
    desc: 'ピカチュウが進化したすがた。長いしっぽで電気を地面ににがす。たまった電気で、10まんボルトを放つ。',
  }),
  // ───── ほのお ─────
  charmander: mon({
    name: 'ヒトカゲ', lv: 14, hp: 130, mp: 30, str: 52, def: 40, agi: 44, mag: 40,
    race: 'dragon', size: 's', hit: 'bite', resist: { fire: 0.5, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_ember' }],
    desc: 'しっぽの先に、ほのおがともっているトカゲの魔物。ほのおが元気よくもえているのは、元気なしるし。',
  }),
  charmeleon: mon({
    name: 'リザード', lv: 30, hp: 300, mp: 50, str: 100, def: 70, agi: 70, mag: 72,
    race: 'dragon', size: 'm', hit: 'slash', resist: { fire: 0.4, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_flamethrower' }, { w: 1, id: 'm_dragon_claw' }],
    desc: 'ヒトカゲが進化したすがた。するどいツメで切りかかり、しっぽをふって火の粉をまきちらす。',
  }),
  charizard: mon({
    name: 'リザードン', lv: 48, hp: 760, mp: 90, str: 180, def: 120, agi: 96, mag: 150,
    race: 'dragon', size: 'l', flying: true, hit: 'slash', resist: { fire: 0.3, ice: 0.8, wind: 0.7 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_flamethrower' }, { w: 1, id: 'pk_fireblast' }, { w: 1, id: 'm_dragon_claw' }],
    desc: 'リザードが進化したすがた。大きなつばさで空高くとび、岩もとかすほどの、はげしいほのおをはく。',
  }),
  // ───── みず ─────
  squirtle: mon({
    name: 'ゼニガメ', lv: 14, hp: 140, mp: 30, str: 44, def: 56, agi: 36, mag: 40,
    race: 'material', size: 's', hit: 'bite', resist: { fire: 0.5, ice: 0.5, bolt: 1.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_watergun' }, { w: 1, id: 'm_harden' }],
    desc: 'かたいこうらをせおった、小さなカメの魔物。こうらに首をひっこめて身を守り、口から水をとばす。',
  }),
  wartortle: mon({
    name: 'カメール', lv: 30, hp: 320, mp: 50, str: 86, def: 110, agi: 60, mag: 76,
    race: 'material', size: 'm', hit: 'bite', resist: { fire: 0.5, ice: 0.4, bolt: 1.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_surf' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: 'ゼニガメが進化したすがた。ふさふさの毛のはえた耳と、しっぽがじまん。長生きのしるしといわれる。',
  }),
  blastoise: mon({
    name: 'カメックス', lv: 48, hp: 820, mp: 90, str: 150, def: 190, agi: 70, mag: 140,
    race: 'material', size: 'l', hit: 'bite', resist: { fire: 0.4, ice: 0.3, bolt: 1.4 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_hydropump' }, { w: 1, id: 'pk_surf' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: 'カメールが進化したすがた。こうらの大きなたいほうから、ものすごいいきおいの水をうち出す。',
  }),
  // ───── くさ ─────
  bulbasaur: mon({
    name: 'フシギダネ', lv: 13, hp: 140, mp: 40, str: 44, def: 46, agi: 36, mag: 44,
    race: 'plant', size: 's', hit: 'bite', resist: { fire: 1.5, ice: 1.3, wind: 1.3, bolt: 0.7, poison: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_vinewhip' }, { w: 1, id: 'pk_sleeppowder' }],
    desc: 'せなかに大きなたねをせおった魔物。たねはお日さまの光をあびて、少しずつ大きくなる。',
  }),
  ivysaur: mon({
    name: 'フシギソウ', lv: 30, hp: 330, mp: 70, str: 88, def: 86, agi: 60, mag: 84,
    race: 'plant', size: 'm', hit: 'bite', resist: { fire: 1.5, ice: 1.3, wind: 1.3, bolt: 0.6, poison: 0.4 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_razorleaf' }, { w: 1, id: 'pk_sleeppowder' }],
    desc: 'フシギダネが進化したすがた。せなかのつぼみがふくらんで、あまいかおりがただよう。',
  }),
  venusaur: mon({
    name: 'フシギバナ', lv: 48, hp: 840, mp: 110, str: 150, def: 150, agi: 70, mag: 160,
    race: 'plant', size: 'l', hit: 'bite', resist: { fire: 1.4, ice: 1.2, wind: 1.2, bolt: 0.5, poison: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_solarbeam' }, { w: 1, id: 'pk_razorleaf' }, { w: 1, id: 'pk_sleeppowder', cond: 'notRecent:pk_sleeppowder' }],
    desc: 'フシギソウが進化したすがた。せなかの大きな花が、お日さまの光を集めて、光の線をうち出す。',
  }),
  // ───── イーブイと 石で 進化した すがた ─────
  eevee: mon({
    name: 'イーブイ', lv: 16, hp: 140, mp: 40, str: 50, def: 44, agi: 52, mag: 44,
    race: 'beast', size: 's', hit: 'bite', resist: {},
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_quickattack' }, { w: 1, id: 'pk_swift' }],
    desc: 'ふわふわの毛の、小さなけものの魔物。ふしぎな石の力で、いろいろなすがたに進化するという。',
  }),
  flareon: mon({
    name: 'ブースター', lv: 34, hp: 340, mp: 60, str: 128, def: 80, agi: 76, mag: 90,
    race: 'beast', size: 'm', hit: 'bite', resist: { fire: 0.3, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_flamethrower' }, { w: 1, id: 'm_bite' }],
    desc: 'ほのおのいしで進化した、イーブイのすがた。体の中で、ほのおがもえている。',
  }),
  vaporeon: mon({
    name: 'シャワーズ', lv: 34, hp: 440, mp: 70, str: 84, def: 80, agi: 70, mag: 96,
    race: 'beast', size: 'm', hit: 'bite', resist: { fire: 0.5, ice: 0.5, bolt: 1.4 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_surf' }, { w: 1, id: 'pk_aquaring', cond: 'notRecent:pk_aquaring' }],
    desc: 'みずのいしで進化した、イーブイのすがた。水の中にとけて、見えなくなることができる。',
  }),
  jolteon: mon({
    name: 'サンダース', lv: 34, hp: 300, mp: 70, str: 90, def: 70, agi: 130, mag: 104,
    race: 'beast', size: 'm', hit: 'bite', resist: { bolt: 0.3, paralyze: 0.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_thunderbolt' }, { w: 1, id: 'pk_pinmissile' }],
    desc: 'かみなりのいしで進化した、イーブイのすがた。さか立った毛から、電気のはりをとばす。',
  }),
  umbreon: mon({
    name: 'ブラッキー', lv: 34, hp: 400, mp: 60, str: 88, def: 120, agi: 76, mag: 70,
    race: 'beast', size: 'm', hit: 'bite', resist: { dark: 0.4, light: 1.4, confuse: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_darkpulse' }, { w: 1, id: 'pk_confuseray' }],
    desc: 'つきのいしで進化した、イーブイのすがた。月の光をあびると、体のわっかがぼんやり光る。',
  }),
  // ───── 進化しない ポケモン ─────
  snorlax: mon({
    name: 'カビゴン', lv: 36, hp: 900, mp: 50, str: 130, def: 100, agi: 26, mag: 50,
    race: 'beast', size: 'l', hit: 'bite', resist: { poison: 0.5, sleep: 0.5, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'pk_bodyslam' }, { w: 1, id: 'pk_rest', cond: 'hpBelow:0.5' }],
    desc: '食べてはねて、またねむる、とても大きなけものの魔物。おなかの上で子どもたちが遊んでも起きない。',
  }),
  gengar: mon({
    name: 'ゲンガー', lv: 34, hp: 300, mp: 100, str: 70, def: 70, agi: 110, mag: 130,
    race: 'undead', size: 'm', flying: true, hit: 'bite', resist: { dark: 0.5, light: 1.6, poison: 0, sleep: 0.5 },
    actions: [{ w: 2, id: 'attack' }, { w: 2, id: 'pk_shadowball' }, { w: 1, id: 'pk_hypnosis' }],
    desc: '影の中にひそむ、いたずら好きのゆうれいの魔物。くらい夜に、ニヤリとわらってあらわれる。',
  }),
  // ───── まぼろし ─────
  mew: mon({
    name: 'ミュウ', lv: 60, hp: 900, mp: 200, str: 160, def: 150, agi: 150, mag: 180,
    race: 'spirit', size: 's', flying: true, hit: 'bite',
    resist: { dark: 1.2, sleep: 0.5, poison: 0.5, confuse: 0.3, paralyze: 0.5 },
    actions: [{ w: 2, id: 'attack' }, { w: 2, id: 'pk_psychic' }, { w: 1, id: 'pk_shadowball' }],
    desc: '空にうかぶ、ピンク色のまぼろしの魔物。どんな技でも覚えられるという。会えた人は、ほとんどいない。',
  }),
};
