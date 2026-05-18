/* ==============================================================
   Express 应用配置（api/app.js）
   作用：使用 Express 框架搭建的本地开发服务器
         - 提供 /api/messages 接口（GET 查询、POST 新增）
         - 提供 /api/health 健康检查接口
         - 托管静态文件（HTML、CSS、JS）
   关系：这是本地开发用的服务器，Vercel 部署时不使用这个文件
         api/index.js 和 api/server.js 都引用这个文件
   学习要点：
     - Express 框架的使用
     - 中间件（Middleware）的概念
     - 路由（Route）的定义
     - 回调函数处理异步操作
   ============================================================== */

// ===================== 引入依赖 =====================

// express：Node.js 最流行的 Web 框架，简化了路由、中间件等操作
const express = require('express');
// { Pool }：pg 模块的数据库连接池
const { Pool } = require('pg');
// cors：跨域资源共享中间件，允许前端跨域请求
const cors = require('cors');
// path：Node.js 内置模块，用于处理文件路径
const path = require('path');

// dotenv：读取 .env 文件中的环境变量
// .config() 会把 .env 文件的内容加载到 process.env 中
require('dotenv').config();


// ===================== 创建 Express 应用 =====================

// 调用 express() 创建一个应用实例
// app 对象包含了配置路由、中间件、启动服务器等方法
const app = express();


// ===================== 注册中间件 =====================

// 中间件（Middleware）是 Express 的核心概念
// 可以理解为"请求处理流水线"上的一个个处理环节
// 每个中间件可以对请求做处理，然后传递给下一个中间件

// cors()：允许跨域请求（开发时前端和后端端口不同）
app.use(cors());
// express.json()：解析请求体中的 JSON 数据
// 这样 req.body 才能拿到前端发送的 JSON 数据
app.use(express.json());
// express.static()：托管静态文件
// path.join(__dirname, '../') 指向项目根目录
// 这样访问 /index.html 就能直接返回根目录下的 index.html
app.use(express.static(path.join(__dirname, '../')));


// ===================== 数据库连接池 =====================

let pool;

/**
 * getPool() - 获取数据库连接池（单例模式）
 * 
 * 学习点：
 *   - 单例模式：全局只创建一个连接池实例
 *   - 连接池：预先创建多个数据库连接，需要时直接取用
 *   - 环境变量：通过 process.env 读取配置
 */
function getPool() {
    if (!pool) {
        // 支持两种配置方式：
        // 1. DATABASE_URL 连接字符串（推荐）
        // 2. 单独的 DB_HOST、DB_USER 等参数
        const config = process.env.DATABASE_URL
            ? {
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
              }
            : {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 5432,
                ssl: { rejectUnauthorized: false }
              };

        pool = new Pool(config);

        // 创建连接池后立即尝试创建数据表
        // 使用回调函数（callback）方式处理异步结果
        pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                contact VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, (err) => {
            // 回调函数：query 执行完成后调用
            if (err) console.error('创建表失败:', err);
            else console.log('数据库表就绪');
        });
    }
    return pool;
}


// ===================== 定义路由 =====================

/**
 * 路由（Route）定义 API 的访问路径和处理逻辑
 * app.get('/path', handler) 处理 GET 请求
 * app.post('/path', handler) 处理 POST 请求
 */

// ----- GET /api/messages：查询所有留言 -----
// 学习点：
//   - 回调函数 (req, res) => {}
//   - req：请求对象，包含客户端发送的信息
//   - res：响应对象，用于返回数据给客户端
app.get('/api/messages', (req, res) => {
    const db = getPool();

    // db.query() 执行 SQL 查询
    // 第二个参数是回调函数：(err, results) => {}
    //   - err：如果查询出错，err 包含错误信息
    //   - results：查询结果，results.rows 是数据行数组
    db.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('查询留言失败:', err);
            return res.json({ success: false, message: '查询失败' });
        }
        // 返回成功响应
        res.json({ success: true, messages: results.rows });
    });
});

// ----- POST /api/messages：提交新留言 -----
app.post('/api/messages', (req, res) => {
    // 从请求体中解构出三个字段
    const { name, contact, content } = req.body;

    // 参数验证
    if (!name || !contact || !content) {
        return res.json({ success: false, message: '请填写完整信息' });
    }

    const db = getPool();
    // 使用参数化查询（$1, $2, $3）防止 SQL 注入
    // RETURNING id 返回新插入记录的 id
    db.query(
        'INSERT INTO messages (name, contact, content) VALUES ($1, $2, $3) RETURNING id',
        [name, contact, content],
        (err, results) => {
            if (err) {
                console.error('插入留言失败:', err);
                return res.json({ success: false, message: '提交失败' });
            }
            res.json({ success: true, message: '提交成功', id: results.rows[0].id });
        }
    );
});

// ----- GET /api/health：健康检查接口 -----
// 用于检查服务器是否正常运行
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});


// ===================== 导出 app =====================

// module.exports 导出 app 实例
// 这样 api/index.js 和 api/server.js 才能引用
module.exports = app;