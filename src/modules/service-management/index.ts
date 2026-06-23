import { registerModule } from '@/core/registry/moduleRegistry';
import ServiceTypesPage from './presentation/ServiceTypesPage';

registerModule({ id: 'service-management', path: 'service-types', label: 'Service Types', group: 'Catalog', order: 40, Component: ServiceTypesPage });
