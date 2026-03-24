const {
  app, BrowserWindow, ipcMain, shell, nativeTheme, Tray, Menu
} = require('electron')
const path = require('path')
const http = require('http')
const url  = require('url')

const isDev = process.env.NODE_ENV === 'development'
const isMac = process.platform === 'darwin'
const DEV_PORT = 5174

let mainWindow = null
let tray = null
let callbackServer = null  // localhost server bắt YouTube callback

// ─── Custom protocol (Spotify callback) ───────────────────────────
const PROTOCOL = 'mediahub'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// ─── Single instance ───────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find(a => a.startsWith(`${PROTOCOL}://`))
    if (url) handleProtocolCallback(url)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ─── Create window ─────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 760,
    minWidth: 900, minHeight: 600,
    frame: false,
    backgroundColor: '#0d0d0d',
    show: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${DEV_PORT}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('maximize',   () => mainWindow.webContents.send('window-maximize-change', true))
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximize-change', false))
}

// ─── Localhost server bắt YouTube OAuth callback ───────────────────
function startCallbackServer() {
  callbackServer = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true)

    if (parsed.pathname === '/callback/youtube') {
      const code  = parsed.query.code
      const error = parsed.query.error

      // Trả về HTML đẹp cho browser
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MediaHub</title>
          <style>
            body { font-family: system-ui; background: #0d0d0d; color: #f0f0f0;
                   display: flex; align-items: center; justify-content: center;
                   height: 100vh; margin: 0; }
            .box { text-align: center; }
            h2 { color: #ff0000; margin-bottom: 8px; }
            p  { color: #888; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>${error ? 'Login failed' : 'YouTube connected!'}</h2>
            <p>${error ? error : 'You can close this tab and return to MediaHub.'}</p>
          </div>
        </body>
        </html>
      `)

      // Gửi code về renderer
      mainWindow?.webContents.send('oauth-callback', {
        service: 'youtube',
        code,
        error,
      })
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  callbackServer.listen(5175, 'localhost', () => {
    console.log('[main] YouTube callback server listening on http://localhost:5175')
  })

  callbackServer.on('error', (e) => {
    console.error('[main] Callback server error:', e.message)
  })
}

// ─── Spotify protocol callback ─────────────────────────────────────
function handleProtocolCallback(rawUrl) {
  try {
    const parsed = new URL(rawUrl)
    const service = parsed.hostname === 'callback' ? parsed.pathname.slice(1) : 'spotify'
    const code    = parsed.searchParams.get('code')
    const error   = parsed.searchParams.get('error')
    mainWindow?.webContents.send('oauth-callback', { service, code, error })
  } catch (e) {
    console.error('[main] Protocol callback parse error:', e)
  }
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  handleProtocolCallback(url)
})

// ─── IPC ───────────────────────────────────────────────────────────
ipcMain.handle('open-auth-url',      (_e, url) => shell.openExternal(url))
ipcMain.handle('open-external',      (_e, url) => shell.openExternal(url))
ipcMain.handle('get-version',        () => app.getVersion())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.on('window-close', () => mainWindow?.hide())
ipcMain.on('set-native-theme', (_e, theme) => {
  nativeTheme.themeSource = theme === 'system' ? 'system' : theme
})

// ─── App lifecycle ─────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  startCallbackServer()
})

app.on('window-all-closed', () => {
  if (!isMac) {
    callbackServer?.close()
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
  else mainWindow?.show()
})