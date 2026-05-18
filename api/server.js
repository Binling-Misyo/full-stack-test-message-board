/* ==============================================================
   本地开发服务器（api/server.js）
   作用：在本地运行开发服务器，方便调试
   关系：引用 api/app.js 中的 Express 应用
         运行方式：node api/server.js 或 npm run dev
   学习要点：
     - 如何启动一个 HTTP 服务器
     - 端口号的概念
     - npm scripts 的执行
   ============================================================== */

// 引入 Express 应用（在 app.js 中定义）
const app = require('./app');

// 设置端口号：优先使用环境变量 PORT，没有则用 3001
// 学习点：
//   - process.env.PORT：Vercel 等平台会自动设置这个环境变量
//   - || 运算符：如果左边为 falsy（undefined、null、0 等），就用右边的值
const PORT = process.env.PORT || 3001;

// app.listen() 启动 HTTP 服务器
// 第一个参数：端口号
// 第二个参数：启动成功后的回调函数
app.listen(PORT, () => {
    // 在控制台打印提示信息
    // 学习点：模板字符串 `` 中可以嵌入 ${变量}
    console.log(`本地服务器运行在 http://localhost:${PORT}`);
});