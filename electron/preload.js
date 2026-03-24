const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // OAuth
  openAuthUrl: (url) => ipcRenderer.invoke('open-auth-url', url),

  onOAuthCallback: (cb) => {
    // Dùng on thay vì once để có thể login nhiều lần
    // Nhưng removeAllListeners trước để tránh duplicate
    ipcRenderer.removeAllListeners('oauth-callback')
    ipcRenderer.on('oauth-callback', (_, data) => cb(data))
  },

  removeOAuthListener: () => {
    ipcRenderer.removeAllListeners('oauth-callback')
  },

  // Window controls
  minimize:    () => ipcRenderer.send('window-minimize'),
  maximize:    () => ipcRenderer.send('window-maximize'),
  close:       () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  onMaximizeChange: (cb) =>
    ipcRenderer.on('window-maximize-change', (_, val) => cb(val)),

  // Theme
  setNativeTheme: (theme) => ipcRenderer.send('set-native-theme', theme),

  // System
  getVersion:   () => ipcRenderer.invoke('get-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  platform: process.platform,
})