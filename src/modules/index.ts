/**
 * Module barrel — importing this registers every admin module into the registry (side effects).
 * To add a new admin section: create modules/<feature>/index.ts that calls registerModule, then
 * add one import line here. Nothing else (layout, router, nav) needs to change.
 */
import './dashboard';
import './reports';
import './service-management';
import './homepage-management';
import './category-management';
import './vendor-management';
import './worker-management';
import './booking-management';
import './pricing-management';
import './payout-management';
import './subscription-management';
import './content-management';
import './user-management';
