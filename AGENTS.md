# AGENTS.md
# 自动化编码代理仓库指南

## 仓库概览
- 本项目是 X (Twitter) 关注者抓取工具，以 **浏览器扩展 (Chrome/Edge Extension)** 形式存在。
- 核心功能：在 X 网页端抓取蓝V认证者、关注者、正在关注列表，并导出 CSV。
- 技术栈：原生 JavaScript (Manifest V3), 无外部依赖。
- 核心逻辑位于: `extension/content.js`

## 运行与测试
- **加载方式**:
  1. 打开浏览器扩展管理页面 (`chrome://extensions/`)
  2. 开启 "开发者模式"
  3. 点击 "加载已解压的扩展程序"
  4. 选择本仓库下的 `extension/` 目录
- **使用流程**:
  1. 进入 X 页面 (如 `https://x.com/username/followers`)
  2. 页面右下角会出现悬浮面板
  3. 面板根据当前 URL 自动高亮可用的导出按钮
  4. 配置参数（滚动间隔、次数等）后点击导出按钮
  5. 脚本自动滚动抓取，结束后自动下载 CSV

## 规则文件
- 未发现 .cursor/rules/ 或 .cursorrules

## 代码风格
- **基准**: 以 `extension/content.js` 为准
- **规范**:
  - Class 结构组织代码 (XExporter 类)
  - 使用 4 空格缩进
  - 变量命名 camelCase
  - 字符串优先使用单引号
  - 核心逻辑分为: UI构建 -> 状态管理 -> XHR拦截 -> 数据解析 -> 滚动控制 -> CSV导出

## 文件布局
- `extension/manifest.json`: 扩展配置文件 (MV3)
- `extension/content.js`: 核心逻辑 (UI + 业务逻辑)
- `extension/icons/`: 图标资源

## 关键约定

### 1. UI 设计 (极简主义)
- **风格**: 还原本质 (Reduction to Essence)
- **配色**: 淡蓝背景 (`#F0F8FF`), 纯黑文字/边框
- **交互**: 无阴影, 无圆角, 仅通过黑白反转表达状态
- **状态**: 按钮根据 `location.pathname` 自动激活/禁用

### 2. 数据处理
- **去重**: 使用 `Map` 按 `rest_id` 去重
- **拦截**: Hook `XMLHttpRequest` 监听 GraphQL 响应
- **解析**: 兼容 `TimelineAddEntries` 和 `TimelineAddToModule` 指令

### 3. CSV 导出规则
- **表头**: 全英文 (`User ID`, `Username`, `Display Name`...)
- **内容**: 
  - 添加 BOM (`\ufeff`) 防止乱码
  - 字符串强制转义双引号
  - 布尔值 `false` 显式输出 (不留空)
  - 移除 "已认证" (Verified) 列, 仅保留 "Blue Verified"

### 4. 自动化与配置
- **配置项**: 最小/最大间隔, 滚动次数(支持无限), 重试次数
- **验证**: 启动前强制验证配置有效性, 错误时显示红色提示
- **流程**: 抓取结束 (或手动停止) 后自动触发下载

## 变更策略
- 优先维护 `extension/content.js`
- UI 修改需严格遵循极简设计规范
- 任何数据字段变更需同步更新 CSV 表头
