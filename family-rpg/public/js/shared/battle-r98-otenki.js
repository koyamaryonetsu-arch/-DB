// 第98回 K4班: おてんき格闘流の師はんの オート（data/jobs-r98-otenki.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   すがたを えらぶ（じょうろとやかん）・飛竜しょう天はの かまえ・心のお天気は 飛竜しょう天はの達人と おなじ r84bPlan に まかせる
//   ここでは 天気: 味方の 雨が ない 時に 看板（雨を よぶ ＋ 竜巻）か にわか雨よほう。雨の 間は 雨つぶけん（水の 力が 上がる）
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only。にわか雨よほうは 回復なので 通らない）
const myRain = (b, c) => b.weather?.kind === 'rain' && b.weather.side === c.side;

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）
export const OTENKI_AI = { sig: 0.7, niwaka: 0.5, amatsubu: 0.6, inazuma: 0.4, many: 0.5 };

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
    if (sig && b.rng.chance(OTENKI_AI.sig)) return { type: 'ability', id: sig.id };
    const niwaka = find('ot_niwaka');
    if (niwaka && b.rng.chance(OTENKI_AI.niwaka)) return { type: 'ability', id: niwaka.id };
  }
  // 2) 敵が 多い ＝ 看板（雨の 中なら 水の 追いうちも 強い）
  if (foes.length >= 3 && sig && b.rng.chance(OTENKI_AI.many) && (hard || rain)) return { type: 'ability', id: sig.id };
  // 3) 強い 敵 1体 ＝ 雨なら 雨つぶけん・ちがえば いなずまかかと落とし
  if (hard) {
    const t = boss || foes.slice().sort((x, y) => y.hp - x.hp)[0];
    const ama = find('ot_amatsubu');
    if (rain && ama && b.rng.chance(OTENKI_AI.amatsubu)) return { type: 'ability', id: ama.id, target: t.id };
    const ina = find('ot_inazuma');
    if (ina && b.rng.chance(OTENKI_AI.inazuma)) return { type: 'ability', id: ina.id, target: t.id };
  }
  return null;
}
