/**
 * Token event emitter — notify subscribers khi token refresh xảy ra
 * Giải quyết vấn đề circular dependency giữa token.manager và authStore
 */

const listeners = {
  spotify: new Set(),
  youtube: new Set(),
}

export const tokenEvents = {
  /**
   * Subscribe tới Spotify token refresh events
   * @param {Function} fn - callback nhận {accessToken, refreshToken, expiresAt}
   * @returns {Function} unsubscribe function
   */
  onSpotifyRefresh(fn) {
    listeners.spotify.add(fn)
    return () => listeners.spotify.delete(fn)
  },

  /**
   * Notify all Spotify listeners
   */
  emitSpotifyRefresh(tokens) {
    console.log('[tokenEvents] Emitting Spotify refresh', { expiresAt: tokens.expiresAt })
    listeners.spotify.forEach(fn => {
      try {
        fn(tokens)
      } catch (err) {
        console.error('[tokenEvents] Listener error:', err)
      }
    })
  },

  /**
   * Subscribe tới YouTube token refresh events
   */
  onYouTubeRefresh(fn) {
    listeners.youtube.add(fn)
    return () => listeners.youtube.delete(fn)
  },

  /**
   * Notify all YouTube listeners
   */
  emitYouTubeRefresh(tokens) {
    console.log('[tokenEvents] Emitting YouTube refresh', { expiresAt: tokens.expiresAt })
    listeners.youtube.forEach(fn => {
      try {
        fn(tokens)
      } catch (err) {
        console.error('[tokenEvents] Listener error:', err)
      }
    })
  },
}
