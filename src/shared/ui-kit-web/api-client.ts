import axios, { type AxiosInstance } from 'axios';

export type ApiClient = AxiosInstance;

export interface CreateApiClientOptions {
  baseURL: string;
  /** Returns the bearer token to attach, or null when unauthenticated. */
  getToken: () => string | null;
  /** Called when the server responds 401, so callers can clear local state. */
  onUnauthorized?: () => void;
}

/**
 * Builds the shared axios instance used by every app: it attaches the bearer
 * token on each request and clears local auth on a 401 response.
 */
export function createApiClient(opts: CreateApiClientOptions): ApiClient {
  const client = axios.create({ baseURL: opts.baseURL });

  client.interceptors.request.use((config) => {
    const token = opts.getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.status === 401) opts.onUnauthorized?.();
      return Promise.reject(error);
    },
  );

  return client;
}
