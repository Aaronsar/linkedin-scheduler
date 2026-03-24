import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, fetchLinkedInProfile } from '@/lib/linkedin/oauth'
import { fetchAdministeredOrganizations } from '@/lib/linkedin/organizations'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/comptes?error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/comptes?error=missing_params`
    )
  }

  // Validate CSRF state
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const storedCsrf = request.cookies.get('linkedin_oauth_state')?.value

    if (!storedCsrf || storedCsrf !== stateData.csrf) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/comptes?error=invalid_state`
      )
    }

    // Verify user is still authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${appUrl}/connexion`)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Fetch LinkedIn profile
    const profile = await fetchLinkedInProfile(tokens.access_token)
    const personUrn = `urn:li:person:${profile.sub}`

    // Calculate token expiry
    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString()

    // Upsert personal LinkedIn account
    const { error: upsertError } = await supabase
      .from('linkedin_accounts')
      .upsert(
        {
          user_id: user.id,
          linkedin_person_urn: personUrn,
          linkedin_name: profile.name,
          linkedin_email: profile.email,
          linkedin_picture_url: profile.picture,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          scopes: tokens.scope,
          is_active: true,
          account_type: 'personal',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,linkedin_person_urn',
        }
      )

    if (upsertError) {
      console.error('Error upserting LinkedIn account:', upsertError)
      return NextResponse.redirect(
        `${appUrl}/dashboard/comptes?error=db_error`
      )
    }

    // Try to fetch administered Pages (requires Community Management API)
    const organizations = await fetchAdministeredOrganizations(tokens.access_token)
    for (const org of organizations) {
      const orgUrn = `urn:li:organization:${org.id}`
      await supabase.from('linkedin_accounts').upsert(
        {
          user_id: user.id,
          linkedin_person_urn: personUrn,
          linkedin_name: `📄 ${org.localizedName}`,
          linkedin_email: profile.email,
          linkedin_picture_url: org.logoUrl || profile.picture,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          scopes: tokens.scope,
          is_active: true,
          account_type: 'page',
          organization_urn: orgUrn,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,linkedin_person_urn',
        }
      )
    }

    // Clear CSRF cookie and redirect to accounts page
    const response = NextResponse.redirect(
      `${appUrl}/dashboard/comptes?success=connected`
    )
    response.cookies.delete('linkedin_oauth_state')
    return response
  } catch (err) {
    console.error('LinkedIn callback error:', err)
    return NextResponse.redirect(
      `${appUrl}/dashboard/comptes?error=callback_failed`
    )
  }
}
