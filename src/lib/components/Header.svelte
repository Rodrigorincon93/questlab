<script>
  import { LogOut } from '@lucide/svelte'
  import { session, logout } from '../store.svelte.js'

  let open = $state(false)
  const roleLabel = $derived({ admin: 'Administrador', teacher: 'Docente', student: 'Estudiante' }[session.role] ?? '')
  const initials = $derived(
    (session.user?.name ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase(),
  )
</script>

<svelte:window onclick={(e) => open && !e.target.closest?.('[data-usermenu]') && (open = false)} />

<header class="sticky top-0 z-30 border-b border-ink/8 bg-paper/85 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
    <div class="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" class="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#1d1b2f" />
        <path d="M16 6l2.6 6.4L25 15l-6.4 2.6L16 24l-2.6-6.4L7 15l6.4-2.6z" fill="#f0583a" />
        <circle cx="24" cy="24" r="2.6" fill="#e9a522" />
      </svg>
      <span class="font-display text-xl font-extrabold tracking-tight">QuestLab</span>
      <span class="hidden rounded-full bg-teal/12 px-2 py-0.5 text-[11px] font-semibold text-teal sm:inline">English</span>
    </div>
    {#if session.user}
      <div class="relative" data-usermenu>
        <button class="flex items-center gap-3 rounded-full border border-ink/10 bg-white py-1 pl-1 pr-4 text-sm font-medium hover:border-ink/25" onclick={() => (open = !open)} aria-expanded={open}>
          {#if session.user.photo}
            <img src={session.user.photo} alt="" referrerpolicy="no-referrer" class="h-7 w-7 rounded-full" />
          {:else}
            <span class="grid h-7 w-7 place-items-center rounded-full bg-plum text-xs font-bold text-white">{initials}</span>
          {/if}
          <span class="hidden max-w-48 truncate sm:inline">{session.user.name}</span>
        </button>
        {#if open}
          <div class="pop absolute right-0 mt-2 w-64 rounded-2xl border border-ink/10 bg-white p-2 shadow-xl">
            <div class="px-3 py-2">
              <p class="truncate font-semibold">{session.user.name}</p>
              <p class="truncate text-xs text-slateink">{session.user.email}</p>
              <p class="mt-1 inline-block rounded-full bg-ink/6 px-2 py-0.5 text-[11px] font-semibold text-slateink">{roleLabel}</p>
            </div>
            <button class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-ink/5" onclick={() => { open = false; logout() }}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</header>
