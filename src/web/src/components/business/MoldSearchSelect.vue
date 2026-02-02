<script setup lang="ts">
/**
 * @file 模具搜索选择组件
 * @description 支持远程搜索的模具号选择器，集成数字键盘
 */
import { ref, watch, computed } from 'vue'
import Numpad from './Numpad.vue'

interface Props {
  /** 当前选中的模具号 */
  modelValue?: string
  /** 模具号选项列表 */
  options?: string[]
  /** 是否正在加载 */
  loading?: boolean
  /** 占位文本 */
  placeholder?: string
  /** 下拉选项的列数，默认为 9 */
  columns?: 3 | 4 | 5 | 6 | 7 | 8 | 9
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  loading: false,
  placeholder: '请输入模具号',
  columns: 9
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [keyword: string]
  select: [mouldCode: string]
}>()

/** 输入框值 */
const inputValue = ref(props.modelValue)

/** 下拉框是否展开 */
const isOpen = ref(false)

/** 数字键盘是否显示 */
const showNumpad = ref(false)

/** 组件容器引用 */
const containerRef = ref<HTMLElement | null>(null)

/** 同步外部值变化 */
watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

/** 模态框网格类名 */
const modalGridClass = computed(() => {
  if (props.columns === 9) return 'grid grid-cols-9 modal-grid'
  if (props.columns === 8) return 'grid grid-cols-8 modal-grid'
  if (props.columns === 7) return 'grid grid-cols-7 modal-grid'
  if (props.columns === 6) return 'grid grid-cols-6 modal-grid'
  if (props.columns === 5) return 'grid grid-cols-5 modal-grid'
  if (props.columns === 4) return 'grid grid-cols-4 modal-grid'
  if (props.columns === 3) return 'grid grid-cols-3 modal-grid'
  return 'grid grid-cols-9 modal-grid'
})

/** 处理输入框点击 */
const handleInputClick = () => {
  showNumpad.value = true
}

/** 处理数字键盘输入 */
const handleNumpadInput = (value: string) => {
  inputValue.value = value
}

/** 处理数字键盘确认 */
const handleNumpadConfirm = (value: string) => {
  inputValue.value = value
  showNumpad.value = false
  emit('update:modelValue', value)
  emit('search', value)
  if (value) {
    isOpen.value = true
  }
}

/** 处理数字键盘关闭 */
const handleNumpadClose = () => {
  showNumpad.value = false
}

/** 选择模具号 */
const handleSelect = (mouldCode: string) => {
  inputValue.value = mouldCode
  emit('update:modelValue', mouldCode)
  emit('select', mouldCode)
  isOpen.value = false
}

/** 清空输入 */
const handleClear = () => {
  inputValue.value = ''
  emit('update:modelValue', '')
  isOpen.value = false
}
</script>

<template>
  <div ref="containerRef" class="relative">
    <!-- 输入框 -->
    <div
      class="flex items-center gap-2 w-full rounded-[14px] px-4 py-3.5 bg-(--bg-glass) glass-effect border border-(--border-subtle) shadow-[0_2px_8px_rgba(0,0,0,0.03)] touch-target"
      @click="handleInputClick"
    >
      <input
        :value="inputValue"
        :placeholder="placeholder"
        readonly
        class="flex-1 bg-transparent font-primary text-sm text-(--text-primary) outline-none cursor-pointer"
      />
      <!-- 清除按钮 -->
      <button
        v-if="inputValue"
        class="w-6 h-6 flex items-center justify-center rounded-full bg-(--bg-surface) touch-interactive"
        @click.stop="handleClear"
      >
        <svg class="w-4 h-4 text-(--text-tertiary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
      <!-- 加载指示器 -->
      <div v-if="loading" class="w-5 h-5 border-2 border-(--blue-link) border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- 下拉选项列表（模态框模式） -->
    <Teleport to="body">
      <div
        v-if="isOpen && options.length > 0"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/40"
          @click="isOpen = false"
        />

        <!-- 模态框内容 -->
        <div class="modal-content relative flex flex-col rounded-2xl bg-(--bg-glass) glass-effect shadow-[0_4px_16px_rgba(0,0,0,0.07)] mx-4 max-w-[95vw] max-h-[85vh]">
          <!-- 标题栏 -->
          <div class="modal-header flex items-center justify-between shrink-0">
            <h3 class="modal-title font-primary font-medium text-(--text-primary)">选择模具号</h3>
            <button
              class="modal-close-btn flex items-center justify-center rounded-xl touch-target touch-interactive active:bg-(--bg-hover)"
              @click="isOpen = false"
            >
              <svg class="modal-close-icon text-(--text-tertiary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- 选项网格（可滚动） -->
          <div class="overflow-y-auto min-h-0">
            <div :class="modalGridClass">
              <button
                v-for="option in options"
                :key="option"
                :class="[
                  'modal-option font-primary touch-target touch-interactive rounded-xl border text-center',
                  option === modelValue
                    ? 'bg-(--blue-light) border-2 border-(--blue-link) text-(--blue-link) font-medium'
                    : 'bg-(--bg-glass) border-(--border-subtle) text-(--text-primary) active:bg-(--bg-hover)'
                ]"
                @click="handleSelect(option)"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 数字键盘悬浮框 -->
    <div
      v-if="showNumpad"
      class="absolute top-full left-0 mb-2 z-50"
    >
      <Numpad
        :model-value="inputValue"
        :allow-decimal="false"
        :allow-negative="true"
        @update:model-value="handleNumpadInput"
        @confirm="handleNumpadConfirm"
        @close="handleNumpadClose"
      />
    </div>
  </div>
</template>

<style scoped>
/**
 * 模态框响应式样式
 * 使用全局 CSS 变量实现流式缩放
 */

.modal-content {
  padding: var(--modal-padding);
}

.modal-header {
  margin-bottom: var(--modal-header-gap);
}

.modal-title {
  font-size: var(--modal-title-size);
}

.modal-close-btn {
  width: var(--modal-close-size);
  height: var(--modal-close-size);
}

.modal-close-icon {
  width: var(--modal-icon-size);
  height: var(--modal-icon-size);
}

.modal-option {
  /* 模具号选择：字体为主，紧凑间距 */
  padding: clamp(2px, 0.4vw, 6px) clamp(3px, 0.5vw, 6px);
  font-size: clamp(14px, 1.5vw, 17px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-grid {
  /* 模具号选择使用更紧凑的间距 */
  gap: clamp(3px, 0.6vw, 8px);
}
</style>
