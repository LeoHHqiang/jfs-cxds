import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { composeAddressLine, parseToolUsageLine } from '@/utils/chinaRegionSelect'
import { loadDb, mutateDb, nextId } from './mockDb'

const tableName = 'base_items'

function toDto(row) {
  const purchaser = row.purchaser || row.purchaser_name || ''
  const owner = row.owner || row.project_owner || purchaser
  return {
    id: row.id,
    projectCode: row.project_code || row.projectCode || '',
    projectId: row.project_id != null ? row.project_id : row.projectId != null ? row.projectId : null,
    partName: row.part_name || '',
    partNo: row.part_no || '',
    childName: row.child_name || '',
    childNo: row.child_no || '',
    toolName: row.tool_name || '',
    toolType: row.tool_type || '',
    vendorToolNo: row.vendor_tool_no || '',
    customerToolNo: row.customer_tool_no || '',
    realToolNo: row.real_tool_no || '',
    supplier: row.supplier || '',
    toolSupplier: row.tool_supplier || '',
    partsFactory: row.parts_factory || '',
    purchaser,
    owner,
    toolUsageLocation: row.tool_usage_location != null ? row.tool_usage_location : row.toolUsageLocation || ''
  }
}

/** 本地 mock：按条件模糊筛选（工装分类为精确匹配） */
function filterBaseItemsLocal(list, filters = {}) {
  const f = filters || {}
  const needle = (v) => (v == null ? '' : String(v).trim().toLowerCase())
  const normCode = (s) => needle(s)
  const includes = (field, key) => {
    const n = needle(f[key])
    if (!n) return true
    return needle(field).includes(n)
  }
  return list.filter((item) => {
    if (f.id != null && String(f.id).trim() !== '') {
      if (String(item.id) !== String(f.id).trim()) return false
    }
    if (f.projectCode != null && String(f.projectCode).trim() !== '') {
      if (normCode(item.projectCode) !== normCode(f.projectCode)) return false
    }
    if (f.search && String(f.search).trim()) {
      const q = needle(f.search)
      const hay = needle(
        `${item.partNo} ${item.partName} ${item.toolName} ${item.childNo} ${item.childName} ${item.vendorToolNo || ''}`
      )
      if (!hay.includes(q)) return false
    } else {
      if (!includes(item.partName, 'partName')) return false
      if (!includes(item.partNo, 'partNo')) return false
      if (!includes(item.childName, 'childName')) return false
      if (!includes(item.childNo, 'childNo')) return false
      if (!includes(item.toolName, 'toolName')) return false
    }
    if (f.toolType && String(f.toolType).trim() && String(item.toolType || '') !== String(f.toolType).trim()) return false
    if (!includes(item.vendorToolNo, 'vendorToolNo')) return false
    if (!includes(item.realToolNo, 'realToolNo')) return false
    if (!includes(item.supplier, 'supplier')) return false
    if (!includes(item.toolSupplier, 'toolSupplier')) return false
    if (!includes(item.partsFactory, 'partsFactory')) return false
    if (!includes(item.customerToolNo, 'customerToolNo')) return false
    if (!includes(item.toolUsageLocation, 'toolUsageLocation')) return false
    if (f.purchaser && String(f.purchaser).trim()) {
      const n = needle(f.purchaser)
      const hay = `${item.owner || ''} ${item.purchaser || ''}`.toLowerCase()
      if (!hay.includes(n)) return false
    }
    return true
  })
}

function toPayload(row) {
  const purchaser = row.purchaser || row.owner || ''
  const out = {
    part_name: row.partName || '',
    part_no: row.partNo || '',
    child_name: row.childName || '',
    child_no: row.childNo || '',
    tool_name: row.toolName || '',
    tool_type: row.toolType || '',
    vendor_tool_no: row.vendorToolNo || '',
    customer_tool_no: row.customerToolNo || '',
    real_tool_no: row.realToolNo || '',
    supplier: row.supplier || '',
    tool_supplier: row.toolSupplier || '',
    parts_factory: row.partsFactory || '',
    purchaser,
    tool_usage_location: row.toolUsageLocation != null ? String(row.toolUsageLocation) : ''
  }
  if (row.projectCode != null && String(row.projectCode).trim() !== '') {
    out.project_code = String(row.projectCode).trim()
  }
  if (row.projectId != null && row.projectId !== '') {
    const pid = Number(row.projectId)
    if (Number.isFinite(pid)) out.project_id = pid
  }
  return out
}

export async function getBaseItems(filters = {}) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    const raw = [...(db.baseItems || [])]
    const list = filterBaseItemsLocal(raw, filters)
    return { list, total: list.length }
  }

  let query = supabase.from(tableName).select('*', { count: 'exact' }).order('id', { ascending: false })
  if (filters.id != null && String(filters.id).trim() !== '') {
    const nid = Number(filters.id)
    if (Number.isFinite(nid)) query = query.eq('id', nid)
  }
  if (filters.projectCode && String(filters.projectCode).trim()) {
    query = query.eq('project_code', String(filters.projectCode).trim())
  }
  if (filters.search && String(filters.search).trim()) {
    const raw = String(filters.search).trim().replace(/%/g, '\\%').replace(/,/g, '')
    const pat = `%${raw}%`
    query = query.or(`part_no.ilike.${pat},part_name.ilike.${pat},tool_name.ilike.${pat}`)
  }
  if (filters.partName) query = query.ilike('part_name', `%${filters.partName}%`)
  if (filters.partNo) query = query.ilike('part_no', `%${filters.partNo}%`)
  if (filters.childName) query = query.ilike('child_name', `%${filters.childName}%`)
  if (filters.childNo) query = query.ilike('child_no', `%${filters.childNo}%`)
  if (filters.toolName) query = query.ilike('tool_name', `%${filters.toolName}%`)
  if (filters.toolType) query = query.eq('tool_type', filters.toolType)
  if (filters.vendorToolNo) query = query.ilike('vendor_tool_no', `%${filters.vendorToolNo}%`)
  if (filters.realToolNo) query = query.ilike('real_tool_no', `%${filters.realToolNo}%`)
  if (filters.supplier) query = query.ilike('supplier', `%${filters.supplier}%`)
  if (filters.toolSupplier) query = query.ilike('tool_supplier', `%${filters.toolSupplier}%`)
  if (filters.partsFactory) query = query.ilike('parts_factory', `%${filters.partsFactory}%`)
  if (filters.customerToolNo) query = query.ilike('customer_tool_no', `%${filters.customerToolNo}%`)
  if (filters.toolUsageLocation) query = query.ilike('tool_usage_location', `%${filters.toolUsageLocation}%`)
  if (filters.purchaser) query = query.ilike('purchaser', `%${filters.purchaser}%`)

  const { data, count, error } = await query
  if (error) throw error
  return { list: (data || []).map(toDto), total: count || 0 }
}

export async function createBaseItem(payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      saved = { id: nextId(db.baseItems || []), ...payload }
      db.baseItems = [saved, ...(db.baseItems || [])]
      return db
    })
    return saved
  }

  const { data, error } = await supabase.from(tableName).insert([toPayload(payload)]).select('*').single()
  if (error) throw error
  return toDto(data)
}

export async function updateBaseItem(id, payload) {
  if (!hasSupabaseEnv || !supabase) {
    let saved = null
    mutateDb((db) => {
      db.baseItems = (db.baseItems || []).map((item) => {
        if (item.id !== id) return item
        saved = { ...item, ...payload, id }
        return saved
      })
      return db
    })
    return saved || { id, ...payload }
  }

  const { data: prevRow, error: selErr } = await supabase.from(tableName).select('*').eq('id', id).single()
  if (selErr) throw selErr
  const merged = { ...toDto(prevRow), ...payload, id }
  const { data, error } = await supabase.from(tableName).update(toPayload(merged)).eq('id', id).select('*').single()
  if (error) throw error
  return toDto(data)
}

export async function deleteBaseItem(id) {
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.baseItems = (db.baseItems || []).filter((item) => item.id !== id)
      return db
    })
    return
  }
  const { error } = await supabase.from(tableName).delete().eq('id', id)
  if (error) throw error
}

export async function batchDeleteBaseItems(ids = []) {
  if (!ids.length) return
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.baseItems = (db.baseItems || []).filter((item) => !ids.includes(item.id))
      return db
    })
    return
  }
  const { error } = await supabase.from(tableName).delete().in('id', ids)
  if (error) throw error
}

function trimExcel(v) {
  return v == null || v === '' ? '' : String(v).trim()
}

/** 单格整行地址：支持无空格或省/市/区间带空格；入库为与页面一致的紧凑串 */
function toolUsageLocationFromExcelRow(r) {
  const whole = trimExcel(r?.toolUsageLocation)
  if (!whole) return ''
  return composeAddressLine(parseToolUsageLine(whole))
}

/** 用 Excel 导入结果整体替换库中基础项列表（与页面「导入覆盖」一致） */
export async function replaceBaseItems(rows = []) {
  const list = (rows || []).map((r) => excelRowToBasePayload(r))

  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.baseItems = list.map((item, i) => ({ id: i + 1, ...item }))
      return db
    })
    return
  }

  const { data: existing, error: selErr } = await supabase.from(tableName).select('id')
  if (selErr) throw selErr
  const ids = (existing || []).map((x) => x.id)
  if (ids.length) {
    const { error: delErr } = await supabase.from(tableName).delete().in('id', ids)
    if (delErr) throw delErr
  }
  if (list.length) {
    const { error: insErr } = await supabase.from(tableName).insert(list.map(toPayload))
    if (insErr) throw insErr
  }
}

/** 已存在行：仅把 Excel 中非空字段写入补丁（空单元格不覆盖库内原值）；不含 partNo */
function mergePatchFromImportPayload(payload) {
  const keys = [
    'partName',
    'childName',
    'childNo',
    'toolName',
    'toolType',
    'vendorToolNo',
    'customerToolNo',
    'realToolNo',
    'supplier',
    'toolSupplier',
    'partsFactory',
    'owner',
    'purchaser',
    'toolUsageLocation'
  ]
  const patch = {}
  for (const k of keys) {
    const v = payload[k]
    if (v == null || String(v).trim() === '') continue
    patch[k] = typeof v === 'string' ? v.trim() : v
  }
  return patch
}

function excelRowToBasePayload(r) {
  const owner = (r && (r.owner || r.purchaser)) || ''
  return {
    partName: (r && r.partName) || '',
    partNo: (r && r.partNo) || '',
    childName: (r && r.childName) || '',
    childNo: (r && r.childNo) || '',
    toolName: (r && r.toolName) || '',
    toolType: (r && r.toolType) || '',
    vendorToolNo: (r && r.vendorToolNo) || '',
    customerToolNo: (r && r.customerToolNo) || '',
    realToolNo: (r && r.realToolNo) || '',
    supplier: (r && r.supplier) || '',
    toolSupplier: (r && r.toolSupplier) || '',
    partsFactory: (r && r.partsFactory) || '',
    purchaser: (r && r.purchaser) || owner,
    owner,
    toolUsageLocation: toolUsageLocationFromExcelRow(r)
  }
}

/**
 * 按「零件编号 partNo」合并导入：
 * - 新零件号：整行新增；
 * - 已存在：仅对 Excel 中非空列打补丁（供应商、工装使用地等均可改）；全空则跳过，空单元格不会清空库内原值。
 */
export async function importBaseItemsByNewPartNoOnly(rows = []) {
  const list = rows || []
  if (!hasSupabaseEnv || !supabase) {
    const snap = loadDb()
    const idByPartNo = new Map()
    const existing = new Set()
    for (const b of snap.baseItems || []) {
      const pn = String(b.partNo || '').trim()
      if (!pn) continue
      existing.add(pn)
      idByPartNo.set(pn, b.id)
    }
    let added = 0
    let updated = 0
    let skipped = 0
    for (const r of list) {
      const payload = excelRowToBasePayload(r)
      const pn = String(payload.partNo || '').trim()
      if (!pn) {
        skipped++
        continue
      }
      if (existing.has(pn)) {
        const patch = mergePatchFromImportPayload(payload)
        if (Object.keys(patch).length === 0) {
          skipped++
          continue
        }
        const id = idByPartNo.get(pn)
        if (id != null) {
          await updateBaseItem(id, patch)
          updated++
        } else {
          skipped++
        }
        continue
      }
      const saved = await createBaseItem(payload)
      existing.add(pn)
      if (saved?.id != null) idByPartNo.set(pn, saved.id)
      added++
    }
    return { added, updated, skipped }
  }

  const { data: existingRows, error: selErr } = await supabase.from(tableName).select('id, part_no')
  if (selErr) throw selErr
  const existing = new Set()
  const idByPartNo = new Map()
  for (const row of existingRows || []) {
    const pn = String(row.part_no || '').trim()
    if (!pn) continue
    existing.add(pn)
    idByPartNo.set(pn, row.id)
  }
  let added = 0
  let updated = 0
  let skipped = 0
  for (const r of list) {
    const payload = excelRowToBasePayload(r)
    const pn = String(payload.partNo || '').trim()
    if (!pn) {
      skipped++
      continue
    }
    if (existing.has(pn)) {
      const patch = mergePatchFromImportPayload(payload)
      if (Object.keys(patch).length === 0) {
        skipped++
        continue
      }
      const id = idByPartNo.get(pn)
      if (id != null) {
        await updateBaseItem(id, patch)
        updated++
      } else {
        skipped++
      }
      continue
    }
    const saved = await createBaseItem(payload)
    existing.add(pn)
    if (saved?.id != null) idByPartNo.set(pn, saved.id)
    added++
  }
  return { added, updated, skipped }
}

