<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-header">
        <h1>欢迎登录</h1>
        <p>请输入您的账号和密码</p>
      </div>
      
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">账号</label>
          <input 
            type="text" 
            id="username" 
            class="form-control" 
            placeholder="请输入用户名或邮箱"
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
        
        <div class="remember-forgot">
          <div class="remember-me">
            <input type="checkbox" id="rememberMe" v-model="rememberMe">
            <label for="rememberMe">记住密码</label>
          </div>
          <a href="#" class="forgot-password" @click.prevent>忘记密码?</a>
        </div>
        
        <button type="submit" class="login-btn">登录</button>
        
        <div class="signup-link">
          没有账号? <a href="#" @click.prevent>立即注册</a>
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
// TODO: 当后端接口准备好后，取消下面的注释
// import { login, handleApiError } from '@/api/user'

const emit = defineEmits(['login-success'])

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const usernameError = ref('')
const passwordError = ref('')
const showAlert = ref(false)
const alertMessage = ref('')
const isLoading = ref(false)

// 模拟的账号数据库
const validAccounts = [
  { username: '123', password: '123' }
]

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
  }
}

const handleSubmit = () => {
  // 重置错误信息
  usernameError.value = ''
  passwordError.value = ''
  
  // 验证输入
  let isValid = true
  
  if (username.value.trim() === '') {
    usernameError.value = '请输入账号'
    isValid = false
  }
  
  if (password.value === '') {
    passwordError.value = '请输入密码'
    isValid = false
  }
  
  if (!isValid) {
    return
  }
  
  // 查找账号是否存在
  const account = validAccounts.find(acc => acc.username === username.value.trim())
  
  if (!account) {
    // 账号不存在
    showAlertMessage('账号不存在，请检查输入')
    return
  }
  
  // 检查密码是否正确
  if (account.password !== password.value) {
    // 密码错误
    showAlertMessage('密码错误，请重新输入')
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
  
  // 显示加载提示
  isLoading.value = true
  
  /* 
   * TODO: 当后端接口准备好后，可以使用以下代码进行真实的 API 调用
   * 
   * try {
   *   const result = await login({
   *     username: username.value.trim(),
   *     password: password.value
   *   })
   *   
   *   if (result.success) {
   *     // 保存 token
   *     localStorage.setItem('token', result.data.token)
   *     // 保存用户信息
   *     localStorage.setItem('userInfo', JSON.stringify(result.data))
   *     
   *     // 触发登录成功事件，传递完整的用户信息
   *     emit('login-success', {
   *       username: result.data.username,
   *       name: result.data.name,
   *       email: result.data.email,
   *       avatar: result.data.avatar,
   *       role: result.data.role,
   *       token: result.data.token
   *     })
   *   }
   * } catch (error) {
   *   isLoading.value = false
   *   handleApiError(error)
   *   showAlertMessage(error.message || '登录失败，请稍后重试')
   * }
   */
  
  // 当前使用模拟登录，延时800ms后触发登录成功事件
  setTimeout(() => {
    emit('login-success', {
      username: username.value.trim(),
      // 这里预留更多用户信息字段，等待后端接口对接
      // name: account.name,
      // email: account.email,
      // avatar: account.avatar,
      // role: account.role
    })
  }, 800)
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
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.login-header {
  background: linear-gradient(to right, #6a11cb, #2575fc);
  color: white;
  padding: 25px 20px;
  text-align: center;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.login-header p {
  opacity: 0.9;
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
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
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
  color: #6a11cb;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(to right, #6a11cb, #2575fc);
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
  box-shadow: 0 5px 15px rgba(106, 17, 203, 0.4);
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
  color: #6a11cb;
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
  background: linear-gradient(to right, #6a11cb, #2575fc);
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
  box-shadow: 0 5px 15px rgba(106, 17, 203, 0.4);
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
}
</style>

