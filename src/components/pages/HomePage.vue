<template>
  <div class="home-page">
    <section class="main-panel">
      <div class="filter-card">
        <div class="filter-grid">
          <div class="filter-item">
            <label>统计范围：</label>
            <select>
              <option>全部</option>
              <option>近7天</option>
              <option>近30天</option>
            </select>
          </div>
          <div class="filter-item">
            <label>维度：</label>
            <select>
              <option>模块总览</option>
              <option>审批状态</option>
            </select>
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" @click="quickFilter">刷新统计</button>
          </div>
        </div>
      </div>

      <div class="stats-dashboard">
        <div class="stats-cards">
          <div v-for="card in statsCards" :key="card.key" class="stats-card">
            <div class="stats-label">{{ card.label }}</div>
            <div class="stats-value" :style="{ color: card.color }">{{ card.value }}</div>
          </div>
        </div>
        <div class="stats-charts">
          <section class="chart-box">
            <h4>业务数据柱状图</h4>
            <div class="bar-chart">
              <div v-for="bar in barChartData" :key="bar.key" class="bar-item">
                <div class="bar-track">
                  <div class="bar-fill" :style="{ height: `${bar.percent}%`, background: bar.color }"></div>
                </div>
                <p class="bar-label">{{ bar.label }}</p>
                <p class="bar-value">{{ bar.value }}</p>
              </div>
            </div>
          </section>
          <section class="chart-box">
            <h4>业务占比饼图</h4>
            <div class="pie-wrap">
              <div class="pie-chart" :style="{ background: pieBackground }"></div>
              <ul class="pie-legend">
                <li v-for="item in pieData" :key="item.key">
                  <i :style="{ backgroundColor: item.color }"></i>
                  <span>{{ item.label }}：{{ item.value }}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed, ref } from 'vue'
import { onMounted } from 'vue'
import { fetchHomeStats } from '@/api'

defineProps({
  pageName: {
    type: String,
    default: '首页'
  }
})

const statsCards = ref([])
const barChartData = ref([])
const pieData = ref([])
const pieBackground = computed(() => {
  const total = pieData.value.reduce((sum, item) => sum + Number(item.value || 0), 0)
  if (!total) {
    return 'conic-gradient(#dfe8f5 0deg 360deg)'
  }
  let angle = 0
  const segments = pieData.value.map((item) => {
    const start = angle
    const delta = (Number(item.value || 0) / total) * 360
    angle += delta
    return `${item.color} ${start}deg ${angle}deg`
  })
  return `conic-gradient(${segments.join(',')})`
})

function quickFilter() {
  loadStats()
}

async function loadStats() {
  try {
    const statsRes = await fetchHomeStats()
    if (statsRes.success) {
      statsCards.value = statsRes.data?.cards || []
      const bars = statsRes.data?.bars || []
      const max = Math.max(...bars.map((item) => Number(item.value || 0)), 1)
      barChartData.value = bars.map((item) => ({
        ...item,
        percent: Math.max(8, Math.round((Number(item.value || 0) / max) * 100))
      }))
      pieData.value = statsRes.data?.pie || []
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(loadStats)
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f3f6fb;
  padding: 12px;
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-card,
.chart-box,
.stats-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e7edf4;
}

.filter-card {
  padding: 12px 16px;
}

.btn {
  border: 1px solid #d5deea;
  background: #fff;
  color: #47607a;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-primary {
  background: #377dff;
  color: #fff;
  border-color: #377dff;
}

.filter-grid {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  min-width: 160px;
  border: 1px solid #dce5ef;
  border-radius: 6px;
  height: 34px;
  padding: 0 10px;
  color: #6f8198;
}

.stats-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stats-card {
  background: #fff;
  border: 1px solid #e7edf4;
  border-radius: 10px;
  padding: 12px;
}

.stats-label {
  color: #6f8198;
  font-size: 13px;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 6px;
}

.stats-charts {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 12px;
}

.chart-box h4 {
  font-size: 14px;
  color: #42566f;
  margin-bottom: 10px;
}

.bar-chart {
  height: 220px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  align-items: end;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.bar-track {
  height: 150px;
  width: 24px;
  border-radius: 8px;
  background: #eef3fa;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  border-radius: 8px;
  min-height: 8px;
}

.bar-label,
.bar-value {
  font-size: 12px;
  color: #5f738b;
}

.pie-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pie-chart {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 10px solid #f3f6fb;
}

.pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pie-legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #516781;
}

.pie-legend i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-charts {
    grid-template-columns: 1fr;
  }
  .filter-grid {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
