<template>
  <section class="accept-input-page">
    <div class="placeholder-card">
      <p class="placeholder-title">验收录入</p>
      <p class="placeholder-hint">内容待定</p>
    </div>
  </section>
</template>

<script setup>
/* eslint-disable */
defineProps({
  pageName: { type: String, default: '' },
  activeSubmenuLabel: { type: String, default: '' }
})
</script>

<style scoped>
.accept-input-page {
  min-height: 100%;
  padding: 0;
}
.placeholder-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e7edf4;
  padding: 48px 24px;
  text-align: center;
}
.placeholder-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #32485f;
}
.placeholder-hint {
  margin: 0;
  font-size: 14px;
  color: #8d9db2;
}
</style>
