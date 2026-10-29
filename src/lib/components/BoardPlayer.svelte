<script>
  import { Dices, Star, Undo2, RotateCw, Crown, Flag, Footprints, Swords } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle } from '../catalog.js'

  let { activity, onexit } = $props()

  const COLORS = ['#f0583a', '#2a72d6', '#3f8f2f', '#e9a522']
  const letters = ['A', 'B', 'C', 'D']
  const optionStyles = ['bg-coral', 'bg-sky', 'bg-sun text-ink', 'bg-teal']

  const L = $derived(Number(activity.boardLength) || 24)
  const COLS = 8

  function typeOf(i) {
    if (i === 0) return 'start'
    if (i === L - 1) return 'goal'
    if (i % 5 === 0) return 'star'
    if (i % 7 === 4) return 'trap'
    if (i % 9 === 7) return 'extra'
    return 'plain'
  }

  // Posición visual en zigzag (como un tablero de serpientes y escaleras).
  const cells = $derived(
    Array.from({ length: L }, (_, i) => {
      const row = Math.floor(i / COLS)
      const col = row % 2 === 0 ? i % COLS : COLS - 1 - (i % COLS)
      return { i, row, col, type: typeOf(i) }
    }),
  )

  let phase = $state('setup') // setup | roll | rolling | question | steal | stealing | moving | effect | won
  let teamNames = $state(
    String(activity.teams || 'Equipo Rojo, Equipo Azul')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 4),
  )
  let teams = $state([])
  let turn = $state(0)
  let die = $state(1)
  let deck = []
  let q = $state(null)
  let picked = $state(null)
  let wrongPicks = $state([])
  let stealer = $state(null)
  let message = $state('')
  let extraTurn = $state(false)

  const current = $derived(teams[turn])

  function begin() {
    teams = teamNames.map((n, k) => ({ name: n.trim() || `Equipo ${k + 1}`, color: COLORS[k], pos: 0, correct: 0, answered: 0 }))
    turn = 0
    deck = []
    message = ''
    phase = 'roll'
  }

  function drawQuestion() {
    if (!deck.length) deck = shuffle(activity.questions.map((_, k) => k))
    return activity.questions[deck.pop()]
  }

  function roll() {
    if (phase !== 'roll') return
    phase = 'rolling'
    let n = 0
    const id = setInterval(() => {
      die = 1 + Math.floor(Math.random() * 6)
      if (++n >= 10) {
        clearInterval(id)
        q = drawQuestion()
        picked = null
        wrongPicks = []
        stealer = null
        message = ''
        phase = 'question'
      }
    }, 80)
  }

  function answer(idx) {
    if (phase !== 'question' && phase !== 'stealing') return
    const who = phase === 'stealing' ? stealer : turn
    teams[who].answered += 1
    picked = idx
    if (idx === q.correct) {
      teams[who].correct += 1
      if (phase === 'stealing') {
        message = `¡${teams[who].name} robó! Avanza 1 casilla.`
        moveTeam(who, 1)
      } else {
        message = `¡Correcto! ${teams[who].name} avanza ${die}.`
        moveTeam(who, die)
      }
    } else {
      wrongPicks = [...wrongPicks, idx]
      if (phase === 'question' && teams.length > 1) {
        message = `Incorrecto. ¿Algún equipo quiere robar?`
        phase = 'steal'
      } else {
        message = phase === 'stealing' ? 'Tampoco. Nadie avanza.' : 'Incorrecto. No avanzas.'
        phase = 'effect'
      }
    }
  }

  function chooseStealer(k) {
    if (k === null) {
      message = 'Nadie robó.'
      phase = 'effect'
      return
    }
    stealer = k
    picked = null
    phase = 'stealing'
  }

  function moveTeam(k, steps, applyEffect = true) {
    phase = 'moving'
    const target = Math.max(0, Math.min(L - 1, teams[k].pos + steps))
    const dir = Math.sign(target - teams[k].pos)
    const id = setInterval(() => {
      if (teams[k].pos === target) {
        clearInterval(id)
        afterMove(k, applyEffect)
        return
      }
      teams[k].pos += dir
    }, 220)
  }

  function afterMove(k, applyEffect) {
    const t = teams[k]
    if (t.pos === L - 1) return win(k)
    const type = typeOf(t.pos)
    if (applyEffect && type === 'star') {
      message += ' ★ Casilla bono: avanza 2 más.'
      return moveTeam(k, 2, false)
    }
    if (applyEffect && type === 'trap') {
      message += ' ¡Trampa! Retrocede 2.'
      return moveTeam(k, -2, false)
    }
    if (applyEffect && type === 'extra' && k === turn) {
      message += ' ¡Turno extra!'
      extraTurn = true
    }
    phase = 'effect'
  }

  function nextTurn() {
    if (!extraTurn) turn = (turn + 1) % teams.length
    extraTurn = false
    q = null
    message = ''
    phase = 'roll'
  }

  function win(k) {
    phase = 'won'
    turn = k
    for (const [idx, t] of teams.entries()) {
      addResult({
        activityId: activity.id,
        activityTitle: activity.title,
        type: 'board',
        student: t.name,
        accuracy: t.answered ? Math.round((t.correct / t.answered) * 100) : 0,
        detail: idx === k ? `Ganador · ${t.correct}/${t.answered} correctas` : `Llegó a la casilla ${t.pos} de ${L - 1} · ${t.correct}/${t.answered} correctas`,
      })
    }
  }

  function onkey(e) {
    if (phase === 'roll' && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault()
      roll()
    } else if ((phase === 'question' || phase === 'stealing') && ['1', '2', '3', '4'].includes(e.key)) {
      const idx = +e.key - 1
      if (!wrongPicks.includes(idx)) answer(idx)
    } else if (phase === 'effect' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      nextTurn()
    }
  }

  const icons = { star: Star, trap: Undo2, extra: RotateCw, goal: Flag, start: Footprints }
</script>

<svelte:window onkeydown={onkey} />

<PlayerShell {onexit} wide>
  {#snippet right()}
    {#if phase !== 'setup'}<span>{activity.title}</span>{/if}
  {/snippet}

  {#if phase === 'setup'}
    <PlayerIntro
      {activity}
      needsName={false}
      startLabel="Comenzar carrera"
      onstart={begin}
      rules={[
        'Por turnos, cada equipo lanza el dado y responde una pregunta.',
        'Si acierta, avanza lo que marcó el dado. Si falla, otro equipo puede robar y avanzar 1.',
        '★ avanza 2 más · ↩ retrocede 2 · ⟳ turno extra. Gana quien llegue a la meta.',
      ]}
    >
      <div class="mt-6 space-y-2">
        <p class="text-sm font-semibold">Equipos</p>
        {#each teamNames as _, k}
          <div class="flex items-center gap-2">
            <span class="h-4 w-4 shrink-0 rounded-full" style="background:{COLORS[k]}"></span>
            <input bind:value={teamNames[k]} class="w-full rounded-xl border border-ink/15 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo/20" />
            {#if teamNames.length > 2}
              <button type="button" class="rounded-lg px-2 py-1 text-sm text-slateink hover:bg-ink/5" onclick={() => teamNames.splice(k, 1)}>Quitar</button>
            {/if}
          </div>
        {/each}
        {#if teamNames.length < 4}
          <button type="button" class="text-sm font-semibold text-indigo hover:underline" onclick={() => teamNames.push(`Equipo ${teamNames.length + 1}`)}>+ Agregar equipo</button>
        {/if}
      </div>
    </PlayerIntro>
  {:else}
    <div class="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[1fr_24rem]">
      <!-- Tablero -->
      <div class="rounded-3xl bg-white/5 p-3 sm:p-4">
        <div class="grid gap-1.5 sm:gap-2" style="grid-template-columns: repeat({COLS}, minmax(0,1fr))">
          {#each cells as cell (cell.i)}
            {@const Icon = icons[cell.type]}
            <div
              class="relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-bold
                {cell.type === 'goal' ? 'bg-sun text-ink' : cell.type === 'start' ? 'bg-white/20' : cell.type === 'star' ? 'bg-teal/35 text-[#8ff0d6]' : cell.type === 'trap' ? 'bg-coral/30 text-[#ffb3a3]' : cell.type === 'extra' ? 'bg-plum/40 text-[#cbb8ff]' : 'bg-white/8 text-white/50'}"
              style="grid-row: {cell.row + 1}; grid-column: {cell.col + 1}"
            >
              {#if Icon}<Icon size={16} />{/if}
              <span class="{Icon ? 'hidden text-[10px] sm:inline' : ''}">{cell.type === 'start' ? 'Salida' : cell.type === 'goal' ? 'Meta' : cell.i}</span>
              <div class="absolute inset-x-0.5 bottom-0.5 flex justify-center -space-x-1 sm:bottom-1 sm:space-x-0.5">
                {#each teams as t, k}
                  {#if t.pos === cell.i}
                    <span class="h-2.5 w-2.5 rounded-full border border-white shadow sm:h-4 sm:w-4 sm:border-2 {k === turn && phase !== 'won' ? 'ring-2 ring-white/70' : ''}" style="background:{t.color}" title={t.name}></span>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each teams as t, k}
            <div class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold {k === turn && phase !== 'won' ? 'bg-white text-ink' : 'bg-white/8'}">
              <span class="h-3 w-3 rounded-full" style="background:{t.color}"></span>
              {t.name}
              <span class="tabular-nums opacity-60">· {t.pos}/{L - 1}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Panel de turno -->
      <div class="rounded-3xl bg-white/6 p-5 sm:p-6">
        {#if phase === 'won'}
          <div class="pop text-center">
            <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun text-ink"><Crown size={32} /></span>
            <p class="mt-4 font-display text-3xl font-extrabold" style="color:{teams[turn].color}">¡{teams[turn].name} gana!</p>
            <ul class="mt-6 space-y-2 text-left">
              {#each [...teams].sort((a, b) => b.pos - a.pos) as t}
                <li class="flex items-center justify-between rounded-xl bg-white/8 px-4 py-2.5">
                  <span class="flex items-center gap-2 font-semibold"><span class="h-3 w-3 rounded-full" style="background:{t.color}"></span>{t.name}</span>
                  <span class="text-sm text-white/70">{t.correct}/{t.answered} correctas</span>
                </li>
              {/each}
            </ul>
            <div class="mt-6 flex flex-wrap justify-center gap-2">
              <button class="rounded-xl bg-indigo px-5 py-3 font-semibold" onclick={begin}>Revancha</button>
              <button class="rounded-xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15" onclick={onexit}>Volver al panel</button>
            </div>
          </div>
        {:else}
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Turno de</p>
          <p class="mt-1 flex items-center gap-2 font-display text-2xl font-bold" style="color:{current.color}">
            <span class="h-4 w-4 rounded-full" style="background:{current.color}"></span>{current.name}
          </p>

          <div class="mt-5 flex items-center gap-4">
            <div class="grid h-20 w-20 place-items-center rounded-2xl bg-white font-display text-5xl font-extrabold text-ink shadow-[0_6px_0_rgba(255,255,255,.25)] {phase === 'rolling' ? 'rolling' : ''}">
              {die}
            </div>
            {#if phase === 'roll'}
              <button class="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo py-4 text-lg font-semibold hover:brightness-110" onclick={roll}>
                <Dices size={22} /> Lanzar dado
              </button>
            {:else}
              <p class="flex-1 text-sm text-white/70">{phase === 'rolling' ? 'Lanzando…' : `Si aciertan, avanzan ${die}.`}</p>
            {/if}
          </div>

          {#if q && phase !== 'roll' && phase !== 'rolling'}
            <div class="rise mt-6">
              {#if phase === 'stealing'}
                <p class="mb-2 inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-3 py-1 text-sm font-semibold text-sun"><Swords size={14} /> Robo de {teams[stealer].name}</p>
              {/if}
              <p class="font-display text-xl font-bold leading-snug">{q.text}</p>
              <div class="mt-4 grid gap-2">
                {#each q.options as opt, oi}
                  {@const reveal = phase === 'effect' || phase === 'moving' || phase === 'steal'}
                  {@const isRight = oi === q.correct}
                  <button
                    class="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition {optionStyles[oi]}
                      {wrongPicks.includes(oi) ? 'opacity-25 line-through' : ''}
                      {reveal && (phase !== 'steal') && isRight ? 'ring-4 ring-white' : ''}
                      {reveal && phase !== 'steal' && !isRight && !wrongPicks.includes(oi) ? 'opacity-40' : ''}"
                    disabled={!(phase === 'question' || phase === 'stealing') || wrongPicks.includes(oi)}
                    onclick={() => answer(oi)}
                  >
                    <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/15 text-xs">{letters[oi]}</span>{opt}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          {#if message}<p class="rise mt-5 font-semibold text-white/90">{message}</p>{/if}

          {#if phase === 'steal'}
            <div class="rise mt-3 flex flex-wrap gap-2">
              {#each teams as t, k}
                {#if k !== turn}
                  <button class="rounded-xl px-3 py-2 text-sm font-semibold text-white" style="background:{t.color}" onclick={() => chooseStealer(k)}>Roba {t.name}</button>
                {/if}
              {/each}
              <button class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15" onclick={() => chooseStealer(null)}>Nadie</button>
            </div>
          {/if}

          {#if phase === 'effect'}
            <button class="rise mt-5 w-full rounded-2xl bg-white py-3.5 font-semibold text-ink hover:bg-white/90" onclick={nextTurn}>
              {extraTurn ? `Turno extra para ${current.name}` : `Turno de ${teams[(turn + 1) % teams.length].name}`}
            </button>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</PlayerShell>
