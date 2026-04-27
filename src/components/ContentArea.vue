<!-- /*是主内容区的“布局容器”，负责提供统一的页面内边距、
 滚动和卡片式白底样式，
 不承担业务逻辑。 */ -->
<template>
  <main class="main-content">
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
  background-color: #f5f5f5;
  overflow-y: auto;
  padding: 10px;
  height: calc(100vh - 71px);
}

.content-body {
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  min-height: 100%;
}

 
/* Scrollbar Styles */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.main-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}
</style>
