<script setup lang="ts">
/**
 * @file 下拉选择框组件
 * @description 支持多列网格布局的下拉选择器，点击外部自动关闭
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number
  options?: Option[]
  placeholder?: string
  /** 下拉选项的列数，默认为 1（垂直列表） */
  columns?: 1 | 2 | 3 | 4
  /** 是否使用模态框模式展示选项 */
  useModal?: boolean
  /** 模态框标题 */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select option',
  options: () => [],
  columns: 1,
  useModal: false,
  title: '请选择'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

/** 下拉框容器引用 */
const dropdownRef = ref<HTMLElement | null>(null)

/** 下拉框展开状态 */
const isOpen = ref(false)

/** 是否有可选数据 */
const hasOptions = computed(() => props.options.length > 0)

/** 根据列数计算网格类名（下拉菜单用） */
const gridClass = computed(() => {
  if (props.columns === 4) return 'grid grid-cols-4 gap-2'
  if (props.columns === 3) return 'grid grid-cols-3 gap-2'
  if (props.columns === 2) return 'grid grid-cols-2 gap-2'
  return 'flex flex-col'
})

/** 模态框网格类名（使用响应式间距） */
const modalGridClass = computed(() => {
  if (props.columns === 4) return 'grid grid-cols-4 modal-grid'
  if (props.columns === 3) return 'grid grid-cols-3 modal-grid'
  if (props.columns === 2) return 'grid grid-cols-2 modal-grid'
  return 'flex flex-col modal-grid'
})

/** 当前选中项的显示文本 */
const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue)
  return option?.label || props.placeholder
})

/** 选择选项 */
const selectOption = (option: Option) => {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

/** 切换下拉框展开状态 */
const toggleDropdown = () => {
  if (!hasOptions.value) return
  isOpen.value = !isOpen.value
}

/** 点击外部关闭下拉框 */
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<template>
  <div ref="dropdownRef" class="relative" :class="$attrs.class || 'w-50'">
    <button
      :class="[
        'flex items-center justify-between gap-2 w-full',
        'rounded-[14px] px-4 py-3.5',
        'bg-(--bg-glass) glass-effect',
        'border border-(--border-subtle)',
        'shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
        'touch-target touch-interactive',
        !hasOptions && 'opacity-60 cursor-not-allowed'
      ]"
      @click="toggleDropdown"
    >
      <span class="font-primary text-sm text-(--text-primary)">{{ selectedLabel }}</span>
      <svg class="w-4.5 h-4.5 text-(--text-tertiary) transition-transform" :class="{ 'rotate-180': isOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>

    <!-- 下拉菜单（非模态框模式） -->
    <div
      v-if="isOpen && hasOptions && !useModal"
      class="absolute top-full left-0 mt-2 rounded-[14px] bg-(--bg-card) border border-(--border-subtle) shadow-lg z-10 overflow-hidden p-2"
      :class="columns > 1 ? 'min-w-max' : 'right-0'"
    >
      <div :class="gridClass">
        <button
          v-for="option in options"
          :key="option.value"
          :class="[
            'px-4 py-3 font-primary text-sm touch-target touch-interactive rounded-xl border',
            modelValue === option.value
              ? 'bg-(--blue-light) border-2 border-(--blue-link) text-(--blue-link) font-medium'
              : 'bg-(--bg-glass) border-(--border-subtle) text-(--text-primary) active:bg-(--bg-hover)'
          ]"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>

  <!-- 模态框模式 -->
  <Teleport to="body">
    <div
      v-if="isOpen && hasOptions && useModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- 遮罩层 -->
      <div
        class="absolute inset-0 bg-black/40"
        @click="isOpen = false"
      />

      <!-- 模态框内容 - 使用响应式尺寸 -->
      <div class="modal-content relative rounded-2xl bg-(--bg-glass) glass-effect shadow-[0_4px_16px_rgba(0,0,0,0.07)] mx-4 max-w-[90vw]">
        <!-- 标题栏 -->
        <div class="modal-header flex items-center justify-between">
          <h3 class="modal-title font-primary font-medium text-(--text-primary)">{{ title }}</h3>
          <button
            class="modal-close-btn flex items-center justify-center rounded-xl touch-target touch-interactive active:bg-(--bg-hover)"
            @click="isOpen = false"
          >
            <svg class="modal-close-icon text-(--text-tertiary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 选项网格 -->
        <div :class="modalGridClass">
          <button
            v-for="option in options"
            :key="option.value"
            :class="[
              'modal-option font-primary touch-target touch-interactive rounded-xl border',
              modelValue === option.value
                ? 'bg-(--blue-light) border-2 border-(--blue-link) text-(--blue-link) font-medium'
                : 'bg-(--bg-glass) border-(--border-subtle) text-(--text-primary) active:bg-(--bg-hover)'
            ]"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/**
 * 模态框响应式样式
 * 使用全局 CSS 变量实现流式缩放
 * 变量定义位置：@/styles/tailwind.css
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
  padding: var(--modal-option-py) var(--modal-option-px);
  font-size: var(--modal-option-size);
  /* 文本过长时截断显示省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-grid {
  gap: var(--modal-grid-gap);
}
</style>
