import { loadDb, mutateDb, nextId } from './mockDb'

function readCurrentUserRole() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!raw) return ''
    const u = JSON.parse(raw)
    return String(u.role || '').trim()
  } catch {
    return ''
  }
}

export const fetchSuppliers = async () => {
  const db = loadDb()
  return { success: true, data: db.suppliers || [] }
}

export const createSupplier = async (payload = {}) => {
  if (readCurrentUserRole() !== 'admin') {
    return { success: false, message: '仅管理员可新增供应商' }
  }
  let saved = null
  mutateDb((db) => {
    saved = {
      id: nextId(db.suppliers || []),
      name: payload.name || '',
      contact: payload.contact || '',
      phone: payload.phone || '',
      level: payload.level || 'C',
      status: payload.status || '合作中'
    }
    db.suppliers = [saved, ...(db.suppliers || [])]
    return db
  })
  return { success: true, data: saved }
}
