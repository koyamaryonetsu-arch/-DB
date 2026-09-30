// この 機械だけの 見ための 設定（localStorage）
// 戦いの 文字の 大きさ（s・m・l）と、戦いの コマンドの 数（1 少なめ・2 ふつう・3 多め）

const get = (k, d) => {
  try { return localStorage.getItem(k) || d; } catch { return d; }
};
const set = (k, v) => {
  try { localStorage.setItem(k, v); } catch { /* */ }
};

export function battleFontPref() {
  const v = get('kizuna_bfont', 'm');
  return ['s', 'm', 'l'].includes(v) ? v : 'm';
}

export function battleDensityPref() {
  const v = Number(get('kizuna_bdense', '2'));
  return [1, 2, 3].includes(v) ? v : 2;
}

export function setBattleFontPref(v) {
  set('kizuna_bfont', v);
  applyBattlePrefs();
}

export function setBattleDensityPref(v) {
  set('kizuna_bdense', String(v));
  applyBattlePrefs();
}

// body に しるしを つける（CSS で 大きさと 列の 数が かわる）
export function applyBattlePrefs() {
  const b = document.body;
  for (const k of ['s', 'm', 'l']) b.classList.toggle(`bf-${k}`, battleFontPref() === k);
  for (const n of [1, 2, 3]) b.classList.toggle(`bd-${n}`, battleDensityPref() === n);
}
