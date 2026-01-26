# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

X (Twitter) 蓝V认证关注者抓取工具，浏览器端 JavaScript 书签脚本。

## 架构

- **零依赖**: 原生 JavaScript，无需构建工具
- **模式**: IIFE 避免全局污染
- **核心机制**: XHR Hook 拦截 `BlueVerifiedFollowers` GraphQL 响应
- **数据结构**: Map 按 `rest_id` 去重用户

## 关键文件

- `fetch_x_followers.js`: 主脚本，包含配置、网络拦截、数据解析、自动滚动、CSV 导出
- `X_BlueVerifiedFollowers`: curl 请求示例 (API 抓包数据)
- `result.json`: 抓取的 JSON 数据样本

## 运行方式

1. 打开 X 用户认证关注者页面 (如 `https://x.com/username/verified_followers`)
2. F12 打开浏览器控制台
3. 粘贴 `fetch_x_followers.js` 内容并回车
4. 自动下载 CSV 文件

## 配置项 (CONFIG)

位于脚本第 7-12 行:
- `targetUrlPart`: 目标 API 关键字 (默认 `BlueVerifiedFollowers`)
- `minInterval`/`maxInterval`: 滚动间隔 (默认 1.5s-3.5s)
- `maxRetries`: 连续无新数据时停止次数 (默认 5)
