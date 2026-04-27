import type { Config } from '@netlify/functions'
import { isAuthorized, jsonHeaders } from './_auth.mts'

export default async (req: Request) => {
  try {
    const authenticated = await isAuthorized(req)
    return new Response(JSON.stringify({ authenticated }), {
      status: 200,
      headers: jsonHeaders(),
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication is not configured.',
      }),
      {
        status: 500,
        headers: jsonHeaders(),
      },
    )
  }
}

export const config: Config = {
  path: '/api/auth-status',
}
