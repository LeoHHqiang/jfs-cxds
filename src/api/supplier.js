import { loadDb, mutateDb, nextId } from './mockDb'

export const fetchSuppliers = async () => {
  const db = loadDb()
  return { success: true, data: db.suppliers || [] }
}

export const createSupplier = async (payload = {}) => {
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
