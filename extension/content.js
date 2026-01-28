// ==========================================
// X (Twitter) Exporter - Content Script
// Claymorphism Design
// ==========================================

class XExporter {
    constructor() {
        this.CONFIG = {
            minInterval: 1500,
            maxInterval: 3500,
            maxScrolls: -1,
            maxRetries: 3
        };

        this.state = {
            collectedUsers: new Map(),
            scrollCount: 0,
            noNewDataCount: 0,
            autoScrollTimer: null,
            isScraping: false,
            currentPageType: '',
            targetUrlPart: '',
            isMinimized: false
        };

        this.ui = {
            panel: null,
            body: null,
            minimizeBtn: null,
            countLabel: null,
            statusLabel: null,
            btnVerified: null,
            btnFollowers: null,
            btnFollowing: null,
            btnStop: null,
            inputMinInterval: null,
            inputMaxInterval: null,
            checkboxUnlimited: null,
            inputMaxScrolls: null,
            inputMaxRetries: null,
            errorMinInterval: null,
            errorMaxInterval: null,
            errorMaxScrolls: null,
            errorMaxRetries: null
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

    // === 1. UI 界面 (Claymorphism Design) ===
    createUI() {
        if (document.getElementById('x-exporter-panel')) return;

        // 注入 Claymorphism 样式
        const styleId = 'x-exporter-style';
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes clay-float {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-12px) rotate(1.5deg); }
            }

            #x-exporter-panel {
                --clay-bg: #F4F1FA;
                --clay-surface: #FFFFFF;
                --clay-text: #332F3A;
                --clay-muted: #635F69;
                --clay-accent: #7C3AED;
                --clay-accent-alt: #DB2777;
                --clay-info: #0EA5E9;
                --clay-success: #10B981;
                --clay-warning: #F59E0B;
                --clay-danger: #DB2777;
                background: linear-gradient(145deg, #FDFBFF 0%, #F0EAF9 100%);
                color: var(--clay-text);
                font-family: "Avenir Next Rounded", "SF Pro Rounded", "Avenir Next", "Helvetica Neue", Arial, sans-serif;
                border-radius: 32px;
                border: 1px solid rgba(124, 58, 237, 0.18);
                box-shadow:
                    20px 20px 45px rgba(160, 150, 180, 0.35),
                    -16px -16px 36px rgba(255, 255, 255, 0.9),
                    inset 8px 8px 16px rgba(139, 92, 246, 0.06),
                    inset -8px -8px 16px rgba(255, 255, 255, 0.95);
                overflow: hidden;
                position: fixed;
                backdrop-filter: blur(8px);
            }

            #x-exporter-panel::before {
                content: "";
                position: absolute;
                inset: -60px;
                background:
                    radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.18), transparent 55%),
                    radial-gradient(circle at 80% 25%, rgba(219, 39, 119, 0.16), transparent 55%),
                    radial-gradient(circle at 70% 80%, rgba(14, 165, 233, 0.14), transparent 60%);
                filter: blur(26px);
                opacity: 0.9;
                z-index: 0;
                animation: clay-float 12s ease-in-out infinite;
                pointer-events: none;
            }

            #x-exporter-panel, #x-exporter-panel * {
                box-sizing: border-box;
            }

            #x-exporter-panel > * {
                position: relative;
                z-index: 1;
            }

            .clay-btn {
                width: 100%;
                background: linear-gradient(145deg, #A78BFA, #7C3AED);
                color: #ffffff;
                border: none;
                border-radius: 20px;
                box-shadow:
                    12px 12px 24px rgba(124, 58, 237, 0.28),
                    -8px -8px 16px rgba(255, 255, 255, 0.7),
                    inset 4px 4px 8px rgba(255, 255, 255, 0.35),
                    inset -4px -4px 8px rgba(0, 0, 0, 0.08);
                transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
            }

            .clay-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow:
                    16px 16px 28px rgba(124, 58, 237, 0.3),
                    -10px -10px 18px rgba(255, 255, 255, 0.85),
                    inset 4px 4px 8px rgba(255, 255, 255, 0.35),
                    inset -4px -4px 8px rgba(0, 0, 0, 0.08);
            }

            .clay-btn:active:not(:disabled) {
                transform: translateY(1px) scale(0.96);
                box-shadow:
                    inset 10px 10px 20px #d9d4e3,
                    inset -10px -10px 20px #ffffff;
            }

            .clay-btn:disabled {
                background: #E9E4F0;
                color: #9C95A3;
                box-shadow:
                    inset 10px 10px 20px #d9d4e3,
                    inset -10px -10px 20px #ffffff;
            }

            .clay-btn--active {
                filter: brightness(1.03);
            }

            .clay-btn--danger {
                background: linear-gradient(145deg, #F9A8D4, #DB2777);
                box-shadow:
                    12px 12px 24px rgba(219, 39, 119, 0.28),
                    -8px -8px 16px rgba(255, 255, 255, 0.7),
                    inset 4px 4px 8px rgba(255, 255, 255, 0.35),
                    inset -4px -4px 8px rgba(0, 0, 0, 0.08);
            }

            .clay-input {
                background: #EFEBF5;
                border: none;
                border-radius: 16px;
                color: var(--clay-text);
                font-family: inherit;
                box-shadow:
                    inset 10px 10px 20px #d9d4e3,
                    inset -10px -10px 20px #ffffff;
            }

            .clay-input:focus {
                background: #ffffff;
                outline: none;
                box-shadow:
                    0 0 0 4px rgba(124, 58, 237, 0.2),
                    inset 6px 6px 12px #e6e0f0,
                    inset -6px -6px 12px #ffffff;
            }

            @media (prefers-reduced-motion: reduce) {
                #x-exporter-panel::before {
                    animation: none;
                }
                .clay-btn {
                    transition: none;
                }
            }

            .clay-help-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 14px;
                height: 14px;
                background: rgba(124, 58, 237, 0.15);
                color: var(--clay-accent);
                border-radius: 50%;
                font-size: 9px;
                font-weight: 800;
                margin-left: 6px;
                cursor: help;
                transition: transform 0.2s;
            }
            .clay-help-icon:hover {
                transform: scale(1.1);
                background: var(--clay-accent);
                color: white;
            }

            .clay-tooltip {
                position: absolute;
                bottom: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(145deg, #FFFFFF, #F4F1FA);
                color: var(--clay-text);
                font-size: 10px;
                padding: 8px 12px;
                border-radius: 12px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s, transform 0.2s;
                z-index: 10000;
                box-shadow:
                    8px 8px 16px rgba(124, 58, 237, 0.2),
                    -4px -4px 10px rgba(255, 255, 255, 0.8),
                    inset 2px 2px 4px rgba(255, 255, 255, 0.4),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.05);
                font-weight: 600;
                line-height: 1.4;
                max-width: 220px;
                white-space: normal;
            }

            .clay-tooltip::before {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 6px solid transparent;
                border-top-color: #F4F1FA;
                filter: drop-shadow(2px 2px 3px rgba(124, 58, 237, 0.15));
            }

            .clay-help-icon-wrapper {
                position: relative;
                display: inline-block;
                z-index: 1;
            }

            .clay-help-icon-wrapper:hover .clay-tooltip {
                opacity: 1;
                transform: translateX(-50%) translateY(-4px);
            }

            .x-exporter-body {
                overflow: hidden;
                transition: max-height 0.3s ease, opacity 0.3s ease;
            }

            .x-exporter-body.collapsed {
                max-height: 0 !important;
                opacity: 0;
            }

            .x-exporter-minimize-btn {
                cursor: pointer;
                transition: transform 0.3s ease;
            }

            .x-exporter-minimize-btn:hover {
                transform: scale(1.2);
            }

            .x-exporter-minimize-btn.minimized {
                transform: rotate(180deg);
            }
        `;
        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'x-exporter-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 290px;
            padding: 16px;
            z-index: 9999;
        `;

        // 装饰性顶部条
        const decorBar = document.createElement('div');
        decorBar.style.cssText = 'height: 6px; background: linear-gradient(90deg, #A78BFA, #DB2777); width: 100%; margin-bottom: 12px; border-radius: 999px; box-shadow: 6px 6px 14px rgba(124, 58, 237, 0.25), -4px -4px 10px rgba(255, 255, 255, 0.9);';
        panel.appendChild(decorBar);

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(124, 58, 237, 0.15); padding-bottom: 10px;';
        const iconHtml = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB/UlEQVR4AWySy05UQRCGv+oBxhCZGMEFGJZufApRV76DD6DRRMW3YFzgRl37FpKwdGPiko0xLjQGb8glEkeH0/5/ncOMMdY5f9e9qru6y6Ot93X4QviXy7YhDLc+1KF9HTaStzb7C0lBrR2ajkvHaKDaJrR6gG32CV2BrALyGWEORARNrZgq/sAuWyIlKDUDKlGZkBooHGZ7r+nNVKKMWerfYq7sqHnNOOcZRURGF3hwbTmxLr5+fZk7V25wb+0i96+usj9+wmD2MRHKF1wmIihN461J6LYQEewf/+br4U++HY74IhyPxrQbrSz2b2MKdXWRgqopRzYJWl+9O+Dc/CxLgzMsDvpcEOb7M8z3noMCS8CgNwRCH1ifVEd0eeWsVnJ4HqChZhyPb6bdXQ/GD1P2oiGCCncL7Oz+wFRUushhEKhGsDd6xvfRUyJkUJCLFZ9lqsLLt/ty6bdXbPo7SvP6y+6xaQZ2MLnGu2urmN58PMLYO/plldDn3PZIkrQLvSOKvVLNEpErXFpZSJxfmJNFEacOaaiYzuRztQUQVYmb27tsbn/6Dz4reLp9SZkho7IkutqJ34MaNbXRrShEF++X1nRcFkcK4f7OTeQtyJq/aiiZvMITJbbJrS41Y1A3y+qVejsDWUJqnHLLhgbliumTrlzl67Ay2KUr5A8AAAD//yeeHFAAAAAGSURBVAMAlmEjo5Yq8TIAAAAASUVORK5CYII=" style="width: 12px; height: 12px;" alt="" />';

        // 左侧：图标 + 标题
        const titleSpan = document.createElement('span');
        titleSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 14px; letter-spacing: 0.6px; color: var(--clay-text);';
        titleSpan.innerHTML = `${iconHtml} X EXPORTER`;

        // 右侧：最小化按钮（粉色短横线）
        const minimizeBtn = document.createElement('div');
        minimizeBtn.className = 'x-exporter-minimize-btn';
        minimizeBtn.style.cssText = 'width: 18px; height: 4px; background: linear-gradient(145deg, #F9A8D4, #DB2777); border-radius: 2px; box-shadow: 2px 2px 6px rgba(219, 39, 119, 0.35), -2px -2px 6px rgba(255, 255, 255, 0.8);';
        minimizeBtn.onclick = () => this.toggleMinimize();
        this.ui.minimizeBtn = minimizeBtn;

        header.appendChild(titleSpan);
        header.appendChild(minimizeBtn);
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'x-exporter-body';
        body.style.maxHeight = '600px';
        this.ui.body = body;

        // 配置区域
        const configSection = document.createElement('div');
        configSection.style.cssText = 'margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(124, 58, 237, 0.12);';

        const configTitle = document.createElement('div');
        configTitle.style.cssText = 'font-size: 11px; color: var(--clay-muted); margin-bottom: 8px; letter-spacing: 0.8px; font-weight: 800;';
        configTitle.innerText = '> CONFIG';
        configSection.appendChild(configTitle);

        // 辅助函数：创建输入行
        const createInputRow = (label, inputElem, errorElem, tooltipText) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;';

            const leftGroup = document.createElement('div');
            leftGroup.style.cssText = 'display: flex; align-items: center;';

            const labelSpan = document.createElement('span');
            labelSpan.style.cssText = 'font-size: 11px; color: var(--clay-muted); font-weight: 600;';
            labelSpan.innerText = label;
            leftGroup.appendChild(labelSpan);

            if (tooltipText) {
                const wrapper = document.createElement('span');
                wrapper.className = 'clay-help-icon-wrapper';

                const icon = document.createElement('span');
                icon.className = 'clay-help-icon';
                icon.innerText = '?';

                const tooltip = document.createElement('span');
                tooltip.className = 'clay-tooltip';
                tooltip.innerText = tooltipText;
                tooltip.dataset.tooltipKey = label;

                wrapper.appendChild(icon);
                wrapper.appendChild(tooltip);
                leftGroup.appendChild(wrapper);
            }

            const rightGroup = document.createElement('div');
            rightGroup.style.display = 'flex';
            rightGroup.style.alignItems = 'center';

            inputElem.className = 'clay-input';
            inputElem.style.cssText += 'width: 58px; padding: 4px 6px; font-size: 11px; text-align: center;';

            rightGroup.appendChild(inputElem);
            if (errorElem) rightGroup.appendChild(errorElem);

            row.appendChild(leftGroup);
            row.appendChild(rightGroup);
            return row;
        };

        // 最小滚动间隔
        this.ui.inputMinInterval = document.createElement('input');
        this.ui.inputMinInterval.type = 'number';
        this.ui.inputMinInterval.value = '1.5';
        this.ui.inputMinInterval.step = '0.1';
        this.ui.errorMinInterval = document.createElement('span');
        this.ui.errorMinInterval.style.cssText = 'color: var(--clay-danger); font-size: 10px; margin-left: 6px; font-weight: 700;';
        configSection.appendChild(createInputRow('MIN_INTERVAL', this.ui.inputMinInterval, this.ui.errorMinInterval, 'Scroll delay is a random number between MIN and MAX.'));

        // 最大滚动间隔
        this.ui.inputMaxInterval = document.createElement('input');
        this.ui.inputMaxInterval.type = 'number';
        this.ui.inputMaxInterval.value = '3.5';
        this.ui.inputMaxInterval.step = '0.1';
        this.ui.errorMaxInterval = document.createElement('span');
        this.ui.errorMaxInterval.style.cssText = 'color: var(--clay-danger); font-size: 10px; margin-left: 6px; font-weight: 700;';
        configSection.appendChild(createInputRow('MAX_INTERVAL', this.ui.inputMaxInterval, this.ui.errorMaxInterval, 'Scroll delay is a random number between MIN and MAX.'));

        // 滚动次数
        const rowScrolls = document.createElement('div');
        rowScrolls.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;';

        const leftScrolls = document.createElement('div');
        leftScrolls.style.cssText = 'display: flex; align-items: center;';

        const labelScrolls = document.createElement('span');
        labelScrolls.style.cssText = 'font-size: 11px; color: var(--clay-muted); font-weight: 600;';
        labelScrolls.innerText = 'MAX_SCROLL_COUNT';
        leftScrolls.appendChild(labelScrolls);

        const wrapperScrolls = document.createElement('span');
        wrapperScrolls.className = 'clay-help-icon-wrapper';

        const iconScrolls = document.createElement('span');
        iconScrolls.className = 'clay-help-icon';
        iconScrolls.innerText = '?';

        const tooltipScrolls = document.createElement('span');
        tooltipScrolls.className = 'clay-tooltip';
        tooltipScrolls.innerText = 'Number of page scrolls: each scroll collects info for roughly 20 to 50 users.';
        tooltipScrolls.dataset.tooltipKey = 'MAX_SCROLL_COUNT';

        wrapperScrolls.appendChild(iconScrolls);
        wrapperScrolls.appendChild(tooltipScrolls);
        leftScrolls.appendChild(wrapperScrolls);

        const rightScrolls = document.createElement('div');
        rightScrolls.style.display = 'flex';
        rightScrolls.style.alignItems = 'center';

        this.ui.checkboxUnlimited = document.createElement('input');
        this.ui.checkboxUnlimited.type = 'checkbox';
        this.ui.checkboxUnlimited.checked = true;
        this.ui.checkboxUnlimited.style.marginRight = '5px';
        this.ui.checkboxUnlimited.style.accentColor = '#7C3AED';

        const labelInf = document.createElement('span');
        labelInf.innerText = '∞';
        labelInf.style.cssText = 'font-size: 14px; margin-right: 6px; color: var(--clay-accent); font-weight: 800;';

        this.ui.inputMaxScrolls = document.createElement('input');
        this.ui.inputMaxScrolls.type = 'number';
        this.ui.inputMaxScrolls.value = '10';
        this.ui.inputMaxScrolls.disabled = true;
        this.ui.inputMaxScrolls.className = 'clay-input';
        this.ui.inputMaxScrolls.style.cssText = 'width: 48px; padding: 4px 6px; font-size: 11px; text-align: center; opacity: 0.7;';

        this.ui.errorMaxScrolls = document.createElement('span');
        this.ui.errorMaxScrolls.style.cssText = 'color: var(--clay-danger); font-size: 10px; margin-left: 6px; font-weight: 700;';

        rightScrolls.appendChild(this.ui.checkboxUnlimited);
        rightScrolls.appendChild(labelInf);
        rightScrolls.appendChild(this.ui.inputMaxScrolls);
        rightScrolls.appendChild(this.ui.errorMaxScrolls);

        rowScrolls.appendChild(leftScrolls);
        rowScrolls.appendChild(rightScrolls);
        configSection.appendChild(rowScrolls);

        this.ui.checkboxUnlimited.onchange = () => {
            const checked = this.ui.checkboxUnlimited.checked;
            this.ui.inputMaxScrolls.disabled = checked;
            this.ui.inputMaxScrolls.style.opacity = checked ? '0.5' : '1';
        };

        // 重试次数
        this.ui.inputMaxRetries = document.createElement('input');
        this.ui.inputMaxRetries.type = 'number';
        this.ui.inputMaxRetries.value = '3';
        this.ui.errorMaxRetries = document.createElement('span');
        this.ui.errorMaxRetries.style.cssText = 'color: var(--clay-danger); font-size: 10px; margin-left: 6px; font-weight: 700;';
        configSection.appendChild(createInputRow('MAX_EMPTY_SCROLLS', this.ui.inputMaxRetries, this.ui.errorMaxRetries, 'Stop when no more data is returned after MAX_EMPTY_SCROLLS consecutive scrolls.'));

        body.appendChild(configSection);

        // 统计
        const stats = document.createElement('div');
        stats.style.marginBottom = '14px';
        stats.innerHTML = `
            <div style="font-size: 11px; color: var(--clay-muted); margin-bottom: 4px; font-weight: 700;">COLLECTED DATA</div>
            <div style="font-size: 30px; font-weight: 600; color: var(--clay-accent);" id="x-count">0</div>
        `;
        this.ui.countLabel = stats.querySelector('#x-count');
        body.appendChild(stats);

        // 按钮容器
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        this.ui.btnVerified = this.createButton('GET VERIFIED', () => this.startScraping('verified_followers'));
        this.ui.btnFollowers = this.createButton('GET FOLLOWERS', () => this.startScraping('followers'));
        this.ui.btnFollowing = this.createButton('GET FOLLOWING', () => this.startScraping('following'));

        this.ui.btnStop = this.createButton('TERMINATE PROCESS', () => this.stopScraping());
        this.ui.btnStop.classList.add('clay-btn--danger');
        this.ui.btnStop.style.display = 'none';

        btnContainer.appendChild(this.ui.btnVerified);
        btnContainer.appendChild(this.ui.btnFollowers);
        btnContainer.appendChild(this.ui.btnFollowing);
        btnContainer.appendChild(this.ui.btnStop);

        body.appendChild(btnContainer);

        // 状态
        const status = document.createElement('div');
        status.id = 'x-status';
        status.style.cssText = 'font-size: 11px; margin-top: 14px; border-top: 1px solid rgba(124, 58, 237, 0.12); padding-top: 8px; color: var(--clay-muted); display: flex; align-items: center; font-weight: 600;';
        status.innerHTML = '<span style="color: var(--clay-success); margin-right: 6px; font-size: 12px;">●</span> <span id="x-status-text">SYSTEM_READY</span>';
        this.ui.statusLabel = status.querySelector('#x-status-text');
        body.appendChild(status);

        panel.appendChild(body);
        document.body.appendChild(panel);
        this.ui.panel = panel;

        this.updateUIState();
        this.syncTooltipSizes();
    }

    syncTooltipSizes() {
        const panel = this.ui.panel;
        if (!panel) return;

        requestAnimationFrame(() => {
            const baseTooltip = panel.querySelector('.clay-tooltip[data-tooltip-key="MAX_EMPTY_SCROLLS"]');
            const targetTooltips = panel.querySelectorAll(
                '.clay-tooltip[data-tooltip-key="MAX_SCROLL_COUNT"], .clay-tooltip[data-tooltip-key="MIN_INTERVAL"], .clay-tooltip[data-tooltip-key="MAX_INTERVAL"]'
            );

            if (!baseTooltip || targetTooltips.length === 0) return;

            const baseRect = baseTooltip.getBoundingClientRect();
            if (!baseRect.width || !baseRect.height) return;

            const targetWidth = `${Math.round(baseRect.width)}px`;
            const targetHeight = `${Math.round(baseRect.height)}px`;

            targetTooltips.forEach((tooltip) => {
                tooltip.style.width = targetWidth;
                tooltip.style.height = targetHeight;
                tooltip.style.maxWidth = targetWidth;
            });
        });
    }

    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.className = 'clay-btn';
        btn.style.cssText = `
            width: 100%;
            padding: 11px 0;
            font-family: inherit;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.4px;
            cursor: pointer;
        `;
        btn.onclick = onClick;
        return btn;
    }

    updateUIState() {
        if (this.state.isScraping) return;

        const setBtnActive = (btn, active) => {
            btn.disabled = !active;
            if (active) {
                btn.classList.add('clay-btn--active');
            } else {
                btn.classList.remove('clay-btn--active');
            }
        };

        setBtnActive(this.ui.btnVerified, this.state.currentPageType === 'verified_followers');
        setBtnActive(this.ui.btnFollowers, this.state.currentPageType === 'followers');
        setBtnActive(this.ui.btnFollowing, this.state.currentPageType === 'following');

        this.ui.btnStop.style.display = 'none';

        this.updateStatus(this.state.currentPageType ? 'version:1.2' : 'WAITING_FOR_LINK...');
    }

    updateStatus(text) {
        if (this.ui.statusLabel) {
            this.ui.statusLabel.innerText = text;
        }
    }

    toggleMinimize() {
        this.state.isMinimized = !this.state.isMinimized;

        if (this.state.isMinimized) {
            this.ui.body.classList.add('collapsed');
            this.ui.minimizeBtn.classList.add('minimized');
        } else {
            this.ui.body.classList.remove('collapsed');
            this.ui.minimizeBtn.classList.remove('minimized');
        }
    }

    updateCount() {
        if (this.ui.countLabel) {
            this.ui.countLabel.innerText = this.state.collectedUsers.size;
        }
    }

    // === 2. 配置验证 ===
    validateConfig() {
        let valid = true;

        const minVal = parseFloat(this.ui.inputMinInterval.value);
        const maxVal = parseFloat(this.ui.inputMaxInterval.value);
        const unlimited = this.ui.checkboxUnlimited.checked;
        const maxScrolls = parseInt(this.ui.inputMaxScrolls.value);
        const maxRetries = parseInt(this.ui.inputMaxRetries.value);

        this.ui.errorMinInterval.innerText = '';
        this.ui.errorMaxInterval.innerText = '';
        this.ui.errorMaxScrolls.innerText = '';
        this.ui.errorMaxRetries.innerText = '';

        if (isNaN(minVal) || minVal <= 0) {
            this.ui.errorMinInterval.innerText = 'INVALID';
            valid = false;
        }

        if (isNaN(maxVal) || maxVal <= 0) {
            this.ui.errorMaxInterval.innerText = 'INVALID';
            valid = false;
        }

        if (!unlimited && (isNaN(maxScrolls) || maxScrolls <= 0)) {
            this.ui.errorMaxScrolls.innerText = 'INVALID';
            valid = false;
        }

        if (isNaN(maxRetries) || maxRetries <= 0) {
            this.ui.errorMaxRetries.innerText = 'INVALID';
            valid = false;
        }

        if (valid) {
            this.CONFIG.minInterval = Math.round(minVal * 1000);
            this.CONFIG.maxInterval = Math.round(maxVal * 1000);
            this.CONFIG.maxScrolls = unlimited ? -1 : maxScrolls;
            this.CONFIG.maxRetries = maxRetries;
        }

        return valid;
    }

    // === 3. 核心逻辑 ===
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
                const relationship_perspectives = result.relationship_perspectives || {};
                const dm_permissions = result.dm_permissions || {};
                const avatar = result.avatar || {};

                if (userId && !this.state.collectedUsers.has(userId)) {
                    this.state.collectedUsers.set(userId, {
                        id: userId,
                        screen_name: core.screen_name || legacy.screen_name || '',
                        name: core.name || legacy.name || '',
                        can_dm: dm_permissions.can_dm || false,
                        description: legacy.description || '',
                        avatar_url: avatar.image_url || '',
                        followers_count: legacy.followers_count || 0,
                        friends_count: legacy.friends_count || 0,
                        is_blue_verified: result.is_blue_verified || false,
                        created_at: core.created_at || legacy.created_at || '',
                        tweets_count: legacy.statuses_count || 0,
                        followed_by: relationship_perspectives.followed_by || false,
                        following: relationship_perspectives.following || false
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

        if (!this.validateConfig()) {
            this.updateStatus('CONFIG ERROR');
            return;
        }

        this.state.isScraping = true;
        this.state.scrollCount = 0;
        this.state.noNewDataCount = 0;
        this.state.collectedUsers.clear();
        this.updateCount();

        this.ui.btnVerified.style.display = 'none';
        this.ui.btnFollowers.style.display = 'none';
        this.ui.btnFollowing.style.display = 'none';
        this.ui.btnStop.style.display = 'block';
        this.updateStatus('RUNNING');

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

        if (this.state.collectedUsers.size > 0) {
            this.downloadCSV();
        }
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

        const headers = ['User ID', 'Username', 'Display Name', 'Can DM', 'Followers', 'Following Count', 'Blue Verified', 'Created At', 'Tweets', 'Followed By', 'Following', 'Avatar Url', 'Description'];
        const rows = Array.from(this.state.collectedUsers.values()).map(u => {
            const escape = (text) => `"${String(text).replace(/"/g, '""')}"`;
            return [
                escape(u.id),
                escape(u.screen_name),
                escape(u.name),
                u.can_dm,
                u.followers_count,
                u.friends_count,
                u.is_blue_verified,
                escape(this.formatDate(u.created_at)),
                u.tweets_count,
                u.followed_by,
                u.following,
                escape(u.avatar_url),
                escape(u.description)
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

setTimeout(() => {
    new XExporter();
}, 2000);
