import { usePlayer } from '../hooks/usePlayer'
import { usePlayerStore } from '../store/playerStore'
import { formatArtists, formatDuration } from '../utils/format'

export function TrackCard({ track, index, showIndex = false }) {
  const { playSpotifyTrack } = usePlayer()
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying    = usePlayerStore((s) => s.isPlaying)
  const isActive     = currentTrack?.id === track?.id

  if (!track) return <TrackCardSkeleton />

  const imageUrl = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url
  const artists  = formatArtists(track.artists)
  const duration = formatDuration(track.duration_ms)

  return (
    <div
      className={`track-card ${isActive ? 'active' : ''}`}
      onClick={() => playSpotifyTrack(track)}
      title={`${track.name} — ${artists}`}
    >
      <div className="track-card-art">
        {imageUrl
          ? <img src={imageUrl} alt={track.album?.name} loading="lazy" />
          : <div className="track-card-art-placeholder" />
        }
        <div className="track-card-overlay">
          {isActive && isPlaying
            ? <NowPlayingBars />
            : <PlayIcon />
          }
        </div>
        {showIndex && !isActive && (
          <span className="track-card-index">{index + 1}</span>
        )}
      </div>
      <div className="track-card-name">{track.name}</div>
      <div className="track-card-artist">{artists}</div>
      <div className="track-card-duration">{duration}</div>
    </div>
  )
}

export function TrackRow({ track, index }) {
  const { playSpotifyTrack } = usePlayer()
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying    = usePlayerStore((s) => s.isPlaying)
  const isActive     = currentTrack?.id === track?.id

  if (!track) return <TrackRowSkeleton />

  const imageUrl = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url
  const artists  = formatArtists(track.artists)

  return (
    <div
      className={`track-row ${isActive ? 'active' : ''}`}
      onClick={() => playSpotifyTrack(track)}
    >
      <div className="tr-num">
        {isActive && isPlaying ? <NowPlayingBars small /> : (index + 1)}
      </div>
      <div className="tr-thumb">
        {imageUrl
          ? <img src={imageUrl} alt={track.name} loading="lazy" />
          : <div className="tr-thumb-placeholder" />
        }
      </div>
      <div className="tr-info">
        <div className="tr-name">{track.name}</div>
        <div className="tr-artist">{artists}</div>
      </div>
      <div className="tr-dur">{formatDuration(track.duration_ms)}</div>
    </div>
  )
}

// Sub-components
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="rgba(0,0,0,.6)" />
      <path d="M8 6.5l6 3.5-6 3.5V6.5z" fill="#fff" />
    </svg>
  )
}

function NowPlayingBars({ small = false }) {
  const size = small ? 'small' : ''
  return (
    <div className={`now-playing-bars ${size}`}>
      <span /><span /><span />
    </div>
  )
}

export function TrackCardSkeleton() {
  return (
    <div className="track-card skeleton">
      <div className="track-card-art skeleton-block" />
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-50" />
    </div>
  )
}

export function TrackRowSkeleton() {
  return (
    <div className="track-row skeleton">
      <div className="skeleton-block" style={{ width: 18, height: 18 }} />
      <div className="skeleton-block tr-thumb" />
      <div className="tr-info">
        <div className="skeleton-line w-60" />
        <div className="skeleton-line w-40" />
      </div>
    </div>
  )
}
