import type { Config } from '@netlify/functions'
import { requireAuthorization } from './_auth.mts'

const TABLE_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const SELECT_RE = /^[A-Za-z0-9_,*()\s]+$/
const ALLOWED_TABLES = new Set(['users', 'posts', 'comments'])

export default async (req: Request) => {
  const authError = await requireAuthorization(req)
  if (authError) {
    return authError
  }

  const url = new URL(req.url)
  const table = url.searchParams.get('table')
  const select = url.searchParams.get('select') ?? '*'
  const limit = url.searchParams.get('limit') ?? '50'

  if (!table || !TABLE_NAME_RE.test(table)) {
    return Response.json(
      { error: 'Missing or invalid "table" query parameter.' },
      { status: 400 },
    )
  }
  if (!ALLOWED_TABLES.has(table)) {
    return Response.json(
      { error: 'The requested table is not allowed.' },
      { status: 403 },
    )
  }
  if (!SELECT_RE.test(select)) {
    return Response.json({ error: 'Invalid "select" parameter.' }, { status: 400 })
  }
  if (!/^\d+$/.test(limit) || Number(limit) > 500) {
    return Response.json({ error: 'Invalid "limit" parameter.' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: 'Server missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.' },
      { status: 500 },
    )
  }

  const target = new URL(`/rest/v1/${table}`, supabaseUrl)
  target.searchParams.set('select', select)
  target.searchParams.set('limit', limit)

  const upstream = await fetch(target, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/json',
    },
  })

  const body = await upstream.text()
  return new Response(body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}

export const config: Config = {
  path: '/api/supabase',
}
