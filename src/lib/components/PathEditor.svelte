<script>
  import { ArrowUp, ArrowDown, Trash2, Plus } from '@lucide/svelte'
  import EditorFrame from './EditorFrame.svelte'
  import { session, saveActivity, allActivities } from '../store.svelte.js'
  import { blanks, examples } from '../samples.js'
  import { byType, tones, itemLabel } from '../catalog.js'

  let { activity, onclose, onsaved } = $props()
  const isNew = !activity
  let draft = $state(activity ? structuredClone($state.snapshot(activity)) : blanks.path())
  let errors = $state([])
  let toAdd = $state('')

  const available = $derived(allActivities().filter((a) => a.type !== 'path' && a.type !== 'board' && a.type !== 'wheel' && a.type !== 'bingo'))
  const byId = $derived(Object.fromEntries(allActivities().map((a) => [a.id, a])))

  function add() {
    if (!toAdd) return
    draft.steps.push(toAdd)
    toAdd = ''
  }

  function swap(i, j) {
    const s = draft.steps
    ;[s[i], s[j]] = [s[j], s[i]]
  }

  function save() {
    const e = []
    if (!draft.title.trim()) e.push('Ponle un título a la ruta.')
    const valid = draft.steps.filter((id) => byId[id])
    if (valid.length < 2) e.push('Agrega al menos 2 paradas a la ruta.')
    errors = e
    if (e.length) return scrollTo({ top: 0, behavior: 'smooth' })
    draft.steps = valid
    saveActivity($state.snapshot(draft))
    onsaved(draft.title)
  }
</script>

<EditorFrame kind="Mapa de aventura" tone="leaf" {isNew} {errors} {onclose} onsave={save} onexample={() => { draft = examples.path(); errors = [] }}>
  <div class="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
    <label class="block">
      <span class="text-sm font-semibold">Título</span>
      <input bind:value={draft.title} placeholder="p. ej. Unit 1 adventure" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-3 font-display text-lg font-bold outline-none focus:ring-4 focus:ring-leaf/20" />
    </label>
    <label class="block">
      <span class="text-sm font-semibold">Descripción <span class="font-normal text-slateink">(opcional)</span></span>
      <input bind:value={draft.description} placeholder="Objetivo de la ruta" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:ring-4 focus:ring-leaf/20" />
    </label>
  </div>

  <h2 class="mb-1 mt-10 font-display text-xl font-bold">Paradas <span class="text-slateink/60">({draft.steps.length})</span></h2>
  <p class="mb-4 text-sm text-slateink">Elige actividades que ya creaste, en el orden en que se deben completar. Cada parada se desbloquea al terminar la anterior.</p>

  <ol class="space-y-2">
    {#each draft.steps as id, i (id + '-' + i)}
      {@const a = byId[id]}
      <li class="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 pl-4">
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-leaf text-sm font-bold text-white">{i + 1}</span>
        {#if a}
          {@const c = byType[a.type]}
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg {tones[c.tone].tile}"><c.icon size={18} /></span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{a.title}</p>
            <p class="text-xs text-slateink">{c.name} · {itemLabel(a)}{#if a.status !== 'published'} · <span class="font-semibold text-coral">borrador: publícala para que los estudiantes puedan jugarla</span>{/if}</p>
          </div>
        {:else}
          <p class="flex-1 text-sm text-coral">Actividad eliminada (se quitará al guardar)</p>
        {/if}
        <button class="rounded-lg p-2 text-slateink hover:bg-ink/6 disabled:opacity-25" disabled={i === 0} aria-label="Subir" onclick={() => swap(i, i - 1)}><ArrowUp size={16} /></button>
        <button class="rounded-lg p-2 text-slateink hover:bg-ink/6 disabled:opacity-25" disabled={i === draft.steps.length - 1} aria-label="Bajar" onclick={() => swap(i, i + 1)}><ArrowDown size={16} /></button>
        <button class="rounded-lg p-2 text-slateink hover:bg-coral/10 hover:text-coral" aria-label="Quitar parada" onclick={() => draft.steps.splice(i, 1)}><Trash2 size={16} /></button>
      </li>
    {/each}
  </ol>

  <div class="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 p-3">
    <select bind:value={toAdd} class="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm">
      <option value="">Elige una actividad para agregar…</option>
      {#each available as a (a.id)}<option value={a.id}>{a.title} · {byType[a.type].name}{a.ownerUid !== session.user?.uid && a.ownerName ? ` · ${a.ownerName}` : ''}</option>{/each}
    </select>
    <button class="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40" disabled={!toAdd} onclick={add}><Plus size={16} /> Agregar parada</button>
  </div>
</EditorFrame>
