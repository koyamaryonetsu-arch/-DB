// 第38回 B: 職業の試練（ルミナの町の 星の神殿の「試練の番人」。だいほんは data/story-trials.js、きまりは data/job-trials.js）
// ・超級職・伝説の職業で、今の 職業の「〇〇の一の試練」（Lv10 から）・「〇〇の二の試練」（Lv15 から）を 受けられる
// ・1. 修行（その 職業の 技を、勝った 戦いで N回 使う。world/battles.js が 数える）→ 2. 師しょうのまぼろしと 戦う → 上限が 15・20 に
// ・ひとりずつ（自分の 職業）。師しょうのまぼろしの 戦いには、そばに いる 家族も 入る（とちゅうから かけつけても よい）。
//   勝っても 上限が 上がるのは 試練を 受けた 人だけ。負けても お金は へらない（その場で 立ち上がる）
import { TRIAL_HOOKS, TRIAL_KEEPER } from '../data/story-trials.js?v=855c00e900d9';
import {
  TRIALS, trialState, acceptTrial, clearTrial, trialName, masterName, trialWords, titleFor, jobUpKeys, jobTopCap,
} from '../data/job-trials.js?v=855c00e900d9';
import { JOBS, TIER_NAMES, JOB_MAX_LEVEL } from '../data/jobs.js?v=855c00e900d9';
import { jobLabel } from '../job-label.js?v=855c00e900d9';
import { STAT_NAMES } from '../stats.js?v=855c00e900d9';
import { startFixedBattle, battleSessions } from './battles.js?v=855c00e900d9';
import { partyOf } from './party.js?v=855c00e900d9';
import { setupTrialPhantom } from '../battle-trial.js?v=855c00e900d9';

const say = (text) => ['say', TRIAL_KEEPER, text];
const note = (text) => ['say', null, text];

async function flushOk(run) {
  const r = await run.flush();
  if (r.aborted) {
    run.abort();
    return false;
  }
  return true;
}

// 得意な 数値の 名前（「力と身の守り」）
function upText(id) {
  return jobUpKeys(id).map((k) => STAT_NAMES[k] || k).join('と');
}

// ───────────── 試練の番人 ─────────────
export async function keeperTalk(run) {
  const c = run.init.char;
  const id = c.job;
  const st = trialState(c, id);
  const J = jobLabel(id, c);
  const steps = [];
  if (!c.flags?.trial_seen) {
    steps.push(
      say('わしは試練の番人。\n超級職より上の者に、職業の試練をさずけておる。'),
      say(`試練をこえると、職業レベルを${JOB_MAX_LEVEL}より上に上げられる。\n一の試練でLv${TRIALS[0].cap}、二の試練でLv${TRIALS[1].cap}までじゃ。`),
      say('ただし、新しい技は覚えぬ。\nレベルが上がるたびに、その職業の得意な強さが\n少しずつのびるだけじゃ。'),
    );
    c.flags.trial_seen = true;
  }
  if (st.why === 'tier') {
    const tier = JOBS[id]?.tier || 0;
    steps.push(say(`${c.name}は今、${J}（${TIER_NAMES[tier]}）じゃな。\n試練は、超級職か伝説の職業でないと受けられぬ。`), say('上の職業をきわめたら、また来るがよい。'));
    return run.runSteps(steps);
  }
  if (st.all) {
    const t = titleFor(id, st.lv, c);
    steps.push(say(`${J}の試練は、すべてこえたな。\n${t ? `「${t}」の名に、はじぬように。` : 'あとは、レベルを上げるだけじゃ。'}`));
    if (st.lv < st.cap) steps.push(say(`今はLv${st.lv}。Lv${st.cap}まで上げられるぞ。`));
    return run.runSteps(steps);
  }
  if (st.active && !st.ready) {
    const T = st.active;
    steps.push(
      say(`${trialName(id, T.n, c)}の、修行のとちゅうじゃな。`),
      say(`${J}の技を、戦いで使って勝つこと。\n今は${st.count}回。あと${st.need - st.count}回じゃ。`),
      note('（メニューの「強さ」と「クエスト」でも、修行の数が見られる）'),
    );
    return run.runSteps(steps);
  }
  if (st.active && st.ready) {
    const T = st.active;
    const p = partyOf(run.world, run.init);
    const fam = (p?.members.length || 1) > 1;
    steps.push(
      say(`見事、${trialName(id, T.n, c)}の修行をやりとげたな。`),
      say(`いよいよ、${masterName(id, c)}のまぼろしとの戦いじゃ。\nまぼろしは、${J}の技を使ってくるぞ。`),
      say(`強さは、Lv${T.lv}くらいの者と同じくらいじゃ。\n負けても、お金はへらぬ。${fam ? '\nそばにいる家族も、いっしょに戦えるぞ。' : ''}`),
      ['choice', '師しょうのまぼろしと戦う？', ['戦う', 'やめる'], [
        [['call', (r) => trialBattle(r, id, T.n)]],
        [say('じゅんびができたら、また来るがよい。')],
      ]],
    );
    return run.runSteps(steps);
  }
  const T = st.next;
  if (!st.canTake) {
    steps.push(say(`${trialName(id, T.n, c)}は、${J}の職業レベルが\n${T.needLv}になったら受けられる。（今はLv${st.lv}）`), say('もっと戦って、きたえてくるがよい。'));
    return run.runSteps(steps);
  }
  steps.push(
    say(`${c.name}よ。${trialName(id, T.n, c)}を受けるか？`),
    say(`一つ目は、修行。\n${J}の技を、戦いで合計${T.uses}回使って勝つのじゃ。`),
    say(`二つ目は、${masterName(id, c)}のまぼろしとの戦い。\n勝てば、${J}の職業レベルの上限がLv${T.cap}になる。`),
    say(`上限をこえたぶんは、${upText(id)}が\nレベル1つで1〜2ずつのびるぞ。`),
    ['choice', `${trialName(id, T.n, c)}を受ける？`, ['受ける', 'やめる'], [
      [['call', (r) => trialAccept(r, id)]],
      [say('いつでも待っておるぞ。')],
    ]],
  );
  return run.runSteps(steps);
}

async function trialAccept(run, id) {
  const c = run.init.char;
  const T = acceptTrial(c, id);
  if (!T) return run.runSteps([say('…おや？今は受けられぬようじゃ。')]);
  run.world.sendSelf(run.init);
  run.world.markDirty();
  return run.runSteps([
    ['sfx', 'key'],
    note(`${c.name}は、${trialName(id, T.n, c)}を受けた！`),
    say(`${masterName(id, c)}は、よくこう言っておった。\n「${trialWords(id, c)}」`),
    say(`まずは修行じゃ。${jobLabel(id, c)}の技を、\n戦いで${T.uses}回使って勝ってくるがよい。`),
  ]);
}

// とちゅうで かけつけた 家族（戦いの あとで だいほんの 外に のこった 人）を だいほんに 入れる（world/arena.js と おなじ）
function adopt(run) {
  const w = run.world;
  const p = partyOf(w, run.init);
  for (const sid of p?.members || []) {
    const m = w.sessions.get(sid);
    if (!m || run.parts.includes(m) || m.busy !== 'script' || (m.runId && w.runs.has(m.runId))) continue;
    run.parts.push(m);
    m.runId = run.id;
  }
}

// そばに いる 家族（ふつうの 戦いと おなじ きょり。ほかの ことを していない 人）を だいほんに 入れる
function gatherFamily(run) {
  const w = run.world;
  for (const m of battleSessions(w, run.init)) {
    if (m === run.init || run.parts.includes(m)) continue;
    run.parts.push(m);
    m.busy = 'script';
    m.runId = run.id;
  }
}

// 師しょうのまぼろしとの 戦い
export async function trialBattle(run, id, n) {
  const w = run.world;
  const c = run.init.char;
  const T = TRIALS[n - 1];
  gatherFamily(run);
  const others = run.everyone.filter((m) => m !== run.init).map((m) => m.char.name);
  run.batch.push(['sfx', 'encounter']);
  if (others.length) run.batch.push(note(`${others.join('と')}も、いっしょに戦ってくれる！`));
  if (!(await flushOk(run))) return;
  const res = await startFixedBattle(w, run.init, run.everyone, T.enc, { setup: (b) => setupTrialPhantom(b, { job: id, n, who: c }) });
  adopt(run);
  if (res === 'win') {
    const r = clearTrial(c, id);
    w.sendSelf(run.init);
    w.markDirty();
    const lines = [['sfx', 'win'], note(`${c.name}は、${trialName(id, n, c)}をこえた！`)];
    if (r) lines.push(note(`${jobLabel(id, c)}の職業レベルの上限が、Lv${r.cap}になった！`));
    lines.push(say(`見事じゃ。${masterName(id, c)}も、\nきっと、よろこんでおるじゃろう。`));
    if (r && r.cap < jobTopCap(id)) lines.push(say(`職業レベルが${r.cap}になったら、\n次の試練を受けに来るがよい。`));
    else lines.push(say(`これで${jobLabel(id, c)}の試練は、すべてこえた。\nLv${r?.cap || jobTopCap(id)}をめざして、きたえるがよい。`));
    w.saveNow?.({ urgent: true });
    return run.runSteps(lines);
  }
  if (res === 'lose') {
    return run.runSteps([
      note('気がつくと、神殿でたおれていた…。\n（お金はへっていない。HPとMPはもどった）'),
      say('まぼろしとはいえ、師しょうの力は本物じゃ。\n強くなって、また来るがよい。'),
    ]);
  }
  return run.runSteps([say('戦いが止まったようじゃな。\nまた来るがよい。')]);
}

Object.assign(TRIAL_HOOKS, { keeper: keeperTalk });
