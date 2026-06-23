import { registerModule } from '@/core/registry/moduleRegistry';
import GenericVendorsPage from './presentation/GenericVendorsPage';

/**
 * Unified vendor moderation. The backend /admin/vendors endpoint unions generic Vendors
 * with legacy Tailors (mapped through the shared vendor projection), so this single page
 * surfaces both. The old "Tailors" sidebar entry has been removed.
 *
 * VendorsPage.tsx (legacy tailors-only view) and the /admin/tailors routes still exist for
 * backwards compatibility, but are no longer wired into the admin sidebar.
 */
registerModule({
  id: 'vendor-management',
  path: 'vendors',
  label: 'Vendors',
  group: 'Marketplace',
  order: 60,
  Component: GenericVendorsPage,
});
