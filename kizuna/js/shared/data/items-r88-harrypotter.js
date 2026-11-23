// 第88回 G13班: ハリー・ポッターの 品（docs/plan-r88-anime-gear.md の 3-11）
//   作品の 職業（魔法学校の生徒・ハリーポッター・大魔導王）は つえ・短剣・素手・服と ローブ
//   ・死の 秘宝 … 今 ある ニワトコのつえ（武器）・とうめいマント（よろい）＋ 新しい よみがえりの石（アクセ）。
//     部位が かぶらないので 1人が 3つ つけられる。3つ つけると「ふんばる」（1つの 戦いで 1回、たおれても HP1 で のこる。
//     data/gear-sets.js の deathly_hallows・shared/battle-r88.js の r88Endure）
//   ・ホグワーツの 4つの 品（グリフィンドールの剣・レイブンクローのかみかざり・ハッフルパフのカップ・スリザリンのロケット）… 持って いる 数で しょう号
//     （作品の 中の こわい 話は ゲームに 出さない）
//   ・逆転時計 … 使うと すぐに もう1回 動ける（1つの 戦いで 1回）
//   ・百味ビーンズ … 戦いの はじめに 1つぶ 食べて、6つの 小さな 力から 1つが つく（shared/battle-r88.js の r88BattleStart）
//   ・今 ある 魔法学校のローブ・ニワトコのつえ・とうめいマント・ニンバス2000・魔法学校のつえにも 作品を つけた（R88_TAG_HARRYPOTTER。強さ・手に入れ方は かえない）
//   ・「賢者の石」は 鋼の錬金術師に 同じ 名前の 品が あるので 足さない
//   作品の 字は 使える 字に 直した（杖 → つえ・柊 → ひいらぎ・吼え → ほえ・涙 → なみだ など。設計書の「実装メモ（G13班）」）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=efa1b5f542af';

const H = { work: 'harrypotter' };
const HOG = { work: 'harrypotter', set: 'hogwarts4' };
// 死の 秘宝・ホグワーツの 4つの 品
export const DEATHLY_HALLOWS = ['elder_wand', 'invisible_cloak', 'r88_hp_stone'];
export const HOGWARTS4 = ['r88_hp_gsword', 'r88_hp_diadem', 'r88_hp_cup', 'r88_hp_locket'];
// 百味ビーンズ（戦いの はじめに 1つ。k … data/gear-fx.js の GEAR_FX の k）
export const BEANS = [
  { name: 'いちご味', k: 'regen', v: 6, power: 'いやしの力' },
  { name: 'はっか味', k: 'mpregen', v: 6, power: 'MPのいずみの力' },
  { name: 'こしょう味', k: 'chase', v: 6, power: '追撃の力' },
  { name: 'レモン味', k: 'counter', v: 6, power: '反撃の力' },
  { name: 'わたあめ味', k: 'evade', v: 6, power: 'みかわしの力' },
  { name: 'トマト味', k: 'drain', v: 6, power: 'HP吸収の力' },
];

const GEAR = {
  // ───── つえ（木と しん）─────
  r88_hp_holly: { ...weapon('staff', 'mei'), ...H, name: 'ひいらぎのつえ', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 12 }, look: 'wizard', desc: 'ひいらぎの木に、不死鳥の羽根のしんが入ったつえ。おでこにきずのある少年のつえ。ふつうの攻撃が光になる。' },
  r88_hp_vine: { ...weapon('staff', 'mei'), ...H, name: 'ブドウの木のつえ', fx: [{ k: 'mana', v: 6 }], bonus: { mag: 12 }, look: 'oak', desc: 'ブドウの木に、ドラゴンの心ぞうの糸のしんが入ったつえ。勉強が大すきな女の子のつえ。攻撃が当たるとMPが回復する。' },
  r88_hp_ash: { ...weapon('staff', 'fu3'), ...H, name: 'トネリコのつえ', fx: [{ k: 'atk', v: 5 }], resist: { confuse: 1.2 }, look: 'oak', desc: '兄のおさがりのつえ。おれたところをテープでつないである。攻撃力が上がるが、呪文が自分にはね返ることがあり、混乱にかかりやすい。' },
  r88_hp_willow: { ...weapon('staff', 'fu3'), ...H, name: 'ヤナギのつえ', bonus: { mag: 12 }, look: 'oak', desc: 'ヤナギの木に、ユニコーンの毛のしんが入ったつえ。赤毛の男の子の2本目のつえ。攻撃魔力が上がる。' },
  r88_hp_hawthorn: { ...weapon('staff', 'mei'), ...H, name: 'サンザシのつえ', fx: [{ k: 'crit', v: 6 }], bonus: { mag: 10 }, look: 'wizard', desc: 'サンザシの木に、ユニコーンの毛のしんが入ったつえ。金色のかみの、ライバルの男の子のつえ。会心の一撃が出やすい。' },
  r88_hp_yew: { ...weapon('staff', 'den'), ...H, name: 'イチイのつえ', fx: [{ k: 'el_dark', v: 8 }], bonus: { mag: 34, mp: 30 }, look: 'wand33', desc: 'イチイの木に、不死鳥の羽根のしんが入った、白くて長いつえ。少年のつえとは、同じ鳥の羽根を分けた兄弟のつえ。ふつうの攻撃が闇になる。' },
  r88_hp_umbrella: { ...weapon('staff', 'fu3'), ...H, name: 'ピンクのかさ', bonus: { str: 6, hp: 30 }, use: { ability: 'r88u_hp_pigtail' }, look: 'cane', desc: '森の番人の大男が、いつも持っているピンクのかさ。中に、おれたつえのかけらがかくしてあるらしい。使うと、敵1体にぶたのしっぽをはやして、素早さを下げる。' },
  // ───── ホグワーツの 4つの 品・組分けぼうし ─────
  r88_hp_hat: { ...head('mei'), ...H, name: '組分けぼうし', bonus: { mag: 10, heal: 6 }, use: { ability: 'r88u_hp_hatsword' }, desc: '新入生をかぶらせて、4つのりょうに分ける、おしゃべりな古いぼうし。使うと、ぼうしの中から光る剣を引きぬいて、敵1体を切りつける。' },
  r88_hp_gsword: { ...weapon('sword', 'den'), ...HOG, name: 'グリフィンドールの銀の剣', fx: [{ k: 'poison', v: 8 }], bonus: { str: 20, agi: 10 }, look: 'holy', desc: '赤い宝石がはまった、ゆう気ある者の銀の剣。大へびの毒をすいこんでいる。ときどき敵を毒にする。' },
  r88_hp_diadem: { ...head('mei'), ...HOG, name: 'レイブンクローのかみかざり', bonus: { mag: 14 }, desc: 'かしこさをたいせつにするりょうの、青い宝石のかみかざり。攻撃魔力が上がる。' },
  r88_hp_cup: { ...acc('mei'), ...HOG, name: 'ハッフルパフのカップ', fx: [{ k: 'regen', v: 6 }], desc: 'やさしさとがんばりをたいせつにするりょうの、アナグマのもようの金のカップ。行動するたびにHPが少し回復する。' },
  r88_hp_locket: { ...acc('mei'), ...HOG, name: 'スリザリンのロケット', bonus: { mag: 18 }, resist: { confuse: 1.3 }, desc: '大きな目標をめざすりょうの、へびの形のSがかざられた金のロケット。攻撃魔力が上がるが、混乱にかかりやすい。' },
  // ───── 死の 秘宝 ─────
  r88_hp_stone: { ...acc('den'), work: 'harrypotter', set: 'deathly_hallows', name: 'よみがえりの石', bonus: { hp: 100, mag: 40, heal: 40, def: 30, agi: 30 }, desc: '3人の兄弟の話に出てくる、死の秘宝の1つ。黒い小さな石。ニワトコのつえ・とうめいマントといっしょに、1人で3つともつけると、1つの戦いで1回、たおれてもHP1でのこる。' },
  // ───── 魔法の 道具 ─────
  r88_hp_time: { ...acc('mei'), ...H, name: '逆転時計', bonus: { agi: 12 }, use: { ability: 'r88u_hp_time' }, desc: '金色の小さな砂時計の首かざり。くるりと回すと、時間が少しもどる。使うと、すぐにもう1回動ける。' },
  r88_hp_beadbag: { ...acc('fu3'), ...H, name: 'ビーズのバッグ', fx: [{ k: 'mpregen', v: 4 }], desc: '魔法で中を広げた、小さなビーズのバッグ。本もテントも、なんでも入る。行動するたびにMPが少し回復する。' },
  r88_hp_map: { ...acc('mei'), ...H, name: '忍びの地図', fx: [{ k: 'evade', v: 6 }], desc: 'いたずらずきの4人が作った、学校の地図。どこにだれがいるか、足あとでわかる。敵の攻撃をかわしやすくなる。' },
  r88_hp_mirror: { ...shield('mei'), ...H, name: 'みぞの鏡', fx: [{ k: 'counter', v: 6 }], look: 'mirror', desc: '見る人の心の、いちばんののぞみをうつす大きな鏡。たてと同じあつかい。ときどきやりかえす。' },
  r88_hp_twoway: { ...acc('fu3'), ...H, name: '両面鏡', bonus: { heal: 8 }, use: { ability: 'r88u_hp_twoway' }, desc: '2まい1組の小さな鏡。はなれていても、名前をよぶと話ができる。使うと、助けをよんで、仲間1人のHPを回復する。' },
  r88_hp_lighter: { ...acc('fu3'), ...H, name: '灯けしライター', bonus: { mag: 6 }, use: { ability: 'r88u_hp_lighter' }, desc: 'カチッとおすと、明かりをすいとったり、もどしたりできる道具。校長先生から赤毛の男の子へ。使うと、あたりをまっくらにして、敵全体をまぼろしにつつむ。' },
  r88_hp_remember: { ...acc('fu3'), ...H, name: '思い出し玉', fx: [{ k: 'guard_confuse', v: 4 }], desc: 'わすれていることがあると、中のけむりが赤くなるガラス玉。混乱にかかりにくい。' },
  r88_hp_sneako: { ...acc('fu3'), ...H, name: 'かくれん防止器', fx: [{ k: 'guard_sleep', v: 4 }], desc: 'あやしい者が近づくと、くるくる回って光るこまの形の道具。ねむりにかかりにくい。' },
  r88_hp_ears: { ...acc('fu3'), ...H, name: 'のび耳', bonus: { agi: 10 }, desc: 'ふたごのいたずら兄弟が作った、ひもののびる耳。とおくの話も聞こえる。素早さが上がる。' },
  r88_hp_howler: { ...acc('fu3'), ...H, name: 'ほえメール', bonus: { str: 6 }, use: { ability: 'r88u_hp_howler' }, desc: '開けると、大きな声でしかりつける赤いふうとう。使うと、大声で敵全体の攻撃力を下げる。' },
  r88_hp_tears: { ...acc('mei'), ...H, name: 'フォークスのなみだ', fx: [{ k: 'regen', v: 6 }], bonus: { heal: 6 }, desc: '校長先生の不死鳥のなみだ。どんなきずも、たちまちいやしてしまう。行動するたびにHPが少し回復する。' },
  r88_hp_book: { ...acc('mei'), ...H, name: '半純血のプリンスの教科書', bonus: { mag: 16, heal: 4 }, desc: '書きこみだらけの、古い魔法薬の教科書。書いてあるとおりにすると、かんぺきな薬ができる。攻撃魔力が上がる。' },
  r88_hp_felix: { ...acc('mei'), ...H, name: 'フェリックス・フェリシス', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 6 }, desc: '金色にかがやく、幸運の魔法薬。ひと口飲むと、何をしてもうまくいく。会心の一撃が出やすい。' },
  r88_hp_cork: { ...acc('fu3'), ...H, name: 'コルクの首かざり', fx: [{ k: 'guard_confuse', v: 4 }], bonus: { mag: 4 }, desc: 'ふしぎな女の子が、バタービールのコルクで作った首かざり。混乱にかかりにくい。' },
  r88_hp_specs: { ...head('fu3'), ...H, name: 'メラメラメガネ', fx: [{ k: 'crit', v: 4 }], desc: 'ふしぎな女の子の、カラフルなめがね。見えないものが見えるらしい。会心の一撃が出やすい。' },
  r88_hp_sock: { ...acc('fu2'), ...H, name: 'ドビーのくつ下', fx: [{ k: 'guard_paralyze', v: 4 }], desc: '屋しきしもべようせいが、くつ下をもらって自由になった時の、かた方のくつ下。マヒにかかりにくい。' },
  r88_hp_beans: { ...acc('fu3'), ...H, name: '百味ビーンズ', bonus: { hp: 20 }, beans: true, desc: 'いろいろな味のまじった、ふしぎなおかしのつぶ。戦いの始めに1つぶ食べると、出た味で、ちがう力が1つつく。' },
  r88_hp_glasses: { ...head('fu3'), ...H, name: 'ハリーの丸メガネ', fx: [{ k: 'crit', v: 4 }], desc: 'おでこにきずのある少年の、まんまるのめがね。会心の一撃が出やすい。' },
  r88_hp_scarf: { ...acc('fu2'), ...H, name: 'りょうのマフラー', fx: [{ k: 'res_ice', v: 4 }], desc: 'りょうの色のしまもようの、あたたかいマフラー。氷のダメージがへる。' },
  // ───── クィディッチ ─────
  r88_hp_firebolt: { ...weapon('staff', 'mei'), ...H, name: 'ファイアボルト', bonus: { agi: 22, mag: 8 }, look: 'broom', desc: 'いちばん速いといわれる、空とぶほうき。名付け親からのおくり物。つえと同じあつかい。素早さが大きく上がる。' },
  r88_hp_club: { ...weapon('bat', 'fu3'), ...H, name: 'ビーターのこん棒', fx: [{ k: 'chase', v: 4 }], look: 'club', desc: 'あばれる玉を打ち返す、ビーターの木のこん棒。ときどきもう1回攻撃する。' },
  r88_hp_snitch: { ...acc('mei'), ...H, name: '金のスニッチ', bonus: { agi: 16 }, desc: '羽根のついた、くるみくらいの小さな金の玉。つかまえると、試合がおわる。素早さが上がる。' },
  r88_hp_quaffle: { ...weapon('boomerang', 'fu3'), ...H, name: 'クアッフル', fx: [{ k: 'chase', v: 4 }], look: 'boomer', desc: 'ゴールの輪に投げ入れる、赤い大きなボール。ブーメランと同じあつかい。ときどきもう1回攻撃する。' },
};
priceUp(GEAR);

export const ITEMS_R88_HARRYPOTTER = GEAR;
export const R88_REBIRTH_HARRYPOTTER = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_HARRYPOTTER = { school_robe: 'harrypotter', elder_wand: 'harrypotter', invisible_cloak: 'harrypotter', nimbus_broom: 'harrypotter', magic_school_staff: 'harrypotter' };
// G13班: 今 ある 品に そろいも つける（ニワトコのつえ・とうめいマント → 死の 秘宝。items-r88.js の R88_TAG_SETS）
export const R88_TAG_SET_HARRYPOTTER = { elder_wand: 'deathly_hallows', invisible_cloak: 'deathly_hallows' };

export const R88_HARRYPOTTER_KANA = {
  r88_hp_holly: 'ひいらぎのつえ', r88_hp_vine: 'ぶどうのきのつえ', r88_hp_ash: 'とねりこのつえ', r88_hp_willow: 'やなぎのつえ',
  r88_hp_hawthorn: 'さんざしのつえ', r88_hp_yew: 'いちいのつえ', r88_hp_umbrella: 'ぴんくのかさ',
  r88_hp_hat: 'くみわけぼうし', r88_hp_gsword: 'ぐりふぃんどーるのぎんのけん', r88_hp_diadem: 'れいぶんくろーのかみかざり', r88_hp_cup: 'はっふるぱふのかっぷ',
  r88_hp_locket: 'すりざりんのろけっと', r88_hp_stone: 'よみがえりのいし',
  r88_hp_time: 'ぎゃくてんどけい', r88_hp_beadbag: 'びーずのばっぐ', r88_hp_map: 'しのびのちず', r88_hp_mirror: 'みぞのかがみ',
  r88_hp_twoway: 'りょうめんきょう', r88_hp_lighter: 'ひけしらいたー', r88_hp_remember: 'おもいだしだま', r88_hp_sneako: 'かくれんぼうしき',
  r88_hp_ears: 'のびみみ', r88_hp_howler: 'ほえめーる', r88_hp_tears: 'ふぉーくすのなみだ', r88_hp_book: 'はんじゅんけつのぷりんすのきょうかしょ',
  r88_hp_felix: 'ふぇりっくすふぇりしす', r88_hp_cork: 'こるくのくびかざり', r88_hp_specs: 'めらめらめがね', r88_hp_sock: 'どびーのくつした',
  r88_hp_beans: 'ひゃくみびーんず', r88_hp_glasses: 'はりーのまるめがね', r88_hp_scarf: 'りょうのまふらー',
  r88_hp_firebolt: 'ふぁいあぼると', r88_hp_club: 'びーたーのこんぼう', r88_hp_snitch: 'きんのすにっち', r88_hp_quaffle: 'くあっふる',
};
