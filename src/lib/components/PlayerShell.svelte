<script>
  import { X } from '@lucide/svelte'
  let { onexit, right, children, wide = false } = $props()
</script>

<div class="min-h-screen bg-ink px-4 pb-16 text-white sm:px-5">
  <header class="mx-auto flex h-16 items-center justify-between gap-3 {wide ? 'max-w-6xl' : 'max-w-4xl'}">
    <button class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white" onclick={onexit}>
      <X size={17} /> Salir
    </button>
    {#if right}<div class="flex items-center gap-4 text-sm font-semibold text-white/85">{@render right()}</div>{/if}
  </header>
  {@render children()}
</div>
