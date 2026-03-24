import { usePlayer } from '../hooks/usePlayer'
import { formatDuration } from '../utils/format'
import { youtubeService } from '../services/youtube.service'

export function MiniPlayerBar() {
  const {
    currentTrack, currentSource, isPlaying,
    progressMs, durationMs, progressRatio,
    volume, isMuted, isShuffle, repeatMode,
    togglePlay, next, previous, seek,
    setVolume, toggleMute, toggleShuffle, cycleRepeat,
  } = usePlayer()

  const isSpotify = currentSource === 'spotify'
  const isYouTube = currentSource === 'youtube'

  // ── Track info ──────────────────────────────────────────────────
  let title = 'Nothing playing'
  let subtitle = ''
  let imageUrl = null

  if (isSpotify && currentTrack) {
    title    = currentTrack.name
    subtitle = currentTrack.artists?.map(a => a.name).join(', ')
    imageUrl = currentTrack.album?.images?.[2]?.url || currentTrack.album?.images?.[0]?.url
  } else if (isYouTube && currentTrack) {
    title    = currentTrack.snippet?.title ?? currentTrack.name ?? ''
    subtitle = currentTrack.snippet?.channelTitle ?? ''
    imageUrl = youtubeService.getBestThumbnail(currentTrack.snippet?.thumbnails)
  }

  // ── Seek click ──────────────────────────────────────────────────
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(Math.round(ratio * durationMs))
  }

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const val = Math.round(Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)))
    setVolume(val)
  }

  return (
    <footer className="player-bar" data-source={currentSource}>
      {/* Left: track info */}
      <div className="player-left">
        <div className="player-thumb">
          {imageUrl
            ? <img src={imageUrl} alt={title} />
            : <div className={`player-thumb-placeholder ${currentSource ?? ''}`} />
          }
        </div>
        <div className="player-track-info">
          <div className="p-title">
            <span>{title}</span>
            {currentSource && (
              <span className={`p-source-badge badge-${currentSource}`}>
                {currentSource.toUpperCase()}
              </span>
            )}
          </div>
          <div className="p-artist">{subtitle}</div>
        </div>
      </div>

      {/* Center: controls + progress */}
      <div className="player-center">
        <div className="p-controls">
          <button
            className={`p-btn ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            <ShuffleIcon />
          </button>

          <button className="p-btn" onClick={previous} title="Previous">
            <PrevIcon />
          </button>

          <button className="p-play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button className="p-btn" onClick={next} title="Next">
            <NextIcon />
          </button>

          <button
            className={`p-btn ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={cycleRepeat}
            title={`Repeat: ${repeatMode}`}
          >
            <RepeatIcon mode={repeatMode} />
          </button>
        </div>

        <div className="p-progress">
          <span className="p-time">{formatDuration(progressMs)}</span>
          <div className="p-bar" onClick={handleSeek}>
            <div className="p-fill" style={{ width: `${progressRatio * 100}%` }}>
              <div className="p-dot" />
            </div>
          </div>
          <span className="p-time right">{formatDuration(durationMs)}</span>
        </div>
      </div>

      {/* Right: volume */}
      <div className="player-right">
        <button className="p-vol-icon" onClick={toggleMute}>
          <VolumeIcon muted={isMuted} level={volume} />
        </button>
        <div className="p-vol-bar" onClick={handleVolume}>
          <div className="p-vol-fill" style={{ width: `${isMuted ? 0 : volume}%` }} />
        </div>
      </div>
    </footer>
  )
}

// ── SVG icons ──────────────────────────────────────────────────────
const PlayIcon  = () => <svg width="14" height="14" viewBox="0 0 16 16"><path d="M5 3l9 5-9 5V3z" fill="currentColor"/></svg>
const PauseIcon = () => <svg width="14" height="14" viewBox="0 0 16 16"><rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/></svg>
const PrevIcon  = () => <svg width="14" height="14" fill="none" viewBox="0 0 16 16"><path d="M3 3v10M13 3L6 8l7 5V3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const NextIcon  = () => <svg width="14" height="14" fill="none" viewBox="0 0 16 16"><path d="M13 3v10M3 3l7 5-7 5V3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ShuffleIcon = () => <svg width="14" height="14" fill="none" viewBox="0 0 16 16"><path d="M1 5h10M1 11h10M9 3l4 2-4 2M9 9l4 2-4 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>

function RepeatIcon({ mode }) {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
      <path d="M2 9V6a3 3 0 013-3h6M14 7V10a3 3 0 01-3 3H5M12 2l2 2-2 2M4 12l-2 2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      {mode === 'track' && <text x="7" y="10" fontSize="6" fill="currentColor" textAnchor="middle">1</text>}
    </svg>
  )
}

function VolumeIcon({ muted, level }) {
  if (muted || level === 0) {
    return <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2 5h2.5L7 3v8L4.5 9H2V5z" fill="currentColor"/><line x1="9" y1="5" x2="13" y2="9" stroke="currentColor" strokeWidth="1.1"/><line x1="13" y1="5" x2="9" y2="9" stroke="currentColor" strokeWidth="1.1"/></svg>
  }
  if (level < 50) {
    return <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2 5h2.5L7 3v8L4.5 9H2V5z" fill="currentColor"/><path d="M9 4.5c1 .7 1.5 1.7 1.5 2.5S10 9 9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
  }
  return <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2 5h2.5L7 3v8L4.5 9H2V5z" fill="currentColor"/><path d="M9 4.5c1 .7 1.5 1.7 1.5 2.5S10 9 9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M11 3c1.5 1 2.3 2.5 2.3 4S12.5 10 11 11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
}
