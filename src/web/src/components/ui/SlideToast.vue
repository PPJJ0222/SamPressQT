/**
 * @file 侧滑提示组件
 * @description 从右侧滑入的提示框，用于显示校验失败等提示信息
 * @module components/ui/SlideToast
 */
<script setup lang="ts">
import { computed, watch } from 'vue'

/** 组件属性 */
interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 提示类型 */
  variant?: 'info' | 'warning' | 'error' | 'success'
  /** 提示消息 */
  message?: string
  /** 自动关闭时间（毫秒），0 表示不自动关闭 */
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  variant: 'warning',
  message: '',
  duration: 3000
})

const emit = defineEmits<{
  close: []
  'update:visible': [value: boolean]
}>()

/** 样式配置 */
const config = {
  info: {
    border: 'border-l-(--blue-link)',
    tag: '[INFO]',
    tagColor: 'text-(--blue-link)',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  warning: {
    border: 'border-l-(--amber-warning)',
    tag: '[WARN]',
    tagColor: 'text-(--amber-warning)',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  },
  error: {
    border: 'border-l-(--red-error)',
    tag: '[ERROR]',
    tagColor: 'text-(--red-error)',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  success: {
    border: 'border-l-(--green-primary)',
    tag: '[OK]',
    tagColor: 'text-(--green-primary)',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

/** 当前配置 */
const currentConfig = computed(() => config[props.variant])

/** 关闭提示 */
function handleClose() {
  emit('update:visible', false)
  emit('close')
}

/** 自动关闭定时器 */
let timer: ReturnType<typeof setTimeout> | null = null

/** 监听显示状态，设置自动关闭 */
watch(
  () => props.visible,
  (val) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (val && props.duration > 0) {
      timer = setTimeout(() => {
        handleClose()
      }, props.duration)
    }
  },
  { immediate: true }
)
</script>

<template>
  <Transition name="slide-toast">
    <div
      v-if="visible"
      :class="[
        'fixed top-4 right-4 z-60',
        'flex items-center gap-3',
        'rounded-[14px] px-4 py-3.5 min-w-70 max-w-100',
        'bg-(--bg-glass) glass-effect',
        'border-l-[3px]', currentConfig.border,
        'shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
      ]"
    >
      <!-- 图标 -->
      <svg
        :class="['w-5 h-5 shrink-0', currentConfig.tagColor]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" :d="currentConfig.icon" />
      </svg>

      <!-- 内容 -->
      <div class="flex-1 min-w-0">
        <span :class="['font-primary text-xs font-semibold mr-2', currentConfig.tagColor]">
          {{ currentConfig.tag }}
        </span>
        <span class="font-primary text-sm text-(--text-secondary)">
          {{ message }}
        </span>
      </div>

      <!-- 关闭按钮 -->
      <button
        class="text-(--text-tertiary) active:text-(--text-secondary) touch-target shrink-0"
        @click="handleClose"
      >
        <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
/* 侧滑动画 - GPU 加速优化 */
.slide-toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, opacity;
}

.slide-toast-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.slide-toast-enter-from {
  opacity: 0;
  transform: translateX(120%) translateZ(0);
}

.slide-toast-leave-to {
  opacity: 0;
  transform: translateX(100%) translateZ(0);
}
</style>
