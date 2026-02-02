<script setup lang="ts">
/**
 * @file 指标卡片组件
 * @description 用于展示关键指标数据，支持图标、单位、趋势变化显示
 */

/** 图标类型定义 */
type IconType = 'output' | 'temperature' | 'pressure' | 'speed' | 'time' | 'percent' | 'device' | 'alert'

interface Props {
  /** 指标标签 */
  label?: string
  /** 指标数值 */
  value?: string | number
  /** 数值单位（如：件、℃、%、MPa） */
  unit?: string
  /** 变化值（如：+12%） */
  change?: string
  /** 趋势方向 */
  trend?: 'up' | 'down' | 'neutral'
  /** 图标类型 */
  icon?: IconType
  /** 图标背景色 */
  iconBg?: string
}

withDefaults(defineProps<Props>(), {
  label: 'total_output',
  value: '0',
  unit: '',
  change: '',
  trend: 'neutral',
  icon: undefined,
  iconBg: 'bg-[rgba(16,185,129,0.12)]'
})

const trendColor = {
  up: 'text-[#22C55E]',
  down: 'text-(--red-error)',
  neutral: 'text-(--text-tertiary)'
}

const trendArrow = {
  up: '↑',
  down: '↓',
  neutral: ''
}

/** 图标 SVG 路径映射 */
const iconPaths: Record<IconType, string> = {
  output: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  temperature: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
  pressure: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
  speed: 'M13 10V3L4 14h7v7l9-11h-7z',
  time: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5v5l3 3',
  percent: 'M19 5L5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm11 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  device: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01'
}
</script>

<template>
  <div
    class="flex gap-4 w-50 p-5 rounded-2xl bg-(--bg-glass) glass-effect shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
  >
    <!-- 图标区域 -->
    <div
      v-if="icon"
      :class="['flex items-center justify-center w-12 h-12 rounded-xl shrink-0', iconBg]"
    >
      <svg
        class="w-6 h-6 text-(--green-primary)"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="iconPaths[icon]" />
      </svg>
    </div>

    <!-- 内容区域 -->
    <div class="flex flex-col gap-2 min-w-0">
      <span class="font-primary text-[11px] text-(--text-tertiary) truncate">
        {{ label }}
      </span>
      <div class="flex items-baseline gap-1">
        <span class="font-primary text-[28px] font-semibold text-(--text-primary)">
          {{ value }}
        </span>
        <span v-if="unit" class="font-primary text-sm text-(--text-tertiary)">
          {{ unit }}
        </span>
      </div>
      <div v-if="change" class="flex items-center gap-1.5">
        <span :class="['font-mono text-xs font-medium', trendColor[trend]]">
          {{ trendArrow[trend] }}
        </span>
        <span :class="['font-mono text-xs font-medium', trendColor[trend]]">
          {{ change }}
        </span>
      </div>
    </div>
  </div>
</template>
