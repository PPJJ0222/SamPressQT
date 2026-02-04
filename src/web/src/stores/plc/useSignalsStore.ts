/**
 * @file 信号配置 Store
 * @description 管理 PLC 信号配置和实时数据
 * @module stores/plc/useSignalsStore
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPlcBridge } from '@/bridge/plc'
import type { ModbusSignal, SignalValuesMap } from '@/types/plc'
import { logger } from '@/utils/logger'
import { MES_COMMUNICATION } from '@/constants/plc'

export const useSignalsStore = defineStore('signals', () => {
  // ========== 状态 ==========
  /** 信号配置列表 */
  const signals = ref<Partial<ModbusSignal>[]>([])
  /** 信号值缓存 */
  const values = ref<SignalValuesMap>({})
  /** 加载状态 */
  const loading = ref(false)
  /** 轮询状态 */
  const polling = ref(false)

  // ========== 计算属性 ==========
  /** 按参数组别分组的信号 */
  const signalsByGroup = computed(() => {
    const groups: Record<string, Partial<ModbusSignal>[]> = {}
    for (const signal of signals.value) {
      const group = signal.paramGroup || 'default'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(signal)
    }
    return groups
  })

  /** 活跃信号数量 */
  const activeCount = computed(() =>
    signals.value.filter(s => s.isActive).length
  )

  // ========== 方法 ==========
  /**
   * 加载信号配置
   * @description 使用 Qt WebChannel 兼容的回调方式调用 C++ 方法
   */
  function loadSignals() {
    const bridge = getPlcBridge()
    if (!bridge) {
      logger.warn('PlcBridge 未初始化')
      return
    }

    // 调试：打印 bridge 对象的实际结构
    logger.info('PlcBridge 对象结构', {
      type: typeof bridge,
      keys: Object.keys(bridge),
      getSignalsType: typeof bridge.getSignals,
      prototype: Object.getPrototypeOf(bridge)
        ? Object.keys(Object.getPrototypeOf(bridge))
        : []
    })

    // 检查 getSignals 方法是否存在
    if (!bridge.getSignals || typeof bridge.getSignals !== 'function') {
      logger.warn('PlcBridge.getSignals 方法不可用')
      return
    }

    loading.value = true

    // Qt WebChannel 中 C++ 方法调用需要传递回调函数获取返回值
    try {
      const result = bridge.getSignals() as unknown

      // 处理返回值（可能是 Promise 或直接值）
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        // Promise 风格
        (result as Promise<Partial<ModbusSignal>[]>)
          .then((data) => {
            signals.value = data || []
            logger.info(`已加载 ${signals.value.length} 个信号配置`)
          })
          .catch((error: unknown) => {
            logger.error('加载信号配置失败', error)
          })
          .finally(() => {
            loading.value = false
          })
      } else {
        // 同步返回值
        signals.value = (result as Partial<ModbusSignal>[]) || []
        logger.info(`已加载 ${signals.value.length} 个信号配置`)
        loading.value = false
      }
    } catch (error) {
      logger.error('加载信号配置失败', error)
      loading.value = false
    }
  }

  /** 刷新信号配置 */
  function refreshSignals() {
    const bridge = getPlcBridge()
    if (bridge) {
      bridge.refreshSignals()
    }
  }

  /** 获取信号值 */
  function getValue(signalCode: string) {
    return values.value[signalCode]
  }

  /** 更新信号值 */
  function updateValues(newValues: SignalValuesMap) {
    values.value = { ...values.value, ...newValues }
  }

  /** 启动轮询 */
  function startPolling(intervalMs = 100) {
    const bridge = getPlcBridge()
    if (bridge) {
      bridge.startPolling(intervalMs)
      polling.value = true
    }
  }

  /** 停止轮询 */
  function stopPolling() {
    const bridge = getPlcBridge()
    if (bridge) {
      bridge.stopPolling()
      polling.value = false
    }
  }

  /** 初始化信号监听 */
  function initListeners() {
    const bridge = getPlcBridge()
    if (!bridge) return

    // 信号值变化监听（添加安全检查）
    if (bridge.signalValuesChanged && typeof bridge.signalValuesChanged.connect === 'function') {
      bridge.signalValuesChanged.connect((newValues) => {
        updateValues(newValues)
      })
    }

    // 信号配置变化监听（添加安全检查）
    if (bridge.signalsConfigChanged && typeof bridge.signalsConfigChanged.connect === 'function') {
      bridge.signalsConfigChanged.connect(() => {
        loadSignals()
      })
    }

    // 轮询状态变化监听（添加安全检查）
    if (bridge.pollingChanged && typeof bridge.pollingChanged.connect === 'function') {
      bridge.pollingChanged.connect((isPolling) => {
        polling.value = isPolling
      })
    }
  }

  /**
   * 根据信号名称查找信号编码
   * @param signalName - 信号名称
   * @returns 信号编码，未找到返回 null
   */
  function findSignalCodeByName(signalName: string): string | null {
    const signal = signals.value.find(s => s.signalName === signalName)
    if (!signal?.signalCode) {
      logger.warn(`未找到信号: ${signalName}`)
      return null
    }
    return signal.signalCode
  }

  /**
   * 延迟函数
   * @param ms - 延迟毫秒数
   */
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 发送 MES 通信状态信号
   * @description 根据信号名称查找编码并下发 true 值，支持自动重试
   * @returns 发送结果对象
   */
  async function sendMesCommunicationStatus(): Promise<{
    success: boolean
    message: string
    retryCount?: number
  }> {
    const bridge = getPlcBridge()
    if (!bridge) {
      return { success: false, message: 'PLC 桥接未初始化' }
    }

    // 查找 MES 通信状态信号编码
    const signalCode = findSignalCodeByName(MES_COMMUNICATION.SIGNAL_NAME)
    if (!signalCode) {
      return {
        success: false,
        message: `未找到信号配置: ${MES_COMMUNICATION.SIGNAL_NAME}`
      }
    }

    // 带重试的发送逻辑
    let lastError: unknown = null
    for (let attempt = 1; attempt <= MES_COMMUNICATION.MAX_RETRY; attempt++) {
      try {
        logger.info(`发送 MES 通信状态信号 (第 ${attempt} 次)`, { signalCode })
        const result = await bridge.writeBySignalCode(
          signalCode,
          MES_COMMUNICATION.CONNECTED_VALUE
        )

        if (result) {
          logger.success('MES 通信状态信号发送成功')
          return {
            success: true,
            message: 'MES 通信状态信号发送成功',
            retryCount: attempt - 1
          }
        }

        lastError = new Error('写入返回 false')
      } catch (error) {
        lastError = error
        logger.warn(`MES 通信状态信号发送失败 (第 ${attempt} 次)`, error)
      }

      // 非最后一次尝试时等待后重试
      if (attempt < MES_COMMUNICATION.MAX_RETRY) {
        await delay(MES_COMMUNICATION.RETRY_DELAY)
      }
    }

    // 所有重试都失败
    logger.error('MES 通信状态信号发送失败，已达最大重试次数', lastError)
    return {
      success: false,
      message: `MES 通信状态信号发送失败，已重试 ${MES_COMMUNICATION.MAX_RETRY} 次`,
      retryCount: MES_COMMUNICATION.MAX_RETRY
    }
  }

  /**
   * 读取单个信号值
   * @param signalCode - 信号编码
   * @returns 信号值，失败返回 null
   */
  async function readSingleSignal(
    signalCode: string
  ): Promise<number | boolean | string | null> {
    const bridge = getPlcBridge()
    if (!bridge) {
      logger.warn('PlcBridge 未初始化，无法读取信号')
      return null
    }

    try {
      const value = await bridge.readBySignalCode(signalCode)
      logger.info(`读取信号 ${signalCode} 成功`, { value })
      return value
    } catch (error) {
      logger.error(`读取信号 ${signalCode} 失败`, error)
      return null
    }
  }

  /**
   * 写入单个信号值
   * @param signalCode - 信号编码
   * @param value - 要写入的值
   * @returns 是否写入成功
   */
  async function writeSingleSignal(
    signalCode: string,
    value: number | boolean | string
  ): Promise<boolean> {
    const bridge = getPlcBridge()
    if (!bridge) {
      logger.warn('PlcBridge 未初始化，无法写入信号')
      return false
    }

    try {
      const result = await bridge.writeBySignalCode(signalCode, value)
      if (result) {
        logger.info(`写入信号 ${signalCode} 成功`, { value })
      } else {
        logger.warn(`写入信号 ${signalCode} 返回 false`)
      }
      return result
    } catch (error) {
      logger.error(`写入信号 ${signalCode} 失败`, error)
      return false
    }
  }

  return {
    // 状态
    signals,
    values,
    loading,
    polling,
    // 计算属性
    signalsByGroup,
    activeCount,
    // 方法
    loadSignals,
    refreshSignals,
    getValue,
    updateValues,
    startPolling,
    stopPolling,
    initListeners,
    findSignalCodeByName,
    sendMesCommunicationStatus,
    readSingleSignal,
    writeSingleSignal,
  }
})
