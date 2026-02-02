<script setup lang="ts">
/**
 * @file 近期作业表格组件
 * @description 显示近期作业历史记录
 * @module components/business/RecentJobTable
 */

import { storeToRefs } from 'pinia'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'

const deviceJobStore = useDeviceJobStore()
const { recentJobs } = storeToRefs(deviceJobStore)
</script>

<template>
  <div class="glass-table">
    <!-- 表头 -->
    <div class="table-header">
      <div class="w-15 text-xs font-semibold text-(--text-tertiary)">序号</div>
      <div class="w-30 text-xs font-semibold text-(--text-tertiary)">压机</div>
      <div class="w-35 text-xs font-semibold text-(--text-tertiary)">模具号</div>
      <div class="w-40 text-xs font-semibold text-(--text-tertiary)">开始时间</div>
      <div class="w-40 text-xs font-semibold text-(--text-tertiary)">完成时间</div>
      <div class="flex-1 text-xs font-semibold text-(--text-tertiary)">作业时长</div>
    </div>

    <!-- 数据行 -->
    <div
      v-for="job in recentJobs"
      :key="job.id"
      class="table-row"
    >
      <div class="w-15 text-sm text-(--text-primary)">{{ job.index }}</div>
      <div class="w-30 text-sm font-medium text-(--text-primary)">{{ job.pressName }}</div>
      <div class="w-35 text-sm text-(--text-primary)">{{ job.moldNo }}</div>
      <div class="w-40 text-sm text-(--text-primary)">{{ job.startTime }}</div>
      <div class="w-40 text-sm text-(--text-primary)">{{ job.endTime }}</div>
      <div class="flex-1 text-sm text-(--text-primary)">{{ job.duration }}</div>
    </div>

    <!-- 空状态 -->
    <div v-if="recentJobs.length === 0" class="table-empty">
      暂无近期作业记录
    </div>
  </div>
</template>

<style scoped>
@reference "../../styles/tailwind.css";

.glass-table {
  @apply rounded-xl overflow-hidden;
  @apply border border-(--border-subtle);
  @apply shadow-[0_2px_8px_rgba(0,0,0,0.03)];
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
}

.table-header {
  @apply flex items-center h-11 px-4;
  @apply bg-(--bg-surface);
}

.table-row {
  @apply flex items-center h-12 px-4;
  @apply border-t border-(--border-subtle);
}

.table-empty {
  @apply flex items-center justify-center h-20;
  @apply text-sm text-(--text-tertiary);
}
</style>
