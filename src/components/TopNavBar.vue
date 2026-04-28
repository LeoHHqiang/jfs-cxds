<template>
  <div class="top-nav-bar">
    <div class="nav-content">
      <div class="nav-left">
        <i :class="currentIcon"></i>
        <h2 class="nav-title"><span class="current-page">{{ currentPage }}</span></h2>
      </div>
      <div class="nav-right">
        <div class="user-info">
          <i class="fas fa-user-circle"></i>
          <span>{{ username || '游客' }}</span>
        </div>
        
        <div class="settings-container">
          <button class="settings-btn" @click="toggleSettings">
            <i class="fas fa-cog"></i>
          </button>
          
          <div v-if="showSettings" class="settings-dropdown" @click.stop>
            <ul class="settings-menu">
              <li @click="handleSettings('personal')">
                <i class="fas fa-user"></i>
                <span>个人设置</span>
              </li>
              <li @click="handleSettings('password')">
                <i class="fas fa-lock"></i>
                <span>修改密码</span>
              </li>
              <li v-if="isAdmin" @click="handleSettings('system')">
                <i class="fas fa-cogs"></i>
                <span>系统设置</span>
              </li>
              <li class="divider"></li>
              <li @click="handleSettings('logout')" class="logout-item">
                <i class="fas fa-sign-out-alt"></i>
                <span>退出登录</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { defineProps, defineEmits, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  currentPage: {
    type: String,
    default: '首页'
  },
  currentIcon: {
    type: String,
    default: 'fas fa-home'
  },
  username: {
    type: String,
    default: '游客'
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['logout', 'settings-action'])

const showSettings = ref(false)

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const handleSettings = (action) => {
  console.log('设置操作:', action)
  showSettings.value = false
  
  // 发送设置操作事件
  emit('settings-action', action)
  
  // 如果是退出登录，触发退出事件
  if (action === 'logout') {
    emit('logout')
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.settings-container')) {
    showSettings.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.top-nav-bar {
  background: linear-gradient(90deg, #7ebef6, #9fd9ff);
  height: 71px;
  width: 100%;
  box-shadow: 0 2px 10px rgba(84, 137, 191, 0.24);
  flex-shrink: 0;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 30px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-left i {
  font-size: 20px;
  color: white;
}

.nav-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.current-page {
  color: white;
  font-size: 14px;
  margin-right: 20px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
}

.user-info i {
  font-size: 22px;
}

.settings-container {
  position: relative;
}

.settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 18px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background-color: rgba(255, 255, 255, 0.22);
}

.settings-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(83, 130, 176, 0.25);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
}

.settings-menu {
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.settings-menu li {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333;
  font-size: 14px;
}

.settings-menu li:hover:not(.divider) {
  background-color: #edf6ff;
}

.settings-menu li i {
  width: 20px;
  text-align: center;
  color: #666;
}

.settings-menu li span {
  flex: 1;
}

.settings-menu .divider {
  height: 1px;
  background-color: #e0e0e0;
  padding: 0;
  margin: 8px 0;
  cursor: default;
}

.logout-item {
  color: #e74c3c;
}

.logout-item i {
  color: #e74c3c;
}

.logout-item:hover {
  background-color: #ffeaea !important;
}
</style>
