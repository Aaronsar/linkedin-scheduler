import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishTextPost } from '@/lib/linkedin/api'

// This endpoint is called by pg_cron via pg_net to publish scheduled posts
export async function POST(request: NextRequest) {
  // Verify authorization (service role key or custom secret)
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!expectedToken || !authHeader?.includes(expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Fetch pending posts due for publication
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('*, linkedin_accounts(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10)

  if (fetchError || !posts || posts.length === 0) {
    return NextResponse.json({ message: 'No posts to publish', error: fetchError })
  }

  // Mark as publishing
  const postIds = posts.map((p) => p.id)
  await supabase.from('posts').update({ status: 'publishing' }).in('id', postIds)

  const results = []

  for (const post of posts) {
    try {
      const account = post.linkedin_accounts
      if (!account) throw new Error('Compte LinkedIn introuvable')

      // Check token expiry
      if (new Date(account.token_expires_at) < new Date()) {
        throw new Error('Token expire - veuillez reconnecter votre compte LinkedIn')
      }

      // Use organization URN for pages, person URN for personal accounts
      const authorUrn = account.account_type === 'page' && account.organization_urn
        ? account.organization_urn
        : account.linkedin_person_urn

      const result = await publishTextPost(
        account.access_token,
        authorUrn,
        post.content,
        post.visibility
      )

      if (result.success) {
        await supabase
          .from('posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            linkedin_post_urn: result.postUrn || null,
          })
          .eq('id', post.id)
        results.push({ postId: post.id, status: 'published' })
      } else {
        throw new Error(JSON.stringify(result.error))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      await supabase
        .from('posts')
        .update({
          status: 'failed',
          error_message: message,
          retry_count: (post.retry_count || 0) + 1,
        })
        .eq('id', post.id)
      results.push({ postId: post.id, status: 'failed', error: message })
    }
  }

  return NextResponse.json({ results })
}
