// 第98回: きずなの職業の 絵の まとめ（見た目・乗り物・技の えんしゅつ。docs/plan-kizuna-jobs.md）
// ★ あとの 組へ: client/render/kizuna-<名前>.js を 作って（形は kizuna-kuuchou.js）、下の KIZUNA_ART の おわりに 1行 足す（import も 1行）
//   hero-outfit.js・hero-gear.js・hero-aura.js・chars.js・vehicle-art.js・battlefx.js・client/battle.js は この ファイルを 読む だけ（足さなくて よい）
// 1つの 職業の 絵の ファイルが かえす 物（KUUCHOU_ART など）
//   id … 職業の id / outfit・body・hat・oldLook … 布の服の 服・からだの とくちょう・ぼうし・古い 小さな え（hero-outfit・hero-gear・chars の 表に まぜる）
//   aura … オーラ（hero-aura の AURA に まぜる）/ emblems … むねの しるし（hero-outfit の emblem。{ 名前: (cv, x, y, z, m, { cloth, metal }) }）
//   vehicle … { id, art(kit) }（vehicle-art の ART。kit は 乗り物の 絵の どうぐ）
//   fx … { anims, party〈みかたに かける えんしゅつ〉, hit〈当たる 時間〉, sfx〈音〉, play(fx, anim, targets, element, opts, W, H) }
import { PARTY_ANIMS } from './battlefx-jobs2.js';
import { KUUCHOU_ART } from './kizuna-kuuchou.js';
import { HOKAGE_ART } from './kizuna-hokage.js';
import { SAISHOU_ART } from './kizuna-saishou.js';
import { PTA_ART } from './kizuna-pta.js';

export const KIZUNA_ART = [
  KUUCHOU_ART, // 熱と風の空調マスター
  HOKAGE_ART, // 八竜の火影
  SAISHOU_ART, // 国を動かす名さいしょう
  PTA_ART, // 伝説のPTA会長
];

const byId = (key) => Object.fromEntries(KIZUNA_ART.filter((k) => k[key]).map((k) => [k.id, k[key]]));
export const KIZUNA_OUTFIT = byId('outfit');
export const KIZUNA_BODY = byId('body');
export const KIZUNA_HAT = byId('hat');
export const KIZUNA_OLD_LOOK = byId('oldLook');
export const KIZUNA_AURA = Object.assign({}, ...KIZUNA_ART.map((k) => k.aura || {}));
export const KIZUNA_EMBLEM = Object.assign({}, ...KIZUNA_ART.map((k) => k.emblems || {}));
export const KIZUNA_HIT = Object.assign({}, ...KIZUNA_ART.map((k) => k.fx?.hit || {}));
export const KIZUNA_SFX = Object.assign({}, ...KIZUNA_ART.map((k) => k.fx?.sfx || {}));
export const KIZUNA_ANIMS = new Set(KIZUNA_ART.flatMap((k) => [...(k.fx?.anims || [])]));
// みかたに かける えんしゅつ（battle.js・テストが 見る 一覧に まぜる。第85回 B班と おなじ）
for (const k of KIZUNA_ART) for (const a of k.fx?.party || []) PARTY_ANIMS.add(a);

// battlefx.js の play() から（ここに ない anim なら false）
export function playKizunaFx(fx, anim, targets, element, opts, W, H) {
  if (!KIZUNA_ANIMS.has(anim)) return false;
  for (const k of KIZUNA_ART) if (k.fx?.anims.has(anim)) return k.fx.play(fx, anim, targets, element, opts, W, H);
  return false;
}
// vehicle-art.js から（乗り物の 絵を ART に 足す）
export function addKizunaVehicleArt(ART, kit) {
  for (const k of KIZUNA_ART) if (k.vehicle) ART[k.vehicle.id] = k.vehicle.art(kit);
}
