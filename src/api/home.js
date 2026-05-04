import { hasSupabaseEnv, supabase } from '@/lib/supabase'
import { getBaseItems } from './baseItems'
import { getProjects } from './demoApi'
import { fetchMoveApplyList } from './moveApply'
import { loadDb } from './mockDb'

export const fetchHomeMeta = async () => {
  const db = loadDb()
  return {
    success: true,
    data: {
      todos: db.homeTodos || [],
      events: db.homeEvents || {}
    }
  }
}

/**
 * 首页统计：仅验收管理（项目 / 基础项 / 历史验收 / 验收项材料）与移模申请。
 * 启用 Supabase 时项目、基础项、移模列表与材料条数走远端；历史验收仍读本地 mock（与写入一致）。
 */
export const fetchHomeStats = async () => {
  const db = loadDb()
  let projectCount = (db.projects || []).length
  let baseCount = (db.baseItems || []).length
  const acceptHistoryCount = (db.acceptHistory || []).length
  let materialCount = (db.acceptItemMaterials || []).length
  let moveList = [...(db.moveApplyList || [])]

  if (hasSupabaseEnv && supabase) {
    try {
      const [{ list: projects }, basesRes, moveRes] = await Promise.all([
        getProjects(),
        getBaseItems({}),
        fetchMoveApplyList({ includeDraft: true, includeRejected: true })
      ])
      projectCount = projects?.length ?? 0
      baseCount = basesRes?.list?.length ?? 0
      moveList = moveRes?.data?.list || []
      const { count: matCount, error: matErr } = await supabase
        .from('accept_item_materials')
        .select('*', { count: 'exact', head: true })
      if (!matErr && matCount != null) materialCount = matCount
    } catch (e) {
      console.warn('[fetchHomeStats]', e?.message || e)
    }
  }

  const pendingMove = moveList.filter((i) => i.status === 'pending').length
  const approvedMove = moveList.filter((i) => i.status === 'approved').length
  const rejectedMove = moveList.filter((i) => i.status === 'rejected').length
  const moveTotal = moveList.length

  const bars = [
    { key: 'projects', label: '验收项目', value: projectCount, color: '#4a90e2' },
    { key: 'base', label: '验收基础项', value: baseCount, color: '#56c271' },
    { key: 'history', label: '历史验收', value: acceptHistoryCount, color: '#8b74ff' },
    { key: 'materials', label: '验收项材料', value: materialCount, color: '#26c6da' },
    { key: 'movePending', label: '移模·待审批', value: pendingMove, color: '#ffbe55' },
    { key: 'moveApproved', label: '移模·已通过', value: approvedMove, color: '#56c271' }
  ]
  if (rejectedMove > 0) {
    bars.push({ key: 'moveRejected', label: '移模·已驳回', value: rejectedMove, color: '#ec5f67' })
  }

  const pie = [
    { key: 'pending', label: '移模·待审批', value: pendingMove, color: '#ffbe55' },
    { key: 'approved', label: '移模·已通过', value: approvedMove, color: '#56c271' }
  ]
  if (rejectedMove > 0) {
    pie.push({ key: 'rejected', label: '移模·已驳回', value: rejectedMove, color: '#ec5f67' })
  }

  return {
    success: true,
    data: {
      cards: [
        { key: 'projects', label: '验收项目', value: projectCount, color: '#4a90e2' },
        { key: 'base', label: '验收基础项', value: baseCount, color: '#56c271' },
        { key: 'history', label: '历史验收', value: acceptHistoryCount, color: '#8b74ff' },
        { key: 'move', label: '移模申请', value: moveTotal, color: '#ff9f43' }
      ],
      bars,
      pie
    }
  }
}
