<script setup lang="ts">
// 状态指示器组件
interface Props {
  variant?: 'running' | 'stopped' | 'error' | 'warning'
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'running',
  label: ''
})

const config = {
  running: {
    bg: 'bg-(--green-light)',
    dot: 'bg-(--green-primary)',
    text: 'text-(--green-primary)',
    defaultLabel: 'running'
  },
  stopped: {
    bg: 'bg-(--bg-surface)',
    dot: 'bg-(--text-tertiary)',
    text: 'text-(--text-tertiary)',
    defaultLabel: 'stopped'
  },
  error: {
    bg: 'bg-(--red-light)',
    dot: 'bg-(--red-error)',
    text: 'text-(--red-error)',
    defaultLabel: 'error'
  },
  warning: {
    bg: 'bg-(--amber-light)',
    dot: 'bg-(--amber-warning)',
    text: 'text-(--amber-warning)',
    defaultLabel: 'warning'
  }
}

const currentConfig = computed(() => config[props.variant])
const displayLabel = computed(() => props.label || currentConfig.value.defaultLabel)
</script>

<template>
  <div
    :class="[
      'inline-flex items-center gap-2',
      'rounded-[20px] px-3.5 py-2.5',
      currentConfig.bg
    ]"
  >
    <span :class="['w-2.5 h-2.5 rounded-full', currentConfig.dot]" />
    <span :class="['font-primary text-[13px] font-medium', currentConfig.text]">
      {{ displayLabel }}
    </span>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
</script>
