// 第98回 K4班: きずなの職業「元ヤンのけいじ」（docs/plan-kizuna-jobs.md の 3〈5〉・7。実装メモは おなじ 文書の おわり）
//   魔界の王の子（新しい 系統〈幽☆遊☆白書〉の 伝説）＋ トリプルフェイス（地方公務員・戦士 → 警察官 → 公安ゼロ → トリプルフェイス の いちばん 上）
//   れい丸を 当てた 敵を「たいほ」（動きを 止める）。弾が 少ないほど 強い 一発
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: れい丸〈battle-r84a.js。reiMax で 6発〉・とう気〈r84aCharge〉・
//   動きを 止める〈atbSet・マヒ〉・調べて 弱らせる〈scan・debuff〉）
//   「弾が 少ないほど 強い」だけ、れい丸の 技の データに low を 1つ 足した（battle-r84a.js の r84aPhys。どの れい丸の 技でも 書けば 使える）
const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const KIZUNA_KEIJI = {
  job: {
    id: 'motoyan_keiji', name: '元ヤンのけいじ', kana: 'もとやんのけいじ', short: '元ヤン', tier: 4, req: ['makai_prince', 'triple_face'], family: 'phys', color: '#3a4ab8',
    desc: '昔はけんかばかりしていたけれど、今は町を守るけいじ。れい丸を当てた敵に、てじょうをかけて動けなくする。れい丸は1回の戦いで6発。のこりが少ないほど、強い一発になる。魔界の王の子とトリプルフェイスをきわめ、素手の技と、敵を弱くする技をたくさん使った者だけがなれる。',
    mods: { hp: 1.9, mp: 1.45, str: 2.0, def: 1.55, agi: 1.85, mag: 0.95, heal: 1.2 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: false,
    perLv: { str: 1.5, agi: 1, hp: 1 },
    // reiMax … 戦い 1回の れい丸の 数（battle-r84a.js の reiMax が 見る。魔界の王の子と おなじ 6発。幻だからと ふやさない）
    reiMax: 6,
    learn: [[1, 'ky_reigan'], [2, 'ky_jab'], [3, 'ky_kikikomi'], [4, 'ky_harikomi'], [5, 'ky_kakuho'], [6, 'ky_siren'], [7, 'ky_katsudon'], [8, 'ky_kiai'], [10, 'motoyan_keiji_sig']],
  },
  phantom: {
    name: '元ヤンのけいじ', masters: ['makai_prince', 'triple_face'],
    conds: [{ use: ['fist'], goal: 500, text: '素手の技を500回使う' }, { use: ['debuff'], goal: 300, text: '敵を弱くする技を300回使う' }, { stat: 'big5000', goal: 50, text: '1回で5000以上のダメージを50回あたえる' }],
  },
  hint: '魔界の血に目ざめたけんか屋と、3つの顔をもつ警察官。2人の道をきわめた者は、れい丸でてじょうをかけられるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── 魔界の王の子から（れい丸・とう気・けんか）──
    ky_reigan: {
      name: 'けいじのれい丸', kana: 'けいじのれいがん', kind: 'skill', job: 'motoyan_keiji', mp: 10, target: 'enemy', role: 'dmg',
      effect: { type: 'phys', mult: 4.4, rei: { use: 1 } },
      desc: '指先に力を集めて、青い光の玉をうつ。れい丸を1発使う。敵1体にとても大きなダメージ。', cast: '{a}「止まれ！…止まらねえなら、くらえ！」', anim: 'r84a_reigan',
    },
    ky_harikomi: {
      name: 'ねばりの張りこみ', kana: 'ねばりのはりこみ', kind: 'skill', job: 'motoyan_keiji', mp: 18, target: 'self', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'r84aCharge', add: 2 }, { type: 'heal', base: [110, 140], thr: 60 }] },
      desc: 'あんパンをかじりながら、じっと張りこんで、れい力をためる。れい丸が2発もどって、HPも回復する。', cast: '{a}は、あんパンをかじりながら、じっと張りこんだ…', anim: 'r84a_charge',
    },
    ky_siren: {
      name: 'れい丸・サイレン', kana: 'れいがんさいれん', kind: 'skill', job: 'motoyan_keiji', mp: 20, target: 'enemies', role: 'dmg',
      effect: { type: 'phys', mult: 2.3, rei: { use: 2 } },
      desc: 'れい丸を空中ではじけさせて、サイレンのように光るつぶを、ふらせる。れい丸を2発使う。敵全体に大ダメージ。', cast: '{a}「ウーーーッ！れい丸・サイレン！」', anim: 'r84a_shotgun',
    },
    ky_kiai: {
      name: '元ばんちょうの気合い', kana: 'もとばんちょうのきあい', kind: 'skill', job: 'motoyan_keiji', mp: 14, target: 'self', role: 'sup',
      effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 45 },
      desc: '昔のけんかの気合いを、今は町を守るために使う。自分の攻撃力・守備力・素早さが大きく上がる。', cast: '{a}「へっ、なつかしいぜ…この感じ！」', anim: 'r84a_aura',
    },
    // ── トリプルフェイスから（ボクシング・調べる・かくほ・差し入れ）──
    ky_jab: {
      name: 'げんこつジャブ', kana: 'げんこつじゃぶ', kind: 'skill', job: 'motoyan_keiji', mp: 10, target: 'enemy',
      effect: { type: 'phys', mult: 0.8, hits: 4, critBonus: 0.1 },
      desc: 'けんかできたえたげんこつで、目にもとまらないジャブ。敵1体に4回ダメージ。会心も出やすい。', cast: '{a}の、げんこつジャブ！', anim: 'r66e1_jab',
    },
    ky_kikikomi: {
      name: '聞きこみ調査', kana: 'ききこみちょうさ', kind: 'skill', job: 'motoyan_keiji', mp: 14, target: 'enemies', role: 'sup',
      effect: {
        type: 'multi',
        parts: [
          { type: 'scan' },
          { type: 'debuff', stat: 'def', mult: 0.75, dur: 45, chance: 0.85 },
          { type: 'debuff', stat: 'atk', mult: 0.85, dur: 45, chance: 0.8 },
        ],
      },
      desc: '町じゅうを歩いて、聞きこみをする。敵全体の弱点がわかり、守備力と攻撃力も下がる。', cast: '{a}「ちょっと、話を聞かせてもらおうか」', anim: 'r66e1_disguise',
    },
    ky_kakuho: {
      name: 'かくほのタックル', kana: 'かくほのたっくる', kind: 'skill', job: 'motoyan_keiji', mp: 9, target: 'enemy',
      effect: { type: 'phys', mult: 2.0, status: { status: 'paralyze', chance: 0.35, turns: [1, 1] } },
      desc: 'すばやく体当たりして、敵1体をおさえこむ。時々、しびれて動けなくなる。', cast: '{a}「かくほだ！」', anim: 'hit',
    },
    ky_katsudon: {
      name: 'カツどんの差し入れ', kana: 'かつどんのさしいれ', kind: 'skill', job: 'motoyan_keiji', mp: 20, target: 'allies', role: 'heal',
      effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 55 }, { type: 'cure', statuses: STATUS_ALL }] },
      desc: 'あつあつのカツどんを、みんなにくばる。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「まあ食え。話はそれからだ」', anim: 'heal2',
    },
    // ── かけ合わせの 技（看板）: れい丸を 当てて、てじょうを かける（動きを 止める）。のこりが 少ないほど 強い 一発 ──
    motoyan_keiji_sig: {
      name: '最後の一発・たいほれい丸', kana: 'さいごのいっぱつたいほれいがん', kind: 'skill', job: 'motoyan_keiji', mp: 34, target: 'enemy', role: 'dmg',
      effect: {
        type: 'multi',
        parts: [
          // low … のこりの れい丸が 少ないほど 強い（まんたんで ×1・のこり 1発で ×（1＋low）。battle-r84a.js の r84aPhys）
          { type: 'phys', mult: 5.0, ignoreDef: 0.3, rei: { use: 1, low: 0.8 } },
          { type: 'atbSet', sub: 70, chance: 0.9, msg: '{t}に、れい丸のてじょうがかかった！動けない！', failMsg: '{t}は、てじょうをふりほどいた！' },
          { type: 'status', status: 'paralyze', chance: 0.3, turns: [1, 1] },
        ],
      },
      desc: 'れい丸を1発使う。光の玉が当たると、そのままてじょうになって、敵1体の動きを止める。のこりのれい丸が少ないほど強い。守りが固い敵にも強い。', cast: '{a}「これで最後だ…たいほだ！」', anim: 'motoyan_keiji_sig',
    },
  },
  hira: {
    abilities: {
      hi_seoi: {
        name: 'たいほじゅつのせおいなげ', kana: 'たいほじゅつのせおいなげ', kind: 'skill', job: 'motoyan_keiji', hirameki: true, mp: 20, target: 'enemy',
        effect: { type: 'multi', parts: [{ type: 'phys', mult: 3.4, ignoreDef: 0.2 }, { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、目を回して動けない！', failMsg: '{t}は、すぐに起き上がった！' }] },
        desc: '警察でならった、たいほじゅつ。敵1体をせおって、地面にたたきつける。ときどき敵が動けなくなる。', cast: '{a}「どりゃあっ！」', anim: 'kizuna_seoi',
      },
    },
    conds: { hi_seoi: { from: { ky_jab: 10, ky_kakuho: 6 } } },
  },
  tags: ['fist', 'guard', 'dark', 'work'], // ボクシングと けんかの こぶし・町を 守る・魔界の 血〈闇〉・けいじの お仕事（剣かこぶしの 組は 職業の 3分の1 まで〈test/dual-r31〉。K4班は この 職業だけ fist）
  say: '「昔はワルでも、今は町の味方だ！」',
  trial: '力は、守るためにふるえ。',
  vehicle: { id: 'patolamp_bird', v: { name: 'パトランプのれい界鳥', price: 27500, jobs: ['motoyan_keiji'], phantom: true, desc: '頭に赤いパトランプをつけた、青いれい界の鳥。「ぷう！」と鳴くと、サイレンが鳴る。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [1.2, 1.2, 1.4],
  work: 'yuhaku',
};
