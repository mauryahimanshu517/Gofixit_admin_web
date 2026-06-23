import { registerModule } from '@/core/registry/moduleRegistry';
import HomepagePage from './presentation/HomepagePage';

registerModule({ id: 'homepage-management', path: 'homepage', label: 'Homepage Layout', group: 'Catalog', order: 45, Component: HomepagePage });
