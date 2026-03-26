import { tokenStorage } from "../utils/storage";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const YOUTUBE_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;
// YouTube Desktop OAuth dùng localhost, không phải custom protocol
const YOUTUBE_REDIRECT = "http://localhost:5175/callback/youtube";

// PKCE helpers
function generateVerifier(length = 128) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const arr = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

async function generateChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function saveVerifier(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

function getVerifier(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function removeVerifier(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

// Spotify OAuth (custom protocol)
export const spotifyAuth = {
  SCOPES: [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-read-recently-played",
    "user-library-read",
    "user-library-modify",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming",
  ].join(" "),

  async startLogin() {
    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);
    saveVerifier("sp_pkce_verifier", verifier);
    console.log("[Auth] Spotify verifier saved, length:", verifier.length);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope: this.SCOPES,
      redirect_uri: SPOTIFY_REDIRECT,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state: "spotify_" + Date.now(),
    });

    window.electronAPI?.openAuthUrl(
      `https://accounts.spotify.com/authorize?${params}`,
    );
  },

  async handleCallback(code) {
    const verifier = getVerifier("sp_pkce_verifier");
    console.log("[Auth] Spotify callback — verifier found:", !!verifier);
    if (!verifier)
      throw new Error("PKCE verifier not found — please try again");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Auth] Spotify token error:", err);
      throw new Error(
        `Spotify auth failed: ${err.error_description || res.status}`,
      );
    }

    const data = await res.json();
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    tokenStorage.setSpotify(tokens);
    removeVerifier("sp_pkce_verifier");

    const { useAuthStore } = await import("../store/authStore");
    useAuthStore.getState().setSpotifyAuth(tokens);

    console.log("[Auth] Spotify connected!");
    return tokens;
  },

  logout() {
    tokenStorage.clearSpotify();
    removeVerifier("sp_pkce_verifier");
    import("../store/authStore").then(({ useAuthStore }) => {
      useAuthStore.getState().clearSpotify();
    });
  },
};

// YouTube OAuth (localhost callback)
export const youtubeAuth = {
  SCOPES: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
  ].join(" "),

  async startLogin() {
    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);
    saveVerifier("yt_pkce_verifier", verifier);
    console.log("[Auth] YouTube verifier saved");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: YOUTUBE_CLIENT_ID,
      redirect_uri: YOUTUBE_REDIRECT,
      scope: this.SCOPES,
      code_challenge_method: "S256",
      code_challenge: challenge,
      access_type: "offline",
      prompt: "consent",
      state: "youtube_" + Date.now(),
    });

    window.electronAPI?.openAuthUrl(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    );
  },

  async handleCallback(code) {
    const verifier = getVerifier("yt_pkce_verifier");
    console.log("[Auth] YouTube callback — verifier found:", !!verifier);
    if (!verifier)
      throw new Error("PKCE verifier not found — please try again");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: YOUTUBE_REDIRECT,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_SECRET,
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Auth] YouTube token error:", err);
      throw new Error(
        `YouTube auth failed: ${err.error_description || res.status}`,
      );
    }

    const data = await res.json();
    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    tokenStorage.setYouTube(tokens);
    removeVerifier("yt_pkce_verifier");

    const { useAuthStore } = await import("../store/authStore");
    useAuthStore.getState().setYouTubeAuth(tokens);

    console.log("[Auth] YouTube connected!");
    return tokens;
  },

  logout() {
    tokenStorage.clearYouTube();
    removeVerifier("yt_pkce_verifier");
    import("../store/authStore").then(({ useAuthStore }) => {
      useAuthStore.getState().clearYouTube();
    });
  },
};
