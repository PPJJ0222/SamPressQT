<script setup lang="ts">
/**
 * @file 功能按钮区域组件
 * @description 包含6个操作按钮和状态标签，集成模具锁定面板
 * @module components/business/ActionButtonsSection
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Button, Status } from '@/components/ui'
import MoldLockPanel from './MoldLockPanel.vue'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import { usePlcStore } from '@/stores/plc/usePlcStore'
import { useMoldStore } from '@/stores/mold/useMoldStore'
import { logger } from '@/utils/logger'
import { DeviceOperationStatus } from '@/types/device'

const deviceJobStore = useDeviceJobStore()
const plcStore = usePlcStore()
const moldStore = useMoldStore()

const { operationStatus, statusLabel } = storeToRefs(deviceJobStore)
const { actionLoading } = storeToRefs(deviceJobStore)
const { connected } = storeToRefs(plcStore)
const { panelVisible } = storeToRefs(moldStore)

/** 按钮行元素引用 */
const buttonRowRef = ref<HTMLElement | null>(null)

/** 面板顶部位置（按钮行底部 + 间距） */
const panelTop = ref(0)

/** 更新面板位置 */
const updatePanelPosition = () => {
  if (buttonRowRef.value) {
    const rect = buttonRowRef.value.getBoundingClientRect()
    panelTop.value = rect.bottom + 16 // 16px 间距
  }
}

onMounted(() => {
  updatePanelPosition()
  window.addEventListener('resize', updatePanelPosition)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePanelPosition)
})

/** 模具锁定面板是否显示 */
const showMoldPanel = computed(() => panelVisible.value)

/** 当前设备 ID（从压机作业信息中获取真实设备 ID） */
const currentDeviceId = computed(() => deviceJobStore.currentDeviceId)

/** 当前操作员用户名 */
const currentUserName = computed(() => {
  const personnelId = deviceJobStore.jobSelection.personnelId
  return personnelId ? String(personnelId) : ''
})

/** 状态到 Status 组件 variant 的映射 */
const statusVariant = computed(() => {
  switch (operationStatus.value) {
    case DeviceOperationStatus.PROCESSING:
      return 'running'
    case DeviceOperationStatus.ERROR:
      return 'error'
    case DeviceOperationStatus.IDLE:
    case DeviceOperationStatus.COMPLETED:
      return 'stopped'
    default:
      return 'warning'
  }
})

/** 按钮禁用状态计算 */
const btnDisabled = computed(() => ({
  connect: false, // 建立通信按钮始终可用，用于重新下发 MES 通信状态信号
  lock: false, // 不禁用，改为点击时提前校验
  start: operationStatus.value !== DeviceOperationStatus.CONNECTED,
  complete: operationStatus.value !== DeviceOperationStatus.PROCESSING,
  moveIn: !connected.value,
  moveOut: !connected.value
}))

/** 按钮点击处理 */
const handleConnect = () => deviceJobStore.establishConnection()

/** 打开模具锁定面板 */
const handleLock = async () => {
  // 提前校验：班组、人员、预选工艺是否已选择
  const validation = deviceJobStore.validateJobSelection()
  if (!validation.valid) {
    logger.warn(validation.message || '请完成作业选择')
    return
  }

  moldStore.openPanel()

  // 加载已锁定的模具列表，用于跨项目校验
  if (currentDeviceId.value) {
    await moldStore.fetchLockedMolds(currentDeviceId.value)
  }
}

/** 关闭模具锁定面板 */
const handleCloseMoldPanel = () => {
  moldStore.closePanel()
}

/** 模具锁定成功回调 */
const handleMoldLockSuccess = () => {
  // 关闭锁定面板
  moldStore.closePanel()
  // 刷新压机作业信息
  deviceJobStore.fetchPressJobByIp()
}

const handleStart = () => deviceJobStore.startProcessing()
const handleComplete = () => deviceJobStore.completeProcessing()
const handleMoveIn = () => deviceJobStore.moveIn()
const handleMoveOut = () => deviceJobStore.moveOut()
</script>

<template>
  <div>
    <!-- 按钮行 -->
    <div ref="buttonRowRef" class="flex items-center justify-between">
      <!-- 操作按钮组 -->
      <div class="flex items-center gap-3">
        <Button variant="primary" :disabled="btnDisabled.connect" :loading="actionLoading.connect" @click="handleConnect">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
          <span>建立通信</span>
        </Button>

        <Button :variant="showMoldPanel ? 'primary' : 'secondary'" :disabled="btnDisabled.lock" @click="handleLock">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>锁定模具</span>
        </Button>

        <Button variant="primary" :disabled="btnDisabled.start" :loading="actionLoading.start" @click="handleStart">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>开始加工</span>
        </Button>

        <Button variant="primary" :disabled="btnDisabled.complete" :loading="actionLoading.complete" @click="handleComplete">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>完成加工</span>
        </Button>

        <Button variant="secondary" :disabled="btnDisabled.moveIn" :loading="actionLoading.moveIn" @click="handleMoveIn">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <span>移入</span>
        </Button>

        <Button variant="secondary" :disabled="btnDisabled.moveOut" :loading="actionLoading.moveOut" @click="handleMoveOut">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <span>移出</span>
        </Button>
      </div>

      <!-- 状态标签 -->
      <Status :variant="statusVariant" :label="statusLabel" />
    </div>

    <!-- 模具锁定面板（fixed 定位遮盖，扩展到页面底部） -->
    <Transition name="slide-panel">
      <div
        v-if="showMoldPanel"
        class="fixed left-6 right-6 bottom-6 z-10"
        :style="{ top: `${panelTop}px` }"
      >
        <MoldLockPanel
          :device-id="currentDeviceId"
          :user-name="currentUserName"
          class="h-full"
          @close="handleCloseMoldPanel"
          @success="handleMoldLockSuccess"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 面板滑动展开动画 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease-out;
}

.slide-panel-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-panel-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
