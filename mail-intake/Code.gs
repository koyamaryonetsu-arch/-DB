/**
 * シネマ案件：Gmail → 自動 登録 / 進捗更新（cinema-cases / Supabase）
 *
 * 動作:
 *   1. Gmailの「案件登録」ラベルの新着スレッドを5分毎に読む（スレッド全体＝最初の依頼＋以降の進捗を文脈に）
 *   2. Claudeが判定: 案件依頼か? / 新規(new) か 進捗報告(progress) か / 各項目を抽出
 *   2.5 添付の見積書(画像/PDF)があればAI-OCRで 見積り名/金額/提出日 を抽出
 *   3. 既存案件と照合（AIが update/new/review を判定。劇場exact→表記ゆれ部分一致→会社単位でフォールバックし
 *      候補を集め、過去のやり取り・関係者(メール)のつながり・対象設備を加味＝別スレッド/時間差/複数人でも拾う）
 *      ※精度最優先。1回目が曖昧(review)なら会社全体の過去案件を集め直して再確認。それでも曖昧なら登録しない。
 *      - update（同一と確信） かつ 進捗/見積添付/日程あり → その案件を UPDATE（見積名/金額/日程/内容追記）
 *      - update だが新情報なし → 重複扱いで登録しない（手動登録を「正」とする）
 *      - review（同一の可能性ありだが不確実） → 「案件登録_要確認」で人の確認へ（あいまいなまま登録しない）
 *      - new（別の新案件と確信） → INSERT（見積添付・日程も反映）
 *   4. INSERT/UPDATE すると既存 Database Webhook (case-created) が発火し LINE 通知
 *   5. 処理済みメールにはラベルを付けて再処理を防止
 *   ※ 案件と判定できないメール(is_case=false/確信度低)のみ「案件登録_要確認」で人の確認へ
 *
 * スクリプトプロパティ:
 *   ANTHROPIC_API_KEY          - Anthropic APIキー
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase の service_role キー（Settings > API）
 *   SUPABASE_URL               - (任意) 既定 https://hykjpadvbficiiuockhj.supabase.co
 *   ANTHROPIC_MODEL            - (任意) 既定 claude-haiku-4-5-20251001（本文抽出は安いHaikuで十分）
 *   ANTHROPIC_OCR_MODEL        - (任意) 既定 claude-sonnet-4-6（添付見積書の画像/PDF読取は視覚対応モデル）
 */

var SRC_LABEL = '案件登録';        // 取込対象（フィルタ/手動で付与）
var DONE_LABEL = '案件登録済';      // 新規登録 完了
var UPD_LABEL = '案件更新済';       // 進捗更新 完了
var SKIP_LABEL = '案件登録_要確認'; // 案件でない / 進捗だが更新先不明
var DUP_LABEL = '案件登録_重複';    // 既存の手動登録と重複（登録せず）

var COMPANY_LIST = ['TOHOシネマズ', '109シネマズ', 'ユナイテッドシネマ', '佐々木興業', 'コロナワールド', 'MOVIX', 'イオンシネマズ', 'シネマサンシャイン'];
var CATEGORY_LIST = ['新規工事', '更新案件', '修理', 'メンテナンス', '点検', '改修', 'その他'];
// 菱熱工業（受注側）メンバー。R担当者はこのリストの苗字のみ許可（客先担当者との取り違え防止）
var RYONETSU_MEMBERS = ['小山', '細萱', '大和', '山口', '金子', '若山', '伊藤', '藤村', '山本'];
// 菱熱工業メンバー（内部）の差出人ヒント。ここからのメールは進捗報告の可能性が高い
var MEMBER_HINT = '@ryonetsu.com / @ryonetsu-ai.com、および 金子/若山/山口/大和/細萱/小山 などの個人アドレス';

function cfg_(k, d) {
  var v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === '') ? (d === undefined ? '' : d) : v;
}
function SUPABASE_URL_() { return cfg_('SUPABASE_URL', 'https://hykjpadvbficiiuockhj.supabase.co'); }
function MODEL_() { return cfg_('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'); }
// 添付見積書のAI-OCRは画像/PDFを読むため視覚対応モデル（既定Sonnet）を使う
function OCR_MODEL_() { return cfg_('ANTHROPIC_OCR_MODEL', 'claude-sonnet-4-6'); }
var OCR_MAX_BYTES = 5 * 1024 * 1024; // 5MB超の添付はスキップ（API上限・コスト対策）

// ===== メイン（5分毎トリガー） =====
function importCaseEmails() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var lblDone = getOrCreateLabel_(DONE_LABEL);
    var lblUpd = getOrCreateLabel_(UPD_LABEL);
    var lblSkip = getOrCreateLabel_(SKIP_LABEL);
    var lblDup = getOrCreateLabel_(DUP_LABEL);
    var q = 'label:' + SRC_LABEL + ' -label:' + DONE_LABEL + ' -label:' + UPD_LABEL +
            ' -label:' + SKIP_LABEL + ' -label:' + DUP_LABEL + ' newer_than:14d';
    var threads = GmailApp.search(q, 0, 20);
    if (!threads.length) { Logger.log('対象メールなし'); return; }

    var nNew = 0, nUpd = 0, nDup = 0, nSkip = 0;
    threads.forEach(function (th) {
      var msgs = th.getMessages();
      var m = msgs[msgs.length - 1];        // 最新（進捗判定・受付日フォールバック用）
      var emailText = buildThreadText_(th); // スレッド全体を文脈に（最初の依頼＋以降の進捗）

      var p = parseEmail_(emailText);
      // 方針: 要確認に回すのは「明確に案件でない」とAIが判断した時だけ。迷ったら登録する（不要なら後で削除）
      if (!p || p.is_case === false) { th.addLabel(lblSkip); nSkip++; return; }
      fixPersons_(p); // 客先担当者/R担当者の取り違え補正＋苗字のみに正規化

      var received = p.received_date || Utilities.formatDate(msgs[0].getDate(), 'Asia/Tokyo', 'yyyy-MM-dd');
      var theater = p.theater || '';
      var participants = threadParticipants_(th); // やり取りの関係者（同一案件判定の手がかり）
      // 見積書の自動OCR取込は無効化（誤登録が多いため）。見積り名・金額・提出日の自動入力はしない。
      // ※アプリ側の手動OCR（見積り名セルをダブルクリック）は引き続き利用可。
      var quote = null;
      // 既存案件と照合し update/new/review を決定。迷ったら会社全体の過去案件を集め直して再確認
      var decision = decideCaseWithRecheck_(p, received, participants);

      if (decision.decision === 'update' && decision.row) {
        // 一致確定：進捗・見積添付・日程がメールにあれば更新（時間差/複数人の続報も取りこぼさない）
        if (p.intent === 'progress' || quote || hasProgressDates_(p.progress)) {
          updateCase_(decision.row, p.progress || {}, p.content, quote);
          th.addLabel(lblUpd); nUpd++;
        } else {
          th.addLabel(lblDup); nDup++;   // 既存と同一だが新しい情報なし → 手動優先で登録せず
          Logger.log('既存と同一（新情報なし）で登録せず: ' + (p.title || m.getSubject()) + ' → id=' + decision.row.id);
        }
      } else if (decision.decision === 'review') {
        // 精度重視: 既存案件の続きの可能性があるが確信が持てない → 人の確認へ（あいまいなまま登録しない）
        th.addLabel(lblSkip); nSkip++;
        Logger.log('要確認（同一案件か曖昧・再確認しても未確定）: ' + (p.title || m.getSubject()) + ' / ' + (decision.reason || ''));
      } else {
        // 別の新しい案件と確信 → 新規登録（日程もメールにあれば正しい項目へ）
        var dates = p.progress || {};
        insertCase_({
          company: normalizeCompany_(p.company), theater: theater, received_date: received,
          tc_person: p.tc_person || '', r_person: p.r_person || '',
          category: normalizeCategory_(p.category), content: p.content || m.getPlainBody().slice(0, 1500),
          survey_date: dates.survey_date || '',
          work_start_date: dates.work_start_date || '',
          work_end_date: dates.work_end_date || '',
          estimate_name: quote ? quote.estimate_name : '',
          estimate_amount: quote ? quote.estimate_amount : '',
          quote_date: (quote && quote.quote_date) || dates.quote_date || ''
        });
        th.addLabel(lblDone); nNew++;
      }
    });
    Logger.log('新規 %s / 進捗更新 %s / 重複スキップ %s / 非案件・要確認 %s', nNew, nUpd, nDup, nSkip);
  } catch (e) {
    Logger.log('importCaseEmails error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateLabel_(name) { return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name); }
// スレッド全体を1つのテキストに（最初の依頼＋以降のやり取り）。長すぎる場合は先頭優先で丸める
function buildThreadText_(th) {
  var msgs = th.getMessages();
  var out = '件名: ' + msgs[0].getSubject() + '\n';
  for (var i = 0; i < msgs.length; i++) {
    var mm = msgs[i];
    out += '\n--- メッセージ' + (i + 1) + ' ---\n差出人: ' + mm.getFrom() +
      ' / 日時: ' + Utilities.formatDate(mm.getDate(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm') + '\n' + mm.getPlainBody();
    if (out.length > 8000) { out = out.slice(0, 8000); break; }
  }
  return out;
}
function normalizeCompany_(v) {
  if (!v) return 'TOHOシネマズ';
  for (var i = 0; i < COMPANY_LIST.length; i++) if (COMPANY_LIST[i] === v) return v;
  return v;
}
function normalizeCategory_(v) {
  for (var i = 0; i < CATEGORY_LIST.length; i++) if (CATEGORY_LIST[i] === v) return v;
  return 'その他';
}
// 敬称・名を落として苗字だけにする（「山田太郎様」→「山田太郎」→ 空白区切りなら先頭のみ）
function surnameOnly_(s) {
  if (!s) return '';
  s = String(s).trim().replace(/(様|さん|殿|氏)$/g, '');
  s = s.split(/[ 　,、\/]/)[0];          // 「山田 太郎」→「山田」
  return s.replace(/(様|さん|殿|氏)$/g, '').trim();
}
// 菱熱メンバーの苗字に一致するか（「小山和也」等もヒットさせる前方一致）
function memberMatch_(s) {
  if (!s) return '';
  for (var i = 0; i < RYONETSU_MEMBERS.length; i++) {
    if (s.indexOf(RYONETSU_MEMBERS[i]) === 0) return RYONETSU_MEMBERS[i];
  }
  return '';
}
// 客先担当者(tc_person)とR担当者(r_person)の取り違えを補正し、苗字のみに正規化
function fixPersons_(p) {
  var tc = surnameOnly_(p.tc_person || '');
  var r = surnameOnly_(p.r_person || '');
  var tcMember = memberMatch_(tc);
  var rMember = memberMatch_(r);
  if (rMember) {
    r = rMember;                     // R担当はメンバー表記（苗字）に正規化
  } else if (r) {
    // R担当にメンバー以外の名前 → 実は客先担当の可能性が高い
    if (!tc) tc = r;
    r = '';
  }
  if (tcMember) {
    // 客先担当に菱熱メンバー → R担当へ移す（既にR担当がいれば単に除去）
    if (!r) r = tcMember;
    tc = '';
    Logger.log('担当者補正: 客先担当に菱熱メンバー(' + tcMember + ')が入っていたためR担当へ');
  }
  p.tc_person = tc;
  p.r_person = r;
  return p;
}

// ===== Claude: メール解析（新規/進捗の判定＋項目抽出） =====
function parseEmail_(emailText) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) { Logger.log('ANTHROPIC_API_KEY未設定'); return null; }
  var sys =
    'あなたはシネコン設備の案件管理アシスタントです。メールを読み、JSONのみ出力（前後に文章なし）。\n' +
    '判定: is_case=修理/工事/設備対応に関するメールか。intent="new"(新しい依頼) か "progress"(既存案件の進捗報告)。\n' +
    'ヒント: 差出人が客先なら新規依頼が多い。差出人が菱熱工業メンバー(' + MEMBER_HINT + ')なら進捗報告が多い。\n' +
    '会社は次のいずれかに正規化、なければ原文:\n' + JSON.stringify(COMPANY_LIST) + '\n' +
    '種別は次のいずれか:\n' + JSON.stringify(CATEGORY_LIST) + '\n' +
    '担当者の区別（重要・取り違え禁止）:\n' +
    '- r_person = 菱熱工業（受注側・弊社）の担当者。次のリストの苗字と一致する場合のみ入れる。一致しなければ空文字: ' + JSON.stringify(RYONETSU_MEMBERS) + '\n' +
    '- tc_person = 客先（劇場・シネコン運営会社側）の担当者。菱熱工業メンバーの名前は絶対に入れない。\n' +
    '- どちらも「苗字のみ」（例: 「山田太郎様」→「山田」。「様」「さん」等の敬称は付けない）。\n' +
    'スキーマ: {"is_case":bool,"confidence":number,"intent":"new"|"progress","title":string,' +
    '"company":string,"theater":string(劇場名),"received_date":"YYYY-MM-DD",' +
    '"tc_person":string,"r_person":string,"category":string,"content":string(要点1-3文),' +
    '"progress":{"survey_date":"YYYY-MM-DD","quote_date":"YYYY-MM-DD","work_start_date":"YYYY-MM-DD","work_end_date":"YYYY-MM-DD","note":string}}\n' +
    'progress の日付は intent に関わらず、メールに具体的な日付が出ていれば必ず正しい項目に入れる（無い項目は空文字）:\n' +
    '- survey_date=現地調査・現調・下見の日 / quote_date=見積書の提出日 / work_start_date=作業・工事の開始日 / work_end_date=作業・工事の完了日\n' +
    '- 「受付日」と混同しない。\n' +
    'note（進捗メモ）のルール（重要）:\n' +
    '- intent=progress のときだけ、「一番新しいメッセージで判明した“新しい進展”」だけを1〜3文で簡潔に書く。\n' +
    '- スレッド全体の再要約や、これまでの経緯の繰り返しはしない。既に分かっている内容は書かない。\n' +
    '- 「7/10:」「7/13:」のような過去日付の列挙・箇条書きはしない（日付は上の項目で管理する）。\n' +
    '- 新しい進展が無ければ note は空文字にする。';
  return safeJson_(anthropicText_(apiKey, sys, emailText, 800));
}

// ===== Supabase: 既存案件を取得（フィルタ指定） =====
function queryCases_(filter) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return []; }
  var params = filter +
    '&select=id,company,theater,received_date,category,content,memo,customer_memo,status,r_person,tc_person,estimate_name,estimate_amount,survey_date,quote_date,work_start_date,work_end_date' +
    '&order=received_date.desc&limit=25';
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?' + params, {
    method: 'get', headers: { apikey: key, Authorization: 'Bearer ' + key }, muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('候補取得失敗: ' + res.getContentText()); return []; }
  try { return JSON.parse(res.getContentText()) || []; } catch (e) { return []; }
}
// 従来互換（testConnections用）: 劇場名 exact
function fetchTheaterCases_(theater) { return queryCases_('theater=eq.' + encodeURIComponent(theater)); }
// 劇場名のコア語（会社名や「シネマズ」等を除いた店舗名）。表記ゆれの部分一致に使う
function theaterCore_(t) {
  var s = String(t || '').replace(/[\s　]/g, '');
  var strip = COMPANY_LIST.concat(['TOHOシネマズ', 'TOHO', '109シネマズ', '109', 'シネマズ', 'シネマ', 'ユナイテッド', 'MOVIX', 'ムービックス', '株式会社']);
  for (var i = 0; i < strip.length; i++) s = s.split(strip[i]).join('');
  return s;
}
// メール案件に対する既存候補を集める（劇場exact→表記ゆれ部分一致→会社単位でフォールバック）
function fetchCandidateCases_(p) {
  var theater = p.theater || '';
  var company = p.company ? normalizeCompany_(p.company) : '';
  var out = [], seen = {};
  function add(rows) {
    for (var i = 0; i < rows.length; i++) {
      var id = String(rows[i].id);
      if (!seen[id]) { seen[id] = 1; out.push(rows[i]); }
    }
  }
  if (theater) {
    add(queryCases_('theater=eq.' + encodeURIComponent(theater)));
    if (!out.length) {
      var core = theaterCore_(theater); // 「TOHOシネマズ 川崎」↔「TOHO川崎」等の表記ゆれ対策
      if (core && core.length >= 2) add(queryCases_('theater=ilike.*' + encodeURIComponent(core) + '*'));
    }
  }
  // 劇場名で1件も拾えないとき（抽出失敗・表記差）は会社単位の最近案件も候補に（AIが厳密判定）
  if (!out.length && company) add(queryCases_('company=eq.' + encodeURIComponent(company)));
  return out;
}
// メールに日程（調査/見積/着工/完了）が含まれるか
function hasProgressDates_(prog) {
  if (!prog) return false;
  return !!(prog.survey_date || prog.quote_date || prog.work_start_date || prog.work_end_date);
}
// スレッドのやり取り関係者（From/To/Cc のメールアドレス）を集める。同一案件判定の手がかり
function threadParticipants_(th) {
  var set = {}, out = [];
  var msgs = th.getMessages();
  for (var i = 0; i < msgs.length; i++) {
    var fields = [msgs[i].getFrom(), msgs[i].getTo(), msgs[i].getCc()].join(',');
    var parts = fields.split(',');
    for (var k = 0; k < parts.length; k++) {
      var s = String(parts[k] || '').trim();
      if (!s) continue;
      var mm = s.match(/<([^>]+)>/);
      var addr = (mm ? mm[1] : s).toLowerCase().trim();
      if (addr && addr.indexOf('@') > 0 && !set[addr]) { set[addr] = 1; out.push(addr); }
      if (out.length >= 20) return out.join(', ');
    }
  }
  return out.join(', ');
}

// ===== Claude: 既存案件との照合を「update / new / review」で判定 =====
// 精度最優先。曖昧なまま new と断定せず、続きの可能性が残るなら review（人の確認）へ。
// 過去のやり取り・関係者のつながり・対象設備を加味し、時間差や複数人のスレッドでも続報を拾う。
function decideCase_(p, received, candidates, participants, strict) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) return { decision: 'review', row: null, reason: 'APIキー未設定' };
  var list = candidates.map(function (x, i) {
    var d = [];
    if (x.survey_date) d.push('調査' + x.survey_date);
    if (x.quote_date) d.push('見積' + x.quote_date);
    if (x.work_start_date) d.push('着工' + x.work_start_date);
    if (x.work_end_date) d.push('完了' + x.work_end_date);
    return (i + 1) + '. id=' + x.id +
      ' 劇場=' + (x.theater || '?') +
      ' 受付=' + (x.received_date || '?') +
      ' 種別=' + (x.category || '?') +
      ' 状態=' + (x.status || '?') +
      (x.tc_person ? ' 客先担当=' + x.tc_person : '') +
      (x.r_person ? ' R担当=' + x.r_person : '') +
      (x.estimate_name ? ' 見積名=' + String(x.estimate_name).slice(0, 40) : '') +
      (d.length ? ' 日程[' + d.join(',') + ']' : '') +
      '\n    内容=' + String(x.content || '').slice(0, 300) +
      (x.memo ? '\n    社内メモ=' + String(x.memo).slice(0, 100) : '');
  }).join('\n');
  var sys = [
    'あなたは「新しいメール案件が、既存案件の続き(=同じ一件)か、新規の別案件か」を見分けます。JSONのみ出力（前後に文章なし）。',
    'decision は次の3つのいずれか:',
    '- "update": 既存案件のどれかと「同じ一件」だと確信できる（matched_id を必ず返す）。',
    '- "new": どの既存案件とも別の、新しい一件だと確信できる。',
    '- "review": 既存案件の続きの可能性があるが確信が持てない（人が確認すべき）。',
    '判断ルール（精度最優先・この情報は顧客と共有する）:',
    '- 曖昧なまま new と断定してはいけない。既存案件の続きかもしれないと少しでも思ったら "review"。',
    '- 同じ劇場で対象の設備/系統/場所/工事が一致、または「調査→見積→注文→作業→報告」の続きなら "update"。',
    '- 時間が空いていても、送信者や宛先が前回と違っても、それだけで別案件と判断しない。',
    '- 客先担当/R担当/やり取りの関係者(メール)が既存案件と一致するかも手がかりにする。',
    '- 対象の設備・場所・工事が明確に別で、既存のどれとも無関係だと判断できる場合のみ "new"。',
    (strict ? '- これは再確認です。過去案件を一件ずつ丁寧に照合し、少しでも同一の可能性が残るなら "review" にすること。' : ''),
    'スキーマ: {"decision":"update"|"new"|"review","matched_id":string(updateの時のみ),"confidence":0〜1の数値,"reason":string(日本語で簡潔に)}'
  ].join('\n');
  var user = [
    '# 新しいメール案件',
    '劇場: ' + (p.theater || ''),
    '会社: ' + (p.company || ''),
    '受付: ' + received,
    '種別: ' + (p.category || ''),
    '件名: ' + (p.title || ''),
    '客先担当: ' + (p.tc_person || '') + ' / R担当: ' + (p.r_person || ''),
    'やり取りの関係者(メール): ' + (participants || '(不明)'),
    '内容: ' + (p.content || ''),
    '',
    '# 既存案件（同じ劇場/会社・新しい順）',
    list
  ].join('\n');
  var j = safeJson_(anthropicText_(apiKey, sys, user, 400));
  if (!j || !j.decision) return { decision: 'review', row: null, reason: 'AI応答不正' };
  var conf = (typeof j.confidence === 'number') ? j.confidence : 0;
  var row = null;
  if (j.decision === 'update') {
    for (var i = 0; i < candidates.length; i++) if (String(candidates[i].id) === String(j.matched_id)) { row = candidates[i]; break; }
    if (!row) return { decision: 'review', row: null, confidence: conf, reason: '一致idが候補に無い: ' + (j.reason || '') };
    if (conf < 0.6) return { decision: 'review', row: row, confidence: conf, reason: '一致だが確信不足(' + conf + '): ' + (j.reason || '') };
    return { decision: 'update', row: row, confidence: conf, reason: j.reason || '' };
  }
  if (j.decision === 'new') {
    // あいまいなまま新規にしない: 確信が低ければ review（人の確認へ）
    if (conf < 0.6) return { decision: 'review', row: null, confidence: conf, reason: '新規判断だが確信不足(' + conf + '): ' + (j.reason || '') };
    return { decision: 'new', row: null, confidence: conf, reason: j.reason || '' };
  }
  return { decision: 'review', row: null, confidence: conf, reason: j.reason || '' };
}

// 迷ったら過去案件を再確認: 1回目が review なら会社全体＋表記ゆれで候補を集め直して厳密に見直す
function decideCaseWithRecheck_(p, received, participants) {
  var candidates = fetchCandidateCases_(p);
  if (!candidates.length) return { decision: 'new', row: null, reason: '同じ劇場/会社の既存案件が無い' };
  var d1 = decideCase_(p, received, candidates, participants, false);
  if (d1.decision !== 'review') return d1;
  // 曖昧 → 会社全体の過去案件も含めて集め直し、厳密モードで再判定
  var broad = fetchBroadCandidates_(p, candidates);
  Logger.log('曖昧のため過去案件を再確認（候補' + broad.length + '件）: ' + (p.title || ''));
  return decideCase_(p, received, broad, participants, true);
}
// 再確認用に候補を広げる（既存候補＋会社全体の最近案件＋劇場名の表記ゆれ一致）
function fetchBroadCandidates_(p, base) {
  var out = [], seen = {};
  function add(rows) {
    for (var i = 0; i < rows.length; i++) {
      var id = String(rows[i].id);
      if (!seen[id]) { seen[id] = 1; out.push(rows[i]); }
    }
  }
  add(base || []);
  var company = p.company ? normalizeCompany_(p.company) : '';
  if (company) add(queryCases_('company=eq.' + encodeURIComponent(company)));
  var core = theaterCore_(p.theater || '');
  if (core && core.length >= 2) add(queryCases_('theater=ilike.*' + encodeURIComponent(core) + '*'));
  return out;
}

// ===== Supabase: 新規INSERT =====
function insertCase_(f) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return; }
  // メール本文は社内メモ(memo)へ。客先向けの「内容(content)」はAIが社内事情を除いて要約
  var mailText = f.content || null;
  var summary = summarizeForCustomer_(mailText, '', '');
  // AIが自動登録したものと分かるよう、社内メモ先頭にタグを付ける（内容への要約時はこのタグは含めない）
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var memoText = '【AI自動登録 ' + today + '】' + (mailText ? '\n' + mailText : '');
  var body = {
    company: f.company, theater: f.theater, received_date: f.received_date || null,
    tc_person: f.tc_person || null, r_person: f.r_person || null,
    category: f.category || null,
    memo: memoText,
    content: summary || null
  };
  // 添付見積書のOCR結果があれば書き込む（空はnullでスキップ）
  if (f.estimate_name) body.estimate_name = f.estimate_name;
  if (f.estimate_amount) body.estimate_amount = normalizeAmount_(f.estimate_amount);
  if (f.quote_date) body.quote_date = f.quote_date;
  // メール本文に日付が出ていれば、日程の項目にも正しく記入
  if (f.survey_date) body.survey_date = f.survey_date;
  if (f.work_start_date) body.work_start_date = f.work_start_date;
  if (f.work_end_date) body.work_end_date = f.work_end_date;
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases', {
    method: 'post', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('INSERT失敗: ' + res.getContentText());
  else Logger.log('新規登録: ' + f.theater + ' / ' + String(f.content || '').slice(0, 30));
}

// ===== Supabase: 進捗UPDATE（該当案件に日付/内容を反映） =====
function updateCase_(matched, prog, summary, quote) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) return;
  var patch = {};
  // 日付は「まだ空」の項目に記入（既存値は上書きしない＝手動入力を尊重）
  if (prog.survey_date && !matched.survey_date) patch.survey_date = prog.survey_date;
  if (prog.quote_date && !matched.quote_date) patch.quote_date = prog.quote_date;
  if (prog.work_start_date && !matched.work_start_date) patch.work_start_date = prog.work_start_date;
  if (prog.work_end_date && !matched.work_end_date) patch.work_end_date = prog.work_end_date;
  // 添付見積書のOCR結果（見積り名/金額/提出日）も、空の項目のみ記入
  if (quote) {
    if (quote.estimate_name && !matched.estimate_name) patch.estimate_name = quote.estimate_name;
    if (quote.estimate_amount && (matched.estimate_amount === null || matched.estimate_amount === undefined || matched.estimate_amount === ''))
      patch.estimate_amount = normalizeAmount_(quote.estimate_amount);
    if (quote.quote_date && !matched.quote_date && !patch.quote_date) patch.quote_date = quote.quote_date;
  }
  // 進捗メモは「社内メモ(memo)」へ追記する（客先向けの「内容」へはサーバ側のAI要約が反映）。
  // 「最新の新しい進展だけ」を追記（全履歴の再要約はしない＝prog.noteのみ）。
  // 重複防止: 既に社内メモ or 顧客メモに同/類似の内容があれば追記しない（顧客メモと同内容が
  //   メールでも来た場合の二重記入を自動スキップ）。体裁は「空行＋[進捗 日付]＋改行＋本文」。
  var note = (prog.note || '').trim();
  if (note && isDuplicateNote_(matched.customer_memo, note)) {
    Logger.log('顧客メモと重複のため社内メモへ追記せず: id=' + matched.id);
  } else if (note && !isDuplicateNote_(matched.memo, note)) {
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var base = reformatProgress_(String(matched.memo || '')); // 既存の詰まった進捗も読みやすく再整形
    // AIが自動更新したものと分かるようタグを付ける（内容への要約時はこのタグは含めない）
    var block = '【AI自動更新 ' + today + '】\n' + note;
    patch.memo = base ? (base + '\n\n' + block) : block;
  } else if (note) {
    Logger.log('社内メモと重複のため追記せず: id=' + matched.id);
  }
  if (!Object.keys(patch).length) { Logger.log('更新項目なし: id=' + matched.id); return; }
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?id=eq.' + encodeURIComponent(matched.id), {
    method: 'patch', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(patch), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('UPDATE失敗: ' + res.getContentText());
  else Logger.log('進捗更新: id=' + matched.id + ' 項目=' + Object.keys(patch).join(','));
}

// ===== 社内メモ → 客先向け「内容」要約 =====
// 社内メモ(delta)を、客先に見せてよい「内容」向けに要約する。
// 除外: 下請け/協力会社(パートナー)名・金額/費用感・作業の難易度・社内の判断過程 等。
// 重複回避: 既存の内容(currentContent)・顧客メモ(customerMemo)にある事柄は繰り返さない。
// 共有すべき客先向け情報が無ければ空文字（＝内容へ書かない）。
function summarizeForCustomer_(delta, currentContent, customerMemo) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  delta = String(delta || '').trim();
  if (!apiKey || !delta) return '';
  var sys = [
    'あなたは菱熱工業（シネコン設備の保守/工事）の案件アシスタントです。',
    '社内メモの内容を、客先（映画館）にそのまま見せる「内容」欄向けの短い文章に要約します。',
    '',
    '【最重要】あなたの出力は、客先がそのまま読むテキストです。',
    '前置き・理由・判定・分類・注釈など、要約本文以外は一切書かないでください。',
    '',
    '絶対に書いてはいけないこと（客先に見せない社内事情）:',
    '- 下請け・協力会社・パートナー企業・別業者の社名/選定/担当者/連絡先。',
    '- 金額・費用・原価・粗利・費用感（高い/安い等）。',
    '- 作業の難易度・大変さ・応急処置の技術的検討・社内での判断過程や検討理由。',
    '- 菱熱の社内メンバー名。',
    '',
    '出力ルール:',
    '- 客先が知りたい「案件の状況・進捗・次の予定・依頼事項」だけを、事実ベースで簡潔に。',
    '- 既存の「内容」「顧客メモ」に既にある事柄は繰り返さない（重複禁止）。',
    '- 客先に共有できる新情報が無い場合（社内事情のみ・重複のみ）は、要約文の代わりに半角で NONE とだけ返す。',
    '  理由や補足は一切書かない。「NONE」と要約文を混ぜない（共有できないなら NONE だけ）。',
    '',
    '文体ルール（管理ツールの記録欄なので厳守）:',
    '- 書き言葉で書く。「です・ます」の話し言葉にしない。常体（〜した／〜予定／体言止め）で簡潔に。',
    '- 「お見積り」「ご連絡」等の丁寧語・依頼調にしない（「見積」「連絡」等）。',
    '- 見やすさ優先。状況・予定・確認事項など項目が複数あるときは箇条書き（各行「・」始まり）にする。',
    '- 1項目なら1行。だらだら長い1文にしない。',
    '',
    '悪い例（絶対NG）: 「(なし) 理由：社内メモは別業者の選定と応急処置の検討で…」',
    '悪い例（話し言葉NG）: 「シアター3の空調を点検し、部品交換のお見積りを提出予定です。」',
    '良い例（書き言葉・1項目）: 「シアター3空調を点検。部品交換の見積を提出予定。」',
    '良い例（書き言葉・複数）: 「・シアター3空調の点検を実施\n・部品交換の見積を今週提出予定\n・調査日は要調整」',
    '共有なしの例: NONE'
  ].join('\n');
  var user = [
    '# 既存の「内容」（客先も見る。ここに書かれている事は繰り返さない）',
    String(currentContent || '').trim() || '(空)',
    '',
    '# 既存の「顧客メモ」（客先が記入。ここに書かれている事は繰り返さない）',
    String(customerMemo || '').trim() || '(空)',
    '',
    '# 社内メモ（この中から客先に共有してよい部分だけ要約）',
    delta
  ].join('\n');
  var s = (anthropicText_(apiKey, sys, user, 300) || '').trim();
  if (isNoShareSummary_(s)) return '';
  return s;
}
// 要約結果が「客先に共有なし」を意味するか（内容へ書かない判定・頑丈版）。
// "NONE"を含む／先頭が「なし」系／「該当なし」等 → 共有なし扱い。
function isNoShareSummary_(s) {
  s = String(s || '').trim();
  if (!s) return true;
  if (/NONE/i.test(s)) return true;                         // 半角センチネル
  if (/^[（(]?\s*なし\s*[）)]?/.test(s)) return true;          // 先頭が「なし」「(なし)」等
  if (/^(該当なし|共有(事項|情報)?なし|特になし|共有なし)/.test(s)) return true;
  return false;
}

// ============================================================
//  【一回だけ実行】既存データの移行: 内容/社内メモ を新ルールに書き直す
//  ------------------------------------------------------------
//  旧: 内容(content) にメール取込の作業ログ（社内情報を含みうる）が入っている。
//  新: 社内メモ(memo) = 既存の社内メモ＋既存の内容（＝社内の生ログ）。
//      内容(content) = その社内メモをAIが客先向けに要約（下請け/金額/難易度など除外）。
//
//  ★重要★ 実行前に Supabase の Database Webhook（cases → case-created）を
//          「無効化」してください。有効のままだと1件ごとにLINE通知が飛び、
//          通知枠を消費します（顧客メモ/内容更新の通知が全件分発火するため）。
//          移行が終わったらWebhookを元に戻してください。
//
//  ・GASの6分制限に備え、約5分で自動中断＆再開可能（処理済みIDを記録）。
//    途中で止まったら、もう一度 migrateContentMemo() を実行すれば続きから。
//  ・最初からやり直したい場合は migrateContentMemoReset() を実行。
// ============================================================
function migrateContentMemo() {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return; }
  if (!apiKey) { Logger.log('ANTHROPIC_API_KEY未設定'); return; }
  var props = PropertiesService.getScriptProperties();
  var done = {};
  try { done = JSON.parse(props.getProperty('MIGRATE_MEMO_DONE') || '{}') || {}; } catch (e) {}
  var rows = migrateFetchAll_(key);
  Logger.log('移行対象: 全' + rows.length + '件（済 ' + Object.keys(done).length + '件）');
  var start = Date.now(), BUDGET = 5 * 60 * 1000;
  var processed = 0, skipped = 0, failed = 0;
  for (var i = 0; i < rows.length; i++) {
    if (Date.now() - start > BUDGET) { Logger.log('⏸ 時間切れ・中断。再度 migrateContentMemo() で続きから'); break; }
    var r = rows[i];
    if (done[r.id]) continue;
    var content = String(r.content || '').trim();
    var memo = String(r.memo || '').trim();
    // 新しい社内メモ = 既存社内メモ ＋ 既存内容（内容側の作業ログを社内メモへ集約）
    var parts = [];
    if (memo) parts.push(memo);
    if (content) parts.push(content);
    var newMemo = parts.join('\n\n');
    if (!newMemo) { done[r.id] = 1; skipped++; continue; } // 中身が無い案件は対象外
    var newContent = summarizeForCustomer_(newMemo, '', r.customer_memo);
    var ok = migratePatch_(key, r.id, { memo: newMemo, content: newContent || null });
    if (ok) {
      done[r.id] = 1; processed++;
      props.setProperty('MIGRATE_MEMO_DONE', JSON.stringify(done)); // 1件ごとに保存＝再開に強い
    } else { failed++; Logger.log('✗ 移行失敗 id=' + r.id); }
  }
  var total = Object.keys(done).length;
  Logger.log('✅ 移行 今回:実行' + processed + ' スキップ' + skipped + ' 失敗' + failed +
    ' ／ 累計済 ' + total + '/' + rows.length + (total >= rows.length ? '（全件完了）' : ''));
  if (total >= rows.length) Logger.log('👉 完了しました。Supabaseの Webhook を元に戻してください。');
}
// 移行の進捗をリセット（最初からやり直す時だけ実行）
function migrateContentMemoReset() {
  PropertiesService.getScriptProperties().deleteProperty('MIGRATE_MEMO_DONE');
  Logger.log('移行の進捗記録をクリアしました。');
}
// 全案件を取得（id/content/memo/customer_memo）。1000件超はページング。
function migrateFetchAll_(key) {
  var out = [], from = 0, PAGE = 1000;
  for (var guard = 0; guard < 100; guard++) {
    var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?select=id,content,memo,customer_memo&order=created_at.asc', {
      method: 'get',
      headers: { apikey: key, Authorization: 'Bearer ' + key, Range: from + '-' + (from + PAGE - 1) },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 300) { Logger.log('移行 取得失敗: ' + res.getContentText()); break; }
    var batch = [];
    try { batch = JSON.parse(res.getContentText()) || []; } catch (e) {}
    out = out.concat(batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return out;
}
function migratePatch_(key, id, patch) {
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/cases?id=eq.' + encodeURIComponent(id), {
    method: 'patch', contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify(patch), muteHttpExceptions: true
  });
  return res.getResponseCode() < 300;
}

// ============================================================
//  【冪等・何度でも安全】内容(content)だけを社内メモ(memo)から作り直す
//  ------------------------------------------------------------
//  migrateContentMemo で社内メモへ生ログを集約した後、要約プロンプトを直した等の理由で
//  「内容」だけを作り直したい時に使う。**社内メモ(memo)は一切変更しない**ので、
//  何度実行しても二重化しない（migrateContentMemo と違い content↔memo の移動をしない）。
//
//  ★実行前に Webhook `case-updated` を必ず無効化（内容のPATCHで通知が飛ぶのを防ぐ）。
//  ・約5分で自動中断＆再開可（処理済みIDを RESUMMARIZE_DONE に記録）。
//  ・やり直しは resummarizeContentReset()。
// ============================================================
function resummarizeContentFromMemo() {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!key) { Logger.log('SUPABASE_SERVICE_ROLE_KEY未設定'); return; }
  if (!apiKey) { Logger.log('ANTHROPIC_API_KEY未設定'); return; }
  var props = PropertiesService.getScriptProperties();
  var done = {};
  try { done = JSON.parse(props.getProperty('RESUMMARIZE_DONE') || '{}') || {}; } catch (e) {}
  var rows = migrateFetchAll_(key);
  Logger.log('内容 再生成 対象: 全' + rows.length + '件（済 ' + Object.keys(done).length + '件）');
  var start = Date.now(), BUDGET = 5 * 60 * 1000;
  var changed = 0, same = 0, empty = 0, failed = 0;
  for (var i = 0; i < rows.length; i++) {
    if (Date.now() - start > BUDGET) { Logger.log('⏸ 時間切れ・中断。再度 resummarizeContentFromMemo() で続きから'); break; }
    var r = rows[i];
    if (done[r.id]) continue;
    var memo = String(r.memo || '').trim();
    var newContent = memo ? summarizeForCustomer_(memo, '', r.customer_memo) : '';
    var cur = String(r.content || '');
    if (String(newContent || '') === cur) { done[r.id] = 1; same++; continue; } // 変化なし＝PATCH不要
    var ok = migratePatch_(key, r.id, { content: newContent || null });
    if (ok) {
      done[r.id] = 1; changed++; if (!newContent) empty++;
      props.setProperty('RESUMMARIZE_DONE', JSON.stringify(done));
    } else { failed++; Logger.log('✗ 内容 再生成 失敗 id=' + r.id); }
  }
  var total = Object.keys(done).length;
  Logger.log('✅ 内容 再生成 今回:更新' + changed + '（うち空' + empty + '） 変化なし' + same + ' 失敗' + failed +
    ' ／ 累計済 ' + total + '/' + rows.length + (total >= rows.length ? '（全件完了）' : ''));
  if (total >= rows.length) Logger.log('👉 完了。Webhook `case-updated` を元のURLに戻してください。');
}
function resummarizeContentReset() {
  PropertiesService.getScriptProperties().deleteProperty('RESUMMARIZE_DONE');
  Logger.log('内容 再生成の進捗記録をクリアしました。');
}

// ===== 添付見積書のAI-OCR =====
// スレッド内の添付（画像/PDF）を走査し、最初に読めた見積書から
// {estimate_name, estimate_amount, quote_date} を返す。見つからなければ null。
function extractQuoteFromAttachments_(th) {
  var apiKey = cfg_('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  var msgs = th.getMessages();
  for (var i = 0; i < msgs.length; i++) {
    var atts = msgs[i].getAttachments({ includeInlineImages: true, includeAttachments: true });
    for (var j = 0; j < atts.length; j++) {
      var a = atts[j];
      var ct = String(a.getContentType() || '').toLowerCase();
      var isImg = ct.indexOf('image/') === 0;
      var isPdf = ct === 'application/pdf';
      if (!isImg && !isPdf) continue;                 // 見積書になり得るのは画像/PDFのみ
      if (a.getSize() > OCR_MAX_BYTES) { Logger.log('添付が大きすぎOCRスキップ: ' + a.getName()); continue; }
      var block = isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Utilities.base64Encode(a.getBytes()) } }
        : { type: 'image', source: { type: 'base64', media_type: normalizeImageMime_(ct), data: Utilities.base64Encode(a.getBytes()) } };
      var q = ocrQuote_(apiKey, block);
      if (q && (q.estimate_name || q.estimate_amount || q.quote_date)) {
        Logger.log('見積OCR成功: ' + a.getName() + ' → ' + JSON.stringify(q));
        return q;
      }
    }
  }
  return null;
}
// Anthropic API が受け付ける画像MIMEに寄せる（未対応は jpeg 扱い）
function normalizeImageMime_(ct) {
  if (ct.indexOf('png') >= 0) return 'image/png';
  if (ct.indexOf('gif') >= 0) return 'image/gif';
  if (ct.indexOf('webp') >= 0) return 'image/webp';
  return 'image/jpeg';
}
// 1件の添付（画像/PDFブロック）を視覚モデルでOCR。見積書でなければ空を返す。
function ocrQuote_(apiKey, mediaBlock) {
  var sys =
    'あなたは見積書の読み取りアシスタントです。画像/PDFを読み、JSONのみ出力（前後に文章なし）。\n' +
    'これが見積書（御見積書/お見積り/Quotation等）でなければ is_quote=false を返す。\n' +
    '見積書なら次を抽出: estimate_name=工事名/件名/工事件名（無ければ主な品目を要約）, ' +
    'estimate_amount=見積合計金額の数値のみ（税込があれば税込・カンマや¥や円は除く・整数）, ' +
    'quote_date=見積書の発行日/日付をYYYY-MM-DD。読めない項目は空文字。\n' +
    'スキーマ: {"is_quote":bool,"estimate_name":string,"estimate_amount":string,"quote_date":"YYYY-MM-DD"}';
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: OCR_MODEL_(), max_tokens: 400, system: sys,
      messages: [{ role: 'user', content: [mediaBlock, { type: 'text', text: 'この書類を読み取ってJSONで返してください。' }] }]
    }), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('OCR失敗: ' + res.getContentText()); return null; }
  var data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { return null; }
  var txt = (data.content && data.content[0] && data.content[0].text) || '';
  var j = safeJson_(txt);
  if (!j || j.is_quote === false) return null;
  return { estimate_name: j.estimate_name || '', estimate_amount: j.estimate_amount || '', quote_date: j.quote_date || '' };
}
// 「¥1,234,000」「1,234,000円」等 → 数値。変換できなければ null（送信しない）
function normalizeAmount_(v) {
  if (v === null || v === undefined) return null;
  var s = String(v).replace(/[^0-9.]/g, '');
  if (!s) return null;
  var n = Number(s);
  return isNaN(n) ? null : n;
}

// 進捗メモを読みやすく再整形: 各 [進捗 YYYY-MM-DD] の前に空行、直後に改行を入れる
function reformatProgress_(s) {
  s = String(s || '');
  // 見出しの前後の空白/改行を整える（見出し→改行→本文、見出しの前に空行）
  s = s.replace(/[ \t　]*\n?[ \t　]*(\[進捗\s*\d{4}-\d{2}-\d{2}\])[ \t　]*\n?[ \t　]*/g, '\n\n$1\n');
  s = s.replace(/\n{3,}/g, '\n\n');       // 空行が続きすぎたら1つに
  return s.replace(/^\s+/, '').replace(/\s+$/, '');
}

// ===== 内容の重複判定（似た進捗メモを二重に追記しない） =====
// 全角英数字→半角、記号・空白を落として比較用に正規化
function normalizeText_(s) {
  s = String(s || '').replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
  });
  return s.toLowerCase().replace(/[\s　、。．，\.\/\-ー―（）\(\)\[\]「」【】：:；;]/g, '');
}
// 2文字ずつの集合（バイグラム）を作る
function bigrams_(s) {
  var out = {}; var n = 0;
  for (var i = 0; i < s.length - 1; i++) { var g = s.substr(i, 2); if (!out[g]) { out[g] = 1; n++; } }
  return { set: out, count: n };
}
// note が既存 content に「丸ごと含まれる」か「よく似ている(バイグラム8割一致)」なら重複とみなす
function isDuplicateNote_(content, note) {
  var n = normalizeText_(note);
  if (!n) return true;                       // 空 → 追記不要
  var c = normalizeText_(content);
  if (!c) return false;
  if (c.indexOf(n) !== -1) return true;      // 既に丸ごと含む
  if (n.length < 6) return c.indexOf(n) !== -1; // 短文は完全一致のみ重複扱い
  var bg = bigrams_(n);
  if (!bg.count) return false;
  var hit = 0;
  for (var g in bg.set) if (c.indexOf(g) !== -1) hit++;
  return (hit / bg.count) >= 0.8;            // noteのバイグラムの8割が既存内容にある → ほぼ同じ
}

// ===== 共通 =====
function anthropicText_(apiKey, system, user, maxTokens) {
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: MODEL_(), max_tokens: maxTokens || 500, system: system,
      messages: [{ role: 'user', content: user }]
    }), muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) { Logger.log('Anthropic失敗: ' + res.getContentText()); return ''; }
  var data = JSON.parse(res.getContentText());
  return (data.content && data.content[0] && data.content[0].text) || '';
}
function safeJson_(txt) {
  if (!txt) return null;
  var s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if (s < 0 || e < 0) return null;
  try { return JSON.parse(txt.slice(s, e + 1)); } catch (err) { Logger.log('JSON解析失敗: ' + txt); return null; }
}

// ===== セットアップ補助 =====
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importCaseEmails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importCaseEmails').timeBased().everyMinutes(5).create();
  Logger.log('importCaseEmails を5分毎に実行するトリガーを作成しました。');
}
function testConnections() {
  var n = GmailApp.search('label:' + SRC_LABEL + ' -label:' + DONE_LABEL + ' newer_than:14d').length;
  Logger.log('Gmail「' + SRC_LABEL + '」未処理: ' + n + '件');
  Logger.log('Supabase接続（川崎の既存案件）: ' + fetchTheaterCases_('TOHOシネマズ 川崎').length + '件');
  Logger.log('ANTHROPIC_API_KEY: ' + (cfg_('ANTHROPIC_API_KEY') ? 'あり' : 'なし') +
    ' / SUPABASE_SERVICE_ROLE_KEY: ' + (cfg_('SUPABASE_SERVICE_ROLE_KEY') ? 'あり' : 'なし'));
}
