// 第85回 A班: スレイヤーズの 系統の 技（大食いの旅の魔道士 → 天才美少女魔道士リナ → ドラまた。docs/plan-r85-jobs-a.md）
//
// きまりは abilities-r84b.js（らんま1/2 の 系統）と おなじ
//  ・Lv1〜10 で 6こ（Lv10 が 看板の 技 <職業の id>_sig。いちばん MPを 使う）。伝説は Lv1・3・5・7・8・10
//  ・自分に かける 補助は 段の 上限まで
//  ・攻撃の 呪文は kind: 'spell'（呪文ふうじで うてない・今の 魔法の 職業と おなじ）。食べる 技・となえる・補助は kind: 'skill'
// この 系統だけの しくみ（shared/battle-r85a.js。どれも 戦いの 中だけ）
//  ・type 'r85aChant' … となえる（となえて いる 状態に なる。大砲の 呪文が うてる／ふつうの 呪文を うつと 強く なって 消える）
//  ・magic の しるし（battle.js の 'magic' の はじめで battle-r85a.js へ）
//      r85aBig   … 大砲の 呪文（ドラグ・スレイブ・ラグナ・ブレード・ギガ・スレイブ）。となえて いないと えらべない・うつと となえは 消える
//      r85aGiga  … ギガ・スレイブ（のこりの MP を 全部 使う。MP が 多いほど 強い。1体ごとの 上限 GIGA_CAP）
//      r85aPierce… ラグナ・ブレード（敵の「ききにくい」と 身を 守るを むしする。効かない 属性〈0〉と ボスの しかけは そのまま）
//      r85aHits  … フレア・アロー（ばらばらの 敵に この 回数）
//      r85aGold  … とう賊たいじ（当てた 敵の お金の この 倍が、たおさなくても 手に 入る。今 ある hooks.gainGold）
// えんしゅつ（anim）は client/render/battlefx-r85a.js（r85a_… と 看板の 技）

export const R85A_ABILITIES = {
  // ───────────── 大食いの旅の魔道士（上級職。魔法使い ＋ 料理人） ─────────────
  tm_fireball: {
    name: 'ファイアーボール', kana: 'ふぁいあーぼーる', kind: 'spell', job: 'tabi_madoshi', mp: 6, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [42, 52], thr: 45 },
    desc: '手の上に作った火の玉を投げつける。同じ種類の敵に炎のダメージ。', cast: '{a}「ファイアーボール！」', anim: 'r85a_fireball',
  },
  tm_oomori: {
    name: '大もり定食', kana: 'おおもりていしょく', kind: 'skill', job: 'tabi_madoshi', mp: 0, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [70, 86], fixed: true }, { type: 'mpHeal', base: [6, 9] }] },
    desc: '山盛りの定食を、ものすごい速さでたいらげる。自分のHPとMPが回復する。MPはいらない。', cast: '{a}「おばちゃん、大もり定食！」', anim: 'r85a_food',
  },
  tm_lighting: {
    name: 'ライティング', kana: 'らいてぃんぐ', kind: 'spell', job: 'tabi_madoshi', mp: 5, target: 'enemies', role: 'sup',
    effect: { type: 'status', status: 'blind', chance: 0.45, turns: [2, 3] },
    desc: 'まぶしい光の玉をうかべる。敵全体が、ときどき目つぶしになる。', cast: '{a}「ライティング！」', anim: 'r85a_light',
  },
  tm_digbolt: {
    name: 'ディグ・ボルト', kana: 'でぃぐぼると', kind: 'spell', job: 'tabi_madoshi', mp: 7, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [80, 94], thr: 50 },
    desc: 'いなずまを指先から放つ。敵1体に雷のダメージ。', cast: '{a}「ディグ・ボルト！」', anim: 'r85a_bolt',
  },
  tm_touzoku: {
    name: 'とう賊たいじ', kana: 'とうぞくたいじ', kind: 'spell', job: 'tabi_madoshi', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [34, 42], thr: 45, r85aGold: 0.5 },
    desc: 'わるいとう賊をこらしめる、いつもの呪文。敵全体に炎のダメージ。当てた敵の持っているお金を、少しいただく。', cast: '{a}「わるい子には、おしおきよ！」', anim: 'r85a_touzoku',
    masc: { cast: '{a}「わるいやつには、おしおきだ！」' },
  },
  tabi_madoshi_sig: {
    name: 'フレア・アロー', kana: 'ふれああろー', kind: 'spell', job: 'tabi_madoshi', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [32, 40], thr: 55, r85aHits: 4 },
    desc: '炎の矢を4本うち出す。敵全体に、ばらばらに4回、炎のダメージ。', cast: '{a}「フレア・アロー！」', anim: 'tabi_madoshi_sig',
  },

  // ───────────── 天才美少女魔道士リナ（超級職） ─────────────
  ln_elmekia: {
    name: 'エルメキア・ランス', kana: 'えるめきあらんす', kind: 'spell', job: 'lina', mp: 10, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [124, 144], thr: 70 },
    desc: '光のやりを放つ。敵1体に光のダメージ。', cast: '{a}「エルメキア・ランス！」', anim: 'r85a_lance',
  },
  ln_tonaeru: {
    name: 'となえる', kana: 'となえる', kind: 'skill', spellLike: true, job: 'lina', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'r85aChant' },
    desc: 'じっくり呪文をとなえる。自分は「となえている」になり、ドラグ・スレイブなどの、いちばん強い呪文がうてる。ふつうの呪文をうつと、その呪文が強くなる。3回動くと消える。', cast: '{a}は、しずかに呪文をとなえ始めた…', anim: 'r85a_chant',
  },
  ln_blam: {
    name: 'ブラム・ブレイザー', kana: 'ぶらむぶれいざー', kind: 'spell', job: 'lina', mp: 12, target: 'group',
    effect: { type: 'magic', element: 'light', base: [96, 114], thr: 70 },
    desc: '青い光のうずを放つ。同じ種類の敵に光のダメージ。', cast: '{a}「ブラム・ブレイザー！」', anim: 'r85a_blam',
  },
  ln_raywing: {
    name: 'レイ・ウイング', kana: 'れいういんぐ', kind: 'skill', job: 'lina', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }, { type: 'buff', stat: 'eva', add: 0.15, dur: 30 }] },
    desc: '風のからをまとって、空をとぶ。自分の素早さが上がり、よけやすくなる。', cast: '{a}「レイ・ウイング！」ふわりとうかび上がった！', anim: 'r85a_wing',
  },
  ln_recovery: {
    name: 'リカバリィ', kana: 'りかばりぃ', kind: 'spell', job: 'lina', mp: 10, target: 'ally', role: 'heal',
    effect: { type: 'heal', base: [110, 132], thr: 60 },
    desc: '体の力を引き出して、キズをなおす。仲間1人のHPを回復する。', cast: '{a}「リカバリィ！」', anim: 'heal1',
  },
  lina_sig: {
    name: 'ドラグ・スレイブ', kana: 'どらぐすれいぶ', kind: 'spell', job: 'lina', mp: 36, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [270, 310], thr: 80, r85aBig: true },
    desc: '先に「となえる」と使える、いちばん強い呪文。赤い大ばくはつで、敵全体に特大のダメージ。うつと、となえた力は消える。', cast: '{a}「たそがれよりも暗きもの…ドラグ・スレイブ！」', anim: 'lina_sig',
  },

  // ───────────── ドラまた（伝説） ─────────────
  dr_zelas: {
    name: 'ゼラス・ブリッド', kana: 'ぜらすぶりっど', kind: 'spell', job: 'doramata', mp: 14, target: 'enemy',
    effect: { type: 'magic', base: [176, 202], thr: 85 },
    desc: 'どこまでも追いかける光の線を放つ。敵1体にダメージ。属性がないので、どんな敵にもかならず当たる。', cast: '{a}「ゼラス・ブリッド！」', anim: 'r85a_zelas',
  },
  dr_zoufuku: {
    name: 'ぞうふくの石', kana: 'ぞうふくのいし', kind: 'skill', job: 'doramata', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'mag', mult: 1.3, dur: 40 },
    desc: '魔力を強める4つの石を、ぎゅっとにぎる。自分の魔力が大きく上がる。', cast: '{a}は、ぞうふくの石をかかげた！', anim: 'r85a_stone',
  },
  dr_ragna: {
    name: 'ラグナ・ブレード', kana: 'らぐなぶれーど', kind: 'spell', job: 'doramata', mp: 32, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [430, 490], thr: 90, r85aBig: true, r85aPierce: true },
    desc: '先に「となえる」と使える、闇のやいば。敵1体に、闇の特大のダメージ。敵の守りをむしする。うつと、となえた力は消える。', cast: '{a}「やみよりもなお暗きもの…ラグナ・ブレード！」', anim: 'r85a_ragna',
  },
  dr_tokumori: {
    name: '特もり定食', kana: 'とくもりていしょく', kind: 'skill', job: 'doramata', mp: 6, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [56, 70], fixed: true }, { type: 'mpHeal', base: [4, 7] }] },
    desc: 'みんなで、特盛りの定食を食べる。仲間全員のHPとMPが少し回復する。', cast: '{a}「みんなで、特もり定食よ！」', anim: 'r85a_food',
    masc: { cast: '{a}「みんなで、特もり定食だ！」' },
  },
  dr_matagu: {
    name: 'ドラゴンもまたいで通る', kana: 'どらごんもまたいでとおる', kind: 'skill', job: 'doramata', mp: 12, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'debuff', stat: 'atk', mult: 0.8, dur: 40, chance: 0.75 }, { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、こわがって手が止まった！', failMsg: '{t}は、ぐっとこらえた！' }] },
    desc: '「名前を知ってる？」と、にっこり。敵全体がこわがって、攻撃力が下がり、ときどき番がおくれる。', cast: '{a}「あたしの名前、知ってる？」', anim: 'r85a_matagu',
    masc: { cast: '{a}「おれの名前、知ってるか？」' },
  },
  doramata_sig: {
    name: 'ギガ・スレイブ', kana: 'ぎがすれいぶ', kind: 'spell', job: 'doramata', mp: 40, target: 'enemies',
    effect: { type: 'magic', base: [1, 1], thr: 90, r85aBig: true, r85aGiga: true },
    desc: '先に「となえる」と使える、最後の呪文。のこりのMPを全部使う。MPが多いほど強く、敵全体に特大のダメージ。うつと、MPは0になる。', cast: '{a}「やみよりもなお暗く、よるよりもなお深きもの…ギガ・スレイブ！」', anim: 'doramata_sig',
  },
};
