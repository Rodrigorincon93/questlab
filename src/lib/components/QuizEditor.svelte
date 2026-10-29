<script>
  import { Plus, Trash2, Check } from '@lucide/svelte'
  import EditorFrame from './EditorFrame.svelte'
  import { db, saveActivity } from '../store.svelte.js'
  import { blanks, examples } from '../samples.js'
  import { byType } from '../catalog.js'

  let { type = 'quiz', activity, onclose, onsaved } = $props()
  const cfg = byType[type]
  const isBoard = type === 'board'
  const isNew = !activity
  let draft = $state(activity ? structuredClone($state.snapshot(activity)) : blanks[type]())
  let importFrom = $state('')
  const sources = $derived(db.activities.filter((a) => (a.type === 'quiz' || a.type === 'board') && a.id !== draft.id))

  function importQuestions() {
    const src = sources.find((a) => a.id === importFrom)
    if (!src) return
    const qs = structuredClone($state.snapshot(src.questions))
    const empty = draft.questions.length === 1 && !draft.questions[0].text.trim()
    draft.questions = empty ? qs : [...draft.questions, ...qs]
    importFrom = ''
  }
  let errors = $state([])

  const letters = ['A', 'B', 'C', 'D']

  function addQuestion() {
    draft.questions.push({ text: '', options: ['', '', '', ''], correct: 0 })
  }

  function validate() {
    const e = []
    if (!draft.title.trim()) e.push('Ponle un título a la actividad.')
    if (draft.questions.length === 0) e.push('Agrega al menos una pregunta.')
    if (isBoard) {
      const teams = String(draft.teams).split(',').map((x) => x.trim()).filter(Boolean)
      if (teams.length < 2 || teams.length > 4) e.push('Escribe entre 2 y 4 equipos, separados por comas.')
      if (draft.questions.length < 6) e.push('Para la carrera conviene tener al menos 6 preguntas.')
    }
    draft.questions.forEach((q, i) => {
      if (!q.text.trim()) e.push(`La pregunta ${i + 1} no tiene enunciado.`)
      if (q.options.some((o) => !o.trim())) e.push(`La pregunta ${i + 1} tiene opciones vacías.`)
    })
    return e
  }

  function save() {
    errors = validate()
    if (errors.length) {
      scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    saveActivity($state.snapshot(draft))
    onsaved(draft.title)
  }
</script>

<EditorFrame kind={cfg.name} tone={cfg.tone} {isNew} {errors} {onclose} onsave={save} onexample={() => { draft = examples[type](); errors = [] }}>
  <div class="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
    <label class="block">
      <span class="text-sm font-semibold">Título</span>
      <input bind:value={draft.title} placeholder="p. ej. Daily routines" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-3 font-display text-lg font-bold outline-none focus:border-coral focus:ring-4 focus:ring-coral/15" />
    </label>
    <label class="block">
      <span class="text-sm font-semibold">Descripción <span class="font-normal text-slateink">(opcional)</span></span>
      <input bind:value={draft.description} placeholder="Tema, nivel u objetivo" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-coral focus:ring-4 focus:ring-coral/15" />
    </label>
    {#if isBoard}
      <label class="block">
        <span class="text-sm font-semibold">Equipos <span class="font-normal text-slateink">(2 a 4, separados por comas)</span></span>
        <input bind:value={draft.teams} placeholder="Equipo Rojo, Equipo Azul" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/15" />
      </label>
      <label class="flex items-center gap-3">
        <span class="text-sm font-semibold">Largo del tablero</span>
        <select bind:value={draft.boardLength} class="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
          {#each [[18, '18 casillas · corta'], [24, '24 casillas · normal'], [32, '32 casillas · larga']] as [v, l]}<option value={v}>{l}</option>{/each}
        </select>
      </label>
    {:else}
      <label class="flex items-center gap-3">
        <span class="text-sm font-semibold">Tiempo por pregunta</span>
        <select bind:value={draft.timeLimit} class="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
          {#each [10, 15, 20, 30, 45, 60] as s}<option value={s}>{s} segundos</option>{/each}
        </select>
      </label>
    {/if}
  </div>

  <div class="mb-3 mt-10 flex flex-wrap items-end justify-between gap-3">
    <h2 class="font-display text-xl font-bold">Preguntas <span class="text-slateink/60">({draft.questions.length})</span></h2>
    {#if sources.length}
      <div class="flex items-center gap-2 text-sm">
        <select bind:value={importFrom} class="max-w-56 rounded-xl border border-ink/15 bg-white px-3 py-2">
          <option value="">Importar preguntas de…</option>
          {#each sources as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
        </select>
        <button class="rounded-xl bg-ink/6 px-3 py-2 font-semibold hover:bg-ink/10 disabled:opacity-40" disabled={!importFrom} onclick={importQuestions}>Importar</button>
      </div>
    {/if}
  </div>
  <div class="space-y-4">
    {#each draft.questions as q, qi (q)}
      <div class="rounded-2xl border border-ink/10 bg-white p-5">
        <div class="flex items-start gap-3">
          <span class="mt-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-coral/12 text-sm font-bold text-coral">{qi + 1}</span>
          <input bind:value={q.text} placeholder="Escribe la pregunta… (usa ___ para el espacio en blanco)" class="w-full rounded-xl border border-ink/15 px-4 py-2.5 font-medium outline-none focus:border-coral focus:ring-4 focus:ring-coral/15" />
          <button class="mt-1 rounded-xl p-2.5 text-slateink hover:bg-coral/10 hover:text-coral" aria-label="Eliminar pregunta {qi + 1}" onclick={() => draft.questions.splice(qi, 1)}>
            <Trash2 size={17} />
          </button>
        </div>
        <div class="mt-3 grid gap-2 pl-10 sm:grid-cols-2">
          {#each q.options as _, oi}
            <div class="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition {q.correct === oi ? 'border-teal bg-teal/6' : 'border-ink/12'}">
              <button
                class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold transition {q.correct === oi ? 'bg-teal text-white' : 'bg-ink/6 text-slateink hover:bg-ink/12'}"
                title="Marcar como correcta"
                aria-label="Marcar opción {letters[oi]} como correcta"
                aria-pressed={q.correct === oi}
                onclick={() => (q.correct = oi)}
              >
                {#if q.correct === oi}<Check size={15} strokeWidth={3} />{:else}{letters[oi]}{/if}
              </button>
              <input bind:value={q.options[oi]} placeholder="Opción {letters[oi]}" class="w-full bg-transparent px-1 py-1 text-sm outline-none" />
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <button class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 py-4 text-sm font-semibold text-slateink hover:border-coral hover:text-coral" onclick={addQuestion}>
    <Plus size={17} /> Agregar pregunta
  </button>
  <p class="mt-3 text-center text-xs text-slateink/70">Toca la letra de una opción para marcarla como la respuesta correcta.</p>
</EditorFrame>
