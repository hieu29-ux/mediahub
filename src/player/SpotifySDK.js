import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { spotifyTokenManager } from '../services/token.manager'

/**
 * Hook: khởi tạo Spotify Web Playback SDK.
 * Gọi 1 lần duy nhất ở AppShell khi Spotify connected + Premium.
 */
export function useSpotifySDK() {
  const playerRef = useRef(null)
  const setDeviceId = usePlayerStore((s) => s.setDeviceId)
  const { setIsPlaying, setProgress, setDuration, setCurrentTrack, setVolume } = usePlayerStore()
  const isConnected = useAuthStore((s) => !!s.spotifyToken && Date.now() < s.spotifyExpires)

  useEffect(() => {
    if (!isConnected) return

    // Inject SDK script nếu chưa có
    if (!window.Spotify) {
      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name:       'MediaHub',
        volume:     0.8,
        getOAuthToken: async (cb) => {
          try {
            const token = await spotifyTokenManager.getValid()
            cb(token)
          } catch {
            cb('')
          }
        },
      })

      // ── Ready ──────────────────────────────────────────────
      player.addListener('ready', ({ device_id }) => {
        console.log('[SpotifySDK] Ready, device_id:', device_id)
        setDeviceId(device_id)
        // Transfer playback sang device này
        import('../services/spotify.service').then(({ spotifyService }) => {
          spotifyService.transferPlayback(device_id, false).catch(() => {})
        })
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.warn('[SpotifySDK] Device offline:', device_id)
        setDeviceId(null)
      })

      // ── Playback state change ──────────────────────────────
      player.addListener('player_state_changed', (state) => {
        if (!state) return
        setIsPlaying(!state.paused)
        setProgress(state.position)
        setDuration(state.duration)

        const track = state.track_window?.current_track
        if (track) {
          setCurrentTrack({
            id:         track.id,
            name:       track.name,
            uri:        track.uri,
            duration_ms: state.duration,
            artists:    track.artists,
            album: {
              name:   track.album.name,
              images: track.album.images,
            },
          }, 'spotify')
        }
      })

      // ── Errors ────────────────────────────────────────────
      player.addListener('authentication_error', ({ message }) =>
        console.error('[SpotifySDK] Auth error:', message))
      player.addListener('account_error', ({ message }) =>
        console.error('[SpotifySDK] Account error (Premium required):', message))
      player.addListener('playback_error', ({ message }) =>
        console.error('[SpotifySDK] Playback error:', message))

      player.connect().then((ok) => {
        if (!ok) console.error('[SpotifySDK] Failed to connect')
      })

      playerRef.current = player
    }

    // SDK đã load trước đó
    if (window.Spotify) window.onSpotifyWebPlaybackSDKReady()

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [isConnected])

  return playerRef
}
