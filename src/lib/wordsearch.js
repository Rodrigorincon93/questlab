const EASY = [
  [0, 1],
  [1, 0],
  [1, 1],
]
const HARD = [...EASY, [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]]
const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVWY'

function rand(n) {
  return Math.floor(Math.random() * n)
}

/** Genera una sopa de letras. Devuelve { size, grid, placements }. */
export function generate(rawWords, difficulty = 'facil') {
  const words = [...new Set(rawWords.map((w) => w.trim().toUpperCase()).filter(Boolean))].sort((a, b) => b.length - a.length)
  const dirs = difficulty === 'dificil' ? HARD : EASY
  const letters = words.reduce((s, w) => s + w.length, 0)
  let size = Math.min(15, Math.max(8, words[0]?.length + 1 || 8, Math.ceil(Math.sqrt(letters * 2.4))))

  for (let attempt = 0; attempt < 60; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(''))
    const placements = []
    let ok = true
    for (const word of words) {
      let placed = false
      for (let k = 0; k < 400 && !placed; k++) {
        const [dr, dc] = dirs[rand(dirs.length)]
        const r0 = rand(size)
        const c0 = rand(size)
        const rEnd = r0 + dr * (word.length - 1)
        const cEnd = c0 + dc * (word.length - 1)
        if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue
        const cells = []
        let fits = true
        for (let i = 0; i < word.length; i++) {
          const r = r0 + dr * i
          const c = c0 + dc * i
          if (grid[r][c] && grid[r][c] !== word[i]) {
            fits = false
            break
          }
          cells.push([r, c])
        }
        if (!fits) continue
        cells.forEach(([r, c], i) => (grid[r][c] = word[i]))
        placements.push({ word, cells })
        placed = true
      }
      if (!placed) {
        ok = false
        break
      }
    }
    if (ok) {
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = ALPHABET[rand(ALPHABET.length)]
      return { size, grid, placements }
    }
    if (attempt % 10 === 9 && size < 15) size += 1
  }
  throw new Error('No se pudo generar la sopa de letras')
}

/** Celdas en línea recta entre a y b, o null si no están alineadas. */
export function lineBetween([r1, c1], [r2, c2]) {
  const dr = r2 - r1
  const dc = c2 - c1
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  const steps = Math.max(Math.abs(dr), Math.abs(dc))
  const sr = Math.sign(dr)
  const sc = Math.sign(dc)
  return Array.from({ length: steps + 1 }, (_, i) => [r1 + sr * i, c1 + sc * i])
}
