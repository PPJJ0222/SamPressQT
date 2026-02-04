<script setup lang="ts">
/**
 * @file 数据表格组件
 * @description 通用数据表格，支持固定宽度和自动填充列
 * @module components/ui/Table
 */

interface Column {
  key: string
  label: string
  /** 固定宽度（px） */
  width?: number
  /** 是否自动填充剩余空间 */
  flex?: boolean
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns?: Column[]
  data?: Record<string, any>[]
}

withDefaults(defineProps<Props>(), {
  columns: () => [],
  data: () => []
})

const emit = defineEmits<{
  rowClick: [row: Record<string, any>, index: number]
}>()
</script>

<template>
  <div class="w-full rounded-xl bg-(--bg-glass) glass-effect border border-(--border-subtle) shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
    <!-- 表头 -->
    <div class="flex items-center h-10 px-4 bg-(--bg-surface)">
      <div
        v-for="col in columns"
        :key="col.key"
        :style="{
          width: col.width ? `${col.width}px` : (col.flex ? 'auto' : 'auto'),
          flex: col.flex ? '1' : 'none'
        }"
        :class="[
          'flex items-center h-full font-primary text-xs font-medium text-(--text-secondary)',
          col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
        ]"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- 数据行 -->
    <div
      v-for="(row, index) in data"
      :key="index"
      class="flex items-center h-12 px-4 border-t border-(--border-subtle) touch-interactive"
      @click="emit('rowClick', row, index)"
    >
      <div
        v-for="col in columns"
        :key="col.key"
        :style="{
          width: col.width ? `${col.width}px` : (col.flex ? 'auto' : 'auto'),
          flex: col.flex ? '1' : 'none'
        }"
        :class="[
          'flex items-center h-full font-primary text-sm text-(--text-primary)',
          col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
        ]"
      >
        <slot :name="col.key" :row="row" :value="row[col.key]">
          {{ row[col.key] }}
        </slot>
      </div>
    </div>
  </div>
</template>
