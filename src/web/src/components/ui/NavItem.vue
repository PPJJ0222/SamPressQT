<script setup lang="ts">
/**
 * @file 导航项组件
 * @description 顶部导航栏中的单个导航项，支持激活/未激活状态
 */

/** 组件属性定义 */
interface Props {
  /** 导航项显示文本 */
  label?: string
  /** 是否为激活状态 */
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  label: 'menu',
  active: false
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    :class="[
      // 基础样式
      'relative flex items-center justify-center gap-2',
      'w-35 px-4 py-3 rounded-[14px]',
      'font-primary text-base',
      'touch-target touch-interactive',
      // 状态样式
      active
        ? 'bg-(--green-light) text-(--green-primary) font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        : 'bg-(--bg-surface) border border-(--border-subtle) text-(--text-secondary) active:bg-(--bg-hover)'
    ]"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click')"
  >
    <!-- 文本标签 -->
    <span>{{ label }}</span>

    <!-- 底部指示条 -->
    <span
      :class="[
        'absolute bottom-1.5 left-4 right-4 h-0.75 rounded-sm',
        'bg-(--green-primary) transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-0'
      ]"
      aria-hidden="true"
    />
  </button>
</template>
