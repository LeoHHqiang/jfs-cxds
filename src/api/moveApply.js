import { loadDb, mutateDb, nextId } from './mockDb'

export const fetchMoveApplyList = async (filters = {}) => {
  const db = loadDb()
  let list = [...(db.moveApplyList || [])]
  if (filters.partName) list = list.filter((i) => String(i.partName || '').includes(filters.partName))
  if (filters.partNo) list = list.filter((i) => String(i.partNo || '').includes(filters.partNo))
  if (filters.toolName) list = list.filter((i) => String(i.toolName || '').includes(filters.toolName))
  if (filters.supplier) list = list.filter((i) => String(i.fromSupplier || '').includes(filters.supplier))
  if (filters.newSupplier) list = list.filter((i) => String(i.toSupplier || '').includes(filters.newSupplier))
  if (filters.status) list = list.filter((i) => i.status === filters.status)
  return { success: true, data: { list, total: list.length } }
}

export const createMoveApply = async (payload = {}) => {
  let saved = null
  mutateDb((db) => {
    const id = nextId(db.moveApplyList || [])
    const now = new Date()
    const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const applyNo = payload.applyNo || `MM${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(id).padStart(3, '0')}`
    saved = {
      id,
      applyNo,
      partName: payload.partName || '',
      partNo: payload.partNo || '',
      toolName: payload.toolName || '',
      fromSupplier: payload.fromSupplier || '',
      toSupplier: payload.toSupplier || '',
      applicant: payload.applicant || '',
      applyTime: dateText,
      status: payload.status || 'pending'
    }
    db.moveApplyList = [saved, ...(db.moveApplyList || [])]
    return db
  })
  return { success: true, data: saved }
}
