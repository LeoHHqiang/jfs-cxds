<template>
  <main class="flow-query-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">{{ pageName }}</h2>
      </div>
    </div>

    <div class="filters-card">
      <p class="hint">输入<strong>验收项目代号</strong>、<strong>项目 id</strong>，或<strong>移模申请单号</strong> / <strong>移模编号</strong>（与申请单中一致）查询当前流程状态。</p>
      <div class="query-row">
        <input
          v-model="keyword"
          class="input input-wide"
          type="text"
          placeholder="例如：CM2E、YM1730… 或申请单号"
          @keyup.enter="onQuery"
        />
        <button class="btn btn-primary" type="button" :disabled="loading" @click="onQuery">查询</button>
        <button class="btn btn-ghost" type="button" :disabled="loading" @click="onReset">清空</button>
      </div>
      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
    </div>

    <div v-if="searched && !loading && empty" class="card empty-card">未找到与「{{ lastKeyword }}」匹配的项目或移模申请。</div>

    <div v-if="acceptRows.length" class="card">
      <h3 class="section-title">验收项目</h3>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>项目代号</th>
              <th>项目 id</th>
              <th>负责人</th>
              <th>当前阶段</th>
              <th>流程说明</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in acceptRows" :key="'a-' + row.projectId">
              <td>{{ row.projectCode || '—' }}</td>
              <td>{{ row.projectId }}</td>
              <td>{{ row.owner || '—' }}</td>
              <td>{{ row.currentAcceptStage }}</td>
              <td>{{ row.acceptSummary }}</td>
              <td>{{ row.updatedAt || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="moveRows.length" class="card">
      <h3 class="section-title">移模申请</h3>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>申请单号</th>
              <th>移模编号</th>
              <th>项目代号</th>
              <th>零件号</th>
              <th>工装名称</th>
              <th>流程状态</th>
              <th>申请时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in moveRows" :key="'m-' + idx + row.applyNo">
              <td>{{ row.applyNo || '—' }}</td>
              <td>{{ row.transferNo || '—' }}</td>
              <td>{{ row.projectCode || '—' }}</td>
              <td>{{ row.partNo || '—' }}</td>
              <td>{{ row.toolName || '—' }}</td>
              <td>{{ row.statusLabel }}</td>
              <td>{{ row.applyTime || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
/* eslint-disable */
import { ref } from 'vue'
import { queryProcessFlowByKeyword } from '@/api'

defineProps({
  pageName: {
    type: String,
    default: '流程查询'
  }
})

const keyword = ref('')
const lastKeyword = ref('')
const loading = ref(false)
const errorMsg = ref('')
const searched = ref(false)
const empty = ref(false)
const acceptRows = ref([])
const moveRows = ref([])

async function onQuery() {
  errorMsg.value = ''
  const k = keyword.value.trim()
  if (!k) {
    errorMsg.value = '请输入单号或项目代号'
    return
  }
  loading.value = true
  searched.value = true
  lastKeyword.value = k
  try {
    const res = await queryProcessFlowByKeyword(k)
    if (!res.success) {
      errorMsg.value = res.message || '查询失败'
      acceptRows.value = []
      moveRows.value = []
      empty.value = false
      return
    }
    const d = res.data || {}
    acceptRows.value = d.acceptRows || []
    moveRows.value = d.moveRows || []
    empty.value = !!d.empty
  } catch (e) {
    errorMsg.value = e?.message || '查询失败'
    acceptRows.value = []
    moveRows.value = []
    empty.value = false
  } finally {
    loading.value = false
  }
}

function onReset() {
  keyword.value = ''
  lastKeyword.value = ''
  errorMsg.value = ''
  searched.value = false
  empty.value = false
  acceptRows.value = []
  moveRows.value = []
}
</script>

<style scoped>
.flow-query-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.filters-card {
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 10px;
  padding: 16px 18px;
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #5a6c7d;
  line-height: 1.5;
}

.query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.input {
  height: 36px;
  border: 1px solid #d5deea;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
}

.input-wide {
  min-width: 240px;
  flex: 1;
  max-width: 480px;
}

.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2f7df7;
  color: #fff;
  border-color: #2a6fdb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: #fff;
  border-color: #d5deea;
  color: #39506a;
}

.error-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: #c0392b;
}

.card {
  background: #fff;
  border: 1px solid #e4ebf4;
  border-radius: 10px;
  padding: 16px 18px;
}

.empty-card {
  color: #5a6c7d;
  font-size: 14px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #34495e;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  border: 1px solid #e8edf3;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

.table th {
  background: #f4f8fc;
  color: #39506a;
  font-weight: 600;
  white-space: nowrap;
}

.table td {
  color: #2c3e50;
}
</style>
