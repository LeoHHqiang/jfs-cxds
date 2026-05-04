<template>
  <div class="accept-page">
    <div v-if="showBackBar" class="accept-subnav">
      <button type="button" class="back-btn" @click="goBackToAcceptHome">
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        返回验收管理
      </button>
    </div>
    <component :is="currentSubPage" />
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed } from 'vue'
import AcceptCreatePage from './accept-manage/AcceptCreatePage.vue'
import AcceptBasePage from './accept-manage/AcceptBasePage.vue'
import AcceptDeliveryPage from './accept-manage/AcceptDeliveryPage.vue'
import AcceptItemPage from './accept-manage/AcceptItemPage.vue'
import AcceptInputPage from './accept-manage/AcceptInputPage.vue'
import AcceptMoldArchivePage from './accept-manage/AcceptMoldArchivePage.vue'
import AcceptMoveApplyPage from './accept-manage/AcceptMoveApplyPage.vue'
import { clearAcceptStageContext } from '@/utils/acceptStageContext'

const props = defineProps({
  pageName: {
    type: String,
    default: '验收管理'
  },
  activeSubmenu: {
    type: String,
    default: 'create'
  }
})

const subPageMap = {
  create: AcceptCreatePage,
  'accept-input': AcceptInputPage,
  base: AcceptBasePage,
  delivery: AcceptDeliveryPage,
  accept: AcceptItemPage,
  'mold-archive': AcceptMoldArchivePage,
  'move-apply': AcceptMoveApplyPage
}

const currentSubPage = computed(() => subPageMap[props.activeSubmenu] || AcceptCreatePage)

const showBackBar = computed(() => props.activeSubmenu && props.activeSubmenu !== 'create')

function goBackToAcceptHome() {
  clearAcceptStageContext()
  window.location.hash = '#/accept-approve/create'
}
</script>

<style scoped>
.accept-page {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.accept-subnav {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.accept-page > :last-child {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 14px;
  color: #2f7df7;
  background: #fff;
  border: 1px solid #c5daf8;
  border-radius: 8px;
  cursor: pointer;
}

.back-btn:hover {
  background: #eff6ff;
  border-color: #2f7df7;
}

.back-btn i {
  font-size: 12px;
}
</style>
