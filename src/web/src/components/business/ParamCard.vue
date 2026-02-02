<script setup lang="ts">
/**
 * @file 设备参数卡片组件
 * @description 用于展示单个 PLC 信号参数的实时数值，适配 4×4 网格布局
 * @module components/business/ParamCard
 */

interface Props {
  /** 参数名称 */
  name: string
  /** 参数数值 */
  value?: number | string | boolean
  /** 数值单位 */
  unit?: string
  /** 加载状态 */
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  value: '--',
  unit: '',
  loading: false
})

/**
 * 格式化显示值
 * @param val - 原始值
 * @returns 格式化后的字符串
 */
function formatValue(val: number | string | boolean | undefined): string {
  if (val === undefined || val === null) return '--'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (typeof val === 'number') {
    // 保留两位小数，去除末尾零
    return Number.isInteger(val) ? String(val) : val.toFixed(2).replace(/\.?0+$/, '')
  }
  return String(val)
}
</script>

<template>
  <div
    class="flex flex-col gap-2 p-4 rounded-xl bg-(--bg-glass) glass-effect
           border border-(--border-subtle)
           shadow-[0_4px_12px_rgba(0,0,0,0.1)] min-h-22
           transition-all duration-200 active:scale-[0.98] active:bg-opacity-90"
  >
    <!-- 参数名称 -->
    <span class="text-xs text-(--text-tertiary) truncate leading-tight">
      {{ name }}
    </span>

    <!-- 数值区域 -->
    <div class="flex items-baseline gap-1 min-h-8">
      <!-- 加载状态 -->
      <template v-if="loading">
        <div class="w-12 h-6 bg-(--bg-secondary) rounded animate-pulse" />
      </template>

      <!-- 正常显示 -->
      <template v-else>
        <span class="text-xl font-semibold text-(--text-primary) tabular-nums">
          {{ formatValue(value) }}
        </span>
        <span v-if="unit" class="text-xs text-(--text-tertiary)">
          {{ unit }}
        </span>
      </template>
    </div>
  </div>
</template>
