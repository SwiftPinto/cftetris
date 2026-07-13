// POST /api/auth — validates password and sets a persistent cookie

interface Env {
  SITE_PASSWORD: string;
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

  // 10-year cookie — effectively permanent
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `cf_tetris_auth=1; Path=/; Secure; SameSite=Lax; Max-Age=315360000`,
    },
  });
}
