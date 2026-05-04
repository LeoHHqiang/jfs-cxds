import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { composeAddressLine } from '@/utils/chinaRegionSelect'
import { prependAcceptHistoryRow } from './acceptHistory'
import { appendNodeCompleteRecord } from './record'
import { loadDb, mutateDb, nextId } from './mockDb'
import { batchDeleteBaseItems, getBaseItems, updateBaseItem } from './baseItems'

const ACCEPT_ITEM_MATERIALS_TABLE = 'accept_item_materials'

function mapAcceptMaterialFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    projectId: Number(row.project_id),
    baseItemId: String(row.base_item_id),
    acceptReport: row.accept_report || '',
    materialCert: row.material_cert || '',
    upperMold: row.upper_mold || '',
    lowerMold: row.lower_mold || '',
    overallMold: row.overall_mold || '',
    nameplate: row.nameplate || '',
    length: row.length != null ? String(row.length) : '',
    width: row.width != null ? String(row.width) : '',
    height: row.height != null ? String(row.height) : '',
    weight: row.weight != null ? String(row.weight) : '',
    updatedAt: row.updated_at || ''
  }
}

/** 供验收项列表、移模零件关联等读取；无表或报错时返回空数组，页面仍可展示基础行 */
export async function getAcceptItemMaterialsForProject(projectId) {
  const pid = Number(projectId)
  if (!Number.isFinite(pid) || pid <= 0) return []
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    return (db.acceptItemMaterials || []).filter((x) => Number(x.projectId) === pid)
  }
  try {
    const { data, error } = await supabase.from(ACCEPT_ITEM_MATERIALS_TABLE).select('*').eq('project_id', pid)
    if (error) throw error
    return (data || []).map(mapAcceptMaterialFromDb).filter(Boolean)
  } catch (e) {
    console.warn('[getAcceptItemMaterialsForProject]', e?.message || e)
    return []
  }
}

async function syncBaseItemProjectAfterAcceptMaterialSupabase(projectId, baseItemId) {
  if (!hasSupabaseEnv || !supabase) return
  const { list } = await getProjects()
  const proj = (list || []).find((p) => Number(p.id) === Number(projectId))
  if (!proj) return
  try {
    await updateBaseItem(baseItemId, {
      projectId: Number(projectId),
      projectCode: String(proj.code || '')
    })
  } catch (e) {
    console.warn('[syncBaseItemProjectAfterAcceptMaterialSupabase]', baseItemId, e?.message || e)
  }
}

function pushToolMoveEntriesOnDb(db, entries) {
  if (!entries || !entries.length) return
  const list = [...(db.toolMoveHistory || [])]
  let nid = list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  for (const e of entries) {
    list.push({
      id: nid++,
      partNo: e.partNo || '',
      fromLocation: e.fromLocation || '',
      toLocation: e.toLocation || '',
      movedAt: now,
      baseItemId: e.baseItemId
    })
  }
  db.toolMoveHistory = list
}

/** 按零件号查询移模历史（新在前） */
export function getToolMoveHistoryForPartNo(partNo) {
  const db = loadDb()
  const pn = String(partNo || '').trim()
  return (db.toolMoveHistory || [])
    .filter((h) => String(h.partNo || '').trim() === pn)
    .sort((a, b) => Number(b.id) - Number(a.id))
}

/**
 * 写入移模历史（仅存本地 mock DB，供「移模记录」展示）。
 * 工装使用地本身可能在 Supabase；历史表未对接云端前，统一追加到本地以便界面可查。
 */
export function recordToolMoves(entries) {
  if (!entries || !entries.length) return
  mutateDb((db) => {
    pushToolMoveEntriesOnDb(db, entries)
    return db
  })
}

function withErrorScope(scope, error) {
  console.error(`[demoApi:${scope}]`, error)
  throw error
}

function nowDateText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function mapDeliveryFromDb(row) {
  return {
    id: row.id,
    partName: row.part_name || '',
    partNo: row.part_no || '',
    childName: row.child_name || '',
    childNo: row.child_no || '',
    toolName: row.tool_name || '',
    toolType: row.tool_type || '',
    realToolNo: row.real_tool_no || '',
    supplier: row.supplier || ''
  }
}

function mapDeliveryToDb(row) {
  return {
    part_name: row.partName || '',
    part_no: row.partNo || '',
    child_name: row.childName || '',
    child_no: row.childNo || '',
    tool_name: row.toolName || '',
    tool_type: row.toolType || '',
    real_tool_no: row.realToolNo || '',
    supplier: row.supplier || ''
  }
}

function normProjectCode(s) {
  return String(s || '').trim().toLowerCase()
}

/** 交付追踪列表行：与基础录入项一致（工装使用地在 baseItems.toolUsageLocation） */
function baseRowToDeliveryListItem(b) {
  const owner = b.owner || b.purchaser || ''
  return {
    id: b.id,
    projectCode: b.projectCode || '',
    projectId: b.projectId != null ? b.projectId : null,
    partName: b.partName || '',
    partNo: b.partNo || '',
    childName: b.childName || '',
    childNo: b.childNo || '',
    toolName: b.toolName || '',
    toolType: b.toolType || '',
    realToolNo: b.realToolNo || '',
    supplier: b.supplier || '',
    toolSupplier: b.toolSupplier || '',
    vendorToolNo: b.vendorToolNo || '',
    customerToolNo: b.customerToolNo || '',
    owner,
    purchaser: b.purchaser || owner,
    partsFactory: b.partsFactory || '',
    toolUsageLocation: b.toolUsageLocation || ''
  }
}

function mapAcceptFromDb(row) {
  return {
    id: row.id,
    partName: row.part_name || '',
    partNo: row.part_no || '',
    childName: row.child_name || '',
    childNo: row.child_no || '',
    toolName: row.tool_name || '',
    toolType: row.tool_type || '',
    realToolNo: row.real_tool_no || '',
    supplier: row.supplier || ''
  }
}

function mapAcceptToDb(row) {
  return {
    part_name: row.partName || '',
    part_no: row.partNo || '',
    child_name: row.childName || '',
    child_no: row.childNo || '',
    tool_name: row.toolName || '',
    tool_type: row.toolType || '',
    real_tool_no: row.realToolNo || '',
    supplier: row.supplier || '',
    ext: {
      length: row.length || '',
      width: row.width || '',
      height: row.height || '',
      weight: row.weight || ''
    }
  }
}

function mapTemplateFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    creator: row.creator || '',
    createdAt: row.created_at || '',
    items: Array.isArray(row.items) ? row.items : []
  }
}

function mapProjectFromDb(row) {
  const rawCompleted = row.completed_up_to_index ?? row.completedUpToIndex
  /** 缺省 0：新建验收（弹窗保存）已完成，进度落在「基础项录入」；-1 仅显式清空 */
  let completedUpToIndex = 0
  if (rawCompleted !== undefined && rawCompleted !== null && rawCompleted !== '') {
    const n = Number(rawCompleted)
    completedUpToIndex = Number.isFinite(n) ? n : 0
  }
  return {
    id: row.id,
    code: row.code || '',
    owner: row.owner || '',
    updatedAt: row.updated_at || row.updatedAt || nowDateText(),
    progressIndex: row.progress_index ?? row.progressIndex ?? 0,
    completedUpToIndex,
    stages: Array.isArray(row.stages) ? row.stages : [],
    moldArchivePurchaser: row.mold_archive_purchaser || row.moldArchivePurchaser || '',
    moldArchiveRelatedStaff: row.mold_archive_related_staff || row.moldArchiveRelatedStaff || '',
    moldArchiveRemark: row.mold_archive_remark || row.moldArchiveRemark || '',
    projectStartDate: row.project_start_date ?? row.projectStartDate ?? '',
    projectEndDate: row.project_end_date ?? row.projectEndDate ?? '',
    startDate: row.start_date ?? row.startDate ?? '',
    endDate: row.end_date ?? row.endDate ?? ''
  }
}

const STAGE_ROUTE_TO_INDEX = {
  base: 1,
  delivery: 2,
  accept: 3,
  'mold-archive': 4
}

/** 直接设置验收进度索引：-1 清空；-1 以外见 STAGE_NAV 约定（0=新建验收已保存，1~4=路由阶段「完成」） */
export async function setProjectCompletedUpToIndex({ id, completedUpToIndex }) {
  const next = Number(completedUpToIndex)
  if (id == null || !Number.isFinite(next) || next < -1) {
    return withErrorScope('setProjectCompletedUpToIndex', new Error('setProjectCompletedUpToIndex: id and completedUpToIndex >= -1 required'))
  }
  if (!hasSupabaseEnv || !supabase) {
    let updated = null
    mutateDb((db) => {
      const list = [...(db.projects || [])]
      const i = list.findIndex((p) => Number(p.id) === Number(id))
      if (i === -1) return db
      const prev = list[i]
      updated = {
        ...prev,
        completedUpToIndex: next,
        updatedAt: nowDateText()
      }
      list[i] = updated
      db.projects = list
      return db
    })
    if (!updated) {
      return withErrorScope('setProjectCompletedUpToIndex', new Error('project not found'))
    }
    return updated
  }
  try {
    const { data: saved, error: upErr } = await supabase
      .from('projects')
      .update({
        completed_up_to_index: next,
        updated_at: nowDateText()
      })
      .eq('id', id)
      .select('*')
      .single()
    if (upErr) throw upErr
    return mapProjectFromDb(saved)
  } catch (error) {
    return withErrorScope('setProjectCompletedUpToIndex', error)
  }
}

export async function completeProjectStage({ id, route }) {
  const idx = STAGE_ROUTE_TO_INDEX[route]
  if (id == null || idx == null) {
    return withErrorScope('completeProjectStage', new Error('completeProjectStage: id and valid route required'))
  }
  if (!hasSupabaseEnv || !supabase) {
    let updated = null
    mutateDb((db) => {
      const list = [...(db.projects || [])]
      const i = list.findIndex((p) => Number(p.id) === Number(id))
      if (i === -1) return db
      const prev = list[i]
      const cur = Number.isFinite(prev.completedUpToIndex) ? Number(prev.completedUpToIndex) : 0
      const nextIdx = Math.max(cur, idx)
      updated = {
        ...prev,
        completedUpToIndex: nextIdx,
        updatedAt: nowDateText()
      }
      list[i] = updated
      db.projects = list
      applyAcceptMaterialsToBaseItemProjectBinding(db, id)
      if (nextIdx > cur) {
        appendNodeCompleteRecord({ projectCode: String(updated.code || ''), route })
      }
      /** 验收项录入节点完成（进度首次达到 ≥3）时写入历史验收，避免仅依赖「模具交付建档」表单 */
      if (route === 'accept' && cur < 3 && nextIdx >= 3) {
        const now = new Date()
        const startAcc =
          String(updated.projectStartDate || updated.startDate || '').trim() ||
          firstNonEmptyDeadlineFromStages(updated.stages)
        const endAcc =
          String(updated.projectEndDate || updated.endDate || '').trim() ||
          acceptHistoryTimeText(now)
        prependAcceptHistoryRow(db, {
          acceptTime: acceptHistoryTimeText(now),
          projectCode: String(updated.code || ''),
          owner: String(updated.owner || ''),
          ownerName: String(updated.owner || ''),
          progress: '验收完成',
          purchase: '',
          purchaseName: '',
          startDate: startAcc,
          endDate: endAcc,
          remark: '验收项录入阶段已标记完成'
        })
      }
      return db
    })
    if (!updated) {
      return withErrorScope('completeProjectStage', new Error('project not found'))
    }
    return updated
  }
  try {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
    if (error) throw error
    const prev = data || {}
    const cur = Number.isFinite(prev.completed_up_to_index) ? prev.completed_up_to_index : 0
    const next = Math.max(cur, idx)
    const { data: saved, error: upErr } = await supabase.from('projects').update({
      completed_up_to_index: next,
      updated_at: nowDateText()
    }).eq('id', id).select('*').single()
    if (upErr) throw upErr
    const mapped = mapProjectFromDb(saved)
    if (next > cur) {
      appendNodeCompleteRecord({ projectCode: String(mapped.code || ''), route })
    }
    if (route === 'accept' && cur < 3 && next >= 3) {
      mutateDb((db) => {
        const now = new Date()
        const startAcc =
          String(mapped.projectStartDate || mapped.startDate || '').trim() ||
          firstNonEmptyDeadlineFromStages(mapped.stages)
        const endAcc =
          String(mapped.projectEndDate || mapped.endDate || '').trim() ||
          acceptHistoryTimeText(now)
        prependAcceptHistoryRow(db, {
          acceptTime: acceptHistoryTimeText(now),
          projectCode: String(mapped.code || ''),
          owner: String(mapped.owner || ''),
          ownerName: String(mapped.owner || ''),
          progress: '验收完成',
          purchase: '',
          purchaseName: '',
          startDate: startAcc,
          endDate: endAcc,
          remark: '验收项录入阶段已标记完成'
        })
        return db
      })
    }
    return mapped
  } catch (error) {
    return withErrorScope('completeProjectStage', error)
  }
}

function acceptHistoryTimeText(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 开始：首个有值的阶段截止时间 */
function firstNonEmptyDeadlineFromStages(stages) {
  const arr = Array.isArray(stages) ? stages : []
  for (const s of arr) {
    const d = String(s?.deadline || '').trim()
    if (d) return d
  }
  return ''
}

/**
 * 模具交付建档：填写采购等后提交，写入历史验收并推进项目进度（仅本节点）。
 * 历史验收列表仅由此入口产生；重复提交会拒绝。
 */
export async function submitMoldArchiveDeliveryComplete(payload = {}) {
  const purchaser = String(payload.purchaser || '').trim()
  const related = String(payload.relatedStaff || '').trim()
  const remark = String(payload.remark || '').trim()
  const projectId = Number(payload.projectId)
  const idx = STAGE_ROUTE_TO_INDEX['mold-archive']
  if (!Number.isFinite(projectId) || projectId <= 0) {
    return { success: false, message: '缺少有效的项目 id' }
  }
  if (!purchaser) {
    return { success: false, message: '请填写采购（或采购负责人）' }
  }

  if (!hasSupabaseEnv || !supabase) {
    let message = ''
    mutateDb((db) => {
      const list = [...(db.projects || [])]
      const i = list.findIndex((p) => Number(p.id) === projectId)
      if (i === -1) {
        message = '未找到该项目'
        return db
      }
      const prev = list[i]
      const cur = Number.isFinite(prev.completedUpToIndex) ? Number(prev.completedUpToIndex) : 0
      if (cur >= idx) {
        message = '当前项目已完成模具交付建档，无需重复提交。'
        return db
      }
      const nextProj = {
        ...prev,
        completedUpToIndex: Math.max(cur, idx),
        moldArchivePurchaser: purchaser,
        moldArchiveRelatedStaff: related,
        moldArchiveRemark: remark,
        updatedAt: nowDateText()
      }
      list[i] = nextProj
      db.projects = list
      applyAcceptMaterialsToBaseItemProjectBinding(db, projectId)
      reassignLooseAcceptedBaseItemsToProjectWhenNoMaterials(db, projectId)
      const now = new Date()
      const startLocal =
        String(nextProj.projectStartDate || nextProj.startDate || '').trim() ||
        firstNonEmptyDeadlineFromStages(nextProj.stages)
      const endLocal =
        String(nextProj.projectEndDate || nextProj.endDate || '').trim() ||
        acceptHistoryTimeText(now)
      prependAcceptHistoryRow(db, {
        acceptTime: acceptHistoryTimeText(now),
        projectCode: String(nextProj.code || ''),
        owner: String(nextProj.owner || ''),
        ownerName: String(nextProj.owner || ''),
        progress: '模具交付建档',
        purchase: '',
        purchaseName: purchaser,
        startDate: startLocal,
        endDate: endLocal,
        remark: [remark, related ? `其他相关人员：${related}` : ''].filter(Boolean).join('；')
      })
      appendNodeCompleteRecord({ projectCode: String(nextProj.code || ''), route: 'mold-archive' })
      return db
    })
    if (message) return { success: false, message }
    return { success: true }
  }

  const { data: prevRow, error: selErr } = await supabase.from('projects').select('*').eq('id', projectId).single()
  if (selErr) return withErrorScope('submitMoldArchiveDeliveryComplete', selErr)
  const mapped = mapProjectFromDb(prevRow)
  const cur = Number.isFinite(mapped.completedUpToIndex) ? Number(mapped.completedUpToIndex) : 0
  if (cur >= idx) {
    return { success: false, message: '当前项目已完成模具交付建档，无需重复提交。' }
  }
  await completeProjectStage({ id: projectId, route: 'mold-archive' })
  const now = new Date()
  const startRemote =
    String(mapped.projectStartDate || mapped.startDate || '').trim() ||
    firstNonEmptyDeadlineFromStages(mapped.stages)
  const endRemote =
    String(mapped.projectEndDate || mapped.endDate || '').trim() ||
    acceptHistoryTimeText(now)
  mutateDb((db) => {
    prependAcceptHistoryRow(db, {
      acceptTime: acceptHistoryTimeText(now),
      projectCode: String(mapped.code || ''),
      owner: String(mapped.owner || ''),
      ownerName: String(mapped.owner || ''),
      progress: '模具交付建档',
      purchase: '',
      purchaseName: purchaser,
      startDate: startRemote,
      endDate: endRemote,
      remark: [remark, related ? `其他相关人员：${related}` : ''].filter(Boolean).join('；')
    })
    return db
  })
  const { error: moldUpErr } = await supabase
    .from('projects')
    .update({
      mold_archive_purchaser: purchaser,
      mold_archive_related_staff: related,
      mold_archive_remark: remark,
      updated_at: nowDateText()
    })
    .eq('id', projectId)
  if (moldUpErr) {
    console.warn('[submitMoldArchiveDeliveryComplete] optional mold columns', moldUpErr)
  }
  return { success: true }
}

export async function getDeliveryItems(filters = {}) {
  const { toolUsageLocation: useLocFilter, ...baseFilters } = filters || {}
  try {
    const { list: bases } = await getBaseItems(baseFilters)
    let list = bases.map((b) => baseRowToDeliveryListItem(b))
    if (useLocFilter && String(useLocFilter).trim()) {
      const n = String(useLocFilter).trim().toLowerCase()
      list = list.filter((r) => String(r.toolUsageLocation || '').toLowerCase().includes(n))
    }
    return { list, total: list.length }
  } catch (error) {
    return withErrorScope('getDeliveryItems', error)
  }
}

const ACCEPT_MATERIAL_KEYS = ['acceptReport', 'materialCert', 'upperMold', 'lowerMold', 'overallMold', 'nameplate']

export function acceptMaterialHasData(mat) {
  if (!mat) return false
  if (ACCEPT_MATERIAL_KEYS.some((k) => String(mat[k] || '').trim())) return true
  return ['length', 'width', 'height', 'weight'].some((k) => String(mat[k] || '').trim())
}

function mergeDeliveryRowWithAcceptMaterial(row, mat) {
  return {
    ...row,
    acceptMaterial: mat || null,
    hasAcceptMaterial: acceptMaterialHasData(mat)
  }
}

/**
 * 将「当前项目下已有验收项材料」的基础项写回 projectId / projectCode，与移模、验收列表过滤一致。
 * 仅在 mutateDb 回调内对 db 做原地修改。
 */
export function applyAcceptMaterialsToBaseItemProjectBinding(db, projectId) {
  const pid = Number(projectId)
  if (!Number.isFinite(pid) || pid <= 0) return
  const proj = (db.projects || []).find((p) => Number(p.id) === pid)
  if (!proj) return
  const code = String(proj.code || '').trim()
  const bids = new Set(
    (db.acceptItemMaterials || [])
      .filter((m) => Number(m.projectId) === pid)
      .map((m) => String(m.baseItemId || '').trim())
      .filter(Boolean)
  )
  if (!bids.size) return
  db.baseItems = (db.baseItems || []).map((b) => {
    if (!bids.has(String(b.id))) return b
    return { ...b, projectId: pid, ...(code ? { projectCode: code } : {}) }
  })
}

/** 与移模项目下拉一致：验收项录入及之前节点均已完成（completedUpToIndex ≥ 3） */
function moveApplyProgressOkForProject(p) {
  const n = Number(p?.completedUpToIndex ?? 0)
  return Number.isFinite(n) && n >= 3
}

/**
 * 当「当前项目」尚未有任何验收项材料记录时，把「已验收完成」但项目归属无效/陈旧的基础项归到当前项目（仅本地 mock）。
 * 注意：须按项目判断——若用全库 mats.length 判断，任一项目写过材料都会导致其他项目永远无法归并，移模零件下拉为空。
 * 不覆盖：基础项已明确挂在「另一已满足移模门槛的项目」编码或 id 上。
 */
export function reassignLooseAcceptedBaseItemsToProjectWhenNoMaterials(db, projectId) {
  const pid = Number(projectId)
  if (!Number.isFinite(pid) || pid <= 0) return
  const mats = db.acceptItemMaterials || []
  const matsForThisProject = mats.filter((x) => Number(x.projectId) === pid)
  if (matsForThisProject.length > 0) return
  const proj = (db.projects || []).find((p) => Number(p.id) === pid)
  if (!proj) return
  const code = String(proj.code || '').trim()
  const codeNorm = normProjectCode(code)
  const knownCodes = new Set((db.projects || []).map((p) => normProjectCode(p.code)).filter(Boolean))
  const validIds = new Set(
    (db.projects || [])
      .map((p) => Number(p.id))
      .filter((n) => Number.isFinite(n) && n > 0)
  )

  db.baseItems = (db.baseItems || []).map((b) => {
    if (!b.acceptanceCompleted) return b
    const pcRaw = String(b.projectCode || '').trim()
    const pcN = normProjectCode(pcRaw)
    const bidPid = b.projectId != null ? Number(b.projectId) : NaN
    if (Number.isFinite(bidPid) && bidPid === pid) return { ...b, ...(code ? { projectCode: code } : {}) }
    if (pcN && pcN === codeNorm) return { ...b, projectId: pid }
    if (Number.isFinite(bidPid) && validIds.has(bidPid) && bidPid !== pid) return b
    if (pcN && knownCodes.has(pcN) && pcN !== codeNorm) {
      const owning = (db.projects || []).find((p) => normProjectCode(p.code) === pcN)
      if (owning && moveApplyProgressOkForProject(owning)) return b
      return { ...b, projectId: pid, ...(code ? { projectCode: code } : {}) }
    }
    return { ...b, projectId: pid, ...(code ? { projectCode: code } : {}) }
  })
}

/** 供移模拉零件前执行：先按材料写回，再在「无材料表」时收紧孤儿基础项归属 */
export function repairMoveApplyBaseProjectBinding(projectId) {
  const pid = Number(projectId)
  if (!Number.isFinite(pid) || pid <= 0) return
  mutateDb((db) => {
    applyAcceptMaterialsToBaseItemProjectBinding(db, pid)
    reassignLooseAcceptedBaseItemsToProjectWhenNoMaterials(db, pid)
    return db
  })
}

/**
 * 验收项录入列表：行集合与「交付追踪」相同（getDeliveryItems / baseItems，受查询条件影响）；
 * 上传附件与尺寸仍按当前验收项目 projectId + baseItemId 单独存储与合并。
 */
export async function getAcceptItemTableRows(projectId, filters = {}) {
  const pid = Number(projectId)
  if (!Number.isFinite(pid) || pid <= 0) {
    return { list: [], total: 0 }
  }
  /** 本地：若已有验收材料，把对应基础项 projectId/代号写回，避免导入或编辑基础项后归属丢失 */
  if (!hasSupabaseEnv || !supabase) {
    const pre = loadDb()
    const hasMats = (pre.acceptItemMaterials || []).some((x) => Number(x.projectId) === pid)
    if (hasMats) {
      mutateDb((db) => {
        applyAcceptMaterialsToBaseItemProjectBinding(db, pid)
        return db
      })
    }
  }
  try {
    const { list: deliveryList } = await getDeliveryItems(filters)
    const mats = await getAcceptItemMaterialsForProject(pid)
    const list = deliveryList.map((row) => {
      const mat = mats.find((x) => Number(x.projectId) === pid && String(x.baseItemId) === String(row.id)) || null
      return mergeDeliveryRowWithAcceptMaterial(row, mat)
    })
    return { list, total: list.length }
  } catch (error) {
    return withErrorScope('getAcceptItemTableRows', error)
  }
}

export async function upsertAcceptItemMaterial({ projectId, baseItemId, payload = {} }) {
  const pid = Number(projectId)
  const bid = String(baseItemId ?? '').trim()
  if (!Number.isFinite(pid) || pid <= 0 || !bid) {
    return withErrorScope('upsertAcceptItemMaterial', new Error('projectId and baseItemId required'))
  }
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      if (!Array.isArray(db.acceptItemMaterials)) db.acceptItemMaterials = []
      const list = db.acceptItemMaterials
      const i = list.findIndex((x) => Number(x.projectId) === pid && String(x.baseItemId) === bid)
      const body = {
        id: i >= 0 ? list[i].id : nextId(list),
        projectId: pid,
        baseItemId: bid,
        acceptReport: payload.acceptReport != null ? String(payload.acceptReport) : '',
        materialCert: payload.materialCert != null ? String(payload.materialCert) : '',
        upperMold: payload.upperMold != null ? String(payload.upperMold) : '',
        lowerMold: payload.lowerMold != null ? String(payload.lowerMold) : '',
        overallMold: payload.overallMold != null ? String(payload.overallMold) : '',
        nameplate: payload.nameplate != null ? String(payload.nameplate) : '',
        length: payload.length != null ? String(payload.length) : '',
        width: payload.width != null ? String(payload.width) : '',
        height: payload.height != null ? String(payload.height) : '',
        weight: payload.weight != null ? String(payload.weight) : '',
        updatedAt: nowDateText()
      }
      if (i >= 0) list[i] = body
      else list.push(body)
      saved = body
      applyAcceptMaterialsToBaseItemProjectBinding(db, pid)
      return db
    })
    return saved
  }
  try {
    const row = {
      project_id: pid,
      base_item_id: bid,
      accept_report: payload.acceptReport != null ? String(payload.acceptReport) : '',
      material_cert: payload.materialCert != null ? String(payload.materialCert) : '',
      upper_mold: payload.upperMold != null ? String(payload.upperMold) : '',
      lower_mold: payload.lowerMold != null ? String(payload.lowerMold) : '',
      overall_mold: payload.overallMold != null ? String(payload.overallMold) : '',
      nameplate: payload.nameplate != null ? String(payload.nameplate) : '',
      length: payload.length != null ? String(payload.length) : '',
      width: payload.width != null ? String(payload.width) : '',
      height: payload.height != null ? String(payload.height) : '',
      weight: payload.weight != null ? String(payload.weight) : '',
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from(ACCEPT_ITEM_MATERIALS_TABLE)
      .upsert(row, { onConflict: 'project_id,base_item_id' })
      .select('*')
      .single()
    if (error) throw error
    await syncBaseItemProjectAfterAcceptMaterialSupabase(pid, bid)
    return mapAcceptMaterialFromDb(data)
  } catch (error) {
    return withErrorScope('upsertAcceptItemMaterial', error)
  }
}

/** 删除当前项目下所选基础行对应的验收材料记录（不删 baseItems） */
export async function deleteAcceptItemMaterials(projectId, baseItemIds = []) {
  const pid = Number(projectId)
  const idSet = new Set((baseItemIds || []).map((x) => String(x)))
  if (!idSet.size || !Number.isFinite(pid) || pid <= 0) return
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.acceptItemMaterials = (db.acceptItemMaterials || []).filter(
        (x) => !(Number(x.projectId) === pid && idSet.has(String(x.baseItemId)))
      )
      return db
    })
    return
  }
  try {
    const ids = [...idSet]
    const { error } = await supabase
      .from(ACCEPT_ITEM_MATERIALS_TABLE)
      .delete()
      .eq('project_id', pid)
      .in('base_item_id', ids)
    if (error) throw error
  } catch (error) {
    return withErrorScope('deleteAcceptItemMaterials', error)
  }
}

export async function deleteDeliveryItems(ids = []) {
  if (!ids.length) return
  try {
    await batchDeleteBaseItems(ids)
  } catch (error) {
    return withErrorScope('deleteDeliveryItems', error)
  }
}

export async function createDeliveryItem(payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      saved = { id: nextId(db.deliveryItems || []), ...payload }
      db.deliveryItems = [saved, ...(db.deliveryItems || [])]
      return db
    })
    return saved
  }
  try {
    const { data, error } = await supabase.from('delivery_items').insert([mapDeliveryToDb(payload)]).select('*').single()
    if (error) throw error
    return mapDeliveryFromDb(data)
  } catch (error) {
    return withErrorScope('createDeliveryItem', error)
  }
}

/**
 * 批量移模：更新 baseItems.toolUsageLocation，并写入 toolMoveHistory（mock）
 */
export function batchApplyDeliveryToolLocations(ids = [], address = {}) {
  if (!ids.length) return
  const line = composeAddressLine({
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail
  })
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      const idSet = new Set((ids || []).map((x) => String(x)))
      const entries = []
      db.baseItems = (db.baseItems || []).map((b) => {
        if (!idSet.has(String(b.id))) return b
        const fromLocation = b.toolUsageLocation || ''
        entries.push({
          partNo: b.partNo,
          fromLocation,
          toLocation: line,
          baseItemId: b.id
        })
        return { ...b, toolUsageLocation: line }
      })
      pushToolMoveEntriesOnDb(db, entries)
      return db
    })
  }
}

export async function getAcceptItems(filters = {}) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    const list = [...(db.acceptItems || [])]
    return { list, total: list.length }
  }
  try {
    let query = supabase.from('accept_items').select('*', { count: 'exact' }).order('id', { ascending: false })
    if (filters.partName) query = query.ilike('part_name', `%${filters.partName}%`)
    if (filters.partNo) query = query.ilike('part_no', `%${filters.partNo}%`)
    const { data, count, error } = await query
    if (error) throw error
    return { list: (data || []).map(mapAcceptFromDb), total: count || 0 }
  } catch (error) {
    return withErrorScope('getAcceptItems', error)
  }
}

export async function createAcceptItem(payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      saved = { id: nextId(db.acceptItems || []), ...payload }
      db.acceptItems = [saved, ...(db.acceptItems || [])]
      return db
    })
    return saved
  }
  try {
    const { data, error } = await supabase.from('accept_items').insert([mapAcceptToDb(payload)]).select('*').single()
    if (error) throw error
    return mapAcceptFromDb(data)
  } catch (error) {
    return withErrorScope('createAcceptItem', error)
  }
}

/** Excel 导入：整体替换验收项列表 */
export async function replaceAcceptItems(rows = []) {
  const list = (rows || []).map((r) => ({
    partName: (r && r.partName) || '',
    partNo: (r && r.partNo) || '',
    childName: (r && r.childName) || '',
    childNo: (r && r.childNo) || '',
    toolName: (r && r.toolName) || '',
    toolType: (r && r.toolType) || '',
    realToolNo: (r && r.realToolNo) || '',
    supplier: (r && r.supplier) || '',
    length: '',
    width: '',
    height: '',
    weight: ''
  }))

  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.acceptItems = list.map((item, i) => ({ id: i + 1, ...item }))
      return db
    })
    return
  }
  try {
    const { data: existing, error: selErr } = await supabase.from('accept_items').select('id')
    if (selErr) throw selErr
    const ids = (existing || []).map((x) => x.id)
    if (ids.length) {
      const { error: delErr } = await supabase.from('accept_items').delete().in('id', ids)
      if (delErr) throw delErr
    }
    if (list.length) {
      const { error: insErr } = await supabase.from('accept_items').insert(list.map(mapAcceptToDb))
      if (insErr) throw insErr
    }
  } catch (error) {
    return withErrorScope('replaceAcceptItems', error)
  }
}

export async function updateAcceptItem(id, payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      db.acceptItems = (db.acceptItems || []).map((item) => {
        if (item.id !== id) return item
        saved = { ...item, ...payload, id }
        return saved
      })
      return db
    })
    return saved || { id, ...payload }
  }
  try {
    const { data, error } = await supabase.from('accept_items').update(mapAcceptToDb(payload)).eq('id', id).select('*').single()
    if (error) throw error
    return mapAcceptFromDb(data)
  } catch (error) {
    return withErrorScope('updateAcceptItem', error)
  }
}

export async function deleteAcceptItems(ids = []) {
  if (!ids.length) return
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.acceptItems = (db.acceptItems || []).filter((item) => !ids.includes(item.id))
      return db
    })
    return
  }
  try {
    const { error } = await supabase.from('accept_items').delete().in('id', ids)
    if (error) throw error
  } catch (error) {
    return withErrorScope('deleteAcceptItems', error)
  }
}

export async function fetchTemplateList(params = {}) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    let list = [...(db.templates || [])]
    if (params.creator) list = list.filter((item) => String(item.creator || '').includes(params.creator))
    return { list, total: list.length }
  }
  try {
    let query = supabase.from('templates').select('*', { count: 'exact' }).order('id', { ascending: false })
    if (params.creator) query = query.ilike('creator', `%${params.creator}%`)
    const { data, count, error } = await query
    if (error) throw error
    return { list: (data || []).map(mapTemplateFromDb), total: count || 0 }
  } catch (error) {
    return withErrorScope('fetchTemplateList', error)
  }
}

export async function saveTemplateData(payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      if (payload.id) {
        db.templates = (db.templates || []).map((item) => {
          if (item.id !== payload.id) return item
          saved = { ...item, ...payload }
          return saved
        })
      } else {
        saved = {
          id: nextId(db.templates || []),
          name: payload.name,
          creator: payload.creator || '当前用户',
          createdAt: payload.createdAt || new Date().toISOString().slice(0, 10),
          items: payload.items || []
        }
        db.templates = [saved, ...(db.templates || [])]
      }
      return db
    })
    return saved
  }
  try {
    const body = {
      name: payload.name,
      creator: payload.creator || '当前用户',
      created_at: payload.createdAt || new Date().toISOString().slice(0, 10),
      items: payload.items || []
    }
    if (payload.id) {
      const { data, error } = await supabase.from('templates').update(body).eq('id', payload.id).select('*').single()
      if (error) throw error
      return mapTemplateFromDb(data)
    }
    const { data, error } = await supabase.from('templates').insert([body]).select('*').single()
    if (error) throw error
    return mapTemplateFromDb(data)
  } catch (error) {
    return withErrorScope('saveTemplateData', error)
  }
}

export async function removeTemplate(id) {
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.templates = (db.templates || []).filter((item) => item.id !== id)
      return db
    })
    return
  }
  try {
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    return withErrorScope('removeTemplate', error)
  }
}

export async function getProjects() {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    const list = [...(db.projects || [])]
    return { list, total: list.length }
  }
  try {
    const { data, count, error } = await supabase.from('projects').select('*', { count: 'exact' }).order('id', { ascending: false })
    if (error) throw error
    return { list: (data || []).map(mapProjectFromDb), total: count || 0 }
  } catch (error) {
    return withErrorScope('getProjects', error)
  }
}

export async function createProject(payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      saved = {
        id: nextId(db.projects || []),
        code: payload.code || '',
        owner: payload.owner || '',
        updatedAt: nowDateText(),
        progressIndex: payload.progressIndex || 0,
        completedUpToIndex: Number.isFinite(payload.completedUpToIndex) ? payload.completedUpToIndex : 0,
        stages: payload.stages || []
      }
      db.projects = [saved, ...(db.projects || [])]
      return db
    })
    return saved
  }
  try {
    const { data, error } = await supabase.from('projects').insert([{
      code: payload.code || '',
      owner: payload.owner || '',
      updated_at: nowDateText(),
      progress_index: payload.progressIndex || 0,
      completed_up_to_index: Number.isFinite(payload.completedUpToIndex) ? payload.completedUpToIndex : 0,
      stages: payload.stages || []
    }]).select('*').single()
    if (error) throw error
    return mapProjectFromDb(data)
  } catch (error) {
    return withErrorScope('createProject', error)
  }
}

export async function updateProject(payload) {
  const id = payload?.id
  if (id == null) {
    const err = new Error('updateProject: id required')
    return withErrorScope('updateProject', err)
  }
  if (!hasSupabaseEnv || !supabase) {
    let updated = null
    mutateDb((db) => {
      const list = [...(db.projects || [])]
      const idx = list.findIndex((p) => Number(p.id) === Number(id))
      if (idx === -1) return db
      const prev = list[idx]
      updated = {
        ...prev,
        code: payload.code != null ? payload.code : prev.code,
        owner: payload.owner != null ? payload.owner : prev.owner,
        updatedAt: nowDateText(),
        progressIndex: payload.progressIndex != null ? payload.progressIndex : prev.progressIndex ?? 0,
        completedUpToIndex: payload.completedUpToIndex != null ? payload.completedUpToIndex : prev.completedUpToIndex ?? 0,
        stages: Array.isArray(payload.stages) ? payload.stages : prev.stages || []
      }
      list[idx] = updated
      db.projects = list
      return db
    })
    if (!updated) {
      return withErrorScope('updateProject', new Error('project not found'))
    }
    return updated
  }
  try {
    const { data, error } = await supabase.from('projects').update({
      code: payload.code || '',
      owner: payload.owner || '',
      updated_at: nowDateText(),
      progress_index: payload.progressIndex ?? 0,
      stages: payload.stages || []
    }).eq('id', id).select('*').single()
    if (error) throw error
    return mapProjectFromDb(data)
  } catch (error) {
    return withErrorScope('updateProject', error)
  }
}

export async function deleteProject(id) {
  if (id == null) {
    const err = new Error('deleteProject: id required')
    return withErrorScope('deleteProject', err)
  }
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.projects = (db.projects || []).filter((p) => Number(p.id) !== Number(id))
      return db
    })
    return { ok: true }
  }
  try {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    return { ok: true }
  } catch (error) {
    return withErrorScope('deleteProject', error)
  }
}

