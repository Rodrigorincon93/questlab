<script>
  import { CheckCheck, Lightbulb, Puzzle } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { fmtTime } from '../catalog.js'
  import { buildCrossword } from '../crossword.js'

  let { activity, onexit, playerName = '' } = $props()

  let phase = $state('intro')
  let name = $state(playerName)
  let cw = $state(null)
  let values = $state({}) // "r,c" -> letra
  let revealed = $state(new Set())
  let wrongCells = $state(new Set())
  let active = $state(null) // { r, c }
  let dir = $state('across')
  let checks = $state(0)
  let elapsed = $state(0)
  let t0 = 0
  const inputs = {}

  const k = (r, c) => `${r},${c}`

  $effect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => (elapsed = (performance.now() - t0) / 1000), 500)
    return () => clearInterval(id)
  })

  const wordsAt = $derived.by(() => {
    const m = new Map()
    if (!cw) return m
    for (const w of cw.words) for (const [r, c] of w.cells) m.set(k(r, c), [...(m.get(k(r, c)) ?? []), w])
    return m
  })
  const current = $derived.by(() => {
    if (!active) return null
    const ws = wordsAt.get(k(active.r, active.c)) ?? []
    return ws.find((w) => w.dir === dir) ?? ws[0] ?? null
  })
  const currentSet = $derived(new Set((current?.cells ?? []).map(([r, c]) => k(r, c))))
  const totalCells = $derived(cw ? cw.grid.flat().filter(Boolean).length : 0)
  const filledOk = $derived(cw ? cw.grid.flat().filter((cell) => cell && values[k(cell.r, cell.c)] === cell.ch).length : 0)

  function start() {
    cw = buildCrossword(activity.items)
    values = {}
    revealed = new Set()
    wrongCells = new Set()
    checks = 0
    elapsed = 0
    t0 = performance.now()
    phase = 'play'
    const first = cw.words.find((w) => w.dir === 'across') ?? cw.words[0]
    setTimeout(() => focusCell(first.cells[0][0], first.cells[0][1], first.dir), 60)
  }

  function focusCell(r, c, d) {
    if (d) dir = d
    active = { r, c }
    inputs[k(r, c)]?.focus()
  }

  function onCellFocus(r, c) {
    if (active && active.r === r && active.c === c) return
    const ws = wordsAt.get(k(r, c)) ?? []
    if (!ws.some((w) => w.dir === dir)) dir = ws[0]?.dir ?? dir
    active = { r, c }
  }

  function onCellClick(r, c) {
    if (active && active.r === r && active.c === c) {
      const ws = wordsAt.get(k(r, c)) ?? []
      if (ws.length > 1) dir = dir === 'across' ? 'down' : 'across'
    }
  }

  function step(r, c, delta) {
    if (!current) return
    const i = current.cells.findIndex(([rr, cc]) => rr === r && cc === c)
    const nxt = current.cells[i + delta]
    if (nxt) focusCell(nxt[0], nxt[1])
  }

  function setLetter(r, c, ch) {
    const kk = k(r, c)
    if (revealed.has(kk)) return
    values[kk] = ch
    if (wrongCells.has(kk)) wrongCells = new Set([...wrongCells].filter((x) => x !== kk))
    checkDone()
  }

  function onKey(e, r, c) {
    if (/^[a-z]$/i.test(e.key)) {
      e.preventDefault()
      setLetter(r, c, e.key.toUpperCase())
      step(r, c, 1)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (values[k(r, c)] && !revealed.has(k(r, c))) setLetter(r, c, '')
      else step(r, c, -1)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const [dr, dc] = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key]
      const nd = dc !== 0 ? 'across' : 'down'
      if (cw.grid[r + dr]?.[c + dc]) focusCell(r + dr, c + dc, (wordsAt.get(k(r + dr, c + dc)) ?? []).some((w) => w.dir === nd) ? nd : undefined)
    }
  }

  // Teclados móviles: algunos no envían keydown con la letra, así que también se escucha input.
  function onInput(e, r, c) {
    const ch = (e.target.value || '').slice(-1).toUpperCase()
    e.target.value = /[A-Z]/.test(ch) && !revealed.has(k(r, c)) ? ch : values[k(r, c)] ?? ''
    if (/[A-Z]/.test(ch)) {
      setLetter(r, c, ch)
      step(r, c, 1)
    }
  }

  function check() {
    checks += 1
    const bad = new Set()
    for (const cell of cw.grid.flat()) if (cell && values[k(cell.r, cell.c)] && values[k(cell.r, cell.c)] !== cell.ch) bad.add(k(cell.r, cell.c))
    wrongCells = bad
  }

  function revealLetter() {
    if (!active) return
    const cell = cw.grid[active.r][active.c]
    values[k(cell.r, cell.c)] = cell.ch
    revealed = new Set([...revealed, k(cell.r, cell.c)])
    step(cell.r, cell.c, 1)
    checkDone()
  }

  function checkDone() {
    if (cw.grid.flat().every((cell) => !cell || values[k(cell.r, cell.c)] === cell.ch)) {
      setTimeout(finish, 300)
    }
  }

  function finish() {
    if (phase !== 'play') return
    phase = 'end'
    const clean = cw.words.filter((w) => !w.cells.some(([r, c]) => revealed.has(k(r, c)))).length
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'crossword',
      student: name.trim(),
      accuracy: Math.round((clean / cw.words.length) * 100),
      detail: `${clean}/${cw.words.length} palabras sin ayuda · ${fmtTime(elapsed)}`,
    })
  }
</script>

<PlayerShell {onexit} wide>
  {#snippet right()}
    {#if phase === 'play'}
      <span class="tabular-nums">{fmtTime(elapsed)}</span>
      <span class="tabular-nums">{Math.round((filledOk / totalCells) * 100)}%</span>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        'Toca una casilla y escribe. Toca otra vez la misma casilla para cambiar entre horizontal y vertical.',
        'También puedes tocar una pista para ir a esa palabra.',
        '«Comprobar» marca en rojo las letras incorrectas; «Revelar letra» ayuda en la casilla activa.',
      ]}
    />
  {:else if phase === 'play' && cw}
    <div class="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        {#if current}
          <div class="mb-4 rounded-2xl bg-teal/20 px-4 py-3 text-sm sm:text-base">
            <span class="font-bold">{current.num} {current.dir === 'across' ? 'Horizontal' : 'Vertical'}:</span> {current.clue}
          </div>
        {/if}
        <div class="mx-auto grid w-fit gap-[3px]" style="grid-template-columns: repeat({cw.cols}, minmax(0, 1fr))">
          {#each cw.grid as row, r}
            {#each row as cell, c}
              {#if cell}
                {@const kk = k(r, c)}
                {@const num = cw.numberOf.get(kk)}
                <div class="relative">
                  {#if num}<span class="pointer-events-none absolute left-0.5 top-0 z-10 text-[9px] font-bold text-ink/60 sm:text-[10px]">{num}</span>{/if}
                  <input
                    bind:this={inputs[kk]}
                    value={values[kk] ?? ''}
                    maxlength="2"
                    autocomplete="off"
                    autocapitalize="characters"
                    spellcheck="false"
                    aria-label="Casilla {r + 1}, {c + 1}"
                    class="block aspect-square w-[min(9vw,2.6rem)] rounded-md text-center font-display text-lg font-bold uppercase caret-transparent outline-none transition sm:text-xl
                      {revealed.has(kk) ? 'bg-sun/80 text-ink' : wrongCells.has(kk) ? 'bg-coral text-white' : active && active.r === r && active.c === c ? 'bg-sun text-ink' : currentSet.has(kk) ? 'bg-[#cdeee5] text-ink' : 'bg-white text-ink'}"
                    onfocus={() => onCellFocus(r, c)}
                    onclick={() => onCellClick(r, c)}
                    onkeydown={(e) => onKey(e, r, c)}
                    oninput={(e) => onInput(e, r, c)}
                  />
                </div>
              {:else}
                <div class="aspect-square w-[min(9vw,2.6rem)]"></div>
              {/if}
            {/each}
          {/each}
        </div>
        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={check}><CheckCheck size={16} /> Comprobar</button>
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15 disabled:opacity-30" disabled={!active} onclick={revealLetter}><Lightbulb size={16} /> Revelar letra</button>
        </div>
        {#if cw.unplaced.length}
          <p class="mt-3 text-center text-xs text-white/40">No cupieron en esta versión: {cw.unplaced.join(', ').toLowerCase()}.</p>
        {/if}
      </div>

      <aside class="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        {#each [['across', 'Horizontales'], ['down', 'Verticales']] as [d, label]}
          <div class="rounded-3xl bg-white/5 p-5">
            <p class="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">{label}</p>
            <ul class="mt-3 space-y-1">
              {#each cw.words.filter((w) => w.dir === d).sort((a, b) => a.num - b.num) as w (w.id)}
                {@const solved = w.cells.every(([r, c]) => values[k(r, c)] === cw.grid[r][c].ch)}
                <li>
                  <button class="w-full rounded-lg px-2 py-1.5 text-left text-sm transition {current?.id === w.id ? 'bg-teal/25' : 'hover:bg-white/8'} {solved ? 'text-white/40 line-through' : ''}" onclick={() => focusCell(w.cells[0][0], w.cells[0][1], w.dir)}>
                    <span class="font-bold">{w.num}.</span> {w.clue}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </aside>
    </div>
  {:else}
    <ResultCard
      {name}
      tone="teal"
      icon={Puzzle}
      title="¡Crucigrama completo!"
      stats={[[fmtTime(elapsed), 'tiempo'], [revealed.size, 'letras reveladas'], [checks, 'comprobaciones']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
