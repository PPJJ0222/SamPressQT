/**
 * @file 前端日志工具
 * @description 支持多级别日志、环境区分、UI Toast 通知、文件日志
 * @module utils/logger
 */

import { useToastStore, type ToastVariant } from '@/stores/useToastStore'
import { getLogBridge, type LogBridge } from '@/bridge/log'

/** 日志级别枚举 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4
}

/** 日志级别名称映射 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SUCCESS]: 'SUCCESS'
}

/** 日志级别到 Toast 类型映射（debug/info 不显示 Toast） */
const LEVEL_TO_TOAST: Record<LogLevel, ToastVariant | null> = {
  [LogLevel.DEBUG]: null,
  [LogLevel.INFO]: null,
  [LogLevel.WARN]: 'warning',
  [LogLevel.ERROR]: 'error',
  [LogLevel.SUCCESS]: 'success'
}

/** 日志配置接口 */
interface LoggerConfig {
  /** 最低输出级别 */
  level: LogLevel
  /** 是否输出到控制台 */
  enableConsole: boolean
  /** 是否显示 Toast 通知 */
  enableToast: boolean
  /** 是否写入文件日志 */
  enableFile: boolean
  /** 日志前缀 */
  prefix: string
}

/** 日志选项接口 */
interface LogOptions {
  /** 是否输出到控制台，覆盖全局配置 */
  console?: boolean
  /** 是否显示 Toast，覆盖全局配置 */
  toast?: boolean
  /** 是否写入文件，覆盖全局配置 */
  file?: boolean
  /** Toast 显示时长（毫秒） */
  duration?: number
  /** 附加数据（写入文件） */
  data?: Record<string, unknown>
}

/** 判断是否为开发环境 */
const isDev = import.meta.env?.DEV ?? true

/** 默认配置 */
const defaultConfig: LoggerConfig = {
  level: isDev ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  enableToast: true,
  enableFile: true,
  prefix: '[SamPress]'
}

/** Logger 类 */
class Logger {
  private config: LoggerConfig
  private toastStore: ReturnType<typeof useToastStore> | null = null
  private logBridge: LogBridge | null = null

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  /** 设置配置 */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /** 获取 Toast Store（延迟初始化） */
  private getToastStore(): ReturnType<typeof useToastStore> | null {
    if (!this.toastStore) {
      try {
        this.toastStore = useToastStore()
      } catch {
        // Pinia 未初始化时忽略
        return null
      }
    }
    return this.toastStore
  }

  /** 获取 LogBridge（延迟初始化） */
  private getLogBridge(): LogBridge | null {
    if (!this.logBridge) {
      this.logBridge = getLogBridge()
    }
    return this.logBridge
  }

  /** 格式化时间戳 */
  private formatTime(): string {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  /** 核心日志方法 */
  private log(
    level: LogLevel,
    message: string,
    args: unknown[],
    options?: LogOptions
  ): void {
    if (level < this.config.level) {
      return
    }

    const shouldConsole = options?.console ?? this.config.enableConsole
    const shouldToast = options?.toast ?? this.config.enableToast
    const shouldFile = options?.file ?? this.config.enableFile

    // 控制台输出
    if (shouldConsole) {
      this.logToConsole(level, message, args)
    }

    // Toast 通知（仅 warn/error/success 显示 Toast）
    const toastVariant = LEVEL_TO_TOAST[level]
    if (shouldToast && toastVariant) {
      this.logToToast(toastVariant, message, options?.duration)
    }

    // 文件日志（所有级别都写入文件）
    if (shouldFile) {
      this.logToFile(level, message, options?.data)
    }
  }

  /** 输出到控制台 */
  private logToConsole(level: LogLevel, message: string, args: unknown[]): void {
    const timestamp = this.formatTime()
    const levelName = LEVEL_NAMES[level]
    const prefix = `${this.config.prefix}[${timestamp}][${levelName}]`

    const consoleMethods: Record<LogLevel, 'log' | 'info' | 'warn' | 'error'> = {
      [LogLevel.DEBUG]: 'log',
      [LogLevel.INFO]: 'info',
      [LogLevel.WARN]: 'warn',
      [LogLevel.ERROR]: 'error',
      [LogLevel.SUCCESS]: 'info'
    }

    const method = consoleMethods[level]
    if (args.length > 0) {
      console[method](prefix, message, ...args)
    } else {
      console[method](prefix, message)
    }
  }

  /** 输出到 Toast */
  private logToToast(
    variant: ToastVariant,
    message: string,
    duration?: number
  ): void {
    const store = this.getToastStore()
    if (store) {
      store.add({ variant, message, duration })
    }
  }

  /** 输出到文件（通过 C++ LogBridge） */
  private logToFile(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const bridge = this.getLogBridge()
    if (bridge) {
      const levelName = LEVEL_NAMES[level].toLowerCase()
      bridge.writeLog(levelName, message, data || {})
    }
  }

  /** DEBUG 级别日志（仅控制台） */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, args, { toast: false })
  }

  /** INFO 级别日志 */
  info(message: string, options?: LogOptions): void
  info(message: string, ...args: unknown[]): void
  info(message: string, ...rest: unknown[]): void {
    const options = this.parseOptions(rest)
    this.log(LogLevel.INFO, message, options.args, options.opts)
  }

  /** WARN 级别日志 */
  warn(message: string, options?: LogOptions): void
  warn(message: string, ...args: unknown[]): void
  warn(message: string, ...rest: unknown[]): void {
    const options = this.parseOptions(rest)
    this.log(LogLevel.WARN, message, options.args, options.opts)
  }

  /** ERROR 级别日志 */
  error(message: string, options?: LogOptions): void
  error(message: string, ...args: unknown[]): void
  error(message: string, ...rest: unknown[]): void {
    const options = this.parseOptions(rest)
    this.log(LogLevel.ERROR, message, options.args, options.opts)
  }

  /** SUCCESS 级别日志 */
  success(message: string, options?: LogOptions): void
  success(message: string, ...args: unknown[]): void
  success(message: string, ...rest: unknown[]): void {
    const options = this.parseOptions(rest)
    this.log(LogLevel.SUCCESS, message, options.args, options.opts)
  }

  /** 解析参数，区分 LogOptions 和普通参数 */
  private parseOptions(rest: unknown[]): { args: unknown[]; opts?: LogOptions } {
    if (rest.length === 1 && this.isLogOptions(rest[0])) {
      return { args: [], opts: rest[0] as LogOptions }
    }
    return { args: rest }
  }

  /** 判断是否为 LogOptions */
  private isLogOptions(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false
    }
    const keys = Object.keys(obj)
    const validKeys = ['console', 'toast', 'file', 'duration', 'data']
    return keys.every(k => validKeys.includes(k))
  }
}

/** 默认导出单例 */
export const logger = new Logger()

/** 也导出类，允许创建独立实例 */
export { Logger }

/** 导出类型 */
export type { LogOptions, LoggerConfig }
