/**
 * @file 日志页面
 * @description 展示 pocoPress 生成的日志文件，支持日期筛选和级别过滤
 * @module views/Logs
 */
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLogStore } from '@/stores/log/useLogStore'
import { Badge } from '@/components/ui'
import type { LogFilterLevel } from '@/types/log'

// ========== Store 初始化 ==========
const logStore = useLogStore()
const {
  filteredEntries,
  availableDates,
  selectedDate,
  filterLevel,
  levelCounts,
  loading,
  entries
} = storeToRefs(logStore)

// ========== 日期标签 ==========
/** 获取日期的友好显示名称 */
function getDateLabel(date: string): string {
  const today = new Date()
  const targetDate = new Date(date)
  const diffDays = Math.floor(
    (today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays === 2) return '前天'
  return date
}

// ========== 级别配置 ==========
interface LevelConfig {
  key: LogFilterLevel
  label: string
  variant: 'info' | 'warning' | 'error' | 'success'
}

const levelConfigs: LevelConfig[] = [
  { key: 'all', label: '全部', variant: 'info' },
  { key: 'info', label: 'INFO', variant: 'info' },
  { key: 'warn', label: 'WARN', variant: 'warning' },
  { key: 'error', label: 'ERROR', variant: 'error' },
  { key: 'debug', label: 'DEBUG', variant: 'info' },
  { key: 'success', label: 'SUCCESS', variant: 'success' },
]

// ========== 展开状态 ==========
const expandedIndex = ref<number | null>(null)

function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

// ========== 格式化方法 ==========
/** 格式化时间戳为时分秒 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/** 获取级别对应的样式类 */
function getLevelClass(level: string): string {
  const classes: Record<string, string> = {
    info: 'bg-(--blue-light) text-(--blue-link)',
    warn: 'bg-(--amber-light) text-(--amber-warning)',
    error: 'bg-(--red-light) text-(--red-error)',
    debug: 'bg-(--purple-light) text-(--purple-accent)',
    success: 'bg-(--green-light) text-(--green-primary)',
  }
  return classes[level] || classes.info
}

// ========== 生命周期 ==========
onMounted(async () => {
  await logStore.loadLogFiles(3)
  if (availableDates.value.length > 0) {
    await logStore.loadLogsByDate(availableDates.value[0])
  }
})

// 监听日期变化
watch(selectedDate, async (newDate) => {
  if (newDate) {
    expandedIndex.value = null
    await logStore.loadLogsByDate(newDate)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <!-- 日期选择器 -->
    <div class="flex items-center gap-2">
      <button
        v-for="date in availableDates"
        :key="date"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-medium transition-all touch-target touch-interactive',
          selectedDate === date
            ? 'bg-(--green-primary) text-white'
            : 'bg-(--bg-glass) glass-effect border border-(--border-subtle) text-(--text-primary)'
        ]"
        @click="selectedDate = date"
      >
        {{ getDateLabel(date) }}
      </button>
    </div>

    <!-- 级别筛选 -->
    <div class="flex items-center gap-2">
      <button
        v-for="config in levelConfigs"
        :key="config.key"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-interactive',
          filterLevel === config.key
            ? 'ring-2 ring-(--green-primary) ring-offset-1'
            : 'opacity-70'
        ]"
        :style="{
          backgroundColor: filterLevel === config.key ? undefined : 'var(--bg-surface)'
        }"
        @click="logStore.setFilterLevel(config.key)"
      >
        <Badge :variant="config.variant" :label="config.label" />
        <span
          v-if="config.key !== 'all'"
          class="ml-1 text-(--text-secondary)"
        >
          ({{ levelCounts[config.key as keyof typeof levelCounts] || 0 }})
        </span>
        <span
          v-else
          class="ml-1 text-(--text-secondary)"
        >
          ({{ entries.length }})
        </span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <span class="text-(--text-secondary)">加载日志中...</span>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="filteredEntries.length === 0"
      class="flex flex-col items-center justify-center py-12 text-(--text-tertiary)"
    >
      <svg class="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span class="text-sm">暂无日志记录</span>
    </div>

    <!-- 日志列表 -->
    <div
      v-else
      class="flex-1 overflow-y-auto rounded-xl bg-(--bg-glass) glass-effect border border-(--border-subtle)"
    >
      <!-- 表头 -->
      <div class="flex items-center h-10 px-4 bg-(--bg-surface) border-b border-(--border-subtle) sticky top-0">
        <div class="w-20 text-xs font-medium text-(--text-secondary)">时间</div>
        <div class="w-20 text-xs font-medium text-(--text-secondary)">级别</div>
        <div class="flex-1 text-xs font-medium text-(--text-secondary)">消息</div>
      </div>

      <!-- 日志行 -->
      <div
        v-for="(entry, index) in filteredEntries"
        :key="index"
        class="border-b border-(--border-subtle) last:border-b-0"
      >
        <div
          class="flex items-center min-h-12 px-4 touch-interactive cursor-pointer"
          @click="toggleExpand(index)"
        >
          <div class="w-20 font-mono text-sm text-(--text-secondary)">
            {{ formatTime(entry.timestamp) }}
          </div>
          <div class="w-20">
            <span
              :class="[
                'inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium',
                getLevelClass(entry.level)
              ]"
            >
              {{ entry.level.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 text-sm text-(--text-primary) truncate">
            {{ entry.message }}
          </div>
          <div class="w-6 flex items-center justify-center">
            <svg
              :class="[
                'w-4 h-4 text-(--text-tertiary) transition-transform',
                expandedIndex === index ? 'rotate-180' : ''
              ]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- 展开详情 -->
        <div
          v-if="expandedIndex === index"
          class="px-4 py-3 bg-(--bg-surface) border-t border-(--border-subtle)"
        >
          <div class="text-xs text-(--text-secondary) mb-2">完整时间戳</div>
          <div class="font-mono text-sm text-(--text-primary) mb-3">
            {{ entry.timestamp }}
          </div>
          <div class="text-xs text-(--text-secondary) mb-2">完整消息</div>
          <div class="font-mono text-sm text-(--text-primary) whitespace-pre-wrap break-all">
            {{ entry.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
