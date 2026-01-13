const { contextBridge, ipcRenderer } = require('electron')

// Безопасно экспортируем API в renderer процесс
contextBridge.exposeInMainWorld('electronAPI', {
  // Управление окном
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Информация о платформе
  platform: process.platform,
  isElectron: true,
  
  // Версии
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
})

// Убираем предупреждение о том что мы в Electron
window.addEventListener('DOMContentLoaded', () => {
  // Добавляем класс для стилизации в Electron
  document.body.classList.add('electron-app')
})
