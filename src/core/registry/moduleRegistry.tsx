import type { ComponentType } from 'react';

/**
 * Admin module registry (the "module registry system", req. #21). Each admin feature registers
 * a nav+route entry here; the layout and router are built from the registry. Adding a new admin
 * section = drop a folder under modules/<feature> that calls registerModule — no edits to the
 * layout, router, or nav. This is what makes the admin panel scalable to unlimited services.
 */
export interface AdminModule {
  id: string;
  /** Route path segment (no leading slash), e.g. 'service-types'. */
  path: string;
  /** Sidebar label. */
  label: string;
  /** Sidebar grouping heading. */
  group?: string;
  /** Sort order within the sidebar (lower first). */
  order?: number;
  Component: ComponentType;
}

const registry: AdminModule[] = [];

export function registerModule(m: AdminModule): void {
  if (!registry.some((x) => x.id === m.id)) registry.push(m);
}

export function getModules(): AdminModule[] {
  return [...registry].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
