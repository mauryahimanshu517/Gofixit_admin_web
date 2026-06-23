import { createAuthStore } from '@stitchkart/ui-kit-web';
import { api } from '@/core/api/client';

/**
 * Admin auth store — built from the shared factory. Admins are super_admin-class; legacy 'admin'
 * tokens are still accepted (canonical role mapping lives in the backend).
 */
export const useAuth = createAuthStore({
  client: api,
  tokenKey: 'admin_token',
  allowedRoles: ['admin', 'super_admin'],
  requestOtpFirst: true,
});
