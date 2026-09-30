/**
 * Simplified middleware for this World Monitor fork.
 *
 * The upstream middleware includes host-specific SEO, docs proxy, crawler,
 * MCP and production policies for worldmonitor.app. Those policies are not
 * required to serve this fork's dashboard and can fail when their production
 * dependencies/configuration are absent.
 *
 * Vercel rewrites /dashboard to /dashboard.html in vercel.json. API routes
 * are left untouched and continue to run as normal serverless functions.
 */
export default function middleware(_request: Request) {
  return;
}

export const config = {
  matcher: ['/dashboard'],
};
