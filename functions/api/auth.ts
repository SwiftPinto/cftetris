// POST /api/auth — validates password and sets signed cookie

interface Env {
  SITE_PASSWORD: string;
  COOKIE_SECRET: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body.password || body.password !== env.SITE_PASSWORD) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create signed token: base64(expiry:hmacSignature)
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.COOKIE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const data = encoder.encode(`${expiry}:${env.SITE_PASSWORD}`);
  const sigBytes = await crypto.subtle.sign('HMAC', key, data);
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  const token = btoa(`${expiry}:${sig}`);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `cf_tetris_auth=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Lax; Max-Age=86400`,
    },
  });
}
