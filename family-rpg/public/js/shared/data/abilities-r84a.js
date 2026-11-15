// 第84回 A班: 幽☆遊☆白書の 系統の 技（ふりょう → れい界探てい → うら飯ゆう助 → 魔界の王の子。docs/plan-r84-jobs-a.md）
//
// きまりは abilities-r83a.js（封神演義の 系統）と おなじ
//  ・Lv1〜10 で 6こ（Lv10 が 看板の 技 <職業の id>_sig。いちばん MPを 使う）。伝説は Lv1・3・5・7・8・10
//  ・自分に かける 補助は 段の 上限まで（基本職 1.25倍・上級職 1.3倍・超級職と 伝説 1.3倍〈2だんかいで 1.6倍〉）
// この 系統だけの しくみ（shared/battle-r84a.js。どれも 戦いの 中だけ）
//  ・phys の rei … れい丸の 技（MP の ほかに「れい丸」を 使う。戦い 1回に うてる 数は 今の 職業の 段: 上級職 2・超級職 4・伝説 6）
//      use: n            … n 発 使う（のこりが n より 少ないと えらべない）
//      all: true, min: n … のこりを ぜんぶ うつ（min 発 いじょう いる。upTo … うつ 数の 上限〈フルパワーは 2〉）
//        base・per … 威力（mult）が base ＋ per × うった 数 ／ hitsPer … うった 数 × hitsPer 回 当てる（mult は 1回ぶん）
//  ・type 'r84aCharge' … れい丸が add 発 もどる（上限まで）
//  ・type 'r84aNakama' … 仲間のために（left 回の 行動の 間、たおれた 仲間が いるほど 物理の 力が 上がる。base ＋ per × たおれた 数、cap まで）
// えんしゅつ（anim）は client/render/battlefx-r84a.js（r84a_… と 看板の 技）

export const R84A_ABILITIES = {
  // ───────────── ふりょう（基本職） ─────────────
  fr_punch: {
    name: 'けんかパンチ', kana: 'けんかぱんち', kind: 'skill', job: 'furyo', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 },
    desc: 'まっすぐ、力いっぱいのパンチ。敵1体に強めの一撃。', cast: '{a}のけんかパンチ！', anim: 'r84a_punch',
  },
  fr_gan: {
    name: 'ガンをとばす', kana: 'がんをとばす', kind: 'skill', job: 'furyo', mp: 3, target: 'enemy', role: 'sup',
    effect: { type: 'debuff', stat: 'atk', mult: 0.75, dur: 30, chance: 0.8 },
    desc: 'じっとにらみつけて、敵1体をひるませる。敵の攻撃力が下がる。', cast: '{a}は、じーっとにらみつけた！', anim: 'debuff',
  },
  fr_zutsuki: {
    name: 'ずつき', kana: 'ずつき', kind: 'skill', job: 'furyo', mp: 5, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.8 }, { type: 'atbSet', sub: 40, chance: 0.4, msg: '{t}は、目を回して動けない！', failMsg: '{t}は、なんとかふみとどまった！' }] },
    desc: '思いきり頭からぶつかる。敵1体に強い一撃。ときどき敵が動けなくなる。', cast: '{a}のずつき！ゴツン！', anim: 'r84a_zutsuki',
  },
  fr_hirune: {
    name: '屋上でひるね', kana: 'おくじょうでひるね', kind: 'skill', job: 'furyo', mp: 2, target: 'self', role: 'heal',
    effect: { type: 'heal', base: [26, 34], thr: 20 },
    desc: '戦いの中でも、ごろんとねころんで、ひと休み。自分のHPが回復する。', cast: '{a}は、ごろんとねころんだ…「ふあ〜あ。よくねた」', anim: 'heal1',
  },
  fr_kabau: {
    name: '仲間をかばう', kana: 'なかまをかばう', kind: 'skill', job: 'furyo', mp: 3, target: 'ally', role: 'sup',
    effect: { type: 'cover' },
    desc: '「こいつには、手を出させねえ！」仲間1人の前に立って、かわりに攻撃を受ける。', cast: '{a}「こいつには、手を出させねえ！」', anim: 'guard',
  },
  furyo_sig: {
    name: 'けんか百れつけん', kana: 'けんかひゃくれつけん', kind: 'skill', job: 'furyo', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 0.5, hits: 6 },
    desc: 'りょう手のこぶしで、目にもとまらぬ連打。敵1体に6回攻撃する。', cast: '{a}「おりゃりゃりゃりゃーっ！」', anim: 'furyo_sig',
  },

  // ───────────── れい界探てい（上級職。れい丸 2発） ─────────────
  rt_reigan: {
    name: 'れい丸', kana: 'れいがん', kind: 'skill', job: 'reikai_tantei', mp: 6, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 3.5, rei: { use: 1 } },
    desc: '指先に力を集めて、青い光の玉をうつ。れい丸を1発使う。敵1体にとても大きなダメージ。', cast: '{a}「くらえ、れい丸！」', anim: 'r84a_reigan',
  },
  rt_tame: {
    name: 'れい力をためる', kana: 'れいりょくをためる', kind: 'skill', job: 'reikai_tantei', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'r84aCharge', add: 1 },
    desc: '目をとじて、体の中のれい力を集める。れい丸が1発もどる。', cast: '{a}は、れい力をためている…！', anim: 'r84a_charge',
  },
  rt_dougu: {
    name: 'れい界の道具', kana: 'れいかいのどうぐ', kind: 'skill', job: 'reikai_tantei', mp: 3, target: 'enemies', role: 'sup',
    effect: { type: 'scan' },
    desc: 'れい界からあずかった、ふしぎな道具で、敵を調べる。敵全体の弱点がわかる。', cast: '{a}は、れい界の道具で敵を調べた！', anim: 'r84a_scan',
  },
  rt_shotgun: {
    name: 'ショットガン', kana: 'しょっとがん', kind: 'skill', job: 'reikai_tantei', mp: 8, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 1.25, rei: { use: 1 } },
    desc: 'れい力を、こぶしから小さな光のつぶにして、ばらまく。れい丸を1発使う。敵全体にダメージ。', cast: '{a}「ショットガン！」', anim: 'r84a_shotgun',
  },
  rt_konjou: {
    name: 'こんじょう', kana: 'こんじょう', kind: 'skill', job: 'reikai_tantei', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 35 },
    desc: '「こんなもんで、負けるかよ！」自分の攻撃力と守備力が上がる。', cast: '{a}「こんなもんで、負けるかよ！」', anim: 'warcry',
  },
  reikai_tantei_sig: {
    name: 'れい丸・フルパワー', kana: 'れいがんふるぱわー', kind: 'skill', job: 'reikai_tantei', mp: 16, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 1, rei: { all: true, min: 1, upTo: 2, base: 2.0, per: 1.8 } },
    desc: 'のこりのれい丸を全部（2発まで）、1発にこめてうつ。こめたれい丸が多いほど強い。敵1体に大きなダメージ。', cast: '{a}「ありったけだ！れい丸・フルパワー！」', anim: 'reikai_tantei_sig',
  },

  // ───────────── うら飯ゆう助（超級職。れい丸 4発・1回だけ 立ち上がる） ─────────────
  yu_reikou: {
    name: 'れい光だん', kana: 'れいこうだん', kind: 'skill', job: 'yusuke', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.6 },
    desc: 'れい力をこめたこぶしで、敵1体をなぐる。れい丸は使わない。', cast: '{a}のれい光だん！', anim: 'r84a_punch',
  },
  yu_shugyou: {
    name: 'れい光はどうけんの修行', kana: 'れいこうはどうけんのしゅぎょう', kind: 'skill', job: 'yusuke', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 },
    desc: 'きびしい修行を思い出して、力をみなぎらせる。自分の攻撃力と素早さが上がる。', cast: '{a}「あの修行に、くらべりゃあ！」', anim: 'r84a_aura',
  },
  yu_niren: {
    name: 'れい丸・二連', kana: 'れいがんにれん', kind: 'skill', job: 'yusuke', mp: 12, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 3.0, hits: 2, rei: { use: 2 } },
    desc: 'れい丸を2発つづけてうつ。れい丸を2発使う。敵1体に2回、とても大きなダメージ。', cast: '{a}「れい丸！もう一発！」', anim: 'r84a_reigan',
  },
  yu_nakama: {
    name: '仲間のために', kana: 'なかまのために', kind: 'skill', job: 'yusuke', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'r84aNakama', left: 3, base: 1.1, per: 0.2, cap: 1.7 },
    desc: 'たおれた仲間を思って、力をふりしぼる。しばらく自分の力が上がる。たおれた仲間がいるほど、もっと上がる。', cast: '{a}「みんなのぶんまで、やってやる！」', anim: 'r84a_aura',
  },
  yu_bakuretsu: {
    name: 'ばくれつけん', kana: 'ばくれつけん', kind: 'skill', job: 'yusuke', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 5, random: true },
    desc: 'こぶしの連打を、敵にランダムで5回打ちこむ。', cast: '{a}のばくれつけん！', anim: 'r84a_rush',
  },
  yusuke_sig: {
    name: 'れい丸・最大出力', kana: 'れいがんさいだいしゅつりょく', kind: 'skill', job: 'yusuke', mp: 22, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 8.6, ignoreDef: 0.3, rei: { use: 2 } },
    desc: 'れい丸を2発使う。2発分の力を、ひとつにまとめた大きな光の玉。敵1体にとても大きなダメージ。守りが固い敵にも強い。', cast: '{a}「これが、おれの全部だ！れい丸・最大出力！」', anim: 'yusuke_sig',
  },

  // ───────────── 魔界の王の子（伝説。れい丸 6発） ─────────────
  mk_youga: {
    name: 'よう丸', kana: 'ようがん', kind: 'skill', job: 'makai_prince', mp: 10, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 4.8, element: 'dark', rei: { use: 1 } },
    desc: '魔界の力をこめた、黒い光の玉をうつ。れい丸を1発使う。敵1体に闇の大ダメージ。', cast: '{a}「よう丸！」', anim: 'r84a_youga',
  },
  mk_mazoku: {
    name: '魔族の血', kana: 'まぞくのち', kind: 'skill', job: 'makai_prince', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 45 },
    desc: '体の中の魔族の血が、目をさます。自分の攻撃力・守備力・素早さが大きく上がる。', cast: '{a}の体に、ふしぎなもようがうかび上がった！', anim: 'r84a_aura',
  },
  mk_sandan: {
    name: 'れい丸・さんだん', kana: 'れいがんさんだん', kind: 'skill', job: 'makai_prince', mp: 20, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 2.4, rei: { use: 2 } },
    desc: 'れい丸を空中ではじけさせて、光のつぶを雨のようにふらせる。れい丸を2発使う。敵全体に大ダメージ。', cast: '{a}「れい丸・さんだん！」', anim: 'r84a_shotgun',
  },
  mk_touki: {
    name: 'とう気をねる', kana: 'とうきをねる', kind: 'skill', job: 'makai_prince', mp: 18, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'r84aCharge', add: 2 }, { type: 'heal', base: [110, 140], thr: 60 }] },
    desc: '体じゅうの気を、ゆっくりねり上げる。れい丸が2発もどって、HPも回復する。', cast: '{a}は、しずかにとう気をねっている…', anim: 'r84a_charge',
  },
  mk_tanoshii: {
    name: '楽しいけんか', kana: 'たのしいけんか', kind: 'skill', job: 'makai_prince', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.3, dur: 40 },
    desc: '「へへっ、楽しくなってきたぜ！」仲間全員の攻撃力が上がる。', cast: '{a}「へへっ、楽しくなってきたぜ！」', anim: 'r84a_cheer',
  },
  makai_prince_sig: {
    name: '超・れい丸', kana: 'ちょうれいがん', kind: 'skill', job: 'makai_prince', mp: 30, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 1.6, ignoreDef: 0.3, rei: { all: true, min: 2, hitsPer: 1 } },
    desc: 'のこりのれい丸を、全部つづけてうつ（2発いじょういる）。うった数だけ、敵1体に大きなダメージ。守りが固い敵にも強い。', cast: '{a}「全部、持っていけ！超・れい丸！」', anim: 'makai_prince_sig',
  },
};
