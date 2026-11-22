// 第98回 K4班: きずなの職業「等価交かんの大魔道士」（docs/plan-kizuna-jobs.md の 3〈7〉・7。実装メモは おなじ 文書の おわり）
//   ドラまた（新しい 系統〈スレイヤーズ〉の 伝説）＋ 真理のとびらをひらく者（れん金術師 → 国家れん金術師 → はがねのれん金術師 → 真理のとびらをひらく者 の いちばん 上）
//   HP を はらって、呪文を 早く ためる（となえて すぐ もう 1回 動ける）。食べて HP を もどす
//   （名前の 字: 「換」は 習わない 字なので「交かん」。家族が きめた 名前の まま、その 字だけ かな）
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: となえる〈r85aChant〉・大砲の 呪文〈r85aBig・r85aPierce〉・定食〈heal ＋ mpHeal〉・
//   HP を けずって すぐ 動く〈社ちくの overtime〉・れん成の とりで〈barrier〉）
//   「とうか交かん」は となえる ＋ overtime の multi（HP を はらうと、となえた その 番に すぐ もう 1回 動けて 大砲が うてる）
const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const KIZUNA_TOUKA = {
  job: {
    id: 'touka_madoushi', name: '等価交かんの大魔道士', kana: 'とうかこうかんのだいまどうし', short: '等価', tier: 4, req: ['doramata', 'truth_gate'], family: 'magic', color: '#c8302a',
    desc: '「何かを得るには、同じだけのものをはらう」。HPをはらって、いちばん強い呪文を一しゅんでとなえる大魔道士。へったHPは、大ぐいの定食でとりもどす。ドラまたと真理のとびらをひらく者をきわめ、攻撃の呪文と補助の技をたくさん使った者だけがなれる。',
    mods: { hp: 1.7, mp: 1.85, str: 1.2, def: 1.5, agi: 1.45, mag: 1.85, heal: 1.45 },
    weapons: ['staff', 'dagger', 'claw', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mag: 1.5, mp: 1, hp: 1 },
    learn: [[1, 'tk_flare'], [2, 'tk_toride'], [3, 'tk_teishoku'], [4, 'tk_touka'], [5, 'tk_yari'], [6, 'tk_zoufuku'], [7, 'tk_meguri'], [8, 'tk_blade'], [10, 'touka_madoushi_sig']],
  },
  phantom: {
    name: '等価交かんの大魔道士', masters: ['doramata', 'truth_gate'],
    conds: [{ use: ['attackSpell'], goal: 500, text: '攻撃の呪文を500回使う' }, { use: ['support'], goal: 500, text: '補助の技を500回使う' }, { stat: 'dmgSpell', goal: 400000, text: '呪文のダメージの合計40万' }],
  },
  hint: 'ドラゴンもまたいで通る魔道士と、真理のとびらをひらいた者。2人の道をきわめた者は、何かをはらって、呪文を一しゅんでとなえられるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── ドラまたから（呪文・大砲・定食・ぞうふく）──
    tk_flare: {
      name: 'フレア・ランス', kana: 'ふれあらんす', kind: 'spell', job: 'touka_madoushi', mp: 14, target: 'enemy',
      effect: { type: 'magic', element: 'fire', base: [170, 196], thr: 85 },
      desc: '炎のやりを放つ。敵1体に炎のダメージ。となえていると、もっと強くなる。', cast: '{a}「フレア・ランス！」', anim: 'r85a_lance',
    },
    // 真理のやいば（1体）は 看板（全体）より 1体あたり 弱い ので、MP を 看板の 半分 いか に した
    //   （test/reach の「おなじ くらいの MP の 技なら 全体の ほうが 1体あたり 弱い」と、看板が いちばん 強い きまりの 両方を みたす）
    tk_blade: {
      name: '真理のやいば', kana: 'しんりのやいば', kind: 'spell', job: 'touka_madoushi', mp: 18, target: 'enemy',
      effect: { type: 'magic', element: 'dark', base: [270, 310], thr: 90, r85aBig: true, r85aPierce: true },
      desc: '先に「とうか交かん」でとなえると使える、闇のやいば。敵1体に、闇の特大のダメージ。敵の守りをむしする。うつと、となえた力は消える。', cast: '{a}「真理のやいばよ…すべてを切りさけ！」', anim: 'r85a_ragna',
    },
    tk_teishoku: {
      name: '大ぐい定食', kana: 'おおぐいていしょく', kind: 'skill', job: 'touka_madoushi', mp: 0, target: 'self', role: 'heal', noAuto: true,
      effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], fixed: true }, { type: 'mpHeal', base: [10, 16] }] },
      desc: '山盛りの定食を、ものすごい速さでたいらげる。はらったHPをとりもどす。自分のHPが大きく、MPも少し回復する。MPはいらない。', cast: '{a}「おばちゃん、全部大盛りで！」', anim: 'r85a_food',
    },
    tk_zoufuku: {
      name: 'ぞうふくのれん成石', kana: 'ぞうふくのれんせいせき', kind: 'skill', job: 'touka_madoushi', mp: 8, target: 'self', role: 'sup',
      effect: { type: 'buff', stat: 'mag', mult: 1.3, dur: 40 },
      desc: 'れん成で作った赤い石を、ぎゅっとにぎる。自分の魔力が大きく上がる。', cast: '{a}は、赤いれん成石をかかげた！', anim: 'r85a_stone',
    },
    // ── 真理のとびらをひらく者から（とうか交かん・とりで・やり・めぐり）──
    tk_touka: {
      name: 'とうか交かん', kana: 'とうかこうかん', kind: 'skill', spellLike: true, job: 'touka_madoushi', mp: 4, target: 'self', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'r85aChant' }, { type: 'overtime', hpCost: 0.15, msg: '{a}は、HPとひきかえに、あっというまにとなえ終わった！' }] },
      desc: '手を合わせて、自分のHPを少しはらう。そのかわりに、一しゅんで呪文をとなえて、すぐにもう一度動ける。となえていると、真理のやいばなどの、いちばん強い呪文がうてる。ふつうの呪文なら強くなる。', cast: '{a}は、両手をパン！と合わせた…「とうか交かん！」', anim: 'r85a_chant',
    },
    tk_toride: {
      name: '光のとりでのれん成', kana: 'ひかりのとりでのれんせい', kind: 'skill', job: 'touka_madoushi', mp: 20, target: 'allies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'barrier', base: [70, 90], thr: 60 }] },
      desc: 'みんなのまわりに、光る石のとりでを一しゅんで作る。仲間全員の守備力が上がり、光のかべがダメージをすいとる。', cast: '{a}「みんな、とりでの中へ！」', anim: 'r33_alchemy_wall',
    },
    tk_yari: {
      name: 'やりの雨のれん成', kana: 'やりのあめのれんせい', kind: 'spell', job: 'touka_madoushi', mp: 18, target: 'enemies',
      effect: { type: 'magic', base: [104, 122], thr: 80 },
      desc: '空の上に、たくさんの石のやりを作って、雨のようにふらせる。敵全体にダメージ。属性がないので、どんな敵にも当たる。', cast: '{a}が両手をパン！と合わせた。空いっぱいに、石のやりが！', anim: 'r33_alchemy_spear',
    },
    tk_meguri: {
      name: 'めぐりのれん成', kana: 'めぐりのれんせい', kind: 'skill', job: 'touka_madoushi', mp: 22, target: 'allies', role: 'heal',
      effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 145], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
      desc: '体の中の流れを、ぐるりとととのえるれん成。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}のれん成の光が、みんなをぐるりとつつむ…', anim: 'heal_ring',
    },
    // ── かけ合わせの 技（看板）: とうか交かんで となえた 力で、真理のとびらを ひらく 大呪文（敵全体）──
    touka_madoushi_sig: {
      name: '真理のとびら・大呪文', kana: 'しんりのとびらだいじゅもん', kind: 'spell', job: 'touka_madoushi', mp: 40, target: 'enemies', role: 'dmg',
      effect: { type: 'magic', element: 'blast', base: [330, 370], thr: 95, r85aBig: true },
      desc: '先に「とうか交かん」でとなえると使える、最後の大呪文。大きなとびらがひらき、赤い大ばくはつが、敵全体に特大のダメージ。うつと、となえた力は消える。', cast: '{a}「とびらの向こうの力…全部、持っていけ！」', anim: 'touka_madoushi_sig',
    },
  },
  hira: {
    abilities: {
      hi_rensei_flare: {
        name: 'れん成フレア', kana: 'れんせいふれあ', kind: 'spell', job: 'touka_madoushi', hirameki: true, mp: 24, target: 'enemies',
        effect: { type: 'magic', element: 'fire', base: [130, 150], thr: 85 },
        desc: '地面に大きなれん成じんをかいて、炎の柱をつぎつぎに立てる。敵全体に炎のダメージ。', cast: '{a}「れん成…フレア！」', anim: 'kizuna_rensei',
      },
    },
    conds: { hi_rensei_flare: { from: { tk_flare: 10, tk_yari: 6 } } },
  },
  tags: ['magic', 'alchemy', 'dark', 'cook'], // 呪文・れん成・闇のやいば・大ぐいの 定食（剣・こぶしの 組は いっぱい〈test/dual-r31〉なので つけない。炎も つけない）
  say: '「はらった分は、食べてとりもどす！」',
  trial: '何かを得るなら、同じだけはらえ。',
  vehicle: { id: 'rensei_gochisou', v: { name: 'れん成ごちそう車', price: 28500, jobs: ['touka_madoushi'], phantom: true, desc: '地面の石をれん成して作った、ごちそうをつんだ車。車りんには、れん成じんが光る。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [1.66, 1.6, 1.95],
  work: 'slayers',
};
