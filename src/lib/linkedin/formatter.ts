/**
 * Formate un texte brut en post LinkedIn professionnel.
 *
 * Transformations :
 * - Chaque phrase sur sa propre ligne
 * - Espaces entre les blocs de 2-3 phrases
 * - Tirets convertis en fleches →
 * - Hashtags regroupes a la fin
 * - Accroche isolee en premiere ligne
 */
export function formatForLinkedIn(rawText: string): string {
  let text = rawText.trim()
  if (!text) return text

  // Normalize
  text = text.replace(/\r\n/g, '\n')

  // Extract hashtags
  const hashtagRegex = /#[\w\u00C0-\u024F]+/g
  const inlineHashtags = text.match(hashtagRegex) || []
  text = text.replace(hashtagRegex, '').trim()

  // Split into existing paragraphs first
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)

  const allLines: string[] = []

  for (const block of blocks) {
    // Check if it's already a list
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    const isList = lines.length > 1 && lines.every(l =>
      /^[-*•→▸▹]\s/.test(l) || /^\d+[.)]\s/.test(l)
    )

    if (isList) {
      // Convert list markers to arrows, keep as group
      const listItems = lines.map(l =>
        l.replace(/^[-*•▸▹]\s+/, '→ ').replace(/^\d+[.)]\s+/, '→ ')
      )
      allLines.push(listItems.join('\n'))
      continue
    }

    // Split block into individual sentences
    // Join lines into one string first
    const joined = lines.join(' ')

    // Split on sentence endings (. ! ?) followed by space or end
    const sentences = joined
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean)

    if (sentences.length <= 1) {
      // Single sentence or no sentence breaks - check for list items
      const processed = lines.map(l => {
        if (/^[-*•]\s+/.test(l)) return l.replace(/^[-*•]\s+/, '→ ')
        if (/^\d+[.)]\s+/.test(l)) return l.replace(/^\d+[.)]\s+/, '→ ')
        return l
      })
      allLines.push(processed.join('\n'))
      continue
    }

    // Multiple sentences - each one on its own line
    for (const sentence of sentences) {
      let s = sentence
      if (/^[-*•]\s+/.test(s)) s = s.replace(/^[-*•]\s+/, '→ ')
      if (/^\d+[.)]\s+/.test(s)) s = s.replace(/^\d+[.)]\s+/, '→ ')
      allLines.push(s)
    }
  }

  if (allLines.length === 0) return rawText

  // Build final post : hook + spaced groups
  let result = ''

  // First line = hook (always alone)
  result = allLines[0]

  // Group remaining lines in blocks of 2-3, separated by blank lines
  let groupCount = 0
  for (let i = 1; i < allLines.length; i++) {
    const line = allLines[i]
    const isListLine = line.startsWith('→ ')
    const prevIsListLine = i > 0 && allLines[i - 1]?.startsWith('→ ')

    // Keep list items together
    if (isListLine && prevIsListLine) {
      result += '\n' + line
      continue
    }

    // Add blank line before list blocks
    if (isListLine && !prevIsListLine) {
      result += '\n\n' + line
      groupCount = 0
      continue
    }

    // After list block, add blank line
    if (!isListLine && prevIsListLine) {
      result += '\n\n' + line
      groupCount = 1
      continue
    }

    // Regular sentences: blank line every 2-3 sentences
    groupCount++
    if (groupCount >= 3 || i === 1) {
      result += '\n\n' + line
      groupCount = 0
    } else {
      result += '\n' + line
    }
  }

  // Add hashtags
  if (inlineHashtags.length > 0) {
    result += '\n\n' + [...new Set(inlineHashtags)].join(' ')
  }

  // Clean up
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

/**
 * Verifie si l'accroche est efficace
 */
export function analyzeHook(text: string): {
  length: number
  isGoodLength: boolean
  suggestion: string | null
} {
  const hookEnd = text.indexOf('\n\n')
  const hook = hookEnd > 0 ? text.slice(0, hookEnd) : text.slice(0, 210)
  const length = hook.length

  if (length < 20) {
    return { length, isGoodLength: false, suggestion: 'L\'accroche est trop courte. Ajoutez une phrase percutante.' }
  }
  if (length > 200) {
    return { length, isGoodLength: false, suggestion: 'L\'accroche est trop longue. Les 2 premieres lignes doivent donner envie de cliquer "voir plus".' }
  }
  return { length, isGoodLength: true, suggestion: null }
}
