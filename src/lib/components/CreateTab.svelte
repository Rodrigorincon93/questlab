<script>
  import { catalog, groups, tones } from '../catalog.js'
  let { oncreate } = $props()
</script>

<div class="space-y-12">
  {#each groups as g (g.id)}
    <section>
      <h2 class="font-display text-2xl font-bold">{g.title}</h2>
      <p class="mt-0.5 text-sm text-slateink">{g.desc}</p>
      <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {#each catalog.filter((c) => c.group === g.id) as c (c.type)}
          {@const t = tones[c.tone]}
          <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(29,27,47,0.25)]">
            <div class="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-[0.08] {t.dot}"></div>
            <span class="grid h-12 w-12 place-items-center rounded-xl {t.tile}">
              <c.icon size={24} strokeWidth={2.2} />
            </span>
            <h3 class="mt-5 font-display text-xl font-bold">{c.name}</h3>
            <p class="mt-1.5 flex-1 text-sm leading-relaxed text-slateink">{c.desc}</p>
            <button class="relative mt-6 self-start rounded-xl px-4 py-2.5 text-sm font-semibold transition {t.btn}" onclick={() => oncreate(c.type)}>
              Crear nueva
            </button>
          </article>
        {/each}
      </div>
    </section>
  {/each}
</div>
