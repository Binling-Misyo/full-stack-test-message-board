/* ==============================================================
   JavaScript 核心逻辑（script.js）
   作用：控制提交留言页面（submit.html）的功能
         - 验证码生成与绘制
         - 表单提交
         - 错误/成功提示
   ============================================================== */

let captchaCode = '';

/**
 * generateCaptcha() - 生成 4 位随机验证码
 * @returns {string} 返回 4 位随机字符串（大小写字母+数字）
 */
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * drawCaptcha() - 在 canvas 画布上绘制验证码图片
 */
function drawCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 120;
    canvas.height = 45;

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    captchaCode = generateCaptcha();

    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';

    const colors = ['#333', '#666', '#999', '#555'];
    const positions = [15, 35, 55, 75];

    for (let i = 0; i < captchaCode.length; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.save();
        ctx.translate(positions[i], 30);
        ctx.rotate((Math.random() - 0.5) * 0.3);
        ctx.fillText(captchaCode[i], 0, 0);
        ctx.restore();
    }

    for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }

    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

function refreshCaptcha() {
    drawCaptcha();
}

/**
 * DOMContentLoaded 事件：页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', function () {
    const messageForm = document.getElementById('messageForm');

    if (messageForm) {
        drawCaptcha();
        messageForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitMessage();
        });
    }
});

/**
 * submitMessage() - 收集表单数据并提交到服务器
 */
async function submitMessage() {
    const name = document.getElementById('name').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const content = document.getElementById('content').value.trim();
    const captcha = document.getElementById('captcha').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!name || !contact || !content || !captcha) {
        showMessage('请填写完整信息', 'error');
        return;
    }

    if (captcha.toLowerCase() !== captchaCode.toLowerCase()) {
        showMessage('验证码错误', 'error');
        refreshCaptcha();
        return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, contact, content })
        });

        if (!response.ok) {
            throw new Error(`服务器返回 ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`响应格式错误: ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        if (data.success) {
            showMessage('留言提交成功！', 'success');
            document.getElementById('messageForm').reset();
            refreshCaptcha();
        } else {
            showMessage(data.message || '提交失败，请稍后重试', 'error');
        }
    } catch (error) {
        showMessage('提交失败: ' + error.message, 'error');
        console.error('提交留言失败:', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

/**
 * showMessage() - 显示提示消息（成功或错误）
 * @param {string} text - 消息文字
 * @param {string} type - 类型：'success' 或 'error'
 */
function showMessage(text, type) {
    const container = document.querySelector('.form-section');

    const existingMessage = container.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = text;

    container.insertBefore(messageDiv, container.firstChild);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}