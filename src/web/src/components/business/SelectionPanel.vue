<script setup lang="ts">
// 选择面板组件
interface Option {
  label: string
  value: string | number
}

interface Props {
  options?: Option[]
  modelValue?: string | number
  columns?: 2 | 4
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  columns: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const gridClass = computed(() =>
  props.columns === 4 ? 'grid-cols-4' : 'grid-cols-2'
)
</script>

<template>
  <div class="flex flex-col gap-3 p-4 rounded-2xl bg-(--bg-glass) glass-effect border border-(--border-subtle) shadow-[0_8px_16px_rgba(0,0,0,0.08)]">
    <div :class="['grid gap-3', gridClass]">
      <button
        v-for="option in options"
        :key="option.value"
        :class="[
          'flex items-center justify-center px-5 py-3.5 rounded-xl',
          'font-primary text-sm touch-target touch-interactive',
          modelValue === option.value
            ? 'bg-(--blue-light) border-2 border-(--blue-link) text-(--blue-link) font-medium'
            : 'bg-(--bg-glass) border border-(--border-subtle) text-(--text-primary) glass-effect shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
        ]"
        @click="emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
</script>
