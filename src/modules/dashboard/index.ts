import { registerModule } from '@/core/registry/moduleRegistry';
import DashboardPage from './presentation/DashboardPage';

registerModule({ id: 'dashboard', path: 'dashboard', label: 'Dashboard', group: 'Overview', order: 10, Component: DashboardPage });
