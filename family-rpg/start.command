#!/bin/sh
# きずなの紋章 家族サーバーを うごかす（Mac: ダブルクリックで うごく）
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js が みつかりません。https://nodejs.org/ja から LTS を インストールしてね。"
  read -r _
  exit 1
fi
node server/index.js
echo "おわりました。この まどは とじて OK です。"
