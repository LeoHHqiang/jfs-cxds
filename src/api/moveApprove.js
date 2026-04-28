import { loadDb, mutateDb } from './mockDb'

export const fetchMoveApproveStats = async () => {
  const db = loadDb()
  return { success: true, data: db.moveApproveStats || { pending: 0, approved: 0 } }
}

export const fetchMoveApproveChart = async () => {
  const db = loadDb()
  return { success: true, data: { series: db.moveApproveSeries || [] } }
}

export const exportMoveApprove = async () => ({ success: true, url: 'about:blank' })

export const importMoveApprove = async (file) => {
  if (!file) return { success: false, message: '文件不存在' }
  mutateDb((db) => {
    db.moveApproveStats = {
      pending: Number(db.moveApproveStats?.pending || 0) + 1,
      approved: Number(db.moveApproveStats?.approved || 0)
    }
    return db
  })
  return { success: true }
}



