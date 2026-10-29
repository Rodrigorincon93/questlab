<script>
  import { Play, Pencil, Copy, Trash2, Plus, Link, Globe, Lock, Download, Check } from '@lucide/svelte'
  import { db, deleteActivity, duplicateActivity, isEnabled, setStatus, shareLink, importSamples } from '../store.svelte.js'
  import { byType, catalog, tones, itemLabel, fmtDate } from '../catalog.js'

  let { onplay, onedit, oncreate, onmanage, ontoast } = $props()
  let confirmId = $state(null)
  let filter = $state('all')
  let importing = $state(false)
  let copied = $state(null)

  const sorted = $derived([...db.activities].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)))
  const presentTypes = $derived(catalog.filter((c) => db.activities.some((a) => a.type === c.type)))
  const list = $derived(filter === 'all' ? sorted : sorted.filter((a) => a.type === filter))
  const hiddenCount = $derived(db.activities.filter((a) => !isEnabled(a.type)).length)

  function playsOf(id) {
    return db.results.filter((r) => r.activityId === id).length
  }

  async function doImport() {
    importing = true
    try {
      await importSamples()
      ontoast?.('Ejemplos importados y publicados')
    } finally {
      importing = false
    }
  }

  async function copyLink(a) {
    const url = shareLink(a.id)
    try {
      await navigator.clipboard.writeText(url)
      copied = a.id
      setTimeout(() => (copied = null), 1800)
      ontoast?.(a.status === 'published' ? 'Enlace copiado: compártelo con tus estudiantes' : 'Enlace copiado. Publica la actividad para que funcione con tus estudiantes')
    } catch {
      ontoast?.(url)
    }
  }
</script>

{#if db.loading}
  <p class="py-16 text-center text-slateink">Cargando tus actividades…</p>
{:else if db.activities.length === 0}
  <div class="rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-14 text-center">
    <p class="font-display text-xl font-bold">Todavía no tienes actividades en la nube</p>
    <p class="mx-auto mt-1 max-w-lg text-sm text-slateink">Crea la primera desde «Crear actividad», copia alguna de la Biblioteca o importa los 16 ejemplos de nivel A1 para empezar con todo listo.</p>
    <div class="mt-6 flex flex-wrap justify-center gap-2">
      <button class="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={importing} onclick={doImport}>
        <Download size={16} /> {importing ? 'Importando…' : 'Importar los 16 ejemplos'}
      </button>
      <button class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-ink/15" onclick={oncreate}>
        <Plus size={16} /> Crear actividad
      </button>
    </div>
  </div>
{:else}
  <div class="mb-5 flex flex-wrap gap-2">
    <button class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition {filter === 'all' ? 'bg-ink text-white' : 'bg-white text-slateink ring-1 ring-ink/10 hover:ring-ink/25'}" onclick={() => (filter = 'all')}>Todas · {db.activities.length}</button>
    {#each presentTypes as c (c.type)}
      <button class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition {filter === c.type ? 'bg-ink text-white' : 'bg-white text-slateink ring-1 ring-ink/10 hover:ring-ink/25'} {isEnabled(c.type) ? '' : 'opacity-50'}" onclick={() => (filter = c.type)}>
        <span class="h-2 w-2 rounded-full {tones[c.tone].dot}"></span>{c.name}
      </button>
    {/each}
  </div>
  {#if hiddenCount}
    <p class="mb-4 rounded-xl bg-ink/5 px-4 py-2.5 text-sm text-slateink">
      {hiddenCount} actividad{hiddenCount === 1 ? '' : 'es'} de tipos desactivados no se pueden jugar desde este panel.
      <button class="font-semibold text-ink underline-offset-4 hover:underline" onclick={onmanage}>Cambiar tipos activos</button>
    </p>
  {/if}
  <ul class="grid gap-4">
    {#each list as a (a.id)}
      {@const c = byType[a.type]}
      {@const t = tones[c.tone]}
      {@const on = isEnabled(a.type)}
      {@const pub = a.status === 'published'}
      <li class="rounded-2xl border border-ink/10 bg-white p-5 {on ? '' : 'opacity-55'}">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl {t.tile}">
            <c.icon size={22} strokeWidth={2.2} />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 class="truncate font-display text-lg font-bold">{a.title}</h3>
              <span class="text-xs font-semibold {t.text}">{c.name}</span>
              <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold {pub ? 'bg-teal/12 text-teal' : 'bg-ink/8 text-slateink'}">
                {#if pub}<Globe size={12} /> Publicada{:else}<Lock size={12} /> Borrador{/if}
              </span>
              {#if !on}<span class="rounded-full bg-ink/8 px-2 py-0.5 text-[11px] font-semibold text-slateink">Tipo desactivado</span>{/if}
            </div>
            <p class="mt-0.5 truncate text-sm text-slateink">{a.description || 'Sin descripción'}</p>
            <p class="mt-1 text-xs text-slateink/70">
              {itemLabel(a)} · {playsOf(a.id)} partida{playsOf(a.id) === 1 ? '' : 's'} · editada {fmtDate(a.updatedAt)}{#if a.copiedFrom?.owner} · copiada de {a.copiedFrom.owner}{/if}
            </p>
          </div>

          {#if confirmId === a.id}
            <div class="pop flex items-center gap-2 rounded-xl bg-coral/8 p-2 pl-3 text-sm">
              <span class="font-medium text-coral">¿Eliminar para siempre?</span>
              <button class="rounded-lg bg-coral px-3 py-1.5 font-semibold text-white" onclick={() => { deleteActivity(a.id); confirmId = null }}>Sí, eliminar</button>
              <button class="rounded-lg px-3 py-1.5 font-semibold text-slateink hover:bg-ink/5" onclick={() => (confirmId = null)}>Cancelar</button>
            </div>
          {:else}
            <div class="flex flex-wrap items-center gap-1.5">
              <button class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-slateink {on ? t.btn : ''}" disabled={!on} onclick={() => onplay(a)}>
                <Play size={15} fill="currentColor" /> Jugar
              </button>
              <button class="rounded-xl p-2.5 text-slateink hover:bg-ink/6" title="Editar" aria-label="Editar" onclick={() => onedit(a)}><Pencil size={17} /></button>
              <button class="rounded-xl p-2.5 text-slateink hover:bg-ink/6" title="Duplicar" aria-label="Duplicar" onclick={() => duplicateActivity(a.id)}><Copy size={17} /></button>
              <button class="rounded-xl p-2.5 text-slateink hover:bg-coral/10 hover:text-coral" title="Eliminar" aria-label="Eliminar" onclick={() => (confirmId = a.id)}><Trash2 size={17} /></button>
            </div>
          {/if}
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-3 text-sm">
          <button
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition {pub ? 'bg-ink/6 text-slateink hover:bg-ink/10' : 'bg-teal text-white hover:bg-teal/90'}"
            onclick={() => setStatus(a.id, pub ? 'draft' : 'published')}
          >
            {#if pub}<Lock size={14} /> Pasar a borrador{:else}<Globe size={14} /> Publicar para estudiantes{/if}
          </button>
          <button class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-slateink hover:bg-ink/6" onclick={() => copyLink(a)}>
            {#if copied === a.id}<Check size={14} /> Copiado{:else}<Link size={14} /> Copiar enlace para estudiantes{/if}
          </button>
          {#if !pub}<span class="text-xs text-slateink/70">Solo tú puedes verla mientras sea borrador.</span>{/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}
