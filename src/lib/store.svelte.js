import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, collection, doc, query, where, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore'
import { firebaseConfig, ADMIN_EMAILS } from './firebase-config.js'
import { sampleActivity, sampleIds } from './samples.js'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const fs = getFirestore(app)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

// ---------------------------------------------------------------------------
// Estado reactivo compartido
// ---------------------------------------------------------------------------

/** role: 'guest' | 'student' | 'teacher' | 'admin' */
export const session = $state({ ready: false, user: null, role: 'guest', error: '' })

export const db = $state({
  activities: [], // propias (docentes)
  published: [], // publicadas por cualquier docente
  results: [], // docentes: de sus actividades · estudiantes: los propios
  teachers: [], // solo administrador
  loading: true,
  settings: loadSettings(),
})

export const isTeacherRole = () => session.role === 'teacher' || session.role === 'admin'

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

let unsubs = []
function stopListening() {
  unsubs.forEach((u) => u())
  unsubs = []
}

const toList = (snap) => snap.docs.map((d) => ({ ...d.data(), id: d.id }))

function listen(q, key, after) {
  unsubs.push(
    onSnapshot(
      q,
      (snap) => {
        db[key] = toList(snap)
        after?.()
      },
      (err) => {
        console.error(key, err)
        session.error = `No se pudo leer ${key}: ${err.code ?? err.message}`
      },
    ),
  )
}

getRedirectResult(auth).catch((e) => (session.error = friendlyAuthError(e)))

onAuthStateChanged(auth, async (user) => {
  stopListening()
  db.activities = []
  db.published = []
  db.results = []
  db.teachers = []
  session.error = ''
  if (!user) {
    session.user = null
    session.role = 'guest'
    session.ready = true
    db.loading = false
    return
  }
  session.user = { uid: user.uid, name: user.displayName || user.email, email: (user.email || '').toLowerCase(), photo: user.photoURL }
  db.loading = true
  let role = 'student'
  if (ADMIN_EMAILS.includes(session.user.email)) role = 'admin'
  else {
    try {
      const t = await getDoc(doc(fs, 'teachers', session.user.email))
      if (t.exists()) role = 'teacher'
    } catch (e) {
      console.warn('teachers', e)
    }
  }
  session.role = role
  session.ready = true

  let pending = 2
  const done = () => (pending -= 1) <= 0 && (db.loading = false)
  listen(query(collection(fs, 'activities'), where('status', '==', 'published')), 'published', done)
  if (role === 'student') {
    listen(query(collection(fs, 'results'), where('studentUid', '==', user.uid)), 'results', done)
  } else {
    pending += 1
    listen(query(collection(fs, 'activities'), where('ownerUid', '==', user.uid)), 'activities', done)
    listen(query(collection(fs, 'results'), where('activityOwnerUid', '==', user.uid)), 'results', done)
    if (role === 'admin') listen(collection(fs, 'teachers'), 'teachers')
  }
})

function friendlyAuthError(e) {
  const code = e?.code ?? ''
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return ''
  if (code.includes('unauthorized-domain')) return 'Este dominio no está autorizado en Firebase.'
  if (code.includes('network')) return 'Sin conexión. Revisa tu internet e inténtalo otra vez.'
  return `No se pudo iniciar sesión (${code || e?.message}).`
}

export async function login() {
  session.error = ''
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
    } else session.error = friendlyAuthError(e)
  }
}

export function logout() {
  return signOut(auth)
}

// ---------------------------------------------------------------------------
// Actividades
// ---------------------------------------------------------------------------

/** Todas las actividades visibles para el usuario (propias + publicadas), sin repetir. */
export function allActivities() {
  const seen = new Set()
  return [...db.activities, ...db.published].filter((a) => (seen.has(a.id) ? false : seen.add(a.id)))
}

export function findActivity(id) {
  return db.activities.find((a) => a.id === id) ?? db.published.find((a) => a.id === id) ?? null
}

// Firestore no acepta undefined ni proxies: se guarda una copia JSON limpia.
const clean = (o) => JSON.parse(JSON.stringify(o))
const META = ['id', 'ownerUid', 'ownerName', 'ownerEmail', 'createdAt', 'updatedAt', 'status', 'copiedFrom']

function contentOf(a) {
  const c = clean(a)
  for (const k of META) delete c[k]
  return c
}

export async function saveActivity(activity) {
  const now = Date.now()
  const own = activity.id && db.activities.find((a) => a.id === activity.id)
  try {
    if (own) {
      await setDoc(doc(fs, 'activities', activity.id), {
        ...contentOf(activity),
        ownerUid: own.ownerUid,
        ownerName: own.ownerName,
        ownerEmail: own.ownerEmail,
        status: own.status ?? 'draft',
        createdAt: own.createdAt ?? now,
        updatedAt: now,
        ...(own.copiedFrom ? { copiedFrom: own.copiedFrom } : {}),
      })
      return activity.id
    }
    const ref = await addDoc(collection(fs, 'activities'), {
      ...contentOf(activity),
      ownerUid: session.user.uid,
      ownerName: session.user.name,
      ownerEmail: session.user.email,
      status: activity.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
      ...(activity.copiedFrom ? { copiedFrom: activity.copiedFrom } : {}),
    })
    return ref.id
  } catch (e) {
    session.error = `No se pudo guardar la actividad (${e.code ?? e.message}).`
    throw e
  }
}

export function setStatus(id, status) {
  return updateDoc(doc(fs, 'activities', id), { status, updatedAt: Date.now() }).catch((e) => (session.error = `No se pudo cambiar el estado (${e.code}).`))
}

export function deleteActivity(id) {
  return deleteDoc(doc(fs, 'activities', id)).catch((e) => (session.error = `No se pudo eliminar (${e.code}).`))
}

export function duplicateActivity(id) {
  const src = findActivity(id)
  if (!src) return
  return saveActivity({ ...contentOf(src), title: `${src.title} (copia)`, status: 'draft' })
}

/** Copia una actividad publicada de otro docente a mis actividades (como borrador). */
export function copyToMine(id) {
  const src = findActivity(id)
  if (!src) return
  return saveActivity({ ...contentOf(src), status: 'draft', copiedFrom: { id: src.id, owner: src.ownerName ?? '' } })
}

/** Crea en la nube las actividades de ejemplo (publicadas), conservando los enlaces del Mapa de aventura. */
export async function importSamples() {
  const idMap = {}
  const types = Object.keys(sampleIds).filter((t) => t !== 'path')
  for (const type of types) {
    const s = sampleActivity(type)
    idMap[s.id] = await saveActivity({ ...contentOf(s), status: 'published' })
  }
  const path = sampleActivity('path')
  path.steps = path.steps.map((id) => idMap[id]).filter(Boolean)
  await saveActivity({ ...contentOf(path), status: 'published' })
}

export function shareLink(id) {
  return `${location.origin}${location.pathname}#jugar-${id}`
}

// ---------------------------------------------------------------------------
// Resultados
// ---------------------------------------------------------------------------

const TEAM_TYPES = ['board', 'wheel']

export async function addResult(result) {
  const act = findActivity(result.activityId)
  if (!act || !session.user) return
  const data = {
    ...clean(result),
    student: TEAM_TYPES.includes(result.type) ? result.student : session.user.name,
    studentUid: session.user.uid,
    studentEmail: session.user.email,
    activityOwnerUid: act.ownerUid,
    date: Date.now(),
  }
  // Se muestra de inmediato aunque la red tarde.
  try {
    await addDoc(collection(fs, 'results'), data)
  } catch (e) {
    session.error = `No se pudo guardar tu resultado (${e.code ?? e.message}).`
  }
}

export async function clearResults(ids) {
  const list = ids ?? db.results.map((r) => r.id)
  for (let i = 0; i < list.length; i += 400) {
    const batch = writeBatch(fs)
    list.slice(i, i + 400).forEach((id) => batch.delete(doc(fs, 'results', id)))
    await batch.commit()
  }
}

// ---------------------------------------------------------------------------
// Docentes autorizados (solo administrador)
// ---------------------------------------------------------------------------

export function addTeacher(email, name = '') {
  const mail = email.trim().toLowerCase()
  return setDoc(doc(fs, 'teachers', mail), { email: mail, name: name.trim(), addedBy: session.user.email, addedAt: Date.now() })
}

export function removeTeacher(email) {
  return deleteDoc(doc(fs, 'teachers', email))
}

// ---------------------------------------------------------------------------
// Preferencias locales (tipos de actividad activos)
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'questlab:settings'
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    if (s && Array.isArray(s.disabledTypes)) return s
    // Migración desde la versión local anterior.
    const old = JSON.parse(localStorage.getItem('questlab:v1') ?? 'null')
    return { disabledTypes: old?.settings?.disabledTypes ?? [] }
  } catch {
    return { disabledTypes: [] }
  }
}
function persistSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify($state.snapshot(db.settings)))
  } catch {}
}

export function isEnabled(type) {
  return !db.settings.disabledTypes.includes(type)
}

export function setTypeEnabled(type, on) {
  const set = new Set(db.settings.disabledTypes)
  if (on) set.delete(type)
  else set.add(type)
  db.settings.disabledTypes = [...set]
  persistSettings()
}

export function setAllTypes(on, types) {
  db.settings.disabledTypes = on ? [] : [...types]
  persistSettings()
}

export function uid() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}
