import { createApiClient } from '@stitchkart/ui-kit-web';

/**
 * Admin HTTP client — now built from the shared factory (@stitchkart/ui-kit-web), replacing the
 * hand-rolled axios setup that was duplicated byte-for-byte across admin-web and tailor-web.
 */
export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://api.gofixit.in/api/v1',
  getToken: () => localStorage.getItem('admin_token'),
  onUnauthorized: () => localStorage.removeItem('admin_token'),
});
