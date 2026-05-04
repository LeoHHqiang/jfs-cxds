import { loadDb, mutateDb, paginate } from './mockDb'

const STAGE_ROUTE_LABELS = {
  base: '基础项录入',
  delivery: '交付追踪',
  accept: '验收项录入',
  'mold-archive': '模具交付建档'
}

function nowRecordTime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function readCurrentUserSnapshot() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!raw) return { account: '', displayName: '', role: '' }
    const u = JSON.parse(raw)
    return {
      account: String(u.account || u.username || '').trim(),
      displayName: String(u.profile?.displayName || u.name || u.account || '').trim(),
      role: String(u.role || 'user').trim()
    }
  } catch {
    return { account: '', displayName: '', role: '' }
  }
}

/**
 * 验收流程中点击「完成节点」或模具交付建档提交成功后调用：写入本地操作记录（账号、时间、节点、项目）。
 */
export function appendNodeCompleteRecord({ projectCode, route }) {
  const node = STAGE_ROUTE_LABELS[route] || String(route || '').trim() || '验收节点'
  const actor = readCurrentUserSnapshot()
  const account = actor.account || '—'
  const displayName = actor.displayName || account
  const time = nowRecordTime()
  const proj = String(projectCode || '').trim() || '—'
  mutateDb((db) => {
    const list = [...(db.records || [])]
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    list.unshift({
      id,
      time,
      account,
      userName: displayName,
      role: actor.role || 'user',
      type: 'stage_complete',
      project: proj,
      node,
      description: `完成节点「${node}」`
    })
    db.records = list
    return db
  })
}

export const fetchOperationRecords = async (params = {}) => {
  const db = loadDb()
  const page = Number(params.page || 1)
  const size = Number(params.size || 10)
  let list = [...(db.records || [])]

  if (params.date) list = list.filter((r) => String(r.time || '').includes(params.date))
  if (params.role) list = list.filter((r) => r.role === params.role)
  if (params.type) list = list.filter((r) => r.type === params.type)
  if (params.project) list = list.filter((r) => String(r.project || '').includes(params.project))
  if (params.account) {
    const q = String(params.account).trim().toLowerCase()
    if (q) list = list.filter((r) => String(r.account || r.userName || '').toLowerCase().includes(q))
  }
  if (params.node) {
    const q = String(params.node).trim().toLowerCase()
    if (q) list = list.filter((r) => String(r.node || r.description || '').toLowerCase().includes(q))
  }

  return { success: true, data: paginate(list, page, size) }
}

export const exportOperationRecords = async () => {
  return { success: true, url: 'about:blank' }
}

export const refreshOperationRecords = async () => ({ success: true })

