import type { Config } from '@netlify/functions'
import { buildSessionCookie, createSessionToken, getConfiguredLogin, jsonHeaders } from './_auth.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: jsonHeaders(),
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const username = typeof body?.username === 'string' ? body.username.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const { loginUser, loginPassword } = getConfiguredLogin()

    if (username !== loginUser || password !== loginPassword) {
      return new Response(JSON.stringify({ error: 'Invalid username or password.' }), {
        status: 401,
        headers: jsonHeaders(),
      })
    }

    const token = await createSessionToken()
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...jsonHeaders(),
        'set-cookie': buildSessionCookie(token),
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to complete login.',
      }),
      {
        status: 500,
        headers: jsonHeaders(),
      },
    )
  }
}

export const config: Config = {
  path: '/api/login',
}
