// 第49回 O2（こぶし・守り・魔物・闇）: もとからの 技（ふつうの 職業・ひらめき・合体技）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r49-fx.md 7章（と docs/plan-r48-fx.md の「G0 の 決めごと」）。この ファイルは O2 だけが さわる
//   AX_TIME_O2     … { ox_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//                      予算は もとからの 技の 表（shared/ax-time.js の AX_BUDGET_ORIG）: 合計（構え こみ）basic 600〜900・advanced 900〜1300・super 1200〜1800・legend 1600〜2400
//                      構え（charge.ms）は basic 200・ほか 300 まで。kind 'ki' は つかわない（気は ドラゴンボールだけ）。合体技は charge: false（2人 1600・3人 1900・4人 2100 が めやす）
//   AX_SKILLS_O2   … { 技の id: 'ox_〜' | { anim: 'ox_〜', tier?, charge?, vars?, element? } }
//                      plan-r49-fx.md 6章の O2 の 技だけ。'id@masc' … 男の子の 版。合体技は DUAL_TECHS の id（dt_〜）。データの anim は かえない
//   AX_FAMILIES_O2 … { なかまの 名前: ['ox_弱い', …, 'ox_強い'] }
export const AX_TIME_O2 = {
};

export const AX_SKILLS_O2 = {
};

export const AX_FAMILIES_O2 = {
};
