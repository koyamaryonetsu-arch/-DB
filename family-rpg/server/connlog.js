// つながりの きろく（セーブの 場所の connection-log.txt）
// 「黒い 画面は 動いているのに、スマホから つながらない」ときに、どこで 止まっていたかを あとから 見る ため。
// ・外出先の アドレス（Tailscale Funnel）が インターネットに 出ているか（かわった ときだけ）・自動で 登録しなおした こと
// ・家族サーバーが しばらく 動いていなかった こと（PC の スリープ・黒い 画面の 一時停止）
// ・外出先から ページを 開いた／ゲームに つながった・切れた こと（スマホの 通信が PC まで とどいたか）
// ファイルが 大きく なったら connection-log.old.txt に うつす
import fs from 'node:fs';
import path from 'node:path';
import { stamp } from './errlog.js';

export const CONN_LOG = 'connection-log.txt';

export function createConnLog(dir, { maxBytes = 256 * 1024, now = () => Date.now() } = {}) {
  const file = path.join(dir, CONN_LOG);
  const last = new Map(); // 同じ ことを 何度も 書かない（key → 時こく）
  function note(text) {
    try {
      try {
        if (fs.statSync(file).size > maxBytes) fs.renameSync(file, path.join(dir, 'connection-log.old.txt'));
      } catch { /* まだ ない */ }
      fs.appendFileSync(file, `[${stamp(new Date(now()))}] ${text}\n`);
    } catch { /* きろくの しっぱいで サーバーを 止めない */ }
  }
  // key ごとに gapMs に 1回まで
  function noteOnce(key, text, gapMs = 60000) {
    const t = now();
    if (t - (last.get(key) || -Infinity) < gapMs) return false;
    last.set(key, t);
    if (last.size > 500) last.delete(last.keys().next().value);
    note(text);
    return true;
  }
  return { file, note, noteOnce };
}

// 外出先の 人の アドレスを、きろく用に 少し かくす（203.0.113.45 → 203.0.113.x）
export function maskIp(ip) {
  const s = String(ip || '');
  const v4 = s.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (v4) return `${v4[1]}.x`;
  const parts = s.split(':').filter(Boolean);
  return parts.length > 2 ? `${parts.slice(0, 3).join(':')}:…` : s || '?';
}

// 家族サーバーが 止まっていた 時間を はかる（1秒ごとの タイマーが おくれた 分）
// onStall(秒) … しきい（ふつう 5秒）より 長く 止まって いた ときに よぶ
export function watchStalls(onStall, { everyMs = 1000, thresholdMs = 5000, now = () => Date.now(), setIntervalImpl = setInterval } = {}) {
  let prev = now();
  const t = setIntervalImpl(() => {
    const at = now();
    const gap = at - prev - everyMs;
    prev = at;
    if (gap >= thresholdMs) onStall(Math.round(gap / 1000));
  }, everyMs);
  t?.unref?.();
  return t;
}

export function stallText(sec) {
  const span = sec >= 120 ? `${Math.round(sec / 60)}分` : `${sec}秒`;
  return `家族サーバーが ${span} 動いていませんでした（PC のスリープ、または黒い画面のクリックで一時停止していた。この間はだれもつながれません）`;
}
