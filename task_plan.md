# Task Plan - X Exporter JS

## Goal
将脚本迁移为带有悬浮 UI 的 Chrome 插件 (Manifest V3)，提升使用体验。

## Current Phase
Phase 5: Cleanup & Documentation

## Phases

### Phase 1: Background Research & Initialization
- [x] Read `AGENTS.md` and `CLAUDE.md` for project rules.
- [x] Initialize planning files.
- [x] Analyze `fetch_x_followers.js` structure.
- **Status:** complete

### Phase 2: Requirements & Refinement
- [x] 需求一：支持 `maxScrolls: -1` 实现无限滚动。
- [x] 需求二：导出 CSV 时间格式化为 `YYYY-MM-DD HH:mm:ss`。
- **Status:** complete

### Phase 3: Implementation
- [x] 修改滚动逻辑：增加对 `-1` 的支持。
- [x] 编写日期格式化工具函数。
- [x] 更新 `downloadCSV` 逻辑应用日期格式化。
- [x] **Fix**: 将 `noNewDataCount` 递增逻辑移至滚动循环，解决底部死循环问题。
- **Status:** complete

### Phase 4: Chrome Extension Migration
- [x] Create `extension/manifest.json` (V3, world: MAIN).
- [x] Implement `extension/content.js`:
    - [x] Port core scraping logic.
    - [x] Create Floating UI (Start/Stop/Download buttons).
    - [x] Connect UI to logic (Event handling).
- [x] Create placeholder icons.
- [x] UI Refinement: Reduction to Essence (Minimalist Design).
- [x] Feature: Multi-type export (Verified/Followers/Following).
- [x] Feature: Configurable parameters in UI.
- [x] CSV Update: English headers, remove Verified column.
- **Status:** complete

### Phase 5: Cleanup & Documentation
- [x] Remove legacy `fetch_x_followers.js`.
- [x] Update `AGENTS.md` to reflect extension architecture.
- [x] Update project progress logs.
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| `execution_world: "MAIN"` | Required for XHR hooking in MV3. |
| Floating UI | Replaces console logs for better UX. |
| Single Version | Removed bookmark script to focus on extension maintenance. |
| Minimalist UI | Focus on function and clarity, "Reduction to Essence". |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| N/A | |
