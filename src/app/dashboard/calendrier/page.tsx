'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import type { Post } from '@/lib/linkedin/types'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
]

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  draft: { color: 'text-gray-600', bg: 'bg-gray-200', icon: FileText },
  pending: { color: 'text-blue-700', bg: 'bg-blue-200', icon: Clock },
  publishing: { color: 'text-amber-700', bg: 'bg-amber-200', icon: Clock },
  published: { color: 'text-green-700', bg: 'bg-green-200', icon: CheckCircle },
  failed: { color: 'text-red-700', bg: 'bg-red-200', icon: XCircle },
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export default function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const supabase = createClient()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    async function loadPosts() {
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

      // Extend range to cover calendar grid edges
      const startDate = getMonday(startOfMonth)
      const endDate = new Date(endOfMonth)
      endDate.setDate(endDate.getDate() + (7 - endDate.getDay()))

      const { data } = await supabase
        .from('posts')
        .select('*, linkedin_accounts(linkedin_name, linkedin_picture_url)')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true })

      if (data) setPosts(data)
    }
    loadPosts()
  }, [year, month])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = getMonday(firstDay)

    const days: { date: Date; isCurrentMonth: boolean; dateKey: string }[] = []
    const current = new Date(startDate)

    // Always show 6 weeks
    for (let i = 0; i < 42; i++) {
      const dateKey = current.toISOString().split('T')[0]
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        dateKey,
      })
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [year, month])

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {}
    for (const post of posts) {
      if (!post.scheduled_at) continue
      const key = new Date(post.scheduled_at).toLocaleDateString('en-CA') // YYYY-MM-DD
      if (!map[key]) map[key] = []
      map[key].push(post)
    }
    return map
  }, [posts])

  const today = new Date().toISOString().split('T')[0]

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  function goToday() {
    setCurrentDate(new Date())
    setSelectedDay(today)
  }

  const selectedPosts = selectedDay ? (postsByDate[selectedDay] || []) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <Link
          href="/dashboard/nouveau"
          className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#004182] transition-colors text-sm"
        >
          Nouveau post
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={goToday}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Aujourd&apos;hui
            </button>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayPosts = postsByDate[day.dateKey] || []
            const isToday = day.dateKey === today
            const isSelected = day.dateKey === selectedDay

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day.dateKey === selectedDay ? null : day.dateKey)}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r text-left transition-colors relative ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'hover:bg-blue-50'
                } ${isSelected ? 'bg-blue-50 ring-2 ring-[#0a66c2] ring-inset' : ''}`}
              >
                <span
                  className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${
                    isToday ? 'bg-[#0a66c2] text-white' : ''
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {/* Post indicators */}
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => {
                    const status = statusConfig[post.status] || statusConfig.draft
                    return (
                      <div
                        key={post.id}
                        className={`text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded ${status.bg} ${status.color}`}
                      >
                        <span className="hidden sm:inline">
                          {new Date(post.scheduled_at!).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                        </span>
                        {post.content.slice(0, 20)}
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1.5">
                      +{dayPosts.length - 3} autre{dayPosts.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h3>

          {selectedPosts.length > 0 ? (
            <div className="space-y-3">
              {selectedPosts.map((post) => {
                const status = statusConfig[post.status] || statusConfig.draft
                const Icon = status.icon
                return (
                  <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`mt-0.5 p-1 rounded ${status.bg}`}>
                      <Icon className={`w-4 h-4 ${status.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {new Date(post.scheduled_at!).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {post.linkedin_accounts?.linkedin_name || 'Compte'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="mt-2 h-16 rounded border" />
                      )}
                    </div>
                    <Link
                      href={`/dashboard/posts/${post.id}`}
                      className="text-xs text-[#0a66c2] hover:underline shrink-0"
                    >
                      Voir
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun post prevu ce jour.</p>
          )}
        </div>
      )}
    </div>
  )
}
