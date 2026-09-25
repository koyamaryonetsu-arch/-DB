// セーブの 場所と、むかしの セーブの ひっこし
//
// セーブは アプリの フォルダの 外（ホームフォルダの kizuna-save）に おく。
// こうすると、新しい ZIP を どこに ひらいても、アプリを 入れかえても、セーブは そのまま のこる。
// むかしの 版は アプリの フォルダの 中（family-rpg/data）に セーブしていたので、
// 起動する たびに さがして、新しい キャラ・進んでいる キャラを こちらへ うつす（むかしの ほうは けさない）。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { upgradeSave } from '../public/js/shared/world/save.js';

export const SAVE_FOLDER = 'kizuna-save';
export const NOTE_FILE = 'セーブの引っこし.txt';

export function defaultDataDir(home = os.homedir()) {
  return path.join(home, SAVE_FOLDER);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function readSaveDir(dir) {
  for (const f of ['save.json', 'save.json.bak']) {
    const d = readJson(path.join(dir, f));
    if (d && typeof d === 'object') return d;
  }
  return null;
}

function mtimeOf(file) {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

// むかしの セーブが ありそうな ところ:
//  ・この アプリの フォルダの data（ZIP を うえから ひらいた・data を コピーした とき）
//  ・近くに ある べつの コピー（ZIP を べつの フォルダに ひらいた とき。
//    Windows の「すべて展開」は フォルダが 2重に なるので、3つ うえまで）
//  ・よく ZIP を ひらく 場所（ダウンロード・デスクトップ・書類・OneDrive）
export function findOldSaves(root, { home = os.homedir(), maxDirs = 3000 } = {}) {
  const found = new Set();
  const add = (dir) => {
    if (fs.existsSync(path.join(dir, 'save.json')) || fs.existsSync(path.join(dir, 'config.json'))) found.add(path.resolve(dir));
  };
  add(path.join(root, 'data'));
  const skip = new Set(['node_modules', 'Library', 'AppData', 'Applications', SAVE_FOLDER, 'data', 'public', 'server']);
  const seen = new Set();
  let visited = 0;
  const walk = (dir, depth) => {
    if (depth < 0 || visited > maxDirs || seen.has(dir)) return;
    seen.add(dir);
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      if (!e.isDirectory() || e.name.startsWith('.') || skip.has(e.name)) continue;
      visited++;
      const p = path.join(dir, e.name);
      if (fs.existsSync(path.join(p, 'server', 'index.js')) && fs.existsSync(path.join(p, 'public', 'index.html'))) add(path.join(p, 'data'));
      else walk(p, depth - 1);
    }
  };
  const norm = (p) => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
  const homeDir = norm(home);
  // ホームフォルダ そのものと、それより うえ（C:\Users・/home・ドライブの いちばん うえ）は さがさない
  const tooHigh = (b) => {
    const r = norm(b);
    return r === homeDir || homeDir.startsWith(r.endsWith(path.sep) ? r : r + path.sep) || r === path.parse(r).root;
  };
  const bases = [];
  let b = path.dirname(path.resolve(root));
  for (let i = 0; i < 3 && !tooHigh(b); i++, b = path.dirname(b)) bases.push(b);
  for (const d of ['Downloads', 'Desktop', 'Documents', 'OneDrive']) bases.push(path.join(path.resolve(home), d));
  // 近い ところから さがす（同じ フォルダは 2回 さがさない）
  for (const base of bases) walk(base, 3);
  return [...found];
}

function stamp(now) {
  return new Date(now).toISOString().replace(/[:T]/g, '-').slice(0, 16);
}

function writeAtomic(file, text) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

// むかしの セーブを うつす。もどりちは { moved: [なまえ], from: [フォルダ], config: bool }
export function handOverOldSaves({ root, dataDir, now = Date.now(), home } = {}) {
  const target = path.resolve(dataDir);
  const olds = findOldSaves(root, { home }).filter((d) => d !== target && !d.startsWith(target + path.sep));
  const result = { moved: [], from: [], config: false };
  if (!olds.length) return result;
  fs.mkdirSync(target, { recursive: true });

  // 合言葉などの せってい（まだ ない ときだけ。いちばん 新しい ものを つかう）
  const cfg = path.join(target, 'config.json');
  if (!fs.existsSync(cfg)) {
    const src = olds.map((d) => path.join(d, 'config.json')).filter((f) => fs.existsSync(f)).sort((a, b) => mtimeOf(a) - mtimeOf(b)).pop();
    if (src) {
      fs.copyFileSync(src, cfg);
      result.config = true;
    }
  }

  // キャラクター（まだ いない キャラ・こちらより 後に 遊んだ キャラを うつす）
  // handover … うつした ときの「さいごに 遊んだ 時こく」。こちらで 消した キャラを また うつさない ため
  const curRaw = readSaveDir(target);
  const cur = curRaw ? { ...curRaw, characters: { ...(curRaw.characters || {}) } } : { characters: {} };
  cur.handover = { ...(cur.handover && typeof cur.handover === 'object' ? cur.handover : {}) };
  const byTime = olds.filter((d) => readSaveDir(d)).sort((a, b) => mtimeOf(path.join(a, 'save.json')) - mtimeOf(path.join(b, 'save.json')));
  const board = new Map((cur.board || []).map((b) => [`${b.from}|${b.time}|${b.text}`, b]));
  for (const dir of byTime) {
    const fileTime = mtimeOf(path.join(dir, 'save.json'));
    const old = upgradeSave(readSaveDir(dir)).data;
    let any = false;
    for (const [id, c] of Object.entries(old.characters)) {
      const mine = cur.characters[id];
      const tOld = c.lastPlayed || fileTime;
      // 前に うつした ときから 遊んでいない（こちらで 消した ときも ふくむ）
      if (tOld <= (cur.handover[id] || 0)) continue;
      const tMine = mine ? mine.lastPlayed || 0 : -1;
      if (!mine || tOld > tMine) {
        cur.characters[id] = c;
        cur.handover[id] = tOld;
        if (!result.moved.includes(c.name)) result.moved.push(c.name);
        any = true;
      }
    }
    for (const b of old.board || []) board.set(`${b.from}|${b.time}|${b.text}`, b);
    if (!cur.createdAt || (old.createdAt && old.createdAt < cur.createdAt)) cur.createdAt = old.createdAt;
    if (any) result.from.push(dir);
    // むかしの フォルダに メモを のこす（1回だけ）
    const note = path.join(dir, NOTE_FILE);
    if (!fs.existsSync(note)) {
      try {
        fs.writeFileSync(note, `この版から、セーブは次の場所に置くようになりました。\n${target}\n\nこのフォルダのセーブは、そのまま残してあります（消しても、新しい場所のセーブには関係ありません）。\n古い版を起動して遊んだときは、次に新しい版を起動すると、進んだキャラクターが新しい場所へ引っこします。\n`);
      } catch { /* 書けない ときは なにも しない */ }
    }
  }
  if (result.moved.length) {
    cur.board = [...board.values()].sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 40);
    fs.mkdirSync(path.join(target, 'backups'), { recursive: true });
    if (curRaw) fs.writeFileSync(path.join(target, 'backups', `save-before-handover-${stamp(now)}.json`), JSON.stringify(curRaw));
    writeAtomic(path.join(target, 'save.json'), JSON.stringify(cur));
  }
  return result;
}
