// ==========================================
// X (Twitter) 认证关注者自动抓取脚本
// ==========================================

(function () {
    // === 配置项 ===
    const CONFIG = {
        targetUrlPart: 'BlueVerifiedFollowers', // 目标 API 关键字
        minInterval: 1500,                      // 最小滚动间隔 (1.5秒)
        maxInterval: 3500,                      // 最大滚动间隔 (3.5秒)
        maxScrolls: -1,                         // 滚动次数限制 (-1 为无限滚动)
        maxRetries: 5                           // 无新数据时的重试次数
    };

    // === 状态变量 ===
    let collectedUsers = new Map(); // 使用 Map 根据 ID 去重
    let scrollCount = 0;            // 已滚动次数
    let noNewDataCount = 0;         // 连续无新数据计数
    let autoScrollTimer = null;
    let isScraping = false;

    // === 1. 拦截网络请求 (XHR Hook) ===
    // 保存原始方法
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // Hook open 方法
    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url; // 保存 URL 供后续判断
        return originalOpen.apply(this, arguments);
    };

    // Hook send 方法
    XMLHttpRequest.prototype.send = function () {
        // 监听 load 事件（请求完成）
        this.addEventListener('load', function () {
            // 只处理包含特定关键字的 URL
            if (this._url && this._url.includes(CONFIG.targetUrlPart)) {
                try {
                    const response = JSON.parse(this.responseText);
                    processResponse(response);
                } catch (e) {
                    // 忽略非 JSON 响应或解析错误
                }
            }
        });
        return originalSend.apply(this, arguments);
    };

    console.clear();
    console.log('%c✅ 网络拦截器已启动', 'color: green; font-weight: bold; font-size: 14px;');

    // === 2. 数据处理逻辑 ===
    function processResponse(data) {
        try {
            // 尝试定位 instructions 数组 (X 的 GraphQL 结构层级很深)
            // 路径通常是: data.user.result.timeline.timeline.instructions
            const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions;

            if (!instructions || !Array.isArray(instructions)) return;

            let newCount = 0;

            instructions.forEach(instruction => {
                // 类型 1: TimelineAddEntries (常规列表)
                if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                    instruction.entries.forEach(entry => extractUser(entry));
                }
                // 类型 2: TimelineAddToModule (有时出现在末尾)
                else if (instruction.type === 'TimelineAddToModule' && instruction.moduleItems) {
                    instruction.moduleItems.forEach(item => extractUser(item));
                }
            });

            // 提取单个用户信息的函数
            function extractUser(entry) {
                const itemContent = entry?.content?.itemContent;
                if (!itemContent) return;

                if (itemContent.userDisplayType !== 'User') return;

                const result = itemContent.user_results?.result;
                if (!result) return;

                const userId = result.rest_id;
                const legacy = result.legacy || {};
                const core = result.core || {};
                const relationship_perspectives = result.relationship_perspectives || {}

                if (userId) {
                    if (!collectedUsers.has(userId)) {
                        collectedUsers.set(userId, {
                            id: userId,
                            screen_name: core.screen_name || legacy.screen_name || '',
                            name: core.name || legacy.name || '',
                            followers_count: legacy.followers_count || 0,
                            friends_count: legacy.friends_count || 0,
                            verified: result.verification?.verified || legacy.verified || false,
                            is_blue_verified: result.is_blue_verified || false,
                            created_at: core.created_at || legacy.created_at || '',
                            tweets_count: legacy.statuses_count || 0,
                            followed_by: relationship_perspectives.followed_by,
                            following: relationship_perspectives.following
                        });
                        newCount++;
                    }
                }
            }

            // 更新状态
            if (newCount > 0) {
                console.log(`%c[抓取中] 本次新增: ${newCount} 人 | 总计: ${collectedUsers.size} 人 | 最新: @${Array.from(collectedUsers.values()).pop().screen_name}`, 'color: blue;');
                noNewDataCount = 0; // 重置计数器
            } else {
                console.log(`[抓取中] 无新数据 (当前连续空转: ${noNewDataCount}/${CONFIG.maxRetries})`);
            }

        } catch (e) {
            console.error('解析数据出错:', e);
        }
    }

    // === 3. 自动滚动控制 ===
    function startScraping() {
        if (isScraping) return;
        isScraping = true;
        scrollCount = 0;

        console.log('🚀 自动抓取脚本已启动！');
        console.log('-----------------------------------');
        console.log('⚠️ 请保持此标签页在前台，不要关闭...');

        // 立即滚动到底部一次
        window.scrollTo(0, document.body.scrollHeight);
        scrollCount++;

        // 启动随机间隔滚动
        scheduleNextScroll();
    }

    function scheduleNextScroll() {
        if (!isScraping) return;

        // 生成 1.5s - 3.5s 之间的随机延迟
        const delay = Math.floor(Math.random() * (CONFIG.maxInterval - CONFIG.minInterval + 1)) + CONFIG.minInterval;

        autoScrollTimer = setTimeout(() => {
            if (!isScraping) return;

            // 检查停止条件
            // 1. 如果不是无限滚动模式，检查是否达到次数上限
            if (CONFIG.maxScrolls !== -1 && scrollCount >= CONFIG.maxScrolls) {
                stopScraping();
                return;
            }

            // 2. 如果连续多次无新数据，认为已抓取完毕
            if (noNewDataCount >= CONFIG.maxRetries) {
                console.log(`%c[停止] 连续 ${CONFIG.maxRetries} 次滚动无新数据，自动结束。`, 'color: orange; font-weight: bold;');
                stopScraping();
                return;
            }

            // 增加无新数据计数 (如果有新数据，processResponse 会重置它)
            noNewDataCount++;
            console.log(`[滚动] 第 ${scrollCount + 1} 次滚动... (连续无数据: ${noNewDataCount})`);

            // 执行滚动
            window.scrollTo(0, document.body.scrollHeight);
            scrollCount++;

            // 稍微往回滚一点点，有时候能触发懒加载机制
            setTimeout(() => {
                window.scrollBy(0, -100);
            }, 500);

            // 调度下一次
            scheduleNextScroll();

        }, delay);
    }

    function stopScraping() {
        clearTimeout(autoScrollTimer);
        isScraping = false;
        console.log('-----------------------------------');
        console.log('%c🏁 抓取结束！', 'color: green; font-weight: bold; font-size: 16px;');
        console.log(`共收集到 ${collectedUsers.size} 位认证关注者`);
        downloadCSV();
    }

    // === 4. 工具函数 ===
    /**
     * 格式化日期为 YYYY-MM-DD HH:mm:ss
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;

            const pad = (num) => String(num).padStart(2, '0');

            const year = d.getFullYear();
            const month = pad(d.getMonth() + 1);
            const day = pad(d.getDate());
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            const seconds = pad(d.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
            return dateStr;
        }
    }

    // === 5. 导出 CSV ===
    function downloadCSV() {
        if (collectedUsers.size === 0) {
            alert('未抓取到任何数据。\n\n提示：脚本只能抓取运行后加载的数据。\n请尝试刷新页面，然后快速粘贴运行代码。');
            return;
        }

        // CSV 表头
        const headers = ['用户ID', '用户名', '显示名称', '粉丝数', '关注数', '已认证', '蓝V', '创建时间', '推文数', '被关注', '正在关注'];

        // CSV 内容
        const rows = Array.from(collectedUsers.values()).map(u => {
            // 处理 CSV 字段中的逗号和引号
            const escape = (text) => `"${String(text).replace(/"/g, '""')}"`;

            return [
                escape(u.id),
                escape(u.screen_name),
                escape(u.name),
                u.followers_count,
                u.friends_count,
                u.verified,
                u.is_blue_verified,
                escape(formatDate(u.created_at)),
                u.tweets_count,
                u.followed_by,
                u.following
            ].join(',');
        });

        const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n'); // 添加 BOM 防止 Excel 中文乱码

        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `x_verified_followers_${new Date().toISOString().slice(0, 19).replace(/T|:/g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('📄 CSV 文件已开始下载');
    }

    // === 启动 ===
    startScraping();

})();
