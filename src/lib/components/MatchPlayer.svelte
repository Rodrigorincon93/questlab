<script>
  import { X, RotateCcw, Trophy, Repeat } from '@lucide/svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle } from '../catalog.js'

  let { activity, onexit } = $props()

  const pairs = $derived(activity.pairs.map((p, id) => ({ ...p, id })))

  let phase = $state('intro') // intro | play | roundEnd | end
  let name = $state('')
  let round = $state(1)
  let left = $state([])
  let right = $state([])
  let matched = $state(new Set())
  let missed = $state(new Set())
  let selected = $state(null) // { side, id }
  let wrong = $state(null) // { l, r }
  let totalErrors = $state(0)
  let attempts = $state(0)

  function setupRound(ids) {
    const pool = pairs.filter((p) => ids.includes(p.id))
    left = shuffle(pool)
    right = shuffle(pool)
    matched = new Set()
    missed = new Set()
    selected = null
    wrong = null
    phase = 'play'
  }

  function start() {
    round = 1
    totalErrors = 0
    attempts = 0
    setupRound(pairs.map((p) => p.id))
  }

  function pick(side, id) {
    if (phase !== 'play' || matched.has(id) || wrong) return
    if (!selected || selected.side === side) {
      selected = selected && selected.side === side && selected.id === id ? null : { side, id }
      return
    }
    const l = side === 'left' ? id : selected.id
    const r = side === 'right' ? id : selected.id
    selected = null
    attempts += 1
    if (l === r) {
      matched = new Set([...matched, l])
      if (matched.size === left.length) setTimeout(finishRound, 450)
    } else {
      totalErrors += 1
      missed = new Set([...missed, l, r])
      wrong = { l, r }
      setTimeout(() => (wrong = null), 650)
    }
  }

  function finishRound() {
    if (missed.size === 0) {
      phase = 'end'
      const accuracy = Math.round((pairs.length / (pairs.length + totalErrors)) * 100)
      addResult({
        activityId: activity.id,
        activityTitle: activity.title,
        type: 'match',
        student: name.trim(),
        accuracy,
        detail: `Dominada en ${round} ronda${round === 1 ? '' : 's'} · ${totalErrors} error${totalErrors === 1 ? '' : 'es'}`,
      })
    } else {
      phase = 'roundEnd'
    }
  }

  function nextRound() {
    let ids = [...missed]
    if (ids.length < 3) {
      // Completa con otras parejas para que la ronda no sea trivial.
      const others = shuffle(pairs.map((p) => p.id).filter((id) => !ids.includes(id)))
      ids = [...ids, ...others.slice(0, 3 - ids.length)]
    }
    round += 1
    setupRound(ids)
  }

  function cardClass(side, id) {
    if (matched.has(id)) return 'border-teal bg-teal/15 text-[#5fe0bf] opacity-60 cursor-default'
    if (wrong && ((side === 'left' && wrong.l === id) || (side === 'right' && wrong.r === id)))
      return 'shake border-coral bg-coral/20 text-white'
    if (selected && selected.side === side && selected.id === id) return 'border-sun bg-sun/15 text-white ring-4 ring-sun/25'
    return 'border-white/15 bg-white/6 text-white hover:border-white/40 hover:bg-white/10'
  }
</script>

<div class="min-h-screen bg-ink px-5 pb-16 text-white">
  <header class="mx-auto flex h-16 max-w-4xl items-center justify-between">
    <button class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white" onclick={onexit}>
      <X size={17} /> Salir
    </button>
    {#if phase === 'play'}
      <div class="flex items-center gap-4 text-sm font-semibold text-white/80">
        <span>Ronda {round}</span>
        <span class="tabular-nums">{matched.size}/{left.length}</span>
      </div>
    {/if}
  </header>

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        'Toca una palabra y luego su pareja en la otra columna.',
        'Las parejas que falles volverán en una nueva ronda.',
        'Terminas cuando completas una ronda sin errores.',
      ]}
    />
  {:else if phase === 'play'}
    <div class="mx-auto max-w-4xl">
      <p class="mt-4 text-center text-white/60">
        {round === 1 ? 'Une cada palabra con su pareja' : 'Repaso: estas son las que se resistieron'}
      </p>
      <div class="mt-8 grid grid-cols-2 gap-4 sm:gap-10">
        <div class="space-y-3">
          {#each left as p (p.id)}
            <button class="block w-full rounded-2xl border-2 px-4 py-4 text-left text-lg font-semibold transition {cardClass('left', p.id)}" onclick={() => pick('left', p.id)} disabled={matched.has(p.id)}>
              {p.term}
            </button>
          {/each}
        </div>
        <div class="space-y-3">
          {#each right as p (p.id)}
            <button class="block w-full rounded-2xl border-2 px-4 py-4 text-left text-lg font-semibold transition {cardClass('right', p.id)}" onclick={() => pick('right', p.id)} disabled={matched.has(p.id)}>
              {p.match}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {:else if phase === 'roundEnd'}
    {@const missedPairs = pairs.filter((p) => missed.has(p.id))}
    <div class="pop mx-auto mt-10 max-w-md rounded-3xl bg-white p-8 text-center text-ink">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal/12 text-teal"><Repeat size={28} /></span>
      <h2 class="mt-4 font-display text-2xl font-extrabold">Ronda {round} completada</h2>
      <p class="mt-1 text-slateink">
        Fallaste {missedPairs.length} pareja{missedPairs.length === 1 ? '' : 's'}. Repásalas antes de la siguiente ronda:
      </p>
      <ul class="mt-4 space-y-2 text-left">
        {#each missedPairs as p (p.id)}
          <li class="flex justify-between rounded-xl bg-ink/5 px-4 py-2.5 font-medium"><span>{p.term}</span><span class="text-teal">{p.match}</span></li>
        {/each}
      </ul>
      <button class="mt-6 w-full rounded-xl bg-teal py-3.5 font-semibold text-white hover:bg-teal/90" onclick={nextRound}>Siguiente ronda</button>
    </div>
  {:else}
    {@const accuracy = Math.round((pairs.length / (pairs.length + totalErrors)) * 100)}
    <div class="pop mx-auto mt-10 max-w-md rounded-3xl bg-white p-8 text-center text-ink">
      <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun/20 text-[#a8720a]"><Trophy size={32} /></span>
      <p class="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slateink">{name}</p>
      <h2 class="mt-1 font-display text-3xl font-extrabold">¡Actividad dominada!</h2>
      <div class="mt-6 grid grid-cols-3 gap-3 text-sm">
        <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold">{round}</p><p class="text-slateink">ronda{round === 1 ? '' : 's'}</p></div>
        <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold">{totalErrors}</p><p class="text-slateink">errores</p></div>
        <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold">{accuracy}%</p><p class="text-slateink">precisión</p></div>
      </div>
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <button class="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 font-semibold text-white" onclick={start}><RotateCcw size={16} /> Jugar otra vez</button>
        <button class="rounded-xl bg-ink/6 px-5 py-3 font-semibold hover:bg-ink/10" onclick={onexit}>Volver al panel</button>
      </div>
    </div>
  {/if}
</div>
