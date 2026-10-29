<script>
  import { X, Flame, Clock, Check, RotateCcw, Trophy, CircleCheck, CircleX } from '@lucide/svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import { untrack } from 'svelte'
  import { addResult } from '../store.svelte.js'

  let { activity, onexit } = $props()

  const letters = ['A', 'B', 'C', 'D']
  const optionStyles = [
    'bg-coral hover:brightness-110',
    'bg-sky hover:brightness-110',
    'bg-sun text-ink hover:brightness-105',
    'bg-teal hover:brightness-110',
  ]

  let phase = $state('intro') // intro | question | feedback | end
  let name = $state('')
  let i = $state(0)
  let picked = $state(null)
  let score = $state(0)
  let streak = $state(0)
  let bestStreak = $state(0)
  let gained = $state(0)
  let timeLeft = $state(0)
  let answers = $state([])

  const total = $derived(activity.questions.length)
  const q = $derived(activity.questions[i])
  const limit = $derived(activity.timeLimit ?? 20)
  const correctCount = $derived(answers.filter((a) => a.ok).length)

  function start() {
    i = 0
    score = 0
    streak = 0
    bestStreak = 0
    answers = []
    begin()
  }

  function begin() {
    picked = null
    gained = 0
    timeLeft = limit
    phase = 'question'
  }

  $effect(() => {
    if (phase !== 'question') return
    const started = performance.now()
    const startLeft = untrack(() => timeLeft)
    const t = setInterval(() => {
      timeLeft = Math.max(0, startLeft - (performance.now() - started) / 1000)
      if (timeLeft <= 0) choose(-1)
    }, 100)
    return () => clearInterval(t)
  })

  function choose(idx) {
    if (phase !== 'question') return
    picked = idx
    const ok = idx === q.correct
    if (ok) {
      streak += 1
      bestStreak = Math.max(bestStreak, streak)
      gained = Math.round(500 + 500 * (timeLeft / limit)) + (streak >= 3 ? 100 : 0)
      score += gained
    } else {
      streak = 0
      gained = 0
    }
    answers.push({ text: q.text, ok, picked: idx, correct: q.correct, options: q.options })
    phase = 'feedback'
  }

  function next() {
    if (i < total - 1) {
      i += 1
      begin()
    } else {
      phase = 'end'
      addResult({
        activityId: activity.id,
        activityTitle: activity.title,
        type: 'quiz',
        student: name.trim(),
        accuracy: Math.round((correctCount / total) * 100),
        detail: `${correctCount}/${total} correctas · ${score} pts`,
      })
    }
  }

  function onkey(e) {
    if (phase === 'question' && ['1', '2', '3', '4'].includes(e.key)) choose(+e.key - 1)
    else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      next()
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<div class="min-h-screen bg-ink px-5 pb-16 text-white">
  <header class="mx-auto flex h-16 max-w-4xl items-center justify-between">
    <button class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white" onclick={onexit}>
      <X size={17} /> Salir
    </button>
    {#if phase === 'question' || phase === 'feedback'}
      <div class="flex items-center gap-4 text-sm font-semibold">
        {#if streak >= 2}
          <span class="pop inline-flex items-center gap-1 text-sun"><Flame size={16} /> Racha ×{streak}</span>
        {/if}
        <span class="tabular-nums">{score} pts</span>
      </div>
    {/if}
  </header>

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        `Tienes ${limit} segundos por pregunta.`,
        'Mientras más rápido aciertes, más puntos ganas.',
        'Tres aciertos seguidos suman un bono de racha.',
        'Puedes responder con las teclas 1, 2, 3 y 4.',
      ]}
    />
  {:else if phase === 'question' || phase === 'feedback'}
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between text-sm text-white/60">
        <span>Pregunta {i + 1} de {total}</span>
        <span class="inline-flex items-center gap-1.5 tabular-nums {timeLeft < 5 && phase === 'question' ? 'text-coral' : ''}">
          <Clock size={15} /> {Math.ceil(timeLeft)} s
        </span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full transition-[width] duration-100 ease-linear {timeLeft / limit < 0.25 ? 'bg-coral' : 'bg-sun'}" style="width: {(timeLeft / limit) * 100}%"></div>
      </div>

      {#key i}
        <h2 class="pop mt-10 text-center font-display text-3xl font-bold leading-tight sm:text-5xl">{q.text}</h2>
      {/key}

      <div class="mt-10 grid gap-3 sm:grid-cols-2">
        {#each q.options as opt, oi}
          {@const isCorrect = oi === q.correct}
          {@const reveal = phase === 'feedback'}
          <button
            class="flex min-h-20 items-center gap-4 rounded-2xl px-5 py-4 text-left text-lg font-semibold transition
              {optionStyles[oi]}
              {reveal && !isCorrect && picked !== oi ? 'opacity-30' : ''}
              {reveal && picked === oi && !isCorrect ? 'shake ring-4 ring-white/70' : ''}
              {reveal && isCorrect ? 'ring-4 ring-white' : ''}"
            disabled={reveal}
            onclick={() => choose(oi)}
          >
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/15 text-sm font-bold">
              {#if reveal && isCorrect}<Check size={18} strokeWidth={3} />{:else}{letters[oi]}{/if}
            </span>
            {opt}
          </button>
        {/each}
      </div>

      {#if phase === 'feedback'}
        {@const last = answers[answers.length - 1]}
        <div class="pop mt-8 flex flex-col items-center gap-4 text-center">
          {#if last.ok}
            <p class="font-display text-2xl font-bold text-[#5fe0bf]">¡Correcto! +{gained} pts</p>
          {:else if picked === -1}
            <p class="font-display text-2xl font-bold text-sun">Se acabó el tiempo</p>
          {:else}
            <p class="font-display text-2xl font-bold text-coral">Casi. La respuesta era «{q.options[q.correct]}»</p>
          {/if}
          <button class="rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90" onclick={next}>
            {i < total - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
          </button>
        </div>
      {/if}
    </div>
  {:else}
    {@const pct = Math.round((correctCount / total) * 100)}
    <div class="pop mx-auto mt-6 max-w-2xl">
      <div class="rounded-3xl bg-white p-8 text-center text-ink">
        <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun/20 text-[#a8720a]"><Trophy size={32} /></span>
        <p class="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slateink">{name}</p>
        <p class="mt-1 font-display text-6xl font-extrabold tabular-nums">{score}</p>
        <p class="text-slateink">puntos</p>
        <div class="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold">{correctCount}/{total}</p><p class="text-slateink">correctas</p></div>
          <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold">{pct}%</p><p class="text-slateink">aciertos</p></div>
          <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold">{bestStreak}</p><p class="text-slateink">mejor racha</p></div>
        </div>
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button class="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 font-semibold text-white" onclick={start}><RotateCcw size={16} /> Jugar otra vez</button>
          <button class="rounded-xl bg-ink/6 px-5 py-3 font-semibold hover:bg-ink/10" onclick={onexit}>Volver al panel</button>
        </div>
      </div>

      <h3 class="mt-8 font-display text-lg font-bold">Repaso</h3>
      <ul class="mt-3 space-y-2">
        {#each answers as a, ai}
          <li class="flex gap-3 rounded-2xl bg-white/6 p-4">
            {#if a.ok}<CircleCheck class="shrink-0 text-[#5fe0bf]" size={20} />{:else}<CircleX class="shrink-0 text-coral" size={20} />{/if}
            <div class="text-sm">
              <p class="font-medium">{ai + 1}. {a.text}</p>
              <p class="mt-0.5 text-white/60">
                Correcta: <span class="text-white">{a.options[a.correct]}</span>
                {#if !a.ok}· Tu respuesta: {a.picked === -1 ? 'sin responder' : a.options[a.picked]}{/if}
              </p>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
