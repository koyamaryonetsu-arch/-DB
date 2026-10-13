// Claude（Anthropic）の呼び出しをまとめた共通部品。
// 最新のモデル（Haiku 5.5 / Sonnet 5.5）は呼び方の注意点があるので、ここで1か所にまとめて扱う:
//   - 答えの前に「考えた内容(thinking)」のかたまりが付くことがある → text のかたまりを探して読む
//   - 考える分も上限(max_tokens)に数える → 上限に余裕を持たせ、考える量(effort)を指定する
//   - 温度(temperature)などの指定はエラーになる → 送らない
//   - Sonnet 5.5 は安全機能で応答を断られた時に自動で別モデルへ切り替えられる（fallbacks: "default"）
// 失敗した時は prevModel（以前のモデル）でやり直す。

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// 「考える量(effort)」を指定できるモデルか（以前の Haiku 4.5 などは指定するとエラーになる）
function supportsEffort(model) { return !/haiku-4|sonnet-4-5|claude-3/.test(String(model || '')); }
// 断られた時の自動切替（fallbacks: "default"）が使えるモデルか
function supportsFallback(model) { return /^claude-(sonnet-5-5|opus-5|fable-5)/.test(String(model || '')); }

// 応答から「文章(text)」のかたまりを取り出す
export function responseText(data) {
  const blocks = (data && data.content) || [];
  const t = blocks.find((b) => b && b.type === 'text');
  return (t && t.text) || '';
}

// content は文字列、または画像・PDFを含むかたまりの配列。
// 戻り値: { text, error } … 失敗・断られた時は text が空で error に理由
export async function claudeText({ model, prevModel, system, content, maxTokens, effort }) {
  const send = async (m) => {
    const body = { model: m, max_tokens: maxTokens || 1000, messages: [{ role: 'user', content }] };
    if (system) body.system = system;
    const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' };
    if (supportsEffort(m)) {
      body.max_tokens = Math.max(body.max_tokens, 4000);
      body.output_config = { effort: effort || 'low' };
    }
    if (supportsFallback(m)) {
      body.fallbacks = 'default';
      headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    }
    return fetch(ANTHROPIC_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  };
  let r = await send(model);
  if (!r.ok && prevModel && prevModel !== model) {
    console.error(`Claude失敗（${model}）。以前のモデル（${prevModel}）でやり直します`, r.status, await r.text());
    r = await send(prevModel);
  }
  if (!r.ok) {
    const detail = await r.text();
    console.error('Claude失敗', r.status, detail);
    return { text: '', error: `Anthropic ${r.status}: ${detail}` };
  }
  const data = await r.json();
  if (data.stop_reason === 'refusal') {
    console.error('Claude: AIが応答を断りました');
    return { text: '', error: 'AIが応答を断りました' };
  }
  return { text: responseText(data), error: '' };
}
