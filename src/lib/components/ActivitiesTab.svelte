<script>
  import { Play, Pencil, Copy, Trash2, Plus } from '@lucide/svelte'
  import { db, deleteActivity, duplicateActivity } from '../store.svelte.js'
  import { byType, tones, itemLabel, fmtDate } from '../catalog.js'

  let { onplay, onedit, oncreate } = $props()
  let confirmId = $state(null)

  function playsOf(id) {
    return db.results.filter((r) => r.activityId === id).length
  }
</script>

{#if db.activities.length === 0}
  <div class="rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-16 text-center">
    <p class="font-display text-xl font-bold">Todavía no tienes actividades</p>
    <p class="mt-1 text-sm text-slateink">Crea la primera desde la pestaña «Crear actividad».</p>
    <button class="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white" onclick={oncreate}>
      <Plus size={16} /> Crear actividad
    </button>
  </div>
{:else}
  <ul class="grid gap-4">
    {#each db.activities as a (a.id)}
      {@const c = byType[a.type]}
      {@const t = tones[c.tone]}
      <li class="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5 sm:flex-row sm:items-center">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl {t.tile}">
          <c.icon size={22} strokeWidth={2.2} />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 class="truncate font-display text-lg font-bold">{a.title}</h3>
            <span class="text-xs font-semibold {t.text}">{c.name}</span>
          </div>
          <p class="mt-0.5 truncate text-sm text-slateink">{a.description || 'Sin descripción'}</p>
          <p class="mt-1 text-xs text-slateink/70">
            {itemLabel(a)} · {playsOf(a.id)} partida{playsOf(a.id) === 1 ? '' : 's'} · editada {fmtDate(a.updatedAt)}
          </p>
        </div>

        {#if confirmId === a.id}
          <div class="pop flex items-center gap-2 rounded-xl bg-coral/8 p-2 pl-3 text-sm">
            <span class="font-medium text-coral">¿Eliminar esta actividad?</span>
            <button class="rounded-lg bg-coral px-3 py-1.5 font-semibold text-white" onclick={() => { deleteActivity(a.id); confirmId = null }}>Sí, eliminar</button>
            <button class="rounded-lg px-3 py-1.5 font-semibold text-slateink hover:bg-ink/5" onclick={() => (confirmId = null)}>Cancelar</button>
          </div>
        {:else}
          <div class="flex items-center gap-1.5">
            <button class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold {t.btn}" onclick={() => onplay(a)}>
              <Play size={15} fill="currentColor" /> Jugar
            </button>
            <button class="rounded-xl p-2.5 text-slateink hover:bg-ink/6" title="Editar" aria-label="Editar" onclick={() => onedit(a)}>
              <Pencil size={17} />
            </button>
            <button class="rounded-xl p-2.5 text-slateink hover:bg-ink/6" title="Duplicar" aria-label="Duplicar" onclick={() => duplicateActivity(a.id)}>
              <Copy size={17} />
            </button>
            <button class="rounded-xl p-2.5 text-slateink hover:bg-coral/10 hover:text-coral" title="Eliminar" aria-label="Eliminar" onclick={() => (confirmId = a.id)}>
              <Trash2 size={17} />
            </button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}
