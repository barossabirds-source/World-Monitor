export default async function handler(_req: Request): Promise<Response> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return new Response(JSON.stringify({
      ok: false,
      configured: false,
      message: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing in this deployment.'
    }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const key = 'world-monitor:diagnostic:vercel-upstash';
  const value = new Date().toISOString();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const write = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=300`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (!write.ok) {
      return new Response(JSON.stringify({
        ok: false,
        configured: true,
        stage: 'write',
        status: write.status,
        message: 'Vercel reached the configured Redis endpoint but the test write failed.'
      }), {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    const read = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const body = read.ok ? await read.json() as { result?: string | null } : null;
    const matches = body?.result === value;

    return new Response(JSON.stringify({
      ok: read.ok && matches,
      configured: true,
      writeStatus: write.status,
      readStatus: read.status,
      roundTripMatched: matches,
      message: read.ok && matches
        ? 'Vercel can read from and write to Upstash Redis.'
        : 'Vercel reached Upstash, but the read/write round trip did not match.'
    }), {
      status: read.ok && matches ? 200 : 502,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      configured: true,
      stage: 'network',
      message: error instanceof Error ? error.message : 'Unknown Redis connection error'
    }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
}
