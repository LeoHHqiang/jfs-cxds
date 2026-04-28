<template>
  <section ref="pageRootRef" class="accept-item-page">
    <div class="toolbar-card">
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="openEntryModal('create')">+ 新建验收项</button>
        <button class="btn btn-purple">+ 下载验收模板</button>
        <button class="btn btn-indigo" @click="openImportModal">导入 Excel</button>
        <button class="btn btn-light">导出 Excel</button>
        <button class="btn btn-light" @click="openBatchDownloadModal">批量下载</button>
        <button class="btn btn-light danger" @click="openDeleteConfirm()">删除</button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-actions">
        <button class="btn btn-primary" @click="fetchAcceptItems">查询</button>
        <button class="btn btn-light" @click="resetFilters">重置</button>
      </div>

      <div class="form-grid">
        <div class="form-item"><label>零件名称：</label><input v-model="filters.partName" placeholder="请输入" /></div>
        <div class="form-item"><label>零件编号：</label><input v-model="filters.partNo" placeholder="请输入" /></div>
        <div class="form-item"><label>子零件名称：</label><input v-model="filters.childName" placeholder="请输入" /></div>
        <div class="form-item"><label>子零件编号：</label><input v-model="filters.childNo" placeholder="请输入" /></div>
        <div class="form-item"><label>工装名称：</label><input v-model="filters.toolName" placeholder="请输入" /></div>
        <div class="form-item">
          <label>工装分类：</label>
          <select v-model="filters.toolType"><option value="">请选择</option></select>
        </div>
        <div class="form-item"><label>供应商模具编号：</label><input v-model="filters.vendorToolNo" placeholder="请输入" /></div>
        <div class="form-item"><label>工装实物编号：</label><input v-model="filters.realToolNo" placeholder="请输入" /></div>
        <div class="form-item">
          <label>供应商：</label>
          <select v-model="filters.supplier"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>工装供应商：</label>
          <select v-model="filters.toolSupplier"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>零部件厂：</label>
          <select v-model="filters.partsFactory"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>采购负责人：</label>
          <select v-model="filters.purchaser"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>验收报告：</label>
          <select v-model="filters.acceptReport"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>材质证明：</label>
          <select v-model="filters.materialCert"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>上模图片：</label>
          <select v-model="filters.upperPhoto"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>下模图片：</label>
          <select v-model="filters.lowerPhoto"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>模具整体图片：</label>
          <select v-model="filters.overallPhoto"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>实物铭牌图片：</label>
          <select v-model="filters.nameplatePhoto"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>长：</label>
          <select v-model="filters.length"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>宽：</label>
          <select v-model="filters.width"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>高：</label>
          <select v-model="filters.height"><option value="">请选择</option></select>
        </div>
        <div class="form-item">
          <label>重量：</label>
          <select v-model="filters.weight"><option value="">请选择</option></select>
        </div>
      </div>
    </div>

    <div ref="tableCardRef" class="table-card" :style="tableCardStyle">
      <table class="data-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" :checked="isAllChecked" @change="toggleAllSelection($event.target.checked)" />
            </th>
            <th>零件名称</th>
            <th>零件编号</th>
            <th>子零件名称</th>
            <th>子零件编号</th>
            <th>工装名称</th>
            <th>工装分类</th>
            <th>工装（实物）编号</th>
            <th>供应商</th>
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="10" class="empty-row">加载中...</td></tr>
          <tr v-else-if="!tableData.length"><td colspan="10" class="empty-row">暂无验收项数据</td></tr>
          <tr v-for="row in pagedData" :key="row.id">
            <td class="checkbox-col">
              <input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleRowSelection(row.id)" />
            </td>
            <td>{{ row.partName }}</td>
            <td>{{ row.partNo }}</td>
            <td>{{ row.childName }}</td>
            <td>{{ row.childNo }}</td>
            <td>{{ row.toolName }}</td>
            <td>{{ row.toolType }}</td>
            <td>{{ row.realToolNo }}</td>
            <td>{{ row.supplier }}</td>
            <td class="action-col">
              <button class="link-btn" @click="openEntryModal('modify', row)">验收项修改</button>
              <button class="link-btn" @click="openEntryModal('input', row)">验收项录入</button>
              <button class="link-btn danger" @click="handleReplace(row)">工装补换</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div ref="tableFooterRef" class="table-footer">
      <span>显示第 {{ pageStart }} 到 {{ pageEnd }} 条记录，共 {{ pagination.total }} 条记录</span>
      <div class="pager">
        <span>跳转到</span>
        <input v-model.number="jumpPage" type="text" @keyup.enter="submitJumpPage" />
        <span>页</span>
        <button :disabled="pagination.pageNum===1" @click="goPage(1)">&lt;&lt;</button>
        <button :disabled="pagination.pageNum===1" @click="goPage(pagination.pageNum - 1)">&lt;</button>
        <button
          v-for="p in pageList"
          :key="`accept-item-${p}`"
          :class="{ active: p===pagination.pageNum }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button :disabled="pagination.pageNum===totalPages" @click="goPage(pagination.pageNum + 1)">&gt;</button>
        <button :disabled="pagination.pageNum===totalPages" @click="goPage(totalPages)">&gt;&gt;</button>
      </div>
    </div>

    <div v-if="entryModal.visible" class="modal-mask" @click.self="closeEntryModal">
      <div class="entry-modal">
        <div class="modal-header">
          <h3>{{ entryModal.title }}</h3>
          <button class="close-btn" @click="closeEntryModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid modal-grid">
            <div class="form-item"><label>零件名称：</label><input v-model="entryForm.partName" placeholder="请输入" /></div>
            <div class="form-item"><label>零件编号：</label><input v-model="entryForm.partNo" placeholder="请输入" /></div>
            <div class="form-item"><label>子零件名称：</label><input v-model="entryForm.childName" placeholder="请输入" /></div>
            <div class="form-item"><label>子零件编号：</label><input v-model="entryForm.childNo" placeholder="请输入" /></div>
            <div class="form-item"><label>工装名称：</label><input v-model="entryForm.toolName" placeholder="请输入" /></div>
            <div class="form-item"><label>工装分类：</label><input v-model="entryForm.toolType" placeholder="请选择" /></div>
            <div class="form-item"><label>工装实物编号：</label><input v-model="entryForm.realToolNo" placeholder="请输入" /></div>
            <div class="form-item"><label>供应商：</label><input v-model="entryForm.supplier" placeholder="请输入" /></div>
            <div class="form-item"><label>长（mm）：</label><input v-model="entryForm.length" placeholder="长" /></div>
            <div class="form-item"><label>宽（mm）：</label><input v-model="entryForm.width" placeholder="宽" /></div>
            <div class="form-item"><label>高（mm）：</label><input v-model="entryForm.height" placeholder="高" /></div>
            <div class="form-item"><label>重量（kg）：</label><input v-model="entryForm.weight" placeholder="重量" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveEntry">保存</button>
          <button class="btn btn-light" @click="closeEntryModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="importModal.visible" class="modal-mask" @click.self="closeImportModal">
      <div class="entry-modal import-modal">
        <div class="modal-header">
          <h3>excel批量导入</h3>
          <button class="close-btn" @click="closeImportModal">×</button>
        </div>
        <div class="modal-body">
          <label class="upload-panel">
            <input type="file" class="hidden-input" @change="pickImportFile" />
            <p class="upload-main">点击上传</p>
            <p class="upload-sub">JPEG, PNG, PDG, up to 50MB</p>
            <span class="folder-btn">打开文件夹</span>
          </label>
          <div v-if="importModal.fileName" class="upload-progress">
            <div class="file-title">{{ importModal.fileName }}</div>
            <div class="file-meta">{{ importModal.progress }} KB of {{ importModal.totalKb }} KB · {{ importModal.statusText }}</div>
            <div class="bar"><span :style="{ width: `${importModal.percent}%` }"></span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="confirmImport">确认</button>
          <button class="btn btn-light" @click="closeImportModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="batchDownloadModal" class="modal-mask" @click.self="batchDownloadModal=false">
      <div class="entry-modal batch-modal">
        <div class="modal-header">
          <h3>模板下载</h3>
          <button class="close-btn" @click="batchDownloadModal=false">×</button>
        </div>
        <div class="modal-body">
          <table class="download-table">
            <thead><tr><th>全部下载</th><th>模板</th></tr></thead>
            <tbody>
              <tr v-for="item in downloadTemplates" :key="item.id">
                <td><button class="link-btn" @click="downloadOne(item)">下载</button></td>
                <td>{{ item.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.visible" class="modal-mask" @click.self="closeConfirm">
      <div class="entry-modal confirm-modal">
        <div class="modal-header">
          <h3>提示</h3>
          <button class="close-btn" @click="closeConfirm">×</button>
        </div>
        <div class="modal-body confirm-text">{{ confirmDialog.message }}</div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="confirmAction">确认</button>
          <button class="btn btn-light" @click="closeConfirm">取消</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/* eslint-disable */
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick } from 'vue'
import { createAcceptItem, deleteAcceptItems, getAcceptItems, updateAcceptItem } from '@/api'

const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const jumpPage = ref(1)
const pageRootRef = ref(null)
const tableCardRef = ref(null)
const tableFooterRef = ref(null)
const tableCardHeight = ref(260)
const ROW_HEIGHT = 34
const TABLE_HEAD_HEIGHT = 42
const tableCardStyle = computed(() => ({ height: `${tableCardHeight.value}px` }))
const batchDownloadModal = ref(false)
const entryModal = reactive({ visible: false, mode: 'create', title: '新建验收' })
const entryForm = reactive({
  partName: '',
  partNo: '',
  childName: '',
  childNo: '',
  toolName: '',
  toolType: '',
  realToolNo: '',
  supplier: '',
  length: '',
  width: '',
  height: '',
  weight: ''
})
const importModal = reactive({
  visible: false,
  fileName: '',
  statusText: '上传中...',
  progress: 0,
  totalKb: 120,
  percent: 0
})
const confirmDialog = reactive({
  visible: false,
  message: '',
  action: ''
})
const currentRowId = ref(null)
const downloadTemplates = ref([
  { id: 1, name: '验收报告模板1-注塑模具.pdf' },
  { id: 2, name: '验收报告模板2-其他模具.pdf' },
  { id: 3, name: '验收报告模板3-注塑模具.pdf' }
])

const filters = reactive({
  partName: '',
  partNo: '',
  childName: '',
  childNo: '',
  toolName: '',
  toolType: '',
  vendorToolNo: '',
  realToolNo: '',
  supplier: '',
  toolSupplier: '',
  partsFactory: '',
  purchaser: '',
  acceptReport: '',
  materialCert: '',
  upperPhoto: '',
  lowerPhoto: '',
  overallPhoto: '',
  nameplatePhoto: '',
  length: '',
  width: '',
  height: '',
  weight: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)))
const pagedData = computed(() => {
  const start = (pagination.pageNum - 1) * pagination.pageSize
  return tableData.value.slice(start, start + pagination.pageSize)
})
const pageStart = computed(() => (pagination.total ? (pagination.pageNum - 1) * pagination.pageSize + 1 : 0))
const pageEnd = computed(() => Math.min(pagination.pageNum * pagination.pageSize, pagination.total))
const pageList = computed(() => {
  const max = totalPages.value
  if (max <= 5) return Array.from({ length: max }, (_, i) => i + 1)
  const current = pagination.pageNum
  const start = Math.max(1, Math.min(current - 2, max - 4))
  return Array.from({ length: 5 }, (_, i) => start + i)
})
const isAllChecked = computed(() => pagedData.value.length > 0 && pagedData.value.every((item) => selectedIds.value.includes(item.id)))

onMounted(() => {
  fetchAcceptItems()
  nextTick(updatePageSizeByHeight)
  window.addEventListener('resize', updatePageSizeByHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSizeByHeight)
})

async function fetchAcceptItems() {
  loading.value = true
  try {
    const res = await getAcceptItems(filters)
    tableData.value = ensureAcceptRows(res.list || [])
    pagination.total = res.total || tableData.value.length
    if (pagination.total !== tableData.value.length) pagination.total = tableData.value.length
    pagination.pageNum = 1
    jumpPage.value = 1
    await nextTick()
    updatePageSizeByHeight()
  } catch (error) {
    console.error('获取验收项数据失败:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
  fetchAcceptItems()
}

function openImportModal() {
  importModal.visible = true
  importModal.fileName = ''
  importModal.progress = 0
  importModal.percent = 0
  importModal.statusText = '上传中...'
}

function closeImportModal() {
  importModal.visible = false
}

function pickImportFile(event) {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  importModal.fileName = file.name
  importModal.progress = 60
  importModal.percent = 50
}

function confirmImport() {
  if (!importModal.fileName) return
  importModal.statusText = '上传成功'
  importModal.progress = importModal.totalKb
  importModal.percent = 100
  // TODO: 接后端导入接口，返回是否覆盖
  openConfirm('本次上传会导致覆盖已有数据，是否坚持本次上传？', 'overwrite')
}

function toggleAllSelection(checked) {
  const currentIds = pagedData.value.map((item) => item.id)
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((id) => !currentIds.includes(id))
    return
  }
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...currentIds]))
}

function toggleRowSelection(id) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

function goPage(target) {
  pagination.pageNum = Math.min(Math.max(1, target), totalPages.value)
  jumpPage.value = pagination.pageNum
}

function submitJumpPage() {
  goPage(Number(jumpPage.value) || 1)
}

function updatePageSizeByHeight() {
  if (!tableCardRef.value || !tableFooterRef.value) return
  const cardRect = tableCardRef.value.getBoundingClientRect()
  const footerRect = tableFooterRef.value.getBoundingClientRect()
  const maxHeightByScreen = Math.floor(footerRect.top - cardRect.top - 6)
  if (maxHeightByScreen > 0) {
    tableCardHeight.value = maxHeightByScreen
  }
  const headEl = tableCardRef.value.querySelector('thead')
  const sampleRowEl = tableCardRef.value.querySelector('tbody tr:not(.empty-row)')
  const headHeight = Math.ceil(headEl?.getBoundingClientRect().height || TABLE_HEAD_HEIGHT)
  const rowHeight = ROW_HEIGHT
  const cardHeight = tableCardHeight.value || tableCardRef.value.clientHeight || 0
  const availableHeight = Math.max(0, cardHeight - headHeight - 2)
  const rows = Math.max(10, Math.floor(availableHeight / rowHeight) + 1)
  if (rows !== pagination.pageSize) {
    pagination.pageSize = rows
    pagination.pageNum = Math.min(pagination.pageNum, totalPages.value)
  }
}

function ensureAcceptRows(list) {
  if (!list.length) return list
  if (list.length >= 30) return list
  const seed = [...list]
  const needCount = 30 - seed.length
  for (let i = 0; i < needCount; i++) {
    const origin = list[i % list.length]
    const suffix = i + 1
    seed.push({
      ...origin,
      id: `demo-accept-${origin.id}-${suffix}`,
      partNo: `${origin.partNo || 'PART'}-${suffix}`,
      childNo: `${origin.childNo || 'CHILD'}-${suffix}`,
      realToolNo: `${origin.realToolNo || 'REAL'}-${suffix}`
    })
  }
  return seed
}

function openEntryModal(mode, row) {
  entryModal.visible = true
  entryModal.mode = mode
  entryModal.title = mode === 'create' ? '新建验收' : mode === 'modify' ? '编辑验收项' : '验收项录入'
  Object.assign(entryForm, {
    partName: row?.partName || '',
    partNo: row?.partNo || '',
    childName: row?.childName || '',
    childNo: row?.childNo || '',
    toolName: row?.toolName || '',
    toolType: row?.toolType || '',
    realToolNo: row?.realToolNo || '',
    supplier: row?.supplier || '',
    length: '',
    width: '',
    height: '',
    weight: ''
  })
  currentRowId.value = row?.id || null
}

function closeEntryModal() {
  entryModal.visible = false
}

async function saveEntry() {
  try {
    if (entryModal.mode === 'create') {
      await createAcceptItem(entryForm)
      closeEntryModal()
      await fetchAcceptItems()
      return
    }
    if (entryModal.mode === 'modify' && currentRowId.value) {
      await updateAcceptItem(currentRowId.value, entryForm)
    }
  } catch (error) {
    console.error('保存验收项失败:', error)
  }

  if (entryModal.mode !== 'create') {
    openConfirm('本次编辑会导致工装（实物）编号、工程师等相关信息变更，是否坚持本次编辑？', 'edit-warning')
  }
}

function handleReplace(row) {
  // TODO: 接后端工装补换接口
  console.log('工装补换:', row)
}

function openBatchDownloadModal() {
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要批量下载的数据', 'noop')
    return
  }
  batchDownloadModal.value = true
}

function downloadOne(item) {
  // TODO: 接后端模板下载接口
  console.log('下载模板:', item)
}

function openDeleteConfirm() {
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要删除的数据', 'noop')
    return
  }
  openConfirm('请注意，此为危险操作，确定删除数据吗？', 'delete')
}

function openConfirm(message, action) {
  confirmDialog.visible = true
  confirmDialog.message = message
  confirmDialog.action = action
}

function closeConfirm() {
  confirmDialog.visible = false
}

async function confirmAction() {
  if (confirmDialog.action === 'delete') {
    try {
      await deleteAcceptItems(selectedIds.value)
      selectedIds.value = []
      await fetchAcceptItems()
    } catch (error) {
      console.error('删除验收项失败:', error)
    }
  }
  if (confirmDialog.action === 'overwrite') {
    closeImportModal()
    await fetchAcceptItems()
  }
  if (confirmDialog.action === 'edit-warning') {
    closeEntryModal()
    await fetchAcceptItems()
  }
  closeConfirm()
}
</script>

<style scoped>
.accept-item-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  padding-bottom: 0;
  height: calc(100vh - 150px);
  overflow: hidden;
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
  line-height: 1;
  height: 30px;
  cursor: pointer;
}

.btn-primary {
  background: #2f7df7;
  color: #fff;
  border-color: #2f7df7;
}

.btn-purple {
  background: #7a59f5;
  color: #fff;
  border-color: #7a59f5;
}

.btn-indigo {
  background: #6574ff;
  color: #fff;
  border-color: #6574ff;
}

.btn-light {
  background: #f7f9fc;
}

.btn-light.danger {
  color: #778ca7;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 14px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-item label {
  width: 84px;
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
  flex: 1;
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

.checkbox-col {
  width: 36px;
  text-align: center !important;
}

.action-col {
  width: 196px;
}

.empty-row {
  text-align: center !important;
  color: #8a9bb1;
  padding: 16px 0 !important;
}

.link-btn {
  border: none;
  background: transparent;
  color: #2f7df7;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  padding: 0;
}

.link-btn.danger {
  color: #3a7be0;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #71849b;
  font-size: 12px;
  padding: 8px 10px;
  position: fixed;
  left: 232px;
  right: 10px;
  bottom: 10px;
  z-index: 120;
  background: #fdfefe;
  border: 1px solid #dfe8f3;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(39, 77, 120, 0.08);
}

.pager {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pager input {
  width: 36px;
  height: 22px;
  border: 1px solid #d8e0ea;
  border-radius: 3px;
  text-align: center;
}

.pager button {
  min-width: 24px;
  height: 24px;
  border: 1px solid #d8e0ea;
  border-radius: 4px;
  background: #fff;
  color: #60758e;
  font-size: 12px;
}

.pager button.active {
  background: #2f7df7;
  color: #fff;
  border-color: #2f7df7;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 27, 40, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1300;
}

.entry-modal {
  width: min(980px, 92vw);
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4ecf5;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #ecf1f8;
}

.modal-header h3 {
  font-size: 32px;
  color: #32485f;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  color: #7e8ea4;
}

.modal-body {
  padding: 16px 18px;
}

.modal-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.modal-footer {
  padding: 10px 18px 16px;
  border-top: 1px solid #ecf1f8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.import-modal {
  width: min(700px, 90vw);
}

.upload-panel {
  border: 2px dashed #c9d3e3;
  border-radius: 10px;
  min-height: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.upload-main {
  color: #3a4f68;
  font-weight: 600;
  margin-bottom: 6px;
}

.upload-sub {
  color: #95a4b9;
  font-size: 12px;
}

.folder-btn {
  margin-top: 8px;
  border: 1px solid #c7d2e3;
  border-radius: 6px;
  padding: 6px 12px;
  color: #465b75;
  font-size: 12px;
}

.upload-progress {
  margin-top: 12px;
  background: #f3f7fd;
  border-radius: 8px;
  padding: 10px 12px;
}

.file-title {
  font-weight: 600;
  color: #374d66;
}

.file-meta {
  margin-top: 4px;
  color: #7d90a8;
  font-size: 12px;
}

.bar {
  margin-top: 8px;
  height: 8px;
  background: #d7dfeb;
  border-radius: 999px;
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: #3c7bff;
}

.batch-modal {
  width: min(620px, 90vw);
}

.download-table {
  width: 100%;
  border-collapse: collapse;
}

.download-table th,
.download-table td {
  border-bottom: 1px solid #e8eef6;
  padding: 10px 8px;
  text-align: left;
}

.download-table th {
  background: #f2f6ff;
}

.confirm-modal {
  width: min(620px, 90vw);
}

.confirm-text {
  font-size: 14px;
  color: #3a4f68;
  line-height: 1.8;
}
</style>
