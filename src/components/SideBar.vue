<template>
  <aside class="sidebar scrollbar-like-sidebar">
    <div class="logo">
      <h1 class="logo-heading">
        <span class="logo-left">
          <i class="fas fa-toolbox logo-tool-icon" aria-hidden="true"></i>
          <span class="logo-title-text">模具管理系统</span>
        </span>
        <img
          class="logo-brand-img"
          src="/brand-jfseat-grammer.png"
          alt="JFSEAT · GRAMMER"
          loading="lazy"
        />
      </h1>
    </div>
    
    <ul class="menu">
      <li 
        v-for="item in resolvedMenuItems" 
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
import { computed, ref, watch } from 'vue'

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'home'
  },
  activeSubmenu: {
    type: String,
    default: ''
  },
  menuItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['menu-change', 'submenu-change'])

// 状态管理
const isDropdownOpen = ref(false)
const activeSubmenuState = ref('')

const defaultMenuItems = [
  { name: '首页', path: 'home', icon: 'fas fa-home' },
  { name: '验收管理', path: 'accept-approve', icon: 'fas fa-clipboard-check' },
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

const resolvedMenuItems = computed(() => {
  if (props.menuItems && props.menuItems.length) {
    return props.menuItems
  }
  return defaultMenuItems
})

const dropdownMenuPaths = computed(() => {
  return resolvedMenuItems.value.filter((item) => item.hasDropdown).map((item) => item.path)
})

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
    isDropdownOpen.value = dropdownMenuPaths.value.includes(menu)
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
  background: linear-gradient(180deg, #eaf5ff, #dceeff);
  color: #39506a;
  box-shadow: 2px 0 14px rgba(84, 137, 191, 0.16);
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #c9e0f5;
}

.logo {
  display: flex;
  height: 60px;
  background: linear-gradient(90deg, #7ebef6, #9fd9ff);
  align-items: center;
  padding: 0 6px 0 10px;
}

.logo h1.logo-heading {
  font-size: 0;
  display: flex;
  align-items: center;
  column-gap: 6px;
  color: #ffffff;
  margin: 0;
  flex-wrap: nowrap;
  line-height: 1;
  min-width: 0;
  width: 100%;
}

.logo-left {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1 1 0;
}

.logo h1.logo-heading .logo-tool-icon {
  flex-shrink: 0;
  color: #ffffff;
  font-size: 16px;
  width: 1em;
  text-align: center;
}

.logo-title-text {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  min-width: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* 黑底白标 PNG：靠右留白，左侧标题可放大 */
.logo-brand-img {
  height: 28px;
  width: auto;
  max-width: 92px;
  object-fit: contain;
  flex: 0 0 auto;
  display: block;
  mix-blend-mode: screen;
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
  background-color: #d8ecff;
  border-left-color: #5ea7ea;
}

.menu-item.has-dropdown {
  background-color: transparent;
}

.menu-item.has-dropdown.dropdown-open {
  background-color: #d7ebff;
  border-left-color: #5ea7ea;
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
  color: #87a4c4;
  transition: transform 0.3s ease;
}

.menu-item.dropdown-open .dropdown-arrow {
  transform: rotate(0deg);
  color: #5ea7ea;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.menu-item.active i,
.menu-item.dropdown-open i {
  color: #5ea7ea;
}

/* 下拉菜单样式 */
.dropdown-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #edf6ff;
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
  background-color: #dbeeff;
}

.dropdown-item.active {
  background-color: #cfe7ff;
  border-left-color: #5ea7ea;
}

.dropdown-item.active .submenu-icon {
  color: #5ea7ea;
}

.submenu-icon {
  font-size: 6px;
  color: #90a5bd;
  transition: color 0.3s ease;
}

.submenu-text {
  font-size: 13px;
  color: #3d5470;
  transition: color 0.3s ease;
}

.dropdown-item.active .submenu-text {
  color: #478ecf;
  font-weight: 500;
}

</style>