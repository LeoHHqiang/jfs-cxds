<template>
  <div class="accept-page">
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
import AcceptMoveApplyPage from './accept-manage/AcceptMoveApplyPage.vue'

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
  base: AcceptBasePage,
  delivery: AcceptDeliveryPage,
  accept: AcceptItemPage,
  'move-apply': AcceptMoveApplyPage
}

const currentSubPage = computed(() => subPageMap[props.activeSubmenu] || AcceptCreatePage)
</script>

<style scoped>
.accept-page {
  width: 100%;
}
</style>
