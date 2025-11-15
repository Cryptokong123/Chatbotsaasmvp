/**
 * Preset Response Matcher
 *
 * Matches user questions to preset responses to bypass AI and save costs
 */

export interface PresetResponse {
  id: string
  bot_id: string
  question: string
  answer: string
  match_type: 'exact' | 'contains' | 'starts_with'
  priority: number
  is_active: boolean
}

/**
 * Normalize text for matching (lowercase, trim, remove extra spaces)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if a user question matches a preset question
 */
function matchesPreset(
  userQuestion: string,
  presetQuestion: string,
  matchType: 'exact' | 'contains' | 'starts_with'
): boolean {
  const normalizedUser = normalizeText(userQuestion)
  const normalizedPreset = normalizeText(presetQuestion)

  switch (matchType) {
    case 'exact':
      return normalizedUser === normalizedPreset

    case 'contains':
      return normalizedUser.includes(normalizedPreset) || normalizedPreset.includes(normalizedUser)

    case 'starts_with':
      return normalizedUser.startsWith(normalizedPreset)

    default:
      return false
  }
}

/**
 * Find a matching preset response for a user question
 * Returns the highest priority match if multiple matches exist
 */
export function findMatchingPreset(
  userQuestion: string,
  presets: PresetResponse[]
): PresetResponse | null {
  // Filter to active presets only
  const activePresets = presets.filter((p) => p.is_active)

  // Find all matches
  const matches = activePresets.filter((preset) =>
    matchesPreset(userQuestion, preset.question, preset.match_type)
  )

  if (matches.length === 0) return null

  // Sort by priority (higher priority first) and return the first match
  matches.sort((a, b) => b.priority - a.priority)

  return matches[0]
}

/**
 * Get similarity score between two strings (0-1)
 * Used for fuzzy matching suggestions in the UI
 */
export function getSimilarityScore(str1: string, str2: string): number {
  const s1 = normalizeText(str1)
  const s2 = normalizeText(str2)

  if (s1 === s2) return 1.0

  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
