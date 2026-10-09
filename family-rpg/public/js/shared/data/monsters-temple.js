// 第4章 Step 7「砂の底の神殿とモルガナ」の 魔物（B: 戦い）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch4-temple-art.js。たたかいの しかけは shared/battle-temple.js
//
// 出現表（encounters-temple.js）: t_b1_wet＝地下1階（水が 高い: 水の 魔物）t_b1_dry＝地下1階（水が 低い: 砂の 魔物）
//   t_b2＝鏡の間 t_b3＝水のろう。昼と 夜の 区別は ない
//
// ・鏡の騎士（mirror_knight）・まどわしの鏡（trick_mirror）: 体が 光ると、つぎの 自分の 番まで 呪文を はね返す（reflect）
// ・鏡のうつし身（utsushimi）: きまった 戦いの はじめに、パーティーの 人数ぶんの「〇〇のうつし身」に かわる（battle-temple.js）。
//   ここの すうちは 図鑑と ほうしゅう（1体ぶん。経験値・お金は きまった 値）
// ・水のろう（water_prison）: 真の すがたの モルガナが 作る ろう。こわすと 中の 仲間が 早く 出られる（経験値なし）
// ・モルガナ（morgana）: まぼろしの 分身（battle-ch4.js の mirage。分身に 当てると モルガナの HPが 回復）・水の衣（veil）・鏡写し（mirrorCopy）
// ・モルガナ 真の すがた（morgana_true）: 大波（2だんの 前ぶれ）・水のろう・鏡のうろこ（reflect）

// ボスの じょうたい いじょうの 効きにくさ（第3章・第4章の ボスと おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
// 水の ろう: じょうたい いじょうは 効かない
const NO_STATUS = { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0, debuff: 0 };

export const MONSTERS_TEMPLE = {
  // ── 地下1階（水が 高い）: 水の 魔物 ──
  // 水の精: 仲間を 回復する。先に たおす
  water_spirit: {
    name: '水の精', lv: 36, hp: 420, mp: 160, str: 108, def: 80, agi: 66, mag: 130, exp: 370, gold: 170,
    race: 'spirit', size: 'm', flying: true,
    resist: { bolt: 1.4, fire: 0.5, ice: 0.6, poison: 0, sleep: 0.5, confuse: 0.6, blind: 0.5 }, drops: { common: ['magic_water', 14], rare: ['seed_mag', 48] },
    actions: [
      { w: 4, id: 'm_spirit_mend', cond: 'allyHurt' }, { w: 3, id: 'm_water_shot' }, { w: 2, id: 'm_water_rain', cond: 'notRecent:m_water_rain' }, { w: 2, id: 'attack' },
    ],
    desc: '神殿にためこまれた水から生まれた、水の精。いやしの水で、仲間のキズを回復する。先にたおそう。雷がよく効く。',
  },
  // 水竜: 水の ブレス（みんな）。大きな 体
  water_dragon: {
    name: '水竜', lv: 37, hp: 640, mp: 60, str: 146, def: 96, agi: 50, mag: 90, exp: 430, gold: 190,
    race: 'dragon', size: 'l', hit: 'bite',
    resist: { bolt: 1.4, fire: 0.5, ice: 0.7, poison: 0.5, sleep: 0.3, confuse: 0.5 }, drops: { common: ['moonherb', 8], rare: ['seed_hp', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_dragon_bite' }, { w: 2, id: 'm_water_breath', cond: 'notRecent:m_water_breath' }, { w: 1, id: 'm_dragon_tail' }],
    desc: '神殿の水路をおよぐ、青い竜。水のブレスで、敵みんなをおそう。雷がよく効き、炎は効きにくい。',
  },
  // ── 地下1階（水が 低い）: 砂の 魔物 ──
  // 砂ガニ: かたい こうら。はさみを かまえると 反撃の構え
  sand_crab: {
    name: '砂ガニ', lv: 37, hp: 520, str: 142, def: 140, agi: 40, mag: 20, exp: 410, gold: 180,
    race: 'beast', size: 'm', hit: 'slash',
    resist: { bolt: 1.35, ice: 1.2, fire: 0.8, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['antidote', 5], rare: ['seed_def', 40] },
    actions: [
      { w: 4, id: 'attack' }, { w: 2, id: 'm_scissor_combo' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' },
      { w: 1, id: 'm_claw_guard', cond: 'notRecent:m_claw_guard' },
    ],
    desc: '水が引いた神殿のゆかで、砂にもぐってくらす大きなカニ。こうらがとてもかたい。はさみをかまえたら、反撃の構え。雷がよく効く。',
  },
  // ── 鏡の間（地下2階）──
  // 鏡の騎士: 体が 光ると（前ぶれの ことば）、つぎの 自分の 番まで 呪文を はね返す。光っていない 時は 守りが かたいので 呪文で
  mirror_knight: {
    name: '鏡の騎士', lv: 36, hp: 560, mp: 40, str: 144, def: 158, agi: 46, mag: 60, exp: 410, gold: 190,
    race: 'material', size: 'm', hit: 'slash',
    resist: { bolt: 1.3, blast: 1.25, light: 0.8, poison: 0, sleep: 0.2, confuse: 0.4, blind: 0.5 }, drops: { common: ['silver_shard', 10], rare: ['seed_def', 40] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_mirror_blade' }, { w: 3, id: 'm_knight_glow', cond: ['notRecent:m_knight_glow', 't:noReflect'] }],
    desc: '鏡の間を守る、鏡のよろいの騎士。守りがとてもかたい。体がまぶしく光ったら、次の番まで呪文をはね返す。光っている時は、武器で戦おう。',
  },
  // まどわしの鏡: うかぶ 手鏡。まどわしの 光（混乱）。光ると 呪文を はね返す
  trick_mirror: {
    name: 'まどわしの鏡', lv: 37, hp: 380, mp: 120, str: 100, def: 92, agi: 70, mag: 124, exp: 390, gold: 230,
    race: 'material', size: 's', flying: true,
    resist: { blast: 1.3, bolt: 1.2, light: 0.3, dark: 1.2, poison: 0, sleep: 0.3, confuse: 0, blind: 0 }, drops: { common: ['magic_water', 16], rare: ['seed_agi', 48] },
    actions: [
      { w: 3, id: 'm_mirror_beam' }, { w: 2, id: 'm_trick_light', cond: 'notRecent:m_trick_light' }, { w: 2, id: 'attack' },
      { w: 2, id: 'm_mirror_glow', cond: ['notRecent:m_mirror_glow', 't:noReflect'] },
    ],
    desc: '鏡の間をふわふわとうかぶ、ふしぎな手鏡。あやしい光で、敵をまどわせる。体が光ったら、次の番まで呪文をはね返す。',
  },
  // ── 水のろう（地下3階）: ろうの 前の 番人（きまった 戦い prison_guards の 2体）──
  prison_guard: {
    name: '水のろうの番人', lv: 38, hp: 1500, mp: 120, str: 150, def: 112, agi: 48, mag: 112, exp: 1400, gold: 600,
    race: 'demon', size: 'm', hit: 'slash',
    resist: { bolt: 1.4, fire: 0.5, ice: 0.7, poison: 0.2, sleep: 0.2, confuse: 0.3, blind: 0.5 }, drops: { common: ['magic_water', 6], rare: ['seed_str', 32] },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_guard_spear' }, { w: 2, id: 'm_guard_whirl', cond: 'notRecent:m_guard_whirl' },
      { w: 1, id: 'm_guard_chain', cond: 'notRecent:m_guard_chain' }, { w: 1, id: 'm_guard_wall', cond: 'notRecent:m_guard_wall' },
    ],
    desc: 'モルガナに作られた、水のろうの番人。水のほこで、ろうに近づく者をはらいのける。雷がよく効き、炎は効きにくい。',
  },
  // ── 鏡のうつし身（鏡の間の きまった 戦い utsushimi）──
  // 戦いの はじめに パーティーの 人数ぶんの「〇〇のうつし身」に かわる（battle-temple.js の setupUtsushimi）。
  // 強さ・技・見た目は うつした 人から。ここの exp・gold は 1体ぶんの きまった 値
  utsushimi: {
    name: '鏡のうつし身', lv: 38, hp: 400, str: 120, def: 90, agi: 50, mag: 60, exp: 1500, gold: 450,
    race: 'human', size: 'm', hit: 'slash', resist: {}, drops: { common: ['magic_water', 8], rare: ['seed_hp', 48] },
    actions: [{ w: 1, id: 'attack' }],
    desc: '鏡の間の大きな鏡から出てくる、パーティーとそっくりのすがた。同じ職業・同じ技で戦う。自分たちの強さを、反対の立場から知る相手。',
  },
  // ── 水のろう（真の すがたの モルガナが 作る。1人を とじこめる。こわすと 早く 出られる）──
  // ほとんど 動かない（speed）。経験値・お金は ない
  water_prison: {
    name: '水のろう', lv: 40, hp: 320, str: 0, def: 30, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'material', size: 'm', speed: 0.001, resist: { ...NO_STATUS, bolt: 1.2 }, drops: {},
    actions: [{ w: 1, id: 'm_prison_wait' }],
    desc: 'モルガナが作り出した、水のろう。中にとじこめられた人は、2回の番のあいだ動けない。ろうを攻撃してこわせば、早く助け出せる。',
  },

  // ── ボス（最深部「水鏡の広間」）──
  // 水鏡の魔人モルガナ: まぼろしの 分身 2体と いっしょに 出る（3体とも おなじ すがた。本物だけ 足もとに 影）。
  // 分身に 当てると 消えて、モルガナの HPが 少し 回復する（mirage.heal）。月の鏡で 分身が 消え、本物は つぎの 番 動けない。
  // 水の衣（veil）: まとっている 間は 受ける ダメージが 半分・炎は 効かない。雷の ダメージで はじけとぶ。前ぶれで また まとう。
  // 鏡写し（mirrorCopy）: おなじ 呪文を 2回 つづけて モルガナに 使うと、2回目は はね返される
  morgana: {
    name: 'モルガナ', lv: 39, hp: 5000, mp: 600, str: 122, def: 80, agi: 56, mag: 140, exp: 7000, gold: 3000,
    race: 'demon', size: 'l', boss: true, turns: 2, speed: 0.7, hit: 'slash', drops: { boss: ['tide_earring'] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, bolt: 1.2, fire: 0.7, ice: 0.8, dark: 0.6 },
    // cycle・mirror … 本物の 行動の かず（2回行動なので、3ターンで 6）
    mirage: {
      cycle: 6, mirror: 6, heal: 0.012, cloneAtk: 0.5, cloneActions: [{ w: 1, id: 'attack' }],
      remake: 'm_morgana_mirage', dazzled: 'm_morgana_dazzled', laughBy: 'モルガナのわらい声',
      downMsg: 'まぼろしの分身も、水になって消えていった…！',
      intro: ['モルガナのすがたが、3人にふえた！', '（どれが本物…？よく見ると、何かがちがうような…）'],
    },
    veil: { cut: 0.5, block: ['fire'], breakBy: 'bolt', wait: 2 },
    mirrorCopy: true,
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm_morgana_blade' }, { w: 3, id: 'm_morgana_whirl', cond: 'notRecent:m_morgana_whirl' },
      { w: 2, id: 'm_morgana_song', cond: 'notRecent:m_morgana_song' }, { w: 2, id: 'm_morgana_heal', cond: ['hpBelow:0.6', 'notRecent:m_morgana_heal'], limit: 2 },
      { w: 4, id: 'm_morgana_veil_charge', cond: ['t:noVeil', 'notRecent:m_morgana_veil_charge'] },
    ],
    desc: '四ツ影の3人目、水鏡の魔人。水の衣をまとい、まぼろしの分身をつれている。水の衣は雷で破れる。同じ呪文を続けて使うと、鏡写しではね返される。分身に当てると、モルガナのキズがいえてしまう。',
  },
  // 水鏡の魔人モルガナ（真の すがた）: 鏡の うろこを もつ 大きな 水の 竜。2回行動。
  // 大波: 「水がうずをまいている…！」→「うずが大きくなっていく…！」→ つぎの 番に 大波（みんなに とても 大きい。防御で 半分）。
  // 水のろう: 1人を とじこめる（2回の 番 動けない。ろうを こわすと 早く 出られる）。鏡のうろこ: 光った つぎの 番だけ 呪文を はね返す。
  // HP50%で 攻撃力アップ・HP20%で 守りが 下がる
  morgana_true: {
    name: 'モルガナ（真の姿）', lv: 40, hp: 7400, mp: 400, str: 176, def: 96, agi: 52, mag: 140, exp: 14000, gold: 6000,
    race: 'dragon', size: 'xl', boss: true, turns: 2, speed: 0.68, hit: 'bite', drops: { boss: ['mizukagami_crown'] },
    resist: { ...BOSS_STATUS, bolt: 1.35, fire: 0.6, ice: 0.6, dark: 0.6, poison: 0.2 },
    // たおれると 水の ろうも はじけて 消える（中の 仲間も 出られる）
    minionsFall: ['water_prison'], fallMsg: '水のろうも、はじけて消えた！',
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_mtrue_bite' }, { w: 2, id: 'm_mtrue_breath', cond: 'notRecent:m_mtrue_breath' },
      { w: 4, id: 'm_wave_charge', cond: ['notRecent:m_wave_charge', 't:noWave'] },
      { w: 2, id: 'm_water_prison', cond: ['notRecent:m_water_prison', 't:noPrison'] },
      { w: 2, id: 'm_scale_glow', cond: ['notRecent:m_scale_glow', 't:noReflect'] },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['モルガナのうろこが、あやしく青く光った！', 'モルガナの攻撃力が上がった！'], buff: { atk: 1.25 } },
      { hpBelow: 0.2, msg: ['モルガナのうろこが、ぼろぼろとはがれ落ちていく…！', 'モルガナの守備力が下がった！'], debuff: { def: 0.7 } },
    ],
    desc: '水鏡の魔人モルガナの本当のすがた。鏡のうろこをもつ、大きな水の竜。「水がうずをまいている」と、大波の前ぶれ。身を守ろう。水のろうは攻撃すればこわせる。うろこが光ったら、次の番まで呪文をはね返す。雷がよく効き、炎・氷・闇は効きにくい。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const TEMPLE_MAT_DROPS = {
  water_spirit: ['magic_powder', 5],
  water_dragon: ['dragon_scale', 6],
  sand_crab: ['pretty_shell', 4],
  mirror_knight: ['iron_shard', 3],
  trick_mirror: ['silver_shard', 5],
  prison_guard: ['dragon_scale', 4],
  utsushimi: ['magic_powder', 4],
};
