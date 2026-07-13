// POST /api/auth — validates password and sets a persistent cookie
// GET  /api/auth — checks if the current cookie is valid

interface Env {
  SITE_PASSWORD: string;
  COOKIE_SECRET: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'GET') {
    // Verify the auth cookie
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/(?:^|;\s*)cf_tetris_auth=([^;]*)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    const valid = token === env.COOKIE_SECRET;
    return new Response(JSON.stringify({ authenticated: valid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  // Set cookie with secret as value — client verifies against GET /api/auth
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `cf_tetris_auth=${env.COOKIE_SECRET}; Path=/; Secure; SameSite=Lax; Max-Age=315360000`,
    },
  });
}
