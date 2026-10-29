<script>
  import { Lock, LockOpen, Lightbulb, Hourglass, KeyRound, DoorOpen } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { accepted, norm, fmtTime } from '../catalog.js'

  let { activity, onexit, playerName = '' } = $props()

  const WRONG_PENALTY = 20
  const HINT_PENALTY = 30

  let phase = $state('intro') // intro | story | level | digit | code | won | lost
  let name = $state(playerName)
  let level = $state(0)
  let digits = $state([])
  let value = $state('')
  let codeInput = $state('')
  let wrong = $state(false)
  let codeWrong = $state(false)
  let penalty = $state(null)
  let hintShown = $state(false)
  let errors = $state(0)
  let hintsUsed = $state(0)
  let clean = $state(0)
  let levelHadHelp = false
  let remaining = $state(0)
  let deadline = 0
  let input = $state()

  const levels = $derived(activity.levels)
  const total = $derived(levels.length)
  const lv = $derived(levels[level])
  const running = $derived(phase === 'level' || phase === 'digit' || phase === 'code')

  $effect(() => {
    if (!running) return
    const id = setInterval(() => {
      remaining = Math.max(0, (deadline - performance.now()) / 1000)
      if (remaining <= 0) lose()
    }, 200)
    return () => clearInterval(id)
  })

  function start() {
    digits = levels.map(() => 1 + Math.floor(Math.random() * 9))
    level = 0
    errors = 0
    hintsUsed = 0
    clean = 0
    codeInput = ''
    remaining = (activity.minutes ?? 10) * 60
    phase = 'story'
  }

  function enter() {
    deadline = performance.now() + remaining * 1000
    openLevel(0)
  }

  function openLevel(i) {
    level = i
    value = ''
    wrong = false
    hintShown = false
    levelHadHelp = false
    phase = 'level'
    setTimeout(() => input?.focus(), 50)
  }

  function punish(sec) {
    deadline -= sec * 1000
    remaining = Math.max(0, (deadline - performance.now()) / 1000)
    penalty = `−${sec} s`
    setTimeout(() => (penalty = null), 1200)
  }

  function tryAnswer(e) {
    e.preventDefault()
    if (!value.trim()) return
    if (accepted(lv).includes(norm(value))) {
      if (!levelHadHelp) clean += 1
      phase = 'digit'
    } else {
      errors += 1
      levelHadHelp = true
      wrong = true
      setTimeout(() => (wrong = false), 450)
      punish(WRONG_PENALTY)
    }
  }

  function showHint() {
    hintShown = true
    hintsUsed += 1
    levelHadHelp = true
    punish(HINT_PENALTY)
  }

  function afterDigit() {
    if (level < total - 1) openLevel(level + 1)
    else {
      phase = 'code'
      codeInput = ''
    }
  }

  function tryCode(e) {
    e.preventDefault()
    if (codeInput.replace(/\D/g, '') === digits.join('')) win()
    else {
      codeWrong = true
      setTimeout(() => (codeWrong = false), 450)
      punish(WRONG_PENALTY)
    }
  }

  function record(escaped) {
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'escape',
      student: name.trim(),
      accuracy: Math.round((clean / total) * 100),
      detail: escaped
        ? `Escapó con ${fmtTime(remaining)} de sobra · ${errors} error${errors === 1 ? '' : 'es'}, ${hintsUsed} pista${hintsUsed === 1 ? '' : 's'}`
        : `No escapó · ${level}/${total} candados abiertos`,
    })
  }

  function win() {
    phase = 'won'
    remaining = Math.max(0, (deadline - performance.now()) / 1000)
    record(true)
  }

  function lose() {
    if (phase === 'lost' || phase === 'won') return
    if (phase === 'code' || phase === 'digit') level = phase === 'code' ? total : level + 1
    phase = 'lost'
    remaining = 0
    record(false)
  }
</script>

<PlayerShell {onexit}>
  {#snippet right()}
    {#if running}
      {#if penalty}<span class="pop text-coral">{penalty}</span>{/if}
      <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 tabular-nums {remaining < 60 ? 'bg-coral/25 text-coral' : 'bg-white/10'}">
        <Hourglass size={15} /> {fmtTime(remaining)}
      </span>
    {/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        `Tienes ${activity.minutes ?? 10} minutos para abrir ${total} candados.`,
        'Cada candado abierto te da un dígito del código de salida.',
        `Una respuesta incorrecta resta ${WRONG_PENALTY} s y cada pista resta ${HINT_PENALTY} s.`,
      ]}
    />
  {:else if phase === 'story'}
    <div class="pop mx-auto mt-10 max-w-xl text-center">
      <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun/20 text-sun"><KeyRound size={32} /></span>
      <h1 class="mt-5 font-display text-4xl font-extrabold">{activity.title}</h1>
      <p class="mt-5 text-lg leading-relaxed text-white/80">{activity.story || 'Estás encerrado. Abre todos los candados para escapar.'}</p>
      <button class="mt-8 inline-flex items-center gap-2 rounded-xl bg-sun px-6 py-3.5 font-semibold text-ink hover:brightness-105" onclick={enter}>
        <DoorOpen size={18} /> Entrar · el reloj empieza
      </button>
    </div>
  {:else if phase === 'level' || phase === 'digit' || phase === 'code'}
    <div class="mx-auto max-w-2xl">
      <!-- Mapa de candados -->
      <div class="flex items-center justify-center gap-2 sm:gap-3">
        {#each levels as _, i}
          {@const open = i < level || (i === level && phase !== 'level')}
          <div class="flex items-center gap-2 sm:gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl transition {open ? 'bg-teal text-white' : i === level ? 'bg-sun text-ink ring-4 ring-sun/25' : 'bg-white/8 text-white/35'}">
              {#if open}<LockOpen size={19} />{:else}<Lock size={19} />{/if}
            </span>
            {#if i < total - 1}<span class="h-0.5 w-3 sm:w-6 {i < level ? 'bg-teal' : 'bg-white/15'}"></span>{/if}
          </div>
        {/each}
      </div>

      <!-- Código reunido -->
      <div class="mt-6 flex items-center justify-center gap-2">
        <span class="mr-1 text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Código</span>
        {#each digits as d, i}
          {@const got = i < level || (i === level && phase !== 'level')}
          <span class="grid h-10 w-8 place-items-center rounded-lg font-display text-xl font-bold {got ? 'bg-white text-ink' : 'bg-white/8 text-white/30'}">{got ? d : '·'}</span>
        {/each}
      </div>

      {#if phase === 'level'}
        <form class="pop mt-8 rounded-3xl bg-white/6 p-6 sm:p-8" onsubmit={tryAnswer}>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-sun">Candado {level + 1} de {total}</p>
          {#if lv.clue}<p class="mt-3 italic text-white/70">{lv.clue}</p>{/if}
          <h2 class="mt-4 font-display text-3xl font-bold leading-tight">{lv.question}</h2>
          {#if hintShown && lv.hint}<p class="rise mt-4 rounded-xl bg-sun/15 px-4 py-3 text-sun">Pista: {lv.hint}</p>{/if}
          <div class="mt-6 flex flex-col gap-2 sm:flex-row">
            <input
              bind:this={input}
              bind:value
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="Escribe tu respuesta"
              class="flex-1 rounded-xl border-2 bg-white/5 px-4 py-3 text-lg outline-none transition {wrong ? 'shake border-coral' : 'border-white/15 focus:border-sun'}"
            />
            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-xl bg-sun px-5 py-3 font-semibold text-ink hover:brightness-105 disabled:opacity-40" disabled={!value.trim()}>
              <LockOpen size={17} /> Abrir
            </button>
          </div>
          {#if lv.hint && !hintShown}
            <button type="button" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white" onclick={showHint}>
              <Lightbulb size={15} /> Ver pista (−{HINT_PENALTY} s)
            </button>
          {/if}
        </form>
      {:else if phase === 'digit'}
        <div class="pop mt-8 rounded-3xl bg-teal/20 p-8 text-center">
          <p class="font-display text-2xl font-bold text-[#5fe0bf]">¡Candado abierto!</p>
          <p class="mt-2 text-white/80">Detrás de la puerta encuentras un papel con un número:</p>
          <p class="mx-auto mt-4 grid h-24 w-20 place-items-center rounded-2xl bg-white font-display text-6xl font-extrabold text-ink">{digits[level]}</p>
          <button class="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90" onclick={afterDigit}>
            {level < total - 1 ? 'Siguiente candado' : 'Ir a la salida'}
          </button>
        </div>
      {:else}
        <form class="pop mt-8 rounded-3xl bg-white/6 p-8 text-center" onsubmit={tryCode}>
          <p class="font-display text-2xl font-bold">La puerta de salida</p>
          <p class="mt-2 text-white/70">Escribe el código de {total} dígitos que reuniste, en orden.</p>
          <input
            bind:value={codeInput}
            inputmode="numeric"
            maxlength={total}
            autocomplete="off"
            class="mx-auto mt-6 block w-full max-w-xs rounded-2xl border-2 bg-white/5 px-4 py-4 text-center font-display text-4xl font-bold tracking-[0.4em] outline-none {codeWrong ? 'shake border-coral' : 'border-white/15 focus:border-sun'}"
          />
          <button type="submit" class="mt-5 inline-flex items-center gap-2 rounded-xl bg-sun px-6 py-3 font-semibold text-ink disabled:opacity-40" disabled={codeInput.length !== total}>
            <DoorOpen size={18} /> Abrir la salida
          </button>
        </form>
      {/if}
    </div>
  {:else if phase === 'won'}
    <ResultCard
      {name}
      tone="ink"
      icon={DoorOpen}
      title="¡Escapaste!"
      subtitle={`Te sobraron ${fmtTime(remaining)}.`}
      stats={[[`${clean}/${total}`, 'sin ayuda'], [errors, 'errores'], [hintsUsed, 'pistas']]}
      onreplay={start}
      {onexit}
    />
  {:else}
    <ResultCard
      {name}
      tone="ink"
      icon={Hourglass}
      title="Se acabó el tiempo"
      subtitle={`Abriste ${level} de ${total} candados. ¡Inténtalo otra vez!`}
      stats={[[`${level}/${total}`, 'candados'], [errors, 'errores'], [hintsUsed, 'pistas']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
