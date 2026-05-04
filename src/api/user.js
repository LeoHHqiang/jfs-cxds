import { loadDb, mutateDb, nextId, paginate } from './mockDb'

const ACCOUNT_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/

function toSafeUser(user) {
  const role = user.role || 'user'
  const rawPerm = user.settings?.permissions || {}
  const moveApproval =
    role === 'admin' ? true : role === 'approver' ? rawPerm.moveApproval !== false : !!rawPerm.moveApproval
  return {
    id: user.id,
    username: user.account,
    account: user.account,
    role,
    status: user.status || 'active',
    name: user.profile?.displayName || user.account,
    profile: user.profile || {},
    settings: user.settings || {},
    permissions: { moveApproval }
  }
}

export const register = async ({ account, password }) => {
  const normalized = (account || '').trim()
  if (!normalized || !ACCOUNT_PATTERN.test(normalized)) {
    return { success: false, message: '账号必须为字母+数字组合' }
  }
  if (!password) {
    return { success: false, message: '密码不能为空' }
  }
  const db = loadDb()
  if (db.users.some((u) => u.account === normalized)) {
    return { success: false, message: '账号已存在' }
  }

  mutateDb((draft) => {
    draft.users.unshift({
      id: nextId(draft.users),
      account: normalized,
      password,
      role: 'user',
      status: 'active',
      profile: { displayName: normalized, phone: '', email: '' },
      settings: { theme: 'light', language: 'zh-CN', notifyByEmail: true, permissions: {} }
    })
    return draft
  })
  return { success: true, message: '注册成功' }
}

export const login = async ({ username, account, password }) => {
  const inputAccount = (account || username || '').trim()
  const db = loadDb()
  const user = db.users.find((u) => u.account === inputAccount)
  if (!user) return { success: false, message: '账号不存在' }
  if (user.status === 'disabled') return { success: false, message: '账号已被禁用，请联系管理员' }
  if (user.password !== password) return { success: false, message: '密码错误' }
  return { success: true, data: toSafeUser(user) }
}

export const logout = async () => ({ success: true })

/** 本地 mock：按登录账号读取库内明文密码，供界面展示（无表或账号不存在时返回空字符串） */
export function getUserPlainPassword(accountInput) {
  const acc = String(accountInput || '').trim()
  if (!acc || acc === '游客') return ''
  const db = loadDb()
  const u = db.users.find((x) => String(x.account || '').trim() === acc)
  if (!u || u.password == null) return ''
  return String(u.password)
}

export const getCurrentUser = async (account) => {
  const db = loadDb()
  const user = db.users.find((u) => u.account === account)
  if (!user) return { success: false, message: '用户不存在' }
  return { success: true, data: toSafeUser(user) }
}

export const updateUserInfo = async (userData = {}) => {
  const account = (userData.account || '').trim()
  const db = loadDb()
  const target = db.users.find((u) => u.account === account)
  if (!target) return { success: false, message: '用户不存在' }

  mutateDb((draft) => {
    const user = draft.users.find((u) => u.account === account)
    user.profile = {
      ...(user.profile || {}),
      displayName: userData.displayName ?? user.profile?.displayName ?? account,
      phone: userData.phone ?? user.profile?.phone ?? '',
      email: userData.email ?? user.profile?.email ?? ''
    }
    if (userData.settings) {
      user.settings = { ...(user.settings || {}), ...userData.settings }
    }
    return draft
  })
  const fresh = (await getCurrentUser(account)).data
  return { success: true, data: fresh }
}

export const changePassword = async ({ account, oldPassword, newPassword }) => {
  const db = loadDb()
  const user = db.users.find((u) => u.account === account)
  if (!user) return { success: false, message: '用户不存在' }
  if (user.password !== oldPassword) return { success: false, message: '旧密码不正确' }
  if (!newPassword) return { success: false, message: '新密码不能为空' }
  mutateDb((draft) => {
    const target = draft.users.find((u) => u.account === account)
    target.password = newPassword
    return draft
  })
  return { success: true, message: '密码修改成功' }
}

export const getUserList = async (params = {}) => {
  const db = loadDb()
  const page = Number(params.page || 1)
  const size = Number(params.size || 10)
  let list = db.users.map((raw) => ({
    ...toSafeUser(raw),
    plainPassword: raw.password != null ? String(raw.password) : ''
  }))
  if (params.keyword) {
    list = list.filter((item) => item.account.includes(params.keyword) || String(item.name || '').includes(params.keyword))
  }
  if (params.role) list = list.filter((item) => item.role === params.role)
  if (params.status) list = list.filter((item) => item.status === params.status)
  return { success: true, data: paginate(list, page, size) }
}

function normalizeCreateRole(role) {
  if (role === 'admin') return 'admin'
  if (role === 'approver') return 'approver'
  return 'user'
}

export const adminCreateUser = async ({ account, password, role = 'user' }) => {
  const normalized = (account || '').trim()
  if (!normalized || !ACCOUNT_PATTERN.test(normalized)) {
    return { success: false, message: '账号必须为字母+数字组合' }
  }
  if (!password || password.length < 6) {
    return { success: false, message: '密码至少 6 位' }
  }
  const db = loadDb()
  if (db.users.some((u) => u.account === normalized)) {
    return { success: false, message: '账号已存在' }
  }
  const r = normalizeCreateRole(role)
  let saved = null
  mutateDb((draft) => {
    saved = {
      id: nextId(draft.users),
      account: normalized,
      password,
      role: r,
      status: 'active',
      profile: { displayName: normalized, phone: '', email: '' },
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifyByEmail: true,
        permissions: { moveApproval: r === 'approver' }
      }
    }
    draft.users.unshift(saved)
    return draft
  })
  return { success: true, data: toSafeUser(saved) }
}

/**
 * 管理员修改账号角色（仅普通账号 ↔ 审批账号，不可改管理员）。
 * 设为审批账号时默认开通移模审批权限；设为普通账号时关闭该权限。
 */
export const adminSetUserRole = async ({ account, role }) => {
  const acc = (account || '').trim()
  if (!acc) return { success: false, message: '账号不能为空' }
  const r = normalizeCreateRole(role)
  if (r === 'admin') {
    return { success: false, message: '请通过其他方式管理管理员；此处仅支持普通账号与审批账号互转' }
  }
  const db = loadDb()
  const target = db.users.find((u) => u.account === acc)
  if (!target) return { success: false, message: '账号不存在' }
  if (target.role === 'admin') return { success: false, message: '不能修改管理员角色' }
  mutateDb((draft) => {
    const u = draft.users.find((x) => x.account === acc)
    u.role = r
    u.settings = { ...(u.settings || {}), permissions: { ...(u.settings?.permissions || {}), moveApproval: r === 'approver' } }
    return draft
  })
  const fresh = loadDb().users.find((u) => u.account === acc)
  return { success: true, data: toSafeUser(fresh) }
}

/** 管理员设置账号的移模审批权限（审批类账号或经授权的普通账号） */
export const adminSetUserMoveApproval = async ({ account, moveApproval }) => {
  const acc = (account || '').trim()
  if (!acc) return { success: false, message: '账号不能为空' }
  if (typeof moveApproval !== 'boolean') return { success: false, message: '参数非法' }
  const db = loadDb()
  const target = db.users.find((u) => u.account === acc)
  if (!target) return { success: false, message: '账号不存在' }
  if (target.role === 'admin') return { success: false, message: '无需修改管理员权限' }
  mutateDb((draft) => {
    const u = draft.users.find((x) => x.account === acc)
    u.settings = { ...(u.settings || {}), permissions: { ...(u.settings?.permissions || {}), moveApproval } }
    return draft
  })
  const fresh = loadDb().users.find((u) => u.account === acc)
  return { success: true, data: toSafeUser(fresh) }
}

export const adminToggleUserStatus = async ({ account, status }) => {
  if (!account) return { success: false, message: '账号不能为空' }
  if (!['active', 'disabled'].includes(status)) return { success: false, message: '状态非法' }
  const db = loadDb()
  const target = db.users.find((u) => u.account === account)
  if (!target) return { success: false, message: '账号不存在' }
  if (target.role === 'admin' && status === 'disabled') return { success: false, message: '管理员账号不可禁用' }
  mutateDb((draft) => {
    const user = draft.users.find((u) => u.account === account)
    user.status = status
    return draft
  })
  return { success: true }
}

export const adminResetUserPassword = async ({ account, newPassword }) => {
  if (!account) return { success: false, message: '账号不能为空' }
  if (!newPassword || newPassword.length < 6) return { success: false, message: '新密码至少 6 位' }
  const db = loadDb()
  const target = db.users.find((u) => u.account === account)
  if (!target) return { success: false, message: '账号不存在' }
  mutateDb((draft) => {
    const user = draft.users.find((u) => u.account === account)
    user.password = newPassword
    return draft
  })
  return { success: true }
}

