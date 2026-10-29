const now = Date.now()

export function blankQuiz() {
  return {
    type: 'quiz',
    title: '',
    description: '',
    timeLimit: 20,
    questions: [{ text: '', options: ['', '', '', ''], correct: 0 }],
  }
}

export function blankMatch() {
  return {
    type: 'match',
    title: '',
    description: '',
    pairs: [
      { term: '', match: '' },
      { term: '', match: '' },
      { term: '', match: '' },
    ],
  }
}

export function exampleQuiz() {
  return {
    type: 'quiz',
    title: 'Daily routines',
    description: 'Presente simple con rutinas diarias (A1).',
    timeLimit: 20,
    questions: [
      { text: 'She ___ up at 6 a.m. every day.', options: ['wake', 'wakes', 'waking', 'woke'], correct: 1 },
      { text: 'What time ___ you have breakfast?', options: ['does', 'is', 'do', 'are'], correct: 2 },
      { text: 'I ___ to work by bus.', options: ['go', 'goes', 'going', 'am go'], correct: 0 },
      { text: 'He ___ TV in the evening.', options: ['watch', 'watchs', 'watching', 'watches'], correct: 3 },
      { text: 'Which word is a day of the week?', options: ['March', 'Monday', 'Morning', 'Month'], correct: 1 },
      { text: 'The opposite of "early" is…', options: ['soon', 'fast', 'late', 'never'], correct: 2 },
    ],
  }
}

export function exampleMatch() {
  return {
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
  }
}

export function sampleActivities() {
  return [
    { ...exampleQuiz(), id: 'sample-quiz', createdAt: now, updatedAt: now },
    { ...exampleMatch(), id: 'sample-match', createdAt: now, updatedAt: now },
  ]
}
