// 第4章 Step 7「砂の底の神殿とモルガナ」の 魔物の 技（abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（reflect・veilCharge・veil・dazzle・wave・prison）は shared/battle-temple.js の templeEffect
export const TEMPLE_ABILITIES = {
  // ── 水の精・水竜（地下1階の 水の 魔物）──
  m_spirit_mend: {
    name: 'いやしの水', kind: 'monster', mp: 6, target: 'ally',
    effect: { type: 'heal', base: [120, 150], thr: 99 }, cast: '{a}は、すきとおった水で{t}をつつみこんだ！', anim: 'heal1',
    desc: 'すきとおった水で、仲間のキズを回復する。',
  },
  m_water_shot: {
    name: '水のつぶて', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [64, 78], thr: 99 }, cast: '{a}は、{t}に、かたい水のつぶてをはなった！', anim: 'water_shot',
    desc: 'かたい水のつぶてで、1人にダメージ。',
  },
  m_water_rain: {
    name: 'しずくの雨', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [36, 44], thr: 99 }, cast: '{a}は、天井から、つめたいしずくの雨をふらせた！', anim: 'water_rain',
    desc: 'しずくの雨で、敵みんなにダメージ。',
  },
  m_dragon_bite: {
    name: 'かみつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, acc: 0.92 }, cast: '{a}は、{t}に大きな口でかみついた！', anim: 'bite',
    desc: '大きな口でかみつく。',
  },
  m_water_breath: {
    name: '水のブレス', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [44, 54], thr: 99, breath: true }, cast: '{a}は、うずまく水のブレスをはいた！', anim: 'water_breath',
    desc: '水のブレスで、敵みんなにダメージ。',
  },
  m_dragon_tail: {
    name: 'しっぽでなぎはらう', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}は、長いしっぽで、みんなをなぎはらった！', anim: 'hit_all',
    desc: '長いしっぽで、敵みんなをなぎはらう。',
  },
  // ── 鏡の騎士・まどわしの鏡（鏡の間）──
  m_mirror_blade: {
    name: '鏡のつるぎ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, acc: 0.95 }, cast: '{a}は、鏡のようにかがやく剣で、{t}に切りかかった！', anim: 'slash_fast',
    desc: '鏡のようにかがやく剣で、1人に切りかかる。',
  },
  // 体が 光る: つぎの 自分の 番まで 呪文を はね返す（この 番の のこりの 行動は とりやめ）
  m_knight_glow: {
    name: '鏡の光', kind: 'monster', target: 'self',
    effect: { type: 'reflect', kind: 'glow' }, cast: '{a}の体が、まぶしく光り始めた！', anim: 'mirror_glow',
    desc: '体がまぶしく光る。次の番まで、呪文をはね返す。',
  },
  m_mirror_glow: {
    name: '鏡の光', kind: 'monster', target: 'self',
    effect: { type: 'reflect', kind: 'glow' }, cast: '{a}の鏡が、まぶしく光り始めた！', anim: 'mirror_glow',
    desc: '鏡がまぶしく光る。次の番まで、呪文をはね返す。',
  },
  m_mirror_beam: {
    name: '鏡の光線', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [60, 74], thr: 99 }, cast: '{a}は、{t}に、するどい光をはね返してきた！', anim: 'mirror_beam',
    desc: 'するどい光で、1人にダメージ。',
  },
  m_trick_light: {
    name: 'まどわしの光', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.22, turns: [1, 2] }, cast: '{a}は、ゆらゆらとあやしい光をうつしだした！', anim: 'mirror_glow',
    desc: 'あやしい光で、敵みんなを混乱させることがある。',
  },
  // ── 水のろうの番人 ──
  m_guard_spear: {
    name: '水のほこ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, acc: 0.95 }, cast: '{a}は、水のほこで、{t}をつきさした！', anim: 'water_shot',
    desc: '水のほこで、1人を強くつく。',
  },
  m_guard_whirl: {
    name: 'うずまく水', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [40, 50], thr: 99 }, cast: '{a}は、ほこを回して、水のうずを作り出した！', anim: 'whirlpool',
    desc: '水のうずで、敵みんなにダメージ。',
  },
  m_guard_chain: {
    name: '水のくさり', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.45, turns: [1, 1] }, cast: '{a}は、水のくさりを{t}の足にまきつけた！', anim: 'water_shot',
    desc: '水のくさりで、足をしばって動けなくする。',
  },
  m_guard_wall: {
    name: '守りの水', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.3, dur: 25 }, cast: '{a}は、水のかべを作り出した！', anim: 'buff',
    desc: '水のかべで、仲間みんなの守りを上げる。',
  },
  // 水のろう: 何も しない（ゆれている だけ）
  m_prison_wait: {
    name: 'ゆらゆら', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は、ゆらゆらとゆれている…', anim: 'none',
  },

  // ── モルガナ（第1段階）──
  m_morgana_blade: {
    name: '水のやいば', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', base: [76, 90], thr: 99 }, cast: '{a}は、水のやいばを、{t}にはなった！', anim: 'water_shot',
    desc: '水のやいばで、1人に大きなダメージ。',
  },
  // うずしお（グループの 呪文。魔物の グループの 技は みんなに 当たる）
  m_morgana_whirl: {
    name: 'うずしお', kind: 'monster', mp: 10, target: 'group',
    effect: { type: 'magic', base: [40, 50], thr: 99 }, cast: '{a}は、広間の水をうずまかせた！\nうずしおが、みんなをのみこむ！', anim: 'whirlpool',
    desc: 'うずしおで、敵みんなにダメージ。',
  },
  m_morgana_song: {
    name: 'まどわしの歌', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] }, cast: '{a}は、すきとおった声で歌い始めた…！', anim: 'siren_song',
    desc: 'ふしぎな歌で、敵みんなを混乱させることがある。',
  },
  m_morgana_heal: {
    name: 'いやしの水', kind: 'monster', mp: 12, target: 'self',
    effect: { type: 'heal', base: [300, 360], thr: 99 }, cast: '{a}は、広間の水を体にあびた！', anim: 'heal1',
    desc: '水をあびて、自分のキズを回復する。',
  },
  // 水の衣の 前ぶれ（つぎの 番に また まとう）
  m_morgana_veil_charge: {
    name: '水の衣の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'veilCharge', next: 'm_morgana_veil' }, cast: '{a}は、水をまとい始めた…！', anim: 'veil_charge',
    desc: '次の番に、水の衣をまとう。',
  },
  m_morgana_veil: {
    name: '水の衣', kind: 'monster', target: 'self',
    effect: { type: 'veil' }, cast: '{a}は、水の衣をまとった！', anim: 'veil_on',
    desc: '水の衣をまとう。受けるダメージが半分になり、炎が効かなくなる。雷で破れる。',
  },
  // まぼろしを 作りなおす（battle-ch4.js の mirageRemake）
  m_morgana_mirage: {
    name: 'まぼろしを作る', kind: 'monster', target: 'self',
    effect: { type: 'mirage' }, cast: '{a}は、広間の水鏡に、そっと手をかざした…！', anim: 'none',
    desc: 'まぼろしの分身を作り出す。3人が、すばやく入れかわる。',
  },
  // 月の鏡の 光で まぶしい（2回行動の のこりも とりやめ）
  m_morgana_dazzled: {
    name: 'まぶしい', kind: 'monster', target: 'self',
    effect: { type: 'dazzle' }, cast: '{a}は、月の光がまぶしくて、動けない！', anim: 'none',
  },

  // ── モルガナ（真の姿）──
  m_mtrue_bite: {
    name: 'かみくだく', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.7, acc: 0.9 }, cast: '{a}は、{t}にするどいキバでかみついた！', anim: 'bite',
    desc: 'するどいキバで、1人に大ダメージ。',
  },
  m_mtrue_breath: {
    name: '水鏡のブレス', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', base: [60, 72], thr: 99, breath: true }, cast: '{a}は、きらきら光る水のブレスをはいた！', anim: 'water_breath',
    desc: '光る水のブレスで、敵みんなにダメージ。',
  },
  // 大波: 2だんの 前ぶれ（「水がうずをまいている…」→「うずが大きくなっていく…」）→ つぎの 番に 大波
  m_wave_charge: {
    name: '大波の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'wave', stage: 1, next: 'm_wave_build' }, cast: '水がうずをまいている…！', anim: 'wave_charge',
    desc: '2つあとの番に「大波」。身を守ろう。',
  },
  m_wave_build: {
    name: '大波の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'wave', stage: 2, next: 'm_big_wave' }, cast: '{a}のまわりで、水のうずが、どんどん大きくなっていく…！', anim: 'wave_charge',
    desc: '次の番に「大波」。身を守ろう。',
  },
  m_big_wave: {
    name: '大波', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 2.2, ignoreDef: 0.5 }, cast: '{a}の大波！\n広間いっぱいの水が、みんなにおそいかかる！', anim: 'big_wave',
    desc: '広間いっぱいの大波で、敵みんなにとても大きなダメージ。防御で半分になる。',
  },
  // 水のろう: 1人を とじこめる（2回の 番 動けない。ろうを こわすと 早く 出られる）
  m_water_prison: {
    name: '水のろう', kind: 'monster', mp: 8, target: 'enemy',
    effect: { type: 'prison', turns: 2 }, cast: '{a}は、{t}にむかって、水のたまをはきだした！', anim: 'water_prison',
    desc: '1人を水のろうにとじこめる。',
  },
  // 鏡のうろこ: 光った つぎの 番だけ 呪文を はね返す
  m_scale_glow: {
    name: '鏡のうろこ', kind: 'monster', target: 'self',
    effect: { type: 'reflect', kind: 'scale' }, cast: '{a}の鏡のうろこが、ぎらりと光った！', anim: 'mirror_glow',
    desc: 'うろこが光る。次の番まで、呪文をはね返す。',
  },
};
