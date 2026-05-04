import { loadDb, paginate } from './mockDb'

/** 在 mutateDb 回调内将一条记录插到 acceptHistory 最前 */
export function prependAcceptHistoryRow(db, row) {
  const list = db.acceptHistory || []
  const id =
    row.id != null && String(row.id).trim() !== ''
      ? String(row.id)
      : `ah-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const next = {
    id,
    acceptTime: row.acceptTime || '',
    projectCode: row.projectCode || '',
    owner: row.owner || '',
    ownerName: row.ownerName || '',
    progress: row.progress || '模具交付建档',
    purchase: row.purchase || '',
    purchaseName: row.purchaseName || '',
    startDate: row.startDate || '',
    endDate: row.endDate || '',
    remark: row.remark || ''
  }
  db.acceptHistory = [next, ...list]
}

/** 与验收列表「已完成」一致：completedUpToIndex ≥ 4（模具交付建档节点完成） */
const HISTORY_FULL_ACCEPT_INDEX = 4

/** 开始：首个有值的阶段截止时间 */
function firstStageDeadline(stages) {
  const arr = Array.isArray(stages) ? stages : []
  for (const s of arr) {
    const d = String(s?.deadline || '').trim()
    if (d) return d
  }
  return ''
}

/** 指定进度档对应阶段上的截止时间（与 completedUpToIndex 下标对齐） */
function deadlineAtStageIndex(stages, completedUpToIndex) {
  const arr = Array.isArray(stages) ? stages : []
  const n = Number(completedUpToIndex)
  if (!Number.isFinite(n) || n < 0 || !arr.length) return ''
  const i = Math.min(n, arr.length - 1)
  return String(arr[i]?.deadline || '').trim()
}

function normProjectCode(s) {
  return String(s || '').trim().toLowerCase()
}

/** 将「项目已整单完成但本地 acceptHistory 无记录」的补充行（读 getProjects，不写库） */
async function buildSyntheticAcceptHistoryRows(existingRows) {
  const codesSeen = new Set(existingRows.map((r) => normProjectCode(r.projectCode)))
  let projects = []
  try {
    const { getProjects } = await import('./demoApi')
    const res = await getProjects()
    projects = res?.list || []
  } catch {
    return []
  }
  const out = []
  for (const p of projects) {
    const cap = Number(p.completedUpToIndex)
    if (!Number.isFinite(cap) || cap < HISTORY_FULL_ACCEPT_INDEX) continue
    const code = String(p.code || '').trim()
    if (!code) continue
    const key = normProjectCode(code)
    if (codesSeen.has(key)) continue
    codesSeen.add(key)
    const at = p.updatedAt != null ? String(p.updatedAt).trim() : ''
    const startDate =
      String(p.projectStartDate || p.startDate || '').trim() || firstStageDeadline(p.stages)
    /** 结束：最后完成节点的完成时刻（以项目更新时间为准），无则回退到该档阶段截止时间 */
    const endDate =
      String(p.projectEndDate || p.endDate || '').trim() ||
      at ||
      deadlineAtStageIndex(p.stages, cap)
    const purchaseName = String(p.moldArchivePurchaser || '').trim()
    out.push({
      id: `hist-auto-${p.id}`,
      acceptTime: at || '—',
      projectCode: p.code || '',
      owner: p.owner || '',
      ownerName: p.owner || '',
      progress: '整体验收完成',
      purchase: '',
      purchaseName,
      startDate,
      endDate,
      remark: ''
    })
  }
  return out
}

function buildFilterOptions(list) {
  const ownerMap = new Map()
  const purchaseMap = new Map()
  for (const r of list) {
    const on = String(r.ownerName || '').trim()
    const oid = String(r.owner || '').trim()
    if (on || oid) {
      const key = oid || on
      if (!ownerMap.has(key)) ownerMap.set(key, { label: on || oid, value: oid || on })
    }
    const pn = String(r.purchaseName || '').trim()
    if (pn && !purchaseMap.has(pn)) purchaseMap.set(pn, { label: pn, value: pn })
  }
  const ownerOptions = [...ownerMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'zh-Hans-CN')
  )
  const purchaseOptions = [...purchaseMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'zh-Hans-CN')
  )
  return { ownerOptions, purchaseOptions }
}

export const fetchAcceptHistory = async (params = {}) => {
  const db = loadDb()
  const page = Number(params.page || 1)
  const size = Number(params.size || 10)
  const stored = [...(db.acceptHistory || [])]
  const synthetic = await buildSyntheticAcceptHistoryRows(stored)
  let merged = [...synthetic, ...stored]

  const { ownerOptions, purchaseOptions } = buildFilterOptions(merged)

  let list = merged
  if (params.projectCode) list = list.filter((i) => String(i.projectCode || '').includes(params.projectCode))
  if (params.owner) {
    const o = String(params.owner).trim()
    list = list.filter(
      (i) => String(i.owner || '').trim() === o || String(i.ownerName || '').trim() === o
    )
  }
  if (params.progress) list = list.filter((i) => String(i.progress || '').includes(params.progress))
  if (params.purchase) {
    const p = String(params.purchase).trim()
    list = list.filter(
      (i) => String(i.purchase || '').trim() === p || String(i.purchaseName || '').includes(p)
    )
  }
  if (params.startDate) list = list.filter((i) => (i.startDate || '') >= params.startDate)
  if (params.endDate) list = list.filter((i) => (i.endDate || '') <= params.endDate)

  const pageData = paginate(list, page, size)
  return {
    success: true,
    data: {
      ...pageData,
      ownerOptions,
      purchaseOptions
    }
  }
}
