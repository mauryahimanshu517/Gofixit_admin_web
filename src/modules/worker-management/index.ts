/**
 * The "Workers" sidebar entry was removed from the admin panel — staff is now managed
 * per-vendor from the tailor-web, not platform-wide from admin. WorkersPage.tsx and the
 * /workers API remain in place for the tailor-web Workers & Staff screen; only the
 * admin registration is gone.
 *
 * Re-add by importing WorkersPage and calling registerModule(...) if you ever want a
 * platform-wide read-only view in admin again.
 */
export {};
