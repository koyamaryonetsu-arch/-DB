// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 戦いの しかけ（battle-c9a.js・battle-c9b.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
// docs/plan-part3-c11c.md の 19-4
//
// ・スピカの ごほうび（どの 戦いでも。リーダーの フラグ c11_act3）: 技「ふたりの光」が ふえる … 戦いで 1回だけ、ほのかな光の 時に
//   HPが 半分より 少ない 仲間（ゲストを のぞく）が TWIN_LOW 人 いじょう（ひとりの 時は その 人）なら、スピカの 光と 遠くの 小さな 光が かさなって、
//   生きて いる 仲間 みんなの HPを 最大HPの TWIN_HP 回復する。battle-c9a.js の glow から よぶ。前の ごほうび（ながれ星・名前をよぶ声 など）と 合わせて きく
// ・中ボス「バラバラン3号」（3人組の メカ 3号。monsters-c11c.js の c11c.kind 'mecha'）… 3つの 体（あたま・うで・あし ＝ 3体の 敵）
//   こわした 所の 技が 出なく なる（その 体は 動かない）: うで … 強い 1人攻撃（rocket.every 回 動く ごとに 前ぶれ・ねらいの 人 → 次の うでの 番に ロケットパンチ）／
//   あし … 全体攻撃（じだんだ）／ あたま … こわれた 所を 直す（fix 回 動く ごとに、こわれた 所が あれば 前ぶれ → 次の あたまの 番に 直す。HP fixHp）
//   あたまは かたい（受ける ダメージ hard）。＝ どこから こわすか（あたまを 先に こわすと 直されない。でも かたい）
//   3つ とも こわすと 勝ち（3人組は にげて いく）
//   （設計に ない 足し物: だれも えらんで いない〈完全オート・人が みんな たおれた〉時は 直すのが 早い〈autoFix〉・あたまが もっと かたい〈autoHard〉・
//     あたまが 番ごとに 自分を 少し 直す〈autoHeal〉）
// ・新しい コマンド「アルゴルにたのむ」（m11_tanomu。隊長の 戦いで だれでも。その 人の 番を 使う。ねらいは 場に 出て いる カード 1まい … cmd.choice〈番号〉）
// ・幕の ボス「近衛の隊長エース」と トランプの へいたい 2体（c11c.kind 'ace'・'guard'）… 先に 見える 3まいの カード
//   1. 隊長は、これから 使う 技の カードを cards まい 場に ならべる（うら向き。その 番は ならべる だけ）。じゅんに 1まいずつ めくって 使う（隊長の 1回の 番に 1まい）。
//      ならべた カードを 使いきると、また ならべる
//   2. カードの しゅるい（マーク）: ほうき星 … 1人に とても 大きな ダメージ（ねらいは ならべた 時に 決まる。おもてなら 見える。「防御」で へる）／
//      星 … 全体の ダメージ ／ 月 … 全体の 小さな ダメージ ＋ 身を 守って いない 人は ねむる（ひとりの 時は ねむらず、動きが おそく なる）／
//      太陽 … 隊長と へいたいが 回復
//   3. スピカの「てらす」で、うら向きの カードが 全部 おもてに なる（その ならびの 間。てらして いる 間に ならべた カードも おもて）
//   4. 「アルゴルにたのむ」で、場の カード 1まいを 食べて もらう（その 技は 出ない）。食べられるのは ならびに つき 1まい
//   5. へいたい（ねらえる）が いる 間、隊長は カードを plus まい 多く ならべる。へいたいは たおしても、隊長が back 回 動くと もどる（1回 前に 前ぶれ）
//      へいたいは 全体の 技を 受けにくい（aoeK）・隊長も 少し（aoeBoss）
//   6. HPが 半分を 切ると、ほうき星の カードが 2まい まざる ことが ある（two）
//   人数で 合わせる（few・bare・solo・monK）。ひとりの 時は カード 2まい・へいたい 1体
//   勝つと 隊長は たおれず、カードに もどって ちらばる（HP 1 で 止まる。b.killed に 入れて 経験値・落とし物は ふつう）
//   （設計に ない 足し物: だれも えらんで いない 時は 隊長の 受ける ダメージ autoK）
// ・自動の 仲間（酒場の 人・家族の 仲間・魔物の 仲間）は、人が えらんで いる 時だけ（someoneChooses）、その ならびで まだ だれも たのんで いない 時の
//   3回に 1回 たのむ（いちばん こわい 見えて いる カード。見えなければ 次に めくる カード）。完全オートは たのまない
//   バラバラン3号では、人が えらんで いる 時だけ、ロケットパンチで ねらわれたら 2回に 1回 身を 守る
// ・戦いは、人が えらぶ 間 ずっと 待つ 形（b.tellAll）。b.mechBoss も 立てる（shared/ai.js の mechBoss）
// ・人数の 数え方は 第2章 第1幕と おなじ（battle-c10a.js の peopleOf10。魔物の 仲間は 半人ぶん）。bare … 味方が みんな 家族の キャラで 2人・3人
import { MONSTERS } from './data/monsters.js?v=28060a38724e';
import { ABILITIES } from './data/abilities.js?v=28060a38724e';
import { C11C_HEAD, C11C_ARM, C11C_LEG, C11C_PARTS, C11C_ACE, C11C_GUARD, MECHA_NAME, ACE_SHORT } from './data/monsters-c11c.js?v=28060a38724e';
import { TANOMU, LAY, CARD_IDS, FIX, ROCKET } from './data/abilities-c11c.js?v=28060a38724e';
import { C11C_B as C11C } from './maps/c11c-flags.js?v=28060a38724e';
import { TERU as TERU_ID } from './data/abilities-c9b.js?v=28060a38724e';
import { canUse } from './ai.js?v=28060a38724e';
import { peopleOf10, someoneChooses } from './battle-c10a.js?v=28060a38724e';

export { TANOMU, LAY, CARD_IDS, FIX, ROCKET };
export const AUTO_EVERY = 3;
export const SUITS = ['comet', 'star', 'moon', 'sun'];
export const SUIT_NAME = { comet: 'ほうき星', star: '星', moon: '月', sun: '太陽' };
// こわい じゅん（たのむ カードを えらぶ 時）
export const DANGER = { comet: 4, moon: 3, star: 2, sun: 1 };
// 3人組（ホシドロ一味。前の 幕の 1号・2号と おなじ 3人）
export const TRIO = { boss: 'キラジョ', mecha: 'ボヤッチ', power: 'ズラッカ' };
// スピカの ごほうび「ふたりの光」
export const TWIN_HP = 0.25;
export const TWIN_LOW = 2;

const post = (ev) => (ev.postLines = ev.postLines || []);
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || {} : a?.effect || {});
const flag = (b, f) => {
  try {
    return !!b.hooks?.leaderFlag?.(f);
  } catch {
    return false;
  }
};
const few = (arr, b, d) => (Array.isArray(arr) ? arr[peopleOf10(b) - 1] ?? d : d);
// 仲間なしの 少ない パーティー（味方が みんな 家族の キャラで 2人か 3人。ゲストの スピカは 味方に 入らない）
export function bareOf(b) {
  const al = (b?.allies || []).filter((a) => a.kind !== 'guest');
  return al.length >= 2 && al.length <= 3 && al.every((a) => a.kind === 'player') ? al.length : 0;
}
const hide = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: false, configurable: true, writable: true });
const foesOfAlly = (b) => b.aliveAllies().filter((a) => a.kind !== 'guest');
// カードが かわった 時は 味方の「ねらわれ」の しるしも 新しく
const updAllies = (b, ev) => { for (const a of b.allies) ev.upd.push(a); };

// しかけの 数（人数で 合わせた もの）
export function c11cConf(species, b = null) {
  const c = MONSTERS[species]?.c11c || {};
  const f = c.few || {};
  const alone = b && b.allies.filter((a) => a.kind !== 'guest').length === 1 ? c.solo || {} : {};
  const n = bareOf(b);
  const bare = n && c.bare ? Object.fromEntries(Object.entries(c.bare).map(([k, v]) => [k, Array.isArray(v) ? v[n - 2] : v]).filter(([, v]) => v !== undefined)) : {};
  const pick = (k, d) => (alone[k] ?? bare[k] ?? (b ? few(f[k], b, d) : d));
  const mons = b && (b.allies || []).some((a) => a.kind === 'player') ? b.allies.filter((a) => a.kind === 'monster').length : 0;
  const out = {
    kind: c.kind, bare: n,
    hp: pick('hp', 1) * (1 + (c.monK?.hp || 0) * mons), atk: pick('atk', 1) * (1 + (c.monK?.atk || 0) * mons), spd: pick('spd', 1),
  };
  if (c.kind === 'mecha') {
    Object.assign(out, {
      role: c.role, hard: pick('hard', c.hard ?? 0.5), autoHard: c.autoHard ?? 1, autoHeal: c.autoHeal ?? 0, fix: pick('fix', c.fix ?? 3), autoFix: c.autoFix ?? c.fix ?? 3, fixHp: pick('fixHp', c.fixHp ?? 0.5),
      rocket: { every: 3, first: 2, mult: 1.75, guardCut: 0.45, ...(c.rocket || {}), every: pick('rocket', c.rocket?.every ?? 3), mult: pick('rocketMult', c.rocket?.mult ?? 1.75) },
    });
  }
  if (c.kind === 'ace') {
    Object.assign(out, {
      cards: pick('cards', c.cards ?? 3), plus: pick('plus', c.plus ?? 1), eats: c.eats ?? 1, open: pick('open', 0),
      comet: { mult: 2.6, guardCut: 0.35, ...(c.comet || {}), mult: pick('comet', c.comet?.mult ?? 2.6) },
      star: { base: [760, 800], guardCut: 0.5, ...(c.star || {}) },
      moon: { base: [260, 300], turns: 2, slow: 0.5, ...(c.moon || {}) },
      sun: { heal: 0.08, ...(c.sun || {}) },
      two: pick('two', c.two ?? 0.5), back: pick('back', c.back ?? 5), guards: pick('guards', 2),
      aoeK: c.aoeK ?? 1, aoeBoss: c.aoeBoss ?? 1, autoK: pick('autoK', c.autoK ?? 1),
    });
  }
  return out;
}
export const c11cState = (b) => b?.c11c || null;
export const partsOf = (b) => (b?.c11c?.kind === 'mecha' ? Object.values(b.c11c.ids).map((id) => b.get(id)).filter(Boolean) : []);
export const partOf = (b, role) => (b?.c11c?.kind === 'mecha' ? b.get(b.c11c.ids[role]) : null);
export const aceOf = (b) => (b?.c11c?.kind === 'ace' ? b.get(b.c11c.id) : null);
export const guardsOf = (b) => (b?.c11c?.kind === 'ace' ? b.c11c.guards.map((id) => b.get(id)).filter(Boolean) : []);
export const guardsUp = (b) => guardsOf(b).filter((e) => e.alive);
// のこって いる カード（まだ めくって いない・食べられて いない）
export const cardsLeft = (b) => (b?.c11c?.kind === 'ace' ? b.c11c.cards.filter((k) => !k.used && !k.eaten) : []);
export const nextCard = (b) => cardsLeft(b)[0] || null;
// この ならびで まだ たのめるか
export const canEat = (b) => { const st = b?.c11c; return !!st && st.kind === 'ace' && !st.won && st.eaten < st.eatMax && cardsLeft(b).length > 0; };
const queued = (b, id) => b.queue.some((q) => q.cmd?.id === id);
const teruOf = (b) => b.c9sp?.teru || null;
const teruReady = (b) => { const t = teruOf(b); return !!t && t.charge >= t.max; };
const litNow = (b) => (teruOf(b)?.lit || 0) > 0;

// ───────────── はじめ（battle-c9b.js の setupC9b から。setupC11b の あと）─────────────
// かえす 値: スピカを 出すか（メカ・隊長の 戦いは かならず。てらす・星のうたも）
export function setupC11c(b, lines) {
  // スピカの ごほうび（前の 幕の b.c11rew と おなじ 形）
  if (flag(b, C11C.act3)) b.c11rew = { ...(b.c11rew || {}), twin: true };
  const parts = b.enemies.filter((e) => MONSTERS[e.species]?.c11c?.kind === 'mecha');
  const ace = b.enemies.find((e) => e.species === C11C_ACE);
  if (!parts.length && !ace) return false;
  b.c9songOn = true;
  b.mechBoss = true;
  // 人が えらんで いる 間は、敵も 味方も 時間を 止める（前の 幕と おなじ）
  b.tellAll = true;
  for (const a of b.allies) hide(a, '_b11c', b);
  if (ace) setupAce(b, ace, lines);
  else setupMecha(b, parts, lines);
  b.tell = c11cTell(b);
  return true;
}
function scale(e, cf) {
  if (cf.hp !== 1) e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp * cf.hp));
  if (cf.atk !== 1) e.dmgRate = cf.atk;
  if (cf.spd !== 1) e.speed = (e.speed || 1) * cf.spd;
}

// ── バラバラン3号 ──
function setupMecha(b, parts, lines) {
  const ids = {};
  for (const e of parts) {
    const cf = c11cConf(e.species, b);
    scale(e, cf);
    hide(e, '_b11c', b);
    ids[cf.role] = e.id;
    e.c11m = { role: cf.role, dead: false, fresh: false };
  }
  const cf = c11cConf(C11C_HEAD, b);
  b.c11c = {
    kind: 'mecha', ids, won: false, acts: 0,
    fixLeft: cf.fix, fixReady: false, rocketLeft: cf.rocket.first, rocketReady: false, rocketAim: null,
    breaks: 0, fixes: 0, fixWarns: 0, rockets: 0, rocketGuards: 0, headFirst: null, order: [], autoGuards: 0,
  };
  lines.push(
    `${TRIO.boss}「オーッホッホ！アルゴルさまを、かえしなさーい！」`,
    `${TRIO.mecha}「ばらばらメカ、${MECHA_NAME}でまんねん！」`,
    `${TRIO.power}「…あたまも、うでも、あしも…ぜんぶ、強い…ぜ！」`,
    '（あたま・うで・あしは、べつべつにこわせる！こわした所のわざは、出なくなる。あたまは、こわれた所をなおしてしまう…！）',
  );
}

// ── 近衛の隊長エース ──
function setupAce(b, ace, lines) {
  const cf = c11cConf(C11C_ACE, b);
  scale(ace, cf);
  hide(ace, '_b11c', b);
  const gs = b.enemies.filter((e) => e.species === C11C_GUARD);
  const gcf = c11cConf(C11C_GUARD, b);
  b.c11c = {
    kind: 'ace', id: ace.id, guards: gs.map((e) => e.id), won: false, acts: 0,
    cards: [], set: 0, eaten: 0, eatMax: cf.eats, flipping: null,
    lays: 0, flips: 0, eats: 0, autoEats: 0, blindEats: 0, wasted: 0, comets: 0, cometHits: 0, cometGuards: 0, cometBig: 0,
    stars: 0, moons: 0, sleeps: 0, suns: 0, eatenBy: { comet: 0, star: 0, moon: 0, sun: 0 }, upEats: 0, tKills: 0, tBacks: 0, teruSets: 0,
  };
  gs.forEach((e, i) => {
    scale(e, { ...gcf, hp: cf.hp > 0 ? Math.min(1, cf.hp) : 1, atk: cf.atk });
    hide(e, '_b11c', b);
    e.c11g = { dead: false, left: 0, gone: i >= cf.guards };
    if (e.c11g.gone) Object.assign(e, { alive: false, hp: 0 });
  });
  for (const a of b.allies) {
    if (!a.abilities.includes(TANOMU)) a.abilities = [TANOMU, ...a.abilities];
  }
  lines.push(
    `${ACE_SHORT}「はかりの日に、はかられぬ者は、通さぬ。」`,
    `${ACE_SHORT}「わたしのカードは、先に見せておく。…よけられるものなら、よけてみよ。」`,
    'アルゴル「…あのカード、ぼくが食べてやる。どれにするか、決めて。」',
    '（隊長は、先にならべたカードを、じゅんにめくって使う！スピカの「てらす」でカードが見える。こわいカードは「アルゴルにたのむ」で食べてもらおう！）',
  );
}

// ───────────── 今 前ぶれ中か（battle-tell.js の b.tell。battle-c9b.js の c9bTell から）─────────────
// メカ: 'rocket' … ロケットパンチの 前ぶれ・'fix' … 直す 前ぶれ・'mecha' … いつも 待つ ／ 隊長: 'cards' … カードが 場に ある・'ace' … いつも 待つ
export function c11cTell(b) {
  const st = b?.c11c;
  if (!st || st.won) return null;
  if (st.kind === 'mecha') {
    if (!partsOf(b).some((e) => e.alive)) return null;
    if (st.rocketReady && partOf(b, 'arm')?.alive) return 'rocket';
    if (st.fixReady && partOf(b, 'head')?.alive) return 'fix';
    return 'mecha';
  }
  if (!aceOf(b)?.alive) return null;
  return cardsLeft(b).length ? 'cards' : 'ace';
}

// ───────────── 1回 動いた あと（battle-c9a.js の c9aAfter。味方・敵 どちらも）─────────────
export function c11cAfter(b, c, ev) {
  const st = b.c11c;
  if (!st || st.won || !c || b.pendingEnd || b.over) return;
  if (st.kind === 'mecha') return mechaAfter(b, c, ev);
  // てらした: 場の カードが みんな おもてに なる
  if (ev.c9bTeru) {
    const hid = cardsLeft(b).filter((k) => !k.up);
    for (const k of b.c11c.cards) k.up = true;
    if (hid.length) {
      st.teruSets++;
      post(ev).push(`スピカの光で、ならんだカードが、ぜんぶ見えた！（${cardsLeft(b).map((k) => SUIT_NAME[k.suit]).join('・')}）`);
    }
    ev.c11cCards = cardPub(b);
    const ace = aceOf(b);
    if (ace) ev.upd.push(ace);
    updAllies(b, ev);
  }
  // へいたい: たおれた（もどるのは 隊長が back 回 動いた あと … aceTurn の guardBack）
  for (const e of guardsOf(b)) {
    const s = e.c11g;
    if (s.gone || e.alive || s.dead) continue;
    s.dead = true;
    s.left = c11cConf(C11C_ACE, b).back;
    st.tKills++;
    post(ev).push(`${e.name}は、ひらりと、1まいのカードにもどった…。${guardsUp(b).length ? '' : '（へいたいがいない！カードが1まい少なくなる！）'}`);
    ev.c11cOut = { id: e.id, left: guardsUp(b).length };
  }
}

// ── メカ: こわれた 体 ──
function mechaAfter(b, c, ev) {
  const st = b.c11c;
  for (const e of partsOf(b)) {
    const s = e.c11m;
    if (e.alive || s.dead) continue;
    s.dead = true;
    st.breaks++;
    st.order.push(s.role);
    if (st.headFirst === null) st.headFirst = s.role === 'head';
    if (s.role === 'arm') { st.rocketReady = false; st.rocketAim = null; }
    if (s.role === 'head') st.fixReady = false;
    if (partsOf(b).every((x) => !x.alive)) {
      st.won = true;
      post(ev).push(
        `${MECHA_NAME}は、ガラガラガッシャーン！と、ばらばらになった！`,
        `${TRIO.boss}「ちょっとー！また、こわれちゃったじゃないのよー！」`,
        `${TRIO.mecha}「4号は、もっとじょうぶに作りまっせ〜」`,
        `${TRIO.power}「…おぼえてろ…ぜ〜！」`,
      );
      ev.c11cMechaDown = { id: e.id };
      return;
    }
    const say = {
      head: [`${TRIO.mecha}「あたまが、こわれたでまんねん〜！もう、なおせないでっせ！」`, '（もう、こわれた所はなおらない！）'],
      arm: [`${TRIO.power}「…うでが…とれた…ぜ〜！」`, '（ロケットパンチが、出なくなった！）'],
      leg: [`${TRIO.boss}「あしが、ぽろっと…！もう、じだんだがふめないじゃないの！」`, '（じだんだが、出なくなった！）'],
    }[s.role];
    post(ev).push(...say);
    if (s.role !== 'head' && partOf(b, 'head')?.alive) post(ev).push(`${TRIO.mecha}「でも、あたまがあれば、なおせまっせ〜！」`);
    ev.c11cBreak = { id: e.id, role: s.role };
    ev.warn = true;
  }
}

// ───────────── 行動の はじめ（battle-c9b.js の c9bTurnStart から。敵の 番だけ）─────────────
export function c11cTurnStart(b, c, ev, stuck) {
  const st = b.c11c;
  if (!st || c.side === 'ally' || st.won || c.telegraph) return;
  if (st.kind === 'mecha') {
    if (!c.c11m) return;
    return mechaTurn(b, c, ev, stuck);
  }
  if (c.id === st.id) return aceTurn(b, c, ev, stuck);
}
function mechaTurn(b, c, ev, stuck) {
  const st = b.c11c;
  const cf = c11cConf(c.species, b);
  st.acts++;
  ev.upd.push(c);
  if (c.c11m.role === 'head') {
    // だれも えらんで いない 時は、あたまが 番ごとに 自分を 少し 直す（autoHeal … 設計に ない 足し物）
    if (!someoneChooses(b) && cf.autoHeal > 0 && c.hp < c.maxHp) {
      const h = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * cf.autoHeal));
      c.hp += h;
      st.autoHeals = (st.autoHeals || 0) + h;
    }
    if (st.fixReady) {
      if (!stuck) c.telegraph = FIX;
      return;
    }
    if (stuck) return;
    st.fixLeft--;
    if (st.fixLeft > 0) return;
    // だれも えらんで いない（完全オート・人が みんな たおれた）時は、直すのが 早い（autoFix … 設計に ない 足し物）
    st.fixLeft = someoneChooses(b) ? cf.fix : Math.min(cf.fix, cf.autoFix);
    const broken = partsOf(b).filter((e) => !e.alive && e.c11m.dead);
    if (!broken.length) return;
    st.fixReady = true;
    st.fixWarns++;
    ev.lines.push(`${TRIO.mecha}「おっと、こわれた所を、なおしまっせ〜！」`, `${c.name}から、ねじとスパナが、にょきっと出てきた…！`, `（次に、こわれた${broken.map((e) => ROLE_NAME[e.c11m.role]).join('と')}がなおってしまう！あたまをこわせば、なおせない！）`);
    ev.c11cFixUp = { id: c.id, broken: broken.map((e) => e.c11m.role) };
    ev.warn = true;
    return;
  }
  if (c.c11m.role === 'arm') {
    if (st.rocketReady) {
      if (!stuck) c.telegraph = ROCKET;
      return;
    }
    if (stuck) return;
    st.rocketLeft--;
    if (st.rocketLeft > 0) return;
    st.rocketLeft = cf.rocket.every;
    const t = pickAim(b);
    if (!t) return;
    st.rocketReady = true;
    st.rocketAim = t.id;
    ev.lines.push(`${c.name}が、ぐるぐるぐる…と、回りはじめた！`, `${TRIO.power}「…ねらいは…${t.name}…ぜ！」`, `（次に、${t.name}にロケットパンチが来る！「防御」で身を守ろう！）`);
    ev.c11cRocketUp = { id: c.id, aim: t.id };
    ev.warn = true;
    ev.upd.push(t);
  }
}
const ROLE_NAME = { head: 'あたま', arm: 'うで', leg: 'あし' };
export { ROLE_NAME };
function pickAim(b) {
  const al = foesOfAlly(b);
  if (!al.length) return null;
  return b.rng.pick(al);
}

// ── 隊長: カードを ならべる・めくる・へいたいが もどる ──
function aceTurn(b, c, ev, stuck) {
  const st = b.c11c;
  st.acts++;
  ev.upd.push(c);
  guardBack(b, ev);
  if (stuck) return;
  const k = nextCard(b);
  if (k) {
    st.flipping = k;
    c.telegraph = CARD_IDS[k.suit];
    return;
  }
  c.telegraph = LAY;
}
function guardBack(b, ev) {
  const st = b.c11c;
  for (const e of guardsOf(b)) {
    const s = e.c11g;
    if (s.gone || e.alive || !s.dead) continue;
    s.left--;
    if (s.left === 1) {
      ev.lines.push('ちらばったカードが、また、へいたいの形にならびはじめた…。');
      ev.c11cBackSoon = { id: e.id };
      continue;
    }
    if (s.left > 0) continue;
    Object.assign(e, { alive: true, hp: e.maxHp, status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false, telegraph: null });
    s.dead = false;
    s.left = 0;
    st.tBacks++;
    // 経験値は 1回ぶんだけ
    const i = b.killed.lastIndexOf(e.species);
    if (i >= 0) b.killed.splice(i, 1);
    ev.lines.push(`${e.name}が、カードから、また立ち上がった！（隊長のカードが、また1まいふえる…）`);
    ev.c11cBack = { id: e.id };
    ev.warn = true;
    ev.upd.push(e);
  }
}

// ───────────── 技の こうか（battle-c9b.js の c9bEffect の のこり）─────────────
export function c11cEffect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'c11cFix': fixPart(b, c, ev); return true;
    case 'c11cRocket': rocket(b, c, ev); return true;
    case 'c11cLay': lay(b, c, ev); return true;
    case 'c11cCard': card(b, c, eff, ev); return true;
    case 'c11cEat': eat(b, c, ev); return true;
    case 'c11cSalute': {
      ev.lines.push(`${c.name}「隊長どの！」`);
      ev.c11cSalute = { id: c.id };
      return true;
    }
    default: return false;
  }
}
// あたま: こわれた 体を 直す
function fixPart(b, c, ev) {
  const st = b.c11c;
  if (!st || st.kind !== 'mecha') return;
  st.fixReady = false;
  const cf = c11cConf(C11C_HEAD, b);
  const broken = partsOf(b).filter((e) => !e.alive && e.c11m.dead);
  if (!broken.length) {
    ev.lines.push(`${TRIO.mecha}「…あれ？なおす所が、ないでまんねん。」`);
    return;
  }
  ev.fx = { type: 'ability', anim: 'c11h_fix', actor: c.id, targets: broken.map((e) => e.id), side: 'enemy' };
  for (const e of broken) {
    Object.assign(e, { alive: true, hp: Math.max(1, Math.round(e.maxHp * cf.fixHp)), status: {}, buffs: {}, debuffs: {}, atb: 0, ready: false, queued: false, telegraph: null });
    e.c11m.dead = false;
    st.fixes++;
    // 経験値は 1回ぶんだけ
    const i = b.killed.lastIndexOf(e.species);
    if (i >= 0) b.killed.splice(i, 1);
    if (e.c11m.role === 'arm') st.rocketLeft = c11cConf(C11C_ARM, b).rocket.first;
    ev.upd.push(e);
  }
  ev.lines.push(`トンテンカン！${broken.map((e) => ROLE_NAME[e.c11m.role]).join('と')}が、なおってしまった！`, `${TRIO.boss}「オーッホッホ！なんどでも、なおすわよ！」`);
  ev.c11cFix = { id: c.id, fixed: broken.map((e) => e.id) };
  ev.warn = true;
}
// うで: ロケットパンチ（ねらった 1人。身を 守ると へる）
function rocket(b, c, ev) {
  const st = b.c11c;
  if (!st || st.kind !== 'mecha') return;
  const cf = c11cConf(C11C_ARM, b);
  st.rocketReady = false;
  let t = b.get(st.rocketAim);
  st.rocketAim = null;
  if (!t?.alive) t = pickAim(b);
  if (!t) return;
  st.rockets++;
  const guard = !!t.defending;
  if (guard) st.rocketGuards++;
  ev.fx = { type: 'ability', anim: 'c11r_rocket', actor: c.id, targets: [t.id], side: 'enemy' };
  b.physHit(c, t, { mult: cf.rocket.mult * (guard ? cf.rocket.guardCut : 1), acc: 9 }, ev, 'phys');
  if (guard) post(ev).push(`${t.name}は、身を守って、こらえた！`);
  ev.c11cRocket = { id: c.id, to: t.id, guard };
  ev.warn = true;
  ev.upd.push(c);
}

// 隊長: カードを ならべる
function lay(b, c, ev) {
  const st = b.c11c;
  if (!st || st.kind !== 'ace') return;
  const cf = c11cConf(C11C_ACE, b);
  const n = Math.max(1, cf.cards + (guardsUp(b).length ? cf.plus : 0));
  // はじめの 1まいは ほうき星。のこりは 星・月・太陽（HPが 半分を 切ると、two の わりあいで ほうき星が もう 1まい）
  const suits = ['comet'];
  const pool = ['star', 'star', 'moon', 'moon', 'sun'];
  for (let i = 1; i < n; i++) suits.push(b.rng.pick(pool));
  if (n >= 2 && c.hp <= c.maxHp * 0.5 && b.rng.chance(cf.two)) suits[1] = 'comet';
  // ならびを まぜる
  for (let i = suits.length - 1; i > 0; i--) {
    const j = b.rng.int(0, i);
    [suits[i], suits[j]] = [suits[j], suits[i]];
  }
  // てらして いる 間・ひとりの 時（open … アルゴルが のぞいて 教えて くれる）は おもて。
  // 戦いの はじめの 1回めの ならびも おもて（first … てらすの ゲージが まだ ない ので、アルゴルが のぞく。2回めからは うら向き）
  const first = st.lays === 0 && !cf.open && !litNow(b);
  const up = litNow(b) || !!cf.open || first;
  st.set++;
  st.lays++;
  st.eaten = 0;
  st.cards = suits.map((suit, i) => ({ no: i, suit, up, eaten: false, used: false, aim: suit === 'comet' ? pickAim(b)?.id ?? null : null }));
  ev.fx = { type: 'ability', anim: 'c11e_lay', actor: c.id, targets: [c.id], side: 'enemy' };
  ev.lines.push(`${c.name}は、カードを${n}まい、しゅっしゅっと、ならべた。`);
  if (first) post(ev).push(`アルゴル「…さいしょのカードは、のぞいてきた。${suits.map((s) => SUIT_NAME[s]).join('と')}だ。」`, '（次からのカードは、うら向き。スピカの「てらす」で見よう！）');
  else if (up && !litNow(b)) post(ev).push(`アルゴル「…のぞいてきた。${suits.map((s) => SUIT_NAME[s]).join('と')}だ。」`);
  else if (up) post(ev).push(`スピカの光で、カードが見えている！（${suits.map((s) => SUIT_NAME[s]).join('・')}）`);
  else post(ev).push('（カードは、うら向き…。スピカの「てらす」で見える！）');
  ev.c11cLay = { id: c.id, n, up };
  ev.c11cCards = cardPub(b);
  updAllies(b, ev);
  ev.warn = true;
}
// 隊長: カードを めくって 使う
function card(b, c, eff, ev) {
  const st = b.c11c;
  if (!st || st.kind !== 'ace') return;
  const cf = c11cConf(C11C_ACE, b);
  const k = st.flipping && !st.flipping.used && !st.flipping.eaten ? st.flipping : nextCard(b);
  st.flipping = null;
  if (!k) {
    ev.lines.push('しかし、何も起こらなかった。');
    return;
  }
  k.used = true;
  k.up = true;
  st.flips++;
  const suit = k.suit;
  ev.lines.length = 0;
  ev.lines.push(`${c.name}は、カードをめくった！…${SUIT_NAME[suit]}のカードだ！`);
  ev.c11cFlip = { id: c.id, suit, no: k.no };
  if (suit === 'comet') {
    st.comets++;
    let t = b.get(k.aim);
    if (!t?.alive) t = pickAim(b);
    if (!t) return;
    const guard = !!t.defending;
    if (guard) st.cometGuards++;
    ev.fx = { type: 'ability', anim: 'c11e_comet', actor: c.id, targets: [t.id], side: 'enemy' };
    ev.lines.push(`大きなほうき星が、${t.name}にむかって、ふってきた！`);
    const hp0 = t.hp;
    b.physHit(c, t, { mult: cf.comet.mult * (guard ? cf.comet.guardCut : 1), acc: 9 }, ev, 'phys');
    st.cometHits++;
    if (hp0 - Math.max(0, t.hp) >= t.maxHp * 0.6) st.cometBig++;
    if (guard) post(ev).push(`${t.name}は、身を守って、こらえた！`);
    ev.c11cFlip.to = t.id;
    ev.c11cFlip.guard = guard;
  } else if (suit === 'star') {
    st.stars++;
    const ts = b.aliveAllies();
    ev.fx = { type: 'ability', anim: 'c11e_star', actor: c.id, targets: ts.map((x) => x.id), side: 'enemy', element: 'light' };
    ev.lines.push('星が、ざあっと、ふりそそいだ！');
    for (const t of ts) {
      const r = b.calcMagic(c, t, { base: cf.star.base, thr: 99, element: 'light' }, 1);
      if (r.dmg > 0 && !r.resisted) b.damage(c, t, Math.max(1, Math.round(r.dmg * (t.defending ? cf.star.guardCut : 1))), ev, { element: 'light' });
    }
  } else if (suit === 'moon') {
    st.moons++;
    const ts = b.aliveAllies();
    ev.fx = { type: 'ability', anim: 'c11e_moon', actor: c.id, targets: ts.map((x) => x.id), side: 'enemy', element: 'dark' };
    ev.lines.push('しずかな月の光が、あたりをつつんだ…。');
    for (const t of ts) {
      const r = b.calcMagic(c, t, { base: cf.moon.base, thr: 99, element: 'dark' }, 1);
      if (r.dmg > 0 && !r.resisted) b.damage(c, t, Math.round(r.dmg), ev, { element: 'dark' });
    }
    const alone = foesOfAlly(b).length <= 1 && b.allies.filter((a) => a.kind !== 'guest').length === 1;
    const slept = [];
    const kept = [];
    for (const t of b.aliveAllies()) {
      if (t.kind === 'guest') continue;
      if (t.defending) { kept.push(t); continue; }
      if (alone) {
        // ひとりの 時は ねむらず、動きが おそく なる（行動ゲージが へる）
        t.atb = Math.round((t.atb || 0) * (1 - cf.moon.slow));
        if (t.ready) { t.ready = false; t.atb = 0; }
        slept.push(t);
        continue;
      }
      const res = t.resist?.sleep ?? 1;
      if (t.status.sleep || !b.rng.chance(Math.min(1, 0.95 * res))) continue;
      t.status.sleep = { turns: cf.moon.turns };
      if (t.ready) { t.ready = false; t.atb = 0; }
      slept.push(t);
      ev.upd.push(t);
    }
    st.sleeps += slept.length;
    if (slept.length) post(ev).push(alone ? `${slept[0].name}は、月の光で、動きがのろくなった…。` : `${slept.map((x) => x.name).join('と')}は、ねむってしまった…。`);
    if (kept.length) post(ev).push(`${kept.map((x) => x.name).join('と')}は、身を守って、ねむらなかった！`);
    ev.c11cFlip.slept = slept.map((x) => x.id);
  } else if (suit === 'sun') {
    st.suns++;
    const us = [c, ...guardsUp(b)];
    ev.fx = { type: 'ability', anim: 'c11e_sun', actor: c.id, targets: us.map((x) => x.id), side: 'enemy' };
    ev.lines.push('まぶしい太陽の光が、隊長とへいたいをてらした！');
    ev.results = ev.results || [];
    for (const u of us) {
      const h = Math.min(u.maxHp - u.hp, u === c ? Math.round(u.maxHp * cf.sun.heal) : u.maxHp);
      if (h <= 0) continue;
      u.hp += h;
      ev.results.push({ id: u.id, heal: h });
      ev.upd.push(u);
    }
    ev.lines.push(`${c.name}たちのHPが回復した！`);
  }
  if (!cardsLeft(b).length) post(ev).push('（カードを、ぜんぶ使った。次は、また新しくならべる…）');
  ev.c11cCards = cardPub(b);
  updAllies(b, ev);
  ev.warn = true;
  ev.upd.push(c);
}
// アルゴルにたのむ（だれでも。ねらいは cmd.choice … カードの 番号。ない 時は 次に めくる カード）
function eat(b, c, ev) {
  const st = b.c11c;
  ev.lines.length = 0;
  const ace = aceOf(b);
  if (ace) ev.upd.push(ace);
  ev.fx = { type: 'ability', anim: 'c11c_eat', actor: c.id, targets: [c.id], side: 'ally' };
  ev.lines.push(`${c.name}「アルゴル、おねがい！」`);
  if (!st || st.kind !== 'ace' || st.won) {
    ev.lines.push('しかし、何も起こらなかった。');
    ev.c11cEat = { id: c.id, ok: false };
    return;
  }
  if (!cardsLeft(b).length) {
    st.wasted++;
    ev.lines.push('アルゴル「…場に、カードがないよ。」');
    ev.c11cEat = { id: c.id, ok: false, why: 'none' };
    return;
  }
  if (st.eaten >= st.eatMax) {
    st.wasted++;
    ev.lines.push('アルゴル「…もう、おなかいっぱいだ。次のカードまで、まって。」');
    ev.c11cEat = { id: c.id, ok: false, why: 'full' };
    return;
  }
  const ch = b.curCmd?.choice;
  const k = (Number.isInteger(ch) ? st.cards.find((x) => x.no === ch && !x.used && !x.eaten) : null) || nextCard(b);
  const wasUp = k.up;
  k.eaten = true;
  k.up = true;
  st.eaten++;
  st.eats++;
  st.eatenBy[k.suit]++;
  if (wasUp) st.upEats++;
  if (c.kind !== 'player') st.autoEats++;
  ev.lines.push(`アルゴル「…まかせて。」`, `アルゴルが、${SUIT_NAME[k.suit]}のカードを、ぱくっと食べた！（そのわざは、出ない！）`);
  if (k.suit === 'comet') ev.lines.push('アルゴル「…にがい。でも、へいき。」');
  ev.c11cEat = { id: c.id, ok: true, no: k.no, suit: k.suit };
  ev.c11cCards = cardPub(b);
  updAllies(b, ev);
}

// ───────────── ダメージ（battle-c9b.js の c9bDamage の さいご。味方 → 敵）─────────────
export function c11cDamage(b, c, t, dmg, info, ev) {
  if (!(dmg > 0) || c?.side !== 'ally' || t?.side !== 'enemy') return dmg;
  const st = b.c11c;
  if (!st || st.won) return dmg;
  const wide = (ev?.fx?.targets?.length || 0) > 1;
  if (st.kind === 'mecha') {
    if (!t.c11m || t.c11m.role !== 'head') return dmg;
    const cf = c11cConf(C11C_HEAD, b);
    // あたまは かたい（だれも えらんで いない 時は もっと … autoHard）
    let k = cf.hard;
    if (!someoneChooses(b)) k *= cf.autoHard;
    dmg = Math.max(1, Math.round(dmg * k));
    if (ev && !ev.c11cHard) {
      ev.c11cHard = true;
      post(ev).push('（あたまは、とてもかたい…！）');
    }
    return dmg;
  }
  const cf = c11cConf(C11C_ACE, b);
  // へいたいは 全体の 技（いちどに 2体 いじょうを ねらう こうげき）を 受けにくい（aoeK）
  if (t.c11g) {
    if (wide && cf.aoeK < 1) {
      dmg = Math.max(1, Math.round(dmg * cf.aoeK));
      if (ev && !ev.c11cAoe) {
        ev.c11cAoe = true;
        post(ev).push('（へいたいは、カードのたてで、ひらりとかわした…！1体ずつねらおう）');
      }
    }
    return dmg;
  }
  if (t.id !== st.id) return dmg;
  if (wide && cf.aoeBoss < 1) dmg = Math.max(1, Math.round(dmg * cf.aoeBoss));
  // だれも えらんで いない（完全オート・人が みんな たおれた）時は、隊長が もっと かたい（autoK。設計に ない 足し物）
  if (!someoneChooses(b)) dmg = Math.max(1, Math.round(dmg * cf.autoK));
  // 隊長は たおれない（HP 1 で 止まる → カードに もどって ちらばる）
  if (dmg >= t.hp) {
    dmg = Math.max(0, t.hp - 1);
    aceDown(b, t, ev);
  }
  return dmg;
}
function aceDown(b, c, ev) {
  const st = b.c11c;
  st.won = true;
  st.flipping = null;
  c.telegraph = null;
  b.killed.push(c.species);
  for (const e of guardsUp(b)) e.telegraph = null;
  if (ev) {
    post(ev).push(
      `${ACE_SHORT}「……みごと。」`,
      `${ACE_SHORT}「はかりの日に…これほどの光を、見るとは。」`,
      `${c.name}のよろいが、ぱらぱらと、たくさんのカードにもどって…風に、ちらばっていった。`,
    );
    ev.c11cDown = { id: c.id };
    ev.upd.push(c);
  }
  b.pendingEnd = { outcome: 'win' };
  b.queue = [];
}

// ───────────── スピカの ごほうび「ふたりの光」（battle-c9a.js の glow から。ほのかな光の あと）─────────────
export function c11cGlowTwin(b, ev) {
  if (!b?.c11rew?.twin || !b.c9sp || b.pendingEnd || b.over || b.c9sp.twin) return null;
  const al = foesOfAlly(b);
  if (!al.length) return null;
  const low = al.filter((a) => a.hp < a.maxHp * 0.5);
  const solo = b.allies.filter((a) => a.kind !== 'guest').length === 1;
  if (low.length < (solo ? 1 : TWIN_LOW)) return null;
  b.c9sp.twin = true;
  const lines = post(ev);
  lines.push('スピカ「…いっしょに！」', 'スピカの光と、遠くの小さな光が、ひとつにかさなった！「ふたりの光」！');
  ev.results = ev.results || [];
  const healed = [];
  for (const a of al) {
    const h = Math.min(a.maxHp - a.hp, Math.max(1, Math.round(a.maxHp * TWIN_HP)));
    if (h <= 0) continue;
    a.hp += h;
    ev.results.push({ id: a.id, heal: h });
    ev.upd.push(a);
    healed.push(a.id);
  }
  lines.push('みんなのHPが回復した！');
  ev.c11cTwin = { healed };
  return ev.c11cTwin;
}

// ───────────── オート（battle-c9b.js の c9bPlan の はじめ）─────────────
// この 幕の 戦いで なければ undefined。ふつうの オートは null
export function c11cPlan(b, c, decide, bestHit) {
  const st = b.c11c;
  if (!st) return undefined;
  if (c.side !== 'ally' || b.c9Inner || c.status?.rift || st.won) return null;
  const mode = c.knows9 ?? b.knowsCh9;
  if (st.kind === 'mecha') return partsOf(b).some((e) => e.alive) ? mechaPlan(b, c, decide, bestHit, mode) : null;
  return acePlan(b, c, decide, bestHit, mode);
}
function base(b, c, decide) {
  b.c9Inner = true;
  try {
    return decide(b, c);
  } finally {
    b.c9Inner = false;
  }
}
const isCare = (a) => a && ['heal', 'revive', 'reviveAll'].includes(prim(a).type);
// ねらいを かえる（1体を ねらう 技・戦う は ねらいを t に。全体の 技は そのまま）
function aimAt(b, c, cmd, t, bestHit) {
  const a = cmd?.type === 'ability' ? ABILITIES[cmd.id] : null;
  if (isCare(a) || cmd?.type === 'defend' || cmd?.type === 'item') return cmd;
  if (!t) return cmd;
  if (cmd?.type === 'attack') return { type: 'attack', target: t.id };
  if (a && a.target === 'enemy') return bestHit(b, c, t) || { ...cmd, target: t.id };
  if (a && ['enemies', 'group'].includes(a.target)) return cmd;
  return bestHit(b, c, t) || cmd;
}
// メカの 人: ロケットパンチで ねらわれたら 防御・ねらいは あたま → うで → あし（かたい あたまから）
export function mechaTarget(b) {
  for (const r of ['head', 'arm', 'leg']) {
    const e = partOf(b, r);
    if (e?.alive) return e;
  }
  return null;
}
function mechaPlan(b, c, decide, bestHit, mode) {
  const st = b.c11c;
  const aimed = st.rocketReady && st.rocketAim === c.id && partOf(b, 'arm')?.alive && !c.defending;
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、ねらわれたら 2回に 1回 身を 守る（完全オートは 守らない）
    if (c.kind === 'player' || !aimed || !someoneChooses(b)) return null;
    b.c11cAuto = (b.c11cAuto || 0) + 1;
    if (b.c11cAuto % 2) return null;
    st.autoGuards++;
    return { type: 'defend' };
  }
  if (mode === 'blind') {
    if (aimed && b.rng.chance(0.2)) return { type: 'defend' };
    return null;
  }
  // 知って いる 人
  if (aimed) return { type: 'defend' };
  const cmd = base(b, c, decide);
  return aimAt(b, c, cmd, mechaTarget(b), bestHit);
}
// たのむ カード（見えて いる いちばん こわい カード。見えなければ 次に めくる カード）
export function eatPick(b) {
  const left = cardsLeft(b);
  if (!left.length) return null;
  const up = left.filter((k) => k.up).sort((x, y) => DANGER[y.suit] - DANGER[x.suit] || x.no - y.no);
  if (up.length && DANGER[up[0].suit] >= DANGER.moon) return up[0];
  const hid = left.find((k) => !k.up);
  return hid || up[0];
}
// 隊長の 戦いの 人: しくみの 役
function acePlan(b, c, decide, bestHit, mode) {
  const st = b.c11c;
  const canAsk = canUse(b, c, TANOMU) && canEat(b) && !queued(b, TANOMU);
  if (mode !== 'know' && mode !== 'blind') {
    // 自動の 仲間: 人が えらんで いる 時だけ、まだ だれも たのんで いない ならびの 3回に 1回 たのむ（数は 自動の 仲間 みんなで 1つ）
    if (c.kind === 'player' || !canAsk || !someoneChooses(b)) return null;
    b.c11cAuto = (b.c11cAuto || 0) + 1;
    if (b.c11cAuto % AUTO_EVERY) return null;
    const k = eatPick(b);
    return k ? { type: 'ability', id: TANOMU, choice: k.no } : null;
  }
  if (mode === 'blind') {
    // 知らない 人: たまに 次の カードを たのむ
    if (canAsk && b.rng.chance(0.15)) { st.blindEats++; return { type: 'ability', id: TANOMU, choice: nextCard(b).no }; }
    return null;
  }
  // 知って いる 人
  const left = cardsLeft(b);
  if (canAsk) {
    const up = left.filter((k) => k.up && DANGER[k.suit] >= DANGER.moon).sort((x, y) => DANGER[y.suit] - DANGER[x.suit] || x.no - y.no);
    if (up.length) return { type: 'ability', id: TANOMU, choice: up[0].no };
    const hidden = left.filter((k) => !k.up);
    // うら向きが 3まい いじょう … てらして 見る（2まい いかなら、てらす 間に めくられる ので、次の カードを たのむ）
    if (hidden.length >= 3 && teruReady(b) && !litNow(b) && canUse(b, c, TERU_ID) && !queued(b, TERU_ID)) return { type: 'ability', id: TERU_ID };
    // てらせない: 見えない まま、次に めくる カードを たのむ（ほうき星が 入って いる かも）
    if (hidden.length && !queued(b, TERU_ID) && left.every((k) => !k.up || DANGER[k.suit] < DANGER.moon)) {
      const k = left.find((x) => !x.up);
      if (k) return { type: 'ability', id: TANOMU, choice: k.no };
    }
  }
  // 次の カードが 見えて いて、自分に ほうき星 か 月 … 身を 守る
  const nx = nextCard(b);
  if (nx?.up && !c.defending && ((nx.suit === 'comet' && nx.aim === c.id) || nx.suit === 'moon')) return { type: 'defend' };
  const cmd = base(b, c, decide);
  // ねらい: へいたいが いれば へいたい（HPの 少ない 方）・いなければ 隊長
  const up = guardsUp(b).sort((x, y) => x.hp - y.hp);
  const ace = aceOf(b);
  return aimAt(b, c, cmd, up[0] || (ace?.alive ? ace : null), bestHit);
}
// しくみの 用が ある 間（シミュレーターの 知って いる 人は 合体技を しない）
export function c11cBusy(b) {
  const st = b.c11c;
  if (!st || st.won) return false;
  if (st.kind === 'mecha') return (st.rocketReady && !!partOf(b, 'arm')?.alive) || (st.fixReady && !!partOf(b, 'head')?.alive);
  return canEat(b) || guardsUp(b).length > 0;
}

// ───────────── がめんへ（battle-c9b.js の c9bPub から。敵）─────────────
// カードの ならび（うら向きの カードの マークは 出さない）: [{ no, s（マーク。うら向きは null）, up, eaten, used, next, aim（ほうき星の ねらい。おもての 時だけ）}]
export function cardPub(b) {
  const st = b?.c11c;
  if (!st || st.kind !== 'ace') return [];
  const nx = nextCard(b);
  return st.cards.map((k) => ({ no: k.no, s: k.up ? k.suit : null, up: k.up ? 1 : 0, eaten: k.eaten ? 1 : 0, used: k.used ? 1 : 0, next: nx === k ? 1 : 0, aim: k.up && k.aim ? k.aim : null }));
}
// メカの 体: c11cKind 'part'・role11c・fix11c（直す 前ぶれ。あたま）・rocket11c（ロケットパンチの ねらいの id。うで）・mechaStage（曲 1 ふつう・2 前ぶれ・3 のこり 1つ・4 勝った）
// 隊長: c11cKind 'ace'・cards11c（cardPub）・eatOk11c（今 たのめるか）・guards11c（いる へいたいの 数）・c11cDown・aceStage（曲 1 ふつう・2 カードが 場に ある・3 次が ほうき星〈見えて いる〉・4 勝った）
// へいたい: c11cKind 'guard'・back11c（もどるまで あと いくつ）・gone11c
export function c11cPub(c, b = c?._b11c) {
  const o = {};
  const st = b?.c11c;
  if (!st) return o;
  if (st.kind === 'mecha' && c.c11m) {
    o.c11cKind = 'part';
    o.role11c = c.c11m.role;
    if (c.c11m.role === 'head') o.fix11c = st.fixReady ? 1 : 0;
    if (c.c11m.role === 'arm') o.rocket11c = st.rocketReady ? st.rocketAim : null;
    const up = partsOf(b).filter((e) => e.alive).length;
    o.mechaStage = st.won || !up ? 4 : st.rocketReady || st.fixReady ? 2 : up === 1 ? 3 : 1;
    return o;
  }
  if (st.kind !== 'ace') return o;
  if (c.id === st.id) {
    o.c11cKind = 'ace';
    o.cards11c = cardPub(b);
    o.eatOk11c = canEat(b) ? 1 : 0;
    o.guards11c = guardsUp(b).length;
    o.c11cDown = st.won ? 1 : 0;
    const nx = nextCard(b);
    o.aceStage = st.won ? 4 : nx?.up && nx.suit === 'comet' ? 3 : cardsLeft(b).length ? 2 : 1;
    return o;
  }
  if (c.c11g) {
    o.c11cKind = 'guard';
    o.back11c = !c.alive && c.c11g.dead && !c.c11g.gone ? c.c11g.left : 0;
    o.gone11c = c.c11g.gone ? 1 : 0;
  }
  return o;
}
// 味方（battle-c9a.js の c9aPub から）: eat11c（アルゴルにたのむ が ある 戦い）・aimed11c（ロケットパンチ・ほうき星で ねらわれて いる）
export function c11cAllyPub(c, b = c?._b11c) {
  const o = {};
  const st = b?.c11c;
  if (!st) return o;
  if (st.kind === 'ace') {
    o.eat11c = 1;
    const nx = nextCard(b);
    o.aimed11c = cardsLeft(b).some((k) => k.up && k.suit === 'comet' && k.aim === c.id) ? (nx?.aim === c.id ? 2 : 1) : 0;
    return o;
  }
  o.aimed11c = st.rocketReady && st.rocketAim === c.id ? 2 : 0;
  return o;
}
void C11C_LEG;
void C11C_PARTS;
