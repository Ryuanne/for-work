// Electron 主进程：把 Web 应用包装为桌面客户端
// 开发阶段：加载 Genie 的 Web 预览地址（默认 http://localhost:5173）
// 生产阶段：把前端 build 产物放到此处并用 loadFile 加载
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: '实习领航 · 求职中台',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 优先使用环境变量指定的地址（可用于连接本地后端 /api）
  const target = process.env.ELECTRON_START_URL || 'http://localhost:5173'
  win.loadURL(target)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
