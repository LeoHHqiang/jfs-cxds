<template>
  <div class="login-wrapper">
    <div class="mold-decor mold-left-top"></div>
    <div class="mold-decor mold-left-bottom"></div>
    <div class="mold-decor mold-right-top"></div>
    <div class="mold-decor mold-right-bottom"></div>
    <div class="login-container">
      <div class="login-header">
        <h1>{{ isRegisterMode ? '账号注册' : '欢迎登录' }}</h1>
        <p>{{ isRegisterMode ? '请设置账号和密码（账号需字母+数字）' : '请输入您的账号和密码' }}</p>
      </div>
      
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">账号</label>
          <input 
            type="text" 
            id="username" 
            class="form-control" 
            placeholder="请输入账号（字母+数字）"
            v-model="username"
            @input="clearError('usernameError')"
          >
          <div class="error-message" :style="{ display: usernameError ? 'block' : 'none' }">
            {{ usernameError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            class="form-control" 
            placeholder="请输入密码"
            v-model="password"
            @input="clearError('passwordError')"
          >
          <div class="error-message" :style="{ display: passwordError ? 'block' : 'none' }">
            {{ passwordError }}
          </div>
        </div>

        <div v-if="isRegisterMode" class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            class="form-control"
            placeholder="请再次输入密码"
            v-model="confirmPassword"
            @input="clearError('confirmPasswordError')"
          >
          <div class="error-message" :style="{ display: confirmPasswordError ? 'block' : 'none' }">
            {{ confirmPasswordError }}
          </div>
        </div>
        
        <div class="remember-forgot">
          <div class="remember-me">
            <input type="checkbox" id="rememberMe" v-model="rememberMe">
            <label for="rememberMe">记住密码</label>
          </div>
          <span class="forgot-password disabled">忘记密码暂未开放</span>
        </div>
        
        <button type="submit" class="login-btn">{{ isRegisterMode ? '注册' : '登录' }}</button>
        
        <div class="signup-link">
          {{ isRegisterMode ? '已有账号?' : '没有账号?' }}
          <a href="#" @click.prevent="toggleMode">{{ isRegisterMode ? '返回登录' : '立即注册' }}</a>
        </div>
      </form>
    </div>

    <!-- 警告弹窗 -->
    <div v-if="showAlert" class="alert-overlay" @click="closeAlert">
      <div class="alert-box" @click.stop>
        <div class="alert-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="alert-message">{{ alertMessage }}</div>
        <button class="alert-btn" @click="closeAlert">确定</button>
      </div>
    </div>

    <!-- 登录成功加载提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-box">
        <div class="loading-spinner">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="loading-message">登录成功！正在跳转...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { ref, onMounted } from 'vue'
import { login, register } from '@/api'

const emit = defineEmits(['login-success'])

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const rememberMe = ref(false)
const usernameError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const showAlert = ref(false)
const alertMessage = ref('')
const isLoading = ref(false)
const isRegisterMode = ref(false)

const ACCOUNT_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/

// 检查是否有保存的登录信息
onMounted(() => {
  const savedUsername = localStorage.getItem('savedUsername')
  const savedPassword = localStorage.getItem('savedPassword')
  if (savedUsername && savedPassword) {
    username.value = savedUsername
    password.value = savedPassword
    rememberMe.value = true
  }
})

const clearError = (errorType) => {
  if (errorType === 'usernameError') {
    usernameError.value = ''
  } else if (errorType === 'passwordError') {
    passwordError.value = ''
  } else if (errorType === 'confirmPasswordError') {
    confirmPasswordError.value = ''
  }
}

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  usernameError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
}

const handleSubmit = async () => {
  // 重置错误信息
  usernameError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  
  // 验证输入
  let isValid = true
  
  const account = username.value.trim()
  if (account === '') {
    usernameError.value = '请输入账号'
    isValid = false
  } else if (!ACCOUNT_PATTERN.test(account)) {
    usernameError.value = '账号必须为字母+数字'
    isValid = false
  }
  
  if (password.value === '') {
    passwordError.value = '请输入密码'
    isValid = false
  }

  if (isRegisterMode.value) {
    if (password.value.length < 6) {
      passwordError.value = '密码至少 6 位'
      isValid = false
    }
    if (confirmPassword.value !== password.value) {
      confirmPasswordError.value = '两次密码不一致'
      isValid = false
    }
  }
  
  if (!isValid) {
    return
  }
  
  if (isRegisterMode.value) {
    const registerResult = await register({ account, password: password.value })
    if (!registerResult.success) {
      showAlertMessage(registerResult.message || '注册失败')
      return
    }
    showAlertMessage('注册成功，请使用新账号登录')
    isRegisterMode.value = false
    confirmPassword.value = ''
    return
  }
  
  // 登录成功
  // 如果勾选了"记住密码"，保存到本地存储
  if (rememberMe.value) {
    localStorage.setItem('savedUsername', username.value)
    localStorage.setItem('savedPassword', password.value)
  } else {
    // 如果没有勾选，清除保存的信息
    localStorage.removeItem('savedUsername')
    localStorage.removeItem('savedPassword')
  }
  
  const loginResult = await login({ account, password: password.value })
  if (!loginResult.success) {
    showAlertMessage(loginResult.message || '登录失败')
    return
  }
  isLoading.value = true
  setTimeout(() => {
    emit('login-success', loginResult.data)
  }, 600)
}

const showAlertMessage = (message) => {
  alertMessage.value = message
  showAlert.value = true
}

const closeAlert = () => {
  showAlert.value = false
}
</script>

<style scoped>
.login-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at 25% 22%, #eef7ff 0%, #d9ecff 34%, #b8d8ff 100%);
  padding: 20px;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 430px;
  background-color: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(156, 199, 244, 0.55);
  box-shadow: 0 20px 36px rgba(70, 130, 193, 0.2);
  overflow: hidden;
}

.login-header {
  background: linear-gradient(90deg, #7cbcf5, #9dd9ff);
  color: white;
  padding: 24px 20px;
  text-align: center;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.login-header p {
  opacity: 0.95;
  font-size: 14px;
}

.login-form {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #455466;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #c7d8ec;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.25s;
  background: #fbfdff;
  color: #334155;
}

.form-control:focus {
  border-color: #6aaef4;
  box-shadow: 0 0 0 2px rgba(106, 174, 244, 0.22);
  outline: none;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  margin-right: 8px;
}

.forgot-password {
  color: #4f8fcd;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.forgot-password.disabled {
  color: #9aa8b8;
  cursor: not-allowed;
  text-decoration: none;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(to right, #7ebef6, #98d6ff);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 18px rgba(85, 157, 224, 0.35);
}

.error-message {
  color: #e74c3c;
  font-size: 13px;
  margin-top: 5px;
}

.signup-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.signup-link a {
  color: #4f8fcd;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}

/* 警告弹窗样式 */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.alert-box {
  background: white;
  border-radius: 12px;
  padding: 30px 40px;
  min-width: 320px;
  max-width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-icon {
  margin-bottom: 20px;
}

.alert-icon i {
  font-size: 48px;
  color: #e74c3c;
}

.alert-message {
  font-size: 16px;
  color: #333;
  margin-bottom: 24px;
  line-height: 1.5;
}

.alert-btn {
  background: linear-gradient(to right, #7ebef6, #98d6ff);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.alert-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(85, 157, 224, 0.35);
}

/* 登录成功加载提示样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-box {
  background: white;
  border-radius: 12px;
  padding: 30px 40px;
  min-width: 280px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

.loading-spinner {
  margin-bottom: 20px;
}

.loading-spinner i {
  font-size: 48px;
  color: #27ae60;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.loading-message {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.mold-decor {
  position: absolute;
  border-radius: 999px;
  background: linear-gradient(145deg, rgba(231, 243, 255, 0.9), rgba(167, 207, 244, 0.7));
  box-shadow: inset -10px -10px 22px rgba(255, 255, 255, 0.7), inset 10px 10px 24px rgba(123, 170, 216, 0.3), 0 12px 30px rgba(104, 154, 205, 0.22);
}

.mold-decor::before,
.mold-decor::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  border: 10px solid rgba(214, 235, 255, 0.92);
  box-shadow: inset -4px -4px 10px rgba(255, 255, 255, 0.75), inset 3px 3px 8px rgba(111, 160, 209, 0.18);
}

.mold-left-top {
  width: 240px;
  height: 150px;
  top: 34px;
  left: -76px;
  transform: rotate(-18deg);
}

.mold-left-top::before {
  width: 54px;
  height: 54px;
  right: 28px;
  top: 18px;
}

.mold-left-top::after {
  width: 44px;
  height: 44px;
  right: 88px;
  top: 72px;
}

.mold-left-bottom {
  width: 248px;
  height: 160px;
  bottom: 38px;
  left: -92px;
  transform: rotate(18deg);
}

.mold-left-bottom::before {
  width: 48px;
  height: 48px;
  left: 30px;
  top: 20px;
}

.mold-left-bottom::after {
  width: 64px;
  height: 64px;
  left: 118px;
  bottom: 16px;
}

.mold-right-top {
  width: 260px;
  height: 156px;
  top: 64px;
  right: -92px;
  transform: rotate(20deg);
}

.mold-right-top::before {
  width: 58px;
  height: 58px;
  left: 24px;
  top: 22px;
}

.mold-right-top::after {
  width: 44px;
  height: 44px;
  left: 94px;
  top: 84px;
}

.mold-right-bottom {
  width: 316px;
  height: 200px;
  right: -136px;
  bottom: -46px;
}

.mold-right-bottom::before {
  width: 120px;
  height: 120px;
  left: 34px;
  top: 26px;
}

.mold-right-bottom::after {
  width: 56px;
  height: 56px;
  left: 168px;
  top: 90px;
}

@media (max-width: 480px) {
  .login-container {
    max-width: 100%;
  }
  
  .login-form {
    padding: 20px;
  }

  .alert-box {
    min-width: 280px;
    padding: 24px 30px;
  }

  .mold-decor {
    display: none;
  }
}
</style>

