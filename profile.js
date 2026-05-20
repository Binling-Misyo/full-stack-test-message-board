/* ==============================================================
   个人作品集 JavaScript（profile.js）
   作用：控制个人档案主页（index.html）的交互逻辑
         - Canvas 动态背景（代码雨 / 圆形雨 / 几何闪烁）
         - 选项卡切换
         - 响应式适配
   学习要点：
     - IIFE（立即执行函数表达式）
     - Canvas 2D 绘图
     - requestAnimationFrame 动画循环
     - 事件监听
   ============================================================== */

(function () {
    'use strict';

    /* ==================== DOM 元素 ==================== */
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    const tabNav = document.getElementById('tabNav');
    const tabBtns = tabNav.querySelectorAll('.tab-btn');
    const contentPanels = document.querySelectorAll('.content-panel');
    const avatarRing = document.getElementById('avatarRing');
    const contentWrapper = document.getElementById('contentWrapper');

    /* ==================== 状态 ==================== */
    let currentTab = 'programming';
    let animFrameId = null;
    let width, height;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* ==================== Canvas 尺寸调整 ==================== */
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        initCodeRainCols();
        initCircleRainParticles();
        initGeoShapes();
    }

    /* ==================== 编程板块：代码雨 ==================== */
    const codeChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{}[]()<>/\\|!@#$%^&*+-=_;:';
    const codeCharArr = codeChars.split('');
    let codeCols = [];
    const CODE_COL_WIDTH = 18;
    let codeColCount = 0;

    function initCodeRainCols() {
        codeColCount = Math.floor(width / CODE_COL_WIDTH) + 1;
        codeCols = [];
        for (let i = 0; i < codeColCount; i++) {
            codeCols.push({
                x: i * CODE_COL_WIDTH,
                y: Math.random() * height * -1,
                speed: 1.2 + Math.random() * 3.5,
                charIndex: Math.floor(Math.random() * codeCharArr.length),
                useAccent: Math.random() < 0.12,
                brightness: 0.5 + Math.random() * 0.5,
            });
        }
    }

    function drawCodeRain() {
        ctx.fillStyle = 'rgba(8, 14, 24, 0.14)';
        ctx.fillRect(0, 0, width, height);
        for (let col of codeCols) {
            if (col.y > height + 80 && Math.random() < 0.025) {
                col.y = Math.random() * -120;
                col.speed = 1.2 + Math.random() * 3.5;
                col.useAccent = Math.random() < 0.12;
                col.brightness = 0.5 + Math.random() * 0.5;
            }
            col.y += col.speed;
            const char = codeCharArr[Math.floor(Math.random() * codeCharArr.length)];
            const headY = col.y;
            if (headY > -20 && headY < height + 20) {
                const alpha = Math.min(1, Math.max(0.3, col.brightness));
                if (col.useAccent) {
                    ctx.fillStyle = `rgba(255,215,60,${alpha})`;
                    ctx.shadowColor = 'rgba(255,215,60,0.7)';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.fillStyle = `rgba(100,185,245,${alpha})`;
                    ctx.shadowColor = 'rgba(100,185,245,0.6)';
                    ctx.shadowBlur = 6;
                }
                ctx.font = 'bold 15px "Courier New", "Source Code Pro", monospace';
                ctx.fillText(char, col.x, headY);
                ctx.shadowBlur = 0;
            }
            for (let j = 1; j <= 4; j++) {
                const tailY = col.y - j * 22;
                if (tailY > -20 && tailY < height + 20) {
                    const alpha = Math.max(0.06, (0.35 - j * 0.08) * col.brightness);
                    const tailChar = codeCharArr[Math.floor(Math.random() * codeCharArr.length)];
                    if (col.useAccent) {
                        ctx.fillStyle = `rgba(200,170,50,${alpha})`;
                    } else {
                        ctx.fillStyle = `rgba(70,150,220,${alpha})`;
                    }
                    ctx.font = `${13 - j}px "Courier New", monospace`;
                    ctx.fillText(tailChar, col.x + j * 1.5, tailY);
                }
            }
        }
    }

    /* ==================== 绘画板块：逆流小圆形雨 ==================== */
    let circleParticles = [];
    const CIRCLE_COUNT_DESKTOP = 100;
    const CIRCLE_COUNT_MOBILE = 50;

    function getCircleCount() {
        return width < 600 ? CIRCLE_COUNT_MOBILE : CIRCLE_COUNT_DESKTOP;
    }

    function initCircleRainParticles() {
        const count = getCircleCount();
        circleParticles = [];
        for (let i = 0; i < count; i++) {
            circleParticles.push({
                x: Math.random() * width,
                y: height + Math.random() * 200,
                radius: 1.5 + Math.random() * 5.5,
                speed: 0.4 + Math.random() * 1.8,
                colorType: Math.random() < 0.65 ? 'white' : 'purple',
                alpha: 0.25 + Math.random() * 0.6,
                wobbleAmp: Math.random() * 1.5,
                wobbleFreq: 0.01 + Math.random() * 0.03,
                wobbleOffset: Math.random() * Math.PI * 2,
            });
        }
    }

    function drawCircleRain() {
        ctx.fillStyle = 'rgba(245,243,252,0.13)';
        ctx.fillRect(0, 0, width, height);
        for (let p of circleParticles) {
            p.y -= p.speed;
            if (p.y < -20) {
                p.y = height + Math.random() * 40;
                p.x = Math.random() * width;
                p.radius = 1.5 + Math.random() * 5.5;
                p.speed = 0.4 + Math.random() * 1.8;
            }
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;

            if (p.colorType === 'white') {
                ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
                ctx.shadowColor = 'rgba(255,255,255,0.5)';
                ctx.shadowBlur = p.radius * 2.5;
            } else {
                ctx.fillStyle = `rgba(175,130,225,${p.alpha * 0.85})`;
                ctx.shadowColor = 'rgba(170,125,220,0.6)';
                ctx.shadowBlur = p.radius * 3;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    /* ==================== 游戏板块：几何线条闪烁 ==================== */
    let geoShapes = [];
    const GEO_COUNT_DESKTOP = 28;
    const GEO_COUNT_MOBILE = 16;

    function getGeoCount() {
        return width < 600 ? GEO_COUNT_MOBILE : GEO_COUNT_DESKTOP;
    }

    function initGeoShapes() {
        const count = getGeoCount();
        geoShapes = [];
        const types = ['line', 'circle', 'rect'];
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const shape = { type, period: 0.6 + Math.random() * 2.8, phase: Math.random() * Math.PI * 2, minAlpha: 0.05, maxAlpha: 0.55 + Math.random() * 0.4 };
            if (type === 'line') {
                shape.x1 = Math.random() * width; shape.y1 = Math.random() * height;
                shape.length = 40 + Math.random() * 160; shape.angle = Math.random() * Math.PI * 2;
                shape.x2 = shape.x1 + Math.cos(shape.angle) * shape.length;
                shape.y2 = shape.y1 + Math.sin(shape.angle) * shape.length;
                shape.lineWidth = 1 + Math.random() * 2.5;
            } else if (type === 'circle') {
                shape.cx = Math.random() * width; shape.cy = Math.random() * height;
                shape.radius = 15 + Math.random() * 70; shape.lineWidth = 1 + Math.random() * 2;
            } else if (type === 'rect') {
                shape.rx = Math.random() * (width - 100); shape.ry = Math.random() * (height - 100);
                shape.rw = 30 + Math.random() * 100; shape.rh = 20 + Math.random() * 80;
                shape.lineWidth = 1 + Math.random() * 2.5; shape.rotation = Math.random() * Math.PI * 0.5;
            }
            geoShapes.push(shape);
        }
    }

    function drawGeoShapes() {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(0, 0, width, height);
        for (let shape of geoShapes) {
            const sin = Math.sin(performance.now() * 0.001 * (2 * Math.PI) / shape.period + shape.phase);
            const normalized = (sin + 1) / 2;
            const alpha = shape.minAlpha + Math.pow(normalized, 0.7) * (shape.maxAlpha - shape.minAlpha);
            if (alpha < 0.03) continue;
            ctx.strokeStyle = `rgba(60,240,150,${alpha})`;
            ctx.shadowColor = `rgba(60,240,150,${alpha * 0.8})`;
            ctx.shadowBlur = 6 + alpha * 12;
            ctx.lineWidth = shape.lineWidth;
            ctx.beginPath();
            if (shape.type === 'line') {
                ctx.moveTo(shape.x1, shape.y1); ctx.lineTo(shape.x2, shape.y2);
            } else if (shape.type === 'circle') {
                ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
            } else if (shape.type === 'rect') {
                const cx = shape.rx + shape.rw / 2, cy = shape.ry + shape.rh / 2;
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(shape.rotation);
                ctx.strokeRect(-shape.rw / 2, -shape.rh / 2, shape.rw, shape.rh);
                ctx.restore(); continue;
            }
            ctx.stroke(); ctx.shadowBlur = 0;
        }
    }

    /* ==================== 主绘制循环 ==================== */
    function drawFrame() {
        switch (currentTab) {
            case 'programming': drawCodeRain(); break;
            case 'art': drawCircleRain(); break;
            case 'gaming': drawGeoShapes(); break;
            default: drawCodeRain();
        }
        animFrameId = requestAnimationFrame(drawFrame);
    }

    /* ==================== 选项卡切换 ==================== */
    function switchTab(tabName) {
        if (currentTab === tabName) return;
        currentTab = tabName;
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        avatarRing.className = 'avatar-ring ' + tabName;
        contentPanels.forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById('panel-' + tabName);
        if (targetPanel) {
            requestAnimationFrame(() => targetPanel.classList.add('active'));
        }
    }

    /* ==================== 事件绑定 ==================== */
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            switchTab(this.getAttribute('data-tab'));
        });
    });

    document.addEventListener('keydown', function (e) {
        if (document.activeElement === document.body) {
            if (e.key === '1') switchTab('programming');
            else if (e.key === '2') switchTab('art');
            else if (e.key === '3') switchTab('gaming');
        }
    });

    /* ==================== 窗口事件 ==================== */
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 180);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        } else {
            if (!animFrameId) animFrameId = requestAnimationFrame(drawFrame);
        }
    });

    /* ==================== 初始化 ==================== */
    function init() {
        resizeCanvas();
        currentTab = 'programming';
        document.getElementById('panel-programming')?.classList.add('active');
        avatarRing.className = 'avatar-ring programming';
        if (!animFrameId) animFrameId = requestAnimationFrame(drawFrame);
    }

    init();

    /* ==================== 触摸优化 ==================== */
    tabBtns.forEach(btn => {
        btn.addEventListener('touchstart', function () { this.style.transform = 'scale(0.94)'; }, { passive: true });
        btn.addEventListener('touchend', function () { this.style.transform = ''; }, { passive: true });
    });
})();