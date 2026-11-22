// 第98回 K1班: きずなの職業 1つめ「熱と風の空調マスター」（docs/plan-kizuna-jobs.md の 3〈8〉・7。実装メモは おなじ 文書の おわり）
//   八竜の炎術士・烈火（新しい 系統〈烈火の炎〉の 伝説）＋ 天才しせつ管理者（会社員 → 設備屋 → ryonetsu → 天才しせつ管理者 の いちばん 上）
//   家族の 仕事（空調・省エネ）から 生まれた 職業。火竜で あたため、冷房で ひやし、かん気で 悪い 状態を ふきとばす。戦いの「温度」を あやつる
//
// きずなの職業は 1つ 1ファイル（この ファイルだけで 職業の データが ぜんぶ そろう。data/kizuna.js の 一覧に 1行 足すと 入る）
//   job       … 職業（jobs.js の JOBS。tier 4・req 2つ ＝ 幻の職業と おなじ 形）
//   phantom   … なり方の 条件（phantom.js の PHANTOM_JOBS。今 ある タグと 数だけ ＝ 引っこしコードは のびない）
//   hint      … 神殿の うわさ（jobs.js の JOB_HINTS。名前・数・物語の 先は 書かない）
//   abilities … 技 9こ（abilities.js の ABILITIES。親の 2つから 4こずつ ＋ Lv10 の かけ合わせの 技〈看板〉）
//   hira      … ひらめき技 1つ（hirameki.js。abilities と じょうけん）
//   tags・say・trial … 合体技の タグ（job-tags.js）・転職の ひとこと（job-talk.js）・試練の 師しょうの ことば（job-trials.js。32字 以内）
//   vehicle   … 幻の 乗り物（vehicles.js。絵は client/render/kizuna-kuuchou.js）
//   trialAdj  … 職業の試練の まぼろしの 強さ（battle-trial.js の PHANTOM_ADJ）
//   work      … まぼろしの回ろうで 数える 作品（新しい 系統の 方。rivals-r88.js の とびら）
// この 職業だけの 新しい 戦いの しくみは 作らない（親の しくみ: 火竜をよぶ〈r85bRyu〉・予兆保全〈passive.foresee〉・補助・回復）
import { RYU_SET } from './abilities-r85b.js?v=a3f1dc027cbc';

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

// 火竜をよぶ・冷暖 で よべる 5ひき（なだれ〈攻め〉・ほむら〈しばる〉・まどか〈けっかい〉・こくう〈青白い 光線〉・れっしん〈生き返り〉。烈火と おなじ メニュー）
//   第98回 K3班: こくう（7の竜。青白い 光線 ＝ 冷ぼうの 色）を 足した。合体技の 組（炎・剣・こぶし）に 入れない ぶん、ボスへの 一げきを 親の 烈火と おなじ 火竜で（docs の 10）
RYU_SET.kuuchou = ['nadare', 'homura', 'madoka', 'kokuu', 'resshin'];

export const KIZUNA_KUUCHOU = {
  job: {
    id: 'kuuchou_master', name: '熱と風の空調マスター', kana: 'ねつとかぜのくうちょうますたー', short: '空調', tier: 4, req: ['rekka', 'facility_genius'], family: 'tech', color: '#e8603a',
    desc: '火竜であたため、冷ぼうでひやし、かん気で悪いものをふきとばす。戦いの温度をあやつる、空調のプロ。八竜の炎術士・烈火と天才しせつ管理者をきわめ、火竜と補助の技をたくさん使った者だけがなれる。',
    // 第98回 K3班: MP 1.85 → 2.1・回復 1.4 → 1.15（合計は 11.45 の まま。ボスで MP が 切れて コーヒーブレイクが 多かった）
    mods: { hp: 1.7, mp: 2.1, str: 1.85, def: 1.5, agi: 1.45, mag: 1.7, heal: 1.15 },
    weapons: ['axe', 'dagger', 'staff', 'claw', 'none'], shield: true, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { hp: 1.5, str: 0.5, mag: 1, heal: 0.5 },
    // foresee … 天才しせつ管理者と おなじ 予兆保全（敵の 大技の ダメージを へらす。battle.js の foreseeCut）
    passive: { foresee: 0.6 },
    versatile: true,
    learn: [[1, 'km_ryu'], [2, 'km_mieruka'], [3, 'km_kiba'], [4, 'km_yochou'], [5, 'km_danbou'], [6, 'km_reibou'], [7, 'km_netpuu'], [8, 'km_kanki'], [10, 'kuuchou_master_sig']],
  },
  phantom: {
    name: '熱と風の空調マスター', masters: ['rekka', 'facility_genius'],
    conds: [{ use: ['karyu'], goal: 300, text: '火竜の技を300回使う' }, { use: ['support'], goal: 800, text: '補助の技を800回使う' }, { stat: 'heal', goal: 50000, text: '回復量の合計5万' }],
  },
  hint: '8ひきの火竜をしたがえる炎術士と、建物のすべてを見守る天才。2人の道をきわめて火竜と補助の技を使いこんだ者は、熱と風をあやつれるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── 烈火から（火竜で あたためる）──
    km_ryu: {
      name: '火竜をよぶ・冷暖', kana: 'かりゅうをよぶれいだん', kind: 'skill', job: 'kuuchou_master', mp: 7, target: 'self', role: 'dmg',
      effect: { type: 'r85bRyu', set: 'kuuchou', pow: 1.15 },
      desc: '火竜を1ぴきよび出す。なだれ・ほむら・まどか・こくう・れっしんの5ひきから、自分で選ぶ。火竜ごとに、やくめとMPがちがう。', cast: '{a}の右うでで、竜の印が赤くかがやいた…！', anim: 'r85b_call',
    },
    km_kiba: {
      name: '火竜の熱風きば', kana: 'かりゅうのねっぷうきば', kind: 'skill', job: 'kuuchou_master', mp: 10, target: 'enemy',
      effect: { type: 'phys', mult: 3.4, element: 'fire' },
      desc: '火竜のきばに、こうおんの熱風をのせて、敵1体にかみつく。炎の大きなダメージ。', cast: '{a}の火竜の熱風きば！', anim: 'r85b_kiba',
    },
    km_danbou: {
      name: '火竜の暖ぼう', kana: 'かりゅうのだんぼう', kind: 'skill', job: 'kuuchou_master', mp: 14, target: 'allies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.3, dur: 45 }, { type: 'heal', base: [55, 70], thr: 40 }] },
      desc: '火竜のぬくい炎で、仲間全員の体をぽかぽかにする。攻撃力が上がり、HPも少し回復する。', cast: '{a}「体があたたまれば、力も出ます」', anim: 'r85b_kaina',
    },
    km_netpuu: {
      name: '熱風の大れんぱつ', kana: 'ねっぷうのだいれんぱつ', kind: 'skill', job: 'kuuchou_master', mp: 18, target: 'enemies',
      effect: { type: 'phys', mult: 0.56, hits: 6, random: true, element: 'fire' },
      desc: '火竜のはく熱風のかたまりを、つぎつぎにうち出して、敵に、ばらばらに6回当てる。炎のダメージ。', cast: '{a}は、火竜に熱風をつぎつぎとはかせた！', anim: 'r85b_hanabi',
    },
    // ── 天才しせつ管理者から（ひやす・守る・かん気）──
    km_mieruka: {
      name: '温度の見える化', kana: 'おんどのみえるか', kind: 'skill', job: 'kuuchou_master', mp: 4, target: 'enemies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'scan' }, { type: 'debuff', stat: 'def', mult: 0.85, dur: 30, chance: 0.7 }] },
      desc: '敵全体の温度を、センサーで見える化する。弱点と効かない属性がすべてわかり（図鑑にものこる）、守備力も下げる。', cast: '{a}は、敵の温度を見える化した！', anim: 'mieruka',
    },
    km_yochou: {
      name: '予兆保全・冷暖', kana: 'よちょうほぜんれいだん', kind: 'skill', job: 'kuuchou_master', mp: 16, target: 'allies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
      desc: 'こわれる前に、すべて手を打つ。仲間全員の守備力が上がり、HPがしばらく少しずつ回復する。', cast: '{a}は、予兆をひとつものがさない！', anim: 'yochou_shield',
    },
    km_reibou: {
      name: '冷ぼう全開', kana: 'れいぼうぜんかい', kind: 'skill', job: 'kuuchou_master', mp: 22, target: 'enemies',
      effect: { type: 'magic', element: 'ice', base: [190, 225], thr: 90 },
      desc: '大きな空調を全開にして、冷たい風で敵全体をこおらせる。氷の大きなダメージ。', cast: '{a}は、冷ぼうを全開にした！', anim: 'aircon',
    },
    km_kanki: {
      name: '大かん気', kana: 'だいかんき', kind: 'skill', job: 'kuuchou_master', mp: 20, target: 'allies', role: 'heal', field: true,
      effect: { type: 'multi', parts: [{ type: 'cure', statuses: STATUS_ALL }, { type: 'heal', base: [115, 140], thr: 60 }] },
      desc: '大きな風で空気を一気に入れかえる。仲間全員の悪いじょうたいをふきとばして治し、HPも大きく回復する。', cast: '{a}は、大かん気で空気を一気に入れかえた！さわやかな風がふく！', anim: 'heal_dance',
    },
    // ── かけ合わせの 技（看板）: 火竜で あたため → 冷ぼうで ひやす（温度差）→ かん気の 風で 仲間の 悪い じょうたいを ふきとばす ──
    kuuchou_master_sig: {
      name: '熱と風の全館運転', kana: 'ねつとかぜのぜんかんうんてん', kind: 'skill', job: 'kuuchou_master', mp: 40, target: 'enemies', role: 'dmg',
      effect: {
        type: 'multi',
        parts: [
          { type: 'phys', mult: 1.75, element: 'fire' },
          { type: 'magic', element: 'ice', base: [200, 235], thr: 95 },
          { type: 'cure', target: 'allies', statuses: STATUS_ALL },
        ],
      },
      desc: '火竜の熱風で敵全体をあたため、すぐに冷ぼうの風でひやす。炎と氷の、2つの大きなダメージ。最後に、かん気の風で仲間全員の悪いじょうたいをふきとばす。', cast: '{a}「全館、運転開始！」火竜と空調が、いっせいに動き出した！', anim: 'kuuchou_master_sig',
    },
  },
  hira: {
    abilities: {
      hi_ondosa: {
        name: '温度差の一げき', kana: 'おんどさのいちげき', kind: 'skill', job: 'kuuchou_master', hirameki: true, mp: 20, target: 'enemy',
        effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.0, element: 'fire' }, { type: 'magic', element: 'ice', base: [150, 175], thr: 85 }] },
        desc: 'あつい熱風と、つめたい冷ぼうを、続けて敵1体にぶつける。炎と氷の、2つのダメージ。', cast: '{a}は、あつい風とつめたい風を、続けてぶつけた！', anim: 'kizuna_ondo',
      },
    },
    conds: { hi_ondosa: { from: { km_kiba: 10, km_reibou: 6 } } },
  },
  // 冷ぼう・空調の 機械・お仕事・建物を 守る（予兆保全）。炎の 組は 職業 20 まで〈test/jobs-r27 の 日輪〉なので つけない
  //   第98回 K3班: いやし（heal）→ 守り（guard）。いやしの 組の 合体技（光のシャワー など）より、自分の 火竜・きばの 方が ボスに きく（docs の 10）
  tags: ['ice', 'machine', 'work', 'guard'],
  say: '「温度も風も、まかせてください！」',
  trial: '熱も風も、人のためにあやつるものだ。',
  vehicle: { id: 'netsukikyu', v: { name: '火竜の熱気球', price: 27000, jobs: ['kuuchou_master'], phantom: true, desc: '小さな火竜が、ふくろの中に熱い風をおくる熱気球。空のうえは、いつもちょうどよい温度。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [0.75, 0.78, 1.55],
  work: 'rekka',
};
