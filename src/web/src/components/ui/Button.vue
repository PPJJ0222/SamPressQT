<script setup lang="ts">
// 按钮组件 - 支持多种变体
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  icon?: string
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false
})

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
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="[baseClasses, variantClasses, { 'opacity-50 cursor-not-allowed': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <span v-if="icon" class="w-4.5 h-4.5 flex items-center justify-center">
      <component :is="icon" />
    </span>
    <span v-if="label">{{ label }}</span>
    <slot v-if="!label" />
  </button>
</template>
