<template>
  <main class="main-content">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-title">待审批移模数</div>
        <div class="stat-value">{{ stats.pending }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">已审批移模数</div>
        <div class="stat-value">{{ stats.approved }}</div>
      </div>
      <div class="chart-card">
        <div class="chart-title">审批数据统计</div>
        <div class="chart" ref="chartRef">
          <svg v-if="chartData.points.length" :width="chartWidth" :height="chartHeight">
            <polyline :points="svgPoints" fill="none" stroke="#6a7dff" stroke-width="2" />
            <polyline
              v-for="(line, idx) in chartData.extraLines"
              :key="idx"
              :points="line"
              fill="none"
              stroke="#7bd6ff"
              stroke-width="2"
            />
          </svg>
          <div v-else class="chart-empty">暂无图表数据</div>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="tools-left"></div>
      <div class="tools-right">
        <button class="btn" @click="onExport">导出Excel</button>
        <label class="btn file-btn">
          导入Excel
          <input type="file" @change="onImport" />
        </label>
        <button class="btn btn-ghost" @click="onBatchExport">导出 - 批量通过</button>
        <button class="btn btn-ghost" @click="openDeleteConfirm">删除</button>
      </div>
    </div>

    <div class="filters-card">
      <div class="filters-grid">
        <div class="form-item"><label class="label">零件名称：</label><input class="input" v-model="form.partName" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">零件编号：</label><input class="input" v-model="form.partCode" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">子零件名称：</label><input class="input" v-model="form.subPartName" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">子零件编号：</label><input class="input" v-model="form.subPartCode" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">工装名称：</label><input class="input" v-model="form.toolName" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">工装分类：</label><select class="select" v-model="form.category"><option value="">请选择</option><option value="A">A类</option><option value="B">B类</option></select></div>
        <div class="form-item"><label class="label">供应商模具编号：</label><input class="input" v-model="form.supplierMoldCode" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">工装实物编号：</label><input class="input" v-model="form.toolPhysicalCode" placeholder="请输入" /></div>
        <div class="form-item"><label class="label">供应商：</label><select class="select" v-model="form.supplier"><option value="">请选择</option><option value="V1">供应商1</option><option value="V2">供应商2</option></select></div>
        <div class="form-item"><label class="label">工装供应商：</label><select class="select" v-model="form.toolSupplier"><option value="">请选择</option><option value="TV1">工装供应商1</option><option value="TV2">工装供应商2</option></select></div>
        <div class="form-item"><label class="label">零部件厂：</label><select class="select" v-model="form.partFactory"><option value="">请选择</option><option value="F1">零部件厂1</option><option value="F2">零部件厂2</option></select></div>
        <div class="form-item"><label class="label">采购负责人：</label><select class="select" v-model="form.buyer"><option value="">请选择</option><option value="王五">王五</option><option value="赵六">赵六</option></select></div>
      </div>
      <div class="filters-actions">
        <button class="btn btn-primary" @click="onQuery">查询</button>
        <button class="btn btn-ghost" @click="onReset">重置</button>
      </div>
    </div>

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
            <div class="desc">确定删除选中的移模申请吗？</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="confirmDelete">确认</button>
          <button class="btn" @click="closeConfirm">取消</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
/* eslint-disable */
import { onMounted, reactive, ref, computed } from 'vue'
import { fetchMoveApproveStats, fetchMoveApproveChart, exportMoveApprove, importMoveApprove } from '@/api'

defineProps({ pageName: { type: String, default: '移模审批' } })

const stats = reactive({ pending: 1, approved: 1 })
const chartRef = ref(null)
const chartWidth = 480
const chartHeight = 120
const chartData = reactive({ points: [], extraLines: [] })
const svgPoints = computed(() => chartData.points.map(p => `${p.x},${p.y}`).join(' '))

const generateMockChart = () => {
  const n = 12
  const baseY = 20
  chartData.points = Array.from({ length: n }, (_, i) => ({ x: (i / (n - 1)) * chartWidth, y: baseY + 60 - Math.sin(i / 1.5) * 20 - i }))
  chartData.extraLines = [Array.from({ length: n }, (_, i) => `${(i / (n - 1)) * chartWidth},${baseY + 70 - Math.cos(i / 1.3) * 18}`).join(' ')]
}

const loadStats = async () => {
  const res = await fetchMoveApproveStats()
  if (res && res.data) {
    stats.pending = Number(res.data.pending ?? stats.pending)
    stats.approved = Number(res.data.approved ?? stats.approved)
  }
}

const loadChart = async () => {
  const res = await fetchMoveApproveChart({ range: '90d' })
  if (res && res.data && Array.isArray(res.data.series)) {
    const series = res.data.series[0] || []
    if (series.length) {
      const maxX = series.length - 1
      const maxY = Math.max(...series) || 1
      chartData.points = series.map((v, i) => ({ x: (i / maxX) * chartWidth, y: chartHeight - (v / maxY) * chartHeight }))
      chartData.extraLines = (res.data.series.slice(1) || []).map(arr => arr.map((v, i) => `${(i / maxX) * chartWidth},${chartHeight - (v / maxY) * chartHeight}`).join(' '))
      return
    }
  }
  generateMockChart()
}

const form = reactive({
  partName: '',
  partCode: '',
  subPartName: '',
  subPartCode: '',
  toolName: '',
  category: '',
  supplierMoldCode: '',
  toolPhysicalCode: '',
  supplier: '',
  toolSupplier: '',
  partFactory: '',
  buyer: ''
})

const onExport = async () => {
  const res = await exportMoveApprove({ ...form })
  if (res && res.url) {
    window.open(res.url)
    return
  }
  if (res && res.blob) {
    const url = URL.createObjectURL(res.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '移模审批.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }
}

const onImport = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (file) await importMoveApprove(file)
}

const onQuery = () => {
  alert('已执行查询')
}
const onReset = () => {
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
}

const onBatchExport = () => {
  alert('已触发批量通过导出')
}

const confirm = reactive({ visible: false })
const openDeleteConfirm = () => {
  confirm.visible = true
}
const closeConfirm = () => {
  confirm.visible = false
}
const confirmDelete = () => {
  alert('已执行删除操作')
  closeConfirm()
}

onMounted(async () => {
  await loadStats()
  await loadChart()
})
</script>

<style scoped>
.main-content { padding: 16px; }
.stats-row { display: grid; grid-template-columns: 220px 220px 1fr; gap: 12px; }
.stat-card { background: #fff; border: 1px solid #eef0f3; border-radius: 10px; padding: 12px; }
.stat-title { color: #606266; }
.stat-value { font-size: 36px; font-weight: 700; color: #2f6bff; margin-top: 6px; }
.chart-card { background: #fff; border: 1px solid #eef0f3; border-radius: 10px; padding: 12px; }
.chart-title { color: #606266; margin-bottom: 6px; }
.chart { height: 140px; display: flex; align-items: center; justify-content: center; }
.chart-empty { color: #999; }

.toolbar { display: flex; align-items: center; justify-content: space-between; margin: 12px 0; }
.btn { height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid #dcdfe6; background: #fff; cursor: pointer; }
.btn-ghost { color: #2f6bff; border-color: #c9dcff; }
.file-btn { position: relative; overflow: hidden; }
.file-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

.filters-card { background: #fff; border: 1px solid #eef0f3; border-radius: 8px; padding: 12px; }
.filters-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; }
.form-item { display: flex; align-items: center; }
.label { width: 96px; color: #606266; }
.input, .select { flex: 1; height: 32px; padding: 0 8px; border: 1px solid #dcdfe6; border-radius: 6px; }
.filters-actions { margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end; }

.modal-mask { position: fixed; inset: 0; background: rgba(0, 0, 0, .35); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 520px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, .12); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
.icon-btn { border: none; background: transparent; cursor: pointer; font-size: 16px; }
.modal-body { display: flex; align-items: center; gap: 16px; padding: 24px 24px 8px; }
.warn-icon { width: 56px; height: 56px; border-radius: 50%; background: #ffecb3; color: #faad14; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; }
.modal-text .title { font-weight: 600; margin-bottom: 6px; }
.modal-text .desc { color: #606266; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 24px; }

@media (max-width: 1200px) { .filters-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
