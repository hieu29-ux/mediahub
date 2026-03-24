/**
 * Safe localStorage wrapper
 * — tự serialize/deserialize JSON
 * — không crash khi localStorage bị block (private mode)
 */

const PREFIX = 'mediahub:'

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return fallback
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch {
      console.warn(`[storage] Failed to set "${key}"`)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      // ignore
    }
  },

  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  },
}

// ─── Token helpers (dùng riêng cho OAuth) ─────────────────────────
export const tokenStorage = {
  setSpotify({ accessToken, refreshToken, expiresAt }) {
    storage.set('sp_access',  accessToken)
    storage.set('sp_refresh', refreshToken)
    storage.set('sp_expires', expiresAt)
  },

  getSpotify() {
    return {
      accessToken:  storage.get('sp_access'),
      refreshToken: storage.get('sp_refresh'),
      expiresAt:    storage.get('sp_expires', 0),
    }
  },

  clearSpotify() {
    storage.remove('sp_access')
    storage.remove('sp_refresh')
    storage.remove('sp_expires')
    storage.remove('sp_verifier')
  },

  setYouTube({ accessToken, refreshToken, expiresAt }) {
    storage.set('yt_access',  accessToken)
    storage.set('yt_refresh', refreshToken)
    storage.set('yt_expires', expiresAt)
  },

  getYouTube() {
    return {
      accessToken:  storage.get('yt_access'),
      refreshToken: storage.get('yt_refresh'),
      expiresAt:    storage.get('yt_expires', 0),
    }
  },

  clearYouTube() {
    storage.remove('yt_access')
    storage.remove('yt_refresh')
    storage.remove('yt_expires')
  },

  clearAll() {
    this.clearSpotify()
    this.clearYouTube()
  },
}
