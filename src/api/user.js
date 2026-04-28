import { loadDb, mutateDb, nextId, paginate } from './mockDb'

const ACCOUNT_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/

function toSafeUser(user) {
  return {
    id: user.id,
    username: user.account,
    account: user.account,
    role: user.role || 'user',
    status: user.status || 'active',
    name: user.profile?.displayName || user.account,
    profile: user.profile || {},
    settings: user.settings || {}
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
      settings: { theme: 'light', language: 'zh-CN', notifyByEmail: true }
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
  let list = db.users.map(toSafeUser)
  if (params.keyword) {
    list = list.filter((item) => item.account.includes(params.keyword) || String(item.name || '').includes(params.keyword))
  }
  if (params.role) list = list.filter((item) => item.role === params.role)
  if (params.status) list = list.filter((item) => item.status === params.status)
  return { success: true, data: paginate(list, page, size) }
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
  let saved = null
  mutateDb((draft) => {
    saved = {
      id: nextId(draft.users),
      account: normalized,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      status: 'active',
      profile: { displayName: normalized, phone: '', email: '' },
      settings: { theme: 'light', language: 'zh-CN', notifyByEmail: true }
    }
    draft.users.unshift(saved)
    return draft
  })
  return { success: true, data: toSafeUser(saved) }
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

