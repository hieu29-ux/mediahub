import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { applyTheme, useUiStore } from '../store/uiStore'
import { tokenStorage } from '../utils/storage'

const SECTIONS = [
  { id: 'accounts',   label: 'Accounts',    group: 'Account' },
  { id: 'audio',      label: 'Audio',       group: 'Playback' },
  { id: 'playback',   label: 'Playback',    group: 'Playback' },
  { id: 'appearance', label: 'Appearance',  group: 'App' },
  { id: 'shortcuts',  label: 'Shortcuts',   group: 'App' },
  { id: 'cache',      label: 'Cache & data', group: 'App' },
  { id: 'about',      label: 'About',       group: 'App' },
]

export function SettingsModal() {
  const { settingsOpen, closeSettings } = useUiStore()
  const [active, setActive] = useState('accounts')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSettings() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSettings])

  if (!settingsOpen) return null

  const groups = [...new Set(SECTIONS.map(s => s.group))]

  return (
    <div className="settings-bg" onClick={e => e.target === e.currentTarget && closeSettings()}>
      <div className="settings-modal">

        {/* Sidebar nav */}
        <div className="settings-nav">
          <div className="settings-nav-title">Settings</div>
          {groups.map(group => (
            <div key={group} className="settings-nav-group">
              <div className="settings-nav-label">{group}</div>
              {SECTIONS.filter(s => s.group === group).map(s => (
                <div
                  key={s.id}
                  className={`settings-nav-item ${active === s.id ? 'active' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  <NavIcon id={s.id} />
                  {s.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          <div className="settings-header">
            <div className="settings-title">{SECTIONS.find(s => s.id === active)?.label}</div>
            <button className="settings-close" onClick={closeSettings}>✕</button>
          </div>
          <div className="settings-body">
            {active === 'accounts'   && <AccountsPage />}
            {active === 'audio'      && <AudioPage />}
            {active === 'playback'   && <PlaybackPage />}
            {active === 'appearance' && <AppearancePage />}
            {active === 'shortcuts'  && <ShortcutsPage />}
            {active === 'cache'      && <CachePage />}
            {active === 'about'      && <AboutPage />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Shared components
function SRow({ label, desc, children }) {
  return (
    <div className="s-row">
      <div className="s-row-left">
        <div className="s-row-title">{label}</div>
        {desc && <div className="s-row-desc">{desc}</div>}
      </div>
      <div className="s-row-right">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange, color = 'green' }) {
  return (
    <div
      className={`s-toggle ${value ? 'on' : ''}`}
      style={value ? { background: color === 'red' ? '#ff4444' : '#1db954' } : {}}
      onClick={() => onChange(!value)}
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select className="s-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

function Slider({ value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="s-slider-wrap">
      <input
        type="range" className="s-slider"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className="s-slider-val">{value}{unit}</span>
    </div>
  )
}

function SSection({ title, children }) {
  return (
    <div className="s-section">
      <div className="s-section-title">{title}</div>
      {children}
    </div>
  )
}

// Accounts
function AccountsPage() {
  const { isSpotifyConnected, isYouTubeConnected, spotifyUser, youtubeUser, loginSpotify, loginYouTube, logoutSpotify, logoutYouTube } = useAuth()
  const [saveHistory, setSaveHistory]   = useState(() => localStorage.getItem('mh_save_history') !== 'false')
  const [saveWatchHist, setSaveWatchHist] = useState(() => localStorage.getItem('mh_save_watch') !== 'false')
  const [analytics, setAnalytics]       = useState(false)

  return (
    <>
      <SSection title="Connected accounts">
        <div className="s-account-card">
          <div className="s-account-icon spotify">S</div>
          <div className="s-account-info">
            <div className="s-account-name">Spotify</div>
            <div className="s-account-sub">
              {isSpotifyConnected ? spotifyUser?.email ?? spotifyUser?.display_name ?? 'Connected' : 'Not connected'}
            </div>
          </div>
          <div className={`s-account-badge ${isSpotifyConnected ? 'connected' : ''}`}>
            {isSpotifyConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            className={`s-btn ${isSpotifyConnected ? 'danger' : 'primary'}`}
            onClick={isSpotifyConnected ? logoutSpotify : loginSpotify}
          >
            {isSpotifyConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        <div className="s-account-card">
          <div className="s-account-icon youtube">Y</div>
          <div className="s-account-info">
            <div className="s-account-name">YouTube</div>
            <div className="s-account-sub">
              {isYouTubeConnected ? youtubeUser?.snippet?.title ?? 'Connected' : 'Not connected'}
            </div>
          </div>
          <div className={`s-account-badge ${isYouTubeConnected ? 'connected-yt' : ''}`}>
            {isYouTubeConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            className={`s-btn ${isYouTubeConnected ? 'danger' : 'primary-yt'}`}
            onClick={isYouTubeConnected ? logoutYouTube : loginYouTube}
          >
            {isYouTubeConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </SSection>

      <SSection title="Privacy">
        <SRow label="Save listening history" desc="Lưu lịch sử nghe nhạc Spotify locally">
          <Toggle value={saveHistory} onChange={v => { setSaveHistory(v); localStorage.setItem('mh_save_history', v) }} />
        </SRow>
        <SRow label="Save watch history" desc="Lưu lịch sử xem YouTube locally">
          <Toggle value={saveWatchHist} onChange={v => { setSaveWatchHist(v); localStorage.setItem('mh_save_watch', v) }} color="red" />
        </SRow>
        <SRow label="Analytics & crash reports" desc="Gửi anonymous data để cải thiện app">
          <Toggle value={analytics} onChange={setAnalytics} />
        </SRow>
      </SSection>
    </>
  )
}

// Audio
function AudioPage() {
  const [quality, setQuality]       = useState(() => localStorage.getItem('mh_quality') || 'high')
  const [dlQuality, setDlQuality]   = useState(() => localStorage.getItem('mh_dl_quality') || 'very_high')
  const [normalize, setNormalize]   = useState(() => localStorage.getItem('mh_normalize') !== 'false')
  const [crossfade, setCrossfade]   = useState(() => Number(localStorage.getItem('mh_crossfade') || 3))
  const [hwAccel, setHwAccel]       = useState(true)

  const save = (key, val) => localStorage.setItem(key, val)

  return (
    <>
      <SSection title="Spotify audio quality">
        <SRow label="Streaming quality" desc="Khi có mạng tốt">
          <Select value={quality} onChange={v => { setQuality(v); save('mh_quality', v) }} options={[
            { value:'normal',   label:'Normal (96 kbps)' },
            { value:'high',     label:'High (160 kbps)' },
            { value:'very_high',label:'Very high (320 kbps)' },
          ]} />
        </SRow>
        <SRow label="Download quality" desc="Offline cache">
          <Select value={dlQuality} onChange={v => { setDlQuality(v); save('mh_dl_quality', v) }} options={[
            { value:'high',     label:'High (160 kbps)' },
            { value:'very_high',label:'Very high (320 kbps)' },
          ]} />
        </SRow>
        <SRow label="Normalize volume" desc="Cân bằng âm lượng giữa các track">
          <Toggle value={normalize} onChange={v => { setNormalize(v); save('mh_normalize', v) }} />
        </SRow>
        <SRow label="Crossfade" desc="Fade giữa 2 bài">
          <Slider value={crossfade} onChange={v => { setCrossfade(v); save('mh_crossfade', v) }} min={0} max={12} unit="s" />
        </SRow>
      </SSection>
      <SSection title="Output device">
        <SRow label="Audio output">
          <Select value="default" onChange={() => {}} options={['System default']} />
        </SRow>
        <SRow label="Hardware acceleration" desc="Dùng GPU cho audio decode">
          <Toggle value={hwAccel} onChange={setHwAccel} />
        </SRow>
      </SSection>
    </>
  )
}

// Playback
function PlaybackPage() {
  const [autoplay, setAutoplay]       = useState(() => localStorage.getItem('mh_autoplay') !== 'false')
  const [rememberPos, setRememberPos] = useState(() => localStorage.getItem('mh_remember_pos') !== 'false')
  const [defaultSvc, setDefaultSvc]   = useState(() => localStorage.getItem('mh_default_svc') || 'last')
  const [ytQuality, setYtQuality]     = useState(() => localStorage.getItem('mh_yt_quality') || '1080p')
  const [seekInterval, setSeekInterval] = useState(() => Number(localStorage.getItem('mh_seek') || 10))
  const [mediaKeys, setMediaKeys]     = useState(true)
  const [tray, setTray]               = useState(true)

  const save = (key, val) => localStorage.setItem(key, val)

  return (
    <>
      <SSection title="Behaviour">
        <SRow label="Autoplay" desc="Tự phát bài tiếp theo khi hết queue">
          <Toggle value={autoplay} onChange={v => { setAutoplay(v); save('mh_autoplay', v) }} />
        </SRow>
        <SRow label="Remember playback position" desc="Tiếp tục từ chỗ dừng khi mở lại">
          <Toggle value={rememberPos} onChange={v => { setRememberPos(v); save('mh_remember_pos', v) }} />
        </SRow>
        <SRow label="Default service on launch" desc="Mở tab nào khi khởi động">
          <Select value={defaultSvc} onChange={v => { setDefaultSvc(v); save('mh_default_svc', v) }} options={[
            { value:'last',    label:'Last used' },
            { value:'spotify', label:'Spotify' },
            { value:'youtube', label:'YouTube' },
          ]} />
        </SRow>
        <SRow label="YouTube video quality">
          <Select value={ytQuality} onChange={v => { setYtQuality(v); save('mh_yt_quality', v) }} options={['Auto','1080p','720p','480p','360p']} />
        </SRow>
        <SRow label="Seek interval" desc="Khi nhấn ←→">
          <Slider value={seekInterval} onChange={v => { setSeekInterval(v); save('mh_seek', v) }} min={5} max={30} step={5} unit="s" />
        </SRow>
      </SSection>
      <SSection title="Media keys">
        <SRow label="Global media keys" desc="Play/pause kể cả khi app minimize">
          <Toggle value={mediaKeys} onChange={setMediaKeys} />
        </SRow>
        <SRow label="System tray player" desc="Hiện mini control ở system tray">
          <Toggle value={tray} onChange={setTray} />
        </SRow>
      </SSection>
    </>
  )
}

// Appearance
function AppearancePage() {
  const { theme, setTheme } = useUiStore()
  const [accent, setAccent]         = useState(() => localStorage.getItem('mh_accent') || 'auto')
  const [reduceMotion, setReduceMotion] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(false)
  const [cardSize, setCardSize]     = useState(() => localStorage.getItem('mh_card_size') || 'medium')
  const [showDuration, setShowDuration] = useState(true)

  return (
    <>
      <SSection title="Theme">
        <SRow label="Color theme">
          <Select value={theme} onChange={t => { setTheme(t); applyTheme(t) }} options={[
            { value:'dark',   label:'Dark (default)' },
            { value:'light',  label:'Light' },
            { value:'system', label:'System' },
          ]} />
        </SRow>
        <SRow label="Accent color" desc="Màu highlight chính">
          <Select value={accent} onChange={v => { setAccent(v); localStorage.setItem('mh_accent', v) }} options={[
            { value:'auto',    label:'Auto (theo service)' },
            { value:'spotify', label:'Spotify green' },
            { value:'youtube', label:'YouTube red' },
          ]} />
        </SRow>
        <SRow label="Reduce motion" desc="Tắt animation và transition">
          <Toggle value={reduceMotion} onChange={setReduceMotion} />
        </SRow>
        <SRow label="Compact sidebar" desc="Thu nhỏ sidebar chỉ còn icons">
          <Toggle value={compactSidebar} onChange={setCompactSidebar} />
        </SRow>
      </SSection>
      <SSection title="Layout">
        <SRow label="Card size">
          <Select value={cardSize} onChange={v => { setCardSize(v); localStorage.setItem('mh_card_size', v) }} options={[
            { value:'small',  label:'Small' },
            { value:'medium', label:'Medium' },
            { value:'large',  label:'Large' },
          ]} />
        </SRow>
        <SRow label="Show track duration">
          <Toggle value={showDuration} onChange={setShowDuration} />
        </SRow>
      </SSection>
    </>
  )
}

// Shortcuts
function ShortcutsPage() {
  const shortcuts = [
    { group: 'Playback', items: [
      { label: 'Play / Pause',    keys: ['Space'] },
      { label: 'Next track',      keys: ['Ctrl', '→'] },
      { label: 'Previous track',  keys: ['Ctrl', '←'] },
      { label: 'Seek forward',    keys: ['→'] },
      { label: 'Seek backward',   keys: ['←'] },
      { label: 'Volume up',       keys: ['↑'] },
      { label: 'Volume down',     keys: ['↓'] },
      { label: 'Mute / Unmute',   keys: ['M'] },
    ]},
    { group: 'Navigation', items: [
      { label: 'Switch to Spotify', keys: ['Ctrl', '1'] },
      { label: 'Switch to YouTube', keys: ['Ctrl', '2'] },
      { label: 'Search',            keys: ['Ctrl', 'F'] },
      { label: 'Settings',          keys: ['Ctrl', ','] },
      { label: 'Like / Save',       keys: ['L'] },
    ]},
  ]

  return (
    <>
      {shortcuts.map(group => (
        <SSection key={group.group} title={group.group}>
          {group.items.map(item => (
            <div key={item.label} className="s-shortcut-row">
              <span className="s-shortcut-label">{item.label}</span>
              <div className="s-kbd-wrap">
                {item.keys.map(k => <kbd key={k} className="s-kbd">{k}</kbd>)}
              </div>
            </div>
          ))}
        </SSection>
      ))}
    </>
  )
}

// Cache
function CachePage() {
  const [maxCache, setMaxCache]   = useState(() => Number(localStorage.getItem('mh_max_cache') || 5))
  const [autoClear, setAutoClear] = useState(true)
  const [offline, setOffline]     = useState(false)

  const getHistorySize = () => {
    try {
      const h = JSON.parse(localStorage.getItem('yt_watch_history') || '[]')
      return h.length
    } catch { return 0 }
  }

  const clearYtHistory = () => {
    localStorage.removeItem('yt_watch_history')
    alert('Đã xóa lịch sử xem YouTube')
  }

  const clearAll = () => {
    if (confirm('Xóa tất cả dữ liệu app? Bạn sẽ phải đăng nhập lại.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <>
      <SSection title="Cache storage">
        <SRow label="Max cache size" desc={`Hiện tại: ~${getHistorySize()} videos in history`}>
          <Slider value={maxCache} onChange={v => { setMaxCache(v); localStorage.setItem('mh_max_cache', v) }} min={1} max={20} unit="GB" />
        </SRow>
        <SRow label="Auto-clear on launch" desc="Xóa dữ liệu cũ hơn 30 ngày">
          <Toggle value={autoClear} onChange={setAutoClear} />
        </SRow>
        <SRow label="Offline mode" desc="Chỉ hiển thị nội dung đã cache">
          <Toggle value={offline} onChange={setOffline} />
        </SRow>
      </SSection>

      <div className="s-danger-zone">
        <div className="s-danger-title">DANGER ZONE</div>
        <div className="s-danger-row">
          <span>Xóa lịch sử xem YouTube ({getHistorySize()} videos)</span>
          <button className="s-btn danger" onClick={clearYtHistory}>Xóa</button>
        </div>
        <div className="s-danger-row">
          <span>Xóa tất cả dữ liệu app</span>
          <button className="s-btn danger" onClick={clearAll}>Reset</button>
        </div>
      </div>
    </>
  )
}

// About
function AboutPage() {
  const spToken = tokenStorage.getSpotify()
  const ytToken = tokenStorage.getYouTube()

  const spStatus = spToken.accessToken && Date.now() < spToken.expiresAt
  const ytStatus = ytToken.accessToken && Date.now() < ytToken.expiresAt

  const spExpires = spToken.expiresAt
    ? new Date(spToken.expiresAt).toLocaleTimeString()
    : '—'

  return (
    <>
      <SSection title="Application">
        <SRow label="Version"><span className="s-mono">1.0.0-beta</span></SRow>
        <SRow label="Platform"><span className="s-mono">Electron + React</span></SRow>
        <SRow label="Check for updates">
          <button className="s-btn" onClick={() => alert('Đây là phiên bản mới nhất!')}>Check now</button>
        </SRow>
      </SSection>

      <SSection title="API Status">
        <SRow label="Spotify API" desc={spStatus ? `Token expires: ${spExpires}` : 'Not connected'}>
          <span className={`s-status-badge ${spStatus ? 'ok' : 'err'}`}>{spStatus ? 'OK' : 'Offline'}</span>
        </SRow>
        <SRow label="YouTube Data API v3" desc="Public endpoints (API Key)">
          <span className="s-status-badge ok">Active</span>
        </SRow>
        <SRow label="YouTube OAuth" desc={ytStatus ? 'Token active' : 'Not connected'}>
          <span className={`s-status-badge ${ytStatus ? 'ok' : 'err'}`}>{ytStatus ? 'OK' : 'Offline'}</span>
        </SRow>
      </SSection>
    </>
  )
}

// Nav icons
function NavIcon({ id }) {
  const icons = {
    accounts:   <><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
    audio:      <><path d="M2 5h2.5L7 3v8L4.5 9H2V5z" fill="currentColor"/><path d="M9 4.5c1 .7 1.5 1.7 1.5 2.5S10 9 9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></>,
    playback:   <><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4.5l5 2.5-5 2.5V4.5z" fill="currentColor"/></>,
    appearance: <><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" fill="currentColor"/></>,
    shortcuts:  <><rect x="1.5" y="3" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 7h2M8 7h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></>,
    cache:      <><ellipse cx="7" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 4v6c0 1.1 2.2 2 5 2s5-.9 5-2V4" stroke="currentColor" strokeWidth="1.2"/><path d="M2 7c0 1.1 2.2 2 5 2s5-.9 5-2" stroke="currentColor" strokeWidth="1.2"/></>,
    about:      <><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>,
  }
  return <svg width="14" height="14" fill="none" viewBox="0 0 14 14">{icons[id]}</svg>
}