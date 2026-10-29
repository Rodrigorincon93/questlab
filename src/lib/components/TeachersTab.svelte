<script>
  import { UserPlus, Trash2, ShieldCheck } from '@lucide/svelte'
  import { db, session, addTeacher, removeTeacher } from '../store.svelte.js'
  import { fmtDate } from '../catalog.js'
  import { ADMIN_EMAILS } from '../firebase-config.js'

  let email = $state('')
  let name = $state('')
  let error = $state('')
  let busy = $state(false)
  let confirm = $state(null)

  const valid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
  const sorted = $derived([...db.teachers].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0)))

  async function add(e) {
    e.preventDefault()
    if (!valid) return
    busy = true
    error = ''
    try {
      await addTeacher(email, name)
      email = ''
      name = ''
    } catch (err) {
      error = `No se pudo agregar (${err.code ?? err.message}).`
    } finally {
      busy = false
    }
  }
</script>

<div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
  <form class="rounded-2xl border border-ink/10 bg-white p-6" onsubmit={add}>
    <h2 class="flex items-center gap-2 font-display text-xl font-bold"><UserPlus size={20} /> Autorizar docente</h2>
    <p class="mt-1 text-sm text-slateink">Los docentes autorizados pueden crear, editar y publicar actividades y ver los resultados de las suyas. Deben entrar con la misma cuenta de Google que registres aquí.</p>
    <label class="mt-5 block">
      <span class="text-sm font-semibold">Correo de Google</span>
      <input bind:value={email} type="email" placeholder="nombre.apellido@unesum.edu.ec" class="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2.5 outline-none focus:ring-4 focus:ring-teal/20" />
    </label>
    <label class="mt-3 block">
      <span class="text-sm font-semibold">Nombre <span class="font-normal text-slateink">(opcional)</span></span>
      <input bind:value={name} placeholder="Ana Pérez" class="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2.5 outline-none focus:ring-4 focus:ring-teal/20" />
    </label>
    {#if error}<p class="mt-3 text-sm text-coral">{error}</p>{/if}
    <button class="mt-5 w-full rounded-xl bg-teal py-3 font-semibold text-white disabled:opacity-40" disabled={!valid || busy}>Autorizar</button>
  </form>

  <div class="rounded-2xl border border-ink/10 bg-white">
    <div class="flex items-center justify-between border-b border-ink/8 px-5 py-4">
      <h2 class="font-display text-xl font-bold">Docentes autorizados</h2>
      <span class="text-sm text-slateink">{db.teachers.length + ADMIN_EMAILS.length}</span>
    </div>
    <ul class="divide-y divide-ink/8">
      {#each ADMIN_EMAILS as mail}
        <li class="flex items-center gap-3 px-5 py-3">
          <span class="grid h-9 w-9 place-items-center rounded-full bg-plum/12 text-plum"><ShieldCheck size={18} /></span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{mail}</p>
            <p class="text-xs text-slateink">Administrador{mail === session.user?.email ? ' · tú' : ''}</p>
          </div>
        </li>
      {/each}
      {#each sorted as t (t.id)}
        <li class="flex items-center gap-3 px-5 py-3">
          <span class="grid h-9 w-9 place-items-center rounded-full bg-teal/12 text-sm font-bold uppercase text-teal">{(t.name || t.email)[0]}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{t.name || t.email}</p>
            <p class="truncate text-xs text-slateink">{t.name ? t.email + ' · ' : ''}autorizado {fmtDate(t.addedAt)}</p>
          </div>
          {#if confirm === t.id}
            <button class="rounded-lg bg-coral px-3 py-1.5 text-sm font-semibold text-white" onclick={() => { removeTeacher(t.id); confirm = null }}>Quitar acceso</button>
            <button class="rounded-lg px-3 py-1.5 text-sm font-semibold text-slateink hover:bg-ink/5" onclick={() => (confirm = null)}>Cancelar</button>
          {:else}
            <button class="rounded-lg p-2 text-slateink hover:bg-coral/10 hover:text-coral" aria-label="Quitar acceso" onclick={() => (confirm = t.id)}><Trash2 size={17} /></button>
          {/if}
        </li>
      {/each}
    </ul>
    {#if !db.teachers.length}<p class="px-5 py-6 text-sm text-slateink">Aún no autorizas a otros docentes.</p>{/if}
    <p class="border-t border-ink/8 px-5 py-3 text-xs text-slateink">Al quitar el acceso, sus actividades publicadas siguen visibles; el docente solo deja de poder crear o editar.</p>
  </div>
</div>
