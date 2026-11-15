// 第85回 B班: 烈火の炎の 系統の 技（炎術士 → 八竜の炎術士・烈火。docs/plan-r85-jobs-b.md）
//
// きまりは abilities-r84b.js（らんま1/2 の 系統）と おなじ
//  ・Lv1〜10 で 6こ（Lv10 が 看板の 技 <職業の id>_sig。いちばん MPを 使う）。伝説は Lv1・3・5・7・8・10
// この 系統だけの しくみ（shared/battle-r85b.js。どれも 戦いの 中だけ）
//  ・type 'r85bRyu'  … 火竜をよぶ（cmd.ryu: よぶ 火竜〈下の RYU〉。えらんだ 火竜の 技が その場で 1回 出る）
//      set   … よべる 火竜（RYU_SET の 'four' 炎術士の 4ひき ／ 'eight' 伝説の 8ひき）
//      pow   … 火竜の 強さの 倍（伝説の 八竜は 少し 強い）
//      twin  … 火竜・二ひき同時（えらんだ 火竜 ＋ 炎術士の 4ひきから もう 1ぴき〈運〉。それぞれ twin 倍）
//      技の mp は いちばん 安い 火竜の MP（メニューで えらんだ 火竜が 高ければ、出す ときに のこりを はらう。二ひき同時は 技の MP だけ）
//  ・type 'r85bHime' … 姫を守る忍び（仲間 1人を かばう ＋ 自分の 守りが 上がる）
//  ・この 系統の 炎の 技（R85B_FIRE）は 晴れの 天気で ×1.3（今 ある 晴れの 炎の ボーナスとは 足し算に しない。battle-r85b.js）
// えんしゅつ（anim）は client/render/battlefx-r85b.js（r85b_… と 看板の 技）

// 火竜（ならびは メニューの じゅん。はじめの 4ひきは 炎術士・のこりの 4ひきは 伝説だけ）
//  target … 火竜の 技の あいて（'enemy' 敵1体・'group' 同じ種類・'enemies' 敵全体・'allies' 仲間全員・'deadAlly' たおれた 仲間 1人）
//  effect … その場で 出る 技（battle.js の applyAbility に そのまま わたす。'r85bMadoka'・'r85bRui'・'r85bResshin' は battle-r85b.js）
//  tag … メニューに 出す みじかい やくめ、short … せつめい、line … よんだ 時の ことば
//  color・color2 … えんしゅつと メニューの 色（8ひきが 見分けられる ように ちがう 色と 形）
export const RYU = {
  nadare: {
    tag: '火の玉', name: 'なだれ', mp: 10, target: 'enemies', color: '#ff7a1c', color2: '#ffd04a', role: 'dmg', anim: 'r85b_nadare',
    effect: { type: 'phys', mult: 0.5, hits: 5, random: true, element: 'fire' },
    short: '火の玉をばらまく（敵にばらばらに5回）', line: '一の竜「なだれ」！火の玉が、雨のようにふりそそぐ！',
  },
  saiha: {
    tag: '炎のやいば', name: 'さいは', mp: 9, target: 'enemy', color: '#e8201c', color2: '#ffb0a0', role: 'dmg', anim: 'r85b_saiha',
    effect: { type: 'phys', mult: 2.6, element: 'fire' },
    short: '炎のやいば（敵1体に強い）', line: '二の竜「さいは」！炎のやいばが、するどく走る！',
  },
  homura: {
    tag: '炎のむち', name: 'ほむら', mp: 10, target: 'group', color: '#ff4a8a', color2: '#ffc0d8', role: 'dmg', anim: 'r85b_homura',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.4, element: 'fire' }, { type: 'atbSet', sub: 40, chance: 0.65, msg: '{t}は、炎のむちにしばられて、うごきがおそくなった！', failMsg: '{t}は、炎のむちをふりほどいた！' }] },
    short: '炎のむち（同じ種類の敵をしばって、番をおくらせる）', line: '三の竜「ほむら」！炎のむちが、しゅるりとのびる！',
  },
  setsuna: {
    tag: 'せん光', name: 'せつな', mp: 8, target: 'enemies', color: '#fff4a0', color2: '#ffffff', role: 'sup', anim: 'r85b_setsuna',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.5, element: 'fire' }, { type: 'status', status: 'blind', chance: 0.4, turns: [2, 3] }] },
    short: 'せん光（敵全体が、ときどき目つぶしに）', line: '四の竜「せつな」！まぶしいせん光が、ぱっと光った！',
  },
  madoka: {
    tag: 'けっかい', name: 'まどか', mp: 14, target: 'allies', color: '#ffb02a', color2: '#fff0b0', role: 'sup', anim: 'r85b_madoka', legend: true,
    effect: { type: 'r85bMadoka', cut: 0.25, left: 3 },
    short: '炎のけっかい（仲間全員の受けるダメージがへる）', line: '五の竜「まどか」！まるい炎のけっかいが、仲間をつつむ！',
  },
  rui: {
    tag: 'まぼろし', name: 'るい', mp: 12, target: 'allies', color: '#b06ae8', color2: '#e8c8ff', role: 'sup', anim: 'r85b_rui', legend: true,
    effect: { type: 'r85bRui', add: 0.15, left: 3 },
    short: 'まぼろし（仲間全員がよけやすくなる）', line: '六の竜「るい」！ゆらゆらと、まぼろしの炎が広がる！',
  },
  kokuu: {
    tag: '光線', name: 'こくう', mp: 18, target: 'enemy', color: '#4ab8ff', color2: '#e0f6ff', role: 'dmg', anim: 'r85b_kokuu', legend: true,
    effect: { type: 'phys', mult: 3.4, element: 'fire', ignoreDef: 1 },
    short: '光線（敵1体にとても大きなダメージ。守りをむし）', line: '七の竜「こくう」！青白い光線が、まっすぐつらぬく！',
  },
  resshin: {
    tag: '不死鳥', name: 'れっしん', mp: 20, target: 'deadAlly', color: '#ffe04a', color2: '#ff6a1c', role: 'heal', anim: 'r85b_resshin', legend: true,
    effect: { type: 'r85bResshin', hpRatio: 0.5, heal: [45, 60], thr: 40 },
    short: '不死鳥（たおれた仲間1人を生き返らせる。いなければ全員を回復）', line: '八の竜「れっしん」！不死鳥が、大きなつばさを広げた！',
  },
};
export const RYU_ORDER = Object.keys(RYU);
export const RYU_SET = { four: RYU_ORDER.slice(0, 4), eight: RYU_ORDER.slice() };

export const R85B_ABILITIES = {
  // ───────────── 炎術士（超級職。忍者を きわめる） ─────────────
  ej_ryu: {
    name: '火竜をよぶ', kana: 'かりゅうをよぶ', kind: 'skill', job: 'enjutsushi', mp: 8, target: 'self', role: 'dmg',
    effect: { type: 'r85bRyu', set: 'four', pow: 1 },
    desc: '体にやどした火竜を1ぴきよび出す。なだれ・さいは・ほむら・せつなの4ひきから、自分で選ぶ。火竜ごとに、やくめとMPがちがう。', cast: '{a}は、右うでに炎をともした…！', anim: 'r85b_call',
  },
  ej_hanabi: {
    name: '花火玉', kana: 'はなびだま', kind: 'skill', job: 'enjutsushi', mp: 6, target: 'group',
    effect: { type: 'phys', mult: 1.6, element: 'fire' },
    desc: '花火の玉を投げつけて、同じ種類の敵を、ぱんぱんとやく。炎のダメージ。', cast: '{a}は、花火玉を投げた！', anim: 'r85b_hanabi',
  },
  ej_kakure: {
    name: '忍びのかくれ身', kana: 'しのびのかくれみ', kind: 'skill', job: 'enjutsushi', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 35 },
    desc: 'けむりにまぎれて、すがたをかくす。自分が、攻撃をよけやすくなる。', cast: '{a}は、けむりの中にすがたをかくした！', anim: 'r85b_kemuri',
  },
  ej_kaina: {
    name: '炎のうで', kana: 'ほのおのうで', kind: 'skill', job: 'enjutsushi', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 },
    desc: '右うでのこてに、炎をまとわせる。自分の攻撃力と魔力が上がる。', cast: '{a}の右うでが、ごうっともえ上がった！', anim: 'r85b_kaina',
  },
  ej_shuriken: {
    name: '手裏剣の雨', kana: 'しゅりけんのあめ', kind: 'skill', job: 'enjutsushi', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: '手裏剣を雨のように投げて、敵に、ばらばらに4回当てる。', cast: '{a}は、空いっぱいに手裏剣を投げた！', anim: 'shuriken',
  },
  enjutsushi_sig: {
    name: '火竜・二ひき同時', kana: 'かりゅうにひきどうじ', kind: 'skill', job: 'enjutsushi', mp: 22, target: 'self', role: 'dmg',
    effect: { type: 'r85bRyu', set: 'four', pow: 1, twin: 0.9 },
    desc: '火竜を2ひきいっぺんによぶ。1ぴきは自分でえらび、もう1ぴきは4ひきの中から、だれが来るかはお楽しみ。', cast: '{a}「来い、火竜たち！」', anim: 'enjutsushi_sig',
  },

  // ───────────── 八竜の炎術士・烈火（伝説） ─────────────
  rk_ryu: {
    name: '火竜をよぶ・八竜', kana: 'かりゅうをよぶはちりゅう', kind: 'skill', job: 'rekka', mp: 8, target: 'self', role: 'dmg',
    effect: { type: 'r85bRyu', set: 'eight', pow: 1.15 },
    desc: '8ひきの火竜から、1ぴきを選んでよび出す。攻め・じゃま・けっかい・まぼろし・光線・不死鳥と、なんでもできる。火竜ごとに、MPがちがう。', cast: '{a}の右うでに、竜の印がうかび上がった…！', anim: 'r85b_call',
  },
  rk_hime: {
    name: '姫を守る忍び', kana: 'ひめをまもるしのび', kind: 'skill', job: 'rekka', mp: 8, target: 'ally', role: 'sup',
    effect: { type: 'r85bHime', def: 1.4 },
    desc: '「おれが守る！」と、仲間1人のまえに立つ。その仲間への攻撃をかばい、自分の守備力も上がる。', cast: '{a}「下がってろ、おれが守る！」', anim: 'r85b_hime',
  },
  rk_kiba: {
    name: '火竜のきば', kana: 'かりゅうのきば', kind: 'skill', job: 'rekka', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, element: 'fire' },
    desc: '火竜のきばのような炎で、敵1体にかみつく。炎の大きなダメージ。', cast: '{a}の火竜のきば！', anim: 'r85b_kiba',
  },
  rk_renpatsu: {
    name: '花火・大れんぱつ', kana: 'はなびだいれんぱつ', kind: 'skill', job: 'rekka', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 6, random: true, element: 'fire' },
    desc: '大きな花火をつぎつぎにうち上げて、敵に、ばらばらに6回当てる。炎のダメージ。', cast: '{a}「たまや〜！」花火が、空いっぱいにさいた！', anim: 'r85b_hanabi',
  },
  rk_mezame: {
    name: '火影の目ざめ', kana: 'ほかげのめざめ', kind: 'skill', job: 'rekka', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag', 'agi'], mult: 1.4, dur: 45 },
    desc: '炎術士の一族「火影」の力が目ざめる。自分の攻撃力・魔力・素早さが大きく上がる。', cast: '{a}の体から、まっ赤な炎がふき上がった！', anim: 'r85b_kaina',
  },
  rekka_sig: {
    name: '八竜・同時しょうかん', kana: 'はちりゅうどうじしょうかん', kind: 'skill', job: 'rekka', mp: 38, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.4, element: 'fire' }, { type: 'heal', target: 'allies', base: [50, 65], thr: 40 }] },
    desc: '8ひきの火竜を、いっぺんによび出す。敵全体に炎のとても大きなダメージ。不死鳥の炎で、仲間全員のHPも少し回復する。', cast: '{a}「八竜、みんな来い！」', anim: 'rekka_sig',
  },
};

// この 系統の 炎の 技（晴れの 天気で ×1.3。battle-r85b.js の r85bDamage。ひらめき技は hirameki-r85b.js で 足す）
export const R85B_FIRE = new Set(Object.keys(R85B_ABILITIES));
