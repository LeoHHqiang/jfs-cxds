import { loadDb, paginate } from './mockDb'

export const fetchAcceptHistory = async (params = {}) => {
  const db = loadDb()
  const page = Number(params.page || 1)
  const size = Number(params.size || 10)
  let list = [...(db.acceptHistory || [])]

  if (params.projectCode) list = list.filter((i) => String(i.projectCode || '').includes(params.projectCode))
  if (params.owner) list = list.filter((i) => i.owner === params.owner)
  if (params.progress) list = list.filter((i) => String(i.progress || '').includes(params.progress))
  if (params.purchase) list = list.filter((i) => i.purchase === params.purchase)
  if (params.startDate) list = list.filter((i) => (i.startDate || '') >= params.startDate)
  if (params.endDate) list = list.filter((i) => (i.endDate || '') <= params.endDate)

  return { success: true, data: paginate(list, page, size) }
}

export const exportAcceptHistory = async () => ({ success: true, url: 'about:blank' })



