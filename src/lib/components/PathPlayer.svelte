<script>
  import { Lock, Star, Gem, Play, RotateCcw } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import { db, addResult } from '../store.svelte.js'
  import { byType, tones } from '../catalog.js'

  let { activity, onexit, players } = $props()

  let phase = $state('intro') // intro | map | playing
  let name = $state('')
  let playing = $state(null)
  let since = $state(0)
  let rewarded = $state(false)

  const steps = $derived(activity.steps.map((id) => db.activities.find((a) => a.id === id)).filter(Boolean))
  const who = $derived(name.trim().toLowerCase())

  // Mejor resultado del estudiante en cada parada, desde que empezó esta ruta.
  const best = $derived(
    steps.map((a) => {
      const rs = db.results.filter((r) => r.activityId === a.id && r.student.trim().toLowerCase() === who && r.date >= since)
      return rs.length ? Math.max(...rs.map((r) => r.accuracy)) : null
    }),
  )
  const starsOf = (acc) => (acc === null ? 0 : acc >= 90 ? 3 : acc >= 70 ? 2 : 1)
  const doneCount = $derived(best.filter((b) => b !== null).length)
  const unlocked = (i) => i === 0 || best[i - 1] !== null
  const allDone = $derived(steps.length > 0 && doneCount === steps.length)
  const totalStars = $derived(best.reduce((s, b) => s + starsOf(b), 0))

  $effect(() => {
    if (allDone && !rewarded && phase === 'map') {
      rewarded = true
      addResult({
        activityId: activity.id,
        activityTitle: activity.title,
        type: 'path',
        student: name.trim(),
        accuracy: Math.round(best.reduce((s, b) => s + b, 0) / steps.length),
        detail: `Ruta completa · ${totalStars}/${steps.length * 3} estrellas`,
      })
    }
  })

  function start(fresh = false) {
    since = fresh ? Date.now() : 0
    rewarded = db.results.some((r) => r.activityId === activity.id && r.student.trim().toLowerCase() === who && r.date >= since)
    phase = 'map'
  }

  function open(a) {
    playing = a
    phase = 'playing'
    scrollTo(0, 0)
  }

  function back() {
    playing = null
    phase = 'map'
    scrollTo(0, 0)
  }

  // Posiciones en zigzag para dibujar el camino.
  const W = 340
  const STEP_Y = 150
  const pos = $derived(steps.map((_, i) => ({ x: i % 2 === 0 ? 80 : W - 80, y: 60 + i * STEP_Y })))
  const height = $derived(60 + (steps.length - 1) * STEP_Y + 200)
  const pathD = $derived.by(() => {
    const pts = [...pos, { x: W / 2, y: height - 55 }]
    return pts.reduce((d, p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`
      const prev = pts[i - 1]
      const my = (prev.y + p.y) / 2
      return `${d} C${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`
    }, '')
  })
</script>

{#if phase === 'playing' && playing}
  {@const Player = players[playing.type]}
  {#key playing}
    <Player activity={playing} onexit={back} playerName={name} {players} />
  {/key}
{:else}
  <PlayerShell {onexit}>
    {#snippet right()}
      {#if phase === 'map'}
        <span class="inline-flex items-center gap-1 tabular-nums text-sun"><Star size={16} fill="currentColor" /> {totalStars}/{steps.length * 3}</span>
        <span class="tabular-nums">{doneCount}/{steps.length} paradas</span>
      {/if}
    {/snippet}

    {#if phase === 'intro'}
      <PlayerIntro
        {activity}
        bind:name
        onstart={() => start(false)}
        startLabel="Comenzar la ruta"
        rules={[
          'Completa cada parada para desbloquear la siguiente.',
          'Ganas de 1 a 3 estrellas según tus aciertos (70 % = 2★, 90 % = 3★).',
          'Puedes repetir una parada para mejorar tus estrellas. Tu avance se guarda con tu nombre.',
        ]}
      />
    {:else}
      <div class="mx-auto max-w-md">
        <h1 class="text-center font-display text-3xl font-extrabold">{activity.title}</h1>
        {#if activity.description}<p class="mt-1 text-center text-white/60">{activity.description}</p>{/if}

        <div class="relative mx-auto mt-6" style="width:{W}px; max-width:100%; height:{height}px">
          <svg class="absolute inset-0 h-full w-full" viewBox="0 0 {W} {height}" preserveAspectRatio="none" aria-hidden="true">
            <path d={pathD} fill="none" stroke="rgba(255,255,255,.14)" stroke-width="16" stroke-linecap="round" />
            <path d={pathD} fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" />
          </svg>

          {#each steps as a, i (a.id)}
            {@const c = byType[a.type]}
            {@const open_ = unlocked(i)}
            {@const s = starsOf(best[i])}
            <div class="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style="left:{(pos[i].x / W) * 100}%; top:{pos[i].y}px">
              <button
                class="relative grid h-20 w-20 place-items-center rounded-full border-4 transition
                  {best[i] !== null ? 'border-[#5fe0bf] bg-teal' : open_ ? 'border-white bg-leaf shadow-[0_0_0_8px_rgba(63,143,47,.3)] hover:scale-105' : 'cursor-not-allowed border-white/15 bg-white/8'}"
                disabled={!open_}
                onclick={() => open(a)}
                aria-label="Parada {i + 1}: {a.title}"
              >
                {#if open_}<c.icon size={30} strokeWidth={2.2} />{:else}<Lock size={26} class="text-white/40" />{/if}
                <span class="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-bold text-ink">{i + 1}</span>
              </button>
              <div class="mt-1.5 flex gap-0.5">
                {#each [1, 2, 3] as n}<Star size={15} class={n <= s ? 'text-sun' : 'text-white/20'} fill="currentColor" />{/each}
              </div>
              <p class="mt-0.5 w-36 text-center text-sm font-semibold leading-tight {open_ ? '' : 'text-white/40'}">{a.title}</p>
              <p class="text-center text-xs text-white/50">{c.name}</p>
            </div>
          {/each}

          <div class="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style="left:50%; top:{height - 55}px">
            <span class="grid h-20 w-20 place-items-center rounded-2xl {allDone ? 'pop bg-sun text-ink shadow-[0_0_0_10px_rgba(233,165,34,.3)]' : 'bg-white/8 text-white/30'}"><Gem size={34} /></span>
            <p class="mt-1.5 text-sm font-semibold {allDone ? 'text-sun' : 'text-white/40'}">{allDone ? '¡Tesoro encontrado!' : 'Tesoro'}</p>
          </div>
        </div>

        {#if allDone}
          <div class="pop mt-4 flex flex-wrap justify-center gap-2">
            <button class="inline-flex items-center gap-2 rounded-xl bg-leaf px-5 py-3 font-semibold" onclick={() => start(true)}><RotateCcw size={16} /> Empezar de nuevo</button>
            <button class="rounded-xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15" onclick={onexit}>Volver al panel</button>
          </div>
        {:else}
          {@const nextIdx = best.findIndex((b) => b === null)}
          {#if nextIdx >= 0}
            <div class="mt-4 text-center">
              <button class="inline-flex items-center gap-2 rounded-xl bg-leaf px-6 py-3 font-semibold hover:brightness-110" onclick={() => open(steps[nextIdx])}><Play size={16} fill="currentColor" /> Ir a la parada {nextIdx + 1}</button>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </PlayerShell>
{/if}
