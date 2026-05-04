<template>
  <div class="accept-create-page scrollbar-like-sidebar">
    <section class="main-panel">
      <div class="toolbar-card">
        <div class="toolbar-actions">
          <button class="btn btn-primary" @click="openAcceptModal">+ 新建验收</button>
        </div>
      </div>

      <div class="filter-card">
        <div class="filter-actions">
          <button class="btn btn-primary small" @click="showInfo('已触发：查询')">查询</button>
          <button class="btn btn-light small" @click="showInfo('已触发：重置')">重置</button>
        </div>
        <div class="filter-grid">
          <div class="filter-item"><label>项目代号：</label><input placeholder="请输入" /></div>
          <div class="filter-item"><label>负责人：</label><select><option>请选择</option></select></div>
          <div class="filter-item"><label>项目进度：</label><select><option>请选择</option></select></div>
          <div class="filter-item"><label>相关采购：</label><select><option>请选择</option></select></div>
        </div>
      </div>

      <div class="project-list">
        <p v-if="!projects.length" class="project-empty">暂无验收项目，请点击「新建验收」创建。</p>
        <article
          v-for="project in projects"
          :key="project.id ?? project.code"
          class="project-card"
          :class="{ 'project-card--accepted': isProjectFullyAccepted(project) }"
        >
          <header class="project-header">
            <div>
              <span class="project-code">{{ project.code }}</span>
              <span v-if="isProjectFullyAccepted(project)" class="badge-done">已完成</span>
              <span class="project-meta">项目负责人：{{ project.owner }}</span>
              <span class="project-meta">更新于：{{ formatUpdatedAt(project.updatedAt) }}</span>
            </div>
            <div class="project-tools">
              <template v-if="isProjectFullyAccepted(project)">
                <span class="status-text status-text--done">已验收</span>
                <a href="#" class="withdraw-link" @click.prevent="onWithdrawModify(project)">撤回修改</a>
              </template>
              <template v-else>
                <span class="status-text">验收中</span>
                <a href="#" class="danger" @click.prevent="confirmDeleteProject(project)">删除项目</a>
              </template>
            </div>
          </header>

          <div class="stage-stack">
            <div class="stepper-grid" :style="stepperGridStyle(project)">
              <template v-for="(stage, colIdx) in project.stages" :key="`${project.code}-sg-n-${colIdx}`">
                <div class="step-node-cell" :style="{ gridColumn: colIdx + 1, gridRow: 1 }">
                  <div class="step-node" :class="stepNodeClass(project, colIdx)" aria-hidden="true"></div>
                </div>
              </template>
              <div class="stepper-rail" style="grid-column: 1 / -1; grid-row: 2">
                <div class="stepper-rail-bg"></div>
                <div
                  v-if="stepMark(project) >= 0"
                  class="stepper-rail-fill"
                  :class="{ 'stepper-rail-fill--green': isProjectFullyAccepted(project) }"
                  :style="{ width: progressRailFillWidth(project) }"
                ></div>
              </div>
              <template v-for="(stage, colIdx) in project.stages" :key="`${project.code}-sg-t-${colIdx}`">
                <div class="stepper-label-cell" :style="{ gridColumn: colIdx + 1, gridRow: 3 }">
                  <p class="stage-name">
                    <template v-if="colIdx === 0">
                      <button
                        v-if="!isProjectFullyAccepted(project)"
                        type="button"
                        class="stage-link"
                        @click.prevent="openEditProject(project)"
                      >{{ stage.name }}</button>
                      <span v-else class="stage-name-static">{{ stage.name }}</span>
                    </template>
                    <template v-else>
                      <button
                        v-if="stageRoute(stage)"
                        type="button"
                        class="stage-link"
                        @click.prevent="goAcceptStage(stage, project)"
                      >{{ stage.name }}</button>
                      <span v-else>{{ stage.name }}</span>
                    </template>
                  </p>
                  <p class="stage-time">截止时间：{{ stage.deadline || '—' }}</p>
                </div>
              </template>
            </div>
          </div>
        </article>
      </div>

    </section>

    <aside class="side-panel">
      <div ref="calendarCardRef" class="calendar-card">
        <div class="calendar-header">
          <div class="calendar-nav-group">
            <button class="calendar-nav" @click="changeYear(-1)">&lt;&lt;</button>
            <button class="calendar-nav" @click="changeMonth(-1)">&lt;</button>
          </div>
          <strong>{{ calendarTitle }}</strong>
          <div class="calendar-nav-group">
            <button class="calendar-nav" @click="changeMonth(1)">&gt;</button>
            <button class="calendar-nav" @click="changeYear(1)">&gt;&gt;</button>
          </div>
        </div>
        <div class="calendar-week"><span v-for="week in weekDays" :key="week">{{ week }}</span></div>
        <div class="calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-day"
            :class="{ blank: day.blank, selected: day.dateStr === selectedDateStr }"
            :disabled="day.blank"
            @click="selectDay(day)"
          >
            <span class="calendar-day-number">{{ day.label }}</span>
            <div v-if="day.events.length" class="event-dots">
              <i
                v-for="(dot, idx) in day.events.slice(0, 3)"
                :key="`${day.key}-${idx}`"
                :style="{ backgroundColor: eventTypeColors[dot.type] || '#8ea3b8' }"
              ></i>
            </div>
          </button>
        </div>
      </div>

      <div class="todo-list">
        <article v-for="item in detailCards" :key="item.title" class="todo-card" :class="item.theme">
          <div>
            <h4>{{ item.title }}</h4>
            <p>项目：{{ item.project }}</p>
            <p>负责人：{{ item.owner }}</p>
          </div>
          <a href="#" @click.prevent="showInfo(`查看详情：${item.title}`)">查看详情</a>
        </article>
      </div>
    </aside>

    <button v-if="showQuickTop" class="quick-top-btn" @click="scrollToTop">快速置顶</button>

    <div v-if="acceptModal.visible" class="modal-mask" @click.self="closeAcceptModal">
      <div class="accept-modal">
        <div class="modal-header">
          <h3>{{ acceptModal.mode === 'edit' ? '编辑验收项目' : '新建验收' }}</h3>
          <button class="close-btn" @click="closeAcceptModal">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-grid modal-grid-top">
            <div class="field">
              <label class="required">验收项目代号：</label>
              <input v-model="acceptForm.code" placeholder="请输入" />
            </div>
            <div class="field">
              <label class="required">验收负责人：</label>
              <input v-model="acceptForm.owner" placeholder="请输入" />
            </div>
          </div>

          <div class="block block-section">
            <div class="block-title required">相关人员</div>
            <div class="tag-row">
              <span class="tag" v-for="person in acceptForm.relatedPeople" :key="person">
                {{ person }}
                <button type="button" aria-label="移除" @click="removeTag('relatedPeople', person)">⊖</button>
              </span>
              <button type="button" class="add-tag" aria-label="添加人员" @click="addPerson">⊕</button>
            </div>
          </div>

          <div class="block block-section">
            <div class="block-title required">基础项录入</div>
            <div class="tag-row">
              <span class="tag" v-for="item in acceptForm.baseItems" :key="item">
                {{ item }}
                <button type="button" aria-label="移除" @click="removeTag('baseItems', item)">⊖</button>
              </span>
              <button type="button" class="add-tag" aria-label="添加基础项" @click="addBaseItem">⊕</button>
            </div>
          </div>

          <div class="block block-section">
            <div class="field field-template">
              <label class="field-label-wide">收集模板：</label>
              <select v-model="acceptForm.templateName" class="template-select">
                <option value="">请选择</option>
                <option value="吉利1">吉利1</option>
                <option value="理想1">理想1</option>
              </select>
            </div>
          </div>

          <div class="block block-section">
            <div class="block-title required">验收项录入</div>
            <div class="accept-items-toolbar">
              <button type="button" class="btn btn-primary btn-compact" @click="onEditAcceptItemsHint">编辑验收项</button>
              <div class="tag-row tag-row-fill">
                <span class="tag" v-for="item in acceptForm.collectItems" :key="item">
                  {{ item }}
                  <button type="button" aria-label="移除" @click="removeTag('collectItems', item)">⊖</button>
                </span>
                <button type="button" class="add-tag" aria-label="添加收集项" @click="addCollectItem">⊕</button>
              </div>
            </div>
          </div>

          <div class="modal-timeline-section">
            <div class="timeline-visual" aria-hidden="true">
              <div class="timeline-visual-nodes">
                <div class="timeline-visual-line"></div>
                <div
                  v-for="node in acceptForm.nodes"
                  :key="`dot-${node.key}`"
                  class="timeline-visual-node"
                >
                  <span class="timeline-visual-dot"></span>
                </div>
              </div>
            </div>
            <div class="timeline-grid">
              <div class="timeline-item" v-for="node in acceptForm.nodes" :key="node.key">
                <label class="timeline-label">
                  <span class="timeline-label-text">{{ node.name }}</span>
                </label>
                <input
                  type="date"
                  class="timeline-date"
                  :value="deadlineToDateInput(node.deadline)"
                  @input="node.deadline = dateInputToDeadline($event.target.value)"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveAcceptProject">保存</button>
          <button class="btn btn-light" @click="closeAcceptModal">取消</button>
        </div>
      </div>
    </div>

    <div v-if="message" class="message-toast">{{ message }}</div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { createProject, deleteProject, getProjects, setProjectCompletedUpToIndex, updateProject } from '@/api'
import { writeAcceptStageContext } from '@/utils/acceptStageContext'

/** 与新建验收弹窗节点一致；route 用于进度条下跳转子页 */
const projectStagesTemplate = [
  { name: '新建验收', deadline: '', route: null },
  { name: '基础项录入', deadline: '', route: 'base' },
  { name: '交付追踪', deadline: '', route: 'delivery' },
  { name: '验收项录入', deadline: '', route: 'accept' },
  { name: '模具交付建档', deadline: '', route: 'mold-archive' }
]

/** 与 completeProjectStage 中阶段索引一致（0=新建验收 不在此列） */
const STAGE_NAV_INDEX = { base: 1, delivery: 2, accept: 3, 'mold-archive': 4 }

/** 与下方 stepper-grid columnGap 一致，用于轨道蓝条宽度 calc */
const STEP_GAP_PX = 10

/** 与 demoApi STAGE_ROUTE_TO_INDEX「模具交付建档」一致：达到即整体验收完成 */
const MOLD_ARCHIVE_STAGE_INDEX = 4

const LEGACY_STAGE_ROUTES = {
  基础项录入: 'base',
  交付追踪: 'delivery',
  验收项录入: 'accept',
  内部验收项录入: 'accept',
  模具交付建档: 'mold-archive',
  外购验收材料收集: 'delivery',
  验收: null,
  新建验收: null
}

const DEFAULT_RELATED_PEOPLE = Array.from({ length: 14 }, (_, i) => `工程师${i + 1}`)
const DEFAULT_BASE_ITEMS = [
  '零件名称',
  '零件编号 (JF)',
  '子零件名称',
  '子零件编号 (JF)',
  '工装名称',
  '供应商',
  '项目负责人',
  '零部件厂',
  '供应商模具编号',
  '客户模具编号',
  '工装供应商',
  '工装使用地'
]
const DEFAULT_COLLECT_ITEMS = [
  '验收报告',
  '材质证明',
  '上模图片',
  '下模图片',
  '模具整体图片',
  '实物铭牌图片',
  '长',
  '宽',
  '高',
  '重量'
]

const projects = ref([])
const calendarCardRef = ref(null)
const showQuickTop = ref(false)
const scrollContainer = ref(null)
let calendarObserver = null

const message = ref('')
let timer = null
const showInfo = (text) => {
  message.value = text
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    message.value = ''
  }, 1800)
}

const now = new Date()
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())
const selectedDateStr = ref(formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()))
const eventTypeColors = {
  accept: '#2f7df7',
  track: '#65b341',
  deliver: '#f39c2a',
  purchase: '#b46af2'
}
const eventMap = reactive({})

const acceptModal = reactive({
  visible: false,
  mode: 'create',
  editingId: null,
  editingProgressIndex: 0,
  preservedCompletedUpTo: -1
})
const acceptForm = reactive({
  code: '',
  owner: '',
  relatedPeople: [...DEFAULT_RELATED_PEOPLE],
  baseItems: [...DEFAULT_BASE_ITEMS],
  templateName: '',
  collectItems: [...DEFAULT_COLLECT_ITEMS],
  nodes: [
    { key: 'n1', name: '新建验收', deadline: '' },
    { key: 'n2', name: '基础项录入', deadline: '' },
    { key: 'n3', name: '交付追踪', deadline: '' },
    { key: 'n4', name: '验收项录入', deadline: '' },
    { key: 'n5', name: '模具交付建档', deadline: '' }
  ]
})

const calendarTitle = computed(() => `${currentYear.value} 年 ${currentMonth.value + 1} 月 ${selectedDateStr.value.split('-')[2]} 日`)
const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const result = []
  for (let i = 0; i < firstDay; i++) {
    result.push({ key: `blank-${i}`, label: '', blank: true, dateStr: '', events: [] })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(currentYear.value, currentMonth.value, day)
    result.push({
      key: dateStr,
      label: String(day),
      blank: false,
      dateStr,
      events: eventMap[dateStr] || []
    })
  }
  return result
})
const detailCards = computed(() => {
  const list = eventMap[selectedDateStr.value] || []
  if (list.length) return list.map((item) => ({ ...item, theme: item.type }))
  return [{
    title: '当前日期暂无事件',
    project: '--',
    owner: '--',
    theme: 'empty'
  }]
})

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
function changeMonth(offset) {
  let nextMonth = currentMonth.value + offset
  let nextYear = currentYear.value
  if (nextMonth < 0) { nextMonth = 11; nextYear -= 1 }
  if (nextMonth > 11) { nextMonth = 0; nextYear += 1 }
  currentMonth.value = nextMonth
  currentYear.value = nextYear
}
function changeYear(offset) { currentYear.value += offset }
function selectDay(day) { if (!day.blank) selectedDateStr.value = day.dateStr }
function mapProjectRow(item) {
  const stagesFromApi = item.stages && item.stages.length
    ? item.stages.map((s) => ({ ...s }))
    : projectStagesTemplate.map((s) => ({ ...s }))
  const c = item.completedUpToIndex
  const completedUpToIndex = Number.isFinite(c) ? c : 0
  const row = {
    id: item.id,
    code: item.code,
    owner: item.owner,
    updatedAt: item.updatedAt,
    progressIndex: item.progressIndex,
    completedUpToIndex,
    stages: stagesFromApi
  }
  row.progressMark = progressMarkerColumnIndex(row)
  return row
}

function formatUpdatedAt(val) {
  if (val == null || val === '') return '—'
  const t = String(val).trim()
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}.${m[2]}.${m[3]}`
  const m2 = t.match(/^(\d{4})\.(\d{2})\.(\d{2})/)
  if (m2) return `${m2[1]}.${m2[2]}.${m2[3]}`
  return t.split(/\s+/)[0] || t
}

/** 将 deadline 解析为日历用的 YYYY-MM-DD（支持 2026.05.02 12:00 / 2026-05-02T12:00） */
function parseDeadlineToCalendarKey(deadline) {
  if (!deadline || !String(deadline).trim()) return null
  const s = String(deadline).trim()
  const m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!m) return null
  const mo = String(m[2]).padStart(2, '0')
  const d = String(m[3]).padStart(2, '0')
  return `${m[1]}-${mo}-${d}`
}

/** 根据各项目阶段截止时间，在右侧日历上打点（与列表进度条数据同源） */
function syncCalendarFromProjects() {
  Object.keys(eventMap).forEach((key) => {
    const arr = eventMap[key]
    if (!Array.isArray(arr)) return
    const filtered = arr.filter((e) => e && e.calendarSource !== 'project-stage')
    if (filtered.length) {
      eventMap[key] = filtered
    } else {
      delete eventMap[key]
    }
  })
  projects.value.forEach((proj) => {
    const list = proj.stages && proj.stages.length ? proj.stages : []
    list.forEach((st) => {
      const dk = parseDeadlineToCalendarKey(st.deadline)
      if (!dk) return
      if (!eventMap[dk]) eventMap[dk] = []
      eventMap[dk].push({
        title: `${st.name}（${proj.code}）`,
        project: proj.code,
        owner: proj.owner || '',
        type: 'accept',
        calendarSource: 'project-stage'
      })
    })
  })
}

async function reloadProjects() {
  try {
    const res = await getProjects()
    projects.value = (res.list || []).map(mapProjectRow)
    syncCalendarFromProjects()
  } catch (error) {
    // ignore
  }
}

function getStageCount(project) {
  const stages = project.stages && project.stages.length ? project.stages : projectStagesTemplate
  return Math.max(stages.length, 1)
}

/**
 * completedUpToIndex：-1 无进度；0=新建验收已保存；1~4=各路由阶段已点「完成」的最大档。
 * 返回进度末端所在列下标（与下方阶段列对齐）：c=0→1（基础项录入下）；c=1→2（交付追踪下）…；-1 表示无蓝色进度。
 * c ≥ 模具交付建档（4）时返回 n，表示五段全部完成，轨道拉满、节点全为已完成样式。
 */
function progressMarkerColumnIndex(project) {
  const n = getStageCount(project)
  const raw = project.completedUpToIndex
  const c = Number(raw)
  if (!Number.isFinite(c) || c < 0) return -1
  if (c >= MOLD_ARCHIVE_STAGE_INDEX) return n
  return Math.min(n - 1, c + 1)
}

function isProjectFullyAccepted(project) {
  const c = Number(project?.completedUpToIndex)
  return Number.isFinite(c) && c >= MOLD_ARCHIVE_STAGE_INDEX
}

function stepMark(project) {
  const m = project.progressMark
  return Number.isFinite(m) ? m : progressMarkerColumnIndex(project)
}

function stepNodeClass(project, colIdx) {
  const n = getStageCount(project)
  const m = stepMark(project)
  if (m < 0) return 'step-node--todo'
  if (m >= n) return 'step-node--done'
  if (colIdx < m) return 'step-node--done'
  if (colIdx === m) return 'step-node--current'
  return 'step-node--todo'
}

/** 与模板 columnGap 同步 */
function stepperGridStyle(project) {
  const n = Math.max(project.stages?.length || 0, 1)
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
    columnGap: `${STEP_GAP_PX}px`,
    rowGap: '6px',
    alignItems: 'start'
  }
}

/** 轨道填充宽度：未完成时对齐节点中心；已全部完成时为 100% */
function progressRailFillWidth(project) {
  const n = Math.max(project.stages?.length || 0, 1)
  const m = stepMark(project)
  if (m < 0) return '0'
  if (m >= n) return '100%'
  const gapsPx = (n - 1) * STEP_GAP_PX
  return `min(100%, calc((100% - ${gapsPx}px) * ${2 * m + 1} / ${2 * n} + ${m * STEP_GAP_PX}px))`
}

function stageRoute(stage) {
  if (!stage) return null
  if (stage.route) return stage.route
  return LEGACY_STAGE_ROUTES[stage.name] || null
}

async function goAcceptStage(stage, project) {
  const key = stageRoute(stage)
  if (!key || !project) return
  if (isProjectFullyAccepted(project)) {
    showInfo('项目已验收完成，如需调整请先在列表点击「撤回修改」。')
    return
  }
  const idx = STAGE_NAV_INDEX[key]
  if (idx == null) return
  const cap = Number.isFinite(project.completedUpToIndex) ? project.completedUpToIndex : -1

  if (idx > 1 && cap < idx - 1) {
    window.alert('请先完成上一阶段内容，并在对应页面点击「完成节点」后，再进入本阶段。')
    return
  }

  if (idx <= cap) {
    if (
      !window.confirm(
        '该阶段已标记完成，确定仍要进入编辑？确认后进度条将回退至本阶段之前，需重新点击「完成节点」才能再次推进。'
      )
    ) {
      return
    }
  }

  if (project.id == null) {
    showInfo('项目缺少编号，无法关联阶段完成状态')
    return
  }

  if (idx <= cap) {
    const nextCap = idx <= 1 ? 0 : idx - 1
    try {
      await setProjectCompletedUpToIndex({ id: project.id, completedUpToIndex: nextCap })
      await reloadProjects()
    } catch (e) {
      console.error('[goAcceptStage rollback]', e)
      window.alert('进度回退失败，请稍后重试。')
      return
    }
  }

  writeAcceptStageContext({ projectId: project.id, code: project.code, route: key })
  window.location.hash = `#/accept-approve/${key}`
}

function onEditAcceptItemsHint() {
  showInfo('请在本页用标签维护验收项；保存后可在列表进度与日历中查看节点时间')
}

/** 弹窗 date ↔ 存盘用 deadline（仅日期，YYYY.MM.DD）；兼容旧数据含时间 */
function deadlineToDateInput(deadline) {
  if (!deadline || !String(deadline).trim()) return ''
  const s = String(deadline).trim()
  let m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return ''
}

function dateInputToDeadline(iso) {
  if (!iso || !String(iso).trim()) return ''
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}.${m[2]}.${m[3]}`
  return iso
}

function openAcceptModal() {
  acceptModal.mode = 'create'
  acceptModal.editingId = null
  acceptModal.editingProgressIndex = 0
  acceptModal.preservedCompletedUpTo = -1
  acceptForm.code = ''
  acceptForm.owner = ''
  acceptForm.relatedPeople = [...DEFAULT_RELATED_PEOPLE]
  acceptForm.baseItems = [...DEFAULT_BASE_ITEMS]
  acceptForm.templateName = ''
  acceptForm.collectItems = [...DEFAULT_COLLECT_ITEMS]
  projectStagesTemplate.forEach((s, i) => {
    if (acceptForm.nodes[i]) {
      acceptForm.nodes[i].name = s.name
      acceptForm.nodes[i].deadline = s.deadline
    }
  })
  acceptModal.visible = true
}

function fillFormFromProject(project) {
  acceptForm.code = project.code || ''
  acceptForm.owner = project.owner || ''
  const stages = project.stages && project.stages.length ? project.stages : []
  acceptForm.nodes.forEach((node, i) => {
    const st = stages[i]
    const def = projectStagesTemplate[i] || {}
    node.name = (st && st.name) || def.name
    node.deadline = (st && st.deadline) || def.deadline || ''
  })
}

function openEditProject(project) {
  if (project.id == null) {
    showInfo('该项目缺少编号，无法编辑，请刷新页面后重试')
    return
  }
  if (isProjectFullyAccepted(project)) {
    showInfo('项目已验收完成，无法编辑。请先点击「撤回修改」后再通过「新建验收」阶段名称进入编辑。')
    return
  }
  const cap = Number.isFinite(project.completedUpToIndex) ? project.completedUpToIndex : -1
  if (cap >= 1) {
    if (!window.confirm('该项目已有阶段标记为完成，确定要编辑项目信息？')) return
  }
  acceptModal.mode = 'edit'
  acceptModal.editingId = project.id
  acceptModal.editingProgressIndex = Number.isFinite(project.progressIndex) ? project.progressIndex : 0
  acceptModal.preservedCompletedUpTo = Number.isFinite(project.completedUpToIndex) ? project.completedUpToIndex : 0
  acceptForm.relatedPeople = [...DEFAULT_RELATED_PEOPLE]
  acceptForm.baseItems = [...DEFAULT_BASE_ITEMS]
  acceptForm.templateName = ''
  acceptForm.collectItems = [...DEFAULT_COLLECT_ITEMS]
  fillFormFromProject(project)
  acceptModal.visible = true
}

async function onWithdrawModify(project) {
  if (project.id == null) {
    showInfo('该项目缺少编号')
    return
  }
  if (
    !window.confirm(
      '撤回后项目将回到「验收项录入」完成状态，可继续修改各阶段或重新提交模具交付建档。确定撤回？'
    )
  ) {
    return
  }
  try {
    await setProjectCompletedUpToIndex({ id: project.id, completedUpToIndex: 3 })
    showInfo('已撤回，项目恢复为验收中')
    await reloadProjects()
  } catch (error) {
    console.error('[onWithdrawModify]', error)
    showInfo('撤回失败，请稍后重试')
  }
}

async function confirmDeleteProject(project) {
  if (project.id == null) {
    showInfo('该项目缺少编号，无法删除')
    return
  }
  if (isProjectFullyAccepted(project)) {
    showInfo('已验收完成的项目不可删除；请先「撤回修改」后再操作。')
    return
  }
  if (!window.confirm(`确定删除验收项目「${project.code}」吗？此操作不可恢复。`)) return
  try {
    await deleteProject(project.id)
    showInfo('已删除')
    await reloadProjects()
  } catch (error) {
    showInfo('删除失败')
  }
}

function closeAcceptModal() {
  acceptModal.visible = false
  acceptModal.mode = 'create'
  acceptModal.editingId = null
  acceptModal.editingProgressIndex = 0
  acceptModal.preservedCompletedUpTo = -1
}
function scrollToTop() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
}
function removeTag(field, value) { acceptForm[field] = acceptForm[field].filter((item) => item !== value) }
function addPerson() { acceptForm.relatedPeople.push(`工程师${acceptForm.relatedPeople.length + 1}`) }
function addBaseItem() { acceptForm.baseItems.push(`基础项${acceptForm.baseItems.length + 1}`) }
function addCollectItem() { acceptForm.collectItems.push(`采集项${acceptForm.collectItems.length + 1}`) }

async function saveAcceptProject() {
  if (!acceptForm.code || !acceptForm.owner) {
    showInfo('请填写验收项目代号和负责人')
    return
  }
  const stages = acceptForm.nodes.map((node, idx) => {
    const def = projectStagesTemplate[idx] || {}
    const raw = node.deadline && String(node.deadline).trim()
    return {
      name: node.name,
      deadline: raw || def.deadline || '',
      route: def.route
    }
  })
  if (acceptModal.mode === 'edit' && acceptModal.editingId != null) {
    try {
      await updateProject({
        id: acceptModal.editingId,
        code: acceptForm.code,
        owner: acceptForm.owner,
        progressIndex: acceptModal.editingProgressIndex,
        completedUpToIndex: acceptModal.preservedCompletedUpTo,
        stages
      })
      showInfo('已保存修改')
      closeAcceptModal()
      await reloadProjects()
    } catch (error) {
      showInfo('保存失败')
    }
    return
  }
  try {
    const saved = await createProject({
      code: acceptForm.code,
      owner: acceptForm.owner,
      progressIndex: 0,
      stages
    })
    const firstDay = Number(String(now.getDate()).padStart(2, '0'))
    const today = formatDateStr(now.getFullYear(), now.getMonth(), firstDay)
    if (!eventMap[today]) {
      eventMap[today] = []
    }
    eventMap[today].unshift({
      title: `新建验收 ${saved.code}`,
      project: saved.code,
      owner: saved.owner,
      type: 'accept'
    })
    showInfo(`已创建验收：${saved.code}`)
    closeAcceptModal()
    await reloadProjects()
  } catch (error) {
    showInfo('创建失败')
  }
}

onMounted(async () => {
  await reloadProjects()
  await nextTick()
  scrollContainer.value = calendarCardRef.value?.closest('.main-content') || null
  if (scrollContainer.value && calendarCardRef.value) {
    calendarObserver = new IntersectionObserver(
      ([entry]) => {
        showQuickTop.value = !entry.isIntersecting
      },
      { root: scrollContainer.value, threshold: 0.05 }
    )
    calendarObserver.observe(calendarCardRef.value)
  }
})

onBeforeUnmount(() => {
  if (calendarObserver) {
    calendarObserver.disconnect()
    calendarObserver = null
  }
})
</script>

<style scoped>
.accept-create-page {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
  min-height: 0;
  min-width: 0;
  background: transparent;
  padding: 0;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.main-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.toolbar-card,.filter-card,.project-card,.calendar-card { background: #fff; border-radius: 10px; border: 1px solid #e7edf4; }
.toolbar-card,.filter-card { padding: 12px 16px; }
.toolbar-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn { border: 1px solid #d5deea; background: #fff; color: #47607a; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
.btn.small { padding: 6px 12px; }
.btn-primary { background: #377dff; color: #fff; border-color: #377dff; }
.btn-purple { background: #6569f5; color: #fff; border-color: #6569f5; }
.btn-light { background: #f5f8fc; }
.filter-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 10px; }
.filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
.filter-item { display: flex; align-items: center; gap: 10px; }
.filter-item label { width: 78px; color: #5e7188; font-size: 14px; }
.filter-item input,.filter-item select { flex: 1; border: 1px solid #dce5ef; border-radius: 6px; height: 34px; padding: 0 10px; color: #6f8198; }
.project-list { display: flex; flex-direction: column; gap: 10px; }
.project-empty { margin: 0; padding: 28px 16px; text-align: center; font-size: 14px; color: #8d9db2; background: #fff; border-radius: 10px; border: 1px solid #e7edf4; }
.project-card { padding: 14px 16px; }
.project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px 12px; }
.project-code { font-size: 32px; font-weight: 700; margin-right: 14px; color: #2f3e52; }
.badge-done {
  display: inline-block;
  margin-right: 10px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #15803d;
  background: #dcfce7;
  border-radius: 999px;
  vertical-align: middle;
}
.project-meta { margin-right: 14px; font-size: 13px; color: #7f8fa3; }
.project-tools {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.project-tools a { text-decoration: none; color: #5d8ee5; font-size: 13px; }
.project-tools a.danger { color: #ef5c5c; }
.project-tools .withdraw-link {
  color: #b45309;
  border: 1px solid #fcd34d;
  background: #fffbeb;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
}
.project-tools .withdraw-link:hover {
  background: #fef3c7;
}
.status-text {
  font-size: 13px;
  font-weight: 600;
  color: #3d6fb5;
}
.status-text--done {
  color: #15803d;
}
.project-card--accepted .step-node--done {
  border-color: #22a858;
  background: #22a858;
}
.project-card--accepted .step-node--current {
  border-color: #22a858;
  background: #fff;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px #22a858;
}
.stepper-rail-fill--green {
  background: linear-gradient(90deg, #16a34a, #22c55e) !important;
}
.stage-name-static {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}
.stage-stack {
  margin: 10px 0 6px;
}
/* 三行网格：节点 | 整行连续轨道 | 文案；蓝条宽度由 calc 对齐列中心 */
.step-node-cell {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 14px;
}
.step-node {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
}
.step-node--todo {
  border: 2px solid #c5d3e5;
  background: #fff;
}
.step-node--done {
  border: 2px solid #2c7cff;
  background: #2c7cff;
}
.step-node--current {
  width: 12px;
  height: 12px;
  border: 2px solid #2c7cff;
  background: #fff;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px #2c7cff;
}
.stepper-rail {
  position: relative;
  height: 4px;
  border-radius: 6px;
  overflow: hidden;
}
.stepper-rail-bg {
  position: absolute;
  inset: 0;
  background: #dbe8f9;
  border-radius: 6px;
}
.stepper-rail-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  max-width: 100%;
  background: #2c7cff;
  border-radius: 6px 0 0 6px;
  z-index: 1;
  transition: width 0.22s ease;
}
.stepper-label-cell {
  font-size: 12px;
  color: #8d9db2;
  text-align: center;
  min-width: 0;
}
.stage-name {
  color: #3b4f67;
  margin: 0 0 4px;
  min-height: 1.2em;
  width: 100%;
}
.stage-link {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #2f7df7;
  cursor: pointer;
  text-align: center;
  text-decoration: underline;
  text-underline-offset: 2px;
  width: 100%;
}
.stage-link:hover {
  color: #1a5fcc;
}
.stage-time {
  margin: 0;
  width: 100%;
}
.side-panel { flex: 0 0 310px; display: flex; flex-direction: column; gap: 12px; }
.calendar-card { padding: 8px; }
.calendar-header { display: flex; justify-content: center; align-items: center; padding: 6px 2px 10px; color: #24374f; }
.calendar-header strong { font-size: 18px; font-weight: 600; margin: 0 10px; line-height: 1.2; }
.calendar-nav-group { display: flex; align-items: center; gap: 10px; }
.calendar-nav { border: none; background: transparent; color: #657b94; cursor: pointer; font-size: 22px; line-height: 1; padding: 0 2px; }
.calendar-week,.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.calendar-week { color: #2f3b4a; font-size: 14px; font-weight: 600; padding: 10px 10px; background: #edf2f8; border-radius: 10px; }
.calendar-grid { padding: 10px 8px 6px; gap: 8px 4px; grid-template-rows: repeat(6, 42px); }
.calendar-day { border: none; background: transparent; height: 42px; border-radius: 999px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: #10253f; cursor: pointer; padding: 0; }
.calendar-day.blank { cursor: default; }
.calendar-day.selected { background: #dbe4ee; }
.calendar-day-number { font-size: 14px; line-height: 1; }
.event-dots { display: flex; gap: 2px; }
.event-dots i { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
.todo-list { display: flex; flex-direction: column; gap: 8px; }
.todo-card { border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e6edf7; background: #fff; }
.todo-card h4 { font-size: 14px; margin-bottom: 4px; color: #2d405a; }
.todo-card p { font-size: 12px; color: #6f8198; margin-bottom: 2px; }
.todo-card a { font-size: 12px; color: #2f7df7; text-decoration: none; }
.todo-card.accept { background: #eff6ff; }
.todo-card.track { background: #f4fbef; }
.todo-card.deliver { background: #fff6ea; }
.todo-card.purchase { background: #f7f1ff; }
.todo-card.empty { background: #f8fafc; }
.quick-top-btn { position: fixed; left: 50%; transform: translateX(-50%); bottom: 28px; z-index: 160; border: 1px solid #2f7df7; background: #2f7df7; color: #fff; border-radius: 999px; padding: 8px 16px; font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(47, 125, 247, 0.35); }
.modal-mask { position: fixed; inset: 0; background: rgba(16, 27, 40, 0.45); display: flex; justify-content: center; align-items: center; z-index: 1300; }
.accept-modal { width: min(1240px, 94vw); max-height: 90vh; background: #fff; border-radius: 12px; border: 1px solid #e4ecf5; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #ecf1f8; }
.modal-header h3 { font-size: 22px; color: #32485f; }
.close-btn { border: none; background: transparent; font-size: 28px; cursor: pointer; line-height: 1; color: #7e8ea4; }
.modal-body { padding: 18px 22px 20px; overflow-y: auto; }
.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-bottom: 4px; }
.modal-grid-top { margin-bottom: 6px; }
.field { display: flex; align-items: center; gap: 8px; min-width: 0; }
.field label {
  flex-shrink: 0;
  white-space: nowrap;
  color: #5f748f;
  font-size: 13px;
}
.field label.required::after { content: '*'; color: #ef5d5d; margin-left: 4px; }
.field input,.field select {
  flex: 1;
  min-width: 0;
  width: auto;
  height: 34px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 10px;
  color: #516781;
}
.block-section { margin-bottom: 18px; }
.block-section:last-of-type { margin-bottom: 0; }
.block-title { color: #4a6078; margin-bottom: 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; }
.block-title.required::after { content: '*'; color: #ef5d5d; margin-left: 4px; }
.field-template {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}
.field-label-wide {
  flex-shrink: 0;
  white-space: nowrap;
  color: #5f748f;
  font-size: 13px;
  font-weight: 500;
}
.template-select {
  flex: 1;
  min-width: 0;
  height: 36px;
  border: 1px solid #dbe4f0;
  border-radius: 6px;
  padding: 0 10px;
  color: #516781;
  background: #fff;
}
.accept-items-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 12px;
}
.btn-compact {
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 6px;
  flex-shrink: 0;
}
.tag-row-fill {
  flex: 1;
  min-width: 200px;
  margin: 0;
}
.modal-timeline-section {
  margin-top: 22px;
  padding-top: 4px;
  border-top: 1px solid #ecf1f8;
}
.timeline-visual { margin-bottom: 6px; }
.timeline-visual-nodes {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  min-height: 22px;
  padding: 0 2px;
}
.timeline-visual-line {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 50%;
  height: 4px;
  margin-top: -2px;
  background: #2c7cff;
  border-radius: 3px;
  z-index: 0;
}
.timeline-visual-node {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
}
.timeline-visual-dot {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #2c7cff;
  box-sizing: border-box;
}
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #a8c0ee; border-radius: 6px; padding: 4px 8px; color: #3a5f91; background: #f7faff; }
.tag button,.add-tag { border: none; background: transparent; color: #2f6bff; cursor: pointer; }
.add-tag { border: 1px solid #8ab0ff; width: 26px; height: 26px; border-radius: 50%; }
.timeline-grid { margin-top: 4px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px 10px; }
.timeline-label {
  display: block;
  min-height: 18px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #3c5f9a;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
}
.timeline-label-text {
  color: #3c5f9a;
}
.timeline-item input.timeline-date {
  width: 100%;
  min-width: 0;
  height: 36px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  color: #516781;
}
.modal-footer { padding: 10px 18px 14px; border-top: 1px solid #ecf1f8; display: flex; justify-content: flex-end; gap: 8px; }
.message-toast { position: fixed; right: 24px; bottom: 24px; background: #2f7df7; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; z-index: 1400; }
</style>
