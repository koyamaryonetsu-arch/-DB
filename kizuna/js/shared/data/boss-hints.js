// 第80回 E班: ボスに 負けた 時の ヒント（docs/plan-r80-hints.md。ネタバレ注意: しかけの 答えが 書いて ある）
//   BOSS_HINTS[きまった 戦いの id] = [1回目, 2回目, 3回目より あと]
//     1回目 … ぼんやり（何を 見れば いいか）／2回目 … もう 少し（いつ 何を するか）／3回目 … はっきり（やる ことを そのまま）
//     1つ 40文字 くらいまで・子ども向け・しかけの 話だけ（ボスの 名前・正体・先の 場面は 書かない）
//   BOSS_RETRY[戦いの id] = その ボスの 台本が 始まる マスの 台本の id（maps の triggers の script）。
//     「もう一度いどむ」で その マスの 手前（ボスと 反対の がわ）へ 行く（world/boss-hints.js の retrySpot）。ない 戦いは「あとにする」だけ
//   BOSS_HINT_WHO[戦いの id] = ヒントを 言う 人（ない ときは その 戦いの ゲスト・いなければ トキネ）
//
// ほかの ファイルの 表を まぜる: mergeBossHints(ヒントの 表, { retry, who })
//   例（第8章 第4幕。B班の data/boss-hints-c8r.js）:
//     import { mergeBossHints } from './boss-hints.js?v=37bf0e270855';
//     export const C8R_BOSS_HINTS = { c8_gatekeeper: ['…', '…', '…'] };
//     mergeBossHints(C8R_BOSS_HINTS, { retry: { c8_gatekeeper: '台本の id' } });
//   その ファイルは 自分の 戦いの ファイル（encounters-c8r.js など）から import する。ない 時は 何も まざらない（この ファイルは 読まない）

export const BOSS_HINTS = {
  // ───── 第6章 ─────
  sand_clock: [
    '体の中の砂が、へっていくのを見てみよう。',
    '砂が落ちきる前に、こおらせる技が効くみたい。',
    '氷の技を当てると砂がもどる。前ぶれの時に氷を当てれば、大技も止まる！',
  ],
  geardon: [
    '時を覚えると、つけたキズが、もとにもどってしまうみたい。',
    '時を覚えている間に、むねの大歯車をねらおう。',
    '覚えている間に雷の技を2回当てよう！歯車をかかげたら身を守る！',
  ],
  star_eater: [
    '星をねらっている時に、何かできることがありそう。',
    '星をねらっている間に、まぶしい技を当てよう。',
    '星をねらったら光の技を当てる！星を食べさせなければ、強くならない！',
  ],
  pendula: [
    'ふりこのゆれる場所で、戦いのはやさがかわるよ。',
    'じっと見られた人は、身を守るとよさそう。',
    '見られた人と、大ふりこの前は身を守る。右の間は合体技をしない！',
  ],
  carillon: [
    'かねのしるしが、へっていくのを見てみよう。',
    'かねが鳴ると、強くした力が消えてしまうよ。',
    'しるし2つから合体技はやめて、1つで身を守る！鳴ったら強くしよう！',
  ],
  zenmai: [
    'まわりの歯車と、文字ばんの針を見てみよう。',
    '針が12時になると大技！歯車をこわすと、針がもどるよ。',
    'ほのおの歯車は氷・水は雷・影は光でこわす。針が10時なら急いで！',
  ],
  // ───── 第7章 ─────
  c7_gate: [
    'かたほうだけたおしても、よびもどされてしまうみたい。',
    '2ひきのHPを、そろえてへらしていこう。',
    'HPの多いほうをねらう！うずが近い時は合体技をやめて、身を守る！',
  ],
  c7_temple: [
    'うばわれた声が、どこへ行ったか見てみよう。',
    '声の入った貝をこわすと、声がもどるよ。',
    '声が貝に入ったら、すぐ貝をこわす！こわせない大合唱は身を守る！',
  ],
  c7_reef: [
    'しおの満ち引きで、船のようすがかわるよ。',
    'ほうげきの前に身を守ると、ずっと楽になる。',
    'しるしが1つなら身を守る。のり上げた間に、合体技や大技をうとう！',
  ],
  c7_light: [
    '板の上に行かされた人を、ほうっておくとあぶない。',
    '板の上の人は「手をのばす」で助けられるよ。',
    '板の人は回復より先に手をのばす！号令の前は合体技をしない！',
  ],
  c7_witch: [
    '前にある、いばらのかべを見てみよう。',
    'かべがあると、ダメージが少ししか通らないよ。',
    'かべを先に炎でこわそう！のろいや、いきの前は身を守る！',
  ],
  c7_shadow: [
    'ねらわれた人の、まどを見てみよう。',
    'ねらわれた人が身を守ると、何かがおきるよ。',
    'ねらわれたら、回復より先に身を守る！ブーメランをはね返せる！',
  ],
  // ───── 第8章 第1〜3幕 ─────
  c8_vizier_pet: [
    '耳をすましている時は、何かを覚えているみたい。',
    '聞き耳の間に呪文を当てると、まねされてしまうよ。',
    '聞き耳の間は呪文をやめて、ぶきで攻撃！まねの大技の前は身を守る！',
  ],
  c8_jafar: [
    'すがたがかわるたびに、ねらう所がかわるよ。',
    'へびがとぐろをまいたら、手を止めよう。ランプはこわせるよ。',
    'とぐろの間は攻撃しないで身を守る！ランプが出たら先にこわす！',
  ],
  c8_painpanic: [
    '2ひきの頭の上の、おばけのしるしを見てみよう。',
    'しるしが少なくなったら、大技が近いよ。合体技はがまんしよう。',
    'しるし1つで身を守り、合体技はしない！相談の間は強い一撃でじゃま！',
  ],
  c8_hades: [
    '弱点でない技が、しかけを止めるかも。',
    'けいやくしょは炎でもえる。ふん火の前は、頭をひやそう。',
    'けいやくの間は炎を当てる！赤くなったら、ふん火の前に氷を当てる！',
  ],
  c8_kamek: [
    '子分の足もとに出る、ピンクのわを見てみよう。',
    '魔法じんの上の子分は、大きくなる前にたおそう。',
    '魔法じんの子分を、いちばん強い一撃ですぐたおす！合体技はそのあと！',
  ],
  c8_bowser: [
    '大きくなった時に出てくる物を、見てみよう。',
    '橋のオノは、呪文では動かない。ぶきで当てよう。',
    'オノが出たら、ぶきで3回たたく！大技の前ぶれでは身を守る！',
  ],
};

// もう一度いどむ 行き先（その ボスの 台本が 始まる マスの 台本の id）
export const BOSS_RETRY = {
  sand_clock: 'c6_altar_event', geardon: 'c6_gear_event', star_eater: 'c6_bird_event', pendula: 'c6_pendula_event',
  carillon: 'c6_carillon_event', zenmai: 'c6_zenmai_event',
  c7_gate: 'c7_gate_event', c7_temple: 'c7_boss_event', c7_reef: 'c7s_reef_event', c7_light: 'c7s_boss_event',
  c7_witch: 'c7i_witch_event', c7_shadow: 'c7i_boss_event',
  c8_vizier_pet: 'c8a_pet_event', c8_jafar: 'c8a_boss_event', c8_painpanic: 'c8b_imps_event', c8_hades: 'c8b_boss_event',
  c8_kamek: 'c8c_kamek_event', c8_bowser: 'c8c_boss_event',
};

// ヒントを 言う 人（ない 戦いは ゲスト・いなければ トキネ）
export const BOSS_HINT_WHO = {};

export const HINT_SPEAKER = 'トキネ';

// ほかの ファイルの 表を まぜる（同じ id は あとの 物）
export function mergeBossHints(hints = {}, { retry = {}, who = {} } = {}) {
  for (const [id, list] of Object.entries(hints || {})) {
    if (Array.isArray(list) && list.length) BOSS_HINTS[id] = list.slice(0, 3).map(String);
  }
  Object.assign(BOSS_RETRY, retry || {});
  Object.assign(BOSS_HINT_WHO, who || {});
}

// n 回 負けた 時の ヒント（1から。3回より あとは 3つ目）
export function bossHintAt(id, n) {
  const list = BOSS_HINTS[id];
  if (!list?.length || !(n >= 1)) return '';
  return list[Math.min(n, list.length) - 1];
}

// 冒険のしおり用: 今までに 出た ヒント（[{ id, n, hints: [文…] }]。ボスの 名前は 出さない。勝つと 消える）
export function bossHintsSeen(c) {
  const out = [];
  const loss = c?.bossLoss && typeof c.bossLoss === 'object' ? c.bossLoss : {};
  for (const [id, raw] of Object.entries(loss)) {
    const n = Math.min(3, Math.floor(Number(raw) || 0));
    if (!(n >= 1) || !BOSS_HINTS[id]?.length) continue;
    out.push({ id, n, hints: BOSS_HINTS[id].slice(0, n) });
  }
  return out;
}
