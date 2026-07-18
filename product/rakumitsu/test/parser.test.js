// パーサーのローカルテスト： node test/parser.test.js
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'parser.gs'), 'utf8');
const module_ = { exports: {} };
new Function('module', src)(module_);
const P = module_.exports;

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; }
  else { fail++; console.error(`NG ${label}\n  expected: ${e}\n  actual  : ${a}`); }
}

// --- normalize ---
eq(P.normalize('１５，０００円'), '15000円', 'normalize 全角・カンマ');
eq(P.normalize('1.5万'), '15000', 'normalize 万');
eq(P.normalize('２台×４５００'), '2台x4500', 'normalize ×');

// --- 宛名 ---
eq(P.parseLine('田中様'), { type: 'client', client: '田中', honorific: '様' }, '宛名 様');
eq(P.parseLine('株式会社スミレ 御中'), { type: 'client', client: '株式会社スミレ', honorific: '御中' }, '宛名 御中');

// --- 品目：数量×単価（既定は単価解釈） ---
let r = P.parseLine('エアコンクリーニング 2台 15000ずつ');
eq(r.item, { name: 'エアコンクリーニング', qty: 2, unit: '台', unitPrice: 15000, amount: 30000, reduced: false }, 'ずつ=単価');
r = P.parseLine('エアコンクリーニング2台 15000');
eq(r.item.amount, 30000, '単位直結・無印=単価扱い');
r = P.parseLine('作業 2台で30000');
eq([r.item.unitPrice, r.item.amount], [15000, 30000], '「で」=合計');
r = P.parseLine('クリーニング 2x4500');
eq(r.item.amount, 9000, 'x形式');
r = P.parseLine('ハウスクリーニング 8000ずつ 3回');
eq(r.item.amount, 24000, '単価先行形式');

// --- 品目：単発金額・値引き・万 ---
r = P.parseLine('出張費 3000');
eq(r.item, { name: '出張費', qty: 1, unit: '', unitPrice: null, amount: 3000, reduced: false }, '単発金額');
r = P.parseLine('出張費3000');
eq(r.item.amount, 3000, '品名直結の金額');
r = P.parseLine('値引き 2000');
eq(r.item.amount, -2000, '値引きはマイナス');
r = P.parseLine('高圧洗浄 1.5万');
eq(r.item.amount, 15000, '万表記');

// --- 品目：金額なし→聞き返し ---
r = P.parseLine('作業一式');
eq(r.item.amount, null, '金額なしはnull');
r = P.parseLine('室外機 2台');
eq([r.item.qty, r.item.amount], [2, null], '数量のみもnull');

// --- 軽減税率 ---
r = P.parseLine('お茶菓子 10個 300ずつ ※軽減');
eq([r.item.reduced, r.item.amount], [true, 3000], '軽減フラグ');

// --- インライン宛名 ---
r = P.parseLine('佐藤さん 引越し手伝い 25000');
eq([r.client, r.item.name, r.item.amount], ['佐藤', '引越し手伝い', 25000], '行頭宛名+品目');

// --- メモ全体 ---
const memo = P.parseMemo('田中様\nエアコンクリーニング 2台 15000ずつ\n出張費 3000');
eq(memo.client, '田中', 'メモ:宛名');
eq(memo.items.length, 2, 'メモ:品目数');
let t = P.computeTotals(memo.items, false);
eq([t.subtotal, t.tax, t.total], [33000, 3300, 36300], 'メモ:合計(税別)');

// --- 税込入力 ---
t = P.computeTotals([{ name: 'a', qty: 1, unit: '', unitPrice: null, amount: 11000, reduced: false }], true);
eq([t.subtotal, t.tax, t.total], [10000, 1000, 11000], '税込入力の逆算');

// --- 軽減混在の合計 ---
t = P.computeTotals([
  { name: 'a', qty: 1, unit: '', unitPrice: null, amount: 10000, reduced: false },
  { name: 'b', qty: 1, unit: '', unitPrice: null, amount: 2000, reduced: true },
], false);
eq([t.tax10, t.tax8, t.total], [1000, 160, 13160], '税率混在');

// --- 金額未定の抽出 ---
eq(P.unknownAmountItems([{ name: 'x', amount: null }, { name: 'y', amount: 100 }]), ['x'], '金額未定リスト');

// --- 表示 ---
eq(P.yen(1234567), '1,234,567', 'yen区切り');
eq(P.yen(-2000), '-2,000', 'yenマイナス');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
