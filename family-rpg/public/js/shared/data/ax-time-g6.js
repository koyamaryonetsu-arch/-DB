// 第48回 G6（ハリー・ポッター ＋ 鋼の錬金術師 ＋ 怪盗キッド ＋ 名探偵コナン ＋ おしり探偵）: 大技の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアントが おなじ 数を 見る（canvas は つかわない）
// 書きかたは docs/plan-r48-fx.md の「G0 の 決めごと」。この ファイルは G6 だけが さわる
//   AX_TIME_G6     … { ax_〜: { tier, charge: { kind, ms? } | false, hit, len, stagger?, party?, vars? } }
//                      tier: 'basic' | 'advanced' | 'super' | 'legend'（B・A・S・L）。hit … はなって あたる まで、len … はなって おわる まで（ms）
//   AX_SKILLS_G6   … { 技の id: 'ax_〜' | { anim: 'ax_〜', tier?, charge?, vars?, element? } }
//                      'id@masc' … 男の子の 版。合体技は 'dt_〜'。データの anim は かえない
//   AX_FAMILIES_G6 … { なかまの 名前: ['ax_弱い', …, 'ax_強い'] }
export const AX_TIME_G6 = {
};

export const AX_SKILLS_G6 = {
};

export const AX_FAMILIES_G6 = {
};
