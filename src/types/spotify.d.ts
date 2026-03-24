// Spotify Web API — core types

export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  images?: SpotifyImage[]
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
  release_date: string
  artists: SpotifyArtist[]
  uri: string
  external_urls: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  popularity: number
  preview_url: string | null
  album: SpotifyAlbum
  artists: SpotifyArtist[]
  external_urls: { spotify: string }
  explicit: boolean
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: SpotifyImage[]
  owner: { display_name: string }
  tracks: { total: number }
  uri: string
  external_urls: { spotify: string }
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: SpotifyImage[]
  product: 'free' | 'premium'
  country: string
}

// Player
export interface SpotifyPlaybackState {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
  device: {
    id: string
    name: string
    volume_percent: number
  }
  shuffle_state: boolean
  repeat_state: 'off' | 'track' | 'context'
}

// Paginated response
export interface SpotifyPaged<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}

// Auth tokens
export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number   // Date.now() + expires_in * 1000
}
