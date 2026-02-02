<script setup lang="ts">
// 提示框组件
interface Props {
  variant?: 'info' | 'error' | 'success' | 'warning'
  message?: string
  closable?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
  message: '',
  closable: true
})

const emit = defineEmits<{
  close: []
}>()

const config = {
  info: { border: 'border-l-(--blue-link)', tag: '[INFO]', tagColor: 'text-(--blue-link)' },
  error: { border: 'border-l-(--red-error)', tag: '[ERROR]', tagColor: 'text-(--red-error)' },
  success: { border: 'border-l-(--green-primary)', tag: '[OK]', tagColor: 'text-(--green-primary)' },
  warning: { border: 'border-l-(--amber-warning)', tag: '[WARN]', tagColor: 'text-(--amber-warning)' }
}
</script>

<template>
  <div
    :class="[
      'flex items-center justify-between gap-3',
      'rounded-[14px] px-4 py-3.5 w-100',
      'bg-(--bg-glass) glass-effect',
      'border-l-[3px]', config[variant].border,
      'shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    ]"
  >
    <div class="flex items-center gap-3">
      <span :class="['font-primary text-xs font-semibold', config[variant].tagColor]">
        {{ config[variant].tag }}
      </span>
      <span class="font-primary text-sm text-(--text-secondary)">
        {{ message }}
      </span>
    </div>
    <button
      v-if="closable"
      class="text-(--text-tertiary) active:text-(--text-secondary) touch-target"
      @click="emit('close')"
    >
      <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>
