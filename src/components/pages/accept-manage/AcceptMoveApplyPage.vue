<template>
  <section class="move-apply-page">
    <div class="toolbar-card">
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 新建移模申请</button>
        <button class="btn btn-light" @click="showMessage('已触发导出')">导出 Excel</button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-actions">
        <button class="btn btn-primary" @click="fetchMoveApplyList">查询</button>
        <button class="btn btn-light" @click="resetFilters">重置</button>
      </div>
      <div class="form-grid">
        <div class="form-item"><label>零件名称：</label><input v-model="filters.partName" placeholder="请输入" /></div>
        <div class="form-item"><label>零件编号：</label><input v-model="filters.partNo" placeholder="请输入" /></div>
        <div class="form-item"><label>工装名称：</label><input v-model="filters.toolName" placeholder="请输入" /></div>
        <div class="form-item"><label>供应商：</label><input v-model="filters.supplier" placeholder="请输入" /></div>
        <div class="form-item"><label>新供应商：</label><input v-model="filters.newSupplier" placeholder="请输入" /></div>
        <div class="form-item">
          <label>申请状态：</label>
          <select v-model="filters.status">
            <option value="">请选择</option>
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>申请单号</th>
            <th>零件名称</th>
            <th>零件编号</th>
            <th>工装名称</th>
            <th>原供应商</th>
            <th>新供应商</th>
            <th>申请人</th>
            <th>申请时间</th>
            <th>状态</th>
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="!tableData.length">
            <td colspan="10" class="empty-row">暂无移模申请数据</td>
          </tr>
          <tr v-for="row in tableData" :key="row.id">
            <td>{{ row.applyNo }}</td>
            <td>{{ row.partName }}</td>
            <td>{{ row.partNo }}</td>
            <td>{{ row.toolName }}</td>
            <td>{{ row.fromSupplier }}</td>
            <td>{{ row.toSupplier }}</td>
            <td>{{ row.applicant }}</td>
            <td>{{ row.applyTime }}</td>
            <td>
              <span class="status-tag" :class="row.status">{{ statusText[row.status] || row.status }}</span>
            </td>
            <td class="action-col">
              <button class="link-btn" @click="viewDetail(row)">查看</button>
              <button class="link-btn" @click="editApply(row)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="createVisible" class="modal-mask" @click.self="closeCreateModal">
      <div class="modal-card">
        <h3>新建移模申请</h3>
        <div class="modal-grid">
          <input v-model="createForm.partName" placeholder="零件名称" />
          <input v-model="createForm.partNo" placeholder="零件编号" />
          <input v-model="createForm.toolName" placeholder="工装名称" />
          <input v-model="createForm.fromSupplier" placeholder="原供应商" />
          <input v-model="createForm.toSupplier" placeholder="新供应商" />
          <input v-model="createForm.applicant" placeholder="申请人" />
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="submitCreate">保存</button>
          <button class="btn btn-light" @click="closeCreateModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="message" class="message">{{ message }}</div>
  </section>
</template>

<script setup>
/* eslint-disable */
import { onMounted, reactive, ref } from 'vue'
import { createMoveApply, fetchMoveApplyList as fetchMoveApplyData } from '@/api'

const loading = ref(false)
const tableData = ref([])
const createVisible = ref(false)
const formError = ref('')
const message = ref('')
let messageTimer = null

const filters = reactive({
  partName: '',
  partNo: '',
  toolName: '',
  supplier: '',
  newSupplier: '',
  status: ''
})

const statusText = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回'
}

const createForm = reactive({
  partName: '',
  partNo: '',
  toolName: '',
  fromSupplier: '',
  toSupplier: '',
  applicant: ''
})

onMounted(() => {
  fetchMoveApplyList()
})

async function fetchMoveApplyList() {
  loading.value = true
  try {
    const res = await fetchMoveApplyData({ ...filters })
    tableData.value = res?.data?.list || []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
  fetchMoveApplyList()
}

function viewDetail(row) {
  showMessage(`查看移模申请：${row.applyNo}`)
}

function editApply(row) {
  showMessage(`编辑移模申请：${row.applyNo}`)
}

function showMessage(text) {
  message.value = text
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 1800)
}

function openCreateModal() {
  createVisible.value = true
  formError.value = ''
}

function closeCreateModal() {
  createVisible.value = false
  formError.value = ''
}

async function submitCreate() {
  if (!createForm.partName || !createForm.partNo || !createForm.toolName || !createForm.fromSupplier || !createForm.toSupplier || !createForm.applicant) {
    formError.value = '请完整填写必填项'
    return
  }
  await createMoveApply({ ...createForm })
  Object.keys(createForm).forEach((key) => {
    createForm[key] = ''
  })
  closeCreateModal()
  await fetchMoveApplyList()
  showMessage('移模申请创建成功')
}
</script>

<style scoped>
.move-apply-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f3f6fb;
  border: 1px solid #e4ebf4;
  border-radius: 10px;
  padding: 10px;
}

.toolbar-card,
.search-card,
.table-card {
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  padding: 10px 12px;
}

.toolbar-actions,
.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.search-actions {
  margin-bottom: 10px;
}

.btn {
  border: 1px solid #d5dfec;
  background: #fff;
  color: #536880;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  height: 30px;
  cursor: pointer;
}

.btn-primary {
  background: #2f7df7;
  color: #fff;
  border-color: #2f7df7;
}

.btn-light {
  background: #f7f9fc;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 14px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-item label {
  width: 82px;
  color: #60758e;
  font-size: 12px;
  flex-shrink: 0;
}

.form-item input,
.form-item select {
  width: 100%;
  height: 30px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 8px;
  color: #637891;
  font-size: 12px;
}

.table-card {
  padding: 0;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: #4f647f;
}

.data-table th,
.data-table td {
  border-bottom: 1px solid #e8eef6;
  padding: 9px 8px;
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  background: #f8fbff;
  color: #4b6079;
  font-weight: 600;
}

.empty-row {
  text-align: center !important;
  color: #8a9bb1;
  padding: 16px 0 !important;
}

.action-col {
  width: 90px;
}

.link-btn {
  border: none;
  background: transparent;
  color: #2f7df7;
  cursor: pointer;
  margin-right: 8px;
  padding: 0;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 24px;
  border-radius: 12px;
  font-size: 12px;
  padding: 0 8px;
}

.status-tag.pending {
  color: #cc8d14;
  background: #fff6df;
}

.status-tag.approved {
  color: #1b8f4a;
  background: #e7f8ef;
}

.status-tag.rejected {
  color: #d14b4b;
  background: #ffeaea;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal-card {
  width: 560px;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.modal-grid input {
  height: 34px;
  border: 1px solid #dbe4f0;
  border-radius: 6px;
  padding: 0 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.form-error {
  color: #de5050;
  margin-top: 10px;
  font-size: 12px;
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
  z-index: 1400;
}
</style>
