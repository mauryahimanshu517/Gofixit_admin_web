/**
 * Local reconstruction of the shared `@stitchkart/ui-kit-web` package.
 *
 * This app was extracted from a monorepo where these factories lived in
 * `packages/ui-kit-web`. That package wasn't copied along, so the three exports
 * the app depends on (`createApiClient`, `createAuthStore`, `ServiceType`) are
 * reconstructed here from how they are used across the codebase.
 */
export { createApiClient } from './api-client';
export { createAuthStore } from './auth-store';
export type { ServiceType } from './types';
export type { ApiClient } from './api-client';
