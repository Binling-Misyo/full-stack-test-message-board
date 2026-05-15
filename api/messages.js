const { Pool } = require('pg');

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
    }
    return pool;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const db = getPool();

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                contact VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error('创建表失败:', err);
    }

    if (req.method === 'GET') {
        try {
            const result = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
            res.status(200).json({ success: true, messages: result.rows });
        } catch (err) {
            console.error('查询留言失败:', err);
            res.status(500).json({ success: false, message: '查询失败' });
        }
    } else if (req.method === 'POST') {
        const { name, contact, content } = req.body;

        if (!name || !contact || !content) {
            res.status(400).json({ success: false, message: '请填写完整信息' });
            return;
        }

        try {
            const result = await db.query(
                'INSERT INTO messages (name, contact, content) VALUES ($1, $2, $3) RETURNING id',
                [name, contact, content]
            );
            res.status(200).json({ success: true, message: '提交成功', id: result.rows[0].id });
        } catch (err) {
            console.error('插入留言失败:', err);
            res.status(500).json({ success: false, message: '提交失败' });
        }
    } else {
        res.status(405).json({ success: false, message: '方法不允许' });
    }
};