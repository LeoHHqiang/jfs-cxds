<template>
  <section class="move-apply-page">
    <div class="toolbar-card">
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="openCreateModal">+ 新建移模申请</button>
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
            <option value="">处理中 / 待审批 / 已通过</option>
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="draft">处理中</option>
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
              <button v-if="row.status === 'pending'" type="button" class="link-btn" @click="onWithdraw(row)">撤回</button>
              <button v-if="row.status === 'draft'" type="button" class="link-btn" @click="editApply(row)">编辑</button>
              <button v-if="row.status === 'draft'" type="button" class="link-btn danger-text" @click="onDeleteRow(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新建：验收完成后变更工装所在地 -->
    <div v-if="createVisible" class="modal-mask" @click.self="closeCreateModal">
      <div class="modal-sheet form-sheet">
        <div class="modal-head form-head">
          <button type="button" class="icon-close" @click="closeCreateModal">✕</button>
          <h3 class="form-sheet-title">移模申请单</h3>
          <div class="form-head-actions">
            <button type="button" class="btn btn-primary btn-head" @click="submitCreate">提交</button>
            <button type="button" class="btn btn-save-outline btn-head" @click="saveDraftToList">保存</button>
          </div>
        </div>
        <div class="modal-scroll form-scroll">
          <div class="sec-block">
            <h4 class="sec-heading">基础信息</h4>
            <div class="form-two">
              <div class="field"><label>移模编号</label><input v-model="createForm.transferNo" placeholder="提交时可自动生成" /></div>
              <div class="field"><label>紧急程度</label>
                <select v-model="createForm.urgency">
                  <option value="正常">正常</option>
                  <option value="紧急">紧急</option>
                  <option value="特急">特急</option>
                </select>
              </div>
              <div class="field"><label>申请人</label><input v-model="createForm.applicant" readonly class="readonly" /></div>
              <div class="field"><label>申请人工号</label><input v-model="createForm.applicantId" readonly class="readonly" /></div>
              <div class="field span-2"><label>申请人部门</label><input v-model="createForm.dept" readonly class="readonly" /></div>
              <div class="field"><label>申请日期</label><input v-model="createForm.applyDate" type="date" /></div>
              <div class="field"><label>电话</label><input v-model="createForm.phone" /></div>
              <div class="field span-2"><label>邮箱</label><input v-model="createForm.email" type="email" /></div>
            </div>
          </div>

          <div class="sec-block">
            <div v-if="optionsLoading" class="muted">加载项目选项...</div>
            <div v-else class="form-two">
              <div class="field span-2"><label>项目名称</label>
                <select v-model="createForm.projectCode">
                  <option value="">请选择项目</option>
                  <option v-for="p in projectOptions" :key="p.code" :value="p.code">{{ p.label }}</option>
                </select>
              </div>
              <div class="field span-2"><label>零件编号</label>
                <input
                  v-model="partSearchKeyword"
                  type="search"
                  class="part-search-input"
                  :disabled="!createForm.projectCode || partsLoading"
                  autocomplete="off"
                  placeholder="在当前项目零件中搜索：零件号、名称或工装（可选）"
                />
                <select v-model="createForm.baseItemId" :disabled="!createForm.projectCode || partsLoading">
                  <option value="">{{ partsLoading ? '加载中…' : displayPartOptions.length ? '请选择零件（基础项）' : '当前项目下暂无可选零件（请核对基础项的项目编码/绑定或验收项材料）' }}</option>
                  <option v-for="row in displayPartOptions" :key="row.id" :value="String(row.id)">{{ formatPartOptionLabel(row) }}</option>
                </select>
              </div>
              <div class="field span-2"><label>移模模具类型（工装分类）</label>
                <input
                  class="readonly"
                  readonly
                  :value="payloadPartRow ? (payloadPartRow.toolType || '') : ''"
                  placeholder=""
                />
              </div>
              <div class="field"><label>货币</label>
                <select v-model="createForm.currency">
                  <option value="CNY">CNY</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div class="field span-2"><label>原模具工装所在地</label>
                <input
                  class="readonly"
                  readonly
                  :value="payloadPartRow ? (payloadPartRow.toolUsageLocation || '') : ''"
                  placeholder=""
                />
              </div>
              <div class="field span-2">
                <label>转移至地（省 / 市 / 区县）</label>
                <div class="addr-grid">
                  <select v-model="createForm.toProvince" class="addr-select">
                    <option value="">请选择省</option>
                    <option v-for="p in CN_PROVINCES" :key="p" :value="p">{{ p }}</option>
                  </select>
                  <select v-model="createForm.toCity" class="addr-select" :disabled="!createForm.toProvince">
                    <option value="">请选择市</option>
                    <option v-for="c in toCityOptions" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <select v-model="createForm.toDistrict" class="addr-select" :disabled="!createForm.toCity">
                    <option value="">请选择区县</option>
                    <option v-for="d in toDistrictOptions" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
              </div>
              <div class="field span-2"><label>详细地址</label>
                <input
                  v-model="createForm.toDetail"
                  type="text"
                  placeholder="道路、门牌号、楼栋、仓库号等（与省市区县组合为完整地址）"
                />
              </div>
            </div>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" @click="closeCreateModal">取消</button>
        </div>
      </div>
    </div>

    <!-- 查看：明细区仅展示已操作且为待审批/已通过的明细行 -->
    <div v-if="viewVisible" class="modal-mask" @click.self="viewVisible = false">
      <div class="modal-sheet view-mode form-sheet">
        <div class="modal-head form-head view-head">
          <button type="button" class="icon-close" @click="viewVisible = false">✕</button>
          <h3 class="form-sheet-title">移模申请单</h3>
          <span class="apply-no-badge">{{ viewRow?.applyNo }}</span>
        </div>
        <div class="modal-scroll form-scroll">
          <template v-if="viewRow">
            <div class="sec-block">
              <h4 class="sec-heading">基础信息</h4>
              <div class="form-two view-fields">
                <div class="field"><label>移模编号</label><div class="view-val">{{ viewMeta.transferNo }}</div></div>
                <div class="field"><label>紧急程度</label><div class="view-val">{{ viewMeta.urgency }}</div></div>
                <div class="field"><label>申请人</label><div class="view-val">{{ viewMeta.applicant }}</div></div>
                <div class="field"><label>申请人工号</label><div class="view-val">{{ viewMeta.applicantId }}</div></div>
                <div class="field span-2"><label>申请人部门</label><div class="view-val">{{ viewMeta.dept }}</div></div>
                <div class="field"><label>申请日期</label><div class="view-val">{{ viewMeta.applyDate }}</div></div>
                <div class="field"><label>电话</label><div class="view-val">{{ viewMeta.phone }}</div></div>
                <div class="field span-2"><label>邮箱</label><div class="view-val">{{ viewMeta.email }}</div></div>
              </div>
            </div>
            <div class="sec-block">
              <div class="form-two view-fields">
                <div class="field span-2"><label>项目名称</label><div class="view-val">{{ viewMeta.projectName || viewMeta.projectCode }}</div></div>
                <div class="field"><label>货币</label><div class="view-val">{{ viewMeta.currency }}</div></div>
                <div class="field span-2"><label>备注</label><div class="view-val">明细见下表（模具类型、原址与转移地以行为准）</div></div>
              </div>
            </div>
            <div class="sec-block">
              <h4 class="sec-heading">移模明细（已操作 · 待审批/已通过）</h4>
              <table class="inner-table">
                <thead>
                  <tr>
                    <th>零件编号</th>
                    <th>工装名称</th>
                    <th>模具类型（工装分类）</th>
                    <th>原所在地</th>
                    <th>移模至</th>
                    <th>行状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in visibleDetailsView" :key="d.id">
                    <td>{{ d.partNo }}</td>
                    <td>{{ d.toolName }}</td>
                    <td>{{ d.moldType || '—' }}</td>
                    <td class="cell-wrap">{{ d.fromLocation }}</td>
                    <td class="cell-wrap">{{ d.toLocation }}</td>
                    <td>{{ lineStatusText[d.lineStatus] || d.lineStatus }}</td>
                  </tr>
                  <tr v-if="!visibleDetailsView.length">
                    <td colspan="6" class="muted center">无符合展示的明细（需已操作且为待审批/已通过）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" @click="viewVisible = false">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="message" class="message">{{ message }}</div>
  </section>
</template>

<script setup>
/* eslint-disable */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  createMoveApply,
  deleteMoveApply,
  fetchMoveApplyList as fetchMoveApplyData,
  fetchMoveApplyProjectOptions,
  fetchMoveApplyPartsForProject,
  filterVisibleMoveApplyDetails,
  getBaseItems,
  withdrawMoveApply
} from '@/api'
import {
  CN_PROVINCES,
  citiesOfProvince,
  composeAddressLine,
  districtsOf,
  parseToolUsageLine
} from '@/utils/chinaRegionSelect'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

const loading = ref(false)
const optionsLoading = ref(false)
const partsLoading = ref(false)
const tableData = ref([])
const createVisible = ref(false)
const viewVisible = ref(false)
const viewRow = ref(null)
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
  draft: '处理中',
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回'
}

const lineStatusText = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  draft: '处理中'
}

const createForm = reactive({
  transferNo: '',
  urgency: '正常',
  applicant: '',
  applicantId: '',
  dept: '',
  applyDate: '',
  phone: '',
  email: '',
  projectCode: '',
  baseItemId: '',
  currency: 'CNY',
  toProvince: '',
  toCity: '',
  toDistrict: '',
  toDetail: ''
})

const projectOptions = ref([])
const partOptions = ref([])
/** 在当前项目已加载的候选里做前端过滤（与 fetchMoveApplyPartsForProject 规则一致，不跨项目查库） */
const partSearchKeyword = ref('')
const editingDraftId = ref(null)
/** 按基础项 id 从「基础项录入」全表拉一行，保证工装分类与下拉列表数据源一致 */
const fetchedBaseRow = ref(null)

const visibleDetailsView = computed(() =>
  filterVisibleMoveApplyDetails(viewRow.value?.details, viewRow.value?.status)
)

function moldTypeFromBaseRow(row) {
  if (!row || typeof row !== 'object') return ''
  const v = row.toolType ?? row.tool_type ?? row['工装分类'] ?? row.moldType
  return v == null ? '' : String(v).trim()
}

const displayPartOptions = computed(() => {
  const q = partSearchKeyword.value.trim().toLowerCase()
  let list = partOptions.value
  if (q) {
    list = list.filter((r) => {
      const s = `${r.partNo} ${r.partName} ${r.toolName} ${r.projectCode || ''}`.toLowerCase()
      return s.includes(q)
    })
  }
  return [...list].sort((a, b) => {
    const pa = String(a.partNo || '')
    const pb = String(b.partNo || '')
    if (pa !== pb) return pa.localeCompare(pb, 'zh-Hans-CN')
    return String(a.id).localeCompare(String(b.id), 'zh-Hans-CN')
  })
})

function formatPartOptionLabel(row) {
  if (!row) return ''
  const base = `${row.partNo || '—'} · ${row.partName || '—'}`
  const pc = String(row.projectCode || '').trim()
  const cur = String(createForm.projectCode || '').trim()
  if (pc && cur && pc.toLowerCase() !== cur.toLowerCase()) return `${base}（${pc}）`
  return base
}

const selectedPartRow = computed(() => {
  const id = createForm.baseItemId
  if (id === '' || id == null) return null
  const list = partOptions.value
  const row =
    list.find((r) => String(r.id) === String(id)) ||
    list.find((r) => Number(r.id) === Number(id) && Number.isFinite(Number(id))) ||
    null
  if (!row) return null
  const toolType = moldTypeFromBaseRow(row)
  const toolUsageLocation = String(row.toolUsageLocation || row.tool_usage_location || '').trim()
  return { ...row, toolType, toolUsageLocation }
})

/** 下拉行与全库基础项合并；工装分类 / 使用地以 getBaseItems 结果为准 */
const payloadPartRow = computed(() => {
  const listRow = selectedPartRow.value
  const dbRow = fetchedBaseRow.value
  if (!listRow && !dbRow) return null
  const src = dbRow || listRow
  const merged = { ...(listRow || {}), ...(dbRow || {}) }
  const toolType = moldTypeFromBaseRow(dbRow || listRow)
  const toolUsageLocation = String(
    (dbRow && dbRow.toolUsageLocation) || (listRow && listRow.toolUsageLocation) || ''
  ).trim()
  return {
    ...merged,
    id: merged.id ?? src?.id,
    partName: merged.partName || src?.partName || '',
    partNo: merged.partNo || src?.partNo || '',
    toolName: merged.toolName || src?.toolName || '',
    supplier: merged.supplier || src?.supplier || '',
    toolType,
    toolUsageLocation
  }
})

watch(
  () => createForm.baseItemId,
  async (id) => {
    fetchedBaseRow.value = null
    if (id === '' || id == null) return
    try {
      const res = await getBaseItems({ id: String(id) })
      fetchedBaseRow.value = res?.list?.[0] || null
    } catch (e) {
      console.error('[moveApply] getBaseItems by id', e)
      fetchedBaseRow.value = null
    }
  },
  { immediate: true }
)

const toCityOptions = computed(() => citiesOfProvince(createForm.toProvince || ''))

const toDistrictOptions = computed(() => districtsOf(createForm.toProvince || '', createForm.toCity || ''))

function fullToDestination() {
  return String(
    composeAddressLine({
      province: createForm.toProvince,
      city: createForm.toCity,
      district: createForm.toDistrict,
      detail: String(createForm.toDetail || '').trim()
    }) || ''
  ).trim()
}

function resetToAddressFields() {
  createForm.toProvince = ''
  createForm.toCity = ''
  createForm.toDistrict = ''
  createForm.toDetail = ''
}

watch(
  () => createForm.projectCode,
  async (code) => {
    createForm.baseItemId = ''
    partSearchKeyword.value = ''
    resetToAddressFields()
    if (!code) {
      partOptions.value = []
      return
    }
    partsLoading.value = true
    try {
      const res = await fetchMoveApplyPartsForProject(code)
      partOptions.value = res?.data?.list || []
    } finally {
      partsLoading.value = false
    }
  }
)

watch(
  () => createForm.toProvince,
  () => {
    createForm.toCity = ''
    createForm.toDistrict = ''
  }
)

watch(
  () => createForm.toCity,
  () => {
    createForm.toDistrict = ''
  }
)

const viewMeta = computed(() => {
  const empty = {
    transferNo: '',
    urgency: '',
    applicant: '',
    applicantId: '',
    dept: '',
    applyDate: '',
    phone: '',
    email: '',
    projectCode: '',
    projectName: '',
    currency: ''
  }
  const row = viewRow.value
  if (!row) return empty
  const m = row.meta && typeof row.meta === 'object' ? row.meta : {}
  return {
    transferNo: m.transferNo || '',
    urgency: m.urgency || '',
    applicant: m.applicant || row.applicant || '',
    applicantId: m.applicantId || '',
    dept: m.dept || '',
    applyDate: m.applyDate || '',
    phone: m.phone || '',
    email: m.email || '',
    projectCode: m.projectCode || '',
    projectName: m.projectName || m.projectCode || '',
    currency: m.currency || ''
  }
})

onMounted(() => {
  fetchMoveApplyList()
})

async function fetchMoveApplyList() {
  loading.value = true
  try {
    const q = { ...filters, includeDraft: true }
    if (filters.status === 'rejected') {
      q.includeRejected = true
    }
    const res = await fetchMoveApplyData(q)
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
  viewRow.value = row
  viewVisible.value = true
}

async function editApply(row) {
  if (row.status !== 'draft') return
  await openEditDraftModal(row)
}

async function onWithdraw(row) {
  if (row.status !== 'pending') return
  if (!window.confirm(`确定撤回申请「${row.applyNo}」？将退回处理中，可再次编辑或删除。`)) return
  const res = await withdrawMoveApply({ id: row.id })
  if (!res?.success) {
    showMessage(res?.message || '撤回失败')
    return
  }
  await fetchMoveApplyList()
  showMessage('已撤回')
}

async function onDeleteRow(row) {
  if (row.status !== 'draft') return
  if (!window.confirm(`确定删除申请「${row.applyNo}」？此操作不可恢复。`)) return
  const res = await deleteMoveApply({ id: row.id })
  if (!res?.success) {
    showMessage(res?.message || '删除失败')
    return
  }
  await fetchMoveApplyList()
  showMessage('已删除')
}

function showMessage(text) {
  message.value = text
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, 1800)
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function resetCreateForm() {
  createForm.transferNo = ''
  createForm.urgency = '正常'
  createForm.applicant = ''
  createForm.applicantId = ''
  createForm.dept = ''
  createForm.applyDate = ''
  createForm.phone = ''
  createForm.email = ''
  createForm.projectCode = ''
  createForm.baseItemId = ''
  createForm.currency = 'CNY'
  partSearchKeyword.value = ''
  resetToAddressFields()
}

function applyUserDefaults() {
  const p = props.user?.profile || {}
  createForm.applicant = p.displayName || props.user?.name || ''
  createForm.applicantId = p.employeeId || props.user?.applicantId || ''
  createForm.dept = p.department || ''
  createForm.phone = p.phone || ''
  createForm.email = p.email || ''
  createForm.applyDate = todayISO()
}

function validateMoveFormBody() {
  if (!createForm.projectCode) {
    formError.value = '请选择项目名称'
    return false
  }
  if (!createForm.baseItemId) {
    formError.value = '请选择零件编号'
    return false
  }
  const row = payloadPartRow.value
  if (!row) {
    formError.value = '未找到该零件对应的基础项，请重新选择零件编号'
    return false
  }
  if (!String(row.toolType || '').trim()) {
    formError.value = '该零件在基础项中未维护工装分类，请先在基础项录入中补全'
    return false
  }
  if (!String(row.toolUsageLocation || '').trim()) {
    formError.value = '该零件在基础项中未维护工装使用地，请先在基础项录入中补全'
    return false
  }
  if (!createForm.toProvince) {
    formError.value = '请选择省份'
    return false
  }
  if (createForm.toProvince === '其他') {
    if (!String(createForm.toDetail || '').trim()) {
      formError.value = '选择「其他」时请在详细地址中填写完整地址'
      return false
    }
  } else {
    if (!createForm.toCity) {
      formError.value = '请选择市'
      return false
    }
    if (!createForm.toDistrict) {
      formError.value = '请选择区县'
      return false
    }
    if (!String(createForm.toDetail || '').trim()) {
      formError.value = '请填写详细地址（道路、门牌等）'
      return false
    }
  }
  if (!fullToDestination()) {
    formError.value = '请完善转移至地'
    return false
  }
  return true
}

function buildDetailsPayload() {
  const row = payloadPartRow.value
  if (!row) return []
  return [
    {
      baseItemId: row.id,
      partName: row.partName,
      partNo: row.partNo,
      toolName: row.toolName,
      supplier: row.supplier || '',
      moldType: String(row.toolType || '').trim(),
      fromLocation: String(row.toolUsageLocation || '').trim(),
      toLocation: fullToDestination(),
      operated: true,
      lineStatus: 'draft'
    }
  ]
}

async function saveDraftToList() {
  formError.value = ''
  if (!validateMoveFormBody()) return
  if (!String(createForm.transferNo || '').trim()) {
    createForm.transferNo = `YM${Date.now()}`
  }
  if (!createForm.applicant?.trim()) {
    formError.value = '申请人信息缺失，请重新登录后重试'
    return
  }
  const details = buildDetailsPayload()
  const first = details[0]
  const submitTitle = `${createForm.projectCode}-${first.partNo}-移模申请`
  const meta = {
    ...buildMetaFromForm(),
    title: submitTitle,
    previewLineCount: 1
  }
  const res = await createMoveApply({
    id: editingDraftId.value != null ? editingDraftId.value : undefined,
    status: 'draft',
    meta,
    details,
    partName: first.partName,
    partNo: first.partNo,
    toolName: first.toolName,
    fromSupplier: first.supplier || '',
    toSupplier: first.toLocation,
    applicant: meta.applicant
  })
  if (!res?.success) {
    formError.value = res?.message || '保存失败'
    return
  }
  if (res?.data?.id != null) {
    editingDraftId.value = res.data.id
  }
  await fetchMoveApplyList()
  showMessage('已保存为处理中，可继续修改后点「提交」')
}

function applyToAddressFromParsed(p) {
  if (!p) return
  createForm.toProvince = p.province || ''
  createForm.toCity = p.city || ''
  createForm.toDistrict = p.district || ''
  createForm.toDetail = p.detail || ''
}

async function openEditDraftModal(row) {
  formError.value = ''
  resetCreateForm()
  applyUserDefaults()
  editingDraftId.value = row.id
  partOptions.value = []
  createVisible.value = true
  optionsLoading.value = true
  try {
    const pr = await fetchMoveApplyProjectOptions()
    projectOptions.value = pr?.data?.list || []
  } finally {
    optionsLoading.value = false
  }
  const m = row.meta && typeof row.meta === 'object' ? row.meta : {}
  createForm.transferNo = m.transferNo || ''
  createForm.urgency = m.urgency || '正常'
  createForm.applicant = m.applicant || row.applicant || createForm.applicant
  createForm.applicantId = m.applicantId || createForm.applicantId
  createForm.dept = m.dept || createForm.dept
  createForm.applyDate = m.applyDate || createForm.applyDate
  createForm.phone = m.phone || ''
  createForm.email = m.email || ''
  createForm.projectCode = m.projectCode || ''
  createForm.currency = m.currency || 'CNY'
  if (m.toProvince) {
    createForm.toProvince = m.toProvince
    createForm.toCity = m.toCity || ''
    createForm.toDistrict = m.toDistrict || ''
    createForm.toDetail = m.toDetail || ''
  } else if (m.toLocationBase || m.toLocationDetail) {
    applyToAddressFromParsed(parseToolUsageLine(`${m.toLocationBase || ''}${m.toLocationDetail || ''}`))
  }
  const d0 = (row.details || []).find((x) => x.operated) || row.details?.[0]
  partsLoading.value = true
  try {
    if (createForm.projectCode) {
      const res = await fetchMoveApplyPartsForProject(createForm.projectCode)
      partOptions.value = res?.data?.list || []
    }
  } finally {
    partsLoading.value = false
  }
  if (d0?.baseItemId != null) {
    createForm.baseItemId = String(d0.baseItemId)
    partSearchKeyword.value = String(d0.partNo || '').trim()
  }
  if (!createForm.toProvince && !createForm.toDetail && d0?.toLocation) {
    applyToAddressFromParsed(parseToolUsageLine(String(d0.toLocation)))
  }
}

async function openCreateModal() {
  formError.value = ''
  editingDraftId.value = null
  resetCreateForm()
  applyUserDefaults()
  partOptions.value = []
  createVisible.value = true
  optionsLoading.value = true
  try {
    const pr = await fetchMoveApplyProjectOptions()
    projectOptions.value = pr?.data?.list || []
  } finally {
    optionsLoading.value = false
  }
}

function closeCreateModal() {
  createVisible.value = false
  formError.value = ''
  editingDraftId.value = null
}

function buildMetaFromForm() {
  return {
    transferNo: createForm.transferNo,
    urgency: createForm.urgency,
    applicant: createForm.applicant,
    applicantId: createForm.applicantId,
    dept: createForm.dept,
    applyDate: createForm.applyDate,
    phone: createForm.phone,
    email: createForm.email,
    projectCode: createForm.projectCode,
    projectName: createForm.projectCode,
    currency: createForm.currency,
    toProvince: createForm.toProvince,
    toCity: createForm.toCity,
    toDistrict: createForm.toDistrict,
    toDetail: createForm.toDetail
  }
}

async function submitCreate() {
  formError.value = ''
  if (!String(createForm.transferNo || '').trim()) {
    createForm.transferNo = `YM${Date.now()}`
  }
  if (!validateMoveFormBody()) return
  if (!createForm.applicant?.trim()) {
    formError.value = '申请人信息缺失，请重新登录后重试'
    return
  }
  const details = buildDetailsPayload()
  const first = details[0]
  const submitTitle = `${createForm.projectCode}-${first.partNo}-移模申请`
  const meta = {
    ...buildMetaFromForm(),
    title: submitTitle,
    previewLineCount: 1
  }
  const subRes = await createMoveApply({
    id: editingDraftId.value != null ? editingDraftId.value : undefined,
    status: 'pending',
    meta,
    details,
    partName: first.partName,
    partNo: first.partNo,
    toolName: first.toolName,
    fromSupplier: first.supplier || '',
    toSupplier: first.toLocation,
    applicant: meta.applicant
  })
  if (!subRes?.success) {
    formError.value = subRes?.message || '提交失败'
    return
  }
  closeCreateModal()
  await fetchMoveApplyList()
  showMessage('移模申请已提交')
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
  width: 160px;
  white-space: normal;
}

.link-btn {
  border: none;
  background: transparent;
  color: #2f7df7;
  cursor: pointer;
  margin-right: 8px;
  padding: 0;
}

.link-btn.danger-text {
  color: #c53d3d;
}

.addr-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.addr-select {
  width: 100%;
  height: 32px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  color: #4f647f;
  background: #fff;
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

.status-tag.draft {
  color: #4a6fa5;
  background: #e8f0fb;
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
  width: min(920px, 100%);
  max-height: 92vh;
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.modal-sheet.form-sheet {
  width: min(960px, 100%);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e8eef6;
}

.modal-head.form-head {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 10px;
}

.modal-head.form-head .icon-close {
  justify-self: start;
}

.form-sheet-title {
  margin: 0;
  justify-self: center;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: #1f2d3d;
}

.form-head-actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-head {
  height: 30px;
  padding: 0 16px;
  font-size: 12px;
}

.btn-save-outline {
  background: #fff;
  border: 1px solid #c5d0e0;
  color: #4f647f;
}

.btn-save-outline:hover {
  background: #f7f9fc;
}

.apply-no-badge {
  justify-self: end;
  font-size: 12px;
  color: #60758e;
  white-space: nowrap;
}

.modal-head h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.icon-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #8898aa;
}

.modal-scroll {
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.hint {
  font-size: 12px;
  color: #6b7c90;
  margin: 0 0 14px;
}

.sec-block {
  margin-top: 18px;
}

.sec-block:first-of-type {
  margin-top: 0;
}

.sec-heading {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #1f2d3d;
}

.sec-heading.inline {
  margin: 0;
}

.sec-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.sec-detail-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-tool {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: #e8f1ff;
  color: #2f7df7;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-tool:hover {
  background: #d4e6ff;
}

.view-fields .view-val {
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #e8eef6;
  border-radius: 6px;
  background: #fafbfd;
  font-size: 12px;
  color: #3d5266;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field.span-2 {
  grid-column: span 2;
}

.field label {
  font-size: 12px;
  color: #60758e;
}

.field input,
.field select {
  height: 32px;
  border: 1px solid #dbe4f0;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
}

.part-search-input {
  width: 100%;
  margin-bottom: 6px;
}

.field input.readonly {
  background: #f5f7fa;
  color: #637891;
}

.to-loc-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.to-loc-row .to-loc-select {
  flex: 1 1 220px;
  min-width: 160px;
}

.to-loc-row .to-loc-detail {
  flex: 2 1 260px;
  min-width: 180px;
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
  text-align: left;
}

.inner-table th {
  background: #f8fbff;
}

.w-check {
  width: 36px;
}

.cell-wrap {
  white-space: normal;
  max-width: 200px;
}

.cell-input {
  width: 100%;
  min-width: 140px;
  height: 30px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 12px;
}

.muted {
  color: #8a9bb1;
  font-size: 12px;
}

.center {
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e8eef6;
}

.form-error {
  color: #de5050;
  padding: 0 16px;
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

@media (max-width: 720px) {
  .form-two {
    grid-template-columns: 1fr;
  }
  .field.span-2 {
    grid-column: span 1;
  }
}
</style>
