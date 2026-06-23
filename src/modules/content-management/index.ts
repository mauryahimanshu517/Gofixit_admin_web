import { registerModule } from '@/core/registry/moduleRegistry';
import { BannersPage } from '@/core/components/crud';

registerModule({ id: 'content-management', path: 'banners', label: 'Banners', group: 'Content', order: 130, Component: BannersPage });
