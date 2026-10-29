<script>
  import { ChevronLeft, Save, Sparkles } from '@lucide/svelte'
  import { tones } from '../catalog.js'

  let { kind, tone, isNew, errors = [], onclose, onsave, onexample, children } = $props()
  const t = $derived(tones[tone])
</script>

<div class="min-h-screen">
  <header class="sticky top-0 z-30 border-b border-ink/8 bg-paper/90 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5">
      <button class="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold text-slateink hover:bg-ink/5" onclick={onclose}>
        <ChevronLeft size={18} /> Panel
      </button>
      <p class="truncate text-sm font-semibold">
        {isNew ? 'Nueva' : 'Editar'} · <span class={t.text}>{kind}</span>
      </p>
      <button class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold {t.btn}" onclick={onsave}>
        <Save size={16} /> Guardar
      </button>
    </div>
  </header>

  <main class="mx-auto max-w-3xl px-5 pb-24 pt-8">
    {#if isNew}
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-sm">
        <span class="text-slateink">¿Quieres ver cómo queda? Carga un ejemplo de nivel A1 y edítalo.</span>
        <button class="inline-flex items-center gap-1.5 rounded-lg bg-ink/6 px-3 py-2 font-semibold hover:bg-ink/10" onclick={onexample}>
          <Sparkles size={15} /> Cargar ejemplo
        </button>
      </div>
    {/if}

    {#if errors.length}
      <div class="pop mb-6 rounded-2xl border border-coral/30 bg-coral/8 p-4 text-sm text-coral">
        <p class="font-semibold">Revisa lo siguiente antes de guardar:</p>
        <ul class="mt-1 list-disc pl-5">
          {#each errors as e}<li>{e}</li>{/each}
        </ul>
      </div>
    {/if}

    {@render children()}
  </main>
</div>
