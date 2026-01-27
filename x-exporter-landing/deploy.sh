#!/bin/bash

# 检查 vercel 是否安装
if ! command -v vercel &> /dev/null; then
    echo "错误: 未找到 vercel 命令。请先安装 Vercel CLI (npm i -g vercel)。"
    exit 1
fi

echo "正在部署到 Vercel (Production)..."

# 执行部署命令
# --prod: 部署到生产环境
# --yes: 跳过确认提示，使用默认设置
DEPLOY_URL=$(vercel deploy --prod --yes)

# 检查部署是否成功
if [ $? -eq 0 ]; then
    echo "✅ 部署成功!"
    echo "🔗 URL: $DEPLOY_URL"
    
    # 自动打开浏览器 (macOS)
    if command -v open &> /dev/null; then
        echo "🚀 正在打开预览链接..."
        open "$DEPLOY_URL"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$DEPLOY_URL"
    fi
else
    echo "❌ 部署失败。"
    echo "错误信息:"
    echo "$DEPLOY_URL"
fi
