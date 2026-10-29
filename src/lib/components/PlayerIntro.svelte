<script>
  import { Play } from '@lucide/svelte'
  import { tones, byType, itemLabel } from '../catalog.js'
  import { session } from '../store.svelte.js'

  let { activity, name = $bindable(''), onstart, rules, children, needsName = true, startLabel = 'Empezar' } = $props()
  // Con sesión de Google, el nombre sale de la cuenta y no se puede cambiar.
  const signedName = $derived(session.user?.name ?? '')
  $effect(() => {
    if (signedName && needsName) name = signedName
  })
  const askName = $derived(needsName && !signedName)
  const c = $derived(byType[activity.type])
  const t = $derived(tones[c.tone])

  function submit(e) {
    e.preventDefault()
    if (!askName || name.trim()) onstart()
  }
</script>

<form class="pop mx-auto mt-10 max-w-md rounded-3xl bg-white p-8 text-ink shadow-2xl sm:mt-16" onsubmit={submit}>
  <span class="grid h-14 w-14 place-items-center rounded-2xl {t.tile}"><c.icon size={28} strokeWidth={2.2} /></span>
  <p class="mt-5 text-xs font-semibold uppercase tracking-[0.16em] {t.text}">{c.name} · {itemLabel(activity)}</p>
  <h1 class="mt-1 font-display text-3xl font-extrabold tracking-tight">{activity.title}</h1>
  {#if activity.description}<p class="mt-1 text-slateink">{activity.description}</p>{/if}
  {#if activity.ownerName}<p class="mt-1 text-xs text-slateink/70">Creada por {activity.ownerName}</p>{/if}
  <ul class="mt-5 space-y-1.5 text-sm text-slateink">
    {#each rules as r}<li class="flex gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full {t.dot}"></span>{r}</li>{/each}
  </ul>
  {#if children}{@render children()}{/if}
  {#if needsName && signedName}
    <p class="mt-6 rounded-xl bg-ink/5 px-4 py-3 text-sm">Jugarás como <span class="font-semibold">{signedName}</span>. Tu resultado se guardará en tu cuenta.</p>
  {/if}
  {#if askName}
  <label class="mt-6 block">
    <span class="text-sm font-semibold">Tu nombre</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input bind:value={name} autofocus maxlength="40" placeholder="Escribe tu nombre" class="mt-1.5 w-full rounded-xl border border-ink/15 px-4 py-3 text-lg outline-none focus:ring-4 {t.ring}" />
  </label>
  {/if}
  <button type="submit" disabled={askName && !name.trim()} class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition disabled:opacity-40 {t.btn}">
    <Play size={17} fill="currentColor" /> {startLabel}
  </button>
</form>
