/**
 * @file PLC 通信桥接
 * @description Qt WebChannel 桥接层，提供 PLC 数据读写和订阅功能
 * @module bridge/plc
 */

import { logger } from '@/utils/logger'
import { initWebChannel, isQtEnvironment } from './channel'
import type { ModbusSignal, SignalValuesMap } from '@/types/plc'

// Qt WebChannel 桥接类型定义
export interface PlcBridge {
  // ========== 原有接口 ==========
  readData(address: number, count: number): Promise<number[]>
  writeData(address: number, values: number[]): Promise<boolean>
  subscribe(addresses: number[], callback: (data: Record<number, number>) => void): void
  unsubscribe(): void
  isConnected: boolean
  connectionChanged: { connect: (callback: (connected: boolean) => void) => void }

  // ========== 新增信号配置接口 ==========
  /** 获取所有信号配置 */
  getSignals(): Promise<Partial<ModbusSignal>[]>
  /** 刷新信号配置 */
  refreshSignals(): void
  /** 根据信号编码读取值 */
  readBySignalCode(signalCode: string): Promise<number | boolean | string>
  /** 根据信号编码写入值 */
  writeBySignalCode(signalCode: string, value: number | boolean | string): Promise<boolean>
  /** 批量读取信号值 */
  batchRead(signalCodes: string[]): Promise<SignalValuesMap>

  // ========== 轮询控制 ==========
  /** 启动数据轮询 */
  startPolling(intervalMs?: number): void
  /** 停止数据轮询 */
  stopPolling(): void
  /** 轮询状态 */
  isPolling: boolean

  // ========== 初始化接口 ==========
  /** 前端登录成功后调用，传递 Token 并初始化设备配置 */
  initWithToken(token: string): void

  // ========== 信号 ==========
  signalValuesChanged: { connect: (callback: (values: SignalValuesMap) => void) => void }
  signalsConfigChanged: { connect: (callback: (count: number) => void) => void }
  pollingChanged: { connect: (callback: (polling: boolean) => void) => void }
}

// 全局 PlcBridge 实例
let plcBridge: PlcBridge | null = null

// 初始化 PlcBridge（使用共享的 WebChannel）
export async function initPlcBridge(): Promise<PlcBridge> {
  // 非 Qt 环境，使用模拟模式
  if (!isQtEnvironment()) {
    logger.warn('Qt WebChannel 环境不可用，使用模拟模式')
    plcBridge = createMockBridge()
    return plcBridge
  }

  // 获取共享的 WebChannel 实例
  const channel = await initWebChannel()
  if (!channel) {
    logger.warn('WebChannel 初始化失败，使用模拟模式')
    plcBridge = createMockBridge()
    return plcBridge
  }

  // 从 WebChannel 获取 plcBridge 对象
  plcBridge = channel.objects.plcBridge as PlcBridge

  // 调试：打印 plcBridge 对象的可用方法
  logger.info('PlcBridge 对象已获取', {
    exists: !!plcBridge,
    hasGetSignals: typeof plcBridge?.getSignals,
    methods: plcBridge ? Object.keys(plcBridge) : [],
    channelObjects: Object.keys(channel.objects || {})
  })

  return plcBridge
}

// 获取 PlcBridge 实例
export function getPlcBridge(): PlcBridge | null {
  return plcBridge
}

// 模拟桥接（开发环境）
function createMockBridge(): PlcBridge {
  let polling = false
  const mockSignals: Partial<ModbusSignal>[] = [
    { id: 1, signalCode: 'PRESSURE', signalName: '压力', dataType: 'float', unit: 'MPa', isActive: true },
    { id: 2, signalCode: 'TEMPERATURE', signalName: '温度', dataType: 'float', unit: '°C', isActive: true },
  ]

  return {
    isConnected: false,
    isPolling: polling,
    connectionChanged: {
      connect: (callback) => {
        setTimeout(() => callback(true), 1000)
      }
    },
    signalValuesChanged: { connect: () => {} },
    signalsConfigChanged: { connect: () => {} },
    pollingChanged: { connect: () => {} },
    readData: async () => [],
    writeData: async () => true,
    subscribe: () => {},
    unsubscribe: () => {},
    getSignals: async () => mockSignals,
    refreshSignals: () => {},
    readBySignalCode: async () => 0,
    writeBySignalCode: async () => true,
    batchRead: async () => ({}),
    startPolling: () => { polling = true },
    stopPolling: () => { polling = false },
    initWithToken: () => { logger.info('Mock: initWithToken called') },
  }
}
