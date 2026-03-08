const DB_NAME = 'photon-studio-db'
const DB_VERSION = 1
const STORE_NAME = 'renders'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
  })
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function reqResult(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function makeId() {
  const random = Math.random().toString(36).slice(2, 8)
  return `render-${Date.now()}-${random}`
}

export async function saveRenderBlob(blob, meta = {}) {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put({
    id: makeId(),
    blob,
    meta,
    createdAt: Date.now(),
  })
  await txDone(tx)
}

export async function listRenders() {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const req = tx.objectStore(STORE_NAME).getAll()
  const rows = await reqResult(req)
  await txDone(tx)
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

export async function removeRender(id) {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(id)
  await txDone(tx)
}

export async function clearRenders() {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  await txDone(tx)
}
