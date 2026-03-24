import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PenSquare, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [drafts, pending, published, failed] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ])

  const { data: upcomingPosts } = await supabase
    .from('posts')
    .select('*, linkedin_accounts(linkedin_name, linkedin_picture_url)')
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(5)

  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*, linkedin_accounts(linkedin_name, linkedin_picture_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Brouillons', count: drafts.count || 0, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Planifies', count: pending.count || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Publies', count: published.count || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Echecs', count: failed.count || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Link
          href="/dashboard/nouveau"
          className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#004182] transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          Nouveau post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Prochaines publications
          </h2>
          {upcomingPosts && upcomingPosts.length > 0 ? (
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{post.content.slice(0, 80)}...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.linkedin_accounts?.linkedin_name || 'Compte'} &middot;{' '}
                      {new Date(post.scheduled_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune publication planifiee</p>
          )}
        </div>

        {/* Recent */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Publications recentes
          </h2>
          {recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{post.content.slice(0, 80)}...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.linkedin_accounts?.linkedin_name || 'Compte'} &middot;{' '}
                      {new Date(post.published_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune publication pour le moment</p>
          )}
        </div>
      </div>
    </div>
  )
}
