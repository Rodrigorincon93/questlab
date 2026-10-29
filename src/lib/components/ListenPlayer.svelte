<script>
  import { Volume2, Snail, Check } from '@lucide/svelte'
  import PlayerShell from './PlayerShell.svelte'
  import PlayerIntro from './PlayerIntro.svelte'
  import ResultCard from './ResultCard.svelte'
  import { addResult } from '../store.svelte.js'
  import { shuffle, norm } from '../catalog.js'
  import { speak, canSpeak } from '../speech.js'

  let { activity, onexit, playerName = '' } = $props()

  let phase = $state('intro')
  let name = $state(playerName)
  let queue = $state([])
  let value = $state('')
  let status = $state('idle') // idle | wrong | right | revealed
  let attempts = $state(0)
  let plays = $state(0)
  let failed = $state(new Set())
  let solved = $state(0)
  let errors = $state(0)
  let input = $state()

  const total = $derived(activity.items.length)
  const item = $derived(queue[0])
  const done = $derived(status === 'right' || status === 'revealed')

  // Compara sin importar mayúsculas, puntuación ni contracciones simples.
  function clean(s) {
    return norm(s).replace(/[.,!?;:"]/g, '').replace(/\s+/g, ' ').trim()
  }

  function play(slow = false) {
    plays += 1
    speak(item.text, slow ? 0.55 : 0.9)
    setTimeout(() => input?.focus(), 30)
  }

  function load() {
    value = ''
    status = 'idle'
    attempts = 0
    plays = 0
    setTimeout(() => play(), 350)
  }

  function start() {
    queue = shuffle(activity.items.map((it, id) => ({ ...it, id })))
    failed = new Set()
    solved = 0
    errors = 0
    phase = 'play'
    load()
  }

  function submit(e) {
    e.preventDefault()
    if (done) return next()
    if (!value.trim()) return
    if (clean(value) === clean(item.text)) status = 'right'
    else {
      attempts += 1
      errors += 1
      failed = new Set([...failed, item.id])
      status = attempts >= 2 ? 'revealed' : 'wrong'
      if (status === 'wrong') setTimeout(() => input?.focus(), 30)
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
    const ok = total - failed.size
    addResult({
      activityId: activity.id,
      activityTitle: activity.title,
      type: 'listen',
      student: name.trim(),
      accuracy: Math.round((ok / total) * 100),
      detail: `${ok}/${total} al primer intento · ${errors} error${errors === 1 ? '' : 'es'}`,
    })
  }

  // Marca en qué palabras se equivocó el estudiante.
  const diff = $derived.by(() => {
    if (status === 'idle' || !item) return []
    const want = clean(item.text).split(' ')
    const got = clean(value).split(' ')
    return item.text.trim().split(/\s+/).map((w, i) => ({ w, ok: got[i] === want[i] }))
  })
</script>

<PlayerShell {onexit}>
  {#snippet right()}
    {#if phase === 'play'}<span class="tabular-nums">{solved}/{total} audios</span>{/if}
  {/snippet}

  {#if phase === 'intro'}
    <PlayerIntro
      {activity}
      bind:name
      onstart={start}
      rules={[
        canSpeak ? 'Escucha con atención y escribe exactamente lo que oyes.' : 'Este navegador no puede reproducir la voz; prueba en Chrome o Edge.',
        'Puedes repetir el audio las veces que quieras, también en cámara lenta.',
        'Tienes dos intentos. No importan mayúsculas ni signos de puntuación.',
      ]}
    />
  {:else if phase === 'play' && item}
    <form class="mx-auto max-w-2xl text-center" onsubmit={submit}>
      <div class="h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-sky transition-all" style="width:{(solved / total) * 100}%"></div>
      </div>

      <div class="mt-12 flex items-center justify-center gap-4">
        <button type="button" class="grid h-28 w-28 place-items-center rounded-full bg-sky shadow-[0_0_0_10px_rgba(42,114,214,.2)] transition hover:scale-105 active:scale-95" aria-label="Escuchar" onclick={() => play()}>
          <Volume2 size={46} />
        </button>
        <button type="button" class="grid h-16 w-16 place-items-center rounded-full bg-white/10 transition hover:bg-white/15" aria-label="Escuchar lento" title="Más lento" onclick={() => play(true)}>
          <Snail size={26} />
        </button>
      </div>
      <p class="mt-4 text-sm text-white/50">Escuchado {plays} {plays === 1 ? 'vez' : 'veces'}</p>

      <input
        bind:this={input}
        bind:value
        readonly={done}
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Escribe lo que escuchas"
        class="mt-8 w-full rounded-2xl border-2 bg-white/5 px-5 py-4 text-center font-display text-2xl font-bold outline-none transition
          {status === 'right' ? 'border-[#5fe0bf] text-[#5fe0bf]' : status === 'wrong' ? 'shake border-coral' : status === 'revealed' ? 'border-sun' : 'border-white/15 focus:border-sky'}"
      />

      {#if status === 'wrong' || status === 'revealed'}
        <p class="rise mt-4 flex flex-wrap justify-center gap-1.5 text-lg">
          {#each diff as d}
            <span class="rounded-md px-1.5 {d.ok ? 'text-[#5fe0bf]' : status === 'revealed' ? 'bg-sun/20 text-sun' : 'bg-coral/20 text-coral'}">{status === 'revealed' || d.ok ? d.w : '•'.repeat(Math.min(d.w.length, 6))}</span>
          {/each}
        </p>
      {/if}
      {#if done && item.translation}<p class="rise mt-3 text-white/60">«{item.translation}»</p>{/if}

      <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
        {#if done}
          <p class="rise w-full font-display text-xl font-bold {status === 'right' ? 'text-[#5fe0bf]' : 'text-sun'}">
            {status === 'right' ? (attempts === 0 ? '¡Perfecto!' : '¡Bien, al segundo intento!') : 'Esta era la respuesta. Volverá al final.'}
          </p>
          <button type="submit" class="rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90">Siguiente</button>
        {:else}
          <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-ink hover:bg-white/90 disabled:opacity-40" disabled={!value.trim()}><Check size={17} strokeWidth={3} /> Comprobar</button>
          {#if status === 'wrong'}<p class="w-full text-coral">Las palabras en verde están bien. Te queda un intento.</p>{/if}
        {/if}
      </div>
    </form>
  {:else}
    {@const ok = total - failed.size}
    <ResultCard
      {name}
      tone="sky"
      icon={Volume2}
      title="¡Dictado terminado!"
      stats={[[`${ok}/${total}`, 'al primer intento'], [errors, 'errores'], [`${Math.round((ok / total) * 100)}%`, 'aciertos']]}
      onreplay={start}
      {onexit}
    />
  {/if}
</PlayerShell>
