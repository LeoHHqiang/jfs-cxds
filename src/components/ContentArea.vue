<!-- /*是主内容区的“布局容器”，负责提供统一的页面内边距、
 滚动和卡片式白底样式，
 不承担业务逻辑。 */ -->
<template>
  <main class="main-content scrollbar-like-sidebar">
    <div class="content-body">
      <slot />
    </div>
  </main>
  
</template>

<script setup>

</script>

<style scoped>
.main-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  background: #f3f6fb;
  overflow-x: auto;
  overflow-y: auto;
  padding: 10px;
}

.content-body {
  background-color: #f3f6fb;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e4ebf4;
  flex: 1;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
}
</style>
