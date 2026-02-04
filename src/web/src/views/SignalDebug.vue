/**
 * @file 信号调试页面
 * @description PLC 信号配置查看与调试，支持信号值读取和写入，固定十六进制显示
 * @module views/SignalDebug
 */
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignalsStore } from '@/stores/plc/useSignalsStore'
import { Table } from '@/components/ui'
import type { SignalDebugRow } from '@/types/plc'
import { logger } from '@/utils/logger'

// ========== Store 初始化 ==========
const signalsStore = useSignalsStore()
const { signals, loading } = storeToRefs(signalsStore)

// ========== 状态定义 ==========
/** 信号值缓存，key 为 signalCode */
const signalValues = ref<Record<string, number | boolean | string | null>>({})

/** 单个信号的加载状态 */
const loadingStates = ref<Record<string, boolean>>({})

// ========== 表格列配置 ==========
const columns = [
  { key: 'signalCode', label: '信号编码', width: 100 },
  { key: 'signalName', label: '信号名称', flex: true },
  { key: 'registerCount', label: '寄存器数量', width: 90, align: 'center' as const },
  { key: 'scaleFactor', label: '比例因子', width: 80, align: 'center' as const },
  { key: 'offsetValue', label: '偏移量', width: 70, align: 'center' as const },
  { key: 'unit', label: '单位', width: 60, align: 'center' as const },
  { key: 'finalVal', label: '信号值', width: 120, align: 'right' as const },
  { key: 'actions', label: '操作', width: 80, align: 'center' as const }
]

// ========== 计算属性 ==========
/** 表格数据：合并信号配置和当前值 */
const tableData = computed<SignalDebugRow[]>(() => {
  return signals.value.map(signal => ({
    ...signal,
    finalVal: signalValues.value[signal.signalCode || ''] ?? null,
    loading: loadingStates.value[signal.signalCode || ''] ?? false
  })) as SignalDebugRow[]
})

// ========== 方法 ==========
/**
 * 格式化信号值显示
 * @description 整数显示为十六进制（不带 0x 前缀），浮点数显示十进制
 * @param value - 原始值
 * @returns 格式化后的字符串
 */
function formatValue(value: number | boolean | string | null): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    const isInteger = Number.isInteger(value)
    if (isInteger) {
      // 整数：显示十六进制，不带 0x 前缀，0 就显示 0
      return (value >>> 0).toString(16).toUpperCase()
    }
    // 浮点数：显示十进制
    return value.toFixed(4).replace(/\.?0+$/, '')
  }
  return String(value)
}

/**
 * 读取单个信号值
 * @param signalCode - 信号编码
 */
async function handleRead(signalCode: string) {
  if (!signalCode) return

  loadingStates.value = { ...loadingStates.value, [signalCode]: true }

  try {
    const value = await signalsStore.readSingleSignal(signalCode)
    signalValues.value = { ...signalValues.value, [signalCode]: value }
  } catch (error) {
    logger.error(`读取信号 ${signalCode} 失败`, error)
  } finally {
    loadingStates.value = { ...loadingStates.value, [signalCode]: false }
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  signalsStore.loadSignals()
})
</script>

<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <span class="text-(--text-secondary)">加载信号配置中...</span>
    </div>

    <!-- 信号表格 -->
    <Table
      v-else
      :columns="columns"
      :data="tableData"
    >
      <!-- 信号值列 -->
      <template #finalVal="{ row }">
        <span class="font-mono text-sm">
          {{ formatValue(row.finalVal) }}
        </span>
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <button
          class="px-2 py-1 text-xs rounded-lg bg-(--bg-glass) border border-(--border-subtle) text-(--text-primary) touch-interactive disabled:opacity-50"
          :disabled="row.loading"
          @click="handleRead(row.signalCode)"
        >
          读取
        </button>
      </template>
    </Table>
  </div>
</template>
