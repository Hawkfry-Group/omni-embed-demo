/*
 * Replace these placeholder IDs with your own Omni instance values.
 *
 * Where to find them:
 *   - Dashboard / Workbook ID: the short code in the URL when viewing content in Omni
 *     e.g. https://acme.omniapp.co/dashboards/abcd1234 → contentId is "abcd1234"
 *   - Connection ID: Admin > Connections in your Omni instance (the UUID shown for each connection)
 */

// ── Content IDs ──────────────────────────────────────────────────────
/** A dashboard to embed (short GUID from the dashboard URL). */
export const DASHBOARD_ID = 'your-dashboard-id';

/** A workbook to embed (short GUID from the workbook URL). */
export const WORKBOOK_ID = 'your-workbook-id';

/** A dashboard to show with a custom theme applied. Can be the same as DASHBOARD_ID. */
export const CUSTOM_THEME_DASHBOARD_ID = 'your-dashboard-id';

// ── Connection ───────────────────────────────────────────────────────
/** The UUID of the database connection to assign roles against. */
export const CONNECTION_ID = 'your-connection-id';
