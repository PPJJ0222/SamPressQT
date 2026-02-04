/**
 * @file PLC 相关类型定义
 * @description 定义 PLC 通信相关的 TypeScript 接口
 * @module types/plc
 */

/**
 * PLC 处理器类型
 * - omron: 欧姆龙 - BCNet-CJ
 * - siemens: 西门子 - XCNet-PN
 * - mitsubishi: 三菱 - XCNet-MIT
 */
export type ProcessorType = 'omron' | 'siemens' | 'mitsubishi' | 'unknown'

/** 信号类型 */
export type SignalType = 'read' | 'write'

/** 数据类型 */
export type DataType = 'bit' | 'word' | 'uint16' | 'float' | 'double' | 'int32'

/** 信号配置接口 */
export interface ModbusSignal {
  id: number
  deviceId: number
  signalCode: string
  signalName: string
  signalType: SignalType
  registerType: string
  registerAddress: number
  dataType: DataType
  registerCount: number
  scaleFactor: number
  offsetValue: number
  unit: string
  plcAreaType: string
  paramGroup: string
  isActive: boolean
}

/** 信号值接口 */
export interface SignalValue {
  signalCode: string
  value: number | boolean | string
  timestamp: number
}

/** 信号值映射 */
export type SignalValuesMap = Record<string, number | boolean | string>

/** 设备配置接口 */
export interface ModbusDevice {
  deviceId: number
  deviceName: string
  ipAddress: string
  port: number
  slaveId: number
  timeout: number
  processorType: ProcessorType
  status: string
}

/** 数值显示格式 */
export type ValueDisplayFormat = 'decimal' | 'hex'

/** 信号调试表格行数据 */
export interface SignalDebugRow extends ModbusSignal {
  /** 当前信号值 */
  finalVal: number | boolean | string | null
  /** 是否正在读取 */
  loading: boolean
}
