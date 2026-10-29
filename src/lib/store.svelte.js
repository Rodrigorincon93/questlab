import { sampleActivities } from './samples.js'

const KEY = 'questlab:v1'

export function uid() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const db = $state(load() ?? { activities: sampleActivities(), results: [] })

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(db)))
  } catch {
    /* sin almacenamiento: los datos viven solo en esta sesión */
  }
}

export function saveActivity(activity) {
  const copy = { ...activity, updatedAt: Date.now() }
  const idx = db.activities.findIndex((a) => a.id === copy.id)
  if (idx >= 0) db.activities[idx] = copy
  else db.activities.unshift({ ...copy, id: copy.id ?? uid(), createdAt: Date.now() })
  persist()
}

export function deleteActivity(id) {
  db.activities = db.activities.filter((a) => a.id !== id)
  persist()
}

export function duplicateActivity(id) {
  const src = db.activities.find((a) => a.id === id)
  if (!src) return
  const copy = structuredClone($state.snapshot(src))
  copy.id = uid()
  copy.title = `${src.title} (copia)`
  copy.createdAt = copy.updatedAt = Date.now()
  db.activities.unshift(copy)
  persist()
}

export function addResult(result) {
  db.results.unshift({ ...result, id: uid(), date: Date.now() })
  persist()
}

export function clearResults() {
  db.results = []
  persist()
}
