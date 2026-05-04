<template>
  <section ref="pageRootRef" class="base-page">
    <div class="toolbar-card">
      <div class="toolbar-row">
        <button
          type="button"
          class="btn btn-complete"
          :disabled="stageCompleteBusy"
          @click="onStageComplete"
        >
          完成节点
        </button>
        <div class="toolbar-actions">
        <button class="btn btn-primary" @click="openEditModal('create')">+ 新增数据</button>
        <button type="button" class="btn btn-purple" @click="downloadBaseTemplate">+ 下载模板</button>
        <button class="btn btn-indigo" @click="openImportModal">导入 Excel</button>
        <button type="button" class="btn btn-light" @click="exportBaseExcel">导出 Excel</button>
        <button class="btn btn-light danger" @click="openDeleteConfirm()">删除</button>
        </div>
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
          <label>供应商模具编号：</label>
          <input v-model="filters.vendorToolNo" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>工装实物编号：</label>
          <input v-model="filters.realToolNo" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>供应商：</label>
          <input v-model="filters.supplier" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>工装供应商：</label>
          <input v-model="filters.toolSupplier" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>零部件厂：</label>
          <input v-model="filters.partsFactory" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>采购负责人：</label>
          <input v-model="filters.purchaser" type="text" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label>工装使用地：</label>
          <select v-model="filters.toolUsageLocation">
            <option v-for="opt in TOOL_USAGE_FILTER_OPTIONS" :key="opt.label" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div
      v-show="showHProxy"
      ref="hScrollProxyRef"
      class="table-h-scroll-proxy scrollbar-like-sidebar"
      @scroll="onProxyHScroll"
    >
      <div class="table-h-scroll-proxy-inner" :style="{ width: `${hProxyInnerWidth}px` }"></div>
    </div>

    <div class="table-panel">
      <div ref="tableViewportRef" class="table-scroll-y-outer scrollbar-like-sidebar">
        <div ref="tableHInnerRef" class="table-h-inner" @scroll="onShellScroll">
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
            <th>工装实物编号</th>
            <th>工装分类</th>
            <th>供应商</th>
            <th>工装供应商</th>
            <th>项目负责人</th>
            <th>供应商模具编号</th>
            <th>客户模具编号</th>
            <th>零部件厂</th>
            <th>工装使用地</th>
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="16" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="!tableData.length">
            <td colspan="16" class="empty-row">暂无导入数据</td>
          </tr>
          <tr v-for="row in pagedData" :key="row.id">
            <td class="checkbox-col">
              <input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleRowSelection(row.id)" />
            </td>
            <td>{{ displayCell(row.partName) }}</td>
            <td>{{ displayCell(row.partNo) }}</td>
            <td>{{ displayCell(row.childName) }}</td>
            <td>{{ displayCell(row.childNo) }}</td>
            <td>{{ displayCell(row.toolName) }}</td>
            <td>{{ displayCell(row.realToolNo) }}</td>
            <td>{{ displayCell(row.toolType) }}</td>
            <td>{{ displayCell(row.supplier) }}</td>
            <td>{{ displayCell(row.toolSupplier) }}</td>
            <td>{{ displayCell(row.owner || row.purchaser) }}</td>
            <td>{{ displayCell(row.vendorToolNo) }}</td>
            <td>{{ displayCell(row.customerToolNo) }}</td>
            <td>{{ displayCell(row.partsFactory) }}</td>
            <td>{{ formatToolUsageLocationDisplay(row.toolUsageLocation) }}</td>
            <td class="action-col">
              <button class="icon-btn edit" @click="openEditModal('edit', row)">编辑</button>
              <button class="icon-btn delete" @click="openDeleteConfirm(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
        </div>
      </div>
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
            <div class="form-item"><label>供应商模具编号：</label><input v-model="editForm.vendorToolNo" placeholder="请输入" /></div>
            <div class="form-item"><label>客户模具编号：</label><input v-model="editForm.customerToolNo" placeholder="请输入" /></div>
            <div class="form-item form-item-span"><label>零部件厂：</label><input v-model="editForm.partsFactory" placeholder="请输入" /></div>
            <div class="form-item form-item-span location-hint">工装使用地（选择填写，可不选）</div>
            <div class="form-item">
              <label>省份：</label>
              <select v-model="editLocationParts.province" @change="onEditLocationProvinceChange">
                <option value="">请选择</option>
                <option v-for="p in CN_PROVINCES" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div class="form-item">
              <label>市：</label>
              <select v-model="editLocationParts.city" @change="onEditLocationCityChange">
                <option value="">请选择</option>
                <option v-for="c in editCityOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-item">
              <label>区/县：</label>
              <select v-model="editLocationParts.district">
                <option value="">请选择</option>
                <option v-for="d in editDistrictOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-item form-item-span">
              <label>详细地址：</label>
              <input v-model="editLocationParts.detail" type="text" placeholder="可补充街道、门牌等" />
            </div>
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
            <input
              :key="importFileKey"
              type="file"
              class="hidden-input"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              @change="pickImportFile"
            />
            <p class="upload-main">点击选择 Excel</p>
            <p class="upload-sub">
              .xlsx / .xls，表头须与「下载模板」完全一致。新零件编号整行入库；已存在的零件编号仅合并更新 Excel 里填写了的列（如供应商、工装供应商、零部件厂、工装使用地等），空单元格不会覆盖库内原值。「工装使用地」可一格内写完整地址，省/市/区间可含空格，导入后解析为与页面、移模一致的存储格式（不写国家前缀）。
            </p>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick, watch } from 'vue'
import { useSyncedHorizontalScrollProxy } from '@/composables/useSyncedHorizontalScrollProxy'
import {
  batchDeleteBaseItems,
  createBaseItem,
  deleteBaseItem,
  getBaseItems,
  importBaseItemsByNewPartNoOnly,
  updateBaseItem
} from '@/api'
import { useAcceptStageComplete } from '@/composables/useAcceptStageComplete'
import { downloadExcel, timestampedFilename } from '@/utils/excelExport'
import { parseExcelToRows } from '@/utils/excelImport'
import {
  CN_PROVINCES,
  TOOL_USAGE_FILTER_OPTIONS,
  citiesOfProvince,
  districtsOf,
  composeAddressLine,
  parseToolUsageLine,
  formatToolUsageLocationDisplay
} from '@/utils/chinaRegionSelect'

const { onComplete: onStageComplete, busy: stageCompleteBusy } = useAcceptStageComplete('base')

/** 与模板、导入、导出一致：工装使用地为单列整行；导入时自动解析（省/市/区间可含空格），入库为紧凑串。 */
const BASE_EXCEL_COLUMNS = [
  { header: '零件名称', key: 'partName' },
  { header: '零件编号', key: 'partNo' },
  { header: '子零件名称', key: 'childName' },
  { header: '子零件编号', key: 'childNo' },
  { header: '工装名称', key: 'toolName' },
  { header: '工装实物编号', key: 'realToolNo' },
  { header: '工装分类', key: 'toolType' },
  { header: '供应商', key: 'supplier' },
  { header: '工装供应商', key: 'toolSupplier' },
  { header: '项目负责人', key: 'owner', getValue: (r) => r.owner || r.purchaser || '' },
  { header: '供应商模具编号', key: 'vendorToolNo' },
  { header: '客户模具编号', key: 'customerToolNo' },
  { header: '零部件厂', key: 'partsFactory' },
  {
    header: '工装使用地',
    key: 'toolUsageLocation',
    getValue: (r) => {
      const raw = String(r?.toolUsageLocation || '').trim()
      if (!raw) return ''
      const d = formatToolUsageLocationDisplay(raw)
      return d === '—' ? '' : d
    }
  }
]

function downloadBaseTemplate() {
  try {
    downloadExcel({
      filename: '基础项录入导入模板.xlsx',
      sheetName: '基础项录入',
      columns: BASE_EXCEL_COLUMNS,
      headersOnly: true
    })
  } catch (e) {
    console.error(e)
    window.alert('下载模板失败，请稍后重试')
  }
}

function exportBaseExcel() {
  try {
    downloadExcel({
      filename: `${timestampedFilename('基础项录入')}.xlsx`,
      sheetName: '基础项录入',
      columns: BASE_EXCEL_COLUMNS,
      rows: tableData.value,
      headersOnly: false
    })
  } catch (e) {
    console.error(e)
    window.alert('导出 Excel 失败，请稍后重试')
  }
}

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
const tableViewportRef = ref(null)
const tableHInnerRef = ref(null)
const tableFooterRef = ref(null)
const ROW_HEIGHT = 34
const TABLE_HEAD_HEIGHT = 42
let layoutResizeObserver = null

const {
  hScrollProxyRef,
  hProxyInnerWidth,
  showHProxy,
  onProxyHScroll,
  onShellScroll,
  updateHScrollMetrics
} = useSyncedHorizontalScrollProxy(tableHInnerRef)

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
  toolUsageLocation: ''
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
  owner: '',
  vendorToolNo: '',
  customerToolNo: '',
  partsFactory: ''
})

const editLocationParts = reactive({
  province: '',
  city: '',
  district: '',
  detail: ''
})

const editCityOptions = computed(() => citiesOfProvince(editLocationParts.province))
const editDistrictOptions = computed(() => districtsOf(editLocationParts.province, editLocationParts.city))

function onEditLocationProvinceChange() {
  editLocationParts.city = ''
  editLocationParts.district = ''
}

function onEditLocationCityChange() {
  editLocationParts.district = ''
}
const importFileKey = ref(0)
const importPendingFile = ref(null)
const importModal = reactive({
  visible: false,
  fileName: '',
  statusText: '请选择文件',
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

watch(pagedData, () => nextTick(() => updateHScrollMetrics()), { flush: 'post' })

onMounted(async () => {
  window.addEventListener('resize', onWindowResizeBase)
  await fetchBaseItems()
  await nextTick()
  updatePageSizeByHeight()
  await nextTick()
  layoutResizeObserver = new ResizeObserver(() => {
    nextTick(() => {
      updatePageSizeByHeight()
      updateHScrollMetrics()
    })
  })
  if (pageRootRef.value) layoutResizeObserver.observe(pageRootRef.value)
  if (tableViewportRef.value) layoutResizeObserver.observe(tableViewportRef.value)
  if (tableHInnerRef.value) layoutResizeObserver.observe(tableHInnerRef.value)
  await nextTick()
  updateHScrollMetrics()
})

function onWindowResizeBase() {
  updatePageSizeByHeight()
  updateHScrollMetrics()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResizeBase)
  layoutResizeObserver?.disconnect()
  layoutResizeObserver = null
})

function normalizeBaseRow(row) {
  if (!row || typeof row !== 'object') return row
  const owner = row.owner || row.purchaser || ''
  return {
    ...row,
    owner,
    purchaser: row.purchaser || owner,
    vendorToolNo: row.vendorToolNo != null && row.vendorToolNo !== '' ? row.vendorToolNo : (row.vendor_tool_no || ''),
    customerToolNo: row.customerToolNo != null && row.customerToolNo !== '' ? row.customerToolNo : (row.customer_tool_no || ''),
    partsFactory: row.partsFactory != null && row.partsFactory !== '' ? row.partsFactory : (row.parts_factory || ''),
    toolUsageLocation:
      row.toolUsageLocation != null && row.toolUsageLocation !== ''
        ? row.toolUsageLocation
        : row.tool_usage_location || ''
  }
}

function displayCell(val) {
  const s = val == null ? '' : String(val).trim()
  return s || '—'
}

async function fetchBaseItems() {
  loading.value = true
  try {
    const res = await getBaseItems(filters)
    const list = (res.list || []).map(normalizeBaseRow)
    tableData.value = list
    pagination.total = res.total != null ? res.total : list.length
    pagination.pageNum = 1
    jumpPage.value = 1
    await nextTick()
    updatePageSizeByHeight()
    updateHScrollMetrics()
  } catch (error) {
    console.error('获取基础项列表失败:', error)
  } finally {
    loading.value = false
    nextTick(() => {
      updatePageSizeByHeight()
      updateHScrollMetrics()
    })
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
  const h = tableHInnerRef.value
  if (h) h.scrollLeft = 0
  nextTick(() => {
    updatePageSizeByHeight()
    updateHScrollMetrics()
  })
}

function submitJumpPage() {
  goPage(Number(jumpPage.value) || 1)
}

function updatePageSizeByHeight() {
  if (!tableViewportRef.value) return
  const shell = tableViewportRef.value
  const cardHeight = shell.clientHeight
  if (cardHeight <= 0) return
  const headEl = shell.querySelector('thead')
  const headHeight = Math.ceil(headEl?.getBoundingClientRect().height || TABLE_HEAD_HEIGHT)
  const rowHeight = ROW_HEIGHT
  const availableHeight = Math.max(0, cardHeight - headHeight - 2)
  const rows = Math.max(10, Math.floor(availableHeight / rowHeight) + 1)
  if (rows !== pagination.pageSize) {
    pagination.pageSize = rows
    pagination.pageNum = Math.min(pagination.pageNum, totalPages.value)
  }
}

function openEditModal(mode, row) {
  editModal.mode = mode
  editModal.visible = true
  editModal.targetId = row?.id || null
  editModal.title = mode === 'edit' ? '编辑数据' : '新建数据'

  const r = row ? normalizeBaseRow(row) : null
  Object.assign(editForm, {
    partName: r?.partName || '',
    partNo: r?.partNo || '',
    childName: r?.childName || '',
    childNo: r?.childNo || '',
    toolName: r?.toolName || '',
    toolType: r?.toolType || '',
    realToolNo: r?.realToolNo || '',
    supplier: r?.supplier || '',
    toolSupplier: r?.toolSupplier || '',
    owner: r?.owner || r?.purchaser || '',
    vendorToolNo: r?.vendorToolNo || '',
    customerToolNo: r?.customerToolNo || '',
    partsFactory: r?.partsFactory || ''
  })
  const loc = parseToolUsageLine(r?.toolUsageLocation || '')
  Object.assign(editLocationParts, loc)
}

function closeEditModal() {
  editModal.visible = false
}

function payloadFromEditForm() {
  return {
    ...editForm,
    purchaser: editForm.owner || '',
    toolUsageLocation: composeAddressLine(editLocationParts)
  }
}

async function saveEditData() {
  try {
    const payload = payloadFromEditForm()
    if (editModal.mode === 'create') {
      await createBaseItem(payload)
    } else if (editModal.mode === 'edit' && editModal.targetId) {
      await updateBaseItem(editModal.targetId, payload)
    }
    await fetchBaseItems()
  } catch (error) {
    console.error('保存基础项失败:', error)
  }
  closeEditModal()
}

function openImportModal() {
  importFileKey.value += 1
  importPendingFile.value = null
  importModal.visible = true
  importModal.fileName = ''
  importModal.progress = 0
  importModal.percent = 0
  importModal.statusText = '请选择文件'
}

function closeImportModal() {
  importModal.visible = false
  importPendingFile.value = null
}

function pickImportFile(event) {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  importPendingFile.value = file
  importModal.fileName = file.name
  importModal.statusText = '已选择，点击确认将校验表头'
  importModal.progress = importModal.totalKb
  importModal.percent = 100
}

async function confirmImport() {
  const file = importPendingFile.value
  if (!file) {
    window.alert('请先选择 Excel 文件')
    return
  }
  const name = file.name.toLowerCase()
  if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
    window.alert('请选择 .xlsx 或 .xls 文件')
    return
  }
  try {
    const { rows, error } = await parseExcelToRows(file, BASE_EXCEL_COLUMNS)
    if (error) {
      window.alert(error)
      return
    }
    closeImportModal()
    openConfirm(
      `将按「零件编号」合并导入（共解析 ${rows.length} 行）：新零件号整行新增；已存在的零件号仅更新 Excel 中有填写（非空）的列，空单元格不会覆盖库内原值（含供应商、工装使用地等）。是否继续？`,
      'import-merge',
      { rows }
    )
  } catch (e) {
    console.error(e)
    window.alert('读取 Excel 失败，请稍后重试')
  }
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
  if (confirmDialog.action === 'import-merge' && confirmDialog.payload?.rows) {
    const rows = confirmDialog.payload.rows
    try {
      const { added, updated = 0, skipped } = await importBaseItemsByNewPartNoOnly(rows)
      selectedIds.value = []
      await fetchBaseItems()
      window.alert(
        `导入完成：新增 ${added} 条，合并更新已有行 ${updated} 条，跳过 ${skipped} 条（零件编号为空，或已存在且该行 Excel 全为空列）。`
      )
    } catch (error) {
      console.error('导入写入数据库失败:', error)
      const msg = error?.message || String(error)
      window.alert(`导入保存失败：${msg || '请稍后重试'}`)
    }
  }
  closeConfirm()
}
</script>

<style scoped>
.base-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* 为底部固定分页条留出空间，避免表格滚动区被遮挡 */
  padding-bottom: 64px;
}

.toolbar-card,
.search-card {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  padding: 10px 12px;
  flex-shrink: 0;
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}
.btn-complete {
  background: #23a559;
  color: #fff;
  border-color: #1d8f4c;
}
.btn-complete:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.table-panel {
  flex: 1;
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 纵向滚动与侧栏样式；横向由内层承担且隐藏原生横条，仅顶部 proxy 可见 */
.table-scroll-y-outer {
  flex: 1;
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  padding: 0;
  box-sizing: border-box;
}

.table-h-inner {
  overflow-x: auto;
  overflow-y: visible;
  min-width: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.table-h-inner::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.data-table {
  width: max-content;
  min-width: 100%;
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

.edit-grid .form-item label {
  width: 112px;
}

.edit-grid .form-item-span {
  grid-column: 1 / -1;
}

.edit-grid .location-hint {
  font-size: 12px;
  color: #60758e;
  padding: 2px 0 0 4px;
}

.edit-grid .form-item input,
.edit-grid .form-item select {
  min-width: 0;
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
