// 第51回 C1: 幻の職業（伝説の 上。tier 4）海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI（docs/plan-r51-phantom.md）
// ・req … 2つとも きわめる（Lv10）。やりこみの 条件は data/phantom.js（F）
// ・強さは もとの 伝説の 職業より 1わり ちょっと 上。技は abilities-phantom-a.js、たたかいの しかけは battle-phantom-a.js
// ・jobs.js が JOBS に まぜる（ならびの PHANTOM_ORDER は F）

export const PHANTOM_JOBS_A = {
  // ニカ ＋ 海賊 → 海賊王。仲間が 多いほど 強い・敵を 笑わせて 止める「自由の技」
  pirate_king: {
    id: 'pirate_king', name: '海賊王', kana: 'かいぞくおう', short: '海賊王', tier: 4, req: ['nika', 'pirate'], family: 'phys', color: '#e8302a',
    desc: '自由をつらぬき、すべての海をこえた海賊の王。ニカと海賊をきわめ、ゴムゴムの技をたくさん使った者だけがなれる。仲間が多いほど強くなり、「自由の技」で敵を笑わせて動けなくする。戦いで手に入るお金もふえる。',
    mods: { hp: 1.9, mp: 1.25, str: 1.95, def: 1.6, agi: 1.8, mag: 1.1, heal: 1.25 },
    weapons: ['none', 'claw', 'sword', 'axe'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { hp: 2, str: 1.5, agi: 0.5 },
    passive: { gold: 1.3, resist: { bolt: 0 } },
    learn: [[1, 'pk_gatling'], [2, 'pk_hata'], [3, 'pk_ichimi'], [5, 'pk_jiyuu'], [6, 'pk_utage'], [7, 'pk_haoh'], [8, 'pk_taiyou'], [10, 'pirate_king_sig']],
  },
  // ロトの勇者 ＋ スーパーサイヤ人3 → 伝説の超勇者。気を ためて、雷の かめはめ波「かめはめデイン」
  super_hero: {
    id: 'super_hero', name: '伝説の超勇者', kana: 'でんせつのちょうゆうしゃ', short: '超勇者', tier: 4, req: ['loto_hero', 'ss3'], family: 'phys', color: '#f0c830',
    desc: '勇者の雷と、金色の気をあわせ持つ、伝説の超勇者。ロトの勇者とスーパーサイヤ人3をきわめ、雷の呪文とかめはめ波をたくさん使った者だけがなれる。気をためるほど、雷をまとったかめはめデインが強くなる。',
    mods: { hp: 1.8, mp: 1.5, str: 2.05, def: 1.6, agi: 1.85, mag: 1.6, heal: 1.5 },
    weapons: ['sword', 'spear', 'axe', 'claw', 'staff', 'none'], shield: true, armor: ['cloth', 'heavy', 'gi', 'robe'], helm: true,
    perLv: { hp: 2, str: 1.5, mag: 0.5, agi: 0.5 },
    versatile: true,
    learn: [[1, 'sh_ken'], [2, 'sh_ki'], [3, 'sh_gigaslash'], [5, 'sh_aura'], [6, 'sh_inori'], [7, 'sh_gigadein'], [8, 'sh_rengeki'], [10, 'super_hero_sig']],
  },
  // 日の呼吸の使い手 ＋ 七代目火影 → 日の火影。影分身が それぞれ ヒノカミ神楽を まう
  sun_hokage: {
    id: 'sun_hokage', name: '日の火影', kana: 'ひのほかげ', short: '日の火影', tier: 4, req: ['hinokami', 'hokage'], family: 'tech', color: '#ff7a1a',
    desc: '日の呼吸と忍術、2つの道をきわめた里の長。日の呼吸の使い手と七代目火影をきわめ、ヒノカミ神楽と忍術をたくさん使った者だけがなれる。影分身を出すと、分身もみんなヒノカミ神楽をまう。',
    mods: { hp: 1.85, mp: 1.5, str: 2.05, def: 1.55, agi: 1.9, mag: 1.5, heal: 1.15 },
    weapons: ['sword', 'dagger', 'claw', 'boomerang', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { hp: 1.5, str: 1.5, agi: 1 },
    learn: [[1, 'sk_bunshin'], [2, 'sk_kasha'], [3, 'sk_rasen'], [5, 'sk_hirin'], [6, 'sk_ishi'], [7, 'sk_bijuu'], [8, 'sk_kekkai'], [10, 'sun_hokage_sig']],
  },
  // 天才しせつ管理者 ＋ クリエイター → 天才しせつ管理者AI。毎ターン 仲間全員を 自動で 最適化（passive.autoOpt）
  facility_ai: {
    id: 'facility_ai', name: '天才しせつ管理者AI', kana: 'てんさいしせつかんりしゃえーあい', short: 'AI', tier: 4, req: ['facility_genius', 'creator'], family: 'tech', color: '#20d0c8',
    desc: '建物も仲間の体調も、すべてを見守る天才のAI。天才しせつ管理者とクリエイターをきわめ、補助の技をたくさん使った者だけがなれる。自分の番がくるたびに、仲間全員の力を自動で最適化する。戦いで手に入るお金もとてもふえる。',
    mods: { hp: 1.65, mp: 1.65, str: 1.4, def: 1.6, agi: 1.4, mag: 1.65, heal: 1.75 },
    weapons: ['axe', 'dagger', 'staff', 'none'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { hp: 1.5, mag: 1, heal: 1.5, mp: 0.5 },
    passive: { foresee: 0.55, gold: 1.35, autoOpt: { base: 1.15, boost: 1.25, heal: 0.06, mp: 2 } },
    versatile: true,
    learn: [[1, 'fa_scan'], [2, 'fa_mode'], [3, 'fa_kuuchou'], [5, 'fa_shohou'], [6, 'fa_demand'], [7, 'fa_drone'], [8, 'fa_hirameki'], [10, 'facility_ai_sig']],
  },
};
