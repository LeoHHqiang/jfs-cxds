<template>
  <AcceptMoveApplyPage :user="user" />
</template>

<script setup>
/* eslint-disable */
import AcceptMoveApplyPage from '../accept-manage/AcceptMoveApplyPage.vue'

defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})
</script>
