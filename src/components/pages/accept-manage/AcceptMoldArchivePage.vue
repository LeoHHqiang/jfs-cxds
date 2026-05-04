<template>
  <section class="mold-archive-page">
    <div class="toolbar-card">
      <div class="toolbar-row">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="submitBusy || !canSubmit"
          @click="onSubmit"
        >
          提交并完成节点
        </button>
        <div class="toolbar-actions" aria-hidden="true"></div>
      </div>
    </div>

    <div class="mold-archive-scroll scrollbar-like-sidebar">
      <div v-if="!projectId" class="page-card">
        <h2 class="page-title">模具交付建档</h2>
        <p class="page-hint warn">
          请先在「验收管理」列表中点击该项目的阶段名称进入本页，再填写采购等信息并提交。
        </p>
      </div>

      <template v-else>
        <div v-if="loadError" class="page-card">
          <h2 class="page-title">模具交付建档</h2>
          <p class="page-hint warn">{{ loadError }}</p>
        </div>

        <div v-else-if="projectLoading" class="page-card">
          <p class="page-hint">加载项目信息…</p>
        </div>

        <div v-else class="page-stack">
          <div class="page-card">
            <h2 class="page-title">模具交付建档</h2>
            <h3 class="sec-title">项目信息（只读）</h3>
            <div class="readonly-grid">
              <div class="ro-item">
                <span class="ro-label">项目编码</span><span class="ro-val">{{ displayCell(projectRow.code) }}</span>
              </div>
              <div class="ro-item">
                <span class="ro-label">项目负责人</span><span class="ro-val">{{ displayCell(projectRow.owner) }}</span>
              </div>
              <div class="ro-item">
                <span class="ro-label">最近更新</span><span class="ro-val">{{ displayCell(projectRow.updatedAt) }}</span>
              </div>
              <div class="ro-item">
                <span class="ro-label">验收进度索引</span>
                <span class="ro-val">{{ projectRow.completedUpToIndex ?? '—' }}</span>
              </div>
            </div>
          </div>

          <div class="page-card">
            <h3 class="sec-title">录入与确认（可编辑）</h3>
            <div class="form-grid">
              <div class="field span-2">
                <label><span class="req">*</span> 采购（采购负责人）</label>
                <input v-model="form.purchaser" type="text" placeholder="请输入采购或采购负责人姓名" />
              </div>
              <div class="field span-2">
                <label>其他相关人员</label>
                <input v-model="form.relatedStaff" type="text" placeholder="如技术、质量等对接人，选填" />
              </div>
              <div class="field span-2">
                <label>备注</label>
                <textarea v-model="form.remark" rows="3" placeholder="选填"></textarea>
              </div>
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
/* eslint-disable */
import { computed, onMounted, reactive, ref } from 'vue'
import { getProjects, submitMoldArchiveDeliveryComplete } from '@/api'
import { clearAcceptStageContext, readAcceptStageContext } from '@/utils/acceptStageContext'

defineProps({
  pageName: { type: String, default: '' },
  activeSubmenuLabel: { type: String, default: '' }
})

const projectId = ref(0)
const projectLoading = ref(false)
const projectRow = ref({})
const loadError = ref('')
const submitBusy = ref(false)
const formError = ref('')

const form = reactive({
  purchaser: '',
  relatedStaff: '',
  remark: ''
})

const canSubmit = computed(() => projectId.value > 0 && !projectLoading.value && !loadError.value)

function displayCell(v) {
  const s = v == null ? '' : String(v).trim()
  return s || '—'
}

async function loadProject() {
  const ctx = readAcceptStageContext()
  const pid = Number(ctx?.projectId) || 0
  projectId.value = pid
  if (!pid) return
  projectLoading.value = true
  loadError.value = ''
  try {
    const res = await getProjects()
    const list = res?.list || []
    const row = list.find((p) => Number(p.id) === pid)
    if (!row) {
      loadError.value = '未在项目中找到当前上下文 id，请从验收管理重新进入。'
      projectRow.value = {}
      return
    }
    projectRow.value = row
  } catch (e) {
    console.error(e)
    loadError.value = '加载项目失败，请稍后重试。'
  } finally {
    projectLoading.value = false
  }
}

async function onSubmit() {
  formError.value = ''
  if (!projectId.value) {
    window.alert('缺少项目上下文，请从验收管理进入。')
    return
  }
  if (!String(form.purchaser || '').trim()) {
    formError.value = '请填写采购（采购负责人）。'
    return
  }
  submitBusy.value = true
  try {
    const res = await submitMoldArchiveDeliveryComplete({
      projectId: projectId.value,
      purchaser: form.purchaser,
      relatedStaff: form.relatedStaff,
      remark: form.remark
    })
    if (!res?.success) {
      formError.value = res?.message || '提交失败'
      window.alert(res?.message || '提交失败')
      return
    }
    clearAcceptStageContext()
    window.alert('已提交模具交付建档，已写入历史验收，并返回验收管理列表。')
    window.location.hash = '#/accept-approve/create'
  } catch (e) {
    console.error(e)
    window.alert('提交失败，请稍后重试。')
  } finally {
    submitBusy.value = false
  }
}

onMounted(loadProject)
</script>

<style scoped>
.mold-archive-page {
  flex: 1;
  min-height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mold-archive-scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.toolbar-card {
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 8px;
  padding: 10px 12px;
}
.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.toolbar-actions {
  flex: 1;
  min-width: 0;
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
.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.page-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e7edf4;
  padding: 20px 18px;
}
.page-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #32485f;
}
.sec-title {
  margin: 14px 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #3a526b;
}
.page-hint {
  margin: 0;
  font-size: 13px;
  color: #8d9db2;
  line-height: 1.55;
}
.page-hint.warn {
  color: #b35a00;
}
.readonly-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
}
.ro-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #f7f9fc;
  border-radius: 8px;
  border: 1px solid #e8eef6;
}
.ro-label {
  font-size: 12px;
  color: #60758e;
}
.ro-val {
  font-size: 13px;
  color: #2c3e50;
  word-break: break-all;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field.span-2 {
  grid-column: span 2;
}
.field label {
  font-size: 12px;
  color: #60758e;
}
.req {
  color: #de5050;
  margin-right: 2px;
}
.field input,
.field textarea {
  border: 1px solid #dbe4f0;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: #2c3e50;
}
.field textarea {
  resize: vertical;
  min-height: 72px;
}
.form-error {
  margin: 12px 0 0;
  font-size: 12px;
  color: #de5050;
}
@media (max-width: 900px) {
  .readonly-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field.span-2 {
    grid-column: span 1;
  }
}
</style>
