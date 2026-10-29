<script>
  import { Gamepad2, Users, Target, Trophy } from '@lucide/svelte'
  import { db, clearResults } from '../store.svelte.js'
  import { byType, tones, fmtDate } from '../catalog.js'

  let { onbrowse, mode = 'teacher' } = $props()
  let filter = $state('all')
  let confirmClear = $state(false)

  const all = $derived([...db.results].sort((a, b) => (b.date ?? 0) - (a.date ?? 0)))
  const rows = $derived(filter === 'all' ? all : all.filter((r) => r.activityId === filter))
  const students = $derived(new Set(rows.map((r) => r.student.trim().toLowerCase())).size)
  const avg = $derived(rows.length ? Math.round(rows.reduce((s, r) => s + r.accuracy, 0) / rows.length) : 0)
  const top = $derived.by(() => {
    const best = {}
    for (const r of rows) {
      const k = r.student.trim()
      best[k] = Math.max(best[k] ?? 0, r.accuracy)
    }
    const entries = Object.entries(best).sort((a, b) => b[1] - a[1])
    return entries[0] ?? null
  })
  const played = $derived.by(() => {
    const ids = new Map()
    for (const r of db.results) ids.set(r.activityId, r.activityTitle)
    return [...ids.entries()]
  })

  function accTone(n) {
    if (n >= 80) return 'bg-teal/12 text-teal'
    if (n >= 60) return 'bg-sun/15 text-[#a8720a]'
    return 'bg-coral/12 text-coral'
  }
</script>

{#if db.results.length === 0}
  <div class="rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-16 text-center">
    <p class="font-display text-xl font-bold">Aún no hay partidas registradas</p>
    <p class="mt-1 text-sm text-slateink">{mode === 'student' ? 'Juega una actividad y tus resultados aparecerán aquí.' : 'Cuando tus estudiantes jueguen tus actividades publicadas, sus resultados aparecerán aquí.'}</p>
    <button class="mt-6 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white" onclick={onbrowse}>{mode === 'student' ? 'Ver actividades' : 'Ir a Mis actividades'}</button>
  </div>
{:else}
  <div class="flex flex-wrap items-center justify-between gap-3">
    <label class="flex items-center gap-2 text-sm font-medium">
      Actividad
      <select bind:value={filter} class="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
        <option value="all">Todas</option>
        {#each played as [id, title] (id)}
          <option value={id}>{title}</option>
        {/each}
      </select>
    </label>
    {#if mode === 'student'}
      <span></span>
    {:else if confirmClear}
      <div class="pop flex items-center gap-2 text-sm">
        <span class="text-coral">¿Borrar todos los resultados?</span>
        <button class="rounded-lg bg-coral px-3 py-1.5 font-semibold text-white" onclick={() => { clearResults(); confirmClear = false }}>Borrar</button>
        <button class="rounded-lg px-3 py-1.5 font-semibold text-slateink hover:bg-ink/5" onclick={() => (confirmClear = false)}>Cancelar</button>
      </div>
    {:else}
      <button class="text-sm font-medium text-slateink underline-offset-4 hover:underline" onclick={() => (confirmClear = true)}>Borrar resultados</button>
    {/if}
  </div>

  <div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
    {#each [
      { label: 'Partidas', value: rows.length, icon: Gamepad2, tone: 'plum' },
      { label: 'Estudiantes', value: students, icon: Users, tone: 'sky' },
      { label: 'Aciertos promedio', value: avg + '%', icon: Target, tone: 'teal' },
      { label: 'Mejor resultado', value: top ? `${top[0]} · ${top[1]}%` : '—', icon: Trophy, tone: 'sun' },
    ] as s (s.label)}
      <div class="rounded-2xl border border-ink/10 bg-white p-5">
        <div class="flex items-center gap-2 text-sm font-medium text-slateink">
          <span class="grid h-7 w-7 place-items-center rounded-lg {tones[s.tone].tile}"><s.icon size={15} /></span>
          {s.label}
        </div>
        <p class="mt-3 truncate font-display text-2xl font-bold">{s.value}</p>
      </div>
    {/each}
  </div>

  <div class="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
    <table class="w-full min-w-[640px] text-left text-sm">
      <thead class="border-b border-ink/10 text-xs uppercase tracking-wider text-slateink">
        <tr>
          <th class="px-5 py-3 font-semibold">Estudiante</th>
          <th class="px-5 py-3 font-semibold">Actividad</th>
          <th class="px-5 py-3 font-semibold">Resultado</th>
          <th class="px-5 py-3 text-right font-semibold">Aciertos</th>
          <th class="px-5 py-3 font-semibold">Fecha</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.id)}
          <tr class="border-b border-ink/6 last:border-0">
            <td class="px-5 py-3 font-medium" title={r.studentEmail ?? ''}>{r.student}{#if mode !== 'student' && r.studentEmail && !['board', 'wheel'].includes(r.type)}<span class="block text-xs font-normal text-slateink/70">{r.studentEmail}</span>{/if}</td>
            <td class="px-5 py-3">
              <span class="mr-1.5 inline-block h-2 w-2 rounded-full {tones[byType[r.type]?.tone ?? 'ink'].dot}"></span>{r.activityTitle}
            </td>
            <td class="px-5 py-3 text-slateink">{r.detail}</td>
            <td class="px-5 py-3 text-right">
              <span class="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums {accTone(r.accuracy)}">{r.accuracy}%</span>
            </td>
            <td class="px-5 py-3 text-slateink">{fmtDate(r.date)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
