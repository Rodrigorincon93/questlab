<script>
  import { Plus, Trash2 } from '@lucide/svelte'
  import EditorFrame from './EditorFrame.svelte'
  import { saveActivity } from '../store.svelte.js'
  import { blanks, examples } from '../samples.js'
  import { byType, tones } from '../catalog.js'

  let { type, activity, onclose, onsaved } = $props()
  const cfg = byType[type]
  const t = tones[cfg.tone]
  const isNew = !activity
  let draft = $state(activity ? structuredClone($state.snapshot(activity)) : blanks[type]())
  let errors = $state([])

  const items = $derived(draft[cfg.itemsKey])
  const [one, many] = cfg.unit
  const capOne = one[0].toUpperCase() + one.slice(1)

  function emptyItem() {
    return Object.fromEntries(cfg.fields.map((f) => [f.key, '']))
  }

  function validate() {
    const e = []
    if (!draft.title.trim()) e.push('Ponle un título a la actividad.')
    if (items.length < cfg.min) e.push(`Agrega al menos ${cfg.min} ${many}.`)
    if (items.length > cfg.max) e.push(`Usa como máximo ${cfg.max} ${many}.`)
    items.forEach((it, i) => {
      for (const f of cfg.fields) if (f.required && !String(it[f.key] ?? '').trim()) e.push(`${capOne} ${i + 1}: falta «${f.label.replace(/ \(.*\)$/, '')}».`)
      const extra = cfg.validateItem?.(it, i + 1)
      if (extra) e.push(extra)
    })
    const all = cfg.validateAll?.(items)
    if (all) e.push(all)
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

  const inputCls = `w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 outline-none focus:ring-4 ${t.ring}`
</script>

<EditorFrame kind={cfg.name} tone={cfg.tone} {isNew} {errors} {onclose} onsave={save} onexample={() => { draft = examples[type](); errors = [] }}>
  <div class="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
    <label class="block">
      <span class="text-sm font-semibold">Título</span>
      <input bind:value={draft.title} placeholder="Nombre de la actividad" class="mt-1.5 {inputCls} px-4 py-3 font-display text-lg font-bold" />
    </label>
    <label class="block">
      <span class="text-sm font-semibold">Descripción <span class="font-normal text-slateink">(opcional)</span></span>
      <input bind:value={draft.description} placeholder="Tema, nivel u objetivo" class="mt-1.5 {inputCls}" />
    </label>
    {#each cfg.settings ?? [] as s (s.key)}
      <label class="block">
        <span class="text-sm font-semibold">{s.label}</span>
        {#if s.kind === 'select'}
          <select bind:value={draft[s.key]} class="mt-1.5 block rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm">
            {#each s.options as [value, label]}<option {value}>{label}</option>{/each}
          </select>
        {:else if s.kind === 'textarea'}
          <textarea bind:value={draft[s.key]} rows="3" placeholder={s.placeholder} class="mt-1.5 {inputCls}"></textarea>
        {:else}
          <input bind:value={draft[s.key]} placeholder={s.placeholder} class="mt-1.5 {inputCls}" />
        {/if}
      </label>
    {/each}
  </div>

  <h2 class="mb-3 mt-10 font-display text-xl font-bold">{many[0].toUpperCase() + many.slice(1)} <span class="text-slateink/60">({items.length})</span></h2>
  <div class="space-y-3">
    {#each items as it, i (it)}
      <div class="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
        <div class="mb-3 flex items-center justify-between">
          <span class="inline-flex items-center gap-2 text-sm font-semibold">
            <span class="grid h-7 w-7 place-items-center rounded-lg text-sm font-bold {t.tile}">{i + 1}</span>
            {capOne}
          </span>
          <button class="rounded-xl p-2 text-slateink hover:bg-coral/10 hover:text-coral" aria-label="Eliminar {one} {i + 1}" onclick={() => draft[cfg.itemsKey].splice(i, 1)}>
            <Trash2 size={17} />
          </button>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          {#each cfg.fields as f (f.key)}
            <label class="block {f.size === 'lg' ? 'sm:col-span-2' : ''}">
              <span class="text-xs font-semibold text-slateink">{f.label}</span>
              <input bind:value={it[f.key]} placeholder={f.placeholder} class="mt-1 {inputCls}" />
            </label>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <button class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 py-4 text-sm font-semibold text-slateink hover:border-ink/40 hover:text-ink" onclick={() => draft[cfg.itemsKey].push(emptyItem())}>
    <Plus size={17} /> Agregar {one}
  </button>
</EditorFrame>
