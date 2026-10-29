import { Zap, Link2, ArrowDownUp, TextCursorInput, Grid3x3, KeyRound, Layers, Shuffle, Dices, Headphones, PersonStanding, Brain, Puzzle, FerrisWheel, Ticket, Map as MapIcon } from '@lucide/svelte'

// Clases completas (Tailwind solo genera las que aparecen escritas tal cual).
export const tones = {
  coral: { tile: 'bg-coral/12 text-coral', btn: 'bg-coral hover:bg-coral/90 text-white', ring: 'ring-coral/30', dot: 'bg-coral', text: 'text-coral', soft: 'bg-coral/8' },
  teal: { tile: 'bg-teal/12 text-teal', btn: 'bg-teal hover:bg-teal/90 text-white', ring: 'ring-teal/30', dot: 'bg-teal', text: 'text-teal', soft: 'bg-teal/8' },
  plum: { tile: 'bg-plum/12 text-plum', btn: 'bg-plum hover:bg-plum/90 text-white', ring: 'ring-plum/30', dot: 'bg-plum', text: 'text-plum', soft: 'bg-plum/8' },
  sky: { tile: 'bg-sky/12 text-sky', btn: 'bg-sky hover:bg-sky/90 text-white', ring: 'ring-sky/30', dot: 'bg-sky', text: 'text-sky', soft: 'bg-sky/8' },
  sun: { tile: 'bg-sun/15 text-[#a8720a]', btn: 'bg-sun hover:bg-sun/90 text-ink', ring: 'ring-sun/30', dot: 'bg-sun', text: 'text-[#a8720a]', soft: 'bg-sun/10' },
  rose: { tile: 'bg-rose/12 text-rose', btn: 'bg-rose hover:bg-rose/90 text-white', ring: 'ring-rose/30', dot: 'bg-rose', text: 'text-rose', soft: 'bg-rose/8' },
  leaf: { tile: 'bg-leaf/12 text-leaf', btn: 'bg-leaf hover:bg-leaf/90 text-white', ring: 'ring-leaf/30', dot: 'bg-leaf', text: 'text-leaf', soft: 'bg-leaf/8' },
  indigo: { tile: 'bg-indigo/12 text-indigo', btn: 'bg-indigo hover:bg-indigo/90 text-white', ring: 'ring-indigo/30', dot: 'bg-indigo', text: 'text-indigo', soft: 'bg-indigo/8' },
  ink: { tile: 'bg-ink/8 text-ink', btn: 'bg-ink hover:bg-ink/90 text-white', ring: 'ring-ink/20', dot: 'bg-ink', text: 'text-ink', soft: 'bg-ink/5' },
}

const onlyLetters = /^[a-zA-Z]+$/

/**
 * Cada tipo define cómo se edita:
 *  - editor 'quiz'  → editor de preguntas de opción múltiple
 *  - editor 'match' → editor de parejas
 *  - editor 'items' → editor genérico con los campos indicados
 */
export const catalog = [
  {
    type: 'flash',
    group: 'learn',
    name: 'Flashcards',
    desc: 'Tarjetas con audio en inglés para estudiar vocabulario. Las que no sabes vuelven hasta que las domines.',
    tone: 'sky',
    icon: Layers,
    editor: 'items',
    itemsKey: 'cards',
    unit: ['tarjeta', 'tarjetas'],
    min: 3,
    max: 40,
    fields: [
      { key: 'front', label: 'Inglés', placeholder: 'mother', required: true, size: 'sm' },
      { key: 'back', label: 'Significado', placeholder: 'madre', required: true, size: 'sm' },
      { key: 'example', label: 'Ejemplo (opcional)', placeholder: 'My mother is a nurse.', size: 'lg' },
    ],
  },
  {
    type: 'match',
    group: 'learn',
    name: 'Relaciona',
    desc: 'Une palabras con su pareja. Las que falles vuelven en otra ronda hasta dominarlas.',
    tone: 'teal',
    icon: Link2,
    editor: 'match',
    itemsKey: 'pairs',
    unit: ['pareja', 'parejas'],
  },
  {
    type: 'letters',
    group: 'learn',
    name: 'Ordena las letras',
    desc: 'Forma la palabra que falta en la oración ordenando sus letras desordenadas.',
    tone: 'sun',
    icon: Shuffle,
    editor: 'items',
    itemsKey: 'items',
    unit: ['palabra', 'palabras'],
    min: 3,
    max: 30,
    fields: [
      { key: 'word', label: 'Palabra', placeholder: 'pencil', required: true, size: 'sm' },
      { key: 'sentence', label: 'Oración (usa ___ donde va la palabra)', placeholder: 'I write with a ___.', size: 'lg' },
      { key: 'hint', label: 'Pista (opcional)', placeholder: 'lápiz', size: 'sm' },
    ],
    validateItem: (it, n) => {
      const w = it.word.trim()
      if (w && !onlyLetters.test(w)) return `La palabra ${n} solo debe tener letras, sin espacios.`
      if (w && w.length < 3) return `La palabra ${n} es muy corta para desordenarla (mínimo 3 letras).`
      if (it.sentence.trim() && !it.sentence.includes('___')) return `La oración ${n} debe incluir ___ donde va la palabra.`
      return null
    },
  },
  {
    type: 'order',
    group: 'learn',
    name: 'Ordena la oración',
    desc: 'Toca las palabras en el orden correcto para construir oraciones en inglés.',
    tone: 'plum',
    icon: ArrowDownUp,
    editor: 'items',
    itemsKey: 'sentences',
    unit: ['oración', 'oraciones'],
    min: 3,
    max: 30,
    fields: [
      { key: 'text', label: 'Oración correcta', placeholder: 'She drinks coffee every morning.', required: true, size: 'lg' },
      { key: 'translation', label: 'Traducción o pista (opcional)', placeholder: 'Ella toma café cada mañana.', size: 'lg' },
    ],
    validateItem: (it, n) => (it.text.trim() && it.text.trim().split(/\s+/).length < 3 ? `La oración ${n} necesita al menos 3 palabras.` : null),
  },
  {
    type: 'fill',
    group: 'learn',
    name: 'Completa la frase',
    desc: 'Escribe la palabra que falta. Acepta respuestas alternativas y pistas opcionales.',
    tone: 'rose',
    icon: TextCursorInput,
    editor: 'items',
    itemsKey: 'items',
    unit: ['frase', 'frases'],
    min: 3,
    max: 40,
    fields: [
      { key: 'sentence', label: 'Frase (usa ___ para el espacio)', placeholder: 'I ___ a student.', required: true, size: 'lg' },
      { key: 'answer', label: 'Respuesta', placeholder: 'am', required: true, size: 'sm' },
      { key: 'alternatives', label: 'También válidas (separa con comas)', placeholder: "'m", size: 'sm' },
      { key: 'hint', label: 'Pista (opcional)', placeholder: 'yo', size: 'sm' },
    ],
    validateItem: (it, n) => (it.sentence.trim() && !it.sentence.includes('___') ? `La frase ${n} debe incluir ___ donde va la respuesta.` : null),
  },
  {
    type: 'quiz',
    group: 'challenge',
    name: 'Pregunta rápida',
    desc: 'Opción múltiple con cuenta regresiva. Más puntos por responder rápido y por rachas.',
    tone: 'coral',
    icon: Zap,
    editor: 'quiz',
    itemsKey: 'questions',
    unit: ['pregunta', 'preguntas'],
  },
  {
    type: 'search',
    group: 'challenge',
    name: 'Sopa de letras',
    desc: 'Encuentra el vocabulario escondido en una cuadrícula generada al azar. Contra reloj.',
    tone: 'leaf',
    icon: Grid3x3,
    editor: 'items',
    itemsKey: 'words',
    unit: ['palabra', 'palabras'],
    min: 4,
    max: 15,
    settings: [
      {
        key: 'difficulty',
        label: 'Dificultad',
        kind: 'select',
        options: [
          ['facil', 'Fácil · horizontal, vertical y diagonal'],
          ['dificil', 'Difícil · también al revés'],
        ],
      },
    ],
    fields: [{ key: 'word', label: 'Palabra', placeholder: 'rabbit', required: true, size: 'lg' }],
    validateItem: (it, n) => {
      const w = it.word.trim()
      if (w && !onlyLetters.test(w)) return `La palabra ${n} solo debe tener letras, sin espacios ni tildes.`
      if (w && (w.length < 3 || w.length > 12)) return `La palabra ${n} debe tener entre 3 y 12 letras.`
      return null
    },
  },
  {
    type: 'escape',
    group: 'adventure',
    name: 'Escape room',
    desc: 'Una historia con candados: cada acertijo resuelto da un dígito del código de salida. Hay reloj, pistas y penalizaciones.',
    tone: 'ink',
    icon: KeyRound,
    editor: 'items',
    itemsKey: 'levels',
    unit: ['candado', 'candados'],
    min: 2,
    max: 9,
    settings: [
      { key: 'story', label: 'Historia de inicio', kind: 'textarea', placeholder: 'Te quedaste encerrado en…' },
      {
        key: 'minutes',
        label: 'Tiempo total',
        kind: 'select',
        options: [
          [5, '5 minutos'],
          [8, '8 minutos'],
          [10, '10 minutos'],
          [15, '15 minutos'],
          [20, '20 minutos'],
        ],
      },
    ],
    fields: [
      { key: 'clue', label: 'Narración del candado (opcional)', placeholder: 'Sobre la mesa hay una nota…', size: 'lg' },
      { key: 'question', label: 'Acertijo o pregunta', placeholder: 'What day comes after Monday?', required: true, size: 'lg' },
      { key: 'answer', label: 'Respuesta', placeholder: 'Tuesday', required: true, size: 'sm' },
      { key: 'alternatives', label: 'También válidas (comas)', placeholder: '', size: 'sm' },
      { key: 'hint', label: 'Pista (opcional)', placeholder: 'Empieza con T.', size: 'sm' },
    ],
  },
  {
    type: 'board',
    group: 'class',
    name: 'Carrera por equipos',
    desc: 'Juego de tablero para la clase: los equipos lanzan el dado, responden y avanzan. Casillas con bonos, trampas y robo de turno.',
    tone: 'indigo',
    icon: Dices,
    editor: 'quiz',
    itemsKey: 'questions',
    unit: ['pregunta', 'preguntas'],
  },
  {
    type: 'listen',
    group: 'learn',
    name: 'Dictado',
    desc: 'Escucha una palabra o frase en inglés y escríbela. Con velocidad normal y lenta.',
    tone: 'sky',
    icon: Headphones,
    editor: 'items',
    itemsKey: 'items',
    unit: ['audio', 'audios'],
    min: 3,
    max: 30,
    fields: [
      { key: 'text', label: 'Lo que se escucha (inglés)', placeholder: 'My bag is black.', required: true, size: 'lg' },
      { key: 'translation', label: 'Traducción (se muestra al final)', placeholder: 'Mi mochila es negra.', size: 'lg' },
    ],
  },
  {
    type: 'memory',
    group: 'learn',
    name: 'Memoria',
    desc: 'Voltea cartas y encuentra las parejas. Escucha la pronunciación al voltear cada palabra.',
    tone: 'plum',
    icon: Brain,
    editor: 'match',
    itemsKey: 'pairs',
    unit: ['pareja', 'parejas'],
    labels: ['Inglés', 'Su pareja'],
    max: 10,
  },
  {
    type: 'hangman',
    group: 'challenge',
    name: 'Ahorcado',
    desc: 'Adivina la palabra letra por letra antes de completar el dibujo. Con pista en español.',
    tone: 'rose',
    icon: PersonStanding,
    editor: 'items',
    itemsKey: 'items',
    unit: ['palabra', 'palabras'],
    min: 3,
    max: 30,
    fields: [
      { key: 'word', label: 'Palabra o expresión', placeholder: 'strawberry', required: true, size: 'sm' },
      { key: 'hint', label: 'Pista', placeholder: 'fresa', size: 'sm' },
    ],
    validateItem: (it, n) => {
      const w = it.word.trim()
      if (w && !/^[a-zA-Z' -]+$/.test(w)) return `La palabra ${n} solo puede tener letras, espacios o guiones (sin tildes).`
      return null
    },
  },
  {
    type: 'crossword',
    group: 'challenge',
    name: 'Crucigrama',
    desc: 'Se arma solo a partir de tus palabras y pistas. Con verificación y ayuda letra por letra.',
    tone: 'teal',
    icon: Puzzle,
    editor: 'items',
    itemsKey: 'items',
    unit: ['palabra', 'palabras'],
    min: 4,
    max: 16,
    fields: [
      { key: 'word', label: 'Palabra', placeholder: 'kitchen', required: true, size: 'sm' },
      { key: 'clue', label: 'Pista', placeholder: 'The room where you cook.', required: true, size: 'lg' },
    ],
    validateItem: (it, n) => {
      const w = it.word.trim()
      if (w && !/^[a-zA-Z]+$/.test(w)) return `La palabra ${n} solo debe tener letras, sin espacios ni tildes.`
      if (w && w.length < 3) return `La palabra ${n} debe tener al menos 3 letras.`
      return null
    },
  },
  {
    type: 'wheel',
    group: 'class',
    name: 'Ruleta de preguntas',
    desc: 'Gira la ruleta, cae una categoría y sale una pregunta. Ideal para speaking con puntos por equipo.',
    tone: 'sun',
    icon: FerrisWheel,
    editor: 'items',
    itemsKey: 'items',
    unit: ['pregunta', 'preguntas'],
    min: 4,
    max: 60,
    settings: [{ key: 'teams', label: 'Equipos (separados por comas; deja vacío para jugar sin puntos)', kind: 'text', placeholder: 'Equipo A, Equipo B' }],
    fields: [
      { key: 'category', label: 'Categoría (máx. 8 distintas)', placeholder: 'Family', required: true, size: 'sm' },
      { key: 'answer', label: 'Respuesta modelo (opcional)', placeholder: 'I have two brothers.', size: 'sm' },
      { key: 'question', label: 'Pregunta', placeholder: 'Do you have brothers or sisters?', required: true, size: 'lg' },
    ],
    validateAll: (items) => {
      const cats = new Set(items.map((i) => i.category.trim().toLowerCase()).filter(Boolean))
      if (cats.size < 2) return 'Usa al menos 2 categorías distintas para que la ruleta tenga sentido.'
      if (cats.size > 8) return 'Usa como máximo 8 categorías distintas.'
      return null
    },
  },
  {
    type: 'bingo',
    group: 'class',
    name: 'Bingo',
    desc: 'El docente canta la pista y cada estudiante marca la palabra en su propio cartón, distinto en cada dispositivo.',
    tone: 'coral',
    icon: Ticket,
    editor: 'items',
    itemsKey: 'items',
    unit: ['palabra', 'palabras'],
    min: 16,
    max: 60,
    fields: [
      { key: 'word', label: 'Palabra en el cartón (inglés)', placeholder: 'seventeen', required: true, size: 'sm' },
      { key: 'clue', label: 'Lo que canta el docente', placeholder: '17', required: true, size: 'sm' },
    ],
  },
  {
    type: 'path',
    group: 'adventure',
    name: 'Mapa de aventura',
    desc: 'Une varias actividades en una ruta con paradas que se desbloquean y estrellas según el desempeño.',
    tone: 'leaf',
    icon: MapIcon,
    editor: 'path',
    itemsKey: 'steps',
    unit: ['parada', 'paradas'],
  },
]

export const groups = [
  { id: 'learn', title: 'Aprender y practicar', desc: 'Para estudiar a su ritmo: lo que se falla se repite hasta dominarlo.' },
  { id: 'challenge', title: 'Retos con puntos', desc: 'Contra reloj, con puntaje y rachas.' },
  { id: 'class', title: 'Para jugar en clase', desc: 'Pensados para proyectar en la sesión sincrónica y jugar por equipos.' },
  { id: 'adventure', title: 'Aventuras', desc: 'Experiencias más largas para cerrar una unidad.' },
]

export const byType = Object.fromEntries(catalog.map((c) => [c.type, c]))

export function itemCount(a) {
  return (a[byType[a.type].itemsKey] ?? []).length
}

export function itemLabel(a) {
  const n = itemCount(a)
  const [one, many] = byType[a.type].unit
  return `${n} ${n === 1 ? one : many}`
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Normaliza una respuesta escrita para compararla sin importar mayúsculas, tildes ni espacios. */
export function norm(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/[.!?¡¿,;:]+$/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function accepted(item) {
  return [item.answer, ...String(item.alternatives ?? '').split(',')].map(norm).filter(Boolean)
}

export function fmtDate(ts) {
  try {
    return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(ts)
  } catch {
    return new Date(ts).toLocaleString()
  }
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
