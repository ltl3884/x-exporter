#!/bin/bash

# 遇到错误立即退出
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 定义路径
EXTENSION_DIR="extension"
MANIFEST_FILE="$EXTENSION_DIR/manifest.json"
BUILD_DIR="build_temp"

# 是否启用 Minify (默认启用)
MINIFY=${MINIFY:-true}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  X Exporter Build Script${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查 manifest.json 是否存在
if [ ! -f "$MANIFEST_FILE" ]; then
    echo -e "${RED}Error: $MANIFEST_FILE not found!${NC}"
    exit 1
fi

# 提取版本号
VERSION=$(grep '"version":' "$MANIFEST_FILE" | cut -d '"' -f 4)

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not extract version from manifest.json${NC}"
    exit 1
fi

echo -e "${GREEN}📦 Version: $VERSION${NC}"
echo -e "${YELLOW}⚙️  Minify: $MINIFY${NC}"
echo ""

# 定义输出文件名
OUTPUT_FILE="x_exporter_v${VERSION}.zip"

# 清理旧的构建文件
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}🗑️  Removing old build: $OUTPUT_FILE${NC}"
    rm "$OUTPUT_FILE"
fi

# 清理并创建临时构建目录
echo -e "${BLUE}📁 Creating build directory...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 复制文件到临时目录
echo -e "${BLUE}📋 Copying files...${NC}"
cp -r "$EXTENSION_DIR"/* "$BUILD_DIR"/

# 删除 .DS_Store 文件
find "$BUILD_DIR" -name ".DS_Store" -type f -delete

# Minify content.js (如果启用)
if [ "$MINIFY" = "true" ]; then
    echo -e "${BLUE}🔧 Minifying content.js...${NC}"
    
    # 检查是否安装了 terser
    if command -v npx &> /dev/null; then
        # 检查 node_modules 中是否有 terser
        if [ ! -d "node_modules/terser" ]; then
            echo -e "${YELLOW}⚠️  terser not found, installing...${NC}"
            npm install
        fi
        
        # 使用 terser 压缩
        npx terser "$BUILD_DIR/content.js" \
            --compress passes=2,drop_console=false \
            --mangle \
            --output "$BUILD_DIR/content.js" \
            --comments false \
            --ecma 2020
        
        echo -e "${GREEN}✅ Minify completed${NC}"
    else
        echo -e "${YELLOW}⚠️  npx not found, skipping minify. Please install Node.js.${NC}"
        MINIFY="skipped"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping minify (dev mode)${NC}"
fi

# 打包文件
echo -e "${BLUE}📦 Packaging extension...${NC}"
cd "$BUILD_DIR"
zip -r "../$OUTPUT_FILE" . -x "*.DS_Store" -x "*.git*" -x "__MACOSX/*" > /dev/null
cd ..

# 清理临时目录
echo -e "${BLUE}🧹 Cleaning up...${NC}"
rm -rf "$BUILD_DIR"

# 获取文件大小
FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Build successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📁 Output file: $OUTPUT_FILE${NC}"
echo -e "${GREEN}📊 File size: $FILE_SIZE${NC}"
echo -e "${GREEN}🔧 Minified: $MINIFY${NC}"
echo -e "${GREEN}========================================${NC}"
