// 本地开发服务器
const app = require('./app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`本地服务器运行在 http://localhost:${PORT}`);
});