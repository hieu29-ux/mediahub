import { useState, useEffect, useCallback, useRef } from 'react'
import { youtubeService } from '../services/youtube.service'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { youtubeAuth } from '../services/auth.service'
import { formatCount, formatRelativeTime } from '../utils/format'

const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

// ─── Watch history ────────────────────────────────────────────────
function saveToHistory(video) {
  try {
    const key = 'yt_watch_history'
    const history = JSON.parse(localStorage.getItem(key) || '[]')
    const entry = { id: video.id?.videoId ?? video.id, snippet: video.snippet, watchedAt: Date.now() }
    const filtered = history.filter(v => v.id !== entry.id)
    localStorage.setItem(key, JSON.stringify([entry, ...filtered].slice(0, 50)))
  } catch {}
}

// ─── Saved (Watch Later) — local, không cần auth ─────────────────
const SAVED_KEY = 'yt_saved_videos'
function getSavedList() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') } catch { return [] }
}
function checkIsSaved(video) {
  const id = video?.id?.videoId ?? video?.id
  return getSavedList().some(v => (v.id?.videoId ?? v.id) === id)
}
function toggleSavedLocal(video) {
  const id = video?.id?.videoId ?? video?.id
  const list = getSavedList()
  const exists = list.some(v => (v.id?.videoId ?? v.id) === id)
  if (exists) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list.filter(v => (v.id?.videoId ?? v.id) !== id)))
    return false
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(
    [{ id: video.id, snippet: video.snippet, savedAt: Date.now() }, ...list].slice(0, 200)
  ))
  return true
}

// ─── Toast component ──────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="yt-toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`yt-toast yt-toast--${t.type}`}>
          {t.type === 'success' && (
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
              <path d="M2 7l3.5 3.5L12 3" stroke="#1db954" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {t.type === 'error' && (
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="5.5" stroke="#ff4444" strokeWidth="1.4"/>
              <path d="M7 4v3.5M7 9.5v.5" stroke="#ff4444" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
          {t.type === 'info' && (
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="5.5" stroke="#888" strokeWidth="1.4"/>
              <path d="M7 6.5v4M7 4.5v.5" stroke="#888" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
          <span>{t.message}</span>
          {t.action && (
            <button className="yt-toast-action" onClick={t.action.fn}>
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── useToast hook ────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const show = useCallback(({ message, type = 'info', duration = 3000, action }) => {
    const id = Date.now()
    setToasts(prev => [...prev.slice(-2), { id, message, type, action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])
  return { toasts, show }
}

// ─── Main component ───────────────────────────────────────────────
export function YouTubeModal({ video, channel, onClose }) {
  const [view, setView]                       = useState(channel ? 'channel' : 'player')
  const [currentVideo, setCurrentVideo]       = useState(video ?? null)
  const [videoDetail, setVideoDetail]         = useState(null)
  const [comments, setComments]               = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [related, setRelated]                 = useState([])
  const [loadingRelated, setLoadingRelated]   = useState(false)
  const [channelVideos, setChannelVideos]     = useState([])
  const [loadingChannel, setLoadingChannel]   = useState(false)
  const [audioOnly, setAudioOnly]             = useState(false)
  const [showDesc, setShowDesc]               = useState(false)

  // Action states
  const [liked, setLiked]             = useState(false)
  const [liking, setLiking]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [copying, setCopying]         = useState(false)
  const [subscribed, setSubscribed]   = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  // subscriptionId cần để huỷ đăng ký
  const subscriptionIdRef = useRef(null)

  const { setCurrentTrack, setIsPlaying } = usePlayerStore()
  const { youtubeToken, isYouTubeConnected } = useAuthStore()
  const { toasts, show: showToast } = useToast()

  const isAuthed = isYouTubeConnected()

  // khai báo sớm — dùng trong useCallback bên dưới
  const videoId = currentVideo?.id?.videoId ?? currentVideo?.id

  // ─── Load video data ────────────────────────────────────────────
  const loadVideoData = useCallback(async (vid) => {
    const videoId = vid?.id?.videoId ?? vid?.id
    if (!videoId) return

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YT_KEY}`
      ).then(r => r.json())
      const detail = res?.items?.[0]
      setVideoDetail(detail)
      if (detail) setCurrentVideo(v => ({
        ...v,
        snippet: detail.snippet,
        statistics: detail.statistics,
        contentDetails: detail.contentDetails,
      }))
    } catch {}

    setLoadingRelated(true)
    try {
      const titleWords = (vid.snippet?.title ?? '').split(' ').slice(0, 4).join(' ')
      const res = await youtubeService.search(titleWords, 8)
      setRelated((res?.items ?? []).filter(v => (v.id?.videoId ?? v.id) !== videoId))
    } catch { setRelated([]) }
    finally { setLoadingRelated(false) }

    setLoadingComments(true)
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YT_KEY}`
      ).then(r => r.json())
      setComments(res?.items ?? [])
    } catch { setComments([]) }
    finally { setLoadingComments(false) }

    // Check liked + subscribed nếu đã đăng nhập
    if (isYouTubeConnected()) {
      try {
        const ratingRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos/getRating?id=${videoId}`,
          { headers: { Authorization: `Bearer ${youtubeToken}` } }
        ).then(r => r.json())
        setLiked(ratingRes?.items?.[0]?.rating === 'like')
      } catch {}

      // Check subscription
      if (vid.snippet?.channelId) {
        try {
          const subRes = await fetch(
            `https://www.googleapis.com/youtube/v3/subscriptions?part=id&mine=true&forChannelId=${vid.snippet.channelId}&maxResults=1`,
            { headers: { Authorization: `Bearer ${youtubeToken}` } }
          ).then(r => r.json())
          const subItem = subRes?.items?.[0]
          subscriptionIdRef.current = subItem?.id ?? null
          setSubscribed(!!subItem)
        } catch {}
      }
    }
  }, [youtubeToken, isYouTubeConnected])

  useEffect(() => {
    if (!video) return
    setCurrentVideo(video)
    setVideoDetail(null)
    setComments([])
    setRelated([])
    setView('player')
    setAudioOnly(false)
    setShowDesc(false)
    setLiked(false)
    setSaved(checkIsSaved(video))
    setSubscribed(false)
    subscriptionIdRef.current = null
    setCurrentTrack(video, 'youtube')
    setIsPlaying(true)
    saveToHistory(video)
    loadVideoData(video)
  }, [video])

  const playVideo = useCallback((v) => {
    setCurrentVideo(v)
    setVideoDetail(null)
    setComments([])
    setRelated([])
    setView('player')
    setAudioOnly(false)
    setShowDesc(false)
    setLiked(false)
    setSaved(checkIsSaved(v))
    setSubscribed(false)
    subscriptionIdRef.current = null
    setCurrentTrack(v, 'youtube')
    setIsPlaying(true)
    saveToHistory(v)
    loadVideoData(v)
  }, [loadVideoData])

  const openChannel = useCallback(async (channelId) => {
    if (!channelId) return
    setView('channel')
    setLoadingChannel(true)
    try {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=20&order=date&type=video&key=${YT_KEY}`
      ).then(r => r.json())
      setChannelVideos(r?.items?.map(v => ({ id: v.id?.videoId, snippet: v.snippet })) ?? [])
    } catch { setChannelVideos([]) }
    finally { setLoadingChannel(false) }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ─── Auth guard helper ─────────────────────────────────────────
  const requireAuth = useCallback((action) => {
    if (!isAuthed) {
      showToast({
        message: 'Bạn cần đăng nhập Google để thực hiện thao tác này',
        type: 'info',
        duration: 4000,
        action: {
          label: 'Đăng nhập',
          fn: () => youtubeAuth.startLogin(),
        },
      })
      return false
    }
    return true
  }, [isAuthed, showToast])

  // ─── Like ──────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!requireAuth()) return
    if (liking) return
    setLiking(true)
    const newRating = liked ? 'none' : 'like'
    try {
      await youtubeService.rateVideo(videoId, newRating)
      setLiked(!liked)
      showToast({
        message: liked ? 'Đã bỏ like video' : 'Đã like video ✓',
        type: 'success',
      })
    } catch {
      showToast({ message: 'Không thể thực hiện. Thử lại sau.', type: 'error' })
    } finally {
      setLiking(false)
    }
  }, [liked, liking, requireAuth, showToast])

  // ─── Share ─────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = `https://youtu.be/${videoId}`
    setCopying(true)
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: 'Đã copy link vào clipboard ✓', type: 'success' })
    } catch {
      showToast({ message: 'Không thể copy. Vui lòng copy thủ công.', type: 'error' })
    } finally {
      setTimeout(() => setCopying(false), 1500)
    }
  }, [videoId, showToast])

  // ─── Save (local Watch Later) ──────────────────────────────────
  const handleSave = useCallback(() => {
    if (!requireAuth()) return
    const nowSaved = toggleSavedLocal(currentVideo)
    setSaved(nowSaved)
    showToast({
      message: nowSaved ? 'Đã lưu vào Watch Later ✓' : 'Đã xoá khỏi Watch Later',
      type: nowSaved ? 'success' : 'info',
    })
  }, [currentVideo, requireAuth, showToast])

  // ─── Download ──────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const url = `https://cobalt.tools/#/https://youtu.be/${videoId}`
    window.open(url, '_blank', 'noopener')
    showToast({ message: 'Đang mở trình tải...', type: 'info', duration: 2000 })
  }, [videoId, showToast])

  // ─── Subscribe ─────────────────────────────────────────────────
  const handleSubscribe = useCallback(async () => {
    if (!requireAuth()) return
    if (subscribing) return
    const cId = currentVideo?.snippet?.channelId ?? videoDetail?.snippet?.channelId
    if (!cId) return
    setSubscribing(true)
    try {
      if (subscribed && subscriptionIdRef.current) {
        // Huỷ đăng ký: DELETE
        await fetch(
          `https://www.googleapis.com/youtube/v3/subscriptions?id=${subscriptionIdRef.current}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${youtubeToken}` } }
        )
        subscriptionIdRef.current = null
        setSubscribed(false)
        showToast({ message: 'Đã huỷ đăng ký kênh', type: 'info' })
      } else {
        // Đăng ký: POST
        const res = await fetch(
          'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${youtubeToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              snippet: { resourceId: { kind: 'youtube#channel', channelId: cId } }
            }),
          }
        ).then(r => r.json())
        subscriptionIdRef.current = res?.id ?? null
        setSubscribed(true)
        showToast({ message: 'Đã đăng ký kênh ✓', type: 'success' })
      }
    } catch {
      showToast({ message: 'Không thể thực hiện. Thử lại sau.', type: 'error' })
    } finally {
      setSubscribing(false)
    }
  }, [subscribed, subscribing, currentVideo, videoDetail, youtubeToken, requireAuth, showToast])

  // Nếu mở thẳng channel view (từ Subscriptions)
  useEffect(() => {
    if (!channel) return
    openChannel(channel.channelId)
  }, [channel])

  if (!video && !channel) return null

  // Khi mở channel trực tiếp: dùng channel title từ prop
  const _channelTitleOverride = channel?.channelTitle

  const snippet      = videoDetail?.snippet ?? currentVideo?.snippet ?? {}
  const stats        = videoDetail?.statistics ?? currentVideo?.statistics ?? {}
  const channelId    = snippet?.channelId
  const channelTitle = snippet?.channelTitle
  const description  = snippet?.description ?? ''
  const viewCount    = stats?.viewCount ? formatCount(Number(stats.viewCount)) : null
  const likeCount    = stats?.likeCount ? formatCount(Number(stats.likeCount)) : null
  const commentCount = stats?.commentCount ? formatCount(Number(stats.commentCount)) : null

  return (
    <div className="yt-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="yt-modal">

        {/* Toast stack */}
        <Toast toasts={toasts} />

        {/* Header */}
        <div className="yt-modal-header">
          {view === 'channel' && (
            <button className="yt-back-btn" onClick={() => channel ? onClose() : setView('player')}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <div className="yt-modal-title">
            {view === 'player' ? snippet.title : `${_channelTitleOverride ?? channelTitle} — Videos`}
          </div>
          {view === 'player' && (
            <button
              className={`yt-audio-btn ${audioOnly ? 'active' : ''}`}
              onClick={() => setAudioOnly(p => !p)}
              title={audioOnly ? 'Show video' : 'Audio only'}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 14 14">
                <path d="M2 5h2.5L7 3v8L4.5 9H2V5z" fill="currentColor"/>
                <path d="M9 4.5c1 .7 1.5 1.7 1.5 2.5S10 9 9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              <span>{audioOnly ? 'Show video' : 'Audio only'}</span>
            </button>
          )}
          <button className="yt-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="yt-modal-body">
          {view === 'player' ? (
            <>
              {/* Left: video + info + comments */}
              <div className="yt-modal-left">

                {/* IFrame / Audio banner */}
                {!audioOnly ? (
                  <div className="yt-iframe-wrap">
                    {videoId ? (
                      <iframe
                        key={videoId}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                      />
                    ) : <div className="yt-no-video">Video không khả dụng</div>}
                  </div>
                ) : (
                  <div className="yt-audio-banner">
                    <div className="yt-audio-art">
                      {youtubeService.getBestThumbnail(snippet?.thumbnails)
                        ? <img src={youtubeService.getBestThumbnail(snippet.thumbnails)} alt="" />
                        : <div className="yt-audio-placeholder" />
                      }
                      <div className="yt-audio-overlay">
                        <div className="yt-audio-icon">
                          <svg width="32" height="32" fill="none" viewBox="0 0 28 28">
                            <path d="M4 10h5L14 6v16l-5-4H4V10z" fill="currentColor"/>
                            <path d="M18 9c2 1.4 3 3.4 3 5s-1 3.6-3 5M21 6c3 2 4.5 5 4.5 8s-1.5 6-4.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="yt-audio-text">Đang phát audio</div>
                      </div>
                    </div>
                    <iframe
                      key={`audio-${videoId}`}
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                      allow="autoplay"
                      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                    />
                  </div>
                )}

                {/* ── Action buttons ── */}
                <div className="yt-action-buttons">

                  {/* Like */}
                  <button
                    className={`yt-action-btn ${liked ? 'yt-action-btn--active' : ''} ${liking ? 'yt-action-btn--loading' : ''}`}
                    onClick={handleLike}
                    title={liked ? 'Bỏ like' : 'Like video'}
                    disabled={liking}
                  >
                    <svg width="16" height="16" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 16 16">
                      <path d="M3 14V8L5 3l1 .6V7h5l-.6 5H3zM1 8h2v6H1V8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    <span>{liked ? 'Liked' : 'Like'}</span>
                  </button>

                  {/* Share — không cần auth */}
                  <button
                    className={`yt-action-btn ${copying ? 'yt-action-btn--active' : ''}`}
                    onClick={handleShare}
                    title="Copy link video"
                  >
                    {copying ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                        <path d="M2 8l4 4 8-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                        <path d="M10 2v3h3L7 11H4V8H1l6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                      </svg>
                    )}
                    <span>{copying ? 'Copied!' : 'Share'}</span>
                  </button>

                  {/* Save */}
                  <button
                    className={`yt-action-btn ${saved ? 'yt-action-btn--active' : ''}`}
                    onClick={handleSave}
                    title={saved ? 'Xoá khỏi Watch Later' : 'Lưu vào Watch Later'}
                  >
                    <svg width="16" height="16" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 16 16">
                      <path d="M2 2v12l6-4 6 4V2H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    <span>{saved ? 'Saved' : 'Save'}</span>
                  </button>

                  {/* Download — không cần auth */}
                  <button
                    className="yt-action-btn"
                    onClick={handleDownload}
                    title="Tải video về"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                      <path d="M8 1v8m4-4l-4 4-4-4M2 14h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Download</span>
                  </button>



                </div>

                {/* Video meta */}
                <div className="yt-video-meta-full">
                  <div className="yt-video-title-full">{snippet.title}</div>

                  {/* Kênh + nút Đăng ký */}
                  <div className="yt-stats-row">
                    <div className="yt-stats-left">
                      <button className="yt-channel-btn" onClick={() => openChannel(channelId)}>
                        <div className="yt-ch-mini-avatar">{channelTitle?.[0]}</div>
                        <span>{channelTitle}</span>
                        <svg width="10" height="10" fill="none" viewBox="0 0 10 10" style={{ marginLeft: 4 }}>
                          <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {snippet.publishedAt && (
                        <span className="yt-pub-date">{formatRelativeTime(snippet.publishedAt)}</span>
                      )}
                    </div>
                    {/* Nút Đăng ký */}
                    <button
                      className={`yt-subscribe-btn ${subscribed ? 'yt-subscribe-btn--active' : ''} ${subscribing ? 'yt-subscribe-btn--loading' : ''}`}
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      title={subscribed ? 'Huỷ đăng ký' : 'Đăng ký kênh'}
                    >
                      {subscribing ? (
                        <span className="yt-subscribe-spinner" />
                      ) : subscribed ? (
                        <>
                          <svg width="13" height="13" fill="none" viewBox="0 0 14 14">
                            <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Đã đăng ký</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" fill="none" viewBox="0 0 14 14">
                            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                          <span>Đăng ký</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  {description && (
                    <div className="yt-desc-box">
                      <div className={`yt-desc-text ${showDesc ? 'expanded' : ''}`}>
                        {description.split('\n').slice(0, showDesc ? 999 : 3).map((line, i) => (
                          <span key={i}>{line}<br /></span>
                        ))}
                      </div>
                      {description.split('\n').length > 3 && (
                        <button className="yt-desc-toggle" onClick={() => setShowDesc(p => !p)}>
                          {showDesc ? '...thu gọn' : '...thêm'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="yt-comments-section">
                  <div className="yt-comments-header">
                    <span className="yt-comments-count">
                      {commentCount ? `${commentCount} bình luận` : 'Bình luận'}
                    </span>
                    <select className="yt-sort-select">
                      <option>Sắp xếp theo</option>
                      <option>Phổ biến nhất</option>
                      <option>Mới nhất</option>
                    </select>
                  </div>

                  {loadingComments ? (
                    <div className="yt-comments-loading">
                      {Array(3).fill(0).map((_, i) => <CommentSkeleton key={i} />)}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="yt-no-comments">Không có bình luận hoặc bình luận bị tắt</div>
                  ) : (
                    <div className="yt-comments-list">
                      {comments.map((item, i) => (
                        <CommentItem key={item.id ?? i} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: related */}
              <div className="yt-modal-info">
                <div className="yt-related-label">
                  Gợi ý liên quan
                  {loadingRelated && <span className="yt-loading-dot"> ...</span>}
                </div>
                {loadingRelated
                  ? Array(5).fill(0).map((_, i) => <RelatedSkeleton key={i} />)
                  : related.map((v, i) => (
                    <RelatedItem key={v.id?.videoId ?? i} video={v} onClick={() => playVideo(v)} />
                  ))
                }
              </div>
            </>
          ) : (
            /* Channel view */
            <div className="yt-channel-view">
              <div className="yt-channel-header">
                <div className="yt-channel-avatar">{(_channelTitleOverride ?? channelTitle)?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="yt-channel-name">{_channelTitleOverride ?? channelTitle}</div>
                  <div className="yt-channel-sub">Tất cả video</div>
                </div>
              </div>
              {loadingChannel ? (
                <div className="yt-loading">Đang tải video...</div>
              ) : (
                <div className="yt-channel-grid">
                  {channelVideos.map((v, i) => (
                    <ChannelVideoCard key={v.id ?? i} video={v} onClick={() => playVideo(v)} />
                  ))}
                  {!loadingChannel && channelVideos.length === 0 && (
                    <div className="yt-empty">Không tìm thấy video</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function CommentItem({ item }) {
  const c      = item.snippet?.topLevelComment?.snippet ?? {}
  const avatar = c.authorProfileImageUrl
  const name   = c.authorDisplayName
  const text   = c.textDisplay
  const likes  = c.likeCount
  const date   = c.publishedAt

  return (
    <div className="yt-comment">
      <div className="yt-comment-avatar">
        {avatar ? <img src={avatar} alt={name} /> : <span>{name?.[0]}</span>}
      </div>
      <div className="yt-comment-body">
        <div className="yt-comment-header">
          <span className="yt-comment-name">{name}</span>
          <span className="yt-comment-date">{formatRelativeTime(date)}</span>
        </div>
        <div className="yt-comment-text"
          dangerouslySetInnerHTML={{ __html: text?.replace(/\n/g, '<br/>') }}
        />
        {likes > 0 && (
          <div className="yt-comment-likes">
            <svg width="11" height="11" fill="none" viewBox="0 0 12 12">
              <path d="M4 11V6L6 1l1 .5V5h4l-.5 4H4zM1 6h3v5H1V6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            </svg>
            {formatCount(likes)}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentSkeleton() {
  return (
    <div className="yt-comment">
      <div className="skeleton-block" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
      <div className="yt-comment-body" style={{ flex: 1 }}>
        <div className="skeleton-line w-40" style={{ marginBottom: 6 }} />
        <div className="skeleton-line w-80" />
        <div className="skeleton-line w-60" />
      </div>
    </div>
  )
}

function RelatedItem({ video, onClick }) {
  const snippet = video.snippet ?? {}
  const thumb   = youtubeService.getBestThumbnail(snippet.thumbnails)
  return (
    <div className="yt-related-item" onClick={onClick}>
      <div className="yt-related-thumb">
        {thumb
          ? <img src={thumb} alt={snippet.title} loading="lazy" />
          : <div className="yt-thumb-placeholder" />
        }
        <div className="yt-related-play"><div className="yt-related-play-ico" /></div>
      </div>
      <div className="yt-related-info">
        <div className="yt-related-title">{snippet.title}</div>
        <div className="yt-related-ch">{snippet.channelTitle}</div>
        {snippet.publishedAt && (
          <div className="yt-related-date">{formatRelativeTime(snippet.publishedAt)}</div>
        )}
      </div>
    </div>
  )
}

function RelatedSkeleton() {
  return (
    <div className="yt-related-item">
      <div className="yt-related-thumb skeleton-block" />
      <div className="yt-related-info">
        <div className="skeleton-line w-90" />
        <div className="skeleton-line w-60" />
      </div>
    </div>
  )
}

function ChannelVideoCard({ video, onClick }) {
  const snippet = video.snippet ?? {}
  const thumb   = youtubeService.getBestThumbnail(snippet.thumbnails)
  return (
    <div className="yt-ch-card" onClick={onClick}>
      <div className="yt-ch-thumb">
        {thumb ? <img src={thumb} alt={snippet.title} loading="lazy" /> : <div className="yt-thumb-placeholder" />}
        <div className="yt-ch-play"><div className="yt-ch-play-ico" /></div>
      </div>
      <div className="yt-ch-title">{snippet.title}</div>
      <div className="yt-ch-date">{formatRelativeTime(snippet.publishedAt)}</div>
    </div>
  )
}