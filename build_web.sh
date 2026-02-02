#!/bin/bash
# 构建 Web 前端并生成 Qt 资源文件

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/src/web"
DIST_DIR="$WEB_DIR/dist"
QRC_FILE="$SCRIPT_DIR/web_resources.qrc"

echo "=== 构建 Web 前端 ==="
cd "$WEB_DIR"
npm run build

echo "=== 生成 Qt 资源文件 ==="
cat > "$QRC_FILE" << 'EOF'
<RCC>
    <qresource prefix="/web">
EOF

# 添加所有构建产物到资源文件
cd "$SCRIPT_DIR"
find src/web/dist -type f | while read file; do
    # 获取相对于 dist 的路径作为 alias
    alias_path="${file#src/web/dist/}"
    echo "        <file alias=\"$alias_path\">$file</file>" >> "$QRC_FILE"
done

cat >> "$QRC_FILE" << 'EOF'
    </qresource>
</RCC>
EOF

echo "=== 资源文件生成完成: $QRC_FILE ==="
cat "$QRC_FILE"
