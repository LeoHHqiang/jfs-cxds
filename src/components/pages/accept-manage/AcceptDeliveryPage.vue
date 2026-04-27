<template>
  <section class="delivery-page">
    <div class="toolbar-card">
      <div class="toolbar-actions">
        <button class="btn btn-indigo" @click="openImportModal">导入Excel</button>
        <button class="btn btn-light">导出 Excel</button>
        <button class="btn btn-light" @click="openBatchMoveModal">批量移模</button>
        <button class="btn btn-light danger" @click="openDeleteConfirm()">删除</button>
      </div>
    </div>

    <div class="search-card">
      <div class="search-actions">
        <button class="btn btn-primary" @click="fetchDeliveryList">查询</button>
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
            <option value="工装分类">工装分类</option>
          </select>
        </div>
        <div class="form-item">
          <label>供应商模具编号：</label>
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
          </select>
        </div>
        <div class="form-item">
          <label>工装供应商：</label>
          <select v-model="filters.toolSupplier">
            <option value="">请选择</option>
          </select>
        </div>
        <div class="form-item">
          <label>零部件厂：</label>
          <select v-model="filters.partsFactory">
            <option value="">请选择</option>
          </select>
        </div>
        <div class="form-item">
          <label>采购负责人：</label>
          <select v-model="filters.purchaser">
            <option value="">请选择</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-card">
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
          <tr v-if="loading">
            <td colspan="10" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="!tableData.length">
            <td colspan="10" class="empty-row">暂无交付追踪数据</td>
          </tr>
          <tr v-for="row in tableData" :key="row.id">
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
              <button class="link-btn" @click="handleFollow(row)">工装补换</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <span>显示第 1 到 {{ tableData.length }} 条记录，共 {{ pagination.total }} 条记录</span>
      <div class="pager">
        <span>跳转到</span>
        <input type="text" />
        <span>页</span>
        <button>&lt;&lt;</button>
        <button>&lt;</button>
        <button class="active">1</button>
        <button>2</button>
        <button>3</button>
        <button>&gt;</button>
        <button>&gt;&gt;</button>
      </div>
    </div>

    <div v-if="showReplaceModal" class="modal-mask" @click.self="closeReplaceModal">
      <div class="replace-modal">
        <div class="modal-header">
          <h3>工装移模</h3>
          <button class="close-btn" @click="closeReplaceModal">×</button>
        </div>

        <div class="modal-body">
          <div class="block-title">基础信息</div>
          <div class="modal-grid">
            <div class="modal-item"><label>零件名称：</label><input :value="replaceForm.partName" disabled /></div>
            <div class="modal-item"><label>零件编号：</label><input :value="replaceForm.partNo" disabled /></div>
            <div class="modal-item"><label>子零件名称：</label><input :value="replaceForm.childName" disabled /></div>
            <div class="modal-item"><label>子零件编号：</label><input :value="replaceForm.childNo" disabled /></div>
            <div class="modal-item"><label>工装名称：</label><input :value="replaceForm.toolName" disabled /></div>
            <div class="modal-item"><label>工装分类：</label><input :value="replaceForm.toolType" disabled /></div>
            <div class="modal-item"><label>供应商模具编号：</label><input :value="replaceForm.vendorToolNo" disabled /></div>
            <div class="modal-item"><label>工装实物编号：</label><input :value="replaceForm.realToolNo" disabled /></div>
            <div class="modal-item"><label>供应商：</label><input :value="replaceForm.supplier" disabled /></div>
            <div class="modal-item"><label>原工装供应商：</label><input :value="replaceForm.originToolSupplier" disabled /></div>
            <div class="modal-item"><label>零部件厂：</label><input :value="replaceForm.partsFactory" disabled /></div>
            <div class="modal-item"><label>采购负责人：</label><input :value="replaceForm.purchaser" disabled /></div>
          </div>

          <div class="block-title">新供应商信息</div>
          <div class="modal-grid">
            <div class="modal-item full">
              <label class="required">新供应商：</label>
              <input v-model="replaceForm.newSupplier" placeholder="请输入新供应商" />
            </div>
            <div class="modal-item"><label>国家：</label><select v-model="replaceForm.country"><option>中国</option></select></div>
            <div class="modal-item"><label>省份：</label><input v-model="replaceForm.province" placeholder="请输入省份" /></div>
            <div class="modal-item"><label>市：</label><input v-model="replaceForm.city" placeholder="请输入城市" /></div>
            <div class="modal-item"><label>区/县：</label><input v-model="replaceForm.district" placeholder="请输入区县" /></div>
            <div class="modal-item full"><label>详细地址：</label><input v-model="replaceForm.detailAddress" placeholder="请输入详细地址" /></div>
          </div>

          <div class="record-wrap">
            <div class="block-title">移模记录</div>
            <div class="record-list">
              <div class="record-row" v-for="record in replaceRecords" :key="record.id">
                <p>
                  <span class="record-time">{{ record.date }}</span>
                  由
                  <span class="record-user">{{ record.operator }}</span>
                  申请从
                  <strong>{{ record.fromSupplier }}</strong>
                  至
                  <strong>{{ record.toSupplier }}</strong>
                  ，移至
                  <strong>{{ record.toAddress }}</strong>
                </p>
                <button class="reuse-btn" @click="reuseRecord(record)">复用</button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveReplace">保存</button>
          <button class="btn btn-light" @click="closeReplaceModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="importModal.visible" class="modal-mask" @click.self="closeImportModal">
      <div class="replace-modal import-modal">
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

    <div v-if="batchMoveModal" class="modal-mask" @click.self="batchMoveModal=false">
      <div class="replace-modal batch-modal">
        <div class="modal-header">
          <h3>批量移模</h3>
          <button class="close-btn" @click="batchMoveModal=false">×</button>
        </div>
        <div class="modal-body">
          <p class="batch-title">将选中项移模至：</p>
          <div class="batch-grid">
            <div class="modal-item"><label>国家：</label><select v-model="batchAddress.country"><option>中国</option></select></div>
            <div class="modal-item"><label>省份：</label><input v-model="batchAddress.province" /></div>
            <div class="modal-item"><label>市：</label><input v-model="batchAddress.city" /></div>
            <div class="modal-item"><label>区/县：</label><input v-model="batchAddress.district" /></div>
            <div class="modal-item full"><label>详细地址：</label><input v-model="batchAddress.detail" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveBatchMove">保存</button>
          <button class="btn btn-light" @click="batchMoveModal=false">取消</button>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.visible" class="modal-mask" @click.self="closeConfirm">
      <div class="replace-modal confirm-modal">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { createDeliveryItem, deleteDeliveryItems, getDeliveryItems } from '@/api'

const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})
const showReplaceModal = ref(false)
const currentReplaceRow = ref(null)
const batchMoveModal = ref(false)
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
const batchAddress = reactive({
  country: '中国',
  province: '浙江省',
  city: '宁波市',
  district: '江北区',
  detail: '和平路142号'
})

const replaceForm = reactive({
  partName: '',
  partNo: '',
  childName: '',
  childNo: '',
  toolName: '',
  toolType: '',
  vendorToolNo: '',
  realToolNo: '',
  supplier: '',
  originToolSupplier: '宁波良诚模具有限公司',
  partsFactory: '宁波继峰汽车零部件有限公司',
  purchaser: '张三',
  newSupplier: '',
  country: '中国',
  province: '浙江省',
  city: '宁波市',
  district: '江北区',
  detailAddress: ''
})

const replaceRecords = ref([
  {
    id: 1,
    date: '2025.12.19',
    operator: '工程师1',
    fromSupplier: '宁海良诚模具有限公司',
    toSupplier: '宁波宝贝电子有限公司',
    toAddress: '浙江省宁波市江北区和平路142号'
  },
  {
    id: 2,
    date: '2025.11.23',
    operator: '采购员2',
    fromSupplier: '峰诗恩电子有限公司',
    toSupplier: '宁海良诚模具有限公司',
    toAddress: '浙江省宁波市海曙区信宁路113号'
  }
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
  purchaser: ''
})

const isAllChecked = computed(() => {
  return tableData.value.length > 0 && selectedIds.value.length === tableData.value.length
})

onMounted(() => {
  fetchDeliveryList()
})

async function fetchDeliveryList() {
  loading.value = true
  try {
    const res = await getDeliveryItems(filters)
    tableData.value = res.list || []
    pagination.total = res.total || tableData.value.length
  } catch (error) {
    console.error('获取交付追踪数据失败:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, {
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
  fetchDeliveryList()
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

async function confirmImport() {
  if (!importModal.fileName) return
  importModal.statusText = '上传成功'
  importModal.progress = importModal.totalKb
  importModal.percent = 100
  try {
    await createDeliveryItem({
      partName: '导入样例-零件名称',
      partNo: `IM-${Date.now().toString().slice(-6)}`,
      childName: '导入样例-子零件',
      childNo: `IM-${Date.now().toString().slice(-6)}`,
      toolName: '导入样例-工装',
      toolType: '工装分类',
      realToolNo: `REAL-${Date.now().toString().slice(-6)}`,
      supplier: '维诗恩塑胶有限公司'
    })
  } catch (error) {
    console.error('导入交付追踪数据失败:', error)
  }
  openConfirm('本次上传会导致覆盖已有数据，是否坚持本次上传？', 'overwrite')
}

function toggleAllSelection(checked) {
  selectedIds.value = checked ? tableData.value.map(item => item.id) : []
}

function toggleRowSelection(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
    return
  }
  selectedIds.value = [...selectedIds.value, id]
}

function handleFollow(row) {
  currentReplaceRow.value = row
  Object.assign(replaceForm, {
    partName: row.partName || '',
    partNo: row.partNo || '',
    childName: row.childName || '',
    childNo: row.childNo || '',
    toolName: row.toolName || '',
    toolType: row.toolType || '',
    vendorToolNo: row.vendorToolNo || 'GP1001012',
    realToolNo: row.realToolNo || '',
    supplier: row.supplier || '',
    originToolSupplier: row.supplier || '宁波良诚模具有限公司',
    partsFactory: '宁波继峰汽车零部件有限公司',
    purchaser: '张三',
    newSupplier: '',
    country: '中国',
    province: '浙江省',
    city: '宁波市',
    district: '江北区',
    detailAddress: ''
  })
  showReplaceModal.value = true
}

function closeReplaceModal() {
  showReplaceModal.value = false
}

function reuseRecord(record) {
  replaceForm.newSupplier = record.toSupplier
  replaceForm.detailAddress = record.toAddress
}

async function saveReplace() {
  if (!replaceForm.newSupplier) {
    alert('请填写新供应商')
    return
  }
  // TODO: 调用后端工装补换保存接口
  // await api.saveToolReplace({ rowId: currentReplaceRow.value?.id, ...replaceForm })
  showReplaceModal.value = false
}

function openBatchMoveModal() {
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要批量移模的数据', 'noop')
    return
  }
  batchMoveModal.value = true
}

function saveBatchMove() {
  // TODO: 调用后端批量移模接口
  // await api.batchMove({ ids: selectedIds.value, ...batchAddress })
  batchMoveModal.value = false
  openConfirm(`请注意，此为危险操作，确定批量通过${selectedIds.value.length}项移模申请吗？`, 'batch-pass')
}

function openDeleteConfirm() {
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要删除的数据', 'noop')
    return
  }
  openConfirm(`请注意，此为危险操作，确定删除${selectedIds.value.length}项数据吗？`, 'delete')
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
      await deleteDeliveryItems(selectedIds.value)
      selectedIds.value = []
      await fetchDeliveryList()
    } catch (error) {
      console.error('删除交付追踪数据失败:', error)
    }
  }
  if (confirmDialog.action === 'overwrite') {
    closeImportModal()
    await fetchDeliveryList()
  }
  closeConfirm()
}
</script>

<style scoped>
.delivery-page {
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

.btn-indigo {
  background: #7c66f5;
  color: #fff;
  border-color: #7c66f5;
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

.checkbox-col {
  width: 36px;
  text-align: center !important;
}

.action-col {
  width: 96px;
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
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #71849b;
  font-size: 12px;
  padding: 4px 2px;
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
  background: rgba(17, 26, 37, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
}

.replace-modal {
  width: min(1200px, 92vw);
  max-height: 88vh;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #dfe8f3;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 12px 18px;
  border-bottom: 1px solid #ebf1f8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 20px;
  color: #32485f;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 30px;
  line-height: 1;
  color: #7f90a7;
  cursor: pointer;
}

.modal-body {
  padding: 14px 18px;
  overflow-y: auto;
}

.block-title {
  font-size: 16px;
  color: #2f4258;
  font-weight: 600;
  margin: 8px 0 10px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 14px;
  margin-bottom: 10px;
}

.modal-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-item.full {
  grid-column: span 3;
}

.modal-item label {
  width: 94px;
  font-size: 13px;
  color: #5f748f;
  flex-shrink: 0;
}

.modal-item label.required::before {
  content: '*';
  color: #ef5d5d;
  margin-right: 2px;
}

.modal-item input,
.modal-item select {
  width: 100%;
  height: 34px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 10px;
  color: #516781;
  background: #fff;
}

.modal-item input:disabled {
  background: #f5f8fc;
  color: #6f8298;
}

.record-wrap {
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  padding: 8px 10px;
  margin-top: 12px;
}

.record-list {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px dashed #e3eaf3;
  padding: 10px 0;
}

.record-row:last-child {
  border-bottom: none;
}

.record-row p {
  flex: 1;
  font-size: 13px;
  color: #546b84;
  line-height: 1.5;
}

.record-time {
  color: #3e78de;
  font-weight: 600;
}

.record-user {
  color: #3e78de;
}

.reuse-btn {
  border: 1px solid #88a8f5;
  background: #f5f8ff;
  color: #2f74e2;
  border-radius: 6px;
  min-width: 64px;
  height: 30px;
  cursor: pointer;
}

.modal-footer {
  padding: 10px 18px 14px;
  border-top: 1px solid #ebf1f8;
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
  width: min(760px, 92vw);
}

.batch-title {
  font-size: 28px;
  color: #32485f;
  font-weight: 600;
  margin-bottom: 10px;
}

.batch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
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
