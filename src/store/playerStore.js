import { create } from 'zustand'

export const usePlayerStore = create((set, get) => ({
  // Current track
  currentTrack:  null,   // SpotifyTrack | YouTubeVideo | null
  currentSource: null,   // 'spotify' | 'youtube' | null

  // Playback state
  isPlaying:    false,
  progressMs:   0,        // current position in ms
  durationMs:   0,        // total duration in ms
  volume:       80,       // 0–100
  isMuted:      false,
  isShuffle:    false,
  repeatMode:   'off',    // 'off' | 'track' | 'context'

  // Spotify-specific
  deviceId:     null,     // Spotify Web Playback SDK device id

  // Queue (simple next-up list)
  queue:        [],

  // Actions
  setCurrentTrack: (track, source) =>
    set({ currentTrack: track, currentSource: source }),

  setIsPlaying: (val) => set({ isPlaying: val }),

  setProgress: (ms) => set({ progressMs: ms }),

  setDuration: (ms) => set({ durationMs: ms }),

  setVolume: (val) => {
    const clamped = Math.max(0, Math.min(100, val))
    set({ volume: clamped, isMuted: clamped === 0 })
  },

  toggleMute: () => {
    const { isMuted, volume } = get()
    set({ isMuted: !isMuted, volume: isMuted ? (volume || 50) : volume })
  },

  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),

  cycleRepeat: () => {
    const next = { off: 'context', context: 'track', track: 'off' }
    set((s) => ({ repeatMode: next[s.repeatMode] }))
  },

  setDeviceId: (id) => set({ deviceId: id }),

  setQueue: (tracks) => set({ queue: tracks }),

  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

  clearQueue: () => set({ queue: [] }),

  // Computed helpers
  progressRatio: () => {
    const { progressMs, durationMs } = get()
    if (!durationMs) return 0
    return Math.min(1, progressMs / durationMs)
  },

  reset: () => set({
    currentTrack: null, currentSource: null,
    isPlaying: false, progressMs: 0, durationMs: 0,
  }),
}))
