// YouTube Data API v3 — core types

export interface YouTubeThumbnail {
  url: string
  width: number
  height: number
}

export interface YouTubeThumbnails {
  default:  YouTubeThumbnail
  medium?:  YouTubeThumbnail
  high?:    YouTubeThumbnail
  standard?: YouTubeThumbnail
  maxres?:  YouTubeThumbnail
}

export interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    description: string
    channelId: string
    channelTitle: string
    publishedAt: string
    thumbnails: YouTubeThumbnails
    tags?: string[]
    categoryId: string
    liveBroadcastContent: 'none' | 'live' | 'upcoming'
  }
  contentDetails?: {
    duration: string      // ISO 8601, e.g. "PT3M24S"
    definition: 'hd' | 'sd'
    caption: 'true' | 'false'
  }
  statistics?: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
}

export interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: YouTubeThumbnails
    publishedAt: string
  }
  statistics?: {
    subscriberCount: string
    videoCount: string
    viewCount: string
  }
}

export interface YouTubePlaylistItem {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: YouTubeThumbnails
    channelTitle: string
    publishedAt: string
    resourceId: { videoId: string }
  }
  contentDetails?: {
    videoId: string
    videoPublishedAt: string
  }
}

// Paginated list response
export interface YouTubeListResponse<T> {
  items: T[]
  nextPageToken?: string
  prevPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

// Auth tokens
export interface YouTubeTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// Search result — items can be video / channel / playlist
export interface YouTubeSearchResult {
  id: { kind: string; videoId?: string; channelId?: string }
  snippet: {
    title: string
    description: string
    channelTitle: string
    thumbnails: YouTubeThumbnails
    publishedAt: string
  }
}
