'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Copy, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Template } from '@/lib/linkedin/types'

export default function ModelesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setTemplates(data)
  }

  async function handleCreate() {
    if (!name.trim() || !content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('templates').insert({
      user_id: user.id,
      name: name.trim(),
      content: content.trim(),
      category: category.trim() || null,
    })

    setName('')
    setContent('')
    setCategory('')
    setShowForm(false)
    setLoading(false)
    loadTemplates()
  }

  async function handleDelete(id: string) {
    await supabase.from('templates').delete().eq('id', id)
    loadTemplates()
  }

  function handleUse(template: Template) {
    // Store in sessionStorage and redirect to new post
    sessionStorage.setItem('template_content', template.content)
    router.push('/dashboard/nouveau')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modeles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#004182] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau modele
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du modele</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
              placeholder="Ex: Post engagement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorie (optionnel)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
              placeholder="Ex: Engagement, Promo, Story"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] resize-none"
              placeholder="Ecrivez votre modele ici..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim() || !content.trim()}
              className="flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#004182] disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  {t.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {t.category}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{t.content}</p>
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleUse(t)}
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-[#0a66c2] hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Utiliser
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-500">Aucun modele pour le moment.</p>
          </div>
        )
      )}
    </div>
  )
}
