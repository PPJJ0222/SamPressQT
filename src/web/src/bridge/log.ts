/**
 * @file 日志 WebChannel 桥接
 * @description Qt WebChannel 桥接层，提供日志写入到 C++ 端的功能
 * @module bridge/log
 */

import { initWebChannel, isQtEnvironment } from './channel'

/** LogBridge 接口定义 */
export interface LogBridge {
  /** 写入日志 */
  writeLog(level: string, message: string, data?: Record<string, unknown>): void
  /** 手动触发归档 */
  archiveLogs(): void
}

/** 全局 LogBridge 实例 */
let logBridge: LogBridge | null = null

/**
 * 检查对象是否为有效的 LogBridge
 * @param obj - 待检查的对象
 * @returns 是否为有效的 LogBridge
 */
function isValidLogBridge(obj: unknown): obj is LogBridge {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    typeof (obj as LogBridge).writeLog === 'function'
  )
}

/** 初始化 LogBridge（使用共享的 WebChannel） */
export async function initLogBridge(): Promise<LogBridge> {
  // 非 Qt 环境，使用模拟模式
  if (!isQtEnvironment()) {
    logBridge = createMockBridge()
    return logBridge
  }

  // 获取共享的 WebChannel 实例
  const channel = await initWebChannel()
  if (!channel) {
    logBridge = createMockBridge()
    return logBridge
  }

  // 从 WebChannel 获取 logBridge 对象
  const bridge = channel.objects.logBridge

  // 验证 logBridge 对象是否有效
  if (isValidLogBridge(bridge)) {
    logBridge = bridge as LogBridge
  } else {
    console.warn('[LogBridge] Qt WebChannel logBridge 对象无效，使用模拟模式')
    logBridge = createMockBridge()
  }

  return logBridge
}

/** 获取 LogBridge 实例 */
export function getLogBridge(): LogBridge | null {
  return logBridge
}

/** 模拟桥接（开发环境） */
function createMockBridge(): LogBridge {
  return {
    writeLog: (level, message, data) => {
      // 开发环境下输出到控制台
      const timestamp = new Date().toISOString()
      console.log(`[FILE LOG] ${timestamp} [${level.toUpperCase()}] ${message}`, data || '')
    },
    archiveLogs: () => {
      console.log('[FILE LOG] 归档日志')
    }
  }
}
