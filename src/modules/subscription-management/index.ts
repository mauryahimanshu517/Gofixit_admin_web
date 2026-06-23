import { registerModule } from '@/core/registry/moduleRegistry';
import PlansPage from './presentation/PlansPage';

registerModule({ id: 'subscription-management', path: 'plans', label: 'Subscriptions', group: 'Revenue', order: 120, Component: PlansPage });
