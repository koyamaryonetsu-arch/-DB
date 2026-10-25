// 2026年10月（第43回 B）: 魔物の 系統の「奥義」（docs/plan-monsters.md の 2-4・6 B）
//   魔物の 仲間は、その しゅぞくの 系統（MONSTERS[sp].race）の 奥義を Lv30・45・60 で 1つずつ 覚える（8系統 × 3つ）
//   もともと 弱い 技しか 覚えない 魔物も、育てると 強く なる
//
// きまり
//  ・Lv30 … こうげき（上級職の 強い 技くらい）／Lv45 … 仲間を 助ける・敵を 弱くする／Lv60 … 看板の 技（超級職の 強い 技くらい。伝説の 職業の 看板の 技より 下）
//  ・みんなに かける 補助は 1.35倍まで（伝説の 上限 1.4倍より 下）
//  ・kind は 'monster'（魔物の 技。仲間の 魔物は MP を つかう。呪文の ような 技は spellLike で ふうじられる）
//  ・えんしゅつ（anim）は 今 ある もの（新しい 絵は なし）
//  ・ougi: その 系統。配合では 受けつがない（world/breed.js の inheritableSkills。系統の 技の まま に する）
//  ・覚える 所は stats.js の monsterAbilities（RACE_OUGI を 見る）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const OUGI_LEVELS = [30, 45, 60];

export const OUGI_ABILITIES = {
  // ───────────── スライム系: ぷるぷるの 体で とびこむ・いやしの しずく・みんなで 大きく なる ─────────────
  og_slime_dive: {
    name: 'ぷるぷる大ダイブ', kana: 'ぷるぷるだいだいぶ', kind: 'monster', ougi: 'slime', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, acc: 0.95 },
    desc: '高くとび上がって、ぷるぷるの体で思いきりぶつかる。敵1体に大きなダメージ。', cast: '{a}は高くとび上がった！ぷるぷる大ダイブ！', anim: 'tackle',
  },
  og_slime_drop: {
    name: 'いやしのしずく', kana: 'いやしのしずく', kind: 'monster', ougi: 'slime', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [85, 105], thr: 50 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '体からすんだしずくをふりまく。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}の体から、きらきら光るしずくがふりそそいだ！', anim: 'heal_dance',
  },
  og_slime_king: {
    name: 'ぷるぷる大合体', kana: 'ぷるぷるだいがったい', kind: 'monster', ougi: 'slime', mp: 26, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.6 },
        { type: 'atbSet', sub: 30, chance: 0.35, msg: '{t}は、ぷるぷるの体にうもれて動けない！', failMsg: '{t}は、なんとかぬけ出した！' },
      ],
    },
    desc: '仲間のスライムたちを呼び集めて、きょだいなスライムになってのしかかる、スライム系のおうぎ。敵全体に大ダメージ。うもれて動きが止まる敵もいる。', cast: 'スライムたちが、ぞろぞろやって来た…！{a}の、ぷるぷる大合体！', anim: 'quake',
  },

  // ───────────── けもの系: するどい キバ・むれの おたけび・王者の ツメ ─────────────
  og_beast_fang: {
    name: '野生のキバ', kana: 'やせいのきば', kind: 'monster', ougi: 'beast', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, critBonus: 0.1 },
    desc: '野生の力をこめて、急所にかみつく。敵1体に大きなダメージ。会心も出やすい。', cast: '{a}は、野生のキバをむいた！', anim: 'bite',
  },
  og_beast_howl: {
    name: 'むれのおたけび', kana: 'むれのおたけび', kind: 'monster', ougi: 'beast', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 },
    desc: 'むれのリーダーのように、遠くまでひびくおたけびを上げる。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「ウォオオーン！」', anim: 'warcry',
  },
  og_beast_king: {
    name: '王者のかぎづめ', kana: 'おうじゃのかぎづめ', kind: 'monster', ougi: 'beast', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 6, random: true, critBonus: 0.05 },
    desc: 'けものの王のように、目にもとまらぬ速さでかけまわる、けもの系のおうぎ。敵にランダムで6回、するどいツメで切りつける。', cast: '{a}の目が光った…！王者のかぎづめ！', anim: 'slash_multi',
  },

  // ───────────── 植物系: どくの ムチ・森の めぐみ・大樹の いかり ─────────────
  og_plant_whip: {
    name: 'どくばらのムチ', kana: 'どくばらのむち', kind: 'monster', ougi: 'plant', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.0, status: { status: 'poison', chance: 0.5 } },
    desc: 'トゲだらけのつるを、大きくふり回す。敵全体にダメージ。毒にすることもある。', cast: '{a}は、トゲだらけのつるをふり回した！', anim: 'slash_multi',
  },
  og_plant_grace: {
    name: '大森林のめぐみ', kana: 'だいしんりんのめぐみ', kind: 'monster', ougi: 'plant', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [60, 75], thr: 40 }, { type: 'regen', base: [10, 13], thr: 40, dur: 24 }] },
    desc: '森の木々の力をわけてもらう。仲間全員のHPを回復して、しばらく少しずつ回復する。', cast: '{a}のまわりに、森のやさしい風がふいた！', anim: 'heal_dance',
  },
  og_plant_wrath: {
    name: '大樹のいかり', kana: 'たいじゅのいかり', kind: 'monster', ougi: 'plant', mp: 26, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.55 },
        { type: 'debuff', stat: 'agi', mult: 0.75, dur: 30, chance: 0.7 },
      ],
    },
    desc: '千年生きた大樹の根が、地面をわってあばれ出す、植物系のおうぎ。敵全体に大ダメージ。根にからまって素早さが下がる敵もいる。', cast: '地面がゆれる…！{a}の、大樹のいかり！', anim: 'quake',
  },

  // ───────────── せいれい系: せいれいの 風・魔力の いずみ・四つの せいれいの 力 ─────────────
  og_spirit_gale: {
    name: 'せいれいのつむじ風', kana: 'せいれいのつむじかぜ', kind: 'monster', ougi: 'spirit', spellLike: true, mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [70, 90], thr: 60 },
    desc: '風のせいれいを呼んで、大きなつむじ風をおこす。敵全体に風のダメージ。', cast: '{a}は、風のせいれいを呼んだ！', anim: 'wind2',
  },
  og_spirit_spring: {
    name: '魔力のいずみ', kana: 'まりょくのいずみ', kind: 'monster', ougi: 'spirit', spellLike: true, mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'mpHeal', base: [5, 8] }, { type: 'buff', stat: 'mag', mult: 1.25, dur: 40 }] },
    desc: 'せいれいの国の、魔力のいずみをよびおこす。仲間全員のMPが少し回復して、魔力も上がる。', cast: '{a}のまわりに、青く光るいずみがわき出した！', anim: 'heal_dance',
  },
  og_spirit_four: {
    name: '四大せいれいの力', kana: 'しだいせいれいのちから', kind: 'monster', ougi: 'spirit', spellLike: true, mp: 28, target: 'enemies',
    effect: { type: 'magic', element: 'void', base: [135, 160], thr: 80 },
    desc: '火・水・風・土の四つのせいれいの力を、ひとつに合わせてはなつ、せいれい系のおうぎ。敵全体に大ダメージ。どんな敵にも効く。', cast: '火・水・風・土の光が、{a}の上でひとつになった…！', anim: 'blast2',
  },

  // ───────────── 悪魔系: 黒い ほのお・悪魔の ささやき・魔界の とびら ─────────────
  og_demon_flame: {
    name: '魔界の黒いほのお', kana: 'まかいのくろいほのお', kind: 'monster', ougi: 'demon', spellLike: true, mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [150, 180], thr: 70 },
    desc: '魔界でしかもえない、黒いほのおをぶつける。敵1体に闇の大ダメージ。', cast: '{a}の手に、黒いほのおがもえ上がった！', anim: 'dark1',
  },
  og_demon_whisper: {
    name: '悪魔のささやき', kana: 'あくまのささやき', kind: 'monster', ougi: 'demon', spellLike: true, mp: 16, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'atk', mult: 0.8, dur: 30, chance: 0.75 },
        { type: 'debuff', stat: 'def', mult: 0.8, dur: 30, chance: 0.75 },
      ],
    },
    desc: '耳もとで、おそろしいことをささやく。敵全体の攻撃力と守備力を下げる。', cast: '{a}は、ひそひそと何かをささやいた…', anim: 'debuff',
  },
  og_demon_gate: {
    name: '魔界のとびら', kana: 'まかいのとびら', kind: 'monster', ougi: 'demon', spellLike: true, mp: 28, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [130, 155], thr: 75, dispel: true },
    desc: '空に魔界へのとびらを開いて、闇の力をあふれさせる、悪魔系のおうぎ。敵全体に闇の大ダメージ。敵の強くなるこうかも消す。', cast: '空に、大きな黒いとびらが開いた…！{a}の、魔界のとびら！', anim: 'dark_wings',
  },

  // ───────────── ゾンビ系: 命を すいとる・よみがえりの おどり・死者の 行進 ─────────────
  og_undead_drain: {
    name: '命をすいとる手', kana: 'いのちをすいとるて', kind: 'monster', ougi: 'undead', mp: 10, target: 'enemy',
    effect: { type: 'drainHp', mult: 2.2 },
    desc: 'つめたい手で、敵の命の力をすいとる。敵1体に大きなダメージ。あたえたダメージの半分だけ、自分のHPが回復する。', cast: '{a}のつめたい手が、のびてきた…', anim: 'wraith_chill',
  },
  og_undead_rise: {
    name: 'よみがえりのおどり', kana: 'よみがえりのおどり', kind: 'monster', ougi: 'undead', mp: 26, target: 'deadAllies', role: 'heal',
    effect: { type: 'revive', hpRatio: 0.35 },
    desc: '死んでもまたおき上がる、ふしぎなおどり。死んでしまった仲間みんなを生き返らせる（HPは少し）。', cast: '{a}は、カタカタとふしぎなおどりをおどった…！', anim: 'revive',
  },
  og_undead_march: {
    name: '死者の大行進', kana: 'ししゃのだいこうしん', kind: 'monster', ougi: 'undead', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.5, element: 'dark', status: { status: 'paralyze', chance: 0.25, turns: [1, 2] } },
    desc: 'どこからともなく死者のむれがあらわれて、敵の上を歩いていく、ゾンビ系のおうぎ。敵全体に闇の大ダメージ。マヒすることもある。', cast: 'ザッ、ザッ…どこからか、死者のむれが歩いてくる…！', anim: 'dark_slash',
  },

  // ───────────── 物質系: ようさいの 体当たり・鉄の とりで・ギガントプレス ─────────────
  og_material_ram: {
    name: 'ようさいの体当たり', kana: 'ようさいのたいあたり', kind: 'monster', ougi: 'material', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, atkFrom: 'def' },
    desc: '固い体ごと、まっすぐぶつかる。敵1体に大きなダメージ。体が固いほど強い（攻撃力と守備力のまん中でなぐる）。', cast: '{a}は、ゴゴゴゴ…と動き出した！', anim: 'tackle',
  },
  og_material_fort: {
    name: '鉄のとりで', kana: 'てつのとりで', kind: 'monster', ougi: 'material', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 45 },
    desc: '鉄のかべを、仲間のまわりにずらりとならべる。仲間全員の守備力が上がる。', cast: '{a}のまわりに、鉄のかべが立ち上がった！', anim: 'guard',
  },
  og_material_press: {
    name: 'ギガントプレス', kana: 'ぎがんとぷれす', kind: 'monster', ougi: 'material', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.7, atkFrom: 'def', ignoreDef: 0.3 },
    desc: '山のように重い体で、空から落ちてくる、物質系のおうぎ。敵全体に大ダメージ。体が固いほど強く、守りの固い敵にもよく効く。', cast: '{a}は空高くうかび上がった…！ギガントプレス！', anim: 'quake',
  },

  // ───────────── ドラゴン系: 火の いき・竜の 力・竜王の いき ─────────────
  og_dragon_flame: {
    name: 'ドラゴンの火の息', kana: 'どらごんのひのいき', kind: 'monster', ougi: 'dragon', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [80, 100], thr: 50, breath: true },
    desc: 'むねいっぱいに息をすって、ごうごうともえる火をはく。敵全体に炎のダメージ。', cast: '{a}は、ごうごうともえる火をはいた！', anim: 'breath',
  },
  og_dragon_might: {
    name: '竜の力', kana: 'りゅうのちから', kind: 'monster', ougi: 'dragon', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.4, dur: 45 },
    desc: '体の中にねむる、竜の力をめざめさせる。自分の攻撃力と守備力がとても上がる。', cast: '{a}の体から、竜の力があふれ出した！', anim: 'super_aura',
  },
  og_dragon_king: {
    name: '竜王のいかり', kana: 'りゅうおうのいかり', kind: 'monster', ougi: 'dragon', mp: 30, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [150, 180], thr: 70, breath: true },
    desc: '竜の王のいかりを、ほのおのうずにしてはき出す、ドラゴン系のおうぎ。敵全体に炎の大ダメージ。', cast: '{a}は大きくつばさを広げた…！竜王のいかり！', anim: 'fire_tornado',
  },
};

// 系統 → [[レベル, 技], …]（Lv30・45・60 の じゅん）
export const RACE_OUGI = {};
for (const [id, a] of Object.entries(OUGI_ABILITIES)) {
  const list = RACE_OUGI[a.ougi] || (RACE_OUGI[a.ougi] = []);
  list.push([OUGI_LEVELS[list.length], id]);
}

// その 系統の 奥義（覚える レベルと 技。系統が ない・人間 などは 空）
export function ougiLearn(race) {
  return RACE_OUGI[race] || [];
}
