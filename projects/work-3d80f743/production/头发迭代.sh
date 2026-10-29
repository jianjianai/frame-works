#!/bin/bash
# 临时：画头发时一轮的命令（2026-10-29）：点写进两张线稿 → 换算（只出头发）→ 拷一份进 lib/_dev/ 给 sheets/_头部对照.ts 看
# 用法（在作品文件夹里）：bash production/头发迭代.sh <角色> <file>
set -e
mkdir -p lib/_dev
T=/data/libraries/frame-works/剪纸角色/tools
node $T/头发描点.mjs 写 "$1" "production/头发描点/$1.json" --force >/dev/null
node $T/线稿换算.mjs "$1" production/out --hair-only
sed 's|from "./rig"|from "@materials/剪纸角色/code/rig"|' "production/out/cast-$2-hair.ts.txt" > "lib/_dev/$2-hair.ts"
