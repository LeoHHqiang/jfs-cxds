<template>
  <div class="accept-create-page">
    <section class="main-panel">
      <div class="toolbar-card">
        <div class="toolbar-actions">
          <button class="btn btn-primary" @click="openAcceptModal">+ 新建验收</button>
          <button class="btn btn-purple" @click="showInfo('已触发：新建验收快报')">+ 新建验收快报</button>
          <button class="btn btn-light" @click="showInfo('已触发：筛选')">筛选</button>
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
        <article v-for="project in projects" :key="project.code" class="project-card">
          <header class="project-header">
            <div>
              <span class="project-code">{{ project.code }}</span>
              <span class="project-meta">项目负责人：{{ project.owner }}</span>
              <span class="project-meta">更新于：{{ project.updatedAt }}</span>
            </div>
            <div class="project-tools">
              <a href="#" @click.prevent="showInfo(`编辑项目：${project.code}`)">编辑项目</a>
              <a href="#" class="danger" @click.prevent="showInfo(`删除项目：${project.code}`)">删除项目</a>
            </div>
          </header>

          <div class="progress-line">
            <div class="progress-track"></div>
            <div class="progress-point" :style="getProgressStyle(project.progressIndex)"></div>
          </div>

          <div class="stage-row">
            <div v-for="stage in project.stages" :key="`${project.code}-${stage.name}`" class="stage-item">
              <p class="stage-name">{{ stage.name }}</p>
              <p class="stage-time">截止时间：{{ stage.deadline }}</p>
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
          <h3>新建验收</h3>
          <button class="close-btn" @click="closeAcceptModal">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-grid">
            <div class="field">
              <label class="required">验收项目代号：</label>
              <input v-model="acceptForm.code" placeholder="请输入" />
            </div>
            <div class="field">
              <label class="required">验收负责人：</label>
              <input v-model="acceptForm.owner" placeholder="请输入" />
            </div>
          </div>

          <div class="block">
            <div class="block-title">相关人员：</div>
            <div class="tag-row">
              <span class="tag" v-for="person in acceptForm.relatedPeople" :key="person">
                {{ person }}
                <button @click="removeTag('relatedPeople', person)">⊖</button>
              </span>
              <button class="add-tag" @click="addPerson">⊕</button>
            </div>
          </div>

          <div class="block">
            <div class="block-title">本次验收基础项：</div>
            <div class="tag-row">
              <span class="tag" v-for="item in acceptForm.baseItems" :key="item">
                {{ item }}
                <button @click="removeTag('baseItems', item)">⊖</button>
              </span>
              <button class="add-tag" @click="addBaseItem">⊕</button>
            </div>
          </div>

          <div class="modal-grid">
            <div class="field">
              <label>收集模板：</label>
              <select v-model="acceptForm.templateName">
                <option value="">请选择</option>
                <option value="吉利1">吉利1</option>
                <option value="理想1">理想1</option>
              </select>
            </div>
            <div class="field actions">
              <button class="btn btn-light" @click="acceptForm.templateName = '新模板'">+ 新增模板</button>
            </div>
          </div>

          <div class="block">
            <div class="block-title">本次验收收集项：</div>
            <div class="tag-row">
              <span class="tag" v-for="item in acceptForm.collectItems" :key="item">
                {{ item }}
                <button @click="removeTag('collectItems', item)">⊖</button>
              </span>
              <button class="add-tag" @click="addCollectItem">⊕</button>
            </div>
          </div>

          <div class="timeline-grid">
            <div class="timeline-item" v-for="node in acceptForm.nodes" :key="node.key">
              <label>{{ node.name }}</label>
              <input v-model="node.deadline" placeholder="请设定时间节点" />
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
import { createProject, getProjects } from '@/api'

const projectStagesTemplate = [
  { name: '验收', deadline: '2025.09.21 23:59' },
  { name: '基础项录入', deadline: '2025.09.23 23:59' },
  { name: '交付追踪', deadline: '2025.09.25 23:59' },
  { name: '外购验收材料收集', deadline: '2025.09.28 23:59' },
  { name: '内部验收项录入', deadline: '2025.09.30 23:59' }
]

const projects = ref([
  { code: 'CM2E', owner: '李新宇', updatedAt: '2024-01-12 12:22', progressIndex: 2, stages: projectStagesTemplate },
  { code: 'BWM', owner: '张三', updatedAt: '2024-01-12 12:22', progressIndex: 2, stages: projectStagesTemplate }
])
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
const eventMap = reactive({
  '2026-04-08': [
    { title: '验收录入提醒', project: 'CM2E', owner: '李新宇', type: 'accept' },
    { title: '交付追踪检查', project: 'BWM', owner: '张三', type: 'track' }
  ],
  '2026-04-15': [
    { title: '外购材料收集', project: 'BWM', owner: '张三', type: 'purchase' }
  ],
  '2026-04-21': [
    { title: '模具交付建档', project: 'CM2E', owner: '李新宇', type: 'deliver' }
  ]
})

const acceptModal = reactive({ visible: false })
const acceptForm = reactive({
  code: '',
  owner: '',
  relatedPeople: ['工程师1', '工程师2'],
  baseItems: ['零件名称', '零件编号（JF）', '子零件名称'],
  templateName: '',
  collectItems: ['验收报告', '材质证明', '上模图片', '下模图片'],
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
function ensureProjectRows(list) {
  if (!list.length) return list
  if (list.length >= 6) return list
  const seed = [...list]
  const needCount = 6 - seed.length
  for (let i = 0; i < needCount; i++) {
    const origin = list[i % list.length]
    const suffix = i + 1
    seed.push({
      ...origin,
      code: `${origin.code || 'PRJ'}-${suffix}`,
      updatedAt: origin.updatedAt || `${new Date().toISOString().slice(0, 10)} 09:00`,
      progressIndex: Number.isFinite(origin.progressIndex) ? origin.progressIndex : 0
    })
  }
  return seed
}

function getProgressStyle(progressIndex) {
  const maxIndex = projectStagesTemplate.length - 1
  const safeIndex = Math.max(0, Math.min(progressIndex, maxIndex))
  const percent = maxIndex === 0 ? 0 : (safeIndex / maxIndex) * 100
  return { left: `calc(${percent}% - 5px)` }
}

function openAcceptModal() { acceptModal.visible = true }
function closeAcceptModal() { acceptModal.visible = false }
function scrollToTop() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
}
function removeTag(field, value) { acceptForm[field] = acceptForm[field].filter((item) => item !== value) }
function addPerson() { acceptForm.relatedPeople.push(`工程师${acceptForm.relatedPeople.length + 1}`) }
function addBaseItem() { acceptForm.baseItems.push(`基础项${acceptForm.baseItems.length + 1}`) }
function addCollectItem() { acceptForm.collectItems.push(`采集项${acceptForm.collectItems.length + 1}`) }

function saveAcceptProject() {
  if (!acceptForm.code || !acceptForm.owner) {
    showInfo('请填写验收项目代号和负责人')
    return
  }
  createProject({
    code: acceptForm.code,
    owner: acceptForm.owner,
    progressIndex: 0,
    stages: projectStagesTemplate
  }).then((saved) => {
    projects.value.unshift({
      code: saved.code,
      owner: saved.owner,
      updatedAt: saved.updatedAt,
      progressIndex: saved.progressIndex,
      stages: saved.stages
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
  }).catch(() => {
    showInfo('创建失败')
  })
  closeAcceptModal()
}

onMounted(async () => {
  try {
    const res = await getProjects()
    if (res.list && res.list.length) {
      projects.value = ensureProjectRows(res.list.map((item) => ({
        code: item.code,
        owner: item.owner,
        updatedAt: item.updatedAt,
        progressIndex: item.progressIndex,
        stages: item.stages && item.stages.length ? item.stages : projectStagesTemplate
      })))
    }
  } catch (error) {
    // ignore
  }
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
.accept-create-page { display: flex; gap: 12px; align-items: flex-start; min-height: 100%; background: transparent; padding: 0; }
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
.project-card { padding: 14px 16px; }
.project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.project-code { font-size: 32px; font-weight: 700; margin-right: 14px; color: #2f3e52; }
.project-meta { margin-right: 14px; font-size: 13px; color: #7f8fa3; }
.project-tools a { text-decoration: none; margin-left: 12px; color: #5d8ee5; font-size: 13px; }
.project-tools a.danger { color: #ef5c5c; }
.progress-line { position: relative; margin: 10px 0 12px; }
.progress-track { height: 4px; border-radius: 6px; background: #2c7cff; }
.progress-point { position: absolute; top: -3px; left: 36%; width: 10px; height: 10px; border-radius: 50%; background: #2c7cff; }
.stage-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.stage-item { font-size: 12px; color: #8d9db2; }
.stage-name { color: #3b4f67; margin-bottom: 4px; }
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
.modal-body { padding: 14px 18px; overflow-y: auto; }
.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; margin-bottom: 10px; }
.field { display: flex; align-items: center; gap: 8px; }
.field label { width: 104px; color: #5f748f; font-size: 13px; }
.field label.required::after { content: '*'; color: #ef5d5d; margin-left: 4px; }
.field input,.field select { width: 100%; height: 34px; border: 1px solid #dbe4f0; border-radius: 4px; padding: 0 10px; color: #516781; }
.field.actions { justify-content: flex-start; }
.block { margin-bottom: 10px; }
.block-title { color: #4a6078; margin-bottom: 8px; font-size: 13px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #a8c0ee; border-radius: 6px; padding: 4px 8px; color: #3a5f91; background: #f7faff; }
.tag button,.add-tag { border: none; background: transparent; color: #2f6bff; cursor: pointer; }
.add-tag { border: 1px solid #8ab0ff; width: 26px; height: 26px; border-radius: 50%; }
.timeline-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.timeline-item label { display: block; color: #3c5f9a; margin-bottom: 6px; font-size: 12px; }
.timeline-item input { width: 100%; height: 32px; border: 1px solid #dbe4f0; border-radius: 4px; padding: 0 8px; }
.modal-footer { padding: 10px 18px 14px; border-top: 1px solid #ecf1f8; display: flex; justify-content: flex-end; gap: 8px; }
.message-toast { position: fixed; right: 24px; bottom: 24px; background: #2f7df7; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; z-index: 1400; }
</style>
