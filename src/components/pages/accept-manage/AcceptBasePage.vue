<template>
  <section ref="pageRootRef" class="base-page">
    <div class="toolbar-card">
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="openEditModal('create')">+ 新增数据</button>
        <button class="btn btn-purple">+ 下载模板</button>
        <button class="btn btn-indigo" @click="openImportModal">导入 Excel</button>
        <button class="btn btn-light">导出 Excel</button>
        <button class="btn btn-light" @click="openEditModal('batch')">批量修改</button>
        <button class="btn btn-light danger" @click="openDeleteConfirm()">删除</button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-actions">
        <button class="btn btn-primary" @click="fetchBaseItems">查询</button>
        <button class="btn btn-light" @click="resetFilters">重置</button>
      </div>

      <div class="form-grid">
        <div class="form-item">
          <label>零件名称：</label>
          <input v-model="filters.partName" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>零件编号：</label>
          <input v-model="filters.partNo" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>子零件名称：</label>
          <input v-model="filters.childName" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>子零件编号：</label>
          <input v-model="filters.childNo" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>工装名称：</label>
          <input v-model="filters.toolName" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>工装分类：</label>
          <select v-model="filters.toolType">
            <option value="">请选择</option>
            <option value="注塑模具">注塑模具</option>
            <option value="其他模具">其他模具</option>
          </select>
        </div>
        <div class="form-item">
          <label>供应商根具编号：</label>
          <input v-model="filters.vendorToolNo" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>工装实物编号：</label>
          <input v-model="filters.realToolNo" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>供应商：</label>
          <select v-model="filters.supplier">
            <option value="">请选择</option>
            <option value="维诗恩塑胶有限公司">维诗恩塑胶有限公司</option>
            <option value="鸿瑞兴模具有限公司">鸿瑞兴模具有限公司</option>
          </select>
        </div>
        <div class="form-item">
          <label>工装供应商：</label>
          <select v-model="filters.toolSupplier">
            <option value="">请选择</option>
            <option value="宁波宝贝电子">宁波宝贝电子</option>
            <option value="宁海良诚模具有限公司">宁海良诚模具有限公司</option>
          </select>
        </div>
        <div class="form-item">
          <label>零部件厂：</label>
          <select v-model="filters.partsFactory">
            <option value="">请选择</option>
            <option value="宁波继峰汽车零部件有限公司">宁波继峰汽车零部件有限公司</option>
          </select>
        </div>
        <div class="form-item">
          <label>采购负责人：</label>
          <select v-model="filters.purchaser">
            <option value="">请选择</option>
            <option value="张三">张三</option>
            <option value="李新宇">李新宇</option>
          </select>
        </div>
      </div>
    </div>

    <div ref="tableCardRef" class="table-card" :style="tableCardStyle">
      <table class="data-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="isAllChecked"
                @change="toggleAllSelection($event.target.checked)"
              />
            </th>
            <th>零件名称</th>
            <th>零件编号（JF）</th>
            <th>子零件名称</th>
            <th>子零件编号（JF）</th>
            <th>工装名称</th>
            <th>工装分类</th>
            <th>供应商模具编号</th>
            <th>客户模具编号</th>
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="!tableData.length">
            <td colspan="10" class="empty-row">暂无导入数据</td>
          </tr>
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
            <td>{{ row.vendorToolNo }}</td>
            <td>{{ row.customerToolNo }}</td>
            <td class="action-col">
              <button class="icon-btn edit" @click="openEditModal('edit', row)">编辑</button>
              <button class="icon-btn delete" @click="openDeleteConfirm(row)">删除</button>
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
        <button :disabled="pagination.pageNum===1" @click="goPage(pagination.pageNum - 1)">&lt;</button>
        <button
          v-for="p in pageList"
          :key="`base-page-${p}`"
          :class="{ active: p===pagination.pageNum }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button :disabled="pagination.pageNum===totalPages" @click="goPage(pagination.pageNum + 1)">&gt;</button>
      </div>
    </div>

    <div v-if="editModal.visible" class="modal-mask" @click.self="closeEditModal">
      <div class="modal edit-modal">
        <div class="modal-header">
          <h3>{{ editModal.title }}</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="edit-grid">
            <div class="form-item"><label>零件名称：</label><input v-model="editForm.partName" placeholder="请输入" /></div>
            <div class="form-item"><label>零件编号：</label><input v-model="editForm.partNo" placeholder="请输入" /></div>
            <div class="form-item"><label>子零件名称：</label><input v-model="editForm.childName" placeholder="请输入" /></div>
            <div class="form-item"><label>子零件编号：</label><input v-model="editForm.childNo" placeholder="请输入" /></div>
            <div class="form-item"><label>工装名称：</label><input v-model="editForm.toolName" placeholder="请输入" /></div>
            <div class="form-item">
              <label>工装分类：</label>
              <select v-model="editForm.toolType">
                <option value="">请选择</option>
                <option value="注塑模具">注塑模具</option>
                <option value="其他模具">其他模具</option>
              </select>
            </div>
            <div class="form-item"><label>工装实物编号：</label><input v-model="editForm.realToolNo" placeholder="请输入" /></div>
            <div class="form-item"><label>供应商：</label><input v-model="editForm.supplier" placeholder="请输入" /></div>
            <div class="form-item"><label>工装供应商：</label><input v-model="editForm.toolSupplier" placeholder="请输入" /></div>
            <div class="form-item"><label>项目负责人：</label><input v-model="editForm.owner" placeholder="请输入" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveEditData">保存</button>
          <button class="btn btn-light" @click="closeEditModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="importModal.visible" class="modal-mask" @click.self="closeImportModal">
      <div class="modal import-modal">
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

    <div v-if="confirmDialog.visible" class="modal-mask" @click.self="closeConfirm">
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h3>提示</h3>
          <button class="close-btn" @click="closeConfirm">×</button>
        </div>
        <div class="modal-body confirm-body">{{ confirmDialog.message }}</div>
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
import { batchDeleteBaseItems, createBaseItem, deleteBaseItem, getBaseItems, updateBaseItem } from '@/api'

const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
const jumpPage = ref(1)
const pageRootRef = ref(null)
const tableCardRef = ref(null)
const tableFooterRef = ref(null)
const tableCardHeight = ref(260)
const ROW_HEIGHT = 34
const TABLE_HEAD_HEIGHT = 42
const tableCardStyle = computed(() => ({ height: `${tableCardHeight.value}px` }))

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
  purchaser: ''
})
const editModal = reactive({ visible: false, mode: 'create', title: '新建数据', targetId: null })
const editForm = reactive({
  partName: '',
  partNo: '',
  childName: '',
  childNo: '',
  toolName: '',
  toolType: '',
  realToolNo: '',
  supplier: '',
  toolSupplier: '',
  owner: ''
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
  action: '',
  payload: null
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
const isAllChecked = computed(() => {
  return pagedData.value.length > 0 && pagedData.value.every((item) => selectedIds.value.includes(item.id))
})

onMounted(() => {
  fetchBaseItems()
  nextTick(updatePageSizeByHeight)
  window.addEventListener('resize', updatePageSizeByHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSizeByHeight)
})

async function fetchBaseItems() {
  loading.value = true
  try {
    const res = await getBaseItems(filters)
    tableData.value = ensureBaseRows(res.list || [])
    pagination.total = res.total || tableData.value.length
    if (pagination.total !== tableData.value.length) pagination.total = tableData.value.length
    pagination.pageNum = 1
    jumpPage.value = 1
    await nextTick()
    updatePageSizeByHeight()
  } catch (error) {
    console.error('获取基础项列表失败:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
  fetchBaseItems()
}

function toggleAllSelection(checked) {
  const currentIds = pagedData.value.map(item => item.id)
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((id) => !currentIds.includes(id))
    return
  }
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...currentIds]))
}

function toggleRowSelection(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
    return
  }
  selectedIds.value = [...selectedIds.value, id]
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

function ensureBaseRows(list) {
  if (!list.length) return list
  if (list.length >= 30) return list
  const seed = [...list]
  const needCount = 30 - seed.length
  for (let i = 0; i < needCount; i++) {
    const origin = list[i % list.length]
    const suffix = i + 1
    seed.push({
      ...origin,
      id: `demo-base-${origin.id}-${suffix}`,
      partNo: `${origin.partNo || 'PART'}-${suffix}`,
      childNo: `${origin.childNo || 'CHILD'}-${suffix}`,
      realToolNo: `${origin.realToolNo || 'REAL'}-${suffix}`,
      vendorToolNo: origin.vendorToolNo || '-',
      customerToolNo: origin.customerToolNo || '-'
    })
  }
  return seed
}

function openEditModal(mode, row) {
  editModal.mode = mode
  editModal.visible = true
  editModal.targetId = row?.id || null
  editModal.title = mode === 'batch' ? '批量修改选中行数据' : mode === 'edit' ? '编辑数据' : '新建数据'

  Object.assign(editForm, {
    partName: row?.partName || '',
    partNo: row?.partNo || '',
    childName: row?.childName || '',
    childNo: row?.childNo || '',
    toolName: row?.toolName || '',
    toolType: row?.toolType || '',
    realToolNo: row?.realToolNo || '',
    supplier: row?.supplier || '',
    toolSupplier: row?.toolSupplier || '',
    owner: row?.owner || ''
  })
}

function closeEditModal() {
  editModal.visible = false
}

async function saveEditData() {
  try {
    if (editModal.mode === 'create') {
      await createBaseItem({
        ...editForm,
        vendorToolNo: '-',
        customerToolNo: '-'
      })
    } else if (editModal.mode === 'edit' && editModal.targetId) {
      await updateBaseItem(editModal.targetId, {
        ...editForm,
        vendorToolNo: '-',
        customerToolNo: '-'
      })
    } else if (editModal.mode === 'batch' && selectedIds.value.length) {
      // TODO: 后续可改为后端批量更新接口
      await Promise.all(selectedIds.value.map((id) => updateBaseItem(id, { ...editForm })))
    }
    await fetchBaseItems()
  } catch (error) {
    console.error('保存基础项失败:', error)
  }
  closeEditModal()
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
  importModal.totalKb = 120
  importModal.progress = 60
  importModal.percent = 50
}

async function confirmImport() {
  if (!importModal.fileName) {
    return
  }
  importModal.statusText = '上传成功'
  importModal.progress = importModal.totalKb
  importModal.percent = 100
  // TODO: 接后端导入接口，后端返回是否覆盖提示
  // const res = await api.importBaseItems(file)
  openConfirm('本次上传会导致覆盖已有数据，是否坚持本次上传？', 'overwrite')
}

function openDeleteConfirm(row) {
  if (row) {
    openConfirm('请注意，此为危险操作，确定删除此项数据吗？', 'delete-one', row)
    return
  }
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要删除的数据', 'noop')
    return
  }
  openConfirm(`请注意，此为危险操作，确定批量删除${selectedIds.value.length}项数据吗？`, 'delete-batch')
}

function openConfirm(message, action, payload = null) {
  confirmDialog.visible = true
  confirmDialog.message = message
  confirmDialog.action = action
  confirmDialog.payload = payload
}

function closeConfirm() {
  confirmDialog.visible = false
}

async function confirmAction() {
  if (confirmDialog.action === 'delete-one' && confirmDialog.payload) {
    try {
      await deleteBaseItem(confirmDialog.payload.id)
      await fetchBaseItems()
      selectedIds.value = selectedIds.value.filter(item => item !== confirmDialog.payload.id)
    } catch (error) {
      console.error('删除基础项失败:', error)
    }
  }
  if (confirmDialog.action === 'delete-batch') {
    try {
      await batchDeleteBaseItems(selectedIds.value)
      selectedIds.value = []
      await fetchBaseItems()
    } catch (error) {
      console.error('批量删除基础项失败:', error)
    }
  }
  if (confirmDialog.action === 'overwrite') {
    // TODO: 对接后端覆盖导入确认接口
    closeImportModal()
    fetchBaseItems()
  }
  closeConfirm()
}
</script>

<style scoped>
.base-page {
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

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
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
  width: 78px;
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
  padding: 10px 8px;
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
  width: 120px;
}

.empty-row {
  text-align: center !important;
  color: #8a9bb1;
  padding: 16px 0 !important;
}

.icon-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
}

.icon-btn.edit {
  color: #2f7df7;
}

.icon-btn.delete {
  color: #f05b5b;
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

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 27, 40, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1300;
}

.modal {
  width: min(800px, 92vw);
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

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}

.modal-footer {
  padding: 10px 18px 16px;
  border-top: 1px solid #ecf1f8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.upload-panel {
  border: 2px dashed #c9d3e3;
  border-radius: 10px;
  min-height: 140px;
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

.confirm-modal {
  width: min(560px, 90vw);
}

.confirm-body {
  font-size: 14px;
  color: #3a4f68;
  line-height: 1.8;
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
</style>
