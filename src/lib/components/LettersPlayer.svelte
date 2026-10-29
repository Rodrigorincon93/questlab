<script>
  import { Lightbulb, Delete, Check, Shuffle, Volume2, Eye } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle } from '../catalog.js'
  import { speak, canSpeak } from '../speech.js'

  let { activity, onexit } = $props()

  let phase = $state('intro')
  let name = $state('')
  let queue = $state([])
  let tiles = $state([])
  let picked = $state([]) // ids de fichas en orden
  let status = $state('idle') // idle | wrong | right | revealed
  let attempts = $state(0)
  let hintLevel = $state(0)
  let failed = $state(new Set())
  let solved = $state(0)
  let errors = $state(0)

  const total = $derived(activity.items.length)
  const item = $derived(queue[0])
  const target = $derived(item ? item.word.trim().toLowerCase() : '')
  const built = $derived(picked.map((id) => tiles.find((t) => t.id === id).ch).join(''))
  const parts = $derived(item?.sentence?.includes('___') ? item.sentence.split('___') : null)

  function scramble(word) {
    const letters = word.split('')
    let s = letters
    for (let k = 0; k < 10; k++) {
      s = shuffle(letters)
      if (s.join('') !== word) break
    }
    return s.map((ch, id) => ({ ch, id }))
  }

  function load() {
    tiles = scramble(target)
    picked = []
    status = 'idle'
    attempts = 0
    hintLevel = 0
  }

  function start() {
    queue = shuffle(activity.items.map((it, id) => ({ ...it, id })))
    failed = new Set()
    solved = 0
    errors = 0
    phase = 'play'
    load()
  }

  function tap(id) {
    if (status === 'right' || status === 'revealed') return
    if (picked.includes(id)) return
    picked = [...picked, id]
    status = 'idle'
    if (picked.length === target.length) check()
  }

  function untap(idx) {
    if (status === 'right' || status === 'revealed') return
    // Si se reveló la primera letra como pista, esa no se puede quitar.
    if (hintLevel >= 2 && idx === 0) return
    picked = picked.filter((_, i) => i !== idx)
    status = 'idle'
  }

  function backspace() {
    if (picked.length) untap(picked.length - 1)
  }

  function check() {
    if (built === target) {
      status = 'right'
      speak(item.sentence?.includes('___') ? item.sentence.replace('___', item.word) : item.word)
    } else {
      status = 'wrong'
      attempts += 1
      errors += 1
      failed = new Set([...failed, item.id])
    }
  }

  function hint() {
    if (hintLevel === 0 && item.hint) {
      hintLevel = 1
    } else if (hintLevel < 2) {
      hintLevel = 2
      failed = new Set([...failed, item.id])
      const first = tiles.find((t) => t.ch === target[0])
      picked = [first.id]
      status = 'idle'
    }
  }

  function reveal() {
    failed = new Set([...failed, item.id])
    const remaining = [...tiles]
    picked = target.split('').map((ch) => {
      const i = remaining.findIndex((t) => t.ch === ch)
      return remaining.splice(i, 1)[0].id
    })
    status = 'revealed'
    speak(item.word)
  }

  function next() {
    const [cur, ...rest] = queue
    if (status === 'revealed') {
      // Vuelve al final para intentarla de nuevo.
      queue = [...rest, cur]
    } else {
      solved += 1
      queue = rest
    }
    if (queue.length === 0) return finish()
    load()
  }

  function finish() {
    phase = 'end'
    const clean = total - failed.size
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'letters',
      student: name.trim(),
      accuracy: Math.round((clean / total) * 100),
      detail: `${clean}/${total} sin ayuda · ${errors} error${errors === 1 ? '' : 'es'}`,
    })
  }

  function onkey(e) {
    if (phase !== 'play') return
    if (e.key === 'Backspace') {
      e.preventDefault()
      backspace()
    } else if (e.key === 'Enter' && (status === 'right' || status === 'revealed')) next()
    else if (/^[a-z]$/i.test(e.key)) {
      const free = tiles.find((t) => t.ch === e.key.toLowerCase() && !picked.includes(t.id))
      if (free) tap(free.id)
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}<span class="tabular-nums">{solved}/{total} resueltas</span>{/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        'Toca las letras en orden para formar la palabra que falta.',
        'Toca una letra colocada para devolverla.',
        'Puedes pedir una pista. Si la revelas, la palabra volverá al final.',
        'También puedes escribir con el teclado.',
      ]}
    />
  {:else if phase === 'play' && item}
    <div class="mx-auto max-w-3xl text-center">
      <div class="h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-sun transition-all" style="width:{(solved / total) * 100}%"></div>
      </div>

      <p class="mt-10 font-display text-2xl font-bold leading-relaxed sm:text-4xl">
        {#if parts}
          {parts[0]}<span class="mx-1 inline-block min-w-24 border-b-4 align-baseline {status === 'right' ? 'border-[#5fe0bf] text-[#5fe0bf]' : 'border-sun text-sun'}">{status === 'right' || status === 'revealed' ? item.word : '?'}</span>{parts.slice(1).join('___')}
        {:else}
          Forma la palabra
        {/if}
      </p>
      {#if hintLevel >= 1 && item.hint}
        <p class="rise mt-3 text-sun">Pista: {item.hint}</p>
      {/if}

      <!-- Casillas de la respuesta -->
      <div class="mt-10 flex flex-wrap justify-center gap-2 {status === 'wrong' ? 'shake' : ''}">
        {#each target.split('') as _, i}
          {@const id = picked[i]}
          <button
            class="grid h-14 w-12 place-items-center rounded-xl border-2 font-display text-2xl font-bold uppercase transition sm:h-16 sm:w-14
              {status === 'right' ? 'border-[#5fe0bf] bg-teal/30' : status === 'wrong' ? 'border-coral bg-coral/20' : status === 'revealed' ? 'border-sun bg-sun/15' : id !== undefined ? 'border-white/40 bg-white/10' : 'border-dashed border-white/25'}"
            onclick={() => id !== undefined && untap(i)}
            aria-label={id !== undefined ? 'Quitar letra' : 'Casilla vacía'}
          >
            {id !== undefined ? tiles.find((t) => t.id === id).ch : ''}
          </button>
        {/each}
      </div>

      <!-- Fichas disponibles -->
      <div class="mt-8 flex flex-wrap justify-center gap-2">
        {#each tiles as tl (tl.id)}
          <button
            class="grid h-14 w-12 place-items-center rounded-xl bg-sun font-display text-2xl font-bold uppercase text-ink shadow-[0_4px_0_#a8720a] transition active:translate-y-1 active:shadow-none disabled:opacity-0 sm:h-16 sm:w-14"
            disabled={picked.includes(tl.id) || status === 'right' || status === 'revealed'}
            onclick={() => tap(tl.id)}
          >
            {tl.ch}
          </button>
        {/each}
      </div>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-2">
        {#if status === 'right' || status === 'revealed'}
          <p class="rise w-full font-display text-xl font-bold {status === 'right' ? 'text-[#5fe0bf]' : 'text-sun'}">
            {status === 'right' ? (attempts === 0 && hintLevel === 0 ? '¡Perfecto!' : '¡Bien!') : `Era «${item.word}». La verás otra vez al final.`}
          </p>
          {#if canSpeak}
            <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15" onclick={() => speak(item.word)}><Volume2 size={17} /> Escuchar</button>
          {/if}
          <button class="rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90" onclick={next}>Siguiente</button>
        {:else}
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-30" disabled={!picked.length} onclick={backspace}><Delete size={17} /> Borrar</button>
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15" onclick={() => { tiles = shuffle(tiles) }}><Shuffle size={17} /> Mezclar</button>
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-30" disabled={hintLevel >= 2} onclick={hint}>
            <Lightbulb size={17} /> {hintLevel === 0 && item.hint ? 'Pista' : 'Primera letra'}
          </button>
          {#if attempts >= 2}
            <button class="rise inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15" onclick={reveal}><Eye size={17} /> Ver respuesta</button>
          {/if}
          {#if status === 'wrong'}<p class="w-full text-coral">Esa no es. Toca las letras para corregir.</p>{/if}
        {/if}
      </div>
    </div>
  {:else}
    {@const clean = total - failed.size}
    <ResultCard
      {name}
      tone="sun"
      title="¡Todas las palabras listas!"
      stats={[[`${clean}/${total}`, 'sin ayuda'], [errors, 'errores'], [`${Math.round((clean / total) * 100)}%`, 'aciertos']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
