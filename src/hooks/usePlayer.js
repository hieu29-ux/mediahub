import { useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { spotifyService } from '../services/spotify.service'
import { useUiStore } from '../store/uiStore'

export function usePlayer() {
  const store    = usePlayerStore()
  const addToast = useUiStore((s) => s.addToast)

  // ── Spotify controls ───────────────────────────────────────────
  const playSpotifyTrack = useCallback(async (track) => {
    try {
      store.setCurrentTrack(track, 'spotify')
      store.setIsPlaying(true)
      await spotifyService.play(store.deviceId, { uris: [track.uri] })
    } catch (e) {
      
      if (e.status === 403) {
        addToast('Spotify Premium required for playback', 'warning')
      } else {
        addToast(e.message, 'error')
      }
    }
  }, [store.deviceId])

  const playSpotifyContext = useCallback(async (contextUri, offset = 0) => {
    try {
      store.setIsPlaying(true)
      await spotifyService.play(store.deviceId, {
        context_uri: contextUri,
        offset: { position: offset },
      })
    } catch (e) {
      addToast(e.message, 'error')
    }
  }, [store.deviceId])

  const pause = useCallback(async () => {
    store.setIsPlaying(false)
    if (store.currentSource === 'spotify') {
      await spotifyService.pause(store.deviceId).catch(() => {})
    }
    // YouTube: handled by SpotifySDK/IFrame player directly
  }, [store.currentSource, store.deviceId])

  const resume = useCallback(async () => {
    store.setIsPlaying(true)
    if (store.currentSource === 'spotify') {
      await spotifyService.play(store.deviceId).catch(() => {})
    }
  }, [store.currentSource, store.deviceId])

  const togglePlay = useCallback(() => {
    store.isPlaying ? pause() : resume()
  }, [store.isPlaying])

  const next = useCallback(async () => {
    if (store.currentSource === 'spotify') {
      await spotifyService.next(store.deviceId).catch(() => {})
    }
  }, [store.currentSource, store.deviceId])

  const previous = useCallback(async () => {
    if (store.currentSource === 'spotify') {
      await spotifyService.previous(store.deviceId).catch(() => {})
    }
  }, [store.currentSource, store.deviceId])

  const seek = useCallback(async (ms) => {
    store.setProgress(ms)
    if (store.currentSource === 'spotify') {
      await spotifyService.seek(ms, store.deviceId).catch(() => {})
    }
  }, [store.currentSource, store.deviceId])

  const setVolume = useCallback(async (val) => {
    store.setVolume(val)
    if (store.currentSource === 'spotify') {
      await spotifyService.setVolume(val, store.deviceId).catch(() => {})
    }
  }, [store.currentSource, store.deviceId])

  const toggleShuffle = useCallback(async () => {
    const next = !store.isShuffle
    store.toggleShuffle()
    if (store.currentSource === 'spotify') {
      await spotifyService.setShuffle(next, store.deviceId).catch(() => {})
    }
  }, [store.isShuffle, store.currentSource, store.deviceId])

  const cycleRepeat = useCallback(async () => {
    const modes = { off: 'context', context: 'track', track: 'off' }
    const next  = modes[store.repeatMode]
    store.cycleRepeat()
    if (store.currentSource === 'spotify') {
      await spotifyService.setRepeat(next, store.deviceId).catch(() => {})
    }
  }, [store.repeatMode, store.currentSource, store.deviceId])

  // ── YouTube play ───────────────────────────────────────────────
  const playYouTubeVideo = useCallback((video) => {
    store.setCurrentTrack(video, 'youtube')
    store.setIsPlaying(true)
    const durationMs = youtubeService_parseDuration(
      video?.contentDetails?.duration
    )
    if (durationMs) store.setDuration(durationMs)
  }, [])

  return {
    // state
    currentTrack:  store.currentTrack,
    currentSource: store.currentSource,
    isPlaying:     store.isPlaying,
    progressMs:    store.progressMs,
    durationMs:    store.durationMs,
    volume:        store.volume,
    isMuted:       store.isMuted,
    isShuffle:     store.isShuffle,
    repeatMode:    store.repeatMode,
    progressRatio: store.progressRatio(),
    // actions
    playSpotifyTrack,
    playSpotifyContext,
    playYouTubeVideo,
    togglePlay,
    pause,
    resume,
    next,
    previous,
    seek,
    setVolume,
    toggleMute:    store.toggleMute,
    toggleShuffle,
    cycleRepeat,
  }
}

// inline helper để tránh circular import
function youtubeService_parseDuration(iso) {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const [, h = 0, m = 0, s = 0] = match
  return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000
}
