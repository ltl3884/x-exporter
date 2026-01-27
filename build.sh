#!/bin/bash

# 遇到错误立即退出
set -e

# 定义路径
EXTENSION_DIR="extension"
MANIFEST_FILE="$EXTENSION_DIR/manifest.json"

# 检查 manifest.json 是否存在
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: $MANIFEST_FILE not found!"
    exit 1
fi

# 提取版本号
VERSION=$(grep '"version":' "$MANIFEST_FILE" | cut -d '"' -f 4)

if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from manifest.json"
    exit 1
fi

# 定义输出文件名
OUTPUT_FILE="x_exporter_v${VERSION}.zip"

echo "Detected version: $VERSION"

# 清理旧的构建文件
if [ -f "$OUTPUT_FILE" ]; then
    echo "Removing old build: $OUTPUT_FILE"
    rm "$OUTPUT_FILE"
fi

echo "Packaging extension..."

# 进入 extension 目录进行打包
# 注意：Chrome Web Store 要求 zip 包解压后的根目录直接包含 manifest.json
cd "$EXTENSION_DIR"

# 打包文件
# -r: 递归目录
# -x: 排除文件 (如 .DS_Store, git文件等)
zip -r "../$OUTPUT_FILE" . -x "*.DS_Store" -x "*.git*" -x "__MACOSX/*"

cd ..

echo "----------------------------------------"
echo "✅ Build successful!"
echo "📁 Output file: $OUTPUT_FILE"
echo "----------------------------------------"
