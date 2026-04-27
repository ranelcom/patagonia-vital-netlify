import type { Config } from '@netlify/functions'
import { clearSessionCookie, jsonHeaders } from './_auth.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: jsonHeaders(),
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      ...jsonHeaders(),
      'set-cookie': clearSessionCookie(),
    },
  })
}

export const config: Config = {
  path: '/api/logout',
}
