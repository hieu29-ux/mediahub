import { spotifyHttp } from './http'

export const spotifyService = {
  // ─── User ────────────────────────────────────────────────────
  getMe: () =>
    spotifyHttp.get('me'),

  // ─── Top items ───────────────────────────────────────────────
  getTopTracks: (limit = 20, timeRange = 'long_term') =>
    spotifyHttp.get('me/top/tracks', { limit, time_range: timeRange }),

  getTopArtists: (limit = 20, timeRange = 'long_term') =>
    spotifyHttp.get('me/top/artists', { limit, time_range: timeRange }),

  // ─── Library ─────────────────────────────────────────────────
  getPlaylists: (limit = 50, offset = 0) =>
    spotifyHttp.get('me/playlists', { limit, offset }),

  getPlaylistTracks: (playlistId, limit = 50, offset = 0) =>
    spotifyHttp.get(`playlists/${playlistId}/tracks`, { limit, offset }),

  getLikedTracks: (limit = 50, offset = 0) =>
    spotifyHttp.get('me/tracks', { limit, offset }),

  getSavedAlbums: (limit = 20, offset = 0) =>
    spotifyHttp.get('me/albums', { limit, offset }),

  // ─── Recently played ─────────────────────────────────────────
  getRecentlyPlayed: (limit = 20) =>
    spotifyHttp.get('me/player/recently-played', { limit }),

  // ─── Search ──────────────────────────────────────────────────
  search: (q, types = ['track', 'artist', 'album'], limit = 20) =>
    spotifyHttp.get('search', { q, type: types.join(','), limit }),

  // ─── Player state ─────────────────────────────────────────────
  getPlaybackState: () =>
    spotifyHttp.get('me/player'),

  getAvailableDevices: () =>
    spotifyHttp.get('me/player/devices'),

  // ─── Playback control (cần Premium) ──────────────────────────
  play: (deviceId, body = {}) =>
    spotifyHttp.put(`me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, body),

  pause: (deviceId) =>
    spotifyHttp.put(`me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`),

  next: (deviceId) =>
    spotifyHttp.post(`me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`),

  previous: (deviceId) =>
    spotifyHttp.post(`me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`),

  seek: (positionMs, deviceId) =>
    spotifyHttp.put(`me/player/seek?position_ms=${positionMs}${deviceId ? `&device_id=${deviceId}` : ''}`),

  setVolume: (volumePercent, deviceId) =>
    spotifyHttp.put(`me/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`),

  setShuffle: (state, deviceId) =>
    spotifyHttp.put(`me/player/shuffle?state=${state}${deviceId ? `&device_id=${deviceId}` : ''}`),

  setRepeat: (state, deviceId) =>
    spotifyHttp.put(`me/player/repeat?state=${state}${deviceId ? `&device_id=${deviceId}` : ''}`),

  transferPlayback: (deviceId, play = false) =>
    spotifyHttp.put('me/player', { device_ids: [deviceId], play }),

  // ─── Like / Save ──────────────────────────────────────────────
  saveTrack: (id)   => spotifyHttp.put(`me/tracks?ids=${id}`),
  unsaveTrack: (id) => spotifyHttp.delete(`me/tracks?ids=${id}`),
  checkSaved: (ids) => spotifyHttp.get('me/tracks/contains', { ids: ids.join(',') }),

  // ─── Artist / Album / Track detail ───────────────────────────
  getTrack:  (id) => spotifyHttp.get(`tracks/${id}`),
  getAlbum:  (id) => spotifyHttp.get(`albums/${id}`),
  getArtist: (id) => spotifyHttp.get(`artists/${id}`),
  getArtistTopTracks: (id, market = 'US') =>
    spotifyHttp.get(`artists/${id}/top-tracks`, { market }),
}
