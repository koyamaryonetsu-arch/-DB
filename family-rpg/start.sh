#!/bin/sh
# きずなの紋章 家族サーバーを うごかす（Linux）
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js が みつかりません。https://nodejs.org/ja から LTS を インストールしてね。"
  exit 1
fi
exec node server/index.js
