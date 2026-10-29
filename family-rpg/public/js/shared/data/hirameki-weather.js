// 第51回 W の 天気の 職業の ひらめき技（お天気キャスターに 1つ・天候をあやつる者に 1つ。第43回の 上級職・超級職と おなじ）
// ・しくみは hirameki-r43j.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。weather は abilities-weather.js と おなじ（天候の神の 条件で 数える）
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_WEATHER_ABILITIES = {
  // お天気キャスター: 天気図の 上を 走る かみなり雲
  hi_kaminari_gumo: sk('otenki_caster', {
    name: 'かみなり雲がやってくる', kana: 'かみなりぐもがやってくる', mp: 11, target: 'enemies', weather: 'thunder',
    effect: { type: 'magic', element: 'bolt', base: [52, 64], thr: 50 },
    desc: '天気図の上を、大きなかみなり雲が走っていく。敵全体に雷のダメージ。', cast: '{a}「ごらんください、かみなり雲がやってきます！」', anim: 'bolt2',
  }),
  // 天候をあやつる者: 晴れているのに ふる 天気雨（日ざしと 雨で 回復）
  hi_tenkiame: sk('tenkou_tsukai', {
    name: '天気雨', kana: 'てんきあめ', mp: 20, target: 'allies', role: 'heal', weather: 'rain',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 115], thr: 60 }, { type: 'mpHeal', base: [4, 6] }] },
    desc: '晴れているのに、きらきら光る雨がふる。仲間全員のHPを大きく回復して、MPも少し回復する。', cast: '{a}「お日さまが出ているのに…雨？」', anim: 'heal2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_WEATHER = {
  hi_kaminari_gumo: { from: { oc_kaminari: 12, oc_ooame: 6 } },
  hi_tenkiame: { from: { tt_megumi: 8, tt_gouu: 6 } },
};
