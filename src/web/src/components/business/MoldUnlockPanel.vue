<script setup lang="ts">
/**
 * @file 模具解锁面板组件
 * @description 显示已锁定的模具列表，支持选择并解锁
 * @module components/business/MoldUnlockPanel
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMoldStore } from '@/stores/mold/useMoldStore'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import type { LockedMoldInfo } from '@/types/mold'
import { logger } from '@/utils/logger'

interface Props {
  /** 设备 ID */
  deviceId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const moldStore = useMoldStore()
const deviceJobStore = useDeviceJobStore()

const { lockedMolds, selectedUnlockMold, loading } = storeToRefs(moldStore)
const { jobSelection } = storeToRefs(deviceJobStore)

/** 当前操作员用户名 */
const currentUserName = computed(() => {
  const personnelId = jobSelection.value.personnelId
  return personnelId ? String(personnelId) : ''
})

/** 是否有选中的模具 */
const hasSelection = computed(() => selectedUnlockMold.value !== null)

/** 状态提示文本 */
const statusText = computed(() => `已锁定 ${lockedMolds.value.length} 套模具`)

/** 处理模具选择 */
const handleSelect = (mold: LockedMoldInfo) => {
  moldStore.selectUnlockMold(mold)
}

/** 确认解锁 */
const handleConfirm = async () => {
  if (!selectedUnlockMold.value) {
    logger.warn('请先选择要解锁的模具')
    return
  }

  const success = await moldStore.cancelLock(
    selectedUnlockMold.value.mouldCode,
    currentUserName.value,
    props.deviceId
  )

  if (success) {
    // 刷新压机作业信息
    deviceJobStore.fetchPressJobByIp()
    emit('success')
  }
}

/** 关闭面板 */
const handleClose = () => {
  moldStore.closeUnlockPanel()
  emit('close')
}
</script>

<template>
  <div class="unlock-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">解锁模具</h3>
      <span class="panel-status">{{ statusText }}</span>
    </div>

    <!-- 模具表格 -->
    <div class="table-container">
      <div class="glass-table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="col-index">序号</div>
          <div class="col-mold-code">模具号</div>
          <div class="col-stages">工序号</div>
          <div class="col-order">制造令号</div>
          <div class="col-craft">工艺名称</div>
          <div class="col-time-type">工时类型</div>
          <div class="col-start-time">开始时间</div>
          <div class="col-operator">作业员</div>
        </div>

        <!-- 数据行 -->
        <div
          v-for="(mold, index) in lockedMolds"
          :key="mold.mouldCode"
          class="table-row"
          :class="{ 'table-row--selected': selectedUnlockMold?.mouldCode === mold.mouldCode }"
          @click="handleSelect(mold)"
        >
          <div class="col-index">{{ index + 1 }}</div>
          <div class="col-mold-code font-medium">{{ mold.mouldCode }}</div>
          <div class="col-stages">{{ mold.stages || '-' }}</div>
          <div class="col-order">{{ mold.makeOrderNumber || '-' }}</div>
          <div class="col-craft">{{ mold.craftName || '-' }}</div>
          <div class="col-time-type">{{ mold.workTimeType || '-' }}</div>
          <div class="col-start-time">{{ mold.startTime || '-' }}</div>
          <div class="col-operator">{{ mold.operator || '-' }}</div>
        </div>

        <!-- 空状态 -->
        <div v-if="lockedMolds.length === 0" class="table-empty">
          暂无已锁定的模具
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions">
      <button
        class="btn btn--primary"
        :disabled="!hasSelection || loading"
        @click="handleConfirm"
      >
        确认解锁
      </button>
      <button
        class="btn btn--secondary"
        @click="handleClose"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "../../styles/tailwind.css";

.unlock-panel {
  @apply flex flex-col flex-1 min-h-0 gap-4 p-4 rounded-2xl;
  @apply bg-(--bg-card) border border-(--border-subtle) overflow-hidden;
}

.panel-header {
  @apply flex items-center justify-between;
}

.panel-title {
  @apply text-base font-medium text-(--text-primary);
}

.panel-status {
  @apply text-sm text-(--text-secondary);
}

.table-container {
  @apply overflow-x-auto;
}

.glass-table {
  @apply rounded-xl overflow-hidden;
  @apply border border-(--border-subtle);
  @apply shadow-[0_2px_8px_rgba(0,0,0,0.03)];
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  min-width: 800px;
}

.table-header {
  @apply flex items-center h-11 px-3;
  @apply bg-(--bg-surface);
  @apply text-xs font-semibold text-(--text-tertiary);
}

.table-row {
  @apply flex items-center h-13 px-3;
  @apply border-t border-(--border-subtle);
  @apply text-sm text-(--text-primary);
  @apply cursor-pointer transition-all duration-150;
  @apply active:opacity-80;
}

.table-row--selected {
  @apply bg-blue-50/50 border-l-4 border-l-blue-500;
}

.table-empty {
  @apply flex items-center justify-center h-20;
  @apply text-sm text-(--text-tertiary);
}

.panel-actions {
  @apply flex items-center gap-3 justify-end;
}

.btn {
  @apply h-12 px-6 rounded-xl;
  @apply text-sm font-medium;
  @apply min-w-12 min-h-12;
  @apply transition-all duration-150;
  @apply active:opacity-80 active:scale-[0.98];
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn--primary {
  @apply bg-linear-to-r from-blue-500 to-blue-600 text-white;
}

.btn--secondary {
  @apply bg-(--bg-surface) border border-(--border-subtle) text-(--text-secondary);
}

/* 列宽定义 */
.col-index {
  @apply w-12 text-center shrink-0;
}

.col-mold-code {
  @apply w-28 shrink-0;
}

.col-stages {
  @apply w-20 shrink-0;
}

.col-order {
  @apply flex-1 min-w-28;
}

.col-craft {
  @apply w-24 shrink-0;
}

.col-time-type {
  @apply w-20 shrink-0;
}

.col-start-time {
  @apply w-36 shrink-0;
}

.col-operator {
  @apply w-20 shrink-0;
}
</style>
