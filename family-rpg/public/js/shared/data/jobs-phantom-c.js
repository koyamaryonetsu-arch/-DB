// 第51回 C3: 幻の職業（伝説の 上。tier 4）の 4つ（docs/plan-r51-phantom.md）
//   宇宙一のおかん（最強のおかん＋3年B組の担任）・はかいと創造の神（家族の 表では 破壊と創造の神。壊は 習わない 字）（はかい神＋クリエイター）
//   夢のスタジアム鉄道（京急の社長＋野球界の殿堂入り）・天候の神（天候をあやつる者＋天地雷鳴士）
// ・req は 2つとも きわめる（reqSuper などは 使わない）。やりこみの 条件は F の data/phantom.js
// ・強さ（mods）は もとに なった 伝説の 職業の 1.1〜1.15倍（天候の神は 伝説の 平均の 1.12倍くらい）
// ・技は abilities-phantom-c.js（看板の 技は <職業の id>_sig）。えんしゅつは o9（ax-time-o9.js）
// ・天候をあやつる者（tenkou_tsukai）は W 班が 作る。天地雷鳴士の id は summoner
// ・PHANTOM_ORDER・TIER_NAMES[4] は F が 作る（ここでは さわらない）

export const PHANTOM_JOBS_C = {
  // 宇宙一のおかん: しかられた 敵は 反省して しばらく 動かない。家族を いやす
  cosmic_okan: {
    id: 'cosmic_okan', name: '宇宙一のおかん', kana: 'うちゅういちのおかん', short: '宇宙おかん', tier: 4, req: ['saikyo_okan', 'homeroom_3b'], family: 'tech', color: '#e8a020',
    desc: '星の数ほど家族を見守ってきた、宇宙でいちばんのおかん。最強のおかんと3年B組の担任をきわめ、敵を弱くする技と回復をたくさん使った者だけがなれる。しかられた敵は反省して、しばらく動けない。ごはんと愛で家族みんなをいやす。',
    mods: { hp: 1.75, mp: 1.55, str: 1.6, def: 1.6, agi: 1.3, mag: 1.45, heal: 1.8 },
    weapons: ['staff', 'axe', 'fan', 'none'], shield: true, armor: ['cloth', 'robe'], helm: true,
    perLv: { hp: 1.5, heal: 1.5, def: 0.5 },
    learn: [[1, 'co_kora'], [2, 'co_gohan'], [3, 'co_hansei'], [5, 'co_slipper'], [6, 'co_bentou'], [7, 'co_ai'], [8, 'co_kaji'], [10, 'cosmic_okan_sig']],
  },
  // 破壊と創造の神: 敵を 消して、味方の 装備を 作りかえる
  chaos_creator: {
    id: 'chaos_creator', name: 'はかいと創造の神', kana: 'はかいとそうぞうのかみ', short: 'はかい創造', tier: 4, req: ['hakaishin', 'creator'], family: 'phys', color: '#7a3ab8',
    desc: 'こわすことと作ることを、両手で同時にあやつる神。はかい神とクリエイターをきわめ、1回で5000をこえる大ダメージを何度もあたえた者だけがなれる。敵をまっさらに消して、仲間の装備を新しく作りかえる。',
    mods: { hp: 1.9, mp: 1.45, str: 2.15, def: 1.6, agi: 1.7, mag: 1.6, heal: 1.0 },
    weapons: ['none', 'claw', 'axe', 'staff'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { hp: 2, str: 1.5, mag: 0.5 },
    learn: [[1, 'cc_kesu'], [2, 'cc_tsukurikae'], [3, 'cc_kowashite'], [5, 'cc_mu'], [6, 'cc_sagyoudai'], [7, 'cc_dama'], [8, 'cc_rule'], [10, 'chaos_creator_sig']],
  },
  // 夢のスタジアム鉄道: 満員の 観客電車が 球場ごと つっこむ（観客が ふえるほど 強い）
  dream_stadium: {
    id: 'dream_stadium', name: '夢のスタジアム鉄道', kana: 'ゆめのすたじあむてつどう', short: '夢スタ', tier: 4, req: ['keikyu_president', 'hall_of_fame'], family: 'phys', color: '#d83a2a',
    desc: '線路の終点は、満員のスタジアム。京急の社長と野球界の殿堂入りをきわめ、電車の技と速球の技をたくさん使った者だけがなれる。観客が集まるほど技が強くなり、最後は観客電車が球場ごとつっこむ。戦いで手に入るお金もふえる。',
    mods: { hp: 1.8, mp: 1.5, str: 2.05, def: 1.65, agi: 1.75, mag: 1.2, heal: 1.2 },
    weapons: ['bat', 'fan', 'staff', 'spear', 'sword', 'none'], shield: true, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { hp: 1, str: 1.5, agi: 0.5 },
    passive: { gold: 1.3 },
    learn: [[1, 'ds_manin'], [2, 'ds_seien'], [3, 'ds_kaisoku'], [5, 'ds_wave'], [6, 'ds_chokutsu'], [7, 'ds_makyu'], [8, 'ds_lucky7'], [10, 'dream_stadium_sig']],
  },
  // 天候の神: 天気を かえると 味方と 敵の 属性の 強さが 入れかわる（shared/battle-weather.js）
  weather_god: {
    id: 'weather_god', name: '天候の神', kana: 'てんこうのかみ', short: '天候神', tier: 4, req: ['tenkou_tsukai', 'summoner'], family: 'magic', color: '#3aa0e8',
    desc: '晴れも雨もかみなりも、思いのままにあやつる空の神。天候をあやつる者と天地雷鳴士をきわめ、晴れ・雨・かみなりの技をたくさん使った者だけがなれる。天気をかえると、味方の得意な力が強くなり、敵の力は弱くなる。',
    mods: { hp: 1.6, mp: 1.8, str: 1.15, def: 1.45, agi: 1.6, mag: 1.95, heal: 1.45 },
    weapons: ['staff', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1.5, mp: 1, agi: 0.5 },
    learn: [[1, 'wg_hare'], [2, 'wg_ame'], [3, 'wg_kaminari'], [5, 'wg_manatsu'], [6, 'wg_gouu'], [7, 'wg_raitei'], [8, 'wg_niji'], [10, 'weather_god_sig']],
  },
};

// 神殿の うわさ（JOB_HINTS に まぜる。幻の書・酒場の うわさは F の data/phantom.js）
export const PHANTOM_HINTS_C = {
  cosmic_okan: '最強のおかんと3年B組の担任をきわめ、しかって、いやしつづけた者は、宇宙でいちばんのおかんになれるらしい…',
  chaos_creator: 'はかい神とクリエイターをきわめ、とてつもない一げきを何度も出した者は、こわして作る神になれるらしい…',
  dream_stadium: '京急の社長と野球界の殿堂入りをきわめ、電車と速球をたくさん使った者は、夢のスタジアムへの線路をひけるらしい…',
  weather_god: '天候をあやつる者と天地雷鳴士をきわめ、晴れも雨もかみなりもよび続けた者は、空の神になれるらしい…',
};
