// お仕事いらい板の たのまれごと 24〜26（第73回 D班。docs/plan-ch8.md の 5-3）の だいほん
// 人と 物の 置き場所は maps/work-quests4.js、品は data/items-family.js、戦いは data/encounters-family.js
// 一らん（WORK4_QUESTS）・だいほん（WORK4_SCRIPTS）・クエストの 画面（workSubQuests4）は data/sidequests-family.js で まぜる
//
// ・第8章 第1幕で 千年前の 王国に 着いた あと（c8_kingdom）。今の 時代の 場所だけ。はり紙も その時から（open）
// ・職業の しばり: 第66回の 伝説の 職業に つながる 系統（legend … その 伝説の 職業。18〜23 とは かさならない）。
//   解決の だいじな 所は、パーティーの だれかが その 系統の 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 敵Lv80。完全オートで 勝てる 軽さ）
// ・ごほうび（第64回の きまり: 装備の ごほうびは へらす）: ゴールド・小さなメダル・素材や 道具。★5の アクセサリーは 26 の 1つだけ。1回だけ
//
// 24. ひみつの温泉の、われた湯船（れん金術師 → 真理のとびらをひらく者。湯けむりの 白い岩で 岩もぐらと 戦う）
// 25. ハネノの島の、雲の下のおとしもの（超能力者 → さいきくすお。だれにも 気づかれずに 助ける）
// 26. ピラミッドのはっくつ隊を守れ（ガーディアンか大神官 → 守りの神。夜の 見張りで 砂の 魔物と 戦う）
import { S, N, proOf, need, cnt, firstMissing } from './fq-common.js?v=e3f2209f7dc0';
import { rewardSteps } from './sidequests-work2.js?v=e3f2209f7dc0';
import {
  WQ4, WQ4_OPEN, SPA_VOICES, SPA_STEPS, ESP_VOICES, ESP_STEPS, DIG_VOICES, DIG_STEPS,
} from '../maps/work-quests4.js?v=e3f2209f7dc0';

const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag]], no]]];
// 1つずつ 決める なぞ（P: { pre, ask, opts, ans, miss[], yes, done[] }）。合ったら flags[k]。まちがえたら retry（もう一度 話しかけると、まちがえた 所から）
function chain(x, pro, list, flags, retry, after) {
  const step = (k) => {
    const P = list[k];
    return ['choice', P.ask, P.opts, P.opts.map((o, j) => (j !== P.ans
      ? [...S(pro.name, P.miss[j < P.ans ? j : j - 1]), ...retry]
      : [...S(pro.name, P.yes || `${o}…これだ！`), ['flag', flags[k]], ...(P.done ? N(...P.done) : []),
        ...(k + 1 < list.length ? (list[k + 1].pre || []).concat([step(k + 1)]) : after)]))];
  };
  const i = flags.findIndex((k) => !x.flag(k));
  return [...(list[i].pre || []), step(i)];
}
// 話を 聞くと フラグ（start の 前は ふだんの ことば・すんだら お礼）
const voiceOf = (start, done, flags) => (i, who, lines, before, after) => (x) => {
  if (x.flag(done)) return S(who, after);
  if (!x.flag(start)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', flags[i]]];
};
// 戦い（パーティー全員で 見る。WORK4_STORY_SCRIPTS）
const fight = (mon, id, flag) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['flag', flag], ['sync'], ['bgm', 'resume']];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 系統の 先の 第66回の 伝説の 職業
export const WORK4_QUESTS = [
  { id: 'spa', name: 'ひみつの温泉の、われた湯船', done: WQ4.spaDone, roots: ['alchemist'], job: 'れん金術師', legend: 'truth_gate', town: 'シロガネ地方のひみつの温泉', open: [WQ4_OPEN],
    start: WQ4.spaStart, who: '温泉守りのイワオ', npc: 'fq_spa_host', where: 'シロガネ地方の北西のすみ、ひみつの温泉',
    paper: '山おくのひみつの温泉の、石の湯船がわれてしまった。\n石を作りかえられる人、おらんかのう。',
    reward: { gold: 4000, medals: 3, goods: [['star_iron', 3], ['earth_stone', 3], ['limit_stone', 1]] } },
  { id: 'esp', name: 'ハネノの島の、雲の下のおとしもの', done: WQ4.espDone, roots: ['esper'], job: '超能力者', legend: 'saiki', town: 'クモイ地方のハネノの島', open: [WQ4_OPEN],
    start: WQ4.espStart, who: 'ハネビトの女の子ソヨ', npc: 'fq_esp_host', where: 'クモイ地方の、ハネノの島の南のはし',
    paper: 'おばあちゃんの羽かざりを、雲の下に落としちゃった…。\nだれにも、ないしょで、探してくれる人、いませんか？',
    reward: { gold: 3500, medals: 3, goods: [['seed_mag', 3], ['cloud_cotton', 5], ['jelly', 3]] } },
  { id: 'dig', name: 'ピラミッドのはっくつ隊を守れ', done: WQ4.digDone, roots: ['guardian', 'high_priest'], job: 'ガーディアンか大神官', legend: 'guard_god', town: 'コガネ地方の王家のピラミッド', open: [WQ4_OPEN],
    start: WQ4.digStart, who: 'はっくつ隊の隊長ザイナブ', npc: 'fq_dig_host', where: 'コガネ地方の、王家のピラミッドの前の広場',
    paper: '夜になると、砂の魔物がはっくつのあなをねらってきます。\nけが人を治して、みんなを守れる方、来てください！',
    reward: { item: 'fq_sand_amulet', gold: 3000, medals: 2, goods: [['star_sand', 5], ['panacea', 2]] } },
];
const Q = Object.fromEntries(WORK4_QUESTS.map((q) => [q.id, q]));

// ───────────── 24. ひみつの温泉の、われた湯船 ─────────────
const IWAO = '温泉守りのイワオ';
export const SPA_PLAN = [
  { pre: S(IWAO, 'まずは、材料じゃな…。'),
    ask: '湯船を作りかえる材料は？', opts: ['そのへんの、ふつうの石ころ', 'われた湯船のかけらと、湯けむりの白い岩を、同じ重さだけ', 'ぴかぴかの金のかたまり'], ans: 1,
    miss: ['…いや、ふつうの石ころでは、お湯の熱で、すぐにわれてしまう。', '…いや、れん金術は、ほしい物と同じだけの物がいる。\n金を出しても、石の湯船にはならない。'],
    yes: '何かを作るには、それと同じだけの物がいる。\nわれたかけらと、白い岩を、同じ重さだけ！', done: ['われたかけらと白い岩を、温泉のまん中に、つみ上げた。'] },
  { pre: S(IWAO, '次は、湯船の形じゃ。'),
    ask: 'どんな形の湯船にする？', opts: ['四角くて、ひとりで入る、小さな湯船', 'すべり台つきの、楽しい湯船', '丸くて大きな、みんなで輪になって入れる湯船'], ans: 2,
    miss: ['…いや、それでは、サルたちと旅人が、いっしょに入れない。', '…いや、すべったら、お湯がみんな、こぼれてしまう。'],
    yes: '丸くて大きな湯船。\nサルも、旅人も、みんなで輪になって入れる！' },
  { pre: S(IWAO, '最後に、どうやって作りかえるんじゃ？'),
    ask: 'れん金術の、最後のしあげは？', opts: ['ハンマーで、カンカンたたく', '両手をパンと合わせて、地面に手をつく', '大きな声で、呪文をさけぶ'], ans: 1,
    miss: ['…いや、たたいたら、かけらが、もっと細かくなってしまう！', '…いや、さけんでも、石は動かない。'],
    yes: '両手を、パンと合わせて…\n地面に、手をつく！' },
];
const spaFinish = (pro) => [
  ['sfx', 'sparkle'], ['flash'],
  ...N('バチバチバチッ！', `${pro.name}の手から、青い光の線が、地面を走った！`, 'かけらと白い岩が、とけるように形をかえて…'),
  ['shake'], ['sfx', 'rumble'],
  ...N('…丸くて大きな、まっ白な石の湯船が、できあがった！', 'こぽこぽ…と、あたたかいお湯が、湯船いっぱいに、たまっていく。'),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('その夜。', 'サルたちと、湯治の旅人と、温泉守りのイワオが、みんなで輪になって、お湯につかった。'),
  ...S('子ザルのモンタ', 'キキッ！ポカポカだキー！'),
  ...S(IWAO, 'ほう…わしが若いころより、ずっといい湯船じゃ。\nありがたい、ありがたい…。'),
  ...S(pro.name, '何かを作るには、同じだけの物がいる。\n…でも、みんなの笑顔は、おまけでついてきたね。'),
  ...S(IWAO, 'うまいことを言うのう。', 'これは、お礼じゃ。\n山おくで見つけた、星の鉄と、大地の光石と…\nわしの、とっておきの石じゃよ。'),
  ...rewardSteps(Q.spa),
];
const spaHost = (x) => {
  const pro = proOf(x, Q.spa);
  if (x.flag(WQ4.spaDone)) return S(IWAO, '丸い湯船は、サルたちにも、大人気じゃ。', '毎ばん、輪になって、ゆっくりつかっておるよ。');
  if (!x.flag(WQ4_OPEN)) return S(IWAO, 'わしは、温泉守りのイワオ。', 'この山おくの、ひみつの温泉を、ずっと守っておる。');
  if (x.flag(WQ4.spaStart)) {
    if (!x.flag(WQ4.spaRock) || !all(x, SPA_VOICES)) {
      const left = [!x.flag(WQ4.spaRock) && '湯けむりの白い岩を取る', !all(x, SPA_VOICES) && `話を聞く（今は${nOf(x, SPA_VOICES)}人）`].filter(Boolean);
      return S(IWAO, `${left.join('・')}…。`, '白い岩は、温泉の北西のすみじゃ。\n子ザルのモンタ・湯治の旅人・れん金術師見習いのアルトにも、聞いてみるといい。');
    }
    if (!pro) return [...S(IWAO, '材料も、話も、そろったのう。', 'じゃが…石を作りかえるなんて、だれにでもできることでは…。'), ...need(Q.spa)];
    return [
      ...S(IWAO, '材料も、話も、そろったのう！\nさあ、湯船を作りかえてくれ！'),
      ...chain(x, pro, SPA_PLAN, SPA_STEPS, S(IWAO, 'うーむ…何かがちがうようじゃ。\nみんなの話を、もう一度、思い出してくれ。'), spaFinish(pro)),
    ];
  }
  return [
    ...S(IWAO, 'こまったのう…。', 'この前の大雪の夜に、温泉の石の湯船が、ピシッとわれてしもうた。\nお湯がもれて、ちっともたまらんのじゃ。'),
    ...S(IWAO, 'サルたちも、寒さでぶるぶる…。\nこんな山おくまで、石屋さんは来てくれんし…。'),
    ...(pro ? S(IWAO, `${pro.name}さんは、れん金術師じゃろう？\n石を作りかえる術で、湯船を直してくれんか！`) : S(IWAO, '石を、ちがう形に作りかえる…そんな術を使える人がいたらのう。')),
    ...accept('湯船を直す手伝いをする？', [
      ...S(IWAO, 'おお、ありがたい！', 'まずは、材料じゃ。温泉の北西のすみの、湯けむりの白い岩を取ってきてくれ。'),
      ...S(IWAO, 'それから、子ザルのモンタ・湯治の旅人・れん金術師見習いのアルトにも、話を聞いてみるといい。'),
    ], S(IWAO, 'そうか…。'), WQ4.spaStart),
  ];
};
// 湯けむりの 白い岩（近づくと 岩の 下から 岩もぐらが 出る。たおすと 白い岩を 取れる）
const spaRock = (x) => {
  if (!x.flag(WQ4.spaStart)) return N('まっ白な岩から、ほかほかと湯けむりが上がっている。', '…岩のうしろで、何かが、ごろごろ動いた気がする。');
  return [
    ...N('まっ白な岩から、ほかほかと湯けむりが上がっている。', '岩に手をのばした、そのとき…'),
    ...N('ゴゴゴゴ…！\n岩の下から、岩もぐらが2ひき、顔を出した！', '「ここは、おいらたちの、あったかい、すだぞ！」'),
    ...fight('rock_mole', 'fq_rockmole', WQ4.spaRock),
    ...N('岩もぐらたちは、山の方の、べつのあったかい岩へ、ひっこしていった。'),
    ...N('{name}は、湯けむりの白い岩を、かかえて持った。\n（イワオに知らせよう）'),
  ];
};
const spaVoice = voiceOf(WQ4.spaStart, WQ4.spaDone, SPA_VOICES);
const spaV1 = spaVoice(0, '子ザルのモンタ', ['キキッ！湯船がわれて、さむいキー！', 'われたかけらは、まだ、温泉のまわりにころがってるキー。\nかけらがあれば、元にもどせるかもキー？'], ['キキッ？'], 'キキー！丸い湯船、さいこうだキー！');
const spaV2 = spaVoice(1, '湯治の旅人', ['むかしの湯船は、丸くて大きかったそうだよ。', 'サルも、旅人も、みんなで輪になって、つかったんだってさ。\nまた、あんなふうに入りたいなあ。'], ['山おくの温泉は、つかれがとれるねえ。'], 'サルたちと輪になってつかるのは、楽しいねえ！');
const spaV3 = spaVoice(2, 'れん金術師見習いのアルト', ['ぼくは、れん金術の勉強中なんだ。', 'れん金術の、いちばん大事なきまりはね…\n「何かを作るには、それと同じだけの物がいる」なんだ。', 'それに、うわさでは、本物の名人は、れん成の円もかかずに…\n両手をパンと合わせるだけで、石を作りかえるらしいよ！'], ['れん金術の本、むずかしいなあ…。'], 'すごかった…！\nぼくも、いつか、あんなふうになりたい！');

// ───────────── 25. ハネノの島の、雲の下のおとしもの ─────────────
const SOYO = 'ハネビトの女の子ソヨ';
export const ESP_PLAN = [
  { pre: S(SOYO, '羽かざり…どこにあるのかなあ…。'),
    ask: '雲の下の羽かざりを、どうやってさがす？', opts: ['島のはしから、身をのり出して、大声でよぶ', '雲の海に、ひょいっと、とびこむ', '目をとじて、心の目（千里眼）で、雲の下を見る'], ans: 2,
    miss: ['…いや、大声を出したら、見張りに、気づかれてしまう。', '…いや、とびこんだら、大さわぎになってしまう。'],
    yes: '目をとじて…千里眼。', done: ['（見えた。島の根っこの、ほそい枝の先に、白い羽かざりが、引っかかっている）'] },
  { pre: S(SOYO, '見つかったの！？\nでも、どうやって取るの？'),
    ask: '羽かざりを、どうやって取る？', opts: ['念力で、羽かざりを、そっと上へうかせる', '空をとんで、取りに行く', 'テレポートで、枝の先へとぶ'], ans: 0,
    miss: ['…いや、空をとんだら、島のみんなに、見られてしまう。', '…いや、ほそい枝の先では、立てない。落ちたらたいへんだ。'],
    yes: '念力で…そーっと、上へ。', done: ['（羽かざりは、雲にかくれながら、ゆっくり、島のはしまで、上がってきた）'] },
  { pre: N('（さて…どうやって、ソヨにわたそうか。めだたないように…）'),
    ask: '羽かざりを、どうやってソヨに返す？', opts: ['空中にうかせたまま、みんなの前で、ソヨの手の上へ', '雲つりのおじいさんの、つりざおの先に、こっそり引っかける', '「見つけたのは、わたしです」と、島じゅうにふれまわる'], ans: 1,
    miss: ['…いや、物がうかんでいたら、島じゅうが、大さわぎだ。', '…いや、めだつのは、いちばん、こまる。'],
    yes: '雲つりのおじいさんの、つりざおの先に…\nこっそり、引っかけておこう。' },
];
const espFinish = (pro) => [
  ['fade', 'out'], ['wait', 600], ['fade', 'in'],
  ...S('雲つりのおじいさん', 'おおっ！？\nな、なにか、つれたぞい！'),
  ['sfx', 'sparkle'],
  ...N('おじいさんの、雲つりざおの先に…\n白い羽かざりが、きらきら光っていた！'),
  ...S(SOYO, 'あっ…！おばあちゃんの、羽かざり！'),
  ...S('雲つりのおじいさん', 'ほっほっ！\n60年、雲つりをしておるが、こんな物がつれたのは、初めてじゃ！'),
  ...S('島のはしの見張り', 'さすが、雲つりの名人だ！'),
  ...N('島のみんなは、雲つりのおじいさんを、わいわいほめている。', '…だれも、{name}たちには、気がついていない。'),
  ...S(pro.name, '（…やれやれ。めだたないのが、いちばんだ）'),
  ['fade', 'out'], ['wait', 500], ['fade', 'in'],
  ...S(SOYO, '…ねえ。', '（ソヨが、こっそり、耳もとで、ささやいた）'),
  ...S(SOYO, '本当は、あなたでしょ？\n…ないしょにしておくね。ありがとう！'),
  ...S(SOYO, 'これ、お礼。\nわたしの大すきな、ぷるりんゼリーと…ハネノのおみやげ！'),
  ...S(pro.name, '（…ぷるりんゼリーか。\n…わるくない）'),
  ...rewardSteps(Q.esp),
];
const espHost = (x) => {
  const pro = proOf(x, Q.esp);
  if (x.flag(WQ4.espDone)) return S(SOYO, '羽かざり、もう、なくさないように、ちゃんとつけてるよ。', '…あのことは、ないしょ、ね！');
  if (!x.flag(WQ4_OPEN)) return S(SOYO, 'わたし、ソヨ。', 'いつか、雲の海の上を、ずーっと遠くまで、とんでみたいの。');
  if (x.flag(WQ4.espStart)) {
    if (!all(x, ESP_VOICES)) return S(SOYO, `島のみんなの話は、今${nOf(x, ESP_VOICES)}人。`, '友だちのフワ・島のはしの見張りさん・雲つりのおじいさんに、それとなく聞いてみて。\n…わたしが落としたことは、ないしょでね。');
    if (!pro) return [...S(SOYO, 'みんなの話は、聞けたね。', 'でも…雲の下なんて、だれにも見えないし、とどかないよね…。'), ...need(Q.esp)];
    return [
      ...S(SOYO, 'みんなの話、聞けたね！\n…ほんとうに、探してくれるの？'),
      ...chain(x, pro, ESP_PLAN, ESP_STEPS, S(SOYO, 'あわわ…！\nそれだと、みんなに、気づかれちゃう…。もう一回、考えて！'), espFinish(pro)),
    ];
  }
  return [
    ...S(SOYO, '…ぐすん。', '島のはしで遊んでいたら、おばあちゃんの、白い羽かざりを…\n雲の下に、落としちゃったの。'),
    ...S(SOYO, '島のはしで遊ぶのは、きまりで、だめなの。\nだから、だれにも言えなくて…。'),
    ...(pro ? S(SOYO, `${pro.name}さんって…なんだか、ふしぎな力を、持ってそう。\nおねがい、こっそり、探してくれない？`) : S(SOYO, 'ふしぎな力で、こっそり、探してくれる人がいたらなあ…。')),
    ...accept('こっそり、羽かざりをさがす？', [
      ...S(SOYO, 'ほんとう！？ありがとう！', 'まずは、それとなく、島のみんなの話を聞いてみて。\n友だちのフワ・島のはしの見張りさん・雲つりのおじいさんよ。'),
    ], S(SOYO, 'そっか…。'), WQ4.espStart),
  ];
};
const espVoice = voiceOf(WQ4.espStart, WQ4.espDone, ESP_VOICES);
const espV1 = espVoice(0, 'ソヨの友だちフワ', ['（ひそひそ）ソヨの羽かざり、ひゅーっと雲の中に落ちていったんだ。', 'でもね、ずっと下の方で、一回だけ、きらっと光ったよ。\nどこかに、引っかかってるのかも！'], ['ぼく、フワ！\n雲の上で、かけっこするのが、とくいなんだ！'], 'ソヨ、羽かざりがもどって、すごくよろこんでた！');
const espV2 = espVoice(1, '島のはしの見張り', ['島のはしには、近づくなよ。あぶないからな。', 'それに、このごろは、空に何かがうかんでいたら、すぐに大さわぎだ。\nあやしい物を見たら、島じゅうに知らせることになっている。'], ['ここは、ハネノの島の南のはし。\nこの先は、雲の海だ。'], '雲つりのじいさん、すごかったな！\n…まさか、あんな物がつれるとはなあ。');
const espV3 = espVoice(2, '雲つりのおじいさん', ['わしは、毎日、ここで雲つりをしておる。', '雲の下には、島の根っこの、ほそい枝が、たくさんのびておってな。\n落ちた物は、たいてい、そこに引っかかるんじゃ。', '…わしの雲つりざおでも、そこまでは、とどかんがのう。'], ['ほっほっ。今日は、いい雲がつれそうじゃ。'], 'わしの、いちばんの大物じゃった！\n…ほっほっ、ふしぎなこともあるもんじゃ。');

// ───────────── 26. ピラミッドのはっくつ隊を守れ ─────────────
const ZAINAB = 'はっくつ隊の隊長ザイナブ';
export const DIG_PLAN = [
  { pre: S(ZAINAB, 'もうすぐ、日がしずむわ…。'),
    ask: 'まず、何をする？', opts: ['けがをした人たちを、回復の呪文で治して、テントの中へ', 'すぐに、魔物を探しに、砂ばくへ走る', 'みんなに、夜もはっくつをつづけてもらう'], ans: 0,
    miss: ['…いや、けがをした人を、おいてはいけない。', '…いや、みんな、くたくただ。休ませないと。'],
    yes: 'まずは、けがを治して、みんなを安全なテントへ。', done: ['やさしい光が、はっくつ隊の人たちをつつんだ。', '「…いたくない！ありがとう！」\nみんなは、テントの中へ入った。'] },
  { pre: S(ZAINAB, 'みんな、テントに入ったわ。\nあなたは、どこで見張るの？'),
    ask: 'どこに立って、見張る？', opts: ['安全な、ピラミッドのてっぺん', 'テントとはっくつのあなの前、北の砂ばくの方を向いて', 'テントの中で、みんなといっしょに'], ans: 1,
    miss: ['…いや、遠くからでは、みんなを守れない。', '…いや、中にいたら、魔物が来ても、気づけない。'],
    yes: 'みんなの前に立って…北の砂ばくを、見張ろう。', done: ['夜の砂ばくは、しーんとしている…。'] },
  { pre: [...N('ズズズ…ズズズズ…！', '北の砂の中から、大きな魔物たちが、あらわれた！')],
    ask: '魔物が来た！どうする？', opts: ['テントのみんなを起こして、先ににげてもらう', 'ひとりで、はっくつのあなの中にかくれる', '光の守りの結界をはって、みんなの前に立ちはだかる'], ans: 2,
    miss: ['…いや、けがが治ったばかりのみんなを、走らせるのは、あぶない。', '…いや、かくれたら、みんなが、あぶない！'],
    yes: '光の結界で、みんなを守る！\nここから先へは、一歩も通さない！' },
];
const digNight = (pro) => [
  ['sfx', 'sparkle'], ['flash'],
  ...N(`${pro.name}のまわりに、光のかべが、ぱあっと広がった！`, 'テントも、はっくつのあなも、まるごと、光の結界につつまれた！'),
  ...fight('sand_worm', 'fq_sandnight', WQ4.digGuard),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('…砂の魔物たちは、光をきらって、北の砂ばくへ、にげていった。', 'やがて、東の空が、明るくなってきた…。'),
  ...S(pro.name, '朝だ。みんな、無事だ！\nザイナブさんに、知らせよう。'),
];
const digHost = (x) => {
  if (x.flag(WQ4.digDone)) return S(ZAINAB, 'はっくつは、じゅんちょうよ！', 'このお守りが出てきた所の下に、古い神殿が、ねむっているみたい。');
  if (!x.flag(WQ4_OPEN)) return S(ZAINAB, 'わたしは、はっくつ隊の隊長ザイナブ。', '王家のピラミッドのまわりには、まだまだ、ひみつがねむっているのよ。');
  if (x.flag(WQ4.digGuard)) {
    return [
      ...S(ZAINAB, 'ひと晩じゅう、みんなを守ってくれたのね…！\nけが人もいない。はっくつのあなも、無事よ！'),
      ['sfx', 'sparkle'],
      ...N('そのとき、はっくつのあなの方から、大きな声がした。'),
      ...S('見習いの子どもアミン', '隊長ー！\n砂の中から、光るお守りが出てきたよー！'),
      ...S(ZAINAB, 'まあ…！これは、むかし、この地を守っていた神さまのお守りだわ。', 'きっと、ゆうべのあなたのすがたを見て、目をさましたのね。'),
      ...S(guardName(x), 'みんなを守って、みんなを治す。\nそれが、守る者の仕事だからね。'),
      ...S(ZAINAB, 'このお守りは、あなたが持っているのが、いちばんだわ。\nはっくつ隊からの、お礼もいっしょにね！'),
      ...rewardSteps(Q.dig),
    ];
  }
  if (x.flag(WQ4.digStart)) {
    if (!all(x, DIG_VOICES)) return S(ZAINAB, `はっくつ隊のみんなの話は、今${nOf(x, DIG_VOICES)}人。`, 'けがをした人・料理番・見習いのアミンに、話を聞いてあげて。');
    return S(ZAINAB, 'みんなの話を、聞いてくれたのね。', '日がしずんだら、はっくつのあなの前で、見張りをおねがい！');
  }
  const pro = proOf(x, Q.dig);
  return [
    ...S(ZAINAB, 'ようこそ、王家のピラミッドのはっくつ隊へ。', '…と言いたいところだけど、こまっているの。'),
    ...S(ZAINAB, '毎ばん、北の砂の中から、魔物が、はっくつのあなをねらって来るのよ。\nけが人も出て、みんな、くたくたで…。'),
    ...(pro ? S(ZAINAB, `${pro.name}さん…その守りのかまえ、ただ者じゃないわね。\nおねがい、みんなを守って！`) : S(ZAINAB, 'けがを治して、みんなを守ってくれる人がいたら…。')),
    ...accept('はっくつ隊を守る？', [
      ...S(ZAINAB, 'ありがとう！', 'まずは、はっくつ隊のみんなの話を聞いてあげて。\nけがをした人・料理番・見習いのアミンよ。'),
      ...S(ZAINAB, 'それから、日がしずんだら、はっくつのあなの前で、見張りをおねがいね。'),
    ], S(ZAINAB, 'そう…。'), WQ4.digStart),
  ];
};
// 見張りを した「守る者」の 名前（その 系統の 人が いなければ 話しかけた 人）
function guardName(x) { return proOf(x, Q.dig)?.name || '{name}'; }
// はっくつの あな（夜の 見張り。決めるのは ガーディアンか大神官の 系統だけ）
const digHole = (x) => {
  if (!x.flag(WQ4.digStart)) return N('ふかいはっくつのあなだ。', 'なわばしごの下で、何かが、きらりと光った…ような気がする。');
  if (x.flag(WQ4.digGuard)) return N('はっくつのあなは、無事だ。', '（ザイナブに知らせよう）');
  const pro = proOf(x, Q.dig);
  if (!all(x, DIG_VOICES)) return N('ふかいはっくつのあなだ。', '（まずは、はっくつ隊のみんなの話を聞こう）');
  if (!pro) return [...N('日がしずんできた…。', 'けがをした人たちは、まだ、いたそうにしている。'), ...need(Q.dig)];
  return [
    ...S(pro.name, '日がしずむ…。\nみんなを、守りぬくぞ。'),
    ...chain(x, pro, DIG_PLAN, DIG_STEPS, S(pro.name, '…はっくつ隊のみんなの話を、思い出そう。'), digNight(pro)),
  ];
};
const digVoice = voiceOf(WQ4.digStart, WQ4.digDone, DIG_VOICES);
const digV1 = digVoice(0, 'けがをしたはっくつ隊の人', ['いたた…。ゆうべ、魔物におそわれて、足をくじいてしまって…。', 'みんな、けがをしたまま、はたらいているんだ。\nだれか、治してくれたらなあ…。'], ['砂ほりは、たいへんだけど、楽しい仕事さ。'], '足、すっかりよくなったよ！ありがとう！');
const digV2 = digVoice(1, 'はっくつ隊の料理番', ['魔物は、いつも、北の砂の中から来るの。', 'それにね、あいつら、明るい光が大きらいみたい。\nたき火の近くには、あまり来ないのよ。'], ['今夜は、豆のスープよ。たくさん食べてね！'], 'ゆうべは、あなたのおかげで、ぐっすりねむれたわ！');
const digV3 = digVoice(2, '見習いの子どもアミン', ['ぼく、魔物がこわくて、ねむれないんだ…。', 'だれかが、ぼくたちの前に立って、守ってくれたら…\nきっと、ぐっすりねむれるのになあ。'], ['ぼく、アミン！\nいつか、大発見をするんだ！'], 'ぼく、お守りを見つけたんだよ！\n…ほんとうは、あなたが守ってくれたからだね！');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests4(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 24. われた湯船
  if (f(WQ4.spaStart) && !f(WQ4.spaDone)) {
    const W = 'fq_spa_host';
    if (!f(WQ4.spaRock)) q('spa', { who: W, find: 'fq_spa_rock', ready: false, text: '湯けむりの白い岩を取ろう', hint: 'ひみつの温泉の北西のすみの、湯けむりの白い岩を取りに行こう。' });
    else if (cnt(f, SPA_VOICES) < 3) q('spa', { who: W, find: `fq_spa_v${firstMissing(f, SPA_VOICES) + 1}`, ready: false, text: `温泉の話 ${cnt(f, SPA_VOICES)}/3`, hint: '子ザルのモンタ・湯治の旅人・れん金術師見習いのアルトに、話を聞こう。' });
    else q('spa', { who: W, ready: true, text: 'イワオと湯船を直そう', hint: `みんなの話を思い出して、湯船を作りかえよう。まちがえても、やり直せる。${jobHint('spa')}` });
  }
  // 25. 雲の下の おとしもの
  if (f(WQ4.espStart) && !f(WQ4.espDone)) {
    const W = 'fq_esp_host';
    if (cnt(f, ESP_VOICES) < 3) q('esp', { who: W, find: `fq_esp_v${firstMissing(f, ESP_VOICES) + 1}`, ready: false, text: `島の話 ${cnt(f, ESP_VOICES)}/3`, hint: 'ハネノの島の南の、ソヨの友だちフワ・島のはしの見張り・雲つりのおじいさんに、話を聞こう。' });
    else q('esp', { who: W, ready: true, text: 'ソヨの羽かざりをさがそう', hint: `島の話を思い出して、こっそり羽かざりをさがそう。まちがえても、やり直せる。${jobHint('esp')}` });
  }
  // 26. はっくつ隊を 守る
  if (f(WQ4.digStart) && !f(WQ4.digDone)) {
    const W = 'fq_dig_host';
    if (f(WQ4.digGuard)) q('dig', { who: W, ready: true, text: 'ザイナブに知らせよう', hint: '夜の見張りで、はっくつ隊を守りぬいた。隊長のザイナブに知らせよう。' });
    else if (cnt(f, DIG_VOICES) < 3) q('dig', { who: W, find: `fq_dig_v${firstMissing(f, DIG_VOICES) + 1}`, ready: false, text: `はっくつ隊の話 ${cnt(f, DIG_VOICES)}/3`, hint: 'けがをしたはっくつ隊の人・料理番・見習いのアミンに、話を聞こう。' });
    else q('dig', { who: W, find: 'fq_dig_hole', ready: false, text: 'はっくつのあなの前で見張ろう', hint: `はっくつ隊の話を思い出して、夜の見張りをしよう。まちがえても、やり直せる。${jobHint('dig')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK4_SCRIPTS = {
  fq_spa_host: spaHost, fq_spa_rock: spaRock, fq_spa_v1: spaV1, fq_spa_v2: spaV2, fq_spa_v3: spaV3,
  fq_esp_host: espHost, fq_esp_v1: espV1, fq_esp_v2: espV2, fq_esp_v3: espV3,
  fq_dig_host: digHost, fq_dig_hole: digHole, fq_dig_v1: digV1, fq_dig_v2: digV2, fq_dig_v3: digV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK4_STORY_SCRIPTS = ['fq_spa_rock', 'fq_dig_hole'];
