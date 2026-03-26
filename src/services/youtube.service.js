import { youtubeHttp } from './http'

export const youtubeService = {
  // Public (chỉ cần API Key)
  getTrending: (regionCode = 'VN', limit = 24) =>
    youtubeHttp.get('videos', {
      part:       'snippet,contentDetails,statistics',
      chart:      'mostPopular',
      regionCode,
      maxResults: limit,
    }),

  getVideoDetail: (videoId) =>
    youtubeHttp.get('videos', {
      part: 'snippet,contentDetails,statistics',
      id:   videoId,
    }),

  getChannelDetail: (channelId) =>
    youtubeHttp.get('channels', {
      part: 'snippet,statistics',
      id:   channelId,
    }),

  search: (q, limit = 20, pageToken = '') =>
    youtubeHttp.get('search', {
      part:       'snippet',
      q,
      type:       'video',
      maxResults: limit,
      pageToken:  pageToken || undefined,
    }),

  searchChannels: (q, limit = 10) =>
    youtubeHttp.get('search', {
      part:       'snippet',
      q,
      type:       'channel',
      maxResults: limit,
    }),

  getRelatedVideos: (videoId, limit = 12) =>
    youtubeHttp.get('search', {
      part:           'snippet',
      relatedToVideoId: videoId,
      type:           'video',
      maxResults:     limit,
    }),

  getPlaylistItems: (playlistId, limit = 50, pageToken = '') =>
    youtubeHttp.get('playlistItems', {
      part:       'snippet,contentDetails',
      playlistId,
      maxResults: limit,
      pageToken:  pageToken || undefined,
    }),

  // Private (cần OAuth login)
  getSubscriptions: (limit = 50, pageToken = '') =>
    youtubeHttp.getAuth('subscriptions', {
      part:       'snippet,contentDetails',
      mine:       'true',
      maxResults: limit,
      pageToken:  pageToken || undefined,
    }),

  getLikedVideos: (limit = 50, pageToken = '') =>
    youtubeHttp.getAuth('videos', {
      part:       'snippet,contentDetails,statistics',
      myRating:   'like',
      maxResults: limit,
      pageToken:  pageToken || undefined,
    }),

  getWatchLater: (limit = 50) =>
    // Watch Later là playlist đặc biệt "WL" — cần OAuth
    youtubeHttp.getAuth('playlistItems', {
      part:       'snippet,contentDetails',
      playlistId: 'WL',
      maxResults: limit,
    }),

  getMyChannel: () =>
    youtubeHttp.getAuth('channels', {
      part: 'snippet,statistics',
      mine: 'true',
    }),

  rateVideo: (videoId, rating) =>   // rating: 'like' | 'dislike' | 'none'
    youtubeHttp.post(`videos/rate?id=${videoId}&rating=${rating}`),

  // Parse ISO 8601 duration (PT3M24S → ms)
  parseDuration(iso) {
    const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const [, h = 0, m = 0, s = 0] = match
    return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000
  },

  // Best thumbnail
  getBestThumbnail(thumbnails) {
    return (
      thumbnails?.maxres?.url ||
      thumbnails?.standard?.url ||
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      ''
    )
  },
}
