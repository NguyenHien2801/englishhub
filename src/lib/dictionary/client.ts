// Free Dictionary API + AI Hybrid
// Không cần API key, hoàn toàn miễn phí!

export interface DictionaryEntry {
  word: string
  phonetic?: string
  audioUrl?: string
  meanings: {
    partOfSpeech: string
    definitions: { definition: string; example?: string }[]
    synonyms: string[]
    antonyms: string[]
  }[]
}

export async function fetchFromDictionary(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { next: { revalidate: 86400 } } // cache 24 hours
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const audioUrl = entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio || ''

    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
      audioUrl,
      meanings: entry.meanings || [],
    }
  } catch {
    return null
  }
}

// SM-2 Spaced Repetition Algorithm
export function calculateNextReview(
  quality: 0 | 1 | 2 | 3 | 4 | 5, // 0=blackout, 5=perfect
  repetitions: number,
  easinessFactor: number,
  interval: number
): { nextInterval: number; nextEF: number; nextReps: number } {
  let nextEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  nextEF = Math.max(1.3, nextEF) // minimum EF = 1.3

  let nextReps = repetitions
  let nextInterval = interval

  if (quality < 3) {
    // Failed: reset
    nextReps = 0
    nextInterval = 1
  } else {
    nextReps += 1
    if (nextReps === 1) nextInterval = 1
    else if (nextReps === 2) nextInterval = 6
    else nextInterval = Math.round(interval * nextEF)
  }

  return { nextInterval, nextEF, nextReps }
}

// Difficulty to quality mapping
export function difficultyToQuality(difficulty: 'easy' | 'good' | 'hard' | 'again'): 0 | 1 | 2 | 3 | 4 | 5 {
  const map = { easy: 5, good: 4, hard: 2, again: 0 }
  return map[difficulty] as 0 | 1 | 2 | 3 | 4 | 5
}
