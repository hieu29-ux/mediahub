import { useState } from 'react'
import { TrackCard, TrackCardSkeleton, TrackRow, TrackRowSkeleton } from '../components/TrackCard'
import { useAuth } from '../hooks/useAuth'
import {
    useLikedTracks,
    usePlaylists,
    useRecentlyPlayed,
    useSavedAlbums,
    useSpotifySearch,
    useTopTracks,
} from '../hooks/useSpotify'
import { useUiStore } from '../store/uiStore'

const TABS = ['top', 'playlists', 'albums', 'liked']

export function SpotifyPage() {
  const { spotifyTab, setSpotifyTab } = useUiStore()
  const { isSpotifyConnected, loginSpotify } = useAuth()
  const [search, setSearch] = useState('')

  if (!isSpotifyConnected) return <ConnectPrompt onConnect={loginSpotify} service="Spotify" />

  return (
    <div className="page-container">
      {/* Tab bar + search */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${spotifyTab === tab ? 'active' : ''}`}
            onClick={() => setSpotifyTab(tab)}
          >
            {tab === 'top' ? 'Top Tracks' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <div className="tab-search-wrap">
          <div className="tab-search-bar">
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tracks, artists…"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {search
          ? <SpotifySearchResults query={search} />
          : <SpotifyTabContent tab={spotifyTab} />
        }
      </div>
    </div>
  )
}

function SpotifyTabContent({ tab }) {
  if (tab === 'top')       return <TopTracksTab />
  if (tab === 'playlists') return <PlaylistsTab />
  if (tab === 'albums')    return <AlbumsTab />
  if (tab === 'liked')     return <LikedTab />
  return null
}

function TopTracksTab() {
  const { data: topData,    isLoading: l1 } = useTopTracks(20)
  const { data: recentData, isLoading: l2 } = useRecentlyPlayed(20)

  const topTracks    = topData?.items ?? []
  const recentTracks = recentData?.items?.map(i => i.track) ?? []

  return (
    <>
      <div className="section-label">Your top tracks — all time</div>
      <div className="track-grid">
        {l1
          ? Array(8).fill(0).map((_, i) => <TrackCardSkeleton key={i} />)
          : topTracks.map((t, i) => <TrackCard key={t.id} track={t} index={i} />)
        }
      </div>

      <div className="section-label">Recently played</div>
      <div className="track-list">
        {l2
          ? Array(5).fill(0).map((_, i) => <TrackRowSkeleton key={i} />)
          : recentTracks.map((t, i) => <TrackRow key={`${t?.id}-${i}`} track={t} index={i} />)
        }
      </div>
    </>
  )
}

function PlaylistsTab() {
  const { data, isLoading } = usePlaylists()
  const playlists = data?.items ?? []

  return (
    <>
      <div className="section-label">Your playlists</div>
      <div className="track-list">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <TrackRowSkeleton key={i} />)
          : playlists.map((p, i) => (
              <div key={p.id} className="track-row">
                <div className="tr-num">{i + 1}</div>
                <div className="tr-thumb">
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} loading="lazy" />
                    : <div className="tr-thumb-placeholder" />
                  }
                </div>
                <div className="tr-info">
                  <div className="tr-name">{p.name}</div>
                  <div className="tr-artist">{p.tracks?.total} songs · {p.owner?.display_name}</div>
                </div>
              </div>
            ))
        }
      </div>
    </>
  )
}

function AlbumsTab() {
  const { data, isLoading } = useSavedAlbums()
  const albums = data?.items?.map(i => i.album) ?? []

  return (
    <>
      <div className="section-label">Saved albums</div>
      <div className="track-grid">
        {isLoading
          ? Array(8).fill(0).map((_, i) => <TrackCardSkeleton key={i} />)
          : albums.map((album, i) => (
              <div key={album.id} className="track-card">
                <div className="track-card-art">
                  {album.images?.[1]?.url
                    ? <img src={album.images[1].url} alt={album.name} loading="lazy" />
                    : <div className="track-card-art-placeholder" />
                  }
                </div>
                <div className="track-card-name">{album.name}</div>
                <div className="track-card-artist">
                  {album.artists?.map(a => a.name).join(', ')}
                </div>
                <div className="track-card-duration">{album.release_date?.slice(0, 4)}</div>
              </div>
            ))
        }
      </div>
    </>
  )
}

function LikedTab() {
  const { data, isLoading } = useLikedTracks()
  const tracks = data?.items?.map(i => i.track) ?? []

  return (
    <>
      <div className="section-label">Liked songs · {data?.total ?? '—'}</div>
      <div className="track-list">
        {isLoading
          ? Array(8).fill(0).map((_, i) => <TrackRowSkeleton key={i} />)
          : tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)
        }
      </div>
    </>
  )
}

function SpotifySearchResults({ query }) {
  const { data, isLoading } = useSpotifySearch(query)
  const tracks = data?.tracks?.items ?? []

  if (isLoading) return <div className="track-list">{Array(5).fill(0).map((_, i) => <TrackRowSkeleton key={i} />)}</div>
  if (!tracks.length) return <EmptyState message={`No results for "${query}"`} />

  return (
    <>
      <div className="section-label">Search results</div>
      <div className="track-list">
        {tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)}
      </div>
    </>
  )
}

// Shared UI
function ConnectPrompt({ onConnect, service }) {
  return (
    <div className="connect-prompt">
      <div className="connect-prompt-title">Connect {service}</div>
      <div className="connect-prompt-desc">
        Sign in to access your library, playlists and playback.
      </div>
      <button className="connect-btn" onClick={onConnect}>
        Connect {service}
      </button>
    </div>
  )
}

function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>
}

function SearchIcon() {
  return (
    <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="7.9" y1="7.9" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
