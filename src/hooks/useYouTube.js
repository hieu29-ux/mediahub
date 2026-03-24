import { useQuery } from '@tanstack/react-query'
import { youtubeService } from '../services/youtube.service'
import { useAuthStore } from '../store/authStore'

const STALE_PUBLIC  = 10 * 60 * 1000
const STALE_PRIVATE =  5 * 60 * 1000

function useYouTubeQuery(key, fn, options = {}) {
  return useQuery({
    queryKey: key,
    queryFn: fn,
    staleTime: options.staleTime ?? STALE_PUBLIC,
    retry: 1,
    ...options,
  })
}

function useYouTubeAuthQuery(key, fn, options = {}) {
  const isConnected = useAuthStore((s) => !!s.youtubeToken && Date.now() < s.youtubeExpires)
  return useQuery({
    queryKey: key,
    queryFn: fn,
    enabled: isConnected && (options.enabled !== false),
    staleTime: options.staleTime ?? STALE_PRIVATE,
    retry: 1,
    ...options,
  })
}

export function useTrending(regionCode = 'VN') {
  return useYouTubeQuery(
    ['youtube', 'trending', regionCode],
    () => youtubeService.getTrending(regionCode),
  )
}

export function useYouTubeSearch(query, enabled = true) {
  return useYouTubeQuery(
    ['youtube', 'search', query],
    () => youtubeService.search(query),
    {
      enabled: enabled && !!query && query.length > 1,
      staleTime: 2 * 60 * 1000,
    },
  )
}

export function useVideoDetail(videoId) {
  return useYouTubeQuery(
    ['youtube', 'video', videoId],
    () => youtubeService.getVideoDetail(videoId),
    { enabled: !!videoId },
  )
}

export function useRelatedVideos(videoId) {
  return useYouTubeQuery(
    ['youtube', 'related', videoId],
    () => youtubeService.getRelatedVideos(videoId),
    { enabled: !!videoId },
  )
}

// Auth-required
export function useSubscriptions() {
  return useYouTubeAuthQuery(
    ['youtube', 'subscriptions'],
    () => youtubeService.getSubscriptions(),
  )
}

export function useWatchLater() {
  return useYouTubeAuthQuery(
    ['youtube', 'watch-later'],
    () => youtubeService.getWatchLater(),
  )
}

export function useLikedVideos() {
  return useYouTubeAuthQuery(
    ['youtube', 'liked-videos'],
    () => youtubeService.getLikedVideos(),
  )
}
