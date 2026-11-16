#!/bin/bash
cd "$(dirname "$0")" || exit 1
/bin/bash scripts/open-devtools.sh
result=$?
if [ "$result" -ne 0 ]; then
  echo "启动失败，可在微信开发者工具中手动导入当前文件夹。"
  read -r -p "按回车关闭…"
fi
exit "$result"
