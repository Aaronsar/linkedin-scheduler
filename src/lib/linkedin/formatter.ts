/**
 * Formate un texte brut en post LinkedIn professionnel
 *
 * Regles de formatage :
 * - Premiere ligne = accroche forte (courte, percutante)
 * - Saut de ligne apres l'accroche pour creer le "voir plus"
 * - Paragraphes aeres (double saut de ligne)
 * - Fleches pour les listes a puces
 * - Hashtags regroupes a la fin
 */
export function formatForLinkedIn(rawText: string): string {
  let text = rawText.trim()

  // 1. Normalize line breaks
  text = text.replace(/\r\n/g, '\n')

  // 2. Extract hashtags that might be inline
  const hashtagRegex = /#[\w\u00C0-\u024F]+/g
  const inlineHashtags = text.match(hashtagRegex) || []
  text = text.replace(hashtagRegex, '').trim()

  // 3. Split into paragraphs
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return rawText

  // 4. Process each paragraph
  const formattedParagraphs = paragraphs.map((paragraph) => {
    // Check if paragraph is a list (lines starting with -, *, •, numbers)
    const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean)
    const isList = lines.length > 1 && lines.every((l) =>
      /^[-*•→▸▹]\s/.test(l) || /^\d+[.)]\s/.test(l)
    )

    if (isList) {
      return lines
        .map((line) => {
          // Replace list markers with arrows
          return line.replace(/^[-*•▸▹]\s+/, '→ ').replace(/^\d+[.)]\s+/, '→ ')
        })
        .join('\n')
    }

    // Check if it's a mixed paragraph with some list items
    const hasListItems = lines.some((l) =>
      /^[-*•→▸▹]\s/.test(l) || /^\d+[.)]\s/.test(l)
    )

    if (hasListItems && lines.length > 1) {
      return lines
        .map((line) => {
          if (/^[-*•▸▹]\s/.test(line) || /^\d+[.)]\s/.test(line)) {
            return line.replace(/^[-*•▸▹]\s+/, '→ ').replace(/^\d+[.)]\s+/, '→ ')
          }
          return line
        })
        .join('\n')
    }

    return paragraph
  })

  // 5. Build final post
  let result = ''

  // First paragraph is the hook - keep it short
  const hook = formattedParagraphs[0]
  result += hook

  // Add remaining paragraphs with double line breaks
  for (let i = 1; i < formattedParagraphs.length; i++) {
    result += '\n\n' + formattedParagraphs[i]
  }

  // 6. Add hashtags at the end
  if (inlineHashtags.length > 0) {
    const uniqueHashtags = [...new Set(inlineHashtags)]
    result += '\n\n' + uniqueHashtags.join(' ')
  }

  // 7. Clean up excessive whitespace
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

/**
 * Compte les caracteres visibles avant "voir plus" sur LinkedIn
 * LinkedIn coupe a environ 210 caracteres ou au premier saut de ligne
 */
export function getHookLength(text: string): number {
  const firstBreak = text.indexOf('\n\n')
  if (firstBreak > 0 && firstBreak < 210) return firstBreak
  return Math.min(text.length, 210)
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
