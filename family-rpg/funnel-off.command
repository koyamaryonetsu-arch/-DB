#!/bin/sh
# 外出先からの アクセスを やめる（Mac: ダブルクリック）
cd "$(dirname "$0")" || exit 1
node server/funnel-cli.js off
echo "この まどは とじて OK です。"
