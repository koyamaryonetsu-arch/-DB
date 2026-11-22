// 第98回 K1班: きずなの職業 2つめ「八竜の火影」（docs/plan-kizuna-jobs.md の 7。実装メモは おなじ 文書の おわり）
//   八竜の炎術士・烈火（新しい 系統〈烈火の炎〉の 伝説）＋ 七代目火影（忍者 → 木の葉の忍び → 七代目火影 の いちばん 上）
//   分身が 1人ずつ 火竜を つれて 出る（数で おす 火竜の れんだ）・仲間が たおれると 強く なる「火の意志」
//   （日の火影〈日の呼吸の使い手 ＋ 七代目火影〉とは べつ。こちらは 火竜と 忍びの 道具箱）
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: 火竜をよぶ〈r85bRyu〉・姫を守る忍び〈r85bHime〉・影分身〈clones・dance。battle-phantom-a.js〉）
//   火の意志（will）だけ、海賊王の 仲間の 力（crew）と おなじ 所に 1つ 足した（たおれた 仲間 1人ごとに 威力 ＋。battle-phantom-a.js）
import { RYU_SET } from './abilities-r85b.js?v=7362a49921c1';

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

// 火竜をよぶ・火影 で よべる 4ひき（さいは〈1体〉・なだれ〈全体〉・せつな〈目つぶし〉・れっしん〈生き返り〉）
RYU_SET.hokage = ['saiha', 'nadare', 'setsuna', 'resshin'];

export const KIZUNA_HOKAGE = {
  job: {
    id: 'hachiryu_hokage', name: '八竜の火影', kana: 'はちりゅうのほかげ', short: '竜火影', tier: 4, req: ['rekka', 'hokage'], family: 'tech', color: '#c8281c',
    desc: '影分身の1人1人が、火竜を1ぴきずつ、つれて戦う、火の里の長。八竜の炎術士・烈火と七代目火影をきわめ、火竜と忍術をたくさん使った者だけがなれる。仲間がたおれるほど、火の意志が強くなる。',
    mods: { hp: 1.9, mp: 1.7, str: 2.0, def: 1.5, agi: 1.85, mag: 1.0, heal: 1.05 },
    weapons: ['dagger', 'claw', 'boomerang', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { hp: 1.5, str: 1, agi: 1 },
    learn: [[1, 'hh_bunshin'], [2, 'hh_ryu'], [3, 'hh_rasen'], [4, 'hh_hime'], [5, 'hh_rendan'], [6, 'hh_mamori'], [7, 'hh_hanabi'], [8, 'hh_ishi'], [10, 'hachiryu_hokage_sig']],
  },
  phantom: {
    name: '八竜の火影', masters: ['rekka', 'hokage'],
    conds: [{ use: ['karyu'], goal: 300, text: '火竜の技を300回使う' }, { use: ['ninjutsu'], goal: 300, text: '忍術を300回使う' }, { stat: 'dmgFire', goal: 200000, text: '炎のダメージの合計20万' }],
  },
  hint: '8ひきの火竜をしたがえる炎術士と、木の葉の里の長。2人の道をきわめた者は、影分身の1人1人に火竜をつれて戦えるらしい…',

  abilities: {
    // ── 七代目火影から（影分身・らせん丸・守り・火の意志）──
    hh_bunshin: {
      name: '影分身・八竜', kana: 'かげぶんしんはちりゅう', kind: 'skill', job: 'hachiryu_hokage', mp: 14, target: 'self', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.4, dur: 45 }, { type: 'clones', n: 4, uses: 3 }] },
      desc: '影分身を4人出して、1人に1ぴきずつ火竜をつれさせる。自分の攻撃力と素早さが上がる。分身は「分身」の技を3回使うまで、いっしょに戦う。', cast: '{a}「影分身の術！火竜たち、1人に1ぴきずつだ！」', anim: 'hokage_sig',
    },
    hh_rasen: {
      name: '火竜らせん丸', kana: 'かりゅうらせんがん', kind: 'skill', job: 'hachiryu_hokage', mp: 14, target: 'enemy',
      effect: { type: 'phys', mult: 3.6, element: 'fire' },
      desc: '火竜の炎をらせん丸にとじこめて、敵1体にたたきこむ。炎の大きなダメージ。', cast: '{a}「火竜らせん丸！」手の中で、炎がうずをまく！', anim: 'void',
    },
    hh_mamori: {
      name: '里をつつむ炎の守り', kana: 'さとをつつむほのおのまもり', kind: 'skill', job: 'hachiryu_hokage', mp: 18, target: 'allies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
      desc: 'ぽかぽかの炎で、里のみんなをつつむ。仲間全員の守備力が上がり、HPがしばらく少しずつ回復する。', cast: '{a}「みんなは、おれと火竜が守る！」', anim: 'guard',
    },
    hh_ishi: {
      name: '火の意志・八竜', kana: 'ひのいしはちりゅう', kind: 'skill', job: 'hachiryu_hokage', mp: 20, target: 'allies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.35, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'mpHeal', base: [3, 5] }] },
      desc: '受けつがれる火の意志で、仲間全員の攻撃力を上げて、悪いじょうたいを治す。MPも少し回復する。', cast: '{a}「仲間の思いは、全部おれがせおっていく！」', anim: 'warcry',
    },
    // ── 烈火から（火竜・守る 忍び・花火）──
    hh_ryu: {
      name: '火竜をよぶ・火影', kana: 'かりゅうをよぶほかげ', kind: 'skill', job: 'hachiryu_hokage', mp: 7, target: 'self', role: 'dmg',
      effect: { type: 'r85bRyu', set: 'hokage', pow: 1.15 },
      desc: '火竜を1ぴきよび出す。さいは・なだれ・せつな・れっしんの4ひきから、自分で選ぶ。火竜ごとに、やくめとMPがちがう。', cast: '{a}の右うでに、竜の印がうかび上がった…！', anim: 'r85b_call',
    },
    hh_hime: {
      name: '里を守る忍び', kana: 'さとをまもるしのび', kind: 'skill', job: 'hachiryu_hokage', mp: 8, target: 'ally', role: 'sup',
      effect: { type: 'r85bHime', def: 1.4 },
      desc: '「おれが守る！」と、仲間1人のまえに立つ。その仲間への攻撃をかばい、自分の守備力も上がる。', cast: '{a}「下がってろ、里の仲間はおれが守る！」', anim: 'r85b_hime',
    },
    hh_rendan: {
      name: '分身・火竜れんだ', kana: 'ぶんしんかりゅうれんだ', kind: 'skill', job: 'hachiryu_hokage', mp: 16, target: 'enemy',
      effect: { type: 'phys', mult: 0.85, hits: 3, element: 'fire', dance: 1, will: 0.25 },
      desc: '火竜といっしょに、敵1体に炎のこぶしを3回。影分身がいると、分身1人ごとに1回ふえる。たおれた仲間がいると、1人ごとに強くなる。炎のダメージ。', cast: '{a}と火竜の、れんだ！', anim: 'kizuna_rendan',
    },
    hh_hanabi: {
      name: '花火手裏剣・大れんぱつ', kana: 'はなびしゅりけんだいれんぱつ', kind: 'skill', job: 'hachiryu_hokage', mp: 20, target: 'enemies',
      effect: { type: 'phys', mult: 0.56, hits: 6, random: true, element: 'fire' },
      desc: '火のついた手裏剣を、花火のようにつぎつぎ投げて、敵に、ばらばらに6回当てる。炎のダメージ。', cast: '{a}「たまや〜！」火の手裏剣が、空いっぱいにさいた！', anim: 'r85b_hanabi',
    },
    // ── かけ合わせの 技（看板）: 分身を 6人 出して 1人ずつ 火竜を つれて いっせいに。たおれた 仲間が いれば 火の意志で 強く ──
    hachiryu_hokage_sig: {
      name: '八竜影分身の術', kana: 'はちりゅうかげぶんしんのじゅつ', kind: 'skill', job: 'hachiryu_hokage', mp: 42, target: 'enemies', role: 'dmg',
      effect: { type: 'phys', mult: 0.6, hits: 3, random: true, element: 'fire', dance: 1, make: 6, consume: true, will: 0.25 },
      desc: '影分身を6人いじょう出して、1人1ぴきずつ火竜をつれて、いっせいにかかる。自分は3回、分身は1人1回ずつ、敵にランダムで火竜の炎をあびせる（分身は終わると消える）。たおれた仲間がいると、1人ごとに強くなる。炎のダメージ。', cast: '{a}「八竜影分身の術！」分身の1人1人に、火竜がよりそった…！', anim: 'hachiryu_hokage_sig',
    },
  },
  hira: {
    abilities: {
      hi_ryushuriken: {
        name: '火竜らせん手裏剣', kana: 'かりゅうらせんしゅりけん', kind: 'skill', job: 'hachiryu_hokage', hirameki: true, mp: 24, target: 'enemies',
        effect: { type: 'phys', mult: 1.6, element: 'fire', will: 0.25 },
        desc: '火竜の炎をまとった、大きならせん手裏剣を投げて、敵全体を切りさく。たおれた仲間がいると、1人ごとに強くなる。炎のダメージ。', cast: '{a}「火竜らせん手裏剣！」', anim: 'kizuna_rendan',
      },
    },
    conds: { hi_ryushuriken: { from: { hh_rasen: 10, hh_rendan: 6 } } },
  },
  tags: ['fist', 'shinobi', 'master', 'guard'], // 火竜の こぶし・忍び・2つの 道を きわめた 里の長・里を守る（炎の 組は 職業 20 まで〈test/jobs-r27〉なので つけない。剣かこぶしの 組は 職業の 3分の1 まで〈test/dual-r31〉: 205職業で 68。この 職業で 68/68）
  say: '「火竜も分身も、全部仲間だ！行くぞ！」',
  trial: 'たおれた仲間の思いも、火にして進め。',
  vehicle: { id: 'kagebunshin_ryu', v: { name: '火影の大火竜', price: 28000, jobs: ['hachiryu_hokage'], phantom: true, desc: '黒い体に、白い炎のもようの大きな火竜。うしろに、分身の小さな火竜たちがついてくる。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [1.31, 1.21, 1.47],
  work: 'rekka',
};
