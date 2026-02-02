<script setup lang="ts">
/**
 * @file 当前作业表格组件
 * @description 显示当前作业信息，支持编辑预计时长
 * @module components/business/CurrentJobTable
 */

import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Status } from '@/components/ui'
import { Numpad } from '@/components/business'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import type { ModbusPressJob } from '@/api/modules/job'

const emit = defineEmits<{
  /** 点击模具号触发解锁 */
  unlockMold: [mouldCode: string]
}>()

const deviceJobStore = useDeviceJobStore()
const { modbusPressJobList, modbusDeviceList } = storeToRefs(deviceJobStore)

/** 作业状态映射（与旧项目保持一致） */
const pressJobStatusMap: Record<string, { label: string; variant: 'running' | 'warning' | 'error' | 'stopped' }> = {
  '0': { label: '待加工', variant: 'stopped' },
  '1': { label: '加工中', variant: 'running' },
  '2': { label: '暂停', variant: 'warning' },
  '3': { label: '已完成', variant: 'stopped' }
}

/** 根据设备 ID 获取设备名称 */
const getDeviceName = (deviceId: string) => {
  const device = modbusDeviceList.value.find((d) => String(d.deviceId) === String(deviceId))
  return device?.deviceName || deviceId || '未锁定'
}

/** 数字键盘状态 */
const numpadState = ref({
  visible: false,
  targetDeviceId: null as string | null,
  currentValue: ''
})

/** 获取状态信息 */
const getStatusInfo = (status: string | undefined) => {
  return pressJobStatusMap[status || '0'] || pressJobStatusMap['0']
}

/** 点击预计时长输入框 */
const onDurationClick = (job: ModbusPressJob) => {
  numpadState.value = {
    visible: true,
    targetDeviceId: job.deviceId,
    currentValue: ''
  }
}

/** 数字键盘确认 */
const onNumpadConfirm = (value: string) => {
  if (numpadState.value.targetDeviceId) {
    const duration = parseFloat(value)
    if (!isNaN(duration) && duration > 0) {
      // TODO: 实现预计时长更新逻辑
      console.log('更新预计时长:', numpadState.value.targetDeviceId, duration)
    }
  }
  numpadState.value.visible = false
}

/** 关闭数字键盘 */
const onNumpadClose = () => {
  numpadState.value.visible = false
}

/**
 * 点击模具号触发解锁
 * @param mouldCode - 模具号
 */
const onMoldCodeClick = (mouldCode: string) => {
  if (mouldCode && mouldCode !== '未锁定') {
    emit('unlockMold', mouldCode)
  }
}
</script>

<template>
  <div class="glass-table">
    <!-- 表头 -->
    <div class="table-header">
      <div class="w-30 text-xs font-semibold text-(--text-tertiary)">压机</div>
      <div class="flex-1 text-xs font-semibold text-(--text-tertiary)">模具号</div>
      <div class="w-35 text-xs font-semibold text-(--text-tertiary)">预计时长(小时)</div>
      <div class="w-40 text-xs font-semibold text-(--text-tertiary)">开始时间</div>
      <div class="w-24 text-xs font-semibold text-(--text-tertiary)">当前状态</div>
    </div>

    <!-- 数据行 -->
    <div
      v-for="job in modbusPressJobList"
      :key="job.deviceId"
      class="table-row"
    >
      <div class="w-30 text-sm font-medium text-(--text-primary)">
        {{ getDeviceName(job.deviceId) }}
      </div>
      <div class="flex-1">
        <button
          v-if="job.mouldCode"
          class="mold-code-btn"
          @click="onMoldCodeClick(job.mouldCode)"
        >
          {{ job.mouldCode }}
        </button>
        <span v-else class="text-sm text-(--text-tertiary)">未锁定</span>
      </div>
      <div class="w-35">
        <button
          class="duration-input"
          @click="onDurationClick(job)"
        >
          点击输入
        </button>
      </div>
      <div class="w-40 text-sm text-(--text-primary)">
        {{ job.startTime || '-' }}
      </div>
      <div class="w-24">
        <Status
          :variant="getStatusInfo(job.status).variant"
          :label="getStatusInfo(job.status).label"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="modbusPressJobList.length === 0" class="table-empty">
      暂无当前作业
    </div>
  </div>

  <!-- 数字键盘弹窗 -->
  <Teleport to="body">
    <div
      v-if="numpadState.visible"
      class="numpad-overlay"
      @click.self="onNumpadClose"
    >
      <Numpad
        v-model="numpadState.currentValue"
        :allow-decimal="true"
        @confirm="onNumpadConfirm"
        @close="onNumpadClose"
      />
    </div>
  </Teleport>
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
  @apply flex items-center h-13 px-4;
  @apply border-t border-(--border-subtle);
  @apply active:opacity-80 active:scale-[0.98] transition-all duration-150;
}

.table-empty {
  @apply flex items-center justify-center h-20;
  @apply text-sm text-(--text-tertiary);
}

.duration-input {
  @apply px-3 py-2 rounded-lg w-25;
  @apply bg-(--bg-glass) border border-(--border-subtle);
  @apply text-sm text-(--text-primary) text-center;
  @apply min-w-11 min-h-11;
  @apply active:opacity-80 active:scale-[0.98] transition-all duration-150;
}

.numpad-overlay {
  @apply fixed inset-0 z-50;
  @apply flex items-center justify-center;
  @apply bg-black/30;
  backdrop-filter: blur(4px);
}

.mold-code-btn {
  @apply px-3 py-1.5 rounded-lg;
  @apply text-sm font-medium text-blue-600;
  @apply bg-blue-50 border border-blue-200;
  @apply min-h-9;
  @apply active:opacity-80 active:scale-[0.98] transition-all duration-150;
  @apply hover:bg-blue-100;
}
</style>
