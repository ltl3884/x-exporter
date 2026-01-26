# Findings & Decisions - X Exporter JS

## Requirements
- 浏览器书签脚本环境（无依赖，原生 JS）。
- 抓取 X (Twitter) 认证关注者页面数据。
- 导出包含 BOM 的 CSV 文件（解决 Excel 中文乱码）。
- **[New]** 支持 `maxScrolls: -1` 实现无限滚动。
- **[New]** CSV “创建时间”格式化为 `YYYY-MM-DD HH:mm:ss`。

## Research Findings
### 1. 关键接口
- **URL Part**: `BlueVerifiedFollowers`
- **数据结构**: GraphQL 响应，层级较深。

### 2. 自动滚动机制
- **无限滚动逻辑**: 当 `maxScrolls` 为 `-1` 时，判断停止的条件应改为“连续 N 次滚动未获取到新数据”。
- **空数据计数**: 引入 `noNewDataCount` 和 `CONFIG.maxRetries`。

### 3. 时间处理
- **原始数据**: `created_at` 字段通常是 ISO 字符串或 X 特有的格式（如 "Thu Jan 01 00:00:00 +0000 2026"）。
- **格式化方案**: 使用 `new Date(val)` 解析并提取 `getFullYear`, `getMonth` 等拼接。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| `maxRetries: 5` | 若连续 5 次滚动都没有新用户加入 `Map`，认为已到达底部。 |
| 自定义 `formatDate` | 避免引入 Moment.js 等外部依赖。 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 滚动死循环风险 | 通过 `noNewDataCount` 强制退出循环。 |

## Resources
- X GraphQL API Structure (internal knowledge).
- JS Date Object.
