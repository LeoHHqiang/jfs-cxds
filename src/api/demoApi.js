import { hasSupabaseEnv, supabase } from '@/lib/supabase'

function withErrorScope(scope, error) {
  console.error(`[demoApi:${scope}]`, error)
  throw error
}

function nowDateText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

const fallbackDeliveryRows = [
  { id: 1, partName: '副驾驶座椅总成', partNo: '6608347607', childName: '副驾驶安全带盖板1', childNo: '6608347607', toolName: '副驾驶安全带盖板具A1', toolType: '工装分类', realToolNo: 'GDZR201511026183', supplier: '维诗恩塑胶有限公司' },
  { id: 2, partName: '副驾驶座椅总成', partNo: '6608347608', childName: '副驾驶安全带盖板2', childNo: '6608347608', toolName: '副驾驶安全带盖板具A2', toolType: '工装分类', realToolNo: 'GDZR201511026184', supplier: '鸿瑞兴模具有限公司' }
]

const fallbackAcceptRows = [
  { id: 1, partName: '副驾驶座椅总成', partNo: '6608347607', childName: '副驾驶安全带盖板', childNo: '6608347607', toolName: '副驾驶安全带盖板检具A1', toolType: '其他模具', realToolNo: 'GZDR202508013085', supplier: '维诗恩塑胶有限公司' },
  { id: 2, partName: '仪表盘总成', partNo: '7709123001', childName: '中控饰板', childNo: '7709123001', toolName: '中控饰板检具B1', toolType: '注塑模具', realToolNo: 'REAL202500001', supplier: '鸿瑞兴模具有限公司' }
]

const fallbackTemplates = [
  { id: 1, name: '吉利1', creator: '张三', createdAt: '2025.01.01', items: [] },
  { id: 2, name: '理想1', creator: '李四', createdAt: '2025.01.01', items: [] }
]

const fallbackProjects = [
  { id: 1, code: 'CM2E', owner: '李新宇', updatedAt: '2024-01-12 12:22', progressIndex: 2, stages: [] }
]

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
  if (!hasSupabaseEnv || !supabase) return { list: fallbackDeliveryRows, total: fallbackDeliveryRows.length }
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
  if (!ids.length || !hasSupabaseEnv || !supabase) return
  try {
    const { error } = await supabase.from('delivery_items').delete().in('id', ids)
    if (error) throw error
  } catch (error) {
    return withErrorScope('deleteDeliveryItems', error)
  }
}

export async function createDeliveryItem(payload) {
  if (!hasSupabaseEnv || !supabase) return { id: Date.now(), ...payload }
  try {
    const { data, error } = await supabase.from('delivery_items').insert([mapDeliveryToDb(payload)]).select('*').single()
    if (error) throw error
    return mapDeliveryFromDb(data)
  } catch (error) {
    return withErrorScope('createDeliveryItem', error)
  }
}

export async function getAcceptItems(filters = {}) {
  if (!hasSupabaseEnv || !supabase) return { list: fallbackAcceptRows, total: fallbackAcceptRows.length }
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
  if (!hasSupabaseEnv || !supabase) return { id: Date.now(), ...payload }
  try {
    const { data, error } = await supabase.from('accept_items').insert([mapAcceptToDb(payload)]).select('*').single()
    if (error) throw error
    return mapAcceptFromDb(data)
  } catch (error) {
    return withErrorScope('createAcceptItem', error)
  }
}

export async function updateAcceptItem(id, payload) {
  if (!hasSupabaseEnv || !supabase) return { id, ...payload }
  try {
    const { data, error } = await supabase.from('accept_items').update(mapAcceptToDb(payload)).eq('id', id).select('*').single()
    if (error) throw error
    return mapAcceptFromDb(data)
  } catch (error) {
    return withErrorScope('updateAcceptItem', error)
  }
}

export async function deleteAcceptItems(ids = []) {
  if (!ids.length || !hasSupabaseEnv || !supabase) return
  try {
    const { error } = await supabase.from('accept_items').delete().in('id', ids)
    if (error) throw error
  } catch (error) {
    return withErrorScope('deleteAcceptItems', error)
  }
}

export async function fetchTemplateList(params = {}) {
  if (!hasSupabaseEnv || !supabase) return { list: fallbackTemplates, total: fallbackTemplates.length }
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
  if (!hasSupabaseEnv || !supabase) return { id: Date.now(), ...payload }
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
  if (!hasSupabaseEnv || !supabase) return
  try {
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    return withErrorScope('removeTemplate', error)
  }
}

export async function getProjects() {
  if (!hasSupabaseEnv || !supabase) return { list: fallbackProjects, total: fallbackProjects.length }
  try {
    const { data, count, error } = await supabase.from('projects').select('*', { count: 'exact' }).order('id', { ascending: false })
    if (error) throw error
    return { list: (data || []).map(mapProjectFromDb), total: count || 0 }
  } catch (error) {
    return withErrorScope('getProjects', error)
  }
}

export async function createProject(payload) {
  if (!hasSupabaseEnv || !supabase) return { id: Date.now(), ...payload }
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

