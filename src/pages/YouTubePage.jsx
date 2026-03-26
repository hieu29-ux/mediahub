import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { VideoCard, VideoCardSkeleton, VideoRow, VideoRowSkeleton } from '../components/VideoCard'
import { YouTubeModal } from '../components/YouTubeModal'
import { useAuth } from '../hooks/useAuth'
import {
    useSubscriptions,
    useTrending,
    useWatchLater,
    useYouTubeSearch
} from '../hooks/useYouTube'
import { youtubeService } from '../services/youtube.service'
import { useUiStore } from '../store/uiStore'

const TABS = [
  { id: 'foryou',        label: 'Dành cho bạn', auth: false },
  { id: 'trending',      label: 'Trending',      auth: false },
  { id: 'subscriptions', label: 'Subscriptions', auth: true  },
  { id: 'watchlater',    label: 'Watch later',   auth: true  },
  { id: 'history',       label: 'History',       auth: true  },
]

export function YouTubePage() {
  const { youtubeTab, setYoutubeTab } = useUiStore()
  const { isYouTubeConnected, loginYouTube } = useAuth()
  const [search, setSearch]           = useState('')
  const [activeVideo, setActiveVideo] = useState(null)
  const [activeChannel, setActiveChannel] = useState(null) // { channelId, channelTitle }

  const handleVideoClick   = useCallback((video) => setActiveVideo(video), [])
  const handleChannelClick = useCallback((ch) => setActiveChannel(ch), [])
  const handleClose        = useCallback(() => { setActiveVideo(null); setActiveChannel(null) }, [])

  return (
    <div className="page-container">
      {/* Tab bar */}
      <div className="tab-bar yt">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${youtubeTab === tab.id ? 'active-yt' : ''}`}
            onClick={() => {
              if (tab.auth && !isYouTubeConnected) { loginYouTube(); return }
              setYoutubeTab(tab.id)
            }}
          >
            {tab.label}
            {tab.auth && !isYouTubeConnected && <span className="tab-lock"> 🔒</span>}
          </button>
        ))}
        <div className="tab-search-wrap">
          <div className="tab-search-bar yt">
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search videos, channels…"
            />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {search
          ? <SearchResults query={search} onVideoClick={handleVideoClick} />
          : <TabContent tab={youtubeTab} onVideoClick={handleVideoClick} onChannelClick={handleChannelClick} isConnected={isYouTubeConnected} onLogin={loginYouTube} />
        }
      </div>

      {activeVideo   && <YouTubeModal video={activeVideo} onClose={handleClose} />}
      {!activeVideo && activeChannel && (
        <YouTubeModal channel={activeChannel} onClose={handleClose} />
      )}
    </div>
  )
}

// Tab router
function TabContent({ tab, onVideoClick, onChannelClick, isConnected, onLogin }) {
  if (tab === 'foryou')        return <ForYouTab        onVideoClick={onVideoClick} isConnected={isConnected} onLogin={onLogin} />
  if (tab === 'trending')      return <TrendingTab      onVideoClick={onVideoClick} />
  if (tab === 'subscriptions') return <SubscriptionsTab onVideoClick={onVideoClick} onChannelClick={onChannelClick} isConnected={isConnected} onLogin={onLogin} />
  if (tab === 'watchlater')    return <WatchLaterTab    onVideoClick={onVideoClick} />
  if (tab === 'history')       return <HistoryTab       onVideoClick={onVideoClick} />
  return null
}

// Dành cho bạn
function ForYouTab({ onVideoClick, isConnected, onLogin }) {
  // Lấy lịch sử xem gần nhất từ localStorage để làm seed
  const recentTitles = (() => {
    try {
      const h = JSON.parse(localStorage.getItem('yt_watch_history') || '[]')
      return h.slice(0, 3).map(v => v.title?.split(' ').slice(0,3).join(' ')).filter(Boolean)
    } catch { return [] }
  })()

  const seedQuery = recentTitles[0] || 'trending music Vietnam 2024'

  const { data: recommended, isLoading: l1 } = useQuery({
    queryKey: ['youtube', 'foryou', seedQuery],
    queryFn: () => youtubeService.search(seedQuery, 12),
    staleTime: 10 * 60 * 1000,
  })

  const { data: trending, isLoading: l2 } = useTrending()

  const recVideos   = recommended?.items?.map(r => ({ id: r.id?.videoId ?? r.id, snippet: r.snippet })) ?? []
  const trendVideos = (trending?.items ?? []).slice(0, 6)

  return (
    <>
      {/* Personalized section */}
      <div className="yt-section-header">
        <div className="section-label">Dành cho bạn</div>
        {!isConnected && (
          <button className="yt-connect-hint" onClick={onLogin}>
            Đăng nhập để xem gợi ý cá nhân hóa →
          </button>
        )}
      </div>
      <div className="yt-grid">
        {l1
          ? Array(6).fill(0).map((_, i) => <VideoCardSkeleton key={i} />)
          : recVideos.slice(0, 6).map(v => <VideoCard key={v.id} video={v} onClick={() => onVideoClick(v)} />)
        }
      </div>

      {/* Trending section */}
      <div className="section-label" style={{marginTop:8}}>Trending hôm nay</div>
      <div className="yt-grid">
        {l2
          ? Array(6).fill(0).map((_, i) => <VideoCardSkeleton key={i} />)
          : trendVideos.map(v => <VideoCard key={v.id} video={v} onClick={() => onVideoClick(v)} />)
        }
      </div>
    </>
  )
}

// Trending
function TrendingTab({ onVideoClick }) {
  const { data, isLoading } = useTrending()
  const videos = data?.items ?? []
  return (
    <>
      <div className="section-label">Trending now · Vietnam</div>
      <div className="yt-grid">
        {isLoading
          ? Array(9).fill(0).map((_, i) => <VideoCardSkeleton key={i} />)
          : videos.map(v => <VideoCard key={v.id} video={v} onClick={() => onVideoClick(v)} />)
        }
      </div>
    </>
  )
}

// Subscriptions
function SubscriptionsTab({ onVideoClick, onChannelClick, isConnected, onLogin }) {
  const { data, isLoading } = useSubscriptions()

  if (!isConnected) return <ConnectPrompt onConnect={onLogin} label="Đăng nhập để xem subscriptions" />

  const channels = data?.items ?? []

  return (
    <>
      <div className="section-label">Kênh đã đăng ký · {channels.length}</div>
      <div className="yt-channel-list">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <ChannelRowSkeleton key={i} />)
          : channels.map(ch => {
              const snap      = ch.snippet ?? {}
              const thumb     = snap.thumbnails?.default?.url
              const channelId = snap.resourceId?.channelId ?? ch.id
              return (
                <div
                  key={ch.id}
                  className="yt-channel-row"
                  onClick={() => onChannelClick({ channelId, channelTitle: snap.title })}
                >
                  <div className="yt-ch-row-avatar">
                    {thumb
                      ? <img src={thumb} alt={snap.title} />
                      : <span>{snap.title?.[0]}</span>
                    }
                  </div>
                  <div className="yt-ch-row-info">
                    <div className="yt-ch-row-name">{snap.title}</div>
                    <div className="yt-ch-row-desc">{snap.description?.slice(0, 60) || 'YouTube channel'}</div>
                  </div>
                  <svg className="yt-ch-row-arrow" width="14" height="14" fill="none" viewBox="0 0 14 14">
                    <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )
            })
        }
      </div>
    </>
  )
}

// Watch Later
function WatchLaterTab({ onVideoClick }) {
  const { data, isLoading } = useWatchLater()
  const items = data?.items ?? []

  return (
    <>
      <div className="yt-section-header">
        <div className="section-label">Watch later · {data?.pageInfo?.totalResults ?? '—'} videos</div>
      </div>
      <div className="track-list">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <VideoRowSkeleton key={i} />)
          : items.length === 0
            ? <div className="empty-state">Danh sách trống</div>
            : items.map((item, i) => {
                const videoId = item.contentDetails?.videoId
                const snippet = item.snippet
                const v = {
                  id: videoId,
                  snippet: {
                    title:        snippet?.title,
                    channelTitle: snippet?.channelTitle,
                    thumbnails:   snippet?.thumbnails,
                    publishedAt:  snippet?.publishedAt,
                  },
                }
                return <VideoRow key={item.id} video={v} index={i} onClick={() => onVideoClick(v)} />
              })
        }
      </div>
    </>
  )
}

// History
function HistoryTab({ onVideoClick }) {
  // Lịch sử xem lưu local khi user click video
  const history = (() => {
    try { return JSON.parse(localStorage.getItem('yt_watch_history') || '[]') }
    catch { return [] }
  })()

  const clearHistory = () => {
    localStorage.removeItem('yt_watch_history')
    window.location.reload()
  }

  return (
    <>
      <div className="yt-section-header">
        <div className="section-label">Lịch sử xem · {history.length} videos</div>
        {history.length > 0 && (
          <button className="yt-connect-hint danger" onClick={clearHistory}>Xóa lịch sử</button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="empty-state">Chưa có lịch sử xem</div>
      ) : (
        <div className="track-list">
          {history.map((v, i) => (
            <VideoRow key={`${v.id}-${i}`} video={v} index={i} onClick={() => onVideoClick(v)} />
          ))}
        </div>
      )}
    </>
  )
}

// Search
function SearchResults({ query, onVideoClick }) {
  const { data, isLoading } = useYouTubeSearch(query)
  const results = data?.items ?? []
  if (isLoading) return <div className="yt-grid">{Array(6).fill(0).map((_, i) => <VideoCardSkeleton key={i} />)}</div>
  if (!results.length) return <div className="empty-state">Không tìm thấy kết quả cho "{query}"</div>
  const videos = results.map(r => ({ id: r.id?.videoId ?? r.id, snippet: r.snippet }))
  return (
    <>
      <div className="section-label">Kết quả tìm kiếm · {videos.length}</div>
      <div className="yt-grid">
        {videos.map(v => <VideoCard key={v.id} video={v} onClick={() => onVideoClick(v)} />)}
      </div>
    </>
  )
}

// Shared
function ConnectPrompt({ onConnect, label }) {
  return (
    <div className="connect-prompt">
      <div className="connect-prompt-title">{label}</div>
      <button className="connect-btn" style={{background:'#ff0000'}} onClick={onConnect}>
        Đăng nhập YouTube
      </button>
    </div>
  )
}

function ChannelRowSkeleton() {
  return (
    <div className="yt-channel-row skeleton">
      <div className="skeleton-block" style={{width:40,height:40,borderRadius:'50%'}} />
      <div className="tr-info">
        <div className="skeleton-line w-50" />
        <div className="skeleton-line w-70" />
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="7.9" y1="7.9" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}