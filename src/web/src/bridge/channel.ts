/**
 * @file Qt WebChannel 统一初始化模块
 * @description 确保只创建一个 QWebChannel 实例，所有桥接对象从同一实例获取
 * @module bridge/channel
 */

import { logger } from '@/utils/logger'

/** WebChannel 对象接口 */
interface WebChannelObjects {
  plcBridge?: unknown
  logBridge?: unknown
}

/** WebChannel 实例接口 */
interface QWebChannelInstance {
  objects: WebChannelObjects
}

/** 全局 WebChannel 实例 */
let channelInstance: QWebChannelInstance | null = null

/** 初始化状态 */
let initPromise: Promise<QWebChannelInstance | null> | null = null

/**
 * 初始化 Qt WebChannel（单例模式）
 * @returns WebChannel 实例，如果不在 Qt 环境中则返回 null
 */
export function initWebChannel(): Promise<QWebChannelInstance | null> {
  // 如果已经初始化过，直接返回
  if (initPromise) {
    return initPromise
  }

  initPromise = new Promise((resolve) => {
    // @ts-ignore - QWebChannel 和 qt.webChannelTransport 由 Qt 注入
    if (typeof QWebChannel === 'undefined' || typeof qt === 'undefined' || !qt.webChannelTransport) {
      logger.warn('Qt WebChannel 环境不可用')
      resolve(null)
      return
    }

    // @ts-ignore
    new QWebChannel(qt.webChannelTransport, (channel: QWebChannelInstance) => {
      channelInstance = channel
      logger.info('Qt WebChannel 初始化完成', {
        objects: Object.keys(channel.objects || {})
      })
      resolve(channel)
    })
  })

  return initPromise
}

/**
 * 获取 WebChannel 实例
 * @returns WebChannel 实例或 null
 */
export function getWebChannel(): QWebChannelInstance | null {
  return channelInstance
}

/**
 * 检查是否在 Qt 环境中
 * @returns 是否在 Qt 环境中
 */
export function isQtEnvironment(): boolean {
  // @ts-ignore
  return typeof QWebChannel !== 'undefined' && typeof qt !== 'undefined' && !!qt?.webChannelTransport
}
