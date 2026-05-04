<template>
  <main class="main-content">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">{{ pageName }}</h2>
      </div>
      <div class="toolbar-right"></div>
    </div>

    <!-- 筛选区（与示例一致的字段） -->
    <div class="filters-card">
      <div class="filters-grid">
        <div class="form-item">
          <label class="label">项目代号：</label>
          <input class="input" v-model="form.projectCode" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label class="label">负责人：</label>
          <select class="select" v-model="form.owner">
            <option value="">请选择</option>
            <option v-for="o in ownerOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="form-item">
          <label class="label">项目进度：</label>
          <input class="input" v-model="form.progress" placeholder="关键字，留空查全部" />
        </div>
        <div class="form-item">
          <label class="label">相关采购：</label>
          <select class="select" v-model="form.purchase">
            <option value="">请选择</option>
            <option v-for="p in purchaseOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>

        <div class="form-item">
          <label class="label">项目开始时间：</label>
          <input class="input" v-model="form.startDate" placeholder="请选择时间" />
        </div>
        <div class="form-item">
          <label class="label">项目结束时间：</label>
          <input class="input" v-model="form.endDate" placeholder="请选择时间" />
        </div>
      </div>
      <div class="filters-actions">
        <button class="btn btn-primary" @click="onQuery" :disabled="loading">查询</button>
        <button class="btn btn-ghost" @click="onReset" :disabled="loading">重置</button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 160px">验收时间</th>
              <th style="width: 140px">项目代号</th>
              <th style="width: 120px">负责人</th>
              <th style="width: 160px">相关采购</th>
              <th style="width: 160px">开始时间</th>
              <th style="width: 160px">结束时间</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="center" colspan="7">加载中...</td>
            </tr>
            <tr v-else-if="list.length === 0">
              <td class="center empty" colspan="7">暂无数据</td>
            </tr>
            <tr v-else v-for="row in list" :key="row.id">
              <td>{{ row.acceptTime }}</td>
              <td>{{ row.projectCode }}</td>
              <td>{{ row.ownerName }}</td>
              <td>{{ row.purchaseName || '-' }}</td>
              <td>{{ row.startDate || '-' }}</td>
              <td>{{ row.endDate || '-' }}</td>
              <td>{{ row.remark || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="page-btn" :disabled="page === 1 || loading" @click="goPage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="page === totalPages || loading" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>
  </main>
</template>

<script setup>
/* eslint-disable */
import { reactive, ref, computed, onMounted } from 'vue'
import { fetchAcceptHistory } from '@/api'

const props = defineProps({
  pageName: {
    type: String,
    default: '历史验收'
  }
})

const form = reactive({
  projectCode: '',
  owner: '',
  progress: '',
  purchase: '',
  startDate: '',
  endDate: ''
})

const ownerOptions = ref([])
const purchaseOptions = ref([])

const list = ref([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))

const buildQuery = () => ({
  page: page.value,
  size: size.value,
  projectCode: form.projectCode || undefined,
  owner: form.owner || undefined,
  progress: form.progress || undefined,
  purchase: form.purchase || undefined,
  startDate: form.startDate || undefined,
  endDate: form.endDate || undefined
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchAcceptHistory(buildQuery())
    if (res && res.data) {
      list.value = res.data.list || []
      total.value = Number(res.data.total || 0)
      ownerOptions.value = res.data.ownerOptions || []
      purchaseOptions.value = res.data.purchaseOptions || []
    } else {
      list.value = []
      total.value = 0
      ownerOptions.value = []
      purchaseOptions.value = []
    }
  } finally {
    loading.value = false
  }
}

const onQuery = async () => { page.value = 1; await loadData() }
const onReset = async () => {
  form.projectCode = ''
  form.owner = ''
  form.progress = ''
  form.purchase = ''
  form.startDate = ''
  form.endDate = ''
  await onQuery()
}
const goPage = async (p) => { page.value = Math.min(Math.max(1, p), totalPages.value); await loadData() }

onMounted(loadData)
</script>

<style scoped>
.main-content { padding: 16px; }
.toolbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; gap: 12px; }
.page-title { margin: 0; font-size: 18px; font-weight: 600; }
.toolbar-right { display: flex; gap: 8px; }

.btn { height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid #dcdfe6; background: #fff; cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: #3a7afe; color: #fff; border-color: #3a7afe; }
.btn-secondary { background: #eff5ff; color: #2f6bff; border-color: #c9dcff; }
.btn-ghost { background: #fff; color: #2f6bff; border-color: #c9dcff; }

.filters-card { background: #fff; border: 1px solid #eef0f3; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.filters-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 16px; }
.form-item { display: flex; align-items: center; }
.label { width: 96px; color: #606266; }
.input, .select { flex: 1; height: 32px; padding: 0 8px; border: 1px solid #dcdfe6; border-radius: 6px; }
.filters-actions { margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end; }

.card { background: #fff; border: 1px solid #eef0f3; border-radius: 8px; }
.table-wrapper { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border-bottom: 1px solid #f0f0f0; padding: 10px 12px; text-align: left; }
.table thead th { background: #fafbfc; color: #606266; font-weight: 600; }
.center { text-align: center; }
.empty { color: #999; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 12px; }
.page-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #dcdfe6; background: #fff; cursor: pointer; }
.page-btn:disabled { opacity: .6; cursor: not-allowed; }
.page-info { color: #606266; }

@media (max-width: 1200px) { .filters-grid { grid-template-columns: repeat(2, 1fr); } }
</style>


