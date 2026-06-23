import { registerModule } from '@/core/registry/moduleRegistry';
import PayoutsPage from './presentation/PayoutsPage';

registerModule({ id: 'payout-management', path: 'payouts', label: 'Payouts', group: 'Revenue', order: 110, Component: PayoutsPage });
