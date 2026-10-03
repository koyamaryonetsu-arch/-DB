// ふぐあいの きろく（うごけなく なった・画面が とまった ときに 原因を さがす ため）
// ・この 端末に さいきんの 20こ（localStorage）。メニューの「設定」→「不具合の記録」で 見て コピーできる
// ・つながっている サーバーにも おくる（家族サーバーの 画面と セーブの errorLog に のこる）
const KEY = 'kizuna_errlog';
const seen = new Set();

export function readErrLog() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeErrLog(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(-20))); } catch { /* */ }
}

export function clearErrLog() {
  writeErrLog([]);
}

// where … どこで おきたか（'script:say'・'frame'・'stuck:busy' など）
export function reportError(game, e, where = '') {
  try {
    const msg = String(e?.message || e || '').slice(0, 300);
    // よその サイトの スクリプトの エラーは 中みが ないので のこさない
    if (!msg || msg === 'Script error.') return;
    // おなじ ものは 1回だけ（まいフレーム おきる エラーで いっぱいに しない）
    const key = `${where}|${msg}`;
    if (seen.has(key) || seen.size > 30) return;
    seen.add(key);
    console.error('[kizuna]', where, e);
    const rec = {
      at: Date.now(),
      where: String(where).slice(0, 40),
      msg,
      stack: String(e?.stack || '').split('\n').slice(0, 6).join('\n').slice(0, 900),
      map: game?.field?.mapId || '',
      state: game?.state || '',
      who: game?.me?.name || '',
    };
    writeErrLog([...readErrLog(), rec]);
    if (game?.me) game.net?.send?.({ t: 'clientError', ...rec });
  } catch { /* きろくの しっぱいで あそびを とめない */ }
}

// コピー用の 文（家族に LINE で おくる など）
export function errLogText(list = readErrLog()) {
  if (!list.length) return '';
  return list.map((r) => {
    const d = new Date(r.at);
    const t = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `[${t}] ${r.who || '?'} ${r.map || ''} ${r.state || ''} ${r.where}\n${r.msg}${r.stack ? `\n${r.stack}` : ''}`;
  }).join('\n\n');
}
