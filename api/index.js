/* ==============================================================
   Vercel Serverless 入口（api/index.js）
   作用：Vercel 部署时使用的入口文件
         把 Express 应用包装成 Serverless 函数
   关系：引用 api/app.js 中的 Express 应用
         这是 Vercel 部署方案的一部分（旧方案）
   学习要点：
     - module.exports 导出
     - require 引入模块
     - Vercel Serverless 函数规范
   ============================================================== */

// 引入 Express 应用（在 app.js 中定义）
const app = require('./app');

// 导出 app，Vercel 会自动将其包装成 Serverless 函数
// Vercel 会调用 app 来处理所有进入的 HTTP 请求
module.exports = app;