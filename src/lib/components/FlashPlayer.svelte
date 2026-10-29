<script>
  import { Volume2, RotateCw, Check, Repeat, Layers } from '@lucide/svelte'
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
  let flipped = $state(false)
  let reverse = $state(false)
  let known = $state(0)
  let missedOnce = $state(new Set())
  let reviews = $state(0)

  const total = $derived(activity.cards.length)
  const card = $derived(queue[0])

  function start() {
    queue = shuffle(activity.cards.map((c, id) => ({ ...c, id })))
    known = 0
    reviews = 0
    missedOnce = new Set()
    flipped = false
    phase = 'play'
    if (!reverse) setTimeout(() => speak(queue[0]?.front), 250)
  }

  function flip() {
    flipped = !flipped
    if (flipped && reverse) speak(card.front)
  }

  function answer(ok) {
    if (!flipped) return
    const [c, ...rest] = queue
    if (ok) {
      known += 1
      queue = rest
    } else {
      reviews += 1
      missedOnce = new Set([...missedOnce, c.id])
      // Vuelve a aparecer un poco más adelante, no al instante.
      const at = Math.min(rest.length, 2)
      queue = [...rest.slice(0, at), c, ...rest.slice(at)]
    }
    flipped = false
    if (queue.length === 0) finish()
    else if (!reverse) setTimeout(() => speak(queue[0]?.front), 200)
  }

  function finish() {
    phase = 'end'
    const firstTry = total - missedOnce.size
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'flash',
      student: name.trim(),
      accuracy: Math.round((firstTry / total) * 100),
      detail: `${firstTry}/${total} al primer intento · ${reviews} repaso${reviews === 1 ? '' : 's'}`,
    })
  }

  function onkey(e) {
    if (phase !== 'play') return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      flip()
    } else if (e.key === 'ArrowLeft' || e.key === '1') answer(false)
    else if (e.key === 'ArrowRight' || e.key === '2') answer(true)
  }
</script>

<svelte:window onkeydown={onkey} />

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}
      <span class="tabular-nums">{known}/{total} dominadas</span>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        'Mira la tarjeta, intenta recordar y tócala para darle la vuelta.',
        'Marca «Lo sé» o «Repasar». Las que repases volverán a salir.',
        canSpeak ? 'Toca el altavoz para escuchar la pronunciación.' : 'Atajos: espacio para girar, ← repasar, → lo sé.',
      ]}
    >
      <label class="mt-5 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" bind:checked={reverse} class="h-4 w-4 accent-sky" />
        Mostrar primero el significado (práctica inversa)
      </label>
    </PlayerIntro>
  {:else if phase === 'play' && card}
    <div class="mx-auto max-w-xl">
      <div class="h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-sky transition-all" style="width:{(known / total) * 100}%"></div>
      </div>
      <p class="mt-3 text-center text-sm text-white/60">Quedan {queue.length} tarjeta{queue.length === 1 ? '' : 's'}</p>

      {#key card.id + '-' + flipped}
        <div
          role="button"
          tabindex="0"
          class="flipin relative mt-6 flex min-h-72 w-full cursor-pointer flex-col items-center justify-center rounded-3xl p-8 text-center shadow-2xl {flipped ? 'bg-white text-ink' : 'bg-sky text-white'}"
          onclick={flip}
          onkeydown={(e) => e.key === 'Enter' && flip()}
        >
          <span class="absolute left-5 top-4 text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
            {flipped !== reverse ? 'Significado' : 'Inglés'}
          </span>
          {#if flipped !== reverse}
            <p class="font-display text-4xl font-extrabold sm:text-5xl">{card.back}</p>
            {#if flipped && card.example}
              <p class="mt-5 max-w-sm text-lg text-slateink">“{card.example}”</p>
            {/if}
          {:else}
            <p class="font-display text-5xl font-extrabold sm:text-6xl">{card.front}</p>
            {#if flipped && card.example}
              <p class="mt-5 max-w-sm text-lg text-slateink">“{card.example}”</p>
            {/if}
          {/if}
          <span class="absolute bottom-4 right-5 inline-flex items-center gap-1 text-xs font-semibold opacity-60"><RotateCw size={13} /> Toca para girar</span>
        </div>
      {/key}

      {#if canSpeak}
        <div class="mt-4 flex justify-center gap-2">
          <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={() => speak(card.front)}>
            <Volume2 size={17} /> Escuchar
          </button>
          {#if card.example && flipped}
            <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={() => speak(card.example, 0.85)}>
              <Volume2 size={17} /> Ejemplo
            </button>
          {/if}
        </div>
      {/if}

      <div class="mt-6 grid grid-cols-2 gap-3">
        <button class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-semibold transition hover:bg-white/15 disabled:opacity-30" disabled={!flipped} onclick={() => answer(false)}>
          <Repeat size={18} /> Repasar
        </button>
        <button class="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal py-4 font-semibold transition hover:brightness-110 disabled:opacity-30" disabled={!flipped} onclick={() => answer(true)}>
          <Check size={18} strokeWidth={3} /> ¡Lo sé!
        </button>
      </div>
      {#if !flipped}<p class="mt-3 text-center text-xs text-white/50">Primero gira la tarjeta para comprobar.</p>{/if}
    </div>
  {:else}
    {@const firstTry = total - missedOnce.size}
    <ResultCard
      {name}
      tone="sky"
      icon={Layers}
      title="¡Mazo completado!"
      subtitle="Dominaste todas las tarjetas."
      stats={[[`${firstTry}/${total}`, 'al primer intento'], [reviews, 'repasos'], [`${Math.round((firstTry / total) * 100)}%`, 'aciertos']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
