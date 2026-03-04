// Calculates reading time in minutes from TipTap JSON content
export function calculateReadingTime(content: Record<string, unknown> | null): number {
  if (!content) return 1

  const text = extractTextFromTipTap(content)
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

function extractTextFromTipTap(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text
  }

  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[])
      .map(extractTextFromTipTap)
      .join(' ')
  }

  return ''
}

export function extractExcerpt(
  content: Record<string, unknown> | null,
  maxLength = 300
): string {
  if (!content) return ''
  const text = extractTextFromTipTap(content).replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.substring(0, maxLength).trim() + '...' : text
}
