import { formatCount, formatRelativeTime } from '../utils/format'
import { youtubeService } from '../services/youtube.service'
import { usePlayerStore } from '../store/playerStore'

export function VideoCard({ video, onClick }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isActive = currentTrack?.id === video?.id

  if (!video) return <VideoCardSkeleton />

  const { snippet, contentDetails, statistics } = video
  const thumb    = youtubeService.getBestThumbnail(snippet?.thumbnails)
  const duration = youtubeService.parseDuration(contentDetails?.duration)
  const views    = formatCount(Number(statistics?.viewCount))
  const isLive   = snippet?.liveBroadcastContent === 'live'

  return (
    <div
      className={`yt-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="yt-thumb">
        {thumb
          ? <img src={thumb} alt={snippet?.title} loading="lazy" />
          : <div className="yt-thumb-placeholder" />
        }
        <div className="yt-play-overlay">
          <div class="yt-play-btn"><div className="yt-play-ico" /></div>
        </div>
        <div className="yt-duration-badge">
          {isLive ? 'LIVE' : formatDurationBadge(duration)}
        </div>
      </div>
      <div className="yt-info">
        <div className="yt-title" title={snippet?.title}>{snippet?.title}</div>
        <div className="yt-channel">{snippet?.channelTitle}</div>
        <div className="yt-meta">
          {views && <span>{views} views</span>}
          {views && snippet?.publishedAt && <span className="dot">·</span>}
          {snippet?.publishedAt && <span>{formatRelativeTime(snippet.publishedAt)}</span>}
        </div>
      </div>
    </div>
  )
}

export function VideoRow({ video, index, onClick }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isActive = currentTrack?.id === video?.id

  if (!video) return <VideoRowSkeleton />

  const { snippet, contentDetails } = video
  const thumb    = snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url
  const duration = youtubeService.parseDuration(contentDetails?.duration)

  return (
    <div
      className={`track-row ${isActive ? 'active yt' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="tr-num">{index + 1}</div>
      <div className="tr-thumb yt">
        {thumb
          ? <img src={thumb} alt={snippet?.title} loading="lazy" />
          : <div className="tr-thumb-placeholder" />
        }
      </div>
      <div className="tr-info">
        <div className="tr-name">{snippet?.title}</div>
        <div className="tr-artist">{snippet?.channelTitle}</div>
      </div>
      <div className="tr-dur">{formatDurationBadge(duration)}</div>
    </div>
  )
}

function formatDurationBadge(ms) {
  if (!ms) return ''
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

export function VideoCardSkeleton() {
  return (
    <div className="yt-card skeleton">
      <div className="yt-thumb skeleton-block" style={{ aspectRatio: '16/9' }} />
      <div className="yt-info">
        <div className="skeleton-line w-90" />
        <div className="skeleton-line w-60" />
        <div className="skeleton-line w-40" />
      </div>
    </div>
  )
}

export function VideoRowSkeleton() {
  return (
    <div className="track-row skeleton">
      <div className="skeleton-block" style={{ width: 18 }} />
      <div className="skeleton-block" style={{ width: 60, height: 34 }} />
      <div className="tr-info">
        <div className="skeleton-line w-70" />
        <div className="skeleton-line w-40" />
      </div>
    </div>
  )
}