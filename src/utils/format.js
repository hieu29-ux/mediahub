// ─── Time ─────────────────────────────────────────────────────────
/**
 * 213000 ms  →  "3:33"
 * 3661000 ms →  "1:01:01"
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * ISO string / timestamp → "2 min ago", "3 hours ago", "Jan 5"
 */
export function formatRelativeTime(date) {
  const now = Date.now()
  const ts = typeof date === 'string' ? new Date(date).getTime() : date
  const diff = Math.floor((now - ts) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Numbers ──────────────────────────────────────────────────────
/**
 * 1234567 → "1.2M"   |   980000 → "980K"
 */
export function formatCount(n) {
  if (!n || n < 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

/** 0.35 → "35%" */
export function formatPercent(ratio, decimals = 0) {
  return `${(ratio * 100).toFixed(decimals)}%`
}

// ─── Strings ──────────────────────────────────────────────────────
/** "hello world" → "Hello World" */
export function toTitleCase(str) {
  if (!str) return ''
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

/** truncate("Hello World", 8) → "Hello W…" */
export function truncate(str, maxLen = 30) {
  if (!str) return ''
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…'
}

/** [{name:'A'},{name:'B'}] → "A, B" */
export function formatArtists(artists = []) {
  return artists.map(a => a.name).join(', ')
}
