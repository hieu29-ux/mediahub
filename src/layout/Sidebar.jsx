import { useUiStore } from '../store/uiStore'
import { useAuth } from '../hooks/useAuth'

const SP_TABS = [
  { id: 'top',       label: 'Top tracks'  },
  { id: 'playlists', label: 'Playlists'   },
  { id: 'albums',    label: 'Albums'      },
  { id: 'liked',     label: 'Liked songs' },
]

const YT_LIBRARY = [
  { id: 'trending',      label: 'Trending',      auth: false },
  { id: 'subscriptions', label: 'Subscriptions', auth: true  },
  { id: 'watchlater',    label: 'Watch later',   auth: true  },
  { id: 'history',       label: 'History',       auth: false },
]

export function Sidebar() {
  const {
    activeService, setActiveService,
    spotifyTab, setSpotifyTab,
    youtubeTab, setYoutubeTab,
    openSettings,
  } = useUiStore()

  const { spotifyUser, youtubeUser, isSpotifyConnected, isYouTubeConnected, loginYouTube } = useAuth()
  const isYT = activeService === 'youtube'
  const activeTab = isYT ? youtubeTab : spotifyTab

  const handleYtTab = (tab) => {
    if (tab.auth && !isYouTubeConnected) { loginYouTube(); return }
    setYoutubeTab(tab.id)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">media<span className="accent">hub</span></div>

      {/* Services */}
      <nav className="nav-group">
        <div className="nav-group-label">Services</div>
        <div
          className={`nav-item ${activeService === 'spotify' ? 'active' : ''}`}
          onClick={() => setActiveService('spotify')}
        >
          <span className="nav-icon"><SpotifyIcon /></span>
          <span>Spotify</span>
          {isSpotifyConnected && <span className="nav-badge badge-sp">ON</span>}
        </div>
        <div
          className={`nav-item ${activeService === 'youtube' ? 'active active-yt' : ''}`}
          onClick={() => setActiveService('youtube')}
        >
          <span className="nav-icon"><YouTubeIcon /></span>
          <span>YouTube</span>
          {isYouTubeConnected && <span className="nav-badge badge-yt">ON</span>}
        </div>
      </nav>

      <div className="sidebar-divider" />

      {/* Spotify Library */}
      {!isYT && (
        <nav className="nav-group">
          <div className="nav-group-label">Library</div>
          {SP_TABS.map(tab => (
            <div
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setSpotifyTab(tab.id)}
            >
              <span className="nav-icon"><LibraryIcon id={tab.id} /></span>
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>
      )}

      {/* YouTube: Dành cho bạn + Library */}
      {isYT && (
        <>
          <nav className="nav-group">
            <div
              className={`nav-item ${activeTab === 'foryou' ? 'active active-yt' : ''}`}
              onClick={() => setYoutubeTab('foryou')}
            >
              <span className="nav-icon"><ForYouIcon /></span>
              <span>Dành cho bạn</span>
            </div>
          </nav>

          <div className="sidebar-divider" />

          <nav className="nav-group">
            <div className="nav-group-label">Library</div>
            {YT_LIBRARY.map(tab => (
              <div
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active active-yt' : ''}`}
                onClick={() => handleYtTab(tab)}
              >
                <span className="nav-icon"><YtLibIcon id={tab.id} /></span>
                <span>{tab.label}</span>
                {tab.auth && !isYouTubeConnected && (
                  <span style={{marginLeft:'auto',fontSize:9,opacity:.4}}>🔒</span>
                )}
              </div>
            ))}
          </nav>
        </>
      )}

      <div className="sidebar-divider" />

      {/* App */}
      <nav className="nav-group">
        <div className="nav-group-label">App</div>
        <div className="nav-item" onClick={openSettings}>
          <span className="nav-icon"><SettingsIcon /></span>
          <span>Settings</span>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">
          {isYT
            ? <span>{youtubeUser?.snippet?.title?.[0] ?? 'Y'}</span>
            : (spotifyUser?.images?.[0]?.url
                ? <img src={spotifyUser.images[0].url} alt="avatar" />
                : <span>{spotifyUser?.display_name?.[0] ?? 'S'}</span>)
          }
        </div>
        <div class="user-info">
          <div className="user-name">
            {isYT
              ? (youtubeUser?.snippet?.title ?? 'Not connected')
              : (spotifyUser?.display_name ?? 'Not connected')
            }
          </div>
          <div className="user-status">
            {isYT
              ? (isYouTubeConnected ? 'Connected' : 'Disconnected')
              : (spotifyUser?.product === 'premium' ? 'Premium' : isSpotifyConnected ? 'Free' : 'Disconnected')
            }
          </div>
        </div>
      </div>
    </aside>
  )
}

function SpotifyIcon() {
  return <div style={{width:14,height:14,borderRadius:'50%',background:'#1db954'}}/>
}
function YouTubeIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path d="M13.3 1.6A1.7 1.7 0 0011.9.2C10.9 0 7 0 7 0S3.1 0 2.1.2A1.7 1.7 0 00.7 1.6C.5 2.6.5 5 .5 5s0 2.4.2 3.4A1.7 1.7 0 002.1 9.8C3.1 10 7 10 7 10s3.9 0 4.9-.2a1.7 1.7 0 001.4-1.4C13.5 7.4 13.5 5 13.5 5s0-2.4-.2-3.4z" fill="#ff0000"/>
      <path d="M5.5 7.1V2.9L9.2 5l-3.7 2.1z" fill="white"/>
    </svg>
  )
}
function ForYouIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      <path d="M7 1.5l1.5 3 3.5.5-2.5 2.5.6 3.5L7 9.5 4.9 11l.6-3.5L3 5l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M3 3l1 1M10 10l1 1M3 11l1-1M10 4l1-1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
function LibraryIcon({ id }) {
  const icons = {
    top:      <path d="M7 2l1.4 2.8 3.1.45-2.25 2.2.53 3.1L7 9.1 4.22 10.55l.53-3.1L2.5 5.25l3.1-.45L7 2z" stroke="currentColor" strokeWidth="1.1" fill="none"/>,
    playlists:<><rect x="1" y="2" width="12" height="1.5" rx=".75" fill="currentColor"/><rect x="1" y="6" width="9" height="1.5" rx=".75" fill="currentColor"/><rect x="1" y="10" width="11" height="1.5" rx=".75" fill="currentColor"/></>,
    liked:    <path d="M7 12S1.5 8 1.5 4.5a3 3 0 015.5-1.6A3 3 0 0112.5 4.5C12.5 8 7 12 7 12z" stroke="currentColor" strokeWidth="1.2" fill="none"/>,
    albums:   <><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/></>,
  }
  return <svg width="14" height="14" fill="none" viewBox="0 0 14 14">{icons[id] ?? icons.top}</svg>
}
function YtLibIcon({ id }) {
  const icons = {
    trending:      <path d="M2 10l3-4 3 2 4-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>,
    subscriptions: <><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
    watchlater:    <><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
    history:       <path d="M2 7a5 5 0 105-5H5M2 4v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>,
  }
  return <svg width="14" height="14" fill="none" viewBox="0 0 14 14">{icons[id]}</svg>
}