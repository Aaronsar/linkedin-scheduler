import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Clock, CheckCircle, XCircle, FileText, RefreshCw, Trash2, Edit } from 'lucide-react'
import { revalidatePath } from 'next/cache'

async function retryPost(formData: FormData) {
  'use server'
  const postId = formData.get('postId') as string
  const supabase = await createClient()
  await supabase
    .from('posts')
    .update({ status: 'pending', scheduled_at: new Date().toISOString(), error_message: null })
    .eq('id', postId)
  revalidatePath('/dashboard/posts')
}

async function deletePost(formData: FormData) {
  'use server'
  const postId = formData.get('postId') as string
  const supabase = await createClient()
  await supabase.from('posts').delete().eq('id', postId)
  revalidatePath('/dashboard/posts')
}

const statusConfig = {
  draft: { label: 'Brouillon', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
  pending: { label: 'Planifie', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  publishing: { label: 'Publication...', icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100' },
  published: { label: 'Publie', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { label: 'Echec', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
}

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('*, linkedin_accounts(linkedin_name, linkedin_picture_url)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Publications</h1>
        <Link
          href="/dashboard/nouveau"
          className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#004182] transition-colors"
        >
          Nouveau post
        </Link>
      </div>

      {posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => {
            const status = statusConfig[post.status as keyof typeof statusConfig]
            const Icon = status.icon
            return (
              <div key={post.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{post.linkedin_accounts?.linkedin_name || 'Compte'}</span>
                      {post.scheduled_at && (
                        <>
                          <span>&middot;</span>
                          <span>
                            {new Date(post.scheduled_at).toLocaleString('fr-FR')}
                          </span>
                        </>
                      )}
                    </div>
                    {post.error_message && (
                      <p className="text-xs text-red-600 mt-1">{post.error_message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>

                    {post.status === 'failed' && (
                      <form action={retryPost}>
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                          title="Reessayer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    {(post.status === 'draft' || post.status === 'failed') && (
                      <Link
                        href={`/dashboard/posts/${post.id}`}
                        className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}

                    <form action={deletePost}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-500">Aucune publication pour le moment.</p>
          <Link
            href="/dashboard/nouveau"
            className="inline-flex items-center gap-2 mt-4 text-[#0a66c2] font-medium hover:underline"
          >
            Creer votre premier post
          </Link>
        </div>
      )}
    </div>
  )
}
