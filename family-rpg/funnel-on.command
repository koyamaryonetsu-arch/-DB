#!/bin/sh
# 家族サーバーを 外出先からも 開ける ように する（Mac: ダブルクリック）
cd "$(dirname "$0")" || exit 1
node server/funnel-cli.js on
echo "この まどは とじて OK です。"
