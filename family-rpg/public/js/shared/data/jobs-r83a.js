// 第83回 A班: 封神演義の 系統（軍師）「つりをする道士 → せん人界の道士 → 太公望 → ほう神の大軍師」（docs/plan-jobs-r79.md の 9-1・docs/plan-r83-jobs-a.md）
//
// ・自分の 基本職から 伝説まで 4だん（YAIBA の 系統と おなじ 形）
//   つりをする道士（基本職。さいしょから えらべる）→ せん人界の道士（上級職。つりをする道士を きわめる）
//   → 太公望（超級職。せん人界の道士を きわめる）→ ほう神の大軍師（伝説。太公望 ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
// ・この 系統だけの しくみ「作戦」（軍師が たおれるか 作戦を かえる まで 味方 全員に ずっと 効く）・強化ふうじ・太極図・先読みの策は
//   shared/battle-r83a.js（戦いの 中だけ。キャラに 項目を 足さない）
// ・名前の 字: 「仙」「封」「宴」は 習わない 字なので かな（せん人界の道士・ほう神の大軍師）。のこりは 設計の まま
// ・技は abilities-r83a.js・ひらめき技は hirameki-r83a.js
// jobs.js が JOBS に まぜて、JOB_ORDER・ADVANCED_ORDER・SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R83A_ORDERS）

export const JOBS_R83A = {
  fishing_doshi: {
    id: 'fishing_doshi', name: 'つりをする道士', kana: 'つりをするどうし', short: 'つり道士', tier: 0, family: 'magic', color: '#5a9ad0',
    desc: '川のほとりで、まっすぐなつり針をたらして、のんびりつりをしている道士。なまけているように見えて、じつは頭がよく回る。風のおふだも使える。きわめるとせん人界の道士になれる。',
    mods: { hp: 0.8, mp: 1.2, str: 0.75, def: 0.8, agi: 1.1, mag: 1.1, heal: 0.85 },
    weapons: ['staff', 'whip', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: true,
    perLv: { mag: 0.5, mp: 0.5, agi: 0.5 },
    learn: [[1, 'fd_tsurizao'], [2, 'fd_nonbiri'], [3, 'fd_ofuda'], [5, 'fd_namake'], [7, 'fd_hattari'], [10, 'fishing_doshi_sig']],
  },
  sennin_doshi: {
    id: 'sennin_doshi', name: 'せん人界の道士', kana: 'せんにんかいのどうし', short: 'せん人道士', tier: 1, req: ['fishing_doshi'], family: 'magic', color: '#4aa88a',
    desc: '空にうかぶせん人界で、修行をつんだ道士。風の力をやどす打神べんをふるい、「作戦」を立てて、仲間全員をずっと強くする。つりをする道士をきわめるとなれる。',
    mods: { hp: 0.9, mp: 1.3, str: 0.8, def: 0.9, agi: 1.15, mag: 1.2, heal: 0.95 },
    weapons: ['staff', 'whip', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: true,
    perLv: { mag: 0.5, mp: 0.5, agi: 0.5 },
    learn: [[1, 'sd_dashin'], [2, 'sd_sakusen'], [3, 'sd_karyu'], [5, 'sd_momo'], [7, 'sd_fuuji'], [10, 'sennin_doshi_sig']],
  },
  taikobo: {
    id: 'taikobo', name: '太公望', kana: 'たいこうぼう', short: '太公望', tier: 2, req: ['sennin_doshi'], family: 'magic', color: '#3a7ad8',
    desc: '空飛ぶカバに乗って、なまけながらも、ちえで敵をやっつける天才軍師。作戦に「速攻」がふえ、太極図で、敵の強化も仲間の弱りも、すべて元にもどす。せん人界の道士をきわめるとなれる。',
    mods: { hp: 1.1, mp: 1.5, str: 0.95, def: 1.05, agi: 1.35, mag: 1.45, heal: 1.1 },
    weapons: ['staff', 'whip', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: true,
    perLv: { mag: 1, mp: 0.5, agi: 0.5 },
    learn: [[1, 'tk_yaiba'], [2, 'tk_supu'], [3, 'tk_hata'], [5, 'tk_hakari'], [7, 'tk_momo'], [10, 'taikobo_sig']],
  },
  hoshin_gunshi: {
    id: 'hoshin_gunshi', name: 'ほう神の大軍師', kana: 'ほうしんのだいぐんし', short: '大軍師', tier: 3, req: ['taikobo'], reqSuper: 1, family: 'magic', color: '#e0a83a',
    desc: '大きな戦いを、ちえと作戦でみちびいた伝説の大軍師。敵の大技を先読みし、号令ひとつで仲間を動かす。太公望と、ほかの超級職を1つきわめた者だけがなれる。',
    mods: { hp: 1.35, mp: 1.65, str: 1.0, def: 1.2, agi: 1.5, mag: 1.65, heal: 1.25 },
    weapons: ['staff', 'whip', 'fan', 'none'], shield: false, armor: ['cloth', 'robe'], helm: true,
    perLv: { mag: 1, mp: 1, agi: 0.5 },
    learn: [[1, 'hg_ten'], [3, 'hg_gorei'], [5, 'hg_sakiyomi'], [7, 'hg_utage'], [8, 'hg_hoshin'], [10, 'hoshin_gunshi_sig']],
  },
};

// 段ごとの ならび（[基本職, 上級職, 超級職, 伝説]。jobs.js が それぞれの ORDER に 足す）
export const R83A_ORDERS = [['fishing_doshi'], ['sennin_doshi'], ['taikobo'], ['hoshin_gunshi']];
export const R83A_JOBS = R83A_ORDERS.flat();

// 神殿の うわさ（超級職・伝説）
export const HINTS_R83A = {
  taikobo: 'せん人界の道士をきわめた者は、空飛ぶカバに乗った天才軍師になれるらしい…',
  hoshin_gunshi: '太公望と、ほかの超級職を1つきわめた者は、大きな戦いをみちびく大軍師になれるらしい…',
};
