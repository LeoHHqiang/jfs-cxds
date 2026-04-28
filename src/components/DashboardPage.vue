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
        />
      </ContentArea>
    </div>

    <div v-if="dialog === 'personal'" class="dialog-mask" @click.self="closeDialog">
      <div class="dialog-card">
        <h3>个人设置</h3>
        <div class="field"><label>账号</label><input :value="account" disabled></div>
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
import { changePassword, updateUserInfo } from '@/api'

const emit = defineEmits(['logout'])

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

const activeMenu = ref('home')
const activeSubmenu = ref('')

const menuItems = [
  { name: '首页', path: 'home', icon: 'fas fa-home' },
  {
    name: '验收管理',
    path: 'accept-approve',
    icon: 'fas fa-clipboard-check',
    hasDropdown: true,
    submenuItems: [
      { key: 'create', label: '新建验收管理' },
      { key: 'base', label: '基础项录入' },
      { key: 'delivery', label: '交付追踪' },
      { key: 'accept', label: '验收项录入' }
    ]
  },
  {
    name: '移模管理',
    path: 'move-approve',
    icon: 'fas fa-exchange-alt',
    hasDropdown: true,
    submenuItems: [
      { key: 'move-approval', label: '移模审批' },
      { key: 'move-apply', label: '移模申请' }
    ]
  },
  { name: '模板管理', path: 'template', icon: 'fas fa-cube', adminOnly: true },
  { name: '历史验收', path: 'accept-history', icon: 'fas fa-history' },
  { name: '操作记录', path: 'record', icon: 'fas fa-clipboard-list' },
  { name: '供应商管理', path: 'supplier', icon: 'fas fa-truck', adminOnly: true },
  { name: '账号管理', path: 'user-manage', icon: 'fas fa-users-cog', adminOnly: true }
]

const isAdmin = computed(() => (props.user?.role || 'user') === 'admin')
const visibleMenuItems = computed(() => menuItems.filter((item) => !item.adminOnly || isAdmin.value))
const allowedMenuPaths = computed(() => visibleMenuItems.value.map((item) => item.path))

const acceptSubmenuItems = [
  { key: 'create', label: '新建验收管理' },
  { key: 'base', label: '基础项录入' },
  { key: 'delivery', label: '交付追踪' },
  { key: 'accept', label: '验收项录入' }
]

const moveSubmenuItems = [
  { key: 'move-approval', label: '移模审批' },
  { key: 'move-apply', label: '移模申请' }
]

const currentSubmenuLabel = computed(() => {
  const source = activeMenu.value === 'move-approve' ? moveSubmenuItems : acceptSubmenuItems
  const item = source.find(item => item.key === activeSubmenu.value)
  return item ? item.label : ''
})

const currentPageName = computed(() => {
  if (activeMenu.value === 'accept-approve' && currentSubmenuLabel.value) {
    return currentSubmenuLabel.value
  }
  const item = visibleMenuItems.value.find(item => item.path === activeMenu.value)
  return item ? item.name : '首页'
})

const currentPageIcon = computed(() => {
  const item = visibleMenuItems.value.find(item => item.path === activeMenu.value)
  return item ? item.icon : 'fas fa-home'
})

// 按主菜单 path 映射组件，避免子菜单标题变化导致回退首页
const componentMap = {
  home: HomePage,
  'accept-approve': AcceptApprovePage,
  'move-approve': MoveManagePage,
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
  if (path !== 'accept-approve') {
    if (path === 'move-approve') {
      activeSubmenu.value = activeSubmenu.value || 'move-approval'
      return
    }
    activeSubmenu.value = ''
    return
  }
  activeSubmenu.value = activeSubmenu.value || 'create'
}

const setActiveSubmenu = (payload) => {
  const nextMain = payload?.mainMenu || 'accept-approve'
  if (!allowedMenuPaths.value.includes(nextMain)) return
  activeMenu.value = nextMain
  if (payload?.subMenu) {
    activeSubmenu.value = payload.subMenu
    return
  }
  activeSubmenu.value = activeMenu.value === 'move-approve' ? 'move-approval' : 'create'
}

const buildHash = () => {
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
  if (submenu) {
    activeSubmenu.value = submenu
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
      dialog.value = 'personal'
      break
    case 'password':
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

onMounted(() => {
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
