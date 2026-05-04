import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { getProjects, repairMoveApplyBaseProjectBinding, getAcceptItemMaterialsForProject } from './demoApi'
import { getBaseItems } from './baseItems'
import { loadDb, mutateDb, nextId } from './mockDb'

const MOVE_APPLY_TABLE = 'move_apply_list'

function mapMoveApplyFromDb(row) {
  if (!row) return null
  if (row.applyNo != null && row.apply_no == null) return row
  return {
    id: row.id,
    applyNo: row.apply_no || '',
    partName: row.part_name || '',
    partNo: row.part_no || '',
    toolName: row.tool_name || '',
    fromSupplier: row.from_supplier || '',
    toSupplier: row.to_supplier || '',
    applicant: row.applicant || '',
    applyTime: row.apply_time || '',
    status: row.status || 'draft',
    meta: row.meta && typeof row.meta === 'object' ? row.meta : {},
    details: Array.isArray(row.details) ? row.details : []
  }
}

function moveApplyToDbFields(row) {
  return {
    apply_no: row.applyNo || '',
    part_name: row.partName || '',
    part_no: row.partNo || '',
    tool_name: row.toolName || '',
    from_supplier: row.fromSupplier || '',
    to_supplier: row.toSupplier || '',
    applicant: row.applicant || '',
    apply_time: row.applyTime || '',
    status: row.status || 'draft',
    meta: row.meta || {},
    details: row.details || []
  }
}

async function refreshMoveApproveStatsFromCloud() {
  if (!hasSupabaseEnv || !supabase) return
  try {
    const { count: pending } = await supabase
      .from(MOVE_APPLY_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    const { count: approved } = await supabase
      .from(MOVE_APPLY_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
    mutateDb((db) => {
      db.moveApproveStats = { pending: pending || 0, approved: approved || 0 }
      return db
    })
  } catch (e) {
    console.warn('[refreshMoveApproveStatsFromCloud]', e?.message || e)
  }
}

/** 清空全部移模申请（本地 mock 或 Supabase 表 `move_apply_list`） */
export async function clearMoveApplyData() {
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.moveApplyList = []
      syncMoveApproveStats(db)
      return db
    })
    return { success: true }
  }
  try {
    const { data: rows, error: selErr } = await supabase.from(MOVE_APPLY_TABLE).select('id')
    if (selErr) throw selErr
    const ids = (rows || []).map((r) => r.id).filter((x) => x != null)
    if (ids.length) {
      const { error: delErr } = await supabase.from(MOVE_APPLY_TABLE).delete().in('id', ids)
      if (delErr) throw delErr
    }
    await refreshMoveApproveStatsFromCloud()
    return { success: true }
  } catch (e) {
    console.error('[clearMoveApplyData]', e)
    return { success: false, message: e.message || '清空失败（请确认已在库中创建 move_apply_list 表）' }
  }
}

function syncMoveApproveStats(db) {
  const list = db.moveApplyList || []
  db.moveApproveStats = {
    pending: list.filter((i) => i.status === 'pending').length,
    approved: list.filter((i) => i.status === 'approved').length
  }
}

const LIST_VISIBLE_STATUSES = new Set(['pending', 'approved'])
const LIST_VISIBLE_WITH_DRAFT = new Set(['pending', 'approved', 'draft'])
const DETAIL_VISIBLE_STATUSES = new Set(['pending', 'approved'])

export function filterVisibleMoveApplyDetails(details, applyStatus) {
  const list = Array.isArray(details) ? details : []
  if (applyStatus === 'draft') {
    return list.filter((d) => d.operated)
  }
  return list.filter((d) => {
    if (!d.operated) return false
    const ls = d.lineStatus || 'pending'
    return DETAIL_VISIBLE_STATUSES.has(ls)
  })
}

/** 验收完成后可发起工装所在地变更的基础数据 */
export const fetchMoveApplyEligibleBaseItems = async () => {
  const db = loadDb()
  const list = (db.baseItems || []).filter((b) => b.acceptanceCompleted === true)
  return { success: true, data: { list } }
}

export const fetchMoveApplyList = async (filters = {}) => {
  let list = []
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    list = [...(db.moveApplyList || [])]
  } else {
    try {
      const { data, error } = await supabase.from(MOVE_APPLY_TABLE).select('*').order('id', { ascending: false })
      if (error) throw error
      list = (data || []).map(mapMoveApplyFromDb).filter(Boolean)
    } catch (e) {
      console.error('[fetchMoveApplyList]', e)
      list = []
    }
  }
  if (!filters.includeAllStatuses) {
    if (!filters.status && filters.includeRejected !== true) {
      const allow = filters.includeDraft === true ? LIST_VISIBLE_WITH_DRAFT : LIST_VISIBLE_STATUSES
      list = list.filter((i) => allow.has(i.status))
    }
  }
  if (filters.partName) list = list.filter((i) => String(i.partName || '').includes(filters.partName))
  if (filters.partNo) list = list.filter((i) => String(i.partNo || '').includes(filters.partNo))
  if (filters.toolName) list = list.filter((i) => String(i.toolName || '').includes(filters.toolName))
  if (filters.supplier) list = list.filter((i) => String(i.fromSupplier || '').includes(filters.supplier))
  if (filters.newSupplier) list = list.filter((i) => String(i.toSupplier || '').includes(filters.newSupplier))
  if (filters.status) list = list.filter((i) => i.status === filters.status)
  return { success: true, data: { list, total: list.length } }
}

function normalizeDetails(details) {
  if (!Array.isArray(details)) return []
  return details.map((d, idx) => ({
    id: d.id != null ? String(d.id) : `d-${idx}`,
    baseItemId: d.baseItemId,
    partName: d.partName || '',
    partNo: d.partNo || '',
    toolName: d.toolName || '',
    supplier: d.supplier || '',
    moldType: d.moldType || '',
    fromLocation: d.fromLocation || '',
    toLocation: d.toLocation || '',
    operated: !!d.operated,
    lineStatus: d.operated ? d.lineStatus || 'pending' : 'draft'
  }))
}

/** 验收项录入节点已完成（completedUpToIndex ≥ 3）的项目才允许发起移模，与「验收完成」语义对齐 */
const MOVE_APPLY_MIN_COMPLETED_INDEX = 3

function projectEligibleForMoveApply(p) {
  const n = Number(p?.completedUpToIndex ?? 0)
  return Number.isFinite(n) && n >= MOVE_APPLY_MIN_COMPLETED_INDEX
}

/** 移模申请：项目下拉与 getProjects 一致，且仅包含验收项录入及之前节点均已完成的验收项目 */
export const fetchMoveApplyProjectOptions = async () => {
  try {
    const { list = [] } = await getProjects()
    const seen = new Set()
    const opts = []
    for (const p of list) {
      if (!projectEligibleForMoveApply(p)) continue
      const code = String(p.code || '').trim()
      if (!code || seen.has(code)) continue
      seen.add(code)
      opts.push({ code, label: code, projectId: p.id })
    }
    opts.sort((a, b) => a.code.localeCompare(b.code, 'zh-Hans-CN'))
    return { success: true, data: { list: opts } }
  } catch {
    const db = loadDb()
    const opts = (db.projects || [])
      .map((p) => ({
        code: String(p.code || '').trim(),
        label: String(p.code || '').trim(),
        projectId: p.id,
        completedUpToIndex: p.completedUpToIndex
      }))
      .filter((x) => x.code && projectEligibleForMoveApply(x))
    opts.sort((a, b) => a.code.localeCompare(b.code, 'zh-Hans-CN'))
    return { success: true, data: { list: opts } }
  }
}

/** 与基础项「工装分类」一致：camel / snake / 中文表头键 / 明细 moldType */
function pickBaseItemToolType(b) {
  if (!b || typeof b !== 'object') return ''
  const v = b.toolType ?? b.tool_type ?? b['工装分类'] ?? b.moldType
  return v == null ? '' : String(v).trim()
}

/** 与 mock 合并、Excel 导入、历史库结构对齐：统一 camelCase 供移模表单使用 */
export function normalizePartRowForMoveApply(b) {
  if (!b || typeof b !== 'object') return b
  const toolType = pickBaseItemToolType(b)
  const toolUsageLocation = String(b.toolUsageLocation || b.tool_usage_location || '').trim()
  return { ...b, toolType, toolUsageLocation }
}

function normCode(s) {
  return String(s || '').trim().toLowerCase()
}

/**
 * 指定项目下可选零件：优先合并以下关联（去重），与验收项材料写回、repair 归并一致。
 * 1. 基础项 projectCode 与项目编码一致（忽略大小写）
 * 2. 基础项 projectId 与项目 id 一致
 * 3. 验收项材料 acceptItemMaterials 中已绑定到该 projectId 的 baseItemId
 * 若仍为空，则回退为全部基础项（与交付追踪 / 验收项录入同源），避免仅选到项目名而零件下拉为空。
 */
export const fetchMoveApplyPartsForProject = async (projectCode) => {
  const pc = String(projectCode || '').trim()
  if (!pc) return { success: true, data: { list: [] } }
  const pcNorm = normCode(pc)

  let proj = null
  let baseItems = []

  if (!hasSupabaseEnv || !supabase) {
    let db = loadDb()
    proj =
      (db.projects || []).find((p) => String(p.code || '').trim() === pc) ||
      (db.projects || []).find((p) => normCode(p.code) === pcNorm) ||
      null
    if (proj && projectEligibleForMoveApply(proj)) {
      repairMoveApplyBaseProjectBinding(proj.id)
      db = loadDb()
      proj =
        (db.projects || []).find((p) => String(p.code || '').trim() === pc) ||
        (db.projects || []).find((p) => normCode(p.code) === pcNorm) ||
        null
    }
    baseItems = db.baseItems || []
  } else {
    try {
      const { list: projects = [] } = await getProjects()
      proj =
        projects.find((p) => String(p.code || '').trim() === pc) ||
        projects.find((p) => normCode(p.code) === pcNorm) ||
        null
    } catch {
      proj = null
    }
    try {
      const { list } = await getBaseItems({})
      baseItems = list || []
    } catch {
      baseItems = []
    }
  }
  const mapList = (list) => (Array.isArray(list) ? list.map(normalizePartRowForMoveApply) : [])

  const seen = new Map()
  const pushRows = (rows) => {
    for (const b of rows) {
      if (!b || b.id == null) continue
      const key = String(b.id)
      if (!seen.has(key)) seen.set(key, b)
    }
  }

  pushRows(baseItems.filter((b) => normCode(b.projectCode) === pcNorm))

  if (proj) {
    pushRows(
      baseItems.filter((b) => b.projectId != null && Number(b.projectId) === Number(proj.id))
    )
    const matRows = await getAcceptItemMaterialsForProject(proj.id)
    const matIds = new Set(matRows.map((m) => String(m.baseItemId || '').trim()).filter(Boolean))
    if (matIds.size) {
      pushRows(baseItems.filter((b) => matIds.has(String(b.id))))
    }
  }

  if (!seen.size) {
    pushRows(baseItems)
  }

  const merged = [...seen.values()].sort((a, b) => {
    const pa = String(a.partNo || '')
    const pb = String(b.partNo || '')
    if (pa !== pb) return pa.localeCompare(pb, 'zh-Hans-CN')
    return String(a.id).localeCompare(String(b.id), 'zh-Hans-CN')
  })

  return { success: true, data: { list: mapList(merged) } }
}

/** 转移至地等下拉：库内全部工装使用地 + 常用地址 */
export const fetchMoveApplyLocationOptions = async () => {
  const set = new Set()
  const extras = [
    '浙江省宁波市海曙区信宁路113号',
    '浙江省宁波市江北区和平路142号',
    '浙江省宁波市江北区和平路100号'
  ]
  let bases = []
  if (!hasSupabaseEnv || !supabase) {
    bases = loadDb().baseItems || []
  } else {
    try {
      const { list } = await getBaseItems({})
      bases = list || []
    } catch {
      bases = []
    }
  }
  for (const b of bases) {
    const v = String(b.toolUsageLocation || '').trim()
    if (v) set.add(v)
  }
  extras.forEach((e) => set.add(e))
  return { success: true, data: { list: [...set].sort((a, b) => a.localeCompare(b, 'zh-CN')) } }
}

function nowApplyTimeText() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function applyNoForId(db, id) {
  const now = new Date()
  return `MM${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(id).padStart(3, '0')}`
}

/** 新建待审批，或从草稿 id 提交为待审批 */
export const createMoveApply = async (payload = {}) => {
  const targetStatus = payload.status === 'draft' ? 'draft' : 'pending'
  const updateId = payload.id != null ? Number(payload.id) : null
  const meta = payload.meta && typeof payload.meta === 'object' ? { ...payload.meta } : {}
  let details = normalizeDetails(payload.details)
  if (targetStatus === 'pending') {
    details = details.map((d) =>
      d.operated ? { ...d, lineStatus: 'pending' } : { ...d, lineStatus: d.lineStatus || 'draft' }
    )
  } else {
    details = details.map((d) =>
      d.operated ? { ...d, lineStatus: 'draft' } : { ...d, lineStatus: d.lineStatus || 'draft' }
    )
  }
  const first = details.find((d) => d.operated) || details[0] || {}
  const partName = payload.partName || first.partName || ''
  const partNo = payload.partNo || first.partNo || ''
  const toolName = payload.toolName || first.toolName || ''
  const fromSupplier = payload.fromSupplier || first.supplier || ''
  const toSupplier = payload.toSupplier || meta.toStockLoc || first.toLocation || ''
  const applicant = payload.applicant || meta.applicant || ''

  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      if (updateId != null) {
        const row = (db.moveApplyList || []).find((x) => Number(x.id) === updateId)
        if (row && row.status === 'draft') {
          Object.assign(row, {
            partName,
            partNo,
            toolName,
            fromSupplier,
            toSupplier,
            applicant: applicant || row.applicant,
            applyTime: nowApplyTimeText(),
            status: targetStatus,
            meta,
            details
          })
          saved = row
          syncMoveApproveStats(db)
          return db
        }
      }
      const id = nextId(db.moveApplyList || [])
      const dateText = nowApplyTimeText()
      const applyNo = payload.applyNo || applyNoForId(db, id)
      saved = {
        id,
        applyNo,
        partName,
        partNo,
        toolName,
        fromSupplier,
        toSupplier,
        applicant,
        applyTime: dateText,
        status: targetStatus,
        meta,
        details
      }
      db.moveApplyList = [saved, ...(db.moveApplyList || [])]
      syncMoveApproveStats(db)
      return db
    })
    return { success: true, data: saved }
  }

  try {
    const applyTime = nowApplyTimeText()
    if (updateId != null) {
      const { data: ex, error: e0 } = await supabase.from(MOVE_APPLY_TABLE).select('id,status').eq('id', updateId).maybeSingle()
      if (e0) throw e0
      if (ex && ex.status === 'draft') {
        const prev = mapMoveApplyFromDb(ex)
        const body = moveApplyToDbFields({
          applyNo: prev.applyNo || payload.applyNo || '',
          partName,
          partNo,
          toolName,
          fromSupplier,
          toSupplier,
          applicant: applicant || prev.applicant || '',
          applyTime,
          status: targetStatus,
          meta,
          details
        })
        const { data, error } = await supabase.from(MOVE_APPLY_TABLE).update(body).eq('id', updateId).select('*').single()
        if (error) throw error
        await refreshMoveApproveStatsFromCloud()
        return { success: true, data: mapMoveApplyFromDb(data) }
      }
    }
    const applyNo = payload.applyNo || `MM${Date.now()}`
    const body = moveApplyToDbFields({
      applyNo,
      partName,
      partNo,
      toolName,
      fromSupplier,
      toSupplier,
      applicant,
      applyTime,
      status: targetStatus,
      meta,
      details
    })
    const { data, error } = await supabase.from(MOVE_APPLY_TABLE).insert([body]).select('*').single()
    if (error) throw error
    await refreshMoveApproveStatsFromCloud()
    return { success: true, data: mapMoveApplyFromDb(data) }
  } catch (error) {
    console.error('[createMoveApply]', error)
    return { success: false, message: error.message || '保存失败', data: null }
  }
}

export const approveMoveApply = async ({ id }) => {
  if (!hasSupabaseEnv || !supabase) {
    let ok = false
    mutateDb((db) => {
      const row = (db.moveApplyList || []).find((x) => Number(x.id) === Number(id))
      if (!row || row.status !== 'pending') return db
      row.status = 'approved'
      row.details = (row.details || []).map((d) =>
        d.operated ? { ...d, lineStatus: 'approved' } : d
      )
      syncMoveApproveStats(db)
      ok = true
      return db
    })
    return ok ? { success: true } : { success: false, message: '记录不存在或不可审批' }
  }
  try {
    const { data: row, error } = await supabase.from(MOVE_APPLY_TABLE).select('*').eq('id', id).maybeSingle()
    if (error) throw error
    const mapped = mapMoveApplyFromDb(row)
    if (!mapped || mapped.status !== 'pending') {
      return { success: false, message: '记录不存在或不可审批' }
    }
    const details = (mapped.details || []).map((d) =>
      d.operated ? { ...d, lineStatus: 'approved' } : d
    )
    const { error: upErr } = await supabase
      .from(MOVE_APPLY_TABLE)
      .update({ status: 'approved', details })
      .eq('id', id)
    if (upErr) throw upErr
    await refreshMoveApproveStatsFromCloud()
    return { success: true }
  } catch (e) {
    console.error('[approveMoveApply]', e)
    return { success: false, message: e.message || '操作失败' }
  }
}

export const rejectMoveApply = async ({ id }) => {
  if (!hasSupabaseEnv || !supabase) {
    let ok = false
    mutateDb((db) => {
      const row = (db.moveApplyList || []).find((x) => Number(x.id) === Number(id))
      if (!row || row.status !== 'pending') return db
      row.status = 'rejected'
      row.details = (row.details || []).map((d) =>
        d.operated ? { ...d, lineStatus: 'rejected' } : d
      )
      syncMoveApproveStats(db)
      ok = true
      return db
    })
    return ok ? { success: true } : { success: false, message: '记录不存在或不可驳回' }
  }
  try {
    const { data: row, error } = await supabase.from(MOVE_APPLY_TABLE).select('*').eq('id', id).maybeSingle()
    if (error) throw error
    const mapped = mapMoveApplyFromDb(row)
    if (!mapped || mapped.status !== 'pending') {
      return { success: false, message: '记录不存在或不可驳回' }
    }
    const details = (mapped.details || []).map((d) =>
      d.operated ? { ...d, lineStatus: 'rejected' } : d
    )
    const { error: upErr } = await supabase
      .from(MOVE_APPLY_TABLE)
      .update({ status: 'rejected', details })
      .eq('id', id)
    if (upErr) throw upErr
    await refreshMoveApproveStatsFromCloud()
    return { success: true }
  } catch (e) {
    console.error('[rejectMoveApply]', e)
    return { success: false, message: e.message || '操作失败' }
  }
}

/** 待审批撤回为处理中（草稿） */
export const withdrawMoveApply = async ({ id }) => {
  if (!hasSupabaseEnv || !supabase) {
    let ok = false
    mutateDb((db) => {
      const row = (db.moveApplyList || []).find((x) => Number(x.id) === Number(id))
      if (!row || row.status !== 'pending') return db
      row.status = 'draft'
      row.details = (row.details || []).map((d) =>
        d.operated ? { ...d, lineStatus: 'draft' } : d
      )
      syncMoveApproveStats(db)
      ok = true
      return db
    })
    return ok ? { success: true } : { success: false, message: '仅待审批的申请可撤回' }
  }
  try {
    const { data: row, error } = await supabase.from(MOVE_APPLY_TABLE).select('*').eq('id', id).maybeSingle()
    if (error) throw error
    const mapped = mapMoveApplyFromDb(row)
    if (!mapped || mapped.status !== 'pending') {
      return { success: false, message: '仅待审批的申请可撤回' }
    }
    const details = (mapped.details || []).map((d) =>
      d.operated ? { ...d, lineStatus: 'draft' } : d
    )
    const { error: upErr } = await supabase
      .from(MOVE_APPLY_TABLE)
      .update({ status: 'draft', details })
      .eq('id', id)
    if (upErr) throw upErr
    await refreshMoveApproveStatsFromCloud()
    return { success: true }
  } catch (e) {
    console.error('[withdrawMoveApply]', e)
    return { success: false, message: e.message || '操作失败' }
  }
}

/** 仅处理中（草稿）可删除 */
export const deleteMoveApply = async ({ id }) => {
  if (!hasSupabaseEnv || !supabase) {
    let ok = false
    mutateDb((db) => {
      const list = db.moveApplyList || []
      const row = list.find((x) => Number(x.id) === Number(id))
      if (!row || row.status !== 'draft') return db
      db.moveApplyList = list.filter((x) => Number(x.id) !== Number(id))
      syncMoveApproveStats(db)
      ok = true
      return db
    })
    return ok ? { success: true } : { success: false, message: '仅处理中的申请可删除' }
  }
  try {
    const { data: row, error } = await supabase.from(MOVE_APPLY_TABLE).select('id,status').eq('id', id).maybeSingle()
    if (error) throw error
    if (!row || row.status !== 'draft') {
      return { success: false, message: '仅处理中的申请可删除' }
    }
    const { error: delErr } = await supabase.from(MOVE_APPLY_TABLE).delete().eq('id', id)
    if (delErr) throw delErr
    await refreshMoveApproveStatsFromCloud()
    return { success: true }
  } catch (e) {
    console.error('[deleteMoveApply]', e)
    return { success: false, message: e.message || '操作失败' }
  }
}
