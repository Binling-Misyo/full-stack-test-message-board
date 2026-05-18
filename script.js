/* ==============================================================
   JavaScript 核心逻辑（script.js）
   作用：这个文件同时服务于 index.html 和 submit.html 两个页面
         JS 会自动检测当前页面是哪个，然后执行对应的功能
   学习要点：
     - 变量、函数、事件监听
     - async/await 异步编程
     - fetch API 网络请求
     - DOM 操作（增删改查页面元素）
   ============================================================== */

// ===================== 全局变量 =====================

// 用 let 声明一个变量，用来存储当前生成的验证码字符串
// 验证码是 4 位随机字符，用户输入需要和它比对
// 注意：这个变量是全局的，所以 submitMessage 函数也能访问到它
let captchaCode = '';


// ===================== 验证码相关函数 =====================

/**
 * generateCaptcha() - 生成 4 位随机验证码
 * 
 * 函数用 function 关键字定义，函数名后面跟着 ()
 * 函数体用 { } 包裹
 * 
 * @returns {string} 返回 4 位随机字符串（大小写字母+数字）
 * 
 * 学习点：
 *   - const 声明常量（不能重新赋值）
 *   - for 循环
 *   - Math.random() 生成 0~1 之间的随机小数
 *   - Math.floor() 向下取整
 *   - charAt() 获取字符串中指定位置的字符
 */
function generateCaptcha() {
    // 定义所有可能出现的字符（大写字母 + 小写字母 + 数字）
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';  // 空字符串，用来拼接结果

    // for 循环：i 从 0 到 3，共循环 4 次
    for (let i = 0; i < 4; i++) {
        // Math.random() 生成 0~1 的随机数，乘以 chars.length 得到 0~61 的随机数
        // Math.floor() 取整，然后用 charAt() 取出对应位置的字符
        // 每次循环在 result 后面追加一个随机字符
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;  // return 把结果返回给调用者
}

/**
 * drawCaptcha() - 在 canvas 画布上绘制验证码图片
 * 
 * 学习点：
 *   - document.getElementById() 通过 id 获取页面元素
 *   - canvas 是 HTML5 的画布，用 getContext('2d') 获取 2D 绘图上下文
 *   - 绘制文字、线条、圆点等图形
 */
function drawCaptcha() {
    // 通过 id 找到页面上的 canvas 元素
    const canvas = document.getElementById('captchaCanvas');
    // 如果页面上没有这个元素（比如在 index.html 页面），就直接退出函数
    if (!canvas) return;

    // getContext('2d') 获取 2D 绘图上下文，所有绘图操作都通过 ctx 进行
    const ctx = canvas.getContext('2d');

    // 设置画布的宽和高（单位：像素）
    canvas.width = 120;
    canvas.height = 45;

    // ----- 绘制背景 -----
    ctx.fillStyle = '#f5f5f5';  // 设置填充颜色（浅灰色）
    ctx.fillRect(0, 0, canvas.width, canvas.height);  // 绘制填充矩形（x, y, 宽, 高）

    // 生成新的验证码字符串，并存入全局变量 captchaCode
    captchaCode = generateCaptcha();

    // ----- 绘制验证码文字 -----
    ctx.font = 'bold 24px Arial';  // 设置字体：加粗 24像素 Arial
    ctx.textAlign = 'center';       // 文字居中对齐

    // 定义颜色数组和每个字符的 x 坐标位置
    const colors = ['#333', '#666', '#999', '#555'];
    const positions = [15, 35, 55, 75];  // 4 个字符分别放在不同的 x 位置

    // 循环绘制 4 个字符
    for (let i = 0; i < captchaCode.length; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];  // 随机选一个颜色
        ctx.save();      // 保存当前画布状态
        ctx.translate(positions[i], 30);  // 移动画布原点到指定位置
        // Math.random() - 0.5 生成 -0.5~0.5 的随机数，让每个字符有轻微旋转
        ctx.rotate((Math.random() - 0.5) * 0.3);  // 旋转角度
        ctx.fillText(captchaCode[i], 0, 0);  // 在当前位置绘制字符
        ctx.restore();   // 恢复画布状态（撤销 translate 和 rotate）
    }

    // ----- 绘制干扰线条（防止机器自动识别） -----
    for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = '#ccc';  // 线条颜色
        ctx.beginPath();           // 开始一条新路径
        // moveTo 移动到起点，lineTo 画线到终点
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();  // 执行绘制
    }

    // ----- 绘制干扰圆点 -----
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        // arc 画圆弧：圆心(x, y), 半径, 起始角度, 结束角度
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * refreshCaptcha() - 刷新验证码
 * 直接调用 drawCaptcha() 重新绘制即可
 * 这个函数被 HTML 中的 onclick="refreshCaptcha()" 调用
 */
function refreshCaptcha() {
    drawCaptcha();
}


// ===================== 页面初始化 =====================

/**
 * DOMContentLoaded 事件：当 HTML 文档加载完成后触发
 * 
 * 学习点：
 *   - document.addEventListener() 给文档添加事件监听
 *   - 'DOMContentLoaded' 事件比 window.onload 更早触发
 *   - 箭头函数 () => {} 是 ES6 的新语法，相当于 function() {}
 *   - 通过判断元素是否存在，来决定当前是哪个页面
 */
document.addEventListener('DOMContentLoaded', function() {
    // 尝试获取两个页面各自特有的元素
    const messagesContainer = document.getElementById('messagesContainer');  // index.html 有
    const messageForm = document.getElementById('messageForm');              // submit.html 有

    // 如果找到了 messagesContainer，说明当前在 index.html（留言列表页）
    if (messagesContainer) {
        loadMessages();  // 调用加载留言的函数
    }

    // 如果找到了 messageForm，说明当前在 submit.html（提交留言页）
    if (messageForm) {
        drawCaptcha();  // 绘制验证码

        // 给表单添加 submit（提交）事件监听
        // 当用户点击提交按钮时，会触发这个事件
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();  // 阻止表单的默认提交行为（页面刷新）
            submitMessage();     // 调用我们自己的提交函数
        });
    }
});


// ===================== 加载留言列表 =====================

/**
 * loadMessages() - 从服务器获取留言数据并显示在页面上
 * 
 * async 关键字：表示这个函数是异步的
 * await 关键字：等待一个异步操作完成（比如网络请求）
 * 
 * 学习点：
 *   - async/await 让异步代码看起来像同步代码
 *   - fetch API 用于发送网络请求
 *   - try/catch 用于捕获错误
 *   - 模板字符串 `` 可以嵌入变量 ${变量名}
 */
async function loadMessages() {
    // 获取留言列表的容器元素
    const container = document.getElementById('messagesContainer');

    // try 块：尝试执行可能出错的代码
    try {
        // fetch 发送 GET 请求到 /api/messages 接口
        // await 会等待服务器响应
        const response = await fetch('/api/messages');

        // response.ok 为 true 表示状态码是 200-299（成功）
        // 如果不是，抛出一个错误
        if (!response.ok) {
            throw new Error(`服务器返回 ${response.status} ${response.statusText}`);
        }

        // 检查服务器返回的内容类型是不是 JSON
        // headers.get('content-type') 获取响应头中的内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // 如果不是 JSON，读取返回的文本内容，截取前 100 个字符作为错误信息
            const text = await response.text();
            throw new Error(`响应格式错误，期望JSON但收到: ${text.substring(0, 100)}`);
        }

        // response.json() 把响应体解析成 JavaScript 对象
        const data = await response.json();

        // 判断返回的数据是否成功，并且有留言数据
        if (data.success && data.messages.length > 0) {
            // data.messages 是一个数组，用 .map() 遍历每个留言
            // .map() 返回一个新数组，.join('') 把数组拼接成字符串
            // 模板字符串 `` 中可以嵌入 HTML 标签和 JS 变量
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
            // 没有留言时显示提示信息
            container.innerHTML = '<div class="empty-message">暂无留言，快来发表第一条留言吧！</div>';
        }
    } catch (error) {
        // catch 块：如果 try 块中任何地方抛出错误，都会到这里执行
        container.innerHTML = '<div class="empty-message">加载留言失败，请稍后重试</div>';
        console.error('加载留言失败:', error.message);  // 在浏览器控制台打印错误
    }
}


// ===================== 提交留言 =====================

/**
 * submitMessage() - 收集表单数据并提交到服务器
 * 
 * 学习点：
 *   - 获取表单输入框的值
 *   - 前端数据验证
 *   - fetch POST 请求
 *   - 禁用按钮 + 显示加载动画
 *   - finally 块：无论成功还是失败都会执行
 */
async function submitMessage() {
    // 获取表单中各个输入框的值，.trim() 去掉首尾空格
    const name = document.getElementById('name').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const content = document.getElementById('content').value.trim();
    const captcha = document.getElementById('captcha').value.trim();
    const submitBtn = document.getElementById('submitBtn');  // 提交按钮

    // ----- 前端验证 -----
    // 检查是否有空字段（空字符串在 if 中会被当作 false）
    if (!name || !contact || !content || !captcha) {
        showMessage('请填写完整信息', 'error');  // 显示错误提示
        return;  // 提前退出函数，不再继续执行
    }

    // 验证码比对（忽略大小写）
    if (captcha.toLowerCase() !== captchaCode.toLowerCase()) {
        showMessage('验证码错误', 'error');
        refreshCaptcha();  // 刷新验证码
        return;
    }

    // ----- 提交前的 UI 状态 -----
    // 禁用提交按钮（disabled 属性让按钮变灰且不可点击）
    submitBtn.disabled = true;
    // 添加 loading 类，CSS 会让按钮显示转圈动画、隐藏文字
    submitBtn.classList.add('loading');

    // try 块：执行网络请求
    try {
        // fetch 发送 POST 请求
        const response = await fetch('/api/messages', {
            method: 'POST',  // 请求方法
            headers: {
                'Content-Type': 'application/json'  // 告诉服务器我们发送的是 JSON 数据
            },
            // JSON.stringify() 把 JavaScript 对象转换成 JSON 字符串
            body: JSON.stringify({ name, contact, content })
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`服务器返回 ${response.status} ${response.statusText}`);
        }

        // 检查响应格式
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`响应格式错误，期望JSON但收到: ${text.substring(0, 100)}`);
        }

        // 解析响应 JSON
        const data = await response.json();

        // 根据服务器返回的结果做不同处理
        if (data.success) {
            showMessage('留言提交成功！', 'success');
            document.getElementById('messageForm').reset();  // 重置表单（清空所有输入）
            refreshCaptcha();  // 刷新验证码
        } else {
            showMessage(data.message || '提交失败，请稍后重试', 'error');
        }
    } catch (error) {
        // 网络错误或服务器错误
        showMessage('提交失败: ' + error.message, 'error');
        console.error('提交留言失败:', error.message);
    } finally {
        // finally 块：无论 try 成功还是 catch 捕获到错误，都会执行
        // 恢复按钮状态，让用户可以再次提交
        submitBtn.disabled = false;       // 启用按钮
        submitBtn.classList.remove('loading');  // 移除 loading 类，隐藏转圈动画
    }
}


// ===================== 提示消息 =====================

/**
 * showMessage() - 在页面顶部显示一条提示消息（成功或错误）
 * 
 * 学习点：
 *   - document.querySelector() 用 CSS 选择器查找元素
 *   - document.createElement() 创建新元素
 *   - insertBefore() 在指定位置插入元素
 *   - setTimeout() 定时器，延迟执行代码
 * 
 * @param {string} text - 要显示的消息文字
 * @param {string} type - 消息类型：'success' 或 'error'
 */
function showMessage(text, type) {
    // 找到表单区域，把消息插入到最前面
    const container = document.querySelector('.form-section');

    // 如果页面上已经有一条提示消息，先把它删掉
    const existingMessage = container.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();  // 从 DOM 中移除元素
    }

    // 创建一个新的 div 元素
    const messageDiv = document.createElement('div');
    // 根据 type 设置不同的 CSS 类名
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = text;  // 设置元素内的文字内容

    // 把新消息插入到容器的第一个子元素之前（显示在最顶部）
    container.insertBefore(messageDiv, container.firstChild);

    // 3 秒后自动移除这条消息
    // setTimeout(函数, 毫秒) 在指定时间后执行函数
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);  // 3000 毫秒 = 3 秒
}


// ===================== 工具函数 =====================

/**
 * escapeHtml() - 防止 XSS 攻击
 * 
 * 什么是 XSS 攻击？
 * 如果用户在留言中输入 <script>alert('坏')</script>
 * 直接插入到页面中就会执行这段脚本
 * escapeHtml 会把特殊字符转换成安全的 HTML 实体
 * 
 * 学习点：
 *   - 安全性：永远不要信任用户的输入
 *   - innerHTML 和 textContent 的区别
 *     - textContent 只设置文字（安全）
 *     - innerHTML 会解析 HTML 标签（危险）
 * 
 * @param {string} str - 用户输入的原始字符串
 * @returns {string} 转义后的安全字符串
 */
function escapeHtml(str) {
    // 创建一个临时的 div 元素
    const div = document.createElement('div');
    // 用 textContent 设置文字（浏览器会自动转义特殊字符）
    div.textContent = str;
    // 用 innerHTML 读取时，得到的是转义后的 HTML 字符串
    // 例如：< 变成了 &lt;  > 变成了 &gt;
    return div.innerHTML;
}

/**
 * formatTime() - 把时间戳格式化成友好的显示
 * 
 * 学习点：
 *   - Date 对象：处理日期和时间
 *   - 时间差计算
 *   - 条件判断 if/else if/else
 *   - String.padStart() 补零
 * 
 * @param {string} dateStr - 服务器返回的时间字符串
 * @returns {string} 格式化后的时间文字
 */
function formatTime(dateStr) {
    // 把时间字符串转换成 Date 对象
    const date = new Date(dateStr);
    const now = new Date();  // 当前时间
    const diff = now - date;  // 时间差（单位：毫秒）

    // 根据时间差显示不同的文字
    if (diff < 60000) {  // 小于 60 秒
        return '刚刚';
    } else if (diff < 3600000) {  // 小于 1 小时
        return `${Math.floor(diff / 60000)}分钟前`;  // 转换为分钟
    } else if (diff < 86400000) {  // 小于 24 小时
        return `${Math.floor(diff / 3600000)}小时前`;  // 转换为小时
    } else {
        // 超过 1 天，显示完整日期时间
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');  // getMonth() 从 0 开始，所以要 +1
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        // padStart(2, '0') 保证至少 2 位，不足的在前面补 0
        // 例如：3 变成 "03"
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }
}