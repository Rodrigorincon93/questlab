// Plantillas vacías y ejemplos de nivel A1 para cada tipo de actividad.

export const blanks = {
  quiz: () => ({ type: 'quiz', title: '', description: '', timeLimit: 20, questions: [{ text: '', options: ['', '', '', ''], correct: 0 }] }),
  board: () => ({
    type: 'board',
    title: '',
    description: '',
    teams: 'Equipo Rojo, Equipo Azul',
    boardLength: 24,
    questions: [{ text: '', options: ['', '', '', ''], correct: 0 }],
  }),
  match: () => ({ type: 'match', title: '', description: '', pairs: [{ term: '', match: '' }, { term: '', match: '' }, { term: '', match: '' }] }),
  flash: () => ({ type: 'flash', title: '', description: '', cards: [{ front: '', back: '', example: '' }] }),
  letters: () => ({ type: 'letters', title: '', description: '', items: [{ word: '', sentence: '', hint: '' }] }),
  order: () => ({ type: 'order', title: '', description: '', sentences: [{ text: '', translation: '' }] }),
  fill: () => ({ type: 'fill', title: '', description: '', items: [{ sentence: '', answer: '', alternatives: '', hint: '' }] }),
  search: () => ({ type: 'search', title: '', description: '', difficulty: 'facil', words: [{ word: '' }] }),
  escape: () => ({ type: 'escape', title: '', description: '', story: '', minutes: 10, levels: [{ clue: '', question: '', answer: '', alternatives: '', hint: '' }] }),
}

const quizQuestions = [
  { text: 'She ___ up at 6 a.m. every day.', options: ['wake', 'wakes', 'waking', 'woke'], correct: 1 },
  { text: 'What time ___ you have breakfast?', options: ['does', 'is', 'do', 'are'], correct: 2 },
  { text: 'I ___ to work by bus.', options: ['go', 'goes', 'going', 'am go'], correct: 0 },
  { text: 'He ___ TV in the evening.', options: ['watch', 'watchs', 'watching', 'watches'], correct: 3 },
  { text: 'Which word is a day of the week?', options: ['March', 'Monday', 'Morning', 'Month'], correct: 1 },
  { text: 'The opposite of "early" is…', options: ['soon', 'fast', 'late', 'never'], correct: 2 },
]

export const examples = {
  quiz: () => ({
    type: 'quiz',
    title: 'Daily routines',
    description: 'Presente simple con rutinas diarias (A1).',
    timeLimit: 20,
    questions: structuredClone(quizQuestions),
  }),
  board: () => ({
    type: 'board',
    title: 'Gran carrera A1',
    description: 'Repaso general por equipos: verbo to be, presente simple y vocabulario.',
    teams: 'Equipo Rojo, Equipo Azul, Equipo Verde',
    boardLength: 24,
    questions: [
      ...structuredClone(quizQuestions),
      { text: 'They ___ from Ecuador.', options: ['is', 'am', 'are', 'be'], correct: 2 },
      { text: 'How do you say "manzana" in English?', options: ['orange', 'apple', 'grape', 'pear'], correct: 1 },
      { text: 'Choose the correct question.', options: ['Where you live?', 'Where do you live?', 'Where does you live?', 'Where you do live?'], correct: 1 },
      { text: 'My sister ___ two cats.', options: ['have', 'has', 'haves', 'having'], correct: 1 },
      { text: 'What color is the sky on a sunny day?', options: ['green', 'blue', 'brown', 'pink'], correct: 1 },
      { text: 'Twelve + eight = …', options: ['eighteen', 'twenty', 'twelve', 'thirty'], correct: 1 },
      { text: 'Which one is a job?', options: ['kitchen', 'nurse', 'Tuesday', 'happy'], correct: 1 },
      { text: '___ is your name?', options: ['Who', 'What', 'Where', 'When'], correct: 1 },
    ],
  }),
  match: () => ({
    type: 'match',
    title: 'Jobs and places',
    description: 'Relaciona cada profesión con su lugar de trabajo (A1).',
    pairs: [
      { term: 'teacher', match: 'school' },
      { term: 'doctor', match: 'hospital' },
      { term: 'chef', match: 'restaurant' },
      { term: 'pilot', match: 'airplane' },
      { term: 'farmer', match: 'farm' },
      { term: 'librarian', match: 'library' },
    ],
  }),
  flash: () => ({
    type: 'flash',
    title: 'Family members',
    description: 'Vocabulario de la familia con audio y ejemplos.',
    cards: [
      { front: 'mother', back: 'madre', example: 'My mother is a nurse.' },
      { front: 'father', back: 'padre', example: 'My father cooks on Sundays.' },
      { front: 'sister', back: 'hermana', example: 'I have one sister.' },
      { front: 'brother', back: 'hermano', example: 'My brother plays football.' },
      { front: 'grandmother', back: 'abuela', example: 'My grandmother lives in Jipijapa.' },
      { front: 'uncle', back: 'tío', example: 'My uncle has a big car.' },
      { front: 'aunt', back: 'tía', example: 'My aunt is very funny.' },
      { front: 'cousin', back: 'primo / prima', example: 'My cousins are students.' },
    ],
  }),
  letters: () => ({
    type: 'letters',
    title: 'Classroom objects',
    description: 'Ordena las letras para completar cada oración.',
    items: [
      { word: 'pencil', sentence: 'I write with a ___.', hint: 'lápiz' },
      { word: 'book', sentence: 'Open your ___ on page ten.', hint: 'libro' },
      { word: 'chair', sentence: 'Sit on the ___, please.', hint: 'silla' },
      { word: 'window', sentence: 'Close the ___. It is cold.', hint: 'ventana' },
      { word: 'teacher', sentence: 'The ___ is in the classroom.', hint: 'docente' },
      { word: 'eraser', sentence: 'Can I borrow your ___?', hint: 'borrador' },
    ],
  }),
  order: () => ({
    type: 'order',
    title: 'Simple present sentences',
    description: 'Ordena las palabras para formar oraciones correctas.',
    sentences: [
      { text: 'She drinks coffee every morning.', translation: 'Ella toma café cada mañana.' },
      { text: 'I do not like vegetables.', translation: 'No me gustan las verduras.' },
      { text: 'Where do you live?', translation: '¿Dónde vives?' },
      { text: 'My brother plays football on Sundays.', translation: 'Mi hermano juega fútbol los domingos.' },
      { text: 'They go to school by bus.', translation: 'Ellos van a la escuela en bus.' },
    ],
  }),
  fill: () => ({
    type: 'fill',
    title: 'Verb to be',
    description: 'Escribe la forma correcta del verbo to be.',
    items: [
      { sentence: 'I ___ a student.', answer: 'am', alternatives: "'m", hint: 'yo' },
      { sentence: 'They ___ from Ecuador.', answer: 'are', alternatives: "'re", hint: 'ellos' },
      { sentence: 'She ___ my sister.', answer: 'is', alternatives: "'s", hint: 'ella' },
      { sentence: 'We ___ not tired.', answer: 'are', alternatives: '', hint: 'nosotros' },
      { sentence: '___ you happy?', answer: 'Are', alternatives: '', hint: 'pregunta con you' },
      { sentence: 'It ___ cold today.', answer: 'is', alternatives: "'s", hint: 'el clima' },
    ],
  }),
  search: () => ({
    type: 'search',
    title: 'Animals',
    description: 'Encuentra los nombres de animales en la sopa de letras.',
    difficulty: 'facil',
    words: ['cat', 'dog', 'bird', 'fish', 'horse', 'cow', 'duck', 'lion', 'tiger', 'rabbit'].map((word) => ({ word })),
  }),
  escape: () => ({
    type: 'escape',
    title: 'Escape from the library',
    description: 'Escape room de repaso general A1.',
    story:
      'Te quedaste dormido leyendo y la biblioteca cerró. Las puertas tienen candados con acertijos en inglés. Resuelve cada uno para conseguir un dígito del código de salida antes de que se acabe el tiempo.',
    minutes: 8,
    levels: [
      { clue: 'En la primera puerta hay un letrero: «Do not ___ this door».', question: 'What is the opposite of "close"?', answer: 'open', alternatives: '', hint: 'Lo contrario de cerrar.' },
      { clue: 'Sobre la mesa hay una nota escrita a mano.', question: 'Complete: There ___ five books on the table.', answer: 'are', alternatives: '', hint: 'Plural del verbo to be.' },
      { clue: 'Un candado tiene letras desordenadas: R-E-T-A-W.', question: 'Unscramble the word: RETAW', answer: 'water', alternatives: '', hint: 'Lo bebes cuando tienes sed.' },
      { clue: 'El calendario de la pared está roto.', question: 'What day comes after Monday?', answer: 'Tuesday', alternatives: '', hint: 'Empieza con T.' },
      { clue: 'La última puerta pregunta dónde estás.', question: 'How do you say "biblioteca" in English?', answer: 'library', alternatives: '', hint: 'No es «bookstore».' },
    ],
  }),
}

// Actividades de muestra. Cada una tiene un id fijo para poder sembrarlas
// una sola vez aunque el docente luego las elimine.
export const sampleIds = {
  quiz: 'sample-quiz',
  match: 'sample-match',
  flash: 'sample-flash',
  letters: 'sample-letters',
  order: 'sample-order',
  fill: 'sample-fill',
  search: 'sample-search',
  escape: 'sample-escape',
  board: 'sample-board',
}

export function sampleActivity(type) {
  const now = Date.now()
  return { ...examples[type](), id: sampleIds[type], createdAt: now, updatedAt: now }
}
