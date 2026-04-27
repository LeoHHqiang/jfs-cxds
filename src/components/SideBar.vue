<template>
  <aside class="sidebar">
    <div class="logo">
      <h1><i class="fas fa-toolbox"></i>模具管理系统</h1>
    </div>
    
    <ul class="menu">
      <li 
        v-for="item in menuItems" 
        :key="item.path"
        :class="['menu-item', { 
          active: activeMenu === item.path,
          'has-dropdown': item.hasDropdown,
          'dropdown-open': isDropdownOpen && activeMenu === item.path
        }]"
        @click="!item.hasDropdown && handleMenuClick(item.path)"
      >
        <a v-if="!item.hasDropdown" class="menu-link">
          <i :class="item.icon"></i>
          <span class="menu-text">{{ item.name }}</span>
        </a>
        
        <template v-else>
          <div class="dropdown-header" @click="toggleDropdown(item.path)">
            <div class="header-content">
              <i :class="item.icon"></i>
              <span class="menu-text">{{ item.name }}</span>
            </div>
            <i class="dropdown-arrow" :class="isDropdownOpen && activeMenu === item.path ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
          </div>
          
          <transition name="dropdown">
            <ul v-show="isDropdownOpen && activeMenu === item.path" class="dropdown-menu">
              <li
                v-for="subItem in item.submenuItems || []"
                :key="subItem.key"
                :class="['dropdown-item', { active: activeSubmenuState === subItem.key }]"
                @click="handleSubmenuClick(item.path, subItem)"
              >
                <i class="submenu-icon fas fa-circle"></i>
                <span class="submenu-text">{{ subItem.label }}</span>
              </li>
            </ul>
          </transition>
        </template>
      </li>
    </ul>
  </aside>
</template>

<script setup>
/* eslint-disable */
import { ref, watch } from 'vue'

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'home'
  },
  activeSubmenu: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['menu-change', 'submenu-change'])

// 状态管理
const isDropdownOpen = ref(false)
const activeSubmenuState = ref('')

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
  { name: '模板管理', path: 'template', icon: 'fas fa-cube' },
  { name: '历史验收', path: 'accept-history', icon: 'fas fa-history' },
  { name: '操作记录', path: 'record', icon: 'fas fa-clipboard-list' },
  { name: '供应商管理', path: 'supplier', icon: 'fas fa-truck' }
]

const dropdownMenuPaths = menuItems.filter(item => item.hasDropdown).map(item => item.path)

// 处理主菜单点击
const handleMenuClick = (path) => {
  emit('menu-change', path)
  // 关闭下拉菜单
  isDropdownOpen.value = false
  activeSubmenuState.value = ''
}

// 切换下拉菜单
const toggleDropdown = (path) => {
  if (props.activeMenu === path && isDropdownOpen.value) {
    // 如果当前已经是打开状态，点击时关闭
    isDropdownOpen.value = false
    activeSubmenuState.value = ''
  } else {
    // 否则打开下拉菜单并激活主菜单
    emit('menu-change', path)
    isDropdownOpen.value = true
  }
}

// 处理子菜单点击
const handleSubmenuClick = (mainPath, subItem) => {
  activeSubmenuState.value = subItem.key
  emit('submenu-change', {
    mainMenu: mainPath,
    subMenu: subItem.key,
    ...subItem
  })
}

watch(
  () => props.activeMenu,
  (menu) => {
    isDropdownOpen.value = dropdownMenuPaths.includes(menu)
  },
  { immediate: true }
)

watch(
  () => props.activeSubmenu,
  (submenu) => {
    activeSubmenuState.value = submenu || ''
  },
  { immediate: true }
)
</script>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  background: linear-gradient(180deg, #2c3e50, #1a2530);
  color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  overflow-y: auto;
}

.logo {
  display: flex;
  height: 70px;
  background: #008DF7;
  align-items: center;
  padding: 0 20px;
}

.logo h1 {
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  margin: 0;
}

.logo i {
  color: #ffffff;
}

.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.menu-item:not(.has-dropdown):hover,
.menu-item.active:not(.has-dropdown) {
  background-color: #34495e;
  border-left-color: #008DF7;
}

.menu-item.has-dropdown {
  background-color: transparent;
}

.menu-item.has-dropdown.dropdown-open {
  background-color: #2a3a4d;
  border-left-color: #008DF7;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  color: inherit;
  text-decoration: none;
  transition: all 0.3s ease;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.dropdown-arrow {
  font-size: 12px;
  color: #bdc3c7;
  transition: transform 0.3s ease;
}

.menu-item.dropdown-open .dropdown-arrow {
  transform: rotate(0deg);
  color: #008DF7;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.menu-item.active i,
.menu-item.dropdown-open i {
  color: #008DF7;
}

/* 下拉菜单样式 */
.dropdown-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #1e2a38;
  overflow: hidden;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.dropdown-enter-from,
.dropdown-leave-to {
  max-height: 0;
  opacity: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px 12px 45px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.dropdown-item:hover {
  background-color: #2a3a4d;
}

.dropdown-item.active {
  background-color: #34495e;
  border-left-color: #008DF7;
}

.dropdown-item.active .submenu-icon {
  color: #008DF7;
}

.submenu-icon {
  font-size: 6px;
  color: #7f8c8d;
  transition: color 0.3s ease;
}

.submenu-text {
  font-size: 13px;
  color: #ecf0f1;
  transition: color 0.3s ease;
}

.dropdown-item.active .submenu-text {
  color: #008DF7;
  font-weight: 500;
}

/* Scrollbar Styles */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: #2c3e50;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #008DF7;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #0077cc;
}
</style>