/**
 * Pronunciation scoring built on top of expo-speech-recognition.
 *
 * Flow:
 *   1. requestPermission() — prompts mic + speech-recognition permissions
 *   2. recognize(target) — opens an on-device ja-JP recognition session, awaits
 *      a final transcript, scores it against the target string, returns a Score
 *
 * The score is character-level (kana + kanji): the user just needs to PRODUCE
 * a transcript close enough to the canonical line. iOS Speech does a decent
 * enough job on short phrases that asking for phoneme-level matching would be
 * overkill and frustrate users. We strip punctuation + whitespace on both
 * sides so trivial transcription differences don't tank the score.
 */
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
  type ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition'

// Anything that doesn't carry pronunciation meaning: ASCII + Japanese
// punctuation, whitespace, brackets, full/half-width spaces.
const STRIP_RE = /[\s　-〿＀-･。、！？「」『』（）()\.\,\!\?]/g

function normalize(s: string): string {
  return (s || '').replace(STRIP_RE, '').toLowerCase()
}

/** Levenshtein distance — straightforward iterative DP. */
function distance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const dp = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) dp[j] = j
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = tmp
    }
  }
  return dp[b.length]
}

export interface Score {
  /** 0-100, higher is better. */
  percent: number
  /** A, B, C, D, F bucketed from percent for friendlier UI. */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** What iOS thought you said (raw transcript). */
  heard: string
  /** What we asked you to say. */
  target: string
}

export function scoreTranscript(heard: string, target: string): Score {
  const a = normalize(heard)
  const b = normalize(target)
  // Empty heard guard — sometimes Speech returns "" when the user is silent.
  if (!a) return { percent: 0, grade: 'F', heard, target }
  const dist = distance(a, b)
  const longest = Math.max(a.length, b.length)
  const similarity = 1 - dist / longest
  const percent = Math.max(0, Math.min(100, Math.round(similarity * 100)))
  let grade: Score['grade'] = 'F'
  if (percent >= 90) grade = 'A'
  else if (percent >= 75) grade = 'B'
  else if (percent >= 60) grade = 'C'
  else if (percent >= 40) grade = 'D'
  return { percent, grade, heard, target }
}

export async function requestPermission(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
  return result.granted === true
}

export interface RecognizeOptions {
  /** Hard ceiling on listening time; iOS will also stop on its own silence detection. */
  timeoutMs?: number
}

/**
 * Start a ja-JP recognition session and resolve with the user's transcript
 * (or reject on permission/engine error). Cancels on timeout. Caller is
 * expected to feed the resolved transcript into scoreTranscript().
 */
export function recognizeJapanese(opts: RecognizeOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    let lastTranscript = ''
    let settled = false
    const finalize = (transcript: string) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(transcript.trim())
    }
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    const resultSub = ExpoSpeechRecognitionModule.addListener(
      'result',
      (e: ExpoSpeechRecognitionResultEvent) => {
        const piece = e.results?.[0]?.transcript ?? ''
        if (piece) lastTranscript = piece
        if (e.isFinal && lastTranscript) finalize(lastTranscript)
      },
    )
    const errorSub = ExpoSpeechRecognitionModule.addListener(
      'error',
      (e: ExpoSpeechRecognitionErrorEvent) => {
        // "no-speech" / "aborted" — give the user whatever we got so they
        // can re-try without seeing a hard error.
        if (e.error === 'no-speech' || e.error === 'aborted') {
          finalize(lastTranscript)
        } else {
          fail(new Error(`speech-recognition: ${e.error}`))
        }
      },
    )
    const endSub = ExpoSpeechRecognitionModule.addListener('end', () => {
      finalize(lastTranscript)
    })

    const timer = setTimeout(() => {
      try { ExpoSpeechRecognitionModule.stop() } catch { /* swallow */ }
    }, opts.timeoutMs ?? 6000)

    const cleanup = () => {
      clearTimeout(timer)
      resultSub.remove()
      errorSub.remove()
      endSub.remove()
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'ja-JP',
        interimResults: true,
        // Force on-device recognition where supported — keeps audio off Apple servers
        // and avoids latency on short phrases.
        requiresOnDeviceRecognition: true,
        continuous: false,
        maxAlternatives: 1,
      })
    } catch (e: any) {
      fail(new Error(e?.message ?? 'failed to start recognition'))
    }
  })
}
