<script setup lang="ts">
// 徽章组件
interface Props {
  variant?: 'success' | 'warning' | 'error' | 'info'
  label?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
  label: ''
})

const variantClasses = {
  success: 'bg-(--green-light) text-(--green-primary)',
  warning: 'bg-(--amber-light) text-(--amber-warning)',
  error: 'bg-(--red-light) text-(--red-error)',
  info: 'bg-(--blue-light) text-(--blue-link)'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center justify-center',
      'rounded-[10px] px-3 py-1.5',
      'font-primary text-xs font-medium',
      variantClasses[variant]
    ]"
  >
    {{ label }}
    <slot v-if="!label" />
  </span>
</template>
