# AGENTS.md
# 自动化编码代理仓库指南

## 仓库概览
- 本项目是 X (Twitter) 关注者抓取工具，以 **浏览器扩展 (Chrome/Edge Extension)** 形式存在
- 核心功能：在 X 网页端抓取蓝V认证者、关注者、正在关注列表，并导出 CSV
- 技术栈：原生 JavaScript (Manifest V3)，无外部依赖，无构建工具
- 核心逻辑位于: `extension/content.js`

## 构建与测试

### 构建命令
```bash
# 打包扩展为 zip 文件（用于 Chrome Web Store 发布）
./build.sh
```
构建输出：`x_exporter_v{VERSION}.zip`

### 测试方式（手动）
本项目无自动化测试框架，测试需手动进行：
1. 打开 `chrome://extensions/`
2. 开启 "开发者模式"
3. 点击 "加载已解压的扩展程序"
4. 选择 `extension/` 目录
5. 进入 `https://x.com/{username}/followers` 测试功能

### Lint/格式化
本项目无配置 ESLint/Prettier。代码风格以 `extension/content.js` 为唯一基准。

## 文件结构
```
extension/
├── manifest.json    # 扩展配置 (Manifest V3)
├── content.js       # 核心逻辑 (UI + 业务逻辑)
└── icons/           # 图标资源 (16/32/48/128px)
```

## 代码风格规范

### 基本规则
| 规则 | 示例 |
|------|------|
| 缩进 | 4 空格 |
| 字符串 | 单引号优先 `'string'` |
| 分号 | 必须加分号 |
| 行尾空格 | 不允许 |
| 最大行宽 | ~120 字符 |

### 命名约定
```javascript
// 变量/函数: camelCase
const scrollCount = 0;
const updateStatus = () => {};

// 类名: PascalCase
class XExporter {}

// 常量/配置键: UPPER_SNAKE_CASE
this.CONFIG = { minInterval: 1500, maxInterval: 3500 };

// 私有属性: 无前缀（使用 this.state/this.ui 分组）
this.state = { isScraping: false };
this.ui = { panel: null };
```

### 类结构模式
```javascript
class XExporter {
    constructor() {
        this.CONFIG = { ... };  // 配置
        this.state = { ... };   // 状态
        this.ui = { ... };      // UI 元素引用
        this.init();
    }

    // 初始化
    init() { }

    // 1. UI 相关方法
    createUI() { }
    updateUIState() { }

    // 2. 配置验证
    validateConfig() { }

    // 3. 核心业务逻辑
    hookXHR() { }
    processResponse(data) { }
    startScraping(type) { }
    stopScraping() { }

    // 4. 工具方法
    formatDate(dateStr) { }
    downloadCSV() { }
}
```

### 箭头函数 vs 普通函数
```javascript
// 类方法：普通函数
processResponse(data) {
    // 使用 this 访问实例
}

// 回调函数：箭头函数
setInterval(() => {
    this.updatePageContext();
}, 1000);

// 内联提取器：箭头函数
const extractUser = (entry) => { ... };
```

### 错误处理
```javascript
// 使用 try-catch 包装 JSON 解析
try {
    const response = JSON.parse(this.responseText);
    self.processResponse(response);
} catch (e) {
    console.error('X Exporter: Parse Error', e);
}

// 可选链 + 空值检查
const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions;
if (!instructions || !Array.isArray(instructions)) return;

// 默认值回退
const legacy = result.legacy || {};
const followers_count = legacy.followers_count || 0;
```

### DOM 操作
```javascript
// 使用 document.createElement 创建元素
const panel = document.createElement('div');
panel.id = 'x-exporter-panel';

// 内联样式：使用 style.cssText 或 template literal
panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
`;

// 避免 innerHTML 注入用户数据
```

### 注释规范
```javascript
// 章节标题使用 === 分隔
// === 1. UI 界面 (Claymorphism Design) ===

// 中文注释说明业务逻辑
// 装饰性顶部条
const decorBar = document.createElement('div');
```

## 关键约定

### 1. UI 设计 (Claymorphism 风格)
- **配色**: 紫色主调 (`--clay-accent: #7C3AED`)
- **圆角**: 按钮 `20px`，面板 `32px`
- **阴影**: 多层嵌套实现立体感
- **交互**: 状态变化使用 transform + box-shadow 过渡
- **按钮状态**: 根据 `location.pathname` 自动激活/禁用

### 2. XHR 拦截模式
```javascript
// Hook XMLHttpRequest.open 和 send
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;  // 保存 URL 供后续匹配
    return originalOpen.apply(this, arguments);
};
```

### 3. 数据处理
- **去重**: 使用 `Map` 按 `rest_id` 去重
- **解析**: 兼容 `TimelineAddEntries` 和 `TimelineAddToModule` 指令
- **字段提取**: 同时检查 `core` 和 `legacy` 对象

### 4. CSV 导出规则
```javascript
// 表头：全英文
const headers = ['User ID', 'Username', 'Display Name', ...];

// 添加 BOM 防止 Excel 乱码
const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');

// 字符串转义
const escape = (text) => `"${String(text).replace(/"/g, '""')}"`;

// 布尔值显式输出
u.is_blue_verified  // 输出 true/false，不留空
```

### 5. 配置验证
- 启动前强制调用 `validateConfig()`
- 错误时在对应输入框旁显示 `INVALID` 红色提示
- 验证通过后才更新 `this.CONFIG`

## 变更策略
1. **优先编辑** `extension/content.js`，避免新增文件
2. **UI 修改** 需严格遵循 Claymorphism 设计规范
3. **数据字段变更** 需同步更新 CSV 表头和 `processResponse` 解析逻辑
4. **manifest.json 修改** 需更新版本号并重新执行 `./build.sh`

## 规则文件
- 未配置 `.cursor/rules/` 或 `.cursorrules`
- 未配置 `.github/copilot-instructions.md`
