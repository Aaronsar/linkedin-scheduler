'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, Clock, Save, Loader2 } from 'lucide-react'
import type { LinkedInAccount, Template } from '@/lib/linkedin/types'

export default function NouveauPostPage() {
  const [content, setContent] = useState('')
  const [accountId, setAccountId] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [accountsRes, templatesRes] = await Promise.all([
        supabase.from('linkedin_accounts').select('*').eq('is_active', true),
        supabase.from('templates').select('*').order('created_at', { ascending: false }),
      ])
      if (accountsRes.data) setAccounts(accountsRes.data)
      if (templatesRes.data) setTemplates(templatesRes.data)
      if (accountsRes.data && accountsRes.data.length > 0) {
        setAccountId(accountsRes.data[0].id)
      }
    }
    load()
  }, [])

  async function handleSubmit(status: 'draft' | 'pending') {
    if (!content.trim()) {
      setError('Le contenu du post est requis')
      return
    }
    if (status === 'pending' && !accountId) {
      setError('Veuillez selectionner un compte LinkedIn')
      return
    }

    setError('')
    setLoading(true)

    let scheduled_at: string | null = null
    if (status === 'pending') {
      if (scheduleMode === 'schedule' && scheduledDate && scheduledTime) {
        scheduled_at = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      } else {
        scheduled_at = new Date().toISOString()
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Non authentifie')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('posts').insert({
      user_id: user.id,
      linkedin_account_id: accountId || null,
      content: content.trim(),
      visibility,
      status,
      scheduled_at,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(
      status === 'draft'
        ? 'Brouillon enregistre !'
        : scheduleMode === 'schedule'
        ? 'Post planifie !'
        : 'Post en cours de publication...'
    )
    setLoading(false)

    setTimeout(() => {
      router.push('/dashboard/posts')
    }, 1500)
  }

  function loadTemplate(template: Template) {
    setContent(template.content)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nouveau post</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Template loader */}
        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charger un modele
            </label>
            <select
              onChange={(e) => {
                const t = templates.find((t) => t.id === e.target.value)
                if (t) loadTemplate(t)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Choisir un modele...
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenu du post
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={3000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent resize-none"
            placeholder="Ecrivez votre post LinkedIn ici..."
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {content.length} / 3000 caracteres
          </p>
        </div>

        {/* Account selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compte LinkedIn
          </label>
          {accounts.length > 0 ? (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.linkedin_name || acc.linkedin_email || 'Compte LinkedIn'}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Aucun compte LinkedIn connecte.{' '}
              <a href="/dashboard/comptes" className="underline font-medium">
                Connecter un compte
              </a>
            </div>
          )}
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibilite
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="PUBLIC">Public</option>
            <option value="CONNECTIONS">Connexions uniquement</option>
          </select>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quand publier ?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setScheduleMode('now')}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                scheduleMode === 'now'
                  ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Maintenant
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('schedule')}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                scheduleMode === 'schedule'
                  ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Planifier
            </button>
          </div>

          {scheduleMode === 'schedule' && (
            <div className="flex gap-3 mt-3">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Brouillon
          </button>
          <button
            onClick={() => handleSubmit('pending')}
            disabled={loading || accounts.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0a66c2] text-white py-2.5 rounded-lg font-medium hover:bg-[#004182] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : scheduleMode === 'schedule' ? (
              <Clock className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {scheduleMode === 'schedule' ? 'Planifier le post' : 'Publier maintenant'}
          </button>
        </div>
      </div>
    </div>
  )
}
