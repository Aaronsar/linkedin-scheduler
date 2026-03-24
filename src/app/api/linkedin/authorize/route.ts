import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAuthUrl } from '@/lib/linkedin/oauth'
import { randomBytes } from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/connexion', process.env.NEXT_PUBLIC_APP_URL!))
  }

  // Generate CSRF state token
  const csrfToken = randomBytes(32).toString('hex')
  const state = Buffer.from(JSON.stringify({
    csrf: csrfToken,
    userId: user.id,
  })).toString('base64url')

  const authUrl = generateAuthUrl(state)

  // Set CSRF cookie
  const response = NextResponse.redirect(authUrl)
  response.cookies.set('linkedin_oauth_state', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
