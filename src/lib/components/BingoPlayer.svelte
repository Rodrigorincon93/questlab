<script>
  import { Megaphone, Eye, EyeOff, Volume2, Ticket, Star, Undo2 } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle } from '../catalog.js'
  import { speak, canSpeak } from '../speech.js'

  let { activity, onexit, playerName = '' } = $props()

  let phase = $state('intro') // intro | caller | card
  let role = $state('student')
  let name = $state(playerName)

  // Modo docente (cantor)
  let deck = $state([])
  let called = $state([])
  let showWord = $state(false)

  // Modo estudiante (cartón)
  let size = $state(5)
  let card = $state([])
  let marked = $state(new Set())
  let claimed = $state(false)

  const items = $derived(activity.items)
  const lastCalled = $derived(called[called.length - 1])
  const FREE = '★'

  function start() {
    if (role === 'caller') {
      deck = shuffle(items.map((it, id) => ({ ...it, id })))
      called = []
      showWord = false
      phase = 'caller'
    } else {
      size = items.length >= 24 ? 5 : 4
      const need = size === 5 ? 24 : 16
      const words = shuffle(items).slice(0, need).map((it) => it.word)
      if (size === 5) words.splice(12, 0, FREE)
      card = words
      marked = new Set(size === 5 ? [12] : [])
      claimed = false
      phase = 'card'
    }
  }

  function callNext() {
    if (!deck.length) return
    const [next, ...rest] = deck
    deck = rest
    called = [...called, next]
    showWord = false
  }

  function undoCall() {
    if (!called.length) return
    deck = [called[called.length - 1], ...deck]
    called = called.slice(0, -1)
  }

  function toggle(i) {
    if (card[i] === FREE) return
    const m = new Set(marked)
    m.has(i) ? m.delete(i) : m.add(i)
    marked = m
  }

  const lines = $derived.by(() => {
    const n = size
    const all = []
    for (let r = 0; r < n; r++) all.push(Array.from({ length: n }, (_, c) => r * n + c))
    for (let c = 0; c < n; c++) all.push(Array.from({ length: n }, (_, r) => r * n + c))
    all.push(Array.from({ length: n }, (_, i) => i * n + i))
    all.push(Array.from({ length: n }, (_, i) => i * n + (n - 1 - i)))
    return all.filter((line) => line.every((i) => marked.has(i)))
  })
  const winCells = $derived(new Set(lines.flat()))
  const full = $derived(card.length > 0 && marked.size === card.length)

  function claim() {
    claimed = true
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'bingo',
      student: name.trim() || 'Estudiante',
      accuracy: 100,
      detail: full ? 'Cartón lleno' : `¡Bingo! · ${lines.length} línea${lines.length === 1 ? '' : 's'} · ${marked.size - (size === 5 ? 1 : 0)} marcadas`,
    })
  }
</script>

<PlayerShell {onexit} wide={phase === 'caller'}>
  {#snippet right()}
    {#if phase === 'caller'}<span class="tabular-nums">{called.length}/{items.length} cantadas</span>{/if}
    {#if phase === 'card' && name}<span>{name}</span>{/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      needsName={role === 'student'}
      startLabel={role === 'caller' ? 'Empezar a cantar' : 'Ver mi cartón'}
      onstart={start}
      rules={[
        'El docente proyecta el modo «Cantar» y muestra la pista (por ejemplo, «17»).',
        'Cada estudiante abre el enlace en su dispositivo y marca la palabra en inglés («seventeen»).',
        'Cada cartón es distinto. Quien complete una línea grita ¡Bingo!',
      ]}
    >
      <div class="mt-5 grid grid-cols-2 gap-2">
        <button type="button" class="rounded-xl border-2 p-3 text-left text-sm transition {role === 'caller' ? 'border-coral bg-coral/8' : 'border-ink/10 hover:border-ink/25'}" onclick={() => (role = 'caller')}>
          <span class="flex items-center gap-1.5 font-semibold"><Megaphone size={16} /> Soy docente</span>
          <span class="text-slateink">Cantar las pistas</span>
        </button>
        <button type="button" class="rounded-xl border-2 p-3 text-left text-sm transition {role === 'student' ? 'border-coral bg-coral/8' : 'border-ink/10 hover:border-ink/25'}" onclick={() => (role = 'student')}>
          <span class="flex items-center gap-1.5 font-semibold"><Ticket size={16} /> Soy estudiante</span>
          <span class="text-slateink">Jugar con mi cartón</span>
        </button>
      </div>
    </PlayerIntro>
  {:else if phase === 'caller'}
    <div class="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div class="text-center">
        {#if lastCalled}
          {#key lastCalled.id}
            <div class="pop mx-auto mt-4 grid aspect-square w-64 place-items-center rounded-full bg-coral shadow-[0_0_0_14px_rgba(240,88,58,.2)] sm:w-80">
              <p class="px-6 font-display text-6xl font-extrabold leading-tight sm:text-7xl">{lastCalled.clue}</p>
            </div>
          {/key}
          <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={() => (showWord = !showWord)}>
              {#if showWord}<EyeOff size={16} /> Ocultar respuesta{:else}<Eye size={16} /> Ver respuesta{/if}
            </button>
            {#if canSpeak}
              <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={() => speak(lastCalled.word)}><Volume2 size={16} /> Decir en inglés</button>
            {/if}
            <button class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15" onclick={undoCall}><Undo2 size={16} /> Deshacer</button>
          </div>
          {#if showWord}<p class="rise mt-4 font-display text-3xl font-bold text-[#8ff0d6]">{lastCalled.word}</p>{/if}
        {:else}
          <p class="mt-16 font-display text-3xl font-bold">Pulsa «Sacar ficha» para empezar</p>
        {/if}
        <button class="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-ink hover:bg-white/90 disabled:opacity-40" disabled={!deck.length} onclick={callNext}>
          <Megaphone size={20} /> {deck.length ? 'Sacar ficha' : 'Ya salieron todas'}
        </button>
      </div>
      <aside class="rounded-3xl bg-white/5 p-5">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">Ya cantadas (para verificar)</p>
        <ul class="mt-3 flex flex-wrap gap-1.5">
          {#each [...called].reverse() as c (c.id)}
            <li class="rounded-lg bg-white/10 px-2 py-1 text-sm"><span class="font-bold">{c.clue}</span> <span class="text-white/60">· {c.word}</span></li>
          {/each}
        </ul>
      </aside>
    </div>
  {:else}
    <div class="mx-auto max-w-xl">
      <p class="text-center font-display text-3xl font-extrabold tracking-[0.3em] text-coral">BINGO</p>
      <div class="mt-4 grid gap-1.5 rounded-3xl bg-white p-2 sm:gap-2 sm:p-3" style="grid-template-columns: repeat({size}, minmax(0, 1fr))">
        {#each card as w, i}
          <button
            class="relative grid aspect-square place-items-center rounded-xl p-1 text-center text-[clamp(.65rem,2.6vw,1rem)] font-bold leading-tight transition
              {w === FREE ? 'bg-sun text-ink' : marked.has(i) ? (winCells.has(i) ? 'bg-teal text-white' : 'bg-coral text-white') : 'bg-ink/6 text-ink hover:bg-ink/12'}"
            onclick={() => toggle(i)}
          >
            {#if w === FREE}<Star size={22} fill="currentColor" />{:else}{w}{/if}
          </button>
        {/each}
      </div>
      <p class="mt-4 text-center text-sm text-white/60">Toca una palabra para marcarla o desmarcarla.</p>
      {#if lines.length}
        <div class="pop mt-6 text-center">
          {#if claimed}
            <p class="font-display text-3xl font-extrabold text-[#5fe0bf]">¡BINGO! Avisa a tu docente.</p>
          {:else}
            <button class="rounded-2xl bg-teal px-8 py-4 font-display text-2xl font-extrabold hover:brightness-110" onclick={claim}>¡BINGO!</button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</PlayerShell>
