// 第3章の モンスターの 技（abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
export const CH3_ABILITIES = {
  // ── 雪原・森・湖 ──
  m_snowball: {
    name: '雪玉なげ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, element: 'ice' }, cast: '{a}は大きな雪玉をなげつけた！', anim: 'ice1',
    desc: 'かたい雪玉をなげつける。',
  },
  m_frost_breath: {
    name: 'こおりの息', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [24, 32], thr: 99, breath: true }, cast: '{a}はつめたい息をはいた！', anim: 'breath',
    desc: 'こおりの息で敵みんなをこごえさせる。',
  },
  m_frost_howl: {
    name: '遠ぼえ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'frost_wolf' }, cast: '{a}は雪山にひびく遠ぼえを上げた！', anim: 'none',
  },
  m_broom_sweep: {
    name: 'ほうきではらう', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}はほうきで雪ごと、はらいとばした！', anim: 'hit_all',
    desc: 'ほうきで敵みんなをはらいとばす。',
  },
  m_snow_mend: {
    name: '雪をかためる', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [80, 100] }, cast: '{a}はまわりの雪を体にくっつけた！', anim: 'heal1',
    desc: '雪をくっつけて、体をなおす。',
  },
  m_yeti_punch: {
    name: 'ギガトンパンチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は大きなこぶしをふり下ろした！', anim: 'slash_heavy',
    desc: '大きなこぶしでなぐりつける。',
  },
  m_snow_quake: {
    name: '雪ゆらし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は地面をなぐりつけた！雪がどさどさ落ちてくる！', anim: 'quake',
    desc: '地面をたたいて、敵みんなに雪を落とす。',
  },
  m_icicle_dive: {
    name: 'つららダイブ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, element: 'ice' }, cast: '{a}はつららのようにまっすぐ落ちてきた！', anim: 'ice1',
    desc: 'つららのように急降下する。',
  },
  m_snow_flurry: {
    name: '小ふぶき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [20, 28], thr: 99 }, cast: '{a}はくるくる回って、ふぶきをおこした！', anim: 'blizzard',
    desc: '小さなふぶきで敵みんなをこごえさせる。',
  },
  m_belly_slide: {
    name: 'はらすべり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}ははらばいで、すべりこんできた！', anim: 'tackle',
    desc: 'はらばいですべって体当たりする。',
  },
  m_shield_guard: {
    name: 'たてをかまえる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 30 }, cast: '{a}は丸いたてをしっかりかまえた！', anim: 'guard',
    desc: 'たてをかまえて守備力を上げる。',
  },
  m_ice_punch: {
    name: '氷のこぶし', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, element: 'ice' }, cast: '{a}は氷のこぶしをたたきつけた！', anim: 'slash_heavy',
    desc: '氷のこぶしでなぐる。',
  },
  m_tusk: {
    name: 'キバでつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は長いキバをつき立てた！', anim: 'bite',
    desc: '長いキバでつきさす。',
  },
  // ── 鉱山 ──
  m_pickaxe: {
    name: 'ツルハシ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}はツルハシをふり下ろした！', anim: 'slash_heavy',
    desc: 'ツルハシでたたく。',
  },
  m_ore_bash: {
    name: '鉱石アタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}はかたい体で体当たりしてきた！', anim: 'tackle',
    desc: 'かたい体でぶつかる。',
  },
  m_cart_rush: {
    name: '暴走トロッコ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}はガタガタと走り出した！暴走トロッコだ！', anim: 'hit_all',
    desc: '走り回って敵みんなをはねとばす。',
  },
  m_fire_spark: {
    name: '火の玉', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [34, 44], thr: 99 }, cast: '{a}は火の玉をとばした！', anim: 'fire1',
    desc: '火の玉を1つとばす。',
  },
  // ── 炎の山 ──
  m_lava_spit: {
    name: 'ようがんをはく', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [40, 52], thr: 99 }, cast: '{a}はどろどろのようがんをはきかけた！', anim: 'fire2',
    desc: 'ようがんをはきかける。',
  },
  m_tail_whip: {
    name: 'しっぽをふる', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は長いしっぽをふり回した！', anim: 'hit_all',
    desc: 'しっぽで敵みんなをなぎはらう。',
  },
  m_flame_breath: {
    name: '炎の息', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [28, 36], thr: 99, breath: true }, cast: '{a}は炎の息をはいた！', anim: 'breath',
    desc: '炎の息で敵みんなを焼く。',
  },
  m_magma_splash: {
    name: 'マグマしぶき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [24, 32], thr: 99 }, cast: '{a}は体をふるわせて、マグマをまきちらした！', anim: 'fire_wave',
    desc: 'マグマをまきちらす。',
  },
  m_spark_wing: {
    name: '火の粉のつばさ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [22, 30], thr: 99 }, cast: '{a}ははばたいて、火の粉をふりまいた！', anim: 'fire_wave',
    desc: '火の粉を敵みんなにふりまく。',
  },
  m_obsidian_slash: {
    name: '黒曜斬り', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は黒くかがやく大剣をふり下ろした！', anim: 'slash_heavy',
    desc: '黒曜石の大剣で切りつける。',
  },
  // ── 神殿・星竜山 ──
  m_stone_gaze: {
    name: '石のまなざし', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.25, turns: [1, 2] }, cast: '{a}の目が青く光った！', anim: 'debuff',
    desc: 'あやしい光で、体を動かなくする。',
  },
  m_star_breath: {
    name: '星のいき', kind: 'monster', mp: 7, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [36, 46], thr: 99, breath: true }, cast: '{a}は夜空のようにきらめく息をはいた！', anim: 'breath',
    desc: '星の光の息で敵みんなをうつ。',
  },
  m_shadow_fire: {
    name: 'かげの炎', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [40, 52], thr: 99 }, cast: '{a}はむらさきの炎をとばした！', anim: 'dark1',
    desc: 'むらさきのかげの炎をとばす。',
  },
  m_blizzard_breath: {
    name: 'ふぶきの息', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [44, 56], thr: 99, breath: true }, cast: '{a}はこおりつくふぶきの息をはいた！', anim: 'blizzard',
    desc: 'はげしいふぶきの息で敵みんなをこおらせる。',
  },

  // ── ブリザマンモス ──
  m_tusk_charge: {
    name: 'キバのとっしん', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は大きなキバをかまえて、つっこんできた！', anim: 'tackle',
  },
  m_mammoth_roar: {
    name: '鼻を上げる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_snow_avalanche' }, cast: '{a}は鼻を高く上げた！パオオオオン！\n天井の雪がゆれている…！', anim: 'charge',
  },
  m_snow_avalanche: {
    name: '大なだれ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.15, element: 'ice', ignoreDef: 0.3 }, cast: '大なだれ！天井の雪と氷が、いっきにくずれ落ちてきた！', anim: 'quake',
    desc: 'なだれをおこして敵みんなに大ダメージ。',
  },
  // ── マグマゴーレム ──
  m_magma_punch: {
    name: 'マグマパンチ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6, element: 'fire' }, cast: '{a}はマグマのこぶしをたたきつけた！', anim: 'slash_heavy',
  },
  m_lava_burst: {
    name: 'ようがんふん出', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [42, 54], thr: 99 }, cast: '{a}の体のひびから、ようがんがふき出した！', anim: 'fire_wave',
    desc: 'ようがんをふき出して敵みんなを焼く。',
  },
  // ── 炎の騎士フレアード ──
  m_flame_sword: {
    name: '炎の剣', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.55, element: 'fire' }, cast: '{a}の炎の剣！もえるやいばがうなりを上げる！', anim: 'slash_heavy',
  },
  m_flame_wave: {
    name: '炎の波', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [46, 58], thr: 99 }, cast: '{a}は剣をふり、炎の波をおこした！', anim: 'fire_wave',
    desc: '炎の波で敵みんなを焼く。',
  },
  m_blaze_charge: {
    name: '炎をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_flame_tornado' }, cast: '{a}のマントがふくらんだ！\nまわりの炎が、うずをまき始めた…！', anim: 'charge',
  },
  m_flame_tornado: {
    name: '炎の竜巻', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [70, 84], thr: 99 }, cast: '{a}の炎の竜巻！もえさかる風がすべてをのみこむ！', anim: 'fire_tornado',
    desc: '炎の竜巻で敵みんなに大ダメージ。',
  },
  // ── 竜の番人 ──
  m_halberd_thrust: {
    name: 'ほこのひとつき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.7 }, cast: '{a}は古いほこを、するどくつき出した！', anim: 'slash_fast',
  },
  m_halberd_sweep: {
    name: 'ほこのなぎはらい', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.85 }, cast: '{a}はほこを大きくふり回した！', anim: 'hit_all',
  },
  m_rune_beam: {
    name: '古代文字の光', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [64, 78], thr: 99 }, cast: '{a}の体の古い文字が光り、光線がはなたれた！', anim: 'dragon_beam',
  },
  m_guard_stance: {
    name: '守りのかまえ', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 30 }, cast: '{a}はほこを地面につき立て、どっしりとかまえた！', anim: 'guard',
  },
  m_judgment_charge: {
    name: 'さばきの光をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_judgment' }, cast: '{a}の体中の文字が、まぶしくかがやき始めた…！', anim: 'charge',
  },
  m_judgment: {
    name: 'さばきの光', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [70, 84], thr: 99 }, cast: '{a}のさばきの光！まっ白な光が、すべてをてらす！', anim: 'holy',
    desc: 'さばきの光で敵みんなに大ダメージ。',
  },
  // ── 炎の魔女イグニア ──
  m_witch_fire: {
    name: '魔女の炎', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [64, 80], thr: 99 }, cast: '{a}はつえの宝石から、大きな火の玉をはなった！', anim: 'fire3',
  },
  m_hellfire: {
    name: 'ごうかの炎', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [48, 60], thr: 99 }, cast: '{a}はつえをふりかざした！ごうかの炎がうずまく！', anim: 'fire_wave',
  },
  m_heat_haze: {
    name: 'かげろう', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.35, turns: [2, 3] }, cast: '{a}のまわりに、ゆらゆらとかげろうが立ちのぼった！', anim: 'debuff',
    desc: 'かげろうで、敵みんなにまぼろしを見せる。',
  },
  m_witch_call: {
    name: '手下を呼ぶ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'shadow_flame' }, cast: '{a}は指をならした！', anim: 'none',
  },
  m_flame_wing: {
    name: '炎のつばさ', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [54, 66], thr: 99 }, cast: '{a}は炎のつばさを大きくはばたかせた！', anim: 'fire_wave',
  },
  m_crown_flare: {
    name: '炎のかんむり', kind: 'monster', mp: 10, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [84, 100], thr: 99 }, cast: '{a}の炎のかんむりから、白い炎がほとばしった！', anim: 'fire3',
  },
  m_dark_flame: {
    name: 'やみの炎', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [48, 60], thr: 99 }, cast: '{a}は黒い炎をまきちらした！', anim: 'dark1',
  },
  m_inferno_charge: {
    name: '大炎をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_inferno' }, cast: '{a}は炎のつばさを大きく広げた！\n山が、ふるえている…！', anim: 'charge',
  },
  m_inferno: {
    name: '大炎', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [86, 100], thr: 99 }, cast: '{a}の大炎！山をつつむほどの炎が、すべてをのみこむ！', anim: 'fire_tornado',
    desc: 'すべてをやく大炎。敵みんなに大ダメージ。',
  },
};
