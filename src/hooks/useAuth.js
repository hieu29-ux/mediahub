import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { spotifyAuth, youtubeAuth } from '../services/auth.service'
import { spotifyService } from '../services/spotify.service'
import { youtubeService } from '../services/youtube.service'
import { tokenStorage } from '../utils/storage'

const log = (msg, ...args) => console.log(`[useAuth] ${msg}`, ...args)

export function useAuth() {
  const queryClient = useQueryClient()

  const {
    spotifyToken, spotifyExpires, spotifyUser, setSpotifyUser, clearSpotify,
    youtubeToken, youtubeExpires, youtubeUser, setYouTubeUser, clearYouTube,
  } = useAuthStore()

  const addToast = useUiStore((s) => s.addToast)

  // Check connected từ cả authStore lẫn localStorage (phòng trường hợp store chưa hydrate)
  const isSpotifyConnected = (!!spotifyToken && Date.now() < spotifyExpires) ||
    (() => { const t = tokenStorage.getSpotify(); return !!t.accessToken && Date.now() < t.expiresAt })()

  const isYouTubeConnected = (!!youtubeToken && Date.now() < youtubeExpires) ||
    (() => { const t = tokenStorage.getYouTube(); return !!t.accessToken && Date.now() < t.expiresAt })()

  // Fetch user info sau khi login
  useEffect(() => {
    if (isSpotifyConnected && !spotifyUser) {
      log('Fetching Spotify user info...')
      spotifyService.getMe().then(setSpotifyUser).catch((e) => log('getMe error:', e.message))
    }
  }, [isSpotifyConnected])

  useEffect(() => {
    if (isYouTubeConnected && !youtubeUser) {
      log('Fetching YouTube user info...')
      youtubeService.getMyChannel()
        .then((res) => setYouTubeUser(res?.items?.[0] ?? null))
        .catch((e) => log('getMyChannel error:', e.message))
    }
  }, [isYouTubeConnected])

  // OAuth callback listener — đăng ký 1 lần, dùng flag tránh double-call
  useEffect(() => {
    let handling = false

    const handler = async ({ service, code, error }) => {
      if (handling) {
        log('Ignoring duplicate callback for:', service)
        return
      }
      handling = true
      log('OAuth callback received — service:', service, '| code:', code?.slice(0, 12) + '...')

      if (error) {
        addToast('Auth error: ' + error, 'error')
        handling = false
        return
      }

      try {
        if (service === 'spotify') {
          await spotifyAuth.handleCallback(code)
          // Invalidate tất cả Spotify queries để refetch với token mới
          await queryClient.invalidateQueries({ queryKey: ['spotify'] })
          addToast('Spotify connected!', 'success')
          log('Spotify queries invalidated — data will refetch')
        } else if (service === 'youtube') {
          await youtubeAuth.handleCallback(code)
          await queryClient.invalidateQueries({ queryKey: ['youtube'] })
          addToast('YouTube connected!', 'success')
          log('YouTube queries invalidated — data will refetch')
        }
      } catch (e) {
        log('Callback error:', e.message)
        addToast(e.message, 'error')
      } finally {
        handling = false
      }
    }

    window.electronAPI?.removeOAuthListener()
    window.electronAPI?.onOAuthCallback(handler)
    log('OAuth listener registered')

    return () => {
      window.electronAPI?.removeOAuthListener()
      log('OAuth listener removed')
    }
  }, [])

  const loginSpotify = useCallback(() => {
    log('Starting Spotify login...')
    spotifyAuth.startLogin()
  }, [])

  const loginYouTube = useCallback(() => {
    log('Starting YouTube login...')
    youtubeAuth.startLogin()
  }, [])

  const logoutSpotify = useCallback(() => {
    spotifyAuth.logout()
    queryClient.removeQueries({ queryKey: ['spotify'] })
    addToast('Spotify disconnected')
  }, [])

  const logoutYouTube = useCallback(() => {
    youtubeAuth.logout()
    queryClient.removeQueries({ queryKey: ['youtube'] })
    addToast('YouTube disconnected')
  }, [])

  return {
    isSpotifyConnected, spotifyUser,
    isYouTubeConnected, youtubeUser,
    loginSpotify, loginYouTube,
    logoutSpotify, logoutYouTube,
  }
}