import { registerModule } from '@/core/registry/moduleRegistry';
import ReportsPage from './presentation/ReportsPage';

registerModule({ id: 'reports', path: 'reports', label: 'Reports', group: 'Overview', order: 20, Component: ReportsPage });
