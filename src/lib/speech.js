// Pronunciación en inglés con la voz del navegador (gratis, sin servidor).
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

let voice = null
function pickVoice() {
  if (!canSpeak) return null
  const voices = speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'en-US' && /Google|Samantha|Microsoft/.test(v.name)) ??
    voices.find((v) => v.lang?.startsWith('en-US')) ??
    voices.find((v) => v.lang?.startsWith('en')) ??
    null
  )
}
if (canSpeak) {
  try {
    speechSynthesis.onvoiceschanged = () => (voice = pickVoice())
  } catch {}
}

export function speak(text, rate = 0.9) {
  if (!canSpeak || !text) return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate
    voice = voice ?? pickVoice()
    if (voice) u.voice = voice
    speechSynthesis.speak(u)
  } catch {}
}
