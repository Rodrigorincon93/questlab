<script>
  import { catalog, tones } from '../catalog.js'
  let { oncreate } = $props()
</script>

<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {#each catalog as c (c.type)}
    {@const t = tones[c.tone]}
    <article
      class="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition-shadow {c.ready
        ? 'hover:shadow-[0_8px_30px_-12px_rgba(29,27,47,0.25)]'
        : ''}"
    >
      <div class="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-[0.08] {t.dot}"></div>
      <div class="flex items-start justify-between">
        <span class="grid h-12 w-12 place-items-center rounded-xl {t.tile}">
          <c.icon size={24} strokeWidth={2.2} />
        </span>
        {#if !c.ready}
          <span class="rounded-full bg-ink/6 px-2.5 py-1 text-[11px] font-semibold text-slateink">Próximamente</span>
        {/if}
      </div>
      <h3 class="mt-5 font-display text-xl font-bold">{c.name}</h3>
      <p class="mt-1.5 flex-1 text-sm leading-relaxed text-slateink">{c.desc}</p>
      <button
        class="mt-6 self-start rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-ink/8 disabled:text-slateink/60 {c.ready
          ? t.btn
          : ''}"
        disabled={!c.ready}
        onclick={() => oncreate(c.type)}
      >
        Crear nueva
      </button>
    </article>
  {/each}
</div>
