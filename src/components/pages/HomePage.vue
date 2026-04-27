<template>
  <div class="home-page">
    <section class="main-panel">
      <div class="toolbar-card">
        <div class="toolbar-actions">
          <button class="btn btn-primary" @click="openAcceptModal">+ 新建验收</button>
          <button class="btn btn-purple">+ 新建验收快报</button>
          <button class="btn btn-light">筛选</button>
        </div>
      </div>

      <div class="filter-card">
        <div class="filter-actions">
          <button class="btn btn-primary small">查询</button>
          <button class="btn btn-light small">重置</button>
        </div>
        <div class="filter-grid">
          <div class="filter-item">
            <label>项目代号：</label>
            <input type="text" placeholder="请输入" />
          </div>
          <div class="filter-item">
            <label>负责人：</label>
            <select>
              <option>请选择</option>
            </select>
          </div>
          <div class="filter-item">
            <label>项目进度：</label>
            <select>
              <option>请选择</option>
            </select>
          </div>
          <div class="filter-item">
            <label>相关采购：</label>
            <select>
              <option>请选择</option>
            </select>
          </div>
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
              <a href="javascript:;">编辑项目</a>
              <a href="javascript:;" class="danger">删除项目</a>
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

      <footer class="pagination">
        <span>显示第 1 到 10 条记录，共 157 条记录</span>
        <div class="pager">
          <button>&lt;</button>
          <button class="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>&gt;</button>
        </div>
      </footer>
    </section>

    <aside class="side-panel">
      <div class="calendar-card">
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
        <div class="calendar-week">
          <span v-for="week in weekDays" :key="week">{{ week }}</span>
        </div>
        <div class="calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-day"
            :class="{
              blank: day.blank,
              today: day.isToday,
              selected: day.dateStr === selectedDateStr,
              'has-event': day.events.length > 0
            }"
            :disabled="day.blank"
            @click="selectDay(day)"
          >
            <span class="calendar-day-number">{{ day.label }}</span>
            <div v-if="day.events.length" class="event-dots">
              <i
                v-for="(dot, idx) in day.events.slice(0, 4)"
                :key="`${day.key}-${idx}`"
                :style="{ backgroundColor: eventTypeColors[dot.type] || '#8ea3b8' }"
              ></i>
            </div>
          </button>
        </div>
      </div>

      <div class="todo-list">
        <article v-for="item in todos" :key="item.title" class="todo-card" :class="item.theme">
          <div>
            <h4>{{ item.title }}</h4>
            <p>项目：{{ item.project }}</p>
            <p>负责人：{{ item.owner }}</p>
          </div>
          <a href="javascript:;">查看详情</a>
        </article>
      </div>
    </aside>

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
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed, reactive, ref } from 'vue'
import { onMounted } from 'vue'
import { createProject, getProjects } from '@/api'

defineProps({
  pageName: {
    type: String,
    default: '首页'
  }
})

const projectStagesTemplate = [
  { name: '验收', deadline: '2025.09.21 23:59' },
  { name: '基础项录入', deadline: '2025.09.23 23:59' },
  { name: '交付追踪', deadline: '2025.09.25 23:59' },
  { name: '外购验收材料收集', deadline: '2025.09.28 23:59' },
  { name: '内部验收项录入', deadline: '2025.09.30 23:59' }
]

const projects = ref([
  { code: 'CM2E', owner: '李新宇', updatedAt: '2024-01-12 12:22', progressIndex: 2, stages: projectStagesTemplate },
  { code: 'BWM', owner: '张三', updatedAt: '2024-01-12 12:22', progressIndex: 2, stages: projectStagesTemplate },
  { code: 'L946', owner: '李晓东', updatedAt: '2024-01-15 09:16', progressIndex: 1, stages: projectStagesTemplate },
  { code: 'A173', owner: '王宇', updatedAt: '2024-01-16 16:30', progressIndex: 3, stages: projectStagesTemplate },
  { code: 'K201', owner: '陈博', updatedAt: '2024-01-18 10:05', progressIndex: 4, stages: projectStagesTemplate },
  { code: 'D883', owner: '刘洋', updatedAt: '2024-01-20 14:41', progressIndex: 0, stages: projectStagesTemplate }
])

const todos = [
  { title: '资料上传', project: 'BWM', owner: '李新宇', theme: 'pink' },
  { title: '信息导入', project: 'L946', owner: '李新宇', theme: 'green' },
  { title: '编号核对', project: 'L946', owner: '李新宇', theme: 'purple' },
  { title: '交付追踪', project: 'BWM', owner: '李新宇', theme: 'blue' },
  { title: '模具交付建档', project: 'CM2E', owner: '李新宇', theme: 'yellow' }
]

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const eventData = {
  '2025-09-10': [
    { type: 'meeting', title: '团队会议', time: '10:00' },
    { type: 'task', title: '项目交付', time: '15:30' }
  ],
  '2025-09-15': [{ type: 'review', title: '代码审查', time: '14:00' }],
  '2025-09-22': [
    { type: 'presentation', title: '产品演示', time: '11:00' },
    { type: 'meeting', title: '客户会议', time: '16:00' }
  ]
}

const eventTypeColors = {
  meeting: '#3498db',
  review: '#e74c3c',
  presentation: '#9b59b6',
  task: '#2ecc71'
}

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())
const selectedDateStr = ref(formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()))
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

const calendarTitle = computed(() => {
  const selected = selectedDateStr.value
  const [year, month, day] = selected.split('-')
  if (Number(year) === currentYear.value && Number(month) === currentMonth.value + 1) {
    return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
  }
  return `${currentYear.value} 年 ${currentMonth.value + 1} 月`
})

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const result = []

  for (let i = 0; i < firstDay; i++) {
    result.push({
      key: `blank-${i}`,
      label: '',
      blank: true,
      dateStr: '',
      isToday: false,
      events: []
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(currentYear.value, currentMonth.value, day)
    const isToday =
      day === now.getDate() &&
      currentMonth.value === now.getMonth() &&
      currentYear.value === now.getFullYear()

    result.push({
      key: dateStr,
      label: String(day),
      blank: false,
      dateStr,
      isToday,
      events: eventData[dateStr] || []
    })
  }

  return result
})

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function changeMonth(offset) {
  let nextMonth = currentMonth.value + offset
  let nextYear = currentYear.value
  if (nextMonth < 0) {
    nextMonth = 11
    nextYear -= 1
  } else if (nextMonth > 11) {
    nextMonth = 0
    nextYear += 1
  }
  currentMonth.value = nextMonth
  currentYear.value = nextYear
}

function changeYear(offset) {
  currentYear.value += offset
}

function selectDay(day) {
  if (day.blank) {
    return
  }
  selectedDateStr.value = day.dateStr
}

function getProgressStyle(progressIndex) {
  const maxIndex = projectStagesTemplate.length - 1
  const safeIndex = Math.max(0, Math.min(progressIndex, maxIndex))
  const percent = maxIndex === 0 ? 0 : (safeIndex / maxIndex) * 100
  return {
    left: `calc(${percent}% - 5px)`
  }
}

function openAcceptModal() {
  acceptModal.visible = true
}

function closeAcceptModal() {
  acceptModal.visible = false
}

function removeTag(field, value) {
  acceptForm[field] = acceptForm[field].filter((item) => item !== value)
}

function addPerson() {
  acceptForm.relatedPeople.push(`工程师${acceptForm.relatedPeople.length + 1}`)
}

function addBaseItem() {
  acceptForm.baseItems.push(`基础项${acceptForm.baseItems.length + 1}`)
}

function addCollectItem() {
  acceptForm.collectItems.push(`采集项${acceptForm.collectItems.length + 1}`)
}

function saveAcceptProject() {
  createProject({
    code: acceptForm.code || `NEW-${Date.now().toString().slice(-4)}`,
    owner: acceptForm.owner || '未指定',
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
  }).catch((error) => {
    console.error('创建验收项目失败:', error)
  })
  closeAcceptModal()
}

onMounted(async () => {
  try {
    const res = await getProjects()
    if (res.list && res.list.length) {
      projects.value = res.list.map((item) => ({
        code: item.code,
        owner: item.owner,
        updatedAt: item.updatedAt,
        progressIndex: item.progressIndex,
        stages: item.stages && item.stages.length ? item.stages : projectStagesTemplate
      }))
    }
  } catch (error) {
    console.error('加载项目列表失败:', error)
  }
})
</script>

<style scoped>
.home-page {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 100%;
  background: #f3f6fb;
  padding: 12px;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-card,
.filter-card,
.project-card,
.calendar-card,
.todo-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e7edf4;
}

.toolbar-card,
.filter-card {
  padding: 12px 16px;
}

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  border: 1px solid #d5deea;
  background: #fff;
  color: #47607a;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn.small {
  padding: 6px 12px;
}

.btn-primary {
  background: #377dff;
  color: #fff;
  border-color: #377dff;
}

.btn-purple {
  background: #6569f5;
  color: #fff;
  border-color: #6569f5;
}

.btn-light {
  background: #f5f8fc;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  width: 78px;
  color: #5e7188;
  font-size: 14px;
}

.filter-item input,
.filter-item select {
  flex: 1;
  border: 1px solid #dce5ef;
  border-radius: 6px;
  height: 34px;
  padding: 0 10px;
  color: #6f8198;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-card {
  padding: 14px 16px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-code {
  font-size: 22px;
  font-weight: 700;
  margin-right: 14px;
  color: #2f3e52;
}

.project-meta {
  margin-right: 14px;
  font-size: 13px;
  color: #7f8fa3;
}

.project-tools a {
  text-decoration: none;
  margin-left: 12px;
  color: #5d8ee5;
  font-size: 13px;
}

.project-tools a.danger {
  color: #ef5c5c;
}

.progress-line {
  position: relative;
  margin: 10px 0 12px;
}

.progress-track {
  height: 4px;
  border-radius: 6px;
  background: #2c7cff;
}

.progress-point {
  position: absolute;
  top: -3px;
  left: 36%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2c7cff;
}

.stage-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.stage-item {
  font-size: 12px;
  color: #8d9db2;
}

.stage-name {
  color: #3b4f67;
  margin-bottom: 4px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #7a8ea8;
  font-size: 13px;
  margin-top: 8px;
  padding: 6px 8px;
}

.pager {
  display: flex;
  gap: 6px;
}

.pager button {
  min-width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #d8e0ea;
  background: #fff;
  color: #5d748f;
}

.pager button.active {
  background: #377dff;
  border-color: #377dff;
  color: #fff;
}

.side-panel {
  flex: 0 0 310px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calendar-card {
  padding: 8px;
}

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 2px 10px;
  color: #24374f;
}

.calendar-header strong {
  font-size: 18px;
  font-weight: 600;
  margin: 0 10px;
  line-height: 1.2;
}

.calendar-nav-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calendar-nav {
  border: none;
  background: transparent;
  color: #657b94;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  padding: 0 2px;
}

.calendar-week,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.calendar-week {
  color: #2f3b4a;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 10px;
  background: #edf2f8;
  border-radius: 10px;
}

.calendar-grid {
  padding: 10px 8px 6px;
  gap: 8px 4px;
  grid-template-rows: repeat(6, 42px);
}

.calendar-day {
  border: none;
  background: transparent;
  height: 42px;
  border-radius: 999px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #10253f;
  cursor: pointer;
  transition: background-color 0.15s ease;
  padding: 0;
}

.calendar-day:not(.blank):hover {
  background: #f2f5fa;
}

.calendar-day.blank {
  cursor: default;
}

.calendar-day-number {
  font-size: 14px;
  line-height: 1;
}

.calendar-day.today {
  color: #23364d;
  font-weight: 600;
}

.calendar-day.selected {
  background: #dbe4ee;
}

.event-dots {
  display: flex;
  gap: 4px;
  min-height: 8px;
  align-items: center;
}

.event-dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}

.todo-card {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-card h4 {
  font-size: 15px;
  color: #31465e;
  margin-bottom: 4px;
}

.todo-card p {
  font-size: 12px;
  color: #5f738b;
  line-height: 1.5;
}

.todo-card a {
  font-size: 13px;
  color: #2e70df;
  text-decoration: none;
}

.todo-card.pink {
  background: #f9ebf2;
}

.todo-card.green {
  background: #e8f7ec;
}

.todo-card.purple {
  background: #efeafd;
}

.todo-card.blue {
  background: #e8f4ff;
}

.todo-card.yellow {
  background: #f8f6e8;
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

.accept-modal {
  width: min(1240px, 94vw);
  max-height: 90vh;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4ecf5;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #ecf1f8;
}

.modal-header h3 {
  font-size: 22px;
  color: #32485f;
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
  padding: 14px 18px;
  overflow-y: auto;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  margin-bottom: 10px;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field label {
  width: 104px;
  color: #5f748f;
  font-size: 13px;
}

.field label.required::after {
  content: '*';
  color: #ef5d5d;
  margin-left: 4px;
}

.field input,
.field select {
  width: 100%;
  height: 34px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 10px;
  color: #516781;
}

.field.actions {
  justify-content: flex-start;
}

.block {
  margin-bottom: 10px;
}

.block-title {
  color: #4a6078;
  margin-bottom: 8px;
  font-size: 13px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #a8c0ee;
  border-radius: 6px;
  padding: 4px 8px;
  color: #3a5f91;
  background: #f7faff;
}

.tag button,
.add-tag {
  border: none;
  background: transparent;
  color: #2f6bff;
  cursor: pointer;
}

.add-tag {
  border: 1px solid #8ab0ff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

.timeline-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.timeline-item label {
  display: block;
  color: #3c5f9a;
  margin-bottom: 6px;
  font-size: 12px;
}

.timeline-item input {
  width: 100%;
  height: 32px;
  border: 1px solid #dbe4f0;
  border-radius: 4px;
  padding: 0 8px;
}

.modal-footer {
  padding: 10px 18px 14px;
  border-top: 1px solid #ecf1f8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
