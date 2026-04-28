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

export const fetchHomeStats = async () => {
  const db = loadDb()
  const deliveryCount = (db.deliveryItems || []).length
  const acceptCount = (db.acceptItems || []).length
  const moveApplyCount = (db.moveApplyList || []).length
  const supplierCount = (db.suppliers || []).length
  const templateCount = (db.templates || []).length
  const baseItemCount = (db.baseItems || []).length
  const pendingMove = (db.moveApplyList || []).filter((item) => item.status === 'pending').length
  const approvedMove = (db.moveApplyList || []).filter((item) => item.status === 'approved').length

  return {
    success: true,
    data: {
      cards: [
        { key: 'accept', label: '验收录入项', value: acceptCount, color: '#4a90e2' },
        { key: 'delivery', label: '交付追踪项', value: deliveryCount, color: '#56c271' },
        { key: 'move', label: '移模审批单', value: moveApplyCount, color: '#8b74ff' },
        { key: 'supplier', label: '供应商总数', value: supplierCount, color: '#ff9f43' }
      ],
      bars: [
        { key: 'accept', label: '验收录入', value: acceptCount, color: '#4a90e2' },
        { key: 'delivery', label: '交付追踪', value: deliveryCount, color: '#56c271' },
        { key: 'move', label: '移模审批', value: moveApplyCount, color: '#8b74ff' },
        { key: 'supplier', label: '供应商', value: supplierCount, color: '#ff9f43' },
        { key: 'template', label: '模板', value: templateCount, color: '#26c6da' },
        { key: 'base', label: '基础项', value: baseItemCount, color: '#ec5f67' }
      ],
      pie: [
        { key: 'pending', label: '待审批移模', value: pendingMove, color: '#ffbe55' },
        { key: 'approved', label: '已审批移模', value: approvedMove, color: '#56c271' },
        { key: 'accept', label: '验收录入项', value: acceptCount, color: '#4a90e2' },
        { key: 'delivery', label: '交付追踪项', value: deliveryCount, color: '#8b74ff' }
      ]
    }
  }
}
