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
        phone: '',
        email: ''
      },
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifyByEmail: true
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
        phone: '',
        email: ''
      },
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifyByEmail: false
      }
    }
  ],
  records: [
    { id: 'r1', time: '2026-04-28 09:20:00', userName: '管理员', role: 'admin', type: 'create', project: 'CM2E', description: '创建验收项目 CM2E' },
    { id: 'r2', time: '2026-04-27 16:45:00', userName: '管理员', role: 'admin', type: 'update', project: 'BWM', description: '更新项目进度节点' }
  ],
  acceptHistory: [
    { id: 'h1', acceptTime: '2026-04-20 10:00:00', projectCode: 'CM2E', owner: 'u1', ownerName: '张三', progress: '模具交付建档', purchase: 'p1', purchaseName: '采购单A', startDate: '2026-03-01', endDate: '2026-04-18', remark: '一次性通过' },
    { id: 'h2', acceptTime: '2026-04-21 14:30:00', projectCode: 'BWM', owner: 'u2', ownerName: '李四', progress: '模具交付建档', purchase: 'p2', purchaseName: '采购单B', startDate: '2026-03-05', endDate: '2026-04-20', remark: '' }
  ],
  moveApproveStats: { pending: 3, approved: 8 },
  moveApproveSeries: [
    [5, 6, 7, 6, 8, 9, 10, 9, 11, 13, 12, 14],
    [3, 3, 4, 5, 5, 6, 7, 6, 8, 8, 9, 10]
  ],
  moveApplyList: [
    { id: 1, applyNo: 'MM20260428001', partName: '副驾驶座椅总成', partNo: '6608347607', toolName: '副驾驶安全带盖板检具A1', fromSupplier: '宁海良诚模具有限公司', toSupplier: '宁波宝贝电子有限公司', applicant: '工程师1', applyTime: '2026-04-28 10:32', status: 'pending' },
    { id: 2, applyNo: 'MM20260427002', partName: '中控饰板总成', partNo: '6608347608', toolName: '中控饰板检具B2', fromSupplier: '峰诗恩电子有限公司', toSupplier: '宁海良诚模具有限公司', applicant: '采购员2', applyTime: '2026-04-27 16:11', status: 'approved' }
  ],
  suppliers: [
    { id: 1, name: '宁海良诚模具有限公司', contact: '王工', phone: '13800000001', level: 'A', status: '合作中' },
    { id: 2, name: '宁波宝贝电子有限公司', contact: '赵工', phone: '13800000002', level: 'B', status: '合作中' }
  ],
  templates: [
    { id: 1, name: '吉利1', creator: '张三', createdAt: '2026-01-01', items: [] },
    { id: 2, name: '理想1', creator: '李四', createdAt: '2026-01-02', items: [] }
  ],
  projects: [
    { id: 1, code: 'CM2E', owner: '李新宇', updatedAt: '2026-04-12 12:22', progressIndex: 2, stages: [] },
    { id: 2, code: 'BWM', owner: '张三', updatedAt: '2026-04-13 09:16', progressIndex: 1, stages: [] }
  ],
  homeTodos: [
    { title: '资料上传', project: 'BWM', owner: '李新宇', theme: 'pink' },
    { title: '信息导入', project: 'CM2E', owner: '李新宇', theme: 'green' }
  ],
  homeEvents: {
    '2026-04-10': [{ type: 'meeting', title: '团队会议', time: '10:00' }],
    '2026-04-15': [{ type: 'review', title: '代码审查', time: '14:00' }]
  },
  baseItems: [],
  deliveryItems: [],
  acceptItems: []
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function mergeDefaults(db) {
  const users = (db?.users || defaultDb.users).map((user) => ({
    ...user,
    role: user.role || (user.account === 'admin01' ? 'admin' : 'user'),
    status: user.status || 'active'
  }))
  return {
    ...deepClone(defaultDb),
    ...db,
    users,
    moveApproveStats: { ...defaultDb.moveApproveStats, ...(db?.moveApproveStats || {}) },
    homeEvents: { ...defaultDb.homeEvents, ...(db?.homeEvents || {}) }
  }
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
  return Math.max(...list.map((item) => Number(item.id) || 0)) + 1
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
