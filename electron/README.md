# Electron 桌面封装（可选）

本项目本质是一个 Web 应用（React + Vite 前端 + Express 后端），已可在浏览器中开发与使用。
如需将其包装为桌面客户端，本目录提供了 Electron 配置。

## 开发阶段（连接 Genie 预览）

1. 确保前端开发服务器在运行（默认 http://localhost:5173）。
2. 安装依赖：`cd electron && npm install`
3. 启动桌面窗口：`cd electron && npm start`
   - 默认加载 `http://localhost:5173`，前端的 `/api` 请求会由 Vite 代理转发到本地后端（:3000）。
   - 如需指定地址，设置环境变量 `ELECTRON_START_URL`。

## 打包为独立桌面应用

1. 构建前端：`cd frontend && npm run build`（产物在 `frontend/dist`）。
2. 将 `frontend/dist` 复制到 `electron/out`。
3. 修改 `main.js` 中 `win.loadURL` 为 `win.loadFile(path.join(__dirname, 'out/index.html'))`。
4. 执行 `cd electron && npm run dist` 生成对应平台安装包。

> 说明：桌面模式下，AI 功能仍依赖后端通过 CodeBuddy SDK 调用，请确保后端随应用一起启动并配置了 API Key。
