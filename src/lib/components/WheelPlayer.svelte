<script>
  import { FerrisWheel, Eye, Crown, Plus } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import { addResult } from '../store.svelte.js'
  import { speak } from '../speech.js'

  let { activity, onexit } = $props()

  const COLORS = ['#f0583a', '#2a72d6', '#e9a522', '#12806a', '#6c4bd1', '#d0336a', '#3f8f2f', '#3d4cc9']
  const TEAM_COLORS = ['#f0583a', '#2a72d6', '#3f8f2f', '#e9a522']

  const categories = $derived.by(() => {
    const seen = new Map()
    for (const it of activity.items) {
      const key = it.category.trim().toLowerCase()
      if (key && !seen.has(key)) seen.set(key, it.category.trim())
    }
    return [...seen.entries()].slice(0, 8).map(([key, label], i) => ({ key, label, color: COLORS[i] }))
  })
  const seg = $derived(360 / categories.length)

  let phase = $state('intro') // intro | play | end
  let teamNames = $state(String(activity.teams ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4))
  let scores = $state([])
  let rotation = $state(0)
  let spinning = $state(false)
  let landed = $state(null)
  let question = $state(null)
  let showAnswer = $state(false)
  let awarded = $state(false)
  let rounds = $state(0)
  let used = new Set()

  function start() {
    scores = teamNames.map(() => 0)
    rotation = 0
    landed = null
    question = null
    rounds = 0
    used = new Set()
    phase = 'play'
  }

  function arc(i) {
    const r = 150
    const a0 = ((i * seg - 90) * Math.PI) / 180
    const a1 = (((i + 1) * seg - 90) * Math.PI) / 180
    const large = seg > 180 ? 1 : 0
    return `M160 160 L${160 + r * Math.cos(a0)} ${160 + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${160 + r * Math.cos(a1)} ${160 + r * Math.sin(a1)} Z`
  }

  function spin() {
    if (spinning) return
    spinning = true
    landed = null
    question = null
    showAnswer = false
    awarded = false
    rotation += 1440 + Math.floor(Math.random() * 360)
    setTimeout(() => {
      const atTop = (360 - (rotation % 360)) % 360
      const cat = categories[Math.floor(atTop / seg) % categories.length]
      landed = cat
      const pool = activity.items.map((it, id) => ({ ...it, id })).filter((it) => it.category.trim().toLowerCase() === cat.key)
      let fresh = pool.filter((it) => !used.has(it.id))
      if (!fresh.length) {
        pool.forEach((it) => used.delete(it.id))
        fresh = pool
      }
      question = fresh[Math.floor(Math.random() * fresh.length)]
      used.add(question.id)
      rounds += 1
      spinning = false
      speak(question.question, 0.85)
    }, 4200)
  }

  function award(i) {
    if (awarded) return
    scores[i] += 1
    awarded = true
  }

  function finish() {
    phase = 'end'
    if (!teamNames.length) return
    const top = Math.max(...scores)
    teamNames.forEach((t, i) =>
      addResult({
        activityId: activity.id,
        activityTitle: activity.title,
        type: 'wheel',
        student: t,
        accuracy: rounds ? Math.round((scores[i] / rounds) * 100) : 0,
        detail: `${scores[i]} punto${scores[i] === 1 ? '' : 's'} en ${rounds} ronda${rounds === 1 ? '' : 's'}${scores[i] === top && top > 0 ? ' · ganador' : ''}`,
      }),
    )
  }
</script>

<PlayerShell {onexit} wide>
  {#snippet right()}
    {#if phase === 'play'}
      <span class="tabular-nums">Ronda {rounds}</span>
      <button class="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/15" onclick={finish}>Terminar</button>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      needsName={false}
      startLabel="Empezar"
      onstart={start}
      rules={['Gira la ruleta: la categoría donde se detenga decide la pregunta.', 'La pregunta se lee en voz alta. Un estudiante responde oralmente.', 'Si juegan por equipos, suma un punto al equipo que respondió bien.']}
    >
      <div class="mt-5 space-y-2">
        <p class="text-sm font-semibold">Equipos <span class="font-normal text-slateink">(opcional)</span></p>
        {#each teamNames as _, k}
          <div class="flex items-center gap-2">
            <span class="h-4 w-4 shrink-0 rounded-full" style="background:{TEAM_COLORS[k]}"></span>
            <input bind:value={teamNames[k]} class="w-full rounded-xl border border-ink/15 px-3 py-2 outline-none focus:ring-4 focus:ring-sun/30" />
            <button type="button" class="rounded-lg px-2 py-1 text-sm text-slateink hover:bg-ink/5" onclick={() => teamNames.splice(k, 1)}>Quitar</button>
          </div>
        {/each}
        {#if teamNames.length < 4}
          <button type="button" class="inline-flex items-center gap-1 text-sm font-semibold text-[#a8720a] hover:underline" onclick={() => teamNames.push(`Equipo ${String.fromCharCode(65 + teamNames.length)}`)}><Plus size={14} /> Agregar equipo</button>
        {/if}
      </div>
    </PlayerIntro>
  {:else if phase === 'play'}
    <div class="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div class="relative mx-auto w-full max-w-[26rem]">
        <svg viewBox="0 0 320 320" class="w-full drop-shadow-2xl">
          <g style="transform-origin: 160px 160px; transform: rotate({rotation}deg); transition: transform 4.1s cubic-bezier(.12,.75,.12,1)">
            {#each categories as cat, i}
              <path d={arc(i)} fill={cat.color} stroke="#1d1b2f" stroke-width="3" />
              <text
                x="160"
                y="160"
                fill="white"
                font-size={categories.length > 6 ? 12 : 14}
                font-weight="700"
                text-anchor="end"
                dominant-baseline="middle"
                transform="rotate({i * seg + seg / 2 - 90} 160 160) translate(132 0)"
              >{cat.label.length > 13 ? cat.label.slice(0, 12) + '…' : cat.label}</text>
            {/each}
          </g>
          <circle cx="160" cy="160" r="26" fill="#1d1b2f" stroke="white" stroke-width="4" />
          <path d="M160 2 L174 30 L146 30 Z" fill="white" stroke="#1d1b2f" stroke-width="3" />
        </svg>
        <button class="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-extrabold" disabled={spinning} onclick={spin} aria-label="Girar">
          GIRAR
        </button>
      </div>

      <div>
        {#if !question}
          <div class="text-center lg:text-left">
            <p class="font-display text-3xl font-bold">{spinning ? 'Girando…' : rounds === 0 ? '¿Listos?' : 'Gira otra vez'}</p>
            <button class="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sun px-7 py-4 text-lg font-bold text-ink hover:brightness-105 disabled:opacity-50" disabled={spinning} onclick={spin}>
              <FerrisWheel size={22} /> Girar la ruleta
            </button>
          </div>
        {:else}
          <div class="pop">
            <span class="inline-block rounded-full px-3 py-1 text-sm font-bold" style="background:{landed.color}">{landed.label}</span>
            <p class="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">{question.question}</p>
            {#if question.answer}
              {#if showAnswer}
                <p class="rise mt-4 rounded-xl bg-white/8 px-4 py-3 text-lg text-[#8ff0d6]">{question.answer}</p>
              {:else}
                <button class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white" onclick={() => (showAnswer = true)}><Eye size={15} /> Ver respuesta modelo</button>
              {/if}
            {/if}

            {#if teamNames.length}
              <p class="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-white/50">¿Quién respondió bien?</p>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each teamNames as t, i}
                  <button class="rounded-xl px-4 py-2.5 font-semibold text-white transition disabled:opacity-40" style="background:{TEAM_COLORS[i]}" disabled={awarded} onclick={() => award(i)}>+1 {t}</button>
                {/each}
              </div>
            {/if}
            <button class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90" onclick={spin}>
              <FerrisWheel size={18} /> Siguiente giro
            </button>
          </div>
        {/if}

        {#if teamNames.length}
          <div class="mt-10 flex flex-wrap gap-2">
            {#each teamNames as t, i}
              <div class="flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 font-semibold">
                <span class="h-3 w-3 rounded-full" style="background:{TEAM_COLORS[i]}"></span>{t}
                <span class="font-display text-xl tabular-nums">{scores[i]}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {:else}
    {@const top = Math.max(0, ...scores)}
    <div class="pop mx-auto mt-10 max-w-md rounded-3xl bg-white p-8 text-center text-ink">
      <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun/20 text-[#a8720a]"><Crown size={32} /></span>
      <h2 class="mt-4 font-display text-3xl font-extrabold">¡Fin de la ronda!</h2>
      <p class="mt-1 text-slateink">{rounds} pregunta{rounds === 1 ? '' : 's'} respondida{rounds === 1 ? '' : 's'}.</p>
      {#if teamNames.length}
        <ul class="mt-6 space-y-2 text-left">
          {#each teamNames.map((t, i) => ({ t, s: scores[i], c: TEAM_COLORS[i] })).sort((a, b) => b.s - a.s) as row}
            <li class="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-2.5 font-semibold">
              <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full" style="background:{row.c}"></span>{row.t} {#if row.s === top && top > 0}<Crown size={15} class="text-[#a8720a]" />{/if}</span>
              <span class="tabular-nums">{row.s}</span>
            </li>
          {/each}
        </ul>
      {/if}
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <button class="rounded-xl bg-sun px-5 py-3 font-semibold text-ink" onclick={start}>Jugar otra vez</button>
        <button class="rounded-xl bg-ink/6 px-5 py-3 font-semibold hover:bg-ink/10" onclick={onexit}>Volver al panel</button>
      </div>
    </div>
  {/if}
</PlayerShell>
