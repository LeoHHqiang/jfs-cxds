<template>
  <div class="dashboard-container">
    <!-- Left Sidebar -->
    <SideBar
      :active-menu="activeMenu"
      :active-submenu="activeSubmenu"
      @menu-change="setActiveMenu"
      @submenu-change="setActiveSubmenu"
    />

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <!-- Top Navigation Bar -->
      <TopNavBar 
        :current-page="currentPageName" 
        :current-icon="currentPageIcon"
        :username="displayUsername"
        @logout="handleLogout"
        @settings-action="handleSettingsAction"
      />

      <!-- Content Area -->
      <ContentArea :page-name="currentPageName">
        <!-- 动态组件 -->
        <component
          :is="currentComponent"
          :page-name="currentPageName"
          :active-submenu="activeSubmenu"
          :active-submenu-label="currentSubmenuLabel"
        />
      </ContentArea>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { ref, computed } from 'vue'
import TopNavBar from './TopNavBar.vue'
import SideBar from './SideBar.vue'
import ContentArea from './ContentArea.vue'
import HomePendingPage from './pages/HomePendingPage.vue'
import TemplatePage from './pages/TemplatePage.vue'
import SupplierPage from './pages/SupplierPage.vue'
import RecordPage from './pages/RecordPage.vue'
import AcceptApprovePage from './pages/AcceptApprovePage.vue'
import MoveManagePage from './pages/MoveManagePage.vue'
import AcceptHistoryPage from './pages/AcceptHistoryPage.vue'

const emit = defineEmits(['logout'])

const props = defineProps({
  username: {
    type: String,
    default: '游客'
  }
})

const activeMenu = ref('home')
const activeSubmenu = ref('')

const menuItems = [
  { name: '首页', path: 'home', icon: 'fas fa-home' },
  { name: '验收管理', path: 'accept-approve', icon: 'fas fa-clipboard-check' },
  { name: '移模管理', path: 'move-approve', icon: 'fas fa-exchange-alt' },
  { name: '模板管理', path: 'template', icon: 'fas fa-cube' },
  { name: '历史验收', path: 'accept-history', icon: 'fas fa-history' },
  { name: '操作记录', path: 'record', icon: 'fas fa-clipboard-list' },
  { name: '供应商管理', path: 'supplier', icon: 'fas fa-truck' }
]

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
  const item = menuItems.find(item => item.path === activeMenu.value)
  return item ? item.name : '首页'
})

const currentPageIcon = computed(() => {
  const item = menuItems.find(item => item.path === activeMenu.value)
  return item ? item.icon : 'fas fa-home'
})

// 按主菜单 path 映射组件，避免子菜单标题变化导致回退首页
const componentMap = {
  home: HomePendingPage,
  'accept-approve': AcceptApprovePage,
  'move-approve': MoveManagePage,
  template: TemplatePage,
  'accept-history': AcceptHistoryPage,
  record: RecordPage,
  supplier: SupplierPage
}

const currentComponent = computed(() => {
  return componentMap[activeMenu.value] || HomePendingPage
})

// 计算属性：获取用户名（有传入使用传入的，否则从localStorage获取）
const displayUsername = computed(() => {
  return props.username || localStorage.getItem('savedUsername') || '游客'
})

const setActiveMenu = (path) => {
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
  activeMenu.value = payload?.mainMenu || 'accept-approve'
  if (payload?.subMenu) {
    activeSubmenu.value = payload.subMenu
    return
  }
  activeSubmenu.value = activeMenu.value === 'move-approve' ? 'move-approval' : 'create'
}

const handleLogout = () => {
  emit('logout')
}

const handleSettingsAction = (action) => {
  // 处理各种设置操作
  switch(action) {
    case 'personal':
      alert('打开个人设置')
      break
    case 'password':
      alert('打开修改密码')
      break
    case 'system':
      alert('打开系统设置')
      break
    case 'backup':
      alert('执行数据备份')
      break
    case 'export':
      alert('导出数据')
      break
  }
}
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
</style>
