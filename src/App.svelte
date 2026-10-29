<script>
  import Header from './lib/components/Header.svelte'
  import CreateTab from './lib/components/CreateTab.svelte'
  import ActivitiesTab from './lib/components/ActivitiesTab.svelte'
  import ProgressTab from './lib/components/ProgressTab.svelte'
  import QuizEditor from './lib/components/QuizEditor.svelte'
  import MatchEditor from './lib/components/MatchEditor.svelte'
  import ItemsEditor from './lib/components/ItemsEditor.svelte'
  import QuizPlayer from './lib/components/QuizPlayer.svelte'
  import MatchPlayer from './lib/components/MatchPlayer.svelte'
  import FlashPlayer from './lib/components/FlashPlayer.svelte'
  import LettersPlayer from './lib/components/LettersPlayer.svelte'
  import OrderPlayer from './lib/components/OrderPlayer.svelte'
  import FillPlayer from './lib/components/FillPlayer.svelte'
  import SearchPlayer from './lib/components/SearchPlayer.svelte'
  import EscapePlayer from './lib/components/EscapePlayer.svelte'
  import BoardPlayer from './lib/components/BoardPlayer.svelte'
  import ListenPlayer from './lib/components/ListenPlayer.svelte'
  import HangmanPlayer from './lib/components/HangmanPlayer.svelte'
  import MemoryPlayer from './lib/components/MemoryPlayer.svelte'
  import CrosswordPlayer from './lib/components/CrosswordPlayer.svelte'
  import WheelPlayer from './lib/components/WheelPlayer.svelte'
  import BingoPlayer from './lib/components/BingoPlayer.svelte'
  import PathPlayer from './lib/components/PathPlayer.svelte'
  import PathEditor from './lib/components/PathEditor.svelte'
  import TypesPanel from './lib/components/TypesPanel.svelte'
  import { SlidersHorizontal } from '@lucide/svelte'
  import LibraryTab from './lib/components/LibraryTab.svelte'
  import TeachersTab from './lib/components/TeachersTab.svelte'
  import LoginScreen from './lib/components/LoginScreen.svelte'
  import { db, session, findActivity } from './lib/store.svelte.js'
  import { byType } from './lib/catalog.js'

  const players = {
    quiz: QuizPlayer,
    match: MatchPlayer,
    flash: FlashPlayer,
    letters: LettersPlayer,
    order: OrderPlayer,
    fill: FillPlayer,
    search: SearchPlayer,
    escape: EscapePlayer,
    board: BoardPlayer,
    listen: ListenPlayer,
    hangman: HangmanPlayer,
    memory: MemoryPlayer,
    crossword: CrosswordPlayer,
    wheel: WheelPlayer,
    bingo: BingoPlayer,
    path: PathPlayer,
  }
  const editors = { quiz: QuizEditor, match: MatchEditor, items: ItemsEditor, path: PathEditor }
  let managing = $state(false)

  const teacherViews = [
    { id: 'crear', label: 'Crear actividad' },
    { id: 'actividades', label: 'Mis actividades' },
    { id: 'biblioteca', label: 'Biblioteca' },
    { id: 'progreso', label: 'Progreso y resultados' },
  ]
  const views = $derived(
    session.role === 'student'
      ? [
          { id: 'jugar', label: 'Actividades' },
          { id: 'resultados', label: 'Mis resultados' },
        ]
      : session.role === 'admin'
        ? [...teacherViews, { id: 'docentes', label: 'Docentes' }]
        : teacherViews,
  )

  const hashNow = () => location.hash.slice(1)
  let rawHash = $state(hashNow())
  // Enlace directo para estudiantes: #jugar-<id>
  let pendingPlay = $state(hashNow().startsWith('jugar-') ? hashNow().slice(6) : null)
  const view = $derived(views.some((v) => v.id === rawHash) ? rawHash : views[0].id)

  /** @type {{type: string, activity: any} | null} */
  let editing = $state(null)
  /** @type {any} */
  let playing = $state(null)
  let toast = $state('')

  $effect(() => {
    const on = () => {
      const h = hashNow()
      if (h.startsWith('jugar-')) pendingPlay = h.slice(6)
      else rawHash = h
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  })

  // Abre la actividad del enlace cuando ya cargaron los datos.
  $effect(() => {
    if (!pendingPlay || !session.user || db.loading) return
    const a = findActivity(pendingPlay)
    const id = pendingPlay
    pendingPlay = null
    try {
      history.replaceState(null, '', location.pathname + location.search)
    } catch {}
    if (a) playing = a
    else flash('No se encontró esa actividad o todavía no está publicada.')
    void id
  })

  function go(id) {
    rawHash = id
    try {
      history.replaceState(null, '', '#' + id)
    } catch {
      location.hash = id
    }
  }

  function flash(msg) {
    toast = msg
    setTimeout(() => (toast = ''), 3200)
  }

  function onSaved(title) {
    editing = null
    go('actividades')
    flash(`«${title}» guardada en Mis actividades (como borrador si es nueva)`)
  }

  function onExitPlayer() {
    playing = null
    scrollTo(0, 0)
  }

  $effect(() => {
    if (playing || editing) scrollTo(0, 0)
  })

  const firstName = $derived((session.user?.name ?? '').split(/\s+/)[0])
</script>

{#if !session.ready}
  <div class="grid min-h-screen place-items-center text-slateink">Cargando QuestLab…</div>
{:else if !session.user}
  <LoginScreen pendingPlay={!!pendingPlay} />
{:else if playing}
  {@const Player = players[playing.type]}
  {#key playing}
    <Player activity={playing} onexit={onExitPlayer} {players} />
  {/key}
{:else if editing}
  {@const Editor = editors[byType[editing.type].editor]}
  <Editor type={editing.type} activity={editing.activity} onclose={() => (editing = null)} onsaved={onSaved} />
{:else}
  <div class="min-h-screen">
    <Header />
    <main class="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slateink">
        {session.role === 'student' ? 'Panel del estudiante' : session.role === 'admin' ? 'Panel del docente · Administrador' : 'Panel del docente'}
      </p>
      <h1 class="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Hola, {firstName}</h1>
      <p class="mt-2 max-w-xl text-slateink">
        {session.role === 'student'
          ? 'Elige una actividad y juega. Tus resultados se guardan en tu cuenta.'
          : 'Crea retos de inglés en minutos, publícalos para tus estudiantes y revisa quién domina cada tema.'}
      </p>

      <div class="mt-8 flex items-end gap-2 border-b border-ink/10">
        <nav class="flex flex-1 gap-1 overflow-x-auto" aria-label="Secciones">
          {#each views as v (v.id)}
            <button
              class="relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors {view === v.id ? 'text-ink' : 'text-slateink/70 hover:text-ink'}"
              aria-current={view === v.id ? 'page' : undefined}
              onclick={() => go(v.id)}
            >
              {v.label}
              {#if v.id === 'actividades'}
                <span class="ml-1 rounded-full bg-ink/8 px-2 py-0.5 text-xs">{db.activities.length}</span>
              {/if}
              {#if view === v.id}
                <span class="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-coral"></span>
              {/if}
            </button>
          {/each}
        </nav>
        {#if session.role !== 'student'}
          <button class="mb-1.5 inline-flex shrink-0 items-center gap-2 rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm font-semibold hover:border-ink/30" onclick={() => (managing = true)} title="Activar o desactivar tipos de actividad">
            <SlidersHorizontal size={16} /> <span class="hidden sm:inline">Tipos de actividad</span>
          </button>
        {/if}
      </div>

      {#if session.error}
        <p class="mt-6 rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{session.error}</p>
      {/if}

      <section class="pt-8">
        {#if view === 'crear'}
          <CreateTab oncreate={(type) => (editing = { type, activity: null })} onmanage={() => (managing = true)} />
        {:else if view === 'actividades'}
          <ActivitiesTab
            onplay={(a) => (playing = a)}
            onedit={(a) => (editing = { type: a.type, activity: a })}
            oncreate={() => go('crear')}
            onmanage={() => (managing = true)}
            ontoast={flash}
          />
        {:else if view === 'biblioteca'}
          <LibraryTab mode="teacher" onplay={(a) => (playing = a)} ontoast={flash} />
        {:else if view === 'docentes'}
          <TeachersTab />
        {:else if view === 'jugar'}
          <LibraryTab mode="student" onplay={(a) => (playing = a)} />
        {:else}
          <ProgressTab mode={session.role === 'student' ? 'student' : 'teacher'} onbrowse={() => go(session.role === 'student' ? 'jugar' : 'actividades')} />
        {/if}
      </section>

      {#if session.role === 'student'}
        <p class="mt-12 text-center text-xs text-slateink/70">¿Eres docente? Pide al administrador de QuestLab que autorice tu correo <span class="font-semibold">{session.user.email}</span>.</p>
      {/if}
    </main>
  </div>
{/if}

{#if managing && !playing && !editing && session.user}
  <TypesPanel onclose={() => (managing = false)} />
{/if}

{#if toast}
  <div class="pop fixed bottom-6 left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-white shadow-lg">
    {toast}
  </div>
{/if}
