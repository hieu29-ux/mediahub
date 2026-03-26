import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { MiniPlayerBar } from './MiniPlayerBar'
import { useSpotifySDK } from '../player/SpotifySDK'
import { useUiStore } from '../store/uiStore'
import { SpotifyPage } from '../pages/SpotifyPage'
import { YouTubePage } from '../pages/YouTubePage'
import { SettingsModal } from '../components/SettingsModal'

export function AppShell() {
  useSpotifySDK()
  const activeService = useUiStore((s) => s.activeService)
  const isYouTube = activeService === 'youtube'

  return (
    <div className={`app ${isYouTube ? 'no-player' : ''}`}>
      <TitleBar />
      <Sidebar />
      <main className="main">
        {isYouTube ? <YouTubePage /> : <SpotifyPage />}
      </main>
      {!isYouTube && <MiniPlayerBar />}
      <SettingsModal />
    </div>
  )
}