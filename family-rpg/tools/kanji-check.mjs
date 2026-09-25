// ゲームの文字のチェック
//  1) 使ってよい漢字: 小学校で習う漢字（1〜6年）と、ゲームでおなじみの漢字（EXTRA_KANJI）だけ
//  2) 4年生までの漢字で書けることばが、ひらがなのまま残っていないか（目安）
//  3) ことばの間のスペース（ドラクエ風の分かち書き）が残っていないか
// 使い方:
//   node tools/kanji-check.mjs            … ゲームの文字をぜんぶ調べる
//   node tools/kanji-check.mjs a.js b.js  … 指定したファイルだけ
//   node tools/kanji-check.mjs --foreign  … 小学校で習わない漢字の一覧
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { KANJI_BY_GRADE } from './kanji-grades.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 小学校で習わないが、このゲームでは使ってよい漢字（職業・技・場所の名前と、ゲームの基本のことば）
export const EXTRA_KANJI = [
  ...'魔呪剣竜僧侶賢闘紋拳忍賊占騎姫雷炎影闇嵐斬裂閃旋',
  ...'攻撃御威倒逃冒鑑掛殿沼滝塔超洞窟丘',
  ...'猛虎砕華烈爆滅',
].join('');

export const SCHOOL_KANJI = Object.values(KANJI_BY_GRADE).join('');
export const GRADE4_KANJI = [1, 2, 3, 4].map((g) => KANJI_BY_GRADE[g]).join('');
const ALLOWED = new Set([...SCHOOL_KANJI, ...EXTRA_KANJI, '々']);
const isKanji = (ch) => /[一-鿿]/.test(ch);
const JP = /[぀-ヿ一-鿿]/;

// 4年生までの漢字で書けるのに、ひらがなのまま残りやすいことば（目安）
export const MUST_WORDS = [
  ['なかま', '仲間'], ['どうぐ', '道具'], ['じゅもん', '呪文'], ['とくぎ', '特技'], ['そうび', '装備'],
  ['しょくぎょう', '職業'], ['てんしょく', '転職'], ['けいけんち', '経験値'], ['こうげき', '攻撃'], ['ぼうぎょ', '防御'],
  ['かいふく', '回復'], ['まほう', '魔法'], ['ゆうしゃ', '勇者'], ['まおう', '魔王'], ['でんせつ', '伝説'],
  ['せかい', '世界'], ['ぼうけん', '冒険'], ['たからばこ', '宝箱'], ['やくそう', '薬草'], ['もくひょう', '目標'],
  ['さくせん', '作戦'], ['つよさ', '強さ'], ['ずかん', '図鑑'], ['はいごう', '配合'], ['せってい', '設定'],
  ['あいことば', '合言葉'], ['ぜんいん', '全員'], ['みかた', '味方'], ['たたか', '戦'], ['あたらし', '新し'],
  ['なまえ', '名前'], ['じぶん', '自分'], ['かぞく', '家族'], ['ちから', '力'], ['すばやさ', '素早さ'],
  ['まりょく', '魔力'], ['しゅび', '守備'], ['まもの', '魔物'], ['しんでん', '神殿'], ['さかば', '酒場'],
  ['やどや', '宿屋'], ['きょうかい', '教会'], ['ぶきや', '武器屋'], ['ぼうぐや', '防具屋'], ['つかう', '使う'],
  ['つかえ', '使え'], ['つかっ', '使っ'], ['おぼえ', '覚え'], ['えらぶ', '選ぶ'], ['えらん', '選ん'],
  ['えらべ', '選べ'], ['しらべ', '調べ'], ['あがった', '上がった'], ['さがった', '下がった'], ['うけた', '受けた'],
  ['(?<![あ-ん])まって', '待って'], ['もって', '持って'], ['つづき', '続き'], ['はじめ', '始め／初め'], ['おわり', '終わり'],
  ['おわる', '終わる'], ['ひつよう', '必要'], ['さいご', '最後'], ['さいしょ', '最初'], ['ぜんぶ', '全部'],
  ['すこし', '少し'], ['つよい', '強い'], ['つよく', '強く'], ['よわい', '弱い'], ['よわく', '弱く'],
  ['おおきい', '大きい'], ['おおきな', '大きな'], ['ちいさい', '小さい'], ['ちいさな', '小さな'], ['ひかり', '光'],
  ['こころ', '心'], ['ひがし', '東'], ['みなみ', '南'], ['みぎ', '右'], ['ひだり', '左'],
  ['(?<!に[らぎ]?)みつけ', '見つけ'], ['はなし', '話'], ['たすけ', '助け'], ['まもる', '守る'], ['まもり', '守り'],
  ['あつめ', '集め'], ['さがし', '探し'], ['あるく', '歩く'], ['はしる', '走る'], ['ちず', '地図'],
  ['おかね', 'お金'], ['ねだん', '値段'], ['じかん', '時間'], ['こども', '子ども'], ['ともだち', '友だち'],
  ['いきかえ', '生き返'], ['しんで', '死んで'], ['(?<![あ-ん])まけ', '負け'], ['(?<![あ-んァ-ヶ一-龠])かった', '勝った／買った'],
  ['むら[のにへでは]', '村'], ['まち[のにへでは]', '町'], ['(?<!つ)もり[のにへでは]', '森'], ['うみ[のにへをで]', '海'],
  ['そら[のにへをで]', '空'], ['ほし[のをがに]', '星'], ['かぜ[のにをが]', '風'],
].map(([w, k]) => [new RegExp(w), w, k]);

// JS の文字列（'…' "…" `…`）を取り出す。コメントと正規表現は読みとばす
export function jsStrings(src) {
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  let prev = '';
  const regexOk = () => !prev || /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|of|in)$/.test(prev);
  const readStr = (q) => {
    const start = line;
    let s = '';
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '\n') line++;
      s += src[i++];
    }
    i++;
    return { s, line: start };
  };
  const readTemplate = () => {
    const start = line;
    let s = '';
    i++;
    while (i < n && src[i] !== '`') {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        // ${ … } の中は コードとして 読む（中の文字列も 取り出す）
        let depth = 1;
        i += 2;
        s += '${…}';
        while (i < n && depth > 0) {
          const c = src[i];
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
          else if (c === "'" || c === '"') { const r = readStr(c); out.push(r); continue; }
          else if (c === '`') { const r = readTemplate(); out.push(r); continue; }
          else if (c === '\n') line++;
          i++;
        }
        continue;
      }
      if (src[i] === '\n') line++;
      s += src[i++];
    }
    i++;
    return { s, line: start };
  };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === "'" || c === '"') { out.push(readStr(c)); prev = 'x'; continue; }
    if (c === '`') { out.push(readTemplate()); prev = 'x'; continue; }
    if (c === '/' && regexOk()) {
      // 正規表現
      i++;
      let cls = false;
      while (i < n && (cls || src[i] !== '/')) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') cls = true;
        else if (src[i] === ']') cls = false;
        else if (src[i] === '\n') break;
        i++;
      }
      i++;
      prev = 'x';
      continue;
    }
    if (!/\s/.test(c)) {
      if (/[A-Za-z0-9_$]/.test(c)) {
        let w = '';
        while (i < n && /[A-Za-z0-9_$]/.test(src[i])) w += src[i++];
        prev = w;
        continue;
      }
      prev = c;
    }
    i++;
  }
  return out;
}

// 1つの文字列を調べる
export function checkText(s) {
  const problems = [];
  const bad = [...new Set([...s].filter((ch) => isKanji(ch) && !ALLOWED.has(ch)))];
  if (bad.length) problems.push({ kind: 'kanji', detail: bad.join('') });
  if (/[぀-ヿ一-鿿！？…、。」』）] +[぀-ヿ一-鿿「『（]/.test(s)) problems.push({ kind: 'space', detail: '' });
  for (const [re, w, k] of MUST_WORDS) if (re.test(s)) problems.push({ kind: 'kana', detail: `${w}→${k}` });
  return problems;
}

// ゲームの画面に出る文字が入っているファイル
export function gameFiles() {
  const list = [
    'public/index.html',
    'public/js/main.js',
    'public/js/client/game.js', 'public/js/client/battle.js', 'public/js/client/field.js', 'public/js/client/offline.js', 'public/js/client/net.js',
    'public/js/client/ui/dom.js', 'public/js/client/ui/hud.js', 'public/js/client/ui/info.js', 'public/js/client/ui/menu.js',
    'public/js/client/ui/script.js', 'public/js/client/ui/services.js', 'public/js/client/ui/title.js',
    'public/js/client/ui/counter.js', 'public/js/client/ui/shop.js', 'public/js/shared/data/inn.js',
    'public/js/shared/ai.js', 'public/js/shared/battle.js', 'public/js/shared/stats.js',
    'public/js/shared/data/abilities.js', 'public/js/shared/data/abilities-adv.js', 'public/js/shared/data/companions.js',
    'public/js/shared/data/encounters.js', 'public/js/shared/data/items.js', 'public/js/shared/data/jobs.js',
    'public/js/shared/data/monsters.js', 'public/js/shared/data/shops.js', 'public/js/shared/data/story.js',
    'public/js/shared/maps/index.js', 'public/js/shared/maps/overworld.js', 'public/js/shared/maps/ch2.js', 'public/js/shared/maps/sea.js',
    'public/js/shared/data/abilities-ch2.js', 'public/js/shared/data/companions-ch2.js', 'public/js/shared/data/items-ch2.js',
    'public/js/shared/data/monsters-ch2.js', 'public/js/shared/data/story-ch2.js',
    'public/js/shared/world/battles.js', 'public/js/shared/world/breed.js', 'public/js/shared/world/monsters.js',
    'public/js/shared/world/party.js', 'public/js/shared/world/scripts.js', 'public/js/shared/world/services.js',
    'public/js/shared/world/world.js', 'public/js/shared/world/save.js', 'public/js/shared/world/transfer.js',
    'server/index.js', 'server/storage.js', 'server/savedir.js',
  ];
  return list.map((f) => join(ROOT, f));
}

// kana: 'よみがな' は ひらがなのままで よい
const SKIP_BEFORE = /\bkana\s*:\s*['"`]?$/;

export function checkFile(file) {
  const src = readFileSync(file, 'utf8');
  const res = [];
  if (file.endsWith('.html')) {
    src.split('\n').forEach((l, k) => {
      const t = l.replace(/<[^>]*>/g, ' ');
      if (JP.test(t)) for (const p of checkText(t)) res.push({ line: k + 1, text: t.trim(), ...p });
    });
    return res;
  }
  for (const { s, line } of jsStrings(src)) {
    if (!JP.test(s)) continue;
    const at = src.split('\n')[line - 1] || '';
    const before = at.slice(0, Math.max(0, at.indexOf(s.slice(0, 8))));
    const probs = checkText(s).filter((p) => !(SKIP_BEFORE.test(before) && p.kind !== 'kanji'));
    for (const p of probs) res.push({ line, text: s.length > 70 ? s.slice(0, 70) + '…' : s, ...p });
  }
  return res;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--foreign') {
    const count = new Map();
    for (const f of gameFiles()) {
      const src = readFileSync(f, 'utf8');
      const strs = f.endsWith('.html') ? [{ s: src }] : jsStrings(src);
      for (const { s } of strs) for (const ch of s) if (isKanji(ch) && !SCHOOL_KANJI.includes(ch)) count.set(ch, (count.get(ch) || 0) + 1);
    }
    console.log([...count].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}${EXTRA_KANJI.includes(k) ? '' : '×'}:${v}`).join(' '));
    process.exit(0);
  }
  const only = args.filter((a) => !a.startsWith('--'));
  const files = only.length ? only.map((f) => join(process.cwd(), f)) : gameFiles();
  const summary = { kanji: 0, space: 0, kana: 0 };
  for (const f of files) {
    const res = checkFile(f);
    if (!res.length) continue;
    console.log(`\n■ ${relative(ROOT, f)}`);
    for (const r of res) {
      summary[r.kind]++;
      if (!args.includes('--quiet')) console.log(`  ${r.line}: [${r.kind}${r.detail ? ' ' + r.detail : ''}] ${r.text.replace(/\n/g, '⏎')}`);
    }
  }
  console.log(`\n使えない漢字 ${summary.kanji}件 / スペース ${summary.space}件 / ひらがなのまま（目安） ${summary.kana}件`);
  process.exit(summary.kanji ? 1 : 0);
}
