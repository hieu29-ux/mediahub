import { useEffect, useState } from 'react'
import { useUiStore } from '../store/uiStore'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const activeService = useUiStore((s) => s.activeService)

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized)
    window.electronAPI?.onMaximizeChange(setIsMaximized)
  }, [])

  return (
    <div className="titlebar" data-service={activeService}>
      {/* macOS-style traffic lights */}
      <div className="traffic-lights">
        <button
          className="tl tl-close"
          onClick={() => window.electronAPI?.close()}
          title="Close"
        />
        <button
          className="tl tl-min"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimize"
        />
        <button
          className="tl tl-max"
          onClick={() => window.electronAPI?.maximize()}
          title={isMaximized ? 'Restore' : 'Maximize'}
        />
      </div>

      <div className="titlebar-title">
        media<span className="accent">hub</span>
      </div>
    </div>
  )
}
