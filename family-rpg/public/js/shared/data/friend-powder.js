// 仲間の粉（2026年10月 見なおし）
// 使うと、つぎの 戦い POWDER.battles 回の あいだ、魔物が 仲間に なりたがる かくりつが POWDER.mult 倍に なる。
// ・数えるのは、魔物が 仲間に なるかも しれない 戦い（勝った ふつうの 戦い。ボス・物語の 戦い・ひみつのダンジョンは 数えない）
// ・いっしょに 戦った 人の だれかが 使っていれば 効く（使った 人 みんな、のこりが 1回 へる）
// ・つづけて 使うと のこりの 回数が ふえる（POWDER.max まで）
// ・「魔物の心」に 目ざめる 前と、ひみつのダンジョンの 中では 使えない（道具は へらない）
// 売っている 所: ルミナ・カモメ港・カナトコ・サファラ市場の 道具屋（「魔物の心」に 目ざめた あと。shops.js）
// うごき: world/services.js（使う）・world/battles.js（戦いの おわり）・world/party.js（befriendChance）
export const POWDER_ID = 'friend_powder';
export const POWDER = { mult: 2, battles: 10, max: 30 };

export const POWDER_ITEMS = {
  [POWDER_ID]: {
    name: '仲間の粉', type: 'use', price: 100, target: 'self', battle: false, field: true,
    effect: { type: 'befriendBoost', mult: POWDER.mult, battles: POWDER.battles },
    desc: `ふりかけると、魔物が仲間になりやすくなる（${POWDER.mult}倍・${POWDER.battles}回の戦い）。ボスやひみつのダンジョンの魔物には効かない。`,
  },
};
export const POWDER_KANA = {
  friend_powder: 'なかまのこな',
};
export const POWDER_SHOPS = ['item', 'port_item', 'kanatoko_item', 'safara_item'];

// のこりの 回数（ない ときは 0）
export function powderLeft(c) {
  const n = Math.floor(Number(c?.befriendBoost) || 0);
  return n > 0 ? Math.min(POWDER.max, n) : 0;
}

// フィールドの しるしの 文（ちずの 上に 2行で。のこり 0 なら 空）
export function powderLabel(c) {
  const n = powderLeft(c);
  return n ? `仲間の粉\nのこり${n}回` : '';
}
