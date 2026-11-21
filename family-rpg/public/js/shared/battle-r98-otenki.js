// 第98回 K4班: おてんき格闘流の師はんの オート（data/jobs-r98-otenki.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   すがたを えらぶ（じょうろとやかん）・飛竜しょう天はの かまえ・心のお天気は 飛竜しょう天はの達人と おなじ r84bPlan に まかせる
//   ここでは 天気: 味方の 雨が ない 時に 看板（雨を よぶ ＋ 竜巻）か にわか雨よほう。雨の 間は 雨つぶけん（水の 力が 上がる）
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only。にわか雨よほうは 回復なので 通らない）
const myRain = (b, c) => b.weather?.kind === 'rain' && b.weather.side === c.side;

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）
// sig … ボスの 時・sigFoe … ほかの 強い 敵の 時（雨が ない 時に 看板を えらぶ わりあい）。amatsubu・inazuma … ボスの 時・foe … ほかの 強い 敵の 時
//   （ボスでは MP が たりなく なりやすい ので、MP の 多い 看板より 雨つぶけん・いなずまかかと落とし を 多く）
export const OTENKI_AI = { sig: 0.2, sigFoe: 0.15, niwaka: 0.5, amatsubu: 0.95, inazuma: 0.95, foe: 0.3, many: 0.2 };

export function otenkiPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'otenki_shihan');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const sig = find('otenki_shihan_sig');
  const boss = foes.find((f) => f.boss);
  const hard = !!(boss || fw?.hard);
  // 前ぶれの 間は「大わざに そなえる」・飛竜しょう天はの かまえ（r84bPlan）に まかせる
  if (foes.some((f) => f.telegraph)) return null;
  const rain = myRain(b, c);
  // 1) 強い 敵で 味方の 雨が ない ＝ 看板（雨を よんで 竜巻）／ MP が たりなければ にわか雨よほう
  if (hard && !rain) {
    if (sig && b.rng.chance(boss ? OTENKI_AI.sig : OTENKI_AI.sigFoe)) return { type: 'ability', id: sig.id };
    // （にわか雨よほうは 回復も する ので、仲間の HP が へって いる 時だけ）
    const niwaka = find('ot_niwaka');
    const hurt = allies.filter((x) => x.alive && x.hp < x.maxHp * 0.6).length >= 2;
    if (niwaka && hurt && b.rng.chance(OTENKI_AI.niwaka)) return { type: 'ability', id: niwaka.id };
  }
  // 2) 敵が 多い ＝ 看板（雨の 中なら 水の 追いうちも 強い）・台風のまわしげり
  if (foes.length >= 3 && b.rng.chance(OTENKI_AI.many)) {
    if (sig && boss) return { type: 'ability', id: sig.id };
    const tai = find('ot_taifuu');
    if (tai) return { type: 'ability', id: tai.id };
  }
  // 3) 強い 敵 1体 ＝ 雨なら 雨つぶけん・ちがえば いなずまかかと落とし
  if (hard) {
    const t = boss || foes.slice().sort((x, y) => y.hp - x.hp)[0];
    const ama = find('ot_amatsubu');
    if (rain && ama && b.rng.chance(boss ? OTENKI_AI.amatsubu : OTENKI_AI.foe)) return { type: 'ability', id: ama.id, target: t.id };
    const ina = find('ot_inazuma');
    if (ina && b.rng.chance(boss ? OTENKI_AI.inazuma : OTENKI_AI.foe)) return { type: 'ability', id: ina.id, target: t.id };
  }
  return null;
}
