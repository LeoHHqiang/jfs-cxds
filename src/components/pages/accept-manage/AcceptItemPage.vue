<template>
  <section ref="pageRootRef" class="accept-item-page">
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
          <button type="button" class="btn btn-light" :disabled="!projectId" @click="exportAcceptItemExcel">导出 Excel</button>
          <button type="button" class="btn btn-light danger" :disabled="!projectId" @click="openDeleteConfirm">删除</button>
        </div>
      </div>
    </div>

    <div class="search-card">
      <div v-if="!projectId" class="inline-context-hint">
        请从「验收管理」进入并选择项目后再使用本页；验收材料按项目隔离保存。
      </div>
      <div class="search-actions">
        <button type="button" class="btn btn-primary" @click="fetchTable">查询</button>
        <button type="button" class="btn btn-light" @click="resetFilters">重置</button>
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
              <input type="checkbox" :checked="isAllChecked" @change="toggleAllSelection($event.target.checked)" />
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
            <th>长（mm）</th>
            <th>宽（mm）</th>
            <th>高（mm）</th>
            <th>重量（Kg）</th>
            <th>验收报告</th>
            <th>材质证明</th>
            <th>上模图片</th>
            <th>下模图片</th>
            <th>模具整体图片</th>
            <th>实物铭牌图片</th>
            <th>工装使用地</th>
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="27" class="empty-row">加载中...</td></tr>
          <tr v-else-if="!projectId"><td colspan="27" class="empty-row">未选择验收项目</td></tr>
          <tr v-else-if="!tableData.length">
            <td colspan="27" class="empty-row empty-row-stack">
              <p class="empty-row-title">暂无数据。列表与「交付追踪」一致（同一套工装行与查询条件）；上传的验收附件按<strong>当前验收项目</strong>单独保存。</p>
              <p v-if="sessionStageCode" class="empty-row-sub">当前会话项目代号：{{ sessionStageCode }}。若曾清除站点数据或从书签直接进入，请返回「验收管理」重新进入本项目。</p>
              <p v-else class="empty-row-sub">请返回「验收管理」选择项目后再进入本页；也可点击「重置」清空筛选条件。</p>
            </td>
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
            <td><span :class="dimClass(row, 'length')">{{ dimText(row, 'length') }}</span></td>
            <td><span :class="dimClass(row, 'width')">{{ dimText(row, 'width') }}</span></td>
            <td><span :class="dimClass(row, 'height')">{{ dimText(row, 'height') }}</span></td>
            <td><span :class="dimClass(row, 'weight')">{{ dimText(row, 'weight') }}</span></td>
            <td><span :class="uploadClass(row, 'acceptReport')">{{ uploadText(row, 'acceptReport') }}</span></td>
            <td><span :class="uploadClass(row, 'materialCert')">{{ uploadText(row, 'materialCert') }}</span></td>
            <td><span :class="uploadClass(row, 'upperMold')">{{ uploadText(row, 'upperMold') }}</span></td>
            <td><span :class="uploadClass(row, 'lowerMold')">{{ uploadText(row, 'lowerMold') }}</span></td>
            <td><span :class="uploadClass(row, 'overallMold')">{{ uploadText(row, 'overallMold') }}</span></td>
            <td><span :class="uploadClass(row, 'nameplate')">{{ uploadText(row, 'nameplate') }}</span></td>
            <td class="cell-wrap">{{ formatToolUsageLocationDisplay(row.toolUsageLocation) }}</td>
            <td class="action-col">
              <button type="button" class="link-btn" @click="openFillModal(row)">
                {{ row.hasAcceptMaterial ? '验收项修改' : '验收项录入' }}
              </button>
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
        <button :disabled="pagination.pageNum === 1" @click="goPage(1)">&lt;&lt;</button>
        <button :disabled="pagination.pageNum === 1" @click="goPage(pagination.pageNum - 1)">&lt;</button>
        <button
          v-for="p in pageList"
          :key="`accept-item-${p}`"
          :class="{ active: p === pagination.pageNum }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button :disabled="pagination.pageNum === totalPages" @click="goPage(pagination.pageNum + 1)">&gt;</button>
        <button :disabled="pagination.pageNum === totalPages" @click="goPage(totalPages)">&gt;&gt;</button>
      </div>
    </div>

    <div v-if="fillModal.visible" class="modal-mask" @click.self="closeFillModal">
      <div class="entry-modal fill-modal">
        <div class="modal-header">
          <h3>验收填报</h3>
          <button type="button" class="close-btn" @click="closeFillModal">×</button>
        </div>
        <div class="modal-body">
          <div class="readonly-grid">
            <div class="ro-item"><span class="ro-label">零件名称</span><span class="ro-val">{{ fillContext.partName }}</span></div>
            <div class="ro-item"><span class="ro-label">零件编号</span><span class="ro-val">{{ fillContext.partNo }}</span></div>
            <div class="ro-item"><span class="ro-label">子零件名称</span><span class="ro-val">{{ fillContext.childName }}</span></div>
            <div class="ro-item"><span class="ro-label">子零件编号</span><span class="ro-val">{{ fillContext.childNo }}</span></div>
            <div class="ro-item"><span class="ro-label">工装名称</span><span class="ro-val">{{ fillContext.toolName }}</span></div>
            <div class="ro-item"><span class="ro-label">工装分类</span><span class="ro-val">{{ fillContext.toolType }}</span></div>
            <div class="ro-item"><span class="ro-label">供应商模具编号</span><span class="ro-val">{{ fillContext.vendorToolNo }}</span></div>
            <div class="ro-item"><span class="ro-label">工装实物编号</span><span class="ro-val">{{ fillContext.realToolNo }}</span></div>
            <div class="ro-item"><span class="ro-label">供应商</span><span class="ro-val">{{ fillContext.supplier }}</span></div>
            <div class="ro-item"><span class="ro-label">工装供应商</span><span class="ro-val">{{ fillContext.toolSupplier }}</span></div>
            <div class="ro-item"><span class="ro-label">零部件厂</span><span class="ro-val">{{ fillContext.partsFactory }}</span></div>
            <div class="ro-item"><span class="ro-label">项目负责人</span><span class="ro-val">{{ fillContext.owner }}</span></div>
          </div>

          <div class="upload-section">
            <div class="upload-block">
              <div class="upload-label">
                <span class="req">*</span>验收报告
                <button type="button" class="link-inline" @click="downloadAcceptReportStub">下载模板</button>
              </div>
              <label class="drop-zone">
                <input type="file" class="hidden-input" @change="onPickFile('acceptReport', $event)" />
                <span>点击上传文件 或者 拖拽至此处上传</span>
                <span v-if="fillDraft.acceptReport" class="file-hint">{{ fileHint(fillDraft.acceptReport) }}</span>
              </label>
            </div>
            <div class="upload-block">
              <div class="upload-label"><span class="req">*</span>材质证明</div>
              <label class="drop-zone">
                <input type="file" class="hidden-input" @change="onPickFile('materialCert', $event)" />
                <span>点击上传文件 或者 拖拽至此处上传</span>
                <span v-if="fillDraft.materialCert" class="file-hint">{{ fileHint(fillDraft.materialCert) }}</span>
              </label>
            </div>
            <div class="upload-block">
              <div class="upload-label">上模图片</div>
              <label class="drop-zone">
                <input type="file" class="hidden-input" accept="image/*" @change="onPickFile('upperMold', $event)" />
                <span>点击上传文件 或者 拖拽至此处上传</span>
                <span v-if="fillDraft.upperMold" class="file-hint">{{ fileHint(fillDraft.upperMold) }}</span>
              </label>
            </div>
            <div class="upload-block">
              <div class="upload-label">下模图片</div>
              <label class="drop-zone">
                <input type="file" class="hidden-input" accept="image/*" @change="onPickFile('lowerMold', $event)" />
                <span>点击上传文件 或者 拖拽至此处上传</span>
                <span v-if="fillDraft.lowerMold" class="file-hint">{{ fileHint(fillDraft.lowerMold) }}</span>
              </label>
            </div>
            <div class="upload-block">
              <div class="upload-label"><span class="req">*</span>模具整体图片</div>
              <label class="drop-zone">
                <input type="file" class="hidden-input" accept="image/*" @change="onPickFile('overallMold', $event)" />
                <span>点击上传文件 或者 拖拽至此处上传</span>
                <span v-if="fillDraft.overallMold" class="file-hint">{{ fileHint(fillDraft.overallMold) }}</span>
              </label>
            </div>
            <div class="upload-block">
              <div class="upload-label"><span class="req">*</span>实物铭牌图片</div>
              <label class="drop-zone">
                <input type="file" class="hidden-input" accept="image/*" @change="onPickFile('nameplate', $event)" />
                <span>点击上传文件 或者 拖拽至此处上传</span>
                <span v-if="fillDraft.nameplate" class="file-hint">{{ fileHint(fillDraft.nameplate) }}</span>
              </label>
            </div>
          </div>

          <div class="form-grid dims-grid">
            <div class="form-item"><label>长（mm）：</label><input v-model="fillDraft.length" type="text" placeholder="长" /></div>
            <div class="form-item"><label>宽（mm）：</label><input v-model="fillDraft.width" type="text" placeholder="宽" /></div>
            <div class="form-item"><label>高（mm）：</label><input v-model="fillDraft.height" type="text" placeholder="高" /></div>
            <div class="form-item"><label>重量（kg）：</label><input v-model="fillDraft.weight" type="text" placeholder="重量" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" :disabled="fillSaving" @click="saveFill">保存</button>
          <button type="button" class="btn btn-light" @click="closeFillModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.visible" class="modal-mask" @click.self="closeConfirm">
      <div class="entry-modal confirm-modal">
        <div class="modal-header">
          <h3>提示</h3>
          <button type="button" class="close-btn" @click="closeConfirm">×</button>
        </div>
        <div class="modal-body confirm-text">{{ confirmDialog.message }}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="confirmAction">确认</button>
          <button type="button" class="btn btn-light" @click="closeConfirm">取消</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick, watch } from 'vue'
import { useSyncedHorizontalScrollProxy } from '@/composables/useSyncedHorizontalScrollProxy'
import {
  deleteAcceptItemMaterials,
  getAcceptItemTableRows,
  upsertAcceptItemMaterial
} from '@/api'
import { readAcceptStageContext } from '@/utils/acceptStageContext'
import { useAcceptStageComplete } from '@/composables/useAcceptStageComplete'
import { formatToolUsageLocationDisplay, TOOL_USAGE_FILTER_OPTIONS } from '@/utils/chinaRegionSelect'
import { downloadExcel, timestampedFilename } from '@/utils/excelExport'

const { onComplete: onStageComplete, busy: stageCompleteBusy } = useAcceptStageComplete('accept')

const ACCEPT_EXPORT_COLUMNS = [
  { header: '零件名称', key: 'partName' },
  { header: '零件编号', key: 'partNo' },
  { header: '子零件名称', key: 'childName' },
  { header: '子零件编号', key: 'childNo' },
  { header: '工装名称', key: 'toolName' },
  { header: '工装分类', key: 'toolType' },
  { header: '工装实物编号', key: 'realToolNo' },
  { header: '供应商', key: 'supplier' },
  { header: '工装供应商', key: 'toolSupplier' },
  { header: '项目负责人', getValue: (r) => displayCell(r.owner || r.purchaser) },
  { header: '供应商模具编号', key: 'vendorToolNo' },
  { header: '客户模具编号', key: 'customerToolNo' },
  { header: '零部件厂', key: 'partsFactory' },
  { header: '长（mm）', getValue: (r) => dimExport(r, 'length') },
  { header: '宽（mm）', getValue: (r) => dimExport(r, 'width') },
  { header: '高（mm）', getValue: (r) => dimExport(r, 'height') },
  { header: '重量（Kg）', getValue: (r) => dimExport(r, 'weight') },
  { header: '验收报告', getValue: (r) => uploadExport(r, 'acceptReport') },
  { header: '材质证明', getValue: (r) => uploadExport(r, 'materialCert') },
  { header: '上模图片', getValue: (r) => uploadExport(r, 'upperMold') },
  { header: '下模图片', getValue: (r) => uploadExport(r, 'lowerMold') },
  { header: '模具整体图片', getValue: (r) => uploadExport(r, 'overallMold') },
  { header: '实物铭牌图片', getValue: (r) => uploadExport(r, 'nameplate') },
  { header: '工装使用地', getValue: (r) => formatToolUsageLocationDisplay(r.toolUsageLocation) }
]

function displayCell(val) {
  const s = val == null ? '' : String(val).trim()
  return s || '—'
}

function dimExport(row, key) {
  const v = row.acceptMaterial && String(row.acceptMaterial[key] || '').trim()
  return v || '未上传'
}

function uploadExport(row, key) {
  const v = row.acceptMaterial && String(row.acceptMaterial[key] || '').trim()
  return v ? '已上传' : '未上传'
}

function exportAcceptItemExcel() {
  if (!projectId.value) {
    window.alert('未选择验收项目，无法导出')
    return
  }
  try {
    downloadExcel({
      filename: `${timestampedFilename('验收项录入')}.xlsx`,
      sheetName: '验收项',
      columns: ACCEPT_EXPORT_COLUMNS,
      rows: tableData.value,
      headersOnly: false
    })
  } catch (e) {
    console.error(e)
    window.alert('导出 Excel 失败，请稍后重试')
  }
}

function downloadAcceptReportStub() {
  try {
    downloadExcel({
      filename: '验收报告填报模板.xlsx',
      sheetName: '说明',
      columns: [
        { header: '填写说明', key: 't1' },
        { header: '零件编号', key: 't2' },
        { header: '工装名称', key: 't3' }
      ],
      rows: [{ t1: '请按企业规范填写后上传', t2: fillContext.partNo || '', t3: fillContext.toolName || '' }],
      headersOnly: false
    })
  } catch (e) {
    console.error(e)
    window.alert('下载模板失败')
  }
}

const projectId = ref(0)
/** 进入阶段页时写入 sessionStorage，用于空表时提示是否与基础项项目代号不一致 */
const sessionStageCode = ref('')
const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
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

const fillModal = reactive({ visible: false })
const fillSaving = ref(false)
const fillRowId = ref(null)
const fillContext = reactive({
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
  owner: ''
})
const fillDraft = reactive({
  acceptReport: '',
  materialCert: '',
  upperMold: '',
  lowerMold: '',
  overallMold: '',
  nameplate: '',
  length: '',
  width: '',
  height: '',
  weight: ''
})

const confirmDialog = reactive({
  visible: false,
  message: '',
  action: ''
})

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
const isAllChecked = computed(
  () => pagedData.value.length > 0 && pagedData.value.every((item) => selectedIds.value.includes(item.id))
)

watch(pagedData, () => nextTick(() => updateHScrollMetrics()), { flush: 'post' })

function mat(row) {
  return row.acceptMaterial
}

function uploadText(row, key) {
  return mat(row) && String(mat(row)[key] || '').trim() ? '已上传' : '未上传'
}

function uploadClass(row, key) {
  return mat(row) && String(mat(row)[key] || '').trim() ? 'status-ok' : 'status-miss'
}

function dimText(row, key) {
  const v = mat(row) && String(mat(row)[key] || '').trim()
  return v || '未上传'
}

function dimClass(row, key) {
  const v = mat(row) && String(mat(row)[key] || '').trim()
  return v ? 'status-ok' : 'status-miss'
}

function fileHint(stored) {
  if (!stored) return ''
  if (String(stored).startsWith('mock:')) return String(stored).slice(5)
  return '已选择文件'
}

onMounted(async () => {
  window.addEventListener('resize', onWindowResizeAcceptItem)
  const c = readAcceptStageContext()
  projectId.value = Number(c?.projectId) || 0
  sessionStageCode.value = c?.code != null && String(c.code).trim() ? String(c.code).trim() : ''
  await fetchTable()
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

function onWindowResizeAcceptItem() {
  updatePageSizeByHeight()
  updateHScrollMetrics()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResizeAcceptItem)
  layoutResizeObserver?.disconnect()
  layoutResizeObserver = null
})

async function fetchTable() {
  if (!projectId.value) {
    tableData.value = []
    pagination.total = 0
    await nextTick()
    updateHScrollMetrics()
    return
  }
  loading.value = true
  try {
    const res = await getAcceptItemTableRows(projectId.value, { ...filters })
    tableData.value = res.list || []
    pagination.total = res.total ?? tableData.value.length
    pagination.pageNum = 1
    jumpPage.value = 1
    await nextTick()
    updatePageSizeByHeight()
    updateHScrollMetrics()
  } catch (e) {
    console.error(e)
    window.alert('加载失败')
  } finally {
    loading.value = false
    nextTick(() => {
      updatePageSizeByHeight()
      updateHScrollMetrics()
    })
  }
}

function resetFilters() {
  Object.keys(filters).forEach((k) => {
    filters[k] = ''
  })
  fetchTable()
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
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
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

function openFillModal(row) {
  if (!projectId.value) {
    window.alert('未选择验收项目')
    return
  }
  fillRowId.value = row.id
  Object.assign(fillContext, {
    partName: row.partName || '',
    partNo: row.partNo || '',
    childName: row.childName || '',
    childNo: row.childNo || '',
    toolName: row.toolName || '',
    toolType: row.toolType || '',
    vendorToolNo: row.vendorToolNo || '',
    realToolNo: row.realToolNo || '',
    supplier: row.supplier || '',
    toolSupplier: row.toolSupplier || '',
    partsFactory: row.partsFactory || '',
    owner: row.owner || row.purchaser || ''
  })
  const m = row.acceptMaterial
  Object.assign(fillDraft, {
    acceptReport: m?.acceptReport || '',
    materialCert: m?.materialCert || '',
    upperMold: m?.upperMold || '',
    lowerMold: m?.lowerMold || '',
    overallMold: m?.overallMold || '',
    nameplate: m?.nameplate || '',
    length: m?.length || '',
    width: m?.width || '',
    height: m?.height || '',
    weight: m?.weight || ''
  })
  fillModal.visible = true
}

function closeFillModal() {
  fillModal.visible = false
  fillRowId.value = null
}

function onPickFile(key, evt) {
  const file = evt.target.files && evt.target.files[0]
  if (!file) return
  fillDraft[key] = `mock:${file.name}`
  evt.target.value = ''
}

async function saveFill() {
  if (!projectId.value || fillRowId.value == null) return
  if (!String(fillDraft.acceptReport || '').trim()) {
    window.alert('请上传验收报告')
    return
  }
  if (!String(fillDraft.materialCert || '').trim()) {
    window.alert('请上传材质证明')
    return
  }
  if (!String(fillDraft.overallMold || '').trim()) {
    window.alert('请上传模具整体图片')
    return
  }
  if (!String(fillDraft.nameplate || '').trim()) {
    window.alert('请上传实物铭牌图片')
    return
  }
  fillSaving.value = true
  try {
    await upsertAcceptItemMaterial({
      projectId: projectId.value,
      baseItemId: fillRowId.value,
      payload: { ...fillDraft }
    })
    closeFillModal()
    await fetchTable()
  } catch (e) {
    console.error(e)
    window.alert('保存失败')
  } finally {
    fillSaving.value = false
  }
}

function openDeleteConfirm() {
  if (!projectId.value) {
    window.alert('未选择验收项目')
    return
  }
  if (!selectedIds.value.length) {
    window.alert('请先勾选需要删除的数据')
    return
  }
  confirmDialog.visible = true
  confirmDialog.message = '将删除所选行在当前项目下的验收材料记录（不含基础项与工装地址）。确定继续？'
  confirmDialog.action = 'delete'
}

function closeConfirm() {
  confirmDialog.visible = false
}

async function confirmAction() {
  if (confirmDialog.action === 'delete') {
    try {
      await deleteAcceptItemMaterials(projectId.value, selectedIds.value)
      selectedIds.value = []
      await fetchTable()
    } catch (e) {
      console.error(e)
      window.alert('删除失败')
    }
  }
  closeConfirm()
}
</script>

<style scoped>
.accept-item-page {
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

.inline-context-hint {
  color: #8a5a16;
  background: #fff9ed;
  border: 1px solid #f0e0c4;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  margin-bottom: 10px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
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

.btn-light {
  background: #f7f9fc;
}

.btn-light.danger {
  color: #778ca7;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 14px;
}

.dims-grid {
  margin-top: 14px;
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

.cell-wrap {
  white-space: normal;
  max-width: 220px;
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
  width: 100px;
}

.empty-row {
  text-align: center !important;
  color: #8a9bb1;
  padding: 16px 0 !important;
}

.empty-row-stack {
  text-align: left !important;
  padding: 20px 28px !important;
  max-width: 760px;
  margin: 0 auto;
}

.empty-row-title,
.empty-row-sub {
  margin: 0 0 10px;
  line-height: 1.55;
}

.empty-row-sub:last-child {
  margin-bottom: 0;
  font-size: 12px;
  color: #9aaaba;
}

.status-ok {
  color: #2f7df7;
}

.status-miss {
  color: #e54545;
}

.link-btn {
  border: none;
  background: transparent;
  color: #2f7df7;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
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
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4ecf5;
}

.fill-modal .modal-body {
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #ecf1f8;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 18px;
  color: #32485f;
  margin: 0;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  color: #7e8ea4;
}

.modal-body {
  padding: 16px 18px;
}

.readonly-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 16px;
  margin-bottom: 16px;
}

.ro-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.ro-label {
  color: #8a9bb1;
}

.ro-val {
  color: #32485f;
  word-break: break-all;
}

.upload-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.upload-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-label {
  font-size: 12px;
  color: #4b6079;
}

.req {
  color: #e54545;
  margin-right: 2px;
}

.link-inline {
  margin-left: 8px;
  border: none;
  background: none;
  color: #2f7df7;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.drop-zone {
  border: 2px dashed #c9d3e3;
  border-radius: 8px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #7d90a8;
  text-align: center;
}

.file-hint {
  color: #2f7df7;
  font-size: 11px;
}

.hidden-input {
  display: none;
}

.modal-footer {
  padding: 10px 18px 16px;
  border-top: 1px solid #ecf1f8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.confirm-modal {
  width: min(520px, 90vw);
}

.confirm-text {
  font-size: 14px;
  color: #3a4f68;
  line-height: 1.8;
}
</style>
