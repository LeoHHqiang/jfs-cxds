<template>
  <section ref="pageRootRef" class="delivery-page">
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
        <button type="button" class="btn btn-light" @click="exportDeliveryExcel">导出 Excel</button>
        <button class="btn btn-light" @click="openBatchMoveModal">批量移模</button>
        <button class="btn btn-light danger" @click="openDeleteConfirm()">删除</button>
        </div>
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
          <label>客户模具编号：</label>
          <input v-model="filters.customerToolNo" type="text" placeholder="请输入" />
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
            <th>工装分类</th>
            <th>工装实物编号</th>
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
            <td colspan="15" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="!tableData.length">
            <td colspan="15" class="empty-row">暂无交付追踪数据（与基础录入项同源，请先在基础项录入数据）</td>
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
            <td>{{ displayCell(row.toolType) }}</td>
            <td>{{ displayCell(row.realToolNo) }}</td>
            <td>{{ displayCell(row.supplier) }}</td>
            <td>{{ displayCell(row.toolSupplier) }}</td>
            <td>{{ displayCell(row.owner || row.purchaser) }}</td>
            <td>{{ displayCell(row.vendorToolNo) }}</td>
            <td>{{ displayCell(row.customerToolNo) }}</td>
            <td>{{ displayCell(row.partsFactory) }}</td>
            <td>{{ formatToolUsageLocationDisplay(row.toolUsageLocation) }}</td>
            <td class="action-col">
              <button class="link-btn" @click="handleFollow(row)">工装移模</button>
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
        <button :disabled="pagination.pageNum===1" @click="goPage(1)">&lt;&lt;</button>
        <button :disabled="pagination.pageNum===1" @click="goPage(pagination.pageNum - 1)">&lt;</button>
        <button
          v-for="p in pageList"
          :key="`delivery-${p}`"
          :class="{ active: p===pagination.pageNum }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button :disabled="pagination.pageNum===totalPages" @click="goPage(pagination.pageNum + 1)">&gt;</button>
        <button :disabled="pagination.pageNum===totalPages" @click="goPage(totalPages)">&gt;&gt;</button>
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

          <div class="block-title">新供应商信息（选择填写，可不选）</div>
          <div class="modal-grid">
            <div class="modal-item full">
              <label>新供应商：</label>
              <div class="select-stack">
                <select v-model="newSupplierSelect" class="full-select" @change="onNewSupplierSelectChange">
                  <option value="">请选择（可不选）</option>
                  <option v-for="n in PRESET_NEW_SUPPLIERS" :key="n" :value="n">{{ n }}</option>
                  <option value="__other__">其他（手动输入）</option>
                </select>
                <input
                  v-if="newSupplierSelect === '__other__'"
                  v-model="newSupplierCustom"
                  class="full-select"
                  type="text"
                  placeholder="请输入供应商名称"
                />
              </div>
            </div>
            <div class="modal-item">
              <label>省份：</label>
              <select v-model="replaceForm.province" class="full-select" @change="onReplaceProvinceChange">
                <option value="">请选择</option>
                <option v-for="p in CN_PROVINCES" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div class="modal-item">
              <label>市：</label>
              <select v-model="replaceForm.city" class="full-select" @change="onReplaceCityChange">
                <option value="">请选择</option>
                <option v-for="c in replaceCityOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="modal-item">
              <label>区/县：</label>
              <select v-model="replaceForm.district" class="full-select">
                <option value="">请选择</option>
                <option v-for="d in replaceDistrictOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="modal-item full"><label>详细地址：</label><input v-model="replaceForm.detailAddress" type="text" placeholder="可补充街道、门牌等" /></div>
          </div>

          <div class="record-wrap">
            <div class="block-title">移模记录</div>
            <div class="record-list">
              <div v-if="!replaceRecords.length" class="record-empty">暂无移模记录</div>
              <div v-else class="record-row" v-for="record in replaceRecords" :key="record.id">
                <p>
                  <span class="record-time">{{ record.date }}</span>
                  <span class="record-user">{{ record.operator }}</span>
                  自
                  <strong>{{ record.fromSupplier }}</strong>
                  变更为
                  <strong>{{ record.toSupplier }}</strong>
                </p>
                <button class="reuse-btn" @click="reuseRecord(record)">复用地址</button>
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

    <div v-if="batchMoveModal" class="modal-mask" @click.self="batchMoveModal = false">
      <div class="replace-modal batch-modal">
        <div class="modal-header">
          <h3>批量移模</h3>
          <button class="close-btn" @click="batchMoveModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="batch-title">将选中项工装使用地更新为（通过下拉里选择填写；可全部留空则清空使用地）：</p>
          <div class="batch-grid">
            <div class="modal-item">
              <label>省份：</label>
              <select v-model="batchAddress.province" class="full-select" @change="onBatchProvinceChange">
                <option value="">请选择</option>
                <option v-for="p in CN_PROVINCES" :key="'b-' + p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div class="modal-item">
              <label>市：</label>
              <select v-model="batchAddress.city" class="full-select" @change="onBatchCityChange">
                <option value="">请选择</option>
                <option v-for="c in batchCityOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="modal-item">
              <label>区/县：</label>
              <select v-model="batchAddress.district" class="full-select">
                <option value="">请选择</option>
                <option v-for="d in batchDistrictOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="modal-item full"><label>详细地址：</label><input v-model="batchAddress.detail" type="text" placeholder="可补充街道、门牌等" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveBatchMove">保存</button>
          <button class="btn btn-light" @click="batchMoveModal = false">取消</button>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick, watch } from 'vue'
import { useSyncedHorizontalScrollProxy } from '@/composables/useSyncedHorizontalScrollProxy'
import {
  batchApplyDeliveryToolLocations,
  deleteDeliveryItems,
  getDeliveryItems,
  getToolMoveHistoryForPartNo,
  recordToolMoves,
  updateBaseItem
} from '@/api'
import { useAcceptStageComplete } from '@/composables/useAcceptStageComplete'
import { downloadExcel, timestampedFilename } from '@/utils/excelExport'
import {
  CN_PROVINCES,
  PRESET_NEW_SUPPLIERS,
  TOOL_USAGE_FILTER_OPTIONS,
  citiesOfProvince,
  districtsOf,
  composeAddressLine,
  parseToolUsageLine,
  formatToolUsageLocationDisplay
} from '@/utils/chinaRegionSelect'

const { onComplete: onStageComplete, busy: stageCompleteBusy } = useAcceptStageComplete('delivery')

/** 与当前表格列一致（无勾选、无操作），用于导出 */
const DELIVERY_EXCEL_COLUMNS = [
  { header: '零件名称', key: 'partName' },
  { header: '零件编号', key: 'partNo' },
  { header: '子零件名称', key: 'childName' },
  { header: '子零件编号', key: 'childNo' },
  { header: '工装名称', key: 'toolName' },
  { header: '工装分类', key: 'toolType' },
  { header: '工装实物编号', key: 'realToolNo' },
  { header: '供应商', key: 'supplier' },
  { header: '工装供应商', key: 'toolSupplier' },
  { header: '项目负责人', key: 'owner', getValue: (r) => r.owner || r.purchaser || '' },
  { header: '供应商模具编号', key: 'vendorToolNo' },
  { header: '客户模具编号', key: 'customerToolNo' },
  { header: '零部件厂', key: 'partsFactory' },
  { header: '工装使用地', key: 'toolUsageLocation' }
]

function exportDeliveryExcel() {
  try {
    downloadExcel({
      filename: `${timestampedFilename('交付追踪')}.xlsx`,
      sheetName: '交付追踪',
      columns: DELIVERY_EXCEL_COLUMNS,
      rows: tableData.value,
      headersOnly: false
    })
  } catch (e) {
    console.error(e)
    window.alert('导出 Excel 失败，请稍后重试')
  }
}

function displayCell(val) {
  const s = val == null ? '' : String(val).trim()
  return s || '—'
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

const showReplaceModal = ref(false)
const currentReplaceRow = ref(null)
const batchMoveModal = ref(false)
const batchAddress = reactive({
  province: '',
  city: '',
  district: '',
  detail: ''
})
const confirmDialog = reactive({
  visible: false,
  message: '',
  action: '',
  payload: null
})
const newSupplierSelect = ref('')
const newSupplierCustom = ref('')

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
  province: '',
  city: '',
  district: '',
  detailAddress: ''
})

const replaceCityOptions = computed(() => citiesOfProvince(replaceForm.province))
const replaceDistrictOptions = computed(() => districtsOf(replaceForm.province, replaceForm.city))
const batchCityOptions = computed(() => citiesOfProvince(batchAddress.province))
const batchDistrictOptions = computed(() => districtsOf(batchAddress.province, batchAddress.city))

function onNewSupplierSelectChange() {
  if (newSupplierSelect.value !== '__other__') newSupplierCustom.value = ''
}

function onReplaceProvinceChange() {
  replaceForm.city = ''
  replaceForm.district = ''
}

function onReplaceCityChange() {
  replaceForm.district = ''
}

function onBatchProvinceChange() {
  batchAddress.city = ''
  batchAddress.district = ''
}

function onBatchCityChange() {
  batchAddress.district = ''
}

const replaceRecords = ref([])

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
  customerToolNo: '',
  toolUsageLocation: ''
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
  window.addEventListener('resize', onWindowResizeDelivery)
  await fetchDeliveryList()
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

function onWindowResizeDelivery() {
  updatePageSizeByHeight()
  updateHScrollMetrics()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResizeDelivery)
  layoutResizeObserver?.disconnect()
  layoutResizeObserver = null
})

async function fetchDeliveryList() {
  loading.value = true
  try {
    const res = await getDeliveryItems(filters)
    tableData.value = res.list || []
    pagination.total = res.total != null ? res.total : tableData.value.length
    pagination.pageNum = 1
    jumpPage.value = 1
    await nextTick()
    updatePageSizeByHeight()
    updateHScrollMetrics()
  } catch (error) {
    console.error('获取交付追踪数据失败:', error)
  } finally {
    loading.value = false
    nextTick(() => {
      updatePageSizeByHeight()
      updateHScrollMetrics()
    })
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
    purchaser: '',
    customerToolNo: '',
    toolUsageLocation: ''
  })
  fetchDeliveryList()
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

function mapMoveHistoryRecords(partNo) {
  return getToolMoveHistoryForPartNo(partNo).map((h) => ({
    id: h.id,
    date: h.movedAt || '',
    operator: '移模',
    fromSupplier: formatToolUsageLocationDisplay(h.fromLocation),
    toSupplier: formatToolUsageLocationDisplay(h.toLocation),
    toAddress: ''
  }))
}

function handleFollow(row) {
  currentReplaceRow.value = row
  replaceRecords.value = mapMoveHistoryRecords(row.partNo)
  const loc = parseToolUsageLine(row.toolUsageLocation || '')
  newSupplierSelect.value = ''
  newSupplierCustom.value = ''
  Object.assign(replaceForm, {
    partName: row.partName || '',
    partNo: row.partNo || '',
    childName: row.childName || '',
    childNo: row.childNo || '',
    toolName: row.toolName || '',
    toolType: row.toolType || '',
    vendorToolNo: row.vendorToolNo || '',
    realToolNo: row.realToolNo || '',
    supplier: row.supplier || '',
    originToolSupplier: row.toolSupplier || row.supplier || '',
    partsFactory: row.partsFactory || '',
    purchaser: row.owner || row.purchaser || '',
    province: loc.province || '',
    city: loc.city || '',
    district: loc.district || '',
    detailAddress: loc.detail || ''
  })
  showReplaceModal.value = true
}

function closeReplaceModal() {
  showReplaceModal.value = false
}

function reuseRecord(record) {
  replaceForm.detailAddress = record.toSupplier || record.toAddress || ''
}

async function saveReplace() {
  const row = currentReplaceRow.value
  if (!row?.id) {
    showReplaceModal.value = false
    return
  }
  const toLine = composeAddressLine({
    province: replaceForm.province,
    city: replaceForm.city,
    district: replaceForm.district,
    detail: replaceForm.detailAddress
  })
  const fromLoc = row.toolUsageLocation || ''
  try {
    await updateBaseItem(row.id, { toolUsageLocation: toLine })
    const fromNorm = String(fromLoc).trim()
    const toNorm = String(toLine).trim()
    if (fromNorm !== toNorm) {
      recordToolMoves([
        {
          partNo: row.partNo,
          fromLocation: fromLoc,
          toLocation: toLine,
          baseItemId: row.id
        }
      ])
    }
    await fetchDeliveryList()
    replaceRecords.value = mapMoveHistoryRecords(row.partNo)
    currentReplaceRow.value = { ...row, toolUsageLocation: toLine }
    const locAfter = parseToolUsageLine(toLine)
    Object.assign(replaceForm, {
      province: locAfter.province || '',
      city: locAfter.city || '',
      district: locAfter.district || '',
      detailAddress: locAfter.detail || ''
    })
  } catch (e) {
    console.error(e)
    window.alert('保存失败，请稍后重试')
  }
}

function openBatchMoveModal() {
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要批量移模的数据', 'noop')
    return
  }
  batchMoveModal.value = true
}

function saveBatchMove() {
  batchMoveModal.value = false
  openConfirm(
    `确定将选中的 ${selectedIds.value.length} 项的工装使用地更新为当前选择内容？省市区县均可不选（全部留空则清空使用地）。`,
    'batch-pass',
    { ...batchAddress }
  )
}

function openDeleteConfirm() {
  if (!selectedIds.value.length) {
    openConfirm('请先勾选需要删除的数据', 'noop')
    return
  }
  openConfirm(`请注意，此为危险操作，确定删除${selectedIds.value.length}项数据吗？`, 'delete')
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
  if (confirmDialog.action === 'delete') {
    try {
      await deleteDeliveryItems(selectedIds.value)
      selectedIds.value = []
      await fetchDeliveryList()
    } catch (error) {
      console.error('删除交付追踪数据失败:', error)
    }
  }
  if (confirmDialog.action === 'batch-pass' && confirmDialog.payload) {
    try {
      batchApplyDeliveryToolLocations(selectedIds.value, confirmDialog.payload)
      selectedIds.value = []
      await fetchDeliveryList()
    } catch (error) {
      console.error('批量移模保存失败:', error)
      window.alert('批量移模保存失败，请稍后重试')
    }
  }
  closeConfirm()
}
</script>

<style scoped>
.delivery-page {
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

.table-panel {
  flex: 1;
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 原生横向 + 纵向滚动，避免「代理条 + translate」在部分布局下误判宽度导致无滚动条 */
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

.select-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
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

.record-empty {
  padding: 14px 6px;
  font-size: 13px;
  color: #8a9bb1;
  text-align: center;
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
