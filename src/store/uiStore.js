import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set) => ({
      // ─── Service ────────────────────────────────────────────────
      activeService: 'spotify',   // 'spotify' | 'youtube'
      setActiveService: (s) => set({ activeService: s }),

      // ─── Theme ──────────────────────────────────────────────────
      theme: 'dark',              // 'dark' | 'light' | 'system'
      setTheme: (t) => {
        set({ theme: t })
        applyTheme(t)
      },

      // ─── Sidebar ────────────────────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // ─── Modals ─────────────────────────────────────────────────
      settingsOpen: false,
      openSettings:  () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      // ─── Search ─────────────────────────────────────────────────
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      clearSearch: () => set({ searchQuery: '' }),

      // ─── Spotify active tab ─────────────────────────────────────
      spotifyTab: 'top',          // 'top' | 'playlists' | 'albums' | 'liked'
      setSpotifyTab: (t) => set({ spotifyTab: t }),

      // ─── YouTube active tab ─────────────────────────────────────
      youtubeTab: 'trending',     // 'trending' | 'subscriptions' | 'watchlater' | 'history'
      setYoutubeTab: (t) => set({ youtubeTab: t }),

      // ─── Notifications (toast) ──────────────────────────────────
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
        }, 3000)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'mediahub-ui',
      // Chỉ persist những thứ user muốn nhớ
      partialize: (s) => ({
        activeService:    s.activeService,
        theme:            s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        spotifyTab:       s.spotifyTab,
        youtubeTab:       s.youtubeTab,
      }),
    }
  )
)

// ─── Apply theme to <html> element ────────────────────────────────
export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
  // Electron: sync native titlebar color
  window.electronAPI?.setNativeTheme?.(theme)
}

// ─── Init theme on load (gọi từ main.jsx) ─────────────────────────
export function initTheme() {
  const stored = JSON.parse(localStorage.getItem('mediahub-ui') || '{}')
  applyTheme(stored?.state?.theme || 'dark')

  // Lắng nghe system theme change
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useUiStore.getState().theme
    if (current === 'system') applyTheme('system')
  })
}
