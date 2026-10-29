<script>
  import { Timer, Flag } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { fmtTime } from '../catalog.js'
  import { generate, lineBetween } from '../wordsearch.js'
  import { speak } from '../speech.js'

  let { activity, onexit, playerName = '' } = $props()

  const palette = ['#f0583a', '#2a72d6', '#12806a', '#6c4bd1', '#d0336a', '#e9a522', '#3f8f2f', '#3d4cc9', '#0e8fa3', '#b4561f', '#8a3fb8', '#2f8f6e', '#c2410c', '#1d4ed8', '#be185d']

  let phase = $state('intro')
  let name = $state(playerName)
  let puzzle = $state(null)
  let found = $state([]) // { word, cells, color }
  let start = $state(null)
  let current = $state(null)
  let pending = $state(null)
  let dragging = $state(false)
  let wrongFlash = $state(false)
  let elapsed = $state(0)
  let gaveUp = $state(false)
  let t0 = 0

  const words = $derived(puzzle ? puzzle.placements.map((p) => p.word).sort() : [])
  const preview = $derived(start && current ? lineBetween(start, current) ?? [start] : pending ? [pending] : [])
  const previewSet = $derived(new Set(preview.map(([r, c]) => `${r},${c}`)))
  const foundMap = $derived.by(() => {
    const m = new Map()
    for (const f of found) for (const [r, c] of f.cells) m.set(`${r},${c}`, f.color)
    return m
  })

  $effect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => (elapsed = (performance.now() - t0) / 1000), 250)
    return () => clearInterval(id)
  })

  function begin() {
    puzzle = generate(activity.words.map((w) => w.word), activity.difficulty)
    found = []
    start = current = pending = null
    gaveUp = false
    elapsed = 0
    t0 = performance.now()
    phase = 'play'
  }

  function cellAt(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-r]')
    return el ? [+el.dataset.r, +el.dataset.c] : null
  }

  function down(e) {
    const cell = cellAt(e)
    if (!cell) return
    e.preventDefault()
    dragging = true
    start = cell
    current = cell
  }

  function move(e) {
    if (!dragging) return
    const cell = cellAt(e)
    if (cell && lineBetween(start, cell)) current = cell
  }

  function up(e) {
    if (!dragging) return
    dragging = false
    const cell = cellAt(e) ?? current
    const same = cell && start && cell[0] === start[0] && cell[1] === start[1]
    if (same) {
      // Modo clic: primer toque marca el inicio, el segundo el final.
      if (pending && !(pending[0] === cell[0] && pending[1] === cell[1])) {
        evaluate(pending, cell)
        pending = null
      } else {
        pending = pending ? null : cell
      }
    } else if (cell) {
      pending = null
      evaluate(start, cell)
    }
    start = current = null
  }

  function evaluate(a, b) {
    const cells = lineBetween(a, b)
    if (!cells || cells.length < 2) return
    const str = cells.map(([r, c]) => puzzle.grid[r][c]).join('')
    const rev = [...str].reverse().join('')
    const hit = puzzle.placements.find((p) => (p.word === str || p.word === rev) && !found.some((f) => f.word === p.word))
    if (hit) {
      found = [...found, { word: hit.word, cells, color: palette[found.length % palette.length] }]
      speak(hit.word.toLowerCase())
      if (found.length === puzzle.placements.length) finish()
    } else {
      wrongFlash = true
      setTimeout(() => (wrongFlash = false), 350)
    }
  }

  function giveUp() {
    gaveUp = true
    const missing = puzzle.placements.filter((p) => !found.some((f) => f.word === p.word))
    found = [...found, ...missing.map((p) => ({ word: p.word, cells: p.cells, color: '#9aa0a6', missed: true }))]
    finish()
  }

  function finish() {
    phase = 'end'
    elapsed = (performance.now() - t0) / 1000
    const got = found.filter((f) => !f.missed).length
    const total = puzzle.placements.length
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'search',
      student: name.trim(),
      accuracy: Math.round((got / total) * 100),
      detail: `${got}/${total} palabras · ${fmtTime(elapsed)}`,
    })
  }
</script>

<PlayerShell {onexit} wide>
  {#snippet right()}
    {#if phase === 'play' || phase === 'end'}
      <span class="inline-flex items-center gap-1.5 tabular-nums"><Timer size={16} /> {fmtTime(elapsed)}</span>
      <span class="tabular-nums">{found.filter((f) => !f.missed).length}/{words.length}</span>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={begin}
      rules={[
        'Arrastra sobre las letras para marcar una palabra.',
        'También puedes tocar la primera letra y luego la última.',
        activity.difficulty === 'dificil' ? 'Las palabras pueden estar al revés.' : 'Las palabras van hacia la derecha, hacia abajo o en diagonal.',
        'Cada sopa se genera al azar: puedes jugarla varias veces.',
      ]}
    />
  {:else if puzzle}
    <div class="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1fr_16rem]">
      <div
        class="mx-auto grid w-full max-w-[min(92vw,640px)] select-none gap-1 rounded-3xl bg-white/5 p-2 sm:p-3 {wrongFlash ? 'shake' : ''}"
        style="grid-template-columns: repeat({puzzle.size}, minmax(0, 1fr)); touch-action: none"
        role="application"
        aria-label="Sopa de letras"
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointerleave={(e) => dragging && up(e)}
      >
        {#each puzzle.grid as row, r}
          {#each row as ch, c}
            {@const key = `${r},${c}`}
            {@const color = foundMap.get(key)}
            <div
              data-r={r}
              data-c={c}
              class="grid aspect-square place-items-center rounded-md font-display text-[clamp(0.8rem,2.6vw,1.35rem)] font-bold transition-colors
                {previewSet.has(key) ? 'bg-sun text-ink' : color ? 'text-white' : 'bg-white/8 text-white/90'}"
              style={color && !previewSet.has(key) ? `background:${color}` : ''}
            >
              {ch}
            </div>
          {/each}
        {/each}
      </div>

      <aside class="rounded-3xl bg-white/5 p-5">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">Palabras</p>
        <ul class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 lg:grid-cols-1">
          {#each words as w}
            {@const f = found.find((x) => x.word === w)}
            <li class="flex items-center gap-2 font-semibold {f ? (f.missed ? 'text-white/40' : 'text-white/50 line-through') : ''}">
              <span class="h-2.5 w-2.5 rounded-full" style="background:{f ? f.color : 'rgba(255,255,255,.25)'}"></span>
              {w.toLowerCase()}
            </li>
          {/each}
        </ul>
        {#if phase === 'play'}
          <button class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={giveUp}><Flag size={15} /> Me rindo</button>
        {/if}
      </aside>
    </div>

    {#if phase === 'end'}
      {@const got = found.filter((f) => !f.missed).length}
      <ResultCard
        {name}
        tone="leaf"
        title={gaveUp ? 'Buen intento' : '¡Sopa resuelta!'}
        subtitle={gaveUp ? 'Las palabras que faltaban quedaron marcadas en gris.' : ''}
        stats={[[`${got}/${words.length}`, 'palabras'], [fmtTime(elapsed), 'tiempo']]}
        onreplay={begin}
        {onexit}
      />
    {/if}
  {/if}
</PlayerShell>
