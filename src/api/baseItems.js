import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { loadDb, mutateDb, nextId } from './mockDb'

const tableName = 'base_items'

function toDto(row) {
  return {
    id: row.id,
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
    purchaser: row.purchaser || ''
  }
}

function toPayload(row) {
  return {
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
    purchaser: row.purchaser || ''
  }
}

export async function getBaseItems(filters = {}) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    const list = [...(db.baseItems || [])]
    return { list, total: list.length }
  }

  let query = supabase.from(tableName).select('*', { count: 'exact' }).order('id', { ascending: false })
  if (filters.partName) query = query.ilike('part_name', `%${filters.partName}%`)
  if (filters.partNo) query = query.ilike('part_no', `%${filters.partNo}%`)
  if (filters.childName) query = query.ilike('child_name', `%${filters.childName}%`)
  if (filters.childNo) query = query.ilike('child_no', `%${filters.childNo}%`)
  if (filters.toolName) query = query.ilike('tool_name', `%${filters.toolName}%`)
  if (filters.toolType) query = query.eq('tool_type', filters.toolType)
  if (filters.supplier) query = query.eq('supplier', filters.supplier)

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

  const { data, error } = await supabase.from(tableName).update(toPayload(payload)).eq('id', id).select('*').single()
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

