import { spotifyTokenManager, youtubeTokenManager } from './token.manager'

async function request(url, options = {}, tokenFn = null, retried = false) {
  const headers = { ...options.headers }

  if (tokenFn) {
    const token = await tokenFn()
    headers['Authorization'] = `Bearer ${token}`
  }

  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json'
    options = { ...options, body: JSON.stringify(options.body) }
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && tokenFn && !retried) {
    try { await tokenFn(true) } catch {
      throw new ApiError(401, 'Unauthorized — please reconnect your account')
    }
    return request(url, options, tokenFn, true)
  }

  if (res.status === 204) return null

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json()
      message = err?.error?.message || err?.error?.status || message
    } catch {}
    throw new ApiError(res.status, message)
  }

  return res.json()
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ─── Spotify ──────────────────────────────────────────────────────
const SPOTIFY_BASE = 'https://api.spotify.com/v1'

export const spotifyHttp = {
  get: (endpoint, params) => {
    const url = new URL(`${SPOTIFY_BASE}/${endpoint}`)
    if (params) Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .forEach(([k, v]) => url.searchParams.set(k, v))
    return request(url.toString(), { method: 'GET' }, spotifyTokenManager.getValid.bind(spotifyTokenManager))
  },
  post: (endpoint, body) =>
    request(`${SPOTIFY_BASE}/${endpoint}`, { method: 'POST', body }, spotifyTokenManager.getValid.bind(spotifyTokenManager)),
  put: (endpoint, body) =>
    request(`${SPOTIFY_BASE}/${endpoint}`, { method: 'PUT', body }, spotifyTokenManager.getValid.bind(spotifyTokenManager)),
  delete: (endpoint) =>
    request(`${SPOTIFY_BASE}/${endpoint}`, { method: 'DELETE' }, spotifyTokenManager.getValid.bind(spotifyTokenManager)),
}

// ─── YouTube ──────────────────────────────────────────────────────
const YOUTUBE_BASE    = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

export const youtubeHttp = {
  // Public — chỉ cần API Key
  get: (endpoint, params = {}) => {
    const url = new URL(`${YOUTUBE_BASE}/${endpoint}`)
    url.searchParams.set('key', YOUTUBE_API_KEY)
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .forEach(([k, v]) => url.searchParams.set(k, v))
    return request(url.toString(), { method: 'GET' })
  },

  // Private — dùng Bearer token, KHÔNG dùng API key
  getAuth: (endpoint, params = {}) => {
    const url = new URL(`${YOUTUBE_BASE}/${endpoint}`)
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .forEach(([k, v]) => url.searchParams.set(k, v))
    return request(url.toString(), { method: 'GET' }, youtubeTokenManager.getValid.bind(youtubeTokenManager))
  },

  post: (endpoint, body) =>
    request(`${YOUTUBE_BASE}/${endpoint}`, { method: 'POST', body }, youtubeTokenManager.getValid.bind(youtubeTokenManager)),
}