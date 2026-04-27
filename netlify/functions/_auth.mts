const SESSION_COOKIE = 'pv_session'
const encoder = new TextEncoder()

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Server missing ${name} environment variable.`)
  }
  return value
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false
  }

  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

async function sha256(input: string) {
  const data = encoder.encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getCookie(req: Request, name: string) {
  const header = req.headers.get('cookie') ?? ''
  const cookies = header.split(';')

  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return null
}

export async function createSessionToken() {
  const loginUser = getRequiredEnv('LOGIN_USER')
  const loginPassword = getRequiredEnv('LOGIN_PASSWORD')
  return sha256(`${loginUser}:${loginPassword}`)
}

export async function isAuthorized(req: Request) {
  const expected = await createSessionToken()
  const actual = getCookie(req, SESSION_COOKIE)
  return actual ? timingSafeEqual(actual, expected) : false
}

export async function requireAuthorization(req: Request) {
  try {
    const authorized = await isAuthorized(req)
    if (authorized) {
      return null
    }

    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Authentication is not configured.' },
      { status: 500 },
    )
  }
}

export function jsonHeaders() {
  return { 'content-type': 'application/json' }
}

export function buildSessionCookie(token: string, maxAge = 60 * 60 * 8) {
  const secure = process.env.CONTEXT === 'dev' ? '' : '; Secure'
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export function clearSessionCookie() {
  const secure = process.env.CONTEXT === 'dev' ? '' : '; Secure'
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export function getConfiguredLogin() {
  return {
    loginUser: getRequiredEnv('LOGIN_USER'),
    loginPassword: getRequiredEnv('LOGIN_PASSWORD'),
  }
}
