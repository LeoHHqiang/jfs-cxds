const DB_KEY = 'mold_system_mock_db_v1'

const defaultDb = {
  users: [
    {
      id: 1,
      account: 'admin01',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      profile: {
        displayName: '管理员',
        employeeId: '100001',
        department: '系统管理部',
        phone: '',
        email: ''
      },
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifyByEmail: true,
        permissions: {}
      }
    },
    {
      id: 2,
      account: 'user01',
      password: 'user123',
      role: 'user',
      status: 'active',
      profile: {
        displayName: '普通用户',
        employeeId: '100002',
        department: '研发中心',
        phone: '',
        email: ''
      },
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifyByEmail: false,
        permissions: {}
      }
    },
    {
      id: 3,
      account: 'approver01',
      password: 'approve123',
      role: 'approver',
      status: 'active',
      profile: {
        displayName: '审批用户',
        employeeId: '100003',
        department: '质量部',
        phone: '',
        email: ''
      },
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifyByEmail: false,
        permissions: { moveApproval: true }
      }
    }
  ],
  records: [
    {
      id: 'r1',
      time: '2026-04-28 09:20:00',
      account: 'admin01',
      userName: '管理员',
      role: 'admin',
      type: 'create',
      project: 'CM2E',
      node: '',
      description: '创建验收项目 CM2E'
    },
    {
      id: 'r2',
      time: '2026-04-27 16:45:00',
      account: 'admin01',
      userName: '管理员',
      role: 'admin',
      type: 'update',
      project: 'BWM',
      node: '',
      description: '更新项目进度节点'
    }
  ],
  /** 仅由「验收管理 → 模具交付建档」提交后写入，见 submitMoldArchiveDeliveryComplete */
  acceptHistory: [],
  moveApproveStats: { pending: 0, approved: 0 },
  moveApproveSeries: [
    [5, 6, 7, 6, 8, 9, 10, 9, 11, 13, 12, 14],
    [3, 3, 4, 5, 5, 6, 7, 6, 8, 8, 9, 10]
  ],
  moveApplyList: [],
  suppliers: [
    { id: 1, name: '宁海良诚模具有限公司', contact: '王工', phone: '13800000001', level: 'A', status: '合作中' },
    { id: 2, name: '宁波宝贝电子有限公司', contact: '赵工', phone: '13800000002', level: 'B', status: '合作中' }
  ],
  templates: [
    { id: 1, name: '吉利1', creator: '张三', createdAt: '2026-01-01', items: [] },
    { id: 2, name: '理想1', creator: '李四', createdAt: '2026-01-02', items: [] }
  ],
  projects: [
    {
      id: 1,
      code: 'PRJ-DEMO1',
      owner: '演示负责人',
      updatedAt: '2026-01-01',
      progressIndex: 0,
      completedUpToIndex: 0,
      stages: []
    }
  ],
  homeTodos: [
    { title: '资料上传', project: 'BWM', owner: '李新宇', theme: 'pink' },
    { title: '信息导入', project: 'CM2E', owner: '李新宇', theme: 'green' }
  ],
  homeEvents: {
    '2026-04-10': [{ type: 'meeting', title: '团队会议', time: '10:00' }],
    '2026-04-15': [{ type: 'review', title: '代码审查', time: '14:00' }]
  },
  baseItems: [
    {
      id: 101,
      partName: '副驾驶座椅总成',
      partNo: '6608347607',
      toolName: '副驾驶安全带盖板检具A1',
      toolType: '注塑模具',
      supplier: '宁海良诚模具有限公司',
      toolUsageLocation: '浙江省宁波市海曙区信宁路113号',
      acceptanceCompleted: true,
      projectCode: 'PRJ-DEMO1'
    },
    {
      id: 102,
      partName: '中控饰板总成',
      partNo: '6608347608',
      toolName: '中控饰板检具B2',
      toolType: '其他模具',
      supplier: '峰诗恩电子有限公司',
      toolUsageLocation: '浙江省宁波市江北区和平路100号',
      acceptanceCompleted: true,
      projectCode: 'PRJ-DEMO1'
    }
  ],
  /** 已废弃：工装使用地已并入 baseItems.toolUsageLocation；保留键仅作读库迁移 */
  deliveryToolLocations: {},
  /** 按零件号记录的工装使用地变更（移模）历史，不因基础项 Excel 合并导入而删除 */
  toolMoveHistory: [],
  deliveryItems: [],
  acceptItems: [],
  /** 验收项材料：按 projectId + baseItemId 隔离，与基础项/交付追踪数据联通 */
  acceptItemMaterials: []
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function mergeDefaults(db) {
  const users = (db?.users || defaultDb.users).map((user) => {
    const role = user.role || (user.account === 'admin01' ? 'admin' : 'user')
    const explicitMove = user.settings?.permissions?.moveApproval
    const moveApprovalDefault = role === 'approver'
    const moveApproval =
      explicitMove === true || explicitMove === false ? explicitMove : moveApprovalDefault
    const userClean = { ...user }
    delete userClean.activeSession
    return {
      ...userClean,
      role,
      status: user.status || 'active',
      settings: {
        ...(user.settings || {}),
        permissions: {
          ...(user.settings?.permissions || {}),
          moveApproval
        }
      }
    }
  })
  const existingAccounts = new Set(users.map((u) => u.account))
  for (const seed of defaultDb.users) {
    if (!existingAccounts.has(seed.account)) {
      users.push(deepClone(seed))
      existingAccounts.add(seed.account)
    }
  }
  const merged = {
    ...deepClone(defaultDb),
    ...db,
    users,
    deliveryToolLocations:
      db && typeof db.deliveryToolLocations === 'object' && db.deliveryToolLocations !== null
        ? db.deliveryToolLocations
        : {},
    toolMoveHistory: Array.isArray(db?.toolMoveHistory) ? db.toolMoveHistory : [],
    moveApproveStats: { ...defaultDb.moveApproveStats, ...(db?.moveApproveStats || {}) },
    homeEvents: { ...defaultDb.homeEvents, ...(db?.homeEvents || {}) }
  }
  const locLegacy = merged.deliveryToolLocations || {}
  if (!merged.baseItems || !merged.baseItems.length) {
    merged.baseItems = deepClone(defaultDb.baseItems || [])
  }
  merged.baseItems = (merged.baseItems || []).map((b) => {
    const toolTypeRaw =
      b.toolType != null && String(b.toolType).trim() !== ''
        ? String(b.toolType).trim()
        : b.tool_type != null && String(b.tool_type).trim() !== ''
          ? String(b.tool_type).trim()
          : b['工装分类'] != null && String(b['工装分类']).trim() !== ''
            ? String(b['工装分类']).trim()
            : b.moldType != null && String(b.moldType).trim() !== ''
              ? String(b.moldType).trim()
              : ''
    const toolLocRaw =
      b.toolUsageLocation != null && String(b.toolUsageLocation).trim() !== ''
        ? String(b.toolUsageLocation).trim()
        : b.tool_usage_location != null && String(b.tool_usage_location).trim() !== ''
          ? String(b.tool_usage_location).trim()
          : ''
    return {
    ...b,
    toolType: toolTypeRaw,
    toolUsageLocation:
      toolLocRaw !== ''
        ? toolLocRaw
        : locLegacy[String(b.id)]?.toolUsageLocation || '',
    acceptanceCompleted: b.acceptanceCompleted === true
  }
  })
  merged.acceptItemMaterials = Array.isArray(db?.acceptItemMaterials) ? db.acceptItemMaterials : []
  merged.moveApplyList = (merged.moveApplyList || []).map((row) => ({
    ...row,
    meta: row.meta && typeof row.meta === 'object' ? row.meta : {},
    details: Array.isArray(row.details) ? row.details : []
  }))
  /** 剔除旧版内置演示移模申请（截图中 MM20260428001 / MM20260427002 等已写入本地缓存的样例） */
  const legacyMoveApplyNos = new Set(['MM20260428001', 'MM20260427002'])
  merged.moveApplyList = merged.moveApplyList.filter((row) => !legacyMoveApplyNos.has(row.applyNo))
  const applyList = merged.moveApplyList || []
  merged.moveApproveStats = {
    pending: applyList.filter((i) => i.status === 'pending').length,
    approved: applyList.filter((i) => i.status === 'approved').length
  }
  merged.acceptHistory = Array.isArray(merged.acceptHistory) ? merged.acceptHistory : []
  /** 移除内置演示历史验收行（改为仅由模具交付建档提交产生） */
  const legacyAcceptHistoryIds = new Set(['h1', 'h2'])
  merged.acceptHistory = merged.acceptHistory.filter((h) => !legacyAcceptHistoryIds.has(h.id))
  return merged
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const seeded = deepClone(defaultDb)
      localStorage.setItem(DB_KEY, JSON.stringify(seeded))
      return seeded
    }
    return mergeDefaults(JSON.parse(raw))
  } catch (error) {
    console.error('load mock db failed:', error)
    return deepClone(defaultDb)
  }
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function mutateDb(handler) {
  const db = loadDb()
  const nextDb = handler(db) || db
  saveDb(nextDb)
  return nextDb
}

export function nextId(list = []) {
  if (!Array.isArray(list) || list.length === 0) return 1
  let max = 0
  for (const item of list) {
    const n = Number(item?.id)
    if (Number.isFinite(n) && n > max) max = n
  }
  // 若仅有非数字 id（如历史 import-*），避免 Math.max(0)+1 反复得到 1 造成主键冲突
  if (max === 0 && list.length) {
    return Date.now()
  }
  return max + 1
}

export function paginate(list = [], page = 1, size = 10) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeSize = Math.max(1, Number(size) || 10)
  const start = (safePage - 1) * safeSize
  const end = start + safeSize
  return {
    list: list.slice(start, end),
    total: list.length
  }
}
