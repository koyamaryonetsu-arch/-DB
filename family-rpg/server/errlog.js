// 家族サーバーの エラーの きろく（セーブの 場所の error-log.txt）
// ・黒い 画面が 止まった・つながらない ときに、何が おきたか あとから 見られる ように
// ・おなじ エラーが つづく ときは 1分に 1回だけ 書く（ファイルも 黒い 画面も いっぱいに しない）
// ・ファイルが 大きく なったら error-log.old.txt に うつして 書きなおす
import fs from 'node:fs';
import path from 'node:path';
import { inspect } from 'node:util';

export const ERROR_LOG = 'error-log.txt';

export function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function createErrorLog(dir, { maxBytes = 512 * 1024, gapMs = 60000, now = () => Date.now(), version = '' } = {}) {
  const file = path.join(dir, ERROR_LOG);
  const seen = new Map();

  function append(text) {
    try {
      try {
        if (fs.statSync(file).size > maxBytes) fs.renameSync(file, path.join(dir, 'error-log.old.txt'));
      } catch { /* まだ ない */ }
      fs.appendFileSync(file, text);
    } catch { /* きろくの しっぱいで サーバーを 止めない */ }
  }

  // console.error などに わたされた ものを 書く
  // もどりち: 黒い 画面にも 出すか（おなじ ものが 1分 いないに あった ときは false）
  function write(args) {
    let text;
    try {
      text = args.map((a) => (typeof a === 'string' ? a : inspect(a, { depth: 4, breakLength: 120 }))).join(' ');
    } catch {
      text = String(args[0]);
    }
    const key = text.split('\n')[0].slice(0, 200);
    const t = now();
    const s = seen.get(key);
    if (s && t - s.at < gapMs) {
      s.count++;
      return false;
    }
    const more = s?.count ? `（この前の1分で、ほかに同じエラーが${s.count}回）\n` : '';
    seen.delete(key);
    seen.set(key, { at: t, count: 0 });
    if (seen.size > 200) seen.delete(seen.keys().next().value);
    append(`[${stamp(new Date(t))}]${version ? ` (${version})` : ''} ${text}\n${more}\n`);
    return true;
  }

  // 1行の できごと（サーバーを もう一度 動かした など）
  function note(text) {
    append(`[${stamp(new Date(now()))}]${version ? ` (${version})` : ''} ${text}\n\n`);
  }

  return { file, write, note };
}

// console.error・console.warn を、ファイルにも 書く ように する（おなじ ものは 1分に 1回だけ 画面に 出す）
export function captureConsole(log, target = console) {
  for (const level of ['error', 'warn']) {
    const orig = target[level].bind(target);
    target[level] = (...a) => {
      if (log.write(a)) orig(...a);
    };
  }
}
