// 第51回 W: 天気の 職業の 流れ「気象予報士 → お天気キャスター → 天候をあやつる者」（docs/plan-r51-phantom.md）
//   技は abilities-weather.js（晴れ・雨・かみなりの 技には weather: 'sun' | 'rain' | 'thunder'。幻の職業「天候の神」の 条件で 数える）
//   ひらめき技は hirameki-weather.js。えんしゅつは o10（shared/data/ax-time-o10.js・client/render/axfx-o10.js）
//
// ・気象予報士（基本職）… 本当の 仕事。空を 見て 明日の 天気を 当てる。はじめから えらべる（ほかの 基本職と おなじ。じょうけん なし）
// ・お天気キャスター（上級職）… テレビで 天気を つたえる 人。気象予報士を きわめると なれる
// ・天候をあやつる者（超級職）… 天気そのものを あやつる ふしぎな 人。お天気キャスターを きわめると なれる（マリオ・はがねのれん金術師と おなじ 1本道）
// 強さは 魔力と MP が 高く、力は ひくめ（れん金術師・魔法学校の生徒・雪の女王 くらい）
// jobs.js が JOBS に まぜて、JOB_ORDER・ADVANCED_ORDER・SUPER_ORDER に 1つずつ 足す

export const WEATHER_JOBS = {
  kishou: {
    id: 'kishou', name: '気象予報士', kana: 'きしょうよほうし', short: '予報士', tier: 0, family: 'magic', color: '#4aa8e0',
    desc: '空と雲を見て、明日の天気を当てる仕事。かみなり・にわか雨・日ざしの力を少しだけ使える。天気予報で仲間を動きやすくする。きわめるとお天気キャスターになれる。',
    mods: { hp: 0.95, mp: 1.2, str: 0.8, def: 0.95, agi: 1.05, mag: 1.25, heal: 1.05 },
    weapons: ['staff', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, mp: 0.5 },
    learn: [[1, 'ks_kaminari'], [2, 'ks_niwaka'], [3, 'ks_hinata'], [4, 'ks_yohou'], [5, 'ks_manatsubi'], [7, 'ks_raiu'], [10, 'kishou_sig']],
  },
  otenki_caster: {
    id: 'otenki_caster', name: 'お天気キャスター', kana: 'おてんききゃすたー', short: 'キャスター', tier: 1, req: ['kishou'], family: 'magic', color: '#f0a83a',
    desc: 'テレビで、みんなに明日の天気をつたえる人。天気図をさして、かみなり・大雨・日ざしをよび、大きなかさで仲間を守る。気象予報士をきわめるとなれる。',
    mods: { hp: 1.05, mp: 1.35, str: 0.85, def: 1.0, agi: 1.15, mag: 1.4, heal: 1.15 },
    weapons: ['staff', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, mp: 0.5, agi: 0.5 },
    learn: [[1, 'oc_kaminari'], [2, 'oc_kasa'], [3, 'oc_hizashi'], [4, 'oc_atari'], [5, 'oc_ooame'], [7, 'oc_moushobi'], [10, 'otenki_caster_sig']],
  },
  tenkou_tsukai: {
    id: 'tenkou_tsukai', name: '天候をあやつる者', kana: 'てんこうをあやつるもの', short: '天候', tier: 2, req: ['otenki_caster'], family: 'magic', color: '#7a6ae8',
    desc: '空に手をのばすだけで、天気をかえてしまう者。晴れ・雨・かみなり・台風を自由によび、めぐみの雨で仲間をいやし、にじのかけ橋で力を合わせる。お天気キャスターをきわめた者だけがなれる。',
    mods: { hp: 1.15, mp: 1.6, str: 0.85, def: 1.1, agi: 1.3, mag: 1.7, heal: 1.3 },
    weapons: ['staff', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 0.5, agi: 0.5 },
    learn: [[1, 'tt_rakurai'], [2, 'tt_megumi'], [3, 'tt_manatsu'], [4, 'tt_taifuu'], [5, 'tt_niji'], [7, 'tt_gouu'], [8, 'tt_sanrenpatsu'], [10, 'tenkou_tsukai_sig']],
  },
};
