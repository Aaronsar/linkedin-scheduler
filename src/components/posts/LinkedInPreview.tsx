'use client'

import { useState } from 'react'

// LinkedIn truncates at ~210 chars on mobile, ~3 lines on desktop
const TRUNCATE_LENGTH = 210

export default function LinkedInPreview({
  content,
  authorName,
  authorPicture,
  imageUrl,
}: {
  content: string
  authorName: string
  authorPicture?: string | null
  imageUrl?: string | null
}) {
  const [expanded, setExpanded] = useState(false)

  const shouldTruncate = content.length > TRUNCATE_LENGTH
  const firstLineBreak = content.indexOf('\n')
  const truncateAt = firstLineBreak > 0 && firstLineBreak < TRUNCATE_LENGTH
    ? firstLineBreak
    : TRUNCATE_LENGTH

  const displayedContent = expanded || !shouldTruncate
    ? content
    : content.slice(0, truncateAt)

  return (
    <div className="border border-gray-200 rounded-xl bg-white max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        {authorPicture ? (
          <img src={authorPicture} alt="" className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
            {authorName[0] || '?'}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{authorName}</p>
          <p className="text-xs text-gray-500">A l&apos;instant</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <div className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
          {displayedContent}
          {shouldTruncate && !expanded && (
            <>
              {'... '}
              <button
                onClick={() => setExpanded(true)}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                voir plus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="mt-1">
          <img src={imageUrl} alt="" className="w-full" />
        </div>
      )}

      {/* Reactions bar */}
      <div className="px-4 py-2 border-t border-gray-100 mt-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>0 reactions</span>
          <span>0 commentaires</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-gray-100">
        {['J\'aime', 'Commenter', 'Partager'].map((action) => (
          <button
            key={action}
            className="flex-1 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
