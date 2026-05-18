/* ==============================================================
   Vercel Serverless 函数（api/messages.js）
   作用：处理 /api/messages 接口的请求
         - GET 请求：从数据库查询所有留言并返回
         - POST 请求：接收表单数据并存入数据库
   关系：这是前端 script.js 中 fetch('/api/messages') 调用的后端接口
   学习要点：
     - Node.js 后端开发
     - PostgreSQL 数据库操作
     - Serverless 函数（无服务器架构）
     - CORS 跨域资源共享
   ============================================================== */

// ===================== 引入依赖 =====================

// require 是 Node.js 中引入模块的方式（类似前端的 import）
// { Pool } 是 pg 模块中的连接池类，用于管理数据库连接
// 连接池的作用：不用每次请求都创建新连接，提高性能
const { Pool } = require('pg');


// ===================== 数据库连接池 =====================

// 定义一个变量来存储连接池实例（初始为 undefined）
// 用 let 而不是 const，因为第一次使用时才创建
let pool;

/**
 * getPool() - 获取数据库连接池
 * 
 * 学习点：
 *   - 单例模式：确保整个应用只创建一个连接池实例
 *   - process.env：读取环境变量
 *   - 三元运算符 ? : 根据条件选择不同的值
 *   - SSL 加密：数据库连接需要 SSL 安全传输
 * 
 * @returns {Pool} PostgreSQL 连接池对象
 */
function getPool() {
    // 如果 pool 还没有创建（第一次调用），才创建新的
    if (!pool) {
        // 判断是否使用 DATABASE_URL 连接字符串方式
        // 如果设置了 DATABASE_URL，就用它；否则用单独的连接参数
        const config = process.env.DATABASE_URL
            ? {
                // 连接字符串方式（推荐，一行搞定所有连接信息）
                connectionString: process.env.DATABASE_URL,
                // ssl 配置：rejectUnauthorized: false 表示接受自签名证书
                // Supabase 要求 SSL 连接，但可以不验证证书
                ssl: { rejectUnauthorized: false }
              }
            : {
                // 单独参数方式（需要分别设置每个参数）
                host: process.env.DB_HOST,       // 数据库主机地址
                user: process.env.DB_USER,        // 数据库用户名
                password: process.env.DB_PASSWORD, // 数据库密码
                database: process.env.DB_NAME,     // 数据库名称
                port: process.env.DB_PORT || 5432, // 端口号，默认 5432
                ssl: { rejectUnauthorized: false }
              };

        // 用配置创建新的连接池
        pool = new Pool(config);
    }
    // 返回连接池实例
    return pool;
}


// ===================== 导出 Serverless 函数 =====================

/**
 * module.exports 是 Node.js 导出模块的方式
 * 导出的函数会被 Vercel 自动调用
 * 
 * Vercel Serverless 函数规范：
 * - 导出一个 async 函数
 * - 参数是 (req, res)
 *   - req：请求对象（包含 method、body、headers 等）
 *   - res：响应对象（用于返回数据给客户端）
 * 
 * 学习点：
 *   - module.exports 导出
 *   - 箭头函数 async (req, res) => {}
 *   - HTTP 请求方法：GET（查询）、POST（新增）、OPTIONS（预检）
 *   - HTTP 状态码：200（成功）、400（参数错误）、405（方法不允许）、500（服务器错误）
 */
module.exports = async (req, res) => {
    // ===== 设置 CORS 跨域头 =====
    // 浏览器安全策略：不同域名之间默认不能互相请求
    // CORS 告诉浏览器"这个接口允许跨域访问"
    res.setHeader('Access-Control-Allow-Origin', '*');   // 允许所有域名访问
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');  // 允许的请求方法
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');  // 允许的请求头

    // ===== 处理 OPTIONS 预检请求 =====
    // 浏览器在发送 POST 请求前，会先发一个 OPTIONS 请求询问服务器是否允许
    // 如果 OPTIONS 请求不通过，浏览器就不会发送真正的 POST 请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();  // 返回 200，告诉浏览器可以继续
        return;                 // 不再执行后面的代码
    }

    // ===== 获取数据库连接 =====
    const db = getPool();

    // ===== 自动创建数据表 =====
    // 每次请求都尝试创建表，如果表已存在则不会重复创建
    // CREATE TABLE IF NOT EXISTS 是 PostgreSQL 的语法
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,           -- id：自增主键（自动编号）
                name VARCHAR(100) NOT NULL,       -- name：用户名，最长100字符，不能为空
                contact VARCHAR(200) NOT NULL,    -- contact：联系方式，最长200字符
                content TEXT NOT NULL,            -- content：留言内容，TEXT 类型不限长度
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- created_at：创建时间，默认当前时间
            );
        `);
    } catch (err) {
        // 创建表失败时打印错误，但不中断请求
        console.error('创建表失败:', err);
    }

    // ===== 根据请求方法处理不同的业务逻辑 =====

    // ----- GET 请求：查询留言列表 -----
    if (req.method === 'GET') {
        try {
            // db.query() 执行 SQL 查询语句
            // SELECT * 查询所有字段
            // ORDER BY created_at DESC 按创建时间倒序排列（最新的在前）
            const result = await db.query('SELECT * FROM messages ORDER BY created_at DESC');

            // 返回成功响应
            // res.status(200) 设置 HTTP 状态码 200（成功）
            // .json() 把 JavaScript 对象转换成 JSON 字符串返回
            res.status(200).json({
                success: true,           // 业务层面的成功标志
                messages: result.rows    // 查询结果的行数据（数组）
            });
        } catch (err) {
            // 查询失败时返回 500 错误
            console.error('查询留言失败:', err);
            res.status(500).json({ success: false, message: '查询失败' });
        }

    // ----- POST 请求：提交新留言 -----
    } else if (req.method === 'POST') {
        // 从请求体中解构出三个字段
        // req.body 是前端发送的 JSON 数据，Express 已经帮我们解析好了
        const { name, contact, content } = req.body;

        // 参数验证：检查三个字段是否都有值
        if (!name || !contact || !content) {
            // 如果缺少参数，返回 400（客户端请求错误）
            res.status(400).json({ success: false, message: '请填写完整信息' });
            return;  // 提前退出
        }

        try {
            // 执行 INSERT 插入语句
            // $1, $2, $3 是参数占位符，防止 SQL 注入攻击
            // RETURNING id 返回新插入记录的 id
            const result = await db.query(
                'INSERT INTO messages (name, contact, content) VALUES ($1, $2, $3) RETURNING id',
                [name, contact, content]  // 对应 $1, $2, $3
            );

            // 返回成功响应
            res.status(200).json({
                success: true,
                message: '提交成功',
                id: result.rows[0].id  // 返回新留言的 ID
            });
        } catch (err) {
            console.error('插入留言失败:', err);
            res.status(500).json({ success: false, message: '提交失败' });
        }

    // ----- 其他请求方法（如 PUT、DELETE）-----
    } else {
        // 返回 405 Method Not Allowed（方法不允许）
        res.status(405).json({ success: false, message: '方法不允许' });
    }
};