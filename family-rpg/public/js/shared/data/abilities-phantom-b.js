// 第51回 C2: 幻の職業（tier 4）の 技: 名探てい王・銀河の女王・大魔導王・天下むそうの剣聖（docs/plan-r51-phantom.md）
// 職業は jobs-phantom-b.js。えんしゅつは o8（shared/data/ax-time-o8.js・client/render/axfx-o8.js）。anim は ox_〜（大技の 表と おなじ 名前）
// きまりは abilities-jobs10.js・abilities-r41b.js と おなじ
//  ・1つの 職業に 8つ（Lv1〜10）。Lv10 の 技（<職業の id>_sig）が いちばん MPを 使う
//  ・もとの 伝説の 職業の 技より 1〜2わり 強い。みんなに かける 補助は 1.4倍・いくつもの 強さは 1.35倍まで
// 新しい こうか（shared/battle-r51b.js）
//  ・yomi（先読み）… 敵の 次の 行動を 読む。読まれた 敵が 動こうと すると、その 行動を つぶして 名探てい王が 反撃（mult … 反撃の 強さ、chance … つぶせる わりあい。ボスは 半分）
//  ・barrier（バリア）… 仲間に ダメージを すいとる 星くずの まく（base・thr … 回復と おなじ 式で 何ダメージ ぶん）
//  ・twinCast（二重呪文）… つぎの 攻撃の 呪文が n回 まで もう1度 出る（mult … 2回目の 強さ）
//  ・kenki（剣気）… 天下むそうの剣聖の 剣気（会心の だん）を add だん 上げる
//  ・phys の critScale … 剣気 1だんに つき、さらに この わりあい 強く なる

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const PHANTOM_ABILITIES_B = {
  // ───────────── 名探てい王（名探てい＋おしり探てい） ─────────────
  tk_suiri: {
    name: '王の推理', kana: 'おうのすいり', kind: 'skill', job: 'detective_king', mp: 10, target: 'enemy',
    effect: { type: 'deduce', base: [140, 165], thr: 75 },
    desc: 'どんな小さな手がかりも見のがさない、王の推理。敵1体の弱点を見ぬいて、その属性で大きなダメージ（弱点がなければ、ふつうの攻撃）。', cast: '{a}「…なるほど、そういうことか」', anim: 'ox_tk_suiri',
  },
  tk_yomi: {
    name: '先読みの推理', kana: 'さきよみのすいり', kind: 'skill', job: 'detective_king', mp: 14, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'deduce', base: [80, 95], thr: 65 }, { type: 'yomi', mult: 2.6 }] },
    desc: '敵1体の弱点をついて、次の行動を先に読む。読まれた敵が動こうとすると、その行動をつぶして反撃する（ボスは、つぶせないこともある）。', cast: '{a}「次にきみがすることは…もう分かっている」', anim: 'ox_tk_yomi',
  },
  tk_megane: {
    name: '王の虫めがね', kana: 'おうのむしめがね', kind: 'skill', job: 'detective_king', mp: 12, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'scan' }, { type: 'debuff', stat: 'def', mult: 0.7, dur: 40, chance: 0.9 }] },
    desc: '金の虫めがねで、敵全体をすみずみまで調べる。弱点と効かない属性が全部分かり、守備力も下がる。', cast: '{a}は、金の虫めがねをのぞきこんだ…', anim: 'ox_tk_megane',
  },
  tk_trick: {
    name: 'トリックを見やぶる', kana: 'とりっくをみやぶる', kind: 'skill', job: 'detective_king', mp: 16, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [110, 130], thr: 70 }, { type: 'dispel' }] },
    desc: '敵のしかけたトリックを、すべて見やぶる。敵全体に光のダメージ。強くなっていた力も消す。', cast: '{a}「そのトリック、見やぶったよ！」', anim: 'ox_tk_trick',
  },
  tk_alibi: {
    name: 'アリバイくずし', kana: 'ありばいくずし', kind: 'skill', job: 'detective_king', mp: 22, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.85 }, { type: 'yomi', mult: 1.8, chance: 0.6 }] },
    desc: '敵全体のアリバイを、1つずつくずしていく。攻撃力が下がり、次の行動も読まれる。読まれた敵が動こうとすると、つぶして反撃する。', cast: '{a}「アリバイは、もうくずれているよ」', anim: 'ox_tk_alibi',
  },
  tk_shoot: {
    name: '王のスーパーシュート', kana: 'おうのすーぱーしゅーと', kind: 'skill', job: 'detective_king', mp: 16, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'blast', base: [165, 190], thr: 80 }, { type: 'atbSet', sub: 45, chance: 0.5, msg: '{t}は、目を回している！', failMsg: '{t}は、ふみとどまった！' }] },
    desc: '推理の力をこめたボールを、思いきりけりこむ。敵1体に大ダメージ。目を回して止まることもある。', cast: '{a}は、光るボールを高くけり上げた！', anim: 'ox_tk_shoot',
  },
  tk_show: {
    name: '推理ショーのはじまり', kana: 'すいりしょーのはじまり', kind: 'skill', job: 'detective_king', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag', 'agi'], mult: 1.35, dur: 45 },
    desc: 'さあ、推理ショーのはじまりだ。仲間全員の攻撃力と魔力と素早さが上がる。', cast: '{a}「みなさん、お集まりいただけましたね」', anim: 'ox_tk_show',
  },
  detective_king_sig: {
    name: '真実を見ぬく王の目', kana: 'しんじつをみぬくおうのめ', kind: 'skill', job: 'detective_king', mp: 46, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'deduce', base: [235, 270], thr: 95 }, { type: 'yomi', mult: 2.2, chance: 0.7 }] },
    desc: 'すべてのなぞを見とおす、名探てい王の最強の技。敵全体それぞれの弱点で大ダメージ。そのうえ次の行動まで読み、動こうとした敵をつぶして反撃する。', cast: '{a}「真実は、この目がすべて見ぬいた！」', anim: 'ox_detective_king_sig',
  },

  // ───────────── 銀河の女王（ネオ・クイーン・セレニティ＋第5のせいれい。男の子は 銀河の王） ─────────────
  gq_hoshi: {
    name: '銀河の星くず', kana: 'ぎんがのほしくず', kind: 'spell', job: 'galaxy_queen', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [140, 165], thr: 70 },
    desc: '銀河の星くずを1つにまとめて、まっすぐはなつ。敵1体に光の大ダメージ。', cast: '{a}の手のひらに、銀河の星くずが集まった！', anim: 'ox_gq_hoshi',
  },
  gq_iyashi: {
    name: '銀河のいやし', kana: 'ぎんがのいやし', kind: 'spell', job: 'galaxy_queen', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [165, 195], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'やさしい銀河の光が、仲間みんなをつつむ。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}「星の光よ、みんなをいやして」', anim: 'ox_gq_iyashi',
  },
  gq_barrier: {
    name: '星くずのバリア', kana: 'ほしくずのばりあ', kind: 'spell', job: 'galaxy_queen', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 45 }, { type: 'barrier', base: [80, 100], thr: 60 }] },
    desc: '星くずのまくで、仲間全員をつつむ。守備力が上がり、バリアがダメージをすいとってくれる。', cast: '{a}のまわりに、星くずのバリアがひろがった！', anim: 'ox_gq_barrier',
  },
  gq_nagare: {
    name: '流れ星のシャワー', kana: 'ながれぼしのしゃわー', kind: 'spell', job: 'galaxy_queen', mp: 22, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [120, 140], thr: 75 }, { type: 'heal', target: 'allies', base: [50, 65], thr: 40 }] },
    desc: 'たくさんの流れ星を、敵の上にふらせる。敵全体に光のダメージ。こぼれた光で、仲間全員のHPも少し回復する。', cast: '{a}が空を指さすと、流れ星がふりそそいだ！', anim: 'ox_gq_nagare',
  },
  gq_fukkatsu: {
    name: 'よみがえりの星', kana: 'よみがえりのほし', kind: 'spell', job: 'galaxy_queen', mp: 26, target: 'deadAlly', role: 'heal',
    effect: { type: 'revive', hpRatio: 1 },
    desc: '生まれたばかりの星の光を、ひとりにそそぐ。たおれた仲間1人を、元気いっぱいに生き返らせる。', cast: '{a}は、小さな星を両手でつつんだ…', anim: 'ox_gq_fukkatsu',
  },
  gq_amanogawa: {
    name: '天の川のゆりかご', kana: 'あまのがわのゆりかご', kind: 'spell', job: 'galaxy_queen', mp: 32, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [190, 225], thr: 75 }, { type: 'barrier', base: [90, 110], thr: 60 }] },
    desc: '天の川が、ゆりかごのように仲間をだきしめる。仲間全員のHPを大きく回復して、ダメージをすいとるバリアではる。', cast: '{a}「天の川よ、みんなをやさしく守って」', anim: 'ox_gq_amanogawa',
  },
  gq_kanmuri: {
    name: '銀河のかんむり', kana: 'ぎんがのかんむり', kind: 'skill', job: 'galaxy_queen', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['mag', 'def'], mult: 1.35, dur: 45 }, { type: 'regen', base: [24, 30], thr: 30, dur: 24 }] },
    desc: '星をちりばめた銀河のかんむりが、光をわける。仲間全員の魔力と守備力が上がり、少しずつ回復していく。', cast: '{a}の銀河のかんむりが、やさしく光った！', anim: 'ox_gq_kanmuri',
  },
  galaxy_queen_sig: {
    name: '銀河をつつむ光', kana: 'ぎんがをつつむひかり', kind: 'spell', job: 'galaxy_queen', mp: 48, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [220, 255], thr: 95 },
        { type: 'heal', target: 'allies', base: [100, 120], thr: 60 },
        { type: 'barrier', target: 'allies', base: [70, 90], thr: 60 },
      ],
    },
    desc: '銀河じゅうの星の光を集める、銀河の女王の最強の技。敵全体に光の大ダメージ。仲間全員のHPを回復して、バリアではる。', cast: '{a}「銀河の星たちよ、わたしに光を！」', anim: 'ox_galaxy_queen_sig',
  },

  // ───────────── 大魔導王（大魔道士＋ハリーポッター） ─────────────
  gm_hyouka: {
    name: '炎と氷の二重呪文', kana: 'ほのおとこおりのにじゅうじゅもん', kind: 'spell', job: 'grand_magus', mp: 12, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'fire', base: [85, 100], thr: 65 }, { type: 'magic', element: 'ice', base: [85, 100], thr: 65 }] },
    desc: '右手で炎、左手で氷の呪文を、同時にとなえる。敵1体に炎と氷のダメージ。', cast: '{a}は、右手に炎、左手に氷をうかべた！', anim: 'ox_gm_hyouka',
  },
  gm_buki: {
    name: 'ぶきとばしの大呪文', kana: 'ぶきとばしのだいじゅもん', kind: 'spell', job: 'grand_magus', mp: 14, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [100, 120], thr: 65 },
        { type: 'debuff', stat: 'atk', mult: 0.7, dur: 40, chance: 0.9 },
        { type: 'dispel' },
      ],
    },
    desc: '赤い光が、敵の武器をはじきとばす。敵1体に光のダメージ。攻撃力が下がり、強くなっていた力も消える。', cast: '{a}「エクスペリアームス！」', anim: 'ox_gm_buki',
  },
  gm_mana: {
    name: '魔力の大いずみ', kana: 'まりょくのおおいずみ', kind: 'skill', job: 'grand_magus', mp: 2, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'mpHeal', base: [25, 35] }, { type: 'buff', stat: 'mag', mult: 1.3, dur: 40 }] },
    desc: '足もとに、魔力の大きないずみがわき出る。自分のMPを回復して、魔力も上がる。', cast: '{a}の足もとから、青い魔力がわき出した！', anim: 'ox_gm_mana',
  },
  gm_niju: {
    name: '二重呪文の構え', kana: 'にじゅうじゅもんのかまえ', kind: 'skill', job: 'grand_magus', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'mag', mult: 1.3, dur: 40 }, { type: 'twinCast', n: 2, mult: 0.6 }] },
    desc: '両手に、2つの魔法じんをうかべる。自分の魔力が上がり、次の攻撃の呪文2回は、それぞれもう1度出る。', cast: '{a}の両手に、2つの魔法じんがうかんだ！', anim: 'ox_gm_niju',
  },
  gm_raifuu: {
    name: 'いなずまと大風の二重呪文', kana: 'いなずまとおおかぜのにじゅうじゅもん', kind: 'spell', job: 'grand_magus', mp: 22, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'bolt', base: [95, 112], thr: 75 }, { type: 'magic', element: 'wind', base: [95, 112], thr: 75 }] },
    desc: 'いなずまの呪文と大風の呪文を、同時にとなえる。いなずまをまきこんだ大風が、敵全体をおそう。', cast: '{a}は、両手を空に向けた…いなずまと大風だ！', anim: 'ox_gm_raifuu',
  },
  gm_shugo: {
    name: '王の守護の呪文', kana: 'おうのしゅごのじゅもん', kind: 'spell', job: 'grand_magus', mp: 24, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['def', 'mag'], mult: 1.35, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'つえの先から、光の大きなけものがかけ出して、仲間を守る。仲間全員の守備力と魔力が上がり、悪いじょうたいも治る。', cast: '{a}「エクスペクト・パトローナム！」', anim: 'ox_gm_shugo',
  },
  gm_medroa: {
    name: 'ダブルメドローア', kana: 'だぶるめどろーあ', kind: 'spell', job: 'grand_magus', mp: 34, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'void', base: [190, 220], thr: 95 }, { type: 'magic', element: 'void', base: [190, 220], thr: 95 }] },
    desc: '両手に1本ずつ、光の弓を引く。2本のメドローアが、敵1体をつらぬく。どんな敵にも効く。', cast: '{a}は、両手で光の弓を引いた…ダブルメドローア！', anim: 'ox_gm_medroa',
  },
  grand_magus_sig: {
    name: 'メドローア×エクスペリアームス', kana: 'めどろーあえくすぺりあーむす', kind: 'spell', job: 'grand_magus', mp: 48, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'void', base: [205, 240], thr: 95 },
        { type: 'magic', element: 'light', base: [110, 130], thr: 90 },
        { type: 'dispel' },
      ],
    },
    desc: '消滅の呪文と、武器をとばす呪文を、同時にはなつ大魔導王の最強の技。敵全体に大ダメージ。強くなっていた力も消す。', cast: '{a}「メドローア…そして、エクスペリアームス！」', anim: 'ox_grand_magus_sig',
  },

  // ───────────── 天下むそうの剣聖（飛天御剣流けい承者＋暴れんぼう将軍） ─────────────
  ks_issen: {
    name: '剣聖の一閃', kana: 'けんせいのいっせん', kind: 'skill', job: 'sword_saint', mp: 12, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 3.6, critBonus: 0.15 },
    desc: '目にもとまらない、ひとふりの光。敵1体に大きなダメージ。会心も出やすい。', cast: '{a}の剣が、すっと光った…！', anim: 'ox_ks_issen',
  },
  ks_kokoro: {
    name: '明鏡止水の心', kana: 'めいきょうしすいのこころ', kind: 'skill', job: 'sword_saint', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.55, dur: 45 }, { type: 'kenki', add: 1 }] },
    desc: 'しずかな水のように、心をすみきらせる。自分の攻撃力と素早さがとても上がり、剣気も1だん高まる。', cast: '{a}は目をとじて、しずかに息をととのえた…', anim: 'ox_ks_kokoro',
  },
  ks_tsubame: {
    name: '天のつばめ返し', kana: 'てんのつばめがえし', kind: 'skill', job: 'sword_saint', mp: 14, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 1.95, hits: 2, critBonus: 0.2 },
    desc: 'とぶつばめも切りおとす、行って返す2回の太刀。敵1体を2回切る。会心も出やすい。', cast: '{a}の、天のつばめ返し！', anim: 'ox_ks_tsubame',
  },
  ks_kenki: {
    name: '剣気の高まり', kana: 'けんきのたかまり', kind: 'skill', job: 'sword_saint', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'charge', mult: 1.6 }, { type: 'kenki', add: 3 }] },
    desc: '体じゅうに剣気をみなぎらせる。次の攻撃がとても強くなり、剣気も3だん高まる。', cast: '{a}のまわりの空気が、ぴんとはりつめた…！', anim: 'ox_ks_kenki',
  },
  ks_hyakka: {
    name: '百花の太刀', kana: 'ひゃっかのたち', kind: 'skill', job: 'sword_saint', mp: 20, target: 'enemies', sword: true,
    effect: { type: 'phys', mult: 1.95, critBonus: 0.15 },
    desc: '百の花がさくように、太刀がまう。敵全体を切りつける。会心も出やすい。', cast: '{a}の太刀が、花のようにまった！', anim: 'ox_ks_hyakka',
  },
  ks_kiwami: {
    name: '会心の極み', kana: 'かいしんのきわみ', kind: 'skill', job: 'sword_saint', mp: 18, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 3.0, critBonus: 0.3, critScale: 0.15 },
    desc: '会心の一撃をきわめた者の太刀。とても会心が出やすく、剣気が高いほど、さらに強くなる。敵1体に大きなダメージ。', cast: '{a}「…ここだ！」', anim: 'ox_ks_kiwami',
  },
  ks_seibai: {
    name: '天下の大成敗', kana: 'てんかのだいせいばい', kind: 'skill', job: 'sword_saint', mp: 26, target: 'enemies', sword: true,
    effect: { type: 'phys', mult: 1.75, hits: 2, ignoreDef: 0.3 },
    desc: '天下の悪をまとめてこらしめる太刀。敵全体を2回切る。守りの固い敵にもよく効く。', cast: '{a}「天下の悪、まとめて成敗！」', anim: 'ox_ks_seibai',
  },
  sword_saint_sig: {
    name: '天下むそう・剣聖の太刀', kana: 'てんかむそうけんせいのたち', kind: 'skill', job: 'sword_saint', mp: 42, target: 'enemies', sword: true,
    effect: { type: 'phys', mult: 1.85, hits: 2, critBonus: 0.25, critScale: 0.1, ignoreDef: 0.25 },
    desc: '天下にならぶ者のない、剣聖の最強の太刀。敵全体を2回切る。会心が出やすく、剣気が高いほど、さらに強くなる。', cast: '{a}「天下むそう…剣聖の太刀！」', anim: 'ox_sword_saint_sig',
  },
};
