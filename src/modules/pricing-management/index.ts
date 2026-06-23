import { registerModule } from '@/core/registry/moduleRegistry';
import { CouponsPage } from '@/core/components/crud';
import CitiesPage from './presentation/CitiesPage';

registerModule({ id: 'pricing-coupons', path: 'coupons', label: 'Coupons', group: 'Revenue', order: 90, Component: CouponsPage });
registerModule({ id: 'pricing-cities', path: 'cities', label: 'Cities & Surge', group: 'Revenue', order: 100, Component: CitiesPage });
