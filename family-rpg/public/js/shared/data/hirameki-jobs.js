// あたらしい 職業の ひらめき技（2026年10月 第23回）
//
// ・第20〜22回で ふえた 職業の 道（料理人・アルバイト・お笑い芸人・大賢者・ロトの勇者・ニート・サイヤ人・設備屋・
//   ゴム人間・ユーチューバー・ゲーマー・魔王・おかん・社ちく・はかい神）に、1〜3こずつ
// ・job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
// ・from … その 道の 技を 使った 回数（上の 職業の 技は 使う 回数が 少ないので、回数も 少なめ）
// ・強さは その 職業の 同じくらいの レベルの 技と おなじくらい。みんなに かける 補助は 職業の ランクの 上限まで
//   （基本職 1.15倍・いくつもの 強さは 1.12倍、上級職 1.25倍・1.2倍、超級職 1.4倍・1.3倍。test/jobs-r20.test.js と おなじ）
// ・anim は 前から ある エフェクトを 使う（client/render/battlefx*.js）
// ・id は hi_ で はじめる（はかい神の 技が hk_ を 使っているので）

export const HIRA_JOB_ABILITIES = {
  // ───────────── 料理人（パティシエ・三ツ星シェフ） ─────────────
  hi_kakushi_bouchou: {
    name: 'かくし包丁', kana: 'かくしぼうちょう', kind: 'skill', job: 'cook', mp: 4, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 1.7, ignoreDef: 0.4 },
    desc: '見えないところに包丁を入れる、料理人のひみつのわざ。固い敵1体にもよく効く。',
    cast: '{a}は、見えないところにすっと包丁を入れた！', anim: 'slash_fast',
  },
  hi_daikaryoku: {
    name: '大火力いため', kana: 'だいかりょくいため', kind: 'skill', job: 'cook', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'magic', element: 'fire', base: [20, 28], thr: 20 },
    desc: '中華なべを強火であおって、炎を大きくふき上げる。敵全体に炎のダメージ。',
    cast: '{a}は中華なべを大きくあおった！炎がふき上がる！', anim: 'fire_wave',
  },
  hi_okashi_no_ie: {
    name: 'おかしの家', kana: 'おかしのいえ', kind: 'skill', job: 'patissier', mp: 10, target: 'allies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [42, 54], thr: 32 }, { type: 'buff', stat: 'def', mult: 1.2, dur: 30 }] },
    desc: 'あまいおかしの家を建てて、みんなで休む。仲間全員のHPを回復して、守備力も上がる。',
    cast: '{a}は、あっという間におかしの家を建てた！', anim: 'heal_dance',
  },
  // ───────────── アルバイト（正社員・たたき上げ社長） ─────────────
  hi_wanope: {
    name: 'ワンオペ', kana: 'わんおぺ', kind: 'skill', job: 'parttimer', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.5, hits: 5, random: true },
    desc: 'お店を1人で回す、目の回るいそがしさ。5回、敵にランダムで攻撃する。',
    cast: '{a}は1人でお店を回し始めた！', anim: 'punch_multi',
  },
  hi_smile: {
    name: 'スマイル0円', kana: 'すまいるぜろえん', kind: 'skill', job: 'parttimer', mp: 2, target: 'allies', hirameki: true,
    effect: { type: 'heal', base: [16, 22], thr: 14 },
    desc: 'お金のかからない、とびきりの笑顔。仲間全員のHPが少し回復する。',
    cast: '{a}はとびきりのスマイルを見せた！', anim: 'hearts',
  },
  hi_shachoushou: {
    name: '社長賞', kana: 'しゃちょうしょう', kind: 'skill', job: 'seishain', mp: 9, target: 'allies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 35 }, { type: 'bondUp', amount: 10 }] },
    desc: 'チームの大活やくが社長に表しょうされた！仲間全員の攻撃力と守備力が上がり、きずなも深まる。',
    cast: '「このチームに、社長賞をおくります！」', anim: 'warcry',
  },
  // ───────────── お笑い芸人（M-1王者） ─────────────
  hi_noritsukkomi: {
    name: 'ノリツッコミ', kana: 'のりつっこみ', kind: 'skill', job: 'comedian', mp: 6, target: 'enemy', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.6, dispel: true }, { type: 'atbSet', sub: 30, chance: 0.5, msg: '{t}は、ぽかんとして動けない！', failMsg: '{t}は、ノリについてこなかった。' }] },
    desc: '一度ボケに乗ってから、するどくツッコむ。敵1体の強くなった力を消して、動きを止めることがある。',
    cast: '{a}「そうそう、これがまた…って、なんでやねん！」', anim: 'hit',
  },
  hi_tendon: {
    name: '天どん', kana: 'てんどん', kind: 'skill', job: 'comedian', mp: 7, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.55, hits: 4, random: true },
    desc: '同じボケを何回もくり返して、じわじわ笑わせる。4回、敵にランダムで攻撃する。',
    cast: '{a}は、さっきと同じボケをもう一度くり返した！', anim: 'laugh',
  },
  // ───────────── 大賢者 ─────────────
  hi_giragureido: {
    name: 'ギラグレイド', kana: 'ぎらぐれいど', kind: 'spell', job: 'daikenja', mp: 20, target: 'enemies', hirameki: true,
    effect: { type: 'magic', element: 'fire', base: [120, 145], thr: 80 },
    desc: '大地をさくほどの、いちばん強い閃光の呪文。敵全体に炎のダメージ。',
    cast: '{a}はギラグレイドをとなえた！大地に光の線が走る！', anim: 'fire3',
  },
  hi_dorumadon: {
    name: 'ドルマドン', kana: 'どるまどん', kind: 'spell', job: 'daikenja', mp: 16, target: 'enemy', hirameki: true,
    effect: { type: 'magic', element: 'dark', base: [180, 215], thr: 80 },
    desc: '大賢者だけが知る、闇の大呪文。敵1体に闇の大ダメージ。',
    cast: '{a}はドルマドンをとなえた！', anim: 'dark1',
  },
  // ───────────── ロトの勇者 ─────────────
  hi_arutema: {
    name: 'アルテマソード', kana: 'あるてまそーど', kind: 'skill', job: 'loto_hero', mp: 18, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 3.4, element: 'light', ignoreDef: 0.4 },
    desc: '天にかかげた剣に全ての力を集める、伝説の剣技。敵1体に光の大ダメージ。',
    cast: '{a}は天にかかげた剣に、全ての力を集めた！', anim: 'gigabreak',
  },
  hi_hikari_tama: {
    name: '光の玉', kana: 'ひかりのたま', kind: 'skill', job: 'loto_hero', mp: 20, target: 'enemies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [120, 150], thr: 80 }, { type: 'dispel' }] },
    desc: '伝説の光の玉をかかげて、闇をはらう。敵全体に光のダメージをあたえて、敵の強くなった力を消す。',
    cast: '{a}は光の玉を高くかかげた！', anim: 'holy',
  },
  // ───────────── ニート（中二病・ダ天使） ─────────────
  hi_kyou_honki: {
    name: '今日から本気出す', kana: 'きょうからほんきだす', kind: 'skill', job: 'neet', mp: 5, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 2.1, critBonus: 0.2 },
    desc: 'ついに「明日」ではなく「今日」本気を出した！敵1体に大きなダメージ。会心が出やすい。',
    cast: '{a}「…今日から、本気出す！」', anim: 'slash_heavy',
  },
  hi_ofuton_barrier: {
    name: 'おふとんバリア', kana: 'おふとんばりあ', kind: 'skill', job: 'neet', mp: 4, target: 'self', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 30 }, { type: 'heal', base: [40, 52], thr: 20 }] },
    desc: 'おふとんにくるまって、絶対に出てこない。自分の守備力が上がり、HPも回復する。',
    cast: '{a}はおふとんにくるまった！', anim: 'guard',
  },
  hi_eternal_blizzard: {
    name: 'エターナルフォースブリザード', kana: 'えたーなるふぉーすぶりざーど', kind: 'spell', job: 'chuuni', mp: 12, target: 'enemies', hirameki: true,
    effect: { type: 'magic', element: 'ice', base: [66, 84], thr: 55, status: { status: 'paralyze', chance: 0.15, turns: [1, 2], quiet: true } },
    desc: '一しゅんで全てをこおらせる、さいきょうの技（と、本人は思っている）。敵全体に氷のダメージ。こおりついて動けなくなることがある。',
    cast: '{a}「くらえ…エターナルフォースブリザード！」', anim: 'blizzard',
  },
  // ───────────── サイヤ人（スーパーサイヤ人・2・3） ─────────────
  hi_kaiouken: {
    name: '界王拳', kana: 'かいおうけん', kind: 'skill', job: 'saiyan', mp: 4, target: 'self', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 30 }, { type: 'charge', mult: 1, hpCost: 0.1 }] },
    desc: '体に無理をさせて、力を何倍にも引き出す。HPを少し使って、自分の攻撃力と素早さが上がる。',
    cast: '{a}「界王拳！」赤いオーラが体を包む！', anim: 'super_aura',
  },
  hi_kienzan: {
    name: '気円斬', kana: 'きえんざん', kind: 'skill', job: 'saiyan', mp: 5, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 1.9, ignoreDef: 0.5 },
    desc: '気をうすい円にして投げつける。どんなに固い敵1体でも切りさく。',
    cast: '{a}の手の上で、気の円がうなりを上げる！', anim: 'slash_fast',
  },
  hi_bigbang_kame: {
    name: 'ビッグバンかめはめ波', kana: 'びっぐばんかめはめは', kind: 'skill', job: 'super_saiyan', mp: 16, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 1.8 },
    desc: 'ビッグバンアタックとかめはめ波を合わせた大技。敵全体を気の光で包みこむ。',
    cast: '{a}「ビッグバン…かめはめ波ーっ！」', anim: 'kamehameha',
  },
  // ───────────── 設備屋（ryonetsu・天才しせつ管理者） ─────────────
  hi_shinkuu: {
    name: '真空引き', kana: 'しんくうびき', kind: 'skill', job: 'setsubiya', mp: 7, target: 'group', hirameki: true,
    effect: { type: 'magic', element: 'wind', base: [40, 52], thr: 35 },
    desc: 'エアコン工事の大事な仕上げ。真空ポンプで空気をすい出して、同じ種類の敵をまとめてしめつける。',
    cast: '{a}は真空ポンプのスイッチを入れた！', anim: 'wind2',
  },
  hi_yukadanbou: {
    name: 'ゆか暖ぼう', kana: 'ゆかだんぼう', kind: 'skill', job: 'setsubiya', mp: 8, target: 'allies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [30, 40], thr: 25 }, { type: 'regen', base: [6, 8], thr: 20, dur: 20 }] },
    desc: '足元からぽかぽか。仲間全員のHPを回復して、しばらくの間、じわじわ回復する。',
    cast: '{a}はゆか暖ぼうのスイッチを入れた！足元がぽかぽかしてきた！', anim: 'heal_dance',
  },
  hi_inverter: {
    name: 'インバーター制御', kana: 'いんばーたーせいぎょ', kind: 'skill', job: 'ryonetsu', mp: 12, target: 'allies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }, { type: 'mpHeal', base: [4, 6] }] },
    desc: 'むだのないなめらかな動き。仲間全員の素早さが上がり、MPも少し回復する。',
    cast: '{a}はインバーターで回転数をぴったり合わせた！', anim: 'aircon',
  },
  // ───────────── ゴム人間（ニカ） ─────────────
  hi_gomu_muchi: {
    name: 'ゴムゴムのムチ', kana: 'ごむごむのむち', kind: 'skill', job: 'rubber', mp: 9, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 1.15 },
    desc: '足をのばして、ムチのように横にふり回す。敵全体をまとめてけりとばす。',
    cast: '{a}「ゴムゴムの…ムチ！」', anim: 'whip',
  },
  hi_gear4: {
    name: 'ギア4', kana: 'ぎあふぉーす', kind: 'skill', job: 'rubber', mp: 12, target: 'self', hirameki: true,
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.45, dur: 40 },
    desc: '体を大きくふくらませた、はずむ戦い方。自分の攻撃力と守備力がとても上がる。',
    cast: '{a}「ギア…4！」体が大きくふくらんだ！', anim: 'super_aura',
  },
  // ───────────── ユーチューバー（人気配信者） ─────────────
  hi_kyuujoushou: {
    name: '急上しょう1位', kana: 'きゅうじょうしょういちい', kind: 'skill', job: 'youtuber', mp: 5, target: 'allies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.15, dur: 30 }, { type: 'bondUp', amount: 15 }] },
    desc: '動画が急上しょうランキング1位に！仲間全員の攻撃力が上がり、きずなも深まる。',
    cast: '「急上しょう1位、ありがとうございます！」', anim: 'superchat',
  },
  hi_buzz: {
    name: 'バズり動画', kana: 'ばずりどうが', kind: 'skill', job: 'youtuber', mp: 7, target: 'enemies', hirameki: true,
    effect: { type: 'magic', base: [34, 46], thr: 28, status: { status: 'confuse', chance: 0.2, turns: [1, 2], quiet: true } },
    desc: '動画がとんでもなくバズった！敵全体にダメージ。見入ってしまって混乱することがある。',
    cast: '{a}の動画が、世界中でバズった！', anim: 'camera',
  },
  // ───────────── ゲーマー（プロゲーマー） ─────────────
  hi_kakushi_command: {
    name: 'かくしコマンド', kana: 'かくしこまんど', kind: 'skill', job: 'gamer', mp: 7, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 2.2, critBonus: 0.3 },
    desc: '昔から伝わるひみつのコマンド。敵1体に大きなダメージ。会心がとても出やすい。',
    cast: '{a}「上上下下左右左右BA！」', anim: 'glitch',
  },
  hi_time_attack: {
    name: 'タイムアタック', kana: 'たいむあたっく', kind: 'skill', job: 'gamer', mp: 6, target: 'enemy', hirameki: true,
    effect: { type: 'phys', mult: 1.5, atbAfter: 60 },
    desc: '1びょうでも早いクリアを目指す。敵1体を攻撃して、すぐに次の順番が来る。',
    cast: '{a}はタイマーをスタートさせた！', anim: 'slash_fast',
  },
  // ───────────── 魔王 ─────────────
  hi_ima_mera: {
    name: '今のはメラだ', kana: 'いまのはめらだ', kind: 'spell', job: 'maou', mp: 12, target: 'enemy', hirameki: true,
    effect: { type: 'magic', element: 'fire', base: [210, 250], thr: 90 },
    desc: '魔王がとなえると、ただのメラが大きな火の鳥になる。敵1体に炎の大ダメージ。',
    cast: '{a}「今のはメラゾーマではない…メラだ」', anim: 'fire3',
  },
  hi_yami_sekai: {
    name: '闇の世界', kana: 'やみのせかい', kind: 'spell', job: 'maou', mp: 20, target: 'enemies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'dark', base: [120, 150], thr: 80 }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 30, chance: 0.7 }] },
    desc: '辺りを闇の世界に変える。敵全体に闇のダメージ。守備力が下がることがある。',
    cast: '{a}「ここは、わが闇の世界…」辺りが真っ暗になった！', anim: 'maou_dark',
  },
  // ───────────── おかん（最強のおかん） ─────────────
  hi_idobata: {
    name: '井戸ばた会議', kana: 'いどばたかいぎ', kind: 'skill', job: 'okan', mp: 5, target: 'enemies', hirameki: true,
    effect: { type: 'atbSet', sub: 35, chance: 0.55, msg: '{t}は、長話にまきこまれて動けない！', failMsg: '{t}は、そっと立ち去った。' },
    desc: 'おかんたちの長い長い立ち話。敵全体が話にまきこまれて、動きがおそくなることがある。',
    cast: '{a}「ちょっと聞いて〜！」', anim: 'laugh',
  },
  hi_bargain: {
    name: 'バーゲンダッシュ', kana: 'ばーげんだっしゅ', kind: 'skill', job: 'okan', mp: 6, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 0.55, hits: 4, random: true, critBonus: 0.1 },
    desc: 'タイムセールの品物にまっしぐら！4回、敵にランダムで体当たりする。',
    cast: '「タイムセールです！」{a}は走り出した！', anim: 'punch_multi',
  },
  hi_chabudai: {
    name: 'ちゃぶ台返し', kana: 'ちゃぶだいがえし', kind: 'skill', job: 'saikyo_okan', mp: 12, target: 'enemies', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.3 }, { type: 'atbSet', sub: 30, chance: 0.5, msg: '{t}は、ひっくり返って動けない！', failMsg: '{t}は、なんとかふみとどまった！' }] },
    desc: 'もうがまんできない！ちゃぶ台をひっくり返して、敵全体を攻撃する。動きを止めることがある。',
    cast: '{a}「いいかげんにしなさーい！」ちゃぶ台がひっくり返った！', anim: 'quake',
  },
  // ───────────── 社ちく（ブラックきぎょうの星） ─────────────
  hi_reply_all: {
    name: '全員に返信', kana: 'ぜんいんにへんしん', kind: 'skill', job: 'shachiku', mp: 7, target: 'enemies', hirameki: true,
    effect: { type: 'magic', base: [40, 54], thr: 30 },
    desc: 'うっかり全員に返信してしまった！メールが敵全体にとどいて、ダメージをあたえる。',
    cast: '{a}は、うっかり「全員に返信」をおしてしまった！', anim: 'cards',
  },
  hi_drink3: {
    name: '栄養ドリンク3本目', kana: 'えいようどりんくさんぼんめ', kind: 'skill', job: 'shachiku', mp: 0, target: 'self', hirameki: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [40, 55], thr: 25 }, { type: 'charge', mult: 1.8 }] },
    desc: '今日3本目の栄養ドリンク。自分のHPを回復して、次の攻撃が強くなる。',
    cast: '{a}は今日3本目の栄養ドリンクを一気に飲んだ！', anim: 'charge',
  },
  // ───────────── はかい神 ─────────────
  hi_pudding: {
    name: 'プリンのうらみ', kana: 'ぷりんのうらみ', kind: 'skill', job: 'hakaishin', mp: 20, target: 'enemies', hirameki: true,
    effect: { type: 'phys', mult: 1.8, ignoreDef: 0.3 },
    desc: '楽しみにしていたプリンを食べられた、はかい神のいかり。敵全体に大きなダメージ。',
    cast: '{a}「わたしのプリンを食べたのは、だれだ…！」', anim: 'maou_dark',
  },
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_JOBS = {
  hi_kakushi_bouchou: { from: { ck_houchou: 20, ck_mijin: 6 } },
  hi_daikaryoku: { from: { ck_tsuyobi: 15, ck_flambe: 4 } },
  hi_okashi_no_ie: { from: { pa_cake: 10, pa_sugar: 6 } },
  hi_wanope: { from: { ab_reji: 15, ab_shinadashi: 8 } },
  hi_smile: { from: { ab_irasshai: 15, ab_makanai: 8 } },
  hi_shachoushou: { from: { se_chourei: 10, se_project: 8 } },
  hi_noritsukkomi: { from: { cm_tsukkomi: 15, cm_boke: 6 } },
  hi_tendon: { from: { cm_gag: 12, cm_conte: 8 } },
  hi_giragureido: { from: { dz_mahyadedos: 10, dz_iogurande: 6 } },
  hi_dorumadon: { from: { dz_ishi: 10, dz_mahyadedos: 8 } },
  hi_arutema: { from: { lt_ken: 15, lt_gigacross: 5 } },
  hi_hikari_tama: { from: { lt_shirushi: 6, lt_inori: 6 } },
  hi_kyou_honki: { from: { ne_makura: 20, ne_honki: 10 } },
  hi_ofuton_barrier: { from: { ne_gorogoro: 15, ne_nidone: 5 } },
  hi_eternal_blizzard: { from: { cu_kokuen: 12, cu_note: 8 } },
  hi_kaiouken: { from: { sy_kiai: 15, sy_rush: 8 } },
  hi_kienzan: { from: { sy_kidan: 20, sy_renzoku: 8 } },
  hi_bigbang_kame: { from: { sz_kame: 10, sz_kikouha: 10 } },
  hi_shinkuu: { from: { sb_haikan: 10, sb_aircon: 8 } },
  hi_yukadanbou: { from: { sb_tenken: 12, sb_haikan: 6 } },
  hi_inverter: { from: { rn_shoene: 10, rn_koushin: 8 } },
  hi_gomu_muchi: { from: { go_pistol: 15, go_gatling: 6 } },
  hi_gear4: { from: { go_gear2: 8, go_fusen: 8 } },
  hi_kyuujoushou: { from: { yt_live: 12, yt_kirinuki: 8 } },
  hi_buzz: { from: { yt_samune: 12, yt_kikaku: 6 } },
  hi_kakushi_command: { from: { ga_renda: 20, ga_bug: 8 } },
  hi_time_attack: { from: { ga_hame: 8, ga_combo: 8 } },
  hi_ima_mera: { from: { mo_kokuen: 12, mo_tsume: 6 } },
  hi_yami_sekai: { from: { mo_iatsu: 6, mo_koromo: 6 } },
  hi_idobata: { from: { ok_negiri: 12, ok_ame: 8 } },
  hi_bargain: { from: { ok_otama: 15, ok_negiri: 8 } },
  hi_chabudai: { from: { so_osouji: 8, so_slipper: 8 } },
  hi_reply_all: { from: { sk_kaigi: 8, sk_pekopeko: 6 } },
  hi_drink3: { from: { sk_eiyou: 15, sk_zangyou: 10 } },
  hi_pudding: { from: { hk_ikari: 6, hk_kimagure: 8 } },
};
