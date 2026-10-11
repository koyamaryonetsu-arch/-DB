// 第4章クリアの あとの より道「古代の大迷宮」の ボス（monsters.js で まぜる）
// 大迷宮の ふつうの 魔物は、今ある 第4章・神殿の 魔物を まぜて、階ごとの レベル（maps/labyrinth.js の LAB_ENEMY_LV）まで 強く する（world/battles.js の enemyLv）
// え は client/render/lab-art.js
//
// ねむれる古竜オルドラ（地下10階「古竜のねどこ」）
// ・2回行動。かみくだく・しっぽ（みんな）・炎の息（みんな）
// ・前ぶれ「大きく息をすいこんだ…！」→ 次の 番に「いにしえの炎」（みんなに とても 大きい。身を 守ると 半分）
// ・反撃の構え「しっぽを高くかかげた！」→ 次の 番まで、物理で 攻撃すると しっぽで 反撃（呪文・特技の 呪文は だいじょうぶ）
// ・HP50%で 力が 上がり、25%で 速く なる
// ・氷が よく効き、炎は ほとんど 効かない
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };

export const MONSTERS_LAB = {
  old_dragon: {
    name: '古竜オルドラ', lv: 48, hp: 9600, mp: 300, str: 170, def: 108, agi: 52, mag: 150, exp: 21000, gold: 8000,
    race: 'dragon', size: 'xl', boss: true, turns: 2, speed: 0.66, hit: 'bite', drops: { boss: ['old_dragon_eye'] },
    resist: { ...BOSS_STATUS, ice: 1.3, bolt: 1.1, fire: 0.3, dark: 0.7 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_old_bite' }, { w: 2, id: 'm_old_tail', cond: 'notRecent:m_old_tail' },
      { w: 2, id: 'm_old_breath', cond: 'notRecent:m_old_breath' },
      { w: 2, id: 'm_old_inhale', cond: ['notRecent:m_old_inhale', 'notRecent:m_old_flare'] },
      { w: 1, id: 'm_old_stance', cond: 'notRecent:m_old_stance' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['古竜オルドラは、大きくつばさを広げた！', 'こはく色の目が、もえるように光っている…！'], buff: { atk: 1.2 } },
      { hpBelow: 0.25, msg: ['古竜オルドラは、ほえた！', '大地がふるえる…！オルドラの動きが速くなった！'], speed: 1.2 },
    ],
    desc: '古代の大迷宮のいちばん下でねむっていた、大昔の竜。古代都市の守り神だったという。大きく息をすいこんだら「いにしえの炎」の前ぶれ。身を守ろう。しっぽを高くかかげたら、反撃の構え。呪文で戦おう。氷がよく効き、炎はほとんど効かない。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const LAB_MAT_DROPS = {};
