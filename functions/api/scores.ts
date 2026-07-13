import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const { DB } = env;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const { results } = await DB.prepare(
      'SELECT id, name, score, level, lines, created_at FROM scores ORDER BY score DESC LIMIT ?'
    ).bind(limit).all();
    return Response.json(results, { headers });
  }

  if (request.method === 'POST') {
    const body: { name: string; score: number; level: number; lines: number } = await request.json();
    if (!body.name || typeof body.score !== 'number') {
      return Response.json({ error: 'Missing name or score' }, { status: 400, headers });
    }
    const name = body.name.trim().slice(0, 20);
    const score = body.score;
    const level = body.level || 1;
    const lines = body.lines || 0;
    await DB.prepare(
      'INSERT INTO scores (name, score, level, lines) VALUES (?, ?, ?, ?)'
    ).bind(name, score, level, lines).run();
    return Response.json({ success: true }, { headers });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
}
