import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { loadDb, mutateDb, nextId } from './mockDb'

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
  return {
    id: row.id,
    code: row.code || '',
    owner: row.owner || '',
    updatedAt: row.updated_at || nowDateText(),
    progressIndex: row.progress_index || 0,
    stages: Array.isArray(row.stages) ? row.stages : []
  }
}

export async function getDeliveryItems(filters = {}) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDb()
    const list = [...(db.deliveryItems || [])]
    return { list, total: list.length }
  }
  try {
    let query = supabase.from('delivery_items').select('*', { count: 'exact' }).order('id', { ascending: false })
    if (filters.partName) query = query.ilike('part_name', `%${filters.partName}%`)
    if (filters.partNo) query = query.ilike('part_no', `%${filters.partNo}%`)
    if (filters.supplier) query = query.eq('supplier', filters.supplier)
    const { data, count, error } = await query
    if (error) throw error
    return { list: (data || []).map(mapDeliveryFromDb), total: count || 0 }
  } catch (error) {
    return withErrorScope('getDeliveryItems', error)
  }
}

export async function deleteDeliveryItems(ids = []) {
  if (!ids.length) return
  if (!hasSupabaseEnv || !supabase) {
    mutateDb((db) => {
      db.deliveryItems = (db.deliveryItems || []).filter((item) => !ids.includes(item.id))
      return db
    })
    return
  }
  try {
    const { error } = await supabase.from('delivery_items').delete().in('id', ids)
    if (error) throw error
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
      stages: payload.stages || []
    }]).select('*').single()
    if (error) throw error
    return mapProjectFromDb(data)
  } catch (error) {
    return withErrorScope('createProject', error)
  }
}

