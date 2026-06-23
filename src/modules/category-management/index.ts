import { registerModule } from '@/core/registry/moduleRegistry';
import { CategoriesPage } from '@/core/components/crud';

registerModule({ id: 'category-management', path: 'categories', label: 'Categories', group: 'Catalog', order: 50, Component: CategoriesPage });
