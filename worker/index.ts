/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher
  /**
   * Privileged Firebase service account JSON — stored ONLY in Cloudflare Worker Secrets
   * (`wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON`) or `.dev.vars` locally.
   * NEVER expose this in any `VITE_*` variable or frontend bundle.
   */
  FIREBASE_SERVICE_ACCOUNT_JSON?: string
  FIREBASE_PROJECT_ID?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      })
    }

    // All non-API routes fall through to Cloudflare Static Assets (SPA mode)
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
