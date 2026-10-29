<script>
  import { X } from '@lucide/svelte'
  import { catalog, groups, tones } from '../catalog.js'
  import { db, isEnabled, setTypeEnabled, setAllTypes } from '../store.svelte.js'

  let { onclose } = $props()
  const enabledCount = $derived(catalog.length - db.settings.disabledTypes.length)

  function onkey(e) {
    if (e.key === 'Escape') onclose()
  }
</script>

<svelte:window onkeydown={onkey} />

<div class="fixed inset-0 z-40 flex justify-end bg-ink/40 backdrop-blur-[2px]" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="rise flex h-full w-full max-w-md flex-col bg-paper shadow-2xl" role="dialog" aria-modal="true" aria-label="Tipos de actividad">
    <header class="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
      <div>
        <h2 class="font-display text-2xl font-bold">Tipos de actividad</h2>
        <p class="mt-0.5 text-sm text-slateink">Activa solo los que usas. Los desactivados no aparecen en «Crear actividad» y sus actividades no se pueden jugar.</p>
      </div>
      <button class="rounded-xl p-2 text-slateink hover:bg-ink/6" aria-label="Cerrar" onclick={onclose}><X size={20} /></button>
    </header>

    <div class="flex items-center justify-between gap-2 px-6 py-3 text-sm">
      <span class="font-semibold">{enabledCount} de {catalog.length} activos</span>
      <span class="flex gap-1">
        <button class="rounded-lg px-2.5 py-1.5 font-semibold text-teal hover:bg-teal/10" onclick={() => setAllTypes(true)}>Activar todos</button>
        <button class="rounded-lg px-2.5 py-1.5 font-semibold text-slateink hover:bg-ink/6" onclick={() => setAllTypes(false, catalog.map((c) => c.type))}>Desactivar todos</button>
      </span>
    </div>

    <div class="flex-1 space-y-6 overflow-y-auto px-6 pb-8">
      {#each groups as g (g.id)}
        <section>
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slateink">{g.title}</p>
          <ul class="divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/10 bg-white">
            {#each catalog.filter((c) => c.group === g.id) as c (c.type)}
              {@const on = isEnabled(c.type)}
              <li>
                <label class="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-ink/3">
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg {on ? tones[c.tone].tile : 'bg-ink/5 text-slateink/50'}"><c.icon size={18} /></span>
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold {on ? '' : 'text-slateink/60'}">{c.name}</span>
                    <span class="block truncate text-xs text-slateink/80">{c.desc}</span>
                  </span>
                  <input type="checkbox" class="peer sr-only" checked={on} onchange={(e) => setTypeEnabled(c.type, e.currentTarget.checked)} />
                  <span class="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition peer-checked:bg-teal peer-focus-visible:ring-4 peer-focus-visible:ring-teal/25 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"></span>
                </label>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  </div>
</div>
