#!/bin/bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
if [ ! -x "$CLI" ]; then
  echo "未找到微信开发者工具，请安装到 /Applications。"
  exit 1
fi
if "$CLI" open --project "$PROJECT_DIR" "$@"; then
  exit 0
fi
echo "若服务端口未开启，请在开发者工具设置中开启后重试。"
echo "也可在开发者工具中导入此目录：$PROJECT_DIR"
exit 1
