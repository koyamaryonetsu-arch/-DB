// ひらめき技を ぜんぶの 上級職より 上に（2026年10月 第27回）
//
// 家族の ねがい「ひらめき技は 全部の 上級職以上に 作って」
// ・上級職・超級職・伝説の職業で、その 職業の ひらめき技が まだ なかった 職業に 1こずつ（暴れんぼう将軍は 2こ）。
//   第26回の 基本職（スパイ・少年探てい団・ネコ型ロボット・カッパ）にも 1こずつ
// ・前から ある ひらめき技（hirameki.js・hirameki-jobs.js）は そのまま
// ・しくみは hirameki-jobs.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（上の 職業ほど 技の MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。みんなに かける 補助は 職業の ランクの 上限まで
//   anim は 前から ある エフェクト（client/render/battlefx*.js）
// ・id は hi_ で はじめる（hirameki-jobs.js と かぶらない）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];
const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R27_ABILITIES = {
  // ───────────── 上級職 ─────────────
  hi_bakuretsu_giri: sk('battlemaster', {
    name: 'ばくれつ斬り', kana: 'ばくれつぎり', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, ignoreDef: 0.2 },
    desc: '気合いを一気にばくはつさせて斬りつける。敵1体に大きなダメージ。', cast: '{a}のばくれつ斬り！', anim: 'slash_heavy',
  }),
  hi_oouzushio: sk('pirate', {
    name: '海賊のうずまき', kana: 'かいぞくのうずまき', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [48, 60], thr: 35 },
    desc: '海をかきまわして、大きなうずしおを起こす。敵全体に氷のダメージ。', cast: '{a}「みんな、海をかきまわせ！」', anim: 'whirlpool',
  }),
  hi_happou_shuriken: sk('ninja', {
    name: '八方手裏剣', kana: 'はっぽうしゅりけん', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 5, random: true },
    desc: '8つの方向に、いっせいに手裏剣を投げる。5回、敵にランダムで当たる。', cast: '{a}は八方に手裏剣を投げた！', anim: 'shuriken',
  }),
  hi_shinkuu_giri: sk('samurai', {
    name: '真空斬り', kana: 'しんくうぎり', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 1.2, element: 'wind' },
    desc: '刀をふりぬいた風で、はなれた敵まで斬る。敵全体に風のダメージ。', cast: '{a}は刀を大きくふりぬいた！', anim: 'wind2',
  }),
  hi_settai_golf: sk('bucho', {
    name: 'せったいゴルフ', kana: 'せったいごるふ', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, critBonus: 0.15 },
    desc: '取引先の前で、思い切りふりぬく。敵1体に大きなダメージ。会心が出やすい。', cast: '{a}「ナイスショット！」', anim: 'bat_swing',
  }),
  hi_jougai_hr: sk('major_leaguer', {
    name: '場外ホームラン', kana: 'じょうがいほーむらん', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, ignoreDef: 0.2 },
    desc: '球場の外まで飛ばす、とんでもない一打。敵1体に大きなダメージ。', cast: '{a}の打球は、球場の外へ消えていった！', anim: 'bat_swing',
  }),
  hi_relay: sk('middleschooler', {
    name: '体育祭のリレー', kana: 'たいいくさいのりれー', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 2.2, atbAfter: 50 },
    desc: 'バトンをにぎって、全力で走る。敵1体に体当たりして、早めに次の番が来る。', cast: '{a}はバトンをにぎって走り出した！', anim: 'tackle',
  }),
  hi_toben: sk('civil_national', {
    name: '長い国会答弁', kana: 'ながいこっかいとうべん', mp: 10, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [40, 52], thr: 35 },
        { type: 'atbSet', sub: 40, chance: 0.55, msg: '{t}は、長い答弁にうんざりして動けない！', failMsg: '{t}は、とちゅうで聞くのをやめた。' },
      ],
    },
    desc: '「ただいまのご質問にお答えします…」敵全体に長い答弁。ダメージをあたえて、動きを止めることもある。', cast: '{a}「ただいまのご質問に、お答えいたします…」', anim: 'notes',
  }),
  hi_sasumata: sk('police', {
    name: 'さすまた', kana: 'さすまた', mp: 8, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.0 },
        { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、さすまたでおさえこまれた！', failMsg: '{t}は、さすまたをふりほどいた！' },
      ],
    },
    desc: '長い棒の先で、敵1体をぐいっとおさえこむ。ダメージをあたえて、動きを止めることもある。', cast: '{a}はさすまたをかまえた！', anim: 'tackle',
  }),
  hi_shoukaki: sk('firefighter', {
    name: '消火器', kana: 'しょうかき', mp: 6, target: 'group',
    effect: { type: 'phys', mult: 1.35, element: 'ice', vsElement: { fire: 1.5 } },
    desc: '消火器で、同じ種類の敵にまっ白なあわをふきつける。炎の敵によく効く。', cast: '{a}は消火器のピンをぬいた！', anim: 'water',
  }),
  hi_kaisoku: sk('train_driver', {
    name: '快速運転', kana: 'かいそくうんてん', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.15, atbAfter: 50 },
    desc: '小さな駅は止まらずに走りぬける。敵全体に体当たりして、早めに次の番が来る。', cast: '{a}「この電車は、快速です！」', anim: 'train',
  }),
  hi_kougaku_superchat: sk('streamer', {
    name: '高額スパチャ', kana: 'こうがくすぱちゃ', mp: 10, target: 'enemy',
    effect: { type: 'magic', base: [95, 115], thr: 55 },
    desc: '画面がまっ赤になるほどの、高額の投げせん。敵1体に大きなダメージ。', cast: '画面が、まっ赤なコメントでうまった！', anim: 'superchat',
  }),
  hi_nomiss: sk('pro_gamer', {
    name: 'ノーミスクリア', kana: 'のーみすくりあ', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.25, critBonus: 0.15 },
    desc: '1回もミスしないで、ステージをかけぬける。敵全体にダメージ。会心が出やすい。', cast: '{a}の指が、目にも止まらない速さで動く！', anim: 'glitch',
  }),
  hi_okaimono: sk('rakuten_cardman', {
    name: 'お買い物マラソン', kana: 'おかいものまらそん', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.55, hits: 6, random: true },
    desc: 'いくつものお店をはしごして、カードをシュッ。6回、敵にランダムで当たる。', cast: '{a}「お買い物マラソン、スタート！」', anim: 'cards',
  }),
  hi_suiryuu: sk('kisatsu', {
    name: '水の呼吸・流流まい', kana: 'みずのこきゅうりゅうりゅうまい', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 4, random: true },
    desc: '流れる水のように、止まらずに動きながら斬る。4回、敵にランダムで当たる。', cast: '{a}の水の呼吸！流流まい！', anim: 'slash_multi',
  }),
  hi_haigo: sk('assassin', {
    name: '背後を取る', kana: 'はいごをとる', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.5, ignoreDef: 0.3, critBonus: 0.15 },
    desc: '音もなくうしろに回りこんで、一げき。敵1体に大きなダメージ。守りの固い敵にも効く。', cast: '{a}は、音もなく{t}の背後に回った…', anim: 'slash_fast',
  }),
  hi_spoon_arashi: sk('esper', {
    name: 'スプーンのあらし', kana: 'すぷーんのあらし', mp: 11, target: 'enemies',
    effect: { type: 'magic', base: [55, 70], thr: 40 },
    desc: 'まげたスプーンを、ねん力でいっせいに飛ばす。敵全体にダメージ。', cast: '{a}のまわりに、たくさんのスプーンがうかび上がった！', anim: 'void',
  }),
  hi_tsuiseki: sk('oshiri_tantei', {
    name: 'くんくん追せき', kana: 'くんくんついせき', mp: 8, target: 'enemy',
    effect: { type: 'deduce', base: [72, 88], thr: 40 },
    desc: 'においをたどって、敵1体のいちばんの弱点を見ぬき、その属性で攻撃する。', cast: '{a}「くんくん…においますね」', anim: 'holy',
  }),
  hi_ball_belt: sk('meitantei', {
    name: 'ボール射出ベルト', kana: 'ぼーるしゃしゅつべると', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, critBonus: 0.1 },
    desc: 'ベルトからサッカーボールを出して、思い切りけりこむ。敵1体に大きなダメージ。', cast: '{a}はベルトからボールを出した！', anim: 'ball',
  }),
  hi_kenkou_soudan: sk('creator', {
    name: '健康そうだん会', kana: 'けんこうそうだんかい', mp: 12, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [60, 76], thr: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'みんなの体の様子を見て、ぴったりのお薬を出す。仲間全員のHPを回復して、悪いじょうたいを治す。', cast: '{a}「本日は、健康そうだん会です！」', anim: 'heal_ring',
  }),
  hi_maru_kaiten: sk('mimi_robot', {
    name: 'まんまる大回転', kana: 'まんまるだいかいてん', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.15 },
    desc: 'まるい体でごろごろ転がって、敵全体にぶつかる。', cast: '{a}は、まるくなって転がり出した！', anim: 'tackle',
  }),
  hi_hana_fubuki: sk('hanakappa', {
    name: '花ふぶき', kana: 'はなふぶき', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [52, 66], thr: 35 },
    desc: 'あたまの花から、花びらをふぶきのようにまき散らす。敵全体に風のダメージ。', cast: '「パッカーン！」{a}のあたまから、花びらがまい上がった！', anim: 'wind1',
  }),

  // ───────────── 超級職 ─────────────
  hi_dragon_dive: sk('dragon_knight', {
    name: '竜の急こう下', kana: 'りゅうのきゅうこうか', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, element: 'fire' },
    desc: '竜の力で空高く飛び上がり、敵1体に急こう下。炎の大ダメージ。', cast: '{a}は竜の力で、空高く飛び上がった！', anim: 'dragon_beam',
  }),
  hi_gohon_merazoma: sk('archmage', {
    kind: 'spell', name: '五本指のメラゾーマ', kana: 'ごほんゆびのめらぞーま', mp: 22, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [120, 145], thr: 80 },
    desc: '5本の指それぞれにメラゾーマを宿して、いっぺんに放つ。敵全体に炎の大ダメージ。', cast: '{a}の5本の指に、大きな炎が宿った！', anim: 'fire_wave',
  }),
  hi_seinaru_kekkai: sk('high_priest', {
    kind: 'spell', name: '聖なる大結界', kana: 'せいなるだいけっかい', mp: 18, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 45 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
    desc: '光のかべで、みんなをつつみこむ。仲間全員の守備力が上がり、HPがしばらく少しずつ回復する。', cast: '{a}のいのりで、光のかべがあらわれた！', anim: 'heal_ring',
  }),
  hi_tenchi_kudaki: sk('god_hand', {
    name: '天地を砕く拳', kana: 'てんちをくだくけん', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.5, ignoreDef: 0.3 },
    desc: '大地ごと打ちぬく、神の拳。敵全体に大きなダメージ。守りの固い敵にも効く。', cast: '{a}の拳が、大地をゆるがした！', anim: 'quake',
  }),
  hi_ryuujin: sk('summoner', {
    kind: 'spell', name: 'げんま「竜神」', kana: 'げんまりゅうじん', mp: 22, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [120, 145], thr: 80 },
    desc: '天をかける竜神をよび出す。敵全体に光の大ダメージ。', cast: '{a}は、天をかける竜神をよび出した！', anim: 'summon',
  }),
  hi_ankoku_juuji: sk('magic_swordsman', {
    name: 'やみの十字', kana: 'やみのじゅうじ', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.8, element: 'dark' },
    desc: 'やみの力をまとった剣で、十字に斬る。敵1体に闇の大ダメージ。', cast: '{a}の剣が、やみの十字をえがいた！', anim: 'dark_slash',
  }),
  hi_shield_throw: sk('guardian', {
    name: 'シールドスロー', kana: 'しーるどすろー', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, atkFrom: 'def' },
    desc: '大きなたてを、思い切り投げつける。守備力が高いほど強い。敵1体に大きなダメージ。', cast: '{a}は、たてを投げつけた！', anim: 'tackle',
  }),
  hi_jigodein: sk('hero', {
    kind: 'spell', name: 'ジゴデイン', kana: 'じごでいん', mp: 22, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [220, 260], thr: 85 },
    desc: '勇者だけが使える、いちばん強い雷の呪文。敵1体に雷の大ダメージ。', cast: '{a}はジゴデインをとなえた！', anim: 'bolt2',
  }),
  hi_mamono_shingeki: sk('monster_master', {
    name: '魔物の大進げき', kana: 'まもののだいしんげき', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 5, random: true },
    desc: '仲間の魔物たちが、いっせいにかけ出す。5回、敵にランダムで当たる。', cast: '{a}の合図で、魔物たちがかけ出した！', anim: 'bite',
  }),
  hi_amanogawa: sk('star_diva', {
    name: '天の川の歌', kana: 'あまのがわのうた', mp: 16, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [90, 110], thr: 60 }, { type: 'mpHeal', base: [4, 8] }] },
    desc: '星の川の歌で、みんなの心をいやす。仲間全員のHPとMPを回復する。', cast: '{a}は、天の川の歌を歌った。', anim: 'heal_dance',
  }),
  hi_sen_no_tachi: sk('sword_master', {
    name: '剣聖・千の太刀', kana: 'けんせいせんのたち', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 6, random: true },
    desc: '目にも止まらない、数え切れない太刀。6回、敵にランダムで当たる。', cast: '{a}の剣が、千本に見えた！', anim: 'slash_multi',
  }),
  hi_tenka_touitsu: sk('shogun', {
    name: '天下統一', kana: 'てんかとういつ', mp: 16, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 45 }, { type: 'bondUp', amount: 20 }] },
    desc: '天下を1つにまとめる大号令。仲間全員の攻撃力と守備力が上がり、きずなゲージもふえる。', cast: '{a}「天下は、ひとつじゃ！」', anim: 'warcry',
  }),
  hi_bonus: sk('shacho', {
    name: 'ボーナス大放出', kana: 'ぼーなすだいほうしゅつ', mp: 14, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [80, 100], thr: 50 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: '「今年はボーナス大はずみだ！」仲間全員のHPとMPを回復する。', cast: '{a}「今年は、ボーナス大はずみだ！」', anim: 'coins',
  }),
  hi_100mile: sk('nitoryu', {
    name: '100マイルの直球', kana: 'ひゃくまいるのちょっきゅう', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.3 },
    desc: '時速160キロをこえる、まっすぐな球。敵1体に大きなダメージ。', cast: '{a}の100マイルの直球！', anim: 'ball',
  }),
  hi_hanabi: sk('highschooler', {
    name: '打ち上げ花火', kana: 'うちあげはなび', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [80, 100], thr: 60 },
    desc: '文化祭のしめくくりの、大きな花火。敵全体に爆発のダメージ。', cast: '夜空に、大きな花火が上がった！', anim: 'blast2',
  }),
  hi_yosan_cut: sk('career', {
    name: '予算カット', kana: 'よさんかっと', mp: 14, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [{ type: 'debuff', stat: 'atk', mult: 0.8, dur: 40, chance: 0.8 }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 40, chance: 0.8 }],
    },
    desc: 'むだな予算を、ばっさりけずる。敵全体の攻撃力と守備力が下がる。', cast: '{a}「この予算は、みとめられません」', anim: 'debuff',
  }),
  hi_fruit_parfait: sk('fruit_idol', {
    name: 'フルーツパフェ', kana: 'ふるーつぱふぇ', mp: 16, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [85, 105], thr: 60 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }] },
    desc: 'カラフルなパフェを、みんなでパクッ。仲間全員のHPを回復して、素早さが上がる。', cast: '{a}「みんなで、パフェ食べよ！」', anim: 'heal_dance',
  }),
  hi_ooarashi: sk('storm_idol', {
    name: '5人の大嵐', kana: 'ごにんのおおあらし', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [105, 125], thr: 70 },
    desc: '5人の歌声が大きな嵐になる。敵全体に風の大ダメージ。', cast: 'ステージから、大きな嵐がまき起こった！', anim: 'storm',
  }),
  hi_airport: sk('keikyu_driver', {
    name: 'エアポート快特', kana: 'えあぽーとかいとく', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, atbAfter: 60 },
    desc: '空港まで止まらずに走る、赤い電車。敵1体に大きなダメージ。打ったあと、早めに次の番が来る。', cast: '{a}「空港まで、ノンストップです！」', anim: 'redtrain',
  }),
  hi_kimagure_salad: sk('star_chef', {
    name: 'シェフのきまぐれサラダ', kana: 'しぇふのきまぐれさらだ', mp: 18, target: 'allies',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 115], thr: 60 }, { type: 'regen', base: [10, 14], thr: 40, dur: 24 }] },
    desc: '何が入っているかは、シェフの気分しだい。仲間全員のHPを回復して、しばらく少しずつ回復する。', cast: '{a}「本日の、きまぐれサラダです」', anim: 'heal_dance',
  }),
  hi_genba_shacho: sk('tatakiage', {
    name: '社長みずから現場へ', kana: 'しゃちょうみずからげんばへ', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, ignoreDef: 0.2 },
    desc: '社長が作業着で現場に飛びこむ。敵全体に大きなダメージ。', cast: '{a}「わしも行くぞ！」', anim: 'quake',
  }),
  hi_4min_manzai: sk('m1_champion', {
    name: '4分間のまんざい', kana: 'よんぷんかんのまんざい', mp: 20, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [110, 130], thr: 70 },
        { type: 'atbSet', sub: 30, chance: 0.5, msg: '{t}は笑いころげている！', failMsg: '{t}は、こらえた！' },
      ],
    },
    desc: '決勝と同じ、4分間の全力のまんざい。敵全体にダメージをあたえて、笑いころげさせることもある。', cast: '{a}「どうもー！よろしくお願いしますー！」', anim: 'laugh',
  }),
  hi_lucifer: sk('datenshi', {
    kind: 'spell', name: 'ルシフェルウイング', kana: 'るしふぇるういんぐ', mp: 18, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [200, 240], thr: 85 },
    desc: '黒いつばさを大きく広げて、やみの羽根をうちこむ。敵1体に闇の大ダメージ。', cast: '{a}の黒いつばさが、大きく広がった…', anim: 'dark_wings',
  }),
  hi_masenkou: sk('ss2', {
    name: '魔閃光', kana: 'ませんこう', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, element: 'light' },
    desc: '両手を重ねて、光の気をうち出す。敵1体に光の大ダメージ。', cast: '{a}の魔閃光！', anim: 'kamehameha',
  }),
  hi_shimekiri: sk('black_star', {
    name: '月末のしめ切り', kana: 'げつまつのしめきり', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 1.7 },
    desc: 'しめ切りに追われて、ものすごいいきおいで仕事を終わらせる。敵全体に大きなダメージ。', cast: '{a}「しめ切りは、今日だ！」', anim: 'manin_densha',
  }),
  hi_enko: sk('enbashira', {
    name: '五の型・炎虎', kana: 'ごのかたえんこ', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.3, element: 'fire' },
    desc: '炎の呼吸、五の型。炎の虎のように、敵1体にかみつく。炎の大ダメージ。', cast: '{a}の炎の呼吸！五の型・炎虎！', anim: 'fire3',
  }),
  hi_sogeki: sk('black_org', {
    name: '長きょりそげき', kana: 'ちょうきょりそげき', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.3, critBonus: 0.1 },
    desc: 'ずっと遠くのビルの上から、ねらいすます。敵1体に大きなダメージ。', cast: '遠くで、何かがキラッと光った…', anim: 'slash_fast',
  }),
  hi_biglight: sk('doraemon', {
    name: 'ビッグライト', kana: 'びっぐらいと', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.4, dur: 40 },
    desc: '「ビッグライト〜！」自分を大きくする。自分の攻撃力と守備力が上がる。', cast: '{a}「ビッグライト〜！」', anim: 'charge',
  }),
  hi_ninniku_bomber: sk('kinniku_kappa', {
    name: 'ニンニクボンバー', kana: 'にんにくぼんばー', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.7 },
    desc: 'ニンニクパワーを、筋肉ごとばくはつさせる。敵全体に大きなダメージ。', cast: '{a}の筋肉が、ばくはつした！', anim: 'quake',
  }),
  hi_kunai_ame: sk('konoha', {
    name: '影分身・クナイの雨', kana: 'かげぶんしんくないのあめ', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 0.55, hits: 7, random: true },
    desc: '影分身たちが、いっせいにクナイを投げる。7回、敵にランダムで当たる。', cast: '{a}たちは、いっせいにクナイを投げた！', anim: 'shuriken',
  }),

  // ───────────── 伝説の職業 ─────────────
  hi_juubai_kame: sk('ss3', {
    name: '10倍かめはめ波', kana: 'じゅうばいかめはめは', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 2.2 },
    desc: 'いつもの10倍の気をこめたかめはめ波。敵全体に大ダメージ。', cast: '{a}「10倍…かめはめ波ーっ！」', anim: 'kamehameha',
  }),
  hi_manga: sk('nika', {
    name: 'マンガのような大あばれ', kana: 'まんがのようなおおあばれ', mp: 26, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.9 },
        { type: 'atbSet', sub: 30, chance: 0.5, msg: '{t}は目を回している！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: 'マンガのように体をのばしたりふくらませたり。敵全体に大ダメージをあたえて、目を回させることもある。', cast: '{a}は楽しそうに笑いながら、大あばれした！', anim: 'gomu_punch',
  }),
  hi_digital_twin: sk('facility_genius', {
    name: 'デジタルツイン', kana: 'でじたるついん', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [200, 240], thr: 90 },
    desc: '建物をまるごとデータにうつして、弱いところを計算する。敵全体に光の大ダメージ。', cast: '{a}「計算できた。ここが弱点だ」', anim: 'mieruka',
  }),
  hi_enbu: sk('hinokami', {
    name: '日の呼吸・円まい', kana: 'ひのこきゅうえんまい', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.6, element: 'fire' },
    desc: '日の呼吸、はじまりの型。まるい日をえがくように、敵1体を斬る。炎の大ダメージ。', cast: '{a}のヒノカミ神楽！円まい！', anim: 'fire3',
  }),
  hi_tajuu_rasengan: sk('hokage', {
    name: '多重らせん丸', kana: 'たじゅうらせんがん', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 2.0 },
    desc: '影分身たちが、それぞれらせん丸を持ってとびかかる。敵全体に大ダメージ。', cast: '{a}たち「らせん丸！」', anim: 'void',
  }),
  hi_oniwaban_maire: sk('abarenbo_shogun', {
    name: 'お庭番、参れ！', kana: 'おにわばんまいれ', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 6, random: true, critBonus: 0.1 },
    desc: '上様の一声で、かくれていたお庭番がいっせいにあらわれる。6回、敵にランダムで当たる。', cast: '{a}「お庭番、参れ！」', anim: 'shuriken',
  }),
  hi_tenka_gomen: sk('abarenbo_shogun', {
    name: '天下ごめんの大あばれ', kana: 'てんかごめんのおおあばれ', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 2.0, ignoreDef: 0.3 },
    desc: '町じゅうをかけ回る、上様の大立ち回り。敵全体に大ダメージ。守りの固い敵にも効く。', cast: '{a}は、悪いやつらの中へ切りこんだ！', anim: 'slash_multi',
  }),

  // ───────────── 第26回の 基本職 ─────────────
  hi_himitsu_pen: sk('spy', {
    name: 'ひみつ道具のペン', kana: 'ひみつどうぐのぺん', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, element: 'bolt' },
    desc: 'ペンの形をしたひみつの道具。おすと電気が流れる。敵1体に雷のダメージ。', cast: '{a}はペンのボタンをカチッとおした！', anim: 'bolt1',
  }),
  hi_shoot: sk('shonen_tantei', {
    name: 'ねらいすましたシュート', kana: 'ねらいすましたしゅーと', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.9 },
    desc: 'しっかりねらって、ボールをけりこむ。敵1体に大きなダメージ。', cast: '{a}のシュート！', anim: 'ball',
  }),
  hi_dorayaki_wake: sk('neko_robot', {
    name: 'どら焼きを分けよう', kana: 'どらやきをわけよう', mp: 6, target: 'allies',
    effect: { type: 'heal', base: [26, 34], thr: 20 },
    desc: '大すきなどら焼きを、みんなで分けて食べる。仲間全員のHPを回復する。', cast: '{a}「みんなで食べると、おいしいね」', anim: 'heal1',
  }),
  hi_kyuuri_shuriken: sk('kappa', {
    name: 'キュウリ手裏剣', kana: 'きゅうりしゅりけん', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.5, hits: 5, random: true },
    desc: 'うすく切ったキュウリを、手裏剣のように投げる。5回、敵にランダムで当たる。', cast: '{a}はキュウリを、しゅしゅっと投げた！', anim: 'shuriken',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R27 = {
  hi_bakuretsu_giri: { from: { bm_musou: 12, bm_otakebi: 6 } },
  hi_oouzushio: { from: { pr_uzushio: 12, pr_cannon: 4 } },
  hi_happou_shuriken: { from: { nj_shuriken: 15, nj_katon: 6 } },
  hi_shinkuu_giri: { from: { sa_iai: 15, sa_tsubame: 8 } },
  hi_settai_golf: { from: { bc_golf: 15, bc_homeru: 6 } },
  hi_jougai_hr: { from: { ml_160: 12, ml_sweeper: 6 } },
  hi_relay: { from: { jh_bukatsu: 10, jh_smash: 12 } },
  hi_toben: { from: { nc_kisha: 8, nc_roppou: 12 } },
  hi_sasumata: { from: { po_keibou: 15, po_taiho: 8 } },
  hi_shoukaki: { from: { ff_housui: 15, ff_hinoyoujin: 6 } },
  hi_kaisoku: { from: { dv_tsuuka: 10, dv_kiteki: 8 } },
  hi_kougaku_superchat: { from: { st_nagesen: 8, st_collab: 8 } },
  hi_nomiss: { from: { pg_keyboard: 12, pg_nyuuryoku: 8 } },
  hi_okaimono: { from: { rk_card: 15, rk_dance: 6 } },
  hi_suiryuu: { from: { ks_minamo: 15, ks_zenshuu: 6 } },
  hi_haigo: { from: { as_kyuusho: 15, as_kehai: 6 } },
  hi_spoon_arashi: { from: { ep_spoon: 15, ep_nenriki: 8 } },
  hi_tsuiseki: { from: { os_kunkun: 10, os_suiri: 12 } },
  hi_ball_belt: { from: { mt_kick: 12, mt_skate: 6 } },
  hi_kenkou_soudan: { from: { ct_kusuri: 12, ct_shohou: 6 } },
  hi_maru_kaiten: { from: { mr_zutsuki: 15, mr_naku: 6 } },
  hi_hana_fubuki: { from: { hkp_hanabira: 15, hkp_gattsu: 6 } },
  hi_dragon_dive: { from: { dk_gigabreak: 10, dk_aura: 6 } },
  hi_gohon_merazoma: { from: { am_meragaia: 6, am_begiragon: 8 } },
  hi_seinaru_kekkai: { from: { hp_seinaru: 10, hp_holy: 8 } },
  hi_tenchi_kudaki: { from: { gh_musou: 8, gh_shinsoku: 10 } },
  hi_ryuujin: { from: { sm_ifrit: 8, sm_raijin: 6 } },
  hi_ankoku_juuji: { from: { ms_soul: 10, ms_ankoku: 6 } },
  hi_shield_throw: { from: { gd_bash: 12, gd_wall: 8 } },
  hi_jigodein: { from: { hr_gigadein: 8, hr_gigaslash: 6 } },
  hi_mamono_shingeki: { from: { mm_daikoushin: 8, mm_howl: 6 } },
  hi_amanogawa: { from: { sd_song: 10, sd_blessing: 4 } },
  hi_sen_no_tachi: { from: { swm_seiken: 10, swm_raijin: 6 } },
  hi_tenka_touitsu: { from: { sg_gorei: 10, sg_ikkiuchi: 8 } },
  hi_bonus: { from: { sh_meirei: 8, sh_tsuru: 8 } },
  hi_100mile: { from: { nt_nitoryu: 10, nt_5050: 8 } },
  hi_hanabi: { from: { hs_seishun: 10, hs_bunkasai: 6 } },
  hi_yosan_cut: { from: { cr_nemawashi: 8, cr_houkaisei: 6 } },
  hi_fruit_parfait: { from: { fz_juice: 10, fz_tropical: 4 } },
  hi_ooarashi: { from: { ar_senpu: 10, ar_harmony: 6 } },
  hi_airport: { from: { kq_120: 10, kq_doremi: 6 } },
  hi_kimagure_salad: { from: { sc_tetsujin: 10, sc_ajimi: 8 } },
  hi_genba_shacho: { from: { tk_genba: 10, tk_konjou: 6 } },
  hi_4min_manzai: { from: { m1_machinegun: 8, m1_densetsu: 6 } },
  hi_lucifer: { from: { dt_hane: 10, dt_keiyaku: 6 } },
  hi_masenkou: { from: { s2_spark: 10, s2_rush: 6 } },
  hi_shimekiri: { from: { bk_norma: 8, bk_kyujitsu: 10 } },
  hi_enko: { from: { eb_shiranui: 10, eb_noboru: 6 } },
  hi_sogeki: { from: { bo_yamiuchi: 10, bo_codename: 6 } },
  hi_biglight: { from: { dr_smalllight: 10, dr_kuuki: 8 } },
  hi_ninniku_bomber: { from: { kn_punch: 10, kn_ninniku: 6 } },
  hi_kunai_ame: { from: { kh_kunai: 15, kh_bunshin: 6 } },
  hi_juubai_kame: { from: { s3_kame: 6, s3_ryuuken: 6 } },
  hi_manga: { from: { nk_gear5: 6, nk_kaminari: 6 } },
  hi_digital_twin: { from: { fg_mieruka: 8, fg_demand: 6 } },
  hi_enbu: { from: { hn_kasha: 8, hn_sukitooru: 6 } },
  hi_tajuu_rasengan: { from: { hg_oodama: 8, hg_kitsune: 6 } },
  hi_oniwaban_maire: { from: { ab_mineuchi: 8, ab_kao: 6 } },
  hi_tenka_gomen: { from: { ab_hakuba: 8, abarenbo_shogun_sig: 3 } },
  hi_himitsu_pen: { from: { spy_knife: 15, spy_kimitsu: 6 } },
  hi_shoot: { from: { tn_ball: 15, tn_suiri: 6 } },
  hi_dorayaki_wake: { from: { nr_dorayaki: 12, nr_punch: 10 } },
  hi_kyuuri_shuriken: { from: { kp_kyuuri: 12, kp_tsuppari: 10 } },
};
