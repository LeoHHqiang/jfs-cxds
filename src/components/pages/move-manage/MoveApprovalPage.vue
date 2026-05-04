<template>
  <section class="approval-page">
    <div class="search-card">
      <div class="search-actions">
        <button class="btn btn-primary" @click="loadList">查询</button>
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
            <option value="">待审批 / 已通过</option>
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
          <tr v-else-if="!rows.length">
            <td colspan="10" class="empty-row">暂无待处理数据</td>
          </tr>
          <tr v-for="row in rows" :key="row.id">
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
              <button class="link-btn" type="button" @click="openView(row)">查看</button>
              <template v-if="row.status === 'pending'">
                <button class="link-btn ok" type="button" @click="onApprove(row)">通过</button>
                <button class="link-btn danger" type="button" @click="onReject(row)">驳回</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="viewOpen" class="modal-mask" @click.self="viewOpen = false">
      <div class="modal-sheet">
        <div class="modal-head">
          <h3>移模审批 · {{ viewRow?.applyNo }}</h3>
          <button type="button" class="icon-close" @click="viewOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <p v-if="viewRow?.meta?.title" class="meta-line"><strong>标题：</strong>{{ viewRow.meta.title }}</p>
          <h4>明细（已操作 · 待审批/已通过）</h4>
          <table class="inner-table">
            <thead>
              <tr>
                <th>零件编号</th>
                <th>工装名称</th>
                <th>原所在地</th>
                <th>移模至</th>
                <th>行状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in visibleLines" :key="d.id">
                <td>{{ d.partNo }}</td>
                <td>{{ d.toolName }}</td>
                <td class="wrap">{{ d.fromLocation }}</td>
                <td class="wrap">{{ d.toLocation }}</td>
                <td>{{ lineStatusText[d.lineStatus] || d.lineStatus }}</td>
              </tr>
              <tr v-if="!visibleLines.length">
                <td colspan="5" class="muted center">无符合展示的明细</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-foot">
          <button class="btn btn-light" type="button" @click="viewOpen = false">关闭</button>
          <template v-if="viewRow?.status === 'pending'">
            <button class="btn btn-primary" type="button" @click="onApprove(viewRow)">通过</button>
            <button class="btn danger-outline" type="button" @click="onReject(viewRow)">驳回</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </section>
</template>

<script setup>
/* eslint-disable */
import { computed, onMounted, reactive, ref } from 'vue'
import {
  approveMoveApply,
  fetchMoveApplyList,
  filterVisibleMoveApplyDetails,
  rejectMoveApply
} from '@/api'

defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

const loading = ref(false)
const rows = ref([])
const viewOpen = ref(false)
const viewRow = ref(null)
const toast = ref('')
let toastTimer = null

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

const lineStatusText = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  draft: '草稿'
}

const visibleLines = computed(() =>
  filterVisibleMoveApplyDetails(viewRow.value?.details, viewRow.value?.status)
)

function showToast(text) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2000)
}

async function loadList() {
  loading.value = true
  try {
    const q = { ...filters }
    if (filters.status === 'rejected') q.includeRejected = true
    const res = await fetchMoveApplyList(q)
    rows.value = res?.data?.list || []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.keys(filters).forEach((k) => {
    filters[k] = ''
  })
  loadList()
}

function openView(row) {
  viewRow.value = row
  viewOpen.value = true
}

async function onApprove(row) {
  const res = await approveMoveApply({ id: row.id })
  if (!res.success) {
    showToast(res.message || '操作失败')
    return
  }
  showToast('已通过')
  viewOpen.value = false
  await loadList()
}

async function onReject(row) {
  if (!window.confirm(`确定驳回申请「${row.applyNo}」？`)) return
  const res = await rejectMoveApply({ id: row.id })
  if (!res.success) {
    showToast(res.message || '操作失败')
    return
  }
  showToast('已驳回')
  viewOpen.value = false
  await loadList()
}

onMounted(loadList)
</script>

<style scoped>
.approval-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px;
}

.search-card {
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  padding: 10px 12px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
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
  flex: 1;
  height: 30px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
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

.danger-outline {
  border-color: #f0a0a0;
  color: #c0392b;
}

.table-card {
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
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
  font-weight: 600;
}

.empty-row {
  text-align: center !important;
  color: #8a9bb1;
  padding: 16px !important;
}

.action-col {
  width: 140px;
}

.link-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  margin-right: 6px;
  padding: 0;
  font-size: 12px;
  color: #2f7df7;
}

.link-btn.ok {
  color: #1b8f4a;
}

.link-btn.danger {
  color: #d14b4b;
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
  padding: 16px;
}

.modal-sheet {
  width: min(800px, 100%);
  max-height: 90vh;
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e8eef6;
}

.modal-head h3 {
  margin: 0;
  font-size: 15px;
}

.icon-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #8898aa;
}

.modal-body {
  padding: 14px 16px;
  overflow-y: auto;
}

.meta-line {
  margin: 0 0 10px;
  font-size: 13px;
  color: #4f647f;
}

.modal-body h4 {
  margin: 12px 0 8px;
  font-size: 13px;
  color: #2f7df7;
}

.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.inner-table th,
.inner-table td {
  border: 1px solid #e8eef6;
  padding: 8px;
}

.inner-table th {
  background: #f8fbff;
}

.wrap {
  white-space: normal;
  max-width: 200px;
}

.muted {
  color: #8a9bb1;
}

.center {
  text-align: center;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e8eef6;
}

.toast {
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
