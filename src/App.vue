<template>
  <div id="app">
    <LoginPage v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
    <DashboardPage v-else :user="currentUser" @logout="handleLogout" ref="dashboardPage" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import DashboardPage from './components/DashboardPage.vue'

const isLoggedIn = ref(false)
const currentUser = ref(null)

onMounted(() => {
  const saved = localStorage.getItem('currentUser')
  if (saved) {
    currentUser.value = JSON.parse(saved)
    isLoggedIn.value = !!currentUser.value
  }
})

const handleLoginSuccess = (userInfo) => {
  isLoggedIn.value = true
  currentUser.value = userInfo || null
  localStorage.setItem('currentUser', JSON.stringify(userInfo || null))
}

const handleLogout = () => {
  isLoggedIn.value = false
  currentUser.value = null
  // 清除本地存储的登录信息
  localStorage.removeItem('savedUsername')
  localStorage.removeItem('savedPassword')
  localStorage.removeItem('currentUser')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

#app {
  min-height: 100vh;
}
</style>