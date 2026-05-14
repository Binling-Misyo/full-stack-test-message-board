const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// 创建数据库连接池（更适合Serverless环境）
let pool;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        // 自动创建表
        pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                contact VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `, (err) => {
            if (err) console.error('创建表失败:', err);
            else console.log('数据库表就绪');
        });
    }
    return pool;
}

// 获取所有留言
app.get('/api/messages', (req, res) => {
    const db = getPool();
    db.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('查询留言失败:', err);
            return res.json({ success: false, message: '查询失败' });
        }
        res.json({ success: true, messages: results });
    });
});

// 提交留言
app.post('/api/messages', (req, res) => {
    const { name, contact, content } = req.body;
    
    if (!name || !contact || !content) {
        return res.json({ success: false, message: '请填写完整信息' });
    }
    
    const db = getPool();
    db.query(
        'INSERT INTO messages (name, contact, content) VALUES (?, ?, ?)',
        [name, contact, content],
        (err, results) => {
            if (err) {
                console.error('插入留言失败:', err);
                return res.json({ success: false, message: '提交失败' });
            }
            res.json({ success: true, message: '提交成功', id: results.insertId });
        }
    );
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app;