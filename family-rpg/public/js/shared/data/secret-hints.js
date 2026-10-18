// かくし要素の ヒント（第35回 B。家族:「かくし要素の ヒントを ちりばめて」）
//
// 答えを そのまま 言わずに、ためして みたく なる くらいの ヒントを、章の 町に 少しずつ おく。
//   ・かくれた 職業の 道（神殿の うわさに 出ない 別の 道〈jobs.js の reqAlt〉・伝説の 職業）
//   ・れん金の レシピ（ボスの 品を 強く する・生まれ変わりの 1だん目〈hidden〉）
//   ・特別な 配合（companions.js の BREED_RECIPES の きまった 組み合わせ）
//   ・きたえる 武器の 生まれ変わり（items-alchemy.js の REBIRTH_START・REBIRTH）
// おく 所（どこに 何を おいたかの 表は docs/idea-r35.md の さいご）
//   TOWN_HINTS  … 町の 人の ことばの さいごに 1行（applyTownHints。data/story.js が よぶ）。
//                 もとの ことばが「話す」だけの ときだけ 足す（買い物・えらぶ・戦いが ある 人には 足さない）
//   SHELF_HINTS … 本だな（マップごと。world.js の searchTile。物が 入っていない 本だな・もう 調べた 本だな で 読める）
//   MEMO_HINTS  … フィールドの 宝箱の そこの メモ（world/fieldchests.js。MEMO_RATE で ときどき）
//   PARTY_HINTS … 仲間の「はなす」（party-talk.js の memberTalk。人の 仲間が PARTY_EVERY 回に 1回、行き先の かわりに）

// ───────────── 町の 人（script … NPC の だいほんの ID）─────────────
// kind: job 職業 / alchemy れん金 / reborn 生まれ変わり / breed 配合
export const TOWN_HINTS = [
  // ── 第1章: ホシフル村・ルミナの町 ──
  { ch: 1, place: 'ホシフル村', who: 'おじいさん', script: 'v_oldman', kind: 'job', about: '遊び人→賢者（神殿のうわさに出ない別の道）',
    text: 'そうそう、遊んでばかりの若者が、ある日とつぜん、さとりを開いたという話もある。\n遊びをきわめるのも、また一つの道じゃな。' },
  { ch: 1, place: 'ルミナの町', who: 'よっぱらい', script: 't_drinker', kind: 'reborn', about: '銅の剣＋銀のかけら＋星のかけら→あかがねの剣',
    text: 'ういっく…店で買った武器は、かじ屋じゃきたえてくれねえ…。\nでもよ、使いこんだ銅の剣に、銀と星を食わせてやると…赤く光るらしいぜ…ひっく' },
  { ch: 1, place: 'ルミナの町', who: '物知りじいさん', script: 't_oldman', kind: 'breed', about: 'ぷるりん系＋がいこつ剣士→ぷるりん騎士',
    text: 'それから、ぷるりんの仲間と、ほねの剣士を配合すると、小さな騎士が生まれるそうじゃ。' },
  // ── 第2章: カモメ港 ──
  { ch: 2, place: 'カモメ港', who: '年よりの船乗り', script: 'old_sailor', kind: 'breed', about: 'はぐれウルフ＋きらきらぷるりん→星形パンサー',
    text: 'それからのう、はぐれ者のけものと、きらきら光る子を配合すると、星のもようのけものが生まれるとか。' },
  { ch: 2, place: 'カモメ港', who: '港の子ども', script: 'port_kid', kind: 'reborn', about: '木のブーメラン＋風の羽＋星のかけら→つむじ風のブーメラン',
    text: 'あとね、木のブーメランも、風の力と星の光をあびると、つむじ風みたいになるんだって！\nかじ屋さんじゃなくて、ふしぎな大きいかまで！' },
  { ch: 2, place: 'カモメ港', who: '漁師', script: 'fisher', kind: 'alchemy', about: 'クラーケンのムチ＋竜のうろこ→大海原のムチ',
    text: 'そういや、大王イカの足みたいなムチに、竜のうろこを合わせてみな。\n海でいちばんのムチになるって話だ。' },
  // ── 第3章: シロガネ地方（竜守りの村・カナトコ・ユノハ）──
  { ch: 3, place: 'ユノハの里', who: '湯治の旅人', script: 'c3_y_man', kind: 'job', about: 'アイドル→スーパースター（別の道）',
    text: 'そうそう、アイドルをきわめた子は、それだけでスターの道が開けるらしいよ。' },
  { ch: 3, place: 'カナトコ', who: '鉱夫', script: 'c3_k_miner2', kind: 'reborn', about: '木のバット＋けもののキバ＋星のかけら→4番バッターのバット',
    text: '木のバットだって、けものの力と星の光をもらえば、4番バッターのバットに化けるって話だ。\nかじ屋のかまじゃないぞ、れん金のかまだ。' },
  { ch: 3, place: '竜守りの村', who: '村のおくさん', script: 'c3_v_woman', kind: 'breed', about: 'ぷるりん＋空をとぶ魔物→ふわりん',
    text: 'ぷるりんが、空をとぶ魔物と配合されると、ふわふわうかぶようになるんですって。' },
  { ch: 3, place: 'ユノハの里', who: '温泉のおねえさん', script: 'c3_y_woman', kind: 'reborn', about: 'かしのつえ＋魔法の粉＋星のかけら→魔法学校のつえ',
    text: 'かしのつえも、魔法の粉と星の光で、魔法学校のつえになるって聞いたわ。' },
  // ── 第4章: コガネ地方（王都サファラ・キャラバン・ドゥナ）──
  { ch: 4, place: '王都サファラ', who: 'じゅうたん売り', script: 'c4_s_rug', kind: 'job', about: '遊び人→お笑い芸人（別の道）',
    text: 'そうそう、遊び人をきわめた男が、まんざいで大うけしたって話を聞いたよ。\n笑いの道もあるもんだね。' },
  { ch: 4, place: '王都サファラ', who: 'つぼ売り', script: 'c4_s_pot', kind: 'reborn', about: '木の剣＋満月草＋星のかけら→せいれいの木刀',
    text: 'むかし、木の剣と満月草と星のかけらを入れて、何日も歩いた男がいてね。\n木の剣に、せいれいが宿ったとさ。…つぼじゃなくて、かまだったかな？' },
  { ch: 4, place: 'コガネ地方', who: 'キャラバンの子ども', script: 'c4_camp_kid', kind: 'alchemy', about: 'アンクのつえ＋よみがえりの花→ファラオのつえ',
    text: 'それとね、命のしるしの形のつえに、よみがえりの花を合わせると、王さまのつえになるんだって！' },
  { ch: 4, place: '砂の港ドゥナ', who: '砂の海の漁師', script: 'c4_d_fisher', kind: 'breed', about: 'ひばなドリ＋火こぞう→フェニックス',
    text: 'ひばなの鳥と、火の子どもを配合すると、何度でもよみがえる鳥が生まれるって、海賊の言い伝えさ。' },
  // ── 第5章: ハネノの町 ──
  { ch: 5, place: 'ハネノの町', who: '羽の弱ったおじいさん', script: 'c5_h_old', kind: 'reborn', about: '生まれ変わった武器を上限をこえてきたえる→2だん目',
    text: 'そうじゃ、生まれ変わった武器も、きたえて、きたえぬくと…もう一度、光るそうじゃよ。\n星の鉄がいるとか、いらんとか…' },
  { ch: 5, place: 'ハネノの町', who: 'ハネビトのおくさん', script: 'c5_h_woman', kind: 'job', about: '勇者＋ダ天使→魔王（伝説の職業）',
    text: '光の勇者と、天から落ちた天使。両方の心を知った人は、どうなってしまうのかしら…。' },
  { ch: 5, place: 'ハネノの町', who: 'ハネビトの女の子', script: 'c5_h_kid', kind: 'breed', about: '星形パンサー＋ストームバード→ペガサス',
    text: '星のもようのけものと、嵐の鳥が仲よくなると、つばさのある白い馬になるんだって！' },
];

// ステップが「話す」だけか（買い物・えらぶ・戦い・フラグが ある 人には 足さない）
const talkOnly = (steps) => Array.isArray(steps) && steps.length > 0 && steps.every((st) => Array.isArray(st) && st[0] === 'say');

// 町の 人の だいほんの さいごに ヒントを 1行（なんど よんでも 1回だけ 足す）
export function applyTownHints(SCRIPTS) {
  for (const h of TOWN_HINTS) {
    const base = SCRIPTS[h.script];
    if (typeof base !== 'function' || base.hinted) continue;
    const fn = (x) => {
      const steps = base(x);
      if (!talkOnly(steps)) return steps;
      return [...steps, ['say', steps[steps.length - 1][1], h.text]];
    };
    SCRIPTS[h.script] = Object.assign(fn, base, { hinted: true });
  }
  return SCRIPTS;
}

// ───────────── 本だな（マップごと。どの 本だなが どれかは 場所で きまる）─────────────
export const SHELF_HINTS = {
  // 第1章 ミドリナ地方（ホシフル村・ルミナの町）
  overworld: [
    { kind: 'alchemy', text: '「かじ屋の手引き」という本だ。\n…店で売っている武器や防具は、かじ屋ではきたえられない。\n店では買えない品だけが、きたえるほど強くなる…' },
    { kind: 'job', text: '「職業の本」という本だ。\n…遊びをきわめた者が、ある日さとりを開いた話がのっている…' },
    { kind: 'breed', text: '「魔物の本」という本だ。\n…きまった2ひきを配合すると、系統とはちがう、とくべつな魔物が生まれることがある…' },
  ],
  // 第2章 風の海（カモメ港）
  sea: [
    { kind: 'alchemy', text: '「れん金の手引き」という本だ。\n…知らない組み合わせも、かまに入れてみよう。うまくいかない時は、ふくろにもどってくる…' },
    { kind: 'reborn', text: '「海賊の日記」という本だ。\n…木のブーメランに風の羽と…と書いてあるが、その先はかすれて読めない…' },
  ],
  // 第3章 シロガネ地方
  north: [
    { kind: 'reborn', text: '「武器の伝説」という本だ。\n…店で売っているような弱い武器でも、れん金で生まれ変わることがある。\n生まれ変わった武器は、きたえるほど、また強くなる…' },
    { kind: 'breed', text: '「竜の本」という本だ。\n…竜の子と、ほかの竜を配合すると、大きな竜に育つという…' },
    { kind: 'alchemy', text: '「魔女の本」という本だ。\n…魔女のほうきと、魔女のぼうし。2つをかまに入れると、魔女たちの夜まつりの…\n（そこから先は、やぶれていて読めない）' },
  ],
  peak3: [
    { kind: 'job', text: '「山小屋の日記」だ。\n…神殿のうわさは、つながりのある職業を始めた人にしか聞こえないらしい。いろいろな職業を始めてみよう…' },
  ],
  // 第4章 コガネ地方・ドゥナ
  south: [
    { kind: 'alchemy', text: '「砂の国の書」という本だ。\n…王家のつえは、命のしるしと、よみがえりの力から作られたという…' },
    { kind: 'job', text: '「笑いの本」という本だ。\n…旅芸人でなくても、遊びをきわめた人は、笑いの道に進めるらしい…' },
  ],
  duna: [
    { kind: 'breed', text: '「海賊の言い伝え」という本だ。\n…ひばなの鳥と火の子どもから、何度でもよみがえる鳥が生まれた…' },
    { kind: 'reborn', text: '「船大工のメモ」だ。\n…木の剣に満月草と星のかけら。せいれいが宿るまで、歩きつづけること…' },
  ],
  medal_castle: [
    { kind: 'breed', text: '「王さまの魔物図かん」だ。\n…星のもようのけものと、嵐の鳥から、つばさのある馬が生まれたという…' },
  ],
  lab_b6: [
    { kind: 'job', text: '古い石の本だ。\n…光と闇、両方をきわめた者は、すべての魔物の王になる。\nその王が、神のこぶしをきわめた時…（そこから先は、くずれていて読めない）' },
    { kind: 'reborn', text: '古い石の本だ。\n…生まれ変わった武器を、さらにきたえぬくと、太陽や世界樹の名をもつ武器になる…' },
  ],
  // 第5章
  star_tower_4f: [
    { kind: 'breed', text: '星の本だ。\n…きらきら光る子と、ぷるりんの王を配合すると、銀にかがやく王が生まれる…' },
  ],
  hanono: [
    { kind: 'job', text: 'ハネビトの本だ。\n…学校をきわめ、町の役所でもはたらいた人は、きっと熱い先生になれる…' },
    { kind: 'alchemy', text: 'ハネビトの本だ。\n…竜をたおす剣は、古い竜のキバと、竜のうろこと、星の鉄から作られる…' },
  ],
  sink_ruin_4f: [
    { kind: 'reborn', text: '古い神殿の本だ。\n…天空のブーメランは、つむじ風のブーメランを、きたえてきたえぬいた先にある…' },
  ],
};

// 本だなの ヒント（その マップに なければ null）。同じ 本だなは いつも 同じ 本
export function shelfHint(mapId, x, y) {
  const list = SHELF_HINTS[mapId];
  if (!list?.length) return null;
  return list[Math.abs(x * 7 + y * 13) % list.length].text;
}

// ───────────── フィールドの 宝箱の メモ ─────────────
export const MEMO_RATE = 1 / 8;
export const MEMO_HINTS = {
  overworld: [
    { kind: 'reborn', text: '「銅の剣は、銀と星で赤くなる」' },
    { kind: 'job', text: '「遊び人の先にも、道はある」' },
  ],
  sea: [
    { kind: 'alchemy', text: '「ボスの落とした品は、かまで、もっと強くなる」' },
    { kind: 'breed', text: '「ぷるりんと、空をとぶ子。ふわふわ」' },
  ],
  north: [
    { kind: 'reborn', text: '「木のバット・けもの・星。かまの中で、4番になる」' },
    { kind: 'job', text: '「アイドルの先にも、スターの道」' },
  ],
  south: [
    { kind: 'reborn', text: '「かしのつえ・魔法の粉・星。魔法学校」' },
    { kind: 'breed', text: '「ひばなの鳥と、火の子ども」' },
  ],
};
// 宝箱を 開けた ときの メモ（ない ときは null）。rng … world.rng
export function chestMemo(mapId, rng) {
  const list = MEMO_HINTS[mapId];
  if (!list?.length || !rng?.chance(MEMO_RATE)) return null;
  return `宝箱のそこに、古いメモがはさまっていた。\n${rng.pick(list).text}`;
}

// ───────────── 仲間の「はなす」─────────────
// 人の 仲間が PARTY_EVERY 回に 1回、行き先の 話の かわりに ヒントを 話す（じゅんばんに。毎回 長く ならない ように）
export const PARTY_EVERY = 5;
// ch … この 章から（目標の 文で 章を きめる。party-talk.js）
export const PARTY_HINTS = [
  { ch: 1, kind: 'breed', text: 'そういえば、魔物の配合って、きまった2ひきだと、とくべつな子が生まれるんだって。' },
  { ch: 1, kind: 'job', text: 'そういえば、遊び人をきわめると、思いがけない職業になれるって聞いたよ。' },
  { ch: 2, kind: 'reborn', text: 'そういえば、店で買った武器は、かじ屋できたえられないよね。\nでも、れん金がまなら…何か起こるかも？' },
  { ch: 2, kind: 'alchemy', text: 'そういえば、ボスの落とした品を、れん金がまに入れてみた？\nもっと強くなるかもしれないよ。' },
  { ch: 3, kind: 'reborn', text: 'そういえば、生まれ変わった武器も、もっときたえられるのかな？' },
  { ch: 3, kind: 'job', text: 'そういえば、神殿のうわさは、その職業を始めた人にしか聞こえないんだって。' },
  { ch: 4, kind: 'breed', text: 'そういえば、竜の子と竜を配合すると、大きな竜になるらしいよ。' },
  { ch: 5, kind: 'job', text: 'そういえば、学校の先生になるには、町の役所の仕事も知っておくといいらしいよ。' },
];
let partyN = 0;
// その 回が ヒントの 番なら ヒントの 文（ちがう ときは null）。ch … 今の 章
export function nextPartyHint(ch) {
  partyN++;
  if (partyN % PARTY_EVERY) return null;
  const list = PARTY_HINTS.filter((h) => h.ch <= ch);
  return list.length ? list[(partyN / PARTY_EVERY - 1) % list.length].text : null;
}
