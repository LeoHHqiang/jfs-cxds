<template>
  <div class="dashboard-container">
    <SideBar
      :active-menu="activeMenu"
      :active-submenu="activeSubmenu"
      :menu-items="visibleMenuItems"
      @menu-change="setActiveMenu"
      @submenu-change="setActiveSubmenu"
    />

    <div class="main-wrapper">
      <TopNavBar 
        :current-page="currentPageName" 
        :current-icon="currentPageIcon"
        :username="displayUsername"
        :login-account="account"
        :is-admin="isAdmin"
        @logout="handleLogout"
        @settings-action="handleSettingsAction"
      />

      <ContentArea :page-name="currentPageName">
        <component
          :is="currentComponent"
          :page-name="currentPageName"
          :active-submenu="activeSubmenu"
          :active-submenu-label="currentSubmenuLabel"
          v-bind="childExtraProps"
        />
      </ContentArea>
    </div>

    <div v-if="dialog === 'personal'" class="dialog-mask" @click.self="closeDialog">
      <div class="dialog-card">
        <h3>个人设置</h3>
        <div class="field"><label>账号</label><input :value="account" disabled></div>
        <div class="field"><label>密码</label><input :value="plainPasswordDisplay || '—'" disabled title="当前库内登录密码（本地 mock 明文）"></div>
        <div class="field"><label>显示名</label><input v-model="personalForm.displayName"></div>
        <div class="field"><label>手机号</label><input v-model="personalForm.phone"></div>
        <div class="field"><label>邮箱</label><input v-model="personalForm.email"></div>
        <p v-if="dialogError" class="dialog-error">{{ dialogError }}</p>
        <div class="actions"><button @click="savePersonal">保存</button><button @click="closeDialog">取消</button></div>
      </div>
    </div>

    <div v-if="dialog === 'password'" class="dialog-mask" @click.self="closeDialog">
      <div class="dialog-card">
        <h3>修改密码</h3>
        <div class="field"><label>旧密码</label><input v-model="passwordForm.oldPassword" type="password"></div>
        <div class="field"><label>新密码</label><input v-model="passwordForm.newPassword" type="password"></div>
        <p v-if="dialogError" class="dialog-error">{{ dialogError }}</p>
        <div class="actions"><button @click="savePassword">保存</button><button @click="closeDialog">取消</button></div>
      </div>
    </div>

    <div v-if="dialog === 'system'" class="dialog-mask" @click.self="closeDialog">
      <div class="dialog-card">
        <h3>系统设置</h3>
        <div class="field"><label>主题</label><select v-model="systemForm.theme"><option value="light">浅色</option><option value="dark">深色</option></select></div>
        <div class="field"><label>语言</label><select v-model="systemForm.language"><option value="zh-CN">中文</option><option value="en-US">English</option></select></div>
        <div class="field checkbox"><label><input type="checkbox" v-model="systemForm.notifyByEmail"> 邮件通知</label></div>
        <p v-if="dialogError" class="dialog-error">{{ dialogError }}</p>
        <div class="actions"><button @click="saveSystem">保存</button><button @click="closeDialog">取消</button></div>
      </div>
    </div>
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import TopNavBar from './TopNavBar.vue'
import SideBar from './SideBar.vue'
import ContentArea from './ContentArea.vue'
import HomePage from './pages/HomePage.vue'
import TemplatePage from './pages/TemplatePage.vue'
import SupplierPage from './pages/SupplierPage.vue'
import UserManagePage from './pages/UserManagePage.vue'
import RecordPage from './pages/RecordPage.vue'
import AcceptApprovePage from './pages/AcceptApprovePage.vue'
import MoveManagePage from './pages/MoveManagePage.vue'
import AcceptHistoryPage from './pages/AcceptHistoryPage.vue'
import ProcessFlowQueryPage from './pages/ProcessFlowQueryPage.vue'
import { changePassword, updateUserInfo, getUserPlainPassword } from '@/api'
import { clearAcceptStageContext } from '@/utils/acceptStageContext'

const emit = defineEmits(['logout'])

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

const activeMenu = ref('home')
const activeSubmenu = ref('')

const role = computed(() => props.user?.role || 'user')
const isAdmin = computed(() => role.value === 'admin')
const canMoveApprove = computed(() => {
  if (isAdmin.value) return true
  if (role.value !== 'approver') return false
  return props.user?.permissions?.moveApproval === true
})

const childExtraProps = computed(() => {
  const m = activeMenu.value
  if (['home', 'move-approve', 'move-apply-only', 'move-approval-only', 'supplier'].includes(m)) {
    return { user: props.user }
  }
  return {}
})

const menuItems = computed(() => {
  const items = [
    { name: '首页', path: 'home', icon: 'fas fa-home' }
  ]
  if (role.value === 'admin') {
    items.push({ name: '流程查询', path: 'flow-query', icon: 'fas fa-search-location' })
  }
  if (role.value === 'user' || role.value === 'approver') {
    items.push({ name: '验收管理', path: 'accept-approve', icon: 'fas fa-clipboard-check' })
  }
  if (role.value === 'user') {
    items.push({ name: '移模申请', path: 'move-apply-only', icon: 'fas fa-file-signature' })
  } else if (role.value === 'approver' && canMoveApprove.value) {
    items.push({ name: '移模审批', path: 'move-approval-only', icon: 'fas fa-stamp' })
  }
  if (role.value === 'user' || role.value === 'approver') {
    items.push({ name: '历史验收', path: 'accept-history', icon: 'fas fa-history' })
  }
  items.push(
    { name: '模板管理', path: 'template', icon: 'fas fa-cube', adminOnly: true },
    { name: '操作记录', path: 'record', icon: 'fas fa-clipboard-list', adminOnly: true },
    { name: '供应商管理', path: 'supplier', icon: 'fas fa-truck', showForUser: true },
    { name: '账号管理', path: 'user-manage', icon: 'fas fa-users-cog', adminOnly: true }
  )
  return items
})

const visibleMenuItems = computed(() =>
  menuItems.value.filter((item) => {
    if (item.adminOnly) return isAdmin.value
    if (item.showForUser) return isAdmin.value || role.value === 'user' || role.value === 'approver'
    return true
  })
)
const allowedMenuPaths = computed(() => visibleMenuItems.value.map((item) => item.path))

const acceptSubmenuItems = [
  { key: 'create', label: '验收管理' },
  { key: 'accept-input', label: '验收录入' },
  { key: 'base', label: '基础项录入' },
  { key: 'delivery', label: '交付追踪' },
  { key: 'accept', label: '验收项录入' },
  { key: 'mold-archive', label: '模具交付建档' }
]

const moveSubmenuItems = [
  { key: 'move-approval', label: '移模审批' },
  { key: 'move-apply', label: '移模申请' }
]

const acceptValidSubmenuKeys = new Set(['create', 'accept-input', 'base', 'delivery', 'accept', 'mold-archive'])
const moveValidSubmenuKeys = new Set(['move-approval', 'move-apply'])

const currentSubmenuLabel = computed(() => {
  if (activeMenu.value === 'move-approve') {
    const item = moveSubmenuItems.find((i) => i.key === activeSubmenu.value)
    return item ? item.label : ''
  }
  if (activeMenu.value === 'accept-approve') {
    const item = acceptSubmenuItems.find((i) => i.key === activeSubmenu.value)
    return item ? item.label : '验收管理'
  }
  return ''
})

const currentPageName = computed(() => {
  if (activeMenu.value === 'accept-approve') {
    return currentSubmenuLabel.value
  }
  if (activeMenu.value === 'move-apply-only') return '移模申请'
  if (activeMenu.value === 'move-approval-only') return '移模审批'
  const item = visibleMenuItems.value.find((item) => item.path === activeMenu.value)
  return item ? item.name : '首页'
})

const currentPageIcon = computed(() => {
  if (activeMenu.value === 'move-apply-only') return 'fas fa-file-signature'
  if (activeMenu.value === 'move-approval-only') return 'fas fa-stamp'
  const item = visibleMenuItems.value.find((item) => item.path === activeMenu.value)
  return item ? item.icon : 'fas fa-home'
})

// 按主菜单 path 映射组件，避免子菜单标题变化导致回退首页
const componentMap = {
  home: HomePage,
  'accept-approve': AcceptApprovePage,
  'move-approve': MoveManagePage,
  'move-apply-only': MoveManagePage,
  'move-approval-only': MoveManagePage,
  'flow-query': ProcessFlowQueryPage,
  template: TemplatePage,
  'accept-history': AcceptHistoryPage,
  record: RecordPage,
  supplier: SupplierPage,
  'user-manage': UserManagePage
}

const currentComponent = computed(() => {
  return componentMap[activeMenu.value] || HomePage
})

const account = computed(() => props.user?.account || props.user?.username || '游客')
const displayUsername = ref(props.user?.profile?.displayName || account.value)
const plainPasswordDisplay = ref('')

function refreshPlainPassword() {
  plainPasswordDisplay.value = getUserPlainPassword(account.value)
}

const dialog = ref('')
const dialogError = ref('')
const toast = ref('')
let toastTimer = null
const personalForm = reactive({ displayName: displayUsername.value, phone: props.user?.profile?.phone || '', email: props.user?.profile?.email || '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '' })
const systemForm = reactive({
  theme: props.user?.settings?.theme || 'light',
  language: props.user?.settings?.language || 'zh-CN',
  notifyByEmail: props.user?.settings?.notifyByEmail ?? true
})

const setActiveMenu = (path) => {
  if (!allowedMenuPaths.value.includes(path)) return
  activeMenu.value = path
  if (path === 'move-apply-only') {
    activeSubmenu.value = 'move-apply'
    return
  }
  if (path === 'move-approval-only') {
    activeSubmenu.value = 'move-approval'
    return
  }
  if (path !== 'accept-approve') {
    if (path === 'move-approve') {
      activeSubmenu.value = activeSubmenu.value || 'move-approval'
      return
    }
    activeSubmenu.value = ''
    return
  }
  clearAcceptStageContext()
  activeSubmenu.value = 'create'
}

const setActiveSubmenu = (payload) => {
  const nextMain = payload?.mainMenu || 'accept-approve'
  if (!allowedMenuPaths.value.includes(nextMain)) return
  activeMenu.value = nextMain
  if (payload?.subMenu) {
    activeSubmenu.value = payload.subMenu
    return
  }
  if (activeMenu.value === 'move-apply-only') {
    activeSubmenu.value = 'move-apply'
    return
  }
  if (activeMenu.value === 'move-approval-only') {
    activeSubmenu.value = 'move-approval'
    return
  }
  activeSubmenu.value = activeMenu.value === 'move-approve' ? 'move-approval' : 'create'
}

const buildHash = () => {
  if (activeMenu.value === 'move-apply-only' || activeMenu.value === 'move-approval-only') {
    return `#/${activeMenu.value}`
  }
  if (activeSubmenu.value) return `#/${activeMenu.value}/${activeSubmenu.value}`
  return `#/${activeMenu.value}`
}

const syncHash = () => {
  const nextHash = buildHash()
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash
  }
}

const applyHash = () => {
  const hash = (window.location.hash || '').replace(/^#\/?/, '')
  if (!hash) return
  const [menu, submenu] = hash.split('/')
  if (!allowedMenuPaths.value.includes(menu)) return
  activeMenu.value = menu
  if (menu === 'move-apply-only') {
    activeSubmenu.value = 'move-apply'
    return
  }
  if (menu === 'move-approval-only') {
    activeSubmenu.value = 'move-approval'
    return
  }
  if (submenu) {
    if (menu === 'accept-approve' && !acceptValidSubmenuKeys.has(submenu)) {
      activeSubmenu.value = 'create'
    } else if (menu === 'move-approve' && !moveValidSubmenuKeys.has(submenu)) {
      activeSubmenu.value = 'move-approval'
    } else {
      activeSubmenu.value = submenu
    }
    return
  }
  if (menu === 'accept-approve') activeSubmenu.value = 'create'
  else if (menu === 'move-approve') activeSubmenu.value = 'move-approval'
  else activeSubmenu.value = ''
}

const handleLogout = () => {
  emit('logout')
}

const handleSettingsAction = (action) => {
  switch (action) {
    case 'personal':
      refreshPlainPassword()
      dialog.value = 'personal'
      break
    case 'password':
      refreshPlainPassword()
      dialog.value = 'password'
      break
    case 'system':
      if (!isAdmin.value) return
      dialog.value = 'system'
      break
    case 'logout':
      handleLogout()
      break
  }
}

const closeDialog = () => {
  dialog.value = ''
  dialogError.value = ''
}

const showToast = (text) => {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 1800)
}

const savePersonal = async () => {
  dialogError.value = ''
  if (!personalForm.displayName.trim()) {
    dialogError.value = '显示名不能为空'
    return
  }
  const res = await updateUserInfo({
    account: account.value,
    displayName: personalForm.displayName,
    phone: personalForm.phone,
    email: personalForm.email
  })
  if (res.success) {
    displayUsername.value = personalForm.displayName || account.value
    showToast('个人设置已保存')
    closeDialog()
  } else {
    dialogError.value = res.message || '保存失败'
  }
}

const savePassword = async () => {
  dialogError.value = ''
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    dialogError.value = '请填写旧密码和新密码'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    dialogError.value = '新密码至少 6 位'
    return
  }
  const res = await changePassword({
    account: account.value,
    oldPassword: passwordForm.oldPassword,
    newPassword: passwordForm.newPassword
  })
  if (res.success) {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    refreshPlainPassword()
    showToast('密码修改成功')
    closeDialog()
  } else {
    dialogError.value = res.message || '修改失败'
  }
}

const saveSystem = async () => {
  dialogError.value = ''
  const res = await updateUserInfo({
    account: account.value,
    settings: {
      theme: systemForm.theme,
      language: systemForm.language,
      notifyByEmail: systemForm.notifyByEmail
    }
  })
  if (res.success) {
    showToast('系统设置已保存')
    closeDialog()
  } else {
    dialogError.value = res.message || '保存失败'
  }
}

watch(
  () => allowedMenuPaths.value,
  (paths) => {
    if (!paths.includes(activeMenu.value)) {
      activeMenu.value = paths[0] || 'home'
      activeSubmenu.value = ''
    }
    applyHash()
  },
  { immediate: true }
)

watch(
  () => [activeMenu.value, activeSubmenu.value],
  () => {
    syncHash()
  }
)

watch(account, refreshPlainPassword, { immediate: true })

onMounted(() => {
  refreshPlainPassword()
  applyHash()
  window.addEventListener('hashchange', applyHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', applyHash)
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.dialog-card {
  width: 420px;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
}

.field {
  display: flex;
  align-items: center;
  margin: 10px 0;
  gap: 10px;
}

.field label {
  width: 70px;
}

.field input,
.field select {
  flex: 1;
  height: 32px;
  border: 1px solid #d5deea;
  border-radius: 6px;
  padding: 0 8px;
}

.field.checkbox {
  justify-content: flex-start;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.actions button {
  height: 32px;
  border: 1px solid #d5deea;
  background: #fff;
  border-radius: 6px;
  padding: 0 12px;
  cursor: pointer;
}

.dialog-error {
  color: #de5050;
  font-size: 12px;
  margin: 6px 0;
}

.toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: #2f7df7;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1400;
}
</style>
