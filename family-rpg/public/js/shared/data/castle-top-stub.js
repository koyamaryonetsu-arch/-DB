// ★ 仮の ファイル（まとめる 時に 消す）― 第5章 Step 9（A9: てっぺんと エンディング）の 作業中だけ 使う
// docs/plan-ch5.md の 17「仮の ファイル（まとめる時に消す）：A9 data/castle-top-stub.js（nocto_2・solitus・NOCTO_COMPANION）」
//
// 消す ときに いっしょに なおす ところ（それぞれの 上に「castle-top-stub」と 書いた コメントが ある）
//  1) data/story-castle-top.js の `import { NOCTO_COMPANION } from './castle-top-stub.js';` → B9 の './companions-castle.js'
//  2) data/story-ch5.js の `import { CASTLE_STEPS } from './castle-top-stub.js';` → A8 の 影の城の だいほん（CASTLE_STEPS）
//  3) test/ch5-step9.test.js の 同じ 2つの import
//
// ・きまった 戦い nocto_2（ノクト 本気）・solitus（魔王ソリトゥス）は B9 が 作る。A9 の 台本と テストが B9 の 前でも 動く ように、
//   今 ある 魔物で 作った いちばん 小さな ものを、まだ ない ときだけ たす（B9 の ものが あれば、そちらが 使われる。上がきは しない）
// ・NOCTO_COMPANION（酒場の 仲間の ノクト）は B9 の data/companions-castle.js。ここでは 同じ 形の 仮の もの
// ・CASTLE_STEPS（影の城の 物語の すすみ c5_croad〜c5_seal3）は A8 の もの。ここでは 名前の 約束の とおりの 仮の もの
import { FIXED_ENCOUNTERS } from './encounters.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 曲は A9 が 作った ID（nocto_true・solitus）。背景は B9 の castle_top・solitus_void が まだ ないので、今 ある 背景で
fill(FIXED_ENCOUNTERS, {
  nocto_2: { group: [['old_dragon', 1, 1]], bg: 'memory_deep', bgm: 'nocto_true', canFlee: false, boss: true },
  solitus: { group: [['old_dragon', 1, 1]], bg: 'memory_deep', bgm: 'solitus', canFlee: false, boss: true },
});

// 酒場の 仲間の ノクト（B9 の NOCTO_COMPANION と おなじ 形。A9 が unlock〈c5_clear〉を つけて 酒場に ならべる）
export const NOCTO_COMPANION = {
  id: 'npc_nocto', name: 'ノクト', job: 'mage', tactics: 'balanced',
  look: { body: 0, hair: 0, hairColor: 0, skin: 1, color: 3 },
  desc: 'ホシフル村で、同じ星祭りの夜に生まれた紋章の子。少し口べただけれど、星の話になると止まらない。',
};

// 影の城（A8）の 物語の すすみ（plan-ch5.md の 17 の 名前の 約束）
export const CASTLE_STEPS = ['c5_croad', 'c5_cin', 'c5_seal1', 'c5_seal2', 'c5_seal3'];
