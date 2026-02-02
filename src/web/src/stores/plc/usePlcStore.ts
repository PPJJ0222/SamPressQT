import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initPlcBridge, getPlcBridge } from '@/bridge/plc'
import { throttle } from '@/utils/throttle'
import { logger } from '@/utils/logger'
import { PLC_THROTTLE } from '@/constants/plc'
import { useSignalsStore } from './useSignalsStore'

export const usePlcStore = defineStore('plc', () => {
  const connected = ref(false)
  const polling = ref(false)
  const deviceData = ref<Record<number, number>>({})

  // 创建节流更新函数
  const throttledUpdate = throttle(
    (data: Record<number, number>) => {
      // 使用不可变模式更新数据
      deviceData.value = { ...deviceData.value, ...data }
      logger.debug('PLC 数据更新', data)
    },
    PLC_THROTTLE.DATA_UPDATE,
    { leading: true, trailing: true }
  )

  // 初始化连接
  async function init() {
    try {
      const bridge = await initPlcBridge()
      connected.value = bridge.isConnected ?? false
      polling.value = bridge.isPolling ?? false
      logger.info('PLC 桥接初始化完成', { connected: connected.value })

      // 连接状态变化信号
      if (bridge.connectionChanged && typeof bridge.connectionChanged.connect === 'function') {
        bridge.connectionChanged.connect((status) => {
          connected.value = status
          logger.info('PLC 连接状态变化', { connected: status })
        })
      }

      // 初始化信号 Store 监听
      const signalsStore = useSignalsStore()
      signalsStore.initListeners()
      await signalsStore.loadSignals()

    } catch (error) {
      logger.error('PLC 桥接初始化失败', error)
    }
  }

  // 读取数据
  async function readData(address: number, count: number) {
    const bridge = getPlcBridge()
    if (!bridge) return []
    return bridge.readData(address, count)
  }

  // 写入数据
  async function writeData(address: number, values: number[]) {
    const bridge = getPlcBridge()
    if (!bridge) return false
    return bridge.writeData(address, values)
  }

  // 订阅数据（使用节流）
  function subscribe(addresses: number[]) {
    const bridge = getPlcBridge()
    if (!bridge) {
      logger.warn('PLC 桥接未初始化，无法订阅')
      return
    }

    bridge.subscribe(addresses, (data) => {
      throttledUpdate(data)
    })
    logger.info('已订阅 PLC 地址', { addresses })
  }

  return {
    connected,
    polling,
    deviceData,
    init,
    readData,
    writeData,
    subscribe
  }
})
