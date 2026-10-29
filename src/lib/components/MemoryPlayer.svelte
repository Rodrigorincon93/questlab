<script>
  import { Timer, Brain } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle, fmtTime } from '../catalog.js'
  import { speak } from '../speech.js'

  let { activity, onexit, playerName = '' } = $props()

  let phase = $state('intro')
  let name = $state(playerName)
  let cards = $state([])
  let open = $state([]) // índices volteados temporalmente
  let matched = $state(new Set())
  let moves = $state(0)
  let lock = $state(false)
  let elapsed = $state(0)
  let t0 = 0

  const pairs = $derived(activity.pairs.length)
  const cols = $derived(cards.length <= 12 ? 4 : cards.length <= 16 ? 4 : 5)

  $effect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => (elapsed = (performance.now() - t0) / 1000), 250)
    return () => clearInterval(id)
  })

  function start() {
    cards = shuffle(
      activity.pairs.flatMap((p, id) => [
        { id, side: 'a', text: p.term },
        { id, side: 'b', text: p.match },
      ]),
    )
    open = []
    matched = new Set()
    moves = 0
    elapsed = 0
    t0 = performance.now()
    phase = 'play'
  }

  function flip(i) {
    if (lock || open.includes(i) || matched.has(cards[i].id)) return
    if (cards[i].side === 'a') speak(cards[i].text)
    open = [...open, i]
    if (open.length === 2) {
      moves += 1
      const [x, y] = open
      if (cards[x].id === cards[y].id) {
        matched = new Set([...matched, cards[x].id])
        open = []
        if (matched.size === pairs) setTimeout(finish, 500)
      } else {
        lock = true
        setTimeout(() => {
          open = []
          lock = false
        }, 950)
      }
    }
  }

  function finish() {
    phase = 'end'
    elapsed = (performance.now() - t0) / 1000
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'memory',
      student: name.trim(),
      accuracy: Math.min(100, Math.round((pairs / moves) * 100)),
      detail: `${moves} movimientos · ${fmtTime(elapsed)}`,
    })
  }
</script>

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}
      <span class="inline-flex items-center gap-1.5 tabular-nums"><Timer size={16} /> {fmtTime(elapsed)}</span>
      <span class="tabular-nums">{moves} mov.</span>
      <span class="tabular-nums">{matched.size}/{pairs}</span>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={['Voltea dos cartas por turno y encuentra cada palabra con su pareja.', 'Las palabras en inglés se pronuncian al voltearlas.', 'Menos movimientos = mejor puntaje.']}
    />
  {:else if phase === 'play'}
    <div class="mx-auto grid max-w-3xl gap-2 sm:gap-3" style="grid-template-columns: repeat({cols}, minmax(0, 1fr))">
      {#each cards as c, i (i)}
        {@const faceUp = open.includes(i) || matched.has(c.id)}
        <button
          class="relative aspect-[4/3] rounded-2xl p-2 text-center font-display text-base font-bold transition sm:text-xl
            {matched.has(c.id) ? 'bg-teal/30 text-[#8ff0d6] ring-2 ring-teal' : faceUp ? (c.side === 'a' ? 'bg-plum text-white' : 'bg-white text-ink') : 'bg-white/8 hover:bg-white/14'}"
          onclick={() => flip(i)}
          aria-label={faceUp ? c.text : 'Carta boca abajo'}
        >
          {#key faceUp}
            <span class="flipin grid h-full place-items-center">
              {#if faceUp}{c.text}{:else}<Brain size={28} class="text-white/25" />{/if}
            </span>
          {/key}
        </button>
      {/each}
    </div>
  {:else}
    <ResultCard
      {name}
      tone="plum"
      icon={Brain}
      title="¡Todas las parejas!"
      stats={[[moves, 'movimientos'], [fmtTime(elapsed), 'tiempo'], [`${Math.min(100, Math.round((pairs / moves) * 100))}%`, 'precisión']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
