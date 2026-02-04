<script setup lang="ts">
/**
 * @file 按钮组件
 * @description 支持多种变体和 loading 状态的通用按钮组件
 * @module components/ui/Button
 */
import { computed } from 'vue'

interface Props {
  /** 按钮变体样式 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  /** 图标组件 */
  icon?: string
  /** 按钮文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示加载状态 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
  loading: false
})

/** 按钮是否处于禁用状态（disabled 或 loading 时都禁用） */
const isDisabled = computed(() => props.disabled || props.loading)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const baseClasses = 'flex items-center justify-center gap-2 rounded-[14px] px-5 py-3.5 font-primary text-sm font-medium touch-interactive touch-target transition-all'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'gradient-primary text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]'
    case 'secondary':
      return 'bg-(--bg-glass) text-(--text-secondary) border border-(--border-subtle) glass-effect shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    case 'outline':
      return 'bg-(--bg-glass) text-(--text-secondary) border border-(--border-divider) glass-effect shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    case 'ghost':
      return 'bg-transparent text-(--blue-link) font-medium'
    case 'destructive':
      return 'gradient-destructive text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)]'
    default:
      return ''
  }
})

const handleClick = (event: MouseEvent) => {
  if (!isDisabled.value) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="[baseClasses, variantClasses, { 'opacity-50 cursor-not-allowed': isDisabled }]"
    :disabled="isDisabled"
    @click="handleClick"
  >
    <!-- Loading 旋转图标 -->
    <svg
      v-if="loading"
      class="w-4.5 h-4.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
    </svg>
    <!-- 原有图标（loading 时隐藏） -->
    <span v-else-if="icon" class="w-4.5 h-4.5 flex items-center justify-center">
      <component :is="icon" />
    </span>
    <span v-if="label">{{ label }}</span>
    <slot v-if="!label" />
  </button>
</template>
