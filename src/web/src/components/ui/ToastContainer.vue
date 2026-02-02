/**
 * @file 全局 Toast 容器组件
 * @description 渲染多个 Toast 通知，支持堆叠显示
 * @module components/ui/ToastContainer
 */
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/useToastStore'
import SlideToast from './SlideToast.vue'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

/** 处理 Toast 关闭 */
function handleClose(id: string) {
  toastStore.remove(id)
}
</script>

<template>
  <div class="fixed top-4 right-4 z-60 flex flex-col gap-2">
    <TransitionGroup name="toast-stack">
      <SlideToast
        v-for="toast in toasts"
        :key="toast.id"
        :visible="true"
        :variant="toast.variant"
        :message="toast.message"
        :duration="toast.duration"
        class="toast-item"
        @close="handleClose(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* 覆盖 SlideToast 的 fixed 定位，使其在容器内正常流动 */
.toast-item {
  position: static !important;
  top: auto !important;
  right: auto !important;
}

/* 堆叠动画 - 优化流畅性 */
.toast-stack-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-stack-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-stack-enter-from {
  opacity: 0;
  transform: translateX(120%);
}

.toast-stack-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-stack-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
