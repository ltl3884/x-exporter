// ==========================================
// X (Twitter) Exporter - Content Script
// Reduction to Essence Design
// ==========================================

class XExporter {
    constructor() {
        this.CONFIG = {
            minInterval: 1500,
            maxInterval: 3500,
            maxScrolls: -1,
            maxRetries: 5
        };

        this.state = {
            collectedUsers: new Map(),
            scrollCount: 0,
            noNewDataCount: 0,
            autoScrollTimer: null,
            isScraping: false,
            currentPageType: '', // 'verified_followers', 'followers', 'following'
            targetUrlPart: ''
        };

        this.ui = {
            panel: null,
            countLabel: null,
            statusLabel: null,
            btnVerified: null,
            btnFollowers: null,
            btnFollowing: null,
            btnStop: null,
            btnDownload: null
        };

        this.init();
    }

    init() {
        this.updatePageContext();
        this.hookXHR();
        this.createUI();
        this.startRouteListener();
        console.log('X Exporter: Essential Mode Loaded');
    }

    updatePageContext() {
        const path = window.location.pathname;
        if (path.endsWith('/verified_followers')) {
            this.state.currentPageType = 'verified_followers';
            this.state.targetUrlPart = 'BlueVerifiedFollowers';
        } else if (path.endsWith('/followers')) {
            this.state.currentPageType = 'followers';
            this.state.targetUrlPart = 'Followers';
        } else if (path.endsWith('/following')) {
            this.state.currentPageType = 'following';
            this.state.targetUrlPart = 'Following';
        } else {
            this.state.currentPageType = '';
            this.state.targetUrlPart = '';
        }
    }

    startRouteListener() {
        let lastPath = window.location.pathname;
        setInterval(() => {
            if (window.location.pathname !== lastPath) {
                lastPath = window.location.pathname;
                this.updatePageContext();
                this.updateUIState();
            }
        }, 1000);
    }

    // === 1. UI 界面 (Reduction to Essence) ===
    createUI() {
        if (document.getElementById('x-exporter-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'x-exporter-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 240px;
            background: #F0F8FF;
            color: #000;
            padding: 10px;
            border: 1px solid #000;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            z-index: 9999;
            box-shadow: none;
            border-radius: 0;
        `;

        const header = document.createElement('div');
        header.style.cssText = 'font-weight: bold; font-size: 12px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;';
        header.innerText = 'X EXPORTER';
        panel.appendChild(header);

        const body = document.createElement('div');
        
        // 统计
        const stats = document.createElement('div');
        stats.style.marginBottom = '10px';
        stats.innerHTML = `
            <div style="font-size: 20px; font-weight: bold;" id="x-count">0</div>
            <div style="font-size: 10px; text-transform: uppercase;">Collected</div>
        `;
        this.ui.countLabel = stats.querySelector('#x-count');
        body.appendChild(stats);

        // 按钮容器
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';

        this.ui.btnVerified = this.createButton('EXPORT VERIFIED', () => this.startScraping('verified_followers'));
        this.ui.btnFollowers = this.createButton('EXPORT FOLLOWERS', () => this.startScraping('followers'));
        this.ui.btnFollowing = this.createButton('EXPORT FOLLOWING', () => this.startScraping('following'));
        
        this.ui.btnStop = this.createButton('STOP', () => this.stopScraping());
        this.ui.btnStop.style.display = 'none';
        
        this.ui.btnDownload = this.createButton('DOWNLOAD CSV', () => this.downloadCSV());
        this.ui.btnDownload.style.display = 'none';

        btnContainer.appendChild(this.ui.btnVerified);
        btnContainer.appendChild(this.ui.btnFollowers);
        btnContainer.appendChild(this.ui.btnFollowing);
        btnContainer.appendChild(this.ui.btnStop);
        btnContainer.appendChild(this.ui.btnDownload);
        
        body.appendChild(btnContainer);

        // 状态
        const status = document.createElement('div');
        status.id = 'x-status';
        status.style.cssText = 'font-size: 10px; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; text-transform: uppercase;';
        status.innerText = 'READY';
        this.ui.statusLabel = status;
        body.appendChild(status);

        panel.appendChild(body);
        document.body.appendChild(panel);
        this.ui.panel = panel;

        this.updateUIState();
    }

    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.cssText = `
            width: 100%;
            background: #FFF;
            color: #000;
            border: 1px solid #000;
            padding: 6px 0;
            border-radius: 0;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            font-size: 11px;
            transition: none;
        `;
        btn.onclick = onClick;
        return btn;
    }

    updateUIState() {
        if (this.state.isScraping) return;

        const setBtnActive = (btn, active) => {
            if (active) {
                btn.style.background = '#000';
                btn.style.color = '#FFF';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
                btn.style.opacity = '1';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = '#AAA';
                btn.style.borderColor = '#AAA';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
                btn.style.opacity = '0.5';
            }
        };

        setBtnActive(this.ui.btnVerified, this.state.currentPageType === 'verified_followers');
        setBtnActive(this.ui.btnFollowers, this.state.currentPageType === 'followers');
        setBtnActive(this.ui.btnFollowing, this.state.currentPageType === 'following');
        
        this.ui.btnStop.style.display = 'none';
        this.ui.btnDownload.style.display = this.state.collectedUsers.size > 0 ? 'block' : 'none';
        
        this.updateStatus(this.state.currentPageType ? `ON ${this.state.currentPageType.replace('_', ' ')}` : 'NAVIGATE TO LIST');
    }

    updateStatus(text) {
        if (this.ui.statusLabel) {
            this.ui.statusLabel.innerText = text.toUpperCase();
        }
    }

    updateCount() {
        if (this.ui.countLabel) {
            this.ui.countLabel.innerText = this.state.collectedUsers.size;
        }
    }

    // === 2. 核心逻辑 ===
    hookXHR() {
        const self = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._url = url;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                if (self.state.isScraping && this._url && this._url.includes(self.state.targetUrlPart)) {
                    try {
                        const response = JSON.parse(this.responseText);
                        self.processResponse(response);
                    } catch (e) {
                        console.error('X Exporter: Parse Error', e);
                    }
                }
            });
            return originalSend.apply(this, arguments);
        };
    }

    processResponse(data) {
        try {
            // X GraphQL 结构适配 (Following/Followers 与 Verified 结构相似)
            const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions;
            if (!instructions || !Array.isArray(instructions)) return;

            let newCount = 0;

            const extractUser = (entry) => {
                const itemContent = entry?.content?.itemContent;
                if (!itemContent || itemContent.userDisplayType !== 'User') return;

                const result = itemContent.user_results?.result;
                if (!result) return;

                const userId = result.rest_id;
                const legacy = result.legacy || {};
                const core = result.core || {};
                const relationship_perspectives = result.relationship_perspectives || {}

                if (userId && !this.state.collectedUsers.has(userId)) {
                    this.state.collectedUsers.set(userId, {
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
            };

            instructions.forEach(instruction => {
                if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                    instruction.entries.forEach(extractUser);
                } else if (instruction.type === 'TimelineAddToModule' && instruction.moduleItems) {
                    instruction.moduleItems.forEach(extractUser);
                }
            });

            if (newCount > 0) {
                this.state.noNewDataCount = 0;
                this.updateCount();
                this.updateStatus(`ADDED ${newCount}`);
            } else {
                this.updateStatus(`IDLE (${this.state.noNewDataCount}/${this.CONFIG.maxRetries})`);
            }

        } catch (e) {
            console.error('X Exporter: Process Error', e);
        }
    }

    startScraping(type) {
        if (this.state.isScraping) return;
        
        this.updatePageContext();
        if (this.state.currentPageType !== type) {
            alert('PAGE MISMATCH. PLEASE NAVIGATE TO THE CORRECT TAB.');
            return;
        }

        this.state.isScraping = true;
        this.state.scrollCount = 0;
        this.state.noNewDataCount = 0;
        this.state.collectedUsers.clear();
        this.updateCount();

        // UI 更新
        this.ui.btnVerified.style.display = 'none';
        this.ui.btnFollowers.style.display = 'none';
        this.ui.btnFollowing.style.display = 'none';
        this.ui.btnStop.style.display = 'block';
        this.ui.btnDownload.style.display = 'none';
        this.updateStatus('RUNNING');

        // 立即滚动
        window.scrollTo(0, document.body.scrollHeight);
        this.state.scrollCount++;
        this.scheduleNextScroll();
    }

    scheduleNextScroll() {
        if (!this.state.isScraping) return;

        const delay = Math.floor(Math.random() * (this.CONFIG.maxInterval - this.CONFIG.minInterval + 1)) + this.CONFIG.minInterval;

        this.state.autoScrollTimer = setTimeout(() => {
            if (!this.state.isScraping) return;

            if (this.CONFIG.maxScrolls !== -1 && this.state.scrollCount >= this.CONFIG.maxScrolls) {
                this.stopScraping();
                return;
            }

            if (this.state.noNewDataCount >= this.CONFIG.maxRetries) {
                this.updateStatus('FINISHED');
                this.stopScraping();
                return;
            }

            this.state.noNewDataCount++;
            this.updateStatus(`SCROLL ${this.state.scrollCount}`);

            window.scrollTo(0, document.body.scrollHeight);
            this.state.scrollCount++;

            setTimeout(() => {
                window.scrollBy(0, -100);
            }, 500);

            this.scheduleNextScroll();

        }, delay);
    }

    stopScraping() {
        clearTimeout(this.state.autoScrollTimer);
        this.state.isScraping = false;
        
        this.ui.btnVerified.style.display = 'block';
        this.ui.btnFollowers.style.display = 'block';
        this.ui.btnFollowing.style.display = 'block';
        this.ui.btnStop.style.display = 'none';
        
        this.updateUIState();
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const pad = (num) => String(num).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        } catch (e) { return dateStr; }
    }

    downloadCSV() {
        if (this.state.collectedUsers.size === 0) return;

        const headers = ['用户ID', '用户名', '显示名称', '粉丝数', '关注数', '已认证', '蓝V', '创建时间', '推文数', '被关注', '正在关注'];
        const rows = Array.from(this.state.collectedUsers.values()).map(u => {
            const escape = (text) => `"${String(text).replace(/"/g, '""')}"`;
            return [
                escape(u.id),
                escape(u.screen_name),
                escape(u.name),
                u.followers_count,
                u.friends_count,
                u.verified,
                u.is_blue_verified,
                escape(this.formatDate(u.created_at)),
                u.tweets_count,
                u.followed_by,
                u.following
            ].join(',');
        });

        const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `x_${this.state.currentPageType || 'export'}_${new Date().toISOString().slice(0, 19).replace(/T|:/g, '-')}.csv`;
        link.click();
    }
}

// 延迟启动
setTimeout(() => {
    new XExporter();
}, 2000);
