import { useQuery, useQueryClient } from '@tanstack/react-query'
import { spotifyService } from '../services/spotify.service'
import { tokenStorage } from '../utils/storage'

const STALE_LIBRARY = 5 * 60 * 1000
const STALE_PLAYER  = 30 * 1000

// Check từ localStorage trực tiếp — không phụ thuộc authStore re-render
function isSpotifyConnected() {
  const { accessToken, expiresAt } = tokenStorage.getSpotify()
  const connected = !!accessToken && Date.now() < expiresAt
  console.log('[useSpotify] isConnected check:', connected, '| expires in:', Math.round((expiresAt - Date.now()) / 1000) + 's')
  return connected
}

function useSpotifyQuery(key, fn, options = {}) {
  return useQuery({
    queryKey: key,
    queryFn: fn,
    enabled: isSpotifyConnected() && (options.enabled !== false),
    staleTime: options.staleTime ?? STALE_LIBRARY,
    retry: (failCount, error) => {
      // Không retry lỗi 403 (scope) hoặc 401 (auth)
      if (error?.status === 403 || error?.status === 401) return false
      return failCount < 1
    },
    ...options,
  })
}

export function useTopTracks(limit = 20, timeRange = 'long_term') {
  return useSpotifyQuery(
    ['spotify', 'top-tracks', limit, timeRange],
    () => spotifyService.getTopTracks(limit, timeRange),
  )
}

export function usePlaylists(limit = 50) {
  return useSpotifyQuery(
    ['spotify', 'playlists', limit],
    () => spotifyService.getPlaylists(limit),
  )
}

export function usePlaylistTracks(playlistId) {
  return useSpotifyQuery(
    ['spotify', 'playlist-tracks', playlistId],
    () => spotifyService.getPlaylistTracks(playlistId),
    { enabled: !!playlistId },
  )
}

export function useLikedTracks(limit = 50) {
  return useSpotifyQuery(
    ['spotify', 'liked', limit],
    () => spotifyService.getLikedTracks(limit),
  )
}

export function useSavedAlbums(limit = 20) {
  return useSpotifyQuery(
    ['spotify', 'albums', limit],
    () => spotifyService.getSavedAlbums(limit),
  )
}

export function useRecentlyPlayed(limit = 20) {
  return useSpotifyQuery(
    ['spotify', 'recently-played', limit],
    () => spotifyService.getRecentlyPlayed(limit),
  )
}

export function usePlaybackState() {
  return useSpotifyQuery(
    ['spotify', 'playback-state'],
    () => spotifyService.getPlaybackState(),
    { staleTime: STALE_PLAYER, refetchInterval: STALE_PLAYER },
  )
}

export function useSpotifySearch(query, enabled = true) {
  return useSpotifyQuery(
    ['spotify', 'search', query],
    () => spotifyService.search(query),
    {
      enabled: enabled && !!query && query.length > 1,
      staleTime: 2 * 60 * 1000,
    },
  )
}

// Hook để invalidate toàn bộ Spotify queries sau khi login
export function useInvalidateSpotify() {
  const queryClient = useQueryClient()
  return () => {
    console.log('[useSpotify] Invalidating all Spotify queries')
    queryClient.invalidateQueries({ queryKey: ['spotify'] })
  }
}