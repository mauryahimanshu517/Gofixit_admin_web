import { registerModule } from '@/core/registry/moduleRegistry';
import UsersPage from './presentation/UsersPage';

registerModule({ id: 'user-management', path: 'users', label: 'Customers', group: 'People', order: 140, Component: UsersPage });
