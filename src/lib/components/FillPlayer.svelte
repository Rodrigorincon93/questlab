<script>
  import { Lightbulb, Check, Volume2 } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle, accepted, norm } from '../catalog.js'
  import { speak, canSpeak } from '../speech.js'

  let { activity, onexit, playerName = '' } = $props()

  let phase = $state('intro')
  let name = $state(playerName)
  let queue = $state([])
  let value = $state('')
  let status = $state('idle') // idle | wrong | right | revealed
  let attempts = $state(0)
  let showHint = $state(false)
  let failed = $state(new Set())
  let solved = $state(0)
  let errors = $state(0)
  let input = $state()

  const total = $derived(activity.items.length)
  const item = $derived(queue[0])
  const parts = $derived(item ? item.sentence.split('___') : [])
  const done = $derived(status === 'right' || status === 'revealed')

  function focusInput() {
    setTimeout(() => input?.focus(), 30)
  }

  function load() {
    value = ''
    status = 'idle'
    attempts = 0
    showHint = false
    focusInput()
  }

  function start() {
    queue = shuffle(activity.items.map((it, id) => ({ ...it, id })))
    failed = new Set()
    solved = 0
    errors = 0
    phase = 'play'
    load()
  }

  function full(ans) {
    return item.sentence.replace('___', ans)
  }

  function submit(e) {
    e.preventDefault()
    if (done) return next()
    if (!value.trim()) return
    if (accepted(item).includes(norm(value))) {
      status = 'right'
      speak(full(value.trim()))
    } else {
      attempts += 1
      errors += 1
      failed = new Set([...failed, item.id])
      if (attempts >= 2) {
        status = 'revealed'
        value = item.answer
        speak(full(item.answer))
      } else {
        status = 'wrong'
        focusInput()
      }
    }
  }

  function next() {
    const [cur, ...rest] = queue
    if (status === 'revealed') queue = [...rest, cur]
    else {
      solved += 1
      queue = rest
    }
    if (!queue.length) return finish()
    load()
  }

  function finish() {
    phase = 'end'
    const clean = total - failed.size
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'fill',
      student: name.trim(),
      accuracy: Math.round((clean / total) * 100),
      detail: `${clean}/${total} al primer intento · ${errors} error${errors === 1 ? '' : 'es'}`,
    })
  }
</script>

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}<span class="tabular-nums">{solved}/{total} frases</span>{/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        'Escribe la palabra que falta y pulsa Enter.',
        'Tienes dos intentos por frase. No importan mayúsculas ni tildes.',
        'Las frases que falles volverán al final.',
      ]}
    />
  {:else if phase === 'play' && item}
    <form class="mx-auto max-w-3xl text-center" onsubmit={submit}>
      <div class="h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-rose transition-all" style="width:{(solved / total) * 100}%"></div>
      </div>

      <p class="mt-14 font-display text-2xl font-bold leading-[2.2] sm:text-4xl">
        {parts[0]}<input
          bind:this={input}
          bind:value
          readonly={done}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Respuesta"
          style="width: {Math.max(4, value.length + 1)}ch"
          class="mx-1 inline-block rounded-lg border-b-4 bg-white/10 px-2 text-center outline-none transition
            {status === 'right' ? 'border-[#5fe0bf] text-[#5fe0bf]' : status === 'wrong' ? 'shake border-coral text-white' : status === 'revealed' ? 'border-sun text-sun' : 'border-rose text-white focus:bg-white/15'}"
        />{parts.slice(1).join('___')}
      </p>

      {#if showHint && item.hint}<p class="rise mt-4 text-sun">Pista: {item.hint}</p>{/if}

      <div class="mt-10 flex flex-wrap items-center justify-center gap-2">
        {#if done}
          <p class="rise w-full font-display text-xl font-bold {status === 'right' ? 'text-[#5fe0bf]' : 'text-sun'}">
            {status === 'right' ? (attempts === 0 ? '¡Correcto!' : '¡Bien, al segundo intento!') : `La respuesta era «${item.answer}». Volverá al final.`}
          </p>
          {#if canSpeak}<button type="button" class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15" onclick={() => speak(full(item.answer))}><Volume2 size={17} /> Escuchar</button>{/if}
          <button type="submit" class="rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90">Siguiente</button>
        {:else}
          {#if item.hint}
            <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-30" disabled={showHint} onclick={() => { showHint = true; focusInput() }}><Lightbulb size={17} /> Pista</button>
          {/if}
          <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90 disabled:opacity-40" disabled={!value.trim()}><Check size={17} strokeWidth={3} /> Comprobar</button>
          {#if status === 'wrong'}<p class="w-full text-coral">Casi. Te queda un intento.</p>{/if}
        {/if}
      </div>
    </form>
  {:else}
    {@const clean = total - failed.size}
    <ResultCard
      {name}
      tone="rose"
      title="¡Frases completadas!"
      stats={[[`${clean}/${total}`, 'al primer intento'], [errors, 'errores'], [`${Math.round((clean / total) * 100)}%`, 'aciertos']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
