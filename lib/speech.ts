import * as Speech from 'expo-speech'

export function speakJapanese(text: string) {
  Speech.stop()
  Speech.speak(text, {
    language: 'ja-JP',
    rate: 0.85,
  })
}
