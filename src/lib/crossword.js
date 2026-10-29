import { shuffle } from './catalog.js'

const key = (r, c) => `${r},${c}`

function tryBuild(order) {
  const cells = new Map() // key -> { ch, dirs:Set }
  const placed = []

  const at = (r, c) => cells.get(key(r, c))

  function fits(w, r, c, dir) {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0]
    if (at(r - dr, c - dc) || at(r + dr * w.length, c + dc * w.length)) return -1
    let crossings = 0
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k
      const cc = c + dc * k
      const cell = at(rr, cc)
      if (cell) {
        if (cell.ch !== w[k] || cell.dirs.has(dir)) return -1
        crossings++
      } else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) {
        // No se permiten letras pegadas en paralelo.
        return -1
      }
    }
    return crossings
  }

  function put(entry, r, c, dir) {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0]
    for (let k = 0; k < entry.w.length; k++) {
      const kk = key(r + dr * k, c + dc * k)
      const cell = cells.get(kk) ?? { ch: entry.w[k], dirs: new Set() }
      cell.dirs.add(dir)
      cells.set(kk, cell)
    }
    placed.push({ ...entry, r, c, dir })
  }

  const unplaced = []
  put(order[0], 0, 0, 'across')
  for (const entry of order.slice(1)) {
    let best = null
    for (const p of placed) {
      for (let i = 0; i < p.w.length; i++) {
        for (let j = 0; j < entry.w.length; j++) {
          if (p.w[i] !== entry.w[j]) continue
          const dir = p.dir === 'across' ? 'down' : 'across'
          const r = p.dir === 'across' ? p.r - j : p.r + i
          const c = p.dir === 'across' ? p.c + i : p.c - j
          const n = fits(entry.w, r, c, dir)
          if (n > 0 && (!best || n > best.n || (n === best.n && Math.random() < 0.3))) best = { r, c, dir, n }
        }
      }
    }
    if (best) put(entry, best.r, best.c, best.dir)
    else unplaced.push(entry)
  }

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity
  for (const k of cells.keys()) {
    const [r, c] = k.split(',').map(Number)
    minR = Math.min(minR, r); maxR = Math.max(maxR, r)
    minC = Math.min(minC, c); maxC = Math.max(maxC, c)
  }
  return { placed, unplaced, minR, minC, rows: maxR - minR + 1, cols: maxC - minC + 1 }
}

/** Arma un crucigrama con las entradas { word, clue }. */
export function buildCrossword(entries) {
  const words = entries
    .map((e) => ({ ...e, w: e.word.trim().toUpperCase() }))
    .filter((e) => e.w.length >= 2)
    .sort((a, b) => b.w.length - a.w.length)
  let best = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const order = attempt === 0 ? words : [words[0], ...shuffle(words.slice(1))]
    const res = tryBuild(order)
    const area = res.rows * res.cols
    const score = res.placed.length * 1000 - area - Math.abs(res.rows - res.cols) * 4
    if (!best || score > best.score) best = { ...res, score }
  }

  // Normaliza coordenadas y numera las casillas de inicio en orden de lectura.
  const placed = best.placed.map((p) => ({ ...p, r: p.r - best.minR, c: p.c - best.minC }))
  const starts = [...new Set(placed.map((p) => key(p.r, p.c)))].map((k) => k.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const numberOf = new Map(starts.map(([r, c], i) => [key(r, c), i + 1]))
  const grid = Array.from({ length: best.rows }, () => Array(best.cols).fill(null))
  const words2 = placed.map((p, id) => {
    const [dr, dc] = p.dir === 'across' ? [0, 1] : [1, 0]
    const cells = p.w.split('').map((ch, k) => {
      const r = p.r + dr * k
      const c = p.c + dc * k
      grid[r][c] = { ch, r, c }
      return [r, c]
    })
    return { id, word: p.w, clue: p.clue, dir: p.dir, num: numberOf.get(key(p.r, p.c)), cells }
  })
  return {
    rows: best.rows,
    cols: best.cols,
    grid,
    numberOf,
    words: words2,
    unplaced: best.unplaced.map((u) => u.word),
  }
}
