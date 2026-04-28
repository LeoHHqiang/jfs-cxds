<template>
  <main class="main-content">
    <div class="toolbar">
      <div class="toolbar-left">
        <input class="input" v-model="filters.keyword" placeholder="账号/显示名" />
        <select class="select" v-model="filters.role">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select class="select" v-model="filters.status">
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="disabled">禁用</option>
        </select>
        <button class="btn btn-primary" @click="onQuery">查询</button>
        <button class="btn" @click="onReset">重置</button>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ 新增账号</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>账号</th>
            <th>显示名</th>
            <th>角色</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="center">加载中...</td></tr>
          <tr v-else-if="!list.length"><td colspan="5" class="center">暂无账号</td></tr>
          <tr v-for="item in list" :key="item.id">
            <td>{{ item.account }}</td>
            <td>{{ item.profile?.displayName || item.account }}</td>
            <td>{{ roleText[item.role] || item.role }}</td>
            <td>
              <span :class="['status', item.status]">{{ statusText[item.status] || item.status }}</span>
            </td>
            <td>
              <button class="link" @click="toggleStatus(item)" :disabled="item.role==='admin'">
                {{ item.status === 'active' ? '禁用' : '启用' }}
              </button>
              <button class="link" @click="resetPwd(item)">重置密码</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="createVisible" class="modal-mask" @click.self="closeCreate">
      <div class="modal-card">
        <h3>新增账号</h3>
        <div class="field"><label>账号</label><input v-model="form.account" placeholder="字母+数字" /></div>
        <div class="field"><label>密码</label><input v-model="form.password" type="password" placeholder="至少6位" /></div>
        <div class="field"><label>角色</label>
          <select v-model="form.role">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button class="btn btn-primary" @click="submitCreate">保存</button>
          <button class="btn" @click="closeCreate">取消</button>
        </div>
      </div>
    </div>
    <div v-if="toast" class="toast">{{ toast }}</div>
  </main>
</template>

<script setup>
/* eslint-disable */
import { onMounted, reactive, ref } from 'vue'
import { adminCreateUser, adminResetUserPassword, adminToggleUserStatus, getUserList } from '@/api'

const list = ref([])
const loading = ref(false)
const createVisible = ref(false)
const error = ref('')
const toast = ref('')
let timer = null

const filters = reactive({ keyword: '', role: '', status: '' })
const form = reactive({ account: '', password: '', role: 'user' })

const roleText = { admin: '管理员', user: '普通用户' }
const statusText = { active: '启用', disabled: '禁用' }

const showToast = (text) => {
  toast.value = text
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    toast.value = ''
  }, 1800)
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserList({ page: 1, size: 999, ...filters })
    list.value = res?.data?.list || []
  } finally {
    loading.value = false
  }
}

const onQuery = async () => {
  await loadData()
}

const onReset = async () => {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  await loadData()
}

const openCreate = () => {
  createVisible.value = true
  error.value = ''
}

const closeCreate = () => {
  createVisible.value = false
}

const submitCreate = async () => {
  const res = await adminCreateUser({ ...form })
  if (!res.success) {
    error.value = res.message || '新增失败'
    return
  }
  form.account = ''
  form.password = ''
  form.role = 'user'
  closeCreate()
  await loadData()
  showToast('新增账号成功')
}

const toggleStatus = async (item) => {
  const next = item.status === 'active' ? 'disabled' : 'active'
  const res = await adminToggleUserStatus({ account: item.account, status: next })
  if (!res.success) {
    showToast(res.message || '操作失败')
    return
  }
  await loadData()
  showToast('状态更新成功')
}

const resetPwd = async (item) => {
  const res = await adminResetUserPassword({ account: item.account, newPassword: '123456a' })
  showToast(res.success ? `已重置 ${item.account} 密码为 123456a` : (res.message || '重置失败'))
}

onMounted(loadData)
</script>

<style scoped>
.main-content { padding: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.input,.select { height: 32px; border: 1px solid #dcdfe6; border-radius: 6px; padding: 0 8px; }
.input { width: 220px; }
.btn { height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid #dcdfe6; background: #fff; cursor: pointer; }
.btn-primary { background: #3a7afe; color: #fff; border-color: #3a7afe; }
.card { background: #fff; border: 1px solid #eef0f3; border-radius: 8px; }
.table { width: 100%; border-collapse: collapse; }
.table th,.table td { border-bottom: 1px solid #f0f0f0; padding: 10px 12px; text-align: left; }
.center { text-align: center; color: #909399; }
.status { padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.status.active { background: #e7f8ef; color: #1b8f4a; }
.status.disabled { background: #ffeaea; color: #d14b4b; }
.link { border: none; background: transparent; color: #2f6bff; cursor: pointer; margin-right: 8px; }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 1200; }
.modal-card { width: 420px; background: #fff; border-radius: 10px; padding: 16px; }
.field { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
.field label { width: 70px; }
.field input,.field select { flex: 1; height: 32px; border: 1px solid #d5deea; border-radius: 6px; padding: 0 8px; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.error { color: #de5050; font-size: 12px; }
.toast { position: fixed; right: 24px; bottom: 24px; background: #2f7df7; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; }
</style>
