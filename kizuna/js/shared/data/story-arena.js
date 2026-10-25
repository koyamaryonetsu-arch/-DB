// 第37回 A: サファラ闘技場の だいほん（story.js で まぜる）。第4章クリア（c4_clear）の あとに 大会が はじまる
// しょりの なかみ（ランク戦の 3連戦・ごほうび・王者のかべ・かけ試合）は world/arena.js が ARENA_HOOKS に 入れる
// ・受付（arena_desk）… パーティー みんなで 見る（物語と おなじ。そばに いる 家族も いっしょに 戦う）
// ・かけ試合の 係（arena_bet）・王者のかべ（arena_wall）・かんばん（arena_sign）・観客 … ひとりずつ
// 第4章クリアの 前の「大会は お休み」の ことばは story-ch4.js（c4_s_arena・c4_s_fighter・c4_arena_gate）
import { ARENA_OPEN_FLAG, ARENA_RANKS, rankCleared, bestRank, rankLabel } from './arena.js?v=c5a1851e14d9';

export const ARENA_HOOKS = {};
const call = (k) => [['call', (run) => ARENA_HOOKS[k]?.(run)]];
const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

export const ARENA_STORY_SCRIPTS = ['arena_desk'];

export const ARENA_SCRIPTS = {
  // 受付（第4章クリアの あと。前は c4_s_arena）
  arena_desk: () => call('desk'),
  // かけ試合の 係（砂の 闘技場の 中）
  arena_bet: () => call('bet'),
  // 王者のかべ（砂の 闘技場の 北の かべ）
  arena_wall: () => [
    ...N('かべに、闘技場を勝ちぬいた者たちの名前が、きざまれている…。'),
    ...call('wall'),
  ],
  // 入口の 広間の かんばん（第4章クリアの あと）
  arena_sign: () => N('サファラ闘技場\n「大会、はじまりました！ランク戦は受付へ」\n「かけ試合は、砂の闘技場のおくで」'),
  // 観客
  arena_fan1: (x) => S('観客のおじさん', bestRank(x.c) >= 5
    ? `おお、あんたは${x.c.name}！\nランク5を勝ちぬいた、闘技場の王者じゃないか！`
    : '水がもどって、闘技場もにぎやかになったなあ！\nやっぱり、大会はこうでなくちゃ！'),
  arena_fan2: (x) => S('観客の女の子', rankCleared(x.c, 1)
    ? 'さっきの戦い、見てたよ！\nかっこよかったー！'
    : 'ランク1の王者は、受付の前にいる力じまんの戦士なんだって！\nうでの太さは、わたしの3倍よ！'),
  arena_fan3: () => S('物知りの観客', 'ランク5の上には「伝説の部」があるらしい。',
    'むかし、この闘技場で1度も負けなかった「伝説のチャンピオン」が、\n今も、どこかで強い者を待っているんだとさ。'),
};

// 力じまんの戦士（第4章クリアの あと。story-ch4.js の c4_s_fighter から よぶ）
export function fighterTalk(x) {
  if (rankCleared(x.c, 1)) {
    return S('力じまんの戦士', 'お、おまえたちか…！\nおれに勝つとは、なかなかやるじゃないか。',
      bestRank(x.c) >= ARENA_RANKS.length ? 'しかも、伝説のチャンピオンにまで勝ったって！？\nおれも、もっときたえなおさないとな！' : 'だが、上のランクの王者たちは、おれよりずっと強いぞ。\n気をぬくなよ！');
  }
  return S('力じまんの戦士', 'ついに大会がはじまったぞ！\nおれはランク1の王者、力じまんの戦士さまだ！',
    'ちょうせんしたいなら、受付で申しこみな。\nおれは、3戦目で待っているぜ！');
}
export const arenaOpenFor = (x) => x.flag(ARENA_OPEN_FLAG);
export { rankLabel };
