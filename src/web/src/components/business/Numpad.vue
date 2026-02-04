<script setup lang="ts">
/**
 * @file 数字键盘组件
 * @description 触屏友好的数字输入键盘，支持小数和负数输入
 */
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string
  allowDecimal?: boolean
  allowNegative?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  allowDecimal: true,
  allowNegative: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  confirm: [value: string]
  close: []
}>()

/** 内部输入值 */
const inputValue = ref(props.modelValue)

/** 同步外部值变化（清空按钮联动） */
watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

/** 数字键配置 */
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const handleKey = (key: string) => {
  inputValue.value += key
  emit('update:modelValue', inputValue.value)
}

const handleBackspace = () => {
  inputValue.value = inputValue.value.slice(0, -1)
  emit('update:modelValue', inputValue.value)
}

const handleClear = () => {
  inputValue.value = ''
  emit('update:modelValue', '')
}

const handleConfirm = () => {
  emit('confirm', inputValue.value)
}
</script>

<template>
  <div class="flex flex-col gap-2 w-70 p-3 rounded-2xl bg-(--bg-glass) glass-effect border border-(--border-subtle) shadow-[0_8px_16px_rgba(0,0,0,0.08)]">
    <!-- 数字键 1-9 -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="key in keys"
        :key="key"
        class="h-13 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-xl font-medium text-(--text-primary) touch-target touch-interactive"
        @click="handleKey(key)"
      >
        {{ key }}
      </button>
    </div>

    <!-- 底部行：特殊键 + 0 + 退格 -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-if="allowDecimal"
        class="h-13 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-xl text-(--text-primary) touch-target touch-interactive"
        @click="handleKey('.')"
      >.</button>
      <button
        v-else-if="allowNegative"
        class="h-13 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-xl text-(--text-primary) touch-target touch-interactive"
        @click="handleKey('-')"
      >-</button>
      <div v-else class="h-13" />

      <button
        class="h-13 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-xl font-medium text-(--text-primary) touch-target touch-interactive"
        @click="handleKey('0')"
      >0</button>

      <button
        class="h-13 rounded-xl bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center touch-target touch-interactive"
        @click="handleBackspace"
      >
        <svg class="w-5 h-5 text-(--text-secondary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6m0-6 6 6"/>
        </svg>
      </button>
    </div>

    <!-- 操作行 -->
    <div class="grid grid-cols-3 gap-2 pt-2">
      <button
        class="h-12 rounded-xl bg-(--red-light) border border-(--red-error) font-primary text-sm font-medium text-(--red-error) touch-target touch-interactive"
        @click="handleClear"
      >清除</button>
      <button
        class="h-12 rounded-xl gradient-primary font-primary text-sm font-medium text-white touch-target touch-interactive"
        @click="handleConfirm"
      >确认</button>
      <button
        class="h-12 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-sm text-(--text-secondary) touch-target touch-interactive"
        @click="emit('close')"
      >关闭</button>
    </div>
  </div>
</template>
