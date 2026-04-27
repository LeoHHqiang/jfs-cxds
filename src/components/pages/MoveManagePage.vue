<template>
  <div class="move-manage-page">
    <component :is="currentSubPage" />
  </div>
</template>

<script setup>
/* eslint-disable */
import { computed } from 'vue'
import MoveApprovalPage from './move-manage/MoveApprovalPage.vue'
import MoveApplyPage from './move-manage/MoveApplyPage.vue'

const props = defineProps({
  pageName: {
    type: String,
    default: '移模管理'
  },
  activeSubmenu: {
    type: String,
    default: 'move-approval'
  }
})

const subPageMap = {
  'move-approval': MoveApprovalPage,
  'move-apply': MoveApplyPage
}

const currentSubPage = computed(() => subPageMap[props.activeSubmenu] || MoveApprovalPage)
</script>

<style scoped>
.move-manage-page {
  width: 100%;
}
</style>
