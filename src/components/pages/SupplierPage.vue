<template>
  <div class="supplier-page">
    <div class="toolbar">
      <h3>供应商管理</h3>
      <button @click="openCreate">新增供应商</button>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>名称</th>
          <th>联系人</th>
          <th>电话</th>
          <th>等级</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in suppliers" :key="row.id">
          <td>{{ row.name }}</td>
          <td>{{ row.contact }}</td>
          <td>{{ row.phone }}</td>
          <td>{{ row.level }}</td>
          <td>{{ row.status }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="createVisible" class="modal-mask" @click.self="closeCreate">
      <div class="modal-card">
        <h3>新增供应商</h3>
        <div class="field"><label>名称</label><input v-model="form.name" /></div>
        <div class="field"><label>联系人</label><input v-model="form.contact" /></div>
        <div class="field"><label>电话</label><input v-model="form.phone" /></div>
        <div class="field"><label>等级</label><select v-model="form.level"><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
        <div class="field"><label>状态</label><input v-model="form.status" /></div>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions"><button @click="submitCreate">保存</button><button @click="closeCreate">取消</button></div>
      </div>
    </div>
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { onMounted, reactive, ref } from 'vue'
import { createSupplier, fetchSuppliers } from '@/api'

defineProps({
  pageName: {
    type: String,
    default: '供应商管理'
  }
})

const suppliers = ref([])
const createVisible = ref(false)
const error = ref('')
const message = ref('')
let timer = null
const form = reactive({ name: '', contact: '', phone: '', level: 'C', status: '合作中' })

const loadData = async () => {
  const res = await fetchSuppliers()
  suppliers.value = res?.data || []
}

const showMessage = (text) => {
  message.value = text
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    message.value = ''
  }, 1800)
}

const openCreate = () => {
  createVisible.value = true
  error.value = ''
}

const closeCreate = () => {
  createVisible.value = false
}

const submitCreate = async () => {
  if (!form.name || !form.contact || !form.phone) {
    error.value = '名称、联系人、电话为必填'
    return
  }
  await createSupplier({ ...form })
  Object.assign(form, { name: '', contact: '', phone: '', level: 'C', status: '合作中' })
  closeCreate()
  await loadData()
  showMessage('供应商新增成功')
}

onMounted(loadData)
</script>

<style scoped>
.supplier-page {
  padding: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.toolbar button {
  height: 32px;
  border: 1px solid #d5deea;
  background: #fff;
  border-radius: 6px;
  padding: 0 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  border-bottom: 1px solid #e9edf3;
  text-align: left;
  padding: 10px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal-card {
  width: 420px;
  background: #fff;
  border-radius: 10px;
  padding: 14px;
}

.field {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.field label {
  width: 60px;
}

.field input,
.field select {
  flex: 1;
  height: 32px;
  border: 1px solid #d5deea;
  border-radius: 6px;
  padding: 0 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.actions button {
  height: 32px;
  border: 1px solid #d5deea;
  border-radius: 6px;
  padding: 0 12px;
  background: #fff;
}

.error {
  color: #de5050;
  font-size: 12px;
  margin-bottom: 8px;
}

.message {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: #2f7df7;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}
</style>


