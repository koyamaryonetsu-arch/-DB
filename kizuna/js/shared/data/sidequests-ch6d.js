// 第6章 Step 6（A: 世界と物語）の より道「リオンの剣のけいこ」（plan-ch6.md の 13-5・16・17）。c6_clear の あとから。ひとりでも 家族でも
// ・千年前の 泉の里の リオン（rion_spar。maps/tokei-high.js）に 話すと はじまる → けいこ試合 3回（rion_spar1〜3。B。だんだん 強い・1人で 戦う・負けても よい）
// ・勝つと、話しかけた 人の 職業の、まだ 覚えていない ひらめき技の ヒント（その 技の もとの 技を 使った 回数を、ひらめける 少し 先まで ふやす
//   ＝ つぎに その 技を 使うと ひらめきやすい）。家族のけいじ板の ひらめき技の 知らせに のせる（world.boardPost。kind: 'hirameki'）
// ・すすみぐあいの フラグは ものがたりの もちぬし（リーダー）。戦うのは 話しかけた 人だけ（仲間・ゲスト・家族は 入らない）
// sidequests-ch6.js の ch6SubQuests・ch6DoneQuests・applyCh6Side と、story-ch6d.js の applyCh6d から まぜる
import { HIRAMEKI } from './hirameki.js?v=a5c15ff5e061';
import { ABILITIES } from './abilities.js?v=a5c15ff5e061';
import { learnedAbilities, hiraAllowed, hiraProgress } from '../stats.js?v=a5c15ff5e061';
import { abilityLabel } from '../ability-label.js?v=a5c15ff5e061';
import { hiraHowText } from '../world/family-board.js?v=a5c15ff5e061';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const RS = {
  start: 'c6_rs_start', // リオンに たのまれた
  win: (k) => `c6_rs_win${k}`, // k 回目の けいこ試合に 勝った
  done: 'c6_rs_done', // 3回 勝った
};
export const SPARS = ['rion_spar1', 'rion_spar2', 'rion_spar3'];
export const SPAR_OPEN = 'c6_clear';
const wins = (f) => SPARS.filter((_, i) => f(RS.win(i + 1))).length;

// ───── ひらめき技の ヒント ─────
// その 人の 職業で ひらめける（掛け合わせ技 では ない）まだ 覚えていない 技のうち、いちばん ひらめきに 近い 物
export const HINT_RATIO = 1.25; // ふやす 先（hirameki.js の hiraChance で 4わりくらい）
export function sparHintPick(c) {
  if (!c || c.species) return null;
  const learned = new Set(learnedAbilities(c));
  const list = Object.keys(HIRAMEKI).filter((id) => !learned.has(id) && ABILITIES[id] && ABILITIES[id].kind !== 'combo' && hiraAllowed(c, id));
  if (!list.length) return null;
  const mine = list.filter((id) => ABILITIES[id].job === c.job);
  const pool = mine.length ? mine : list;
  return pool.map((id) => ({ id, p: hiraProgress(c, id) })).sort((a, b) => b.p - a.p || (a.id < b.id ? -1 : 1))[0].id;
}
// 使った 回数を ふやす（へらさない）。ふやした もとの 技の id の ならび
export function sparHintGive(c, id) {
  const h = HIRAMEKI[id];
  if (!h) return [];
  c.skillUse = c.skillUse || {};
  const keys = [];
  for (const [k, n] of Object.entries(h.from)) {
    c.skillUse[k] = Math.max(c.skillUse[k] || 0, Math.ceil(n * HINT_RATIO));
    keys.push(k);
  }
  return keys;
}
const useName = (k, c) => (k === '@atk' ? 'ふつうの攻撃' : `「${abilityLabel(k, c)}」`);

// ───── 1人で 戦う けいこ試合（仲間・ゲストは 入れない。world/battles.js の startFixedBattle は パーティーの 仲間を 入れるので、作る 間だけ 外す）─────
async function soloBattle(run, enc) {
  const w = run.world;
  const s = run.init;
  const r = await run.flush();
  if (r.aborted) return 'abort';
  // world/battles.js は 戦いの とき だけ 読む（だいほんの データから 戦いの しくみを 先に 読まない）
  const { startFixedBattle } = await import('../world/battles.js?v=a5c15ff5e061');
  const p = w.parties?.get(s.partyId);
  const keep = p ? { supports: p.supports, guests: p.guests } : null;
  if (p) { p.supports = []; p.guests = []; }
  let wait;
  try {
    wait = startFixedBattle(w, s, [s], enc);
  } finally {
    if (p) { p.supports = keep.supports; p.guests = keep.guests; }
  }
  return wait;
}

async function sparRun(run, k) {
  const w = run.world;
  const s = run.init;
  const c = s.char;
  const enc = SPARS[k - 1];
  await run.runSteps([['sfx', 'encounter'], ...S('リオン', k === 3 ? '最後のけいこだ。…ぼくの全力で行くよ！' : `${k}回目のけいこ、始め！`)]);
  if (run.aborted) return;
  const res = await soloBattle(run, enc);
  if (res === 'abort') return;
  if (res !== 'win') {
    // 負けても よい 戦い（loseOk。HP・MPは もどる・お金は へらない）
    await run.runSteps(S('リオン', 'へへっ、ぼくの勝ち！', '…でも、すごく強くなってたよ。\nまた、いつでもけいこしよう！'));
    return;
  }
  const owner = run.owner.char;
  owner.flags[RS.win(k)] = true;
  if (k >= SPARS.length) owner.flags[RS.done] = true;
  // ひらめき技の ヒント（戦った 人の 職業）
  const id = sparHintPick(c);
  const lines = [['sfx', 'win'], ...S('リオン', k === 3 ? 'まいった…！\nやっぱり、未来の紋章の子は、強いなあ。' : 'まいった！…やるね！')];
  if (id) {
    const keys = sparHintGive(c, id);
    const names = keys.map((kk) => useName(kk, c)).join('と');
    lines.push(...S('リオン', `${c.name}の${names}…\n戦いながら見てたけど、もう少しで、何かつかめそうだね。`, `つぎの戦いで、${names}を使ってみて。\nきっと、新しい技が、ひらめくよ！`));
    lines.push(...N(`（${c.name}は、ひらめきのヒントをつかんだ！）`));
    if (w.boardPost && c.id && w.data?.characters?.[c.id] === c) {
      w.boardPost({
        kind: 'hirameki', by: c.name, charId: c.id, key: `rs_${id}`,
        title: `${c.name}がリオンとのけいこで、ひらめきのヒントをつかんだ！`, detail: hiraHowText(id, c),
      });
    }
  } else {
    lines.push(...S('リオン', `${c.name}は、もう、ひらめける技を全部覚えてるんだね…！`, 'ぼくも、負けていられないや。'));
  }
  if (k >= SPARS.length) lines.push(...S('リオン', 'ありがとう。\nぼく、もっと強くなって、仲間を探しに行くよ。'));
  w.markDirty();
  w.sendSelf(s);
  if (run.owner !== s) w.sendSelf(run.owner);
  await run.runSteps([...lines, ['sync']]);
}

function rionSteps(x) {
  if (!x.flag(SPAR_OPEN)) return [];
  if (!x.flag(RS.start)) {
    return [
      ...S('リオン', 'あっ、未来の紋章の子！', 'ぼく、もっと強くなりたいんだ。\n仲間を探しに行く前に、剣のけいこ、つき合ってくれない？'),
      ...S('リオン', 'けいこは、1人ずつ、本気でね。\n…負けても、だいじょうぶ。けいこだから！'),
      ['flag', RS.start], ['sync'],
      ...rionSteps({ flag: (f) => f === RS.start || x.flag(f) }),
    ];
  }
  const n = wins((f) => x.flag(f));
  if (n >= SPARS.length) return S('リオン', 'ぼくは毎日、剣のけいこをしているよ。', '…ほかの地方の千年前にも、ぼくの仲間がいるのかな。');
  const k = n + 1;
  return [
    ...S('リオン', `けいこ試合、${k}回目だね。`, k === 1 ? 'まずは、小手調べ！' : k === 2 ? 'こんどは、もう少し本気でいくよ。' : 'これが最後だ。ぼくの全力を見せるよ！'),
    ['choice', `リオンとけいこ試合をする？（1人で戦う）`, ['けいこする', 'またこんど'], [
      [['call', (run) => sparRun(run, k)]],
      [...S('リオン', 'うん。いつでも待ってるよ！')],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント ─────
export const CH6D_SIDE_QUESTS = [{ id: 'rion_spar', name: 'リオンの剣のけいこ', done: RS.done }];
export function ch6dSubQuests(c, f) {
  if (!f(SPAR_OPEN) || !f(RS.start) || f(RS.done)) return [];
  return [{
    name: 'リオンの剣のけいこ', who: 'rion_spar', ready: true, text: `けいこ試合 ${wins(f)}/${SPARS.length}`,
    hint: '千年前の泉の里のリオンと、1人ずつけいこ試合。勝つと、ひらめき技のヒントがもらえる。',
  }];
}
export function ch6dDoneQuests(c) {
  return CH6D_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// パーティー全員で 見る イベント（けいこは 話しかけた 人だけなので ない）
export const CH6D_SIDE_STORY = [];
export function applyCh6dSide(SCRIPTS) {
  SCRIPTS.c6_rion_spar = (x) => rionSteps(x);
}
