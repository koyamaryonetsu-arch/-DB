// フィールドの 呪文と 道具（2026年10月 第27回）: リレミト・トヘロス・マモノヨセ・魔物よせの笛
//
// ・リレミト … 洞窟・塔・宝の洞窟の 中で 唱えると、入ってきた 入り口の 外へ もどる（みちびきの糸と 同じ 効き目。world/escape.js）
//   糸が 使えない 所（map.noEscape: 王家のピラミッド・砂の底の神殿・ひみつのダンジョン）では 使えない（MPは へらない）。
//   フィールド・町・たてものの 中でも 使えない（MPは へらない）。「ついていく」仲間・いっしょの 家族も 帰る（糸・ルーラと 同じ。travel.js の warpParty）
// ・トヘロス … しばらく 弱い 魔物が 近よってこない（聖水と 同じ 効き目。REPEL_SECONDS）
// ・マモノヨセ／魔物よせの笛 … しばらく 魔物が よく 出て、強めの 組が 出やすい（LURE_SECONDS。world/monsters.js・battles.js）
//   トヘロス・聖水と マモノヨセ・笛は 同時には 効かない（あとから 使った ほうが 勝つ）
//   家族と いっしょの ときは、同じ 場所に いる パーティーの 家族にも 効く（world/field27.js の setAura）
//   効いている 間は、フィールドの 地図の 上に しるし（client/ui/hud.js。auraLabel）
// うごきは world/field27.js（呪文・道具を 使う）。覚える 職業は FIELD27_LEARN（data/jobs.js が 入れる）
export const REPEL_SECONDS = 120; // 聖水（data/items.js の holy_water）と 同じ
export const LURE_SECONDS = 120;
// マモノヨセの 効き目
export const LURE = {
  spawn: 1.5, // 魔物の 数（ちいきごとの 数の 何倍まで）
  spawnMs: 350, // 魔物が 出てくる 間（ふつうは 700ミリ秒）
  reach: 9, // 魔物が 気づく きょり（ふつうは 6）
  chase: 7, // おいかけてくる きょり（ふつうは 4.5）
  strong: 2, // 組を 何回 ふって 強い ほうを とるか
};

export const FIELD27_ABILITIES = {
  riremito: {
    name: 'リレミト', kana: 'りれみと', kind: 'spell', job: 'mage', mp: 4, target: 'self', field: true, fieldOnly: true, hidden: true,
    effect: { type: 'exit' },
    desc: '洞窟や塔の中で唱えると、入り口の外まで一気にもどれる（みちびきの糸と同じ）。いっしょにいる仲間も外へ出られる。ひみつのダンジョンやピラミッドなどでは使えない。',
    cast: '{a}はリレミトを唱えた！\nしかし、戦いの中では使えない！', anim: 'none',
  },
  toheros: {
    name: 'トヘロス', kana: 'とへろす', kind: 'spell', job: 'priest', mp: 3, target: 'self', field: true, fieldOnly: true, hidden: true,
    effect: { type: 'repel', seconds: REPEL_SECONDS },
    desc: `しばらく（${REPEL_SECONDS / 60}分）、弱い魔物が近よってこない（聖水と同じ）。マモノヨセと同時には効かない（あとから使ったほうが効く）。`,
    cast: '{a}はトヘロスを唱えた！\nしかし、戦いの中では使えない！', anim: 'none',
  },
  mamonoyose: {
    name: 'マモノヨセ', kana: 'まものよせ', kind: 'spell', job: 'jester', mp: 3, target: 'self', field: true, fieldOnly: true, hidden: true,
    effect: { type: 'lure', seconds: LURE_SECONDS },
    desc: `しばらく（${LURE_SECONDS / 60}分）、魔物がよく出て、強めの魔物の組が出やすくなる。レベル上げに。トヘロス・聖水と同時には効かない（あとから使ったほうが効く）。`,
    cast: '{a}はマモノヨセを唱えた！\nしかし、戦いの中では使えない！', anim: 'none',
  },
};

// 覚える 職業と 職業レベル（data/jobs.js の applyField27Learn が learn に 入れる）
export const FIELD27_LEARN = {
  mage: [[3, 'riremito']],
  priest: [[4, 'riremito'], [5, 'toheros']],
  sage: [[1, 'riremito'], [2, 'toheros'], [3, 'mamonoyose']],
  jester: [[5, 'mamonoyose']],
  tamer: [[2, 'mamonoyose']],
};

// jobs … data/jobs.js の JOBS（learn は 職業レベルの じゅん に ならべなおす。同じ レベルは もとの じゅん）
export function applyField27Learn(jobs) {
  for (const [jid, list] of Object.entries(FIELD27_LEARN)) {
    const j = jobs[jid];
    if (!j || !Array.isArray(j.learn)) continue;
    for (const [lv, id] of list) if (!j.learn.some((e) => e[1] === id)) j.learn.push([lv, id]);
    j.learn = j.learn.map((e, i) => [e, i]).sort((a, b) => a[0][0] - b[0][0] || a[1] - b[1]).map((x) => x[0]);
  }
}

// ───── 道具 ─────
export const LURE_ITEM = 'lure_flute';
export const FIELD27_ITEMS = {
  [LURE_ITEM]: {
    name: '魔物よせの笛', type: 'use', price: 60, target: 'self', battle: false, field: true,
    effect: { type: 'lure', seconds: LURE_SECONDS },
    desc: `ふくと、しばらく（${LURE_SECONDS / 60}分）魔物がよく出て、強めの魔物の組が出やすくなる。トヘロス・聖水と同時には効かない（あとから使ったほうが効く）。`,
  },
};
export const FIELD27_KANA = {
  lure_flute: 'まものよせのふえ',
};
// 売っている 店（ルミナの町・カモメ港・カナトコ・サファラ市場の 道具屋。data/shops.js が 入れる）
export const FIELD27_SHOPS = ['item', 'port_item', 'kanatoko_item', 'safara_item'];

// 効き目の 名前（地図の 上の しるし・メッセージ）
export const AURA_NAMES = { repel: '魔物よけ', lure: '魔物よせ' };

// フィールドの しるしの 文（ちずの 上に 2行で。aura … char.aura、now … サーバーの 時こく。切れていれば 空）
export function auraLabel(aura, now) {
  if (!aura || !AURA_NAMES[aura.kind] || !(aura.until > now)) return '';
  const sec = Math.ceil((aura.until - now) / 1000);
  const left = sec > 60 ? `のこり${Math.ceil(sec / 60)}分` : `のこり${sec}秒`;
  return `${aura.name || AURA_NAMES[aura.kind]}\n${left}`;
}
