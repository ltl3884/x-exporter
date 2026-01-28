# 构建说明 (Build Guide)

## 快速开始

### 1. 安装依赖（首次使用）

```bash
npm install
```

### 2. 构建扩展

#### 生产构建（启用 Minify）
```bash
npm run build
# 或
./build.sh
```

#### 开发构建（不压缩，便于调试）
```bash
npm run build:dev
# 或
MINIFY=false ./build.sh
```

## 构建产物

- **输出文件**: `x_exporter_v{VERSION}.zip`
- **版本号**: 自动从 `extension/manifest.json` 读取
- **文件大小**: ~36KB (minified)

## 构建流程

1. ✅ 读取版本号
2. ✅ 创建临时构建目录
3. ✅ 复制 extension 文件
4. ✅ 删除系统垃圾文件 (.DS_Store)
5. ✅ Minify content.js（使用 Terser）
6. ✅ 打包为 ZIP
7. ✅ 清理临时文件

## Minify 配置

使用 **Terser** 进行代码压缩：

- `--compress passes=2`: 两轮压缩优化
- `--mangle`: 变量名混淆
- `--comments false`: 删除注释
- `--ecma 2020`: 支持 ES2020 语法
- `drop_console=false`: **保留** console.log（便于调试）

## 环境要求

- Node.js >= 14
- npm >= 6

## 故障排除

### 问题：`npx: command not found`
**解决**: 安装 Node.js

```bash
# macOS
brew install node

# 或从官网下载
https://nodejs.org/
```

### 问题：构建失败
**解决**: 检查文件权限

```bash
chmod +x build.sh
```

### 问题：压缩后扩展无法运行
**解决**: 使用开发模式构建

```bash
npm run build:dev
```

## 发布流程

1. 更新版本号（在 `extension/manifest.json`）
2. 执行构建：`npm run build`
3. 上传 `x_exporter_v{VERSION}.zip` 到 Chrome Web Store

## 文件说明

| 文件 | 说明 |
|------|------|
| `package.json` | 项目配置 + npm scripts |
| `build.sh` | 构建脚本 |
| `.gitignore` | Git 忽略规则 |
| `node_modules/` | npm 依赖（不提交到 Git）|
| `build_temp/` | 临时构建目录（自动清理）|
