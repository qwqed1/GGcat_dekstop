import { useState, useEffect } from 'react'
import './TitleBar.css'

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  
  // Проверяем, находимся ли мы в Electron
  const isElectron = window.electronAPI?.isElectron
  
  useEffect(() => {
    if (!isElectron) return
    
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.isMaximized()
      setIsMaximized(maximized)
    }
    
    checkMaximized()
    
    // Слушаем изменения размера окна
    const handleResize = () => checkMaximized()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [isElectron])
  
  if (!isElectron) return null
  
  const handleMinimize = () => window.electronAPI.minimize()
  const handleMaximize = async () => {
    await window.electronAPI.maximize()
    const maximized = await window.electronAPI.isMaximized()
    setIsMaximized(maximized)
  }
  const handleClose = () => window.electronAPI.close()
  
  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <img src="/image/GGcat.png" alt="GGcat" className="title-bar-icon" />
        <span className="title-bar-text">GGcat</span>
      </div>
      <div className="title-bar-controls">
        <button className="title-bar-btn title-bar-btn--minimize" onClick={handleMinimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="5.5" width="8" height="1" fill="currentColor"/>
          </svg>
        </button>
        <button className="title-bar-btn title-bar-btn--maximize" onClick={handleMaximize}>
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2.5" y="4" width="6" height="5" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M4 4V2.5h6v5h-1.5" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          )}
        </button>
        <button className="title-bar-btn title-bar-btn--close" onClick={handleClose}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TitleBar
