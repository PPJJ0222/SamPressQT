<script setup lang="ts">
// 文本输入框组件
import { ref } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter value...',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  blur: []
}>()

const isFocused = ref(false)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2 rounded-[14px] px-4 py-3.5 w-60',
      'bg-(--bg-glass) glass-effect',
      'border border-(--border-subtle)',
      'shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
      'transition-all touch-target',
      isFocused ? 'border-(--blue-link)' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    ]"
  >
    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="flex-1 bg-transparent outline-none font-primary text-sm text-(--text-primary) placeholder:text-(--text-tertiary)"
      @input="handleInput"
      @focus="isFocused = true; emit('focus')"
      @blur="isFocused = false; emit('blur')"
    />
  </div>
</template>
