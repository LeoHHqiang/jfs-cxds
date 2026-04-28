import { loadDb, paginate } from './mockDb'

export const fetchOperationRecords = async (params = {}) => {
  const db = loadDb()
  const page = Number(params.page || 1)
  const size = Number(params.size || 10)
  let list = [...(db.records || [])]

  if (params.date) list = list.filter((r) => String(r.time || '').includes(params.date))
  if (params.role) list = list.filter((r) => r.role === params.role)
  if (params.type) list = list.filter((r) => r.type === params.type)
  if (params.project) list = list.filter((r) => String(r.project || '').includes(params.project))

  return { success: true, data: paginate(list, page, size) }
}

export const exportOperationRecords = async () => {
  return { success: true, url: 'about:blank' }
}

export const refreshOperationRecords = async () => ({ success: true })

