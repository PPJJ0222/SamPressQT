<script setup lang="ts">
// 搜索输入框组件
import { ref } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  shortcut?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
  shortcut: '⌘K'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const isFocused = ref(false)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    emit('search', props.modelValue)
  }
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2 rounded-[14px] px-4 py-3.5 w-70',
      'bg-(--bg-glass) glass-effect',
      'border border-(--border-subtle)',
      'shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
      'transition-all touch-target',
      isFocused ? 'border-(--blue-link)' : ''
    ]"
  >
    <!-- 搜索图标 -->
    <svg class="w-4.5 h-4.5 text-(--text-tertiary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>

    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      class="flex-1 bg-transparent outline-none font-primary text-sm text-(--text-primary) placeholder:text-(--text-tertiary)"
      @input="handleInput"
      @keydown="handleKeydown"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />

    <span class="text-xs text-(--text-tertiary) font-primary">{{ shortcut }}</span>
  </div>
</template>
