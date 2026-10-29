// 第51回 C1（o7）: 幻の職業（海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI）の 技の え。render/axfx.js が useAxGroup('o7', AX_O7, AX_O7_FINE) で とうろく する
// 書きかたは o1〜o6 と おなじ（docs/plan-r49-fx.md 7章・docs/plan-r48-fx-engine.md）
// ・時間（tier・charge.kind/ms・hit・len・party）と 技の つなぎは shared/data/ax-time-o7.js（ここには 書かない）
// ・カットインの 帯・画面の くらさは つかわない。画面の 文字に 漢字は 出さない（「人」だけ OK）
// ・分けた ファイル: axfx-o7-pirate.js（海賊王）・axfx-o7-hero.js（伝説の超勇者）・axfx-o7-hokage.js（日の火影）・axfx-o7-ai.js（天才しせつ管理者AI）。
//   小さな どうぐと つぶの かきかたは axfx-o7-kit.js。どの え も さいごに balance（段の つぶの かず）
import { AX_O7_PIRATE } from './axfx-o7-pirate.js';
import { AX_O7_HERO } from './axfx-o7-hero.js';
import { AX_O7_HOKAGE } from './axfx-o7-hokage.js';
import { AX_O7_AI } from './axfx-o7-ai.js';
import { AX_O7_FINE as FINE, withBalance } from './axfx-o7-kit.js';

export const AX_O7 = withBalance({ ...AX_O7_PIRATE, ...AX_O7_HERO, ...AX_O7_HOKAGE, ...AX_O7_AI });

export const AX_O7_FINE = { ...FINE };
