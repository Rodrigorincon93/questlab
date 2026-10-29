<script>
  import { Plus, Trash2, ArrowRight } from '@lucide/svelte'
  import EditorFrame from './EditorFrame.svelte'
  import { saveActivity } from '../store.svelte.js'
  import { blankMatch, exampleMatch } from '../samples.js'

  let { activity, onclose, onsaved } = $props()
  const isNew = !activity
  let draft = $state(activity ? structuredClone($state.snapshot(activity)) : blankMatch())
  let errors = $state([])

  function validate() {
    const e = []
    if (!draft.title.trim()) e.push('Ponle un título a la actividad.')
    if (draft.pairs.length < 3) e.push('Agrega al menos 3 parejas.')
    if (draft.pairs.length > 10) e.push('Usa como máximo 10 parejas para que quepan en pantalla.')
    draft.pairs.forEach((p, i) => {
      if (!p.term.trim() || !p.match.trim()) e.push(`La pareja ${i + 1} está incompleta.`)
    })
    const terms = draft.pairs.map((p) => p.term.trim().toLowerCase()).filter(Boolean)
    const matches = draft.pairs.map((p) => p.match.trim().toLowerCase()).filter(Boolean)
    if (new Set(terms).size !== terms.length || new Set(matches).size !== matches.length)
      e.push('Hay palabras repetidas: cada elemento debe ser único para que no haya dos respuestas válidas.')
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

<EditorFrame kind="Relaciona" tone="teal" {isNew} {errors} {onclose} onsave={save} onexample={() => { draft = exampleMatch(); errors = [] }}>
  <div class="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
    <label class="block">
      <span class="text-sm font-semibold">Título</span>
      <input bind:value={draft.title} placeholder="p. ej. Jobs and places" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-3 font-display text-lg font-bold outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
    </label>
    <label class="block">
      <span class="text-sm font-semibold">Descripción <span class="font-normal text-slateink">(opcional)</span></span>
      <input bind:value={draft.description} placeholder="Tema, nivel u objetivo" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
    </label>
  </div>

  <h2 class="mb-3 mt-10 font-display text-xl font-bold">Parejas <span class="text-slateink/60">({draft.pairs.length})</span></h2>
  <div class="rounded-2xl border border-ink/10 bg-white p-3 sm:p-5">
    <div class="hidden grid-cols-[2rem_1fr_1.5rem_1fr_2.75rem] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-slateink sm:grid">
      <span></span><span>Palabra</span><span></span><span>Su pareja</span><span></span>
    </div>
    <div class="space-y-2">
      {#each draft.pairs as p, i (p)}
        <div class="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 sm:grid-cols-[2rem_1fr_1.5rem_1fr_2.75rem]">
          <span class="grid h-7 w-7 place-items-center rounded-lg bg-teal/12 text-sm font-bold text-teal">{i + 1}</span>
          <input bind:value={p.term} placeholder="teacher" class="min-w-0 rounded-xl border border-ink/15 px-3 py-2.5 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
          <span class="hidden justify-center text-slateink/50 sm:flex"><ArrowRight size={16} /></span>
          <input bind:value={p.match} placeholder="school" class="min-w-0 rounded-xl border border-ink/15 px-3 py-2.5 outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
          <button class="rounded-xl p-2.5 text-slateink hover:bg-coral/10 hover:text-coral" aria-label="Eliminar pareja {i + 1}" onclick={() => draft.pairs.splice(i, 1)}>
            <Trash2 size={17} />
          </button>
        </div>
      {/each}
    </div>
  </div>

  <button class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 py-4 text-sm font-semibold text-slateink hover:border-teal hover:text-teal" onclick={() => draft.pairs.push({ term: '', match: '' })}>
    <Plus size={17} /> Agregar pareja
  </button>
</EditorFrame>
