/**
 * 客先への通知メール（TOHO の要望④・2026-11-16）
 *
 * しくみ:
 *  ・菱熱がアプリで案件を動かすと（内容を書いた・作業開始日を入れた・見積書や作業申請書を付けた）、
 *    Supabase に「通知の予定」(case_mail_events) が積まれる（SETUP_CASE_MAIL.sql のしくみ）。
 *    メール・LINE の取り込み（AI）や客先がメモを直した時は積まれないので、返信がまた通知を呼ぶ「ループ」にならない。
 *  ・5分ごとにこのファイルの sendCaseMails が動き、最後の予定から5分たった案件を、案件ごとに1通にまとめて送る。
 *    送り主は、このスクリプトを動かしている Gmail（小山さんのアドレス）。返信も同じ Gmail に届く。
 *  ・宛先: その案件の劇場のアドレス（必ず）＋ 案件の「TOHOシネマズ担当者」と同じ担当者名のアドレス（必ず）＋ ベルを ON にした人。
 *    菱熱（@ryonetsu.com / @ryonetsu-ai.com）には送らない（LINE の通知があるため）。
 *  ・設定（アプリの「📨 メール通知設定」で切り替え。app_settings の case_mail）:
 *      mode = 'test'（試し: テスト劇場の案件だけを、テストの宛先 test_to だけに送る。客先には送らない）/ 'live'（本番: 全部の案件）/ 'off'（送らない）
 *      sender = 送り主にしたいアドレス（例 tc-hvac-desk@ryonetsu.com）。Gmail の「他のアドレスからメールを送信」に登録・確認が済んでいれば
 *               そのアドレスで送る。まだなら、このスクリプトを動かしている Gmail のアドレスで送る。
 *    実際に使ったアドレス・別名が使えるか・最後に送った時刻は app_settings の case_mail_status に残す（アプリの画面に出す）。
 *    送らなかった予定は「送らない」と記録して消化する（あとで本番にした時にまとめて飛ばないように）。
 *  ・送ったメールは案件の「メールの記録」(case_mail_log) に残す。客先の返信は Code.gs の取り込みが記録に残し、案件の更新にも使う。
 *
 * 有効にする: Supabase で SETUP_CASE_MAIL.sql → このファイルを貼る → setupCaseMailTrigger() を1回だけ実行（5分ごとのトリガーを作る）。
 * ※ Code.gs と同じプロジェクトに置く（cfg_ / SUPABASE_URL_ を使う）。
 */

var CASE_MAIL_QUIET_MS = 5 * 60 * 1000;       // 最後の予定から5分たったら送る（続けて直した分をまとめる）
var CASE_MAIL_MAX_WAIT_MS = 30 * 60 * 1000;   // 直し続けていても、最初の予定から30分たったら送る
var CASE_MAIL_MAX_ATTACH = 20 * 1024 * 1024;  // 添付の合計の上限（Gmail は 25MB まで）
var CASE_MAIL_TAG_RE = /\[案件#([0-9a-f]{8})\]/i;
var CASE_MAIL_FOOTER = '※ このメールは菱熱工業の案件管理から自動でお送りしています。';
var CASE_MAIL_SENDER_NAME = '菱熱工業';
var CASE_MAIL_MINE_UNKNOWN = 'このスクリプトを動かしている Gmail（最初の通知メールを送ると、アドレスが出ます）';   // 通知メールの差出人の名前（自分の通知メールを見分ける印にも使う）
// ※ 自分のアドレスは、送った通知メールの差出人から読む（ほかの取り方は Google の許可を新しく取り直す必要があるため）。
//    差出人の名前「菱熱工業」と、決まりの一文で、自分の通知メールを見分ける。
var CASE_MAIL_APP_URL = 'https://cinema-cases.vercel.app';
var CASE_MAIL_KIND_ORDER = { content: 1, work_start: 2, quote: 3, workapp: 4 };

// ===== Supabase（サービスキー） =====
function cmReq_(method, path, body, prefer) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 未設定');
  var opt = { method: method, headers: { apikey: key, Authorization: 'Bearer ' + key }, muteHttpExceptions: true };
  if (prefer) opt.headers.Prefer = prefer;
  if (body !== undefined) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(body); }
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/rest/v1/' + path, opt);
  var code = res.getResponseCode();
  if (code >= 300) throw new Error(method + ' ' + path.split('?')[0] + ' (' + code + '): ' + res.getContentText().slice(0, 300));
  var t = res.getContentText();
  if (!t) return null;
  try { return JSON.parse(t); } catch (e) { return null; }
}
function cmGet_(path) { return cmReq_('get', path) || []; }
function cmEnc_(s) { return encodeURIComponent(String(s)); }

function caseMailSettings_() {
  try {
    var rows = cmGet_('app_settings?key=eq.case_mail&select=value');
    var v = rows.length ? rows[0].value : null;
    if (v && typeof v === 'object') return {
      mode: String(v.mode || 'test'),
      testTheaters: Array.isArray(v.test_theaters) ? v.test_theaters.map(String) : [],
      testTo: (Array.isArray(v.test_to) ? v.test_to : []).map(function (x) { return String(x).trim().toLowerCase(); }).filter(cmValidEmail_),
      sender: String(v.sender || '').trim().toLowerCase()
    };
  } catch (e) { Logger.log('通知メールの設定を読めない: ' + e); }
  return { mode: 'test', testTheaters: ['TOHOシネマズ テスト劇場'], testTo: [], sender: '' };
}

// ===== 送り主（別名）と、画面に出す状態 =====
// このスクリプトを動かしている Gmail のアドレス: 送った通知メール（送信済み）の差出人から読む。
// まだ一度も送っていなければ ''（画面には「まだ確認できていません」と出る）
function cmMyAddressFromSent_() {
  try {
    var threads = GmailApp.search('in:sent subject:(菱熱工業 お知らせ 案件) newer_than:60d', 0, 5);
    for (var i = 0; i < threads.length; i++) {
      var ms = threads[i].getMessages();
      for (var j = ms.length - 1; j >= 0; j--) if (caseMailIsOurNotice_(ms[j])) return cmAddrOf_(ms[j].getFrom());
    }
  } catch (e) {}
  return '';
}
// 送り主: 別名が Gmail に登録済みなら別名、まだならこの Gmail（known＝前に確かめたこの Gmail のアドレス）
function cmSender_(settings, known) {
  var aliases = [];
  try { aliases = (GmailApp.getAliases() || []).map(function (a) { return String(a).toLowerCase(); }); } catch (e) {}
  var want = settings.sender || '';
  var ok = !!want && aliases.indexOf(want) !== -1;
  var mine = known || '';
  var used = ok ? want : (mine || CASE_MAIL_MINE_UNKNOWN);
  return { from: ok ? want : '', used: used, mine: mine, want: want, aliasOk: ok, aliases: aliases };
}
function cmSaveStatus_(patch) {
  try {
    var cur = cmGet_('app_settings?key=eq.case_mail_status&select=value');
    var v = Object.assign({}, (cur.length && cur[0].value) || {}, patch, { checked_at: new Date().toISOString() });
    cmReq_('post', 'app_settings?on_conflict=key', { key: 'case_mail_status', value: v, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
  } catch (e) { Logger.log('通知メールの状態を残せない: ' + e); }
}
// 送り主の状態を、変わった時か1時間ごとに残す（アプリの「📨 メール通知設定」に、今の送り主として出す）
function cmRefreshStatus_(settings) {
  try {
    var cur = cmGet_('app_settings?key=eq.case_mail_status&select=value');
    var v = (cur.length && cur[0].value) || {};
    var stale = !v.checked_at || (Date.now() - new Date(v.checked_at).getTime()) > 60 * 60 * 1000;
    var mine = v.my_address || (stale ? cmMyAddressFromSent_() : '');
    var s = cmSender_(settings, mine);
    if (stale || v.sender_used !== s.used || v.sender_want !== s.want || v.alias_ok !== s.aliasOk || v.mode !== settings.mode || (mine && v.my_address !== mine)) {
      cmSaveStatus_({ sender_used: s.used, sender_want: s.want, alias_ok: s.aliasOk, mode: settings.mode, my_address: mine });
    }
  } catch (e) { Logger.log('通知メールの状態を確かめられない: ' + e); }
}

// ===== 宛先 =====
function cmIsRyonetsu_(email) { return /@ryonetsu(-ai)?\.com$/i.test(String(email || '')); }
function cmValidEmail_(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '')); }
// 担当者名を比べられる形に（空白・敬称を取る）
function cmPersonKey_(s) {
  s = String(s || '');
  try { s = s.normalize('NFKC'); } catch (e) {}
  return s.replace(/[\s　]/g, '').replace(/(さん|様|さま|殿|氏)$/g, '');
}
// 案件の「TOHOシネマズ担当者」（tc_person）と、アカウントの担当者名が同じ人か。
// 「青木」と「青木太郎」のように、片方がもう片方の頭と同じ（2文字以上）なら同じ人とみなす。
function cmPersonMatch_(casePerson, accPerson) {
  var a = cmPersonKey_(casePerson), b = cmPersonKey_(accPerson);
  if (!a || !b) return false;
  if (a === b) return true;
  var shortS = a.length < b.length ? a : b, longS = a.length < b.length ? b : a;
  return shortS.length >= 2 && longS.indexOf(shortS) === 0;
}
// 案件の通知の宛先 → [{ email, why }]
function caseMailRecipients_(c, accounts, watchers) {
  var out = [], seen = {};
  function add(email, why) {
    email = String(email || '').trim().toLowerCase();
    if (!cmValidEmail_(email) || cmIsRyonetsu_(email) || seen[email]) return;
    seen[email] = 1; out.push({ email: email, why: why });
  }
  accounts.forEach(function (a) {
    if (a.theater && c.theater && a.theater === c.theater) add(a.email, '劇場');
  });
  // 担当者は、その案件の会社の人だけ（別の会社の同じ名字の人に送らない）
  String(c.tc_person || '').split(/[、,，\/／・]/).forEach(function (p) {
    if (!cmPersonKey_(p)) return;
    accounts.forEach(function (a) {
      if (a.person && (!a.company || a.company === c.company) && cmPersonMatch_(p, a.person)) add(a.email, '担当者');
    });
  });
  (watchers || []).forEach(function (w) { add(w.email, 'ベル'); });
  return out;
}

// ===== 文面 =====
function cmShortTheater_(name) {
  try {
    var rows = cmGet_('theaters?name=eq.' + cmEnc_(name) + '&select=short_name');
    if (rows.length && rows[0].short_name) return String(rows[0].short_name);
  } catch (e) {}
  return String(name || '').replace(/^(TOHOシネマズ|109シネマズ|ユナイテッド・?シネマ|イオンシネマ|MOVIX|コロナシネマワールド|グランドシネマサンシャイン|シネマサンシャイン)\s*/, '') || String(name || '');
}
function cmFmtDate_(d) {
  if (!d) return '';
  var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? (Number(m[1]) + '年' + Number(m[2]) + '月' + Number(m[3]) + '日') : String(d);
}
function caseMailSubject_(c, shortName) {
  var what = String(c.title || '').trim() || String(c.category || '').trim() || 'ご依頼の件';
  return '【菱熱工業】' + shortName + ' ' + what + ' のお知らせ [案件#' + String(c.id).replace(/-/g, '').slice(0, 8) + ']';
}
function caseMailBody_(c, events, files) {
  var lines = [];
  lines.push((c.company || '') + ' ご担当者様');
  lines.push('');
  lines.push('いつもお世話になっております。菱熱工業です。');
  lines.push('下記の案件について、お知らせいたします。');
  lines.push('');
  lines.push('■ 劇場: ' + (c.theater || ''));
  if (c.title) lines.push('■ 案件名: ' + c.title);
  lines.push('■ お知らせ:');
  var kinds = {};
  events.forEach(function (e) { kinds[e.kind] = kinds[e.kind] || []; kinds[e.kind].push(e); });
  if (kinds.content) {
    var isNew = kinds.content.some(function (e) { return e.detail === 'new'; });
    lines.push('　・' + (isNew ? '案件を登録しました。' : '内容を更新しました。'));
  }
  if (kinds.work_start && c.work_start_date) lines.push('　・作業開始日: ' + cmFmtDate_(c.work_start_date) + (c.work_start_time ? ' ' + String(c.work_start_time).slice(0, 5) : ''));
  files.forEach(function (f) {
    lines.push('　・' + (f.kind === 'workapp' ? '作業申請書' : '見積書') + 'を添付します（' + f.name + '）' + (f.attached ? '' : ' ※大きいため添付できませんでした。担当よりお送りします。'));
  });
  if (c.content) {
    lines.push('');
    lines.push('■ 内容:');
    String(c.content).split(/\r?\n/).forEach(function (l) { lines.push('　' + l); });
  }
  lines.push('');
  lines.push('ご不明な点は、このメールにそのままご返信ください（案件の記録に残ります）。');
  lines.push('案件の一覧: ' + CASE_MAIL_APP_URL);
  lines.push('');
  lines.push('菱熱工業株式会社');
  lines.push('');
  lines.push(CASE_MAIL_FOOTER);
  return lines.join('\n');
}

// ===== 送る（5分ごと） =====
function sendCaseMails() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var settings = caseMailSettings_();
    cmRefreshStatus_(settings);
    var open = cmGet_('case_mail_events?sent_at=is.null&select=id,case_id,kind,detail,created_at&order=created_at.asc&limit=500');
    if (!open.length) return;
    var byCase = {};
    open.forEach(function (e) { (byCase[e.case_id] = byCase[e.case_id] || []).push(e); });
    var now = Date.now(), nSent = 0, nSkip = 0;
    Object.keys(byCase).forEach(function (caseId) {
      var evs = byCase[caseId];
      var first = new Date(evs[0].created_at).getTime(), last = new Date(evs[evs.length - 1].created_at).getTime();
      if (now - last < CASE_MAIL_QUIET_MS && now - first < CASE_MAIL_MAX_WAIT_MS) return;   // まだ直している途中かも
      try {
        var r = sendOneCaseMail_(caseId, evs, settings);
        if (r === 'sent') nSent++; else nSkip++;
      } catch (e) {
        Logger.log('通知メール（案件 ' + caseId + '）でエラー: ' + e);   // 印を付けない＝次の回にもう一度
      }
    });
    if (nSent || nSkip) Logger.log('通知メール: 送った ' + nSent + ' 件 / 送らなかった ' + nSkip + ' 件（モード: ' + settings.mode + '）');
  } catch (e) {
    Logger.log('sendCaseMails error: ' + e);
  } finally {
    lock.releaseLock();
  }
}

function cmMarkEvents_(evs, note) {
  var ids = evs.map(function (e) { return e.id; }).join(',');
  cmReq_('patch', 'case_mail_events?id=in.(' + ids + ')', { sent_at: new Date().toISOString(), note: note || '' }, 'return=minimal');
}

function sendOneCaseMail_(caseId, evs, settings) {
  var rows = cmGet_('cases?id=eq.' + cmEnc_(caseId) + '&select=id,company,theater,title,category,content,tc_person,work_start_date,work_start_time');
  if (!rows.length) { cmMarkEvents_(evs, '案件が見つからない（消された）'); return 'skip'; }
  var c = rows[0];
  if (settings.mode === 'off') { cmMarkEvents_(evs, '通知メールは止めている'); return 'skip'; }
  var isTest = settings.testTheaters.indexOf(String(c.theater || '')) !== -1;
  if (settings.mode !== 'live' && !isTest) { cmMarkEvents_(evs, '試しモードのため送らず（テスト劇場ではない）'); return 'skip'; }

  var accounts = cmGet_('customer_accounts?select=email,company,theater,person');
  var watchers = cmGet_('case_watchers?case_id=eq.' + cmEnc_(caseId) + '&select=email');
  var realTo = caseMailRecipients_(c, accounts, watchers);
  var to = realTo;
  var isTrial = settings.mode !== 'live';
  if (isTrial) {
    // 試し: 客先には送らない。テストの宛先だけに送る（本文の頭に、本番ならだれに届くかを書く）
    if (!settings.testTo.length) { cmMarkEvents_(evs, '試しモード: テストの宛先が未設定のため送らず'); return 'skip'; }
    to = settings.testTo.map(function (e) { return { email: e, why: 'テストの宛先' }; });
  } else if (!to.length) { cmMarkEvents_(evs, '宛先なし（劇場・担当者のアドレスが未登録で、ベルの人もいない）'); return 'skip'; }

  // 付ける書類（予定に書いてある書類 id。消された書類は付けない）
  var fileIds = evs.filter(function (e) { return (e.kind === 'quote' || e.kind === 'workapp') && e.detail; }).map(function (e) { return e.detail; });
  var files = [], blobs = [], total = 0;
  if (fileIds.length) {
    var fr = cmGet_('case_files?id=in.(' + fileIds.join(',') + ')&deleted_at=is.null&select=id,kind,name,path,mime,size&order=created_at.asc');
    fr.forEach(function (f) {
      var item = { kind: f.kind, name: f.name, attached: false };
      try {
        if (total + Number(f.size || 0) <= CASE_MAIL_MAX_ATTACH && f.path) {
          var b = cmDownload_('case-files', f.path);
          if (b) { b.setName(f.name || 'file'); total += b.getBytes().length; if (total <= CASE_MAIL_MAX_ATTACH) { blobs.push(b); item.attached = true; } }
        }
      } catch (e) { Logger.log('書類を読めない（' + f.name + '）: ' + e); }
      files.push(item);
    });
  }
  var evsShown = evs.slice().sort(function (a, b) { return (CASE_MAIL_KIND_ORDER[a.kind] || 9) - (CASE_MAIL_KIND_ORDER[b.kind] || 9); });
  // 書類だけの予定で書類がすべて消されていたら送らない
  var hasOther = evs.some(function (e) { return e.kind === 'content' || e.kind === 'work_start'; });
  if (!hasOther && !files.length) { cmMarkEvents_(evs, '付ける書類が消されていた'); return 'skip'; }

  // ※ 1日に送れる数（Gmail の上限）を超えると sendEmail がエラーになる → 印を付けないので、次の回にもう一度送る
  //   （残りの数を調べる方法は、Google の許可を新しく取り直す必要があるので使わない）

  var subject = (isTrial ? '【試し】' : '') + caseMailSubject_(c, cmShortTheater_(c.theater));
  var body = caseMailBody_(c, evsShown, files);
  if (isTrial) {
    body = '【試し】これは通知メールの試しの送信です（客先には送っていません）。\n本番では、次の宛先に送ります: ' +
      (realTo.length ? realTo.map(function (x) { return x.email + '（' + x.why + '）'; }).join('、') : '（まだ登録されていません）') +
      '\n────────────────\n\n' + body;
  }
  var addrs = to.map(function (x) { return x.email; }).join(',');
  var snd = cmSender_(settings, '');
  var opt = { name: CASE_MAIL_SENDER_NAME, attachments: blobs };
  if (snd.from) opt.from = snd.from;
  GmailApp.sendEmail(addrs, subject, body, opt);
  var mine = cmMyAddressFromSent_();   // 送ったばかりの通知メールから、この Gmail のアドレスを読む
  snd.used = snd.from || mine || CASE_MAIL_MINE_UNKNOWN;
  cmSaveStatus_({ sender_used: snd.used, sender_want: snd.want, alias_ok: snd.aliasOk, mode: settings.mode, my_address: mine,
    last_sent_at: new Date().toISOString(), last_to: addrs, last_subject: subject });
  cmMarkEvents_(evs, '送った: ' + to.map(function (x) { return x.email + '（' + x.why + '）'; }).join(' / '));
  try {
    cmReq_('post', 'case_mail_log', {
      case_id: String(c.id), direction: 'out', to_addrs: addrs, from_addr: CASE_MAIL_SENDER_NAME + ' <' + (snd.from || mine || '') + '>',
      subject: subject, body: body, attachments: files.filter(function (f) { return f.attached; }).map(function (f) { return f.name; }).join(' / '),
      test: settings.mode !== 'live'
    }, 'return=minimal');
  } catch (e) { Logger.log('メールの記録に失敗: ' + e); }
  return 'sent';
}

function cmDownload_(bucket, path) {
  var key = cfg_('SUPABASE_SERVICE_ROLE_KEY');
  var res = UrlFetchApp.fetch(SUPABASE_URL_() + '/storage/v1/object/' + bucket + '/' + String(path).split('/').map(encodeURIComponent).join('/'), {
    method: 'get', headers: { apikey: key, Authorization: 'Bearer ' + key }, muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) throw new Error('ダウンロード失敗 (' + res.getResponseCode() + ')');
  return res.getBlob();
}

// ===== 客先からの返信（Code.gs の取り込みから呼ぶ） =====
// 件名の [案件#xxxxxxxx] から案件を探す。見つかれば案件の行を返す
function caseMailCaseOfThread_(th) {
  var m = String(th.getFirstMessageSubject() || '').match(CASE_MAIL_TAG_RE);
  if (!m) return null;
  var head = m[1].toLowerCase();
  var lo = head.slice(0, 8) + '-0000-0000-0000-000000000000', hi = head.slice(0, 8) + '-ffff-ffff-ffff-ffffffffffff';
  try {
    var rows = cmGet_('cases?id=gte.' + lo + '&id=lte.' + hi + '&select=id&limit=2');
    return rows.length === 1 ? String(rows[0].id) : null;
  } catch (e) { Logger.log('通知メールの案件を探せない: ' + e); return null; }
}
function cmAddrOf_(from) { var m = String(from || '').match(/<([^>]+)>/); return (m ? m[1] : String(from || '')).trim().toLowerCase(); }
// このメールは、こちらが送った通知メールそのものか（差出人の名前が「菱熱工業」で、決まりの一文が入っている）
function caseMailIsOurNotice_(msg) {
  var from = String(msg.getFrom() || '').trim().replace(/^"/, '');
  return from.indexOf(CASE_MAIL_SENDER_NAME + ' <') === 0 || from.indexOf(CASE_MAIL_SENDER_NAME + '" <') === 0
    ? String(msg.getPlainBody() || '').indexOf(CASE_MAIL_FOOTER) !== -1 : false;
}
// 返ってきたメール（自分以外から）を案件の記録に残す（同じメールは2回残さない）
function caseMailLogReplies_(th, caseId) {
  var msgs = th.getMessages();
  // 自分のアドレス＝このやり取りの中の、自分の通知メールの差出人
  var mine = {};
  msgs.forEach(function (mm) { if (caseMailIsOurNotice_(mm)) mine[cmAddrOf_(mm.getFrom())] = 1; });
  msgs.forEach(function (mm) {
    var from = String(mm.getFrom() || '');
    var addr = cmAddrOf_(from);
    if (mine[addr] || cmIsRyonetsu_(addr)) return;   // 自分・菱熱のメールは「返ってきたメール」にしない
    try {
      cmReq_('post', 'case_mail_log?on_conflict=message_id', {
        case_id: caseId, direction: 'in', from_addr: from, to_addrs: String(mm.getTo() || ''),
        subject: String(mm.getSubject() || ''), body: String(mm.getPlainBody() || '').slice(0, 20000),
        message_id: mm.getId(), created_at: mm.getDate().toISOString()
      }, 'resolution=ignore-duplicates,return=minimal');
    } catch (e) { Logger.log('返信の記録に失敗: ' + e); }
  });
}

// 通知メールへの返信に「案件登録」のラベルを付ける（Gmail のフィルタに合わない差出人＝テスト用のアドレスなどの返信も取り込むため）
function caseMailLabelReplies_() {
  try {
    var threads = GmailApp.search('subject:(菱熱工業 お知らせ 案件) newer_than:2d -label:' + SRC_LABEL, 0, 20);
    if (!threads.length) return;
    var lbl = getOrCreateLabel_(SRC_LABEL);
    threads.forEach(function (th) {
      if (!CASE_MAIL_TAG_RE.test(String(th.getFirstMessageSubject() || ''))) return;
      var msgs = th.getMessages();
      if (caseMailIsOurNotice_(msgs[msgs.length - 1])) return;   // まだ返信が無い
      th.addLabel(lbl);
    });
  } catch (e) { Logger.log('通知メールの返信を探せない: ' + e); }
}

// ===== トリガー =====
// 5分ごとに sendCaseMails を動かすトリガーを作る（あれば作り直す）。最初に1回だけ実行する
function setupCaseMailTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendCaseMails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendCaseMails').timeBased().everyMinutes(5).create();
  Logger.log('sendCaseMails を5分ごとに動かすトリガーを作りました。');
}
