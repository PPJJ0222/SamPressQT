<script setup lang="ts">
/**
 * @file 设备参数区域组件
 * @description 展示设备 PLC 信号参数的 4×4 网格布局，支持 10 秒定时轮询
 * @module components/business/DeviceParamsSection
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignalsStore } from '@/stores/plc/useSignalsStore'
import { DEVICE_PARAMS } from '@/constants/plc'
import { logger } from '@/utils/logger'
import ParamCard from './ParamCard.vue'

const signalsStore = useSignalsStore()
const { signals, values, loading, polling } = storeToRefs(signalsStore)

/** 轮询定时器 ID */
const pollTimerId = ref<number | null>(null)

/**
 * 筛选展示的信号列表
 * 只展示活跃信号，最多 16 个
 */
const displaySignals = computed(() => {
  const activeSignals = signals.value.filter(s => s.isActive !== false)
  return activeSignals.slice(0, DEVICE_PARAMS.MAX_CARD_COUNT)
})

/** 是否有可展示的信号 */
const hasSignals = computed(() => displaySignals.value.length > 0)

/**
 * 获取信号的实时值
 * @param signalCode - 信号编码
 */
function getSignalValue(signalCode?: string) {
  if (!signalCode) return undefined
  return values.value[signalCode]
}

/** 启动参数轮询 */
function startParamPolling() {
  if (pollTimerId.value) return

  logger.info('启动设备参数轮询', { interval: DEVICE_PARAMS.POLL_INTERVAL })
  signalsStore.startPolling(DEVICE_PARAMS.POLL_INTERVAL)

  pollTimerId.value = window.setInterval(() => {
    signalsStore.refreshSignals()
  }, DEVICE_PARAMS.POLL_INTERVAL)
}

/** 停止参数轮询 */
function stopParamPolling() {
  if (pollTimerId.value) {
    clearInterval(pollTimerId.value)
    pollTimerId.value = null
  }
  signalsStore.stopPolling()
  logger.info('停止设备参数轮询')
}

onMounted(() => {
  logger.info('设备参数区域初始化')
  signalsStore.loadSignals()
  signalsStore.initListeners()
  startParamPolling()
})

onUnmounted(() => {
  stopParamPolling()
})
</script>

<template>
  <section class="flex flex-col gap-4">
    <!-- 区域标题与状态指示 -->
    <div class="flex items-center gap-3">
      <h2 class="text-base font-semibold text-(--text-primary)">
        设备参数信息
      </h2>
      <!-- 实时更新状态指示 -->
      <div v-if="polling" class="flex items-center gap-1.5 text-xs text-(--text-tertiary)">
        <span class="w-2 h-2 rounded-full bg-(--green-primary) animate-pulse" />
        <span>实时更新中</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !hasSignals" class="flex items-center justify-center py-8">
      <span class="text-sm text-(--text-tertiary)">加载参数配置中...</span>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="!hasSignals"
      class="flex items-center justify-center py-8 rounded-xl bg-(--bg-glass)"
    >
      <span class="text-sm text-(--text-tertiary)">暂无参数配置</span>
    </div>

    <!-- 参数卡片网格 -->
    <div
      v-else
      class="grid grid-cols-4 gap-3"
    >
      <ParamCard
        v-for="signal in displaySignals"
        :key="signal.signalCode"
        :name="signal.signalName || signal.signalCode || '未知参数'"
        :value="getSignalValue(signal.signalCode)"
        :unit="signal.unit"
        :loading="loading"
      />
    </div>
  </section>
</template>
