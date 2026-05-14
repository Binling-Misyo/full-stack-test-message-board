const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

let pool;

function getPool() {
    if (!pool) {
        const config = process.env.DATABASE_URL
            ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
            : {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 5432,
                ssl: { rejectUnauthorized: false }
            };

        pool = new Pool(config);

        pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                contact VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, (err) => {
            if (err) console.error('创建表失败:', err);
            else console.log('数据库表就绪');
        });
    }
    return pool;
}

app.get('/api/messages', (req, res) => {
    const db = getPool();
    db.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('查询留言失败:', err);
            return res.json({ success: false, message: '查询失败' });
        }
        res.json({ success: true, messages: results.rows });
    });
});

app.post('/api/messages', (req, res) => {
    const { name, contact, content } = req.body;

    if (!name || !contact || !content) {
        return res.json({ success: false, message: '请填写完整信息' });
    }

    const db = getPool();
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

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app;