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
  // G5班: スレイヤーズ（石の 広間・塔の 中）・烈火の炎（火山）
  { work: 'slayers', mark: 'r88_slayers', bg: 'tower', room: 'stone', jobs: ['tabi_madoshi', 'lina', 'doramata'] },
  { work: 'rekka', mark: 'r88_rekka', bg: 'volcano', room: 'volcano', jobs: ['enjutsushi', 'rekka'] },  // G7班: 犬夜しゃ（森の 部屋・森）・ゆう☆遊☆白書（石の 広間・闘技場）
  { work: 'inuyasha', mark: 'r88_inuyasha', bg: 'forest', room: 'forest', jobs: ['hanyo_boy', 'tessaiga_user', 'inuyasha', 'bakuryuha'] },
  { work: 'yuhaku', mark: 'r88_yuhaku', bg: 'arena', room: 'stone', jobs: ['furyo', 'reikai_tantei', 'yusuke', 'makai_prince'] },
  ...g8Doors(), // G8班: らんま1/2・じごく先生ぬ〜べ〜（ファイルの さいご）
  ...g10Doors(), // G10班: ナルト・きめつのやいば（ファイルの さいご）
  ...g9Doors(), // G9班: ドラゴンボール・ワンピース（ファイルの さいご）
  ...g11Doors(), // G11班: るろうに剣心・コナンと快と（ファイルの さいご）
  ...g12Doors(), // G12班: ドラえもん・セーラームーン（ファイルの さいご）
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
    // G6班（設計書 7-2）: 太極図の巻物（太上老君の 品）も。もう 勝って いる 人は、もう一度 勝つと 持って いない 分だけ もらえる
    //   added … あとから 足した ごほうび（勝ちずみの 人に しおりの おすすめで 知らせる。shared/rivals-r88.js の rivalRec）
    use: 'r88_banko', reward: ['r88_banko', 'r88_rokkon', 'r88_taikyoku'], added: ['r88_taikyoku'], words: 'せん人界の三人が、そなたらの力を見とどけよう。',
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
    tune: { hp: 1.02, dmg: 1 },
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
    tune: { hp: 1.5, dmg: 1 },
  },
  {
    id: 'y_oniking', work: 'yaiba', n: 6, name: 'おにの王・おに丸', lv: 100, job: 'maou', look: L(0, 'wild', 'black', 0, 'light', 'sharp'), bg: 'rift_moon',
    use: 'r88_maou_sword', reward: ['r88_maou_sword'], words: '月の力を手に入れたおれは、もう止められんぞ！',
    sig: { name: '魔王剣・満月', el: 'dark', anim: 'r82b_slash', charge: '{a}の魔王剣のあなが、まるい満月の形になった…！\n黒い光が、あふれ出す…！', cast: '{a}の魔王剣から、満月のような黒い光のやいばがはなたれた！' },
    tune: { hp: 0.52, dmg: 1 },
  },

  // ── スレイヤーズ（G5班。名品・ふつうを くれる 人は Lv60 ごろ・伝説 Lv80 ごろ・さいごの 赤い目の魔王は Lv100）──
  {
    id: 's_naga', work: 'slayers', n: 1, name: 'ナーガ', lv: 60, job: 'archmage', look: L(1, 'long', 'black', 3, 'fair', 'smile'),
    use: 'r88_naga_spike', reward: ['r88_naga_spike'], words: 'おーっほっほっほ！このナーガさまが相手よ！',
    sig: { name: 'トゲのかたあて大とっしん', anim: 'laugh', charge: '{a}が、高らかに笑い始めた！\nトゲのかたあてが、きらりと光る…！', cast: '{a}が、笑いながらトゲのかたあてで体当たりしてきた！' },
    tune: { hp: 1.37, dmg: 1 },
  },
  {
    id: 's_zangulus', work: 'slayers', n: 2, name: 'ザングルス', lv: 62, job: 'sword_master', look: L(0, 'wild', 'brown', 4, 'tan', 'brave'),
    use: 'r88_zangulus', reward: ['r88_zangulus'], words: '剣の勝負なら、だれにも負けん！',
    sig: { name: 'ザングルスの剣・大回転切り', anim: 'slash_heavy', charge: '{a}が、剣を大きくふりかぶった！\n「今度こそ、負けん！」…！', cast: '{a}の剣が、うなりを上げてふりぬかれた！' },
    tune: { hp: 0.7, dmg: 1 },
  },
  {
    id: 's_xellos', work: 'slayers', n: 3, name: 'ゼロス', lv: 80, job: 'datenshi', look: L(0, 'bob', 'purple', 3, 'fair', 'smile'),
    use: 'r88_demonblood', reward: ['r88_demonblood'], words: 'それは、ひみつです。さあ、始めましょうか。',
    sig: { name: '魔血玉の闇のうず', el: 'dark', anim: 'dark1', charge: '{a}が、にこにこしながらつえをかかげた…！\n4つの玉が、ふしぎな色に光り始めた…！', cast: '{a}のまわりから、闇のうずがおしよせた！' },
    tune: { hp: 0.96, dmg: 1 },
  },
  {
    id: 's_igai', work: 'slayers', n: 4, name: 'エルロゴスとシーリウス', lv: 82,
    members: [
      { name: 'エルロゴス', job: 'guardian', look: L(0, 'buzz', 'gray', 0, 'tan', 'sharp') },
      { name: 'シーリウス', job: 'magic_swordsman', look: L(0, 'short', 'blonde', 1, 'fair', 'calm') },
    ],
    use: 'r88_bodigar', reward: ['r88_bodigar', 'r88_nezard'], words: '異界の魔王の武器の力、見せてあげよう。',
    sig: { name: 'ボーディガーの大地われ', anim: 'quake', charge: '{a}が、大きなつちを高くふり上げた！\n地面が、ぐらぐらゆれ始めた…！', cast: '{a}のボーディガーが、大地をたたきわった！' },
    tune: { hp: 0.76, dmg: 1 },
  },
  {
    id: 's_shabra', work: 'slayers', n: 5, name: '赤い目の魔王', lv: 100, job: 'grand_magus', look: L(0, 'long', 'red', 0, 'fair', 'sharp'), bg: 'castle_fire',
    use: 'r88_gorun', reward: ['r88_gorun'], words: 'よくぞ来た。光の剣の持ち主にふさわしいか、見せてもらおう。',
    sig: { name: '赤い目の魔王の大火', el: 'fire', anim: 'fire3', charge: '{a}の赤い目が、ぎらりと光った！\nまわりが、まっ赤にそまっていく…！', cast: '{a}から、赤い炎の大波がおしよせた！' },
    tune: { hp: 0.56, dmg: 1 },
  },

  // ── 烈火の炎（G5班。名品を くれる 人は Lv60 ごろ・伝説 Lv80 ごろ・さいごの 雷はは Lv100）──
  {
    id: 'r_mokuren', work: 'rekka', n: 1, name: '木れん', lv: 60, job: 'monster_master', look: L(0, 'bob', 'green', 2, 'light', 'smile'),
    use: 'r88_kodama', reward: ['r88_kodama'], words: 'ぼくの木は、どこまでものびるよ！',
    sig: { name: '木だまの大きな根', anim: 'r83a_whip', charge: '{a}の体から、木の根がのび始めた！\n根が、ぐんぐん大きくなっていく…！', cast: '{a}の木の根が、いっせいにおそいかかった！' },
    tune: { hp: 1.4, dmg: 1 },
  },
  {
    id: 'r_kai', work: 'rekka', n: 2, name: 'かい', lv: 62, job: 'snow_queen', look: L(0, 'long', 'silver', 1, 'fair', 'calm'),
    use: 'r88_hyoma', reward: ['r88_hyoma'], words: '氷魔えんのつめたさ、教えてやろう。',
    sig: { name: '氷魔えん・氷のやいば', el: 'ice', anim: 'blizzard', charge: '{a}の刀から、つめたい空気があふれ出した！\nまわりが、白くこおっていく…！', cast: '{a}の氷魔えんから、氷のやいばがふりそそいだ！' },
    tune: { hp: 1.05, dmg: 1 },
  },
  {
    id: 'r_joker', work: 'rekka', n: 3, name: 'ジョーカー', lv: 64, job: 'psychicer', look: L(0, 'spiky', 'orange', 6, 'light', 'smile'),
    use: 'r88_taishaku', reward: ['r88_taishaku'], words: 'ほな、ちょっとあそぼか！',
    sig: { name: 'たいしゃくかい天・大重力', at: 0.8, after: 3, anim: 'debuff', charge: '{a}が、三つまたのほこをくるくる回し始めた！\nまわりが、ずしりと重くなっていく…！', cast: '{a}のたいしゃくかい天から、大きな重力がおしよせた！' },
    tune: { hp: 1.32, dmg: 1 },
  },
  {
    id: 'r_koganei', work: 'rekka', n: 4, name: '小金井', lv: 80, job: 'konoha', look: L(0, 'spiky', 'brown', 4, 'light', 'brave'),
    use: 'r88_kougon_kiba', reward: ['r88_kougon_kiba'], words: 'へへっ、おいらの鋼金暗器、見せてやるよ！',
    sig: { name: '鋼金暗器・三日月まわし', anim: 'slash_multi', charge: '{a}の鋼金暗器が、かちゃかちゃと形をかえ始めた！\n大きな三日月の形になっていく…！', cast: '{a}の三日月のやいばが、うなりを上げてとんできた！' },
    tune: { hp: 0.78, dmg: 1 },
  },
  {
    id: 'r_raiha', work: 'rekka', n: 5, name: '雷は', lv: 100, job: 'summoner', look: L(0, 'long', 'blonde', 4, 'fair', 'calm'), bg: 'arena',
    use: 'r88_raijin', reward: ['r88_raijin'], words: 'いい戦いにしましょう。手かげんはしませんよ。',
    sig: { name: '雷神・百のいかずち', el: 'bolt', anim: 'r88_raijin', charge: '{a}の雷神が、ばちばちと光り始めた！\n空いっぱいに、雷の力が集まっていく…！', cast: '{a}の雷神から、百のいかずちがふりそそいだ！' },
    tune: { hp: 0.72, dmg: 1 },
  },

  // ── G7班 犬夜しゃ（名品を くれる 人は Lv60 ごろ・さいごの 本気の せっしょう丸は Lv100）。神無は 入れない（神無の鏡は ガチャ）──
  {
    id: 'iy_kagura', work: 'inuyasha', n: 1, name: '神楽', lv: 60, job: 'tenkou_tsukai', look: L(1, 'bob', 'black', 6, 'fair', 'sharp'),
    use: 'r88_iy_kagura', reward: ['r88_iy_kagura'], words: '風はだれにもしばられないのさ。',
    sig: { name: '神楽のおうぎ・風のやいばのまい', el: 'wind', anim: 'wind2', charge: '{a}が、おうぎを大きく広げた！\nまわりの風が、うずを巻き始めた…！', cast: '{a}のおうぎから、たくさんの風のやいばがまいおどった！' },
    tune: { hp: 1.04, dmg: 1 },
  },
  {
    id: 'iy_kouga', work: 'inuyasha', n: 2, name: 'こうが', lv: 62, job: 'god_hand', look: L(0, 'pony', 'black', 4, 'tan', 'brave'),
    use: 'r88_iy_goraishi', reward: ['r88_iy_goraishi'], words: 'おれの足の速さに、ついてこられるか！',
    sig: { name: '五雷指・いなずまのツメ', el: 'bolt', anim: 'bolt2', charge: '{a}のツメが、ばちばちと光り始めた！\nつむじ風のように走り回っている…！', cast: '{a}の五雷指から、いなずまがほとばしった！' },
    tune: { hp: 1.19, dmg: 1 },
  },
  {
    id: 'iy_shichinin', work: 'inuyasha', n: 3, name: '七人隊', lv: 64,
    members: [
      { name: 'ばんこつ', job: 'guardian', look: L(0, 'long', 'black', 1, 'tan', 'brave') },
      { name: 'じゃこつ', job: 'sword_master', look: L(0, 'long', 'black', 6, 'fair', 'smile') },
    ],
    use: 'r88_iy_banryu', reward: ['r88_iy_banryu', 'r88_iy_jakotsu'], words: 'おれたち七人隊の、うでを見せてやる！',
    sig: { name: 'ばん竜・大竜雷せん', el: 'bolt', anim: 'bolt2', charge: '{a}が、大きなほこを空につき上げた！\n空に、雷の力が集まっていく…！', cast: '{a}のばん竜から、雷がいっせいに落ちてきた！' },
    tune: { hp: 0.81, dmg: 1 },
  },
  {
    id: 'iy_sessho', work: 'inuyasha', n: 4, name: 'せっしょう丸', lv: 66, job: 'magic_swordsman', look: L(0, 'long', 'silver', 7, 'fair', 'calm'),
    use: 'r88_iy_toukijin', reward: ['r88_iy_tenseiga', 'r88_iy_toukijin'], words: 'ふん。少しはできるようになったか。',
    sig: { name: 'とうきじん・そう竜は', el: 'dark', anim: 'dark1', charge: '{a}が、とうきじんをすっと引いた…！\n刀に、黒い力がうずを巻いていく…！', cast: '{a}のとうきじんから、黒いいなずまの竜がほとばしった！' },
    tune: { hp: 1.39, dmg: 1 },
  },
  {
    id: 'iy_sessho2', work: 'inuyasha', n: 5, name: '本気のせっしょう丸', lv: 100, job: 'sword_master', look: L(0, 'long', 'silver', 7, 'fair', 'sharp'), bg: 'hoshiyomi',
    use: 'r88_iy_bakusaiga', reward: ['r88_iy_bakusaiga'], words: 'わたし自身の刀で、相手をしてやろう。',
    sig: { name: '爆さいが・くずれる光', at: 0.8, after: 3, anim: 'r88_bakusai', charge: '{a}の左うでから、みどりの光の刀が生まれた…！\nまわりの空気が、ぴりぴりとふるえている…！', cast: '{a}が爆さいがをふりぬくと、光がつぎつぎとはじけた！' },
    tune: { hp: 0.33, dmg: 1 },
  },

  // ── G7班 ゆう☆遊☆白書（名品を くれる 人は Lv60 ごろ・さいごの 幻海は Lv100）。すずこまは 入れない（デビルヨーヨーは ガチャ）──
  {
    id: 'yh_hihou', work: 'yuhaku', n: 1, name: '三大秘宝の3人', lv: 60,
    members: [
      { name: '飛影', job: 'magic_swordsman', look: L(0, 'spiky', 'black', 0, 'fair', 'sharp') },
      { name: 'くらま', job: 'monster_master', look: L(0, 'long', 'red', 6, 'fair', 'calm') },
      { name: 'ごうき', job: 'god_hand', look: L(0, 'buzz', 'blue', 2, 'tan', 'sharp') },
    ],
    use: 'r88_yh_goma', reward: ['r88_yh_goma', 'r88_yh_ankoku', 'r88_yh_gakidama'], words: 'れい界の秘宝は、かんたんにはわたさない。',
    sig: { name: '降魔の剣・闇切り', el: 'dark', anim: 'dark_slash', charge: '{a}が、降魔の剣をかまえた…！\n剣が、黒い光をすいこんでいく…！', cast: '{a}の降魔の剣が、闇のやいばをはなった！' },
    tune: { hp: 1.05, dmg: 1 },
  },
  {
    id: 'yh_urotogi', work: 'yuhaku', n: 2, name: 'うら御とぎチーム', lv: 62,
    members: [
      { name: 'ししわか丸', job: 'sword_master', look: L(0, 'long', 'blue', 3, 'fair', 'sharp') },
      { name: '黒もも太ろう', job: 'guardian', look: L(0, 'short', 'black', 0, 'light', 'brave') },
    ],
    use: 'r88_yh_makoku', reward: ['r88_yh_makoku', 'r88_yh_kibidango'], words: '昔話のヒーローは、わたしたちだ！',
    sig: { name: '魔こく鳴斬剣・なきさけぶ刀', el: 'dark', anim: 'dark_slash', charge: '{a}が刀をふると、ふしぎななき声がひびき始めた…！\n声が、どんどん大きくなっていく…！', cast: '{a}の刀から、なき声のようなやいばがとんできた！' },
    tune: { hp: 0.81, dmg: 1 },
  },
  {
    id: 'yh_bui', work: 'yuhaku', n: 3, name: '武威', lv: 64, job: 'guardian', look: L(0, 'bald', 'black', 0, 'tan', 'sharp'),
    use: 'r88_yh_bui_ono', reward: ['r88_yh_bui_yoroi', 'r88_yh_bui_ono'], words: 'よろいをぬがせてみろ。',
    sig: { name: '武威の大オノ・とう気のうず', anim: 'slash_heavy', charge: '{a}が、大オノを頭の上で回し始めた！\nとう気が、うずを巻いていく…！', cast: '{a}の大オノから、とう気のうずがおしよせた！' },
    tune: { hp: 1.43, dmg: 1 },
  },
  {
    id: 'yh_shigure', work: 'yuhaku', n: 4, name: '時雨', lv: 66, job: 'sword_master', look: L(0, 'bald', 'black', 1, 'light', 'calm'),
    use: 'r88_yh_rinka', reward: ['r88_yh_rinka'], words: 'わが剣の道、見せてやろう。',
    sig: { name: 'りん火円れき刀・大回転', hit: 1.3, anim: 'slash_multi', charge: '{a}が、大きな輪の刀を回し始めた！\n輪が、うなりを上げて速くなっていく…！', cast: '{a}の輪の刀が、うなりを上げてとんできた！' },
    tune: { hp: 0.8, dmg: 1 },
  },
  {
    id: 'yh_genkai', work: 'yuhaku', n: 5, name: '幻海', lv: 100, job: 'yusuke', look: L(1, 'short', 'pink', 1, 'light', 'calm'), bg: 'temple3',
    use: 'r88_yh_reikou', reward: ['r88_yh_reikou'], words: 'わたしの修行は、きびしいよ。',
    sig: { name: 'れい光はどう・大はどう', el: 'light', anim: 'r88_reikou', charge: '{a}の両手に、青白い光が集まっていく…！\nれい力が、どんどん大きくなっていく…！', cast: '{a}の両手から、大きな光のはどうがはなたれた！' },
    tune: { hp: 0.63, dmg: 1 },
  },
  ...g8Rivals(), // G8班: らんま1/2・じごく先生ぬ〜べ〜（ファイルの さいご）
  ...g10Rivals(), // G10班: ナルト・きめつのやいば（ファイルの さいご）
  ...g9Rivals(), // G9班: ドラゴンボール・ワンピース（ファイルの さいご）
  ...g11Rivals(), // G11班: るろうに剣心・コナンと快と（ファイルの さいご）
  ...g12Rivals(), // G12班: ドラえもん・セーラームーン（ファイルの さいご）
];

// その 作品の 職業の 家族が いる 時の ひとこと（rv.same が ない とき）
export const SAME_WORDS = 'ほう、同じ道を行く者か。ならば、手かげんはせぬぞ。';
// 大技の 前ぶれ（ほかの 時の at・after。rv.sig に 書けば その 人だけ かわる）
export const SIG_AT = 0.6;
export const SIG_AFTER = 5;

// ───────────── 引く 物 ─────────────
export const RIVAL_BY_ID = Object.fromEntries(RIVALS.map((r) => [r.id, r]));
export const doorOf = (work) => RIVAL_DOORS.find((d) => d.work === work) || null;
// G11班: とびらの 品を 数える 作品（2作品を 1まいに まとめた とびらは works。ふつうは その 作品だけ）
export const doorWorks = (work) => doorOf(work)?.works || [work];
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

// ───────────── G8班: らんま1/2・じごく先生ぬ〜べ〜 ─────────────
//   ほかの 係の 行と ぶつからない ように、ここに まとめた（上の RIVAL_DOORS・RIVALS が よぶ。function なので 先に よべる）
//   らんま1/2 … 伝説の 品が ない 作品なので、さいごの コロンも 名品を くれる（Lv80）。部屋 ＝ 木の ゆかと 湯けむり（onsen）・背景 ＝ 草原（grass）
//   じごく先生ぬ〜べ〜 … こわく しない。部屋 ＝ 教室（school）・背景 ＝ 夜の 町（village_night）。さいごは おにの手の 中の おに（Lv100）
function g8Doors() {
  return [
    { work: 'ranma', mark: 'r88_ranma', bg: 'grass', room: 'onsen', jobs: ['musabetsu_student', 'ranma', 'hiryu_master'] },
    { work: 'nube', mark: 'r88_nube', bg: 'village_night', room: 'school', jobs: ['elem_teacher', 'nube', 'jigoku_sensei'] },
  ];
}
function g8Rivals() {
  return [
    // ── らんま1/2（名品・ふつうを くれる 人は Lv60 ごろ・さいごの コロンも 名品なので Lv80）──
    {
      id: 'rm_kuno', work: 'ranma', n: 1, name: '九能帯刀', lv: 60, job: 'sword_master', look: L(0, 'short', 'brown', 6, 'fair', 'brave'),
      use: 'r88_rm_bokuto', reward: ['r88_rm_bokuto'], words: '風林館高校の青いいかずち、九能帯刀、参る！',
      sig: { name: '木刀・つきつきつき', at: 0.8, after: 3, anim: 'slash_multi', charge: '{a}が、木刀をまっすぐにかまえた！\n「つきつきつき…！」…！', cast: '{a}の木刀から、目にもとまらぬつきがとんできた！' },
      tune: { hp: 0.27, dmg: 1.2 },
    },
    {
      id: 'rm_shampoo', work: 'ranma', n: 2, name: 'シャンプー', lv: 62, job: 'god_hand', look: L(1, 'long', 'purple', 6, 'fair', 'smile'),
      use: 'r88_rm_sosui', reward: ['r88_rm_sosui'], words: 'ニーハオ！わたし、強いね。かくごするよろし！',
      sig: { name: 'そうすい・大回転', anim: 'punch_multi', charge: '{a}が、2本のこん棒をくるくる回し始めた！\n回るたびに、速くなっていく…！', cast: '{a}のこん棒が、うなりを上げてふりおろされた！' },
      tune: { hp: 1.19, dmg: 1 },
    },
    {
      id: 'rm_ryoga', work: 'ranma', n: 3, name: '良が', lv: 64, job: 'guardian', look: L(0, 'wild', 'black', 3, 'tan', 'brave'),
      use: 'r88_rm_bangasa', reward: ['r88_rm_bangasa'], words: 'ここはどこだ…？まあいい、勝負だ！',
      sig: { name: '番がさ・大地くだき', anim: 'quake', charge: '{a}が、重い番がさを高くふり上げた！\n地面に、ひびが走っていく…！', cast: '{a}の番がさが、地面ごと打ちくだいた！' },
      tune: { hp: 1.43, dmg: 1 },
    },
    {
      id: 'rm_happosai', work: 'ranma', n: 4, name: '八宝さい', lv: 66, job: 'kaito_kid', look: L(0, 'bald', 'white', 5, 'light', 'smile'),
      use: 'r88_rm_happo', reward: ['r88_rm_happo', 'r88_rm_nanban'], words: 'ほっほっほ！わしの花火、よけられるかの？',
      sig: { name: '八宝大か輪・特大花火', el: 'fire', anim: 'r88_hanabi', charge: '{a}が、大きな花火玉に火をつけた！\nじりじりと、火花がちっていく…！', cast: '{a}の花火玉が、空いっぱいにはれつした！' },
      tune: { hp: 1.25, dmg: 1 },
    },
    {
      id: 'rm_cologne', work: 'ranma', n: 5, name: 'コロン', lv: 80, job: 'daikenja', look: L(1, 'long', 'white', 6, 'light', 'calm'),
      use: 'r88_rm_kaen', reward: ['r88_rm_kaen', 'r88_rm_hanten'], words: 'ほう、わかいの。女けつ族の長の力、見せてやろうかの。',
      same: 'ほう、むこどのと同じ道の者か。ならば、えんりょはせんぞ。',
      sig: { name: '火炎じょう・竜の大炎', el: 'fire', anim: 'r88_kaen', charge: '{a}が、火炎じょうで地面をとんとついた！\nつえの竜が、ゆっくりと口を開いていく…！', cast: '{a}の火炎じょうの竜が、大きな炎をはき出した！' },
      tune: { hp: 0.98, dmg: 1 },
    },
    // ── じごく先生ぬ〜べ〜（名品・ふつうを くれる 人は Lv60 ごろ・さいごの おにの手の おには 伝説で Lv100）──
    {
      id: 'nb_izuna', work: 'nube', n: 1, name: 'いずな', lv: 60, job: 'monster_master', look: L(1, 'pony', 'brown', 5, 'fair', 'smile'),
      use: 'r88_nb_kuda', reward: ['r88_nb_kuda'], words: 'うちの管ぎつねは、なんでもお見通しやで！',
      sig: { name: '管ぎつね・百ぴき行進', at: 0.8, after: 3, anim: 'r83a_fire', charge: '{a}が、竹づつのふたをぽんと開けた！\n小さなきつねが、つぎつぎに顔を出す…！', cast: '{a}の竹づつから、管ぎつねがどっととび出した！' },
      tune: { hp: 1.39, dmg: 1 },
    },
    {
      id: 'nb_yukime', work: 'nube', n: 2, name: 'ゆきめ', lv: 62, job: 'snow_queen', look: L(1, 'long', 'silver', 1, 'fair', 'calm'),
      use: 'r88_nb_kimono', reward: ['r88_nb_kimono'], words: 'わたしの雪、とってもつめたいですよ。',
      sig: { name: '雪女の大ふぶき', el: 'ice', anim: 'blizzard', charge: '{a}のまわりに、雪がまい始めた！\nあたりが、白くこおっていく…！', cast: '{a}から、大きなふぶきがふきつけた！' },
      tune: { hp: 1.02, dmg: 1 },
    },
    {
      id: 'nb_tamamo', work: 'nube', n: 3, name: '玉も', lv: 64, job: 'enjutsushi', look: L(0, 'long', 'blonde', 3, 'fair', 'sharp'),
      use: 'r88_nb_karin', reward: ['r88_nb_sasumata', 'r88_nb_karin'], words: '人間の力、少し調べさせてもらおう。',
      sig: { name: '火輪びの術', el: 'fire', anim: 'fire3', charge: '{a}のうしろで、きつねのしっぽがゆらめいた！\n青白いきつね火が、集まっていく…！', cast: '{a}のきつね火が、うずを巻いておしよせた！' },
      tune: { hp: 1.16, dmg: 1 },
    },
    {
      id: 'nb_minki', work: 'nube', n: 4, name: 'みんき', lv: 66, job: 'datenshi', look: L(1, 'twin', 'red', 0, 'fair', 'smile'),
      use: 'r88_nb_yoroi', reward: ['r88_nb_yoroi'], words: 'お兄ちゃんのために、わたしもがんばるんだから！',
      sig: { name: 'おにのよろい・空からの一げき', anim: 'slash_heavy', charge: '{a}が、つばさを広げて天じょうまでまい上がった！\nぐんぐん速さをましていく…！', cast: '{a}が、空からまっすぐにおりてきた！' },
      tune: { hp: 1.43, dmg: 1 },
    },
    {
      id: 'nb_haki', work: 'nube', n: 5, name: 'おにの手のおに', lv: 100, job: 'jigoku_sensei', look: L(0, 'wild', 'red', 0, 'tan', 'sharp'),
      use: 'r88_nb_onite', reward: ['r88_nb_onite'], words: 'ふん、先生の手の中はたいくつでな。少しあばれさせてもらうぞ！',
      same: 'ほう、おまえも手ぶくろの先生か。おもしろい、力くらべだ！',
      sig: { name: 'おにの手・大きなこぶし', anim: 'r88_onite', charge: '{a}の大きな手が、赤くかがやき始めた！\nこぶしに、ものすごい力が集まっていく…！', cast: '{a}の大きなこぶしが、ふりおろされた！' },
      tune: { hp: 0.5, dmg: 1 },
    },
  ];
}

// ───────────── G10班: ナルト・きめつのやいば ─────────────
//   ほかの 係の 行と ぶつからない ように、ここに まとめた（上の RIVAL_DOORS・RIVALS が よぶ）
//   ナルト … 部屋 ＝ 森（forest）・背景 ＝ 森（forest）。さいごの イタチは Lv100（とつかの剣・やたの鏡）
//   きめつのやいば … 柱げいこ（柱が 相手）と さいごに 始まりの剣士。部屋 ＝ 木の 道場（wood）・背景 ＝ 夜の 町（village_night）
function g10Doors() {
  return [
    { work: 'naruto', mark: 'r88_naruto', bg: 'forest', room: 'forest', jobs: ['konoha', 'hokage'] },
    { work: 'kimetsu', mark: 'r88_kimetsu', bg: 'village_night', room: 'wood', jobs: ['kisatsu', 'enbashira', 'hinokami'] },
  ];
}
function g10Rivals() {
  return [
    // ── ナルト（名品を くれる 人は Lv60 ごろ・伝説 Lv80 ごろ・さいごの イタチは Lv100）──
    {
      id: 'nr_zabuza', work: 'naruto', n: 1, name: '再不斬', lv: 60, job: 'magic_swordsman', look: L(0, 'buzz', 'black', 0, 'light', 'sharp'), bg: 'swamp',
      use: 'r88_nr_kubikiri', reward: ['r88_nr_kubikiri'], words: 'きりの里の大刀、受けてみるか？',
      sig: { name: '断刀・かくれ切り', anim: 'slash_heavy', charge: '{a}のまわりに、白いもやが立ちこめた！\n大きな刀のかげが、ゆらりと動く…！', cast: '{a}が、もやの中から大きな刀をふりぬいた！' },
      tune: { hp: 1.18, dmg: 1 },
    },
    {
      id: 'nr_kisame', work: 'naruto', n: 2, name: 'きさめ', lv: 80, job: 'guardian', look: L(0, 'spiky', 'blue', 3, 'light', 'sharp'), bg: 'sea',
      use: 'r88_nr_samehada', reward: ['r88_nr_samehada'], words: 'さめはだが、おまえのチャクラを食べたがっている。',
      sig: { name: 'さめはだ・大さめの水', at: 0.8, after: 3, anim: 'whirlpool', charge: '{a}のまわりに、水がうずを巻き始めた！\n大きなさめの形になっていく…！', cast: '{a}の水のさめが、大口を開けておそいかかった！' },
      tune: { hp: 0.96, dmg: 1 },
    },
    {
      id: 'nr_kinkaku', work: 'naruto', n: 3, name: '金角と銀角', lv: 82,
      members: [
        { name: '金角', job: 'tenkou_tsukai', look: L(0, 'wild', 'blonde', 4, 'tan', 'brave') },
        { name: '銀角', job: 'archmage', look: L(0, 'wild', 'silver', 3, 'tan', 'smile') },
      ],
      use: 'r88_nr_basho', reward: ['r88_nr_basho', 'r88_nr_benihyoutan'], words: 'おれたち兄弟の宝具、見せてやるぜ！',
      sig: { name: 'ばしょうせん・大あらし', el: 'wind', anim: 'r88_basho', charge: '{a}が、大きなうちわをふりかぶった！\n炎と雷と風が、うちわに集まっていく…！', cast: '{a}のばしょうせんから、大あらしがふき出した！' },
      tune: { hp: 0.82, dmg: 1 },
    },
    {
      id: 'nr_minato', work: 'naruto', n: 4, name: '四代目火影', lv: 84, job: 'konoha', look: L(0, 'spiky', 'blonde', 7, 'fair', 'calm'),
      use: 'r88_nr_hiraishin', reward: ['r88_nr_hiraishin'], words: '里を守る火影の速さ、見せてあげよう。',
      sig: { name: '飛雷神・一しゅんの光', el: 'bolt', anim: 'slash_multi', charge: '{a}が、三つまたのクナイをあちこちに投げた！\nクナイのしるしが、光り始めた…！', cast: '{a}が、光のようにクナイからクナイへとびうつった！' },
      tune: { hp: 0.85, dmg: 1 },
    },
    {
      id: 'nr_itachi', work: 'naruto', n: 5, name: 'イタチ', lv: 100, job: 'enjutsushi', look: L(0, 'long', 'black', 0, 'fair', 'calm'), bg: 'palace_night',
      use: 'r88_nr_totsuka', reward: ['r88_nr_totsuka', 'r88_nr_yata'], words: 'ゆるせ。これで最後だ。',
      sig: { name: 'スサノオ・とつかの剣', anim: 'void', charge: '{a}のまわりに、大きなよろいの武者があらわれた…！\n武者が、とつかの剣をかまえる…！', cast: '{a}の武者が、とつかの剣をふりおろした！' },
      tune: { hp: 0.56, dmg: 1 },
    },
    // ── きめつのやいば（柱げいこ。名品を くれる 柱は Lv60 ごろ・岩柱は 伝説で Lv80・さいごの 始まりの剣士は Lv100）──
    {
      id: 'km_giyu', work: 'kimetsu', n: 1, name: 'とみおか義勇', lv: 60, job: 'kisatsu', look: L(0, 'pony', 'black', 1, 'fair', 'calm'),
      use: 'r88_km_mizu', reward: ['r88_km_mizu'], words: '…けいこだ。かまえろ。',
      sig: { name: '水の呼吸・ねじれうず', anim: 'whirlpool', charge: '{a}が、しずかに刀をかまえた…！\n水のうずが、まわりをめぐり始めた…！', cast: '{a}の刀から、大きな水のうずがおしよせた！' },
      tune: { hp: 1.32, dmg: 1 },
    },
    {
      id: 'km_rengoku', work: 'kimetsu', n: 2, name: '炎柱れんごく', lv: 62, job: 'enbashira', look: L(0, 'wild', 'blonde', 0, 'fair', 'brave'),
      use: 'r88_km_honoo', reward: ['r88_km_honoo'], words: 'うむ！心を燃やせ！いざ、けいこだ！',
      same: 'うむ！同じ炎の道を行く者か！よもや、えんりょはいらんな！',
      sig: { name: '炎の呼吸・れんごく', el: 'fire', anim: 'fire_wave', charge: '{a}が、刀を大きくふりかぶった！\n刀のまわりに、炎がうずを巻く…！', cast: '{a}が、大きな炎とともにつっこんできた！' },
      tune: { hp: 1.04, dmg: 1 },
    },
    {
      id: 'km_tengen', work: 'kimetsu', n: 3, name: '宇ずい天元', lv: 64, job: 'konoha', look: L(0, 'long', 'white', 4, 'fair', 'smile'),
      use: 'r88_km_oto', reward: ['r88_km_oto'], words: 'はでにいくぜ！ついてこられるか？',
      sig: { name: '音の呼吸・とどろき', el: 'fire', anim: 'blast2', charge: '{a}が、火薬玉をばらまいた！\n二本の刀を、大きくかまえる…！', cast: '{a}の刀が火薬玉をたたき、ばくはつがとどろいた！' },
      tune: { hp: 1.21, dmg: 1 },
    },
    {
      id: 'km_himejima', work: 'kimetsu', n: 4, name: 'ひめじま', lv: 80, job: 'god_hand', look: L(0, 'bald', 'black', 3, 'tan', 'calm'),
      use: 'r88_km_tekkyu', reward: ['r88_km_tekkyu'], words: 'なむあみだぶつ…。さあ、けいこを始めよう。',
      sig: { name: '岩の呼吸・岩くだき', anim: 'quake', charge: '{a}が、くさりの鉄球を回し始めた！\nくさりが、うなりを上げる…！', cast: '{a}の鉄球が、地面ごと打ちくだいた！' },
      tune: { hp: 0.82, dmg: 1 },
    },
    {
      id: 'km_yoriichi', work: 'kimetsu', n: 5, name: '始まりの剣士', lv: 100, job: 'enbashira', look: L(0, 'long', 'red', 1, 'fair', 'calm'), bg: 'hoshiyomi',
      use: 'r88_km_hajimari', reward: ['r88_km_hajimari'], words: 'あなたたちの剣を、見せてほしい。',
      sig: { name: '日の呼吸・日のまい', el: 'fire', anim: 'r88_kakuto', charge: '{a}が、しずかに刀をかまえた…！\nまわりが、朝日のように明るくなっていく…！', cast: '{a}の刀が、日の光のようにまいおどった！' },
      tune: { hp: 0.54, dmg: 1 },
    },
  ];
}

// ───────────── G9班: ドラゴンボール・ワンピース ─────────────
//   ドラゴンボール … 部屋 ＝ 石の 広間（stone）・背景 ＝ 闘技場（arena。天下一の 武道会の 石の 台）。さいごの ウイスは 雲の上（kumoi）
//   ワンピース … 部屋 ＝ 船の 甲板（ship: 木の ゆか・まわりは 海・たる）・背景 ＝ 大きな 船の 甲板（whale_deck）。カイドウは 火の 城（castle_fire）
//   ビッグ・マムに 勝つと、天候棒の 4だんめ（ゼウスの 天候棒）に 生まれ変われる（data/items-r88-onepiece.js の need.rivals）
function g9Doors() {
  return [
    { work: 'dragonball', mark: 'r88_dragonball', bg: 'arena', room: 'stone', jobs: ['saiyan', 'super_saiyan', 'ss2', 'ss3'] },
    { work: 'onepiece', mark: 'r88_onepiece', bg: 'whale_deck', room: 'ship', jobs: ['pirate', 'rubber', 'nika', 'pirate_king'] },
  ];
}
function g9Rivals() {
  return [
    // ── ドラゴンボール（名品を くれる 人は Lv60 ごろ・さいごの ウイスは 伝説で Lv100）──
    {
      id: 'db_piccolo', work: 'dragonball', n: 1, name: 'ピッコロ', lv: 60, job: 'god_hand', look: L(0, 'bald', 'green', 6, 'light', 'sharp'),
      use: 'r88_db_turban', reward: ['r88_db_turban'], words: '重いマントを外させてみろ。修行をつけてやる。',
      sig: { name: 'まかんこうさっぽう', anim: 'ki_blast', charge: '{a}が、指を2本ひたいに当てた！\n指先に、ばちばちと気が集まっていく…！', cast: '{a}の指先から、うずを巻く光線がはなたれた！' },
      tune: { hp: 1.12, dmg: 1 },
    },
    {
      id: 'db_vegeta', work: 'dragonball', n: 2, name: 'ベジータ', lv: 62, job: 'super_saiyan', look: L(0, 'spiky', 'black', 2, 'light', 'sharp'),
      use: 'r88_db_scouter', reward: ['r88_db_scouter', 'r88_db_suit'], words: 'ふん、サイヤ人の王子の力を見せてやる！',
      same: 'ほう、きさまもサイヤ人か。だが、王子はこのおれだ！',
      sig: { name: 'ギャリックほう', at: 0.8, after: 3, el: 'light', anim: 'kamehameha', charge: '{a}が、両手を体の前でかまえた！\nむらさき色の気が、ぐんぐん大きくなっていく…！', cast: '{a}の両手から、大きな気の光線がはなたれた！' },
      tune: { hp: 1.29, dmg: 1 },
    },
    {
      id: 'db_dabura', work: 'dragonball', n: 3, name: 'ダーブラ', lv: 64, job: 'magic_swordsman', look: L(0, 'bald', 'red', 0, 'tan', 'sharp'),
      use: 'r88_db_dabura', reward: ['r88_db_dabura'], words: 'わたしは魔界の王。少しあそんでやろう。',
      sig: { name: '魔界の大剣', el: 'dark', anim: 'dark_slash', charge: '{a}の手に、大きな剣があらわれた！\n剣から、黒いほのおがゆらめき始めた…！', cast: '{a}の大剣が、黒いほのおといっしょにふり下ろされた！' },
      tune: { hp: 1.34, dmg: 1 },
    },
    {
      id: 'db_beerus', work: 'dragonball', n: 4, name: 'ビルス', lv: 66, job: 'archmage', look: L(0, 'bald', 'purple', 5, 'fair', 'calm'),
      use: 'r88_db_beerus', reward: ['r88_db_beerus'], words: 'ふあぁ…。おいしい物を持ってきたら、手かげんしてあげるよ。',
      sig: { name: 'はかいの玉', anim: 'hakai', charge: '{a}が、指先を空に向けた！\n小さな光の玉が、どんどん大きくなっていく…！', cast: '{a}の光の玉が、まっすぐ落ちてきた！' },
      tune: { hp: 1.59, dmg: 1 },
    },
    {
      id: 'db_whis', work: 'dragonball', n: 5, name: 'ウイス', lv: 100, job: 'daikenja', look: L(0, 'long', 'white', 5, 'fair', 'smile'), bg: 'kumoi',
      use: 'r88_db_whis', reward: ['r88_db_whis'], words: 'ほっほっほ。では、少しだけ修行の相手をしましょうか。',
      sig: { name: '天使のつえ・光のうず', el: 'light', anim: 'r88_whis', charge: '{a}が、つえで地面をこつんとついた！\nつえの玉が、ふしぎな光を集めていく…！', cast: '{a}のつえから、光のうずがあふれ出した！' },
      tune: { hp: 0.81, dmg: 1 },
    },
    // ── ワンピース（名品を くれる 人は Lv60 ごろ・伝説の 黒刀・夜は Lv80・さいごの カイドウは Lv100）──
    {
      id: 'op_crocodile', work: 'onepiece', n: 1, name: 'クロコダイル', lv: 60, job: 'magic_swordsman', look: L(0, 'slick', 'black', 3, 'light', 'sharp'),
      use: 'r88_op_claw', reward: ['r88_op_claw'], words: 'クハハハ！砂の力、見せてやろう。',
      sig: { name: '砂あらし', el: 'wind', anim: 'wind2', charge: '{a}が、右手を地面につけた！\nまわりの砂が、うずを巻いて集まっていく…！', cast: '{a}の砂あらしが、ごうごうとふきあれた！' },
      tune: { hp: 1.2, dmg: 1 },
    },
    {
      id: 'op_smoker', work: 'onepiece', n: 2, name: 'スモーカー', lv: 62, job: 'guardian', look: L(0, 'short', 'white', 7, 'tan', 'sharp'),
      use: 'r88_op_jitte', reward: ['r88_op_jitte'], words: '海軍の名にかけて、ここは通さねえ。',
      sig: { name: '白いけむりのこぶし', anim: 'punch_multi', charge: '{a}の体から、白いけむりがもくもくとあふれ出した！\nけむりが、大きなこぶしの形になっていく…！', cast: '{a}のけむりのこぶしが、いっせいにとんできた！' },
      tune: { hp: 1.35, dmg: 1 },
    },
    {
      id: 'op_bigmom', work: 'onepiece', n: 3, name: 'ビッグ・マム', lv: 66, job: 'star_diva', look: L(1, 'wavy', 'pink', 0, 'light', 'smile'),
      use: 'r88_op_napoleon', reward: ['r88_op_napoleon'], words: 'ハ〜ハハママママ！おかしはどこだい！',
      sig: { name: 'ゼウスの大雷', el: 'bolt', anim: 'r88_zeus', charge: '{a}のそばで、しゃべる雷雲がむくむくふくらんだ！\n「ママ、まかせて〜！」…！', cast: '{a}の雷雲ゼウスから、大きな雷が落ちてきた！' },
      tune: { hp: 1.3, dmg: 1 },
    },
    {
      id: 'op_mihawk', work: 'onepiece', n: 4, name: 'ミホーク', lv: 80, job: 'sword_master', look: L(0, 'slick', 'black', 0, 'light', 'sharp'),
      use: 'r88_op_yoru', reward: ['r88_op_yoru'], words: '世界一の剣、見せてやろう。かかってこい。',
      same: 'ほう、海の者か。その心意気、見せてみろ。',
      sig: { name: '黒刀・大ざん', at: 0.8, after: 3, hit: 1.3, anim: 'slash_heavy', charge: '{a}が、せなかの大きな黒い刀に手をかけた…！\nするどい気配が、あたりをつつむ…！', cast: '{a}の黒刀から、大きな切りかえしがとんできた！' },
      tune: { hp: 0.27, dmg: 1.2 },
    },
    {
      id: 'op_kaido', work: 'onepiece', n: 5, name: 'カイドウ', lv: 100, job: 'dragon_knight', look: L(0, 'long', 'black', 0, 'tan', 'sharp'), bg: 'castle_fire',
      use: 'r88_op_hassaikai', reward: ['r88_op_hassaikai'], words: 'ウォロロロ…！おもしろい。かかってこい！',
      sig: { name: '雷鳴八け', el: 'bolt', anim: 'r88_zeus', charge: '{a}が、金棒を大きくふりかぶった！\n金棒のまわりで、雷がばちばち鳴り始めた…！', cast: '{a}の金棒が、雷といっしょにふり下ろされた！' },
      tune: { hp: 0.62, dmg: 1 },
    },
  ];
}

// ───────────── G11班: るろうに剣心・コナンと快と ─────────────
//   るろうに剣心 … 部屋 ＝ 木の 道場（wood）・背景 ＝ 東の 野原（plains_east）。ししおは 火の 城（castle_fire）・比古は 山の 上（peak）
//   コナンと 快と … 2作品を 1まいの とびらに まとめた（works。とびらの 品の 数は 2作品の 合計・name は とびらの 名前）。
//     ライバルの work は とびらの 作品（conan）。ごほうびの 品の 作品は それぞれ（キッドの 品は kaito）。
//     部屋 ＝ 石の 広間（stone）・背景 ＝ 夜の 町（village_night）。月夜の キッドは 塔の 上（tower_top）
//     7-1 の 行は 2作品で 7人。5人に しぼった（小泉紅子〈紅子の魔法の鏡〉・ジン〈黒ずくめの服〉は ガチャの 名品に）
function g11Doors() {
  return [
    { work: 'kenshin', mark: 'r88_kenshin', bg: 'plains_east', room: 'wood', jobs: ['rurouni', 'hitokiri', 'himura', 'hiten'] },
    {
      work: 'conan', works: ['conan', 'kaito'], name: 'コナン・快と', mark: 'r88_conan', bg: 'village_night', room: 'stone',
      jobs: ['shonen_tantei', 'meitantei', 'detective_king', 'koan_zero', 'triple_face', 'black_org', 'ano_kata', 'magician', 'kaito', 'kaito_kid', 'gekka'],
    },
  ];
}
function g11Rivals() {
  return [
    // ── るろうに剣心（名品を くれる 人は Lv60 ごろ・伝説の 無限じんは Lv80・さいごの 比古清十ろうは Lv100）──
    {
      id: 'ks_aoshi', work: 'kenshin', n: 1, name: 'しのもりあおし', lv: 60, job: 'ninja', look: L(0, 'short', 'black', 3, 'fair', 'sharp'),
      use: 'r88_ks_kodachi', reward: ['r88_ks_kodachi'], words: '御庭番衆の御頭として、手かげんはしない。',
      sig: { name: '小太刀二刀・回天けんぶ', anim: 'slash_multi', charge: '{a}が、2本の小太刀をさか手にかまえた！\nするどい気配が、うずを巻いていく…！', cast: '{a}の小太刀が、うずのように回りながらおそいかかった！' },
      tune: { hp: 1.63, dmg: 1 },
    },
    {
      id: 'ks_sojiro', work: 'kenshin', n: 2, name: 'せた宗次ろう', lv: 62, job: 'hitokiri', look: L(0, 'short', 'black', 1, 'fair', 'smile'),
      use: 'r88_ks_kikuichi', reward: ['r88_ks_kikuichi'], words: 'あはは。ぼく、ちょっと速いですよ。',
      sig: { name: 'しゅく地の一太刀', anim: 'slash_fast', charge: '{a}が、にこにこしたまま、とんとんと足ぶみを始めた…！\n足音が、だんだん聞こえなくなっていく…！', cast: '{a}が消えた…と思ったしゅん間、一太刀がとどいた！' },
      tune: { hp: 1.46, dmg: 1 },
    },
    {
      id: 'ks_enishi', work: 'kenshin', n: 3, name: '雪代えにし', lv: 64, job: 'sword_master', look: L(0, 'spiky', 'white', 0, 'fair', 'sharp'),
      use: 'r88_ks_wato', reward: ['r88_ks_wato'], words: 'わ刀術の力、見せてやる。',
      sig: { name: 'わ刀術・大回転', at: 0.8, after: 3, hit: 1.3, anim: 'slash_heavy', charge: '{a}が、わ刀を体ごと大きくひねった！\nまわりの空気が、ぴりぴりとふるえる…！', cast: '{a}が、回りながらわ刀をふりぬいた！' },
      tune: { hp: 0.5, dmg: 1.2 },
    },
    {
      id: 'ks_shishio', work: 'kenshin', n: 4, name: 'ししお真実', lv: 80, job: 'enjutsushi', look: L(0, 'bald', 'black', 0, 'light', 'sharp'), bg: 'castle_fire',
      use: 'r88_ks_mugen', reward: ['r88_ks_mugen'], words: 'この国のてっぺんを取るのは、おれだ。',
      sig: { name: '紅れんかいな・大火', el: 'fire', anim: 'r88_guren', charge: '{a}が、無限じんを地面にこすりつけた！\n火花がとびちり、刀が赤く燃え上がる…！', cast: '{a}の燃える手から、大きな火の玉がはじけた！' },
      tune: { hp: 0.72, dmg: 1 },
    },
    {
      id: 'ks_hiko', work: 'kenshin', n: 5, name: '比古清十ろう', lv: 100, job: 'magic_swordsman', look: L(0, 'long', 'black', 7, 'tan', 'calm'), bg: 'peak',
      use: 'r88_ks_fuyutsuki', reward: ['r88_ks_mantle', 'r88_ks_fuyutsuki'], words: 'ばか弟子の仲間か。少し、見てやろう。',
      same: 'ほう、飛天の剣を学ぶ者か。ならば、手かげんはせん。',
      sig: { name: '師しょうの九つの竜の一げき', anim: 'slash_multi', charge: '{a}が、白いマントをばさりとぬぎすてた！\nまわりの空気が、ずしりと重くなっていく…！', cast: '{a}の刀から、九つの竜のような一げきが、同時におそいかかった！' },
      tune: { hp: 0.65, dmg: 1 },
    },
    // ── コナン・快と（名品・ふつうを くれる 人は Lv60 ごろ・さいごの 月夜の キッドは 伝説の パンドラで Lv100）──
    {
      id: 'cn_kyogoku', work: 'conan', n: 1, name: '京極真', lv: 60, job: 'god_hand', look: L(0, 'buzz', 'black', 0, 'tan', 'brave'),
      use: 'r88_cn_kyogoku', reward: ['r88_cn_kyogoku'], words: 'おす！全力でお相手します！',
      sig: { name: 'けりの大れんげき', anim: 'punch_multi', charge: '{a}が、ふかく、ふかくこしを落とした！\n足に、ものすごい力がたまっていく…！', cast: '{a}のけりが、あらしのようにおそいかかった！' },
      tune: { hp: 1.12, dmg: 1 },
    },
    {
      id: 'kt_hakuba', work: 'conan', n: 2, name: '白馬探', lv: 62, job: 'meitantei', look: L(0, 'wavy', 'blonde', 7, 'fair', 'calm'),
      use: 'r88_kt_watch', reward: ['r88_kt_watch'], words: 'ぼくの推理に、まちがいはありません。',
      sig: { name: 'ワトソンの急こう', anim: 'slash_fast', charge: '{a}が、かいちゅう時計をぱちんと開いた！\n空の上で、タカが大きく回っている…！', cast: '{a}の合図で、タカのワトソンがいっせいにまいおりた！' },
      tune: { hp: 1.41, dmg: 1 },
    },
    {
      id: 'cn_akai', work: 'conan', n: 3, name: '赤井しゅう一', lv: 64, job: 'koan_zero', look: L(0, 'long', 'black', 0, 'light', 'sharp'),
      use: 'r88_cn_knit', reward: ['r88_cn_knit'], words: 'ここから先は、通さない。',
      sig: { name: 'ジークンドーのれんげき', anim: 'punch_multi', charge: '{a}が、ニットぼうを目ぶかにかぶり直した！\nしずかに、かまえを取る…！', cast: '{a}のするどいこぶしが、つぎつぎにとんできた！' },
      tune: { hp: 1.16, dmg: 1 },
    },
    {
      id: 'kt_kid', work: 'conan', n: 4, name: 'かいとうキッド', lv: 66, job: 'kaito_kid', look: L(0, 'short', 'white', 7, 'fair', 'smile'),
      use: 'r88_kt_card', reward: ['r88_kt_card', 'r88_kt_suit'], words: 'こんばんは。今夜のショーへ、ようこそ。',
      same: 'おや、同じ手品の道の方ですか。では、マジック勝負といきましょう。',
      sig: { name: 'トランプのあらし', anim: 'r88_kid', charge: '{a}が、パチンと指を鳴らした！\nシルクハットから、トランプがどんどんあふれ出す…！', cast: '{a}のトランプじゅうから、トランプのあらしがふきあれた！' },
      tune: { hp: 1.25, dmg: 1 },
    },
    {
      id: 'kt_kidmoon', work: 'conan', n: 5, name: '月夜のかいとうキッド', lv: 100, job: 'gekka', look: L(0, 'short', 'white', 7, 'fair', 'smile'), bg: 'tower_top',
      use: 'r88_kt_pandora', reward: ['r88_kt_pandora'], words: '月が出ましたね。さあ、さいごのマジックです。',
      same: 'おや、同じ手品の道の方ですか。では、マジック勝負といきましょう。',
      sig: { name: '満月のイリュージョン', el: 'light', anim: 'r88_kid', charge: '{a}が、大きな宝石を月にかざした！\n宝石の中で、赤い光がゆらめく…！', cast: '{a}のマントがひるがえり、月の光がいっせいにふりそそいだ！' },
      tune: { hp: 0.4, dmg: 1 },
    },
  ];
}

// ───────────── G12班: ドラえもん・セーラームーン ─────────────
//   ドラえもん … 部屋 ＝ 木の 部屋（wood）・背景 ＝ 草原（grass。空き地の かわり）。さいごの ドラえもんの まぼろしは 雲の上（kumoi）
//   セーラームーン … 部屋 ＝ 石の 広間（stone）・背景 ＝ 夜の 宮でん（palace_night）。ギャラクシアは 月の さけめ（rift_moon）
//   ウラヌス・ネプチューン・プルートの 3人に 勝つと、3つの タリスマン（そろえて 鏡の湖の ほとりで 聖はい。world/grail-r88.js）
function g12Doors() {
  return [
    { work: 'doraemon', mark: 'r88_doraemon', bg: 'grass', room: 'wood', jobs: ['neko_robot', 'mimi_robot', 'doraemon', 'nobu_dora'] },
    { work: 'sailormoon', mark: 'r88_sailormoon', bg: 'palace_night', room: 'stone', jobs: ['sailor_soldier', 'sailor_moon', 'neo_queen'] },
  ];
}
function g12Rivals() {
  return [
    // ── ドラえもん（名品を くれる 人は Lv60 ごろ・さいごの ドラえもんの まぼろしは 伝説で Lv100）──
    {
      id: 'dr_nobita', work: 'doraemon', n: 1, name: 'のび太', lv: 60, job: 'kaito_kid', look: L(0, 'short', 'black', 4, 'light', 'round'),
      use: 'r88_dr_shock', reward: ['r88_dr_shock'], words: 'あやとりとうつのだけは、だれにも負けないぞ！',
      sig: { name: 'ショックガン・早うち', anim: 'bolt2', charge: '{a}が、めがねをくいっと上げた…！\nショックガンを、すっとかまえる…！', cast: '{a}のショックガンから、光線がつぎつぎとんできた！' },
      tune: { hp: 1.05, dmg: 1 },
    },
    {
      id: 'dr_gian', work: 'doraemon', n: 2, name: 'ガキ大将', lv: 60, job: 'god_hand', look: L(0, 'short', 'black', 4, 'tan', 'brave'),
      use: 'r88_dr_mic', reward: ['r88_dr_mic', 'r88_dr_bat'], words: 'おれさまのリサイタルを、聞いていけ！',
      sig: { name: 'ボエ〜リサイタル', anim: 'blast2', charge: '{a}がマイクをにぎって、大きくいきをすいこんだ！\nみんな、耳をふさいで！…！', cast: '{a}の、とんでもない歌声がひびきわたった！' },
      tune: { hp: 1.1, dmg: 1 },
    },
    {
      id: 'dr_suneo', work: 'doraemon', n: 3, name: 'スネ夫', lv: 64, job: 'kaito_kid', look: L(0, 'slick', 'black', 5, 'light', 'smile'),
      use: 'r88_dr_houdai', reward: ['r88_dr_houdai'], words: 'ぼくの無敵ほう台は、未来のデパートで買ったんだぞ！',
      sig: { name: '無敵ほう台・発射', el: 'blast', anim: 'blast2', charge: '{a}が、こっちを指さした！\nほう台が、くるりとこちらを向く…！', cast: '{a}「発射！」ほう台の玉が、まっすぐとんできた！' },
      tune: { hp: 1.18, dmg: 1 },
    },
    {
      id: 'dr_dorami', work: 'doraemon', n: 4, name: 'ドラミ', lv: 66, job: 'daikenja', look: L(1, 'bald', 'blonde', 4, 'fair', 'smile'),
      use: 'r88_dr_ribbon', reward: ['r88_dr_ribbon', 'r88_dr_melonpan'], words: 'お兄ちゃんの友だち？わたしもテストするわね！',
      sig: { name: 'ひみつ道具・大そうじ', anim: 'wind2', charge: '{a}が、ポケットに手を入れた！\n大きな道具が、出てきそうだ…！', cast: '{a}の道具から、つむじ風がふき出した！' },
      tune: { hp: 1.46, dmg: 1 },
    },
    {
      id: 'dr_dora', work: 'doraemon', n: 5, name: 'ドラえもんのまぼろし', lv: 100, job: 'doraemon', look: L(0, 'bald', 'blue', 1, 'fair', 'round'), bg: 'kumoi',
      use: 'r88_dr_moshimo', reward: ['r88_dr_moshimo'], words: 'ひみつ道具のテストだよ。ぼくに勝てるかな？',
      same: 'きみもネコ型ロボットなの？どら焼き、すき？',
      sig: { name: 'もしもの大あらし', el: 'wind', anim: 'r88_moshimo', charge: '{a}が、ポケットから電話ボックスを出した！\n「もしも、ここが大あらしだったら…」', cast: '{a}の言葉どおり、大あらしがまき起こった！' },
      tune: { hp: 0.83, dmg: 1 },
    },
    // ── セーラームーン（名品を くれる 人は Lv60 ごろ・サイレンス・グレイブは 伝説で Lv80・さいごの ギャラクシアは Lv100）──
    {
      id: 'sm_beryl', work: 'sailormoon', n: 1, name: 'クイン・ベリル', lv: 60, job: 'archmage', look: L(1, 'long', 'red', 3, 'fair', 'sharp'),
      use: 'r88_sm_beryl', reward: ['r88_sm_beryl'], words: 'わらわの闇の力、思い知るがよい！',
      sig: { name: '黒水しょうの闇', el: 'dark', anim: 'dark1', charge: '{a}のつえの黒い水しょうが、あやしく光り始めた…！', cast: '{a}のつえから、黒い光があふれ出した！' },
      tune: { hp: 1.39, dmg: 1 },
    },
    {
      id: 'sm_sisters', work: 'sailormoon', n: 2, name: 'あやかしの姉妹', lv: 62,
      members: [
        { name: 'コーアン', job: 'enjutsushi', look: L(1, 'long', 'purple', 3, 'fair', 'sharp') },
        { name: 'ベルチェ', job: 'snow_queen', look: L(1, 'wavy', 'blue', 1, 'fair', 'calm') },
      ],
      use: 'r88_sm_pierce', reward: ['r88_sm_pierce'], words: 'わたしたち姉妹に、勝てるかしら？',
      sig: { name: '姉妹の黒い光', el: 'dark', anim: 'dark1', charge: '{a}たちが、手をつないで輪になった！\n黒い水しょうのピアスが、光り始めた…！', cast: '{a}たちの黒い光が、いっせいにおそいかかった！' },
      tune: { hp: 0.8, dmg: 0.8 },
    },
    {
      id: 'sm_outer', work: 'sailormoon', n: 3, name: '3人の戦士', lv: 64,
      members: [
        { name: 'ウラヌス', job: 'sword_master', look: L(1, 'short', 'blonde', 4, 'light', 'sharp') },
        { name: 'ネプチューン', job: 'star_diva', look: L(1, 'wavy', 'aqua', 5, 'fair', 'calm') },
        { name: 'プルート', job: 'guardian', look: L(1, 'long', 'green', 3, 'tan', 'calm') },
      ],
      use: 'r88_sm_sword', reward: ['r88_sm_sword', 'r88_sm_mirror', 'r88_sm_orb'], words: 'タリスマンをわたすかどうか、力で見せてもらう。',
      sig: { name: '3つのタリスマンの光', anim: 'holy', charge: '{a}たちが、剣と鏡と玉をかかげた！\n3つの光が、1つに集まっていく…！', cast: '{a}たちのタリスマンから、大きな光がはなたれた！' },
      tune: { hp: 0.27, dmg: 1 },
    },
    {
      id: 'sm_saturn', work: 'sailormoon', n: 4, name: 'サターン', lv: 80, job: 'monster_master', look: L(1, 'bob', 'black', 3, 'fair', 'calm'),
      use: 'r88_sm_glaive', reward: ['r88_sm_glaive'], words: '…あなたたちの力、たしかめさせて。',
      sig: { name: 'サイレンス・グレイブ・ふり下ろし', el: 'dark', anim: 'dark_slash', at: 0.8, after: 3, hit: 1.3, charge: '{a}が、大きなグレイブを高くかかげた…！\nあたりが、しんと静まりかえる…！', cast: '{a}のグレイブが、しずかにふり下ろされた！' },
      tune: { hp: 1.02, dmg: 1 },
    },
    {
      id: 'sm_galaxia', work: 'sailormoon', n: 5, name: 'ギャラクシア', lv: 100, job: 'grand_magus', look: L(1, 'long', 'orange', 4, 'tan', 'sharp'), bg: 'rift_moon',
      use: 'r88_sm_bracelet', reward: ['r88_sm_bracelet'], words: '銀河でいちばんの力、見せてあげよう。',
      sig: { name: '銀河の大はどう', el: 'light', anim: 'holy', charge: '{a}の金のブレスレットが、まぶしく光り始めた！\n星の光が、どんどん集まっていく…！', cast: '{a}から、銀河の光の大きな波がおしよせた！' },
      tune: { hp: 0.56, dmg: 1 },
    },
  ];
}
