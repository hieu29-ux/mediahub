import { tokenStorage } from '../utils/storage'

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID
const YOUTUBE_CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET

const EXPIRY_BUFFER = 60 * 1000
const log = (msg, ...args) => console.log(`[TokenManager] ${msg}`, ...args)
const warn = (msg, ...args) => console.warn(`[TokenManager] ${msg}`, ...args)

// Sync token vào authStore — không bọc try/catch để lỗi nổi lên rõ
async function syncToAuthStore(service, tokens) {
  const { useAuthStore } = await import('../store/authStore')
  const state = useAuthStore.getState()
  if (service === 'spotify') {
    state.setSpotifyAuth(tokens)
    log('Spotify tokens synced to authStore, expires:', new Date(tokens.expiresAt).toLocaleTimeString())
  } else {
    state.setYouTubeAuth(tokens)
    log('YouTube tokens synced to authStore, expires:', new Date(tokens.expiresAt).toLocaleTimeString())
  }
}

// ─── Spotify ──────────────────────────────────────────────────────
export const spotifyTokenManager = {
  async getValid() {
    const { accessToken, refreshToken, expiresAt } = tokenStorage.getSpotify()

    log('getValid — token exists:', !!accessToken, '| expires in:', Math.round((expiresAt - Date.now()) / 1000) + 's')

    if (!accessToken) throw new Error('Spotify not connected — please login')

    if (Date.now() < expiresAt - EXPIRY_BUFFER) {
      log('Token still valid, returning directly')
      return accessToken
    }

    warn('Token expired or expiring soon, refreshing...')
    if (!refreshToken) {
      tokenStorage.clearSpotify()
      throw new Error('Spotify refresh token missing — please login again')
    }

    return this.refresh(refreshToken)
  },

  async refresh(refreshToken) {
    log('Refreshing Spotify token...')

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     SPOTIFY_CLIENT_ID,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      warn('Refresh failed:', err)
      tokenStorage.clearSpotify()
      throw new Error(`Spotify token refresh failed: ${err.error_description || res.status}`)
    }

    const data = await res.json()
    const tokens = {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt:    Date.now() + data.expires_in * 1000,
    }

    // Luôn lưu vào storage trước
    tokenStorage.setSpotify(tokens)
    log('New Spotify token saved to localStorage')

    // Sau đó sync vào authStore — không dùng try/catch để biết lỗi
    await syncToAuthStore('spotify', tokens)

    return tokens.accessToken
  },
}

// ─── YouTube ──────────────────────────────────────────────────────
export const youtubeTokenManager = {
  async getValid() {
    const { accessToken, refreshToken, expiresAt } = tokenStorage.getYouTube()

    log('YT getValid — token exists:', !!accessToken, '| expires in:', Math.round((expiresAt - Date.now()) / 1000) + 's')

    if (!accessToken) throw new Error('YouTube not connected — please login')
    if (Date.now() < expiresAt - EXPIRY_BUFFER) return accessToken

    warn('YouTube token expired, refreshing...')
    if (!refreshToken) {
      tokenStorage.clearYouTube()
      throw new Error('YouTube refresh token missing — please login again')
    }

    return this.refresh(refreshToken)
  },

  async refresh(refreshToken) {
    log('Refreshing YouTube token...')

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      warn('YT refresh failed:', err)
      tokenStorage.clearYouTube()
      throw new Error(`YouTube token refresh failed: ${err.error_description || res.status}`)
    }

    const data = await res.json()
    const tokens = {
      accessToken:  data.access_token,
      refreshToken: refreshToken,
      expiresAt:    Date.now() + data.expires_in * 1000,
    }

    tokenStorage.setYouTube(tokens)
    log('New YouTube token saved to localStorage')

    await syncToAuthStore('youtube', tokens)

    return tokens.accessToken
  },
}