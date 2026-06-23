import { Button } from './ui';

/** Page metadata returned by the API's paginateAggregate (in the response envelope's `meta`). */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/** Prev/Next page controls driven by the API `meta`. Renders nothing for a single page. */
export function Pagination({
  meta,
  page,
  onPage,
}: {
  meta?: PageMeta;
  page: number;
  onPage: (p: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <Button variant="outline" disabled={!meta.hasMore} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
