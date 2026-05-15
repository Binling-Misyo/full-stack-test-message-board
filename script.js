let captchaCode = '';

function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function drawCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
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

document.addEventListener('DOMContentLoaded', function() {
    drawCaptcha();
    loadMessages();
    
    const form = document.getElementById('messageForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitMessage();
    });
});

async function loadMessages() {
    const container = document.getElementById('messagesContainer');
    
    try {
        const response = await fetch('/api/messages');
        
        if (!response.ok) {
            throw new Error(`服务器返回 ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`响应格式错误，期望JSON但收到: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.messages.length > 0) {
            container.innerHTML = data.messages.map(message => `
                <div class="message-item">
                    <div class="message-header">
                        <span class="message-name">${escapeHtml(message.name)}</span>
                        <span class="message-time">${formatTime(message.created_at)}</span>
                    </div>
                    <div class="message-contact">联系方式: ${escapeHtml(message.contact)}</div>
                    <div class="message-content">${escapeHtml(message.content)}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-message">暂无留言，快来发表第一条留言吧！</div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-message">加载留言失败，请稍后重试</div>';
        console.error('加载留言失败:', error.message);
    }
}

async function submitMessage() {
    const name = document.getElementById('name').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const content = document.getElementById('content').value.trim();
    const captcha = document.getElementById('captcha').value.trim();
    
    if (!name || !contact || !content || !captcha) {
        showMessage('请填写完整信息', 'error');
        return;
    }
    
    if (captcha.toLowerCase() !== captchaCode.toLowerCase()) {
        showMessage('验证码错误', 'error');
        refreshCaptcha();
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, contact, content })
        });
        
        if (!response.ok) {
            throw new Error(`服务器返回 ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`响应格式错误，期望JSON但收到: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('留言提交成功！', 'success');
            document.getElementById('messageForm').reset();
            refreshCaptcha();
            loadMessages();
        } else {
            showMessage(data.message || '提交失败，请稍后重试', 'error');
        }
    } catch (error) {
        showMessage('提交失败: ' + error.message, 'error');
        console.error('提交留言失败:', error.message);
    }
}

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

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return '刚刚';
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    } else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }
}