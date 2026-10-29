<script>
  import { Heart, Lightbulb, PersonStanding } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle } from '../catalog.js'
  import { speak } from '../speech.js'

  let { activity, onexit, playerName = '' } = $props()

  const MAX = 6
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

  let phase = $state('intro')
  let name = $state(playerName)
  let order = $state([])
  let idx = $state(0)
  let guessed = $state(new Set())
  let misses = $state(0)
  let showHint = $state(false)
  let status = $state('play') // play | won | lost
  let wins = $state(0)
  let totalMisses = $state(0)

  const item = $derived(order[idx])
  const word = $derived(item ? item.word.trim().toUpperCase() : '')
  const letters = $derived(new Set(word.replace(/[^A-Z]/g, '').split('')))
  const total = $derived(activity.items.length)

  function start() {
    order = shuffle(activity.items)
    idx = 0
    wins = 0
    totalMisses = 0
    phase = 'play'
    load()
  }

  function load() {
    guessed = new Set()
    misses = 0
    showHint = false
    status = 'play'
  }

  function guess(ch) {
    if (status !== 'play' || guessed.has(ch)) return
    guessed = new Set([...guessed, ch])
    if (!letters.has(ch)) {
      misses += 1
      totalMisses += 1
      if (misses >= MAX) {
        status = 'lost'
        speak(item.word)
      }
    } else if ([...letters].every((l) => guessed.has(l))) {
      status = 'won'
      wins += 1
      speak(item.word)
    }
  }

  function next() {
    if (idx < total - 1) {
      idx += 1
      load()
    } else {
      phase = 'end'
      addResult({
        activityId: activity.id,
        activityTitle: activity.title,
        type: 'hangman',
        student: name.trim(),
        accuracy: Math.round((wins / total) * 100),
        detail: `${wins}/${total} palabras · ${totalMisses} letra${totalMisses === 1 ? '' : 's'} fallida${totalMisses === 1 ? '' : 's'}`,
      })
    }
  }

  function onkey(e) {
    if (phase !== 'play') return
    if (status !== 'play' && e.key === 'Enter') return next()
    if (/^[a-z]$/i.test(e.key)) guess(e.key.toUpperCase())
  }
</script>

<svelte:window onkeydown={onkey} />

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}
      <span class="tabular-nums">Palabra {idx + 1}/{total}</span>
      <span class="inline-flex items-center gap-1 tabular-nums text-coral"><Heart size={16} fill="currentColor" /> {MAX - misses}</span>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[`Adivina la palabra eligiendo letras. Tienes ${MAX} vidas por palabra.`, 'Puedes ver una pista en español.', 'También puedes usar el teclado.']}
    />
  {:else if phase === 'play' && item}
    <div class="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-[16rem_1fr]">
      <svg viewBox="0 0 200 220" class="mx-auto w-48 md:w-full" aria-label="{misses} de {MAX} fallos">
        <g stroke="rgba(255,255,255,.35)" stroke-width="6" stroke-linecap="round" fill="none">
          <path d="M20 210 H120 M50 210 V20 H140 V45" />
        </g>
        <g stroke="#f0583a" stroke-width="6" stroke-linecap="round" fill="none">
          {#if misses > 0}<circle class="pop" cx="140" cy="65" r="20" />{/if}
          {#if misses > 1}<path class="pop" d="M140 85 V140" />{/if}
          {#if misses > 2}<path class="pop" d="M140 100 L115 122" />{/if}
          {#if misses > 3}<path class="pop" d="M140 100 L165 122" />{/if}
          {#if misses > 4}<path class="pop" d="M140 140 L118 175" />{/if}
          {#if misses > 5}<path class="pop" d="M140 140 L162 175" />{/if}
        </g>
      </svg>

      <div class="text-center md:text-left">
        <div class="flex flex-wrap justify-center gap-x-4 gap-y-3 md:justify-start">
          {#each word.split(' ') as part}
            <div class="flex gap-1.5">
              {#each part.split('') as ch}
                {#if /[A-Z]/.test(ch)}
                  {@const shown = guessed.has(ch) || status !== 'play'}
                  <span class="grid h-12 w-9 place-items-end justify-center border-b-4 pb-1 font-display text-3xl font-bold sm:w-10 {shown && !guessed.has(ch) ? 'border-coral text-coral' : status === 'won' ? 'border-[#5fe0bf] text-[#5fe0bf]' : 'border-white/40'}">{shown ? ch : ''}</span>
                {:else}
                  <span class="grid h-12 w-5 place-items-end justify-center pb-1 font-display text-3xl font-bold text-white/60">{ch}</span>
                {/if}
              {/each}
            </div>
          {/each}
        </div>

        <div class="mt-5 min-h-7">
          {#if showHint && item.hint}
            <p class="rise text-sun">Pista: {item.hint}</p>
          {:else if item.hint && status === 'play'}
            <button class="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white" onclick={() => (showHint = true)}><Lightbulb size={15} /> Ver pista</button>
          {/if}
        </div>

        {#if status === 'play'}
          <div class="mt-6 space-y-1.5">
            {#each rows as row}
              <div class="flex justify-center gap-1 sm:gap-1.5 md:justify-start">
                {#each row.split('') as ch}
                  {@const used = guessed.has(ch)}
                  <button
                    class="h-11 w-[8.4vw] max-w-11 rounded-lg text-sm font-bold transition sm:text-base
                      {used ? (letters.has(ch) ? 'bg-teal/40 text-white/70' : 'bg-white/5 text-white/25') : 'bg-white/12 hover:bg-white/20'}"
                    disabled={used}
                    onclick={() => guess(ch)}
                  >{ch}</button>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <div class="rise mt-6">
            <p class="font-display text-2xl font-bold {status === 'won' ? 'text-[#5fe0bf]' : 'text-coral'}">
              {status === 'won' ? '¡La adivinaste!' : `Era «${item.word}»`}
            </p>
            {#if item.hint}<p class="mt-1 text-white/60">{item.word} = {item.hint}</p>{/if}
            <button class="mt-5 rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90" onclick={next}>{idx < total - 1 ? 'Siguiente palabra' : 'Ver resultados'}</button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <ResultCard
      {name}
      tone="rose"
      icon={PersonStanding}
      title={wins === total ? '¡Todas salvadas!' : 'Juego terminado'}
      stats={[[`${wins}/${total}`, 'palabras'], [totalMisses, 'letras falladas'], [`${Math.round((wins / total) * 100)}%`, 'aciertos']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
