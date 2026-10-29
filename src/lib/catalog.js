import { Zap, Link2, ArrowDownUp, TextCursorInput, Grid3x3, KeyRound } from '@lucide/svelte'

// Clases completas (Tailwind solo genera las que aparecen escritas tal cual).
export const tones = {
  coral: { tile: 'bg-coral/12 text-coral', btn: 'bg-coral hover:bg-coral/90 text-white', ring: 'ring-coral/30', dot: 'bg-coral', text: 'text-coral' },
  teal: { tile: 'bg-teal/12 text-teal', btn: 'bg-teal hover:bg-teal/90 text-white', ring: 'ring-teal/30', dot: 'bg-teal', text: 'text-teal' },
  plum: { tile: 'bg-plum/12 text-plum', btn: 'bg-plum hover:bg-plum/90 text-white', ring: 'ring-plum/30', dot: 'bg-plum', text: 'text-plum' },
  sky: { tile: 'bg-sky/12 text-sky', btn: 'bg-sky hover:bg-sky/90 text-white', ring: 'ring-sky/30', dot: 'bg-sky', text: 'text-sky' },
  sun: { tile: 'bg-sun/15 text-[#a8720a]', btn: 'bg-sun hover:bg-sun/90 text-ink', ring: 'ring-sun/30', dot: 'bg-sun', text: 'text-[#a8720a]' },
  ink: { tile: 'bg-ink/8 text-ink', btn: 'bg-ink hover:bg-ink/90 text-white', ring: 'ring-ink/20', dot: 'bg-ink', text: 'text-ink' },
}

export const catalog = [
  {
    type: 'quiz',
    name: 'Pregunta rápida',
    desc: 'Opción múltiple con cuenta regresiva. Más puntos por responder rápido y por rachas.',
    tone: 'coral',
    icon: Zap,
    ready: true,
  },
  {
    type: 'match',
    name: 'Relaciona',
    desc: 'Une palabras con su pareja. Las que falles vuelven en otra ronda hasta dominarlas.',
    tone: 'teal',
    icon: Link2,
    ready: true,
  },
  {
    type: 'order',
    name: 'Ordena la oración',
    desc: 'Coloca las palabras en el orden correcto para formar oraciones.',
    tone: 'plum',
    icon: ArrowDownUp,
    ready: false,
  },
  {
    type: 'fill',
    name: 'Completa la frase',
    desc: 'Escribe la palabra que falta, con pistas opcionales.',
    tone: 'sky',
    icon: TextCursorInput,
    ready: false,
  },
  {
    type: 'search',
    name: 'Sopa de letras',
    desc: 'Encuentra el vocabulario escondido en la cuadrícula.',
    tone: 'sun',
    icon: Grid3x3,
    ready: false,
  },
  {
    type: 'escape',
    name: 'Escape room',
    desc: 'Niveles encadenados: cada respuesta correcta abre la siguiente puerta.',
    tone: 'ink',
    icon: KeyRound,
    ready: false,
  },
]

export const byType = Object.fromEntries(catalog.map((c) => [c.type, c]))

export function itemCount(a) {
  return a.type === 'quiz' ? a.questions.length : a.pairs.length
}

export function itemLabel(a) {
  const n = itemCount(a)
  return a.type === 'quiz' ? `${n} pregunta${n === 1 ? '' : 's'}` : `${n} pareja${n === 1 ? '' : 's'}`
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function fmtDate(ts) {
  try {
    return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(ts)
  } catch {
    return new Date(ts).toLocaleString()
  }
}
