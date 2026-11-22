// 第98回 K3班: きずなの職業「伝説のPTA会長」（docs/plan-kizuna-jobs.md の 3〈4〉・7。実装メモは おなじ 文書の 10）
//   おにの手のじごく先生（新しい 系統〈ぬ〜べ〜〉の 伝説）＋ 最強のおかん（おかん → 最強のおかん の いちばん 上。その 上は 幻の 宇宙一のおかん だけ）
//   かばう ＋ しかる（敵の 攻撃を 下げる）＋ おべんとう（回復）。守りの かなめ
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: 生徒を 守る〈passive.protect〉・おにの手〈oniHand・oni の しるし・passive.oniMax〉・
//   体をはって守る〈teShield〉・敵を 弱く する〈debuff〉・回復と じわじわ 回復〈heal・regen〉・生き返り〈revive〉。battle-r83b.js と battle.js）
const GHOST = { spirit: 1.5, undead: 1.5, demon: 1.5 };

export const KIZUNA_PTA = {
  job: {
    id: 'pta_kaichou', name: '伝説のPTA会長', kana: 'でんせつのぴーてぃーえーかいちょう', short: 'PTA', tier: 4, req: ['jigoku_sensei', 'saikyo_okan'], family: 'phys', color: '#b8283a',
    desc: '子どもたちを守るためなら、おにの手も出す、伝説のPTA会長。おにの手のじごく先生と最強のおかんをきわめ、守る技としかる技をたくさん使った者だけがなれる。弱った仲間をかばい、敵をしかって弱くし、手作りのお弁当で仲間を元気にする。',
    mods: { hp: 1.9, mp: 2.1, str: 1.8, def: 1.7, agi: 1.1, mag: 1.2, heal: 1.4 },
    weapons: ['staff', 'axe', 'fan', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { hp: 1.5, def: 1, heal: 0.5 },
    // protect … じごく先生と おなじ（HP が 3わり いかの 仲間への 攻撃を 0.8 の 確率で かばう）・oniMax … おにの手の 上限（じごく先生と おなじ 90%）
    passive: { protect: 0.8, oniMax: 0.9 },
    learn: [[1, 'ptk_tate'], [2, 'ptk_shikaru'], [3, 'ptk_genkotsu'], [4, 'ptk_bentou'], [5, 'ptk_onite'], [6, 'ptk_kaminari'], [7, 'ptk_tsuiteru'], [8, 'ptk_kaji'], [10, 'pta_kaichou_sig']],
  },
  phantom: {
    name: '伝説のPTA会長', masters: ['jigoku_sensei', 'saikyo_okan'],
    conds: [{ use: ['kabau'], goal: 500, text: 'かばう・守る技を500回使う' }, { use: ['debuff'], goal: 500, text: '敵を弱くする技（しかるなど）を500回使う' }, { stat: 'heal', goal: 50000, text: '回復量の合計5万' }],
  },
  hint: 'おにの手で生徒を守る先生と、だれも勝てない最強のおかん。2人の道をきわめて守ってしかりつづけた者は、学校じゅうをたばねるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── おにの手のじごく先生から（かばう・おにの手・生き返り）──
    ptk_tate: {
      name: '子どもたちを守るたて', kana: 'こどもたちをまもるたて', kind: 'skill', job: 'pta_kaichou', mp: 12, target: 'allies', role: 'sup',
      effect: { type: 'teShield', take: 0.55 },
      desc: '「子どもたちに、手を出さないで！」次の自分の番まで、仲間全員をかばう。その間、自分の受けるダメージがへる。', cast: '{a}「子どもたちに、手を出さないで！」', anim: 'guard',
    },
    ptk_onite: {
      name: 'PTAのおにの手', kana: 'ぴーてぃーえーのおにのて', kind: 'skill', job: 'pta_kaichou', mp: 3, target: 'self', role: 'sup',
      effect: { type: 'oniHand', max: 0.9 },
      desc: 'おにの手のふういんをとく。自分の番が来るたびに、物理の攻撃のダメージが15%ずつ上がるが、HPが少しずつへる。もう一度使うと、ふういんしなおす。', cast: '{a}は、エプロンのひもをきゅっとしめて、おにの手を出した…！', anim: 'charge',
    },
    ptk_genkotsu: {
      name: 'おにの手・げんこつ', kana: 'おにのてげんこつ', kind: 'skill', job: 'pta_kaichou', mp: 10, target: 'enemy',
      effect: { type: 'phys', mult: 1.15, hits: 2, vsRace: GHOST, oni: true },
      desc: 'おにの手で、ごつんごつんと2回げんこつ。敵1体に2回ダメージ。ゆうれい・アンデッド・悪魔には、とても強い。', cast: '{a}「悪い子には、げんこつです！」', anim: 'r83b_renda',
    },
    ptk_tsuiteru: {
      name: '会長がついてる', kana: 'かいちょうがついてる', kind: 'skill', job: 'pta_kaichou', mp: 20, target: 'deadAlly', role: 'heal',
      effect: { type: 'revive', hpRatio: 0.5 },
      desc: '「会長がついてるよ！」たおれた仲間1人を生き返らせる（HPは半分）。', cast: '{a}「起きなさい！会長がついてるよ！」', anim: 'revive',
    },
    // ── 最強のおかんから（しかる・お弁当・雷・家事）──
    ptk_shikaru: {
      name: '会長のおしかり', kana: 'かいちょうのおしかり', kind: 'skill', job: 'pta_kaichou', mp: 10, target: 'enemies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.85 }, { type: 'debuff', stat: 'mag', mult: 0.8, dur: 40, chance: 0.7 }] },
      desc: '敵全体を、こわい顔でしかる。敵の攻撃力が下がり、魔力も下がることがある。', cast: '{a}「そこにならびなさい！何回言うたらわかるの！」', anim: 'okan_kaminari',
    },
    ptk_bentou: {
      name: '会長の手作り弁当', kana: 'かいちょうのてづくりべんとう', kind: 'skill', job: 'pta_kaichou', mp: 18, target: 'allies', role: 'heal', field: true,
      effect: { type: 'multi', parts: [{ type: 'heal', base: [80, 100], thr: 50 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
      desc: '朝早く起きて作った、手作りのお弁当。仲間全員のHPが回復して、しばらく少しずつ回復する。', cast: '{a}「みんなの分、作ってきたよ！残さず食べるんよ」', anim: 'gohan',
    },
    ptk_kaminari: {
      name: '会長の雷', kana: 'かいちょうのかみなり', kind: 'skill', job: 'pta_kaichou', mp: 16, target: 'enemies',
      effect: { type: 'magic', element: 'bolt', base: [125, 150], thr: 70 },
      desc: '敵全体に、大きな雷を落としてしかる。雷のダメージ。', cast: '{a}の雷が落ちた！「コラーッ！！」', anim: 'okan_kaminari',
    },
    ptk_kaji: {
      name: '行事も家事も全力', kana: 'ぎょうじもかじもぜんりょく', kind: 'skill', job: 'pta_kaichou', mp: 14, target: 'allies', role: 'sup',
      effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 45 },
      desc: '学校の行事も、家の家事も、全力で終わらせる。仲間全員の攻撃力と守備力が上がる。', cast: '{a}は、行事も家事も全力で終わらせた！みんなの体が軽い！', anim: 'buff',
    },
    // ── かけ合わせの 技（看板）: おにの手で しかって（攻撃を 下げる）、みんなの 前に 立って かばい、お弁当で 回復 ──
    pta_kaichou_sig: {
      name: 'おにの手・PTA総出動', kana: 'おにのてぴーてぃーえーそうしゅつどう', kind: 'skill', job: 'pta_kaichou', mp: 40, target: 'enemies', role: 'dmg',
      effect: {
        type: 'multi',
        parts: [
          { type: 'phys', mult: 0.85, hits: 3, random: true, vsRace: { spirit: 2, undead: 2, demon: 2 }, oni: true },
          { type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.85 },
          { type: 'teShield', target: 'self', take: 0.6 },
          { type: 'heal', target: 'allies', base: [70, 90], thr: 45 },
        ],
      },
      desc: 'PTAのみんなと、いっせいに動く。おにの手で、敵にばらばらに3回げんこつをして、攻撃力を下げる（ゆうれい・アンデッド・悪魔には、もっと強い）。次の自分の番まで仲間全員をかばい、お弁当で仲間全員のHPも回復する。',
      cast: '{a}「PTA、総出動！子どもたちは、みんなで守る！」', anim: 'pta_kaichou_sig',
    },
  },
  hira: {
    abilities: {
      hi_pta_bazaar: {
        name: 'バザーの大そうじ', kana: 'ばざーのおおそうじ', kind: 'skill', job: 'pta_kaichou', hirameki: true, mp: 20, target: 'enemies',
        effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.35, dispel: true }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 40, chance: 0.7 }] },
        desc: 'バザーの前の大そうじ。ほうきで敵全体をはたいて、強くなる力を消し、守備力も下げる。', cast: '{a}「バザーの前に、全部きれいにするよ！」', anim: 'kizuna_bazaar',
      },
    },
    conds: { hi_pta_bazaar: { from: { ptk_genkotsu: 10, ptk_shikaru: 6 } } },
  },
  // 子どもを 守る・お弁当の 回復・家の おかん・手作りの お弁当（炎・剣・こぶしの 組は いっぱい なので つけない。いやしの 組の 合体技〈光のシャワー など〉で ボスに 強い。
  //   学校〈school〉は せーのでジャンプの 組が 13職業 まで〈test/dual-r31〉なので つけない）
  tags: ['guard', 'heal', 'home', 'cook'],
  say: '「子どもたちは、わたしが守ります！」',
  trial: 'しかるのも守るのも、子どもを思う心からだ。',
  vehicle: { id: 'pta_sanrinsha', v: { name: 'PTA会長の大三輪車', price: 28500, jobs: ['pta_kaichou'], phantom: true, desc: 'たすきをかけた、大きな三輪の自転車。前のかごにお弁当、うしろに見守りの黄色い旗。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [3.18, 2.12, 2.93],
  work: 'nube',
};
