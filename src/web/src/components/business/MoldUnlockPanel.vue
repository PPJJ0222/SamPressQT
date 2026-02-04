<script setup lang="ts">
/**
 * @file 模具解锁面板组件
 * @description 显示已锁定的模具列表，支持选择并解锁
 * @module components/business/MoldUnlockPanel
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMoldStore } from '@/stores/mold/useMoldStore'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import { useErpStore } from '@/stores/erp/useErpStore'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import type { LockedMoldInfo } from '@/types/mold'
import { logger } from '@/utils/logger'
import { getWorkTimeTypeLabel } from '@/constants/plc'

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
const erpStore = useErpStore()

const { lockedMolds, selectedUnlockMold, loading } = storeToRefs(moldStore)
const { jobSelection } = storeToRefs(deviceJobStore)
const { craftList, allUsers, allCrafts } = storeToRefs(erpStore)

/** 是否显示确认模态框 */
const showConfirmModal = ref(false)

/** 当前操作员用户名 */
const currentUserName = computed(() => {
  const personnelId = jobSelection.value.personnelId
  return personnelId ? String(personnelId) : ''
})

/** 是否有选中的模具 */
const hasSelection = computed(() => selectedUnlockMold.value !== null)

/** 状态提示文本 */
const statusText = computed(() => `已锁定 ${lockedMolds.value.length} 套模具`)

/**
 * 根据工艺编码获取工艺名称
 * @param craftCode - 工艺编码
 * @returns 工艺名称
 */
const getCraftName = (craftCode: string | undefined): string => {
  if (!craftCode) return '-'
  // 优先从全局工艺列表查找，确保能翻译所有工艺
  const craft = allCrafts.value.find((c) => c.craftCode === craftCode)
  if (craft?.craftName) return craft.craftName
  // 兜底：从产线工艺列表查找
  const plineCraft = craftList.value.find((c) => c.craftCode === craftCode)
  return plineCraft?.craftName || craftCode
}

/**
 * 根据用户名获取用户昵称
 * @param userName - 用户名（operator 字段）
 * @returns 用户昵称
 */
const getOperatorName = (userName: string | undefined): string => {
  if (!userName) return '-'
  const user = allUsers.value.find((u) => u.dictValue === userName)
  return user?.dictLabel || userName
}

/** 处理模具选择 */
const handleSelect = (mold: LockedMoldInfo) => {
  moldStore.selectUnlockMold(mold)
}

/** 打开确认模态框 */
const handleUnlockClick = () => {
  if (!selectedUnlockMold.value) {
    logger.warn('请先选择要解锁的模具')
    return
  }
  showConfirmModal.value = true
}

/** 取消确认 */
const handleCancelConfirm = () => {
  showConfirmModal.value = false
}

/** 确认解锁 */
const handleConfirm = async () => {
  if (!selectedUnlockMold.value) {
    return
  }

  showConfirmModal.value = false
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
          <div class="col-craft">{{ getCraftName(mold.craftCode) }}</div>
          <div class="col-time-type">{{ getWorkTimeTypeLabel(mold.mouldMakeOrderType) }}</div>
          <div class="col-start-time">{{ mold.startTime || '-' }}</div>
          <div class="col-operator">{{ getOperatorName(mold.operator) }}</div>
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
        @click="handleUnlockClick"
      >
        <!-- Loading 图标 -->
        <svg
          v-if="loading"
          class="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <span>确认解锁</span>
      </button>
      <button
        class="btn btn--secondary"
        @click="handleClose"
      >
        关闭
      </button>
    </div>

    <!-- 二次确认模态框 -->
    <ConfirmModal
      :visible="showConfirmModal"
      title="确认解锁"
      :message="`确定要解锁模具 ${selectedUnlockMold?.mouldCode || ''} 吗？`"
      confirm-text="确认解锁"
      cancel-text="取消"
      confirm-variant="destructive"
      :loading="loading"
      @confirm="handleConfirm"
      @cancel="handleCancelConfirm"
    />
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
  @apply flex items-center justify-center gap-2;
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
  @apply w-28 shrink-0;
}

.col-craft {
  @apply flex-1 min-w-24;
}

.col-time-type {
  @apply w-20 shrink-0;
}

.col-start-time {
  @apply w-40 shrink-0;
}

.col-operator {
  @apply w-20 shrink-0;
}
</style>
