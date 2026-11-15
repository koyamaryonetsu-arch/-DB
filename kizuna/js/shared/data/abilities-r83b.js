// 第83回 B班の 技: ぬ〜べ〜の 系統（docs/plan-jobs-r79.md の 9-2。docs/plan-r83-jobs-b.md）
//   小学校の先生 → れい能力教師ぬ〜べ〜 → おにの手のじごく先生
//
// ・この 系統だけの こうか（shared/battle-r83b.js）
//   oniHand  … おにの手を 出す（もう一度 使うと ふういんしなおす）。出して いる 間は 自分の 番ごとに 物理の ダメージ ＋15%（上限は 職業の passive.oniMax）・HP が 6% へる
//   oniAwake … おにの手・かくせい（turns 回の 番の 間、上限の 力で HP が へらない。ふういん して いれば 出す）
//   oniSeal  … おにの手を ふういんに もどす（最大出力の あと。multi の さいごに target: 'self' で）
//   teShield … 体をはって守る（次の 自分の 番まで 仲間全員を かばい、その 間 受ける ダメージが へる）
//   teKoe    … 生徒たちの声（この 戦いの 間、自分の HP が 少ないほど 物理の ダメージが 上がる）
//   magic の vsRace … 魔物の 種類に 強い 呪文（おふだ。物理の vsRace は battle.js の calcPhys で 前から 見る）
// ・ゆうれい・悪魔に 強い: おにの手の 技と おふだは spirit（ゆうれい）・undead（アンデッド）・demon（悪魔）に ×1.5（強制じょうぶつは ×2）
// ・きまりは abilities-r82a.js と おなじ（攻撃技は 2つ いじょう・Lv10 の 技が いちばん MP・看板の 技は <職業の id>_sig。
//   自分や 仲間に かける 技の えんしゅつは 前から ある 物）

// ゆうれい・アンデッド・悪魔に 強い
export const GHOST = { spirit: 1.5, undead: 1.5, demon: 1.5 };
const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const R83B_ABILITIES = {
  // ───────────── 小学校の先生（上級職。地方公務員 ＋ 小学生） ─────────────
  et_kokuban: {
    name: '黒板けしアタック', kana: 'こくばんけしあたっく', kind: 'skill', job: 'elem_teacher', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.7, status: { status: 'blind', chance: 0.15, turns: [2, 3], quiet: true } },
    desc: 'チョークのこなでまっ白な黒板けしを、思いきり投げる。敵1体にダメージ。こなで目くらましになることもある。', cast: '{a}の、黒板けしアタック！', anim: 'r83b_eraser',
  },
  et_kabau: {
    name: '生徒をかばう', kana: 'せいとをかばう', kind: 'skill', job: 'elem_teacher', mp: 2, target: 'ally', role: 'sup',
    effect: { type: 'cover' },
    desc: '「先生の後ろにいなさい！」仲間1人を、自分の体でかばう。', cast: '{a}「先生の後ろにいなさい！」', anim: 'guard',
  },
  et_hoken: {
    name: '保健室へ行こう', kana: 'ほけんしつへいこう', kind: 'skill', job: 'elem_teacher', mp: 4, target: 'ally', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [62, 78], thr: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '保健室につれて行って手当てする。仲間1人のHPを回復し、どくやねむりなどの状態異常も治す。', cast: '{a}「さあ、保健室へ行こう！」', anim: 'heal2',
  },
  et_shukudai: {
    name: '宿題だ！', kana: 'しゅくだいだ', kind: 'skill', job: 'elem_teacher', mp: 4, target: 'enemy', role: 'sup',
    effect: { type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.85 },
    desc: '「明日までに、宿題をやってきなさい！」敵1体は宿題が気になって、攻撃力が下がる。', cast: '{a}「明日までに、宿題をやってきなさい！」', anim: 'debuff',
  },
  et_ofuda: {
    name: 'おふだ', kana: 'おふだ', kind: 'skill', job: 'elem_teacher', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [60, 76], thr: 40, vsRace: GHOST },
    desc: '光の力をこめたおふだを投げる。敵1体に光の呪文のダメージ。ゆうれい・アンデッド・悪魔には、とても強い。', cast: '{a}は、おふだを投げた！', anim: 'r83b_ofuda',
  },
  elem_teacher_sig: {
    name: '体をはって守る', kana: 'からだをはってまもる', kind: 'skill', job: 'elem_teacher', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'teShield', take: 0.6 },
    desc: '「わたしの生徒に、手を出すな！」次の自分の番まで、仲間全員をかばう。その間、自分の受けるダメージがへる。', cast: '{a}「わたしの生徒に、手を出すな！」', anim: 'guard',
  },

  // ───────────── れい能力教師ぬ〜べ〜（超級職） ─────────────
  nb_onite: {
    name: 'おにの手', kana: 'おにのて', kind: 'skill', job: 'nube', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, vsRace: GHOST, oni: true },
    desc: '左手の手ぶくろをとって、おにの手で強い一撃。敵1体にダメージ。ゆうれい・アンデッド・悪魔には、とても強い。', cast: '{a}「くらえ、おにの手！」', anim: 'r83b_oni',
  },
  nb_kannon: {
    name: 'かんのんきょう', kana: 'かんのんきょう', kind: 'skill', job: 'nube', mp: 8, target: 'allies', role: 'sup',
    effect: { type: 'cure', statuses: STATUS_ALL },
    desc: 'ありがたいおきょうをとなえる。仲間全員の、どく・ねむり・マヒ・こんらんなどの状態異常を治す。', cast: '{a}は、かんのんきょうをとなえた…', anim: 'holy',
  },
  nb_dasu: {
    name: 'おにの手を出す', kana: 'おにのてをだす', kind: 'skill', job: 'nube', mp: 3, target: 'self', role: 'sup',
    effect: { type: 'oniHand', max: 0.6 },
    desc: 'おにの手のふういんをとく。自分の番が来るたびに、物理の攻撃のダメージが15%ずつ上がるが、HPが少しずつへる。もう一度使うと、ふういんしなおす。', cast: '{a}は、左手の手ぶくろをはずした…！', anim: 'charge',
  },
  nb_reisui: {
    name: 'れい水しょう', kana: 'れいすいしょう', kind: 'skill', job: 'nube', mp: 6, target: 'enemy', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'scan' }, { type: 'debuff', stat: 'def', mult: 0.75, dur: 40, chance: 0.9 }] },
    desc: 'すきとおった水しょうの玉で、敵の正体を見る。敵1体の弱点がわかり、守備力が下がる。', cast: '{a}は、れい水しょうをのぞきこんだ…', anim: 'r83b_crystal',
  },
  nb_youki: {
    name: 'よう気ふうじ', kana: 'ようきふうじ', kind: 'skill', job: 'nube', mp: 8, target: 'enemy', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'dispel' }, { type: 'status', status: 'silence', chance: 0.4, turns: [2, 3] }] },
    desc: 'おふだで、敵のあやしい力をふうじる。敵1体の強くなる力を消し、ときどき呪文もふうじる。', cast: '{a}「よう気、ふうじ！」', anim: 'r83b_seal',
  },
  nube_sig: {
    name: 'おにの手・強制じょうぶつ', kana: 'おにのてきょうせいじょうぶつ', kind: 'skill', job: 'nube', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, vsRace: { spirit: 2, undead: 2, demon: 2 }, oni: true },
    desc: 'おにの手で、悪い力をまるごとつかんで、天へ送り返す。敵1体に大ダメージ。ゆうれい・アンデッド・悪魔には、もっと大きい。', cast: '{a}「おにの手よ、悪い力を天へ送れ！」', anim: 'nube_sig',
  },

  // ───────────── おにの手のじごく先生（伝説の職業。ぬ〜べ〜 ＋ ほかの 超級職 1つ） ─────────────
  js_renda: {
    name: 'おにの手・れんげき', kana: 'おにのてれんげき', kind: 'skill', job: 'jigoku_sensei', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, hits: 2, vsRace: GHOST, oni: true },
    desc: 'おにの手で、2回つづけて打つ。敵1体に2回ダメージ。ゆうれい・アンデッド・悪魔には、とても強い。', cast: '{a}の、おにの手・れんげき！', anim: 'r83b_renda',
  },
  js_fubuki: {
    name: '雪女のふぶき', kana: 'ゆきめのふぶき', kind: 'skill', job: 'jigoku_sensei', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [100, 124], thr: 60 },
    desc: '友だちの雪女が、手つだいにかけつけた。敵全体に氷のダメージ。', cast: '雪女「先生、手つだうわ！」', anim: 'r83b_fubuki',
  },
  js_koe: {
    name: '生徒たちの声', kana: 'せいとたちのこえ', kind: 'skill', job: 'jigoku_sensei', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'teKoe', grit: 0.6 }, { type: 'regen', base: [40, 50], thr: 50 }] },
    desc: '「がんばれ、先生！」生徒たちの声がとどく。この戦いの間、自分のHPが少ないほど物理の攻撃が強くなり、少しずつ回復する。', cast: '「がんばれ、先生！」生徒たちの声がとどいた！', anim: 'warcry',
  },
  js_kakusei: {
    name: 'おにの手・かくせい', kana: 'おにのてかくせい', kind: 'skill', job: 'jigoku_sensei', mp: 18, target: 'self', role: 'sup',
    effect: { type: 'oniAwake', turns: 3 },
    desc: 'おにの手の力を、すべて目ざめさせる。自分の番が3回来る間、HPがへらずに、おにの手のいちばん強い力で戦える。', cast: '{a}のおにの手が、まっ赤にかがやいた！', anim: 'charge',
  },
  js_tsuiteru: {
    name: '先生がついてる', kana: 'せんせいがついてる', kind: 'skill', job: 'jigoku_sensei', mp: 20, target: 'deadAlly', role: 'heal',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '「先生がついてるぞ！」たおれた仲間1人を生き返らせる（HPは半分）。', cast: '{a}「起きろ！先生がついてるぞ！」', anim: 'revive',
  },
  jigoku_sensei_sig: {
    name: 'おにの手・最大出力', kana: 'おにのてさいだいしゅつりょく', kind: 'skill', job: 'jigoku_sensei', mp: 34, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.9, vsRace: GHOST, oni: true }, { type: 'oniSeal', target: 'self' }] },
    desc: 'おにの手の力を、全部一度に出しきる。敵全体に大ダメージ。ゆうれい・アンデッド・悪魔には、とても強い。使うと、おにの手はふういんにもどる。', cast: '{a}「おにの手、最大出力だ！」', anim: 'jigoku_sensei_sig',
  },
};
