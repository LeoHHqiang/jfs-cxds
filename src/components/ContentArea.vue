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
  background: #eef6ff;
  overflow-y: auto;
  padding: 12px;
  height: calc(100vh - 71px);
}

.content-body {
  background-color: #ffffff;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #dbeaf9;
  box-shadow: 0 8px 20px rgba(89, 135, 182, 0.12);
  display: block;
  min-height: 100%;
}

 
/* Scrollbar Styles */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #ddebf9;
}

.main-content::-webkit-scrollbar-thumb {
  background: #96bfe6;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #79abd8;
}
</style>
