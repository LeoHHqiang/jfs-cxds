<template>
  <main class="main-content">
    <!-- 顶部搜索与操作 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="label">模板创建人：</label>
        <input class="search-input" v-model="filters.creator" placeholder="请输入" />
        <button class="btn btn-primary" @click="onQuery">查询</button>
        <button class="btn btn-ghost" @click="onReset">重置</button>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-secondary" @click="openTemplateModal('create')">+ 新建验收模版</button>
      </div>
    </div>

    <!-- 模板卡片栅格 -->
    <div class="grid">
      <div v-for="tpl in pagedTemplates" :key="tpl.id" class="card">
        <div class="card-header">{{ tpl.name }}</div>
        <div class="card-meta">
          <span>创建人：{{ tpl.creator }}</span>
          <span>创建时间：{{ tpl.createdAt }}</span>
        </div>
        <div class="card-actions">
          <button class="btn-sm btn-outline" @click="openTemplateModal('edit', tpl)">编辑</button>
          <button class="btn-sm btn-outline" @click="onDuplicate(tpl)">复用</button>
          <button class="btn-sm btn-danger" @click="requestDelete(tpl)">删除</button>
        </div>
      </div>
    </div>

    <!-- 分页（含跳转） -->
    <div class="pager">
      <div class="pager-left">共 {{ total }} 条记录， 共 {{ totalPages }} 页</div>
      <div class="pager-right">
        <button class="page-btn" :disabled="page===1" @click="goPage(1)">≪</button>
        <button class="page-btn" :disabled="page===1" @click="goPage(page-1)">‹</button>
        <span class="page-num" :class="{active: page===p}" v-for="p in pageList" :key="p" @click="goPage(p)">{{ p }}</span>
        <button class="page-btn" :disabled="page===totalPages" @click="goPage(page+1)">›</button>
        <button class="page-btn" :disabled="page===totalPages" @click="goPage(totalPages)">≫</button>
        <span class="jump">跳转到</span>
        <input class="jump-input" v-model.number="jumpTo" @keyup.enter="goPage(jumpTo)" />
        <span>页</span>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div v-if="confirm.visible" class="modal-mask" @click.self="closeConfirm">
      <div class="modal">
        <div class="modal-header">
          <span>提示</span>
          <button class="icon-btn" @click="closeConfirm">✕</button>
        </div>
        <div class="modal-body">
          <div class="warn-icon">!</div>
          <div class="modal-text">
            <div class="title">请注意，此为危险操作，</div>
            <div class="desc">确定删除 <span class="link">{{ confirm.target?.name }}</span> 模板吗？</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="confirmDelete">确认</button>
          <button class="btn" @click="closeConfirm">取消</button>
        </div>
      </div>
    </div>

    <div v-if="templateModal.visible" class="modal-mask" @click.self="closeTemplateModal">
      <div class="modal editor-modal">
        <div class="modal-header">
          <span>{{ templateModal.title }}</span>
          <button class="icon-btn" @click="closeTemplateModal">✕</button>
        </div>
        <div class="editor-body">
          <div class="editor-top">
            <label>模板名称：</label>
            <input v-model="templateForm.name" placeholder="请输入" />
          </div>
          <table class="item-table">
            <thead>
              <tr>
                <th>采集项名称</th>
                <th>模板</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in templateForm.items" :key="item.id">
                <td>
                  <div class="item-cell">
                    <span>{{ item.label }}</span>
                    <button class="tiny-btn" @click="removeItem(idx)">⊖</button>
                  </div>
                </td>
                <td>
                  <div class="item-cell">
                    <span>{{ item.fileName || '无' }}</span>
                    <button class="tiny-btn" @click="assignDemoFile(idx)">⊕</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="editor-tools">
            <button class="btn btn-ghost" @click="addItem">+ 新增采集项</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveTemplate">保存</button>
          <button class="btn" @click="closeTemplateModal">取消</button>
        </div>
      </div>
    </div>
  </main>
  
</template>

<script setup>
/* eslint-disable */
import { computed, onMounted, reactive, ref } from 'vue'
import { fetchTemplateList, removeTemplate, saveTemplateData } from '@/api'

const props = defineProps({
  pageName: { type: String, default: '模板管理' }
})

const filters = reactive({ creator: '' })

// 本地模板数据（未接后端时展示）
const allTemplates = ref([])
const page = ref(1)
const size = ref(8)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const pageList = computed(() => {
  const max = totalPages.value
  const current = page.value
  const around = [current-1, current, current+1].filter(p => p>=1 && p<=max)
  return Array.from(new Set([1, ...around, max])).sort((a,b)=>a-b)
})
const pagedTemplates = computed(() => {
  const start = (page.value - 1) * size.value
  return allTemplates.value.slice(start, start + size.value)
})
const jumpTo = ref()
const templateModal = reactive({
  visible: false,
  mode: 'create',
  title: '新建验收模板',
  targetId: ''
})
const defaultItems = [
  { id: 'i1', label: '验收报告', fileName: '' },
  { id: 'i2', label: '材质证明', fileName: '' },
  { id: 'i3', label: '上模图片', fileName: '' },
  { id: 'i4', label: '下模图片', fileName: '' },
  { id: 'i5', label: '实物整体图片', fileName: '' },
  { id: 'i6', label: '实物铭牌图片', fileName: '' }
]
const templateForm = reactive({
  name: '',
  items: []
})

const loadData = async () => {
  try {
    const res = await fetchTemplateList({ creator: filters.creator, page: 1, size: 999 })
    allTemplates.value = res.list || []
    total.value = res.total || allTemplates.value.length
  } catch (error) {
    console.error('加载模板列表失败:', error)
  }
}

const onQuery = async () => {
  page.value = 1
  if (filters.creator) {
    allTemplates.value = allTemplates.value.filter(t => t.creator.includes(filters.creator))
    total.value = allTemplates.value.length
  } else {
    await loadData()
  }
}

const onReset = async () => {
  filters.creator = ''
  await loadData()
}

const goPage = (p) => {
  const max = totalPages.value
  const next = Math.min(Math.max(1, Number(p) || 1), max)
  page.value = next
}

const onDuplicate = async (tpl) => {
  openTemplateModal('duplicate', tpl)
}

// 删除确认弹窗
const confirm = reactive({ visible: false, target: null })
const requestDelete = (tpl) => { confirm.visible = true; confirm.target = tpl }
const closeConfirm = () => { confirm.visible = false; confirm.target = null }
const confirmDelete = async () => {
  const tpl = confirm.target
  if (!tpl) return closeConfirm()
  await removeTemplate(tpl.id).catch(()=>{})
  allTemplates.value = allTemplates.value.filter(t => t.id !== tpl.id)
  total.value = allTemplates.value.length
  if (page.value > totalPages.value) page.value = totalPages.value
  closeConfirm()
}

const openTemplateModal = (mode, tpl) => {
  templateModal.visible = true
  templateModal.mode = mode
  templateModal.targetId = tpl?.id || ''
  templateModal.title = mode === 'edit' ? '编辑验收模板' : mode === 'duplicate' ? '复用验收模板' : '新建验收模板'
  templateForm.name = mode === 'duplicate' ? `${tpl?.name || ''}-副本` : tpl?.name || ''
  templateForm.items = JSON.parse(JSON.stringify(defaultItems))
}

const closeTemplateModal = () => {
  templateModal.visible = false
}

const addItem = () => {
  templateForm.items.push({
    id: `i-${Date.now()}`,
    label: `采集项${templateForm.items.length + 1}`,
    fileName: ''
  })
}

const removeItem = (idx) => {
  if (templateForm.items.length <= 1) return
  templateForm.items.splice(idx, 1)
}

const assignDemoFile = (idx) => {
  templateForm.items[idx].fileName = `验收报告模板${idx + 1}.pdf`
}

const saveTemplate = async () => {
  if (!templateForm.name.trim()) return
  const payload = {
    id: templateModal.mode === 'edit' ? templateModal.targetId : undefined,
    name: templateForm.name,
    creator: '当前用户',
    createdAt: '2026-04-27',
    items: templateForm.items
  }
  const saved = await saveTemplateData(payload)
  if (templateModal.mode === 'create' || templateModal.mode === 'duplicate') {
    allTemplates.value.unshift(saved)
    total.value = allTemplates.value.length
  } else if (templateModal.mode === 'edit' && templateModal.targetId) {
    const idx = allTemplates.value.findIndex((t) => String(t.id) === String(templateModal.targetId))
    if (idx !== -1) allTemplates.value[idx] = saved
  }
  closeTemplateModal()
}

onMounted(loadData)
</script>

<style scoped>
.main-content { padding: 16px; display: flex; flex-direction: column; min-height: 100vh; box-sizing: border-box; }

.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.label { color: #606266; }
.search-input { width: 220px; height: 32px; padding: 0 8px; border: 1px solid #dcdfe6; border-radius: 6px; }

.btn { height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid #dcdfe6; background: #fff; cursor: pointer; }
.btn-primary { background: #3a7afe; color: #fff; border-color: #3a7afe; }
.btn-ghost { background: #fff; color: #2f6bff; border-color: #c9dcff; }
.btn-secondary { background: #eff5ff; color: #2f6bff; border-color: #c9dcff; }

.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.card { background: #fff; border: 1px solid #eef0f3; border-radius: 10px; padding: 12px; }
.card-header { font-weight: 600; margin-bottom: 8px; }
.card-meta { color: #606266; font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 10px; }
.card-actions { display: flex; gap: 8px; }
.btn-sm { height: 28px; padding: 0 10px; border-radius: 6px; border: 1px solid #c9dcff; background: #fff; color: #2f6bff; cursor: pointer; }
.btn-danger { border-color: #ffcccc; color: #ff4d4f; }

.pager { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 16px; color: #606266; }
.pager-right { display: flex; align-items: center; gap: 6px; }
.page-btn { padding: 4px 8px; border: 1px solid #dcdfe6; background: #fff; border-radius: 4px; cursor: pointer; }
.page-num { padding: 4px 8px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; }
.page-num.active { background: #3a7afe; color: #fff; border-color: #3a7afe; }
.jump { margin-left: 8px; }
.jump-input { width: 48px; height: 26px; padding: 0 6px; border: 1px solid #dcdfe6; border-radius: 4px; }

/* 弹窗样式 */
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 520px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.12); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
.icon-btn { border: none; background: transparent; cursor: pointer; font-size: 16px; }
.modal-body { display: flex; align-items: center; gap: 16px; padding: 24px 24px 8px; }
.warn-icon { width: 56px; height: 56px; border-radius: 50%; background: #ffecb3; color: #faad14; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; }
.modal-text .title { font-weight: 600; margin-bottom: 6px; }
.modal-text .desc { color: #606266; }
.modal-text .link { color: #2f6bff; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 24px; }
.editor-modal { width: min(760px, 92vw); }
.editor-body { padding: 16px 20px; }
.editor-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.editor-top label { width: 80px; color: #606266; }
.editor-top input { flex: 1; height: 34px; border: 1px solid #dcdfe6; border-radius: 6px; padding: 0 10px; }
.item-table { width: 100%; border-collapse: collapse; }
.item-table th, .item-table td { border-bottom: 1px solid #edf1f6; padding: 8px; text-align: left; }
.item-table th { background: #f3f7ff; }
.item-cell { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tiny-btn { border: 1px solid #a9c2ff; color: #2f6bff; background: #fff; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; }
.editor-tools { margin-top: 10px; }

@media (max-width: 1200px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
</style>


