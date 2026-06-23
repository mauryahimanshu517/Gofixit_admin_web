import { create } from 'zustand';
import type { ApiClient } from './api-client';

export interface AuthUser {
  _id?: string;
  name?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}

export interface CreateAuthStoreOptions {
  /** The shared API client (from createApiClient). */
  client: ApiClient;
  /** localStorage key the token is persisted under. */
  tokenKey: string;
  /** Roles permitted to sign in to this app; others are rejected. */
  allowedRoles: string[];
  /**
   * When true, `login` requests an OTP for the phone before verifying it.
   * (Dev backends accept a fixed OTP, so a single login(phone, code) call
   * performs request-then-verify in sequence.)
   */
  requestOtpFirst?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** Restore the session from a persisted token on app start. */
  hydrate: () => Promise<void>;
  /** Request an OTP (if configured) and verify it, then store the session. */
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

// ── Backend endpoints ───────────────────────────────────────────────────────
// CONFIRM THESE against the real api.gofixit.in/api/v1 backend. They follow the
// app-wide convention where the payload is at `res.data.data`.
const ENDPOINTS = {
  requestOtp: '/auth/request-otp', // POST { phone }
  verifyOtp: '/auth/verify-otp', //   POST { phone, otp } -> { data: { token, user } }
  me: '/auth/me', //                  GET  -> { data: <user> }
};

export function createAuthStore(opts: CreateAuthStoreOptions) {
  const { client, tokenKey, allowedRoles, requestOtpFirst } = opts;

  const assertAllowed = (user: AuthUser | null) => {
    if (!user) throw new Error('Login failed: no user returned');
    if (allowedRoles.length && user.role && !allowedRoles.includes(user.role)) {
      throw new Error('This account is not allowed to access the admin panel');
    }
    return user;
  };

  return create<AuthState>((set) => ({
    user: null,
    loading: true,

    hydrate: async () => {
      const token = localStorage.getItem(tokenKey);
      if (!token) {
        set({ user: null, loading: false });
        return;
      }
      try {
        const res = await client.get(ENDPOINTS.me);
        const user = (res.data?.data ?? res.data) as AuthUser;
        set({ user: assertAllowed(user), loading: false });
      } catch {
        localStorage.removeItem(tokenKey);
        set({ user: null, loading: false });
      }
    },

    login: async (phone: string, code: string) => {
      if (requestOtpFirst) {
        await client.post(ENDPOINTS.requestOtp, { phone });
      }
      const res = await client.post(ENDPOINTS.verifyOtp, { phone, otp: code });
      const payload = (res.data?.data ?? res.data) as { token: string; user: AuthUser };
      const user = assertAllowed(payload.user);
      localStorage.setItem(tokenKey, payload.token);
      set({ user, loading: false });
    },

    logout: () => {
      localStorage.removeItem(tokenKey);
      set({ user: null });
    },
  }));
}
