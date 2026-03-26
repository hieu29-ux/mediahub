import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { tokenStorage } from '../utils/storage'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Spotify
      spotifyToken:   null,   // access token
      spotifyRefresh: null,   // refresh token
      spotifyExpires: 0,      // timestamp ms
      spotifyUser:    null,   // SpotifyUser object

      isSpotifyConnected: () => {
        const { spotifyToken, spotifyExpires } = get()
        return !!spotifyToken && Date.now() < spotifyExpires
      },

      setSpotifyAuth: ({ accessToken, refreshToken, expiresAt }) => {
        set({
          spotifyToken:   accessToken,
          spotifyRefresh: refreshToken,
          spotifyExpires: expiresAt,
        })
        tokenStorage.setSpotify({ accessToken, refreshToken, expiresAt })
      },

      setSpotifyUser: (user) => set({ spotifyUser: user }),

      clearSpotify: () => {
        set({ spotifyToken: null, spotifyRefresh: null, spotifyExpires: 0, spotifyUser: null })
        tokenStorage.clearSpotify()
      },

      // YouTube
      youtubeToken:   null,
      youtubeRefresh: null,
      youtubeExpires: 0,
      youtubeUser:    null,

      isYouTubeConnected: () => {
        const { youtubeToken, youtubeExpires } = get()
        return !!youtubeToken && Date.now() < youtubeExpires
      },

      setYouTubeAuth: ({ accessToken, refreshToken, expiresAt }) => {
        set({
          youtubeToken:   accessToken,
          youtubeRefresh: refreshToken,
          youtubeExpires: expiresAt,
        })
        tokenStorage.setYouTube({ accessToken, refreshToken, expiresAt })
      },

      setYouTubeUser: (user) => set({ youtubeUser: user }),

      clearYouTube: () => {
        set({ youtubeToken: null, youtubeRefresh: null, youtubeExpires: 0, youtubeUser: null })
        tokenStorage.clearYouTube()
      },

      clearAll: () => {
        get().clearSpotify()
        get().clearYouTube()
      },
    }),
    {
      name: 'mediahub-auth',
      // Chỉ persist tokens — user info tự fetch lại khi launch
      partialize: (state) => ({
        spotifyToken:   state.spotifyToken,
        spotifyRefresh: state.spotifyRefresh,
        spotifyExpires: state.spotifyExpires,
        youtubeToken:   state.youtubeToken,
        youtubeRefresh: state.youtubeRefresh,
        youtubeExpires: state.youtubeExpires,
      }),
    }
  )
)
