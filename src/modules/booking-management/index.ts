import { registerModule } from '@/core/registry/moduleRegistry';
import BookingsPage from './presentation/BookingsPage';

registerModule({ id: 'booking-management', path: 'bookings', label: 'Bookings', group: 'Marketplace', order: 80, Component: BookingsPage });
