// 第88回: 装備を「使う」と 出る かくし技（docs/plan-r88-anime-gear.md の 1-2・12-1）
//   品の use: { ability: 'この ファイルの id' }。戦いの 道具から、装備して いる 間 だけ・1つの 戦いで その 品 1回・MPなし
//   （shared/battle-gearfx.js の gearUse。つけた 人が 使った ものとして、技と 同じ 式で うごく）
//
// 書き方（あとの 係も 同じ）
//   ・id は r88u_<名前>。hidden: true（技の 一覧・ひらめき・図鑑・オートに 出ない）・mp: 0・job は 書かない
//   ・kind は 'skill'（宝貝・魔導具は 呪文では ない。呪文ふうじの 中でも 使える）
//   ・強さは 上級職の 技 くらい。伝説の 品は 超級職の 技 くらいまで
//       全体の 呪文 base 90〜115（上級）・140〜185（超級）／1体の 呪文 230〜270（超級）／全体の 物理 1.4〜2.0 倍／1体の 物理 3.5 倍まで
//   ・えんしゅつ（anim）は 今 ある 物を 使い回して よい（雷公べんだけ client/render/battlefx-r88.js の r88_raikou）
export const R88_ABILITIES = {
  // ── ほう神演義: スーパー宝貝 ──
  r88u_raikou: {
    name: '雷公べん・大いかずち', kana: 'らいこうべんおおいかずち', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [160, 190], thr: 85 },
    desc: '雷公べんをふるって、空いっぱいの大きな雷を敵全体に落とす。', cast: '{a}が雷公べんをふるうと、空がまっぷたつに裂けた！', anim: 'r88_raikou',
  },
  r88u_kinben: {
    name: '禁べん・百れん打', kana: 'きんべんひゃくれんだ', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 0.5, hits: 4 },
    desc: '禁べんで、遠くの敵まで何回も打ちすえる。敵全体に4回攻撃。', cast: '{a}の禁べんが、うなりを上げた！', anim: 'r83a_whip',
  },
  r88u_taikyoku: {
    name: '太極図の光', kana: 'たいきょくずのひかり', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'dispel' },
    desc: '太極図の巻物を広げて、敵全体の強くなっていた力を消す。', cast: '{a}は太極図の巻物を広げた！', anim: 'taikobo_sig',
  },
  r88u_kinko: {
    name: '金こうせん・七色の竜', kana: 'きんこうせんなないろのりゅう', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 0.5, hits: 7, random: true },
    desc: '金こうせんから七色の竜をよび出して、敵に7回かみつかせる。', cast: '{a}の金こうせんから、七色の竜がとび出した！', anim: 'r83a_fire',
  },
  r88u_keisei: {
    name: 'けい世元じょうのまどわし', kana: 'けいせいげんじょうのまどわし', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.55, turns: [1, 3] },
    desc: '羽衣をひるがえして、敵全体の心をまどわし、混乱させる。', cast: '{a}の羽衣が、ふしぎな光をはなった…！', anim: 'debuff',
  },
  r88u_rokkon: {
    name: '六こんばん・闇づつみ', kana: 'ろっこんばんやみづつみ', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'dark', base: [230, 270], thr: 90 },
    desc: '六こんばんの黒い布で敵1体をつつみこみ、闇の大ダメージをあたえる。', cast: '{a}の六こんばんが、{t}をつつみこんだ！', anim: 'dark1',
  },
  r88u_banko: {
    name: 'ばん古ばん・重力', kana: 'ばんこばんじゅうりょく', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'debuff', stat: 'agi', mult: 0.6, dur: 40, chance: 0.9 },
    desc: 'ばん古ばんで重力をあやつり、敵全体の素早さを大きく下げる。', cast: '{a}がばん古ばんをふると、ずしりと重くなった！', anim: 'debuff',
  },
  // ── YAIBA ──
  r88u_maou: {
    name: '魔王剣・三日月', kana: 'まおうけんみかづき', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.7, element: 'dark' },
    desc: '魔王剣から黒い光のやいばをとばして、敵全体を闇で切りさく。', cast: '{a}の魔王剣が、黒い三日月の光をはなった！', anim: 'r82b_slash',
  },
};
