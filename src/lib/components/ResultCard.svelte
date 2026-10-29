<script>
  import { Trophy, RotateCcw } from '@lucide/svelte'
  import { tones } from '../catalog.js'

  let { name = '', title, subtitle = '', stats = [], tone = 'coral', onreplay, onexit, icon = Trophy, children } = $props()
  const t = $derived(tones[tone])
  const Icon = $derived(icon)
</script>

<div class="pop mx-auto mt-6 max-w-lg rounded-3xl bg-white p-8 text-center text-ink sm:mt-10">
  <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun/20 text-[#a8720a]"><Icon size={32} /></span>
  {#if name}<p class="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slateink">{name}</p>{/if}
  <h2 class="mt-1 font-display text-3xl font-extrabold">{title}</h2>
  {#if subtitle}<p class="mt-1 text-slateink">{subtitle}</p>{/if}
  {#if stats.length}
    <div class="mt-6 grid gap-3 text-sm" style="grid-template-columns: repeat({stats.length}, minmax(0, 1fr))">
      {#each stats as [value, label]}
        <div class="rounded-2xl bg-ink/5 p-3"><p class="font-display text-2xl font-bold tabular-nums">{value}</p><p class="text-slateink">{label}</p></div>
      {/each}
    </div>
  {/if}
  {#if children}<div class="mt-6 text-left">{@render children()}</div>{/if}
  <div class="mt-6 flex flex-wrap justify-center gap-2">
    <button class="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold {t.btn}" onclick={onreplay}><RotateCcw size={16} /> Jugar otra vez</button>
    <button class="rounded-xl bg-ink/6 px-5 py-3 font-semibold hover:bg-ink/10" onclick={onexit}>Volver al panel</button>
  </div>
</div>
