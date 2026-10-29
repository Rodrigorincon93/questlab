<script>
  import { login, session } from '../store.svelte.js'
  let { pendingPlay = false } = $props()
  let busy = $state(false)

  async function go() {
    busy = true
    try {
      await login()
    } finally {
      busy = false
    }
  }
</script>

<div class="grid min-h-screen place-items-center px-5 py-10">
  <div class="pop w-full max-w-md text-center">
    <svg viewBox="0 0 32 32" class="mx-auto h-16 w-16" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1d1b2f" />
      <path d="M16 6l2.6 6.4L25 15l-6.4 2.6L16 24l-2.6-6.4L7 15l6.4-2.6z" fill="#f0583a" />
      <circle cx="24" cy="24" r="2.6" fill="#e9a522" />
    </svg>
    <h1 class="mt-5 font-display text-4xl font-extrabold tracking-tight">QuestLab</h1>
    <p class="mt-2 text-lg text-slateink">Retos gamificados para aprender inglés</p>

    <div class="mt-8 rounded-3xl border border-ink/10 bg-white p-7 text-left shadow-[0_20px_60px_-30px_rgba(29,27,47,.35)]">
      <p class="font-semibold">{pendingPlay ? 'Inicia sesión para jugar la actividad que te compartieron' : 'Inicia sesión para continuar'}</p>
      <p class="mt-1 text-sm text-slateink">Usa tu cuenta de Google institucional (@unesum.edu.ec) o personal. Tus resultados quedarán guardados y tu docente podrá verlos.</p>
      <button class="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-ink/15 bg-white py-3 font-semibold transition hover:bg-ink/4 disabled:opacity-60" disabled={busy} onclick={go}>
        <svg viewBox="0 0 48 48" class="h-5 w-5" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {busy ? 'Abriendo Google…' : 'Entrar con Google'}
      </button>
      {#if session.error}<p class="mt-3 text-sm text-coral">{session.error}</p>{/if}
    </div>
    <p class="mt-6 text-xs text-slateink/70">QuestLab guarda tu nombre, correo y resultados solo para el seguimiento académico de tus actividades.</p>
  </div>
</div>
