// 第88回 G3班: まぼろしの回ろう（ライバルの まぼろし。docs/plan-r88-anime-gear.md の 7-1・12-4）
//   ルミナの町の 星の神殿の「試練の番人」の となりの 階段から 入る 回廊。作品ごとの とびらの 中で、ライバルの まぼろしに 勝つと
//   その ライバルの 品（伝説・名品）が もらえる。
//
//   この ファイルは データと きまりだけ（ほかの ファイルを import しない。monsters.js・abilities.js・encounters.js からも 読む）
//     RIVAL_DOORS … とびら（回廊に ならぶ じゅん）。作品が ふえたら 1行 足す
//     RIVALS      … ライバル（作品・名前・順番・レベル・借りる 職業・使う 品・ごほうび・ひとこと・大技）。作品の 中は n の じゅん
//   しくみ: 戦い … shared/battle-rival-r88.js / 回廊の 話・ごほうび … shared/world/rivals-r88.js / 持ち物の 数え方 … shared/rivals-r88.js /
//           マップ … shared/maps/rivals-r88.js / とびらの まど … client/ui/rivals-r88.js
//
// ライバルを 足す 手順（設計書の「実装メモ（G3班）」にも 書いた）
//   1. 作品の とびらが まだ ない ときは RIVAL_DOORS に 1行（work は data/works.js の id）
//   2. RIVALS に 1行（id は 作品の 頭文字 ＋ 名前。n は 作品の 中の じゅん。reward は data/items-r88-*.js の 品の id）
//   3. tools/sim-rival.mjs <id> で 勝ちやすさを はかって、tune（hp・dmg）を 合わせる（大技の 強さは 最大HPの わりあい。sig.hit・sig.guard）
//      （完全オートで 3わり いか・しかけを 知って いれば 7〜8わり）
//   4. 名前・ひとことは 使える 漢字だけ（tools/kanji-check.mjs）。ひとことは みじかく、こわく しない。物語の ネタバレは 書かない

// とびらが 開く 数（その 作品の 品を いくつ 持って いるか。ふくろ・預かり所・装備。同じ 品は 1つ）
export const DOOR_NEED = 3;
// もう 持って いる 人に わたす かわりの お金（ライバルの レベル × これ）
export const RIVAL_GOLD_PER_LV = 30;

// ───────────── とびら ─────────────
// work … 作品（data/works.js）/ mark … とびらの 上の しるし（client/render/boards.js の かんばんの 絵）/
// bg … 戦いの 背景（今 ある 背景）/ room … とびらの 中の 部屋の ゆか（maps/rivals-r88.js の ROOM_STYLES）/
// jobs … その 作品の 職業（家族に いると まぼろしの ひとことが かわる）
export const RIVAL_DOORS = [
  { work: 'houshin', mark: 'r88_houshin', bg: 'kumoi', room: 'cloud', jobs: ['fishing_doshi', 'sennin_doshi', 'taikobo', 'hoshin_gunshi', 'chaos_gunshi'] },
  { work: 'yaiba', mark: 'r88_yaiba', bg: 'hoshiyomi', room: 'wood', jobs: ['samurai_kid', 'raijin_sword', 'yaiba', 'ryujin_samurai', 'ryujin_kenshi'] },
];

// 見た目（今 ある 職業の 絵と 色を 使い回す。style・hcol・tone は data/looks.js の id）
const L = (body, style, hcol, color, tone = 'light', face = 'sharp') => ({ body, hair: 0, hairColor: 0, skin: 0, color, style, hcol, tone, face });

// ───────────── ライバル ─────────────
// id / work / n（作品の 中の じゅん）/ name / lv（3だん: 名品 60ごろ・伝説 80ごろ・作品で いちばん 100ごろ）/
// job … 借りる 職業（その 職業の 技を 使う。shared/battle-trial.js の まぼろしの しくみ）/ look … 見た目 /
// members … 何人かで 戦う ときの ならび（1人めが 大技を 使う。ない ときは name・job・look の 1人）/
// use … 使う 品（大技の もとに なる 品）/ reward … 勝つと もらえる 品（1人に 1つずつ。何こ 書いても よい）/
// words … はじめの ひとこと / same … その 作品の 職業の 家族が いる 時の ひとこと（ない ときは SAME_WORDS）/ bg … とびらと べつの 背景 /
// sig … 大技（戦いで 1回。前ぶれの つぎの 番に 出す）: name・cast（出す 時）・charge（前ぶれ）・el（属性）・anim・hit・guard（最大HPの わりあい。ない ときは SIG_HIT・SIG_GUARD） /
//   at … HPが この わりあいより へったら 前ぶれ / after … その前に この 回数 動いたら 前ぶれ /
// tune … 強さの 合わせ（hp … HPの 倍率・dmg … 与える ダメージの 倍率。tools/sim-rival.mjs で 合わせた）
export const RIVALS = [
  // ── ほう神演義（伝説の 品を くれる 人は Lv80 ごろ・さいごの 申公ひょうは Lv100）──
  {
    id: 'h_chou', work: 'houshin', n: 1, name: 'ちょう公明', lv: 80, job: 'magic_swordsman', look: L(0, 'wavy', 'blonde', 4),
    use: 'r88_kinkosen', reward: ['r88_kinkosen'], words: 'ノーブルに、美しく戦おうではないか！',
    sig: { name: '七色の竜のあらし', el: 'fire', anim: 'r83a_fire', charge: '{a}が金こうせんを大きく開いた！\n七色の竜が、空でうずを巻き始めた…！', cast: '{a}の金こうせんから、七色の竜がいっせいにおそいかかった！' },
    tune: { hp: 0.85, dmg: 1 },
  },
  {
    id: 'h_dakki', work: 'houshin', n: 2, name: 'だっき', lv: 80, job: 'star_diva', look: L(1, 'hime', 'black', 6, 'fair', 'calm'),
    use: 'r88_keisei', reward: ['r88_keisei'], words: 'あら、かわいいお客さん。少しあそんであげるわ。',
    sig: { name: '羽衣のまどわしの光', el: 'dark', anim: 'dark1', charge: '{a}の羽衣が、ふしぎな色にゆらめき始めた…！', cast: '{a}の羽衣から、まどわしの光があふれ出した！' },
    tune: { hp: 0.92, dmg: 1 },
  },
  {
    id: 'h_bunchu', work: 'houshin', n: 3, name: '聞仲', lv: 82, job: 'monster_master', look: L(0, 'long', 'black', 3, 'light', 'sharp'),
    use: 'r88_kinben', reward: ['r88_kinben'], words: '国を守るためなら、わたしは何度でも立ちはだかる。',
    sig: { name: '禁べん・千里打ち', at: 0.8, after: 3, anim: 'r83a_whip', charge: '{a}が禁べんを、天高くふり上げた！\nムチが、遠くの空までのびていく…！', cast: '{a}の禁べんが、雨のようにふりそそいだ！' },
    tune: { hp: 1.07, dmg: 1 },
  },
  {
    id: 'h_sansen', work: 'houshin', n: 4, name: '三人の大せん人', lv: 84,
    members: [
      { name: '元始天尊', job: 'daikenja', look: L(0, 'bald', 'white', 7, 'light', 'calm') },
      { name: '通天教主', job: 'archmage', look: L(0, 'long', 'silver', 3, 'fair', 'sharp') },
      { name: '太上老君', job: 'high_priest', look: L(0, 'long', 'white', 5, 'light', 'calm') },
    ],
    use: 'r88_banko', reward: ['r88_banko', 'r88_rokkon'], words: 'せん人界の三人が、そなたらの力を見とどけよう。',
    sig: { name: 'ばん古ばんの大重力', anim: 'debuff', charge: '{a}が、ばん古ばんの旗を大きくかかげた！\nまわりが、ずしりと重くなっていく…！', cast: '{a}のばん古ばんから、大地をゆらす重力がおしよせた！' },
    tune: { hp: 0.83, dmg: 1 },
  },
  {
    id: 'h_shinkou', work: 'houshin', n: 5, name: '申公ひょう', lv: 100, job: 'summoner', look: L(0, 'spiky', 'white', 7, 'fair', 'sharp'),
    use: 'r88_raikoben', reward: ['r88_raikoben'], words: 'わたしは、おもしろいものの味方ですよ。さあ、見せてください。',
    sig: { name: '雷公べんの天いかずち', el: 'bolt', anim: 'r88_raikou', charge: '{a}が雷公べんを高くかかげた！\n空いっぱいに、黒い雲がうずを巻く…！', cast: '{a}が雷公べんをふり下ろすと、空がまっぷたつにさけた！' },
    tune: { hp: 0.71, dmg: 1 },
  },

  // ── YAIBA（名品を くれる 人は Lv60 ごろ・さいごの おに丸〈おにの王〉は Lv100）──
  {
    id: 'y_hakki', work: 'yaiba', n: 1, name: '八おに', lv: 60,
    members: [
      { name: 'バットマン', job: 'black_org', look: L(0, 'slick', 'black', 3, 'tan', 'sharp') },
      { name: 'へび男', job: 'dragon_knight', look: L(0, 'buzz', 'green', 2, 'tan', 'sharp') },
      { name: 'カエル男', job: 'kinniku_kappa', look: L(0, 'bald', 'green', 2, 'light', 'round') },
    ],
    use: 'r88_saber', reward: ['r88_saber', 'r88_snake_spear', 'r88_frog_axe'], words: 'おれたち八おにを、たおせるものか！',
    sig: { name: 'こうもりの大急こう', anim: 'slash_heavy', charge: '{a}が、天じょうまでまい上がった！\nつばさを大きく広げている…！', cast: '{a}が、目にもとまらぬ速さでおそいかかった！' },
    tune: { hp: 0.8, dmg: 1 },
  },
  {
    id: 'y_goemon', work: 'yaiba', n: 2, name: '石川五右衛門', lv: 60, job: 'kaito_kid', look: L(0, 'wild', 'black', 4, 'tan', 'brave'),
    use: 'r88_iron_kasa', reward: ['r88_iron_kasa'], words: 'ぜっけい、ぜっけい！さて、ひと勝負といこうか。',
    sig: { name: '鉄のかさ大回転', anim: 'slash_heavy', charge: '{a}が、鉄のかさをくるくる回し始めた！\n回るたびに、速くなっていく…！', cast: '{a}の鉄のかさが、うなりを上げてとんできた！' },
    tune: { hp: 1.05, dmg: 1 },
  },
  {
    id: 'y_okita', work: 'yaiba', n: 3, name: '沖田総司', lv: 62, job: 'himura', look: L(0, 'pony', 'black', 1, 'fair', 'calm'),
    use: 'r88_kikuichi', reward: ['r88_kikuichi'], words: 'ぼくの剣は速いですよ。ついてこられますか？',
    sig: { name: 'きく一文字・三だんづき', anim: 'slash_fast', charge: '{a}が、すっと刀をかまえた…！\nするどい気配が、あたりをつつむ…！', cast: '{a}が、目にも見えない三だんづきをはなった！' },
    tune: { hp: 0.96, dmg: 1 },
  },
  {
    id: 'y_kojiro', work: 'yaiba', n: 4, name: '佐々木小次ろう', lv: 64, job: 'sword_master', look: L(0, 'long', 'black', 6, 'fair', 'sharp'),
    use: 'r88_monohoshi', reward: ['r88_monohoshi'], words: 'この長い刀のとどく所、すべてがわたしの間合いだ。',
    sig: { name: '物ほしざお・つばめ切り', at: 0.8, after: 3, anim: 'slash_heavy', charge: '{a}が、長い刀を大きく引いた！\nつばめが、空を一直線にとんでいく…！', cast: '{a}の長い刀が、つばめのようにひるがえった！' },
    tune: { hp: 0.63, dmg: 1 },
  },
  {
    id: 'y_oni', work: 'yaiba', n: 5, name: 'おに丸', lv: 66, job: 'magic_swordsman', look: L(0, 'spiky', 'black', 0, 'light', 'sharp'),
    use: 'r88_fujin_sword', reward: ['r88_fujin_sword'], words: 'ふん、また会ったな。今日こそ決着をつけるぞ！',
    sig: { name: '風神剣・大竜まき', el: 'wind', anim: 'r82b_slash', charge: '{a}が風神剣をかかげた！\nまわりの風が、ごうごうとうなり始めた…！', cast: '{a}の風神剣から、大きな竜まきがまき起こった！' },
    tune: { hp: 1.39, dmg: 1 },
  },
  {
    id: 'y_oniking', work: 'yaiba', n: 6, name: 'おにの王・おに丸', lv: 100, job: 'maou', look: L(0, 'wild', 'black', 0, 'light', 'sharp'), bg: 'rift_moon',
    use: 'r88_maou_sword', reward: ['r88_maou_sword'], words: '月の力を手に入れたおれは、もう止められんぞ！',
    sig: { name: '魔王剣・満月', el: 'dark', anim: 'r82b_slash', charge: '{a}の魔王剣のあなが、まるい満月の形になった…！\n黒い光が、あふれ出す…！', cast: '{a}の魔王剣から、満月のような黒い光のやいばがはなたれた！' },
    tune: { hp: 0.52, dmg: 1 },
  },
];

// その 作品の 職業の 家族が いる 時の ひとこと（rv.same が ない とき）
export const SAME_WORDS = 'ほう、同じ道を行く者か。ならば、手かげんはせぬぞ。';
// 大技の 前ぶれ（ほかの 時の at・after。rv.sig に 書けば その 人だけ かわる）
export const SIG_AT = 0.6;
export const SIG_AFTER = 5;

// ───────────── 引く 物 ─────────────
export const RIVAL_BY_ID = Object.fromEntries(RIVALS.map((r) => [r.id, r]));
export const doorOf = (work) => RIVAL_DOORS.find((d) => d.work === work) || null;
// とびらが 光って いる しるし（キャラの flags。maps/rivals-r88.js の とびらの 前の 光る わ。shared/rivals-r88.js の refreshDoorFlags）
export const doorFlag = (work) => `r88door_${work}`;
// その 作品の ライバル（n の じゅん）
export function rivalsOf(work) {
  return RIVALS.filter((r) => r.work === work).sort((a, b) => a.n - b.n);
}
// 戦う 人の ならび（1人めが 大技を 使う）
export function rivalMembers(rv) {
  return rv?.members?.length ? rv.members : [{ name: rv?.name, job: rv?.job, look: rv?.look }];
}
// 強さの だん（60・80・100）
export function rivalTier(lv) {
  return lv >= 95 ? 100 : lv >= 75 ? 80 : 60;
}
export const rivalEnc = (id) => `rival_${id}`;
export const sigChargeId = (id) => `r88r_${id}_c`;
export const sigId = (id) => `r88r_${id}`;

// ───────────── 勝った 記録（キャラの rivals: { ライバルの id: 1 }。1人ずつ）─────────────
export function rivalWon(c, id) {
  return !!(c?.rivals && c.rivals[id]);
}
export function markRivalWin(c, id) {
  if (!c || !RIVAL_BY_ID[id]) return false;
  const first = !rivalWon(c, id);
  c.rivals = { ...(c.rivals && typeof c.rivals === 'object' && !Array.isArray(c.rivals) ? c.rivals : {}), [id]: 1 };
  return first;
}
// 次に ちょうせん できる 人（ぜんぶ 勝った ときは null）
export function nextRival(c, work) {
  return rivalsOf(work).find((r) => !rivalWon(c, r.id)) || null;
}
// ちょうせん できるか（前の 人に 勝って いる。勝った 人には 何回でも）
export function rivalOpen(c, id) {
  const rv = RIVAL_BY_ID[id];
  if (!rv) return false;
  return rivalsOf(rv.work).filter((r) => r.n < rv.n).every((r) => rivalWon(c, r.id));
}
// 古い セーブ・引っこしで こわれた 記録を ととのえる（world/save.js の repairChar。知らない id は のこす〈あとで 足す 作品〉）
export function repairRivals(c) {
  if (!c || c.rivals === undefined) return;
  if (!c.rivals || typeof c.rivals !== 'object' || Array.isArray(c.rivals)) {
    delete c.rivals;
    return;
  }
  const out = {};
  for (const [k, v] of Object.entries(c.rivals)) if (v && /^[a-z0-9_]{1,40}$/.test(k)) out[k] = 1;
  if (Object.keys(out).length) c.rivals = out;
  else delete c.rivals;
}
// 家族の セーブを 合わせる（world/merge.js。どちらかで 勝って いれば 勝った）
export function mergeRivals(b, a, t) {
  const ok = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const out = {};
  for (const [k, v] of [...Object.entries(ok(a)), ...Object.entries(ok(t))]) if (v) out[k] = 1;
  void b;
  return Object.keys(out).length ? out : undefined;
}

// ───────────── 大技の かくし技（abilities.js が まぜる）─────────────
//   前ぶれ（telegraph）→ つぎの 番に 大技（敵全体。その 人の 最大HP × SIG_HIT。身を 守って いれば × SIG_GUARD。
//   shared/battle-rival-fx-r88.js）。rv.sig に hit・guard を 書けば その 人だけ かわる
export const SIG_HIT = 1.15;
export const SIG_GUARD = 0.45;
export function rivalAbilities() {
  const out = {};
  for (const rv of RIVALS) {
    const s = rv.sig;
    if (!s) continue;
    out[sigChargeId(rv.id)] = {
      name: `${s.name}の前ぶれ`, kind: 'monster', target: 'self',
      effect: { type: 'telegraph', next: sigId(rv.id) }, cast: `${s.charge}\n（次の番に大技が来る！身を守ろう）`, anim: 'charge',
      desc: `次の番に「${s.name}」。身を守ろう。`,
    };
    out[sigId(rv.id)] = {
      name: s.name, kind: 'monster', target: 'enemies',
      effect: { type: 'r88Rival', hit: s.hit ?? SIG_HIT, guard: s.guard ?? SIG_GUARD, ...(s.el ? { element: s.el } : {}) }, cast: s.cast, anim: s.anim || 'slash_heavy',
      desc: `${s.name}。全員に大ダメージ。身を守ると、たえられる。`,
    };
  }
  return out;
}

// ───────────── まぼろしの 魔物（monsters.js が 数えない 形で まぜる）─────────────
//   ここの 数は もとの 強さ（だんごと）。戦いの はじめに shared/battle-rival-r88.js が 借りる 職業の 得意・苦手と tune を かける
const STATUS = { sleep: 0.15, poison: 0.3, confuse: 0.15, blind: 0.3, silence: 0.3, paralyze: 0.15 };
const phantom = (lv, hp, str, def, agi, mag, speed, exp) => ({
  name: 'ライバルのまぼろし', lv, hp, mp: 999, str, def, agi, mag, dmgRate: 0.55, exp, gold: 0,
  race: 'human', size: 'm', boss: true, turns: 2, speed, hit: 'slash', art: 'utsushimi',
  resist: { ...STATUS },
  actions: [{ w: 1, id: 'attack' }],
  phases: [{ hpBelow: 0.35, msg: ['まぼろしの体から、するどい気があふれ出した！', '…攻撃力が上がった！'], buff: { atk: 1.12 } }],
  desc: 'まぼろしの回ろうで戦う、ライバルのまぼろし。職業の技と、自分の品の大技を使ってくる。',
});
export const RIVAL_MONSTERS = {
  rival_phantom60: phantom(60, 25500, 237, 154, 102, 221, 0.72, 12000),
  rival_phantom80: phantom(80, 50000, 310, 198, 122, 282, 0.75, 30000),
  rival_phantom100: phantom(100, 80000, 380, 240, 140, 345, 0.78, 50000),
};
// きまった 戦い（world/rivals-r88.js が startFixedBattle で はじめる）。にげられない・負けても お金は へらない（loseOk）
export const FIXED_RIVAL = Object.fromEntries(RIVALS.map((rv) => [rivalEnc(rv.id), {
  group: [[`rival_phantom${rivalTier(rv.lv)}`, rivalMembers(rv).length]],
  bg: rv.bg || doorOf(rv.work)?.bg || 'mirror_hall', bgm: 'boss', canFlee: false, loseOk: true, boss: true, trial: true,
}]));
// 数えない 形で まぜる（図鑑・魔物の 数・配合の 一覧には 出ない。仲間にも ならない）
export function addRivalHidden(table) {
  for (const [id, m] of Object.entries(RIVAL_MONSTERS)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}
