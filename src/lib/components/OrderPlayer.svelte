<script>
  import { Check, Eye, Volume2, RotateCcw } from '@lucide/svelte'
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
  let chips = $state([])
  let placed = $state([])
  let status = $state('idle') // idle | wrong | right | revealed
  let attempts = $state(0)
  let failed = $state(new Set())
  let solved = $state(0)
  let errors = $state(0)

  const total = $derived(activity.sentences.length)
  const item = $derived(queue[0])
  const words = $derived(item ? item.text.trim().split(/\s+/) : [])
  const done = $derived(status === 'right' || status === 'revealed')

  function load() {
    const tokens = words.map((w, id) => ({ w, id }))
    let s = tokens
    for (let k = 0; k < 10; k++) {
      s = shuffle(tokens)
      if (s.map((t) => t.w).join(' ') !== item.text.trim()) break
    }
    chips = s
    placed = []
    status = 'idle'
    attempts = 0
  }

  function start() {
    queue = shuffle(activity.sentences.map((it, id) => ({ ...it, id })))
    failed = new Set()
    solved = 0
    errors = 0
    phase = 'play'
    load()
  }

  function place(id) {
    if (done || placed.includes(id)) return
    placed = [...placed, id]
    status = 'idle'
  }

  function unplace(id) {
    if (done) return
    placed = placed.filter((x) => x !== id)
    status = 'idle'
  }

  function wordOf(id) {
    return chips.find((c) => c.id === id).w
  }

  function check() {
    const attempt = placed.map(wordOf)
    if (attempt.join(' ') === words.join(' ')) {
      status = 'right'
      speak(item.text)
    } else {
      status = 'wrong'
      attempts += 1
      errors += 1
      failed = new Set([...failed, item.id])
    }
  }

  function reveal() {
    failed = new Set([...failed, item.id])
    const pool = [...chips]
    placed = words.map((w) => pool.splice(pool.findIndex((c) => c.w === w), 1)[0].id)
    status = 'revealed'
    speak(item.text)
  }

  function next() {
    const [cur, ...rest] = queue
    if (status === 'revealed') queue = [...rest, cur]
    else {
      solved += 1
      queue = rest
    }
    if (!queue.length) return finish()
    load()
  }

  function finish() {
    phase = 'end'
    const clean = total - failed.size
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'order',
      student: name.trim(),
      accuracy: Math.round((clean / total) * 100),
      detail: `${clean}/${total} al primer intento · ${errors} error${errors === 1 ? '' : 'es'}`,
    })
  }

  function onkey(e) {
    if (phase !== 'play') return
    if (e.key === 'Enter') {
      if (done) next()
      else if (placed.length === words.length) check()
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}<span class="tabular-nums">{solved}/{total} oraciones</span>{/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        'Toca las palabras en el orden correcto para formar la oración.',
        'Toca una palabra de tu oración para devolverla.',
        'Si fallas, verás en verde las palabras que ya están en su lugar.',
      ]}
    />
  {:else if phase === 'play' && item}
    <div class="mx-auto max-w-3xl">
      <div class="h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-plum transition-all" style="width:{(solved / total) * 100}%"></div>
      </div>
      {#if item.translation}
        <p class="mt-8 text-center text-white/70">«{item.translation}»</p>
      {/if}

      <!-- Línea de respuesta -->
      <div class="mt-6 flex min-h-24 flex-wrap content-start items-start justify-center gap-2 rounded-3xl border-2 p-4 {status === 'right' ? 'border-[#5fe0bf] bg-teal/15' : status === 'wrong' ? 'shake border-coral/70 bg-coral/10' : status === 'revealed' ? 'border-sun bg-sun/10' : 'border-dashed border-white/20'}">
        {#if !placed.length}<p class="self-center text-white/40">Tu oración aparecerá aquí</p>{/if}
        {#each placed as id, i (id)}
          {@const ok = status === 'wrong' && wordOf(id) === words[i]}
          <button
            class="rise rounded-xl px-4 py-2.5 text-lg font-semibold transition {status === 'wrong' ? (ok ? 'bg-teal text-white' : 'bg-coral/80 text-white') : 'bg-white text-ink'}"
            onclick={() => unplace(id)}
          >
            {wordOf(id)}
          </button>
        {/each}
      </div>

      <!-- Banco de palabras -->
      <div class="mt-8 flex flex-wrap justify-center gap-2">
        {#each chips as c (c.id)}
          <button
            class="rounded-xl bg-plum px-4 py-2.5 text-lg font-semibold shadow-[0_4px_0_#43309a] transition active:translate-y-1 active:shadow-none disabled:invisible"
            disabled={placed.includes(c.id)}
            onclick={() => place(c.id)}
          >
            {c.w}
          </button>
        {/each}
      </div>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-2">
        {#if done}
          <p class="rise w-full text-center font-display text-xl font-bold {status === 'right' ? 'text-[#5fe0bf]' : 'text-sun'}">
            {status === 'right' ? (attempts === 0 ? '¡Perfecto!' : '¡Lo lograste!') : 'Así va la oración. La practicarás otra vez al final.'}
          </p>
          {#if canSpeak}<button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15" onclick={() => speak(item.text)}><Volume2 size={17} /> Escuchar</button>{/if}
          <button class="rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90" onclick={next}>Siguiente</button>
        {:else}
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-30" disabled={!placed.length} onclick={() => { placed = []; status = 'idle' }}><RotateCcw size={16} /> Reiniciar</button>
          <button class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90 disabled:opacity-40" disabled={placed.length !== words.length} onclick={check}><Check size={17} strokeWidth={3} /> Comprobar</button>
          {#if attempts >= 2}
            <button class="rise inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15" onclick={reveal}><Eye size={17} /> Ver respuesta</button>
          {/if}
        {/if}
      </div>
    </div>
  {:else}
    {@const clean = total - failed.size}
    <ResultCard
      {name}
      tone="plum"
      title="¡Oraciones completas!"
      stats={[[`${clean}/${total}`, 'al primer intento'], [errors, 'errores'], [`${Math.round((clean / total) * 100)}%`, 'aciertos']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
