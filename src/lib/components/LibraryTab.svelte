<script>
  import { Play, CopyPlus, Search } from '@lucide/svelte'
  import { db, session, copyToMine, isEnabled } from '../store.svelte.js'
  import { byType, catalog, tones, itemLabel } from '../catalog.js'

  // Para docentes: actividades publicadas por OTROS docentes. Para estudiantes: todas las publicadas.
  let { onplay, ontoast, mode = 'teacher' } = $props()
  let filter = $state('all')
  let q = $state('')

  const base = $derived(
    db.published
      .filter((a) => (mode === 'teacher' ? a.ownerUid !== session.user?.uid : true))
      .filter((a) => byType[a.type] && isEnabled(a.type))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
  )
  const presentTypes = $derived(catalog.filter((c) => base.some((a) => a.type === c.type)))
  const list = $derived(
    base.filter((a) => (filter === 'all' || a.type === filter) && (!q.trim() || `${a.title} ${a.description ?? ''} ${a.ownerName ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))),
  )

  async function copy(a) {
    await copyToMine(a.id)
    ontoast?.(`«${a.title}» copiada a Mis actividades como borrador`)
  }
</script>

{#if db.loading}
  <p class="py-16 text-center text-slateink">Cargando actividades…</p>
{:else if base.length === 0}
  <div class="rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-14 text-center">
    <p class="font-display text-xl font-bold">{mode === 'teacher' ? 'Aún no hay actividades de otros docentes' : 'Aún no hay actividades publicadas'}</p>
    <p class="mt-1 text-sm text-slateink">{mode === 'teacher' ? 'Cuando otros docentes publiquen actividades aparecerán aquí y podrás copiarlas.' : 'Cuando tu docente publique actividades aparecerán aquí. También puede enviarte un enlace directo.'}</p>
  </div>
{:else}
  <div class="mb-5 flex flex-wrap items-center gap-2">
    <label class="relative min-w-56 flex-1 sm:max-w-xs">
      <Search size={16} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slateink/60" />
      <input bind:value={q} placeholder="Buscar por título o docente" class="w-full rounded-full border border-ink/12 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-4 focus:ring-ink/10" />
    </label>
    <button class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition {filter === 'all' ? 'bg-ink text-white' : 'bg-white text-slateink ring-1 ring-ink/10 hover:ring-ink/25'}" onclick={() => (filter = 'all')}>Todas</button>
    {#each presentTypes as c (c.type)}
      <button class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition {filter === c.type ? 'bg-ink text-white' : 'bg-white text-slateink ring-1 ring-ink/10 hover:ring-ink/25'}" onclick={() => (filter = c.type)}>
        <span class="h-2 w-2 rounded-full {tones[c.tone].dot}"></span>{c.name}
      </button>
    {/each}
  </div>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each list as a (a.id)}
      {@const c = byType[a.type]}
      {@const t = tones[c.tone]}
      <article class="flex flex-col rounded-2xl border border-ink/10 bg-white p-5">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl {t.tile}"><c.icon size={20} strokeWidth={2.2} /></span>
          <div class="min-w-0">
            <p class="text-xs font-semibold {t.text}">{c.name}</p>
            <h3 class="truncate font-display text-lg font-bold">{a.title}</h3>
          </div>
        </div>
        <p class="mt-2 line-clamp-2 flex-1 text-sm text-slateink">{a.description || 'Sin descripción'}</p>
        <p class="mt-2 text-xs text-slateink/70">{itemLabel(a)}{#if a.ownerName} · {a.ownerName}{/if}</p>
        <div class="mt-4 flex gap-2">
          <button class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold {t.btn}" onclick={() => onplay(a)}><Play size={14} fill="currentColor" /> Jugar</button>
          {#if mode === 'teacher'}
            <button class="inline-flex items-center gap-1.5 rounded-xl bg-ink/6 px-3 py-2 text-sm font-semibold hover:bg-ink/10" onclick={() => copy(a)}><CopyPlus size={15} /> Copiar a mis actividades</button>
          {/if}
        </div>
      </article>
    {/each}
  </div>
{/if}
