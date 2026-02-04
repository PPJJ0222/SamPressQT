<script setup lang="ts">
/**
 * @file 确认模态框组件
 * @description 通用二次确认弹窗，支持自定义标题、内容和按钮文字
 * @module components/ui/ConfirmModal
 */
import { computed } from 'vue'

interface Props {
  /** 是否显示模态框 */
  visible: boolean
  /** 模态框标题 */
  title?: string
  /** 确认提示内容 */
  message?: string
  /** 确认按钮文字 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 确认按钮变体：primary 或 destructive */
  confirmVariant?: 'primary' | 'destructive'
  /** 是否显示加载状态 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  message: '确定要执行此操作吗？',
  confirmText: '确认',
  cancelText: '取消',
  confirmVariant: 'primary',
  loading: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

/** 确认按钮样式 */
const confirmButtonClass = computed(() => {
  const base = 'h-12 min-w-24 px-6 rounded-xl text-sm font-medium text-white touch-target touch-interactive transition-all disabled:opacity-50 flex items-center justify-center gap-2'
  if (props.confirmVariant === 'destructive') {
    return `${base} bg-gradient-to-r from-red-500 to-red-600`
  }
  return `${base} bg-gradient-to-r from-blue-500 to-blue-600`
})

/** 处理确认 */
const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

/** 处理取消 */
const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-overlay"
        @click.self="handleCancel"
      >
        <div class="modal-container">
          <!-- 标题 -->
          <h3 class="modal-title">{{ title }}</h3>

          <!-- 内容 -->
          <p class="modal-message">{{ message }}</p>

          <!-- 操作按钮 -->
          <div class="modal-actions">
            <button
              class="btn-cancel"
              :disabled="loading"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              :class="confirmButtonClass"
              :disabled="loading"
              @click="handleConfirm"
            >
              <!-- Loading 图标 -->
              <svg
                v-if="loading"
                class="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
              </svg>
              <span>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "../../styles/tailwind.css";

.modal-overlay {
  @apply fixed inset-0 z-50;
  @apply flex items-center justify-center;
  @apply bg-black/50 backdrop-blur-sm;
}

.modal-container {
  @apply w-80 p-6 rounded-2xl;
  @apply bg-(--bg-card) border border-(--border-subtle);
  @apply shadow-2xl;
}

.modal-title {
  @apply text-lg font-semibold text-(--text-primary) mb-3;
}

.modal-message {
  @apply text-sm text-(--text-secondary) mb-6 leading-relaxed;
}

.modal-actions {
  @apply flex items-center justify-end gap-3;
}

.btn-cancel {
  @apply h-12 min-w-20 px-6 rounded-xl;
  @apply text-sm font-medium text-(--text-secondary);
  @apply bg-(--bg-surface) border border-(--border-subtle);
  @apply touch-target touch-interactive transition-all;
  @apply disabled:opacity-50;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
